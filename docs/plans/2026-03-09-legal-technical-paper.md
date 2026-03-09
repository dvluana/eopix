# Paper Tecnico-Juridico EOPIX - Plano de Escrita

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Produzir um documento tecnico-explicativo (paper) descrevendo o funcionamento real da plataforma EOPIX para analise juridica, baseado 100% no codigo-fonte.

**Architecture:** O paper sera um documento Markdown com 12 capitulos cobrindo: visao geral, arquitetura, fluxo de dados, coleta, processamento, armazenamento, integracoes externas, autenticacao, logs, automacoes, tipos de dados e pontos de atencao juridica. Linguagem acessivel a nao-tecnicos, mas preciso tecnicamente.

**Tech Stack:** Markdown (output em `docs/paper-tecnico-juridico-eopix.md`)

---

## Contexto da Pesquisa (ja concluida)

A pesquisa completa do codebase foi realizada por 7 agentes em paralelo, cobrindo:
- **Schema Prisma:** 13 modelos, 50+ campos, inventario completo de PII
- **31 rotas API:** Cada uma com metodos HTTP, dados recebidos/retornados, servicos externos
- **6 integracoes externas:** AbacatePay, APIFull, Serper, OpenAI, Inngest, Sentry/Brevo/Plausible
- **Sistema de auth:** bcrypt, JWT HMAC-SHA256, cookies httpOnly, rate limiting
- **Pipeline Inngest:** 8 steps memoizados, 5 cron jobs, politicas de retencao
- **Frontend:** Todas as paginas de coleta (RegisterModal, consulta, LGPD)
- **Logging:** ~80 console.log, Sentry, WebhookLog, ApiRequestLog

Todas as descobertas estao documentadas nos resultados dos agentes de pesquisa nesta sessao.

---

## Dados-Chave Extraidos do Codigo

### Modelos do Banco (13 tabelas)
User, Purchase, SearchResult, Blocklist, LeadCapture, MagicCode, RateLimit, WebhookLog, LgpdRequest, ApiRequestLog, AdminUser

### Dados Pessoais Coletados
- **Do usuario:** email, nome, celular, CPF/CNPJ, senha (hash bcrypt)
- **De terceiros (via APIFull):** nome completo, nome da mae, data nascimento, enderecos, telefones, emails, empresas vinculadas, processos judiciais, protestos, dividas, cheques sem fundo
- **Da web (via Serper):** mencoes publicas, noticias, reclamacoes
- **Da IA (via OpenAI):** classificacao de risco, resumo executivo

### Politicas de Retencao
| Dado | Retencao | Mecanismo |
|------|----------|-----------|
| SearchResult (relatorio) | 7 dias | Cron diario 03:00 UTC |
| LeadCapture | 90 dias | Cron diario 03:15 UTC |
| MagicCode | 10 min TTL | Cron diario 03:30 UTC |
| Purchase PENDING | 30 min | Cron cada 15 min |
| Purchase PII (buyerName/CPF) | 2 anos -> ANONIMIZADO | Cron mensal dia 1 |
| ApiRequestLog | Indefinido | Sem cleanup |
| User | Indefinido | Sem cleanup automatico |

### Servicos Externos com Dados Pessoais
1. **AbacatePay:** nome, email, celular, CPF/CNPJ (checkout)
2. **APIFull:** CPF/CNPJ -> recebe dados cadastrais completos de terceiros
3. **Serper:** nome + CPF/CNPJ -> busca Google
4. **OpenAI:** CPF/CNPJ + processos + mencoes -> analise IA
5. **Inngest:** purchaseId, email, CPF/CNPJ (orquestracao)
6. **Sentry:** email em contexto de erro (1 rota)
7. **Brevo:** email do destinatario (magic code)
8. **Plausible:** nenhum dado pessoal (cookieless)

---

## Tasks

### Task 1: Criar arquivo e escrever Capitulo 1 - Visao Geral da Plataforma

**Files:**
- Create: `docs/paper-tecnico-juridico-eopix.md`

**Step 1: Escrever capitulo**

Conteudo do capitulo:
- O que e a EOPIX: SaaS brasileiro de relatorio de risco para CPF/CNPJ
- Proposta de valor: compra unica R$29,90, relatorio consolidado
- Publico-alvo: empresas e individuos que precisam avaliar risco fiscal/legal
- Resumo do fluxo: usuario insere CPF/CNPJ -> paga -> sistema consulta fontes -> gera relatorio com IA
- Dados do relatorio: cadastrais, financeiros, judiciais, mencoes web, analise de risco
- Disponibilidade: relatorio acessivel por 7 dias apos geracao

Linguagem: explicativa, sem jargoes tecnicos, como se falasse para um advogado.

**Step 2: Commit**
```bash
git add docs/paper-tecnico-juridico-eopix.md
git commit -m "docs: cap 1 - visao geral da plataforma (paper juridico)"
```

