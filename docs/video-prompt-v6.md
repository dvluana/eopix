# PROMPT COMPLETO — Vídeo Promocional EOPIX "E o Pix?"

Gerar um vídeo animado promocional de ~44 segundos para a plataforma EOPIX, um SaaS brasileiro de consulta de risco CPF/CNPJ. O vídeo conta a história de um freelancer que levou calote e descobre que poderia ter evitado consultando antes.

---

## PARTE 1 — IDENTIDADE VISUAL (aplicar em TODA cena, sem exceção)

### Tipografia — APENAS 2 fontes em todo o vídeo

**Font 1 — Zilla Slab** (Google Fonts, serif):
- Uso: TODOS os headlines, títulos de impacto, valores monetários grandes, nomes de pessoas
- Peso: sempre 700 (bold)
- Tracking: tight, -0.01em (as letras ficam levemente mais juntas que o padrão)
- Line-height: 1.0 a 1.2 (apertado, editorial, sem espaço desnecessário entre linhas)
- Nunca usar em body text, labels ou badges

**Font 2 — IBM Plex Mono** (Google Fonts, monospace):
- Uso: TUDO o que não for headline — body text, labels, badges, eyebrows, botões, timestamps, subtítulos, dados, dot leaders, frases secundárias
- Pesos: 400 (regular) para corpo, 500 (medium) para dados/valores menores, 600-700 (bold) para badges e botões
- Line-height: 1.7 para corpo de texto, 1.0 para badges/labels
- Tamanho padrão para badges: 9px equivalente no vw do vídeo (~0.7vw), bold, UPPERCASE, letter-spacing 1.5-2px

**REGRA INQUEBRÁVEL:** Nenhuma outra fonte pode aparecer no vídeo. Se em qualquer frame aparecer Arial, Inter, Helvetica, Roboto, sistema, ou qualquer sans-serif — está errado. Apenas estas duas fontes. Serif + monospace. Sempre.

### Paleta de cores — 5 cores, sem exceção

| Nome | Hex | RGB | Onde usar |
|---|---|---|---|
| **Amarelo marca** | `#FFD600` | 255, 214, 0 | CTAs, badges, acentos, eyebrows, highlights, glows. NUNCA como fundo de seção inteira |
| **Preto profundo** | `#1A1A1A` | 26, 26, 26 | Fundos escuros, texto primário em fundo claro. NÃO usar preto puro #000000 |
| **Papel off-white** | `#F0EFEB` | 240, 239, 235 | Fundos claros, texto secundário em fundo escuro. NÃO usar branco puro como fundo de seção |
| **Vermelho alerta** | `#CC3333` | 204, 51, 51 | EXCLUSIVAMENTE para: valores negativos, stamps de perigo, status ATENÇÃO/VENCIDO, strikethroughs. Nunca decorativo |
| **Verde sucesso** | `#339933` | 51, 153, 51 | EXCLUSIVAMENTE para: status OK, stamp CONCLUÍDO, valores positivos. Nunca decorativo |

**Cores auxiliares (derivadas, não novas):**
- Cinza texto secundário: `#888888` — para sublabels, eyebrows em fundo claro, detalhes terciários
- Cinza texto muted: `#666666` — para texto secundário com mais peso que #888
- Cinza dividers: `#D5D4D0` — para borders de cards em fundo claro
- Branco puro `#FFFFFF` — SOMENTE para: background de cards (nunca de seções), texto de máximo impacto em fundo escuro

### Texturas de fundo — 2 tratamentos, usados consistentemente

**FUNDO ESCURO (`#1A1A1A`)** — usado nas cenas 2, 5, 7:

Camada 1 (base): cor sólida `#1A1A1A`

Camada 2 (glows radiais — dão profundidade atmosférica ao preto):
- Glow amarelo: gradiente radial elíptico, tamanho 800×600px proporcionais, posição 20% horizontal / 80% vertical (canto inferior-esquerdo), cor `rgba(255,214,0,0.06)`, dissolve para transparent aos 70% do raio
- Glow off-white: gradiente radial elíptico, tamanho 600×400px proporcionais, posição 80% horizontal / 20% vertical (canto superior-direito), cor `rgba(240,239,235,0.03)`, dissolve para transparent aos 70% do raio

Camada 3 (grid fantasma — QUASE INVISÍVEL, se for perceptível está forte demais):
- Linhas de 1px espaçadas a cada 120px proporcionais
- Cor: `rgba(240,239,235,0.025)` (off-white a 2.5% de opacidade)
- Ambas as direções (horizontal + vertical), formando um grid
- Se este grid for visível a olho nu sem zoom, reduzir a opacidade. O efeito deve ser subliminar

OPCIONAL em cenas de ênfase emocional (cenas 2 e 5): listras diagonais
- Ângulo: 45 graus
- Pattern: 7px transparente, 1px de `rgba(255,214,0,0.04-0.06)`
- Efeito: hachura diagonal amarela quase invisível

**FUNDO CLARO (`#F0EFEB`)** — usado nas cenas 1, 3, 4, 6:

Camada 1 (base): cor sólida `#F0EFEB` (off-white quente, NUNCA branco puro)

Camada 2 (paper grain — textura de papel impresso):
- Noise monocromático de frequência alta e granulação fina
- Opacidade: 3-5% (sutil, dá sensação de papel texturizado, não de areia ou câmera VHS)
- Se o software suportar: SVG filter `feTurbulence` type `fractalNoise`, baseFrequency 0.9, numOctaves 4, opacity 0.08, renderizado em tiles 256×256px, overlay a 35% de opacidade
- Se não suportar SVG: usar noise grain muito fino, monocromático, blendmode overlay a 3-5%

### Elementos de marca recorrentes

**Badges/stamps** (aparecem em múltiplas cenas):
- Font: IBM Plex Mono 700 bold
- Tamanho: ~0.7vw (equivalente a 9px num desktop)
- Caixa: UPPERCASE
- Letter-spacing: 1.5-2px
- Border-radius: 2px (quase quadrado — estilo carimbo/stamp, NÃO arredondado)
- Padding: 3-4px vertical, 10-14px horizontal
- Variantes de cor:
  - Amarelo: bg `#FFD600`, texto `#1A1A1A` — para destaques positivos/marca
  - Vermelho: bg transparente, border 2-3px `#CC3333`, texto `#CC3333` — para alertas
  - Verde: bg transparente, border 2px `#339933`, texto `#339933` — para confirmações

**Offset box-shadow** (a assinatura visual brutalist da EOPIX):
- `3px 3px 0 0 #1A1A1A` — sombra deslocada sólida, sem blur, sem spread
- Usado em: botões CTA, cards de destaque, preços em destaque
- No fundo claro: shadow preta `#1A1A1A`
- No fundo escuro: pode inverter para shadow amarela `#FFD600`

**Sublinhado highlight** (marca-texto amarelo sob palavras-chave):
- Implementação: gradiente `linear-gradient(transparent 60%, rgba(255,214,0,0.35) 60%)` como background da palavra
- Efeito: os 40% inferiores do texto recebem uma faixa amarela a 35% de opacidade
- Animação: `scaleX(0)` → `scaleX(1)`, origin left, 0.4s, ease-out

**Borda zigzag / receipt torn edge** (borda serrilhada inferior):
- Triângulos alternados de 8px no bottom de cards
- Cor: mesma do card (branco), recortando o fundo
- Efeito: parece que o card foi rasgado de uma bobina de impressora

### Animações — vocabulário de movimento

Todo o vídeo usa um vocabulário restrito de animações. NÃO inventar novas. Usar apenas estas:

**1. Fade-up stagger** (a mais usada — entrada padrão de elementos):
- De: `translateY(20px) opacity(0)`
- Para: `translateY(0) opacity(1)`
- Duração: 0.4-0.6s
- Easing: ease-out
- Stagger: 0.1-0.4s de delay entre elementos filhos

**2. Stamp-slam** (para badges/carimbos de impacto):
- De: `scale(2.5) rotate(-15deg) opacity(0)`
- Keyframe 50%: `scale(0.9) rotate(1deg) opacity(1)`
- Keyframe 70%: `scale(1.08) rotate(-3deg)`
- Para: `scale(1) rotate(-2deg ou custom) opacity(1)`
- Duração: 0.5-0.6s
- Easing: `cubic-bezier(0.34, 1.56, 0.64, 1)` (bounce overshoot)

**3. Snap-in** (para texto de impacto):
- De: `translateY(2-3vw) opacity(0)`
- Para: `translateY(0) opacity(1)`
- Duração: 0.3-0.4s
- Easing: `cubic-bezier(0.34, 1.56, 0.64, 1)` (overshoot — o elemento ultrapassa a posição e volta)

**4. Typewriter** (para texto que "digita"):
- Cada caractere aparece a cada 25-35ms
- Cursor: `_` (underscore) em `#FFD600` (amarelo) que pisca em step-end a cada 0.8s
- O cursor desaparece quando a digitação termina

**5. Strikethrough** (para riscar valores):
- Linha de 2px na cor especificada (normalmente `#CC3333`)
- Anima da esquerda para a direita sobre o texto
- Duração: 0.3s, ease-out

**6. ScaleX reveal** (para linhas/sublinhados):
- De: `scaleX(0)`
- Para: `scaleX(1)`
- Transform-origin: left (ou center, conforme contexto)
- Duração: 0.3-0.4s, ease-out

**Transições entre cenas:**
- Padrão: **hard cut** (corte seco, sem transição). É o que dá o ritmo mecânico/brutalist
- Exceção Cena 1→2: scan sweep amarelo (uma linha fina `#FFD600` varre de cima para baixo em 0.3s) + hard cut
- NUNCA usar: dissolve, fade, wipe diagonal, zoom transition, ou qualquer transição "suave"

---

## PARTE 2 — AS 7 CENAS

### CENA 1 — WhatsApp "Cliente Ghost" (7 segundos)

**Propósito narrativo:** Estabelecer o problema. Todo freelancer/prestador já teve um cliente que sumiu sem pagar.

