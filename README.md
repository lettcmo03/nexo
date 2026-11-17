# Nexo CRM · Prova prática P2 (Laboratório Front End)

Projeto **novo** feito com **Vite + React + TypeScript**, com autenticação e consumo da API local `servidor-crm`. Implementação baseada no enunciado *Prova prática P2 · CRM de clientes (17/11/2026)*.

> **Link do repositório GitHub:** https://github.com/lettcmo03/nexo
> Substitua o texto acima pelo link real depois de criar o repositório. Não há um repositório publicado automaticamente.

## Como executar

### 1. Ligar a API fornecida pela professora

Em **outro terminal**, dentro da pasta **original** `servidor-crm` distribuída pela professora:

```bash
cd servidor-crm
npm install
npm start
```

API esperada: `http://localhost:3333`. Para restaurar a base de testes, **pare o servidor** e use `npm run reset` dentro da pasta `servidor-crm`.

**API oficial recebida e conferida:** o projeto foi ajustado após a disponibilização do `servidor-crm.zip` da professora. O serviço real salva dados em JSON e exige o token Bearer em todas as rotas privadas. O ZIP do AVA contém **apenas este front-end**, conforme instruído no enunciado. O servidor fica em uma pasta separada e não precisa ser modificado.

### 2. Instalar e iniciar o front-end

Em **outro terminal**, dentro desta pasta `crm-clientes`:

```bash
npm install
npm run dev
```

Abra a URL exibida pelo Vite, normalmente `http://localhost:5173`.

A variável de ambiente já está em `.env`:

```dotenv
VITE_API_URL=http://localhost:3333
```

Edite se a sua API estiver em outro endereço e **reinicie `npm run dev`**. Nenhuma URL fixa da API foi inserida no serviço: todas as requisições usam `import.meta.env.VITE_API_URL`.

### 3. Entrar

- Usuário: `emilys`
- Senha: `emilyspass`

O login chama `POST /auth/login`, salva `accessToken` em `localStorage` e recupera o nome real do atendente com `GET /auth/me`.

### 4. Gerar build para entrega

```bash
npm run build
```

O comando verifica o TypeScript e gera `dist/`. **Não inclua `node_modules` no ZIP**. Entregue o ZIP no AVA e cole o link do novo repositório GitHub no campo/comentário da tarefa.

## Identidade visual — edição lilás

- Tema próprio **lavanda + ameixa + verde-sálvia**, com menu lateral claro, layout leve, microanimações e **favicon roxo `public/favicon.svg`**.
- **Gráfico de movimento mensal** no Painel (botões 6/12 meses), calculado dos pedidos retornados pela API e sem contar pedidos cancelados.
- **Resumo em tabela** dos últimos quatro meses apresentados no gráfico, também com valores reais.
- **Exportar CSV** na página **Todos os pedidos**: gera uma planilha compatível com Excel, com nome do cliente, status, itens, data e valor. A exportação segue os filtros e a ordenação da lista na tela.
- Não foram adicionadas novas bibliotecas. Nada muda nas rotas, autenticação, persistência ou regras da professora.
- As animações são desligadas automaticamente quando o sistema solicita *reduzir movimento*.

## Funcionalidades incluídas

| Requisito | Implementação |
|---|---|
| Login e rotas protegidas | Token Bearer, `/auth/me`, erro de senha, sair e retorno à rota originalmente solicitada |
| Painel | Total de clientes, total vendido, ticket médio, pedidos por status (quantidade/valor), Top 3 clientes e atalho Novo cliente |
| Clientes | Busca por nome/e-mail consultando API; paginação real `limit=5&skip`; carregando, vazio e erro |
| Detalhe do cliente | Dados, selo VIP/Regular/Sem compras, edição, exclusão com contagem de pedidos e atendimentos |
| Formulário de cliente | Nome + e-mail válido obrigatórios, pelo menos 2 entre telefone, empresa e cidade |
| Pedidos do cliente | Criar com itens, calcular `preco × quantidade`, editar itens de pedidos em aberto, status permitidos e exclusão com confirmação |
| Histórico | Listar do mais recente ao mais antigo, filtrar canais, contador filtrado, criar, editar, excluir |
| Todos os pedidos | Nome do cliente, filtros por status e faixa de valor, ordenação por data/total, link ao cliente |
| Erros e sessão | HTTP 400, 401, 404, 409, 500/sem rede com mensagem; sessão expirada leva ao login |
| Rotas não encontradas | Aviso amigável em `/xyz` e `Cliente não encontrado` em `/clientes/999` |
| Usabilidade | Layout responsivo (inclusive largura de 375px), menu móvel e botões com ação |

