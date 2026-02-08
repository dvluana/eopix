# E O PIX? — Variações de Resultado do Relatório

Mapeamento completo de todas as combinações possíveis de resultado que o front-end precisa renderizar. Cada variação documenta: o que o usuário vê, quais blocos aparecem, e o texto esperado.

---

## Índice de Variações

| #   | Tipo  | Cenário  | Variação                                          |
| --- | ----- | -------- | ------------------------------------------------- |
| 1   | CNPJ  | ☀️ Sol   | Completo (todos os dados disponíveis)             |
| 2   | CNPJ  | ☀️ Sol   | Sem recorte temporal                              |
| 3   | CNPJ  | ☀️ Sol   | Com menções positivas na web                      |
| 4   | CNPJ  | ☀️ Sol   | Sem menções na web                                |
| 5   | CNPJ  | ☀️ Sol   | Com Reclame Aqui positivo                         |
| 6   | CNPJ  | ☀️ Sol   | Sem dados Reclame Aqui                            |
| 7   | CNPJ  | ☀️ Sol   | Completo + menções + Reclame Aqui (melhor caso)   |
| 8   | CNPJ  | ☀️ Sol   | Mínimo (sem temporal, sem menções, sem RA)        |
| 9   | CPF   | ☀️ Sol   | Completo (todos os dados disponíveis)             |
| 10  | CPF   | ☀️ Sol   | Sem recorte temporal                              |
| 11  | CPF   | ☀️ Sol   | Com indicador de atividade comercial              |
| 12  | CPF   | ☀️ Sol   | Com menções positivas na web                      |
| 13  | CPF   | ☀️ Sol   | Sem menções na web                                |
| 14  | CPF   | ☀️ Sol   | Mínimo (sem temporal, sem menções, sem atividade) |
| 15  | CPF   | ☀️ Sol   | Dados limitados (APIFull retornou pouco)          |
| 16  | CNPJ  | 🌧️ Chuva | Financeiro apenas (protestos/dívidas)             |
| 17  | CNPJ  | 🌧️ Chuva | Judicial apenas                                   |
| 18  | CNPJ  | 🌧️ Chuva | Menções negativas na web apenas                   |
| 19  | CNPJ  | 🌧️ Chuva | Reclame Aqui negativo apenas                      |
| 20  | CNPJ  | 🌧️ Chuva | Cadastro irregular (Baixada/Suspensa)             |
| 21  | CNPJ  | 🌧️ Chuva | Financeiro + Judicial                             |
| 22  | CNPJ  | 🌧️ Chuva | Todas as categorias com ocorrências (pior caso)   |
| 23  | CNPJ  | 🌧️ Chuva | Chuva com dados positivos misturados              |
| 24  | CPF   | 🌧️ Chuva | Financeiro apenas (nome sujo)                     |
| 25  | CPF   | 🌧️ Chuva | Judicial apenas                                   |
| 26  | CPF   | 🌧️ Chuva | Menções negativas na web apenas                   |
| 27  | CPF   | 🌧️ Chuva | Financeiro + Judicial + Web                       |
| 28  | CPF   | 🌧️ Chuva | Todas as categorias (pior caso)                   |
| 29  | CPF   | 🌧️ Chuva | Chuva com dados positivos misturados              |
| 30  | Ambos | ⚠️ Edge  | Google Custom Search falhou                       |
| 31  | Ambos | ⚠️ Edge  | GPT-4o-mini falhou (sem resumo IA)                |
| 32  | Ambos | ⚠️ Edge  | Dados limitados para CPF (aviso)                  |

---

## ☀️ CENÁRIO SOL — CNPJ

### Variação 1: CNPJ Sol Completo

Todos os dados disponíveis, recorte temporal presente, sem menções na web, sem Reclame Aqui.

**Blocos visíveis:**

1. ✅ Checklist com recorte temporal
2. 📋 Bloco Cadastro Empresarial
3. 🤖 Resumo IA
4. 🔖 Selo de verificação
5. 💬 Texto de fechamento

**O que o usuário vê:**

