# EOPIX

Consulta de risco para CPF/CNPJ com compra unitária, processamento assíncrono e relatório consolidado.

## Stack Atual

- Next.js 14 (App Router) + TypeScript
- PostgreSQL (Neon) + Prisma
- Pagamento: Stripe (checkout + webhook)
- Processamento: Inngest (pipeline reduzido)
- IA: OpenAI (`gpt-4o-mini`)
- Busca web: Serper
- Dados cadastrais/juridicos/financeiros: APIFull
- Auth: Google Sign-In + sessao + auto-login por codigo de compra

## Regras Operacionais

Leitura obrigatoria: [AGENTS.md](AGENTS.md)

Resumo:
- Trabalhar e commitar em `develop`
- Neon em `develop` para dev/teste
- `main` (git e Neon) reservado para producao
- Usar MCPs disponiveis sempre que aplicavel

## Documentacao Canonica

- API (fonte oficial): [docs/valores apis e dados.md](docs/valores%20apis%20e%20dados.md)
- Modos de execucao: [docs/modos-de-execucao.md](docs/modos-de-execucao.md)
- Fluxo funcional atual: [docs/fluxo-sistema.md](docs/fluxo-sistema.md)
- Custos e pipeline: [docs/custos-e-fluxo-processamento.md](docs/custos-e-fluxo-processamento.md)

Documentacao legado foi movida para:
- [docs/archive/legacy-2026](docs/archive/legacy-2026)

## Setup Rapido

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

## Scripts

Scripts ativos e suportados:
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npx tsx scripts/create-admin.ts`
- `npx tsx scripts/seed.ts`
- `npx tsx scripts/test-apis.ts` (smoke de `Stripe`, `APIFull`, `Serper`, `OpenAI`)

Detalhes: [scripts/README.md](scripts/README.md)
