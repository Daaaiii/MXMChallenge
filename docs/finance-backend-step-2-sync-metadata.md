# Backend Financeiro: Etapa 2 - Metadados de Sincronizacao

## Objetivo

Preparar as entidades financeiras para sincronizacao futura com backend, adicionando metadados de criacao, atualizacao, exclusao logica e versionamento.

## Escopo Implementado

- Adicionado `FinanceSyncMetadata`.
- Entidades financeiras passaram a aceitar:
  - `createdAt`
  - `updatedAt`
  - `deletedAt`
  - `version`
- Entidades cobertas:
  - contas
  - entradas
  - despesas
  - cartoes
  - metas
  - contribuicoes de metas
  - investimentos
- Dados antigos sao normalizados ao carregar.
- Novos registros recebem metadados automaticamente.
- Edicoes preservam `createdAt`, atualizam `updatedAt` e incrementam `version`.
- `deletedAt` foi preparado no modelo, mas exclusao logica ainda nao foi ativada.

## Comportamento Atual

- A aplicacao continua local-first.
- Exclusoes continuam removendo registros fisicamente, como antes.
- O backend real ainda nao foi implementado.
- A normalizacao preenche metadados ausentes usando a data do proprio registro quando possivel.

## Mudancas Tecnicas

- `FinanceSyncMetadata` foi adicionado em `src/app/models/finance.ts`.
- `LocalFinanceRepository` normaliza entidades antigas e legadas com metadados.
- `FinanceService` usa helpers internos para:
  - criar registros versionados
  - atualizar registros preservando historico minimo

## Testes

- Normalizacao de lancamentos legados com metadados.
- Normalizacao de estado existente com metadados.
- Criacao de registro com `version = 1`.
- Edicao de registro incrementando `version`.

## Validacao

Comandos obrigatorios:

```bash
npm.cmd run build
npm.cmd test -- --watch=false --browsers=ChromeHeadless
```

## Criterios de Aceite

- Build passa.
- Testes passam.
- Dados antigos continuam carregando.
- Registros novos recebem metadados.
- Edicoes incrementam versao.
- Nenhuma API real e chamada.

## Proxima Etapa Recomendada

A proxima etapa recomendada e **Etapa 3: ApiFinanceRepository**.

Ela deve criar a implementacao HTTP usando endpoints configuraveis por ambiente, mas ainda pode manter fallback local enquanto o backend real nao estiver disponivel.
