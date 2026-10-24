/* =========================================
   POUSADA LAGOA AZUL - SCRIPT PRINCIPAL
   ========================================= */

/* ---------- Configuração ----------
   Tudo vem de js/dados.js, gerado a partir de data/ (editável pelo painel em /admin).
   Não coloque dados da pousada aqui. */

const WHATSAPP = DADOS.contato.whatsapp;
const INSTAGRAM = DADOS.contato.instagram;
const FACEBOOK = DADOS.contato.facebook;
const EMAIL_CONTATO = DADOS.contato.email;

// Formspree: se vazio, o formulário abre o e-mail do visitante com a mensagem pronta
const FORMSPREE_ID = DADOS.integracoes.formspree;
// Google Analytics 4: se vazio, nada é medido e o aviso de cookies não aparece
const GA_ID = DADOS.integracoes.analytics;

const PRECOS = Object.fromEntries(Object.entries(DADOS.quartos).map(([id, q]) => [id, q.preco]));
const CAPACIDADE = Object.fromEntries(Object.entries(DADOS.quartos).map(([id, q]) => [id, q.capacidade]));
const TEMPORADAS = DADOS.temporadas; // { id, inicio: 'MM-DD', fim: 'MM-DD', acrescimo: % }
const BLOQUEIOS = DADOS.bloqueios;   // { quarto: 'todos' | id, inicio: 'AAAA-MM-DD', fim } (noites ocupadas)
const PIX = DADOS.pix;               // { chave, nome, cidade, sinal: % } — sem chave, o Pix não aparece

// Respeita a preferência do sistema por menos animação
const REDUZ_MOVIMENTO = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('DOMContentLoaded', () => {
  initIdioma();
  initRedesSociais();
  initHeader();
  initMenuMobile();
  initActiveLink();
  initBooking();
  initCalendario();
  initPix();
  initTemporadas();
  initCarrosseis();
  initPacotes();
  initCounters();
  initGallery();
  initSlider();
  initContactForm();
  initBackToTop();
  initMobileBar();
  initReveal();
  initAnalytics();
  document.getElementById('year').textContent = new Date().getFullYear();
});

/* ---------- Idiomas (PT / EN / ES) ---------- */
const IDIOMAS = { pt: 'pt-BR', en: 'en', es: 'es' };
let idioma = 'pt';
const textosOriginais = new Map(); // português, lido do próprio HTML
const atributosOriginais = new WeakMap(); // elemento -> { atributo: texto em português }

// Traduz uma chave, trocando {variáveis} pelos valores informados
function t(chave, vars = {}) {
  const texto = I18N[idioma][chave] ?? textosOriginais.get(chave) ?? I18N.pt[chave] ?? chave;
  return texto.replace(/\{(\w+)\}/g, (_, nome) => vars[nome] ?? '');
}

function initIdioma() {
  // Guarda os textos em português que estão no HTML
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.dataset.original = el.innerHTML;
    if (!textosOriginais.has(el.dataset.i18n)) textosOriginais.set(el.dataset.i18n, el.innerHTML);
  });
  document.querySelectorAll('[data-i18n-attr]').forEach(el => {
    const originais = {};
    lerAtributosI18n(el).forEach(([attr, chave]) => {
      originais[attr] = el.getAttribute(attr) || '';
      if (!textosOriginais.has(chave)) textosOriginais.set(chave, originais[attr]);
    });
    atributosOriginais.set(el, originais);
  });

  // Ordem de escolha: ?lang= na URL > escolha anterior > idioma do navegador > português
  const daUrl = new URLSearchParams(location.search).get('lang');
  const salvo = lerStorage('idioma');
  const navegador = (navigator.language || '').slice(0, 2);
  const escolhido = [daUrl, salvo, navegador].find(l => l && IDIOMAS[l]) || 'pt';
  aplicarIdioma(escolhido);

  document.querySelectorAll('[data-lang]').forEach(btn =>
    btn.addEventListener('click', () => {
      aplicarIdioma(btn.dataset.lang);
      salvarStorage('idioma', btn.dataset.lang);

      // Mantém o idioma no endereço, para quem compartilhar o link
      const url = new URL(location.href);
      if (btn.dataset.lang === 'pt') url.searchParams.delete('lang');
      else url.searchParams.set('lang', btn.dataset.lang);
      history.replaceState(null, '', url);
    })
  );
}

