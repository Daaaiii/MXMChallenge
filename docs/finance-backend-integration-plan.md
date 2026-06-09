# Plano de Integracao com Backend Financeiro

## Objetivo

Definir a proxima etapa do modulo financeiro: sair do modo exclusivamente local-first e preparar uma integracao real com backend, mantendo compatibilidade com os dados ja salvos no navegador.

Este documento nao implementa a API. Ele registra o contrato recomendado, a estrategia de migracao e os riscos que precisam ser aprovados antes de alterar o comportamento da aplicacao.

## Estado Atual

- O modulo financeiro usa `FinanceService` para regras de negocio.
- A persistencia foi isolada em `FinanceRepository`.
- A implementacao ativa e `LocalFinanceRepository`, usando `localStorage`.
- O estado financeiro completo fica em `FinanceState`.
- A chave local usa o usuario autenticado como parte de `FinanceState:{usuario}`.

## Decisao Recomendada

A integracao com backend deve ser feita em duas etapas:

1. Evoluir o contrato de repositorio para um modelo assincrono.
2. Implementar `ApiFinanceRepository` com fallback local controlado.

Essa separacao reduz risco porque permite testar o contrato novo antes de depender de endpoints reais.

## Contrato Recomendado

O contrato atual e sincronico:

```ts
load(storageKey: string): FinanceState;
save(storageKey: string, state: FinanceState): void;
```

Para backend real, o contrato recomendado e:

```ts
load(userId: string): Observable<FinanceState>;
save(userId: string, state: FinanceState): Observable<FinanceState>;
sync(userId: string, localState: FinanceState): Observable<FinanceSyncResult>;
```

Tipos sugeridos:

```ts
export interface FinanceSyncResult {
  state: FinanceState;
  source: 'local' | 'remote' | 'merged';
  conflicts: FinanceSyncConflict[];
}

export interface FinanceSyncConflict {
  entity: 'income' | 'expense' | 'card' | 'goal' | 'account' | 'investment';
  entityId: string;
  field: string;
  localValue: unknown;
  remoteValue: unknown;
}
```

## Endpoints Sugeridos

### Estado Consolidado

- `GET /api/finance/state`
- `PUT /api/finance/state`
- `POST /api/finance/sync`

Essa abordagem e mais simples para a primeira versao com backend, porque o frontend ja trabalha com `FinanceState` completo.

### CRUD Granular Futuro

- `GET /api/finance/accounts`
- `POST /api/finance/accounts`
- `PUT /api/finance/accounts/{id}`
- `DELETE /api/finance/accounts/{id}`
- repetir o mesmo padrao para:
  - incomes
  - expenses
  - cards
  - goals
  - investments

O CRUD granular melhora performance e auditoria, mas aumenta a complexidade inicial.

## Estrategia de Migracao

1. Ao logar, carregar estado local.
2. Consultar estado remoto.
3. Se remoto nao existir, enviar estado local para criar o primeiro snapshot.
4. Se remoto existir e local estiver vazio, preencher local com remoto.
5. Se ambos existirem, executar sincronizacao.
6. Registrar conflitos quando o mesmo registro tiver sido alterado localmente e remotamente.
7. Manter backup local antes da primeira migracao.

## Controle de Conflitos

Para a primeira versao, a regra recomendada e:

- registros novos em qualquer origem sao preservados.
- registros deletados localmente devem ganhar marca de exclusao futura, em vez de sumirem imediatamente.
- conflitos de edicao usam `updatedAt` quando esse campo existir.
- sem `updatedAt`, preferir remoto e registrar conflito.

Para isso, uma fase futura deve adicionar metadados nas entidades:

```ts
createdAt: string;
updatedAt: string;
deletedAt?: string;
version: number;
```

## Autenticacao

A API deve usar o token ja emitido pelo fluxo atual de autenticacao.

Regras:

- `Authorization: Bearer <token>` via interceptor.
- Backend identifica o usuario pelo token, nao pelo nome salvo em `localStorage`.
- O frontend nao deve enviar `storageKey` para a API.
- O `userId` usado pelo repositorio deve vir do usuario autenticado ou do backend.

## Plano de Implementacao Proposto

### Etapa 1: Preparar Contrato Assincrono

Documento da etapa aprovada: [finance-backend-step-1-async-repository.md](finance-backend-step-1-async-repository.md).

- Alterar `FinanceRepository` para retornar `Observable`.
- Adaptar `LocalFinanceRepository` para usar `of(...)`.
- Adaptar `FinanceService` para inicializacao assíncrona.
- Manter todos os calculos financeiros iguais.
- Adicionar testes de carregamento assíncrono.

### Etapa 2: Metadados de Sincronizacao

Documento da etapa aprovada: [finance-backend-step-2-sync-metadata.md](finance-backend-step-2-sync-metadata.md).

- Adicionar `createdAt`, `updatedAt`, `deletedAt?` e `version`.
- Normalizar dados antigos preenchendo metadados ausentes.
- Atualizar CRUD local para manter `updatedAt` e `version`.
- Testar compatibilidade com dados antigos.

### Etapa 3: ApiFinanceRepository

- Criar `ApiFinanceRepository`.
- Configurar URL em `environment`.
- Implementar `GET /state` e `PUT /state`.
- Adicionar fallback local em caso de indisponibilidade da API.
- Testar com `HttpTestingController`.

### Etapa 4: Migracao Local para Remoto

- Detectar primeiro acesso apos backend.
- Enviar snapshot local quando remoto estiver vazio.
- Salvar flag local de migracao concluida.
- Exibir feedback visual de sincronizacao.

### Etapa 5: Sincronizacao e Conflitos

- Implementar endpoint de sync.
- Implementar merge simples.
- Registrar conflitos para tratamento futuro.
- Exibir alerta quando houver conflito nao resolvido.

## Criterios de Aceite

- A aplicacao continua funcionando offline com repositorio local.
- O backend pode ser ativado por configuracao de ambiente.
- Dados locais existentes nao sao perdidos.
- Build e testes passam a cada etapa.
- Nenhuma chamada real de API e adicionada sem endpoints definidos.

## Perguntas em Aberto

- O backend financeiro sera no mesmo dominio da API atual?
- A API atual permite criar novos endpoints financeiros?
- O modelo desejado e snapshot completo ou CRUD granular desde o inicio?
- O usuario tera uso em multiplos dispositivos?
- O sistema precisa de auditoria de alteracoes financeiras?
- Havera exclusao definitiva ou lixeira/snapshot historico?

## Proxima Acao Recomendada

Antes de implementar codigo novo, aprovar a **Etapa 1: Preparar Contrato Assincrono**.

Essa etapa muda a arquitetura interna, mas ainda nao depende de backend real.
