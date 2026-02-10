# E O PIX? — Controle de Implementação

> **Documento vivo** de acompanhamento do protótipo navegável.  
> Cada componente tem: spec, prompt para Claude, anotações dev e checklist de validação.  
> **T.1 (Home) já está codada** e serve como referência visual para todas as demais telas.

---

## 01 · Progresso Geral

| Criar | Ajustar | Pronto | Total  |
| :---: | :-----: | :----: | :----: |
| **5** |  **0**  | **16** | **21** |

**Progresso: 16 de 21 componentes (76%)**

### Mapa Completo de Componentes

| ID      | Componente                     | Tipo        | Rota                   | Fase | Status    |
| ------- | ------------------------------ | ----------- | ---------------------- | ---- | --------- |
| **T.1** | Home (Input)                   | Tela        | `/`                    | MVP  | ✅ Pronto |
| **T.2** | Teaser (Pré-Pagamento)         | Tela        | `/consulta/{term}`     | MVP  | ✅ Pronto |
| **T.3** | Confirmação Pós-Pagamento      | Tela        | `/compra/confirmacao`  | MVP  | ✅ Pronto |
| **T.4** | Login (Magic Link)             | Tela        | `/minhas-consultas`    | MVP  | ✅ Pronto |
| **T.5** | Minhas Consultas               | Tela        | `/minhas-consultas`    | MVP  | ✅ Pronto |
| **T.6** | Relatório: Sol (Limpo)         | Tela        | `/relatorio/{id}`      | MVP  | ✅ Pronto |
| **T.7** | Relatório: Chuva (Ocorrências) | Tela        | `/relatorio/{id}`      | MVP  | ✅ Pronto |
| **T.8** | Manutenção (API Down)          | Tela/Estado | `/`                    | MVP  | ✅ Pronto |
| **P.1** | Termos de Uso                  | Página      | `/termos`              | S4   | ✅ Pronto |
| **P.2** | Política de Privacidade        | Página      | `/privacidade`         | S4   | ✅ Pronto |
| **P.3** | Direitos do Titular            | Página      | `/privacidade/titular` | S4   | ✅ Pronto |
| **E.1** | Erro 404                       | Erro        | `/*`                   | S4   | ✅ Pronto |
| **E.2** | Erro 500                       | Erro        | `/*`                   | S4   | ✅ Pronto |
| **E.3** | Relatório Expirado             | Erro        | `/relatorio/{id}`      | S4   | ✅ Pronto |
| **E.4** | Link Inválido                  | Erro        | `/*`                   | S4   | ✅ Pronto |
| **M.1** | Modal Corrigir E-mail          | Modal       | –                      | MVP  | ✅ Pronto |
| **A.1** | Admin: Dashboard               | Tela        | `/admin`               | S4   | 📋 Criar  |
| **A.2** | Admin: Blocklist               | Tela        | `/admin/blocklist`     | MVP  | 📋 Criar  |
| **A.3** | Admin: Health Check            | Tela        | `/admin/health`        | MVP  | 📋 Criar  |
| **A.4** | Admin: Compras/Reembolsos      | Tela        | `/admin/compras`       | MVP  | 📋 Criar  |
| **A.5** | Admin: Leads                   | Tela        | `/admin/leads`         | MVP  | 📋 Criar  |

> **Nomenclatura:** T.X = Telas do fluxo público · P.X = Páginas institucionais · E.X = Páginas de erro · M.X = Modais · A.X = Telas admin.  
> **T.1 Home já está codada** e serve como referência visual de linha para todas as demais telas.

---

> **Nota:** Para Design System completo, consultar `docs/legacy/DESIGN-SYSTEM.md` (v1.1 oficial).

---

## 02 · Ordem de Execução

> Rodadas agrupadas por dependência. Cada rodada só começa quando a anterior está validada.
> Para Mapa de Variantes e Organização Figma, consultar `docs/legacy/DESIGN-SYSTEM.md`.

### Rodada 1 — Fluxo Principal (Input → Pagamento → Confirmação)

Core da experiência. Teaser como principal tela de conversão. T.1 (Home) já existe codada.

| #   | ID      | Componente                   | Depende de   |
| --- | ------- | ---------------------------- | ------------ |
| 1   | **T.2** | Teaser (Pré-Pagamento)       | T.1 (existe) |
| 2   | **T.3** | Confirmação Pós-Pagamento    | T.2          |
| 3   | **M.1** | Modal Corrigir E-mail        | T.3          |
| 4   | **T.8** | Estado Manutenção (API Down) | T.2          |

### Rodada 2 — Área Logada (Login → Consultas → Relatório)

Toda a experiência pós-pagamento até a entrega do valor.

| #   | ID      | Componente         | Depende de |
| --- | ------- | ------------------ | ---------- |
| 5   | **T.4** | Login (Magic Link) | T.3        |
| 6   | **T.5** | Minhas Consultas   | T.4        |
| 7   | **T.6** | Relatório: Sol     | T.5        |
| 8   | **T.7** | Relatório: Chuva   | T.5        |

### Rodada 3 — Admin

Painel administrativo. Layout próprio (sidebar + área de conteúdo).

| #   | ID      | Componente                | Depende de |
| --- | ------- | ------------------------- | ---------- |
| 9   | **A.1** | Admin: Dashboard          | –          |
| 10  | **A.2** | Admin: Blocklist          | A.1        |
| 11  | **A.3** | Admin: Health Check       | A.1        |
| 12  | **A.4** | Admin: Compras/Reembolsos | A.1        |
| 13  | **A.5** | Admin: Leads              | A.1        |

### Rodada 4 — Páginas Institucionais + Erros

Páginas de suporte. Podem ser feitas em qualquer ordem.

| #   | ID      | Componente              | Depende de |
| --- | ------- | ----------------------- | ---------- |
| 14  | **P.1** | Termos de Uso           | –          |
| 15  | **P.2** | Política de Privacidade | –          |
| 16  | **P.3** | Direitos do Titular     | –          |
| 17  | **E.1** | Erro 404                | –          |
| 18  | **E.2** | Erro 500                | –          |
| 19  | **E.3** | Relatório Expirado      | –          |
| 20  | **E.4** | Link Inválido           | –          |

---

## 03 · Telas: Prompts para Claude

> **Fluxo de trabalho:**
>
> 1. Você diz "gera T.3" (ou qualquer ID)
> 2. Claude lê o brief + o que já foi feito nas telas anteriores
> 3. Gera o prompt completo e detalhado
> 4. Você implementa, valida, e parte pro próximo

> ⚠️ **INSTRUÇÕES GLOBAIS (incluídas em todos os prompts):**
>
> 1. "Para qualquer elemento visual não especificado neste prompt, consultar a Home (/) já codada do E O PIX? e replicar a mesma linha visual."
> 2. "Nomear o frame como `[ID] Nome / Variante` (ex: T.2 Teaser / Default)."
> 3. "Adicionar bloco de anotações DEV como layer de texto no canto superior direito do frame (x:1460), fora da área visível."

---

### RODADA 1 — Fluxo Principal

---

### T.2 — Teaser (Pré-Pagamento) `MVP` `✅ Pronto`

**Spec:** Tela de conversão principal. Mostra prévia borrada do relatório para gerar curiosidade. Formulário de compra abaixo.  
**Variante:** Component Set: Teaser / Default

#### Anotações Backend

