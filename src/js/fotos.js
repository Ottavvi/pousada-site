/* =========================================
   FOTOS
   Carrossel de fotos dos quartos e galeria com lightbox.
   ========================================= */

/* ---------- Carrossel de fotos dos quartos ---------- */
function initCarrosseis() {
  document.querySelectorAll('[data-carousel]').forEach(carrossel => {
    const track = carrossel.querySelector('.room-carousel__track');
    const fotos = track.querySelectorAll('img');
    if (fotos.length < 2) return;

    const criarBotao = (classe, texto) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `room-carousel__btn ${classe}`;
      btn.textContent = texto;
      carrossel.appendChild(btn);
      return btn;
    };
    const prev = criarBotao('room-carousel__btn--prev', '‹');
    const next = criarBotao('room-carousel__btn--next', '›');

    const dotsBox = document.createElement('div');
    dotsBox.className = 'room-carousel__dots';
    const dots = [...fotos].map((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.addEventListener('click', () => irPara(i));
      dotsBox.appendChild(dot);
      return dot;
    });
    carrossel.appendChild(dotsBox);

    let atual = 0;
    const irPara = i => {
      atual = (i + fotos.length) % fotos.length;
      track.scrollTo({ left: atual * track.clientWidth, behavior: REDUZ_MOVIMENTO ? 'auto' : 'smooth' });
    };
    prev.addEventListener('click', () => irPara(atual - 1));
    next.addEventListener('click', () => irPara(atual + 1));

    // Atualiza as bolinhas também quando o visitante desliza com o dedo
    const marcar = () => {
      atual = Math.round(track.scrollLeft / track.clientWidth);
      dots.forEach((d, i) => d.setAttribute('aria-current', i === atual));
    };
    let agendado = false;
    track.addEventListener(
      'scroll',
      () => {
        if (agendado) return;
        agendado = true;
        requestAnimationFrame(() => {
          marcar();
          agendado = false;
        });
      },
      { passive: true }
    );

    const rotular = () => {
      prev.setAttribute('aria-label', t('msg.carouselPrev'));
      next.setAttribute('aria-label', t('msg.carouselNext'));
      dots.forEach((d, i) => d.setAttribute('aria-label', t('msg.photo', { n: i + 1, total: fotos.length })));
    };
    rotular();
    marcar();
    document.addEventListener('idioma', rotular);
  });
}

/* ---------- Galeria com lightbox ---------- */
function initGallery() {
  const lightbox = document.getElementById('lightbox');
  const content = document.getElementById('lightboxContent');
  const close = document.getElementById('lightboxClose');
  const prev = document.getElementById('lightboxPrev');
  const next = document.getElementById('lightboxNext');
  const itens = [...document.querySelectorAll('.gallery__item')];
  const focaveis = [close, prev, next];
  let atual = 0;
  let focoAnterior = null;

  // Deixa as fotos acessíveis pelo teclado
  itens.forEach((item, i) => {
    item.tabIndex = 0;
    item.setAttribute('role', 'button');
    item.addEventListener('click', () => abrir(i));
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        abrir(i);
      }
    });
  });

  const rotular = () => itens.forEach(item => item.setAttribute('aria-label', t('msg.zoom', { alt: item.alt })));
  rotular();
  document.addEventListener('idioma', rotular);

  function mostrar(index) {
    atual = (index + itens.length) % itens.length;
    const item = itens[atual];
    const img = document.createElement('img');
    img.srcset = item.srcset; // o navegador escolhe a versão grande
    img.sizes = '90vw';
    img.src = item.src;
    img.alt = item.alt;
    const legenda = document.createElement('p');
    legenda.textContent = `${item.alt} (${atual + 1}/${itens.length})`;
    content.replaceChildren(img, legenda);
  }

  function abrir(index) {
    focoAnterior = document.activeElement;
    mostrar(index);
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    close.focus();
  }

  function fechar() {
    if (!lightbox.classList.contains('is-open')) return;
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    if (focoAnterior) focoAnterior.focus();
  }

  close.addEventListener('click', fechar);
  prev.addEventListener('click', () => mostrar(atual - 1));
  next.addEventListener('click', () => mostrar(atual + 1));
  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) fechar();
  });

  // Deslizar o dedo para os lados troca a foto
  let toqueX = null;
  lightbox.addEventListener(
    'touchstart',
    e => {
      toqueX = e.touches[0].clientX;
    },
    { passive: true }
  );
  lightbox.addEventListener('touchend', e => {
    if (toqueX === null) return;
    const distancia = e.changedTouches[0].clientX - toqueX;
    if (Math.abs(distancia) > 50) mostrar(atual + (distancia < 0 ? 1 : -1));
    toqueX = null;
  });

  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') fechar();
    if (e.key === 'ArrowLeft') mostrar(atual - 1);
    if (e.key === 'ArrowRight') mostrar(atual + 1);

    // Mantém o foco dentro da lightbox
    if (e.key === 'Tab') {
      e.preventDefault();
      const pos = focaveis.indexOf(document.activeElement);
      const passo = e.shiftKey ? -1 : 1;
      focaveis[(pos + passo + focaveis.length) % focaveis.length].focus();
    }
  });
}
