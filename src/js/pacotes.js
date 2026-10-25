/* =========================================
   PACOTES E PROMOÇÕES
   Esconde pacotes vencidos, monta os links de WhatsApp e o botão de compartilhar.
   ========================================= */

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
  const atualizarLinks = () =>
    linksWhatsapp.forEach(link => {
      const i = link.dataset.pacoteWhatsapp;
      const pacote = DADOS.pacotes[i];
      const texto = t('msg.pacWa', {
        pacote: t(`pac.nome.${i}`),
        noites: pacote.noites,
        valor: formatarMoeda(pacote.preco, 0)
      });
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
        try {
          await navigator.share({ title: titulo, url });
        } catch {
          /* visitante cancelou */
        }
        return;
      }
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        /* sem área de transferência */
      }
      const textoOriginal = btn.textContent;
      btn.textContent = t('msg.linkCopied');
      setTimeout(() => {
        btn.textContent = textoOriginal;
      }, 2000);
    })
  );
}
