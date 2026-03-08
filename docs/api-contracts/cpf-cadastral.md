---
title: "CPF Cadastral"
---

Dados cadastrais, endereços, telefones, emails e empresas vinculadas.

**IMPORTANTE:** O endpoint correto é `ic-cpf-completo`, NÃO `r-cpf-completo`.
`r-cpf-completo` usa créditos separados que esgotam independentemente do saldo geral.
`ic-cpf-completo` usa o saldo geral da conta e retorna dados no formato CREDCADASTRAL (UPPERCASE keys).

## Request

```json
{
  "cpf": "{{cpf}}",
  "link": "ic-cpf-completo"
}
```

URL: `POST https://api.apifull.com.br/api/ic-cpf-completo`

## Campos Disponíveis

| Seção | Campo | Path JSON | Tipo |
|-------|-------|-----------|------|
| **Dados Pessoais** | Nome | `dados.CREDCADASTRAL.IDENTIFICACAO_PESSOA_FISICA.NOME` | string |
| | CPF | `dados.CREDCADASTRAL.IDENTIFICACAO_PESSOA_FISICA.CPF_NUMERO` | string |
| | Situação RF | `dados.CREDCADASTRAL.IDENTIFICACAO_PESSOA_FISICA.CPF_SITUACAO` | string |
| | Data Nascimento | `dados.CREDCADASTRAL.IDENTIFICACAO_PESSOA_FISICA.NASCIMENTO` | string DD/MM/YYYY |
| | Nome da Mãe | `dados.CREDCADASTRAL.IDENTIFICACAO_PESSOA_FISICA.MAE` | string |
| | Sexo | `dados.CREDCADASTRAL.IDENTIFICACAO_PESSOA_FISICA.SEXO` | string |
| | Nome do Pai | `dados.CREDCADASTRAL.IDENTIFICACAO_PESSOA_FISICA.NOME_PAI` | string |
| **Endereços** | Logradouro | `dados.CREDCADASTRAL.SOMENTE_ENDERECO.DADOS[].ENDERECO` | string |
| | Número | `dados.CREDCADASTRAL.SOMENTE_ENDERECO.DADOS[].NUMERO` | string |
| | Complemento | `dados.CREDCADASTRAL.SOMENTE_ENDERECO.DADOS[].COMPLEMENTO` | string |
| | Bairro | `dados.CREDCADASTRAL.SOMENTE_ENDERECO.DADOS[].BAIRRO` | string |
| | Cidade | `dados.CREDCADASTRAL.SOMENTE_ENDERECO.DADOS[].CIDADE` | string |
| | CEP | `dados.CREDCADASTRAL.SOMENTE_ENDERECO.DADOS[].CEP` | string |
| | UF | `dados.CREDCADASTRAL.SOMENTE_ENDERECO.DADOS[].UF` | string |
| **Telefones** | DDD | `dados.CREDCADASTRAL.SOMENTE_TELEFONE.DADOS[].DDD` | string |
| | Número | `dados.CREDCADASTRAL.SOMENTE_TELEFONE.DADOS[].NUM_TELEFONE` | string |
| | Tipo | `dados.CREDCADASTRAL.SOMENTE_TELEFONE.DADOS[].TIPO_TELEFONE` | string |
| **Emails** | Email | `dados.CREDCADASTRAL.EMAILS.INFOEMAILS[].ENDERECO` | string |
| **Empresas** | CNPJ | `dados.CREDCADASTRAL.PARTICIPACAO_EM_EMPRESAS.OCORRENCIAS[].CNPJ` | string |
| | Razão Social | `dados.CREDCADASTRAL.PARTICIPACAO_EM_EMPRESAS.OCORRENCIAS[].RAZAO_SOCIAL` | string |
| | Cargo | `dados.CREDCADASTRAL.PARTICIPACAO_EM_EMPRESAS.OCORRENCIAS[].PARTICIPANTE_CARGO` | string |
| **Parentes** | Nome | `dados.CREDCADASTRAL.PARENTES.INFOCONTATOS[].NOME` | string |
| | Relação | `dados.CREDCADASTRAL.PARENTES.INFOCONTATOS[].RELACAO` | string |
| | Documento | `dados.CREDCADASTRAL.PARENTES.INFOCONTATOS[].DOCUMENTO` | string |

## Estrutura da Resposta

```json
{
  "status": "sucesso",
  "dados": {
    "CREDCADASTRAL": {
      "IDENTIFICACAO_PESSOA_FISICA": {
        "STATUS_RETORNO": { "CODIGO": "1", "DESCRICAO": "CONSULTA CONCLUIDA COM SUCESSO" },
        "CPF_NUMERO": "string",
        "CPF_SITUACAO": "REGULAR",
        "NOME": "string",
        "NASCIMENTO": "DD/MM/YYYY",
        "SEXO": "Feminino|Masculino",
        "MAE": "string",
        "NOME_PAI": "string"
      },
      "SOMENTE_ENDERECO": {
        "DADOS": [{
          "ENDERECO": "string",
          "NUMERO": "string",
          "COMPLEMENTO": "string",
          "BAIRRO": "string",
          "CIDADE": "string",
          "CEP": "string",
          "UF": "string"
        }]
      },
      "SOMENTE_TELEFONE": {
        "DADOS": [{
          "DDD": "string",
          "NUM_TELEFONE": "string",
          "TIPO_TELEFONE": "MOVEL|FIXO"
        }]
      },
      "EMAILS": {
        "INFOEMAILS": [{
          "ENDERECO": "string"
        }]
      },
      "PARTICIPACAO_EM_EMPRESAS": {
        "QUANTIDADE_OCORRENCIAS": 0,
        "OCORRENCIAS": [{
          "CNPJ": "string",
          "RAZAO_SOCIAL": "string",
          "PARTICIPANTE_CARGO": "string",
          "PARTICIPANTE_ENTRADA": "DD/MM/YYYY"
        }]
      },
      "PARENTES": {
        "INFOCONTATOS": [{
          "NOME": "string",
          "DOCUMENTO": "string",
          "RELACAO": "Mãe|Pai|etc"
        }]
      },
      "INFORMACOES_ALERTAS_RESTRICOES": {
        "QUANTIDADE_OCORRENCIA": 0,
        "OCORRENCIAS": []
      }
    }
  }
}
```

## Histórico de Endpoints

| Endpoint | Status | Notas |
|----------|--------|-------|
| `r-cpf-completo` | **NÃO USAR** | Créditos separados, esgotam independentemente. Formato `dados.data.cadastralPF` (lowercase). |
| `ic-cpf-completo` | **ATIVO** | Saldo geral. Formato `dados.CREDCADASTRAL` (UPPERCASE). Similar ao `ic-dossie-juridico`. |