```
// ROTA: /consulta/{term}
// MODELO: Purchase (pré-criação)
// ENDPOINT: GET /api/search/{term}/teaser
// AUTH: Nenhuma (página pública)
// CAMPO: CPF mascarado → req.params.term (masked server-side)
// CAMPO: email → Purchase.email (criado no submit)
// CAMPO: preço → config.PRICE (fixo R$ 29,90)
// INTEGRAÇÃO: Redirect para Asaas checkout com email pré-preenchido
// LOADING: Nenhum (dados são placeholder blur, não dados reais)
// ERRO: "CPF/CNPJ inválido" inline abaixo do campo (vem da Home)
```

#### Prompt

```
Criar tela "Teaser Pré-Pagamento" para o produto E O PIX?.
Frame: 1440x900px. Background: #F0EFEB.
Fontes: Zilla Slab (títulos, bold) + IBM Plex Mono (corpo, mono).

INSTRUÇÃO VISUAL: Para qualquer elemento não especificado, seguir a mesma linha visual da Home já codada do E O PIX? (proporções, espaçamentos, tipografia, bordas, sombras).

NAV (topo):
- Altura 64px, fundo rgba(26,26,26,0.97), backdrop blur
- Logo "E O PIX?" em Zilla Slab bold amarelo #FFD600 à esquerda

HERO / HEADER DA TELA:
- Texto: "Consulta para o CPF: ***.456.789-**" em Zilla Slab 28px bold #1A1A1A
- Subtexto: "Veja o que encontramos antes de fechar negócio." em IBM Plex Mono 14px #666666

ÁREA DE CARDS BORRADOS (principal):
6 cards em grid 2x3, cada um representando uma seção do relatório:
- Card 1: "Cadastro Empresarial" com ícone Building
- Card 2: "Situação Financeira" com ícone DollarSign
- Card 3: "Processos Judiciais" com ícone Scale
- Card 4: "Notícias e Web" com ícone Globe
- Card 5: "Reclame Aqui" com ícone MessageSquare
- Card 6: "Resumo IA" com ícone Brain

Cada card: fundo #FFFFFF, borda 1px #E8E7E3, radius 6px, padding 24px.
DENTRO de cada card: 3-4 linhas de texto placeholder borrado (blur CSS pesado, gaussiano).
Texto placeholder exemplo: "XX protestos encontrados", "XX processos ativos".
Faixa amarela translúcida sobre os cards: "Exemplo de dados que serão desbloqueados" em IBM Plex Mono 12px bold.

FORMULÁRIO DE COMPRA (abaixo dos cards):
Card branco #FFFFFF, borda 1px #E8E7E3, radius 6px, padding 32px.
- Label: "Para onde enviamos o relatório?" em IBM Plex Mono 12px #666666
- Input e-mail: placeholder "Seu melhor e-mail", borda 2px #1A1A1A, radius 8px, padding 12px 16px
- Checkbox: "Li e aceito os Termos de Uso e a Política de Privacidade" (links sublinhados)
- Botão: "Desbloquear Relatório · R$ 29,90"
  - Fundo #FFD600, texto #1A1A1A, font IBM Plex Mono 700 14px, radius 8px, padding 12px 24px
  - Largura 100% do card

DADOS DE EXEMPLO:
- Input e-mail: criar variante VAZIO (placeholder) e PREENCHIDO ("joao.silva@gmail.com")
- Checkbox: criar variante DESMARCADO e MARCADO
- Botão: variante DESABILITADO (cinza #D5D4D0) e HABILITADO (amarelo #FFD600)

COMPORTAMENTO DE PROTÓTIPO:
- Input vazio → clica → variante preenchida
- Checkbox desmarcado → clica → marcado
- Botão habilitado → clica → navega para T.3 (Confirmação)

CORES EXATAS:
Background: #F0EFEB | Cards: #FFFFFF | Texto título: #1A1A1A | Texto corpo: #666666
Botão: #FFD600 texto #1A1A1A | Borda input: #1A1A1A | Border cards: #E8E7E3

NÃO usar: Inter, Roboto, Arial. Não usar gradientes. Não usar bordas arredondadas maiores que 12px. Não usar sombras exageradas.

NOMENCLATURA:
- Nome do frame: "T.2 Teaser / Default"
- Component Set "Teaser" (variante Default). T.8 será variante "Maintenance" do mesmo set.
- Layers: "Section / Cards Blur", "Section / Form Compra", "Button / Primary / Desbloquear", "Input / Email"

ANOTAÇÕES DEV (x:1460):
// ROTA: /consulta/{term}
// MODELO: Purchase
// ENDPOINT: GET /api/search/{term}/teaser
// AUTH: Nenhuma
// CAMPO: cpf mascarado → params.term (masked)
// CAMPO: email → Purchase.email
// CAMPO: preço → config.PRICE (R$ 29,90)
// INTEGRAÇÃO: Redirect Asaas checkout
// LOADING: Nenhum (blur puro, não dados reais)
// ERRO INLINE: "CPF/CNPJ inválido" | "E-mail obrigatório" | "Aceite os termos"
```

#### Checklist

- [ ] Frame 1440x900
- [ ] Background `#F0EFEB`
- [ ] Nav escuro com logo amarelo
- [ ] CPF mascarado no topo (`***.456.789-**`)
- [ ] 6 cards com blur pesado (dados placeholder)
- [ ] Faixa "Exemplo de dados que serão desbloqueados"
- [ ] Nenhum dado real visível
- [ ] Input e-mail com variantes vazio/preenchido
- [ ] Checkbox termos com variantes
- [ ] Botão com variantes desabilitado/habilitado
- [ ] Fontes: Zilla Slab + IBM Plex Mono
- [ ] Navegação: botão → T.3

---

### T.3 — Confirmação Pós-Pagamento `MVP` `✅ Pronto`

**Spec:** Usuário retorna do Asaas após pagar. Confirma e-mail, mostra código da compra, orienta próximos passos.  
**Variante:** Frame único (sem variantes)

#### Anotações Backend

```
// ROTA: /compra/confirmacao?code={purchaseCode}
// MODELO: Purchase, User
// ENDPOINT: GET /api/purchase/{code}/confirmation
// AUTH: Nenhuma (link direto pós-pagamento)
// CAMPO: email → Purchase.email (User.email)
// CAMPO: código → Purchase.code (alfanumérico 6 chars)
// CAMPO: "Corrigir e-mail" → PATCH /api/purchase/{code}/email
// LOADING: Skeleton do card enquanto confirma pagamento
// WEBHOOK: Asaas envia POST /api/webhooks/asaas → cria Purchase
```

#### Prompt