---

### Task 2: Escrever Capitulo 2 - Arquitetura Tecnica em Linguagem Simples

**Files:**
- Modify: `docs/paper-tecnico-juridico-eopix.md`

**Step 1: Escrever capitulo**

Explicar sem jargoes:
- **Aplicacao web (Next.js):** "A plataforma e um site acessivel pelo navegador, construido com tecnologia Next.js..."
- **Banco de dados (Neon/PostgreSQL):** "Os dados sao armazenados em um banco de dados PostgreSQL hospedado na Neon..."
- **Processamento assincrono (Inngest):** "Apos o pagamento, o processamento do relatorio e feito em segundo plano por um sistema de filas..."
- **Pagamento (AbacatePay):** "Os pagamentos sao processados via AbacatePay, gateway brasileiro com suporte a PIX..."
- **Hospedagem (Vercel):** "A plataforma e hospedada na Vercel, provedor de cloud..."
- **Consultas de dados (APIFull):** "Os dados cadastrais e financeiros sao obtidos da APIFull..."
- **Busca web (Serper):** "Mencoes publicas na internet sao buscadas via Serper..."
- **Inteligencia artificial (OpenAI):** "A analise de risco e resumo sao gerados por IA da OpenAI..."

Incluir diagrama simplificado em texto:
```
Usuario -> Site EOPIX -> Pagamento (AbacatePay)
                      -> Consulta dados (APIFull)
                      -> Busca web (Serper)
                      -> Analise IA (OpenAI)
                      -> Relatorio gerado
                      -> Armazenado no banco (Neon)
                      -> Exibido ao usuario (7 dias)
```

**Step 2: Commit**
```bash
git add docs/paper-tecnico-juridico-eopix.md
git commit -m "docs: cap 2 - arquitetura tecnica simplificada (paper juridico)"
```

---

### Task 3: Escrever Capitulo 3 - Fluxo Completo de Funcionamento

**Files:**
- Modify: `docs/paper-tecnico-juridico-eopix.md`

**Step 1: Escrever capitulo**

Descrever passo a passo o fluxo real (extraido do codigo):

1. **Acesso ao site:** Usuario acessa a pagina inicial e insere um CPF ou CNPJ
2. **Validacao:** Sistema valida o formato e verifica se o documento esta bloqueado
3. **Cadastro/Login:** Se nao logado, usuario preenche formulario (nome, email, celular, CPF/CNPJ do comprador, senha)
4. **Pagamento:** Redirecionado para checkout AbacatePay (PIX). Dados do comprador enviados: nome, email, celular, CPF/CNPJ
5. **Confirmacao:** AbacatePay notifica o sistema via webhook quando pagamento confirmado
6. **Processamento:** Sistema inicia pipeline automatico:
   - Consulta dados cadastrais na APIFull (nome, enderecos, telefones, empresas vinculadas)
   - Consulta dados financeiros na APIFull (protestos, dividas, cheques sem fundo)
   - Consulta processos judiciais na APIFull (acoes, tribunais, valores)
   - Busca mencoes na web via Serper (noticias, reclamacoes, informacoes publicas)
   - Envia dados para OpenAI gerar analise de risco e resumo
7. **Relatorio:** Dados consolidados salvos no banco, usuario notificado
8. **Visualizacao:** Usuario acessa relatorio por 7 dias via link autenticado
9. **Expiracao:** Apos 7 dias, relatorio e deletado automaticamente

**Step 2: Commit**
```bash
git add docs/paper-tecnico-juridico-eopix.md
git commit -m "docs: cap 3 - fluxo completo de funcionamento (paper juridico)"
```

---

### Task 4: Escrever Capitulo 4 - Como os Dados dos Usuarios Entram no Sistema

**Files:**
- Modify: `docs/paper-tecnico-juridico-eopix.md`

**Step 1: Escrever capitulo**

Mapear todas as fontes de entrada de dados:

**4.1 Formulario de Cadastro (RegisterModal)**
- Campos: nome completo, email, celular, CPF/CNPJ do comprador, senha, confirmacao de senha
- Quando: ao iniciar uma compra sem estar logado
- Armazenamento: tabela User (email, nome, celular, CPF/CNPJ, hash da senha)

**4.2 Formulario de Login**
- Campos: email, senha
- Quando: usuario ja cadastrado acessa a plataforma

**4.3 Campo de Consulta (CPF/CNPJ pesquisado)**
- Campo: numero de CPF ou CNPJ a ser pesquisado
- Quando: na pagina inicial ou pagina de consulta
- Nota: este e o documento de TERCEIRO, nao do usuario

**4.4 Webhook de Pagamento (AbacatePay)**
- Dados recebidos: ID da transacao, valor pago, metodo, dados do cliente (email, nome)
- Quando: apos confirmacao de pagamento pelo gateway