> **✅ Situação financeira:** Nome limpo há 5 anos — 0 protestos, 0 dívidas ativas, 0 cheques devolvidos
> **✅ Processos judiciais:** Nenhum encontrado nos tribunais consultados
> **✅ Menções na web:** Nenhuma ocorrência negativa
>
> ---
>
> **Cadastro Empresarial**
> Razão Social: ACME TECNOLOGIA LTDA
> Situação cadastral: Ativa
> Empresa ativa há 8 anos (aberta em 15/03/2018)
> CNAE principal: 6201-5/01 — Desenvolvimento de programas de computador sob encomenda
> CNAEs secundários: 6202-3/00, 6204-0/00
> Quadro societário: João Silva (50%), Maria Souza (50%)
> Capital social: R$ 100.000,00
>
> ---
>
> **Resumo:** Empresa ativa há 8 anos, sem ocorrências financeiras ou judiciais. Nenhuma menção negativa encontrada na web.
>
> ---
>
> 🔖 **Verificação**
> Consulta realizada em: 08/02/2026
> Fontes consultadas: cartórios de protesto, tribunais de justiça, Receita Federal, Reclame Aqui, notícias e registros públicos
> Validade: 7 dias
>
> ---
>
> _Pelo que encontramos, o céu está limpo. Boa parceria!_

---

### Variação 2: CNPJ Sol — Sem Recorte Temporal

APIFull não retornou o campo de tempo de nome limpo.

**Diferença da Variação 1:** Checklist sem "há X anos".

**Checklist exibido:**

> **✅ Situação financeira:** Nome limpo — 0 protestos, 0 dívidas ativas, 0 cheques devolvidos
> **✅ Processos judiciais:** Nenhum encontrado nos tribunais consultados
> **✅ Menções na web:** Nenhuma ocorrência negativa

**Resumo IA:** "Empresa ativa há 8 anos, sem ocorrências financeiras ou judiciais. Nenhuma menção negativa encontrada na web."

_Demais blocos idênticos à Variação 1._

---

### Variação 3: CNPJ Sol — Com Menções Positivas na Web

Google Custom Search retornou menções, GPT-4o-mini classificou todas como neutras ou positivas.

**Blocos visíveis:**

1. ✅ Checklist com recorte temporal
2. 📋 Bloco Cadastro Empresarial
3. 🌐 Menções positivas na web
4. 🤖 Resumo IA
5. 🔖 Selo de verificação
6. 💬 Texto de fechamento

**Checklist (diferença no item web):**

> **✅ Menções na web:** 3 menções encontradas, todas neutras ou positivas

**Bloco de menções:**

> **Menções na web**
> — "ACME Tecnologia vence prêmio de inovação 2025" — _portalinovacao.com.br_
> — "Startup catarinense participa da Web Summit" — _startupi.com.br_
> — "Parceria entre ACME e Universidade Federal gera projeto de IA" — _ufsc.br_

**Resumo IA:** "Empresa ativa há 8 anos, sem ocorrências financeiras ou judiciais. 3 menções positivas encontradas na web, incluindo premiação e participação em eventos."

---

### Variação 4: CNPJ Sol — Sem Menções na Web

Google Custom Search não encontrou resultados relevantes OU todas foram filtradas como homônimos.

**Checklist:**

> **✅ Menções na web:** Nenhuma menção relevante encontrada na web

**Bloco de menções:** Não aparece.

**Resumo IA:** "Empresa ativa há 8 anos, sem ocorrências financeiras ou judiciais. Nenhuma menção relevante encontrada na web."

---

### Variação 5: CNPJ Sol — Com Reclame Aqui Positivo

Empresa tem página no Reclame Aqui com nota alta / boa reputação.

**Blocos visíveis:**

1. ✅ Checklist com recorte temporal
2. 📋 Bloco Cadastro Empresarial
3. ⭐ Reclame Aqui positivo
4. 🤖 Resumo IA
5. 🔖 Selo de verificação
6. 💬 Texto de fechamento

**Bloco Reclame Aqui:**

> **Reclame Aqui**
> Nota: 8.2 / 10
> Índice de resolução: 94%
> 🏆 Selo RA1000

