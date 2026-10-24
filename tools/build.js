/* =========================================
   MONTAGEM DO SITE
   Junta o modelo (src/), os dados editáveis (data/) e as fotos (img/originais/)
   e gera o site pronto em dist/. Roda sozinho no GitHub a cada alteração.

   Uso local:  npm run build   (ou  npm run dev  para montar e abrir no navegador)
   ========================================= */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const RAIZ = path.join(__dirname, '..');
const SRC = path.join(RAIZ, 'src');
// DIST_DIR e DADOS_DIR permitem montar uma cópia de teste sem mexer nos arquivos reais
const DIST = process.env.DIST_DIR || path.join(RAIZ, 'dist');
const DADOS_DIR = process.env.DADOS_DIR || path.join(RAIZ, 'data');
const ORIGINAIS = path.join(RAIZ, 'img', 'originais');
const CACHE = path.join(RAIZ, '.cache', 'img');

const IDIOMAS = ['pt', 'en', 'es'];
const LARGURAS = [600, 1200];
const LARGURAS_CAPA = [1080, 1920];
const QUALIDADE = 72;

/* ---------- Utilidades ---------- */

function erro(msg) {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

const escapar = v => String(v ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Campo traduzido { pt, en, es } -> texto no idioma pedido (cai para o português se faltar)
const tr = (campo, lang = 'pt') =>
  typeof campo === 'string' ? campo : (campo?.[lang] || campo?.pt || '');

const slug = texto => tr(texto).normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const moeda = (valor, lang = 'pt') => {
  const n = Number(valor).toLocaleString(lang === 'en' ? 'en-US' : 'pt-BR', { maximumFractionDigits: 0 });
  return `R$ ${n}`;
};

const nomeBase = caminho => path.parse(String(caminho || '')).name;

// "DD/MM" (como a dona digita no painel) -> "MM-DD" (como o site compara)
function diaMes(texto, onde) {
  const m = /^(\d{2})\/(\d{2})$/.exec(String(texto).trim());
  if (!m) erro(`Data inválida em ${onde}: "${texto}". Use o formato DD/MM, por exemplo 15/12.`);
  return `${m[2]}-${m[1]}`;
}

function copiarPasta(origem, destino) {
  fs.mkdirSync(destino, { recursive: true });
  for (const item of fs.readdirSync(origem, { withFileTypes: true })) {
    const de = path.join(origem, item.name);
    const para = path.join(destino, item.name);
    if (item.isDirectory()) copiarPasta(de, para);
    else fs.copyFileSync(de, para);
  }
}

/* ---------- Dados ---------- */

function lerDados() {
  const dados = {};
  for (const arquivo of fs.readdirSync(DADOS_DIR).filter(f => f.endsWith('.json'))) {
    try {
      dados[path.parse(arquivo).name] = JSON.parse(fs.readFileSync(path.join(DADOS_DIR, arquivo), 'utf8'));
    } catch (e) {
      erro(`Não foi possível ler data/${arquivo}: ${e.message}`);
    }
  }
  return dados;
}

/* ---------- Imagens ---------- */

async function gerarImagens(dados) {
  fs.mkdirSync(CACHE, { recursive: true });
  const dimensoes = {}; // nome base -> { w, h } da versão de 1200px

  const gerar = async (entrada, saida, opcoes) => {
    const fonte = fs.statSync(entrada).mtimeMs;
    if (fs.existsSync(saida) && fs.statSync(saida).mtimeMs >= fonte) return; // já está pronta
    let img = sharp(entrada).rotate();
    img = opcoes.cobrir
      ? img.resize(opcoes.largura, opcoes.altura, { fit: 'cover' })
      : img.resize({ width: opcoes.largura, withoutEnlargement: true });
    await (opcoes.jpeg ? img.jpeg({ quality: 78, mozjpeg: true }) : img.webp({ quality: QUALIDADE })).toFile(saida);
  };

  const fotos = fs.readdirSync(ORIGINAIS).filter(f => /\.(jpe?g|png|webp)$/i.test(f));
  for (const arquivo of fotos) {
    const entrada = path.join(ORIGINAIS, arquivo);
    const base = nomeBase(arquivo);
    for (const largura of LARGURAS) {
      await gerar(entrada, path.join(CACHE, `${base}-${largura}.webp`), { largura });
    }
    const meta = await sharp(path.join(CACHE, `${base}-1200.webp`)).metadata();
    dimensoes[base] = { w: meta.width, h: meta.height };
  }

  // Capa: tamanhos próprios e a imagem de compartilhamento (og.jpg)
  const capa = path.join(RAIZ, dados.fotos.capa);
  if (!fs.existsSync(capa)) erro(`A foto de capa "${dados.fotos.capa}" não existe em img/originais/.`);
  for (const largura of LARGURAS_CAPA) {
    await gerar(capa, path.join(CACHE, `capa-${largura}.webp`), { largura });
  }
  await gerar(capa, path.join(CACHE, 'og.jpg'), { cobrir: true, largura: 1200, altura: 630, jpeg: true });

  copiarPasta(CACHE, path.join(DIST, 'img'));
  return dimensoes;
}

/* ---------- Blocos de HTML gerados a partir dos dados ---------- */

function criarBlocos(dados, dimensoes, traducoes) {
  // Registra um texto traduzido: o português vai no HTML, inglês e espanhol para o js/dados.js
  const registrar = (chave, campo) => {
    for (const lang of ['en', 'es']) traducoes[lang][chave] = tr(campo, lang);
    return tr(campo, 'pt');
  };

  const imagem = (caminho, chaveAlt, alt, classe, sizes) => {
    const base = nomeBase(caminho);
    if (!dimensoes[base]) erro(`A foto "${caminho}" não existe em img/originais/.`);
    const { w, h } = dimensoes[base];
    return `<img${classe ? ` class="${classe}"` : ''} src="img/${base}-1200.webp" ` +
      `srcset="img/${base}-600.webp 600w, img/${base}-1200.webp 1200w" sizes="${sizes}" ` +
      `alt="${escapar(registrar(chaveAlt, alt))}" data-i18n-attr="alt:${chaveAlt}" loading="lazy" width="${w}" height="${h}">`;
  };

  const blocos = {};

  blocos['sobre-foto'] = () => imagem(dados.fotos.sobre.imagem, 'd.alt.sobre', dados.fotos.sobre.alt,
    'about__image', '(max-width: 900px) 100vw, 540px');

  blocos['fotos-quarto'] = id => {
    const quarto = dados.quartos[id];
    if (!quarto) erro(`Quarto "${id}" não encontrado em data/quartos.json.`);
    return quarto.fotos.map((foto, i) =>
      imagem(foto.imagem, `d.alt.${id}.${i}`, foto.alt, '', '(max-width: 700px) 100vw, 380px')).join('\n');
  };

  blocos['galeria'] = () => dados.fotos.galeria.map((foto, i) =>
    imagem(foto.imagem, `d.alt.gal.${i}`, foto.alt, 'gallery__item',
      '(max-width: 520px) 100vw, (max-width: 900px) 50vw, 380px')).join('\n');

  blocos['depoimentos'] = () => dados.avaliacoes.depoimentos.map((d, i) => {
    const entreAspas = Object.fromEntries(IDIOMAS.map(lang => [lang, `"${tr(d.texto, lang)}"`]));
    return `
            <blockquote class="slide${i === 0 ? ' is-active' : ''}">
              <p data-i18n="d.dep.${i}">${escapar(registrar(`d.dep.${i}`, entreAspas))}</p>
              <cite>— ${escapar(d.autor)}</cite>
            </blockquote>`;
  }).join('');

  // Nota do Google: só aparece se a nota e o link estiverem preenchidos
  blocos['avaliacao-nota'] = () => {
    const { nota, total, link_google: link } = dados.avaliacoes;
    if (!nota || !link) return '';
    const notaTxt = lang => Number(nota).toLocaleString(lang === 'en' ? 'en-US' : 'pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    const textos = {
      pt: `${notaTxt('pt')} no Google${total ? ` · ${total} avaliações` : ''}`,
      en: `${notaTxt('en')} on Google${total ? ` · ${total} reviews` : ''}`,
      es: `${notaTxt('es')} en Google${total ? ` · ${total} opiniones` : ''}`
    };
    return `<a class="rating" href="${escapar(link)}" target="_blank" rel="noopener">
            <span class="rating__stars" aria-hidden="true">★★★★★</span>
            <span data-i18n="d.rev.badge">${escapar(registrar('d.rev.badge', textos))}</span>
          </a>`;
  };

  blocos['avaliacao-link'] = () => {
    const link = dados.avaliacoes.link_avaliar;
    if (!link) return '';
    return `<p class="testimonials__review"><a class="btn btn--small btn--outline-dark" href="${escapar(link)}" target="_blank" rel="noopener" data-i18n="rev.write">Avaliar no Google</a></p>`;
  };

  blocos['localizacao-intro'] = () => escapar(registrar('d.loc.intro', dados.localizacao.introducao));

  const itensLocal = (lista, prefixo) => lista.map((item, i) => `
              <li><span class="location__icon" aria-hidden="true">${escapar(item.icone)}</span><div><strong data-i18n="${prefixo}.${i}.t">${escapar(registrar(`${prefixo}.${i}.t`, item.titulo))}</strong><span data-i18n="${prefixo}.${i}.d">${escapar(registrar(`${prefixo}.${i}.d`, item.descricao))}</span></div></li>`).join('');

  blocos['localizacao-chegar'] = () => itensLocal(dados.localizacao.como_chegar, 'd.loc.c');
  blocos['localizacao-passeios'] = () => itensLocal(dados.localizacao.passeios, 'd.loc.p');
  blocos['localizacao-dica'] = () => {
    const dica = dados.localizacao.dica;
    return tr(dica) ? `<p class="location__tip" data-i18n="d.loc.tip">${escapar(registrar('d.loc.tip', dica))}</p>` : '';
  };

  blocos['faq'] = () => dados.faq.perguntas.map((p, i) => `
          <details class="faq__item">
            <summary data-i18n="d.faq.${i}.q">${escapar(registrar(`d.faq.${i}.q`, p.pergunta))}</summary>
            <p data-i18n="d.faq.${i}.a">${escapar(registrar(`d.faq.${i}.a`, p.resposta))}</p>
          </details>`).join('');

  // Seção de pacotes: some sozinha se não houver nenhum ativo
  blocos['pacotes'] = () => {
    const ativos = dados.pacotes.pacotes.filter(p => p.ativo !== false);
    if (!ativos.length) return '';
    const palavra = { pt: 'noites', en: 'nights', es: 'noches' };
    const ate = { pt: 'Válido até', en: 'Valid until', es: 'Válido hasta' };
    const cards = ativos.map((p, i) => {
      const id = slug(p.titulo);
      const validade = p.validade ? p.validade.split('-').reverse().join('/') : '';
      const noites = {};
      const textoValidade = {};
      for (const lang of IDIOMAS) {
        noites[lang] = `${p.noites} ${palavra[lang]}`;
        textoValidade[lang] = `${ate[lang]} ${validade}`;
      }
      return `
          <article class="package" id="pacote-${id}" data-pacote="${i}" data-validade="${escapar(p.validade || '')}">
            ${imagem(p.imagem, `d.pac.${i}.alt`, p.titulo, 'package__img', '(max-width: 700px) 100vw, 380px')}
            <div class="package__body">
              ${validade ? `<p class="package__badge" data-i18n="d.pac.${i}.v">${escapar(registrar(`d.pac.${i}.v`, textoValidade))}</p>` : ''}
              <h3 data-i18n="d.pac.${i}.t">${escapar(registrar(`d.pac.${i}.t`, p.titulo))}</h3>
              <p data-i18n="d.pac.${i}.d">${escapar(registrar(`d.pac.${i}.d`, p.descricao))}</p>
              <p class="package__price"><strong>${moeda(p.preco)}</strong> <span data-i18n="d.pac.${i}.n">· ${escapar(registrar(`d.pac.${i}.n`, noites))}</span></p>
              <div class="package__actions">
                <a href="#" class="btn btn--small" data-pacote-whatsapp="${i}" target="_blank" rel="noopener" data-i18n="pac.want">Quero este pacote</a>
                <button type="button" class="package__share" data-pacote-compartilhar="pacote-${id}" data-i18n="pac.share">Compartilhar</button>
              </div>
            </div>
          </article>`;
    }).join('');

    return `
    <!-- ===== PACOTES (gerado a partir de data/pacotes.json) ===== -->
    <section class="section packages" id="pacotes">
      <div class="container">
        <div class="section__header">
          <p class="section__tag" data-i18n="pac.tag">Pacotes e promoções</p>
          <h2 data-i18n="pac.title">Ocasiões especiais</h2>
        </div>
        <div class="packages__grid">${cards}
        </div>
      </div>
    </section>`;
  };

  blocos['preco-minimo'] = () => moeda(Math.min(...Object.values(dados.quartos).map(q => q.preco)));

  blocos['jsonld'] = () => {
    const g = dados.geral;
    const precos = Object.values(dados.quartos).map(q => q.preco);
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'LodgingBusiness',
      name: 'Pousada Lagoa Azul',
      url: g.site_url,
      description: 'Pousada à beira-mar com quartos confortáveis, café da manhã regional e atendimento acolhedor.',
      image: `${g.site_url}img/og.jpg`,
      telephone: g.contato.telefone,
      email: g.contato.email,
      address: {
        '@type': 'PostalAddress',
        streetAddress: g.contato.endereco,
        addressLocality: g.contato.cidade,
        addressRegion: g.contato.uf,
        addressCountry: 'BR'
      },
      priceRange: `${moeda(Math.min(...precos))} - ${moeda(Math.max(...precos))}`,
      checkinTime: '14:00',
      checkoutTime: '12:00',
      petsAllowed: true,
      availableLanguage: ['pt-BR', 'en', 'es'],
      amenityFeature: ['Piscina', 'Café da manhã incluso', 'Wi-Fi grátis', 'Estacionamento gratuito']
        .map(name => ({ '@type': 'LocationFeatureSpecification', name, value: true }))
    };
    if (dados.avaliacoes.nota && dados.avaliacoes.total) {
      ld.aggregateRating = { '@type': 'AggregateRating', ratingValue: Number(dados.avaliacoes.nota), reviewCount: Number(dados.avaliacoes.total), bestRating: 5 };
    }
    return `<script type="application/ld+json">\n${JSON.stringify(ld, null, 2)}\n  </script>`;
  };

  return blocos;
}

/* ---------- Modelos ---------- */

// {{caminho.do.dado}}  ou  {{moeda:caminho}}  /  {{url:caminho}}
// <!-- @bloco nome argumento -->
function renderizar(modelo, dados, blocos) {
  const valor = caminho => caminho.split('.').reduce((obj, chave) => obj?.[chave], dados);

  return modelo
    .replace(/<!-- @bloco ([\w-]+)(?: ([\w-]+))? -->/g, (_, nome, arg) => {
      if (!blocos[nome]) erro(`Bloco desconhecido no modelo: ${nome}`);
      return blocos[nome](arg);
    })
    .replace(/\{\{(?:(\w+):)?([\w.]+)\}\}/g, (_, filtro, caminho) => {
      const v = valor(caminho);
      if (v === undefined) erro(`Dado não encontrado no modelo: {{${caminho}}}`);
      if (filtro === 'moeda') return moeda(v);
      if (filtro === 'url') return encodeURIComponent(v);
      return escapar(tr(v));
    });
}

/* ---------- Configuração usada pelo JavaScript do site ---------- */

function gerarDadosJs(dados, traducoes) {
  const g = dados.geral;
  const temporadas = dados.temporadas.temporadas.map((t, i) => {
    for (const lang of IDIOMAS) traducoes[lang][`season.${i}`] = tr(t.nome, lang);
    return {
      id: String(i),
      inicio: diaMes(t.inicio, `temporada "${tr(t.nome)}"`),
      fim: diaMes(t.fim, `temporada "${tr(t.nome)}"`),
      acrescimo: Number(t.acrescimo) || 0
    };
  });

  const pacotes = dados.pacotes.pacotes.filter(p => p.ativo !== false).map((p, i) => {
    for (const lang of IDIOMAS) traducoes[lang][`pac.nome.${i}`] = tr(p.titulo, lang);
    return { noites: p.noites, preco: p.preco };
  });

  const config = {
    contato: { whatsapp: g.contato.whatsapp, instagram: g.contato.instagram, facebook: g.contato.facebook, email: g.contato.email },
    integracoes: { formspree: g.integracoes.formspree_id, analytics: g.integracoes.google_analytics },
    pix: { chave: g.pix.chave, nome: g.pix.nome, cidade: g.pix.cidade, sinal: Number(g.pix.sinal_percentual) || 30 },
    quartos: Object.fromEntries(Object.entries(dados.quartos).map(([id, q]) => [id, { preco: q.preco, capacidade: q.capacidade }])),
    temporadas,
    bloqueios: dados.disponibilidade.bloqueios
      .filter(b => b.inicio && b.fim)
      .map(b => ({ quarto: b.quarto || 'todos', inicio: b.inicio.slice(0, 10), fim: b.fim.slice(0, 10) })),
    pacotes
  };

  return `/* Arquivo gerado por tools/build.js a partir de data/. Não edite aqui. */
const DADOS = ${JSON.stringify(config, null, 2)};
Object.assign(I18N.pt, ${JSON.stringify(traducoes.pt)});
Object.assign(I18N.en, ${JSON.stringify(traducoes.en)});
Object.assign(I18N.es, ${JSON.stringify(traducoes.es)});
`;
}

/* ---------- Principal ---------- */

async function main() {
  const inicio = Date.now();
  const dados = lerDados();

  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  const dimensoes = await gerarImagens(dados);
  const traducoes = { pt: {}, en: {}, es: {} };
  const blocos = criarBlocos(dados, dimensoes, traducoes);

  // Arquivos estáticos
  copiarPasta(path.join(SRC, 'css'), path.join(DIST, 'css'));
  copiarPasta(path.join(SRC, 'js'), path.join(DIST, 'js'));
  copiarPasta(path.join(SRC, 'admin'), path.join(DIST, 'admin'));
  fs.copyFileSync(path.join(SRC, '404.html'), path.join(DIST, '404.html'));
  fs.mkdirSync(path.join(DIST, 'js', 'vendor'), { recursive: true });
  fs.copyFileSync(require.resolve('qrcode-generator'), path.join(DIST, 'js', 'vendor', 'qrcode.js')); // dist/qrcode.js

  // Modelos preenchidos com os dados
  for (const arquivo of ['index.html', 'sitemap.xml', 'robots.txt']) {
    const modelo = fs.readFileSync(path.join(SRC, arquivo), 'utf8');
    fs.writeFileSync(path.join(DIST, arquivo), renderizar(modelo, dados, blocos));
  }
  fs.writeFileSync(path.join(DIST, 'js', 'dados.js'), gerarDadosJs(dados, traducoes));

  // GitHub Pages: publica os arquivos como estão (sem processamento Jekyll)
  fs.writeFileSync(path.join(DIST, '.nojekyll'), '');

  console.log(`✔ Site montado em dist/ (${((Date.now() - inicio) / 1000).toFixed(1)}s)`);
}

main().catch(e => erro(e.stack || e.message));