**4.5 Formulario LGPD (Direitos do Titular)**
- Campos: nome, CPF/CNPJ, email, tipo de solicitacao, descricao
- Quando: usuario exerce direitos previstos na LGPD

**4.6 Formulario de Lead (Captura de Interesse)**
- Campo: email
- Quando: servico indisponivel (manutencao)

**4.7 Login Administrativo**
- Campos: email, senha
- Quando: administrador acessa painel de gestao

**Step 2: Commit**
```bash
git add docs/paper-tecnico-juridico-eopix.md
git commit -m "docs: cap 4 - entrada de dados dos usuarios (paper juridico)"
```

---

### Task 5: Escrever Capitulo 5 - Como os Dados sao Processados

**Files:**
- Modify: `docs/paper-tecnico-juridico-eopix.md`

**Step 1: Escrever capitulo**

Explicar o pipeline de processamento:

**5.1 Etapa 1: Verificacao de Cache**
- Antes de consultar APIs externas, o sistema verifica se ja existe relatorio valido para o mesmo documento
- Se encontrado (gerado ha menos de 24 horas): reutiliza sem nova consulta
- Se nao encontrado: inicia processamento completo

**5.2 Etapa 2: Consulta de Dados Cadastrais (APIFull)**
- Para CPF: envia numero do CPF -> recebe nome completo, nome da mae, data de nascimento, sexo, situacao cadastral, enderecos, telefones, emails, empresas vinculadas
- Para CNPJ: envia numero do CNPJ -> recebe razao social, situacao, data de abertura, natureza juridica, capital social, enderecos, socios (nomes, cargos, documentos), CNAEs

**5.3 Etapa 3: Consulta Financeira (APIFull)**
- Para CPF e CNPJ: envia documento -> recebe protestos (data, valor, cartorio, cidade), dividas financeiras (tipo, valor, origem, data), cheques sem fundo

**5.4 Etapa 4: Consulta de Processos Judiciais (APIFull - apenas CPF)**
- Envia CPF -> recebe lista de processos: numero, tribunal, data de distribuicao, classe, ramo do direito, status, partes envolvidas, valor da causa

**5.5 Etapa 5: Busca na Web (Serper/Google)**
- 4 buscas automaticas:
  1. Busca pelo documento formatado (ex: "123.456.789-00")
  2. Busca pelo nome + termos de risco ("escandalo", "investigacao", "fraude", etc.)
  3. Busca no site Reclame Aqui (reclamacoes de consumidores)
  4. Busca aberta pelo nome (noticias gerais)
- Retorna: titulos, links e trechos de ate 40 resultados da web

**5.6 Etapa 6: Analise por Inteligencia Artificial (OpenAI)**
- Duas chamadas a IA (modelo gpt-4o-mini):
  1. Analise dos processos judiciais: classifica cada processo por relevancia, categoria (fraude, trabalhista, tributario, criminal, etc.) e papel da pessoa
  2. Classificacao das mencoes web + geracao de resumo de risco: classifica cada URL (positiva/neutra/negativa), identifica tipo de fonte (noticia/juridico/reclamacao/governo), gera resumo executivo de 2-3 frases
- Dados enviados a OpenAI: CPF/CNPJ, processos judiciais, mencoes web, resumo financeiro
- Dados NAO enviados: enderecos completos, telefones, emails (apenas metricas agregadas)

**5.7 Etapa 7: Consolidacao e Armazenamento**
- Todos os dados consolidados em um unico registro JSON (50-100 KB por relatorio)
- Salvo no banco de dados com prazo de expiracao de 7 dias
- Status da compra atualizado para "Concluido"

**Step 2: Commit**
```bash
git add docs/paper-tecnico-juridico-eopix.md
git commit -m "docs: cap 5 - processamento de dados (paper juridico)"
```

---

### Task 6: Escrever Capitulo 6 - Onde os Dados sao Armazenados

**Files:**
- Modify: `docs/paper-tecnico-juridico-eopix.md`

**Step 1: Escrever capitulo**

**6.1 Banco de Dados Principal (PostgreSQL via Neon)**
- Hospedagem: Neon (cloud, infraestrutura AWS)
- Conexao: criptografada via SSL/TLS
- Localizacao: datacenter AWS (regiao a confirmar)

**6.2 Tabelas e o que armazenam:**

