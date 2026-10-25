/* =========================================
   CONFIGURAÇÃO
   Dados da pousada vindos de js/dados.js (gerado a partir de data/, editável pelo painel em /admin).
   Não coloque dados da pousada aqui.
   ========================================= */

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
const BLOQUEIOS = DADOS.bloqueios; // { quarto: 'todos' | id, inicio: 'AAAA-MM-DD', fim } (noites ocupadas)
const PIX = DADOS.pix; // { chave, nome, cidade, sinal: % } — sem chave, o Pix não aparece

// Respeita a preferência do sistema por menos animação
const REDUZ_MOVIMENTO = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
