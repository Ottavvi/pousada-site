/* =========================================
   GOOGLE ANALYTICS
   Só carrega com o consentimento do visitante (LGPD).
   ========================================= */

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
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID);
}

// Registra um clique ou ação (só funciona se o visitante aceitou os cookies)
function registrarEvento(nome, dados = {}) {
  if (window.gtag) window.gtag('event', nome, dados);
}
