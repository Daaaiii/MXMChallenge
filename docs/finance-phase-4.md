# Fase 4 Aprovada: Investimentos e Reservas

## Objetivo

Melhorar o acompanhamento de CDBs, reservas e outros investimentos, permitindo registrar rentabilidade, indexador, liquidez, vencimento e ganho/perda nominal.

## Escopo Implementado

- Novos campos opcionais em investimentos:
  - rentabilidade anual
  - indexador: CDI, IPCA, Prefixado, Selic ou Outro
  - liquidez: diaria, no vencimento, sem liquidez ou outro
  - vencimento
- Calculo de ganho/perda nominal:
  - valor atual menos valor aplicado
  - percentual sobre o valor aplicado
- Agrupamento visual por tipo de investimento.
- Totais por grupo:
  - valor aplicado
  - valor atual
  - ganho/perda nominal
- Exclusao de investimentos pela lista agrupada.
- Resgate parcial ou total de investimento para uma conta de destino.
- Compatibilidade com investimentos ja salvos, pois os novos campos sao opcionais.

## Regras de Calculo

```text
ganho nominal = valor atual - valor aplicado
ganho percentual = ganho nominal / valor aplicado * 100
```

Quando o valor aplicado for zero ou ausente, o percentual fica em zero para evitar divisao invalida.

No resgate:

```text
valor atual restante = valor atual - valor resgatado
valor aplicado restante = valor aplicado - valor aplicado proporcional ao resgate
```

Quando o resgate vai para uma conta diferente da conta/corretora vinculada ao investimento, o sistema cria lancamentos compensatorios para manter o patrimonio estimado coerente.

## Decisoes

- A rentabilidade informada e apenas cadastral nesta fase.
- O projeto ainda nao calcula rendimento composto, imposto, IOF, taxa de custodia ou marcacao a mercado.
- O agrupamento usa o tipo do investimento como chave principal.
- Reservas continuam como tipo de investimento para acompanhamento consolidado, alem das metas/reservas planejadas.
- Resgates totais removem o investimento da lista.

## Validacao Esperada

```bash
npm.cmd run build
npm.cmd test -- --watch=false --browsers=ChromeHeadless
```

## Criterios de Aceite

- Usuario consegue cadastrar investimento com indexador, rentabilidade, liquidez e vencimento.
- Usuario consegue editar valor atual e dados cadastrais do investimento.
- Usuario consegue excluir investimentos.
- Usuario consegue registrar resgate para uma conta.
- Aba `Investimentos` mostra ganho/perda nominal e percentual.
- Aba `Investimentos` agrupa visualmente reservas, CDBs e outros tipos.
- Investimentos antigos sem os novos campos continuam funcionando.
- Build e testes passam.

## Proxima Fase

A proxima fase planejada e a **Fase 5: UX, Filtros e Organizacao**.

Ela deve ser aprovada separadamente antes de qualquer implementacao.