| Tabela | Dados Armazenados | Dados Sensiveis | Retencao |
|--------|-------------------|-----------------|----------|
| User | Email, nome, celular, CPF/CNPJ, hash de senha | Sim | Indefinida |
| Purchase | Codigo da compra, CPF/CNPJ pesquisado, valor, status, nome do comprador, CPF/CNPJ do comprador | Sim | Indefinida (PII anonimizado apos 2 anos) |
| SearchResult | CPF/CNPJ, nome, dados completos do relatorio (JSON), resumo IA | Sim (dados de terceiros) | 7 dias |
| Blocklist | CPF/CNPJ bloqueado, nome associado, motivo | Sim | Indefinida |
| LeadCapture | Email, nome, telefone, CPF/CNPJ | Sim | 90 dias |
| MagicCode | Email, codigo temporario | Sim | 10 minutos |
| WebhookLog | ID do evento, tipo, ID do pagamento | Nao | Indefinida |
| LgpdRequest | Nome, CPF/CNPJ, email, tipo de solicitacao, descricao | Sim | Indefinida (obrigatorio por lei) |
| ApiRequestLog | CPF/CNPJ, corpo da requisicao, resposta completa da API | Sim (dados de terceiros) | Indefinida |
| AdminUser | Email, hash de senha, nome | Sim | Indefinida |
| RateLimit | Endereco IP, acao, contador | Nao | Expira automaticamente |

**6.3 Dados Mais Sensiveis**
- **SearchResult.data (JSON):** Contem o relatorio completo — dados cadastrais, financeiros, judiciais e mencoes web de terceiros. Deletado automaticamente apos 7 dias.
- **ApiRequestLog.responseRaw (JSON):** Contem respostas brutas das APIs externas, incluindo todos os dados pessoais retornados. SEM prazo de delecao automatica.
- **User.passwordHash:** Senha armazenada como hash bcrypt (nao e possivel recuperar a senha original)

**6.4 Criptografia**
- Em transito: todas as conexoes usam HTTPS/TLS
- Em repouso: criptografia gerenciada pela Neon (AWS RDS encryption)
- Senhas: hash bcrypt com 10 rounds de salt

**Step 2: Commit**
```bash
git add docs/paper-tecnico-juridico-eopix.md
git commit -m "docs: cap 6 - armazenamento de dados (paper juridico)"
```

---

### Task 7: Escrever Capitulo 7 - Integracoes Externas

**Files:**
- Modify: `docs/paper-tecnico-juridico-eopix.md`

**Step 1: Escrever capitulo**

**7.1 AbacatePay (Gateway de Pagamento)**
- Funcao: processar pagamentos via PIX
- Dados enviados: nome do comprador, email, celular, CPF/CNPJ do comprador, valor (R$29,90), descricao do produto
- Dados recebidos: confirmacao de pagamento, ID da transacao
- Sede: Brasil
- Webhook: AbacatePay notifica o sistema quando pagamento e confirmado (evento billing.paid)

**7.2 APIFull (Provedor de Dados Cadastrais)**
- Funcao: fornecer dados cadastrais, financeiros e judiciais de CPFs e CNPJs
- Dados enviados: numero do CPF ou CNPJ (apenas digitos)
- Dados recebidos:
  - CPF: nome completo, nome da mae, data de nascimento, enderecos, telefones, emails, empresas vinculadas, processos judiciais, protestos, dividas
  - CNPJ: razao social, situacao cadastral, socios, capital social, enderecos, processos, protestos, dividas
- Sede: Brasil (api.apifull.com.br)
- Autenticacao: chave de API (Bearer token)

**7.3 Serper (Busca na Web via Google)**
- Funcao: realizar buscas no Google para encontrar mencoes publicas
- Dados enviados: CPF/CNPJ formatado, nome da pessoa/empresa, termos de busca combinados
- Dados recebidos: resultados de busca (titulo, URL, trecho) — ate 40 resultados
- Sede: Estados Unidos (google.serper.dev)
- Configuracao: buscas configuradas para Brasil (gl=br, hl=pt-br)

**7.4 OpenAI (Inteligencia Artificial)**
- Funcao: analisar processos judiciais e mencoes web, gerar classificacao de risco e resumo executivo
- Dados enviados: CPF/CNPJ, processos judiciais (limitados a 30 mais recentes), mencoes web (ate 40 URLs com trechos), resumo financeiro (totais de protestos/dividas)
- Dados NAO enviados: enderecos completos, telefones, emails individuais
- Dados recebidos: classificacao de processos, classificacao de mencoes (positiva/neutra/negativa), tipo de fonte, resumo de risco
- Sede: Estados Unidos (api.openai.com)
- Modelo: gpt-4o-mini

**7.5 Inngest (Orquestrador de Tarefas)**
- Funcao: executar o pipeline de processamento de forma assincrona e com retry automatico
- Dados que transitam: ID da compra, email do usuario, CPF/CNPJ, tipo de documento
- Nao armazena dados permanentemente (apenas logs temporarios conforme plano contratado)
- Sede: Estados Unidos

**7.6 Neon (Banco de Dados)**
- Funcao: hospedar o banco de dados PostgreSQL
- Dados armazenados: todos os dados da plataforma (conforme capitulo 6)
- Infraestrutura: AWS (Amazon Web Services)
- Criptografia: em repouso e em transito (SSL/TLS)

