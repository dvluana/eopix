# Plano de Conteúdo AI — EOPIX Blog (Sanity + Claude)

**Objetivo:** Construir autoridade SEO para capturar MEI, autônomos E empresas B2B (contabilidade, imobiliárias, mercados, bancos menores).
**Stack:** Sanity CMS + Claude MCP + Next.js Blog
**Cadência:** 2 posts/mês (manutenível com IA)

**Narrativa central de todos os posts:**
> *O problema não é falta de ferramenta — é que as ferramentas são fragmentadas. Para verificar um parceiro direito, você consulta o Serasa aqui, o SPC ali, os processos judiciais em outro lugar, o nome no Google em outro. O EOPIX resolve tudo em uma consulta.*

---

## Workflow de Criação com Sanity MCP

Com o Sanity MCP instalado, você pode criar posts diretamente pelo Claude:

```
"Cria um post no Sanity com título X, slug Y, e o seguinte conteúdo: ..."
```

O Claude vai:
1. Gerar o conteúdo otimizado para SEO
2. Criar o documento no Sanity via MCP
3. Definir metadados (title, description, slug, publishedAt)

### Workflow por post (30-45 min total)

```
1. Escolha o tema e keyword do calendário abaixo (2 min)
2. Cole o prompt base + personalize com o tema (5 min)
3. Revise fatos sobre concorrentes e disclaimers (15 min) ← obrigatório
4. Claude publica no Sanity via MCP (2 min)
5. Gere imagem no Ideogram ou Canva AI (5-10 min)
```

### Prompt base para geração de posts

```
Você é editor de conteúdo do EOPIX, serviço brasileiro de consulta CPF/CNPJ
(R$39,90 por consulta, sem assinatura, análise com IA que consolida dados cadastrais,
processos judiciais, histórico financeiro e menções públicas — tudo em uma consulta).

Público-alvo deste post: [MEI / contador / imobiliária / empresa de varejo]
Tom: direto, prático, sem juridiquês. Linguagem informal mas profissional.

Diferencial a mencionar naturalmente (não forçado):
O EOPIX resolve a fragmentação do mercado — hoje o usuário precisa consultar
Serasa em um lugar, SPC em outro, processos judiciais em outro. Com EOPIX é uma
consulta só, com ticket competitivo (R$39,90 avulso, sem mensalidade).

Regras obrigatórias:
- NÃO citar preços de concorrentes como fatos — apenas "verifique no site oficial"
- NÃO fazer afirmações negativas sobre concorrentes sem fonte verificável
- SEMPRE incluir disclaimer LGPD quando envolver consulta de dados de terceiros
- SEMPRE incluir disclosure quando recomendar o EOPIX
- Mínimo 800 palavras, máximo 1.500
- Incluir FAQ com 3-5 perguntas (rich snippets)

Crie um post sobre: [TEMA]
Keyword primária: [KEYWORD]
Inclua: intro, H2/H3 com seções práticas, lista ou checklist, FAQ, CTA final.
```

---

## Calendário Editorial — 12 meses

### Fase 1: Fundação (meses 1-3)
*Conteúdo informacional + comparação. Constrói E-E-A-T e captura TOFU/MOFU.*

| Mês | Semana | Post | Keyword | Segmento |
|---|---|---|---|---|
| 1 | 1 | **Melhores ferramentas de consulta CPF/CNPJ em 2026** | `melhores ferramentas consulta cpf cnpj` | Geral |
| 1 | 3 | **Como verificar CPF de fornecedor antes de fechar negócio** | `verificar cpf fornecedor` | MEI |
| 2 | 1 | **LGPD e consulta de CPF: o que é legal para empresas** | `consultar cpf lgpd empresa` | Geral |
| 2 | 3 | **Contador: como centralizar consultas de CPF/CNPJ de clientes** | `consulta cpf cnpj contabilidade` | B2B contabil |
| 3 | 1 | **Como verificar CPF de inquilino antes de assinar contrato** | `verificar cpf inquilino` | B2B imob |
| 3 | 3 | **Score de crédito vs. relatório de risco: qual a diferença?** | `diferença score credito relatorio risco` | Geral |

