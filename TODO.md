# TODO — GarageTrack

Este arquivo resume **o que já foi feito** neste chat e **os próximos passos** recomendados.

---

## ✅ Entregas concluídas

- **Autenticação (NextAuth v4)**

  - Providers: **Google** + **Credentials** (bcrypt).
  - **PrismaAdapter** conectado (persistência de User/Account/Session/VerificationToken).
  - `SessionProvider` no layout e helpers server-side com `getServerSession(authOptions)`.
  - Sessão JWT com `user.id` exposto em `session.user.id` via callback.
  - Rotas públicas sem sidebar (`/signin`, `/signup`).

- **UI/UX**

  - **Sidebar** com avatar (imagem do provedor ou iniciais), **nome** e **colapso**.
  - Botão de **logout** com ícone do lucide-react.
  - Sidebar **não renderiza** em rotas públicas.
  - Correções visuais (bordas, avatar circular quando colapsada).

- **Modelo de dados (Prisma)**

  - `User`: `emailVerified` adicionado (compat. PrismaAdapter).
  - `Vehicle`: placa case-insensitive (CITEXT), fuel enum, chaves e índices.
  - `Expense`: enums de tipo/status, campos de abastecimento, anexos.
  - `ReminderRule`: tipos, recorrência por dias/km, datas fixas e índices.

- **Vehicles (CRUD completo)**

  - API `/api/vehicles` (GET, POST) e `/api/vehicles/[id]` (PATCH, DELETE).
  - Hooks `useVehicles` com **reload** e eventos `gt:vehicles:changed`.
  - **VehicleCreateModal** + **VehicleEditModal** + **VehicleList**.
  - **Atualização imediata** após criar/editar/excluir (reload + `router.refresh`).

- **Expenses (CRUD completo)**

  - API `/api/expenses` (GET com filtros + paginação; POST) e `/api/expenses/[id]` (PATCH, DELETE).
  - Hooks `useExpenses` com **reload**, filtros de mês/veículo/tipo e paginação.
  - **ExpenseCreateModal** + **ExpenseEditModal** + **ExpenseList**.
  - Upload de anexos (URLs) e renderização na lista.
  - Correção de **timezone** e **formatação BR** de datas/valores.

- **Reminders**

  - API `/api/reminders` (GET, POST), `/api/reminders/[id]` (PATCH, DELETE).
  - Endpoints auxiliares: `/api/reminders/count` e `/api/reminders/upcoming`.
  - **ReminderRuleForm** + **ReminderList** (+ MarkDone/Snooze).
  - Integração: ao criar **MANUTENCAO**, pergunta para criar lembrete.

- **Utilitários**
  - `formatters.ts`: `formatCurrencyBRL`, `parseCurrencyBRL`, `formatDateISO`, `parseDate`, `formatDateBR`, `formatDateBRFromUTC`.
  - Máscaras BR: moeda, placa, hodômetro, litros e preço por litro.
  - Correções de data **sem deslocamento** (UTC) e renderização **pt-BR**.

---

## 🧭 Decisões de arquitetura

- **Next.js App Router** com rotas em `app/`.
- **NextAuth v4** + **PrismaAdapter** + **JWT session** (sem persistir Session opcionalmente).
- **Eventos locais** (`emitAppEvent`) + hooks de dados com `reload`.
- **Formatadores pt-BR** centralizados.
- **Server Components protegem rotas** com `getServerSession` e `redirect`.

---

## 🧩 Pontos de atenção (já endereçados)

- Erros de import/export entre `authOptions`/`auth` saneados.
- `useSession` somente sob `<SessionProvider />`.
- Fuso horário na listagem (datas exibidas em pt-BR corretas).
- Colisão de UI com sidebar colapsada (bordas/overflow).

---

## 🚀 Próximos passos sugeridos

### Curto prazo

1. **Validações Zod** mais completas nas rotas (vehicles, expenses, reminders) com mensagens amigáveis.
2. **Otimizadores de UX**
   - Loading states mais suaves e **otimistic UI** em mutations.
   - Empty states com CTAs (ex.: criar primeiro veículo/despesa).
3. **Filtros avançados de Despesas**
   - Intervalo de datas (de/até).
   - Filtros combinados (status, faixa de valor, texto na descrição).
   - Exportação CSV das despesas filtradas.
4. **Dashboard**
   - KPIs do mês (gasto total, por veículo, por tipo).
   - Gráfico simples (gastos/mês) com Recharts.
5. **Acessibilidade**
   - `aria-*`, ordem de tab, foco visível; garantir focus trap em todos os modais.

### Médio prazo

6. **Reminders**
   - Notificações por e-mail (cron) de lembretes vencendo.
   - Regras derivadas de abastecimento/manutenção (próxima revisão por km/dias).
7. **Uploads**
   - Mover para storage dedicado (S3/R2/Cloudinary com presets e assinaturas).
8. **Segurança**
   - Rate-limit nas APIs sensíveis.
   - Sanitização extra de strings (descrições, títulos).
9. **Logs & Observabilidade**
   - Logger estruturado e logs de Auditoria mínimos.
10. **Testes**

- Unitários para utilitários (formatters, masks).
- Integração (APIs) e e2e (Playwright).

### Longo prazo

11. **Performance**

- Cache/SWR de listas (stale-while-revalidate).
- Paginação infinita em despesas.

12. **Internacionalização**

- i18n se for necessário (pt-BR como default).

13. **Deploy**

- Pipeline de CI/CD (lint, typecheck, testes).
- Variáveis seguras e docs de ambiente.

---

## 📝 Convenções (para futuros PRs)

- **Conventional Commits** (`feat:`, `fix:`, `chore:`, `refactor:`, etc.).
- Nome de branch curto e descritivo, ex.: `feat/expenses-filters`.

---

## 🔗 Dicas para continuar o trabalho em um novo chat

- Cole a seção “Decisões de arquitetura” e “Próximos passos” ou envie este próprio `TODO.md`.
- Diga que o projeto é **GarageTrack** e que usamos **Next.js App Router + NextAuth v4 + PrismaAdapter + JWT**.
- Mencione que deseja manter **pt-BR** para datas e moedas.