**7.7 Sentry (Monitoramento de Erros) — Parcialmente Ativo**
- Funcao: capturar e rastrear erros do sistema
- Dados enviados: mensagens de erro, stack traces (detalhes tecnicos do erro)
- Dados pessoais: email pode aparecer em 1 rota especifica (rota de compra, em caso de erro)
- Nota no codigo: DSN atualmente vazio — pode nao estar ativo em producao
- Sede: Estados Unidos

**7.8 Brevo (Servico de Email)**
- Funcao: enviar emails transacionais (codigo de acesso)
- Dados enviados: email do destinatario, conteudo do email (codigo de 6 digitos)
- Tipos de email: codigo de acesso (magic code)
- Sede: Franca (api.brevo.com)

**7.9 Plausible Analytics (Analitica de Uso)**
- Funcao: medir visitas e interacoes no site
- Dados enviados: NENHUM dado pessoal (analitica sem cookies)
- Nao identifica usuarios individuais
- Conforme LGPD (cookieless)
- Sede: Uniao Europeia

**7.10 Vercel (Hospedagem)**
- Funcao: hospedar e servir a aplicacao web
- Dados que transitam: todo o trafego web
- Logs: logs de acesso (IPs, user agents) conforme politica da Vercel
- Sede: Estados Unidos

**Step 2: Commit**
```bash
git add docs/paper-tecnico-juridico-eopix.md
git commit -m "docs: cap 7 - integracoes externas (paper juridico)"
```

---

### Task 8: Escrever Capitulo 8 - Autenticacao e Controle de Acesso

**Files:**
- Modify: `docs/paper-tecnico-juridico-eopix.md`

**Step 1: Escrever capitulo**

**8.1 Tipos de Usuario**
- **Usuario comum:** pode criar conta, comprar relatorios e visualizar seus relatorios
- **Administrador:** pode gerenciar compras, bloquear documentos, visualizar todos os relatorios, reprocessar falhas

**8.2 Cadastro de Usuario**
- Dados coletados: email, senha (minimo 8 caracteres), nome (opcional), celular (opcional), CPF/CNPJ (opcional)
- Senha armazenada: hash bcrypt com 10 rounds (impossivel reverter para texto original)
- Email normalizado para minusculas
- Se o email ja existe como "convidado" (de compra anterior), a conta e atualizada

**8.3 Login**
- Metodo: email + senha
- Verificacao: comparacao segura via bcrypt (tempo constante, previne ataques de timing)
- Mensagem generica em caso de erro ("Email ou senha incorretos") — previne enumeracao de emails

**8.4 Sessao**
- Mecanismo: cookie HTTP chamado "eopix_session"
- Formato: token assinado com HMAC-SHA256 (similar a JWT)
- Conteudo do token: email do usuario, data de criacao, data de expiracao
- Seguranca do cookie:
  - httpOnly: sim (JavaScript no navegador nao consegue acessar)
  - secure: sim em producao (apenas HTTPS)
  - sameSite: strict (previne ataques CSRF cross-origin)
- Duracao: 30 dias para usuarios comuns, 8 horas para administradores
- Verificacao: assinatura verificada com tempo constante (crypto.subtle.verify)

**8.5 Login Automatico (pos-compra)**
- Apos pagamento confirmado, usuario e logado automaticamente usando o codigo da compra
- Nao e necessario inserir senha novamente

**8.6 Administracao**
- Login separado com rate limit: maximo 5 tentativas a cada 15 minutos por IP
- Sessao mais curta (8 horas vs 30 dias)
- Identificacao de admin: via tabela AdminUser no banco OU lista de emails em variavel de ambiente

**8.7 Protecao contra Abuso**
- Rate limit em todas as rotas criticas (compra, login, validacao)
- Limites configurados por IP e por acao
- Rate limit armazenado no banco de dados (nao em memoria)
- Middleware adicional com limites por rota na camada Edge

**Step 2: Commit**
```bash
git add docs/paper-tecnico-juridico-eopix.md
git commit -m "docs: cap 8 - autenticacao e controle de acesso (paper juridico)"
```

---

### Task 9: Escrever Capitulo 9 - Logs e Rastreamento

**Files:**
- Modify: `docs/paper-tecnico-juridico-eopix.md`

**Step 1: Escrever capitulo**

**9.1 Logs da Aplicacao (Console)**
- Aproximadamente 80 pontos de log no codigo
- Logs aparecem nos servidores da Vercel (hostagem) e no painel de desenvolvimento
- **Dados pessoais presentes em logs:**
  - Email do usuario: logado em rotas de webhook e compra
  - Nome do comprador: logado ao processar webhooks
  - CPF/CNPJ: logado em modo de desenvolvimento (prefixo "[MOCK]" ou "BYPASS")
  - Nome cadastral: logado ao processar resultados da APIFull (em modo bypass)
