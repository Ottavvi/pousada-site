/* =========================================
   POUSADA LAGOA AZUL - INÍCIO
   Carregado por último: liga cada parte do site quando a página termina de carregar.
   ========================================= */

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
  initGallery();
  initSlider();
  initContactForm();
  initBackToTop();
  initMobileBar();
  initReveal();
  initAnalytics();
  document.getElementById('year').textContent = new Date().getFullYear();
});
