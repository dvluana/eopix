# PROMPT COMPLETO V7 — Vídeo Promocional EOPIX "E o Pix?"

Gerar um vídeo animado promocional de **~44 segundos** para a plataforma EOPIX. O vídeo conta a história de um freelancer/MEI que fecha um serviço via WhatsApp, trabalha 15 dias, e leva calote. Depois, o tempo rebobina e mostra o que teria acontecido se ele tivesse consultado o cliente no EOPIX antes de aceitar.

**Estrutura narrativa:** Desastre → Rewind → Caminho alternativo → Recompensa.
**Formato:** 100% telas de interface (WhatsApp + EOPIX). Zero ilustrações de pessoas, mãos, objetos físicos. A história é contada ATRAVÉS das telas, como o "Parisian Love" do Google.
**Funciona no mudo:** ~35 palavras na tela. A história é visual.

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

**EXCEÇÃO CONTROLADA:** Dentro da tela do WhatsApp (mockup de celular), os textos das mensagens podem usar uma fonte que se aproxime da tipografia do WhatsApp para manter a verossimilhança. MAS: todo texto FORA do mockup do celular (títulos, badges, frases emocionais, interface EOPIX) deve ser rigorosamente Zilla Slab ou IBM Plex Mono.

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

**Cores permitidas DENTRO do mockup WhatsApp:**
- Header WhatsApp: `#075E54` (verde escuro real do WhatsApp)
- Chat background: `#ECE5DD` (bege do WhatsApp)
- Balão outgoing (prestador): `#DCF8C6` (verde claro WhatsApp)
- Balão incoming (cliente): `#FFFFFF` (branco)
- Check azul: `#53BDEB`
- Check cinza: `#8696A0`
- Timestamp: `#667781`
- Estas cores existem SOMENTE dentro da moldura do celular. Fora do celular, volta para a paleta EOPIX.

### Texturas de fundo — 2 tratamentos, usados consistentemente

**FUNDO ESCURO (`#1A1A1A`)** — usado nas cenas de impacto emocional (perda, rewind, CTA):

Camada 1 (base): cor sólida `#1A1A1A`

Camada 2 (glows radiais — dão profundidade atmosférica ao preto):
- Glow amarelo: gradiente radial elíptico, tamanho 800×600px proporcionais, posição 20% horizontal / 80% vertical (canto inferior-esquerdo), cor `rgba(255,214,0,0.06)`, dissolve para transparent aos 70% do raio
- Glow off-white: gradiente radial elíptico, tamanho 600×400px proporcionais, posição 80% horizontal / 20% vertical (canto superior-direito), cor `rgba(240,239,235,0.03)`, dissolve para transparent aos 70% do raio

Camada 3 (grid fantasma — QUASE INVISÍVEL):
- Linhas de 1px espaçadas a cada 120px proporcionais
- Cor: `rgba(240,239,235,0.025)` (off-white a 2.5% de opacidade)
- Ambas as direções (horizontal + vertical)
- Se este grid for visível a olho nu sem zoom, está forte demais — reduzir

**FUNDO CLARO (`#F0EFEB`)** — usado nas cenas de WhatsApp e interface EOPIX:

Camada 1 (base): cor sólida `#F0EFEB` (off-white quente, NUNCA branco puro)

Camada 2 (paper grain — textura de papel impresso):
- Noise monocromático fino, opacidade 3-5%
- Se suportar SVG: `feTurbulence` fractalNoise, baseFrequency 0.9, numOctaves 4, tiles 256px, overlay 35%
- Se não: noise grain fino monocromático, blendmode overlay 3-5%

**VARIAÇÃO ESPECIAL — Cena de perda (Cena 3 ending):**
- Os radial glows mudam de amarelo para VERMELHO: `rgba(204,51,51,0.06)` no bottom-left
- Única vez no vídeo que o glow muda — sinaliza perda visceralmente

**VARIAÇÃO ESPECIAL — Cena de sucesso (Cena 6 ending):**
- Os radial glows mudam de amarelo para VERDE: `rgba(51,153,51,0.06)` no bottom-left
- Ecoa o vermelho da perda, mas invertido — o viewer sente o contraste

### O mockup de celular — elemento visual recorrente

O celular é o "palco" onde a maior parte da história acontece. Deve ser consistente em TODAS as aparições:

- **Formato:** Retângulo vertical, proporção 9:16
- **Largura:** 40vw no desktop, **85vw pensando em mobile** (o vídeo será visto majoritariamente em celular)
- **Moldura:** Bordas arredondadas pretas (`#1A1A1A`), radius ~30px proporcionais, borda de ~3px
- **Notch:** Pequeno entalhe no centro do topo (pill shape, ~15vw de largura, ~1.5vw de altura)
- **Shadow:** `0 8px 40px rgba(0,0,0,0.15)` quando sobre fundo claro; `0 8px 40px rgba(0,0,0,0.4)` quando sobre fundo escuro
- **Posição:** Centralizado horizontal e verticalmente na tela. Sempre.

### Animações — vocabulário de movimento

**1. Fade-up stagger** (entrada padrão):
- De: `translateY(20px) opacity(0)` → Para: `translateY(0) opacity(1)`
- 0.4-0.6s, ease-out. Stagger 0.1-0.4s entre filhos.

**2. Stamp-slam** (carimbos de impacto):
- De: `scale(2.5) rotate(-15deg) opacity(0)`
- 50%: `scale(0.9) rotate(1deg) opacity(1)`
- 70%: `scale(1.08) rotate(-3deg)`
- Para: `scale(1) rotate(custom) opacity(1)`
- 0.5-0.6s, `cubic-bezier(0.34, 1.56, 0.64, 1)` (bounce overshoot)