**Resumo IA:** "Empresa ativa há 8 anos, sem ocorrências financeiras ou judiciais. Nota 8.2 no Reclame Aqui com selo RA1000."

---

### Variação 6: CNPJ Sol — Sem Dados Reclame Aqui

Google Custom Search não retornou resultados de reclameaqui.com.br.

**Bloco Reclame Aqui:** Não aparece (card oculto).

**Resumo IA:** "Empresa ativa há 8 anos, sem ocorrências financeiras ou judiciais. Sem reclamações no Reclame Aqui."

---

### Variação 7: CNPJ Sol — Melhor Caso (Completo + Menções + RA)

Todos os dados disponíveis, menções positivas, Reclame Aqui com boa nota.

**Blocos visíveis:**

1. ✅ Checklist com recorte temporal
2. 📋 Bloco Cadastro Empresarial
3. 🌐 Menções positivas na web
4. ⭐ Reclame Aqui positivo
5. 🤖 Resumo IA
6. 🔖 Selo de verificação
7. 💬 Texto de fechamento

**Resumo IA:** "Empresa ativa há 8 anos, sem ocorrências financeiras ou judiciais. 2 menções positivas encontradas na web. Nota 8.2 no Reclame Aqui com selo RA1000."

---

### Variação 8: CNPJ Sol — Caso Mínimo

Sem recorte temporal, sem menções web, sem Reclame Aqui.

**Blocos visíveis:**

1. ✅ Checklist (sem recorte temporal)
2. 📋 Bloco Cadastro Empresarial
3. 🤖 Resumo IA
4. 🔖 Selo de verificação
5. 💬 Texto de fechamento

**Checklist:**

> **✅ Situação financeira:** Nome limpo — 0 protestos, 0 dívidas ativas, 0 cheques devolvidos
> **✅ Processos judiciais:** Nenhum encontrado nos tribunais consultados
> **✅ Menções na web:** Nenhuma menção relevante encontrada na web

**Resumo IA:** "Sem ocorrências financeiras ou judiciais. Nenhuma menção relevante encontrada na web."

---

## ☀️ CENÁRIO SOL — CPF

### Variação 9: CPF Sol Completo

Recorte temporal disponível, sem menções, sem atividade comercial especial.

**Blocos visíveis:**

1. ✅ Checklist com recorte temporal
2. 🤖 Resumo IA
3. 🔖 Selo de verificação
4. 💬 Texto de fechamento

**O que o usuário vê:**

> **✅ Situação financeira:** Nome limpo há 5 anos — 0 protestos, 0 dívidas ativas, 0 cheques devolvidos
> **✅ Processos judiciais:** Nenhum encontrado nos tribunais consultados
> **✅ Menções na web:** Nenhuma ocorrência negativa
>
> ---
>
> **Resumo:** Nenhuma ocorrência financeira, judicial ou de menções negativas na web encontrada para este CPF nos registros públicos consultados em 08/02/2026. Nome limpo há pelo menos 5 anos.
>
> ---
>
> 🔖 **Verificação**
> Consulta realizada em: 08/02/2026
> Fontes consultadas: cartórios de protesto, tribunais de justiça, Receita Federal, Reclame Aqui, notícias e registros públicos
> Validade: 7 dias
>
> ---
>
> _Pelo que encontramos, o céu está limpo. Boa parceria!_

**Nota:** Sem bloco de Cadastro Empresarial (não se aplica a CPF).

---

### Variação 10: CPF Sol — Sem Recorte Temporal

APIFull não retornou campo de tempo.

**Checklist:**

> **✅ Situação financeira:** Nome limpo — 0 protestos, 0 dívidas ativas, 0 cheques devolvidos

**Resumo IA:** "Nenhuma ocorrência financeira, judicial ou de menções negativas na web encontrada para este CPF nos registros públicos consultados em 08/02/2026."

---

### Variação 11: CPF Sol — Com Indicador de Atividade Comercial

APIFull retornou dado de consultas recentes ao CPF.

**Blocos visíveis:**

