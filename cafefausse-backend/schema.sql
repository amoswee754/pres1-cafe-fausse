-- Café Fausse tables. Apply to the cafefausse schema only.

CREATE SCHEMA IF NOT EXISTS cafefausse;

CREATE TABLE IF NOT EXISTS cafefausse.customers (
    customer_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_name text,
    email text NOT NULL,
    phone_number text,
    newsletter_signup boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT customers_email_key UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS cafefausse.reservations (
    reservation_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id integer NOT NULL REFERENCES cafefausse.customers (customer_id),
    time_slot timestamptz NOT NULL,
    table_number integer NOT NULL,
    guest_count integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT reservations_table_number_check CHECK (table_number BETWEEN 1 AND 30),
    CONSTRAINT reservations_guest_count_check CHECK (guest_count BETWEEN 1 AND 8),
    CONSTRAINT reservations_time_slot_table_key UNIQUE (time_slot, table_number),
    CONSTRAINT reservations_customer_time_key UNIQUE (customer_id, time_slot)
);