**Fundo:** `#F0EFEB` (claro) com paper grain.

**Elemento central:** Mockup de celular (estilo iPhone) centralizado na tela.
- Largura: 40vw no desktop, **85vw no mobile** (priorizar legibilidade mobile 9:16)
- Proporção: 9:16 (vertical)
- Moldura: bordas arredondadas pretas (radius ~30px proporcionais), "notch" da câmera no topo
- Shadow: `0 8px 40px rgba(0,0,0,0.15)` (sombra suave projetada no fundo papel)

**Tela do celular — simula WhatsApp:**

Header:
- Background verde `#10B981`
- Foto de perfil: placeholder circular cinza
- Nome: "João Silva" — IBM Plex Mono 500, branco
- Status: "online" — IBM Plex Mono 400, `rgba(255,255,255,0.7)`, tamanho menor

Chat background: bege claro padrão WhatsApp (`#ECE5DD`)

**Mensagens — 6 balões, alternando lados:**

| # | Lado | Balão cor | Texto | Timestamp | Checks | Delay entrada |
|---|---|---|---|---|---|---|
| 1 | Esquerda (cliente) | Cinza `#D1D5DB` | `Ficou incrível o trabalho! 🔥` | 09:14 | ✓✓ azul | 0.3s |
| 2 | Direita (prestador) | Verde `#DCF8C6` | `Valeu! Sobre o pagamento, como ficamos?` | 09:15 | ✓✓ azul | 0.7s |
| 3 | Esquerda (cliente) | Cinza `#D1D5DB` | `Tranquilo, pago na sexta sem falta 👍` | 09:16 | ✓✓ azul | 1.1s |

**Pausa de 1s** (tela estática). O status do header muda: "online" → "visto por último às 09:16" (fade transition, 0.3s).

| # | Lado | Balão cor | Texto | Timestamp | Checks | Delay entrada |
|---|---|---|---|---|---|---|
| 4 | Direita (prestador) | Verde `#DCF8C6` | `E aí João, conseguiu fazer o pix?` | 14:32 | ✓✓ cinza (não azul) | 2.5s |

Acima do balão 4: divisória de tempo com label sutil:
- IBM Plex Mono 400, 8px, `rgba(0,0,0,0.4)`, centralizado:
  `3 dias depois`

| # | Lado | Balão cor | Texto | Timestamp | Checks | Delay entrada |
|---|---|---|---|---|---|---|
| 5 | Direita (prestador) | Verde `#DCF8C6` | `João?` | 10:47 | ✓ (UM check cinza — não entregue) | 3.8s |

Divisória: `1 semana depois`

| # | Lado | Balão cor | Texto | Timestamp | Checks | Delay entrada |
|---|---|---|---|---|---|---|
| 6 | Direita (prestador) | Verde `#DCF8C6` | `Oi? Tá recebendo minhas mensagens?` | 15:47 | sem checks | 4.8s |

**Animação de cada mensagem:**
- Slide lateral (15px da direção do lado) + fade-in
- Duração: 0.3s, ease-out
- As 3 primeiras são rápidas (0.4s entre elas)
- As 3 últimas são progressivamente mais lentas (os delays acima refletem isso)

**Ritmo emocional das mensagens:**
- Msg 1-3: conversa fluida, normal, rápida
- Msg 4: pausa antes, delay 2.5s — tensão começa
- Msg 5: "João?" curto, seco — desespero começa
- Msg 6: frase longa, sem checks — silêncio total

**O twist (5.8s):**

1. A tela inteira do celular aplica **grayscale(100%)** instantaneamente (0.1s)
2. Stamp **"BLOQUEADO"** aparece no centro da tela do celular:
   - Texto: `BLOQUEADO`
   - Cor: `#CC3333`, border 3px solid `#CC3333`
   - IBM Plex Mono, tamanho grande (~12vw), bold uppercase, letter-spacing 2px
   - Animação stamp-slam: scale 2.5 + rotate -15° → scale 1 + rotate -5°, cubic-bezier(0.34, 1.56, 0.64, 1), 0.5s

**Transição (6.5s):**
- Uma linha fina amarela `#FFD600` (2-3px de altura, 100% largura) varre a tela de cima para baixo em 0.3s — como um scanner
- Hard cut para preto

---

### CENA 2 — Fatura Vencida + "E se você soubesse antes?" (3 segundos)

**Propósito narrativo:** Transição emocional. Materializar a perda num "documento" visual e plantar a pergunta que o produto responde.

**Fundo:** `#1A1A1A` (escuro) com radial glows + listras diagonais amarelas a `rgba(255,214,0,0.04)`.

**Elemento central: card de fatura** centralizado na tela.
- Largura: **75vw** (legível em mobile 9:16)
- Background: `#FFFFFF`
- Paper grain texture (noise SVG a 35% opacity)
- Border: 1px solid `rgba(0,0,0,0.08)`
- Border-radius: `2px 2px 0 0` (topo quase quadrado)
- Borda zigzag serrilhada no bottom (triângulos 8px — estilo receipt rasgado)
- Shadow: `0 8px 40px rgba(0,0,0,0.3)`
- Rotação: `rotate(-1.5deg)` (levemente torto, como jogado na mesa)

