# Paper Tecnico: Funcionamento da Plataforma EOPIX

**Documento tecnico-explicativo para analise juridica**

| Campo | Valor |
|-------|-------|
| Data de elaboracao | 09 de marco de 2026 |
| Base de analise | Codigo-fonte do repositorio EOPIX (commit `4c7e3a9`) |
| Metodo | Analise automatizada do codigo-fonte por 7 agentes especializados |
| Escopo | Arquitetura, fluxo de dados, integracoes, armazenamento, logs, automacoes |
| Branch analisada | `main` (producao) |

> **Aviso:** Este documento descreve o funcionamento tecnico da plataforma com base exclusiva no codigo-fonte. Nao constitui opiniao juridica. Pontos destacados no capitulo 12 sao observacoes tecnicas para apreciacao por profissional habilitado.

---

## Sumario

1. [Visao geral da plataforma](#1-visao-geral-da-plataforma)
2. [Arquitetura tecnica explicada em linguagem simples](#2-arquitetura-tecnica-explicada-em-linguagem-simples)
3. [Fluxo completo de funcionamento da plataforma](#3-fluxo-completo-de-funcionamento-da-plataforma)
4. [Como os dados dos usuarios entram no sistema](#4-como-os-dados-dos-usuarios-entram-no-sistema)
5. [Como os dados sao processados](#5-como-os-dados-sao-processados)
6. [Onde os dados sao armazenados](#6-onde-os-dados-sao-armazenados)
7. [Integracoes externas e que dados sao enviados a elas](#7-integracoes-externas-e-que-dados-sao-enviados-a-elas)
8. [Autenticacao e controle de acesso](#8-autenticacao-e-controle-de-acesso)
9. [Logs e rastreamento](#9-logs-e-rastreamento)
10. [Automacao e processamento interno](#10-automacao-e-processamento-interno)
11. [Tipos de dados tratados pela plataforma](#11-tipos-de-dados-tratados-pela-plataforma)
12. [Pontos que podem exigir atencao juridica](#12-pontos-que-podem-exigir-atencao-juridica)

---

## 1. Visao geral da plataforma

A EOPIX e uma plataforma brasileira acessivel pela internet (SaaS — Software as a Service) que gera relatorios de risco fiscal e legal sobre pessoas fisicas (CPF) e pessoas juridicas (CNPJ).

**Como funciona em termos simples:** um usuario acessa o site, insere o numero de um CPF ou CNPJ, realiza o pagamento de R$ 29,90 via PIX, e recebe um relatorio consolidado contendo dados cadastrais, financeiros, judiciais e mencoes publicas na internet sobre aquela pessoa ou empresa. O relatorio inclui ainda uma analise de risco gerada por inteligencia artificial.

**Proposta de valor:** reunir em um unico documento informacoes que normalmente exigiriam consultas em multiplas fontes (Receita Federal, tribunais, Serasa, Google, Reclame Aqui), acrescidas de uma analise automatizada por IA.

**Publico-alvo:** empresas e individuos que precisam avaliar o risco de se relacionar comercialmente com uma pessoa ou empresa — por exemplo, antes de fechar um contrato, conceder credito ou estabelecer parceria.

**Modelo de negocio:** compra unica (nao e assinatura). Cada relatorio custa R$ 29,90 e fica disponivel para visualizacao por 7 dias apos a geracao. Apos esse prazo, o relatorio e automaticamente excluido do sistema.

**Dados contidos no relatorio:**
- Dados cadastrais (nome, enderecos, telefones, empresas vinculadas)
- Dados financeiros (protestos, dividas, cheques sem fundo)
- Processos judiciais (acoes em tribunais, valores, partes)
- Mencoes na internet (noticias, reclamacoes, informacoes publicas)
- Analise de risco gerada por inteligencia artificial
- Resumo executivo com avaliacao geral

---

## 2. Arquitetura tecnica explicada em linguagem simples

A plataforma EOPIX e composta por diferentes "pecas" de tecnologia que trabalham juntas. Abaixo, cada componente e explicado de forma acessivel:

**O site (aplicacao web):** Construido com uma tecnologia chamada Next.js (versao 14), que permite criar sites interativos. O usuario acessa a plataforma pelo navegador (Chrome, Safari, etc.) como qualquer outro site. A linguagem de programacao utilizada e TypeScript.

**O banco de dados:** Todas as informacoes da plataforma (contas de usuarios, compras, relatorios) sao armazenadas em um banco de dados do tipo PostgreSQL, hospedado por um servico chamado Neon. O banco de dados e como um "arquivo digital" organizado em tabelas.

**O processamento em segundo plano:** Apos o pagamento, o relatorio nao e gerado instantaneamente. Um servico chamado Inngest gerencia uma fila de tarefas: ele coordena as consultas a diferentes fontes de dados, uma apos a outra, e se alguma etapa falhar, tenta novamente automaticamente.

**O gateway de pagamento:** Os pagamentos sao processados pela AbacatePay, uma empresa brasileira que oferece pagamentos via PIX. O usuario e redirecionado para a pagina de pagamento da AbacatePay e, apos pagar, a AbacatePay notifica automaticamente a plataforma EOPIX.

**A fonte de dados cadastrais e financeiros:** Uma empresa chamada APIFull fornece os dados cadastrais, financeiros e judiciais. A EOPIX envia o numero do CPF ou CNPJ e recebe de volta as informacoes detalhadas.

**A busca na internet:** O servico Serper realiza buscas automaticas no Google para encontrar mencoes publicas sobre a pessoa ou empresa pesquisada (noticias, reclamacoes, informacoes em sites publicos).

**A inteligencia artificial:** O servico OpenAI (mesma empresa que criou o ChatGPT) analisa os processos judiciais e as mencoes na internet, classificando-os e gerando um resumo de risco em linguagem natural.

**A hospedagem:** O site e hospedado na Vercel, um servico de nuvem que disponibiliza o site para acesso publico na internet.

**Fluxo simplificado:**

```
Usuario acessa o site
    |
    v
Insere CPF ou CNPJ
    |
    v
Faz o pagamento (AbacatePay - PIX)
    |
    v
Sistema consulta dados cadastrais e financeiros (APIFull)
    |
    v
Sistema busca mencoes na internet (Serper/Google)
    |
    v
Inteligencia artificial analisa e gera resumo (OpenAI)
    |
    v
Relatorio salvo no banco de dados (Neon)
    |
    v
Usuario visualiza o relatorio (disponivel por 7 dias)
    |
    v
Apos 7 dias, relatorio excluido automaticamente
```

---

## 3. Fluxo completo de funcionamento da plataforma

A seguir, o passo a passo detalhado de como a plataforma funciona, da perspectiva do usuario e dos bastidores:

**Passo 1 — Acesso ao site:** O usuario acessa a pagina inicial da plataforma e encontra um campo para inserir um numero de CPF ou CNPJ.

**Passo 2 — Validacao do documento:** O sistema verifica se o numero inserido e valido (formato correto e digitos verificadores). Tambem verifica se o documento nao esta em uma "lista de bloqueio" (documentos que foram impedidos de serem pesquisados por motivos administrativos ou legais).

**Passo 3 — Cadastro ou login:** Se o usuario nao estiver logado, e aberto um formulario solicitando: nome completo, email, celular, CPF ou CNPJ do comprador, senha e confirmacao de senha. Se ja tiver conta, pode fazer login com email e senha. O cadastro/login e obrigatorio para vincular a compra a uma conta.

**Passo 4 — Pagamento:** O usuario e redirecionado para a pagina de pagamento da AbacatePay, onde realiza o pagamento de R$ 29,90 via PIX. Os dados enviados ao gateway de pagamento incluem: nome do comprador, email, celular e CPF/CNPJ do comprador.

**Passo 5 — Confirmacao do pagamento:** Quando o pagamento e confirmado, a AbacatePay envia uma notificacao automatica (webhook) para a plataforma EOPIX. O sistema verifica a autenticidade dessa notificacao usando uma assinatura criptografica e atualiza o status da compra para "pago".

**Passo 6 — Inicio do processamento:** Imediatamente apos a confirmacao do pagamento, o sistema aciona o processamento automatico do relatorio. Esse processamento ocorre em segundo plano (o usuario nao precisa manter a pagina aberta) e consiste em 6 etapas:

- **Etapa 1 — Verificacao de cache:** O sistema verifica se ja existe um relatorio valido (gerado recentemente) para o mesmo CPF ou CNPJ. Se existir, reutiliza sem fazer novas consultas.
- **Etapa 2 — Consulta cadastral:** Envia o CPF ou CNPJ a APIFull e recebe dados cadastrais (nome, enderecos, telefones, empresas vinculadas).
- **Etapa 3 — Consulta financeira e judicial:** Envia o documento a APIFull e recebe dados financeiros (protestos, dividas, cheques sem fundo) e, no caso de CPF, processos judiciais (acoes em tribunais).
- **Etapa 4 — Busca na internet:** Realiza 4 buscas automaticas no Google via Serper: pelo documento, pelo nome com termos de risco, no site Reclame Aqui e uma busca aberta por noticias.
- **Etapa 5 — Analise por inteligencia artificial:** Envia os processos judiciais e mencoes web para a OpenAI, que classifica cada item e gera uma analise de risco.
- **Etapa 6 — Consolidacao:** Todos os dados sao reunidos em um unico registro e salvos no banco de dados. O status da compra e atualizado para "concluido".

**Passo 7 — Notificacao ao usuario:** O site atualiza automaticamente o status da compra em tempo real (usando uma tecnologia chamada Server-Sent Events). O usuario ve uma barra de progresso avancar conforme cada etapa e concluida.

**Passo 8 — Visualizacao do relatorio:** O usuario pode acessar o relatorio completo atraves de um link autenticado (somente ele tem acesso, mediante login). O relatorio apresenta os dados cadastrais, financeiros, judiciais, mencoes na internet e a analise de risco gerada pela IA.

**Passo 9 — Expiracao:** Apos 7 dias, o relatorio e automaticamente excluido do banco de dados por um processo de limpeza que roda diariamente. O usuario que precisar de informacoes atualizadas deve realizar uma nova compra.

---

## 4. Como os dados dos usuarios entram no sistema

A plataforma coleta dados em diferentes momentos e por diferentes meios. Abaixo, cada ponto de entrada de dados:

### 4.1 Formulario de cadastro

Quando o usuario realiza sua primeira compra, preenche um formulario com:

| Campo | Obrigatorio | Finalidade |
|-------|-------------|------------|
| Nome completo | Sim | Identificacao e envio ao gateway de pagamento |
| Email | Sim | Login, comunicacao e identificacao no gateway |
| Celular | Sim | Envio ao gateway de pagamento |
| CPF ou CNPJ do comprador | Sim | Identificacao fiscal no gateway de pagamento |
| Senha | Sim (min. 8 caracteres) | Autenticacao futura |
| Confirmacao de senha | Sim | Validacao de digitacao |

Esses dados sao armazenados na tabela "User" do banco de dados. A senha e armazenada como um "hash" (transformacao irreversivel) usando o algoritmo bcrypt — ou seja, a senha original nao pode ser recuperada a partir do que esta armazenado.

### 4.2 Formulario de login

Usuarios ja cadastrados informam email e senha. Nenhum dado novo e coletado — apenas verificados contra os dados existentes.

### 4.3 Campo de consulta (CPF/CNPJ pesquisado)

Na pagina inicial ou de consulta, o usuario insere o numero de CPF ou CNPJ que deseja pesquisar. **Este e o documento de um terceiro, nao necessariamente do proprio usuario.** Este numero e armazenado no campo "term" da tabela "Purchase" e e o dado que aciona todo o processo de consulta.

### 4.4 Notificacao de pagamento (webhook)

Apos o pagamento, a AbacatePay envia automaticamente uma notificacao ao sistema contendo: identificador da transacao, valor pago, metodo de pagamento, e dados do cliente (email, nome). Esses dados sao usados para confirmar o pagamento e, se necessario, atualizar o cadastro do usuario.

### 4.5 Formulario de direitos LGPD

A plataforma oferece um formulario para exercicio de direitos previstos na LGPD (Lei Geral de Protecao de Dados). Campos coletados:

| Campo | Obrigatorio | Finalidade |
|-------|-------------|------------|
| Nome | Sim | Identificacao do solicitante |
| CPF/CNPJ | Sim | Identificacao e busca de dados no sistema |
| Email | Sim | Comunicacao sobre a solicitacao |
| Tipo de solicitacao | Sim | Acesso, correcao, exclusao, portabilidade, oposicao ou revogacao |
| Descricao | Sim (min. 10 caracteres) | Detalhamento do pedido |

Cada solicitacao recebe um numero de protocolo unico (formato: LGPD-2026-XXXX).

### 4.6 Captura de lead (interesse)

Quando a plataforma esta em manutencao ou com servicos indisponiveis, e exibido um formulario simples com campo de email para que o usuario seja notificado quando o servico retornar. Esses dados sao armazenados na tabela "LeadCapture" e excluidos automaticamente apos 90 dias.

### 4.7 Login administrativo

Administradores acessam um painel de gestao separado, fornecendo email e senha. O acesso e protegido por limite de tentativas (maximo 5 tentativas a cada 15 minutos por endereco IP).

---

## 5. Como os dados sao processados

Apos a confirmacao do pagamento, o sistema inicia automaticamente o processamento do relatorio. Abaixo, cada etapa detalhada:

### 5.1 Verificacao de cache

Antes de consultar qualquer servico externo, o sistema verifica se ja existe um relatorio valido para o mesmo CPF ou CNPJ, gerado nas ultimas 24 horas. Se encontrado, o relatorio existente e reutilizado sem que novas consultas sejam realizadas. Isso economiza custos e evita consultas desnecessarias.

### 5.2 Consulta de dados cadastrais

O sistema envia o numero do CPF ou CNPJ (apenas os digitos, sem formatacao) para a APIFull e recebe:

**Para CPF (pessoa fisica):**
- Nome completo e nome da mae
- Data de nascimento e sexo
- Situacao cadastral na Receita Federal
- Enderecos completos (rua, numero, complemento, bairro, cidade, estado, CEP)
- Telefones (DDD, numero, tipo — fixo/movel)
- Emails vinculados
- Empresas nas quais a pessoa tem participacao (CNPJ, cargo, percentual)

**Para CNPJ (pessoa juridica):**
- Razao social e nome fantasia
- Situacao cadastral (ativa, baixada, suspensa, inapta)
- Data de abertura e natureza juridica
- Capital social
- Enderecos
- Socios e administradores (nomes, cargos, documentos, datas de entrada)
- Codigos de atividade economica (CNAE)

### 5.3 Consulta financeira

O sistema envia o documento a APIFull e recebe dados financeiros:
- Protestos em cartorio (data, valor, cartorio, cidade)
- Dividas financeiras registradas (tipo, valor, origem, data)
- Cheques sem fundo (quantidade)

Esses dados estao disponiveis tanto para CPF quanto para CNPJ.

### 5.4 Consulta de processos judiciais (apenas CPF)

Para pessoas fisicas, o sistema envia o CPF a APIFull e recebe uma lista de processos judiciais contendo: numero do processo, tribunal, data de distribuicao, classe processual, ramo do direito, status atual, partes envolvidas (nomes e papeis), e valor da causa.

### 5.5 Busca na internet

O sistema realiza 4 buscas automaticas no Google (via servico Serper), todas configuradas para resultados no Brasil em portugues:

1. **Busca pelo documento:** pesquisa pelo CPF ou CNPJ formatado (ex: "123.456.789-00")
2. **Busca por nome com termos de risco:** pesquisa pelo nome da pessoa/empresa combinado com palavras como "escandalo", "investigacao", "denuncia", "irregularidade", "fraude", "lavagem"
3. **Busca no Reclame Aqui:** pesquisa pelo nome especificamente no site reclameaqui.com.br
4. **Busca aberta por noticias:** pesquisa apenas pelo nome, sem filtros, para capturar noticias e mencoes gerais

Cada busca retorna ate 10 resultados (titulo, link e trecho), totalizando ate 40 resultados por relatorio.

### 5.6 Analise por inteligencia artificial

Duas chamadas sao feitas ao servico OpenAI (modelo gpt-4o-mini):

**Primeira chamada — Analise de processos judiciais:**
- Recebe: CPF/CNPJ e lista de processos (limitada aos 30 mais recentes)
- Retorna: para cada processo, uma classificacao de relevancia (alta, media, baixa), categoria (fraude, tributario, trabalhista, criminal, comercial, acidente, familia, outro) e o papel da pessoa no processo (reu, autor, advogado, testemunha)

**Segunda chamada — Classificacao de mencoes e resumo de risco:**
- Recebe: CPF/CNPJ, todas as mencoes web (ate 40), resumo financeiro (totais de protestos e dividas) e resultado da analise de processos
- Retorna: classificacao de cada mencao web (positiva, neutra ou negativa), tipo de fonte (noticia, juridico, reclamacao, governo, outro) e um resumo executivo de 2 a 3 frases sobre o risco geral

**Dados enviados a inteligencia artificial:** CPF/CNPJ, processos judiciais, mencoes web, metricas financeiras agregadas (totais).
**Dados NAO enviados:** enderecos completos, telefones individuais, emails pessoais.

### 5.7 Consolidacao e armazenamento

Todos os dados coletados e gerados sao consolidados em um unico registro no formato JSON (tamanho tipico: 50 a 100 KB por relatorio). Este registro e salvo na tabela "SearchResult" do banco de dados com um prazo de expiracao de 7 dias. O status da compra e atualizado para "Concluido" e o usuario pode visualizar o relatorio.

---

## 6. Onde os dados sao armazenados

### 6.1 Banco de dados principal

Todos os dados da plataforma sao armazenados em um banco de dados PostgreSQL, hospedado pelo servico Neon. A infraestrutura da Neon utiliza servidores da Amazon Web Services (AWS). Todas as conexoes com o banco de dados sao criptografadas via SSL/TLS.

### 6.2 Tabelas do banco de dados

A seguir, cada tabela do banco de dados, o que armazena e por quanto tempo:

| Tabela | O que armazena | Contem dados pessoais? | Prazo de retencao |
|--------|----------------|------------------------|-------------------|
| **User** | Contas de usuarios: email, nome, celular, CPF/CNPJ do usuario, hash da senha, data de criacao | Sim | Indefinido (sem exclusao automatica) |
| **Purchase** | Registros de compras: codigo da compra, CPF/CNPJ pesquisado, valor, status, nome do comprador, CPF/CNPJ do comprador, data de pagamento | Sim | Indefinido (nome e CPF do comprador anonimizados apos 2 anos) |
| **SearchResult** | Relatorios completos: CPF/CNPJ pesquisado, nome do pesquisado, dados cadastrais/financeiros/judiciais/web completos em JSON, resumo da IA | Sim (dados de terceiros) | **7 dias** (excluido automaticamente) |
| **Blocklist** | Lista de documentos bloqueados: CPF/CNPJ, nome associado, motivo do bloqueio | Sim | Indefinido (gerenciado manualmente) |
| **LeadCapture** | Interesses capturados: email, nome, telefone, CPF/CNPJ, motivo | Sim | **90 dias** (excluido automaticamente) |
| **MagicCode** | Codigos temporarios de acesso: email, codigo de 6 digitos | Sim | **10 minutos** (excluido automaticamente) |
| **WebhookLog** | Registros de notificacoes de pagamento: tipo do evento, ID da transacao | Nao | Indefinido (trilha de auditoria) |
| **LgpdRequest** | Solicitacoes de direitos LGPD: nome, CPF/CNPJ, email, tipo, descricao, protocolo | Sim | Indefinido (exigencia legal de guarda) |
| **ApiRequestLog** | Registros de chamadas a APIs externas: CPF/CNPJ consultado, requisicao enviada, resposta completa recebida, tempo de resposta | Sim (dados de terceiros) | **Indefinido (sem exclusao automatica)** |
| **AdminUser** | Contas de administradores: email, hash da senha, nome, cargo | Sim | Indefinido (gerenciado manualmente) |
| **RateLimit** | Controle de frequencia de uso: endereco IP, acao, contador | Nao | Expira automaticamente por janela de tempo |

### 6.3 Dados mais sensiveis

Os registros que concentram maior volume de dados pessoais sao:

- **SearchResult.data (campo JSON):** Contem o relatorio completo — dados cadastrais, financeiros, judiciais e mencoes web de terceiros. E o registro mais volumoso (50 a 100 KB) e e **excluido automaticamente apos 7 dias**.

- **ApiRequestLog.responseRaw (campo JSON):** Contem as respostas brutas das APIs externas, incluindo todos os dados pessoais retornados pela APIFull. **Nao possui prazo de exclusao automatica**, podendo persistir indefinidamente.

- **User.passwordHash:** Senha do usuario armazenada como hash bcrypt (transformacao criptografica irreversivel — nao e possivel recuperar a senha original).

### 6.4 Medidas de protecao dos dados armazenados

- **Criptografia em transito:** Todas as conexoes entre a plataforma e o banco de dados usam HTTPS/TLS (protocolo de criptografia que impede interceptacao dos dados durante a transmissao).
- **Criptografia em repouso:** O banco de dados Neon utiliza criptografia gerenciada pela AWS (os dados ficam criptografados no disco do servidor).
- **Senhas:** Armazenadas exclusivamente como hash bcrypt com 10 rounds de salt (tecnica que torna computacionalmente inviavel reverter o hash para obter a senha original).

---

## 7. Integracoes externas e que dados sao enviados a elas

A plataforma utiliza 10 servicos externos. Para cada um, detalhamos a funcao, quais dados sao enviados e a localizacao geografica:

### 7.1 AbacatePay — Gateway de pagamento

- **Funcao:** Processar pagamentos via PIX
- **Sede:** Brasil
- **Dados enviados ao criar pagamento:**
  - Nome do comprador
  - Email do comprador
  - Celular do comprador
  - CPF/CNPJ do comprador
  - Valor do produto (R$ 29,90)
  - Descricao do produto ("Relatorio de Risco CPF/CNPJ")
- **Dados recebidos:** Confirmacao de pagamento (ID da transacao, valor pago, metodo, dados do cliente)
- **Comunicacao:** A AbacatePay notifica a plataforma automaticamente quando o pagamento e confirmado (via webhook com assinatura criptografica HMAC-SHA256)

### 7.2 APIFull — Provedor de dados cadastrais, financeiros e judiciais

- **Funcao:** Fornecer dados detalhados sobre CPFs e CNPJs
- **Sede:** Brasil (api.apifull.com.br)
- **Dados enviados:** Apenas o numero do CPF ou CNPJ (digitos, sem formatacao)
- **Dados recebidos:**
  - Para CPF: nome completo, nome da mae, data de nascimento, enderecos, telefones, emails, empresas vinculadas, processos judiciais, protestos, dividas financeiras, cheques sem fundo
  - Para CNPJ: razao social, situacao cadastral, data de abertura, socios (nomes, cargos, documentos), capital social, enderecos, processos, protestos, dividas
- **Autenticacao:** Chave de API (Bearer token) enviada em cada requisicao

### 7.3 Serper — Busca na internet via Google

- **Funcao:** Realizar buscas automaticas no Google para encontrar mencoes publicas
- **Sede:** Estados Unidos (google.serper.dev)
- **Dados enviados:**
  - CPF/CNPJ formatado (ex: "123.456.789-00")
  - Nome da pessoa ou empresa
  - Termos de busca combinados (ex: "Joao Silva escandalo OR investigacao OR fraude")
- **Dados recebidos:** Ate 40 resultados de busca (titulo, URL, trecho) provenientes de noticias, sites juridicos, Reclame Aqui e outras fontes publicas
- **Configuracao:** Buscas realizadas com geolocalizacao Brasil e idioma portugues

### 7.4 OpenAI — Inteligencia artificial

- **Funcao:** Analisar processos judiciais e mencoes web, gerar classificacao de risco e resumo executivo
- **Sede:** Estados Unidos (api.openai.com)
- **Modelo utilizado:** gpt-4o-mini
- **Dados enviados:**
  - CPF/CNPJ
  - Processos judiciais (limitados a 30 mais recentes): numero, tribunal, data, classe, partes, valor
  - Mencoes web (ate 40): titulo, URL, trecho
  - Resumo financeiro: totais de protestos e dividas (valores agregados)
- **Dados NAO enviados:** Enderecos completos, telefones, emails individuais
- **Dados recebidos:** Classificacao de processos, classificacao de mencoes, tipo de fonte, resumo de risco em texto

### 7.5 Inngest — Orquestrador de tarefas assincronas

- **Funcao:** Coordenar a execucao sequencial das etapas de processamento do relatorio em segundo plano
- **Sede:** Estados Unidos
- **Dados que transitam pelo servico:** Identificador da compra, email do usuario, CPF/CNPJ e tipo de documento
- **Armazenamento:** Inngest nao armazena dados permanentemente — apenas logs temporarios conforme seu plano de servico

### 7.6 Neon — Banco de dados

- **Funcao:** Hospedar o banco de dados PostgreSQL da plataforma
- **Infraestrutura:** Amazon Web Services (AWS)
- **Dados armazenados:** Todos os dados da plataforma conforme detalhado no capitulo 6
- **Criptografia:** Em repouso (disco) e em transito (SSL/TLS)

### 7.7 Sentry — Monitoramento de erros (parcialmente ativo)

- **Funcao:** Capturar e rastrear erros tecnicos do sistema para que a equipe de desenvolvimento possa corrigir problemas
- **Sede:** Estados Unidos
- **Dados enviados quando ocorre um erro:**
  - Mensagem de erro e detalhes tecnicos (stack trace)
  - Em uma rota especifica (rota de compra): o email do usuario pode ser incluido no contexto do erro
- **Configuracao de privacidade:** Sessoes de replay configuradas com mascara de texto (textos sao ocultados) e bloqueio de midia
- **Status atual:** O identificador de projeto (DSN) esta configurado como vazio no codigo — o servico pode nao estar ativo em producao

### 7.8 Brevo — Servico de email

- **Funcao:** Enviar emails transacionais (codigos de acesso temporario)
- **Sede:** Franca (api.brevo.com)
- **Dados enviados:** Email do destinatario e conteudo do email (codigo de 6 digitos para login temporario)
- **Tipos de email enviados:** Codigo de acesso (magic code)
- **Bypass em desenvolvimento:** Em modo de teste, emails sao registrados no console em vez de enviados

### 7.9 Plausible Analytics — Analitica de uso

- **Funcao:** Medir visitas e interacoes no site (quantas pessoas acessam, quais paginas visitam)
- **Sede:** Uniao Europeia
- **Dados enviados:** Nenhum dado pessoal (analitica sem uso de cookies)
- **O que rastreia:** Eventos genericos como "checkout iniciado", "relatorio acessado", "login realizado" — sem identificar individualmente nenhum usuario
- **Compatibilidade LGPD:** Total (nao utiliza cookies, nao identifica usuarios)

### 7.10 Vercel — Hospedagem do site

- **Funcao:** Hospedar e disponibilizar o site para acesso publico na internet
- **Sede:** Estados Unidos
- **Dados que transitam:** Todo o trafego web passa pelos servidores da Vercel
- **Logs:** A Vercel mantem logs de acesso (enderecos IP, navegadores utilizados) conforme sua propria politica de retencao

---

## 8. Autenticacao e controle de acesso

### 8.1 Tipos de usuario

A plataforma distingue dois tipos de usuario:

- **Usuario comum:** Pode criar conta, comprar relatorios e visualizar os relatorios que adquiriu. So tem acesso aos seus proprios relatorios.
- **Administrador:** Pode gerenciar todas as compras, bloquear documentos, visualizar todos os relatorios, reprocessar relatorios com falha e acessar metricas do painel administrativo.

### 8.2 Cadastro de usuario

O cadastro coleta: email, senha (minimo 8 caracteres), nome, celular e CPF/CNPJ do comprador. A senha e transformada em um hash (bcrypt com 10 rounds) antes de ser armazenada — o que significa que a plataforma nao tem acesso a senha original em momento algum.

Se o email ja existir no sistema como "convidado" (criado automaticamente em compra anterior antes do cadastro ser implementado), a conta e automaticamente convertida em conta completa.

### 8.3 Login

O login utiliza email e senha. A verificacao da senha e feita de forma segura usando comparacao em tempo constante via bcrypt (tecnica que previne ataques de "timing", onde um invasor poderia medir o tempo de resposta para deduzir informacoes sobre a senha).

Em caso de erro, a mensagem exibida e generica ("Email ou senha incorretos") tanto para email inexistente quanto para senha errada — isso previne que atacantes descubram quais emails estao cadastrados.

### 8.4 Sessao do usuario

Apos o login, o sistema cria uma sessao usando um cookie chamado "eopix_session". Este cookie:

- Contem um token assinado criptograficamente (HMAC-SHA256) com o email do usuario, data de criacao e data de expiracao
- E do tipo "httpOnly" (nao pode ser acessado por codigo JavaScript no navegador, prevenindo ataques de roubo de sessao)
- E configurado como "secure" em producao (so trafega por conexoes HTTPS)
- E configurado como "sameSite: strict" (nao e enviado em requisicoes originadas de outros sites, prevenindo ataques CSRF)
- Dura 30 dias para usuarios comuns e 8 horas para administradores

### 8.5 Login automatico apos pagamento

Apos a confirmacao de pagamento, o usuario e logado automaticamente no sistema usando o codigo da compra como identificador. Nao e necessario inserir a senha novamente.

### 8.6 Administracao

O login administrativo possui protecoes adicionais:
- Limite de tentativas: maximo 5 tentativas a cada 15 minutos por endereco IP
- Sessao mais curta: 8 horas (contra 30 dias dos usuarios comuns)
- Identificacao: via tabela AdminUser no banco de dados ou lista de emails em variavel de ambiente do servidor

### 8.7 Protecao contra abuso

A plataforma implementa limitacao de frequencia (rate limiting) em varias camadas:
- Limite por rota e por IP (ex: 5 requisicoes de login por minuto)
- Limite especifico por acao (ex: 10 compras por hora por IP)
- Armazenado no banco de dados (persiste entre reinicializacoes do servidor)
- Camada adicional no "edge" (borda da rede) para protecao antes mesmo de chegar ao servidor principal

---

## 9. Logs e rastreamento

### 9.1 Logs da aplicacao

A plataforma gera aproximadamente 80 pontos de log no codigo-fonte. Esses logs aparecem nos servidores da Vercel e, quando configurado, no Sentry.

**Dados pessoais que podem aparecer em logs:**
- Email do usuario: registrado em logs de webhook (quando pagamento e confirmado) e em logs de erro de compra
- Nome do comprador: registrado ao processar notificacoes de pagamento
- CPF/CNPJ: registrado em modo de desenvolvimento e em logs de processamento de relatorio
- Nome da pessoa/empresa pesquisada: registrado durante a etapa de consulta cadastral

**Nota relevante:** Em marco de 2026, 5 logs de desenvolvimento que registravam dados pessoais completos (CPF, nome, endereco, processos judiciais) foram identificados e removidos do codigo.

### 9.2 Registro de notificacoes de pagamento (WebhookLog)

Cada notificacao de pagamento recebida da AbacatePay e registrada na tabela WebhookLog, contendo: tipo do evento, identificador do pagamento e indicacao de processamento. **Esta tabela nao armazena dados pessoais** do cliente — apenas identificadores tecnicos. Sua finalidade e prevenir processamento duplicado.

### 9.3 Registro de chamadas a APIs externas (ApiRequestLog)

Cada chamada realizada a servicos externos (APIFull, Serper, OpenAI) e registrada na tabela ApiRequestLog, contendo:
- CPF/CNPJ consultado
- Endpoint da API chamado
- Corpo da requisicao enviada
- **Resposta completa recebida** (campo JSON com todos os dados retornados pela API)
- Tempo de resposta e codigo de status

**Ponto importante:** As respostas brutas das APIs externas sao armazenadas integralmente, incluindo todos os dados cadastrais, financeiros e judiciais. **Esta tabela nao possui prazo de exclusao automatica**, podendo reter dados de terceiros por tempo indeterminado.

### 9.4 Sentry (monitoramento de erros)

O Sentry esta configurado no codigo mas com identificador de projeto (DSN) vazio — pode nao estar capturando erros em producao. Se ativo:
- Captura erros com detalhes tecnicos (stack trace)
- Sessoes de replay configuradas com mascara de texto e bloqueio de midia
- Em 1 rota especifica, o email do usuario pode ser incluido no contexto do erro

### 9.5 Plausible Analytics

Rastreia eventos genericos (visitas, paginas acessadas, acoes como "checkout iniciado") sem utilizar cookies e sem coletar dados pessoais. Compativel com LGPD.

### 9.6 Onde os logs ficam armazenados

| Tipo de log | Local de armazenamento | Localizacao geografica |
|-------------|----------------------|----------------------|
| Logs da aplicacao (console) | Servidores Vercel | Estados Unidos |
| WebhookLog | Banco de dados Neon | AWS (a confirmar regiao) |
| ApiRequestLog | Banco de dados Neon | AWS (a confirmar regiao) |
| Sentry (se ativo) | Servidores Sentry | Estados Unidos |
| Plausible Analytics | Servidores Plausible | Uniao Europeia |

---

## 10. Automacao e processamento interno

### 10.1 Pipeline de processamento

O processamento do relatorio e totalmente automatizado. Apos a confirmacao do pagamento, o sistema Inngest coordena a execucao de 8 etapas em sequencia, sem intervencao humana. Caracteristicas:

- **Tempo medio:** Alguns minutos (depende da disponibilidade das APIs externas)
- **Retentativas automaticas:** Em caso de falha em qualquer etapa, o sistema tenta novamente automaticamente ate 10 vezes, com espera progressiva entre tentativas (backoff exponencial)
- **Processamento paralelo:** Maximo 5 relatorios sao processados simultaneamente
- **Memoizacao:** Se uma etapa ja foi executada com sucesso e o sistema precisa retentar, as etapas anteriores bem-sucedidas nao sao reexecutadas (economiza custos e tempo)

### 10.2 Tarefas automaticas periodicas

O sistema executa 5 tarefas automaticas em horarios pre-definidos:

| Tarefa | Frequencia | O que faz |
|--------|-----------|-----------|
| Limpeza de relatorios expirados | Diariamente as 03:00 (horario UTC) | Exclui permanentemente do banco de dados todos os relatorios com mais de 7 dias |
| Limpeza de capturas de lead | Diariamente as 03:15 (horario UTC) | Exclui permanentemente registros de interesse com mais de 90 dias |
| Limpeza de codigos temporarios | Diariamente as 03:30 (horario UTC) | Exclui codigos de acesso expirados ou ja utilizados |
| Limpeza de compras pendentes | A cada 15 minutos | Marca como "falha" as compras sem pagamento ha mais de 30 minutos |
| Anonimizacao de dados | Mensalmente (dia 1) | Substitui nome e CPF/CNPJ do comprador por "ANONIMIZADO" em compras com mais de 2 anos |

### 10.3 Anonimizacao (LGPD Artigo 16)

Mensalmente, no primeiro dia do mes, o sistema executa um processo de anonimizacao:

- **Escopo:** Compras com status "Concluido" ou "Reembolsado" criadas ha mais de 2 anos
- **Acao:** Os campos "nome do comprador" e "CPF/CNPJ do comprador" sao substituidos pelo texto "ANONIMIZADO"
- **Dados preservados:** O CPF/CNPJ pesquisado (campo "term") **nao e anonimizado** — ele permanece no registro da compra
- **Resultado:** O registro da compra permanece no banco de dados, mas sem dados que identifiquem o comprador

### 10.4 Tratamento de falhas

Quando o processamento de um relatorio falha:
- O status da compra e atualizado para "Falha", com detalhes do erro registrados
- **O usuario nao ve o status de falha** — a interface mostra "Processando" para nao gerar alarme. O administrador tem acesso ao status real no painel de gestao.
- O sistema Inngest retenta automaticamente ate 10 vezes
- Se todas as tentativas falharem, o administrador pode acionar o reprocessamento manualmente (individual ou em lote)
- Nenhum dado do relatorio e salvo em caso de falha (o registro SearchResult so e criado quando o processamento e concluido com sucesso)

---

## 11. Tipos de dados tratados pela plataforma

### 11.1 Dados do usuario (titular da conta)

| Dado | Coleta | Armazenamento | Retencao |
|------|--------|---------------|----------|
| Email | Cadastro | Tabela User | Indefinida |
| Nome completo | Cadastro | Tabela User | Indefinida |
| Celular | Cadastro | Tabela User | Indefinida |
| CPF/CNPJ do usuario | Cadastro | Tabela User | Indefinida |
| Senha | Cadastro | Tabela User (hash bcrypt) | Indefinida |
| Data de criacao | Automatica | Tabela User | Indefinida |

### 11.2 Dados do comprador (vinculados a cada compra)

| Dado | Coleta | Armazenamento | Retencao |
|------|--------|---------------|----------|
| Nome do comprador | Formulario de compra | Tabela Purchase | 2 anos (depois anonimizado) |
| CPF/CNPJ do comprador | Formulario de compra | Tabela Purchase | 2 anos (depois anonimizado) |
| Data de aceitacao dos termos | Automatica | Tabela Purchase | Indefinida |
| Historico de compras | Automatico | Tabela Purchase | Indefinida |

### 11.3 Dados de terceiros (pessoa ou empresa pesquisada)

Estes sao dados sobre a pessoa ou empresa cujo CPF/CNPJ foi pesquisado. **A pessoa pesquisada nao e necessariamente usuario da plataforma e nao forneceu consentimento direto.**

**Para CPF (pessoa fisica):**

| Categoria | Dados especificos |
|-----------|-------------------|
| Identificacao | Nome completo, nome da mae, data de nascimento, sexo |
| Situacao cadastral | Status na Receita Federal |
| Enderecos | Rua, numero, complemento, bairro, cidade, estado, CEP (todos os enderecos vinculados) |
| Contatos | Telefones (DDD, numero, tipo), emails vinculados |
| Vinculos empresariais | CNPJs de empresas vinculadas, cargo, percentual de participacao |
| Processos judiciais | Numero do processo, tribunal, data, classe, ramo do direito, status, partes envolvidas, valor da causa |
| Dados financeiros | Protestos em cartorio (data, valor, cartorio, cidade), dividas financeiras (tipo, valor, origem, data), cheques sem fundo |
| Mencoes na internet | Noticias, reclamacoes, informacoes publicas encontradas em ate 40 resultados de busca no Google |

**Para CNPJ (pessoa juridica):**

| Categoria | Dados especificos |
|-----------|-------------------|
| Identificacao | Razao social, nome fantasia, CNPJ |
| Situacao | Situacao cadastral (ativa/baixada/suspensa/inapta), data de abertura, natureza juridica |
| Composicao | Capital social, socios e administradores (nomes, cargos, documentos, datas de entrada) |
| Atividades | Codigos CNAE (atividades economicas) |
| Enderecos | Enderecos vinculados |
| Processos | Processos judiciais ativos e arquivados (quantidade, valores, detalhes) |
| Dados financeiros | Protestos, dividas financeiras, cheques sem fundo |
| Mencoes na internet | Noticias, reclamacoes, informacoes publicas |

### 11.4 Dados financeiros calculados

| Dado | Origem | Exibido ao usuario? |
|------|--------|---------------------|
| Total de protestos (quantidade e valor) | Calculo sobre dados da APIFull | Sim |
| Total de dividas (quantidade e valor) | Calculo sobre dados da APIFull | Sim |
| Cheques sem fundo (quantidade) | Dados da APIFull | Sim |
| Score interno de credito | Calculo interno | **Nao** (marcado como uso interno no codigo) |

### 11.5 Dados gerados por inteligencia artificial

| Dado | Gerado por | Conteudo |
|------|-----------|----------|
| Classificacao de processos | OpenAI (gpt-4o-mini) | Relevancia, categoria, papel da pessoa em cada processo |
| Classificacao de mencoes web | OpenAI (gpt-4o-mini) | Sentimento (positiva/neutra/negativa), tipo de fonte (noticia/juridico/reclamacao/governo) |
| Resumo executivo de risco | OpenAI (gpt-4o-mini) | Texto de 2-3 frases com avaliacao geral |
| Resumo de reclamacoes | OpenAI (gpt-4o-mini) | Dados extraidos do Reclame Aqui (se aplicavel) |

### 11.6 Dados operacionais

| Dado | Tabela | Dados pessoais? | Retencao |
|------|--------|-----------------|----------|
| Logs de webhook | WebhookLog | Nao | Indefinida |
| Logs de API | ApiRequestLog | **Sim** (respostas completas) | Indefinida |
| Limites de uso | RateLimit | Nao (apenas IPs) | Expira automaticamente |
| Solicitacoes LGPD | LgpdRequest | Sim | Indefinida (obrigatorio) |
| Lista de bloqueio | Blocklist | Sim (CPF/CNPJ) | Indefinida |

---

## 12. Pontos que podem exigir atencao juridica

> **Nota:** Este capitulo nao constitui opiniao juridica. Sao observacoes tecnicas extraidas da analise do codigo-fonte que podem ser relevantes para apreciacao por profissional de direito habilitado.

### 12.1 Coleta e tratamento de dados pessoais de terceiros

A plataforma consulta e processa dados pessoais extensivos (cadastrais, financeiros, judiciais) de pessoas e empresas que **nao sao usuarios da plataforma** e que **nao forneceram consentimento direto** para o tratamento de seus dados.

Os dados obtidos via APIFull incluem: nome completo, nome da mae, data de nascimento, enderecos, telefones, emails, situacao financeira (protestos, dividas), processos judiciais e vinculos empresariais. Esses dados sao consolidados em um relatorio vendido a um terceiro mediante pagamento.

### 12.2 Compartilhamento de dados com servicos no exterior

Dados pessoais (CPF/CNPJ e informacoes associadas) sao enviados a servicos sediados nos **Estados Unidos**:

- **OpenAI:** Recebe processos judiciais, mencoes web e resumo financeiro para analise por inteligencia artificial
- **Serper:** Recebe CPF/CNPJ formatado e nome para realizacao de buscas no Google
- **Inngest:** Recebe CPF/CNPJ e email para orquestracao de tarefas
- **Vercel:** Todo o trafego web transita por seus servidores

A transferencia internacional de dados pessoais pode exigir base legal especifica sob a LGPD (Lei 13.709/2018, Art. 33).

### 12.3 Retencao de dados sem prazo definido

Foram identificadas tabelas no banco de dados que armazenam dados pessoais sem prazo de exclusao automatica:

- **ApiRequestLog:** Armazena respostas completas das APIs externas (incluindo todos os dados cadastrais, financeiros e judiciais de terceiros) sem prazo de exclusao
- **User:** Contas de usuario permanecem indefinidamente no banco de dados
- **Purchase (campo "term"):** O CPF/CNPJ pesquisado nao e anonimizado mesmo apos o processo de anonimizacao de 2 anos (apenas os dados do comprador sao anonimizados)
- **Blocklist:** CPF/CNPJ bloqueados permanecem indefinidamente
- **WebhookLog:** Registros de pagamento permanecem indefinidamente

### 12.4 Dados pessoais em logs de sistema

Dados pessoais podem aparecer em logs da aplicacao:

- Emails de usuarios em logs de webhook e de erro
- Nomes de pessoas pesquisadas em logs de processamento
- CPF/CNPJ em diversos logs da aplicacao

Esses logs sao armazenados nos servidores da **Vercel (EUA)** e potencialmente no **Sentry (EUA)**. As respostas completas das APIs externas (com todos os dados pessoais) sao armazenadas permanentemente na tabela ApiRequestLog.

### 12.5 Processamento automatizado com impacto potencial

- Os relatorios sao gerados automaticamente por inteligencia artificial sem intervencao humana
- A classificacao de risco pode afetar decisoes de negocios sobre a pessoa ou empresa pesquisada (concessao de credito, fechamento de contrato, parceria comercial)
- O resumo executivo e uma analise gerada por modelo de linguagem (gpt-4o-mini da OpenAI), nao por analista humano
- Nao foi identificado no codigo um mecanismo para que o titular dos dados do relatorio (a pessoa pesquisada) conteste a analise gerada

### 12.6 Busca sistematica na internet e agregacao de informacoes

A plataforma realiza buscas automaticas no Google por mencoes ao nome e documento da pessoa, incluindo buscas com termos como "escandalo", "investigacao", "denuncia", "fraude" e "lavagem". Resultados de sites de reclamacao (como Reclame Aqui) tambem sao incluidos.

A agregacao sistematica de informacoes publicamente disponiveis em um relatorio consolidado e vendavel pode ter implicacoes juridicas distintas do acesso individual a cada fonte.

### 12.7 Score de credito interno

O sistema calcula um score interno baseado nos dados financeiros. Conforme verificado no codigo, este score **nao e exibido ao usuario final** (marcado como campo de uso interno). Seu uso potencial futuro pode ter implicacoes regulatorias.

### 12.8 LGPD — Observacoes especificas

**Mecanismos de conformidade identificados no codigo:**
- Formulario para exercicio de direitos do titular (Art. 18 LGPD) com protocolo unico
- Anonimizacao automatica de dados do comprador apos 2 anos (Art. 16 LGPD)
- Exclusao automatica de relatorios apos 7 dias
- Exclusao automatica de leads apos 90 dias
- Analitica de uso sem cookies (Plausible, compativel com LGPD)

**Pontos de atencao:**
- A base legal para tratamento de dados de terceiros (pessoa pesquisada) nao esta explicitamente definida no codigo (pode estar nos termos de uso ou politica de privacidade, nao analisados neste documento)
- A tabela ApiRequestLog nao possui politica de retencao automatica, podendo reter dados de terceiros indefinidamente
- Nao foi identificado no codigo um mecanismo para que o titular dos dados do relatorio (a pessoa pesquisada, que nao e usuario da plataforma) solicite exclusao de seus dados — o formulario LGPD existente e destinado a usuarios da plataforma
- O CPF/CNPJ pesquisado (campo "term") permanece no registro da compra mesmo apos a anonimizacao dos demais dados do comprador

### 12.9 Dados de pagamento

Os dados do comprador (nome, email, celular, CPF/CNPJ) sao compartilhados com a AbacatePay para processamento do pagamento. A AbacatePay armazena esses dados em seus proprios sistemas conforme sua propria politica de privacidade.

A AbacatePay **nao disponibiliza API de reembolso** — estornos devem ser processados manualmente pelo painel de controle do gateway.

### 12.10 Inconsistencias identificadas entre documentacao e codigo

Durante a analise, foram identificadas as seguintes divergencias entre o que a documentacao do projeto descreve e o que o codigo efetivamente implementa:

| Item | Documentacao diz | Codigo mostra |
|------|-----------------|---------------|
| Protecao anti-bot (Cloudflare Turnstile) | Mencionado como configurado | Chaves vazias — nao esta ativo |
| Email de conclusao de relatorio | Mencionado como funcionalidade | Funcao existe mas esta desabilitada |
| Sentry (monitoramento de erros) | Configurado no codigo | DSN vazio — pode nao estar capturando erros |
| Servico de email | Documentacao menciona Resend | Codigo utiliza Brevo |
| AbacatePay API | Documentacao referencia v2 | Codigo usa endpoint v1 (`/v1/billing/create`) |

---

## Anexo: Resumo dos servicos externos e dados compartilhados

| Servico | Pais | Dados pessoais enviados | Finalidade |
|---------|------|------------------------|------------|
| AbacatePay | Brasil | Nome, email, celular, CPF/CNPJ do comprador | Pagamento |
| APIFull | Brasil | CPF/CNPJ (digitos) | Consulta cadastral, financeira e judicial |
| Serper | EUA | CPF/CNPJ formatado, nome | Busca na internet |
| OpenAI | EUA | CPF/CNPJ, processos, mencoes web, metricas financeiras | Analise por IA |
| Inngest | EUA | ID compra, email, CPF/CNPJ | Orquestracao de tarefas |
| Neon/AWS | EUA* | Todos os dados da plataforma | Banco de dados |
| Sentry | EUA | Email (em caso de erro, 1 rota) | Monitoramento de erros |
| Brevo | Franca | Email do destinatario | Envio de email |
| Plausible | UE | Nenhum dado pessoal | Analitica de uso |
| Vercel | EUA | Trafego web completo | Hospedagem |

*Regiao exata do datacenter AWS a confirmar.

---

## Anexo: Politicas de retencao de dados

| Tipo de dado | Prazo de retencao | Mecanismo de exclusao |
|-------------|-------------------|----------------------|
| Relatorio completo (SearchResult) | 7 dias | Exclusao automatica diaria (03:00 UTC) |
| Capturas de lead (LeadCapture) | 90 dias | Exclusao automatica diaria (03:15 UTC) |
| Codigos temporarios (MagicCode) | 10 minutos | Exclusao automatica diaria (03:30 UTC) |
| Compras pendentes sem pagamento | 30 minutos | Marcacao como falha a cada 15 minutos |
| Dados do comprador (nome/CPF na Purchase) | 2 anos | Anonimizacao automatica mensal (dia 1) |
| Conta do usuario (User) | Indefinida | Sem exclusao automatica |
| Logs de API (ApiRequestLog) | Indefinida | Sem exclusao automatica |
| Logs de webhook (WebhookLog) | Indefinida | Sem exclusao automatica |
| Solicitacoes LGPD (LgpdRequest) | Indefinida | Exigencia legal de guarda |
| Lista de bloqueio (Blocklist) | Indefinida | Gerenciamento manual |

---

*Documento gerado com base na analise automatizada do codigo-fonte do repositorio EOPIX. Todas as afirmacoes sao rastreaveis ao codigo. Para duvidas sobre pontos especificos, recomenda-se a verificacao direta no codigo-fonte referenciado.*