### Fase 2: Conversão B2B (meses 4-6)
*Conteúdo com intenção comercial. Foco em casos de uso B2B e captura de leads empresariais.*

| Mês | Semana | Post | Keyword | Segmento |
|---|---|---|---|---|
| 4 | 1 | **Vender a prazo para CNPJ: como verificar antes de dar crédito** | `verificar cnpj antes dar credito` | B2B varejo |
| 4 | 3 | **5 documentos que toda imobiliária deve verificar no inquilino** | `documentos verificar inquilino` | B2B imob |
| 5 | 1 | **CNPJ laranja: como identificar antes de fechar negócio** | `cnpj laranja como identificar` | Geral |
| 5 | 3 | **Due diligence para MEI: checklist completo antes de escolher sócio** | `due diligence mei socio` | MEI |
| 6 | 1 | **Inadimplência B2B: como reduzir risco antes de vender a prazo** | `inadimplencia b2b reduzir risco` | B2B varejo |
| 6 | 3 | **Como fazer triagem de candidatos com consulta de CPF** | `triagem candidatos consulta cpf` | B2B RH |

### Fase 3: Autoridade e Cobertura (meses 7-12)
*Conteúdo de especialidade, casos de uso avançados, long-tail profundo.*

| Mês | Post | Keyword | Segmento |
|---|---|---|---|
| 7 | **Golpes com CNPJ: os mais comuns e como se proteger** | `golpes cnpj como proteger` | Geral |
| 7 | **Como verificar se um MEI está regularizado antes de contratar** | `verificar mei regularizado` | MEI/B2B |
| 8 | **Protestos em cartório: o que significam no relatório de crédito** | `protestos cartorio cpf cnpj` | Educacional |
| 8 | **Como consultar processos judiciais de uma empresa por CNPJ** | `consultar processos judiciais cnpj` | B2B |
| 9 | **Verificar antecedentes de parceiro comercial: guia prático** | `verificar antecedentes parceiro comercial` | MEI/B2B |
| 9 | **KYC para fintechs: como verificar CPF/CNPJ na abertura de conta** | `kyc cpf cnpj fintech` | B2B fintech |
| 10 | **Contrato de prestação de serviço: o que verificar no CPF do contratado** | `verificar cpf prestador servico` | MEI/B2B |
| 10 | **Análise de risco com IA: como funciona e por que importa** | `analise risco ia cpf cnpj` | Educacional |
| 11 | **Relatório de risco vs. consulta simples: quando cada um faz sentido** | `relatorio risco cpf quando usar` | MOFU |
| 11 | **Como proteger sua imobiliária de inquilinos problemáticos** | `proteger imobiliaria inquilinos problematicos` | B2B imob |
| 12 | **EOPIX vs. consultar Serasa + SPC + Jusbrasil separado: comparação real** | `eopix vs serasa spc` | MOFU |
| 12 | **Melhores ferramentas de consulta CPF/CNPJ em 2027** (atualizar post 1) | — | Manutenção |

---

## Landing Pages B2B (fora do blog — implementar mês 1-2)

Essas não são posts de blog. São páginas de conversão focadas em segmento.

### `/para-contabilidades`
- H1: "EOPIX para escritórios de contabilidade: consulte CPF/CNPJ de clientes em um lugar"
- Foco: centralização (antes: Receita Federal + Serasa + processos separados), preço competitivo
- CTA: "Consultar agora — R$39,90 por relatório completo"

### `/para-imobiliarias`
- H1: "Triagem de inquilinos completa: score, processos e cadastral em uma consulta"
- Foco: eliminar o vai-e-vem entre SPC + consulta judicial + pesquisa manual
- CTA: "Testar gratuitamente com um relatório de exemplo"

### `/para-empresas`
- H1: "Consulte CPF e CNPJ de clientes, fornecedores e sócios — sem assinar nada"
- Foco: ticket avulso (sem mensalidade), sem compromisso
- CTA: "Ver relatório de exemplo"

