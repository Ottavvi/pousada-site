/* =========================================
   ANIMAÇÕES
   Entrada suave das seções ao rolar a página.
   ========================================= */

/* ---------- Animação de entrada das seções ---------- */
function initReveal() {
  if (REDUZ_MOVIMENTO) return;

  const elementos = document.querySelectorAll(
    '.section__header, .room-card, .amenity, .about__text, .about__image, .gallery__item, .contact__form, .location__col, .faq__item, .package'
  );
  elementos.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  elementos.forEach(el => observer.observe(el));
}
