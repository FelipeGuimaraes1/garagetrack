# GarageTrack — TODO

## Foundation

- [ ] Configurar Prisma e Client (`prisma init`, `.env`, `schema.prisma`)
- [ ] Criar migração inicial **com** extensão `citext` (placa case-insensitive)
- [ ] Rodar `npx prisma migrate dev` e validar no Beekeeper
- [ ] Preparar seed básico (1 usuário fake, 1 veículo, 2 despesas)

## UI/UX (Mobile-first)

- [ ] Definir layout base mobile (topbar + lista)
- [ ] Criar componentes: `PageHeader`, `Card`, `EmptyState`
- [ ] Aplicar paleta dark com CSS variables e utilitários
- [ ] Estados de carregamento e erro acessíveis

## Autenticação (Auth.js)

- [ ] Instalar e configurar Auth.js (providers: Credentials + Google)
- [ ] Adapter Prisma conectado às tabelas `Account`, `Session`, `VerificationToken`
- [ ] Middleware protegendo rotas de app
- [ ] Página `/sign-in` e `/sign-out` (mobile-first)

## Domínio: Veículos

- [ ] Nova página: **/vehicles** (lista com busca e filtros)
- [ ] Modal **CreateVehicleModal** (nickname, placa, combustível padrão)
- [ ] Edição e remoção (com confirmação)
- [ ] Validações (Zod) e máscaras amigáveis

## Domínio: Despesas

- [ ] Nova página: **/expenses** (lista filtrável por período, veículo, tipo)
- [ ] Modal **NewExpenseModal** (tipo, data, valor, descrição, km)
- [ ] Campos especiais para **ABASTECIMENTO** (litros, preço por litro, combustível, posto)
- [ ] Edição e remoção (com confirmação)
- [ ] Validações (Zod) e máscaras BR (separador decimal)
- [ ] Cards-resumo (mensal, por veículo, por tipo)

## Uploads (Cloudinary)

- [ ] Configurar unsigned upload (env: `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`)
- [ ] Componente `ReceiptUploader` (imagem/PDF) com preview e remoção
- [ ] Salvamento em `ExpenseAttachment` (url, contentType, size)

## Hooks (reutilizáveis)

- [ ] `useMobile` (breakpoints responsivos)
- [ ] `useVehicles` (fetch + cache + filtros)
- [ ] `useExpenses` (fetch + paginação + filtros)
- [ ] `useUpload` (estado de upload, progresso, erro)
- [ ] `useToast` (feedback de sucesso/erro padronizado)

## Acesso a Dados

- [ ] Rotas de API em **App Router** (`/api/vehicles`, `/api/expenses`, `/api/attachments`)
- [ ] Server Actions para criar/editar/remover (com Auth)
- [ ] Regras de autorização (somente dono acessa seus dados)

## Qualidade

- [ ] Utilitário de máscara BR (`src/lib/utils/mask-br.ts`)
- [ ] Zod schemas (`src/lib/validations/*.ts`)
- [ ] Utilitários de data/moeda (`formatCurrencyBRL`, `formatDateISO`)

## Deploy

- [ ] Variáveis de ambiente (Vercel)
- [ ] Banco Postgres (Neon/Render) + migrações
- [ ] Teste de uploads em produção (Cloudinary)

---

### Commits sugeridos (Conventional Commits)

- `chore(prisma): inicializa prisma e configura datasource`
- `feat(db): cria schema inicial com citext e relações`
- `feat(ui): aplica paleta dark e layout base mobile-first`
- `feat(auth): configura authjs com prisma adapter`
- `feat(vehicles): CRUD básico de veículos`
- `feat(expenses): CRUD de despesas com campos de abastecimento`
- `feat(uploads): integra cloudinary e anexos de despesa`
- `refactor(hooks): adiciona hooks useVehicles/useExpenses`
- `fix(validations): ajusta máscaras e validações BR`
- `docs: adiciona TODO.md e instruções de setup`