- **Nota importante:** 5 logs de debug que vazavam dados pessoais completos (CPF, nome, endereco, processos) foram removidos em marco/2026

**9.2 Registro de Webhooks (WebhookLog)**
- Armazena: ID do evento, tipo do evento, ID do pagamento, data
- NAO armazena: dados pessoais do cliente
- Finalidade: prevenir processamento duplicado (idempotencia)
- Retencao: indefinida (trilha de auditoria)

**9.3 Registro de Chamadas a APIs (ApiRequestLog)**
- Armazena: CPF/CNPJ consultado, endpoint chamado, corpo da requisicao, resposta completa da API, tempo de resposta, codigo de status
- **CONTEM DADOS SENSIVEIS:** as respostas brutas das APIs externas incluem todos os dados cadastrais, financeiros e judiciais retornados
- Retencao: indefinida (sem limpeza automatica)
- **Observacao relevante:** Esta tabela pode conter mais dados pessoais que o proprio relatorio, por tempo indefinido

**9.4 Sentry (Monitoramento de Erros)**
- Configurado mas possivelmente inativo (DSN vazio)
- Se ativo: captura erros com stack trace e contexto tecnico
- Sessoes de replay configuradas com mascara de texto (maskAllText: true) e bloqueio de midia
- Em 1 rota especifica (compra), email do usuario e incluido no contexto do erro enviado ao Sentry
- Dados pessoais: minimos por design (apenas email em caso de erro de checkout)

**9.5 Plausible Analytics**
- Rastreia: visitas, paginas acessadas, eventos (ex: "checkout_started", "report_accessed")
- NAO rastreia: dados pessoais, cookies, sessoes individuais
- Compativel com LGPD (analitica sem cookies)

**9.6 Onde ficam os logs**
- Logs de console: nos servidores da Vercel (retencao conforme plano Vercel)
- WebhookLog: no banco de dados Neon (indefinido)
- ApiRequestLog: no banco de dados Neon (indefinido)
- Sentry: nos servidores do Sentry (EUA, conforme plano contratado)
- Plausible: nos servidores do Plausible (UE, agregado, sem PII)

**Step 2: Commit**
```bash
git add docs/paper-tecnico-juridico-eopix.md
git commit -m "docs: cap 9 - logs e rastreamento (paper juridico)"
```

---

### Task 10: Escrever Capitulo 10 - Automacao e Processamento Interno

**Files:**
- Modify: `docs/paper-tecnico-juridico-eopix.md`

**Step 1: Escrever capitulo**

**10.1 Pipeline de Processamento (Inngest)**
- Acionado automaticamente apos confirmacao de pagamento
- 8 etapas executadas em sequencia automatica
- Tempo medio: alguns minutos (depende da disponibilidade das APIs)
- Retentativas: ate 10 vezes em caso de falha (com espera progressiva entre tentativas)
- Processamento paralelo: maximo 5 relatorios simultaneos
- Memoizacao: se uma etapa ja foi executada com sucesso, nao e reexecutada em caso de retry

**10.2 Tarefas Automaticas Periodicas (Cron Jobs)**

| Tarefa | Frequencia | O que faz |
|--------|-----------|-----------|
| Limpeza de relatorios expirados | Diariamente as 03:00 UTC | Deleta relatorios com mais de 7 dias |
| Limpeza de leads | Diariamente as 03:15 UTC | Deleta capturas de lead com mais de 90 dias |
| Limpeza de codigos temporarios | Diariamente as 03:30 UTC | Deleta codigos de acesso expirados ou ja usados |
| Limpeza de compras pendentes | A cada 15 minutos | Marca como "falha" compras sem pagamento ha mais de 30 minutos |
| Anonimizacao de dados pessoais | Mensalmente (dia 1) | Substitui nome e CPF/CNPJ do comprador por "ANONIMIZADO" em compras com mais de 2 anos |

**10.3 Anonimizacao (LGPD Art. 16)**
- Compras concluidas ou reembolsadas ha mais de 2 anos: campos buyerName e buyerCpfCnpj substituidos por "ANONIMIZADO"
- O CPF/CNPJ pesquisado (campo term) NAO e anonimizado
- Registro da compra permanece no banco, mas sem dados identificaveis do comprador

**10.4 Tratamento de Falhas**
- Se o pipeline falha: compra marcada como "Falha" com detalhes do erro
- Usuario NAO ve o status de falha — interface mostra "Processando" (admin ve o status real)
- Administrador pode reprocessar individualmente ou em lote
- Inngest retenta automaticamente ate 10 vezes antes de desistir

**Step 2: Commit**
```bash
git add docs/paper-tecnico-juridico-eopix.md
git commit -m "docs: cap 10 - automacao e processamento interno (paper juridico)"
```

---

### Task 11: Escrever Capitulo 11 - Tipos de Dados Tratados

