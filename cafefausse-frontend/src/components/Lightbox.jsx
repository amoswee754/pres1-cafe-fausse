import { useEffect, useRef } from "react";

export default function Lightbox({ image, onClose }) {
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previous = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKey(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
      }
      if (event.key === "Tab") {
        event.preventDefault();
        closeRef.current?.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      if (previous instanceof HTMLElement) {
        previous.focus();
      }
    };
  }, [image.src]);

  return (
    <div className="lightbox" onClick={onClose}>
      <div
        className="lightbox-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={image.caption}
      >
        <button ref={closeRef} className="button button-quiet" type="button" onClick={onClose}>
          Close
        </button>
        <img src={image.src} alt={image.caption} />
        <p>{image.caption}</p>
      </div>
    </div>
  );
}