**Título do card:**
```
──────────────────────────
    FATURA DE SERVIÇO
──────────────────────────
```
- IBM Plex Mono 11px bold uppercase, letter-spacing 2px, `#888888`
- Dividers: border 1px dashed `rgba(0,0,0,0.12)` acima e abaixo

**Conteúdo — 3 linhas apenas, texto GRANDE (legível no mobile):**

```
Cliente      João Silva
Valor        R$ 3.500,00
Status       VENCIDO
```

- Labels ("Cliente", "Valor", "Status"): IBM Plex Mono 400, **14px mínimo** no mobile, `#888888`
- Valores ("João Silva", "R$ 3.500,00"): IBM Plex Mono 600, mesmo tamanho, `#1A1A1A`
- "VENCIDO": IBM Plex Mono 700, `#CC3333` (vermelho)
- Line-height: 2.2 (spacing generoso entre linhas)
- Separadores entre linhas: border-bottom 1px dashed `rgba(0,0,0,0.08)`

**Animação:**

**0s–0.6s:** Card entra.
- De: `opacity(0) translateY(30px) rotate(-3deg)`
- Para: `opacity(1) translateY(0) rotate(-1.5deg)`
- Duração: 0.6s, ease-out

**0.8s–1.3s:** Stamp **"VENCIDO"** bate no card.
- Texto: `VENCIDO`
- Cor: `#CC3333`, border 3px solid `#CC3333`
- IBM Plex Mono **16px** bold uppercase, letter-spacing 2px
- Rotação final: `rotate(-8deg)`
- Animação stamp-slam (scale 2.5 rotate -15° → normal, bounce overshoot, 0.5s)
- No impacto: card faz `brightness(0.92)` + micro-shake (translateX ±2px, 0.1s)

**1.5s–2.2s:** Frase 1 — abaixo do card, no fundo escuro.
- IBM Plex Mono 400, 1.6vw, `#F0EFEB`
- `Você já trabalhou de graça sem querer?`
- Fade-up: translateY(15px) → 0, 0.4s, ease-out

**2.2s–3s:** Frase 2 — snap-in com overshoot.
- Zilla Slab bold, 2.5vw, `#FFFFFF`
- `E se você soubesse antes?`
- Cubic-bezier(0.34, 1.56, 0.64, 1), 0.4s

**3s:** Hard cut para Cena 3.

---

### CENA 3 — Consulta CNPJ (5 segundos)

**Propósito narrativo:** Apresentar a ação — consultar antes de fechar. Mostrar a interface do produto.

**Fundo:** `#F0EFEB` (claro) com paper grain. A cena entra empurrando a cena anterior de baixo para cima (slide-up, 0.3s) — ou hard cut se preferir manter consistência.

**Layout:** Centralizado vertical e horizontal.

**Eyebrow** (topo):
- IBM Plex Mono 11px bold uppercase, letter-spacing 2px, `#FFD600`
- `EOPIX`
- Fade-in aos 0.2s

**Headline:**
- Zilla Slab bold, 4.5vw, `#1A1A1A`, uppercase, line-height 1.1
- ```
  ANTES DE FECHAR,
  CONSULTA O CNPJ
  DO CLIENTE.
  ```
- 3 linhas, centralizado
- A palavra "CNPJ" tem sublinhado highlight amarelo: `linear-gradient(transparent 60%, rgba(255,214,0,0.35) 60%)`, animado `scaleX(0→1)` com delay 1.2s
- Headline entra com fade-up stagger (0.4s, ease-out), delay 0.3s

**Campo de busca** (abaixo do headline, delay 0.8s):
- Max-width: 680px proporcional (~50vw)
- Background: `#FFFFFF`
- Border: 3px solid `#E8E7E3`
- Border-radius: 12px
- Shadow: `0 4px 16px rgba(0,0,0,0.08)`
- Padding: 6px 6px 6px 24px
- Dentro: CNPJ digitando com typewriter
  - IBM Plex Mono 500, 18px, `#1A1A1A`
  - Texto: `12.345.678/0001-90`
  - Velocidade: ~100ms por caractere (com pontuação aparecendo junto)
  - Cursor `_` amarelo `#FFD600` piscando (step-end, 0.8s)
  - Delay início: 1s

**Botão** (aparece após typewriter terminar, ~2.5s):
- Posição: dentro do campo de busca, à direita, ou logo abaixo centralizado
- Texto: `DESBLOQUEAR RELATÓRIO →`
- IBM Plex Mono 13px bold uppercase, letter-spacing 0.5px
- Background: `#FFD600`
- Cor texto: `#1A1A1A`
- Border: 2px solid `#1A1A1A`
- Border-radius: 8px
- Padding: 12px 24px
- **Box-shadow: 3px 3px 0 0 #1A1A1A** (offset brutalist)
- Animação entrada: snap-in com leve rotação spring (`scale(0) rotate(-5deg)` → `scale(1.05) rotate(2deg)` → `scale(1) rotate(0)`, 0.6s)
- Após aparecer (3.5s): pulsa suavemente `scale(1, 1.03, 1)` infinito, 2s cycle

