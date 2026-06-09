# Backend Financeiro: Etapa 1 - Contrato Assincrono

## Objetivo

Preparar a camada de persistencia financeira para backend real, convertendo o contrato de repositorio para operacoes assincronas sem ativar chamadas HTTP.

## Escopo Implementado

- `FinanceRepository` agora retorna `Observable<FinanceState>`.
- `LocalFinanceRepository` continua usando `localStorage`, mas encapsula leitura e escrita com `of(...)`.
- `FinanceService` inicia com estado vazio e carrega o estado salvo por assinatura.
- Salvamentos passam pelo repositorio e atualizam o estado apos a resposta.
- Nenhuma tela foi alterada nesta etapa.
- Nenhuma API real foi chamada.

## Mudancas Tecnicas

Contrato atualizado:

```ts
load(userKey: string): Observable<FinanceState>;
save(userKey: string, state: FinanceState): Observable<FinanceState>;
```

Implementacao local:

- `load` le e normaliza o estado salvo.
- `save` grava no storage e retorna o estado salvo.
- Dados legados continuam normalizados.

## Compatibilidade

- A aplicacao continua local-first.
- O estado ainda usa a chave `FinanceState:{usuario}`.
- O componente financeiro continua consumindo `FinanceService` da mesma forma.
- O caminho para `ApiFinanceRepository` fica mais simples, porque HTTP no Angular ja trabalha naturalmente com `Observable`.

## Testes

- Testes do repositório local foram atualizados para aguardar `Observable`.
- Suite existente do financeiro continua cobrindo as regras de negocio.

## Validacao

Comandos obrigatorios:

```bash
npm.cmd run build
npm.cmd test -- --watch=false --browsers=ChromeHeadless
```

## Criterios de Aceite

- Build passa.
- Testes passam.
- Persistencia local continua funcionando.
- `FinanceService` nao acessa storage diretamente.
- Nenhuma dependencia de backend real e adicionada.

## Proxima Etapa Recomendada

A proxima etapa recomendada e **Etapa 2: Metadados de Sincronizacao**.

Ela deve adicionar `createdAt`, `updatedAt`, `deletedAt?` e `version` nas entidades financeiras para permitir merge e controle de conflitos quando a API real existir.
