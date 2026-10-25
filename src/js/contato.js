/* =========================================
   FORMULÁRIO DE CONTATO
   Validação dos campos e envio pelo Formspree (ou pelo e-mail do visitante).
   ========================================= */

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
      window.location.href = `mailto:${EMAIL_CONTATO}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
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