---

## Templates de Post

### Template: How-to

```markdown
# Como [fazer X] [para quem] — Guia Completo

[Intro: por que isso importa. Mencione o problema da fragmentação se relevante.]

## Por que [X] é importante antes de [Y]
[2-3 parágrafos com contexto e risco de não fazer]

## Passo a passo

### 1. [Passo 1]
### 2. [Passo 2]
### 3. Consolide tudo em uma consulta
[Aqui entra o EOPIX de forma natural — não forçada]

## Checklist rápido
- [ ] item 1
- [ ] item 2

## Perguntas frequentes
**[Pergunta]?** [Resposta direta]

---
*Precisa verificar um CPF ou CNPJ agora? O EOPIX gera um relatório completo —
cadastral, judicial e financeiro — em minutos, por R$39,90, sem mensalidade.*
*[Consultar agora →](https://eopix.com.br/consulta)*

> Disclosure: Este artigo é publicado pelo EOPIX. Quando recomendamos
> nosso serviço, temos interesse comercial nisso. Compare com outras
> opções antes de decidir.
```

### Template: Lista / Sinais de alerta

```markdown
# [N] [Sinais/Erros/Dicas] que [público] [contexto]

[Intro: gancho + por que ler]

## [Sinal] 1: [título curto]
[2-3 parágrafos. Exemplo prático.]

## [Sinal] 2: ...

## Como verificar [o problema central] antes de agir
[Seção que conecta com a solução — EOPIX + alternativas]

## Conclusão + CTA
```

---

## Regras de compliance editorial

### Sempre incluir em posts que mencionam concorrentes
```
*Preços e funcionalidades de serviços de terceiros verificados em [mês/ano].
Consulte o site oficial de cada serviço para informações atualizadas.*
```

### Sempre incluir quando EOPIX aparece como recomendação
```
> Disclosure: Este artigo é publicado pelo EOPIX. As recomendações do nosso
> serviço refletem nosso interesse comercial — compare antes de decidir.
```

### Sempre incluir em posts sobre consulta de dados de pessoas
```
*A consulta de CPF/CNPJ de terceiros para fins comerciais tem base legal no
legítimo interesse (Art. 7º, IX, LGPD) quando realizada para análise de risco.
[Ver nossa política de privacidade](https://eopix.com.br/privacidade).*
```

### Nunca publicar sem revisar
- Preços de concorrentes → apenas "verifique em [site]"
- ❌ em features de concorrentes → só se verificável no site público deles
- Críticas subjetivas → remover, substituir por fatos objetivos
- "Somos os únicos conformes com LGPD" → jamais

---

## Schema Sanity para compliance

```typescript
// sanity/schemas/blogPost.ts
export default {
  name: 'blogPost',
  title: 'Blog Post',
  type: 'document',
  fields: [
    { name: 'title', type: 'string' },
    { name: 'slug', type: 'slug', options: { source: 'title' } },
    { name: 'publishedAt', type: 'datetime' },
    { name: 'excerpt', type: 'text', description: 'Meta description (max 160 chars)' },
    { name: 'primaryKeyword', type: 'string' },
    { name: 'segment', type: 'string',
      options: { list: ['geral', 'mei', 'contabilidade', 'imobiliaria', 'varejo', 'fintech'] }
    },
    { name: 'body', type: 'array', of: [{ type: 'block' }] },
    // Checklist de compliance — visual no Studio
    { name: 'hasCompetitorMentions', type: 'boolean', title: 'Menciona concorrentes?' },
    { name: 'competitorPricesRemoved', type: 'boolean', title: 'Preços de concorrentes removidos/linkados?' },
    { name: 'competitorDisclaimer', type: 'boolean', title: 'Disclaimer de concorrentes incluído?' },
    { name: 'lgpdDisclaimer', type: 'boolean', title: 'Disclaimer LGPD incluído?' },
    { name: 'authorDisclosure', type: 'boolean', title: 'Disclosure EOPIX incluído?' },
    { name: 'factsVerified', type: 'boolean', title: 'Fatos sobre concorrentes verificados nos sites oficiais?' },
  ],
}
```

