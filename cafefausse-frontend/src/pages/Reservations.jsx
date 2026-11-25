import { useEffect, useMemo, useState } from "react";
import { getAvailability, postJson } from "../api";
import { CONTACT } from "../content";
import { isEmail, timeChoices, todayInEastern } from "../hours";

export default function Reservations() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [guestCount, setGuestCount] = useState("2");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(false);
  const [sending, setSending] = useState(false);
  const [availability, setAvailability] = useState("");
  const [availabilityRevision, setAvailabilityRevision] = useState(0);

  const choices = useMemo(() => timeChoices(date), [date]);

  useEffect(() => {
    setTime((current) => (choices.some((choice) => choice.value === current) ? current : ""));
  }, [choices]);

  useEffect(() => {
    if (!date || !time) {
      setAvailability("");
      return undefined;
    }
    let cancelled = false;
    setAvailability("Checking tables…");
    getAvailability(`${date}T${time}`).then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setAvailability(result.data.error || "That time is not available.");
        return;
      }
      if (result.data.remaining === 0) {
        setAvailability("That time slot is fully booked. Please pick another time.");
        return;
      }
      const tables = result.data.remaining === 1 ? "table" : "tables";
      setAvailability(`${result.data.remaining} ${tables} left at this time.`);
    });
    return () => {
      cancelled = true;
    };
  }, [date, time, availabilityRevision]);

  async function onSubmit(event) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const guests = Number(guestCount);
    if (!trimmedName) {
      setOk(false);
      setMessage("Enter the name for the reservation.");
      return;
    }
    if (!isEmail(trimmedEmail)) {
      setOk(false);
      setMessage("Enter a valid email address.");
      return;
    }
    if (!Number.isInteger(guests) || guests < 1 || guests > 8) {
      setOk(false);
      setMessage("Guest count must be a whole number from 1 to 8.");
      return;
    }
    if (!date || !time || !choices.some((choice) => choice.value === time)) {
      setOk(false);
      setMessage("Choose a date and time during opening hours.");
      return;
    }

    setSending(true);
    try {
      const result = await postJson("/api/reservations", {
        time_slot: `${date}T${time}`,
        guest_count: guests,
        customer_name: trimmedName,
        email: trimmedEmail,
        phone_number: phone.trim(),
      });
      setOk(result.ok);
      if (result.ok) {
        setAvailabilityRevision((value) => value + 1);
      }
      setMessage(
        result.ok
          ? result.data.message
          : result.data.error || "The reservation could not be saved. Please try again.",
      );
    } catch {
      setOk(false);
      setMessage("The reservation could not be saved. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="wrap narrow">
      <header className="page-intro">
        <h1>Reservations</h1>
        <p>
          One table per reservation, for 1 to 8 guests. {CONTACT.hours}. Seating starts every 30
          minutes and the last seating is 10:30 PM Monday through Saturday, or 8:30 PM on Sunday.
        </p>
      </header>
      <form className="form" onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="reservation-date">Date</label>
          <input
            id="reservation-date"
            type="date"
            value={date}
            min={todayInEastern()}
            onChange={(event) => setDate(event.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="reservation-time">Time</label>
          <select
            id="reservation-time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            disabled={!date}
            required
          >
            <option value="">{date ? "Choose a time" : "Choose a date first"}</option>
            {choices.map((choice) => (
              <option key={choice.value} value={choice.value}>
                {choice.label}
              </option>
            ))}
          </select>
        </div>
        {availability ? <p className="form-note">{availability}</p> : null}
        {!date || choices.length > 0 ? null : (
          <p className="form-note">No times left on that date. Choose another date.</p>
        )}
        <div className="field">
          <label htmlFor="reservation-guests">Number of guests</label>
          <input
            id="reservation-guests"
            type="number"
            min="1"
            max="8"
            step="1"
            inputMode="numeric"
            value={guestCount}
            onChange={(event) => setGuestCount(event.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="reservation-name">Customer name</label>
          <input
            id="reservation-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="reservation-email">Email address</label>
          <input
            id="reservation-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="reservation-phone">Phone number (optional)</label>
          <input
            id="reservation-phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </div>
        <button className="button" type="submit" disabled={sending}>
          {sending ? "Saving…" : "Request table"}
        </button>
        {message ? (
          <p className={ok ? "form-note success" : "form-note error"} role="alert">
            {message}
          </p>
        ) : null}
      </form>
    </div>
  );
}