**5s:** Hard cut para Cena 4.

---

### CENA 4 — Comparativo de Preços (6 segundos)

**Propósito narrativo:** Quebra de objeção de preço. Mostrar que R$ 29,90 é absurdamente barato comparado às alternativas.

**Fundo:** `#F0EFEB` (claro) com paper grain. Fundo FIXO durante toda a cena — sem transição para escuro, sem mudança de background.

**Layout:** Coluna única centralizada. Max-width ~600px proporcional. Tudo empilhado verticalmente.

**Sequência:**

**0s–0.5s:** Eyebrow + headline entram com fade-up.

Eyebrow:
- IBM Plex Mono 11px bold uppercase, letter-spacing 2px, `#888888`
- `COMPARATIVO`

Headline:
- Zilla Slab bold, 3.5vw, `#1A1A1A`
- `Quanto custa essa informação?`

**0.8s–2.8s:** 3 linhas de preço entram em stagger.

Cada linha é um row horizontal:
- Label (esquerda): IBM Plex Mono 400, 13px, `#1A1A1A`
- Dot leaders (meio): `·····` em IBM Plex Mono, opacidade 15% (estilo nota fiscal)
- Valor (direita): IBM Plex Mono 600, 13px, `#CC3333`

```
Advogado / Due diligence ····················· ~R$ 500
Bureau de crédito (mensal) ··················· ~R$ 200/mês
Detetive particular ························· ~R$ 2.000
```

- Delays de entrada: 0.8s, 1.2s, 1.6s (fade-up, 0.4s cada)
- Strikethrough animado: 0.3s após cada linha aparecer, linha `#CC3333` de 2px risca o valor da esquerda para a direita (0.3s, easeOut)
- Timing dos strikes: ~1.1s, ~1.5s, ~1.9s

**2.8s–3.2s:** Total aparece com fade-up.
- IBM Plex Mono 400, 12px, `#888888`: `Total estimado`
- Zilla Slab bold, 2.5vw, `#CC3333`: `R$ 2.700+`
- Shake único: translateX(-3px, 3px, -2px, 2px, 0) em 0.3s. Depois parado.

**3.2s–3.5s:** Linha horizontal separadora.
- Largura: 60% do container, centralizada
- 1px solid `rgba(0,0,0,0.1)`
- Animação: `scaleX(0)` → `scaleX(1)`, origin center, 0.3s, ease-out

**3.5s–3.9s:** Badge stamp-slam.
- `POR APENAS`
- Background `#FFD600`, IBM Plex Mono 9px bold uppercase, letter-spacing 1.5px, border-radius 2px, padding 4px 14px
- Stamp-slam: scale 2.5 + rotate -15° → 1 + 0°, cubic-bezier overshoot, 0.5s

**3.9s–4.3s:** Preço EOPIX — spring entrance.
- Zilla Slab bold, **5.5vw**, `#1A1A1A`
- `R$ 29,90`
- Text-shadow: `3px 3px 0 #FFD600` (offset amarelo — inversão da assinatura brutalist)
- Animação: `translateY(20px) scale(0.9) opacity(0)` → `translateY(0) scale(1) opacity(1)`, 0.5s, cubic-bezier overshoot

**4.3s–4.7s:** Descrição — fade-in.
- IBM Plex Mono 400, 11px, `#666666`, centralizado
- `6 bases · IA · pronto em 30s`

**4.7s–5.2s:** Badge economia — fade-up.
- Border 2px solid `#1A1A1A`, border-radius 2px, padding 4px 14px
- IBM Plex Mono 9px bold uppercase, letter-spacing 1.5px, `#1A1A1A`
- `ECONOMIA DE 98%`

**5.2s–6s:** Breathing room. Tudo permanece na tela. Sem animação. O viewer absorve o contraste.

**6s:** Hard cut para Cena 5.

---

### CENA 5 — Pipeline de Varredura (9 segundos)

**Propósito narrativo:** Mostrar o poder tecnológico — 6 bases consultadas em tempo real. Prova de que o produto é sério, não um Google search.

**Fundo:** `#1A1A1A` (escuro) com radial glows + grid fantasma + listras diagonais `rgba(255,214,0,0.04)`.

**Eyebrow** (topo, fixo):
- IBM Plex Mono 11px bold uppercase, letter-spacing 2px, `#FFD600`
- `VARREDURA EM TEMPO REAL`
- Fade-in aos 0.3s

**Elemento central: timeline vertical com 6 nós.**

**Linha vertical (espinha dorsal):**
- Posição: centro horizontal (ou levemente à esquerda para dar espaço aos labels)
- Largura: 2px
- Cor base: `rgba(240,239,235,0.15)` (branca translúcida)
- Altura: ~70% vertical da tela
- Aparece com `scaleY(0→1)` origin top, 0.5s, ease-out

