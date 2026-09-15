# GarageTrack

App web em português para **controle pessoal de veículos**: cadastro da frota, despesas (abastecimento, manutenção, impostos, seguro, multas) com anexos, lembretes por km/data e um dashboard de gastos.

## Stack

- Next.js 15 (App Router) + React 19
- NextAuth v4 (Google + e-mail/senha com bcrypt)
- Prisma 6 + PostgreSQL
- Zod 4, Tailwind CSS 4
- Cloudinary (comprovantes)

## Requisitos

- Node.js 18.18+
- PostgreSQL com a extensão `citext` (`CREATE EXTENSION IF NOT EXISTS citext;`)

## Configuração

1. Copie [`.env.example`](.env.example) para `.env` e preencha `DATABASE_URL` e `NEXTAUTH_SECRET`.
2. Instale e prepare o banco:

```bash
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Rotas principais

| Caminho | Descrição |
| --- | --- |
| `/` | Landing |
| `/signin`, `/signup` | Autenticação |
| `/dashboard` | KPIs e gráficos do mês |
| `/vehicles` | CRUD de veículos |
| `/expenses` | Despesas, filtros e CSV |
| `/reminders` | Regras de manutenção/documentos |

## Deploy

O script `vercel-build` roda `prisma migrate deploy` e em seguida `next build`. Defina as mesmas variáveis do `.env.example` na Vercel. **Não rode o seed em produção.**
