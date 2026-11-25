"""Café Fausse API: reservations and newsletter signup."""

import os
import random
import re
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import psycopg
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from psycopg import sql
from psycopg.errors import UniqueViolation
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
load_dotenv(HERE / ".env.local")
load_dotenv(ROOT / ".env.local")

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is missing. Add it to cafefausse-backend/.env.local.")

SCHEMA = os.environ.get("DATABASE_SCHEMA", "cafefausse")
if re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", SCHEMA) is None:
    raise RuntimeError("DATABASE_SCHEMA must be a plain schema name.")

CUSTOMERS = sql.Identifier(SCHEMA, "customers")
RESERVATIONS = sql.Identifier(SCHEMA, "reservations")

EASTERN = ZoneInfo("America/New_York")
TABLE_COUNT = 30
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_RE = re.compile(r"^[0-9+().\-\s]{7,30}$")

def cors_origins():
    origins = [
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        re.compile(r"^https://cafe-fausse(?:-[a-z0-9-]+)?\.vercel\.app$"),
    ]
    for origin in os.environ.get("CORS_ORIGINS", "").split(","):
        origin = origin.strip().rstrip("/")
        if origin and origin not in origins:
            origins.append(origin)
    return origins


app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": cors_origins()}})

_pool = None


def get_pool():
    global _pool
    if _pool is None:
        _pool = ConnectionPool(
            conninfo=DATABASE_URL,
            min_size=0,
            max_size=5,
            timeout=10,
            max_idle=30,
            max_lifetime=300,
            check=ConnectionPool.check_connection,
            kwargs={
                "row_factory": dict_row,
                "prepare_threshold": None,
                "keepalives": 1,
                "keepalives_idle": 30,
                "keepalives_interval": 10,
                "keepalives_count": 3,
            },
            open=True,
        )
    return _pool


class SlotFull(Exception):
    pass


class AlreadyBooked(Exception):
    pass


def error(message, status):
    return jsonify(error=message), status


def call_with_retry(operation):
    """Run a database operation again when Neon has closed an idle connection."""
    last_error = None
    for _ in range(2):
        try:
            return operation()
        except psycopg.OperationalError as exc:
            last_error = exc
            try:
                get_pool().check()
            except psycopg.Error:
                pass
    raise last_error


def normalize_email(value):
    if not isinstance(value, str):
        return None
    email = value.strip().lower()
    if not email or len(email) > 254 or EMAIL_RE.fullmatch(email) is None:
        return None
    return email


def normalize_name(value):
    if not isinstance(value, str):
        return None
    name = " ".join(value.split())
    if not name or len(name) > 120:
        return None
    return name


def normalize_phone(value):
    if value is None:
        return None
    if not isinstance(value, str):
        return False
    phone = value.strip()
    if not phone:
        return None
    if PHONE_RE.fullmatch(phone) is None:
        return False
    return phone


def parse_guest_count(value):
    if isinstance(value, bool) or value is None or isinstance(value, float):
        return None
    if isinstance(value, str):
        text = value.strip()
        if not text.isdigit():
            return None
        value = int(text)
    if not isinstance(value, int) or value < 1 or value > 8:
        return None
    return value


def parse_time_slot(value):
    """Return an Eastern Time slot, or an error message when it is not bookable."""
    if not isinstance(value, str) or not value.strip():
        return None, "Choose a date and time during opening hours."
    raw = value.strip()
    try:
        if len(raw) == 16:
            parsed = datetime.strptime(raw, "%Y-%m-%dT%H:%M")
            slot = parsed.replace(tzinfo=EASTERN)
        else:
            parsed = datetime.fromisoformat(raw)
            slot = parsed.replace(tzinfo=EASTERN) if parsed.tzinfo is None else parsed.astimezone(EASTERN)
    except ValueError:
        return None, "Choose a date and time during opening hours."

    if slot.second or slot.microsecond or slot.minute not in (0, 30):
        return None, "Choose a time on a 30-minute mark, such as 5:00 PM or 5:30 PM."

    minutes = slot.hour * 60 + slot.minute
    latest = 20 * 60 + 30 if slot.weekday() == 6 else 22 * 60 + 30
    if minutes < 17 * 60 or minutes > latest:
        return (
            None,
            "That time is outside Café Fausse hours. Please pick a time from 5:00 PM to 10:30 PM Monday through Saturday, or 5:00 PM to 8:30 PM on Sunday.",
        )
    if slot < datetime.now(EASTERN):
        return None, "That time has already passed. Please pick another time."
    return slot, None


def format_slot(slot):
    local = slot.astimezone(EASTERN)
    hour = local.hour % 12 or 12
    suffix = "AM" if local.hour < 12 else "PM"
    return (
        f"{local.strftime('%A')}, {local.strftime('%B')} {local.day}, {local.year} "
        f"at {hour}:{local.minute:02d} {suffix} Eastern Time"
    )


def statement(query):
    return sql.SQL(query).format(customers=CUSTOMERS, reservations=RESERVATIONS)