**Pulse de energia** (viaja pela linha):
- Um glow amarelo (8px de largura, ~48px de altura)
- Cor: `rgba(255,214,0,0.5)` com blur `0 0 20px rgba(255,214,0,0.9)`
- Gradiente top/bottom para transparent (a "gota" de luz tem bordas suaves)
- Viaja de cima para baixo em ~6s, passando por cada nó
- Quando passa por um nó, o nó "acende" (ativa)

**6 nós — alternando esquerda e direita da linha:**

| # | Nó | Ícone | Sublabel | Delay ativação |
|---|---|---|---|---|
| 1 | Receita Federal | Documento/FileText | `Cadastro localizado` | 1.0s |
| 2 | Tribunais de Justiça | Martelo/Gavel | `3 registros encontrados` | 1.8s |
| 3 | Serasa / SPC | Gráfico/BarChart | `Score disponível` | 2.6s |
| 4 | Notícias na Mídia | Globo/Globe | `2 menções recentes` | 3.4s |
| 5 | Reclamações Online | Alerta/AlertCircle | `Histórico localizado` | 4.2s |
| 6 | Análise Inteligente | Processador/Cpu | `Parecer concluído` | 5.0s |

**Design de cada nó:**

Inativo (antes do pulse passar):
- Quadrado 4vw × 4vw, border 2px solid `rgba(255,255,255,0.2)`
- Ícone: `rgba(255,255,255,0.2)`
- Labels: opacity 30%

Ativo (após pulse passar):
- Border: 2px solid `#FFD600`
- Background fill: `rgba(255,214,0,0.15)`
- Ícone: `#FFD600`
- Labels: opacity 100%
- Animação de ativação: `scale(0)` → `scale(1)` spring, 0.4s
- Glow pulsante no nó ativo: box-shadow alterna `0 0 12px rgba(255,214,0,0.1)` ↔ `0 0 20px rgba(255,214,0,0.25)`, 3s cycle

**Labels de cada nó** (ao lado oposto da linha):
- Título: IBM Plex Mono 600, 1.2vw, `#FFFFFF` (branco)
- Sublabel: IBM Plex Mono 400 italic, 0.9vw, `#888888`
- Aparecem junto com a ativação do nó (fade + slide horizontal 10px, 0.3s)

**Badge de conclusão (6.8s):**
- Posição: abaixo do último nó, centralizado
- Texto: `✓ VARREDURA CONCLUÍDA · 6/6 BASES CONSULTADAS`
- Background `#FFD600`, IBM Plex Mono 9px bold uppercase, border-radius 2px
- Animação stamp-slam aos 6.8s

**Breathing room** (7s–9s): Tudo permanece. Os nós continuam com glow pulsante. Sem nova animação.

**9s:** Hard cut para Cena 6.

---

### CENA 6 — Relatório que se Constrói (9 segundos)

**Propósito narrativo:** Mostrar o produto final — o relatório. Provar que tem profundidade e valor real. Cada seção que aparece é mais um argumento de venda.

**Fundo:** `#F0EFEB` (claro) com paper grain.

**Eyebrow fixa** (topo da tela, fora do card, não se move):
- IBM Plex Mono italic 400, 1vw, `#888888`
- `6 bases oficiais. 1 relatório. 30 segundos.`
- Fade-in aos 0.2s, permanece durante toda a cena

**Card principal** — cresce verticalmente conforme seções são adicionadas:
- Largura: 55vw (desktop), 85vw (mobile)
- Centralizado horizontalmente
- Background: `#FFFFFF`
- Border: 1px solid `rgba(0,0,0,0.06)`
- Border-radius: 8px
- Paper grain texture
- Shadow: `0 2px 8px rgba(0,0,0,0.05)`

**Animação de entrada do card** (0s): Skew-in — `skewX(-10deg) translateX(100%)` → `skewX(0) translateX(0)`, 0.6s, ease-out. Ou se o skew causar artefatos: fade-up simples (translateY 30px → 0, 0.5s).

Cada seção DENTRO do card entra com fade-up stagger independente:
- `translateY(20px) opacity(0)` → `translateY(0) opacity(1)`, 0.4s, ease-out
- Cada seção adiciona altura ao card (o card "cresce" organicamente)

---

**SEÇÃO 1 — Header do Dossiê (0s–1.5s):**

- **Badge** top-left: `CNPJ` — bg `#FFD600`, IBM Plex Mono 9px bold uppercase, radius 2px, padding 3px 10px
- **Nome:** Zilla Slab bold, 2.5vw, `#1A1A1A`: `João Silva Comércio LTDA`
- **Sublinhado highlight amarelo** sob o nome: scaleX 0→1, delay 0.8s, 0.4s
- **CNPJ:** IBM Plex Mono 400, 1vw, `#888888`: `12.345.678/0001-90`
- **Data:** IBM Plex Mono 400, 0.8vw, `#BBBBBB`: `Gerado em 09/03/2026 às 14:32`
- **Stamp "CONCLUÍDO"** (canto superior-direito):
  - `#339933`, border 2px solid `#339933`
  - IBM Plex Mono 11px bold uppercase, letter-spacing 1.5px
  - Rotação final: -2deg
  - Stamp-slam aos 1s
