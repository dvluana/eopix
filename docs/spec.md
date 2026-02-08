**E O PIX?**

ESPECIFICAÇÃO TÉCNICA v3.2

Versão: 3.2 (Consolidada + Dados Positivos + Nova Consulta)

Data: Fevereiro 2026

Status: Pronto para Desenvolvimento

_Fluxo assíncrono (modelo Olho no Carro), APIs corrigidas (APIFull + Escavador), Asaas Checkout hospedado, autenticação por e-mail, área Minhas Consultas, layout adaptativo por clima com dados positivos e selo de verificação, fluxo Nova Consulta para usuários logados, proteção contra bots, compliance LGPD reforçado._

# 1\. VISÃO GERAL E PRODUTO

## 1.1 O Produto

Plataforma de consulta de reputação comercial e pessoal (CPF e CNPJ) para autônomos e pequenas empresas. Centraliza dados públicos financeiros, judiciais e de notícias em um único relatório visual.

**Promessa:** "O Google que você deveria ter feito antes de assinar."

**Diferencial:** Tom de voz irônico, processamento assíncrono robusto e centralização de dados públicos.

**Preço:** R\$ 29,90 por consulta (pagamento único via Pix).

**Público:** Autônomos, freelancers e PMEs que precisam verificar parceiros, clientes ou fornecedores antes de fechar negócio.

## 1.2 Modelo de Referência

O fluxo de compra e entrega segue o modelo do Olho no Carro: o usuário paga primeiro, o processamento acontece em background, e o resultado fica disponível na área logada do usuário. Notificação por e-mail quando a consulta é finalizada.

# 2\. FLUXO DO USUÁRIO (UX)

## 2.1 Fluxo Completo

Fluxo assíncrono: o usuário paga e sai. O processamento roda em background. O usuário é notificado por e-mail quando o relatório está pronto.

| **Etapa**           | **Ação**                               | **Detalhes**                                                                                                                                                          |
| ------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1\. Input           | Usuário digita CPF ou CNPJ             | Campo único com máscara automática. Não aceita nome. CAPTCHA (Turnstile) obrigatório.                                                                                 |
| ---                 | ---                                    | ---                                                                                                                                                                   |
| 2\. Validação       | Sistema valida formato                 | Valida dígitos verificadores. Se inválido, erro inline instantâneo.                                                                                                   |
| ---                 | ---                                    | ---                                                                                                                                                                   |
| 3\. Blocklist       | Sistema verifica Blocklist             | Se o CPF/CNPJ está bloqueado: exibe 'Dados indisponíveis por solicitação do titular.' Fluxo encerra.                                                                  |
| ---                 | ---                                    | ---                                                                                                                                                                   |
| 4\. Health Check    | Sistema verifica APIs                  | Pinga APIFull + Escavador. Se DOWN: bloqueia compra, exibe manutenção + captura e-mail (LeadCapture).                                                                 |
| ---                 | ---                                    | ---                                                                                                                                                                   |
| 5\. Teaser          | Tela de prévia                         | Estrutura do relatório borrada com dados placeholder. Legenda: 'Exemplo de dados que serão desbloqueados'. SEM dados reais. SEM nome real.                            |
| ---                 | ---                                    | ---                                                                                                                                                                   |
| 6\. E-mail + Termos | Usuário informa e-mail e aceita termos | E-mail obrigatório + checkbox 'Li e aceito os Termos de Uso e Política de Privacidade'. Ambos obrigatórios para habilitar botão de pagamento.                         |
| ---                 | ---                                    | ---                                                                                                                                                                   |
| 7\. Pagamento       | Pix via Asaas                          | Backend cria Purchase PENDING + chama Asaas API (customerData.email pré-preenchido). Redireciona para Asaas Checkout hospedado. Asaas coleta nome e CPF do comprador. |
| ---                 | ---                                    | ---                                                                                                                                                                   |
| 8\. Retorno         | Usuário volta ao nosso site            | Tela pós-pagamento: e-mail em destaque + 'Está correto?' + link 'Corrigir e-mail' + código da compra + aviso de tempo + aviso de spam.                                |
| ---                 | ---                                    | ---                                                                                                                                                                   |
| 9\. Webhook         | Asaas confirma pagamento               | Endpoint /api/webhooks/asaas. Idempotente. Extrai buyerName/buyerCpfCnpj do payload. Atualiza Purchase para PROCESSING. Dispara job Inngest.                          |
| ---                 | ---                                    | ---                                                                                                                                                                   |
| 10\. Processamento  | Backend busca dados (assíncrono)       | Job Inngest. CPF: APIFull primeiro (descobre nome) → paralelo. CNPJ: BrasilAPI primeiro (descobre nome grátis, fallback APIFull) → paralelo. GPT-4o-mini gera resumo. |
| ---                 | ---                                    | ---                                                                                                                                                                   |
| 11\. Notificação    | E-mail de conclusão                    | Resend envia: 'Sua consulta sobre CPF \*\*\*XXX\*\*\* foi finalizada. Acesse aqui.' Aviso: verifique o spam.                                                          |
| ---                 | ---                                    | ---                                                                                                                                                                   |
| 12\. Acesso         | Usuário acessa relatório               | Login em /minhas-consultas com e-mail (magic link). Vê status: Processando / Concluído / Falhou.                                                                      |
| ---                 | ---                                    | ---                                                                                                                                                                   |

## 2.2 Tela de Teaser (Pré-Pagamento)

A tela de teaser é a principal ferramenta de conversão. Mostra o suficiente para gerar curiosidade sem expor dados reais de terceiros (risco CDC).

- **CPF/CNPJ em destaque:** Topo da tela: 'Consulta para o CPF: \*\*\*.456.789-\*\*' para que o usuário confira antes de pagar.
- **Estrutura borrada:** Cards do relatório com dados placeholder (ex: 'XX protestos', 'XX processos') com blur CSS pesado. Faixa: 'Exemplo de dados que serão desbloqueados'.
- **Sem dados reais:** Nenhum dado real é exibido antes do pagamento. Sem nome, sem score, sem nada.

**Formulário de compra (abaixo dos cards borrados):**

- **Campo de e-mail:** Label: "Para onde enviamos o relatório?". Placeholder: "Seu melhor e-mail". Validação de formato inline. Se o usuário já possui sessão ativa (veio do botão "Nova Consulta" em Minhas Consultas), o campo aparece pré-preenchido com o e-mail da sessão. Campo permanece editável. Instrução técnica: Teaser verifica sessão ativa via cookie JWT; se existir, preenche com session.email.
- **Checkbox de termos:** 'Li e aceito os Termos de Uso e a Política de Privacidade' (links clicáveis). Obrigatório.
- **Botão:** 'Desbloquear Relatório - R\$ 29,90'. Desabilitado até e-mail válido + checkbox marcado. Desabilitado se Health Check falhar (texto: 'Estamos em manutenção').

