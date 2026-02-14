# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Added
- UC-13: Configuração Vitest para testes unitários
- UC-14: Configuração Playwright para testes E2E
- UC-15: Testes críticos (checkout, webhook, reembolso)
- UC-16: Email de conclusão via Brevo (relatório pronto)
- UC-17: Analytics Plausible (cookieless, LGPD friendly)
- UC-18: NFS-e automática via Asaas
- UC-19: Job de anonimização LGPD (2 anos)

### Changed
- Documentação saneada (removidos 4 obsoletos, arquivado 1 legacy)
- README atualizado com índice de documentação canônica
- Documentados 19 casos de uso (12 existentes + 7 pendentes)

### Fixed
- (Pendente: adicionar após implementação Sprint 4)

---

## [1.0.0] - 2026-02-09

### Added

#### Autenticação (LOTE A)
- UC-01: Autenticação via magic link (código 6 dígitos)
- UC-02: Verificação de magic code (sessão JWT 30 dias)
- UC-03: Auto-login via código da compra

#### Compra e Pagamento (LOTE B)
- UC-04: Validação de CPF/CNPJ (dígitos verificadores + blocklist)
- UC-05: Criação de compra + checkout Asaas (PIX hospedado)
- UC-06: Webhook Asaas (confirmação pagamento → processamento)

#### Processamento (LOTE C)
- UC-07: Processamento CPF (APIFull + Serper + GPT-4o-mini)
  - 6 steps: validação, dados cadastrais, homônimos, processos, notícias, análise IA
- UC-08: Processamento CNPJ (APIFull + Serper + GPT-4o-mini)
  - 6 steps: validação, dados cadastrais, homônimos, processos, notícias, análise IA

#### Relatório (LOTE D)
- UC-09: Acesso ao relatório (verificação ownership + expiração 7 dias)

#### Admin (LOTE E)
- UC-10: Admin - Gerenciar compras (listar, mark-paid, refund, process)
- UC-11: Admin - Gerenciar blocklist (adicionar, remover, listar)

#### LGPD (LOTE F)
- UC-12: Solicitação LGPD (protocolo único, 6 tipos de direitos)

#### Jobs e Background Tasks
- Job cleanup: SearchResult, MagicCode, Leads (Inngest cron)
- Job reembolso automático: retry 3x após 2h (Inngest)

#### Infraestrutura
- Rate limiting duplo (Edge middleware + banco de dados)
- Health check: APIFull + Brevo + Asaas
- Sentry: error tracking (client + server + edge)
- Modos de execução: MOCK_MODE, TEST_MODE, produção

### Changed
- Migração email: Resend → Brevo (commit `eb32e41`)
- Middleware: loading condicional do Sentry (Edge Runtime compatible)

### Fixed
- Middleware manifest error: Turbopack habilitado (commit `70479ef`)
- Build quebrado por erros TypeScript (commit `c29a1a1`)

### Security
- Blocklist LGPD (CPF/CNPJ com 3 motivos: titular, judicial, homônimo)
- JWT HMAC-SHA256 (HS256) em cookie httpOnly
- Rate limiting agressivo (3 req/hora em endpoints sensíveis)
- Webhook validation (token Asaas)
- Anti-enumeration: não vaza existência de emails

### Documentation
- Especificação técnica completa (docs/spec.md v3.2)
- Documentação backend (docs/back.md)
- Documentação frontend (docs/front.md)
- Fluxo completo do sistema (docs/fluxo-sistema.md)
- Cenários de uso (docs/cenarios.md)
- 12 casos de uso documentados (docs/uc/UC-01 a UC-12)

---

## [0.1.0] - 2026-02-08

### Added
- Projeto inicial: Next.js 14 + Prisma + Neon
- Design system completo v1.1 (Zilla Slab + IBM Plex Mono)
- 40+ componentes Radix UI
- Tokens CSS em 3 camadas (Primitive → Semantic → Component)
- Sistema de clima: ☀️ Sol / ☁️ Nuvens / ⛈️ Trovoada

### Documentation
- Design system documentado (docs/archive/design-system-v1.1-HISTORICO.md)

---

## Links

[Unreleased]: https://github.com/user/eopix/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/user/eopix/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/user/eopix/releases/tag/v0.1.0

---

## Notas de Versão

### Semantic Versioning
- **MAJOR** (X.0.0): Mudanças incompatíveis na API
- **MINOR** (x.Y.0): Novas funcionalidades retrocompatíveis
- **PATCH** (x.y.Z): Correções de bugs retrocompatíveis

### Categorias de Mudança
- **Added**: Novas funcionalidades
- **Changed**: Mudanças em funcionalidades existentes
- **Deprecated**: Funcionalidades que serão removidas
- **Removed**: Funcionalidades removidas
- **Fixed**: Correções de bugs
- **Security**: Correções de vulnerabilidades

### Política de Changelog
- Toda mudança significativa deve ser documentada aqui
- Agrupar mudanças por tipo (Added, Changed, Fixed, etc.)
- Referenciar UCs quando aplicável
- Incluir commits relevantes entre parênteses
- Manter ordem cronológica reversa (mais recente primeiro)