```
Criar tela "Confirmação Pós-Pagamento" para E O PIX?.
Frame: 1440x900px. Background: #F0EFEB.
Fontes: Zilla Slab (títulos) + IBM Plex Mono (corpo). NÃO usar Inter, Roboto, Arial, sans-serif.

INSTRUÇÃO VISUAL: Para qualquer elemento não especificado, seguir a mesma linha visual da Home já codada do E O PIX?. Tom mínimo, editorial, monocromático com acentos amarelo #FFD600.

NAV (topo, 64px altura):
- Fundo rgba(26,26,26,0.97), backdrop-filter blur(12px)
- Logo "E O PIX?" em Zilla Slab 18px bold cor #FFD600, alinhado à esquerda, padding-left 32px
- Sem links de navegação nesta tela

CONTEÚDO CENTRAL (card branco, centrado na tela, max-width 560px):
Card com fundo #FFFFFF, borda 1px #E8E7E3, border-radius 6px, box-shadow 0 2px 8px rgba(0,0,0,0.10), padding 40px. Centralizado vertical e horizontalmente no espaço abaixo da nav.

Elementos dentro do card, de cima para baixo:

1. Ícone de check: círculo com fundo #66CC66, 48px de diâmetro, checkmark branco dentro. Centralizado. NÃO usar emoji, criar o ícone visual.

2. Título: "Pagamento confirmado!" em Zilla Slab 28px bold #1A1A1A. Centralizado. Margin-top 16px.

3. Bloco e-mail em destaque (margin-top 24px, text-align center):
   - Texto "Enviamos para" em IBM Plex Mono 14px #666666
   - E-mail "joao.silva@gmial.com" em IBM Plex Mono 16px bold #1A1A1A, com fundo #FFFDE6, padding 8px 12px, border-radius 4px. Display inline-block.
   - Texto "Está correto?" em IBM Plex Mono 14px #666666
   - Link "Corrigir e-mail" em IBM Plex Mono 14px #1A1A1A, text-decoration underline.
   NOTA: O e-mail tem typo proposital ("gmial" em vez de "gmail") para justificar o link de correção.

4. Código da compra (margin-top 20px, text-align center):
   - "Seu código:" em IBM Plex Mono 14px #666666
   - "#A7K2M9" em IBM Plex Mono 14px bold #1A1A1A

5. Callout informativo (margin-top 24px):
   - Fundo #F0EFEB, borda esquerda 3px #FFD600, padding 16px, border-radius 0 6px 6px 0
   - Linha 1: "Sua consulta está sendo processada. Pode levar alguns minutos." em IBM Plex Mono 13px #1A1A1A
   - Linha 2: "Você receberá um e-mail quando estiver pronto." em IBM Plex Mono 13px #666666

6. Callout spam (margin-top 12px):
   - Fundo #F0EFEB, SEM borda lateral, padding 16px, border-radius 6px
   - "Não recebeu? Verifique o spam. Você também pode acessar /minhas-consultas a qualquer momento." em IBM Plex Mono 13px #666666
   - "/minhas-consultas" em bold

7. Botão (margin-top 24px):
   - Texto: "Ir para Minhas Consultas"
   - Fundo #FFD600, texto #1A1A1A, IBM Plex Mono 14px bold
   - Border-radius 8px, padding 16px, width 100%

NOMENCLATURA:
- Nome do frame: "T.3 Confirmação Pós-Pagamento"
- Layers: "Icon / CheckSuccess", "Block / EmailDestaque", "Link / CorrigirEmail", "Callout / Processando", "Callout / Spam", "Button / Primary / IrConsultas"

ANOTAÇÕES DEV (x:1460):
// ROTA: /compra/confirmacao?code={purchaseCode}
// MODELO: Purchase, User
// ENDPOINT: GET /api/purchase/{code}/confirmation
// AUTH: Nenhuma
// CAMPO: email → Purchase.email
// CAMPO: código → Purchase.code
// AÇÃO: "Corrigir e-mail" → abre M.1 → PATCH /api/purchase/{code}/email
// WEBHOOK: POST /api/webhooks/asaas (trigger)
```

#### Checklist

- [ ] Ícone check verde (`#66CC66`)
- [ ] E-mail em destaque com fundo amarelo claro
- [ ] Link "Corrigir e-mail" funcional → M.1
- [ ] Código da compra visível
- [ ] Callout com borda amarela (aviso tempo)
- [ ] Callout spam separado
- [ ] Botão → T.4

---

### M.1 — Modal Corrigir E-mail `MVP` `✅ Pronto`

**Spec:** Modal simples sobre T.3. Usuário corrige o e-mail digitado errado.  
**Variante:** Modal overlay (não é variante de tela)

#### Anotações Backend

```
// ROTA: Overlay sobre /compra/confirmacao
// ENDPOINT: PATCH /api/purchase/{code}/email
// BODY: { newEmail: string }
// EFEITO: Atualiza User.email + Purchase.email, reenvia notificações via Brevo
// VALIDAÇÃO: E-mail válido, não vazio
// ERRO INLINE: "E-mail inválido" abaixo do input
```

#### Prompt

```
Criar modal "Corrigir E-mail" para E O PIX?.
Overlay sobre tela T.3 (Confirmação).
Fundo overlay: rgba(26,26,26,0.60) com backdrop blur 4px.

INSTRUÇÃO VISUAL: Para qualquer elemento não especificado, seguir a mesma linha visual da Home já codada do E O PIX?.

MODAL (centrado):
- Max-width: 440px
- Fundo: #FFFFFF, radius 6px, shadow 0 4px 16px rgba(0,0,0,0.08), padding 32px
- Botão fechar (X) no canto superior direito, ícone Lucide X, 20px, cor #888888

1. Título: "Corrigir e-mail" em Zilla Slab 18px bold
2. Label: "E-mail atual:" em IBM Plex Mono 12px #888888
   - "joao.silva@gmial.com" em 14px #CC3333 (riscado, text-decoration line-through)
3. Label: "Novo e-mail:" em IBM Plex Mono 12px #888888
   - Input: borda 2px #1A1A1A, radius 8px. Variante PREENCHIDO: "joao.silva@gmail.com"
4. Botão: "Salvar" fundo #FFD600, texto #1A1A1A, radius 8px, largura 100%
5. Texto micro: "O e-mail será atualizado e as notificações serão reenviadas." em 12px #888888

COMPORTAMENTO:
- Botão X → fecha modal, volta pra T.3
- Botão Salvar → fecha modal, volta pra T.3 (e-mail atualizado)

NOMENCLATURA:
- Nome do frame: "M.1 Modal Corrigir Email"
- Layers: "Overlay / Backdrop", "Modal / Container", "Input / NewEmail", "Text / OldEmail / Strikethrough", "Button / Primary / Salvar"

ANOTAÇÕES DEV (x:1460):
// OVERLAY sobre T.3
// ENDPOINT: PATCH /api/purchase/{code}/email
// BODY: { newEmail: string }
// VALIDAÇÃO: email format
// EFEITO: Atualiza User.email + Purchase.email, reenvia via Brevo
// ERRO INLINE: "E-mail inválido"
```

#### Checklist

- [ ] Overlay escuro com blur
- [ ] E-mail antigo riscado em vermelho
- [ ] Input novo e-mail funcional
- [ ] Botão Salvar fecha modal

---

### T.8 — Estado Manutenção (API Down) `MVP` `✅ Pronto`

**Spec:** Variante da T.2 quando Health Check detecta APIs fora. Botão desabilitado + captura de lead.  
**Variante:** Component Set: Teaser / Maintenance

#### Anotações Backend

```
// ROTA: /consulta/{term} (mesma de T.2, variante condicional)
// CONDIÇÃO: HealthCheck.allApisUp === false
// ENDPOINT health: GET /api/health (verifica status APIs)
// ENDPOINT lead: POST /api/leads
// BODY lead: { email, searchTerm, reason: "API_DOWN" }
// MODELO: LeadCapture
// LÓGICA: Se health retorna DOWN → renderiza esta variante em vez de Default
```

#### Prompt