1. ✅ Checklist com recorte temporal
2. 📊 Indicador de atividade comercial
3. 🤖 Resumo IA
4. 🔖 Selo de verificação
5. 💬 Texto de fechamento

**Bloco adicional:**

> 📊 **Atividade comercial:** 12 empresas consultaram este CPF recentemente

**Resumo IA:** "Nenhuma ocorrência financeira, judicial ou de menções negativas na web encontrada para este CPF nos registros públicos consultados em 08/02/2026. Nome limpo há pelo menos 5 anos. 12 empresas consultaram este CPF recentemente."

---

### Variação 12: CPF Sol — Com Menções Positivas

Google Custom Search retornou menções classificadas como neutras/positivas.

**Blocos visíveis:**

1. ✅ Checklist com recorte temporal
2. 🌐 Menções positivas na web
3. 🤖 Resumo IA
4. 🔖 Selo de verificação
5. 💬 Texto de fechamento

**Checklist (diferença):**

> **✅ Menções na web:** 2 menções encontradas, todas neutras ou positivas

**Bloco de menções:**

> **Menções na web**
> — "Palestrante confirmado no evento de tecnologia" — _eventobr.com.br_
> — "Artigo publicado na revista de engenharia" — _reveng.com.br_

---

### Variação 13: CPF Sol — Sem Menções na Web

**Checklist:**

> **✅ Menções na web:** Nenhuma menção relevante encontrada na web

**Bloco de menções:** Não aparece.

---

### Variação 14: CPF Sol — Caso Mínimo

Sem recorte temporal, sem menções, sem indicador de atividade.

**Blocos visíveis:**

1. ✅ Checklist (sem recorte)
2. 🤖 Resumo IA
3. 🔖 Selo de verificação
4. 💬 Texto de fechamento

**Resumo IA:** "Nenhuma ocorrência financeira, judicial ou de menções negativas na web encontrada para este CPF nos registros públicos consultados em 08/02/2026."

---

### Variação 15: CPF Sol — Dados Limitados

APIFull retornou poucos dados para o CPF. Resultado válido, mas com aviso.

**Blocos visíveis:**

1. ✅ Checklist (itens verificados)
2. ⚠️ Aviso de dados limitados
3. 🤖 Resumo IA
4. 🔖 Selo de verificação
5. 💬 Texto de fechamento

**Aviso:**

> ⚠️ Dados limitados para este CPF. As verificações foram realizadas, mas algumas fontes retornaram informações parciais.

**Checklist (mostra o que foi possível verificar):**

> **✅ Situação financeira:** Nome limpo — 0 protestos, 0 dívidas ativas
> **✅ Processos judiciais:** Nenhum encontrado nos tribunais consultados
> **✅ Menções na web:** Nenhuma ocorrência negativa

**Resumo IA:** "Verificação realizada com dados limitados. Nenhuma ocorrência negativa encontrada nas fontes consultadas em 08/02/2026."

---

## 🌧️ CENÁRIO CHUVA — CNPJ

### Regra geral do Chuva

- Checklist resumido no topo (o que está OK)
- Cards expandidos APENAS para categorias com ocorrências
- Cadastro Empresarial SEMPRE visível para CNPJ
- Dados positivos (RA, menções) ainda aparecem se existirem
- Texto de fechamento: "Encontramos alguns pontos de atenção. Avalie com cuidado."

---

### Variação 16: CNPJ Chuva — Financeiro Apenas

Protestos/dívidas encontrados. Demais categorias limpas.

**Blocos visíveis:**

1. ✅ Checklist resumido (itens OK)
2. 🔴 Card Situação Financeira expandido
3. 📋 Bloco Cadastro Empresarial (sempre CNPJ)
4. 🤖 Resumo IA
5. 🔖 Selo de verificação
6. 💬 Texto de fechamento Chuva

**O que o usuário vê:**