**Files:**
- Modify: `docs/paper-tecnico-juridico-eopix.md`

**Step 1: Escrever capitulo**

**11.1 Dados do Usuario (titular da conta)**
- Email (obrigatorio)
- Nome completo (opcional)
- Celular (opcional)
- CPF/CNPJ do usuario (opcional)
- Senha (armazenada como hash)
- Data de criacao da conta

**11.2 Dados do Comprador (titular do pagamento)**
- Nome
- Email
- Celular
- CPF/CNPJ
- Data de aceitacao dos termos
- Historico de compras

**11.3 Dados de Terceiros (objeto do relatorio)**
Estes sao dados sobre a pessoa/empresa PESQUISADA, nao sobre o usuario:

Para CPF (pessoa fisica):
- Nome completo e nome da mae
- Data de nascimento e sexo
- Situacao cadastral na Receita Federal
- Enderecos completos (rua, numero, bairro, cidade, estado, CEP)
- Telefones (DDD, numero, tipo)
- Emails
- Empresas vinculadas (CNPJ, cargo, participacao percentual)
- Processos judiciais (numero, tribunal, data, classe, ramo, status, partes, valor)
- Protestos (data, valor, cartorio, cidade)
- Dividas financeiras (tipo, valor, origem, data)
- Cheques sem fundo
- Mencoes na web (noticias, reclamacoes, informacoes publicas)

Para CNPJ (pessoa juridica):
- Razao social e nome fantasia
- CNPJ e situacao cadastral
- Data de abertura e natureza juridica
- Capital social
- Enderecos
- Socios (nomes, cargos, documentos, datas de entrada)
- Codigos CNAE (atividades)
- Processos judiciais ativos e arquivados
- Protestos e dividas
- Mencoes na web

**11.4 Dados Financeiros**
- Resumo de protestos (quantidade e valor total)
- Resumo de dividas (quantidade e valor total)
- Cheques sem fundo
- Score interno (calculado mas NAO exibido ao usuario)

**11.5 Dados de Analise (gerados por IA)**
- Classificacao de processos (relevancia, categoria, papel da pessoa)
- Classificacao de mencoes web (positiva/neutra/negativa, tipo de fonte)
- Resumo executivo de risco (texto de 2-3 frases)
- Resumo de reclamacoes do Reclame Aqui (se aplicavel)

**11.6 Dados Operacionais**
- Logs de webhook (IDs de transacao)
- Logs de API (requisicoes e respostas completas)
- Rate limit (IPs e contadores)
- Solicitacoes LGPD (protocolo, tipo, descricao)

**Step 2: Commit**
```bash
git add docs/paper-tecnico-juridico-eopix.md
git commit -m "docs: cap 11 - tipos de dados tratados (paper juridico)"
```

---

### Task 12: Escrever Capitulo 12 - Pontos que Podem Exigir Atencao Juridica

**Files:**
- Modify: `docs/paper-tecnico-juridico-eopix.md`

**Step 1: Escrever capitulo**

**NOTA: Este capitulo nao constitui opiniao juridica. Trata-se de observacoes tecnicas que podem ser relevantes para analise por profissional habilitado.**

**12.1 Coleta e Tratamento de Dados Pessoais de Terceiros**
- A plataforma consulta e processa dados pessoais extensivos (cadastrais, financeiros, judiciais) de pessoas/empresas que NAO sao usuarios da plataforma e NAO consentiram diretamente com o tratamento
- Dados obtidos via APIFull incluem: nome completo, nome da mae, enderecos, telefones, emails, situacao financeira, processos judiciais
- Estes dados sao consolidados em relatorio vendido a terceiro mediante pagamento

**12.2 Compartilhamento de Dados com Servicos no Exterior**
- CPF/CNPJ e dados associados sao enviados a servicos sediados nos Estados Unidos:
  - **OpenAI:** recebe processos judiciais, mencoes web e resumo financeiro para analise por IA
  - **Serper:** recebe CPF/CNPJ formatado e nome para buscas no Google
  - **Inngest:** recebe CPF/CNPJ e email para orquestracao de tarefas
  - **Vercel:** todo o trafego web transita por seus servidores
- Transferencia internacional de dados pessoais pode exigir base legal especifica sob a LGPD

**12.3 Retencao de Dados sem Prazo Definido**
- Tabela ApiRequestLog: armazena respostas completas das APIs externas (incluindo todos os dados pessoais de terceiros) sem prazo de delecao automatica
- Tabela User: contas de usuario permanecem indefinidamente
- Tabela Purchase: campo "term" (CPF/CNPJ pesquisado) nao e anonimizado mesmo apos 2 anos
- Tabela Blocklist: CPF/CNPJ bloqueados permanecem indefinidamente
- Tabela WebhookLog: logs de pagamento permanecem indefinidamente