```
Criar tela "Teaser / Maintenance" para E O PIX?.
VARIANTE do T.2 — mesma estrutura visual base, com diferenças específicas abaixo.
Frame: 1440x900px. Background: #F0EFEB.
Fontes: Zilla Slab (títulos) + IBM Plex Mono (corpo). NÃO usar Inter, Roboto, Arial, sans-serif.
Component Set: Teaser, Property: State=Maintenance.

INSTRUÇÃO VISUAL: Esta tela reutiliza a estrutura COMPLETA da T.2 Teaser Default. Para qualquer elemento não especificado, seguir a mesma linha visual da Home já codada do E O PIX?.

NAV (topo, 64px altura):
- Fundo rgba(26,26,26,0.97), backdrop-filter blur(12px)
- Logo "E O PIX?" em Zilla Slab 18px bold cor #FFD600, alinhado à esquerda, padding-left 32px

HERO (abaixo da nav):
- "RELATÓRIO PRONTO" badge: fundo #FFD600, texto #1A1A1A, font 9px bold uppercase, letter-spacing 2px
- "Encontramos 6 fontes sobre este CPF/CNPJ" em Zilla Slab 28px bold
- "Consulta para o CPF: ***.456.789-**" em IBM Plex Mono 14px #666666

6 CARDS BORRADOS (grid 2x3, gap 16px):
Idênticos ao T.2 Default — cada card com título legível + conteúdo placeholder com filter: blur(8px).
1. "Cadastro Empresarial" → "Situação: ████ | Abertura: ██/██/████ | Sócios: █ encontrados"
2. "Situação Financeira" → "Protestos: ██ | Valor: R$ █.███,██ | Dívidas: ██"
3. "Processos Judiciais" → "██ processos encontrados | Tribunais: ██ | Polo réu: ██"
4. "Notícias e Web" → "██ menções encontradas | Última: ██/██/████"
5. "Reclame Aqui" → "██ reclamações | ██ respondidas | Nota: █,█"
6. "Resumo por IA" → "Com base nos dados coletados, identificamos que ████████████████"
Faixa sobre os cards: "Exemplo de dados que serão desbloqueados" fundo rgba(26,26,26,0.85), cor #FFD600.

DIFERENÇAS EM RELAÇÃO AO T.2 DEFAULT:

1. Callout de manutenção NO TOPO do formulário:
   - Fundo #FFF0F0, borda esquerda 3px #CC3333, padding 16px, border-radius 0 6px 6px 0
   - Ícone AlertTriangle 20px cor #CC3333, à esquerda do texto
   - Texto: "Nossos servidores estão em manutenção. Tente novamente mais tarde."
   - Fonte: IBM Plex Mono 14px #CC3333

2. Input e-mail: MANTIDO (igual T.2)

3. Texto termos: MANTIDO

4. Botão de compra DESABILITADO:
   - Texto: "Indisponível" (substitui "Desbloquear Relatório · R$ 29,90")
   - Fundo #D5D4D0, texto #888888, cursor not-allowed
   - SEM hover, SEM efeito de clique

5. Seção de captura de lead (ABAIXO do botão desabilitado):
   - Separador: linha dashed 1px #E8E7E3, margin 20px 0
   - Label: "Quer ser avisado quando voltar?" em IBM Plex Mono 12px #666666
   - Input e-mail menor (width ~240px): borda 2px #1A1A1A, radius 8px, placeholder "seu@email.com"
   - Botão "Avisar-me": borda 2px #1A1A1A, fundo transparente, texto #1A1A1A, radius 8px
   - Estado pós-envio: "Recebemos! Avisaremos quando voltar." em IBM Plex Mono 14px #339933

NOMENCLATURA:
- Frame: "T.8 Teaser / Maintenance" dentro do Component Set "Teaser", Property State=Maintenance
- Layers: "Callout / APIDown", "Button / Primary / Disabled", "Section / LeadCapture", "Button / Ghost / AvisarMe"

ANOTAÇÕES DEV (x:1460):
// ROTA: /consulta/{term} (condicional)
// CONDIÇÃO: HealthCheck.allApisUp === false
// ENDPOINT: GET /api/health
// ENDPOINT: POST /api/leads { email, searchTerm, reason: "API_DOWN" }
// MODELO: LeadCapture
```

#### Checklist

- [ ] Callout vermelho de manutenção visível
- [ ] Botão principal cinza/desabilitado
- [ ] Campo de captura de lead presente
- [ ] Texto "Indisponível" no botão

---

### RODADA 2 — Área Logada

---

### T.4 — Login (Magic Link) `MVP` `✅ Pronto`

**Spec:** Tela de login com magic link. 2 estados: digitar e-mail e inserir código de 6 dígitos.  
**Variantes:** Component Set: Login / Email + Login / Código

#### Anotações Backend

```
// ROTA: /minhas-consultas (antes de autenticar)
// ENDPOINT estado 1: POST /api/auth/send-code { email }
// ENDPOINT estado 2: POST /api/auth/verify-code { email, code }
// MODELO: User (lookup by email)
// AUTH: Nenhuma → cria session após código válido
// INTEGRAÇÃO: Brevo (envio do código 6 dígitos)
// ERRO estado 1: "E-mail não encontrado" (sem compras)
// ERRO estado 2: "Código inválido" | "Código expirado"
// RATE LIMIT: Max 3 tentativas de código, depois "Solicite novo código"
```

#### Prompt

```
Criar tela "Login Magic Link" para E O PIX?.
2 frames separados (2 estados). Cada frame 1440x900px. Background: #F0EFEB.
Fontes: Zilla Slab (títulos) + IBM Plex Mono (corpo). NÃO usar Inter, Roboto, Arial, sans-serif.

INSTRUÇÃO VISUAL: Para qualquer elemento não especificado, seguir a mesma linha visual da Home já codada do E O PIX?.

NAV (topo, 64px altura — em AMBOS os frames):
- Fundo rgba(26,26,26,0.97), backdrop-filter blur(12px)
- Logo "E O PIX?" em Zilla Slab 18px bold cor #FFD600

═══════════════════════════════════
FRAME 1: ESTADO EMAIL (T.4a Login / Email)
═══════════════════════════════════

Card branco centrado na tela, max-width 440px.
Fundo #FFFFFF, borda 1px #E8E7E3, border-radius 6px, box-shadow 0 2px 8px rgba(0,0,0,0.10), padding 40px.

1. Título: "Minhas Consultas" em Zilla Slab 28px bold #1A1A1A. Centralizado.
2. Subtexto: "Digite seu e-mail para acessar suas consultas." em IBM Plex Mono 14px #666666. Centralizado.
3. Input e-mail (margin-top 24px): Borda 2px #1A1A1A, border-radius 8px, padding 14px 16px. Placeholder: "seu@email.com". Largura 100%.
4. Botão (margin-top 16px): "Enviar código" — Fundo #FFD600, texto #1A1A1A, IBM Plex Mono 14px bold. Border-radius 8px, padding 16px, width 100%.

═══════════════════════════════════
FRAME 2: ESTADO CÓDIGO (T.4b Login / Código)
═══════════════════════════════════

Card branco centrado (mesmo estilo do Frame 1).

1. Título: "Código enviado!" em Zilla Slab 28px bold #1A1A1A. Centralizado.
2. Subtexto: "Enviamos um código de 6 dígitos para joao.silva@gmail.com" (email em bold).
3. 6 caixinhas de input individuais (margin-top 24px):
   - Linha horizontal, gap 8px, centralizadas
   - Cada caixinha: 48px × 56px, borda 2px #1A1A1A, border-radius 8px
   - Font IBM Plex Mono 24px bold #1A1A1A, texto centralizado
   - Dados preenchidos: "4" "8" "2" "7" "1" "5"
4. Botão: "Entrar" — Fundo #FFD600, texto #1A1A1A, width 100%.
5. Callout spam (margin-top 20px): Fundo #F0EFEB, borda esquerda 3px #FFD600. "Não recebeu o código? Verifique o spam."
6. Link: "Usar outro e-mail" em IBM Plex Mono 12px #888888, underline.

NOMENCLATURA:
- Frame 1: "T.4a Login / Email" — Frame 2: "T.4b Login / Código"
- Component Set "Login", property: Step=Email e Step=Código

ANOTAÇÕES DEV (em CADA frame):
Frame 1: // ESTADO 1 → POST /api/auth/send-code { email } // ERRO: "E-mail não encontrado"
Frame 2: // ESTADO 2 → POST /api/auth/verify-code { email, code } // RATE LIMIT: 3 tentativas
```