> **Clima instável. 5 ocorrências encontradas.**
> _Ícones representam volume de registros públicos, não avaliação de risco de crédito. A interpretação é exclusivamente sua._
>
> **✅ Processos judiciais:** Nenhum encontrado nos tribunais consultados
> **✅ Menções na web:** Nenhuma ocorrência negativa
>
> ---
>
> 🔴 **Situação Financeira**
> Nome sujo: Sim
> Protestos: 3 (valor total: R$ 12.450,00)
> Dívidas ativas: 2 (valor total: R$ 8.200,00)
> Cheques devolvidos: 0
>
> ---
>
> **Cadastro Empresarial**
> Razão Social: ACME TECNOLOGIA LTDA
> Situação cadastral: Ativa
> Empresa ativa há 8 anos
> _(demais campos cadastrais...)_
>
> ---
>
> **Resumo:** Atenção: 3 protestos totalizando R$ 12.450,00 e 2 dívidas ativas. Nenhum processo judicial encontrado. Empresa ativa há 8 anos.
>
> ---
>
> _Encontramos alguns pontos de atenção. Avalie com cuidado._

---

### Variação 17: CNPJ Chuva — Judicial Apenas

Processos judiciais encontrados. Financeiro limpo.

**Blocos visíveis:**

1. ✅ Checklist resumido (financeiro OK, web OK)
2. 🔴 Card Processos Judiciais expandido
3. 📋 Bloco Cadastro Empresarial
4. 🤖 Resumo IA
5. 🔖 Selo de verificação
6. 💬 Texto de fechamento Chuva

**Card expandido:**

> 🔴 **Processos Judiciais**
>
> | Tribunal | Data       | Classe                           | Polo |
> | -------- | ---------- | -------------------------------- | ---- |
> | TJSC     | 12/03/2024 | Execução de Título Extrajudicial | Réu  |
> | TJSC     | 05/11/2023 | Cobrança                         | Réu  |
> | TRT-12   | 20/08/2024 | Trabalhista — Empresa Ré         | Réu  |
>
> ⚠️ **Trabalhista (Empresa Ré):** 1 processo separado visualmente

**Checklist:**

> **✅ Situação financeira:** Nome limpo há 5 anos — 0 protestos, 0 dívidas ativas, 0 cheques devolvidos
> **✅ Menções na web:** Nenhuma ocorrência negativa

**Resumo IA:** "Atenção: 3 processos judiciais encontrados, incluindo 1 trabalhista como ré. Situação financeira limpa. Empresa ativa há 8 anos."

---

### Variação 18: CNPJ Chuva — Menções Negativas na Web Apenas

GPT-4o-mini classificou menções como negativas. Financeiro e judicial limpos.

**Blocos visíveis:**

1. ✅ Checklist resumido (financeiro OK, judicial OK)
2. 🔴 Card Notícias e Web expandido
3. 📋 Bloco Cadastro Empresarial
4. 🤖 Resumo IA
5. 🔖 Selo de verificação
6. 💬 Texto de fechamento Chuva

**Card expandido:**

> 🔴 **Notícias e Web**
>
> **Menções negativas:**
> — "Consumidores relatam problemas com empresa ACME" — _noticiabr.com.br_ 🔴
> — "ACME citada em denúncia de atraso" — _portalqueixas.com.br_ 🔴
>
> **Menções neutras/positivas:**
> — "ACME participa de evento do setor" — _eventobr.com.br_ ⚪

**Resumo IA:** "Atenção: 2 menções negativas encontradas na web. Situação financeira e judicial limpa. Empresa ativa há 8 anos."

---

### Variação 19: CNPJ Chuva — Reclame Aqui Negativo Apenas

Reclame Aqui com nota baixa, mas financeiro/judicial/web limpos.

**Blocos visíveis:**

1. ✅ Checklist resumido (financeiro OK, judicial OK, web OK)
2. 🔴 Card Reclame Aqui expandido
3. 📋 Bloco Cadastro Empresarial
4. 🤖 Resumo IA
5. 🔖 Selo de verificação
6. 💬 Texto de fechamento Chuva

**Card expandido:**

> 🔴 **Reclame Aqui**
> 12 reclamações encontradas, 8 respondidas
> Nota: 3.2 / 10
> Índice de resolução: 45%
> Principais queixas: atraso na entrega, falta de suporte
> [Ver no Reclame Aqui →]

