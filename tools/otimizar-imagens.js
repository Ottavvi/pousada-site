/* =========================================
   OTIMIZAÇÃO DE IMAGENS
   Lê as fotos de img/originais/ e gera versões WebP leves em img/,
   em dois tamanhos (celular e desktop).

   Uso: coloque/troque a foto em img/originais/ e rode  npm run imagens
   ========================================= */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ORIGEM = path.join(__dirname, '..', 'img', 'originais');
const DESTINO = path.join(__dirname, '..', 'img');

// Larguras geradas para cada foto (a capa é maior porque ocupa a tela toda)
const LARGURAS = { padrao: [600, 1200], hero: [1080, 1920] };
const QUALIDADE = 72;

async function main() {
  const fotos = fs.readdirSync(ORIGEM).filter(f => /\.(jpe?g|png|webp)$/i.test(f));

  for (const arquivo of fotos) {
    const nome = path.parse(arquivo).name;
    const entrada = path.join(ORIGEM, arquivo);
    const larguras = LARGURAS[nome] || LARGURAS.padrao;

    for (const largura of larguras) {
      const saida = path.join(DESTINO, `${nome}-${largura}.webp`);
      const info = await sharp(entrada)
        .rotate() // respeita a orientação de fotos de celular
        .resize({ width: largura, withoutEnlargement: true })
        .webp({ quality: QUALIDADE })
        .toFile(saida);
      console.log(`${path.basename(saida).padEnd(36)} ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
    }
  }

  // Imagem de pré-visualização ao compartilhar o link (WhatsApp, Facebook...)
  const og = await sharp(path.join(ORIGEM, 'hero.jpg'))
    .resize(1200, 630, { fit: 'cover' })
    .jpeg({ quality: 78, mozjpeg: true })
    .toFile(path.join(DESTINO, 'og.jpg'));
  console.log(`${'og.jpg'.padEnd(36)} 1200x630  ${(og.size / 1024).toFixed(0)} KB`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