**3. Snap-in** (texto de impacto):
- De: `translateY(2-3vw) opacity(0)` → Para: `translateY(0) opacity(1)`
- 0.3-0.4s, `cubic-bezier(0.34, 1.56, 0.64, 1)` (overshoot)

**4. Typewriter** (texto que "digita"):
- 25-35ms por caractere
- Cursor `_` em `#FFD600`, pisca step-end 0.8s
- Cursor desaparece quando termina

**5. Strikethrough** (riscar valores):
- Linha 2px, esquerda→direita, 0.3s, ease-out

**6. ScaleX reveal** (linhas/sublinhados):
- `scaleX(0)` → `scaleX(1)`, origin left ou center, 0.3-0.4s, ease-out

**7. Message-in** (NOVA — específica para balões de WhatsApp):
- Balão incoming (esquerda): `translateX(-15px) opacity(0)` → `translateX(0) opacity(1)`
- Balão outgoing (direita): `translateX(15px) opacity(0)` → `translateX(0) opacity(1)`
- 0.25s, ease-out
- Micro-bounce no final: o balão chega na posição e faz um `scaleY(1.02)` → `scaleY(1)` em 0.1s

**8. Scan-sweep** (varredura/transição):
- Linha horizontal `#FFD600`, 2-3px de altura, 100% largura
- Varre de cima para baixo (ou baixo para cima no rewind) em 0.3s
- Glow: `0 0 15px rgba(255,214,0,0.6)` ao redor da linha

**Transições entre cenas:**
- Padrão: **hard cut** (corte seco). Sem dissolve, fade, wipe.
- Exceção Cena 3→4 (para o rewind): scan-sweep amarelo invertido (baixo→cima, repetido 3x rápido em 0.8s)
- NUNCA usar: dissolve, fade, wipe diagonal, zoom transition

### Elementos de marca recorrentes

**Badges/stamps:**
- IBM Plex Mono 700, ~0.7vw, UPPERCASE, letter-spacing 1.5-2px, radius 2px, padding 3-4px / 10-14px
- Amarelo (bg `#FFD600` texto `#1A1A1A`), Vermelho (border `#CC3333`), Verde (border `#339933`)

**Offset box-shadow** (assinatura brutalist):
- `3px 3px 0 0 #1A1A1A` — sombra deslocada sólida
- Em fundo escuro pode inverter para `3px 3px 0 0 #FFD600`

**Sublinhado highlight** (marca-texto amarelo):
- `linear-gradient(transparent 60%, rgba(255,214,0,0.35) 60%)`
- Animação: `scaleX(0→1)`, origin left, 0.4s

**Borda zigzag** (receipt torn edge):
- Triângulos alternados 8px no bottom de cards

---

## PARTE 2 — AS 7 CENAS

---

### CENA 1 — A Proposta (0s–3s)

**Propósito narrativo:** HOOK. Um cliente novo entra em contato. O viewer se identifica instantaneamente — é assim que todo MEI/freelancer recebe trabalho.

**Fundo:** `#F0EFEB` (claro) com paper grain.

**Elemento:** Mockup de celular centralizado com WhatsApp aberto.

**Header WhatsApp:**
- Background: `#075E54` (verde escuro WhatsApp)
- Seta voltar (←) à esquerda
- Foto de perfil: placeholder circular cinza com ícone de pessoa branco (silhueta genérica)
- Nome: `João Silva` — branco, peso medium
- Status: `online` — `rgba(255,255,255,0.7)`, tamanho menor
- Ícones à direita: câmera de vídeo, telefone, três pontos (silhuetas brancas, só decorativo)

**Chat background:** `#ECE5DD` (bege WhatsApp)

**Sequência de mensagens:**

| # | Lado | Cor balão | Texto | Timestamp | Checks | Delay |
|---|---|---|---|---|---|---|
| 1 | Esquerda (cliente) | `#FFFFFF` | `Oi! Vi seu trabalho no Instagram. Preciso de uma identidade visual, quanto fica?` | 09:12 | — | 0.3s |
| 2 | Direita (prestador) | `#DCF8C6` | `R$ 3.000, entrego em 15 dias 👍` | 09:14 | ✓✓ azul `#53BDEB` | 0.8s |
| 3 | Esquerda (cliente) | `#FFFFFF` | `Fecha! Quando começa?` | 09:14 | — | 1.3s |

**Animação de cada mensagem:**
- Message-in: slide lateral (15px) + fade-in + micro-bounce scaleY
- 0.25s, ease-out
- Os delays entre mensagens são curtos (0.5s) — conversa fluida, rápida, excitação

**Detalhe visual:** Quando a mensagem 3 ("Fecha!") aparece, o fundo `#F0EFEB` ao redor do celular faz um **micro-pulse** sutil — um flash `rgba(255,214,0,0.08)` que expande radialmente do celular e desaparece em 0.4s. Representa a excitação de fechar um negócio. Quase imperceptível, mas dá vida.

**3s:** Hard cut.

---

### CENA 2 — O Trabalho (3s–9s)

**Propósito narrativo:** Compressão temporal. O viewer vê 15 dias de trabalho em 6 segundos. Estabelece o investimento de tempo/esforço que torna o calote doloroso.

**Fundo:** `#F0EFEB` (claro) com paper grain.

**Elemento:** Mesmo mockup de celular, mesma conversa WhatsApp. A conversa CONTINUA — o viewer entende que o tempo está passando pelas divisórias de tempo e pelo conteúdo das mensagens.

**Sequência de mensagens (continuação da Cena 1):**

**Beat 1 (3s–4.5s): O trabalho em andamento**

