---
title: "CNPJ Dossie"
---

Este endpoint está documentado para referência, mas **não é utilizado no pipeline principal do EOPIX**.

## Request

```json
{
  "cnpj": "{{cnpj}}",
  "link": "cnpj"
}
```

## Campos Disponíveis

| Seção | Campo | Path JSON | Tipo |
|-------|-------|-----------|------|
| **Dados Empresa** | Razão Social | `dados.razao_social` | string |
| | CNPJ Raiz | `dados.cnpj_raiz` | string |
| | Capital Social | `dados.capital_social` | string |
| | Atualizado Em | `dados.atualizado_em` | string |
| **Porte** | ID | `dados.porte.id` | string |
| | Descrição | `dados.porte.descricao` | string |
| **Natureza Jurídica** | ID | `dados.natureza_juridica.id` | string |
| | Descrição | `dados.natureza_juridica.descricao` | string |
| **Estabelecimento** | CNPJ | `dados.estabelecimento.cnpj` | string |
| | Tipo | `dados.estabelecimento.tipo` | string |
| | Nome Fantasia | `dados.estabelecimento.nome_fantasia` | string |
| | Situação Cadastral | `dados.estabelecimento.situacao_cadastral` | string |
| | Data Situação | `dados.estabelecimento.data_situacao_cadastral` | string |
| | Data Início | `dados.estabelecimento.data_inicio_atividade` | string |
| | Situação Especial | `dados.estabelecimento.situacao_especial` | string |
| **Endereço** | Tipo Logradouro | `dados.estabelecimento.tipo_logradouro` | string |
| | Logradouro | `dados.estabelecimento.logradouro` | string |
| | Número | `dados.estabelecimento.numero` | string |
| | Complemento | `dados.estabelecimento.complemento` | string |
| | Bairro | `dados.estabelecimento.bairro` | string |
| | CEP | `dados.estabelecimento.cep` | string |
| | Cidade | `dados.estabelecimento.cidade.nome` | string |
| | UF | `dados.estabelecimento.estado.sigla` | string |
| **Contato** | DDD 1 | `dados.estabelecimento.ddd1` | string |
| | Telefone 1 | `dados.estabelecimento.telefone1` | string |
| | DDD 2 | `dados.estabelecimento.ddd2` | string |
| | Telefone 2 | `dados.estabelecimento.telefone2` | string |
| | Email | `dados.estabelecimento.email` | string |
| **Sócios** | CPF/CNPJ | `dados.socios[].cpf_cnpj_socio` | string |
| | Nome | `dados.socios[].nome` | string |
| | Tipo | `dados.socios[].tipo` | string |
| | Data Entrada | `dados.socios[].data_entrada` | string |
| | Faixa Etária | `dados.socios[].faixa_etaria` | string |
| | Qualificação | `dados.socios[].qualificacao_socio.descricao` | string |
| | Representante | `dados.socios[].nome_representante` | string |
| **CNAE Principal** | ID | `dados.estabelecimento.atividade_principal.id` | string |
| | Descrição | `dados.estabelecimento.atividade_principal.descricao` | string |
| | Seção | `dados.estabelecimento.atividade_principal.secao` | string |
| **CNAE Secundárias** | ID | `dados.estabelecimento.atividades_secundarias[].id` | string |
| | Descrição | `dados.estabelecimento.atividades_secundarias[].descricao` | string |
| **Regime Tributário** | Ano | `dados.estabelecimento.regimes_tributarios[].ano` | number |
| | Regime | `dados.estabelecimento.regimes_tributarios[].regime_tributario` | string |

## Estrutura da Resposta

```json
{
  "status": "sucesso",
  "dados": {
    "cnpj_raiz": "string",
    "razao_social": "string",
    "capital_social": "string",
    "atualizado_em": "YYYY-MM-DDTHH:mm:ss.sssZ",
    "porte": {
      "id": "string",
      "descricao": "string"
    },
    "natureza_juridica": {
      "id": "string",
      "descricao": "string"
    },
    "socios": [{
      "cpf_cnpj_socio": "string",
      "nome": "string",
      "tipo": "Pessoa Física|Pessoa Jurídica",
      "data_entrada": "YYYY-MM-DD",
      "faixa_etaria": "string",
      "qualificacao_socio": {
        "id": 0,
        "descricao": "string"
      },
      "nome_representante": "string"
    }],
    "estabelecimento": {
      "cnpj": "string",
      "tipo": "Matriz|Filial",
      "nome_fantasia": "string",
      "situacao_cadastral": "Ativa|Inapta|Baixada",
      "data_situacao_cadastral": "YYYY-MM-DD",
      "data_inicio_atividade": "YYYY-MM-DD",
      "situacao_especial": "string",
      "tipo_logradouro": "string",
      "logradouro": "string",
      "numero": "string",
      "complemento": "string",
      "bairro": "string",
      "cep": "string",
      "ddd1": "string",
      "telefone1": "string",
      "email": "string",
      "atividade_principal": {
        "id": "string",
        "descricao": "string",
        "secao": "string"
      },
      "atividades_secundarias": [{
        "id": "string",
        "descricao": "string"
      }],
      "estado": {
        "id": 0,
        "nome": "string",
        "sigla": "string"
      },
      "cidade": {
        "id": 0,
        "nome": "string"
      },
      "regimes_tributarios": [{
        "ano": 0,
        "regime_tributario": "LUCRO REAL|LUCRO PRESUMIDO|SIMPLES NACIONAL"
      }]
    }
  }
}
```

