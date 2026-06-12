# Backend Financeiro em C# - Estado Implementado

## Summary

O backend financeiro foi implementado no projeto existente `D:\Projetos_pessoais\mxmBackend`, atualizado para **.NET 10**, com **ASP.NET Core**, **Entity Framework Core**, **SQL Server**, **Docker Compose** e autenticacao por **JWT**.

O modulo usa persistencia por snapshot completo de `FinanceState` e sincronizacao local-first, mantendo compatibilidade com o frontend Angular.

## Local do Backend

```text
D:\Projetos_pessoais\mxmBackend
```

Este documento fica no projeto frontend apenas como referencia historica e operacional da integracao.

## Decisoes Implementadas

- O backend financeiro foi incorporado ao `mxmBackend` existente, junto dos endpoints de autenticacao e usuario.
- O projeto foi migrado para `net10.0` com SDK fixado em `global.json`.
- O AutoMapper foi removido e substituido por mapeamento manual no repositorio de usuario.
- O banco usado e SQL Server via EF Core.
- O deploy/teste local pode ser feito por `docker-compose.yml` com API + SQL Server.
- A API identifica o usuario pelo JWT, sem receber `storageKey` do frontend.
- A persistencia inicial e por snapshot completo, sem CRUD granular.
- A sincronizacao usa `updatedAt`, `deletedAt`, `version` e registro de conflitos.

## Endpoints Entregues

Todos os endpoints financeiros exigem `Authorization: Bearer <token>`.

- `GET /api/health`
- `GET /api/finance/state`
- `PUT /api/finance/state`
- `POST /api/finance/sync`

## Persistencia

### FinanceSnapshots

Armazena um snapshot financeiro por usuario.

Campos principais:

- `Id`
- `UserId`
- `StateJson`
- `Version`
- `CreatedAt`
- `UpdatedAt`

Regra:

- Um usuario possui no maximo um snapshot ativo.
- `Version` incrementa a cada persistencia remota bem-sucedida.
- `StateJson` preserva o shape camelCase do frontend.

### FinanceSyncConflicts

Registra conflitos detectados durante sincronizacao.

Campos principais:

- `Id`
- `UserId`
- `Entity`
- `EntityId`
- `Field`
- `LocalValueJson`
- `RemoteValueJson`
- `Resolved`
- `CreatedAt`

## Contrato Financeiro

O `FinanceState` sincronizado contem:

```json
{
  "incomes": [],
  "expenses": [],
  "cards": [],
  "goals": [],
  "accounts": [],
  "investments": []
}
```

As entidades podem carregar metadados:

- `createdAt`
- `updatedAt`
- `deletedAt`
- `version`

## Frontend Integrado

O frontend implementa `ApiFinanceRepository` com fallback local.

Fluxo atual:

- Sem token ou com API indisponivel, usa `LocalFinanceRepository`.
- Com token, consulta `GET /api/finance/state`.
- Se remoto nao existe e ha dados locais, migra com `PUT /api/finance/state`.
- Se remoto existe e local esta vazio, baixa o remoto.
- Se local e remoto existem, chama `POST /api/finance/sync`.
- A versao remota e salva em `FinanceState:{usuario}:ServerVersion`.

## Validacoes Executadas

Backend:

```bash
dotnet restore
dotnet build
dotnet ef migrations add AddFinanceSnapshotAndSyncConflict
dotnet ef database update
docker compose up -d --build
```

Frontend:

```bash
npm.cmd run build
npm.cmd test -- --watch=false --browsers=ChromeHeadless
```

Smoke test realizado:

- Docker subiu API em `http://localhost:8080`.
- SQL Server subiu em `localhost:1433`.
- `GET /api/health` retornou banco acessivel.
- `GET /api/finance/state` sem token retornou `401`.
- Usuario de teste autenticado salvou e carregou snapshot.
- `POST /api/finance/sync` retornou `source: local`, `serverVersion: 2`, sem conflitos.

## Proximas Evolucoes

- Criar testes automatizados no backend para `FinanceSyncService`.
- Exibir status visual de sincronizacao no frontend.
- Exibir conflitos pendentes para o usuario quando `conflicts.length > 0`.
- Planejar CRUD granular somente se houver necessidade de performance, auditoria ou edicao colaborativa mais fina.