Divisória de tempo centralizada no chat:
- Pill shape, background `rgba(0,0,0,0.06)`, radius 8px, padding 4px 12px
- Texto: `3 DIAS DEPOIS` — IBM Plex Mono 10px, `#667781` (cinza WhatsApp), uppercase, letter-spacing 1px
- Fade-in 0.3s

| # | Lado | Cor | Texto | Time | Checks | Delay |
|---|---|---|---|---|---|---|
| 4 | Direita (prestador) | `#DCF8C6` | `Olha como tá ficando` | 14:22 | ✓✓ azul | 0.4s |

Logo após a msg 4: um **placeholder de imagem** aparece como balão do prestador:
- Retângulo `#E8E7E3` com radius 8px, proporção 16:9 (~80% da largura do chat)
- Ícone de foto centralizado (outline de montanha + sol, cor `#BBBBBB`, estilo wireframe)
- Borda: 1px solid `rgba(0,0,0,0.06)`
- Entra com message-in (slide direita, 0.25s)

| # | Lado | Cor | Texto | Time | Checks | Delay |
|---|---|---|---|---|---|---|
| 5 | Esquerda (cliente) | `#FFFFFF` | `Tá ficando lindo!! 🔥` | 14:25 | — | 0.6s |

**Beat 2 (4.5s–6s): Mais tempo passa**

Divisória: `1 SEMANA DEPOIS`

| # | Lado | Cor | Texto | Time | Checks | Delay |
|---|---|---|---|---|---|---|
| 6 | Direita (prestador) | `#DCF8C6` | `Pronto! Tá tudo aqui ✅` | 10:33 | ✓✓ azul | 0.4s |

Outro placeholder de imagem (entrega final):
- Mesmo estilo do anterior, mas com um ícone diferente: pasta/folder com checkmark

| # | Lado | Cor | Texto | Time | Checks | Delay |
|---|---|---|---|---|---|---|
| 7 | Esquerda (cliente) | `#FFFFFF` | `Perfeito!! Amei demais 🤩` | 10:40 | — | 0.5s |

**Beat 3 (6s–8s): A cobrança**

Sem divisória de tempo (é no mesmo dia ou no dia seguinte — o prestador cobra logo).

| # | Lado | Cor | Texto | Time | Checks | Delay |
|---|---|---|---|---|---|---|
| 8 | Direita (prestador) | `#DCF8C6` | `Valeu! Sobre o pagamento, como ficamos?` | 10:45 | ✓✓ azul | 0.5s |
| 9 | Esquerda (cliente) | `#FFFFFF` | `Tranquilo, faço o pix na sexta sem falta 👍` | 10:47 | — | 0.6s |

**Beat visual:** Quando a mensagem 9 aparece, nada de especial. É uma promessa que parece real. O viewer relaxa (armadilha narrativa).

**8s–9s:** A conversa fica estática por 1s. Nada acontece. Silêncio visual. O viewer espera a próxima mensagem. Ela não vem.

**Detalhe de transição:** No 8.7s, o status do header muda: `online` → `visto por último hoje às 10:47` — fade transition, 0.3s. O "online" sumindo é o primeiro sinal de que algo mudou.

**9s:** Hard cut.

---

### CENA 3 — O Silêncio (9s–17s)

**Propósito narrativo:** DESASTRE. O ritmo desacelera bruscamente. O cliente sumiu. O dinheiro foi embora. O soco no estômago.

**Fundo:** `#F0EFEB` (claro) com paper grain — MESMO fundo da cena anterior. A conversa continua ininterrupta.

**O celular continua na tela. Mesma conversa. Mas agora só o prestador fala.**

**Beat 1 (9s–11s): A primeira cobrança**

Divisória de tempo: `3 DIAS DEPOIS`
- Mesma pill shape de antes, mas agora o texto parece mais pesado — o viewer sente o tempo passar

| # | Lado | Cor | Texto | Time | Checks | Delay |
|---|---|---|---|---|---|---|
| 10 | Direita (prestador) | `#DCF8C6` | `E aí João, conseguiu fazer o pix?` | 14:32 | ✓✓ cinza `#8696A0` (não azul — viu mas não respondeu) | 1.0s (delay longo — o ritmo desacelerou) |

**Pausa de 1.5s.** Nenhuma resposta aparece. O viewer espera. Nada.

**Beat 2 (11s–13s): O desespero**

Divisória: `1 SEMANA DEPOIS`

| # | Lado | Cor | Texto | Time | Checks | Delay |
|---|---|---|---|---|---|---|
| 11 | Direita (prestador) | `#DCF8C6` | `João?` | 10:47 | ✓ UM check cinza (não entregue) | 1.2s (ainda mais lento) |

**Pausa de 1s.**

| # | Lado | Cor | Texto | Time | Checks | Delay |
|---|---|---|---|---|---|---|
| 12 | Direita (prestador) | `#DCF8C6` | `Oi? Tá recebendo minhas mensagens?` | 15:03 | sem checks | 0.8s |

**Ritmo emocional explícito:**
- Cena 1-2: mensagens rápidas, 0.4-0.6s entre elas
- Cena 3: mensagens lentas, 0.8-1.5s entre elas, com pausas de silêncio entre
- Essa desaceleração é o que cria a tensão

**Beat 3 (13s–14.5s): O bloqueio**

O status do header muda: `visto por último hoje às 10:47` desaparece. Fica vazio (sem "online", sem "visto por último" — só o nome).

A foto de perfil do João faz um **fade-out** (0.5s) e é substituída pela silhueta genérica cinza (o placeholder padrão quando alguém te bloqueia no WhatsApp).

