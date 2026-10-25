# Pousada Lagoa Azul — site

Site: https://ottavvi.github.io/pousada-site/
Painel de edição: https://ottavvi.github.io/pousada-site/admin/

## Como funciona

```
data/            dados editáveis pelo painel (preços, datas ocupadas, pacotes, FAQ, fotos...)
img/originais/   fotos originais (o site usa versões WebP geradas automaticamente)
src/             modelo do site: index.html, 404.html e o painel (src/admin/)
src/css/         estilos, um arquivo por parte da página (responsivo.css por último)
src/js/          um arquivo por funcionalidade (reserva, calendário, Pix, galeria...),
                 traduções em i18n.js e main.js, que liga tudo ao carregar a página
tools/build.js   monta o site final em dist/ a partir de src/ + data/ + img/originais/
.github/         rotina que monta e publica o site a cada alteração na branch main
```

Toda alteração enviada ao GitHub (pelo painel ou pelo `git push`) dispara a rotina
"Publicar site", que monta tudo e publica em cerca de 1 minuto.
Acompanhe em: https://github.com/Ottavvi/pousada-site/actions

## Painel (/admin)

Feito com [Sveltia CMS](https://sveltiacms.app), para editar o conteúdo sem abrir o código
(até pelo celular). Só quem tem acesso ao repositório consegue salvar.
Para entrar, use **"Entrar Usando Token de Acesso"** (o botão "Entrar com GitHub" não funciona,
pois exigiria um servidor de login):

1. Crie um token em https://github.com/settings/personal-access-tokens/new
   - _Repository access_: só o repositório `pousada-site`
   - _Permissions → Contents_: **Read and write**
2. Cole o token na tela do painel. Ele fica salvo naquele navegador.

O que dá para editar: datas ocupadas, preços e fotos dos quartos, temporadas, pacotes,
perguntas frequentes, localização e passeios, avaliações, fotos, contatos, Pix e integrações.
Textos fixos (títulos das seções, descrições dos quartos, comodidades) ficam em
`src/index.html` (português) e `src/js/i18n.js` (inglês e espanhol).

## Rodar no computador

```bash
npm install
npm run dev     # monta e abre em http://localhost:8080
npm run build   # só monta em dist/
```

## Organização do código

- Cada arquivo de `src/js/` cuida de uma parte do site e é carregado em ordem pelo `src/index.html`
  (`config.js` e `util.js` primeiro, `main.js` por último). Para criar uma parte nova, adicione o
  arquivo, a tag `<script>` antes do `main.js` e a chamada `initAlgo()` dentro do `main.js`.
- Os estilos seguem a mesma ideia em `src/css/`, com uma tag `<link>` por arquivo.
- A formatação segue o [Prettier](https://prettier.io) (`.prettierrc.json`) e o `.editorconfig`:

```bash
npm run formatar            # formata tudo
npm run verificar-formato   # só confere
```

## Pix

Com a chave Pix preenchida no painel (Contato, Pix e configurações), a simulação de reserva
mostra o botão "Pagar sinal via Pix" com QR Code e Pix copia e cola já com o valor.
A confirmação **não é automática**: a pousada confere o pagamento no app do banco e o hóspede
envia o comprovante pelo WhatsApp.

## Domínio próprio

Troque o "Endereço do site" no painel (Contato, Pix e configurações) e configure o domínio em
Settings → Pages do repositório.
