import { HISTORY } from "../content";

export default function About() {
  return (
    <div className="wrap about-layout">
      <header className="page-intro">
        <h1>About Us</h1>
      </header>
      <img
        className="about-photo"
        src="/images/gallery-cafe-interior.webp"
        alt="The Café Fausse dining room, set for dinner"
      />
      <section>
        <h2>Our story</h2>
        <p>{HISTORY}</p>
      </section>
      <section className="founder-grid">
        <article>
          <h2>Chef Antonio Rossi</h2>
          <p>
            Chef Antonio Rossi is a founder of Café Fausse. With Maria Lopez, he opened the
            restaurant in 2010. His cooking blends traditional Italian flavors with modern culinary
            innovation.
          </p>
        </article>
        <article>
          <h2>Maria Lopez</h2>
          <p>
            Maria Lopez is a founder and restaurateur of Café Fausse. With Chef Antonio Rossi, she
            opened the restaurant in 2010. She shares the mission of an unforgettable dining
            experience that reflects both quality and creativity.
          </p>
        </article>
      </section>
      <section>
        <h2>The table</h2>
        <p>
          Café Fausse is committed to unforgettable dining, excellent food, and locally sourced
          ingredients.
        </p>
      </section>
    </div>
  );
}