// "alt:chave, aria-label:outra" -> [['alt', 'chave'], ['aria-label', 'outra']]
function lerAtributosI18n(el) {
  return el.dataset.i18nAttr.split(',').map(par => par.trim().split(':'));
}

function aplicarIdioma(lang) {
  idioma = lang;
  const dic = I18N[lang];

  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.innerHTML = lang === 'pt' ? el.dataset.original : (dic[el.dataset.i18n] ?? el.dataset.original);
  });
  document.querySelectorAll('[data-i18n-attr]').forEach(el => {
    const originais = atributosOriginais.get(el);
    lerAtributosI18n(el).forEach(([attr, chave]) => {
      el.setAttribute(attr, lang === 'pt' ? originais[attr] : (dic[chave] ?? originais[attr]));
    });
  });

  document.documentElement.lang = IDIOMAS[lang];
  document.title = t('meta.title');
  document.querySelector('meta[name="description"]').content = t('meta.description');
  document.querySelectorAll('[data-lang]').forEach(btn =>
    btn.setAttribute('aria-pressed', btn.dataset.lang === lang)
  );

  // Avisa as outras partes do site para atualizarem textos gerados pelo JS
  document.dispatchEvent(new Event('idioma'));
}

/* ---------- Armazenamento local (pode falhar em modo privado) ---------- */
function lerStorage(chave) {
  try { return localStorage.getItem(chave); } catch { return null; }
}

function salvarStorage(chave, valor) {
  try { localStorage.setItem(chave, valor); } catch { /* sem armazenamento: segue sem lembrar */ }
}

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
function nomeQuarto(tipo) {
  return tipo === 'standard' ? 'Standard' : t(`room.${tipo}`);
}

function temporadaDe(iso) {
  const mesDia = iso.slice(5);
  return TEMPORADAS.find(({ inicio, fim }) =>
    inicio <= fim
      ? mesDia >= inicio && mesDia <= fim
      : mesDia >= inicio || mesDia <= fim // atravessa a virada do ano
  );
}

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

  // O resultado fica no idioma antigo se o visitante trocar: melhor limpar
  document.addEventListener('idioma', () => showResult(''));

  form.addEventListener('submit', e => {
    e.preventDefault();

    if (!checkin.value || !checkout.value) return showResult(t('msg.errDates'), true);
    if (checkin.value < hoje) return showResult(t('msg.errPast'), true);

    const noites = Math.round((new Date(checkout.value) - new Date(checkin.value)) / 86400000);
    if (noites <= 0) return showResult(t('msg.errOrder'), true);

    const quarto = tipo.value;
    const qtd = +hospedes.value;
    if (qtd > CAPACIDADE[quarto]) {
      return showResult(t('msg.errCapacity', { room: nomeQuarto(quarto), n: CAPACIDADE[quarto] }), true);
    }

    // Noites já ocupadas (cadastradas no painel): avisa e sugere outros quartos livres
    const datas = Array.from({ length: noites }, (_, i) => somarDias(checkin.value, i));
    const ocupadas = datas.filter(d => noiteOcupada(quarto, d));
    if (ocupadas.length) {
      const livres = Object.keys(PRECOS).filter(q =>
        q !== quarto && CAPACIDADE[q] >= qtd && !datas.some(d => noiteOcupada(q, d))
      );
      let msg = t('msg.errBusy', { room: nomeQuarto(quarto), datas: resumirDatas(ocupadas) });
      if (livres.length) {
        const chave = livres.length === 1 ? 'msg.altRoom' : 'msg.altRooms';
        msg += ` ${t(chave, { rooms: livres.map(nomeQuarto).join(t('msg.and')) })}`;
      }
      return showResult(msg, true);
    }

    // Soma noite a noite, aplicando o acréscimo da temporada de cada data
    let total = 0;
    const noitesPorTemporada = {};
    for (let i = 0; i < noites; i++) {
      const temporada = temporadaDe(datas[i]);
      total += PRECOS[quarto] * (1 + (temporada ? temporada.acrescimo / 100 : 0));
      if (temporada) noitesPorTemporada[temporada.id] = (noitesPorTemporada[temporada.id] || 0) + 1;
    }
    total = Math.round(total);

    const palavraNoites = n => (n === 1 ? t('msg.night') : t('msg.nights'));
    showResult(`${nomeQuarto(quarto)} · ${noites} ${palavraNoites(noites)} · ${t('msg.total')}: ${formatarMoeda(total)}`);

    const detalhes = Object.entries(noitesPorTemporada).map(([id, n]) =>
      t('msg.seasonIncl', {
        n,
        nights: palavraNoites(n),
        season: t(`season.${id}`),
        p: TEMPORADAS.find(s => s.id === id).acrescimo
      })
    );
    if (detalhes.length) {
      const nota = document.createElement('small');
      nota.className = 'booking__season';
      nota.textContent = `(${detalhes.join('; ')})`;
      result.append(document.createElement('br'), nota);
    }

    registrarEvento('simulacao_reserva', { quarto, noites, valor: total });

    // Link para concluir a reserva pelo WhatsApp com os dados preenchidos
    const texto = t('msg.waText', {
      room: nomeQuarto(quarto),
      in: formatarData(checkin.value),
      out: formatarData(checkout.value),
      n: qtd,
      guests: qtd === 1 ? t('msg.guest') : t('msg.guests'),
      total: formatarMoeda(total)
    });
    const link = document.createElement('a');
    link.className = 'btn btn--small';
    link.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = t('msg.waBtn');
    link.addEventListener('click', () => registrarEvento('clique_reserva_whatsapp', { quarto }));
    result.append(document.createElement('br'), link);

    // Pagamento do sinal via Pix (só se a chave Pix estiver cadastrada)
    if (PIX.chave) {
      const sinal = Math.round(total * PIX.sinal) / 100;
      const resumo = t('msg.pixResumo', {
        room: nomeQuarto(quarto),
        in: formatarData(checkin.value),
        out: formatarData(checkout.value),
        n: qtd,
        guests: qtd === 1 ? t('msg.guest') : t('msg.guests')
      });
      const botaoPix = document.createElement('button');
      botaoPix.type = 'button';
      botaoPix.className = 'btn btn--small btn--pix';
      botaoPix.textContent = t('msg.pixBtn', { p: PIX.sinal, valor: formatarMoeda(sinal) });
      botaoPix.addEventListener('click', () => abrirPix({
        valor: sinal,
        resumo,
        txid: `LAGOA${checkin.value.replace(/-/g, '')}${quarto.slice(0, 3).toUpperCase()}`
      }));
      result.append(' ', botaoPix);
    }
  });

  function showResult(msg, isError = false) {
    result.textContent = msg;
    result.classList.toggle('is-error', isError);
  }
}