**12.4 Dados Pessoais em Logs de Sistema**
- Emails de usuarios aparecem em logs de webhook e de erro
- Nomes de titulares aparecem em logs de processamento
- CPF/CNPJ aparecem em varios logs da aplicacao
- Logs ficam armazenados nos servidores da Vercel (EUA) e potencialmente no Sentry (EUA)
- Respostas completas de APIs (com todos os dados pessoais) armazenadas permanentemente na tabela ApiRequestLog

**12.5 Processamento Automatizado com Impacto Potencial**
- Relatorios sao gerados automaticamente por IA sem intervencao humana
- A classificacao de risco pode afetar decisoes de negocios sobre a pessoa/empresa pesquisada
- O resumo executivo e uma opiniao gerada por modelo de linguagem (gpt-4o-mini), nao por analista humano
- Nao ha mecanismo de contestacao pelo titular dos dados do relatorio

**12.6 Busca na Web e Agregacao de Informacoes**
- A plataforma realiza buscas automaticas no Google por mencoes ao nome/documento da pessoa
- Resultados incluem noticias, reclamacoes, processos publicos e outras informacoes
- A agregacao sistematica de informacoes publicas em relatorio consolidado e vendavel pode ter implicacoes juridicas distintas do acesso individual a cada fonte

**12.7 Dados do Reclame Aqui e Sites de Reclamacao**
- Reclamacoes de consumidores sao incluidas no relatorio
- O contexto original da reclamacao pode ser perdido ao ser incluido em relatorio de risco

**12.8 LGPD — Observacoes Especificas**
- Existe formulario para exercicio de direitos do titular (Art. 18 LGPD)
- Existe anonimizacao automatica apos 2 anos (Art. 16 LGPD)
- Existe exclusao automatica de relatorios apos 7 dias
- **Ponto de atencao:** A base legal para tratamento de dados de terceiros (pessoa pesquisada) nao esta explicitamente definida no codigo (pode estar na politica de privacidade/termos de uso)
- **Ponto de atencao:** O ApiRequestLog nao tem politica de retencao, potencialmente retendo dados de terceiros por tempo indeterminado
- **Ponto de atencao:** Nao existe mecanismo no codigo para que o TITULAR DOS DADOS do relatorio (a pessoa pesquisada) solicite exclusao — o formulario LGPD e para usuarios da plataforma

**12.9 Webhook e Dados de Pagamento**
- Dados do comprador (nome, email, celular, CPF/CNPJ) sao compartilhados com AbacatePay para processamento do pagamento
- AbacatePay armazena esses dados em seus proprios sistemas conforme sua politica de privacidade

**12.10 Score de Credito Interno**
- O sistema calcula um score interno (_scoreInterno) baseado nos dados financeiros
- Este score NAO e exibido ao usuario final (marcado como interno no codigo)
- Seu uso potencial futuro pode ter implicacoes regulatorias

**12.11 Inconsistencias entre Documentacao e Codigo**
- A documentacao menciona "Cloudflare Turnstile" (anti-bot) mas o codigo mostra chaves vazias — nao esta ativo
- A documentacao menciona envio de emails de conclusao de relatorio, mas no codigo esta desabilitado
- Sentry esta configurado no codigo mas o DSN esta vazio — pode nao estar capturando erros
- A documentacao referencia integracao com Resend (email) mas o codigo usa Brevo

**Step 2: Commit**
```bash
git add docs/paper-tecnico-juridico-eopix.md
git commit -m "docs: cap 12 - pontos de atencao juridica (paper juridico)"
```

---

### Task 13: Revisao Final e Formatacao

**Files:**
- Modify: `docs/paper-tecnico-juridico-eopix.md`

**Step 1: Revisar documento completo**
- Verificar consistencia entre capitulos
- Garantir que linguagem esta acessivel a nao-tecnicos
- Adicionar header com metadados (data, versao, baseado em codigo de qual commit)
- Adicionar indice/sumario
- Verificar que nenhuma afirmacao e feita sem base no codigo
- Adicionar footer com disclaimers (nao e opiniao juridica, baseado no codigo-fonte)

**Step 2: Commit final**
```bash
git add docs/paper-tecnico-juridico-eopix.md
git commit -m "docs: paper tecnico-juridico completo - revisao final"
```

---

## Notas Importantes para Execucao

1. **Base no codigo:** Cada afirmacao deve ser rastreavel ao codigo-fonte. Nao presumir comportamentos.
2. **Linguagem:** Evitar jargoes tecnicos. Quando necessario, explicar entre parenteses.
3. **Neutralidade:** Capitulo 12 destaca pontos de atencao, mas NAO emite opiniao juridica.
4. **Inconsistencias:** Quando documentacao e codigo divergem, sinalizar explicitamente.
5. **Arquivo final:** `docs/paper-tecnico-juridico-eopix.md` (unico arquivo, ~15-20 paginas)
