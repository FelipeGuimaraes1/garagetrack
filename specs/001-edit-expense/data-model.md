# Data Model: Editar Despesa Existente

**Feature**: `001-edit-expense`  
**Date**: 2026-09-19

Nenhuma migration Prisma. A edição opera sobre entidades já persistidas.

## Entities

### Despesa (`Expense`)

Registro de gasto associado a um usuário e a um veículo.

| Field | Type | Notes |
|-------|------|--------|
| `id` | UUID | Identificador; **não** autoriza sozinho |
| `userId` | UUID | Dono; PATCH sempre restringe por este campo |
| `vehicleId` | UUID | Pode mudar só para veículo do mesmo usuário |
| `type` | `ExpenseType` | `ABASTECIMENTO`, `MANUTENCAO`, `IMPOSTO`, `SEGURO`, `MULTA`, `OUTRO` |
| `status` | `ExpenseStatus` | `PENDENTE` (default) ou `PAGO` |
| `date` | Date (`@db.Date`) | Data civil; input `dateISO` `YYYY-MM-DD` |
| `amount` | Decimal(12,2) | Valor em R$; `DecimalStringSchema` |
| `description` | String | min 2, max 300 |
| `km` | Decimal(10,2)? | Km da despesa (trip) ou snapshot em `MANUTENCAO` |
| `fuelLiters` | Decimal(8,2)? | Só quando tipo resultante é `ABASTECIMENTO` |
| `pricePerLiter` | Decimal(10,2)? | Idem |
| `fuelType` | `FuelType`? | `GASOLINA`, `ETANOL`, `DIESEL`, `GNV` |
| `station` | String? | max 120; anulado se deixar de ser abastecimento |
| `attachments` | `ExpenseAttachment[]` | Preservados; fora do payload de update |
| `createdAt` / `updatedAt` | DateTime | `updatedAt` muda no save |

**Relationships**: `Expense.user` → `User`; `Expense.vehicle` → `Vehicle`; `Expense.attachments` → `ExpenseAttachment[]` (cascade na exclusão da despesa, que está fora desta feature).

### Veículo (`Vehicle`)

| Field | Type | Notes |
|-------|------|--------|
| `id` | UUID | Alvo da associação |
| `userId` | UUID | Ownership via `findOwnedVehicle` |
| `odometerKm` | Int? | Odômetro atual; **nunca** reduzido por esta feature |

Na edição, o odômetro do veículo **alvo** só avança se `vehicleOdometerKm` (campo de request, não coluna de `Expense`) for maior que o atual ou se o atual for `null`. O veículo de origem, ao mover a despesa, não tem odômetro recalculado nem reduzido.

`vehicleOdometerKm` no request: opcional; `DecimalStringSchema` quando presente; convertido para inteiro de km do veículo como no create (`Number` após validação decimal).

### Anexo da despesa (`ExpenseAttachment`)

| Field | Type | Notes |
|-------|------|--------|
| `id` | UUID | Imutável nesta feature |
| `expenseId` | UUID | Permanece ligado após o PATCH |
| `url` | String | Cloudinary HTTPS; não substituído |
| `contentType` / `size` | opcionais | Não alterados |

### Usuário autenticado

Contexto de toda operação. `session.user.id` é o único critério de posse.

## Validation rules (update)

Aplicar as mesmas regras de cadastro no **tipo resultante** (`payload.type ?? existing.type`):

- `description`: min 2, max 300
- `amount`, `km`, combustível numérico: no máximo 2 casas decimais (`DecimalStringSchema`)
- `dateISO`: `YYYY-MM-DD`
- `station`: max 120
- Se tipo resultante é `ABASTECIMENTO`: `fuelLiters`, `pricePerLiter` e `fuelType` obrigatórios
- Se tipo resultante não é `ABASTECIMENTO`: persistir `fuelLiters`, `pricePerLiter`, `fuelType` e `station` como `null`
- `attachments` **não** fazem parte do schema de update
- `vehicleOdometerKm` opcional; se presente, deve passar em `DecimalStringSchema`

## State transitions

Não há máquina de estados. A despesa permanece um registro ativo.

- **Cancelar / fechar sem salvar**: nenhum campo muda.
- **Salvar válido**: atualiza campos enviados; `updatedAt` avança; anexos iguais.
- **Salvar inválido (422)**: nenhuma persistência.
- **Não autenticado (401)** / **não encontrada ou não autorizada (404)**: nenhuma persistência.
- **Troca de veículo**: `vehicleId` aponta para o destino; odômetro do destino pode avançar; o de origem não regride.
- **Troca de tipo para fora de abastecimento**: combustível limpo.
- **MANUTENCAO + `vehicleOdometerKm` enviado**: `Expense.km` recebe o snapshot, como no create.

## Integrity invariants

1. `Expense.userId` não muda na edição.
2. Consulta e update sempre com `userId` da sessão.
3. `Vehicle.odometerKm` do veículo envolvido termina **igual ou maior** do que antes (SC-003).
4. Quantidade e URLs de anexos após save = quantidade e URLs antes (SC-004).
5. Edição **não** reconstrói odômetro a partir de outras despesas (FR-024).