#### Checklist

- [ ] 2 frames/variantes: e-mail e código
- [ ] 6 caixinhas de código (48×56px cada)
- [ ] Aviso de spam com callout amarelo
- [ ] Link "Usar outro e-mail"
- [ ] Navegação: Estado 1 → Estado 2 → T.5

---

### T.5 — Minhas Consultas `MVP` `✅ Pronto`

**Spec:** Lista de consultas do usuário com 5 status possíveis.  
**Variante:** Frame único T.5 (usa CardConsulta com 5 variantes)

#### Anotações Backend

```
// ROTA: /minhas-consultas (pós-auth)
// ENDPOINT: GET /api/purchases?email={session.email}
// MODELO: Purchase (lista), SearchResult (status)
// AUTH: Session ativa (magic link)
// CAMPO: badge → Purchase.status (PROCESSING|COMPLETED|FAILED|REFUND_FAILED|EXPIRED)
// CAMPO: cpf/cnpj → Purchase.searchTerm (masked)
// CAMPO: data → Purchase.createdAt
// CAMPO: botão "Ver Relatório" → só se status === COMPLETED
// LOADING: Skeleton de 3 cards empilhados
// EMPTY STATE: "Nenhuma consulta encontrada." + botão "Fazer primeira consulta"
```

#### Prompt

```
Criar tela "Minhas Consultas" para E O PIX?.
Frame: 1440x900px. Background: #F0EFEB.
Fontes: Zilla Slab (títulos) + IBM Plex Mono (corpo). NÃO usar Inter, Roboto, Arial, sans-serif.

INSTRUÇÃO VISUAL: Seguir linha visual da Home. Tom mínimo, editorial.

NAV (topo, 64px altura):
- Fundo rgba(26,26,26,0.97), backdrop-filter blur(12px)
- Logo "E O PIX?" em Zilla Slab 18px bold #FFD600
- Direita: "joao.silva@gmail.com" em IBM Plex Mono 12px #888888 + botão "Sair" ghost

CONTEÚDO (container max-width 800px, centrado, padding-top 40px):

1. Header (flex, space-between):
   - Esquerda: "Minhas Consultas" Zilla Slab 28px bold
   - Abaixo: "Histórico de todas as suas consultas." em 14px #666666
   - Direita: Botão "Nova Consulta" fundo #FFD600, texto #1A1A1A, 13px bold, radius 8px

2. Lista de consultas (margin-top 32px, stack vertical, gap 12px):
Cada card: fundo #FFFFFF, borda 1px #E8E7E3, border-radius 6px, padding 20px 24px.
Layout: flex, space-between, align-items center.

CARD 1 — CONCLUÍDO:
- Badge: "✅ CONCLUÍDO" fundo rgba(102,204,102,0.15), texto #339933
- "CPF: ***.456.789-**" em 14px bold
- "Consultado em 05/02/2026 às 14:32" em 12px #888888
- Botão: "Ver Relatório" fundo #FFD600

CARD 2 — PROCESSANDO:
- Badge: "⏳ PROCESSANDO" fundo rgba(255,214,0,0.15), texto #B87700
- "CNPJ: 12.345.678/0001-**" em 14px bold
- "Iniciado há 2 minutos" em 12px #888888
- Texto "Aguarde..." em 12px #888888 itálico

CARD 3 — FALHOU:
- Badge: "❌ FALHOU" fundo rgba(204,51,51,0.15), texto #CC3333
- "CPF: ***.789.012-**" em 14px bold
- "Reembolso automático processado" em 12px #888888
- Badge secundário: "REEMBOLSADO" fundo #E8E7E3

CARD 4 — REEMBOLSO PENDENTE:
- Badge: "⚠️ REEMBOLSO PENDENTE" fundo rgba(255,214,0,0.15), texto #B87700
- "CPF: ***.321.654-**" em 14px bold
- "Estamos resolvendo. Entraremos em contato."

CARD 5 — EXPIRADO:
- Badge: "📅 EXPIRADO" fundo #E8E7E3, texto #888888
- "CNPJ: 98.765.432/0001-**" em 14px bold
- "Relatório expirado em 28/01/2026"

NOMENCLATURA:
- Frame: "T.5 Minhas Consultas"
- Cada card: instância do Component Set "CardConsulta" com property Status
- Layers: "Header / TítuloConsultas", "Button / Primary / NovaConsulta", "List / Cards"

ANOTAÇÕES DEV (x:1460):
// ROTA: /minhas-consultas
// ENDPOINT: GET /api/purchases?email={session.email}
// AUTH: Session (magic link)
// CAMPO: badge → Purchase.status
// CAMPO: botão "Ver Relatório" → visível se status === COMPLETED
// EMPTY STATE: "Nenhuma consulta encontrada." + CTA
```

#### Checklist

- [ ] 5 cards com 5 status diferentes
- [ ] Badges coloridos por status
- [ ] CPF/CNPJ mascarados
- [ ] Botão "Ver Relatório" apenas no Concluído
- [ ] Navegação: Ver Relatório → T.6 ou T.7
- [ ] Usuário logado no nav

---

### T.6 — Relatório: Sol (Tudo Limpo) `MVP` `✅ Pronto`

**Spec:** Relatório quando 0 ocorrências. 1 card consolidado "atestado de saúde" com checklist.  
**Variante:** Component Set: Relatorio / Sol

#### Anotações Backend

```
// ROTA: /relatorio/{id}
// ENDPOINT: GET /api/report/{id}
// MODELO: SearchResult (com JSON de cada fonte), Purchase
// AUTH: Session ativa + Purchase.email === session.email
// CONDIÇÃO SOL: SearchResult.totalOccurrences === 0
// CAMPO: cpf → Purchase.searchTerm (masked)
// CAMPO: data → SearchResult.createdAt
// CAMPO: expira → SearchResult.expiresAt (createdAt + 7 dias)
// CAMPO: checklist itens → derivado de SearchResult.financial, .judicial, .web, .business
// CAMPO: resumo IA → SearchResult.aiSummary (gerado por GPT)
// CAMPO: "Cadastro empresarial" → só renderiza se Purchase.searchType === "CNPJ"
// LOADING: Skeleton do card + shimmer nos textos
// ERRO: Redirect para E.3 se SearchResult.expiresAt < now
```

#### Prompt