// Texto abaixo dos quartos explicando os acréscimos de cada temporada
function initTemporadas() {
  const nota = document.getElementById('seasonNote');

  const montar = () => {
    nota.replaceChildren(`${t('msg.seasonNote')} `);
    TEMPORADAS.forEach(({ id, inicio, fim, acrescimo }, i) => {
      if (i > 0) nota.append(' · ');
      const nome = document.createElement('strong');
      nome.textContent = t(`season.${id}`);
      nota.append(nome, ` (${formatarMesDia(inicio)}–${formatarMesDia(fim)}) +${acrescimo}%`);
    });
  };

  montar();
  document.addEventListener('idioma', montar);
}

/* ---------- Disponibilidade (datas ocupadas cadastradas no painel) ---------- */

// A noite que começa em "iso" está ocupada nesse quarto?
function noiteOcupada(quarto, iso) {
  return BLOQUEIOS.some(b => (b.quarto === 'todos' || b.quarto === quarto) && iso >= b.inicio && iso <= b.fim);
}

// ['2026-12-30', '2026-12-31'] -> "30/12, 31/12" (no máximo 4 datas)
function resumirDatas(lista) {
  const curtas = lista.map(iso => formatarMesDia(iso.slice(5)));
  return curtas.length > 4 ? `${curtas.slice(0, 4).join(', ')}…` : curtas.join(', ');
}

// "AAAA-MM" + n meses
function somarMeses(anoMes, n) {
  const [ano, mes] = anoMes.split('-').map(Number);
  const data = new Date(ano, mes - 1 + n, 1);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
}

