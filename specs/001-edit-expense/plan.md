# Implementation Plan: Editar Despesa Existente

**Branch**: `001-edit-expense` | **Date**: 2026-09-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-edit-expense/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Permitir que o usuário autenticado corrija uma despesa própria a partir da listagem, com o formulário pré-preenchido, as mesmas regras de negócio do cadastro (exceto gestão de anexos) e preservação do odômetro atual do veículo (nunca reduz).

A edição **já existe parcialmente** (`ExpenseEditModal` + `PATCH /api/expenses/:id`). A implementação evolui esse fluxo: schema de update dedicado, tipo resultante para combustível, odômetro validado no Zod, modal recebendo a despesa da lista (sem segundo `useExpenses()`), erros 422 por campo e `km` decimal. Sem novas camadas, rotas, Server Actions ou bibliotecas.

## Technical Context

**Language/Version**: TypeScript (strict), Next.js 15.5.4 App Router, React 19

**Primary Dependencies**: NextAuth.js 4, Prisma 6, Zod 4, Tailwind CSS; toasts via `ToastProvider`/`useToast`; formulários com `useState` (sem react-hook-form)

**Storage**: PostgreSQL via Prisma (`Expense`, `Vehicle.odometerKm`, `ExpenseAttachment`)

**Testing**: nenhum runner automatizado no repositório; validação manual em [quickstart.md](./quickstart.md)

**Target Platform**: aplicação web (mensagens e formatos em português do Brasil)

**Project Type**: web application (Next.js App Router em `src/`)

**Performance Goals**: reutilizar a paginação da listagem; não disparar um segundo `GET /api/expenses` só para abrir o modal

**Constraints**: sem novas camadas arquiteturais; valores monetários e de km com `Prisma.Decimal` / `DecimalStringSchema`; odômetro do veículo nunca diminui por edição de despesa; anexos fora do escopo (apenas preservar); não reabrir o fluxo de criação de lembretes após salvar

**Scale/Scope**: uma mutação protegida (`PATCH`) e paridade de UX com o cadastro, limitada aos campos de negócio já existentes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Arquitetura**: PASS — reutilizar route handler + Zod + Prisma; não criar DAL/service layer.
- **II. Segurança e autorização por propriedade**: PASS — `getServerSession` no PATCH; `findFirst({ id, userId })`; `findOwnedVehicle` no veículo alvo; 404 genérico para despesa inexistente ou de outro usuário.
- **III. Integridade e validação**: PASS — Zod no servidor antes de persistir; `Prisma.Decimal`; regras condicionais de combustível pelo tipo resultante.
- **IV. Domínio automotivo**: PASS — odômetro monotônico no veículo **alvo**; não reconstruir histórico; não reduzir odômetro do veículo de origem ao mover a despesa.
- **V. UX e acessibilidade**: PASS — mesmo padrão de modal do cadastro; erros 422 por campo; toast em pt-BR; confirmação só na exclusão já existente.
- **VI. Performance**: PASS — passar a despesa da lista para o modal; sem fetch duplicado de listagem.
- **VII. Evolução incremental**: PASS — fechar lacunas no PATCH/modal atuais; não reescrever create/delete/export.

**Post-design re-check**: os mesmos gates continuam PASS. Nenhuma violação a justificar. Complexity Tracking permanece vazio.

## Project Structure

### Documentation (this feature)

```text
specs/001-edit-expense/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── expenses-update.yaml
└── tasks.md              # gerado por /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (app)/expenses/page.tsx
│   └── api/expenses/[id]/route.ts    # PATCH (edição) e DELETE (fora de escopo)
├── components/expense/
│   ├── ExpenseList.tsx               # entrada da edição
│   ├── ExpenseEditModal.tsx          # formulário de edição
│   └── ExpenseCreateModal.tsx        # referência de 422 / máscaras (não alterar além do necessário)
├── hooks/
│   └── useExpenses.ts                # updateExpense → PATCH
└── lib/
    ├── auth/owned-vehicle.ts
    └── validations/expense.ts        # ExpenseUpdateSchema
```

**Structure Decision**: projeto Next.js único em `src/`. A feature altera o PATCH, o schema de update e o par lista/modal. Não há `backend/` ou `frontend/` separados.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Nenhuma violação.