## Regras de negócio

- **Total do pedido** é calculado no front-end com `reduce`: soma de `preco × quantidade` de cada item.
- **Total vendido** e **ticket médio** ignoram os pedidos `cancelado`. Ticket médio = total vendido / quantidade de pedidos não cancelados.
- **Por status** mostra quantidade e valor dos pedidos de cada status, inclusive o valor dos cancelados na categoria cancelado.
- **Selo VIP**: total comprado não cancelado ≥ R$ 2.000; **Regular**: existe compra válida abaixo desse valor; **Sem compras**: nenhuma compra válida.
- **Top 3**: clientes de maior total comprado, excluindo pedidos cancelados.
- **Status:** `aberto` → `pago` ou `cancelado`; `pago` → `cancelado`; `cancelado` não muda. Edição de itens só em pedidos abertos.
- **Exclusão do cliente** confirma quantos pedidos/atendimentos serão apagados.
- **Atualização**: após mutação, o detalhe é carregado novamente; Painel e lista buscam dados novos ao navegar para suas páginas.

## Rotas HTTP consumidas

- `POST /auth/login` e `GET /auth/me`.
- `GET /clientes?q=&limit=&skip=`, `GET /clientes/:id`, `POST /clientes`, `PATCH /clientes/:id`, `DELETE /clientes/:id`.
- `GET /pedidos`, `GET /clientes/:id/pedidos`, `POST /clientes/:id/pedidos`, `PATCH /pedidos/:id`, `DELETE /pedidos/:id`.
- `GET /clientes/:id/atendimentos`, `POST /clientes/:id/atendimentos`, `PATCH /atendimentos/:id`, `DELETE /atendimentos/:id`.

Todas as rotas privadas enviam `Authorization: Bearer <accessToken>`. O tratamento dos status HTTP está em `src/lib/api.ts`; os cálculos puros estão em `src/lib/utils.ts`.

## Organização

```text
crm-clientes/
  .env                 # VITE_API_URL
  .env.example
  index.html
  package.json
  vite.config.ts
  scripts/testar-api.mjs   # teste automatizado com API original ligada
  tsconfig*.json
  src/
    App.tsx            # definição das rotas protegidas
    main.tsx           # BrowserRouter + providers
    types.ts           # interfaces TypeScript
    styles.css         # estilos originais e responsividade
    theme.css          # nova identidade visual e animações
    lib/relatorios.ts  # gráfico mensal e exportação CSV
    lib/
      api.ts           # chamadas da API, token e erros
      utils.ts         # totais, selo, top 3, datas e validações
    context/
      AuthContext.tsx  # login/logout/me/sessão
      DataContext.tsx  # atualização compartilhada
    components/
      Layout.tsx
      UI.tsx
      OrderPanel.tsx
      HistoryPanel.tsx
    pages/
      LoginPage.tsx
      DashboardPage.tsx
      ClientsPage.tsx
      ClientDetailPage.tsx
      ClientFormPage.tsx
      OrdersPage.tsx
      NotFoundPage.tsx
```

## Compatibilidade com o servidor oficial (conferida em 17/11/2026)

O código original do servidor, `server.js` e `README.md`, foi inspecionado. Os formatos reais são:

- `POST /auth/login` devolve `{ accessToken, id, username, nome }` e `GET /auth/me` devolve `{ id, username, nome }`.
- `GET /clientes` devolve `{ clientes, total, skip, limit }`; cada cliente possui `id`, `nome`, `email` e os campos opcionais `telefone`, `empresa`, `cidade`.
- `GET /pedidos` e `GET /clientes/:id/pedidos` devolvem `{ pedidos, total }`; cada pedido contém `clienteId`, `data` no formato `AAAA-MM-DD`, `status` e `itens` (`titulo`, `preco`, `quantidade`, `id`). Não há total calculado no servidor.
- `GET /clientes/:id/atendimentos` devolve `{ atendimentos, total }`; o canal usa os valores `telefone`, `email`, `whatsapp`, `presencial`. A data também é `AAAA-MM-DD`.
- A API grava todas as alterações na pasta `servidor-crm/data/` e retorna mensagens de erro em `{ message }`.

**Verificações realizadas:** foram exercitadas 26 verificações diretas contra os manipuladores de rotas originais e 41 verificações HTTP com o script `testar-api.mjs`, utilizando um adaptador local que simula apenas a camada Express e executa o `server.js` original, em cópias isoladas dos dados. Isso cobriu autenticação, paginação, CRUD e códigos 400/401/404/409. Os cálculos do front foram executados com os arquivos JSON oficiais (12 clientes, 26 pedidos), incluindo totais/status/selo/Top 3. As datas foram validadas no fuso `America/Sao_Paulo`. Os testes HTTP de verdade com o Express instalado ainda devem ser feitos no seu computador.

**Validação do front nesta versão:** como este ambiente não conseguiu instalar as dependências do npm, o build e os testes de clique desta revisão visual precisam ser conferidos no seu computador. A versão anterior do projeto já havia passado no `npm run build` no VS Code da usuária; **rode novamente o comando depois de atualizar o front-end**.

### Teste de integração automático (opcional)

Com o backend já rodando em outro terminal:

```bash
npm run testar:api
```

O script `scripts/testar-api.mjs` faz requisições HTTP de verdade ao servidor, cria registros **temporários** com um nome exclusivo, testa operações e tenta apagar esses registros ao final. Se a conexão falhar durante a execução, confira os dados do servidor antes de repetir.

### Atenção ao trocar o projeto no VS Code

1. **Pare apenas o terminal do front-end** com `Ctrl + C`; mantenha o servidor `servidor-crm` rodando.
2. Substitua a pasta **`crm-clientes`** pela pasta de mesmo nome deste ZIP; **não substitua a pasta `servidor-crm`** para não perder os registros de testes criados no seu computador.
3. No terminal da nova pasta `crm-clientes`, rode `npm install`, `npm run dev` e, antes de enviar, `npm run build`.
4. Caso a página pareça antiga, recarregue com `Ctrl + Shift + R`.

## Checklist antes da entrega

- [ ] Rodei `npm install` e `npm start` dentro do servidor da professora.
- [ ] Rodei `npm install` e `npm run dev` no front.
- [ ] Rodei `npm run testar:api` com a API original ligada (opcional, mas recomendado).
- [ ] Entrei usando `emilys` / `emilyspass`; senha errada mostra erro.
- [ ] Criei e editei cliente; testei e-mail repetido (409).
- [ ] Criei pedido, editei os itens em aberto, marquei pago/cancelado e excluí.
- [ ] Criei/editei/excluí atendimento e usei o filtro de canal.
- [ ] Testei o selo VIP (R$ 2.000+) e o Top 3 sem cancelados.
- [ ] Abri `/xyz` e `/clientes/999`.
- [ ] Reiniciei o backend para verificar a volta ao Login quando o token expira.
- [ ] Recarreguei a página e confirmei que o backend persistiu as mudanças.
- [ ] Abri DevTools em 375px e confirmei ausência de rolagem lateral.
- [ ] Rodei `npm run build` sem erro.
- [ ] Criei um **repositório novo** no GitHub, fiz commits e colei a URL real no topo deste README.
- [ ] Enviei o ZIP sem `node_modules` pelo AVA antes do prazo.

**Disciplina:** Laboratório de Programação Front End · Engenharia de Software · 2026.2