**Stamp "BLOQUEADO"** aparece no centro da tela do celular:
- Texto: `BLOQUEADO`
- IBM Plex Mono bold, **12vw** (enorme, ocupa quase toda a largura do celular)
- Cor: `#CC3333`, border 3px solid `#CC3333`
- Rotação final: `rotate(-5deg)`
- Animação stamp-slam: scale 2.5 + rotate -15° → normal, cubic-bezier bounce, 0.5s
- No momento do impacto: a tela inteira do celular aplica **grayscale(100%)** instantaneamente (0.1s) — as mensagens verdes ficam cinza, o header fica cinza. Tudo morto.

**Beat 4 (14.5s–17s): A perda materializada**

Transição: scan-sweep amarelo (linha `#FFD600` varre de cima para baixo, 0.3s). O celular desaparece. Hard cut para fundo escuro.

**Fundo:** `#1A1A1A` com variação especial — glows VERMELHOS:
- Glow principal: `rgba(204,51,51,0.06)` no bottom-left (em vez de amarelo)
- Glow secundário: `rgba(240,239,235,0.03)` no top-right (mantém off-white)
- Grid fantasma a 2.5% (normal)
- Sem listras diagonais — a cena é vazia, pesada

**Centro da tela:**

O sinal de menos aparece primeiro (snap-in, 0.3s):
- Zilla Slab bold, 2vw, `#CC3333`
- `–`
- Sozinho na tela por 0.3s

Depois o valor (snap-in com shake, 0.3s depois):
- Zilla Slab bold, **6vw**, `#CC3333`
- `R$ 3.000`
- Shake: `translateX(-3px, 3px, -2px, 2px, 0)` em 0.3s, depois parado
- Text-shadow: `2px 2px 0 rgba(204,51,51,0.3)` (shadow vermelha sutil — eco do offset brutalist, mas vermelho)

O valor faz um **pulso** único: `scale(1) → scale(1.05) → scale(1)`, 0.8s, ease-in-out, uma vez. Depois fica absolutamente parado. 1.5s de silêncio total com o número na tela.

**17s:** Hard cut para preto puro (0.3s de tela completamente preta — silêncio visual total).

---

### CENA 4 — O Rewind (17s–20s)

**Propósito narrativo:** PIVÔ. O momento mais importante do vídeo. "E se tivesse sido diferente?" O tempo rebobina.

**Efeito de rewind (17.3s–18.5s):**

A tela não fica preta por muito tempo. Após 0.3s de preto, começa o rewind:

**Scan-sweep invertido:** A linha amarela `#FFD600` (2-3px, 100% largura, com glow `0 0 15px rgba(255,214,0,0.6)`) varre de **baixo para cima** (invertido do normal). Ela faz isso **3 vezes rápidas** em 0.8s total (cada sweep ~0.25s). A cada sweep que passa, um frame anterior do vídeo "flasheia" por 0.1s:
- Sweep 1: flash do `– R$ 3.000` (vermelho, piscando)
- Sweep 2: flash do BLOQUEADO no celular (grayscale)
- Sweep 3: flash das mensagens sem resposta

Não é um rewind literal frame-a-frame (difícil de executar). São **3 flashes** estáticos de momentos-chave, intercalados com a scan-sweep amarela. O efeito é mecânico, digital, rápido.

**O freeze (18.5s–20s):**

Após o terceiro sweep, hard cut para: o **mockup do celular** no fundo `#F0EFEB` (claro, paper grain). Na tela, a conversa do WhatsApp. Mas a conversa está **no início** — mostra apenas a primeira mensagem do João:

> `Oi! Vi seu trabalho no Instagram. Preciso de uma identidade visual, quanto fica?`

A mensagem está ali. O campo de digitação está vazio. O cursor pisca no campo de texto. O prestador **ainda não respondeu**. Este é o momento de decisão.

O celular tem um efeito visual sutil: **scan lines** — linhas horizontais `rgba(255,214,0,0.06)` a cada 3px sobre a tela do celular. O efeito é sutil, como um monitor CRT, mas na cor amarela EOPIX. Comunica: "estamos num momento congelado no tempo."

**Texto fora do celular** (abaixo ou acima, no fundo `#F0EFEB`):
- Zilla Slab bold, 3.5vw, `#1A1A1A`
- `E se você tivesse checado antes?`
- Snap-in com overshoot, 0.4s, cubic-bezier bounce
- A palavra **"checado"** tem o sublinhado highlight amarelo: `linear-gradient(transparent 60%, rgba(255,214,0,0.35) 60%)`, animado `scaleX(0→1)` com delay 0.3s após o texto aparecer

O texto + celular ficam na tela por 1.5s. Breathing room. O viewer processa emocionalmente.

**20s:** Hard cut.

---

### CENA 5 — A Consulta EOPIX (20s–29s)

**Propósito narrativo:** CAMINHO ALTERNATIVO. O produto entra como o plot twist da história. Não é um demo — é a ação do protagonista que muda tudo. O viewer vê o EOPIX funcionando dentro da narrativa.

**Esta cena tem 3 beats distintos: busca, varredura, resultado.**

---

**BEAT 1 — A Busca (20s–22s)**

**Fundo:** `#F0EFEB` (claro) com paper grain.

O mockup do celular não está mais na tela. Transição visual: o celular "some" e a interface EOPIX ocupa a tela inteira. Isso sinaliza: saímos do WhatsApp, entramos na plataforma.

**Tela:** Interface EOPIX simulada. Fundo `#F0EFEB`. Centralizado.

**Eyebrow** (topo):
- IBM Plex Mono 11px bold uppercase, letter-spacing 2px, `#FFD600`
- `EOPIX`
- Fade-in 0.2s

