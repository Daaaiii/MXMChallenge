# Fase 6: Persistencia com Backend

## Objetivo

Preparar o modulo financeiro para uma futura sincronizacao com backend, isolando a persistencia atual em uma camada de repositorio.

## Escopo Implementado

- Criado contrato `FinanceRepository`.
- Criado `LocalFinanceRepository` como implementacao local atual.
- Movida a leitura, escrita e normalizacao de estado financeiro para o repositorio local.
- `FinanceService` deixou de acessar diretamente `BrowserStorageService`.
- Mantida a chave por usuario autenticado no `FinanceService`.
- Mantido o comportamento atual com `localStorage`, sem migracao de dados e sem dependencia de backend nesta fase.

## Mudancas Tecnicas

- Novo arquivo `src/app/services/finance.repository.ts`.
- Novo arquivo `src/app/services/local-finance.repository.ts`.
- `FinanceService` agora chama:
  - `financeRepository.load(storageKey)`
  - `financeRepository.save(storageKey, state)`
- A normalizacao de dados antigos continua preservada para compatibilidade com estados salvos antes das fases atuais.

## Preparacao para API

Uma implementacao futura `ApiFinanceRepository` podera seguir o mesmo contrato:

```ts
load(storageKey: string): FinanceState;
save(storageKey: string, state: FinanceState): void;
```

Quando houver backend definido, o contrato pode evoluir para metodos assincronos com `Observable` ou `Promise`, incluindo:

- identificador real do usuario
- controle de conflito
- sincronizacao incremental
- migracao do estado local para API

## Testes

- Teste de estado vazio quando nao ha dados locais.
- Teste de persistencia usando a chave informada.
- Teste de normalizacao de dados legados.
- Suite existente do `FinanceService` preservada para garantir que as regras financeiras continuam iguais.

## Validacao

Comandos obrigatorios:

```bash
npm.cmd run build
npm.cmd test -- --watch=false --browsers=ChromeHeadless
```

## Criterios de Aceite

- Persistencia local continua funcionando.
- `FinanceService` nao depende diretamente de `BrowserStorageService`.
- Dados legados continuam normalizados.
- Build e testes passam.
- Backend real nao e implementado sem nova aprovacao.

## Proxima Etapa Recomendada

A proxima etapa recomendada e definir o contrato de backend financeiro:

- endpoints
- autenticacao
- modelo de sincronizacao
- migracao dos dados locais
- regras de conflito entre dispositivos

Essa etapa deve ser planejada e aprovada separadamente.