```
Criar tela "Relatório Sol" para E O PIX?.
Frame: 1440x900px (scrollable, conteúdo real ~1400px altura). Background: #F0EFEB.
Fontes: Zilla Slab (títulos) + IBM Plex Mono (corpo). NÃO usar Inter, Roboto, Arial, sans-serif.

INSTRUÇÃO VISUAL: Seguir linha visual da Home. Tom mínimo, editorial.

NAV (topo, 64px altura):
- Fundo rgba(26,26,26,0.97), backdrop-filter blur(12px)
- Logo "E O PIX?" em Zilla Slab 18px bold #FFD600
- Direita: "joao.silva@gmail.com" 12px #888888 + botão "Sair" ghost

CONTEÚDO (container max-width 800px, centrado, padding-top 40px):

1. HEADER DO RELATÓRIO:
- "Consulta: CPF ***.456.789-**" em Zilla Slab 28px bold #1A1A1A
- "Consultado em 05/02/2026 às 14:32" em IBM Plex Mono 12px #888888
- Badge: "CONCLUÍDO" fundo rgba(102,204,102,0.15), texto #339933

2. BLOCO CLIMA (margin-top 32px):
- Fundo #FFFDE6, borda 1px #F5EDB8, border-radius 6px, padding 24px
- Ícone: ☀️ 48px + Texto: "Céu limpo. Nenhuma ocorrência encontrada." em Zilla Slab 18px bold

3. DISCLAIMER (margin-top 12px):
- "Ícones representam volume de registros públicos, não avaliação de risco de crédito. A interpretação é exclusivamente sua."
- IBM Plex Mono 11px #888888, font-style italic

4. CARD CONSOLIDADO "ATESTADO" (margin-top 32px):
Card grande: fundo #FFFFFF, borda 1px #E8E7E3, radius 6px, shadow 0 2px 8px rgba(0,0,0,0.10), padding 32px.

Checklist visual (4 itens, stack vertical, separados por borda dashed 1px #E8E7E3):
- ✅ "Situação financeira: Nome limpo, sem protestos, sem dívidas"
- ✅ "Processos judiciais: Nenhum encontrado"
- ✅ "Menções na web: Nenhuma ocorrência negativa"
- ✅ "Cadastro empresarial: Ativo desde 2018"

Cada item: círculo 24px fundo #66CC66 com checkmark branco + texto IBM Plex Mono 14px.
Nota no último: "(visível apenas para CNPJ)" em 10px #888888.

5. RESUMO IA (dentro do card, margin-top 24px):
- Bloco fundo #F0EFEB, border-radius 4px, padding 16px
- Badge: "RESUMO IA" fundo #FFD600, texto #1A1A1A, font 9px bold uppercase
- Texto: "Nenhuma ocorrência financeira, judicial ou de menções negativas na web foi encontrada para este CPF nos registros públicos consultados."

6. TEXTO DE FECHAMENTO (margin-top 32px, center):
- "Pelo que encontramos, o céu está limpo. Boa parceria!" em Zilla Slab 18px bold

7. LINKS EXTERNOS (margin-top 20px, center):
- "Consultar Receita Federal →" e "Consultar Serasa →"
- IBM Plex Mono 12px #1A1A1A, underline, separados por " | "

8. BOTÃO "RELATAR ERRO" (dentro do card, canto inferior direito):
- "Relatar erro" em 11px #888888, underline. Discreto.

9. FOOTER (margin-top 40px, center):
- "Relatório gerado em 05/02/2026. Dados expiram em 12/02/2026." em 11px #888888
- Botão "Voltar para Minhas Consultas" ghost

NÃO usar: Cores de score, gradientes, palavras "bom", "ruim", "confiável", "arriscado".

NOMENCLATURA:
- Frame: "T.6 Relatório / Sol"
- Component Set "Relatório" com property Weather=Sol.

ANOTAÇÕES DEV (x:1460):
// ROTA: /relatorio/{id}
// CONDIÇÃO: totalOccurrences === 0 → renderiza Sol
// CAMPO: checklist → derivado de .financial, .judicial, .web, .business
// CAMPO: "Cadastro empresarial" → só se searchType === "CNPJ"
// CAMPO: resumo → SearchResult.aiSummary
// EXPIRADO: redirect E.3
```

#### Checklist

- [ ] Ícone Sol + label "Céu limpo..."
- [ ] Disclaimer obrigatório presente
- [ ] 4 itens no checklist (Financeiro, Processos, Web, Cadastro)
- [ ] Resumo IA com badge amarelo
- [ ] Texto fechamento positivo
- [ ] "Relatar erro" visível
- [ ] Nenhuma palavra avaliativa (bom/ruim/confiável)

---

### T.7 — Relatório: Chuva (Ocorrências) `MVP` `✅ Pronto`

**Spec:** Relatório com ocorrências. Checklist resumido no topo + cards expandidos por categoria.  
**Variante:** Component Set: Relatorio / Chuva

#### Anotações Backend

```
// ROTA: /relatorio/{id} (mesma, variante condicional)
// CONDIÇÃO CHUVA: SearchResult.totalOccurrences > 0
// CAMPO: ícone label → "Clima instável. {totalOccurrences} ocorrências encontradas."
// CAMPO: card financeiro → SearchResult.financial { protests[], debts[], isNameDirty }
// CAMPO: card processos → SearchResult.judicial { processes[], totalCount }
// CAMPO: card web → SearchResult.web { mentions[] } (empty state se vazio)
// CAMPO: card reclameaqui → SearchResult.reclameAqui (OCULTO se vazio, sem empty state)
// CAMPO: card cadastro → SearchResult.business (borda vermelha se status Baixado/Suspenso)
// CAMPO: resumo IA → SearchResult.aiSummary
```

#### Prompt

```
Criar tela "Relatório Chuva" para E O PIX?.
Frame: 1440x900px (scrollable, conteúdo real ~2200px altura). Background: #F0EFEB.
Fontes: Zilla Slab (títulos) + IBM Plex Mono (corpo). NÃO usar Inter, Roboto, Arial, sans-serif.

INSTRUÇÃO VISUAL: Seguir linha visual da Home. Tom mínimo, editorial.

NAV (topo, 64px altura):
- Padrão com email logado + "Sair"

CONTEÚDO (container max-width 800px, centrado):

1. HEADER: "Consulta: CNPJ 12.345.678/0001-**" Zilla Slab 28px bold + badge "CONCLUÍDO" verde

2. BLOCO CLIMA: Fundo #F0EFEB, borda 1px #D5D4D0, padding 24px.
   🌧️ 48px + "Clima instável. 54 ocorrências encontradas." Zilla Slab 18px bold

3. DISCLAIMER: Mesmo do T.6.

4. CHECKLIST RESUMIDO: Card branco, grid 2x2.
   - ✅ "Cadastro empresarial: Ativo"
   - ✅ "Menções web: Nenhuma"
   - ⚠️ "Situação financeira: 3 protestos" (triângulo amarelo)
   - ⚠️ "Processos: 51 encontrados"

5. CARD SITUAÇÃO FINANCEIRA:
   Header: "Situação Financeira" + badge "3 OCORRÊNCIAS" vermelho
   - "Nome sujo: SIM" (bold #CC3333)
   - "Protestos: 3 (total R$ 12.450,00)"
   - Tabela: Data | Valor | Cartório (3 rows)
     - 15/08/2025 | R$ 4.200,00 | 2º Cartório - Porto Alegre
     - 03/11/2025 | R$ 5.750,00 | 1º Cartório - Porto Alegre
     - 22/01/2026 | R$ 2.500,00 | 3º Cartório - Canoas
   - "Dívidas ativas: 0"
   - Link: "Consultar Serasa →"
   - "Relatar erro"

6. CARD PROCESSOS JUDICIAIS:
   Header: "Processos Judiciais" + badge "51 PROCESSOS"
   - Subtítulo: "TRABALHISTAS (Empresa Ré)"
   - Tabela (5 linhas): Tribunal | Data | Classe | Polo
     - TRT-4 | 12/03/2024 | Ação Trabalhista | Réu
     - TRT-4 | 05/07/2024 | Ação Trabalhista | Réu
   - Separador: "CÍVEIS E OUTROS"
     - TJRS | 18/09/2024 | Execução Título | Réu
     - TJRS | 02/01/2025 | Monitória | Réu
     - TJRS | 14/11/2025 | Cobrança | Réu
   - "+46 processos. Ver todos →"
   - "Ver no tribunal de origem →"
   - "Relatar erro"

7. CARD RESUMO IA:
   Badge: "RESUMO IA" fundo #FFD600
   Texto: "Atenção: 3 protestos totalizando R$ 12.450 e 51 processos judiciais encontrados, sendo 2 trabalhistas como réu. Nenhuma menção negativa na web."

8. TEXTO FECHAMENTO: "Encontramos alguns pontos de atenção. Avalie com cuidado."

9. FOOTER: Data geração + expiração + botão "Voltar para Minhas Consultas" ghost.

CARDS NÃO EXIBIDOS NESTE EXEMPLO:
- Reclame Aqui: sem resultados = card SOME completamente (NÃO mostra empty state)
- Notícias e Web: sem resultados = mostra empty state: "Nenhuma menção relevante encontrada na web."

REGRA VISUAL: Card Cadastro Empresarial recebe borda 2px #CC3333 se CNPJ com status Baixado/Suspenso.

NÃO usar: Score, gradientes, palavras "bom", "ruim", "confiável", "arriscado".

NOMENCLATURA:
- Frame: "T.7 Relatório / Chuva"
- Component Set "Relatório" com property Weather=Chuva.

ANOTAÇÕES DEV (x:1460):
// ROTA: /relatorio/{id}
// CONDIÇÃO: totalOccurrences > 0 → renderiza Chuva
// CAMPO: card financeiro → .financial { protests[], debts[], isNameDirty }
// CAMPO: card processos → .judicial { processes[], totalCount }
// CAMPO: card web → .web (empty state se vazio)
// CAMPO: reclameaqui → .reclameAqui (OCULTO se null/vazio)
// CAMPO: cadastro → .business (borda #CC3333 se status Baixado|Suspenso)
```