**Campo de busca** (centro da tela):
- Max-width ~55vw
- Background: `#FFFFFF`
- Border: 3px solid `#E8E7E3`
- Border-radius: 12px
- Shadow: `0 8px 40px rgba(0,0,0,0.08)`
- Focus state: border `#FFD600`, shadow ring `0 0 0 1px rgba(255,214,0,0.3)`
- Entra com fade-up (0.4s, delay 0.2s)

**Typewriter no campo:**
- IBM Plex Mono 500, 18px, `#1A1A1A`
- Texto: `João Silva`
- Velocidade: 80ms por caractere
- Cursor `_` amarelo `#FFD600`, pisca step-end 0.8s
- Delay início: 0.5s (dá tempo do campo aparecer)

**Botão** (dentro do campo, à direita):
- `CONSULTAR →`
- IBM Plex Mono 13px bold uppercase, letter-spacing 0.5px
- Background: `#FFD600`, texto `#1A1A1A`
- Border: 2px solid `#1A1A1A`, radius 8px
- **Box-shadow: 3px 3px 0 0 #1A1A1A** (offset brutalist)
- Aparece quando typewriter termina (snap-in, 0.3s)
- "Clique" visual: botão faz `translate(2px, 2px)` + shadow `1px 1px` por 0.15s (efeito de press), depois volta

---

**BEAT 2 — A Varredura (22s–25s)**

**Fundo:** Transição rápida (0.3s) de `#F0EFEB` para `#1A1A1A`. O campo de busca desaparece (fade-out 0.2s). A tela escurece para dar drama à varredura.

**Fundo escuro:** `#1A1A1A` com radial glows amarelos (padrão) + listras diagonais `rgba(255,214,0,0.04)`.

**Eyebrow** (topo, fixo):
- IBM Plex Mono 11px bold uppercase, letter-spacing 2px, `#FFD600`
- `VARREDURA EM TEMPO REAL`
- Fade-in 0.2s

**Elemento central: Circle loader com 6 ícones orbitais.**

O loader é circular (não a timeline vertical da versão anterior — mais compacto para caber em 3s):

**Centro:** Um círculo de 12vw de diâmetro, borda 2px `rgba(255,255,255,0.1)`.
- Dentro: o **EopixLoader** simplificado — outline de documento (retângulo com corner dobrado) em `rgba(255,255,255,0.2)`, com uma barra de scan amarela `#FFD600` que varre de cima para baixo em 1.5s com glow `0 0 10px rgba(255,214,0,0.6)`.

**6 ícones ao redor do círculo**, posicionados como números de relógio (12h, 2h, 4h, 6h, 8h, 10h):

| Posição | Ícone | Label |
|---|---|---|
| 12h (topo) | FileText (documento) | `Receita Federal` |
| 2h | Gavel (martelo) | `Tribunais` |
| 4h | BarChart (gráfico) | `Serasa` |
| 6h (baixo) | Globe (globo) | `Notícias` |
| 8h | AlertCircle (alerta) | `Reclamações` |
| 10h | Cpu (processador) | `IA` |

**Estado inativo de cada ícone:**
- Ícone: `rgba(255,255,255,0.15)`, tamanho ~2vw
- Label: IBM Plex Mono 400, 0.8vw, `rgba(255,255,255,0.15)`
- Sem borda, sem fundo

**Ativação sequencial (0.5s entre cada):**
- Ícone muda para `#FFD600`
- Label muda para `#F0EFEB` (off-white legível)
- Uma **linha de glow** (2px, `#FFD600`, com blur) viaja do ícone anterior ao próximo ao longo de um arco (como o pulse de energia da timeline, mas circular)
- O ícone faz `scale(0.8) → scale(1.1) → scale(1)` em 0.3s (micro-bounce)

**Timing de ativação:**
- 22.0s: ícone 1 (Receita Federal) acende
- 22.5s: ícone 2 (Tribunais) acende
- 23.0s: ícone 3 (Serasa) acende
- 23.5s: ícone 4 (Notícias) acende
- 24.0s: ícone 5 (Reclamações) acende
- 24.5s: ícone 6 (IA) acende

Quando todos os 6 estão acesos, o círculo central faz um **pulse de glow**: `box-shadow: 0 0 30px rgba(255,214,0,0.4)` → `0 0 0` em 0.5s. Sinaliza: processamento completo.

**Badge de conclusão (24.8s):**
- `✓ CONCLUÍDA`
- Background `#FFD600`, IBM Plex Mono 9px bold uppercase, radius 2px
- Stamp-slam (bounce overshoot, 0.5s)
- Posição: abaixo do circle loader

---

**BEAT 3 — O Resultado Negativo (25s–29s)**

**Fundo:** Volta para `#F0EFEB` (claro, paper grain). Transição rápida (0.2s fade).

O circle loader desaparece (fade-out). No lugar, um **card de relatório** desliza de baixo para cima (fade-up, 0.5s).

**O card:** Versão compacta do relatório EOPIX — mostra apenas o essencial em 4 segundos de exposição.

- Largura: 55vw (desktop), 85vw (mobile)
- Background: `#FFFFFF`
- Border: 1px solid `rgba(0,0,0,0.06)`
- Border-radius: 8px
- Paper grain texture
- Shadow: `0 2px 8px rgba(0,0,0,0.05)`

**Conteúdo do card (empilhado verticalmente, fade-up stagger, 0.3s entre seções):**

**Linha 1 — Header (25s):**
- Badge `CPF` amarelo (bg `#FFD600`, mono 9px bold, radius 2px) à esquerda
- Nome: Zilla Slab bold, 2vw, `#1A1A1A`: `João Silva`
- Sublinhado highlight amarelo sob o nome (scaleX 0→1, delay 0.3s)
- Stamp `CONCLUÍDO` verde `#339933` no canto direito (stamp-slam, 0.5s)