**Resumo IA:** "Situação financeira e judicial limpa. Atenção: nota 3.2 no Reclame Aqui com 12 reclamações e índice de resolução de 45%."

---

### Variação 20: CNPJ Chuva — Cadastro Irregular (Baixada/Suspensa)

Empresa com situação cadastral irregular. Pode ou não ter outros problemas.

**Blocos visíveis:**

1. ✅ Checklist resumido
2. 🔴 Card Cadastro Empresarial com borda vermelha
3. 🤖 Resumo IA
4. 🔖 Selo de verificação
5. 💬 Texto de fechamento Chuva

**Card com borda vermelha:**

> 🔴 **Cadastro Empresarial** ⚠️
> Razão Social: ACME TECNOLOGIA LTDA
> **Situação cadastral: BAIXADA** 🔴
> Data de abertura: 15/03/2018
> Data de baixa: 22/11/2025
> CNAE principal: 6201-5/01
> Quadro societário: João Silva (50%), Maria Souza (50%)
> Capital social: R$ 100.000,00

**Resumo IA:** "Atenção: empresa com situação cadastral BAIXADA desde novembro de 2025. Nenhuma ocorrência financeira ou judicial encontrada."

---

### Variação 21: CNPJ Chuva — Financeiro + Judicial

Duas categorias com ocorrências simultâneas.

**Blocos visíveis:**

1. ✅ Checklist resumido (web OK)
2. 🔴 Card Situação Financeira expandido
3. 🔴 Card Processos Judiciais expandido
4. 📋 Bloco Cadastro Empresarial
5. 🤖 Resumo IA
6. 🔖 Selo de verificação
7. 💬 Texto de fechamento Chuva

**Checklist:**

> **✅ Menções na web:** Nenhuma ocorrência negativa

**Resumo IA:** "Atenção: 47 processos encontrados e 3 protestos totalizando R$ 45.000,00. Empresa ativa há 3 anos."

---

### Variação 22: CNPJ Chuva — Pior Caso (Todas as Categorias)

Ocorrências em financeiro, judicial, web E Reclame Aqui. Cadastro irregular.

**Blocos visíveis:**

1. ⚠️ Nenhum item no checklist positivo (todos com problemas)
2. 🔴 Card Situação Financeira expandido
3. 🔴 Card Processos Judiciais expandido
4. 🔴 Card Notícias e Web expandido (negativas em destaque)
5. 🔴 Card Reclame Aqui expandido
6. 🔴 Card Cadastro Empresarial com borda vermelha
7. 🤖 Resumo IA
8. 🔖 Selo de verificação
9. 💬 Texto de fechamento Chuva

**O que o usuário vê:**

> **Clima instável. 68 ocorrências encontradas.**
> _Ícones representam volume de registros públicos, não avaliação de risco de crédito. A interpretação é exclusivamente sua._

**Resumo IA:** "Atenção: empresa com situação SUSPENSA. 5 protestos (R$ 87.000), 47 processos judiciais (12 trabalhistas como ré), menções de golpe em 3 sites, nota 1.8 no Reclame Aqui."

---

### Variação 23: CNPJ Chuva — Com Dados Positivos Misturados

Tem ocorrências negativas, MAS também tem dados positivos (RA bom, menções positivas).

**Blocos visíveis:**

1. ✅ Checklist resumido (menções web OK)
2. 🔴 Card Situação Financeira expandido (protestos)
3. 📋 Bloco Cadastro Empresarial (ativo, normal)
4. ⭐ Reclame Aqui positivo (nota alta aparece mesmo no Chuva)
5. 🤖 Resumo IA
6. 🔖 Selo de verificação
7. 💬 Texto de fechamento Chuva

**Nota:** Dados positivos do Reclame Aqui aparecem mesmo no cenário Chuva. Menções neutras/positivas ficam separadas das negativas.

**Resumo IA:** "Atenção: 2 protestos totalizando R$ 5.200,00. Empresa ativa há 12 anos. Nota 9.1 no Reclame Aqui com selo RA1000. Nenhum processo judicial encontrado."

