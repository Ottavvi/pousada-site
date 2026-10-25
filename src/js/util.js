/* =========================================
   UTILIDADES
   Armazenamento local, datas e valores em reais (usadas por várias partes do site).
   ========================================= */

/* ---------- Armazenamento local (pode falhar em modo privado) ---------- */
function lerStorage(chave) {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}

function salvarStorage(chave, valor) {
  try {
    localStorage.setItem(chave, valor);
  } catch {
    /* sem armazenamento: segue sem lembrar */
  }
}

function formatarMoeda(valor, casas = 2) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: casas,
    maximumFractionDigits: casas
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

// "AAAA-MM" + n meses
function somarMeses(anoMes, n) {
  const [ano, mes] = anoMes.split('-').map(Number);
  const data = new Date(ano, mes - 1 + n, 1);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
}
