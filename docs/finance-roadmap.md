# Roadmap do Modulo Financeiro

## Visao Geral

O modulo financeiro do MXMChallenge esta em modo local-first, persistindo dados no navegador por usuario autenticado. A tela `/finance` ja contempla dashboard, contas, entradas, despesas, cartoes, faturas, metas/reservas, investimentos e graficos.

Este documento organiza a evolucao do modulo por fases. Cada fase deve ser aprovada separadamente antes da implementacao. Ao concluir uma fase, devem ser apresentados resumo, arquivos alterados, validacoes executadas e riscos restantes.

## Estado Atual

- Persistencia local via `localStorage`, encapsulada pelo servico browser-safe.
- Estado financeiro com `incomes`, `expenses`, `cards`, `goals`, `accounts` e `investments`.
- Entradas com data, categoria, recorrencia e conta de destino opcional.
- Despesas com dinheiro, Pix ou cartao; compras de cartao podem ser parceladas.
- Cartoes com limite, fechamento, vencimento, fatura do mes e limite comprometido.
- Metas/reservas com contribuicoes, progresso e conta vinculada.
- Investimentos com tipo, instituicao, conta, valor aplicado, valor atual e datas.
- Dashboard com mes de referencia, lancamentos, alertas e indicadores principais.

## Regra de Execucao

- A implementacao deve seguir a ordem das fases.
- Nenhuma fase futura deve ser executada sem aprovacao explicita.
- Mudancas funcionais devem vir acompanhadas de testes focados.
- Ao final de cada fase, rodar:

```bash
npm.cmd run build
npm.cmd test -- --watch=false --browsers=ChromeHeadless
```

## Fase 1: Validacao e Base

### Objetivo

Estabilizar o modulo atual, salvar a documentacao do roadmap e garantir que build/testes estejam verdes antes de adicionar novas regras.

### Plano

- Criar este documento em `docs/finance-roadmap.md`.
- Atualizar o `README.md` com referencia para o roadmap.
- Conferir o estado atual do modulo financeiro.
- Corrigir textos/encoding se necessario em uma etapa aprovada.
- Confirmar que o CSS financeiro nao dispara warning de budget por componente.

### Testes e Validacao

- Rodar build.
- Rodar testes headless.
- Fazer smoke test manual recomendado:
  - login
  - acessar `/finance`
  - cadastrar conta
  - cadastrar entrada com data e conta
  - cadastrar cartao
  - cadastrar compra parcelada
  - cadastrar meta/reserva com conta
  - adicionar valor a meta
  - cadastrar investimento
  - trocar mes de referencia

### Criterios de Aceite

- Roadmap salvo no projeto.
- README aponta para o roadmap.
- Build e testes passam.
- Nenhuma funcionalidade financeira existente e removida.

## Fase 2: Exclusao e CRUD Completo

### Objetivo

Permitir manutencao completa dos registros financeiros com exclusao segura e feedback visual.

Documento da fase aprovada: [finance-phase-2.md](finance-phase-2.md).

### Plano

- Adicionar exclusao para:
  - contas
  - entradas
  - despesas
  - cartoes
  - metas
  - contribuicoes de metas
  - investimentos
- Adicionar confirmacao antes de excluir.
- Bloquear exclusao quando houver dependencias:
  - cartao com compras vinculadas
  - conta usada em entrada, meta, contribuicao ou investimento
  - meta com contribuicoes
- Exibir mensagem de sucesso, erro ou bloqueio.
- Preferir bloqueio com explicacao em vez de exclusao em cascata.

### Mudancas Tecnicas

- Adicionar metodos `delete...` no `FinanceService`.
- Adicionar validadores de dependencia no servico.
- Atualizar a tela para mostrar botoes de exclusao.
- Manter recalculo de dashboard, faturas e graficos apos exclusao.

### Testes e Validacao

- Excluir item sem dependencia.
- Bloquear exclusao de item com dependencia.
- Confirmar que totais recalculam apos exclusao permitida.
- Confirmar que registros dependentes nao ficam orfaos.

### Criterios de Aceite

- Usuario consegue excluir registros seguros.
- Exclusoes perigosas sao bloqueadas com mensagem clara.
- Build e testes passam.

## Fase 3: Conta Corrente e Saldo Real

### Objetivo

Transformar contas em entidades financeiras uteis, calculando saldo por conta e resumo de patrimonio.

Documento da fase aprovada: [finance-phase-3.md](finance-phase-3.md).