---

## 🌧️ CENÁRIO CHUVA — CPF

### Variação 24: CPF Chuva — Financeiro Apenas (Nome Sujo)

**Blocos visíveis:**

1. ✅ Checklist resumido (judicial OK, web OK)
2. 🔴 Card Situação Financeira expandido
3. 🤖 Resumo IA
4. 🔖 Selo de verificação
5. 💬 Texto de fechamento Chuva

**O que o usuário vê:**

> **Clima instável. 4 ocorrências encontradas.**
>
> **✅ Processos judiciais:** Nenhum encontrado nos tribunais consultados
> **✅ Menções na web:** Nenhuma ocorrência negativa
>
> ---
>
> 🔴 **Situação Financeira**
> Nome sujo: Sim
> Protestos: 2 (valor total: R$ 3.800,00)
> Dívidas ativas: 2 (valor total: R$ 15.600,00)
> Cheques devolvidos: 0
>
> ---
>
> **Resumo:** Atenção: nome com restrição. 2 protestos e 2 dívidas ativas encontrados.
>
> ---
>
> _Encontramos alguns pontos de atenção. Avalie com cuidado._

---

### Variação 25: CPF Chuva — Judicial Apenas

**Blocos visíveis:**

1. ✅ Checklist resumido (financeiro OK, web OK)
2. 🔴 Card Processos Judiciais expandido
3. 🤖 Resumo IA
4. 🔖 Selo de verificação
5. 💬 Texto de fechamento Chuva

**Card expandido:**

> 🔴 **Processos Judiciais**
>
> | Tribunal | Data       | Classe          | Polo |
> | -------- | ---------- | --------------- | ---- |
> | TJSC     | 03/07/2024 | Execução Fiscal | Réu  |
>
> [Ver processo no tribunal →]

**Resumo IA:** "Atenção: 1 processo judicial encontrado (execução fiscal). Situação financeira limpa."

---

### Variação 26: CPF Chuva — Menções Negativas Apenas

**Blocos visíveis:**

1. ✅ Checklist resumido (financeiro OK, judicial OK)
2. 🔴 Card Notícias e Web expandido
3. 🤖 Resumo IA
4. 🔖 Selo de verificação
5. 💬 Texto de fechamento Chuva

**Card expandido:**

> 🔴 **Notícias e Web**
>
> **Menções negativas:**
> — "Fulano de Tal denunciado por fraude em contrato" — _noticialocal.com.br_ 🔴
>
> **Menções neutras/positivas:**
> _(nenhuma)_

---

### Variação 27: CPF Chuva — Financeiro + Judicial + Web

Três categorias com problemas simultâneos.

**Blocos visíveis:**

1. ⚠️ Nenhum item positivo no checklist
2. 🔴 Card Situação Financeira expandido
3. 🔴 Card Processos Judiciais expandido
4. 🔴 Card Notícias e Web expandido
5. 🤖 Resumo IA
6. 🔖 Selo de verificação
7. 💬 Texto de fechamento Chuva

**Resumo IA:** "Atenção: nome com restrição, 5 protestos, 12 processos judiciais e menções de fraude em 2 sites."

---

### Variação 28: CPF Chuva — Pior Caso (Tudo)

Todas as categorias possíveis para CPF com ocorrências.

**Blocos visíveis:**

1. 🔴 Card Situação Financeira expandido
2. 🔴 Card Processos Judiciais expandido
3. 🔴 Card Notícias e Web expandido (negativas em destaque)
4. 🔴 Card Reclame Aqui expandido (se CPF vinculado a empresa)
5. 🤖 Resumo IA
6. 🔖 Selo de verificação
7. 💬 Texto de fechamento Chuva

**Nota:** Para CPF, o Reclame Aqui só aparece se a busca Google encontrou a pessoa vinculada a reclamações. É raro, mas possível.

**Resumo IA:** "Atenção: nome com restrição, 8 protestos (R$ 92.000), 23 processos judiciais (5 trabalhistas), menções de golpe em 4 sites."

---

