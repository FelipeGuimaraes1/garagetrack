# Tasks: Editar Despesa Existente

**Input**: Design documents from `/specs/001-edit-expense/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/expenses-update.yaml](./contracts/expenses-update.yaml)

**Tests**: Não incluídos — a spec não pede TDD e o repositório não tem runner. Validação manual em [quickstart.md](./quickstart.md).

**Organization**: Tarefas agrupadas por user story para implementação e teste independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivo diferente, sem dependência incompleta)
- **[Story]**: US1–US5 conforme [spec.md](./spec.md)
- Cada descrição inclui caminho de arquivo

## Path Conventions

Projeto Next.js único em `src/` (ver [plan.md](./plan.md)).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar a superfície existente; sem pacotes, rotas ou camadas novas

- [x] T001 Confirm the implementation surface stays in `src/components/expense/ExpenseList.tsx`, `src/components/expense/ExpenseEditModal.tsx`, `src/app/api/expenses/[id]/route.ts`, `src/lib/validations/expense.ts`, and `src/hooks/useExpenses.ts` with no new routes, Server Actions, or dependencies

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Contrato de update dedicado e modal que abre a linha selecionada da lista

**CRITICAL**: Nenhuma user story começa antes desta fase

- [x] T002 Replace `ExpenseUpdateSchema` with a dedicated update schema that omits `attachments`, keeps `vehicleOdometerKm` optional via `DecimalStringSchema`, and reuses create constraints (`description` min 2 max 300, `amount` `DecimalStringSchema`, `dateISO` `ISODateOnlySchema`, `station` max 120) in `src/lib/validations/expense.ts`
- [x] T003 Update PATCH in `src/app/api/expenses/[id]/route.ts` to authenticate, load `findFirst({ id, userId })` as 404, validate with `ExpenseUpdateSchema` including optional `vehicleOdometerKm`, derive `resultingType = type ?? existing.type`, and never write `ExpenseAttachment`
- [x] T004 [P] Change `ExpenseEditModal` to accept the selected expense as a prop instead of a second `useExpenses()` lookup in `src/components/expense/ExpenseEditModal.tsx`
- [x] T005 Pass the selected list row into `ExpenseEditModal` from `src/components/expense/ExpenseList.tsx`

**Checkpoint**: PATCH tem schema de update real; editar abre para qualquer linha visível, inclusive fora da página 1

---

## Phase 3: User Story 1 - Corrigir dados de uma despesa própria (Priority: P1) — MVP

**Goal**: Formulário pré-preenchido, salvar campos comuns, cancelar sem alterar, toast de sucesso e lista atualizada

**Independent Test**: Criar despesa válida, abrir edição, alterar descrição/valor/data/status, salvar; a lista mostra os novos valores sem nova visita à tela

### Implementation for User Story 1

- [x] T006 [US1] Prefill the edit form from the passed expense (vehicle, type, status, dateISO, amount, description, km, fuel fields) in `src/components/expense/ExpenseEditModal.tsx`
- [x] T007 [US1] Submit allowed business fields through `updateExpense` PATCH and close the modal on success in `src/components/expense/ExpenseEditModal.tsx`
- [x] T008 [US1] Keep Cancelar/Fechar from calling `updateExpense` when `isSaving` is false in `src/components/expense/ExpenseEditModal.tsx`
- [x] T009 [US1] Show toast `Despesa atualizada com sucesso!` and emit `gt:expenses:changed` so the list reloads in `src/components/expense/ExpenseEditModal.tsx`
- [x] T010 [US1] Send expense `km` as a decimal string compatible with `DecimalStringSchema` (no `Math.round`; no máximo 2 casas decimais) in `src/components/expense/ExpenseEditModal.tsx`

**Checkpoint**: US1 funciona ponta a ponta para despesas próprias visíveis na lista

---

## Phase 4: User Story 2 - Impedir edição de despesas de outras pessoas (Priority: P1)

**Goal**: Autenticação e posse no servidor; o ID sozinho não autoriza

**Independent Test**: PATCH sem sessão → 401; PATCH de outro usuário ou id inexistente → 404 sem vazar o registro; `vehicleId` estrangeiro → 404 e veículo original mantido

### Implementation for User Story 2

- [x] T011 [US2] Return 401 `{ message: "Não autenticado." }` when `session.user.id` is missing in `src/app/api/expenses/[id]/route.ts`
- [x] T012 [US2] Return 404 `{ message: "Despesa não encontrada." }` for missing or other-user expenses without distinguishing the two in `src/app/api/expenses/[id]/route.ts`
- [x] T013 [US2] Reject a target vehicle not owned with 404 `{ message: "Veículo não encontrado." }` via `findOwnedVehicle` and leave the original `vehicleId` unchanged in `src/app/api/expenses/[id]/route.ts`

**Checkpoint**: PATCH não autenticado ou de terceiros não altera dados

---

## Phase 5: User Story 3 - Preservar o odômetro atual do veículo (Priority: P1)

**Goal**: Odômetro do veículo nunca reduz; avanço só no destino ao mover; snapshot de MANUTENCAO igual ao create

**Independent Test**: Editar com odômetro maior, menor/igual e omitido; mover para outro veículo próprio com odômetro maior — origem não cai

### Implementation for User Story 3

- [x] T014 [US3] Validate optional `vehicleOdometerKm` with `DecimalStringSchema` when present (no máximo 2 casas decimais); treat empty as omitted; never persist `NaN` in `src/app/api/expenses/[id]/route.ts`
- [x] T015 [US3] Set `Vehicle.odometerKm` (`Int?`) on the target vehicle only when incoming is greater than current or current is null; never decrease or zero it in `src/app/api/expenses/[id]/route.ts`
- [x] T016 [US3] When `vehicleOdometerKm` is omitted or less than or equal to current, persist the expense and leave `Vehicle.odometerKm` unchanged in `src/app/api/expenses/[id]/route.ts`
- [x] T017 [US3] When moving the expense to another owned vehicle, bump only the destination odometer if incoming is greater; do not reduce the origin odometer in `src/app/api/expenses/[id]/route.ts`
- [x] T018 [US3] If `resultingType` is `MANUTENCAO` and `vehicleOdometerKm` is sent, persist it on `Expense.km` (`Decimal(10,2)?`, same snapshot as POST create) in `src/app/api/expenses/[id]/route.ts`
- [x] T019 [US3] Omit `vehicleOdometerKm` from the client payload when the typed value is lower than the current vehicle odometer so save still proceeds in `src/components/expense/ExpenseEditModal.tsx`

**Checkpoint**: SC-003 — odômetro do veículo envolvido termina igual ou maior, nunca menor

---

## Phase 6: User Story 4 - Respeitar regras por tipo de despesa (Priority: P2)

**Goal**: Combustível obrigatório se o tipo resultante for ABASTECIMENTO; limpo se não for

**Independent Test**: Salvar abastecimento sem combustível → 422; sair de abastecimento → colunas de combustível nulas; entrar em abastecimento → campos exigidos; limites dos campos comuns iguais ao cadastro

### Implementation for User Story 4

- [x] T020 [US4] Require `fuelLiters`, `pricePerLiter`, and `fuelType` when `resultingType` is `ABASTECIMENTO` in `src/lib/validations/expense.ts`
- [x] T021 [US4] Null `fuelLiters`, `pricePerLiter`, `fuelType`, and `station` only when `resultingType` is not `ABASTECIMENTO` (do not wipe fuel if `type` is omitted and existing type is `ABASTECIMENTO`) in `src/app/api/expenses/[id]/route.ts`
- [x] T022 [P] [US4] Show fuel fields only when selected type is `ABASTECIMENTO` in `src/components/expense/ExpenseEditModal.tsx`
- [x] T023 [US4] Apply the same create validation limits on edit for `amount` (DecimalStringSchema), `dateISO` (`YYYY-MM-DD`), `description` (min 2, max 300), and `station` (max 120) in `src/lib/validations/expense.ts`

**Checkpoint**: Troca de tipo não deixa combustível inconsistente

---

## Phase 7: User Story 5 - Preservar anexos e receber feedback claro (Priority: P2)

**Goal**: Anexos intactos; loading; 422 por campo; toast genérico de falha; sem confirmação no salvar

**Independent Test**: Editar despesa com anexos; arquivos permanecem; save inválido mostra erros no campo; save em andamento impede envio duplicado

### Implementation for User Story 5

- [x] T024 [US5] Include existing attachments on the PATCH 200 `{ data }` response and never create, update, or delete `ExpenseAttachment` rows in `src/app/api/expenses/[id]/route.ts`
- [x] T025 [US5] Keep `attachments` out of `ExpenseUpdateSchema` so the client cannot mutate files via PATCH in `src/lib/validations/expense.ts`
- [x] T026 [US5] Map 422 `issues[].path` to per-field `formErrors` with `aria-invalid` and `aria-describedby`, matching create, in `src/components/expense/ExpenseEditModal.tsx`
- [x] T027 [US5] Keep `isSaving` spinner and disable Salvar, Cancelar, and Fechar to prevent duplicate submit in `src/components/expense/ExpenseEditModal.tsx`
- [x] T028 [US5] Show a generic pt-BR error toast on 401/404/500 without internals; preserve form values on failure in `src/components/expense/ExpenseEditModal.tsx`
- [x] T029 [US5] Do not add `ReceiptUploader` or a save `ConfirmDialog` in `src/components/expense/ExpenseEditModal.tsx`

**Checkpoint**: SC-004 anexos preservados; SC-005 feedback de validação no save inválido

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Ajustes que atravessam várias stories

- [x] T030 Add a visible saving label (not only `sr-only`) while keeping focus trap and keyboard close in `src/components/expense/ExpenseEditModal.tsx`
- [x] T031 Do not open the create-time reminder dialog after edit; other screens pick up odometer via existing `getCurrentOdometer` in `src/components/expense/ExpenseEditModal.tsx`
- [x] T032 Run the manual scenarios in `specs/001-edit-expense/quickstart.md` (prefill, save, cancel, 401/404, odometer, type/fuel, attachments, loading)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências
- **Foundational (Phase 2)**: depende do Setup; **bloqueia** todas as stories
- **User Stories (Phase 3+)**: depois da Phase 2, em ordem de prioridade (P1 → P2) ou em paralelo se os arquivos não colidirem
- **Polish (Phase 8)**: depois das stories desejadas

### User Story Dependencies

- **US1 (P1)**: após Phase 2 — MVP
- **US2 (P1)**: após Phase 2 — mesmo arquivo PATCH que US3; fazer em sequência nesse arquivo
- **US3 (P1)**: após T003 (`resultingType` e validação de odômetro no PATCH)
- **US4 (P2)**: após T002/T003
- **US5 (P2)**: após T004/T005 (props do modal) e T002 (sem `attachments` no schema)

### Within Each User Story

- Schema/contrato antes da UI que depende dele
- Persistência no PATCH antes do cliente omitir odômetro menor
- Story completa antes de subir a prioridade seguinte, se for uma pessoa só

### Parallel Opportunities

- T002 (schema) em paralelo com T004 (props do modal)
- Depois: T003 (PATCH) e T005 (lista)
- T022 (UI combustível) em paralelo com T020/T021 se T002 já existir
- US2 e US3 **não** são paralelas no mesmo `route.ts`

---

## Parallel Example: Foundational + US1

```bash
# Depois de T001:
Task: "T002 ExpenseUpdateSchema em src/lib/validations/expense.ts"
Task: "T004 props da despesa em src/components/expense/ExpenseEditModal.tsx"