#### Checklist

- [ ] Ícone Chuva + label "[N] ocorrências"
- [ ] Checklist resumido no topo (mix de ✅ e ⚠️)
- [ ] Card Financeiro com dados fictícios
- [ ] Card Processos com separação trabalhista/cível
- [ ] Reclame Aqui NÃO visível (sem resultados)
- [ ] Resumo IA factual, sem adjetivos
- [ ] "Relatar erro" em cada card
- [ ] Links externos para fontes

---

### RODADA 3 — Admin

---

### A.1 — Admin: Dashboard `S4` `📋 Criar`

**Spec:** Painel admin com métricas operacionais. Sidebar + área de conteúdo.  
**Variante:** Layout master Admin (sidebar reutilizada)

#### Anotações Backend

```
// ROTA: /admin
// ENDPOINT métricas: GET /api/admin/dashboard
// ENDPOINT compras: GET /api/admin/purchases?limit=5
// AUTH: Admin session (env ADMIN_EMAILS whitelist)
// CAMPO: consultas hoje → aggregation Purchase WHERE createdAt = today
// CAMPO: receita → SUM(Purchase.amount) WHERE status=COMPLETED AND today
// CAMPO: taxa erro → COUNT(FAILED) / COUNT(ALL) * 100
// CAMPO: APIs → GET /api/health
// CAMPO: gráfico → aggregation 7 dias
// LOADING: Skeleton cards + skeleton tabela
```

#### Brief