function initCalendario() {
  const toggle = document.getElementById('calToggle');
  const cal = document.getElementById('calendario');
  const meses = document.getElementById('calMonths');
  const titulo = document.getElementById('calRoom');
  const dica = document.getElementById('calHint');
  const anterior = document.getElementById('calPrev');
  const checkin = document.getElementById('checkin');
  const checkout = document.getElementById('checkout');
  const tipo = document.getElementById('tipoQuarto');
  const hoje = dataLocalISO(new Date());
  const mesAtual = hoje.slice(0, 7);
  const telaLarga = window.matchMedia('(min-width: 640px)'); // dois meses lado a lado
  let primeiroMes = mesAtual;

  toggle.addEventListener('click', () => {
    const abrir = cal.hidden;
    cal.hidden = !abrir;
    toggle.setAttribute('aria-expanded', abrir);
    if (abrir) desenhar();
  });
  anterior.addEventListener('click', () => {
    if (primeiroMes > mesAtual) { primeiroMes = somarMeses(primeiroMes, -1); desenhar(); }
  });
  document.getElementById('calNext').addEventListener('click', () => {
    primeiroMes = somarMeses(primeiroMes, 1);
    desenhar();
  });

  // Redesenha quando muda o quarto, as datas, o tamanho da tela ou o idioma
  const redesenhar = () => { if (!cal.hidden) desenhar(); };
  [tipo, checkin, checkout].forEach(el => el.addEventListener('change', redesenhar));
  telaLarga.addEventListener('change', redesenhar);
  document.addEventListener('idioma', redesenhar);

  function desenhar() {
    const quarto = tipo.value;
    titulo.textContent = t('msg.calRoom', { room: nomeQuarto(quarto) });
    anterior.disabled = primeiroMes <= mesAtual;
    const quantos = telaLarga.matches ? 2 : 1;
    meses.replaceChildren(...Array.from({ length: quantos }, (_, i) => desenharMes(somarMeses(primeiroMes, i), quarto)));
  }

  function desenharMes(anoMes, quarto) {
    const [ano, mes] = anoMes.split('-').map(Number);
    const locale = IDIOMAS[idioma];
    const caixa = document.createElement('div');
    caixa.className = 'calendar__month';

    const nome = document.createElement('p');
    nome.className = 'calendar__month-name';
    const nomeMes = new Date(ano, mes - 1, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    nome.textContent = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1); // "dezembro de 2026" -> "Dezembro de 2026"

    const grade = document.createElement('div');
    grade.className = 'calendar__grid';

    // Iniciais dos dias da semana, começando no domingo (01/01/2023 foi um domingo)
    for (let d = 0; d < 7; d++) {
      const sigla = document.createElement('span');
      sigla.className = 'calendar__weekday';
      sigla.setAttribute('aria-hidden', 'true');
      sigla.textContent = new Date(2023, 0, 1 + d).toLocaleDateString(locale, { weekday: 'narrow' });
      grade.append(sigla);
    }
    for (let i = 0; i < new Date(ano, mes - 1, 1).getDay(); i++) grade.append(document.createElement('span'));

    const diasNoMes = new Date(ano, mes, 0).getDate();
    for (let dia = 1; dia <= diasNoMes; dia++) {
      const iso = `${anoMes}-${String(dia).padStart(2, '0')}`;
      const ocupado = noiteOcupada(quarto, iso);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'calendar__day';
      btn.textContent = dia;
      btn.disabled = iso < hoje;
      btn.classList.toggle('is-busy', ocupado);
      btn.classList.toggle('is-start', iso === checkin.value);
      btn.classList.toggle('is-end', iso === checkout.value);
      btn.classList.toggle('is-range', !!checkout.value && iso > checkin.value && iso < checkout.value);
      const rotulo = new Date(ano, mes - 1, dia).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
      btn.setAttribute('aria-label', ocupado ? `${rotulo} (${t('msg.busyDay')})` : rotulo);
      btn.setAttribute('aria-pressed', iso === checkin.value || iso === checkout.value);
      btn.addEventListener('click', () => escolher(iso, quarto));
      grade.append(btn);
    }

    caixa.append(nome, grade);
    return caixa;
  }

  // 1º toque = entrada, 2º toque = saída (todas as noites no meio precisam estar livres)
  function escolher(iso, quarto) {
    const escolhendoSaida = checkin.value && !checkout.value && iso > checkin.value;

    if (escolhendoSaida) {
      const noites = [];
      for (let d = checkin.value; d < iso; d = somarDias(d, 1)) noites.push(d);
      if (noites.some(d => noiteOcupada(quarto, d))) {
        dica.textContent = t('msg.calBusyRange');
        return;
      }
      checkout.value = iso;
      dica.textContent = t('msg.calDone', { in: formatarData(checkin.value), out: formatarData(iso) });
    } else {
      if (noiteOcupada(quarto, iso)) {
        dica.textContent = t('msg.calBusyRange');
        return;
      }
      checkin.value = iso;
      checkout.value = '';
      checkin.dispatchEvent(new Event('change')); // atualiza a data mínima de saída
      dica.textContent = t('msg.calPickOut');
    }
    desenhar();
  }
}

