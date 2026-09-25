# Research: Editar Despesa Existente

**Feature**: `001-edit-expense`  
**Date**: 2026-09-19

Todas as ambiguidades de Technical Context foram resolvidas contra o código atual. Não restam marcadores `NEEDS CLARIFICATION`.

## 1. Superfície de implementação

**Decision**: Reutilizar `PATCH /api/expenses/:id` e `ExpenseEditModal`; não criar página, PUT, Server Action nem camada de serviço.

**Rationale**: A edição já está ligada na listagem (`ExpenseList` → modal → `useExpenses.updateExpense`). A Constituição exige evolução incremental e proíbe camadas novas sem necessidade. O trabalho é fechar lacunas em relação à spec, não reinventar o fluxo.

**Alternatives considered**:

- Nova rota `/expenses/[id]/edit` — quebra FR-023 (consistência com cadastro/listagem em modal).
- Server Action — o projeto muta despesas só via Route Handlers.
- PUT com body completo — o contrato atual é PATCH parcial; a UI já envia o conjunto de campos de negócio.

## 2. Tipo resultante e combustível

**Decision**: `resultingType = payload.type ?? existing.type`. Exigir `fuelLiters`, `pricePerLiter` e `fuelType` quando `resultingType === ABASTECIMENTO`. Anular combustível **somente** quando `resultingType !== ABASTECIMENTO`.

**Rationale**: Hoje `isAbastecimento` usa só o `type` do request. Se `type` for omitido, o `else` zera combustível mesmo em despesa de abastecimento. A spec exige que o tipo **resultante** governe as regras (FR-008, FR-009).

**Alternatives considered**:

- Manter o comportamento atual — viola FR-009 de forma inversa (apaga combustível sem troca de tipo).
- Recusar PATCH sem `type` — a UI sempre envia `type`, mas o contrato HTTP deve ser seguro para clientes parciais.

## 3. Validação de `vehicleOdometerKm` na edição

**Decision**: Campo opcional no update, validado com `DecimalStringSchema` quando presente. Vazio/omitido não altera `Vehicle.odometerKm`. Valor menor ou igual ao atual não impede o salvamento da despesa; o odômetro do veículo simplesmente não muda. Nunca persistir `NaN`.

**Rationale**: No cadastro o campo é obrigatório; na edição a spec o torna opcional. O PATCH atual remove o campo antes do Zod e faz `Number()`, o que aceita lixo. FR-011–FR-013 e FR-015 exigem validação decimal e não-redução.

**Alternatives considered**:

- Obrigar odômetro na edição como no create — contradiz a assumption da spec.
- Recusar save se o valor for menor — a spec permite salvar; só o odômetro atual fica parado.

## 4. Snapshot de MANUTENCAO

**Decision**: Se `resultingType === MANUTENCAO` e `vehicleOdometerKm` foi enviado, persistir esse valor em `Expense.km`, como no POST de criação. Para outros tipos, `km` do body continua sendo a quilometragem da despesa.

**Rationale**: FR-005 pede os mesmos dados de negócio do cadastro. O create já faz esse snapshot sem migration.

**Alternatives considered**:

- Não copiar odômetro para `Expense.km` no update — divergiria do create e da listagem (que já trata `km` como snapshot em manutenção).
- Recalcular odômetro do veículo a partir de todas as despesas — proibido por FR-024.

## 5. Lembretes após edição

**Decision**: Não devolver `alerts` no PATCH e não abrir o diálogo de criar lembrete após salvar. Se o odômetro avançar, outras telas já usam `getCurrentOdometer`.

**Rationale**: Assumption explícita da spec. Copiar o fluxo de create aumentaria escopo e UX sem requisito.

**Alternatives considered**:

- Replicar `alerts` do POST — fora do escopo.
- Recalcular `lastDoneKm` dos lembretes — alteraria histórico silenciosamente (FR-024).

## 6. Dados iniciais do modal

**Decision**: `ExpenseList` passa a despesa selecionada como prop para `ExpenseEditModal`. Remover o segundo `useExpenses()` interno. O PATCH continua sendo a fonte de verdade na gravação.

**Rationale**: O modal atual busca a despesa na instância do hook (página 1, sem filtros). Uma despesa de outra página pode não abrir (`if (!open || !current) return null`). FR-001 exige iniciar a edição a partir da listagem visível.

**Alternatives considered**:

- `GET /api/expenses/:id` — útil, mas fora do mínimo; a lista já tem os dados.
- Manter o segundo hook — falha com paginação/filtros.

## 7. Erros de validação na UI

**Decision**: Mapear `422` `issues[].path` para `formErrors` por campo (`aria-invalid`, `aria-describedby`), no mesmo padrão de `ExpenseCreateModal` / `VehicleEditModal`. Toast genérico para 401/404/500. `useExpenses.updateExpense` já anexa `err.payload`.

**Rationale**: FR-019, FR-021 e SC-005. O edit hoje só mostra toast genérico.

**Alternatives considered**:

- Só toast — não aponta o campo (pior que o cadastro).
- react-hook-form — dependência nova, rejeitada pela Constituição.

## 8. Precisão de `km` no cliente

**Decision**: Enviar `km` da despesa como string decimal compatível com `DecimalStringSchema` (sem `Math.round`). Não alterar o modal de criação nesta feature.

**Rationale**: FR-015. O edit atual arredonda para inteiro e perde casas.

**Alternatives considered**:

- Corrigir create e edit juntos — foge do escopo da edição.
- Manter `Math.round` — perda de precisão documentada.

## 9. Anexos

**Decision**: Omitir `attachments` de `ExpenseUpdateSchema`. O PATCH inclui anexos existentes na resposta e não cria, atualiza nem apaga `ExpenseAttachment`. Sem `ReceiptUploader` e sem confirmação extra no salvar.

**Rationale**: FR-016, FR-017, FR-019. O PATCH já ignora anexos na prática; o schema `partial()` do create ainda aceitaria `attachments` se alguém enviasse.

**Alternatives considered**:

- Permitir upload na edição — spec coloca gestão de anexos fora do escopo.
- Confirmar salvamento — confirmação no produto é só para exclusão.

## 10. Stack e testes

**Decision**: Next.js 15 App Router, NextAuth 4, Prisma 6, Zod 4, modal com estado local. Validação via [quickstart.md](./quickstart.md); sem introduzir Jest/Vitest/Playwright só para esta feature.

**Rationale**: Technical Context do projeto; Constituição VII (testes adequados ao risco — aqui o runner não existe e a spec não pede TDD).

**Alternatives considered**:

- Adotar framework de teste agora — decisão de plataforma, não desta feature.
