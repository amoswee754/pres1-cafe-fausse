import { Link } from "react-router-dom";
import NewsletterForm from "../components/NewsletterForm";
import { AWARDS, CONTACT } from "../content";

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Washington, DC</p>
          <h1>Café Fausse</h1>
          <p>Traditional Italian flavors with modern culinary innovation.</p>
          <Link className="button" to="/reservations">
            Reserve a table
          </Link>
        </div>
      </section>
      <div className="wrap home-sections">
        <section>
          <h2>The restaurant</h2>
          <p>
            Founded in 2010 by Chef Antonio Rossi and restaurateur Maria Lopez, Café Fausse blends
            traditional Italian flavors with modern culinary innovation.
          </p>
        </section>
        <section className="contact-panel">
          <h2>Visit</h2>
          <p>{CONTACT.address}</p>
          <p>
            <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>
          </p>
          <p>{CONTACT.hours}</p>
        </section>
        <section>
          <h2>Awards</h2>
          <ul className="award-list">
            {AWARDS.map((award) => (
              <li key={award}>
                <Link to="/gallery#awards">{award}</Link>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2>Newsletter</h2>
          <p>Leave your email for news from Café Fausse.</p>
          <NewsletterForm />
        </section>
      </div>
    </>
  );
}
