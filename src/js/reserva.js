/* =========================================
   SIMULAÇÃO DE RESERVA
   Calcula o valor da estadia (com temporadas) e confere as datas ocupadas.
   ========================================= */

/* ---------- Formulário de reserva ---------- */
function nomeQuarto(tipo) {
  return t(`room.${tipo}`);
}

function temporadaDe(iso) {
  const mesDia = iso.slice(5);
  return TEMPORADAS.find(
    ({ inicio, fim }) => (inicio <= fim ? mesDia >= inicio && mesDia <= fim : mesDia >= inicio || mesDia <= fim) // atravessa a virada do ano
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
      const chave = CAPACIDADE[quarto] === 1 ? 'msg.errCapacityOne' : 'msg.errCapacity';
      return showResult(t(chave, { room: nomeQuarto(quarto), n: CAPACIDADE[quarto] }), true);
    }

    // Noites já ocupadas (cadastradas no painel): avisa e sugere outros quartos livres
    const datas = Array.from({ length: noites }, (_, i) => somarDias(checkin.value, i));
    const ocupadas = datas.filter(d => noiteOcupada(quarto, d));
    if (ocupadas.length) {
      const livres = Object.keys(PRECOS).filter(
        q => q !== quarto && CAPACIDADE[q] >= qtd && !datas.some(d => noiteOcupada(q, d))
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
    showResult(
      `${nomeQuarto(quarto)} · ${noites} ${palavraNoites(noites)} · ${t('msg.total')}: ${formatarMoeda(total)}`
    );

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
      botaoPix.addEventListener('click', () =>
        abrirPix({
          valor: sinal,
          resumo,
          txid: `LAGOA${checkin.value.replace(/-/g, '')}${quarto.slice(0, 3).toUpperCase()}`
        })
      );
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
  if (!TEMPORADAS.length) return nota.remove(); // preço único o ano todo

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
