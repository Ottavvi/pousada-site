/* =========================================
   IDIOMAS (PT / EN / ES)
   Troca os textos marcados com data-i18n usando as traduções de js/i18n.js.
   ========================================= */

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
  document.querySelectorAll('[data-lang]').forEach(btn => btn.setAttribute('aria-pressed', btn.dataset.lang === lang));

  // Avisa as outras partes do site para atualizarem textos gerados pelo JS
  document.dispatchEvent(new Event('idioma'));
}
