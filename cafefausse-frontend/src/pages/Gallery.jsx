import { useCallback, useState } from "react";
import Lightbox from "../components/Lightbox";
import { AWARDS, GALLERY, REVIEWS } from "../content";

export default function Gallery() {
  const [active, setActive] = useState(null);
  const close = useCallback(() => setActive(null), []);

  return (
    <div className="wrap">
      <header className="page-intro">
        <h1>Gallery</h1>
        <p>The dining room, the cooking, and an evening at Café Fausse.</p>
      </header>
      <ul className="gallery-grid">
        {GALLERY.map((image) => (
          <li key={image.src}>
            <button type="button" className="gallery-card" onClick={() => setActive(image)}>
              <img src={image.src} alt={image.caption} />
              <span>{image.caption}</span>
            </button>
          </li>
        ))}
      </ul>
      <section id="awards">
        <h2>Awards</h2>
        <ul className="award-list">
          {AWARDS.map((award) => (
            <li key={award}>{award}</li>
          ))}
        </ul>
      </section>
      <section id="reviews">
        <h2>Reviews</h2>
        <ul className="review-list">
          {REVIEWS.map((review) => (
            <li key={review}>{review}</li>
          ))}
        </ul>
      </section>
      {active ? <Lightbox image={active} onClose={close} /> : null}
    </div>
  );
}