/* ---------- Pagamento do sinal via Pix ---------- */
let abrirPix = () => {};

function initPix() {
  const modal = document.getElementById('pixModal');
  const fechar = document.getElementById('pixClose');
  const codigo = document.getElementById('pixCodigo');
  const copiar = document.getElementById('pixCopiar');
  let focoAnterior = null;

  abrirPix = ({ valor, resumo, txid }) => {
    const payload = gerarPixCopiaECola({ chave: PIX.chave, nome: PIX.nome, cidade: PIX.cidade, valor, txid });
    document.getElementById('pixValor').textContent = formatarMoeda(valor);
    document.getElementById('pixResumo').textContent = resumo;
    codigo.value = payload;

    const qr = qrcode(0, 'M');
    qr.addData(payload);
    qr.make();
    document.getElementById('pixQr').innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });

    const mensagem = t('msg.pixWa', { valor: formatarMoeda(valor), resumo });
    document.getElementById('pixWhatsapp').href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensagem)}`;

    focoAnterior = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('no-scroll');
    fechar.focus();
    registrarEvento('pix_aberto', { valor });
  };

  const fecharModal = () => {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove('no-scroll');
    if (focoAnterior) focoAnterior.focus();
  };
  fechar.addEventListener('click', fecharModal);
  modal.addEventListener('click', e => { if (e.target === modal) fecharModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharModal(); });

  copiar.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(codigo.value);
    } catch {
      codigo.select();
      document.execCommand('copy');
    }
    const textoOriginal = copiar.textContent;
    copiar.textContent = t('msg.copied');
    setTimeout(() => { copiar.textContent = textoOriginal; }, 2000);
  });
}

// Código "Pix copia e cola" (padrão BR Code do Banco Central) com valor definido
function gerarPixCopiaECola({ chave, nome, cidade, valor, txid }) {
  // Nome e cidade: sem acentos nem símbolos, nos tamanhos máximos do padrão
  const limpar = (texto, max) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '').toUpperCase().slice(0, max).trim();
  const campo = (id, valorCampo) => `${id}${String(valorCampo.length).padStart(2, '0')}${valorCampo}`;
  const identificador = String(txid || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***';

  const conteudo =
    campo('00', '01') +
    campo('26', campo('00', 'br.gov.bcb.pix') + campo('01', chave.trim())) +
    campo('52', '0000') +
    campo('53', '986') +
    campo('54', valor.toFixed(2)) +
    campo('58', 'BR') +
    campo('59', limpar(nome, 25)) +
    campo('60', limpar(cidade, 15)) +
    campo('62', campo('05', identificador)) +
    '6304';
  return conteudo + crc16(conteudo);
}

// CRC16-CCITT (polinômio 0x1021, início 0xFFFF), exigido no final do código Pix
function crc16(texto) {
  let crc = 0xFFFF;
  for (let i = 0; i < texto.length; i++) {
    crc ^= texto.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/* ---------- Pacotes e promoções ---------- */
function initPacotes() {
  const secao = document.getElementById('pacotes');
  if (!secao) return;

  // Esconde pacotes vencidos (o site não é remontado todo dia)
  const hoje = dataLocalISO(new Date());
  secao.querySelectorAll('.package').forEach(card => {
    if (card.dataset.validade && card.dataset.validade < hoje) card.remove();
  });
  if (!secao.querySelector('.package')) {
    secao.remove();
    return;
  }

  const linksWhatsapp = secao.querySelectorAll('[data-pacote-whatsapp]');
  const atualizarLinks = () => linksWhatsapp.forEach(link => {
    const i = link.dataset.pacoteWhatsapp;
    const pacote = DADOS.pacotes[i];
    const texto = t('msg.pacWa', { pacote: t(`pac.nome.${i}`), noites: pacote.noites, valor: formatarMoeda(pacote.preco, 0) });
    link.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
  });
  atualizarLinks();
  document.addEventListener('idioma', atualizarLinks);
  linksWhatsapp.forEach(link =>
    link.addEventListener('click', () => registrarEvento('clique_pacote', { pacote: link.dataset.pacoteWhatsapp }))
  );

  // Compartilhar: menu nativo no celular; no computador, copia o link do pacote
  secao.querySelectorAll('[data-pacote-compartilhar]').forEach(btn =>
    btn.addEventListener('click', async () => {
      const url = `${location.origin}${location.pathname}${location.search}#${btn.dataset.pacoteCompartilhar}`;
      const titulo = btn.closest('.package').querySelector('h3').textContent;
      if (navigator.share) {
        try { await navigator.share({ title: titulo, url }); } catch { /* visitante cancelou */ }
        return;
      }
      try { await navigator.clipboard.writeText(url); } catch { /* sem área de transferência */ }
      const textoOriginal = btn.textContent;
      btn.textContent = t('msg.linkCopied');
      setTimeout(() => { btn.textContent = textoOriginal; }, 2000);
    })
  );
}

