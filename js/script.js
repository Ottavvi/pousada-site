/* =========================================
   POUSADA LAGOA AZUL - SCRIPT PRINCIPAL
   ========================================= */

/* ---------- Configuração (preencha com os dados reais) ---------- */

// WhatsApp: DDI + DDD + número, só dígitos (ex.: 5581999998888)
const WHATSAPP = '5500900000000';

// Perfis da pousada nas redes sociais (endereço completo)
const INSTAGRAM = 'https://www.instagram.com/';
const FACEBOOK = 'https://www.facebook.com/';

// Formulário de contato: crie um formulário grátis em https://formspree.io
// e cole aqui o código dele (ex.: 'xyzabcde'). Enquanto estiver vazio,
// o formulário abre o programa de e-mail do visitante com a mensagem pronta.
const FORMSPREE_ID = '';
const EMAIL_CONTATO = 'contato@lagoaazul.com.br';

// Respeita a preferência do sistema por menos animação
const REDUZ_MOVIMENTO = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('DOMContentLoaded', () => {
  initRedesSociais();
  initHeader();
  initMenuMobile();
  initActiveLink();
  initBooking();
  initCounters();
  initGallery();
  initSlider();
  initContactForm();
  initBackToTop();
  initReveal();
  document.getElementById('year').textContent = new Date().getFullYear();
});

/* ---------- Links das redes sociais usam os dados configurados ---------- */
function initRedesSociais() {
  const links = {
    whatsapp: `https://wa.me/${WHATSAPP}`,
    instagram: INSTAGRAM,
    facebook: FACEBOOK
  };
  document.querySelectorAll('[data-social]').forEach(link => {
    link.href = links[link.dataset.social];
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
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  };

  toggle.addEventListener('click', () => definir(!nav.classList.contains('is-open')));

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

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(l =>
        l.classList.toggle('is-active', l.getAttribute('href') === `#${entry.target.id}`)
      );
    });
  }, { rootMargin: '-50% 0px -50% 0px' });

  sections.forEach(s => observer.observe(s));
}

/* ---------- Formulário de reserva ---------- */
const PRECOS = { standard: 250, luxo: 380, suite: 560 };
const NOMES = { standard: 'Standard', luxo: 'Luxo', suite: 'Suíte Master' };
const CAPACIDADE = { standard: 2, luxo: 3, suite: 4 };

