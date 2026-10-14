# MaintFlow

MaintFlow é uma aplicação independente e genérica para acompanhamento de ordens de manutenção. O projeto usa JavaScript, Express, SQLite e uma interface HTML/CSS/ES Modules sem framework frontend.

Todos os dados incluídos são fictícios e sintéticos. O projeto não representa, não é afiliado e não é utilizado por qualquer organização específica.

## Executar localmente

```bash
npm install
npm run demo
npm start
```

Acesse http://localhost:3000.

O banco SQLite é criado automaticamente em `server/database/maintflow.sqlite` e recebe dados de demonstração quando está vazio. Para recarregar os exemplos:

```bash
npm run demo -- --reset
```

## Testes

```bash
npm test
npm run build
```

O backend expõe a API REST em `/api` e também serve os arquivos estáticos de `client/`. As regras de transição ficam no domínio do servidor; o navegador não usa `localStorage` como fonte de dados.
