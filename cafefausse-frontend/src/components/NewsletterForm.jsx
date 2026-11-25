import { useState } from "react";
import { postJson } from "../api";
import { isEmail } from "../hours";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(false);
  const [sending, setSending] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!isEmail(trimmed)) {
      setOk(false);
      setMessage("Enter a valid email address.");
      return;
    }
    setSending(true);
    try {
      const result = await postJson("/api/newsletter", { email: trimmed });
      setOk(result.ok);
      setMessage(result.ok ? result.data.message : result.data.error || "The signup could not be saved. Please try again.");
      if (result.ok) {
        setEmail("");
      }
    } catch {
      setOk(false);
      setMessage("The signup could not be saved. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="form newsletter-form" onSubmit={onSubmit} noValidate>
      <div className="field">
        <label htmlFor="newsletter-email">Email address</label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <button className="button" type="submit" disabled={sending}>
        {sending ? "Saving…" : "Join the list"}
      </button>
      {message ? (
        <p className={ok ? "form-note success" : "form-note error"} role="alert">
          {message}
        </p>
      ) : null}
    </form>
  );
}