**Fluxo ao clicar no botão:**

- Backend cria Purchase com status PENDING (grava e-mail, term, termsAcceptedAt).
- Backend chama API do Asaas para criar cobrança Pix (envia customerData.email pré-preenchido). Recebe asaasPaymentId + checkoutUrl.
- Grava asaasPaymentId no Purchase.
- Redireciona usuário para checkoutUrl do Asaas (configura successUrl com purchaseId: /compra/confirmacao?id={purchaseId}).
- Na página do Asaas, o usuário vê e-mail já preenchido e completa nome e CPF do comprador (coletados pelo Asaas, não por nós).
- Asaas confirma Pix → webhook volta ao nosso backend com dados do comprador (buyerName, buyerCpfCnpj) → grava no Purchase.

**Dados do comprador:** Nome e CPF do comprador são coletados pelo Asaas Checkout (não pelo nosso formulário). Isso evita fricção no nosso funil. Os dados chegam via webhook e são gravados no Purchase para NFS-e e registro fiscal.

### 2.2.1 Tela Pós-Pagamento (Retorno do Asaas)

Após o pagamento no Asaas Checkout, o usuário é redirecionado para /compra/confirmacao?id={purchaseId}. A tela busca o Purchase pelo ID e exibe:

- **Ícone de check verde + 'Pagamento confirmado!'**
- **E-mail em destaque:** 'Enviamos para <fulano@gmial.com> - está correto?' + link 'Corrigir e-mail'. Se corrigir, atualiza no banco e reenvia.
- **Código da compra:** 'Seu código: #A7K2M9'.
- **Aviso de tempo:** 'Sua consulta está sendo processada. Pode levar alguns minutos. Você receberá um e-mail quando estiver pronto.'
- **Aviso de spam:** 'Não recebeu? Verifique o spam. Você também pode acessar /minhas-consultas a qualquer momento.'
- **Botão:** 'Ir para Minhas Consultas' sempre visível.

## 2.3 Área 'Minhas Consultas'

O usuário acessa /minhas-consultas com o e-mail informado no pagamento. Autenticação via magic link (código enviado por e-mail, sem senha).

| **Estado**       | **Visual**                         | **Descrição**                                                         |
| ---------------- | ---------------------------------- | --------------------------------------------------------------------- |
| Processando      | ⏳ Indicador de progresso          | Consulta em andamento. Pode levar até 2-3 minutos.                    |
| ---              | ---                                | ---                                                                   |
| Concluído        | ✅ Botão 'Ver Relatório'           | Relatório pronto para visualização.                                   |
| ---              | ---                                | ---                                                                   |
| Falhou           | ❌ Mensagem + reembolso automático | Falha técnica real. Reembolso via Asaas.                              |
| ---              | ---                                | ---                                                                   |
| Reembolso falhou | ⚠️ Mensagem + 'Estamos resolvendo' | Retry de reembolso falhou 3x. Admin notificado. Status REFUND_FAILED. |
| ---              | ---                                | ---                                                                   |

- **Expirado:** Após 7 dias, o relatório expira. Exibe 'Relatório expirado' na lista. Dados purgados do banco.
- **Histórico:** Usuário vê todas as consultas já feitas (ativas e expiradas).
- **Nova Consulta (o que o usuário vê):** Botão "Nova Consulta" visível no topo da tela Minhas Consultas. Ao clicar, redireciona para a Home (/). O campo de e-mail no Teaser aparece pré-preenchido com o e-mail da sessão (campo permanece editável). Após pagar e retornar à confirmação, o botão "Ir para Minhas Consultas" leva de volta ao painel onde a nova consulta já aparece na lista como "Processando".
- **Instrução técnica:** O botão faz redirect para /. O Teaser verifica se existe sessão ativa (cookie JWT) e, se sim, pré-preenche o campo de e-mail. Nenhuma tela nova necessária.

## 2.4 O Resultado ("Previsão do Tempo")

Lógica visual estritamente baseada em contagem numérica, não em avaliação subjetiva. Dois ícones apenas.

| **Ícone** | **Critério**                                | **Label**                                        |
| --------- | ------------------------------------------- | ------------------------------------------------ |
| ☀️ Sol    | 0 ocorrências em todas as categorias        | "Céu limpo. Nenhuma ocorrência encontrada."      |
| ---       | ---                                         | ---                                              |
| 🌧️ Chuva  | 1 ou mais ocorrências em qualquer categoria | "Clima instável. \[N\] ocorrências encontradas." |
| ---       | ---                                         | ---                                              |

**Disclaimer obrigatório (próximo ao ícone):** _"Ícones representam volume de registros públicos, não avaliação de risco de crédito. A interpretação é exclusivamente sua."_

### 2.4.1 Layout do Relatório por Clima

O layout do relatório muda conforme o resultado. Nunca exibir cards vazios individuais.

- **☀️ Cenário Sol - CNPJ (o que o usuário vê):** (1) Checklist com recorte temporal: "✅ Situação financeira: Nome limpo há X anos - 0 protestos, 0 dívidas ativas, 0 cheques devolvidos" / "✅ Processos judiciais: Nenhum encontrado nos tribunais consultados" / "✅ Menções na web: Nenhuma ocorrência negativa" (ou "3 menções encontradas, todas neutras ou positivas"). (2) Bloco de Cadastro Empresarial com dados reais: razão social, situação cadastral, data de abertura formatada como "Empresa ativa há X anos", CNAE principal e secundários, quadro societário, capital social. (3) Menções positivas na web (se houver): resumo em texto + links para as fontes. (4) Reclame Aqui positivo (se aplicável): nota da empresa, índice de resolução, selo RA1000. (5) Resumo IA: texto de 2-3 frases. Exemplo: "Empresa ativa há 8 anos, sem ocorrências financeiras ou judiciais. 2 menções positivas encontradas na web." (6) Selo de verificação: data da consulta, lista genérica de fontes ("Fontes consultadas: cartórios de protesto, tribunais de justiça, Receita Federal, Reclame Aqui, notícias e registros públicos"), validade de 7 dias. (7) Texto de fechamento: "Pelo que encontramos, o céu está limpo. Boa parceria!" Sem links "Consultar Receita Federal" / "Consultar Serasa" (não existem na spec, remover do Figma).
- **☀️ Cenário Sol - CPF (o que o usuário vê):** (1) Checklist com recorte temporal: mesma lógica do CNPJ, sem bloco de cadastro empresarial. (2) Indicador de atividade comercial (se disponível): "X empresas consultaram este CPF recentemente". (3) Menções positivas na web (se houver). (4) Resumo IA elaborado. (5) Selo de verificação. (6) Texto de fechamento.
- **Instrução técnica (para o dev):** O recorte temporal ("há X anos") é calculado a partir dos campos retornados pela APIFull. A quantidade de consultas recentes vem da APIFull. Os dados cadastrais vêm da BrasilAPI. Se a APIFull não retornar tempo de nome limpo, o checklist mostra apenas "Nome limpo - 0 protestos, 0 dívidas ativas" sem o recorte temporal.
- **🌧️ Cenário Chuva (tem ocorrências):** Checklist resumido no topo (o que está ok) + cards expandidos APENAS para categorias com dados. Texto de fechamento: "Encontramos alguns pontos de atenção. Avalie com cuidado."
- **Regra absoluta:** Nunca mostrar card vazio individual. Cards expandidos de ocorrências negativas são exclusivos do Chuva. Dados positivos e cadastrais sempre aparecem (em qualquer cenário).

