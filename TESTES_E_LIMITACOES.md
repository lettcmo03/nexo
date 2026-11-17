# Testes e limitações · integração com o servidor da professora

## Verificações realizadas neste ambiente

- `server.js` e `servidor-crm/README.md` oficiais foram lidos e os campos/rotas conferidos.
- Foram executadas **26 verificações** contra os manipuladores de rotas do servidor original, utilizando implementações simuladas do Express para acionar os manipuladores e **dados JSON copiados para uma pasta temporária**, sem modificar o backend original. Incluíram 400, 401, 404, 409, login, `/auth/me`, paginação, pedidos, criação/edição/exclusão de clientes e atendimentos, e exclusão em cascata.
- O script `scripts/testar-api.mjs` passou em **41 verificações HTTP** em um adaptador local de teste que substitui apenas a camada Express e executa o `server.js` original com dados isolados. Não equivale a rodar o Express real instalado.
- Foram executados testes das funções puras TypeScript do front com os arquivos reais de `clientes.json` (12 registros) e `pedidos.json` (26 registros). Total vendido, ticket médio, Top 3 e selos passaram nas verificações. Também foi testada a exibição de datas `AAAA-MM-DD` em `America/Sao_Paulo`.
- Os 18 arquivos-fonte TypeScript/TSX foram analisados sintaticamente pelo compilador TypeScript, sem erros de parsing; o script de integração `.mjs` passou em `node --check`.

## Testes restantes no computador do aluno

**Não foi possível instalar React/Vite/Express nesta execução:** DNS para `registry.npmjs.org` estava indisponível. Portanto, **não** afirmamos que `npm run build`, o teste HTTP real contra o Express ou os testes visuais em 375px foram executados aqui.

1. Ligue `servidor-crm` (`npm install`, `npm start`).
2. No front, `npm install`, `npm run testar:api` (faz HTTP real e registros temporários), `npm run dev`.
3. Abra no navegador e teste as telas, especialmente erros, sessão expirada, salvar e atualizar.
4. Rode `npm run build` e corrija qualquer erro antes da entrega.

O pacote para **entrega** contém só o front-end. No pacote **para rodar**, o backend está idêntico ao ZIP enviado pela professora.