# Em seguida:
Task: "T003 PATCH em src/app/api/expenses/[id]/route.ts"
Task: "T005 passar a linha em src/components/expense/ExpenseList.tsx"

# MVP US1 no modal:
Task: "T006–T010 prefill, save, cancel, toast, km decimal em src/components/expense/ExpenseEditModal.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup (T001)
2. Phase 2: Foundational (T002–T005)
3. Phase 3: US1 (T006–T010)
4. **STOP**: validar prefill, save, cancel e lista (quickstart US1)

### Incremental Delivery

1. Setup + Foundational
2. US1 → demo MVP
3. US2 + US3 (segurança e odômetro)
4. US4 + US5 (tipo/combustível, anexos, 422)
5. Polish (T030–T032)

### Parallel Team Strategy

1. Juntos: T001–T005
2. Depois: uma pessoa no modal (US1/US5), outra no PATCH (US2/US3/US4), alinhando `resultingType` e o schema

---

## Notes

- `[P]` só quando os arquivos não conflitam
- `[USn]` só nas fases de user story
- Sem testes automatizados nesta lista
- Commit após cada tarefa ou grupo lógico
- Parar em qualquer checkpoint para validar a story
- Não incluir gestão de anexos, diálogo de lembrete pós-edição, nem GET-by-id