**Linha 2 — Veredicto (25.5s):**
Bloco escuro DENTRO do card claro:
- Background: `#1A1A1A`
- Border-left: 4px solid `#CC3333`
- Border-radius: 6px
- Margin: 12px
- Overlay: listras diagonais `rgba(255,214,0,0.06)`

Conteúdo:
- ⛈️ emoji (~2vw) + Zilla Slab bold, 1.4vw, branco: `Pontos de atenção`
- Stamp `ATENÇÃO` vermelho `#CC3333` (stamp-slam, 0.5s, delay 0.3s)

**Linha 3 — Dados-chave (26s):**
3 data points em row horizontal, separados por dividers `1px solid rgba(0,0,0,0.06)`:
- `3 protestos` — IBM Plex Mono 600, `#CC3333`
- `2 processos` — IBM Plex Mono 600, `#CC3333`
- `R$ 12.500` — IBM Plex Mono 600, `#CC3333`
- Fade-up stagger rápido (0.1s entre cada)

**Linha 4 — Resumo IA (26.5s):**
- Border-left: 3px solid `#FFD600`
- Border-radius: 0 6px 6px 0
- Background: `rgba(255,214,0,0.03)`
- Badge `RESUMO IA` amarelo
- IBM Plex Mono 400, 11px, `#1A1A1A`: `Recomendamos cautela.`

**O card fica na tela por 1.5s (26.5s–28s).** O viewer lê os dados.

**A recusa (28s–29s):**

O mockup do celular **reaparece** ao lado do card (fade-in, 0.3s), menor (~30vw), mostrando a conversa do WhatsApp congelada na mensagem do João:
> `Preciso de uma identidade visual, quanto fica?`

O campo de texto do WhatsApp mostra uma resposta sendo digitada (typewriter, IBM Plex Mono, dentro do campo de texto do WhatsApp):
> `Obrigado pelo interesse, mas no momento não consigo atender.`

A mensagem é enviada (message-in do lado direito). Checks ✓✓ azuis. Conversa encerrada.

O celular faz um **slide-out** suave para a esquerda (`translateX(0) → translateX(-120%)`, 0.4s, ease-in) e desaparece. O card do relatório faz slide-out para a direita. Tela limpa.

**29s:** Hard cut.

---

### CENA 6 — O Pix Que Veio (29s–37s)

**Propósito narrativo:** TRANSFORMAÇÃO. O mesmo protagonista, outro cliente, mas agora consultou antes. Tudo dá certo. O contraste emocional com a Cena 3 é o que converte.

**Esta cena espelha estruturalmente as Cenas 1-2-3, mas com final oposto e ritmo acelerado.**

---

**BEAT 1 — Novo cliente (29s–30.5s)**

**Fundo:** `#F0EFEB` (claro) com paper grain.

Mockup de celular com WhatsApp. **Nova conversa** — header diferente:
- Nome: `Maria Oliveira` (ou outro nome feminino — contraste com João)
- Foto de perfil: placeholder diferente (pode ter cor de fundo levemente diferente)
- Status: `online`

| # | Lado | Cor | Texto | Time | Checks | Delay |
|---|---|---|---|---|---|---|
| 1 | Esquerda (cliente) | `#FFFFFF` | `Oi! Preciso de um logo pro meu restaurante. Faz esse tipo de trabalho?` | 11:05 | — | 0.3s |

Desta vez, o prestador **não responde imediatamente**. O campo de texto fica vazio. O cursor pisca. Pausa de 0.5s. O viewer entende: desta vez ele vai checar antes.

---

**BEAT 2 — Consulta rápida (30.5s–33s)**

O celular faz **slide-out** suave para a direita (0.3s). Transição para interface EOPIX.

**Varredura ACELERADA** (2× mais rápida que na Cena 5):
- Campo de busca aparece (fade-up, 0.3s)
- Typewriter: `Maria Oliveira` — velocidade 40ms por caractere (2× mais rápido)
- Botão press: 0.1s
- Fundo escurece (0.2s) para `#1A1A1A`
- Circle loader: 6 ícones acendem em 1.5s (0.25s entre cada, em vez de 0.5s) — fast-forward visual
- Badge `✓ CONCLUÍDA` stamp-slam

**Resultado POSITIVO (33s):**
Card de relatório aparece (fade-up, 0.4s). Versão compacta:

- Badge `CPF` amarelo + `Maria Oliveira` Zilla Slab bold
- Veredicto **SOL** (não CHUVA):
  - Background: `#FFFFFF` (claro, não escuro)
  - Border-left: 4px solid `#339933` (verde, não vermelho)
  - ☀️ emoji + Zilla Slab bold, `#1A1A1A`: `Nenhuma ocorrência.`
  - Stamp `CÉU LIMPO` verde `#339933` (stamp-slam)
- Dados: `0 protestos` verde · `0 processos` verde · `Score OK` verde
- Badge `RESUMO IA`: `Perfil sem restrições.`

O card fica na tela 1s. O viewer sente: esta é segura.

---

**BEAT 3 — O trabalho (compressão máxima) (33s–35s)**

Hard cut de volta para o WhatsApp. O celular reaparece (fade-in, 0.3s). A conversa com Maria.

Montagem RÁPIDA de mensagens (tudo em 2 segundos — contraste com os 6s da Cena 2):

| # | Texto resumido | Delay |
|---|---|---|
| 2 | Prestador: `Faço sim! R$ 4.500, entrego em 15 dias` | 0.2s |
| 3 | Maria: `Perfeito! 🤝` | 0.3s |
| — | Divisória: `15 DIAS DEPOIS` | 0.3s |
| 4 | Prestador: `Pronto! Ficou incrível ✅` | 0.2s |
| 5 | Maria: `Amei!! Vou fazer o pix agora` | 0.3s |