- Border-bottom: 1px solid `rgba(0,0,0,0.06)` (separa do próximo bloco)

---

**SEÇÃO 2 — Veredicto Weather (1.5s–3s):**

Fade-up abaixo do header. Este bloco é **escuro dentro do card claro** (contraste máximo):
- Background: `#1A1A1A`
- Border-left: 4px solid `#CC3333`
- Border-radius: 6px
- Margin: 16px (padding interno do card branco)
- Overlay: listras diagonais `rgba(255,214,0,0.06)` a 45°

Conteúdo:
- **Emoji:** ⛈️ (~2.5vw)
- **Label:** IBM Plex Mono 10px, `rgba(255,255,255,0.5)`: `VEREDICTO`
- **Título:** Zilla Slab bold, 1.6vw, branco: `Encontramos pontos de atenção.`
- **Stamp "ATENÇÃO":** `#CC3333`, border 2px solid `#CC3333`, rotação -2deg, stamp-slam aos 2s
- **Pill badge:** IBM Plex Mono 9px bold, border 1px solid `#CC3333`, cor `#CC3333`, border-radius 9999px (pill), padding 2px 10px: `4 OCORRÊNCIAS`

---

**SEÇÃO 3 — Quick Scan Checklist (3s–4.5s):**

Fade-up. Estilo receipt printer — cada linha aparece com micro-delay de 0.2s (como impressora matricial).

- **Título:** IBM Plex Mono 10px bold uppercase, `#888888`, letter-spacing 1.5px: `RAIO-X RÁPIDO`

4 linhas:

```
Situação financeira ························ ATENÇÃO
Processos judiciais ························ ATENÇÃO
Menções na web ····························· OK
Cadastro empresarial ······················· OK
```

- Labels: IBM Plex Mono 400, 12px, `#1A1A1A`
- Dot leaders: IBM Plex Mono, opacity 15%
- `OK`: `#339933`, bold
- `ATENÇÃO`: `#CC3333`, bold
- Border entre linhas: 1px dashed `rgba(0,0,0,0.08)`

---

**SEÇÃO 4 — Highlights Grid 2×2 (4.5s–5.5s):**

Fade-up. Grid compacto com dados-chave — prova profundidade sem precisar de accordion.

4 mini-cards em grid 2×2:
- Cada mini-card: border 1px solid `rgba(0,0,0,0.06)`, radius 6px, padding 12px
- Border-top: 3px solid `#FFD600` (accent amarelo)
- Entram em stagger rápido: delay 0s, 0.1s, 0.2s, 0.3s

| Posição | Label | Valor | Detalhe |
|---|---|---|---|
| Top-left | `PROTESTOS` | `3` vermelho | `R$ 12.500` |
| Top-right | `PROCESSOS` | `2` vermelho | `Réu em ambos` |
| Bottom-left | `RECLAME AQUI` | `3.2` vermelho | `Não recomendada` |
| Bottom-right | `CADASTRO` | `Ativo` verde | `Desde 2019` |

- Labels: IBM Plex Mono 9px bold uppercase, `#888888`
- Valores: Zilla Slab bold, 2vw. Vermelho `#CC3333` para negativos, verde `#339933` para positivos
- Detalhes: IBM Plex Mono 400, 10px, `#888888`

---

**SEÇÃO 5 — Resumo IA (5.5s–7s):**

Fade-up.

- **Border-left: 3px solid `#FFD600`** (assinatura do AI Summary)
- Border-radius: `0 8px 8px 0`
- Background: `rgba(255,214,0,0.03)` (tint amarelo quase imperceptível)
- Padding: 16px 20px

- **Badge:** `RESUMO IA` — bg `#FFD600`, IBM Plex Mono 9px bold uppercase, radius 2px
- **Texto:** IBM Plex Mono 400, 12px, line-height 1.7, `#1A1A1A`:
  `"Identificamos 3 protestos e 2 processos como réu. Recomendamos cautela em contratos de alto valor."`

---

**SEÇÃO 6 — Footer + Zoom-out (7s–9s):**

Fade-up do footer:
- Border-top: 1px dashed `rgba(0,0,0,0.08)`
- IBM Plex Mono 400, 10px, `#BBBBBB`, centralizado:
  `Relatório completo · 4 seções · dados expiram em 7 dias`

**Borda zigzag** no bottom do card inteiro (triângulos alternados 8px — torn receipt edge).

**Zoom-out** (8.5s–9s):
- O card inteiro faz `scale(1)` → `scale(0.96)`, 0.5s, ease-out
- Cria a sensação de "relatório completo, afastar para ver o todo"

**9s:** Hard cut para Cena 7.

---

### CENA 7 — CTA "E o Pix?" (5 segundos)

**Propósito narrativo:** Fechamento. Reconectar com a dor (título "E o Pix?"), resolver com ação (CTA), e deixar o URL.