## 2.5 Cards do Relatório

Os cards variam conforme o tipo de input (CPF vs CNPJ). Cada card tem um empty state e links externos para as fontes originais.

| **Card**             | **CNPJ**                      | **CPF**                          | **Fonte**            |
| -------------------- | ----------------------------- | -------------------------------- | -------------------- |
| Cadastro Empresarial | ✅ Situação, sócios, abertura | ❌ Não aplicável                 | BrasilAPI (grátis)   |
| ---                  | ---                           | ---                              | ---                  |
| Situação Financeira  | ✅ Protestos, dívidas         | ✅ Nome sujo, protestos, dívidas | APIFull (paga)       |
| ---                  | ---                           | ---                              | ---                  |
| Processos Judiciais  | ✅ Lista detalhada            | ✅ Lista detalhada               | Escavador + Datajud  |
| ---                  | ---                           | ---                              | ---                  |
| Notícias e Web       | ✅ Resumo IA                  | ✅ Resumo IA                     | Google Custom Search |
| ---                  | ---                           | ---                              | ---                  |
| Reclame Aqui         | ✅ Resumo IA via Google       | Busca sempre, oculta se vazio    | Google Custom Search |
| ---                  | ---                           | ---                              | ---                  |
| Resumo Geral (IA)    | ✅                            | ✅                               | GPT-4o-mini          |
| ---                  | ---                           | ---                              | ---                  |

### 2.5.1 Card: Cadastro Empresarial (CNPJ)

**Fonte:** Fonte (instrução técnica): BrasilAPI (gratuita). Fallback: APIFull se BrasilAPI falhar.

- **Regra de exibição:** Este card é SEMPRE exibido para CNPJ, em qualquer cenário (Sol ou Chuva). No Sol, aparece como bloco informativo abaixo do checklist, com tom positivo ("Empresa ativa há X anos"). No Chuva, aparece como card normal (com borda vermelha se situação irregular).
- Dados exibidos (o que o usuário vê): razão social, situação cadastral ("Ativa"), data de abertura formatada como "Ativa desde 2018" ou "Empresa ativa há 8 anos", CNAE principal e secundários, quadro societário completo, capital social.
- **Alerta visual:** Se situação = Baixada ou Suspensa, card com borda vermelha.
- **Empty state:** "Dados cadastrais não encontrados para este CNPJ."
- **Link externo:** Consulta na Receita Federal.

### 2.5.2 Card: Situação Financeira

**Fonte:** APIFull (paga).

- Dados exibidos: Nome sujo (Sim/Não), quantidade de protestos, valor total de protestos, quantidade de dívidas ativas.
- **IMPORTANTE:** O Score de crédito NÃO é exibido. A APIFull retorna Score, mas ele é descartado.
- **Empty state:** Substituído por apresentação com recorte temporal. O que o usuário vê no cenário Sol: "Nome limpo há X anos. Nenhum protesto em cartório nos últimos 5 anos. 0 dívidas ativas. 0 cheques devolvidos." Se disponível: "X empresas consultaram este CPF/CNPJ recentemente." Instrução técnica: o "há X anos" e a quantidade de consultas recentes são campos retornados pela APIFull. Se o campo de tempo não estiver disponível, omitir o recorte e mostrar apenas "Nome limpo - 0 protestos, 0 dívidas ativas, 0 cheques devolvidos."
- **Link externo:** Consulta no Serasa/SPC (genérico).

### 2.5.3 Card: Processos Judiciais

**Fontes:** Escavador (paga, detalhamento) + Datajud/CNJ (gratuita, complemento).

- Dados: Tribunal, Data, Classe (ex: Execução de Título Extrajudicial), Polo (Autor/Réu).
- **Separação visual:** Trabalhista (Empresa Ré) separado de Cível e outros.
- **Empty state:** "Nenhum processo judicial encontrado. ☀️"
- **Link externo:** Link para o processo no tribunal de origem (quando disponível).

### 2.5.4 Card: Notícias e Web

**Fonte:** Google Custom Search API.

- **Busca dupla:** (1) Geral: "{Nome}" OR "{Razão Social}". (2) Focada: "{Nome}" + "golpe" OR "fraude" OR "processo".
- **Nome vem da APIFull:** O nome é descoberto pela APIFull durante o processamento (pós-pagamento). É esse nome que alimenta as buscas no Google.
- **Filtragem IA:** GPT-4o-mini filtra homônimos por geolocalização (ex: "Ignorar notícias de SP se o CPF é do RS").
- **Classificação de menções (instrução técnica):** Adicionar ao prompt do GPT-4o-mini instrução para classificar cada menção como positiva/neutra/negativa. O front decide o que mostrar com base nessa classificação.
- **Cenário Sol (o que o usuário vê):** Bloco resumido: "Encontramos 3 menções na web, todas neutras ou positivas" com links para cada fonte. Menções sobre premiações, eventos ou matérias de destaque são listadas.
- **Cenário Chuva (o que o usuário vê):** Card expandido com classificação - menções negativas em destaque, neutras/positivas separadas visualmente.
- **Empty state:** "Nenhuma menção relevante encontrada na web."
- **Links externos:** Link para cada notícia/resultado encontrado.

### 2.5.5 Card: Reclame Aqui

**Fonte:** Google Custom Search com site:reclameaqui.com.br.