---

# Dossiê Jurídico (`ic-dossie-juridico`)

Relatório jurídico empresarial completo.

## Request

```json
{
  "document": "{{cnpj}}",
  "link": "ic-dossie-juridico"
}
```

## Campos Disponíveis

| Seção | Campo | Path JSON | Tipo |
|-------|-------|-----------|------|
| **Header** | CPF/CNPJ | `dados.HEADER.PARAMETROS.CPFCNPJ` | string |
| **Receita Federal** | Tipo Pessoa | `dados.CREDCADASTRAL.DADOS_RECEITA_FEDERAL.TIPO_PESSOA` | string |
| | Nome | `dados.CREDCADASTRAL.DADOS_RECEITA_FEDERAL.NOME` | string |
| | Razão Social | `dados.CREDCADASTRAL.DADOS_RECEITA_FEDERAL.RAZAO_SOCIAL` | string |
| | Situação | `dados.CREDCADASTRAL.DADOS_RECEITA_FEDERAL.SITUACAO_RECEITA` | string |
| | Data Fundação | `dados.CREDCADASTRAL.DADOS_RECEITA_FEDERAL.DATA_NASCIMENTO_FUNDACAO` | string |
| | CNAE Principal | `dados.CREDCADASTRAL.DADOS_RECEITA_FEDERAL.ATIVIDADE_ECONOMICA_PRINCIPAL` | string |
| **Info Empresa** | CNPJ | `dados.CREDCADASTRAL.INFORMACOES_DA_EMPRESA.CNPJ` | string |
| | Razão Social | `dados.CREDCADASTRAL.INFORMACOES_DA_EMPRESA.RAZAO_SOCIAL` | string |
| | Nome Fantasia | `dados.CREDCADASTRAL.INFORMACOES_DA_EMPRESA.NOME_FANTASIA` | string |
| | Data Fundação | `dados.CREDCADASTRAL.INFORMACOES_DA_EMPRESA.DATA_FUNDACAO` | string |
| | CNAE Primário | `dados.CREDCADASTRAL.INFORMACOES_DA_EMPRESA.CNAE_PRIMARIO` | string |
| | Capital Social | `dados.CREDCADASTRAL.INFORMACOES_DA_EMPRESA.CAPITAL_SOCIAL` | string |
| **Quadro Societário** | Quantidade | `dados.CREDCADASTRAL.QUADRO_SOCIETARIO.QUANTIDADE_OCORRENCIAS` | string |
| | Nome | `dados.CREDCADASTRAL.QUADRO_SOCIETARIO.OCORRENCIAS[].NOME` | string |
| | CPF/CNPJ | `dados.CREDCADASTRAL.QUADRO_SOCIETARIO.OCORRENCIAS[].CPF_CNPJ` | string |
| | Cargo | `dados.CREDCADASTRAL.QUADRO_SOCIETARIO.OCORRENCIAS[].CARGO` | string |
| | Participação | `dados.CREDCADASTRAL.QUADRO_SOCIETARIO.OCORRENCIAS[].PERCENTUAL_PARTICIPACAO` | string |
| **Participação Empresas** | Quantidade | `dados.CREDCADASTRAL.PARTICIPACAO_EM_EMPRESAS.QUANTIDADE_OCORRENCIAS` | string |
| | Ocorrências | `dados.CREDCADASTRAL.PARTICIPACAO_EM_EMPRESAS.OCORRENCIAS[]` | array |
| **Emails** | Email | `dados.CREDCADASTRAL.EMAILS.INFOEMAILS[].ENDERECO` | string |
| **Telefones** | DDD | `dados.CREDCADASTRAL.SOMENTE_TELEFONE.DADOS[].DDD` | string |
| | Número | `dados.CREDCADASTRAL.SOMENTE_TELEFONE.DADOS[].NUM_TELEFONE` | string |
| **Endereço** | Endereço | `dados.CREDCADASTRAL.SOMENTE_ENDERECO.DADOS[].ENDERECO` | string |
| | Número | `dados.CREDCADASTRAL.SOMENTE_ENDERECO.DADOS[].NUMERO` | string |
| | Bairro | `dados.CREDCADASTRAL.SOMENTE_ENDERECO.DADOS[].BAIRRO` | string |
| | Cidade | `dados.CREDCADASTRAL.SOMENTE_ENDERECO.DADOS[].CIDADE` | string |
| | UF | `dados.CREDCADASTRAL.SOMENTE_ENDERECO.DADOS[].UF` | string |
| | CEP | `dados.CREDCADASTRAL.SOMENTE_ENDERECO.DADOS[].CEP` | string |
| **Relatório Jurídico** | Qtd Ações | `dados.CREDCADASTRAL.RELATORIO_JURIDICO_EMPRESARIAL.ACOES.QUANTIDADE_OCORRENCIAS` | string |
| | Valor Total | `dados.CREDCADASTRAL.RELATORIO_JURIDICO_EMPRESARIAL.ACOES.VALOR_TOTAL` | string |
| | Data Recente | `dados.CREDCADASTRAL.RELATORIO_JURIDICO_EMPRESARIAL.ACOES.DATA_RECENTE` | string |
| | Ações | `dados.CREDCADASTRAL.RELATORIO_JURIDICO_EMPRESARIAL.ACOES.OCORRENCIAS[]` | array |
| | Qtd Arquivadas | `dados.CREDCADASTRAL.RELATORIO_JURIDICO_EMPRESARIAL.ACOES_ARQUIVADAS.QUANTIDADE_OCORRENCIAS` | string |
| **Alertas/Restrições** | Quantidade | `dados.CREDCADASTRAL.INFORMACOES_ALERTAS_RESTRICOES.QUANTIDADE_OCORRENCIA` | string |
| | Ocorrências | `dados.CREDCADASTRAL.INFORMACOES_ALERTAS_RESTRICOES.OCORRENCIAS[]` | array |