As mensagens entram com delays CURTOS (0.2-0.3s) — ritmo acelerado, positivo, fluido. O contraste com a Cena 3 (delays de 1-1.5s, silêncios) é gritante.

---

**BEAT 4 — O Pix (35s–37s)**

A payoff emocional. O momento que o viewer estava esperando.

**No WhatsApp:** Uma notificação bancária aparece como mensagem do sistema (balão especial, centralizado, bg `rgba(255,214,0,0.08)`, border 1px `rgba(255,214,0,0.2)`):

```
💰 Pix recebido
R$ 4.500,00
```

- `Pix recebido`: IBM Plex Mono 500, 12px, `#339933`
- `R$ 4.500,00`: Zilla Slab bold, 3vw, `#339933`
- A notificação entra com snap-in (bounce overshoot pronunciado — mais bounce que o normal, stiffness maior)
- No momento da entrada: o celular inteiro faz um **micro-bounce** (`translateY(0) → translateY(-5px) → translateY(0)`, 0.3s) — como se vibrasse com a notificação

**Fora do celular:** O fundo `#F0EFEB` faz o **pulse** verde: um flash `rgba(51,153,51,0.06)` que expande radialmente do celular em 0.5s (espelha o pulse amarelo sutil da Cena 1 quando fechou o negócio, mas agora verde — sucesso).

**Texto** abaixo do celular (fade-up, 0.5s):
- IBM Plex Mono 400, 1.4vw, `#1A1A1A`
- `Consultou antes. Recebeu depois.`
- O viewer sente: este é o oposto exato de "Você já trabalhou de graça sem querer?" da Cena 2/3.

O celular + texto ficam na tela por 1.5s. Breathing room.

**37s:** Hard cut para preto puro `#1A1A1A` (0.5s de silêncio visual total — tela completamente escura, sem glows, sem nada. O contraste entre a cena vibrante e o silêncio cria tensão para o CTA).

---

### CENA 7 — CTA "E o Pix?" (37.5s–44s)

**Propósito narrativo:** FECHAMENTO. O nome da marca é a pergunta que todo freelancer faz cobrando — e agora é a resposta. "E o Pix?" não é só um logo, é a conclusão emocional da história.

**Fundo:** `#1A1A1A` (escuro) com radial glows amarelos (padrão — NÃO vermelho, NÃO verde, volta ao amarelo neutro da marca) + grid fantasma sutil.

**Silêncio (37.5s–38s):** 0.5s de tela preta com glows. Nada acontece. Tensão.

**Headline (38s):**
- Zilla Slab bold, **6vw**, `#FFFFFF`
- `"E o Pix?"`
- Text-shadow: `3px 3px 0 #FFD600` (offset amarelo)
- Animação: `scale(0.9) translateY(50px) opacity(0)` → `scale(1) translateY(0) opacity(1)`, spring, 0.6s
- As aspas (`" "`) são parte do texto — o nome da marca é uma pergunta, uma frase, uma provocação

**Sublinhado amarelo (38.5s):**
- Abaixo do headline
- `#FFD600`, 4px de espessura, largura do texto
- ScaleX reveal: `scaleX(0) → scaleX(1)`, origin left, 0.4s, ease-out

**Subheading (39s):**
- Linha 1: IBM Plex Mono 400, 1.4vw, `#FFFFFF`
  - `Consulte antes de aceitar.`
  - Fade-up, 0.4s
- Linha 2: IBM Plex Mono 400, 1.2vw, `#888888`
  - `Sem mensalidade. Sem cadastro. R$ 29,90.`
  - Fade-up, 0.4s, delay 0.2s

**Botão CTA (40s):**
- `CONSULTAR AGORA →`
- IBM Plex Mono bold, 1.8vw, uppercase, letter-spacing 0.5px
- Background: `#FFD600`
- Cor texto: `#1A1A1A`
- Border: 2px solid `#1A1A1A`
- Border-radius: 8px
- Padding: 16px 32px
- **Box-shadow: 3px 3px 0 0 #1A1A1A** (offset brutalist)
- Animação entrada: snap-in com spring (translateY 30px → 0, scale 0.9 → 1), 0.5s
- **Glow pulsante infinito** após aparecer:
  - Box-shadow alterna:
    - `3px 3px 0 0 #1A1A1A, 0 4px 20px rgba(255,214,0,0.25)`
    - `3px 3px 0 0 #1A1A1A, 0 4px 30px rgba(255,214,0,0.5), 0 0 50px rgba(255,214,0,0.12)`
  - Cycle: 2.5s infinito

**URL (41s):**
- IBM Plex Mono 400, 1vw, `#888888`
- `www.somoseopix.com.br`
- Bottom da tela, centralizado
- Fade-in 0.3s

**42s–44s:** Tudo permanece na tela. O glow do botão pulsa. O viewer tem 2-3 segundos para absorver o URL e o CTA. Sem nova animação.

**44s:** Último frame permanece por 0.5s extra, depois fade para preto puro (a ÚNICA fade do vídeo inteiro — sinaliza "fim").

---

## PARTE 3 — RESUMO ESTRUTURAL

### Mapa de timing