- **Lógica:** Busca sempre (CPF e CNPJ). Se Google retornar resultados, IA resume. Se não retornar nada, card não é exibido (em vez de mostrar vazio). Se a empresa tiver nota alta, índice de resolução elevado ou selo RA1000, esses são dados positivos concretos que devem ser exibidos inclusive no cenário Sol (no bloco de menções positivas ou no resumo IA). Instrução técnica: o Google Custom Search retorna a página do Reclame Aqui, e o GPT-4o-mini extrai nota/índice do snippet.
- **Resumo IA:** Ex: "12 reclamações no Reclame Aqui, 8 respondidas. Principais queixas: atraso na entrega."
- **Link externo:** Sempre presente: "Ver no Reclame Aqui →".

### 2.5.6 Card: Resumo Geral (IA)

**Fonte:** GPT-4o-mini.

- **Função:** Lê todos os dados e gera resumo factual de 2-3 frases. Ex: "Atenção: 47 processos encontrados e menções de golpe no site X."
- **Prompt base:** "Você é um assistente neutro. Liste fatos. Não use adjetivos. Não faça recomendações. Apenas resuma os dados encontrados. Quando não houver ocorrências negativas, destaque dados positivos factuais: tempo de nome limpo, tempo de empresa ativa, menções positivas, nota Reclame Aqui. Dados positivos são fatos, não elogios."
- **Exemplo de output Sol CNPJ (o que o usuário vê):** "Empresa ativa há 8 anos, sem ocorrências financeiras ou judiciais. 2 menções positivas encontradas na web. Sem reclamações no Reclame Aqui."
- **Exemplo de output Sol CPF (o que o usuário vê):** "Nenhuma ocorrência financeira, judicial ou de menções negativas na web encontrada para este CPF nos registros públicos consultados em 05/02/2026. Nome limpo há pelo menos 5 anos."
- **Filtragem de homônimos:** Prompt inclui região do CPF/CNPJ: "O CPF é do RS. Ignore notícias de outros estados."

# 3\. ARQUITETURA TÉCNICA

## 3.1 Stack

| **Camada**          | **Tecnologia**                          | **Tier**              |
| ------------------- | --------------------------------------- | --------------------- |
| Frontend            | Next.js 14 (App Router)                 | Free (Vercel)         |
| ---                 | ---                                     | ---                   |
| Backend             | Next.js Server Actions + API Routes     | Free (Vercel)         |
| ---                 | ---                                     | ---                   |
| Banco de Dados      | PostgreSQL (Neon Serverless)            | Free Tier             |
| ---                 | ---                                     | ---                   |
| Fila/Jobs           | Inngest (Serverless queues)             | Free Tier             |
| ---                 | ---                                     | ---                   |
| Pagamento           | Asaas (Checkout hospedado, Pix nativo)  | Pay-per-use           |
| ---                 | ---                                     | ---                   |
| IA                  | GPT-4o-mini (OpenAI)                    | ~R\$ 0,03/consulta    |
| ---                 | ---                                     | ---                   |
| E-mail Transacional | Resend (SPF/DKIM configurado)           | Free Tier (3.000/mês) |
| ---                 | ---                                     | ---                   |
| CAPTCHA             | Cloudflare Turnstile                    | Free                  |
| ---                 | ---                                     | ---                   |
| Monitoramento       | Sentry                                  | Free Tier             |
| ---                 | ---                                     | ---                   |
| Analytics           | Plausible (cookieless, sem banner LGPD) | Free Tier             |
| ---                 | ---                                     | ---                   |
| Hospedagem          | Vercel                                  | Free Tier             |
| ---                 | ---                                     | ---                   |

**Custo fixo mensal:** Apenas domínio (~R\$ 40/ano). Todo o resto opera em free tier ou pay-per-use.

## 3.2 Integrações (APIs)

| **API**              | **Tipo**        | **Dados**                                                                                        |
| -------------------- | --------------- | ------------------------------------------------------------------------------------------------ |
| APIFull              | Paga (pré-paga) | Nome (descoberta), Protestos, Dívidas, Processos, Dados Cadastrais, Score (interno, não exibido) |
| ---                  | ---             | ---                                                                                              |
| Escavador            | Paga (pré-paga) | Detalhamento de processos, cruzamento de dados                                                   |
| ---                  | ---             | ---                                                                                              |
| BrasilAPI            | Gratuita        | Dados de CNPJ (situação, sócios, etc.)                                                           |
| ---                  | ---             | ---                                                                                              |
| Datajud (CNJ)        | Gratuita        | Processos judiciais (complemento)                                                                |
| ---                  | ---             | ---                                                                                              |
| Google Custom Search | Paga            | Notícias, Reclame Aqui, web geral. CPF: 2 queries. CNPJ: 3 queries.                              |
| ---                  | ---             | ---                                                                                              |
| GPT-4o-mini          | Paga            | Resumo factual + filtragem de homônimos (~R\$ 0,03/consulta)                                     |
| ---                  | ---             | ---                                                                                              |
| Asaas                | Taxa            | Checkout hospedado + Pix + Webhook + API de estorno + NFS-e                                      |
| ---                  | ---             | ---                                                                                              |
| Resend               | Free tier       | E-mail transacional: magic link + notificação de conclusão                                       |
| ---                  | ---             | ---                                                                                              |

**Google Custom Search:** Limite gratuito de 100 queries/dia. Com ~50 consultas/dia (CPF: 2q + CNPJ: 3q, média ~2.5q) = ~125 queries/dia, estoura no dia 1. Custo adicional: \$5/1000 queries. Incluir no custo operacional.