**Layout:** Sidebar esquerda 240px (#1A1A1A) + Área conteúdo (#F0EFEB).

**Sidebar:** Logo "E O PIX?" + Badge "ADMIN" + Menu (📊 Dashboard ativo, 🚫 Blocklist, 💚 Health Check, 💰 Compras, 📩 Leads) + "Admin: admin@somoseopix.com.br" + "Sair".

**Conteúdo:**

1. Header: "Dashboard" + "Última atualização: 07/02/2026 15:42"
2. Cards de métricas (grid 4 colunas): Consultas Hoje (47), Receita Hoje (R$ 1.405,30), Taxa de Erro (2.1%), APIs (2/2 UP)
3. Gráfico de consultas (últimos 7 dias): barras simples
4. Tabela "Últimas Compras" (5 linhas com status badges)

#### Checklist

- [ ] Sidebar escura com menu funcional
- [ ] 4 cards de métricas com dados
- [ ] Gráfico de barras simples
- [ ] Tabela de compras com badges
- [ ] Navegação sidebar funcional

---

### A.2 — Admin: Blocklist `MVP` `📋 Criar`

**Brief:** Tabela de CPFs/CNPJs bloqueados. Busca + formulário Adicionar inline. 8 linhas com 3 motivos (SOLICITAÇÃO_TITULAR, JUDICIAL, HOMÔNIMO). Confirmação de exclusão. Empty state.

```
// ROTA: /admin/blocklist
// ENDPOINT GET: GET /api/admin/blocklist
// ENDPOINT ADD: POST /api/admin/blocklist { document, name, reason }
// ENDPOINT DELETE: DELETE /api/admin/blocklist/{id}
// MODELO: Blocklist
// AUTH: Admin session
```

---

### A.3 — Admin: Health Check `MVP` `📋 Criar`

**Brief:** 2 cards de API (APIFull + Escavador) com status UP/DOWN, tempo resposta, uptime. Card status geral (botão habilitado/desabilitado). Variante DOWN. Histórico de incidentes.

```
// ROTA: /admin/health
// ENDPOINT: GET /api/health
// ENDPOINT histórico: GET /api/admin/health/incidents
// MODELO: HealthCheck
// AUTH: Admin session
// POLLING: Atualiza a cada 60s
```

---

### A.4 — Admin: Compras e Reembolsos `MVP` `📋 Criar`

**Brief:** Filtros (status + busca) + 3 métricas compactas + tabela 10 linhas com todos os status. Botão "Reembolsar" nos FAILED/REFUND_FAILED. Confirmação de reembolso. Paginação. Exportar CSV.

```
// ROTA: /admin/compras
// ENDPOINT lista: GET /api/admin/purchases?status={filter}&search={code}
// ENDPOINT reembolso: POST /api/admin/purchases/{id}/refund
// MODELO: Purchase, User
// AUTH: Admin session
```

---

### A.5 — Admin: Leads Capturados `MVP` `📋 Criar`

**Brief:** 3 métricas (Total, API_DOWN, MAINTENANCE) + tabela 8 linhas + badges de motivo. Retenção 90 dias. Empty state.

```
// ROTA: /admin/leads
// ENDPOINT: GET /api/admin/leads?days=90
// MODELO: LeadCapture
// AUTH: Admin session
// RETENÇÃO: 90 dias, depois purged
```

---

### RODADA 4 — Institucionais + Erros

---

### P.1 — Termos de Uso `S4` `✅ Pronto`

**Spec:** Página estática. Container 720px centrado, card branco, padding 48px.  
**Rota:** `/termos`

#### Prompt

```
Criar página "Termos de Uso" para E O PIX?.
Frame: 1440x900px (scrollable, ~1600px). Background: #F0EFEB.
Container 720px centrado. Card branco, padding 48px.

Título: "Termos de Uso" Zilla Slab 28px bold
Subtítulo: "Última atualização: Fevereiro 2026" 12px #888888

SEÇÕES (H3 Zilla Slab 18px bold, corpo IBM Plex Mono 14px #666666, line-height 1.7):

1. Natureza do Serviço
"O E O PIX? é uma ferramenta de agregação de dados públicos. Consultamos registros abertos de protestos, processos judiciais, notícias e cadastro empresarial para gerar um relatório consolidado. Não somos um bureau de crédito, não calculamos score e não oferecemos recomendações de crédito ou risco."

2. Isenção de Veracidade
"Os dados exibidos são obtidos de fontes públicas (Receita Federal, tribunais, Serasa Experian, Escavador, Reclame Aqui e outros). Não garantimos a completude, atualidade ou exatidão dos dados. A responsabilidade pela interpretação é exclusivamente do usuário."

3. Aviso de Homônimos
"Consultas por CPF podem retornar resultados de homônimos, especialmente em processos judiciais onde a individualização depende do número do documento. Se você identificar dados incorretos, utilize a página Direitos do Titular para solicitar correção."
→ Link para /privacidade/titular

4. Política de Reembolso
"Reembolsos são concedidos exclusivamente em caso de falha técnica que impeça a geração do relatório. Erros de digitação no CPF/CNPJ ou no e-mail não geram direito a reembolso. Em caso de falha técnica, o reembolso é processado automaticamente via Pix em até 24 horas."

5. Propriedade Intelectual
"O layout, a marca E O PIX?, os textos originais e o código-fonte são propriedade dos titulares do serviço. Os dados públicos agregados não são de nossa autoria e pertencem às respectivas fontes."

6. Foro
"Fica eleito o foro da comarca de Florianópolis/SC para dirimir quaisquer controvérsias."

Rodapé: "← Voltar para o início" | "Política de Privacidade →"

// ROTA: /termos — COPY FINAL
```

---

### P.2 — Política de Privacidade `S4` `✅ Pronto`

**Spec:** Página estática. Mesmo layout de P.1.  
**Rota:** `/privacidade`

#### Prompt

```
Mesmo layout de P.1. Container 720px centrado, card branco, padding 48px.

Título: "Política de Privacidade"

SEÇÕES:

1. Dados que Coletamos — E-mail, CPF/CNPJ consultado, dados pagamento Asaas
2. Fontes de Dados Públicos Consultadas — APIFull, Escavador, BrasilAPI, Google Custom Search, OpenAI
3. Base Legal — Legítimo Interesse (Art. 7 IX LGPD) + Consentimento (Art. 7 I)
4. Compartilhamento com Terceiros — Asaas, Brevo, Neon, Plausible
5. Retenção de Dados — Tabela: SearchResult 7d, Purchase indefinido, LeadCapture 90d, MagicCode 10min, Blocklist indefinido
6. Cookies e Rastreamento — "Não utilizamos cookies. Plausible cookieless."
7. Seus Direitos — Acesso, correção, exclusão, portabilidade, revogação → Link para /privacidade/titular
8. Contato — privacidade@somoseopix.com.br

Rodapé: "← Termos de Uso" | "Direitos do Titular →"

// ROTA: /privacidade — COPY FINAL
```

---

### P.3 — Direitos do Titular `S4` `✅ Pronto`

**Spec:** Formulário LGPD. 2 frames: Form + Sucesso.  
**Rota:** `/privacidade/titular`

#### Prompt

```
Container 720px centrado, card branco, padding 48px.
2 frames: Form (estado padrão) + Sucesso (pós-envio).

FORM:
1. Título: "Seus Direitos como Titular" Zilla Slab 28px bold
2. Texto explicativo + callout informativo (borda amarela)
3. Formulário: Nome completo, CPF/CNPJ (com máscara e erro), E-mail, Tipo de solicitação (3 radios: Exclusão, Correção, Homônimo), Descrição (textarea), Botão "Enviar solicitação"

SUCESSO:
- Check verde 48px + "Solicitação enviada!" + Protocolo #LGPD-2026-0042 + Botão "Voltar para o início" ghost

// ROTA: /privacidade/titular
// INTEGRAÇÃO: Formulário Tally embedado ou POST /api/titular-request
```

---

### E.1–E.4 — Páginas de Erro (4 telas) `S4` `✅ Pronto`

**Spec:** Component Set "ErrorPage" com 4 variantes. Estrutura comum: ícone 64px + título + mensagem + botão.  
**Tom de voz:** Irônico e direto.

#### Prompt

```
4 frames, 1440x900px cada. Component Set "ErrorPage".

E.1 — 404:
- Ícone: Lucide Search, 64px, #1A1A1A
- Título: "404"
- Mensagem: "Eita, essa página não existe. Mas a gente pode consultar quem te mandou pra cá. 😏"
- Botão: "Voltar para o início" → /

E.2 — 500:
- Ícone: Lucide AlertTriangle, 64px, #CC3333
- Título: "500"
- Mensagem: "Algo deu errado do nosso lado. Já estamos cuidando."
- Botão: "Tentar novamente" → reload

E.3 — Relatório Expirado:
- Ícone: Lucide Clock, 64px, #888888
- Título: "Relatório Expirado"
- Mensagem: "Este relatório expirou. Os dados são removidos após 7 dias por segurança."
- Callout: "Seus dados de compra continuam salvos."
- Botão: "Fazer nova consulta" → /

E.4 — Link Inválido:
- Ícone: Lucide Unlink, 64px, #888888
- Título: "Link Inválido"
- Mensagem: "Esse link não leva a lugar nenhum. Tente acessar pelo Minhas Consultas."
- Botão: "Ir para Minhas Consultas" → /minhas-consultas

// E.3 é a única que depende de backend (verifica expiração)
// NAVEGAÇÃO: E.1 → / | E.2 → reload | E.3 → / | E.4 → /minhas-consultas
```

---

## 04 · Lista de Ajustes (QA)

> Preencher durante revisões após execução.

| ID   | Componente | Ajuste Necessário | Prioridade | Status |
| ---- | ---------- | ----------------- | ---------- | ------ |
| QA.1 | –          | –                 | –          | –      |
| QA.2 | –          | –                 | –          | –      |
| QA.3 | –          | –                 | –          | –      |
| QA.4 | –          | –                 | –          | –      |
| QA.5 | –          | –                 | –          | –      |

---

## 05 · Histórico de Execução

| Data       | Entrada                                                                                                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 07/02/2026 | 📋 Documento de controle criado. 21 componentes mapeados. T.1 (Home) já existe codada como referência visual.                                                                         |
| 08/02/2026 | ✅ Rodada 1 concluída — T.2 Teaser, T.3 Confirmação, M.1 Modal Email, T.8 Manutenção.                                                                                                 |
| 08/02/2026 | 🔧 T.2 Teaser — Ajuste pós-Figma Make: removido CTA duplicado, lista de checkmarks substituída por 6 cards com blur CSS (grid 2x3), checkbox de termos substituído por texto passivo. |
| 08/02/2026 | ✅ Rodada 2 parcial — T.4 Login (2 frames: Email + Código). Progresso: 6/21 (29%).                                                                                                    |
| 08/02/2026 | ✅ T.5 Minhas Consultas + T.6 Relatório Sol — prompts prontos. Progresso: 8/21 (38%).                                                                                                 |
| 08/02/2026 | ✅ T.7 Relatório Chuva + P.1 Termos de Uso + P.2 Política de Privacidade — prompts gerados com copy final da spec. Progresso: 11/21 (52%).                                            |
| 08/02/2026 | ✅ P.3 Direitos do Titular (2 frames: Form + Sucesso) + E.1-E.4 Páginas de Erro (4 variantes Component Set). Progresso: 16/21 (76%). Faltam apenas A.1-A.5 (Admin).                   |