---

## Arquitetura do Blog no Next.js

### Rota
`/blog` — padrão, limpo, rankeia melhor que `/artigos` ou `/conteudo`

```
app/
  blog/
    page.tsx          ← listagem de posts (busca do Sanity via GROQ)
    [slug]/
      page.tsx        ← post individual (generateStaticParams para SSG)
      loading.tsx
```

### Seção na Home
Sim — bloco "Últimos artigos" abaixo do fold na landing page (`app/page.tsx`).
3 posts mais recentes em formato de card. Serve como:
- Sinal de E-E-A-T para o Google (site ativo, tem conteúdo)
- Conversão orgânica de visitantes que chegam pela home

```tsx
// Posição sugerida na home: após seção de features, antes do CTA final
<section id="blog">
  <h2>Aprenda antes de consultar</h2>
  <BlogPreview posts={latestPosts} /> {/* 3 posts do Sanity */}
  <a href="/blog">Ver todos os artigos →</a>
</section>
```

### Sitemap
Adicionar `/blog` e `/blog/[slug]` ao sitemap XML. Configurar `next-sitemap` ou sitemap manual em `app/sitemap.ts`.

---

## Geração de Imagens com Google AI (Imagen)

### Configuração (NUNCA colocar a key no código)
```bash
# .env.local (nunca commitar)
GOOGLE_AI_API_KEY=sua_chave_aqui
```

```bash
# Vercel → Settings → Environment Variables
GOOGLE_AI_API_KEY=sua_chave_aqui
```

### Integração sugerida (script local para gerar imagens)
```typescript
// scripts/generate-blog-image.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

// Usar Imagen 3 para gerar imagens de blog
async function generateBlogImage(postTitle: string, style: string) {
  // Imagen 3 via API
  const model = genAI.getGenerativeModel({ model: "imagen-3.0-generate-002" });
  // ... gerar e salvar em /public/blog/images/
}
```

**Nota:** Imagen 3 está disponível no Google AI Studio, mas o acesso via API pode exigir billing ativo. Verificar disponibilidade do modelo `imagen-3.0-generate-002` na sua região/plano.

### Alternativa se Imagen não estiver disponível na API
Usar o Google AI Studio diretamente (interface web) para gerar imagens e baixar manualmente — mais lento mas sem necessidade de integração de código.

---

## Imagens AI para os posts

Para gerar imagens para os artigos:

**Ideogram** (recomendado para infográficos com texto)
- Prompt exemplo: `"Infographic showing CPF consultation process in Brazil, clean minimalist style, black and white with yellow accent, Portuguese text labels"`
- Melhor para: tabelas de comparação visuais, checklists, diagramas de processo

**Canva AI (Magic Media)**
- Mais fácil de usar, bom para ilustrações conceituais
- Integra diretamente com templates de blog

**DALL-E 3 (ChatGPT Plus)**
- Bom para ilustrações conceituais (segurança, negócios, documentos)
- Evitar rostos realistas (risco de deepfake perception)

**Padrão de imagem recomendado por tipo de post:**
- Comparison pages → tabela como imagem estática (Canva)
- How-to posts → diagrama de passo-a-passo (Ideogram)
- Alert/sinais posts → ícone de alerta + lista visual (Canva)
- OG image padrão → logo EOPIX + título do post (Canva template)

---

## KPIs

| Segmento | Meta 3m | Meta 6m | Meta 12m |
|---|---|---|---|
| Posts publicados | 6 | 12 | 24 |
| Impressões/mês | 2.000 | 8.000 | 25.000 |
| Cliques/mês | 100 | 400 | 1.500 |
| Conversões via blog | 3 | 15 | 60 |
| Keywords top 30 | 5 | 20 | 50 |

**Revisão mensal:** Search Console → identificar posts com impressões mas CTR baixo → ajustar title tag e meta. Posts com posição 11-30 → expandir conteúdo para subir.