**Asaas Sandbox:** Variável de ambiente ASAAS_ENV alterna entre sandbox (<https://sandbox.asaas.com/api/v3>) e produção (<https://api.asaas.com/v3>). Sprint 1-3: sandbox. Sprint 4 (go live): produção. Incluir no checklist de deploy.

**NFS-e:** Asaas emite NFS-e automaticamente se configurado no painel. Código de serviço a definir com contador. Emissão automática por pagamento confirmado. Configuração durante Sprint 4. Sem código no nosso lado.

## 3.3 Health Check

Trava financeira que impede cobrar quando não é possível entregar o relatório.

- **Frequência:** Backend pinga APIFull e Escavador a cada 60 segundos.
- **Se UP:** Botão de compra habilitado.
- **Se DOWN:** Botão desabilitado. Mensagem: "Estamos em manutenção. Tente novamente mais tarde." + campo de e-mail para notificação.

## 3.4 Lógica de Falha Pós-Pagamento

O Health Check é a primeira linha de defesa (pré-pagamento). Mas se uma API falha DURANTE o processamento, a lógica é:

| **Situação**                                | **Ação**                                                                                                                       |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| API retornou HTTP 5xx ou connection refused | Retry 1x. Se falhar de novo → job falha → reembolso automático via Asaas (POST /api/v3/payments/{id}/refund).                  |
| ---                                         | ---                                                                                                                            |
| API respondendo mas lenta (muitos dados)    | Deixa rodar. Não há pressão de loading - processamento é assíncrono.                                                           |
| ---                                         | ---                                                                                                                            |
| Timeout total de 120s sem resposta          | Falha técnica real → reembolso automático.                                                                                     |
| ---                                         | ---                                                                                                                            |
| Google Custom Search falha                  | Não crítico. Card de notícias fica vazio. Relatório é entregue sem esse card.                                                  |
| ---                                         | ---                                                                                                                            |
| GPT-4o-mini falha                           | Não crítico. Relatório é entregue sem resumo IA.                                                                               |
| ---                                         | ---                                                                                                                            |
| CPF sem dados na APIFull                    | Resultado válido com aviso 'Dados limitados para este CPF'. Checklist mostra verificações feitas. Não reembolsa.               |
| ---                                         | ---                                                                                                                            |
| Reembolso falha (Asaas instável)            | Retry 3x com backoff exponencial. Se falhar nas 3 tentativas, alerta admin via Sentry. Purchase fica com status REFUND_FAILED. |
| ---                                         | ---                                                                                                                            |

**Reembolso só acontece por falha técnica real** (5xx, connection refused, timeout total), nunca por lentidão ou volume de dados. O modelo assíncrono elimina a pressão de tempo - o processamento pode levar 2-3 minutos sem problema.

## 3.5 Processamento Assíncrono (Job Inngest)

O job é disparado pelo webhook do Asaas após confirmação do Pix. O fluxo difere entre CPF e CNPJ.

### 3.5.1 Fluxo CPF (sequencial → paralelo)

- **APIFull (série):** Primeira chamada obrigatória. Descobre o nome vinculado ao CPF + dados financeiros. O nome é necessário para as buscas seguintes.
- **Paralelo (após ter o nome):** Escavador (processos) + Datajud/CNJ (processos) + Google Custom Search (2 queries usando o nome descoberto).
- **GPT-4o-mini (série, após receber tudo):** Gera resumo factual + filtra homônimos por geolocalização.
- **Salvar + Notificar:** Salva SearchResult. Atualiza Purchase.status para COMPLETED. Envia e-mail via Resend.

### 3.5.2 Fluxo CNPJ (BrasilAPI primeiro, depois paralelo)

- **BrasilAPI (série, rápida e grátis):** Descobre razão social. Se falhar, fallback para APIFull (que também retorna o nome).
- **Paralelo (após ter o nome):** APIFull (financeiro) + Escavador (processos) + Datajud/CNJ (processos) + Google Custom Search (3 queries: geral + focada + Reclame Aqui).
- **GPT-4o-mini (série, após receber tudo):** Gera resumo factual.
- **Salvar + Notificar:** Mesmo fluxo do CPF.

**Diferença do CPF:** BrasilAPI é gratuita e rápida, então o nome vem quase instantâneo. Se cair, APIFull cobre. Tempo total similar ao CPF.

## 3.6 Webhook Asaas

- **Endpoint:** /api/webhooks/asaas
- **Evento:** PAYMENT_RECEIVED (Pix confirmado).
- **Ação:** Atualiza Purchase.status para PAID. Extrai dados do comprador (buyerName, buyerCpfCnpj) do payload do Asaas e grava no Purchase. Dispara job no Inngest (try/catch com retry imediato se falhar). Atualiza status para PROCESSING.
- **Idempotência:** Antes de disparar job, verifica se Purchase já está em PROCESSING ou COMPLETED. Se sim, ignora (Asaas pode enviar webhook duplicado por retry).
- **Segurança:** Validação do token/assinatura do Asaas. Rejeita requests sem header válido. Log de todos os webhooks.

## 3.7 Cache

- **Regra:** Consultas ao mesmo CPF/CNPJ dentro de 24h usam dados cacheados (SearchResult existente).
- **Múltiplos usuários:** Se Usuário B compra o mesmo CPF/CNPJ que Usuário A consultou há 2h, B recebe um novo registro na área 'Minhas Consultas' dele apontando para o mesmo SearchResult. Cada usuário tem seu próprio acesso. Dados por trás são os mesmos.
- **Cobrança:** Usuário B paga R\$ 29,90 normalmente (custo de API = zero).
- **Após 24h:** Cache expirado. Nova consulta refaz todas as chamadas de API.

## 3.8 Autenticação (Magic Link)

Autenticação leve por e-mail, sem senha. O e-mail informado no pagamento é a identidade do usuário.

- **Login:** Usuário acessa /minhas-consultas, digita e-mail, recebe código de 6 dígitos por e-mail (Resend). Insere o código. Sessão criada.
- **Aviso de spam:** Tela de login exibe: 'Não recebeu o código? Verifique o spam.'
- **Sessão:** Cookie httpOnly com JWT. Expira em 30 dias.
- **Sem cadastro:** O 'cadastro' acontece automaticamente na primeira compra. O e-mail vira a conta do usuário.

# 4\. MODELO DE DADOS (POSTGRESQL - PRISMA)

## 4.1 User

model User {

id String @id @default(cuid())

email String @unique

purchases Purchase\[\]

createdAt DateTime @default(now())

}

**Nota:** Dados do comprador (nome, CPF) ficam no Purchase (via webhook Asaas). O User é apenas a identidade de login por e-mail. Se o e-mail já existe no Asaas, ele auto-preenche nome e CPF no checkout.

## 4.2 SearchResult

model SearchResult {

id String @id @default(cuid())

term String // CPF ou CNPJ limpo

type String // "CPF" | "CNPJ"

name String? // Nome descoberto pela APIFull

data Json // Resposta bruta das APIs

summary String? // Resumo do GPT-4o-mini

expiresAt DateTime // createdAt + 7 dias

createdAt DateTime @default(now())

purchases Purchase\[\]

@@index(\[term, type, createdAt\]) // Cache lookup

}

## 4.3 Purchase

model Purchase {

id String @id @default(cuid())

userId String

user User @relation(fields: \[userId\], references: \[id\])

term String // CPF ou CNPJ consultado

amount Int // Valor em centavos (2990)

status String // PENDING | PAID | PROCESSING | COMPLETED | FAILED | REFUNDED | REFUND_FAILED

asaasPaymentId String? // ID do pagamento no Asaas

buyerName String? // Nome do comprador (via webhook Asaas)

buyerCpfCnpj String? // CPF/CNPJ do comprador (via webhook Asaas)

termsAcceptedAt DateTime? // Timestamp aceite dos Termos

searchResultId String? // FK para SearchResult

searchResult SearchResult? @relation(fields: \[searchResultId\], references: \[id\])

createdAt DateTime @default(now())

updatedAt DateTime @updatedAt

}

**Nota:** term = CPF/CNPJ sendo consultado. buyerCpfCnpj = CPF/CNPJ de quem pagou (podem ser iguais ou diferentes). buyerName e buyerCpfCnpj chegam via webhook do Asaas, não via nosso formulário.

## 4.4 Blocklist

model Blocklist {

id String @id @default(cuid())

term String // CPF ou CNPJ bloqueado

associatedName String? // Nome associado (bloqueia buscas Google tambem)

reason String // "SOLICITACAO_TITULAR" | "JUDICIAL" | "HOMONIMO"

createdAt DateTime @default(now())

@@unique(\[term\])

}

## 4.5 LeadCapture

model LeadCapture {

id String @id @default(cuid())

email String

term String? // CPF/CNPJ que tentou consultar

reason String // "API_DOWN" | "MAINTENANCE"

createdAt DateTime @default(now())

}

## 4.6 MagicCode (Autenticação)

model MagicCode {

id String @id @default(cuid())

email String

code String // 6 digitos

expiresAt DateTime // createdAt + 10 minutos

used Boolean @default(false)

createdAt DateTime @default(now())

}

## 4.7 Jobs Automatizados (Inngest Cron)

**Limpeza (retenção LGPD):**

- **SearchResult:** Purgar registros onde expiresAt < NOW(). Job diário.
- **LeadCapture:** Manter por 90 dias, depois purgar.
- **Purchase PENDING:** Cancelar Purchases com status PENDING há mais de 30 minutos (Pix expirado). Job a cada 15 minutos.
- **Purchase (dados pessoais):** Manter indefinidamente (obrigação fiscal). Anonimizar e-mail após 2 anos.
- **MagicCode:** Purgar códigos expirados diariamente.

**Obs:** Inngest tem retry nativo. Se o dispatch falhar no webhook, o handler faz try/catch com retry imediato. Não é necessário job de reconciliação separado para MVP.

# 5\. SEGURANÇA

## 5.1 Proteção Contra Bots

- **CAPTCHA:** Cloudflare Turnstile (gratuito) obrigatório no input de CPF/CNPJ.
- **Rate Limiting (middleware):** Máx 10 validações de CPF/CNPJ por IP por hora. Máx 3 compras por IP por hora. Máx 3 magic codes por e-mail por hora. Máx 20 envios de magic link por IP por hora. Via middleware Vercel Edge ou Postgres.
- **Proteção CSRF:** Next.js Server Actions validam nativamente. Documentado como mecanismo de proteção.

## 5.2 Webhook Seguro

- Validar token/assinatura do Asaas em cada request.
- Rejeitar requests sem header de autenticação válido.
- Log de todos os webhooks (válidos e inválidos).

## 5.3 Monitoramento

- **Sentry (free tier):** Error tracking para erros de API, falhas de webhook, timeouts.
- **Alertas:** E-mail automático quando taxa de erro ultrapassa 10% em 1 hora.
- **Logs:** Vercel Logs (nativo).

# 6\. COMPLIANCE E JURÍDICO

## 6.1 Escala Objetiva (Anti-Scoring)

- Ícones (Sol/Chuva) definidos por contagem numérica: 0 = Sol, 1+ = Chuva.
- **Disclaimer obrigatório:** "Ícones representam volume de registros públicos, não avaliação de risco de crédito. A interpretação é exclusivamente sua."
- Nenhum texto pode sugerir 'bom', 'ruim', 'confiável' ou 'arriscado'.

## 6.2 LGPD e Direitos do Titular

Como o E o Pix processa dados de terceiros (APIFull, Escavador, Google), atua como Controlador de Dados.

- **Formulário (Tally no MVP):** Pessoa pode solicitar exclusão de seus dados e informar erro de homônimo.
- **Ação:** Admin adiciona CPF/CNPJ + nome associado à Blocklist. Próximas consultas são bloqueadas ANTES do pagamento.
- **Botão 'Relatar erro':** Presente em cada card do relatório. Abre formulário pré-preenchido.

## 6.3 Retenção de Dados

| **Dado**                    | **Retenção**        | **Ação após expirar**                                   |
| --------------------------- | ------------------- | ------------------------------------------------------- |
| SearchResult (dados brutos) | 7 dias              | Purgar registro completo                                |
| ---                         | ---                 | ---                                                     |
| Purchase (dados de compra)  | Indefinido (fiscal) | Anonimizar e-mail, buyerName e buyerCpfCnpj após 2 anos |
| ---                         | ---                 | ---                                                     |
| LeadCapture                 | 90 dias             | Purgar registro                                         |
| ---                         | ---                 | ---                                                     |
| Blocklist                   | Indefinido          | Manter (proteção do titular)                            |
| ---                         | ---                 | ---                                                     |
| MagicCode                   | 10 minutos          | Purgar diariamente                                      |
| ---                         | ---                 | ---                                                     |

## 6.4 Base Legal

- **Base:** Legítimo Interesse (Art. 7º, IX da LGPD).
- **LIA:** Legitimate Interest Assessment deve ser elaborado antes do lançamento.
- **Opt-out:** Página /privacidade/titular como canal.
- **Menores:** LGPD Art. 14. Risco documentado para pós-MVP.

## 6.5 Termos e Páginas Jurídicas

Três páginas obrigatórias:

| **Página**              | **Rota**             | **Conteúdo-chave**                                                                                                                                                                                 |
| ----------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Termos de Uso           | /termos              | Natureza: "Ferramenta de agregação de dados públicos, não bureau de crédito." Isenção de veracidade. Aviso de homônimos. Reembolso apenas por falha técnica. Erro de digitação não gera reembolso. |
| ---                     | ---                  | ---                                                                                                                                                                                                |
| Política de Privacidade | /privacidade         | Como coletamos e tratamos dados. Base legal (Legítimo Interesse). Compartilhamento com terceiros (APIs). Retenção de dados. Sem cookies de tracking (Plausible cookieless).                        |
| ---                     | ---                  | ---                                                                                                                                                                                                |
| Direitos do Titular     | /privacidade/titular | Formulário (Tally) para solicitar exclusão, corrigir dados, informar homônimo.                                                                                                                     |
| ---                     | ---                  | ---                                                                                                                                                                                                |

# 7\. MAPA DE TELAS

Descrição funcional de cada tela do produto, na ordem do fluxo do usuário.

| **Tela**            | **Rota**                            | **Descrição funcional**                                                                                                                                                                                                              |
| ------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Home (Input)        | /                                   | Headline + campo CPF/CNPJ com máscara + CAPTCHA Turnstile + botão Consultar. Erros inline. Blocklist e Health Check verificados antes de prosseguir.                                                                                 |
| ---                 | ---                                 | ---                                                                                                                                                                                                                                  |
| Teaser              | /consulta/{term}                    | CPF/CNPJ parcialmente mascarado no topo. Cards borrados (blur) com placeholder. Formulário: e-mail + checkbox termos + botão 'Desbloquear R\$ 29,90'. Botão desabilitado se Health Check falhar.                                     |
| ---                 | ---                                 | ---                                                                                                                                                                                                                                  |
| Asaas Checkout      | Externa (Asaas)                     | Página do Asaas. E-mail pré-preenchido. Usuário completa nome + CPF comprador. QR Code Pix + botão copia-e-cola (mobile). Timer expiração. Logo e cores personalizáveis.                                                             |
| ---                 | ---                                 | ---                                                                                                                                                                                                                                  |
| Confirmação         | /compra/confirmacao?id={purchaseId} | Ícone check verde + 'Pagamento confirmado!'. E-mail em destaque + 'Está correto?' + 'Corrigir e-mail'. Código compra. Avisos: tempo, spam. Botão 'Ir para Minhas Consultas'.                                                         |
| ---                 | ---                                 | ---                                                                                                                                                                                                                                  |
| Login               | /minhas-consultas                   | Campo de e-mail + botão 'Enviar código'. Após envio: 6 caixinhas para código + botão Entrar. Aviso spam.                                                                                                                             |
| ---                 | ---                                 | ---                                                                                                                                                                                                                                  |
| Minhas Consultas    | /minhas-consultas                   | Lista de consultas com status (⏳ Processando, ✅ Concluído, ❌ Falhou, ⚠️ Reembolso falhou, 📅 Expirado). Botão "Ver Relatório" quando concluído. Botão "Nova Consulta" redireciona para Home com e-mail pré-preenchido via sessão. |
| ---                 | ---                                 | ---                                                                                                                                                                                                                                  |
| Relatório           | /relatorio/{id}                     | Layout adaptativo: Sol (card checklist consolidado) ou Chuva (checklist + cards expandidos). Disclaimer. Textos de fechamento. Botão 'Relatar erro' em cada card. Links externos.                                                    |
| ---                 | ---                                 | ---                                                                                                                                                                                                                                  |
| Termos              | /termos                             | Termos de Uso completos.                                                                                                                                                                                                             |
| ---                 | ---                                 | ---                                                                                                                                                                                                                                  |
| Privacidade         | /privacidade                        | Política de Privacidade completa.                                                                                                                                                                                                    |
| ---                 | ---                                 | ---                                                                                                                                                                                                                                  |
| Direitos do Titular | /privacidade/titular                | Formulário Tally embeddado.                                                                                                                                                                                                          |
| ---                 | ---                                 | ---                                                                                                                                                                                                                                  |

## 7.1 Páginas de Erro

Tom de voz do produto (irônico mas útil). Todas com botão de ação.

| **Erro**           | **Mensagem**                                                                         | **Ação**                        |
| ------------------ | ------------------------------------------------------------------------------------ | ------------------------------- |
| 404                | 'Eita, essa página não existe. Mas a gente pode consultar quem te mandou pra cá. 😏' | Botão: Voltar para o início     |
| ---                | ---                                                                                  | ---                             |
| 500                | 'Algo deu errado do nosso lado. Já estamos cuidando.'                                | Botão: Tentar novamente         |
| ---                | ---                                                                                  | ---                             |
| Relatório expirado | 'Este relatório expirou. Os dados são removidos após 7 dias por segurança.'          | Botão: Fazer nova consulta      |
| ---                | ---                                                                                  | ---                             |
| Link inválido      | 'Esse link não leva a lugar nenhum. Tente acessar pelo Minhas Consultas.'            | Botão: Ir para Minhas Consultas |
| ---                | ---                                                                                  | ---                             |

# 8\. ANALYTICS E CONVERSÃO

Implementar com Plausible (cookieless, free tier, sem banner de cookie consent LGPD) desde o dia 1.

| **Evento**              | **Descrição**                    |
| ----------------------- | -------------------------------- |
| input_submitted         | Digitou CPF/CNPJ e submeteu      |
| ---                     | ---                              |
| teaser_viewed           | Visualizou a tela de teaser      |
| ---                     | ---                              |
| checkout_started        | Clicou em pagar                  |
| ---                     | ---                              |
| payment_completed       | Webhook confirmou pagamento      |
| ---                     | ---                              |
| processing_started      | Job Inngest iniciou              |
| ---                     | ---                              |
| processing_completed    | Job Inngest concluiu com sucesso |
| ---                     | ---                              |
| processing_failed       | Job Inngest falhou               |
| ---                     | ---                              |
| email_notification_sent | E-mail de conclusão enviado      |
| ---                     | ---                              |
| report_viewed           | Usuário visualizou relatório     |
| ---                     | ---                              |
| login_magic_link        | Usuário fez login via magic code |
| ---                     | ---                              |
| lead_captured           | E-mail capturado (API down)      |
| ---                     | ---                              |

# 9\. ESTIMATIVA DE CUSTOS

## 9.1 Custo Fixo Mensal

| **Item**                            | **Custo**                   |
| ----------------------------------- | --------------------------- |
| Domínio                             | ~R\$ 40/ano (~R\$ 3,33/mês) |
| ---                                 | ---                         |
| Vercel Free Tier                    | R\$ 0                       |
| ---                                 | ---                         |
| Neon Free Tier                      | R\$ 0                       |
| ---                                 | ---                         |
| Inngest Free Tier                   | R\$ 0                       |
| ---                                 | ---                         |
| Resend Free Tier (3.000 emails/mês) | R\$ 0                       |
| ---                                 | ---                         |
| Cloudflare Turnstile                | R\$ 0                       |
| ---                                 | ---                         |
| Sentry Free Tier                    | R\$ 0                       |
| ---                                 | ---                         |
| Plausible Free Tier (cookieless)    | R\$ 0                       |
| ---                                 | ---                         |
| TOTAL FIXO                          | ~R\$ 3,33/mês               |
| ---                                 | ---                         |

## 9.2 Custo Variável por Consulta

| **Item**                                    | **Custo estimado**      |
| ------------------------------------------- | ----------------------- |
| APIFull                                     | Conforme plano pré-pago |
| ---                                         | ---                     |
| Escavador                                   | Conforme plano pré-pago |
| ---                                         | ---                     |
| Google Custom Search (2-3 queries)          | ~R\$ 0,05-0,08          |
| ---                                         | ---                     |
| GPT-4o-mini                                 | ~R\$ 0,03               |
| ---                                         | ---                     |
| Asaas (taxa Pix)                            | ~R\$ 0,99 + 1,99%       |
| ---                                         | ---                     |
| Resend (2 emails: magic link + notificação) | R\$ 0 (free tier)       |
| ---                                         | ---                     |
| TOTAL VARIÁVEL (estimado)                   | ~R\$ 2-4 por consulta   |
| ---                                         | ---                     |

**Margem bruta estimada:** R\$ 29,90 - ~R\$ 4,00 = ~R\$ 25,90 por consulta (~87%).

# 10\. ROADMAP DE IMPLEMENTAÇÃO (MVP)

## Sprint 1: Core + Proteção

- Setup Next.js 14 + Neon (Postgres) + Prisma.
- Modelo de dados completo (User, SearchResult, Purchase com buyer/termsAcceptedAt, Blocklist, LeadCapture, MagicCode).
- Input CPF/CNPJ com máscara + validação de dígitos.
- Cloudflare Turnstile (CAPTCHA) no input.
- Rate limiting (middleware: validações, compras, magic link).
- Check da Blocklist no fluxo.
- Tela de Teaser (blur + placeholder + CPF/CNPJ em destaque).
- Formulário: campo e-mail + checkbox termos (links /termos e /privacidade).
- Asaas Sandbox (ASAAS_ENV=sandbox). Testar fluxo de pagamento sem dinheiro real.

## Sprint 2: Pagamento + Processamento Assíncrono

- Asaas: Checkout hospedado. Criar cobrança via API (customerData.email pré-preenchido) + redirect URL com purchaseId.
- Purchase criado como PENDING antes do redirect (grava asaasPaymentId).
- Tela pós-pagamento (/compra/confirmacao?id={purchaseId}): e-mail destaque + corrigir e-mail + código compra + avisos.
- Webhook /api/webhooks/asaas: validação assinatura + idempotência + extração buyerName/buyerCpfCnpj do payload.
- Inngest: Job de processamento (fluxo CPF sequencial + fluxo CNPJ: BrasilAPI primeiro, fallback APIFull, depois paralelo).
- Integração APIFull (nome + financeiro).
- Integração Escavador (processos detalhados).
- Integração Datajud/CNJ (processos gratuitos).
- Integração BrasilAPI (CNPJ - razão social gratuita + fallback para APIFull).
- Integração Google Custom Search (busca dupla + Reclame Aqui).
- Integração GPT-4o-mini (resumo + filtragem homônimos).
- Health Check (ping 60s + bloqueio de botão + captura lead).
- Lógica de falha: retry 1x em 5xx + reembolso automático + retry reembolso 3x + REFUND_FAILED.
- Cache 24h (lookup antes de chamar APIs).
- Job limpeza: cancelar Purchases PENDING há mais de 30 minutos.

## Sprint 3: Autenticação + Relatório

- Resend: setup de e-mail transacional + configuração de domínio (SPF/DKIM).
- Magic link: envio de código 6 dígitos + validação + sessão JWT + aviso de spam.
- Área /minhas-consultas (lista de compras com status: Processando / Concluído / Falhou / Expirado).
- E-mail de notificação quando consulta finaliza.
- Layout do relatório Sol: checklist com recorte temporal, bloco de cadastro empresarial com dados reais (CNPJ), menções positivas (se houver), Reclame Aqui positivo (se aplicável), resumo IA com destaques positivos, selo de verificação. Layout Chuva: checklist resumido + cards expandidos para categorias com ocorrências.
- Fluxo Nova Consulta: botão em Minhas Consultas redireciona para Home com e-mail pré-preenchido via sessão.
- Ícones de clima (Sol/Chuva) com disclaimer + textos de fechamento diferenciados.
- Links externos em cada card para fontes originais.
- Criação automática de User na primeira compra.
- Páginas de erro: 404, 500, relatório expirado, link inválido (tom de voz do produto).
- Mobile first: todas as telas responsivas (teaser, /minhas-consultas, relatório).

## Sprint 4: Compliance + Launch

- Página /termos (Termos de Uso).
- Página /privacidade (Política de Privacidade - sem banner cookie, Plausible é cookieless).
- Página /privacidade/titular (Tally embed).
- Botão 'Relatar erro' em cada card.
- Páginas de erro: 404, 500, relatório expirado, link inválido (tom de voz irônico).
- Jobs de limpeza: purgar SearchResult expirados, LeadCapture > 90 dias, MagicCode expirados.
- Sentry (error tracking + alertas).
- Plausible (analytics + funil).
- NFS-e: configurar emissão automática no Asaas (código de serviço definido com contador).
- Asaas: trocar ASAAS_ENV de sandbox para produção. Checklist de deploy.
- Testes de carga básicos.
- Painel Admin (spec separada): dashboard, health check, compras, blocklist, leads.
- Go live.

# 11\. RISCOS DOCUMENTADOS (PÓS-MVP)

Riscos identificados para tratar em versões futuras.

| **Risco**                    | **Descrição**                                     | **Mitigação Futura**                                  |
| ---------------------------- | ------------------------------------------------- | ----------------------------------------------------- |
| Consulta de menores          | LGPD Art. 14 exige consentimento específico       | Bloquear CPFs com data nascimento < 18 anos           |
| ---                          | ---                                               | ---                                                   |
| LIA não elaborado            | Legitimate Interest Assessment obrigatório        | Elaborar com assessoria jurídica pré-lançamento       |
| ---                          | ---                                               | ---                                                   |
| Google Custom Search limits  | 100 queries/dia grátis                            | Cache mais agressivo ou migrar para Bing Search API   |
| ---                          | ---                                               | ---                                                   |
| Uso indevido (stalking)      | CPF permite consultar qualquer PF                 | Limite de consultas por usuário + termos explícitos   |
| ---                          | ---                                               | ---                                                   |
| Resend free tier (3.000/mês) | ~1.500 consultas/mês no free tier (2 emails cada) | Migrar para plano pago se ultrapassar                 |
| ---                          | ---                                               | ---                                                   |
| Múltiplos e-mails            | Mesma pessoa com 2 e-mails = 2 contas separadas   | Limitação documentada nos Termos. Unificação pós-MVP  |
| ---                          | ---                                               | ---                                                   |
| Asaas Checkout hospedado     | Menos controle visual no pagamento                | Migrar para checkout transparente na v2 se necessário |
| ---                          | ---                                               | ---                                                   |

_Fim do Documento - E O PIX? Especificação Técnica v3.1_
