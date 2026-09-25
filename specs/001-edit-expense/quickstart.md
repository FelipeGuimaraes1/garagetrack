# Quickstart: Editar Despesa Existente

**Feature**: `001-edit-expense`  
**Date**: 2026-09-19

Guia de validação manual ponta a ponta. Regras de persistência estão em [data-model.md](./data-model.md). O contrato HTTP está em [contracts/expenses-update.yaml](./contracts/expenses-update.yaml).

## Prerequisites

- App em desenvolvimento (`npm run dev`) e usuário autenticado
- Pelo menos **dois veículos próprios**, com odômetro atual conhecido no primeiro
- Uma despesa própria visível na listagem (`/expenses`)
- Uma despesa própria **com anexo**
- (Opcional) segundo usuário para o cenário de posse — ou um UUID de despesa que não pertence à sessão

## Setup

```bash
npm run dev
```

Abrir `/expenses` autenticado.

## Cenários

### US1 — Corrigir dados próprios

1. Na lista, clicar em editar numa despesa visível (inclusive se não estiver na página 1).
2. Esperado: modal **Editar despesa** com veículo, tipo, status, data, valor, descrição e km atuais.
3. Alterar descrição, valor, data e status; Salvar.
4. Esperado: toast `Despesa atualizada com sucesso!`; lista mostra os novos valores **sem** recarregar a página manualmente; modal fecha.
5. Reabrir, alterar um campo e clicar Cancelar/Fechar.
6. Esperado: registro inalterado.

### US2 — Autorização

1. Sem cookie de sessão, `PATCH /api/expenses/{id}` com body válido.
2. Esperado: `401` `{ "message": "Não autenticado." }`; linha intacta.
3. Autenticado, PATCH com id de despesa de outro usuário ou UUID inexistente.
4. Esperado: `404` `{ "message": "Despesa não encontrada." }` nos dois casos; sem vazar o registro.
5. Na UI, tentar salvar a própria despesa com `vehicleId` de um veículo que não é do usuário (request direto).
6. Esperado: `404` `{ "message": "Veículo não encontrado." }`; despesa permanece no veículo original.

### US3 — Odômetro

Anotar `Vehicle.odometerKm` antes de cada passo.

1. Informar odômetro **maior** que o atual → veículo alvo avança para esse valor; despesa salva.
2. Informar odômetro **menor ou igual** → despesa salva se o restante for válido; odômetro do veículo **igual** ao de antes.
3. Deixar odômetro do veículo **vazio** e alterar só valor/descrição → odômetro do veículo inalterado.
4. Mover a despesa para o segundo veículo próprio com odômetro informado **maior** que o do destino → só o destino avança; origem não reduz.

### US4 — Tipo e combustível

1. Tipo resultante `ABASTECIMENTO` sem litros/preço/tipo de combustível → `422` com `issues` nos campos; mensagens junto aos campos; despesa intacta.
2. Abastecimento → outro tipo → salvar → `fuelLiters`, `pricePerLiter`, `fuelType` e `station` nulos.
3. Outro tipo → `ABASTECIMENTO` → campos de combustível visíveis e obrigatórios antes de salvar.
4. Descrição com 1 caractere ou valor inválido → mesmas regras do cadastro (limites em [data-model.md](./data-model.md)).

### US5 — Anexos e feedback

1. Editar despesa com anexo(s); alterar valor; salvar.
2. Esperado: mesma quantidade e mesmas URLs de anexo; link na lista ainda abre o arquivo.
3. Durante o save: botões Salvar/Cancelar/Fechar desabilitados; indicador de carregamento; segundo clique não duplica.
4. Forçar 500/rede: toast de erro em pt-BR, sem stack; dados anteriores preservados.

## Fora deste guia

- Upload, substituição ou exclusão de anexos
- Diálogo de criar lembrete após editar
- Criar, excluir, filtrar ou exportar despesas (exceto o necessário para preparar os dados)