def book_once(slot, guest_count, name, email, phone):
    with get_pool().connection() as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                cur.execute(
                    statement(
                        """
                        INSERT INTO {customers}
                            (customer_name, email, phone_number, newsletter_signup)
                        VALUES (%s, %s, %s, false)
                        ON CONFLICT (email) DO UPDATE
                        SET customer_name = EXCLUDED.customer_name,
                            phone_number = COALESCE(
                                EXCLUDED.phone_number,
                                {customers}.phone_number
                            )
                        RETURNING customer_id
                        """
                    ),
                    (name, email, phone),
                )
                customer_id = cur.fetchone()["customer_id"]

                cur.execute(
                    statement(
                        """
                        SELECT table_number
                        FROM {reservations}
                        WHERE time_slot = %s
                        FOR UPDATE
                        """
                    ),
                    (slot,),
                )
                taken = {row["table_number"] for row in cur.fetchall()}
                if len(taken) >= TABLE_COUNT:
                    raise SlotFull()

                cur.execute(
                    statement(
                        """
                        SELECT reservation_id
                        FROM {reservations}
                        WHERE customer_id = %s AND time_slot = %s
                        """
                    ),
                    (customer_id, slot),
                )
                if cur.fetchone():
                    raise AlreadyBooked()

                free = [number for number in range(1, TABLE_COUNT + 1) if number not in taken]
                table_number = random.choice(free)
                cur.execute(
                    statement(
                        """
                        INSERT INTO {reservations}
                            (customer_id, time_slot, table_number, guest_count)
                        VALUES (%s, %s, %s, %s)
                        RETURNING reservation_id
                        """
                    ),
                    (customer_id, slot, table_number, guest_count),
                )
                reservation_id = cur.fetchone()["reservation_id"]
                return {
                    "reservation_id": reservation_id,
                    "table_number": table_number,
                    "time_slot": slot.isoformat(),
                    "message": (
                        f"{name}, your reservation is confirmed for {format_slot(slot)}. "
                        f"Table {table_number}."
                    ),
                }


def book(slot, guest_count, name, email, phone):
    connection_errors = 0
    for _ in range(8):
        try:
            return book_once(slot, guest_count, name, email, phone)
        except UniqueViolation as exc:
            constraint = exc.diag.constraint_name if exc.diag else ""
            if constraint == "reservations_customer_time_key":
                raise AlreadyBooked() from exc
            if constraint == "reservations_time_slot_table_key":
                continue
            raise
        except psycopg.OperationalError:
            connection_errors += 1
            if connection_errors >= 2:
                raise
            continue
    raise SlotFull()


@app.get("/api/health")
def health():
    return jsonify(ok=True)


@app.get("/api/availability")
def availability():
    slot, problem = parse_time_slot(request.args.get("time_slot", ""))
    if problem:
        return error(problem, 400)
    with get_pool().connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                statement(
                    """
                    SELECT COUNT(*) AS booked
                    FROM {reservations}
                    WHERE time_slot = %s
                    """
                ),
                (slot,),
            )
            booked = cur.fetchone()["booked"]
    return jsonify(booked=booked, remaining=max(0, TABLE_COUNT - booked))


@app.post("/api/reservations")
def create_reservation():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return error("Send reservation details as JSON.", 400)

    name = normalize_name(payload.get("customer_name"))
    if not name:
        return error("Enter the name for the reservation.", 400)

    email = normalize_email(payload.get("email"))
    if not email:
        return error("Enter a valid email address.", 400)

    phone = normalize_phone(payload.get("phone_number"))
    if phone is False:
        return error("Enter a valid phone number, or leave it blank.", 400)

    guest_count = parse_guest_count(payload.get("guest_count"))
    if guest_count is None:
        return error("Guest count must be a whole number from 1 to 8.", 400)

    slot, problem = parse_time_slot(payload.get("time_slot"))
    if problem:
        return error(problem, 400)

    try:
        saved = book(slot, guest_count, name, email, phone)
    except SlotFull:
        return error("That time slot is fully booked. Please pick another time.", 409)
    except AlreadyBooked:
        return error(
            "You already have a reservation at that time. Please pick another time.",
            409,
        )
    except psycopg.Error:
        app.logger.exception("reservation insert failed")
        return error("The reservation could not be saved. Please try again.", 500)

    return jsonify(saved), 201


@app.post("/api/newsletter")
def newsletter():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return error("Send an email address as JSON.", 400)
    email = normalize_email(payload.get("email"))
    if not email:
        return error("Enter a valid email address.", 400)

    def save_signup():
        with get_pool().connection() as conn:
            with conn.transaction():
                with conn.cursor() as cur:
                    cur.execute(
                        statement(
                            """
                            INSERT INTO {customers} (email, newsletter_signup)
                            VALUES (%s, true)
                            ON CONFLICT (email) DO UPDATE
                            SET newsletter_signup = true
                            RETURNING customer_id, newsletter_signup
                            """
                        ),
                        (email,),
                    )
                    return cur.fetchone()

    try:
        row = call_with_retry(save_signup)
    except psycopg.Error:
        app.logger.exception("newsletter insert failed")
        return error("The signup could not be saved. Please try again.", 500)

    return jsonify(
        customer_id=row["customer_id"],
        newsletter_signup=bool(row["newsletter_signup"]),
        message=f"{email} is on the list.",
    )


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
