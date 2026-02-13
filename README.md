# E o Pix? 💰

> Consulte informações públicas sobre empresas e pessoas antes de fechar negócio. Relatórios completos com análise de risco.

## 🚀 Stack Tecnológico

- **Framework**: Next.js 14 (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS + Design System customizado
- **Componentes**: Radix UI + Shadcn UI
- **Banco de Dados**: PostgreSQL com Prisma ORM
- **Autenticação**: Magic Link (código OTP de 6 dígitos)
- **Pagamentos**: Asaas
- **APIs**: APIFull, Escavador, Google Custom Search, BrasilAPI
- **IA**: OpenAI GPT-4o-mini (resumos e filtro de homônimos)
- **Email**: Brevo
- **Analytics**: Plausible
- **Error Tracking**: Sentry
- **Background Jobs**: Inngest

## 📚 Documentação

A documentação completa do projeto está organizada nos seguintes arquivos:

### Documentação Canônica
- **[spec.md](docs/spec.md)** - Especificação técnica completa (v3.2)
- **[back.md](docs/back.md)** - Documentação do backend (API routes, jobs, webhooks)
- **[front.md](docs/front.md)** - Documentação do frontend (componentes, páginas, fluxos)
- **[fluxo-sistema.md](docs/fluxo-sistema.md)** - Diagrama de fluxo completo do sistema
- **[cenarios.md](docs/cenarios.md)** - Cenários de uso e edge cases
- **[uc/](docs/uc/)** - Casos de uso detalhados (19 UCs)

### Documentação Operacional
- **[CHECKLIST-GOLIVE.md](docs/CHECKLIST-GOLIVE.md)** - Checklist para deploy em produção
- **[_meta/traceability.csv](docs/_meta/traceability.csv)** - Rastreabilidade de funcionalidades
- **[CHANGELOG.md](CHANGELOG.md)** - Histórico de mudanças

### Arquivos Históricos
- **[archive/](docs/archive/)** - Versões anteriores arquivadas

## 📁 Estrutura do Projeto

```
eopix/
├── src/
│   ├── app/              # App Router (Next.js 14)
│   │   ├── page.tsx      # Landing page
│   │   ├── consulta/     # Teaser e resultados
│   │   ├── compra/       # Checkout e confirmação
│   │   ├── minhas-consultas/  # Dashboard do usuário
│   │   ├── relatorio/    # Relatório completo
│   │   ├── api/          # API Routes
│   │   └── ...
│   ├── components/       # Componentes React
│   │   └── ui/           # Componentes UI (Radix/Shadcn)
│   ├── lib/              # Utilities e helpers
│   │   ├── validators.ts # Validação CPF/CNPJ
│   │   ├── prisma.ts     # Cliente Prisma
│   │   └── ...
│   └── styles/           # Design System CSS
│       ├── tokens.css    # Design tokens (v1.1)
│       ├── components.css
│       └── index.css
├── prisma/
│   └── schema.prisma     # Schema do banco de dados
└── .env.local.example    # Variáveis de ambiente
```

## 🎨 Design System

O projeto utiliza um Design System completo v1.1 com:

- **Tokens CSS** em 3 camadas (Primitive → Semantic → Component)
- **Cores principais**:
  - Papel (#F0EFEB) - Background principal
  - Amarelo (#FFD600) - Acento e CTAs
  - Preto (#1A1A1A) - Texto principal
- **Tipografia**: Zilla Slab (headings) + IBM Plex Mono (body)
- **Sistema de Clima**: ☀️ Sol / ☁️ Nuvens / ⛈️ Trovoada

## 🛠️ Configuração

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie `.env.local.example` para `.env.local` e preencha as variáveis:

```bash
cp .env.local.example .env.local
```

### 3. Configurar Banco de Dados

```bash
# Criar migração
npx prisma migrate dev --name init

# Gerar cliente Prisma
npx prisma generate
```

### 4. Executar em Desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📋 Scripts Disponíveis

```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build para produção
npm run start        # Inicia servidor de produção
npm run lint         # Executa ESLint
```

## 🔐 Fluxo de Autenticação

1. Usuário digita email
2. Sistema envia código de 6 dígitos via email (Brevo)
3. Usuário insere código
4. Sistema valida e cria sessão JWT
5. Sessão expira em 7 dias

## 💳 Fluxo de Compra

1. **Teaser**: Consulta gratuita com preview
2. **Checkout**: Pagamento via Pix (Asaas)
3. **Webhook**: Confirmação do pagamento
4. **Background Job**: Geração do relatório completo
5. **Entrega**: Email + Dashboard

## 📊 Modelos de Dados

- **User**: Usuários (identificados por email)
- **Session**: Sessões de autenticação
- **Purchase**: Compras/Consultas
- **Report**: Relatórios gerados
- **Lead**: Leads capturados
- **RateLimit**: Rate limiting

## 🔍 APIs Integradas

- **APIFull**: Dados cadastrais e processos
- **Escavador**: Dados jurídicos
- **Google Custom Search**: Notícias e menções
- **BrasilAPI**: CNPJ gratuito
- **OpenAI**: Resumos e filtro de homônimos

## 📝 Licença

© 2026 E o Pix? - Todos os direitos reservados
