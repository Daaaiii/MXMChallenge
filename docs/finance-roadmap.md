# Roadmap do Modulo Financeiro

## Visao Geral

O modulo financeiro do MXMChallenge nasceu local-first e agora possui integracao real com backend. A tela `/finance` contempla dashboard, contas, entradas, despesas, cartoes, faturas, metas/reservas, investimentos e graficos.

Este documento registra a trilha de evolucao, o estado atual e as proximas fases recomendadas.

## Estado Atual

- Frontend Angular com `FinanceService`, `FinanceRepository`, `LocalFinanceRepository` e `ApiFinanceRepository`.
- Persistencia local browser-safe via `localStorage`.
- Backend C# no projeto `D:\Projetos_pessoais\mxmBackend`, migrado para .NET 10.
- API financeira protegida por JWT.
- Persistencia remota por snapshot completo de `FinanceState`.
- Sincronizacao via `POST /api/finance/sync`.
- Fallback local quando nao ha token ou quando a API esta indisponivel.
- Migracao inicial de dados locais para backend quando o usuario autenticado ainda nao tem snapshot remoto.

## Validacao Padrao

Ao final de fases funcionais no frontend:

```bash
npm.cmd run build
npm.cmd test -- --watch=false --browsers=ChromeHeadless
```

Ao final de fases funcionais no backend:

```bash
dotnet restore
dotnet build
dotnet test
dotnet ef database update
```

## Fases Concluidas

### Fase 1: Validacao e Base

- Roadmap salvo em `docs/finance-roadmap.md`.
- Build e testes usados como criterio de aceite.
- Funcionalidades financeiras existentes preservadas.

### Fase 2: Exclusao e CRUD Completo

- Exclusao segura para entidades financeiras.
- Bloqueios para dependencias perigosas.
- Feedback visual para sucesso, erro e bloqueio.

### Fase 3: Conta Corrente e Saldo Real

- Saldo por conta.
- Resumo de patrimonio.
- Vinculo de contas a entradas, metas e investimentos.

### Fase 4: Investimentos e Reservas

- Campos de rentabilidade, indexador, liquidez e vencimento.
- Calculo de ganho/perda nominal e percentual.
- Agrupamento de investimentos.

### Fase 5: UX, Filtros e Organizacao

- Melhorias para listas maiores.
- Filtros e refinamentos de usabilidade.
- Feedback visual nos fluxos principais.

### Fase 6: Persistencia com Backend

- Camada `FinanceRepository`.
- `LocalFinanceRepository` preservando comportamento offline.
- Contrato assincrono por `Observable`.
- Metadados de sincronizacao nas entidades financeiras.

## Integracao Backend Entregue

### Backend

- Projeto `mxmBackend` atualizado para .NET 10.
- Entidades `FinanceSnapshot` e `FinanceSyncConflict`.
- Migration `AddFinanceSnapshotAndSyncConflict`.
- Endpoints:
  - `GET /api/health`
  - `GET /api/finance/state`
  - `PUT /api/finance/state`
  - `POST /api/finance/sync`
- Docker Compose com API + SQL Server.
- JWT ajustado para claims `sub`, `nameidentifier`, `id` e `email`.
- Testes automatizados para regras de merge e isolamento por usuario nos endpoints financeiros.
- Testes automatizados para emissao e leitura de claims JWT usados pelo modulo financeiro.

### Frontend

- `ApiFinanceRepository` integrado a `environment.apiUrl`.
- `FINANCE_REPOSITORY` como token de injecao para alternar entre API e local.
- Fallback local sem token ou com falha de API.
- Migracao local para remoto quando o remoto nao existe.
- Sync quando local e remoto existem.
- `serverVersion` salvo em `FinanceState:{usuario}:ServerVersion`.
- Indicador visual de sincronizacao na tela financeira.
- Painel de conflitos quando o backend retorna `conflicts`.

## Validacoes Recentes

Backend:

- `dotnet build` passou em `net10.0`.
- `dotnet ef database update` aplicado no SQL Server em Docker.
- `GET /api/health` retornou banco acessivel.
- Snapshot e sync autenticados foram testados manualmente.
- `dotnet test MxmChallenge.sln --no-restore` passou com 13 testes.
- Smoke test `scripts\validate-finance-e2e.ps1` validou cadastro, login, snapshot, sync e cleanup contra `http://localhost:8080`.
- Smoke test `scripts\validate-finance-conflict.ps1` validou merge divergente, conflito retornado e cleanup contra `http://localhost:8080`.

Frontend:

- `npm.cmd test -- --watch=false --browsers=ChromeHeadless` passou com 79 testes.
- `npm.cmd run build` passou.
- Angular dev server respondeu `200` em `http://127.0.0.1:4200`.

## Proximas Fases Recomendadas

1. Planejar testes de integracao HTTP com `WebApplicationFactory` quando a dependencia `Microsoft.AspNetCore.Mvc.Testing` estiver disponivel.
2. Planejar automacao de navegador para login + `/finance` quando Playwright/Cypress estiver disponivel no frontend.
3. Planejar CRUD granular apenas se houver necessidade real de performance, auditoria ou edicao colaborativa mais fina.

## Documentos Relacionados

- [finance-backend-action-plan.md](finance-backend-action-plan.md)
- [finance-backend-integration-plan.md](finance-backend-integration-plan.md)
- [csharp-finance-backend-plan.md](csharp-finance-backend-plan.md)
