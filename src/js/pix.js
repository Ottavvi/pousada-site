/* =========================================
   PAGAMENTO DO SINAL VIA PIX
   Janela com QR Code e código "copia e cola" no padrão do Banco Central.
   ========================================= */

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
  modal.addEventListener('click', e => {
    if (e.target === modal) fecharModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') fecharModal();
  });

  copiar.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(codigo.value);
    } catch {
      codigo.select();
      document.execCommand('copy');
    }
    const textoOriginal = copiar.textContent;
    copiar.textContent = t('msg.copied');
    setTimeout(() => {
      copiar.textContent = textoOriginal;
    }, 2000);
  });
}

// Código "Pix copia e cola" (padrão BR Code do Banco Central) com valor definido
function gerarPixCopiaECola({ chave, nome, cidade, valor, txid }) {
  // Nome e cidade: sem acentos nem símbolos, nos tamanhos máximos do padrão
  const limpar = (texto, max) =>
    texto
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^A-Za-z0-9 ]/g, '')
      .toUpperCase()
      .slice(0, max)
      .trim();
  const campo = (id, valorCampo) => `${id}${String(valorCampo.length).padStart(2, '0')}${valorCampo}`;
  const identificador =
    String(txid || '')
      .replace(/[^A-Za-z0-9]/g, '')
      .slice(0, 25) || '***';

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
  let crc = 0xffff;
  for (let i = 0; i < texto.length; i++) {
    crc ^= texto.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}
