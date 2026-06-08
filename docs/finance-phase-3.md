# Fase 3 Aprovada: Conta Corrente e Saldo Real

## Objetivo

Transformar contas em entidades financeiras uteis, exibindo saldo estimado por conta e um resumo de patrimonio no dashboard financeiro.

## Escopo Implementado

- Calculo de saldo liquido estimado por conta.
- Calculo de entradas vinculadas por conta ate o mes de referencia.
- Calculo de reservas/metas vinculadas por conta ate o mes de referencia.
- Calculo de investimentos vinculados por conta ate o mes de referencia.
- Resumo de patrimonio no dashboard.
- Detalhamento de saldos na aba `Contas`.
- Origem unica no cadastro de despesas, combinando contas e cartoes.
- Despesas Pix vinculadas a contas passam a reduzir o saldo estimado da conta.
- Testes unitarios para saldo por conta, patrimonio e integracao do componente com o mes selecionado.

## Regra de Calculo

O saldo liquido estimado da conta considera:

```text
saldo inicial + entradas vinculadas - despesas vinculadas - reservas vinculadas - investimentos vinculados
```

O patrimonio estimado considera:

```text
saldo liquido em contas + reservas + investimentos
```

Essa regra evita contar duas vezes o dinheiro que saiu da conta liquida e foi separado como reserva ou investimento.

## Decisoes

- Despesas Pix reduzem saldo de conta quando a origem escolhida e uma conta.
- Despesas de cartao atualizam faturas e limite comprometido por meio do cartao escolhido.
- Receitas recorrentes sao somadas uma vez por mes, do mes inicial ate o mes de referencia.
- Receitas avulsas entram somente se a data for anterior ou igual ao mes de referencia.
- Reservas usam as contribuicoes de metas vinculadas a uma conta.
- Investimentos usam o `currentAmount` dos investimentos vinculados e iniciados ate o mes de referencia.

## Validacao Esperada

```bash
npm.cmd run build
npm.cmd test -- --watch=false --browsers=ChromeHeadless
```

## Criterios de Aceite

- Aba `Contas` mostra saldo estimado por conta.
- Aba `Contas` mostra entradas, valores reservados e investimentos vinculados.
- Dashboard mostra patrimonio, saldo liquido e reservas.
- Calculos respeitam o mes de referencia selecionado.
- Build e testes passam.

## Riscos e Limites Conhecidos

- Saldo real ainda e estimado para dados antigos sem conta de origem.
- Transferencias entre contas ainda nao existem.
- A proxima evolucao natural e criar movimentacoes de conta corrente e transferencias entre contas.

## Proxima Fase

A proxima fase planejada e a **Fase 4: Investimentos e Reservas**.

Ela deve ser aprovada separadamente antes de qualquer implementacao.
