# MemCode UI

## Resumo

Aplicação de frontend do MemCode, desenvolvida em React e TypeScript. Permite que usuários criem contas, autentiquem-se e salvem, organizem, pesquisem e comentem trechos de código. A interface consome a API FastAPI; em desenvolvimento local, o endereço é configurado por `VITE_API_BASE_URL`.

## Sumário

- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Configuração e execução local](#configuração-e-execução-local)
- [Scripts disponíveis](#scripts-disponíveis)
- [Aplicação completa com Docker Compose](#aplicação-completa-com-docker-compose)

## Tecnologias

- **[React](https://react.dev/)** — Biblioteca para construção da interface de usuário
- **[TypeScript](https://www.typescriptlang.org/)** — Tipagem estática para maior segurança e previsibilidade no código
- **[Vite](https://vite.dev/)** — Bundler e servidor de desenvolvimento rápido
- **[Tailwind CSS v4](https://tailwindcss.com/)** — Estilização utilitária responsiva
- **[Oxlint](https://oxc.rs/)** — Linter de alta performance para análise estática

## Pré-requisitos

- **Node.js** (versão 20+ recomendada)
- **npm**
- API backend do MemCode acessível (localmente ou pela URL configurada)

## Configuração e execução local

Na pasta `frontend/`, crie a configuração local, instale as dependências e inicie o Vite:

```sh
cp .env.example .env
npm ci
npm run dev
```

O arquivo `.env.example` configura `VITE_API_BASE_URL=http://localhost:8000`. Garanta que a API local esteja em execução nesse endereço, ou altere `VITE_API_BASE_URL` para o endereço apropriado. O Vite informa no terminal o endereço local da interface.

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento Vite |
| `npm run build` | Executa a verificação TypeScript e gera a build de produção |
| `npm run lint` | Analisa o código com Oxlint |
| `npm run preview` | Serve localmente a build de produção |

## Aplicação completa com Docker Compose

Para executar frontend, Nginx, três instâncias do backend e MongoDB em conjunto, siga as instruções de clone e configuração do [README principal](../README.md#clonar-configurar-e-buildar). No Compose, o frontend usa `/api` e o Nginx encaminha essas chamadas para os backends.