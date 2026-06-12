# Plano de Acao: Backend Financeiro em .NET 10

## Summary

Atualizar o `D:\Projetos_pessoais\mxmBackend` para .NET 10 e implementar o modulo financeiro com snapshot + sync para atender o frontend local-first. A maquina ja tem SDK `10.0.301` e runtime ASP.NET Core `10.0.9`, entao a migracao pode ser feita sem instalar SDK adicional.

## Key Changes

- Migrar `MxmChallenge.csproj` de `net8.0` para `net10.0`.
- Atualizar pacotes ASP.NET/EF Core/JWT para versoes compativeis com .NET 10.
- Remover AutoMapper se a substituicao por mapeamento manual for simples.
- Criar `global.json` fixando SDK `10.0.301`.
- Criar entidades `FinanceSnapshot` e `FinanceSyncConflict`.
- Criar endpoints protegidos por JWT: `GET /api/finance/state`, `PUT /api/finance/state`, `POST /api/finance/sync` e `GET /api/health`.
- Implementar `IFinanceSyncService` e `FinanceSyncService`.
- Ajustar JWT para emitir e ler claims compativeis: `sub`, `nameidentifier`, `id`, `email`.
- Garantir serializacao camelCase global e preservacao do `StateJson`.

## Fases

1. Baseline e migracao para .NET 10.
2. Persistencia e DTOs financeiros.
3. Autenticacao auxiliar e infraestrutura HTTP.
4. Snapshot API.
5. Sync e conflitos.
6. Docker, migrations e documentacao.

## Test Plan

- `dotnet restore`
- `dotnet build`
- `dotnet ef migrations add AddFinanceSnapshotAndSyncConflict`
- `dotnet ef database update`
- Validar endpoints financeiros no Swagger com e sem JWT.
- Validar Docker com `docker compose up --build`.

## Assumptions

- O backend atual continua responsavel por autenticacao e usuarios.
- O modulo financeiro sera snapshot + sync, sem CRUD granular nesta fase.
- Exclusao logica so sera interpretada quando o cliente enviar `deletedAt`.