function initBooking() {
  const form = document.getElementById('bookingForm');
  const checkin = document.getElementById('checkin');
  const checkout = document.getElementById('checkout');
  const hospedes = document.getElementById('hospedes');
  const tipo = document.getElementById('tipoQuarto');
  const result = document.getElementById('bookingResult');

  // Datas mínimas: hoje / dia seguinte ao check-in (no fuso local, não em UTC)
  const hoje = dataLocalISO(new Date());
  checkin.min = hoje;
  checkout.min = somarDias(hoje, 1);
  checkin.addEventListener('change', () => {
    if (!checkin.value) return;
    checkout.min = somarDias(checkin.value, 1);
    if (checkout.value && checkout.value <= checkin.value) checkout.value = '';
  });

  // Botões "Reservar" dos cards preenchem o tipo de quarto e focam a data
  document.querySelectorAll('[data-room]').forEach(btn =>
    btn.addEventListener('click', () => {
      tipo.value = btn.dataset.room;
      checkin.focus({ preventScroll: true });
    })
  );

  form.addEventListener('submit', e => {
    e.preventDefault();

    if (!checkin.value || !checkout.value) {
      return showResult('Selecione as datas de check-in e check-out.', true);
    }

    if (checkin.value < hoje) {
      return showResult('A data de check-in não pode estar no passado.', true);
    }

    const noites = Math.round((new Date(checkout.value) - new Date(checkin.value)) / 86400000);
    if (noites <= 0) {
      return showResult('O check-out deve ser depois do check-in.', true);
    }

    const qtd = +hospedes.value;
    if (qtd > CAPACIDADE[tipo.value]) {
      return showResult(
        `O quarto ${NOMES[tipo.value]} acomoda até ${CAPACIDADE[tipo.value]} pessoas. Escolha outro quarto.`,
        true
      );
    }

    const total = noites * PRECOS[tipo.value];
    showResult(
      `${NOMES[tipo.value]} · ${noites} ${noites === 1 ? 'noite' : 'noites'} · Total estimado: ${formatarMoeda(total)}`
    );

    // Link para concluir a reserva pelo WhatsApp com os dados preenchidos
    const texto =
      `Olá! Gostaria de reservar o quarto ${NOMES[tipo.value]} ` +
      `de ${formatarData(checkin.value)} a ${formatarData(checkout.value)} ` +
      `para ${qtd} ${qtd === 1 ? 'hóspede' : 'hóspedes'}. Valor estimado: ${formatarMoeda(total)}.`;
    const link = document.createElement('a');
    link.className = 'btn btn--small';
    link.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'Solicitar reserva pelo WhatsApp';
    result.append(document.createElement('br'), link);
  });

  function showResult(msg, isError = false) {
    result.textContent = msg;
    result.classList.toggle('is-error', isError);
  }
}

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// "AAAA-MM-DD" usando a data local do visitante
function dataLocalISO(data) {
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${mes}-${dia}`;
}

function somarDias(iso, dias) {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return dataLocalISO(new Date(ano, mes - 1, dia + dias));
}

// "AAAA-MM-DD" -> "DD/MM/AAAA"
function formatarData(iso) {
  return iso.split('-').reverse().join('/');
}

/* ---------- Contadores animados (seção Sobre) ---------- */
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      animarContador(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.6 });

  counters.forEach(c => observer.observe(c));
}

function animarContador(el) {
  const alvo = +el.dataset.count;
  if (REDUZ_MOVIMENTO) {
    el.textContent = alvo.toLocaleString('pt-BR');
    return;
  }

  const duracao = 1500;
  const inicio = performance.now();

  const passo = agora => {
    const progresso = Math.min((agora - inicio) / duracao, 1);
    const suave = 1 - Math.pow(1 - progresso, 3); // desacelera no final
    el.textContent = Math.floor(suave * alvo).toLocaleString('pt-BR');
    if (progresso < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
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
    item.setAttribute('aria-label', `Ampliar foto: ${item.alt || i + 1}`);
    item.addEventListener('click', () => abrir(i));
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        abrir(i);
      }
    });
  });

  function mostrar(index) {
    atual = (index + itens.length) % itens.length;
    const item = itens[atual];
    const img = document.createElement('img');
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
  lightbox.addEventListener('click', e => { if (e.target === lightbox) fechar(); });

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

/* ---------- Slider de depoimentos ---------- */
function initSlider() {
  const slider = document.getElementById('slider');
  const slides = document.querySelectorAll('.slide');
  const dotsContainer = document.getElementById('sliderDots');
  let atual = 0;
  let timer;
  let pausado = false;

  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.setAttribute('aria-label', `Ir para depoimento ${i + 1}`);
    dot.addEventListener('click', () => irPara(i));
    dotsContainer.appendChild(dot);
  });
  const dots = dotsContainer.querySelectorAll('button');

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
  const pausar = valor => { pausado = valor; reiniciarAuto(); };
  slider.addEventListener('mouseenter', () => pausar(true));
  slider.addEventListener('mouseleave', () => pausar(false));
  slider.addEventListener('focusin', () => pausar(true));
  slider.addEventListener('focusout', () => pausar(false));
  document.addEventListener('visibilitychange', reiniciarAuto);

  document.getElementById('prevSlide').addEventListener('click', () => irPara(atual - 1));
  document.getElementById('nextSlide').addEventListener('click', () => irPara(atual + 1));

  irPara(0);
}

/* ---------- Formulário de contato (validação) ---------- */
function initContactForm() {
  const form = document.getElementById('contactForm');
  const success = document.getElementById('contactSuccess');

  const regras = {
    nome: v => v.trim().length >= 3 || 'Informe seu nome (mínimo 3 letras).',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Informe um e-mail válido.',
    mensagem: v => v.trim().length >= 10 || 'A mensagem deve ter pelo menos 10 caracteres.'
  };

  function validarCampo(campo) {
    const input = form.elements[campo];
    const field = input.closest('.field');
    const erro = field.querySelector('.error');
    const res = regras[campo](input.value);
    const ok = res === true;

    field.classList.toggle('has-error', !ok);
    input.setAttribute('aria-invalid', !ok);
    erro.textContent = ok ? '' : res;
    return ok;
  }

  // Revalida enquanto digita, mas só campos que já mostraram erro
  Object.keys(regras).forEach(campo => {
    const input = form.elements[campo];
    input.addEventListener('input', () => {
      if (input.closest('.field').classList.contains('has-error')) validarCampo(campo);
    });
  });

  const botao = document.getElementById('contactSubmit');

  function aviso(msg, isError = false) {
    success.textContent = msg;
    success.classList.toggle('is-error', isError);
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    aviso('');

    const resultados = Object.keys(regras).map(validarCampo);
    const primeiroInvalido = Object.keys(regras).find((_, i) => !resultados[i]);
    if (primeiroInvalido) {
      form.elements[primeiroInvalido].focus();
      return;
    }

    const { nome, email, mensagem } = form.elements;

    // Sem Formspree configurado: abre o e-mail do visitante com a mensagem pronta
    if (!FORMSPREE_ID) {
      const assunto = `Contato pelo site - ${nome.value.trim()}`;
      const corpo = `${mensagem.value.trim()}\n\n${nome.value.trim()}\n${email.value.trim()}`;
      window.location.href =
        `mailto:${EMAIL_CONTATO}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
      aviso('Abrimos seu programa de e-mail com a mensagem pronta. É só enviar!');
      return;
    }

    botao.disabled = true;
    botao.textContent = 'Enviando...';
    try {
      const resposta = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form)
      });
      if (!resposta.ok) throw new Error(resposta.status);
      aviso('Mensagem enviada! Responderemos em breve.');
      form.reset();
    } catch {
      aviso('Não foi possível enviar agora. Tente novamente ou fale conosco pelo WhatsApp.', true);
    } finally {
      botao.disabled = false;
      botao.textContent = 'Enviar mensagem';
    }
  });
}

/* ---------- Botão voltar ao topo ---------- */
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  window.addEventListener('scroll', () =>
    btn.classList.toggle('is-visible', window.scrollY > 600),
    { passive: true }
  );
  btn.addEventListener('click', () =>
    window.scrollTo({ top: 0, behavior: REDUZ_MOVIMENTO ? 'auto' : 'smooth' })
  );
}

/* ---------- Animação de entrada das seções ---------- */
function initReveal() {
  if (REDUZ_MOVIMENTO) return;

  const elementos = document.querySelectorAll(
    '.section__header, .room-card, .amenity, .about__text, .about__image, .gallery__item, .contact__form'
  );
  elementos.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  elementos.forEach(el => observer.observe(el));
}
