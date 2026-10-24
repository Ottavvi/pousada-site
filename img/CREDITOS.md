# Fotos do site

## Como trocar uma foto

1. Coloque a foto nova em `img/originais/` com **o mesmo nome** da que vai substituir (ex.: `quarto-luxo.jpg`).
   De preferência na horizontal e com pelo menos 1200px de largura (a `hero.jpg`, com 1920px).
2. Rode `npm run imagens` na pasta do projeto (na primeira vez, rode `npm install` antes).
   O script gera as versões leves em WebP (`-600.webp` para celular e `-1200.webp` para desktop)
   e a `og.jpg`, a imagem que aparece ao compartilhar o link.
3. Ajuste o texto `alt` da imagem no `index.html` (e em `js/i18n.js`, para inglês e espanhol).

O site usa **só** os arquivos `.webp` e o `og.jpg`; a pasta `originais/` guarda as fotos-fonte.

## Fotos provisórias

Todas as fotos atuais são **provisórias** e vêm do [Unsplash](https://unsplash.com)
(licença gratuita, uso comercial permitido). Elas **não são da pousada**: troque pelas reais assim que possível.

| Arquivo (em originais/) | Onde aparece | Foto original |
|---|---|---|
| hero.jpg | Capa e imagem de compartilhamento | https://unsplash.com/photos/1507525428034-b723cf961d3e |
| sobre.jpg | Seção "Sobre nós" | https://unsplash.com/photos/1566073771259-6a8506099945 |
| quarto-standard.jpg | Quarto Standard (1ª foto) | https://unsplash.com/photos/1611892440504-42a792e24d32 |
| quarto-standard-banheiro.jpg | Quarto Standard (2ª foto) | https://unsplash.com/photos/1552321554-5fefe8c9ef14 |
| quarto-standard-detalhe.jpg | Quarto Standard (3ª foto) | https://unsplash.com/photos/1522771739844-6a9f6d5f14af |
| quarto-luxo.jpg | Quarto Luxo (1ª foto) | https://unsplash.com/photos/1582719478250-c89cae4dc85b |
| quarto-luxo-banheira.jpg | Quarto Luxo (2ª foto) | https://unsplash.com/photos/1507652313519-d4e9174996dd |
| quarto-suite.jpg | Suíte Master (1ª foto) e galeria | https://unsplash.com/photos/1578683010236-d716f9a3f461 |
| quarto-suite-vista.jpg | Suíte Master (2ª foto) | https://unsplash.com/photos/1602002418082-a4443e081dd1 |
| quarto-suite-banheiro.jpg | Suíte Master (3ª foto) | https://unsplash.com/photos/1620626011761-996317b8d101 |
| galeria-piscina.jpg | Galeria | https://unsplash.com/photos/1584132967334-10e028bd69f7 |
| galeria-jardim.jpg | Galeria e Quarto Luxo (3ª foto) | https://unsplash.com/photos/1520250497591-112f2f40a3f4 |
| galeria-cafe.jpg | Galeria | https://unsplash.com/photos/1533089860892-a7c6f0a88666 |
| galeria-praia.jpg | Galeria | https://unsplash.com/photos/1505142468610-359e7d316be0 |
| galeria-por-do-sol.jpg | Galeria | https://unsplash.com/photos/1551882547-ff40c63fe5fa |