## Estrutura da Resposta

```json
{
  "status": "sucesso",
  "dados": {
    "HEADER": {
      "PARAMETROS": {
        "CPFCNPJ": "string"
      },
      "DADOS_RETORNADOS": {
        "DADOS_RECEITA_FEDERAL": "0|1",
        "QUADRO_SOCIETARIO": "0|1",
        "PARTICIPACAO_EM_EMPRESAS": "0|1",
        "INFORMACOES_DA_EMPRESA": "0|1",
        "RELATORIO_JURIDICO_EMPRESARIAL": "0|1",
        "INFORMACOES_ALERTAS_RESTRICOES": "0|1"
      }
    },
    "CREDCADASTRAL": {
      "DADOS_RECEITA_FEDERAL": {
        "STATUS_RETORNO": { "CODIGO": "1", "DESCRICAO": "string" },
        "TIPO_PESSOA": "JURIDICA|FISICA",
        "NOME": "string",
        "RAZAO_SOCIAL": "string",
        "SITUACAO_RECEITA": "ATIVA|INAPTA|BAIXADA",
        "DATA_NASCIMENTO_FUNDACAO": "DD/MM/YYYY",
        "ATIVIDADE_ECONOMICA_PRINCIPAL": "string"
      },
      "INFORMACOES_DA_EMPRESA": {
        "CNPJ": "string",
        "RAZAO_SOCIAL": "string",
        "NOME_FANTASIA": "string",
        "DATA_FUNDACAO": "DD/MM/YYYY",
        "CNAE_PRIMARIO": "string",
        "CAPITAL_SOCIAL": "string"
      },
      "QUADRO_SOCIETARIO": {
        "QUANTIDADE_OCORRENCIAS": "string",
        "OCORRENCIAS": [{
          "NOME": "string",
          "CPF_CNPJ": "string",
          "CARGO": "string",
          "PERCENTUAL_PARTICIPACAO": "string"
        }]
      },
      "PARTICIPACAO_EM_EMPRESAS": {
        "QUANTIDADE_OCORRENCIAS": "string",
        "OCORRENCIAS": []
      },
      "EMAILS": {
        "INFOEMAILS": [{ "ENDERECO": "string" }]
      },
      "SOMENTE_TELEFONE": {
        "DADOS": [{
          "DDD": "string",
          "NUM_TELEFONE": "string"
        }]
      },
      "SOMENTE_ENDERECO": {
        "DADOS": [{
          "ENDERECO": "string",
          "NUMERO": "string",
          "BAIRRO": "string",
          "CIDADE": "string",
          "UF": "string",
          "CEP": "string"
        }]
      },
      "RELATORIO_JURIDICO_EMPRESARIAL": {
        "ACOES": {
          "QUANTIDADE_OCORRENCIAS": "string",
          "VALOR_TOTAL": "string",
          "OCORRENCIAS": []
        },
        "ACOES_ARQUIVADAS": {
          "QUANTIDADE_OCORRENCIAS": "string",
          "OCORRENCIAS": []
        }
      },
      "INFORMACOES_ALERTAS_RESTRICOES": {
        "QUANTIDADE_OCORRENCIA": "string",
        "OCORRENCIAS": []
      }
    }
  }
}
```