| Cena | Nome | Duração | Fundo | Conteúdo principal |
|---|---|---|---|---|
| 1 | A Proposta | 0s–3s (3s) | Claro `#F0EFEB` | WhatsApp: cliente chega, negócio fecha |
| 2 | O Trabalho | 3s–9s (6s) | Claro `#F0EFEB` | WhatsApp: montagem de 15 dias em mensagens |
| 3 | O Silêncio | 9s–17s (8s) | Claro → Escuro `#1A1A1A` | WhatsApp: ghosting + BLOQUEADO + `– R$ 3.000` |
| 4 | O Rewind | 17s–20s (3s) | Escuro → Claro | Scan-sweep reverso + freeze na 1ª mensagem |
| 5 | A Consulta | 20s–29s (9s) | Claro ↔ Escuro ↔ Claro | EOPIX: busca + varredura + relatório ⛈️ + recusa |
| 6 | O Pix Que Veio | 29s–37s (8s) | Claro | Novo cliente + consulta ☀️ + trabalho + Pix recebido |
| 7 | CTA | 37.5s–44s (6.5s) | Escuro `#1A1A1A` | "E o Pix?" + CTA + URL |

**Duração total: ~44 segundos**

### Arco emocional

```
Excitação → Investimento → Tensão → Dor → Esperança → Ação → Recompensa → Resolução
   C1          C2            C3       C3      C4         C5       C6           C7
```

### Contagem de palavras na tela

| Cena | Palavras na tela (fora do WhatsApp) |
|---|---|
| 1 | 0 |
| 2 | 0 |
| 3 | 2 (`– R$ 3.000`) |
| 4 | 7 (`E se você tivesse checado antes?`) |
| 5 | ~15 (eyebrow + badge + dados do relatório + resposta WhatsApp) |
| 6 | 4 (`Consultou antes. Recebeu depois.`) |
| 7 | ~12 (headline + subheading + CTA + URL) |
| **Total** | **~40 palavras** |

### Stamps ao longo do vídeo (ritmo recorrente)

| Momento | Stamp | Cor | Emoção |
|---|---|---|---|
| 14.5s | `BLOQUEADO` | Vermelho `#CC3333` | Dor |
| 24.8s | `✓ CONCLUÍDA` | Amarelo `#FFD600` | Progresso |
| 25.5s | `CONCLUÍDO` | Verde `#339933` | Confiança |
| 26s | `ATENÇÃO` | Vermelho `#CC3333` | Alerta |
| 33s | `CÉU LIMPO` | Verde `#339933` | Segurança |
| 38s | `"E o Pix?"` | Branco + shadow amarelo | Resolução |

Os stamps criam um **ritmo visual recorrente** — o viewer aprende que "quando um stamp aparece, algo importante está sendo dito."

---

## PARTE 4 — CHECKLIST FINAL

**Narrativa:**
- [ ] A história é contada 100% por telas de interface (WhatsApp + EOPIX). Zero mãos, pessoas, objetos
- [ ] O viewer entende a história no mudo — sem depender de áudio
- [ ] O arco é: fechar negócio → trabalhar → calote → rewind → consultar → outro negócio → receber
- [ ] O contraste emocional Cena 3 (perda) vs Cena 6 (ganho) é claro e visceral
- [ ] A marca "E o Pix?" aparece SOMENTE no final (Cena 7) como punchline

**Tipografia:**
- [ ] ZERO fontes sans-serif fora do mockup WhatsApp
- [ ] Headlines: Zilla Slab bold
- [ ] Tudo mais: IBM Plex Mono
- [ ] Badges: 9px mono bold uppercase, letter-spacing 1.5-2px, radius 2px

**Cores:**
- [ ] Fundos escuros: `#1A1A1A` (nunca `#000000`)
- [ ] Fundos claros: `#F0EFEB` (nunca `#FFFFFF` como fundo de cena)
- [ ] Glows na cena de perda (C3 ending): VERMELHO `rgba(204,51,51,0.06)`
- [ ] Glows na cena de sucesso (C6): VERDE `rgba(51,153,51,0.06)` como pulse
- [ ] Glows no CTA (C7): AMARELO padrão (volta ao neutro da marca)
- [ ] Vermelho SOMENTE em perda/alerta. Verde SOMENTE em sucesso. Amarelo SOMENTE em marca/CTA

**WhatsApp:**
- [ ] Header verde `#075E54`, chat bg `#ECE5DD`, balões corretos
- [ ] Checks evoluem: ✓✓ azul (lido) → ✓✓ cinza (não lido) → ✓ (não entregue) → sem checks
- [ ] Divisórias de tempo com pill shape e texto uppercase
- [ ] Mensagens entram com slide lateral (15px) + micro-bounce
- [ ] Ritmo: rápido nas C1-C2 (0.3-0.6s), lento na C3 (0.8-1.5s), rápido na C6 (0.2-0.3s)

**EOPIX:**
- [ ] Campo de busca: border 3px `#E8E7E3`, radius 12px, focus border `#FFD600`
- [ ] Botão CONSULTAR: offset box-shadow `3px 3px 0 0 #1A1A1A`
- [ ] Varredura: circle loader com 6 ícones orbitais acendendo sequencialmente
- [ ] Relatório negativo: veredicto escuro DENTRO de card claro, border-left vermelho, ⛈️
- [ ] Relatório positivo: veredicto claro, border-left verde, ☀️
- [ ] Resumo IA: border-left amarelo `#FFD600`, badge amarelo

**Animações:**
- [ ] Transições: HARD CUT (exceção: scan-sweep na C3→C4, fade final na C7)
- [ ] Stamp-slam: cubic-bezier(0.34, 1.56, 0.64, 1) bounce overshoot
- [ ] Fade-up stagger: translateY(20px) → 0, ease-out
- [ ] Typewriter: cursor `_` amarelo, step-end 0.8s

**Texturas:**
- [ ] Fundos claros: paper grain noise 3-5%
- [ ] Fundos escuros: radial glows + grid fantasma 2.5%
- [ ] Grid fantasma NÃO visível a olho nu
- [ ] Scan lines na Cena 4 (rewind freeze): amarelo `rgba(255,214,0,0.06)` a cada 3px