### Variação 29: CPF Chuva — Com Dados Positivos Misturados

Tem ocorrências negativas em uma categoria, mas outras estão limpas + indicador de atividade.

**Blocos visíveis:**

1. ✅ Checklist resumido (financeiro OK, web OK)
2. 🔴 Card Processos Judiciais expandido (1 processo)
3. 📊 Indicador de atividade comercial
4. 🤖 Resumo IA
5. 🔖 Selo de verificação
6. 💬 Texto de fechamento Chuva

**O que o usuário vê:**

> **✅ Situação financeira:** Nome limpo há 3 anos — 0 protestos, 0 dívidas ativas
> **✅ Menções na web:** Nenhuma ocorrência negativa
>
> ---
>
> 🔴 **Processos Judiciais**
> 1 processo encontrado (Cível — Polo: Autor)
>
> ---
>
> 📊 8 empresas consultaram este CPF recentemente
>
> ---
>
> **Resumo:** 1 processo judicial encontrado (cível, como autor). Situação financeira limpa há 3 anos. 8 empresas consultaram este CPF recentemente.

---

## ⚠️ EDGE CASES

### Variação 30: Google Custom Search Falhou

API não-crítica. Relatório entregue sem card de web/notícias.

**Comportamento:**

- Card Notícias e Web: **não aparece** (removido do layout)
- Checklist no Sol: item de menções web **omitido**
- Resumo IA: gerado sem dados de web. Ex: "Empresa ativa há 8 anos, sem ocorrências financeiras ou judiciais. Dados de menções na web indisponíveis."
- Card Reclame Aqui: **não aparece** (depende do Google Custom Search)

**Aplica-se a:** CPF e CNPJ, Sol e Chuva.

---

### Variação 31: GPT-4o-mini Falhou

API não-crítica. Relatório entregue sem resumo IA.

**Comportamento:**

- Bloco Resumo IA: **não aparece**
- Demais blocos/cards: exibidos normalmente
- Classificação de menções: **indisponível** (web mostra menções sem classificação positiva/neutra/negativa)
- Filtragem de homônimos: **indisponível** (todas as menções são exibidas)

**Nota para o front:** Se GPT-4o-mini falhou, o card de web mostra todas as menções sem classificação (fallback visual sem tags de cor).

---

### Variação 32: Dados Limitados para CPF

APIFull retornou resposta válida mas com poucos campos preenchidos. Não é falha técnica — é resultado válido.

**Comportamento:**

- Aviso no topo: "Dados limitados para este CPF"
- Checklist mostra apenas o que foi possível verificar
- **Não gera reembolso** (resultado válido com aviso)
- Resumo IA: "Verificação realizada com dados limitados. Nenhuma ocorrência encontrada nas fontes consultadas."

---

## Resumo de Regras Visuais

| Regra                  | Descrição                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| Cadastro Empresarial   | SEMPRE visível para CNPJ (Sol = bloco informativo, Chuva = card com borda vermelha se irregular) |
| Cadastro Empresarial   | NUNCA aparece para CPF                                                                           |
| Reclame Aqui           | Oculto se sem dados. Visível com nota positiva mesmo no Sol. Visível com nota negativa no Chuva  |
| Menções Web            | Sol = bloco resumido com links. Chuva = card expandido com classificação (negativas em destaque) |
| Indicador Atividade    | Só CPF. Só aparece se APIFull retornou o dado                                                    |
| Recorte Temporal       | Aparece se APIFull retornou o campo. Se não, checklist sem "há X anos"                           |
| Selo Verificação       | SEMPRE visível em qualquer cenário                                                               |
| Texto Fechamento Sol   | "Pelo que encontramos, o céu está limpo. Boa parceria!"                                          |
| Texto Fechamento Chuva | "Encontramos alguns pontos de atenção. Avalie com cuidado."                                      |
| Cards vazios           | NUNCA exibir card vazio individual                                                               |
| Disclaimer             | SEMPRE visível próximo ao ícone de clima                                                         |
| Links externos         | "Consultar Receita Federal" e "Consultar Serasa" NÃO existem (removidos)                         |