**Fundo:** `#1A1A1A` (escuro) com radial glows + grid fantasma sutil.

**Headline** (0.5s):
- Zilla Slab bold, **6vw**, `#FFFFFF`
- `"E o Pix?"`
- Text-shadow: `3px 3px 0 #FFD600` (offset amarelo — assinatura brutalist invertida)
- Animação: `scale(0.9) translateY(50px) opacity(0)` → `scale(1) translateY(0) opacity(1)`, spring stiffness 300, 0.6s

**Sublinhado amarelo** (1s):
- Abaixo do headline
- `#FFD600`, 4px de espessura
- Animação: `scaleX(0)` → `scaleX(1)`, origin left, 0.4s, circOut easing

**Subheading** (1.5s, fade-up stagger):
- Linha 1: IBM Plex Mono 400, 1.4vw, `#FFFFFF`:
  `Consulte antes. Decida melhor.`
- Linha 2: IBM Plex Mono 400, 1.2vw, `#888888`:
  `Sem mensalidade. Sem cadastro. Pronto em 3 minutos.`
- Stagger: 0.2s entre as duas linhas

**Botão CTA** (2s):
- Texto: `CONSULTAR AGORA →`
- IBM Plex Mono bold, 1.8vw, uppercase
- Background: `#FFD600`
- Cor texto: `#1A1A1A`
- Border: 2px solid `#1A1A1A`
- Border-radius: 8px
- Padding: 16px 32px
- **Box-shadow: 3px 3px 0 0 #1A1A1A**
- Animação entrada: spring scale + translateY (0.5s)
- **Glow pulsante infinito** após aparecer:
  - Box-shadow alterna entre:
    - `3px 3px 0 0 #1A1A1A, 0 4px 20px rgba(255,214,0,0.25)`
    - `3px 3px 0 0 #1A1A1A, 0 4px 30px rgba(255,214,0,0.5), 0 0 50px rgba(255,214,0,0.12)`
  - Cycle: 2.5s infinito

**URL** (2.8s):
- IBM Plex Mono 400, 1vw, `#888888`
- `www.somoseopix.com.br`
- Posição: bottom da tela, centralizado
- Fade-in suave

**5s:** Fim do vídeo. Último frame permanece por 0.5s extra antes de preto.

---

## PARTE 3 — CHECKLIST FINAL DE CONSISTÊNCIA

Antes de considerar o vídeo pronto, verificar CADA item:

**Tipografia:**
- [ ] ZERO fontes sans-serif em todo o vídeo (NUNCA Arial, Inter, Helvetica, Roboto, sistema)
- [ ] Headlines/títulos/valores grandes SEMPRE em Zilla Slab bold
- [ ] TODO o resto SEMPRE em IBM Plex Mono (body, labels, badges, botões, timestamps)
- [ ] Badges: 9px mono bold uppercase, letter-spacing 1.5-2px, border-radius 2px

**Cores:**
- [ ] Fundos escuros: `#1A1A1A` (nunca `#000000`)
- [ ] Fundos claros: `#F0EFEB` (nunca `#FFFFFF` como fundo de cena)
- [ ] `#FFFFFF` usado SOMENTE em cards sobre fundo `#F0EFEB`
- [ ] Vermelho `#CC3333` SOMENTE em contextos de perigo/alerta (nunca decorativo)
- [ ] Verde `#339933` SOMENTE em contextos de sucesso/OK (nunca decorativo)
- [ ] Amarelo `#FFD600` NUNCA como fundo de seção inteira — somente em badges, CTAs, acentos

**Texturas:**
- [ ] Fundos escuros: radial glows (amarelo bottom-left, off-white top-right) + grid fantasma 2.5% opacity
- [ ] Fundos claros: paper grain noise (3-5% opacity)
- [ ] Grid fantasma NÃO visível a olho nu — se for perceptível, reduzir opacidade

**Animações:**
- [ ] Transições entre cenas: HARD CUT (sem dissolve, fade, wipe)
- [ ] Exceção: Cena 1→2 tem scan sweep amarelo
- [ ] Stamp-slam usa cubic-bezier(0.34, 1.56, 0.64, 1) — bounce overshoot
- [ ] Fade-up stagger: translateY(20px) → 0, ease-out
- [ ] Typewriter: cursor `_` amarelo, pisca em step-end 0.8s

**Conteúdo:**
- [ ] Cena 2: stamp diz "VENCIDO" (não "CALOTE")
- [ ] Cena 2: card é "FATURA DE SERVIÇO" (não "recibo")
- [ ] Cena 4: layout vertical centralizado, UMA coluna (não split)
- [ ] Cena 4: SEM transição de fundo (tudo em `#F0EFEB`)
- [ ] Cena 6: SEM scroll, SEM accordion fechado — card estático que acumula seções
- [ ] Cena 6: veredicto CHUVA é bloco escuro DENTRO do card claro
- [ ] Cena 6: grid 2×2 com dados-chave (não accordion com títulos vazios)
- [ ] Cena 7: URL é `www.somoseopix.com.br`
- [ ] Duração total: ~44 segundos (±3s)