function formatarMoeda(valor, casas = 2) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency', currency: 'BRL', minimumFractionDigits: casas, maximumFractionDigits: casas
  });
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

// "MM-DD" -> "DD/MM"
function formatarMesDia(mesDia) {
  return mesDia.split('-').reverse().join('/');
}

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
    track.addEventListener('scroll', () => {
      if (agendado) return;
      agendado = true;
      requestAnimationFrame(() => { marcar(); agendado = false; });
    }, { passive: true });

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
  lightbox.addEventListener('click', e => { if (e.target === lightbox) fechar(); });

  // Deslizar o dedo para os lados troca a foto
  let toqueX = null;
  lightbox.addEventListener('touchstart', e => { toqueX = e.touches[0].clientX; }, { passive: true });
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

/* ---------- Formulário de contato (validação e envio) ---------- */
function initContactForm() {
  const form = document.getElementById('contactForm');
  const success = document.getElementById('contactSuccess');
  const botao = document.getElementById('contactSubmit');

  const regras = {
    nome: v => v.trim().length >= 3 || t('msg.errName'),
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || t('msg.errEmail'),
    mensagem: v => v.trim().length >= 10 || t('msg.errMessage')
  };

  const temErro = campo => form.elements[campo].closest('.field').classList.contains('has-error');

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

  function aviso(msg, isError = false) {
    success.textContent = msg;
    success.classList.toggle('is-error', isError);
  }

  // Revalida enquanto digita, mas só campos que já mostraram erro
  Object.keys(regras).forEach(campo => {
    form.elements[campo].addEventListener('input', () => {
      if (temErro(campo)) validarCampo(campo);
    });
  });

  // Ao trocar o idioma, refaz as mensagens que estão na tela
  document.addEventListener('idioma', () => {
    Object.keys(regras).filter(temErro).forEach(validarCampo);
    aviso('');
  });

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
      const assunto = `${t('msg.mailSubject')} - ${nome.value.trim()}`;
      const corpo = `${mensagem.value.trim()}\n\n${nome.value.trim()}\n${email.value.trim()}`;
      window.location.href =
        `mailto:${EMAIL_CONTATO}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
      aviso(t('msg.mailOpened'));
      registrarEvento('contato_email');
      return;
    }

    const textoBotao = botao.textContent;
    botao.disabled = true;
    botao.textContent = t('msg.sending');
    try {
      const resposta = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form)
      });
      if (!resposta.ok) throw new Error(resposta.status);
      aviso(t('msg.sent'));
      form.reset();
      registrarEvento('contato_enviado');
    } catch {
      aviso(t('msg.sendErr'), true);
    } finally {
      botao.disabled = false;
      botao.textContent = textoBotao;
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

/* ---------- Animação de entrada das seções ---------- */
function initReveal() {
  if (REDUZ_MOVIMENTO) return;

  const elementos = document.querySelectorAll(
    '.section__header, .room-card, .amenity, .about__text, .about__image, .gallery__item, .contact__form, .location__col, .faq__item, .package'
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

/* ---------- Google Analytics com consentimento (LGPD) ---------- */
function initAnalytics() {
  if (!GA_ID) return;

  const banner = document.getElementById('cookieBanner');
  const escolha = lerStorage('cookies');

  if (escolha === 'aceito') return carregarAnalytics();
  if (escolha === 'recusado') return;

  banner.hidden = false;
  document.getElementById('cookieAccept').addEventListener('click', () => {
    salvarStorage('cookies', 'aceito');
    banner.hidden = true;
    carregarAnalytics();
  });
  document.getElementById('cookieReject').addEventListener('click', () => {
    salvarStorage('cookies', 'recusado');
    banner.hidden = true;
  });
}

function carregarAnalytics() {
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID);
}

// Registra um clique ou ação (só funciona se o visitante aceitou os cookies)
function registrarEvento(nome, dados = {}) {
  if (window.gtag) window.gtag('event', nome, dados);
}
