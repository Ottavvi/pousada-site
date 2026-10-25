/* =========================================
   NAVEGAÇÃO
   Redes sociais, cabeçalho, menu, link ativo, voltar ao topo e barra de reserva no celular.
   ========================================= */

/* ---------- Links das redes sociais usam os dados configurados ---------- */
function initRedesSociais() {
  const links = {
    whatsapp: `https://wa.me/${WHATSAPP}`,
    instagram: INSTAGRAM,
    facebook: FACEBOOK
  };
  document.querySelectorAll('[data-social]').forEach(link => {
    // Rede sem endereço cadastrado: esconde o botão em vez de levar a um link errado
    if (!links[link.dataset.social]) return link.remove();
    link.href = links[link.dataset.social];
    link.addEventListener('click', () => registrarEvento(`clique_${link.dataset.social}`));
  });
}

/* ---------- Header muda de cor ao rolar ---------- */
function initHeader() {
  const header = document.getElementById('header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 50);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ---------- Menu mobile ---------- */
function initMenuMobile() {
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('nav');

  const definir = open => {
    nav.classList.toggle('is-open', open);
    toggle.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? t('msg.menuClose') : t('msg.menuOpen'));
  };

  toggle.addEventListener('click', () => definir(!nav.classList.contains('is-open')));
  document.addEventListener('idioma', () => definir(nav.classList.contains('is-open')));

  // Fecha o menu ao clicar em um link, fora dele ou com Esc
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => definir(false)));
  document.addEventListener('click', e => {
    if (nav.classList.contains('is-open') && !nav.contains(e.target) && !toggle.contains(e.target)) {
      definir(false);
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      definir(false);
      toggle.focus();
    }
  });
}

/* ---------- Destaca o link da seção visível ---------- */
function initActiveLink() {
  const links = document.querySelectorAll('.nav__link');
  const sections = document.querySelectorAll('main section[id]');

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === `#${entry.target.id}`));
      });
    },
    { rootMargin: '-50% 0px -50% 0px' }
  );

  sections.forEach(s => observer.observe(s));
}

/* ---------- Botão voltar ao topo ---------- */
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  window.addEventListener('scroll', () => btn.classList.toggle('is-visible', window.scrollY > 600), { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: REDUZ_MOVIMENTO ? 'auto' : 'smooth' }));
}

/* ---------- Barra de reserva fixa no celular ---------- */
function initMobileBar() {
  const barra = document.getElementById('mobileBar');
  const reserva = document.getElementById('reserva');

  // Aparece depois do topo da página, mas some quando o formulário de reserva está na tela
  let reservaVisivel = true;
  const atualizar = () => {
    const mostrar = window.scrollY > 600 && !reservaVisivel;
    barra.classList.toggle('is-visible', mostrar);
    document.body.classList.toggle('has-mobile-bar', mostrar);
  };

  new IntersectionObserver(([entry]) => {
    reservaVisivel = entry.isIntersecting;
    atualizar();
  }).observe(reserva);
  window.addEventListener('scroll', atualizar, { passive: true });
}
