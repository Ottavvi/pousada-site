/* =========================================
   DEPOIMENTOS
   Slider automático de depoimentos (pausa quando o visitante interage).
   ========================================= */

function initSlider() {
  const slider = document.getElementById('slider');
  const slides = document.querySelectorAll('.slide');
  if (!slider || !slides.length) {
    slider?.remove(); // seção só com a nota do Google, sem depoimentos
    return;
  }
  const dotsContainer = document.getElementById('sliderDots');
  let atual = 0;
  let timer;
  let pausado = false;

  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.addEventListener('click', () => irPara(i));
    dotsContainer.appendChild(dot);
  });
  const dots = dotsContainer.querySelectorAll('button');

  const rotular = () => dots.forEach((d, i) => d.setAttribute('aria-label', t('msg.dot', { n: i + 1 })));
  rotular();
  document.addEventListener('idioma', rotular);

  function irPara(index) {
    slides[atual].classList.remove('is-active');
    dots[atual].classList.remove('is-active');
    dots[atual].removeAttribute('aria-current');
    atual = (index + slides.length) % slides.length;
    slides[atual].classList.add('is-active');
    dots[atual].classList.add('is-active');
    dots[atual].setAttribute('aria-current', 'true');
    reiniciarAuto();
  }

  function reiniciarAuto() {
    clearInterval(timer);
    if (REDUZ_MOVIMENTO || pausado || document.hidden) return;
    timer = setInterval(() => irPara(atual + 1), 6000);
  }

  // Pausa enquanto o visitante lê (mouse ou foco) e quando a aba está oculta
  const pausar = valor => {
    pausado = valor;
    reiniciarAuto();
  };
  slider.addEventListener('mouseenter', () => pausar(true));
  slider.addEventListener('mouseleave', () => pausar(false));
  slider.addEventListener('focusin', () => pausar(true));
  slider.addEventListener('focusout', () => pausar(false));
  document.addEventListener('visibilitychange', reiniciarAuto);

  document.getElementById('prevSlide').addEventListener('click', () => irPara(atual - 1));
  document.getElementById('nextSlide').addEventListener('click', () => irPara(atual + 1));

  irPara(0);
}
