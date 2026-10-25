/* =========================================
   CALENDÁRIO DE DISPONIBILIDADE
   Mostra as noites livres e ocupadas de cada quarto e preenche as datas da reserva.
   ========================================= */

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
    if (primeiroMes > mesAtual) {
      primeiroMes = somarMeses(primeiroMes, -1);
      desenhar();
    }
  });
  document.getElementById('calNext').addEventListener('click', () => {
    primeiroMes = somarMeses(primeiroMes, 1);
    desenhar();
  });

  // Redesenha quando muda o quarto, as datas, o tamanho da tela ou o idioma
  const redesenhar = () => {
    if (!cal.hidden) desenhar();
  };
  [tipo, checkin, checkout].forEach(el => el.addEventListener('change', redesenhar));
  telaLarga.addEventListener('change', redesenhar);
  document.addEventListener('idioma', redesenhar);

  function desenhar() {
    const quarto = tipo.value;
    titulo.textContent = t('msg.calRoom', { room: nomeQuarto(quarto) });
    anterior.disabled = primeiroMes <= mesAtual;
    const quantos = telaLarga.matches ? 2 : 1;
    meses.replaceChildren(
      ...Array.from({ length: quantos }, (_, i) => desenharMes(somarMeses(primeiroMes, i), quarto))
    );
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
      const rotulo = new Date(ano, mes - 1, dia).toLocaleDateString(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
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