### Plano

- Calcular saldo por conta considerando:
  - saldo inicial
  - entradas vinculadas
  - reservas/metas vinculadas
  - investimentos vinculados
- Exibir saldo estimado por conta na aba `Contas`.
- Exibir resumo de patrimonio no dashboard:
  - saldo em contas
  - total investido
  - total reservado
  - patrimonio estimado
- Manter despesas sem conta de origem nesta fase, a menos que seja aprovado expandir o escopo.

### Mudancas Tecnicas

- Adicionar metodos:
  - `getAccountBalance(accountId)`
  - `getAccountsSummary()`
  - `getNetWorthSummary()`
- Atualizar dashboard e aba `Contas`.
- Preservar compatibilidade com dados antigos sem conta vinculada.

### Testes e Validacao

- Entrada aumenta saldo da conta.
- Investimento vinculado entra no patrimonio.
- Meta/reserva vinculada aparece no resumo.
- Conta sem movimentacao mostra saldo inicial.

### Criterios de Aceite

- Aba `Contas` mostra saldo calculado.
- Dashboard mostra patrimonio estimado.
- Build e testes passam.

## Fase 4: Investimentos e Reservas

### Objetivo

Melhorar o acompanhamento de CDBs, reservas e outros investimentos.

Documento da fase aprovada: [finance-phase-4.md](finance-phase-4.md).

### Plano

- Adicionar campos opcionais:
  - rentabilidade/taxa
  - indexador: CDI, IPCA, Prefixado ou Outro
  - liquidez: diaria, vencimento ou sem liquidez
  - vencimento
- Exibir ganho/perda nominal:
  - valor atual menos valor aplicado
  - percentual aproximado
- Agrupar visualmente:
  - reserva
  - CDB
  - outros investimentos
- Permitir atualizar valor atual periodicamente.

### Mudancas Tecnicas

- Expandir `Investment`.
- Atualizar formulario e lista de investimentos.
- Normalizar estados antigos para novos campos opcionais.

### Testes e Validacao

- Cadastro de CDB com indexador.
- Calculo de ganho/perda nominal.
- Edicao de valor atual.
- Compatibilidade com investimentos antigos.

### Criterios de Aceite

- Usuario acompanha tipo, instituicao, conta, valor aplicado, valor atual e rendimento basico.
- Build e testes passam.

## Fase 5: UX, Filtros e Organizacao

### Objetivo

Melhorar usabilidade para uso real com listas maiores.

### Plano

- Adicionar filtros por:
  - mes
  - categoria
  - conta
  - cartao
  - metodo de pagamento
- Melhorar listas longas:
  - ordenacao por data
  - indicadores de entrada/saida
  - estados vazios melhores
- Adicionar feedback visual apos salvar, editar e excluir.
- Refinar responsividade das abas e cards.

### Mudancas Tecnicas

- Criar estado de filtros no componente.
- Reaproveitar calculos do `FinanceService`.
- Evitar filtros que alterem os dados persistidos.

### Testes e Validacao

- Filtrar lancamentos por categoria.
- Filtrar por conta/cartao.
- Confirmar estados vazios.
- Smoke test em mobile e desktop.

### Criterios de Aceite

- Usuario encontra registros com facilidade.
- Fluxos principais ficam claros em telas pequenas e grandes.
- Build e testes passam.

## Fase 6: Persistencia com Backend

### Objetivo

Preparar o modulo para sincronizacao real por usuario fora do `localStorage`.

### Plano

- Criar camada `FinanceRepository`.
- Implementar `LocalFinanceRepository` mantendo comportamento atual.
- Preparar contrato para `ApiFinanceRepository`.
- Planejar migracao futura dos dados locais para backend.

### Mudancas Tecnicas

- Isolar persistencia do `FinanceService`.
- Definir interfaces de leitura/escrita.
- Manter fallback local durante transicao.
- Evitar acoplamento do componente ao tipo de persistencia.

### Testes e Validacao

- Servico usando repositorio local.
- Mock de repositorio API.
- Persistencia local sem regressao.
- Plano de migracao documentado.

### Criterios de Aceite

- Troca futura de `localStorage` para backend fica possivel sem reescrever a tela.
- Build e testes passam.

## Proxima Fase Recomendada

A proxima fase recomendada e a **Fase 5: UX, Filtros e Organizacao**.

Ela deve ser implementada somente apos aprovacao explicita.
