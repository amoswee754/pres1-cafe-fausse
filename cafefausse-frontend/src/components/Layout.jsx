import { useState } from "react";
import { NavLink } from "react-router-dom";
import { CONTACT } from "../content";

const LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/menu", label: "Menu" },
  { to: "/reservations", label: "Reservations" },
  { to: "/about", label: "About Us" },
  { to: "/gallery", label: "Gallery" },
];

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);

  function close() {
    setOpen(false);
  }

  return (
    <div className="site">
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <header className="site-header">
        <NavLink to="/" className="brand" end onClick={close}>
          Café Fausse
        </NavLink>
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((value) => !value)}
        >
          Menu
        </button>
        <nav id="site-nav" className={open ? "nav-links is-open" : "nav-links"}>
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} onClick={close}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main id="content">{children}</main>
      <footer className="site-footer">
        <p className="brand">Café Fausse</p>
        <p>{CONTACT.address}</p>
        <p>
          <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>
        </p>
        <p>{CONTACT.hours}</p>
      </footer>
    </div>
  );
}
