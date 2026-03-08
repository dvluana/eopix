---
title: "CNPJ Financeiro"
---

Score de crédito, protestos e pendências financeiras para CNPJ.

**Nota:** A variante CPF está documentada em `cpf-financeiro.md`.

## Request

```json
{
  "document": "{{cpf_ou_cnpj}}",
  "link": "srs-premium"
}
```

## Campos Disponíveis — CNPJ

| Seção | Campo | Path JSON | Tipo |
|-------|-------|-----------|------|
| **Score** | Score | `dados.data.defineRisco.consultaCredito.score.score` | string |
| | Probabilidade | `dados.data.defineRisco.consultaCredito.score.probabilidade` | string |
| | Mensagem | `dados.data.defineRisco.consultaCredito.score.mensagem` | string |
| **Dados Cadastrais** | Razão Social | `dados.data.defineRisco.consultaCredito.dadosCadastrais.razaoSocial` | string |
| | Nome Fantasia | `dados.data.defineRisco.consultaCredito.dadosCadastrais.nomeFantasia` | string |
| | CNPJ | `dados.data.defineRisco.consultaCredito.dadosCadastrais.cnpj` | string |
| | Situação | `dados.data.defineRisco.consultaCredito.dadosCadastrais.situacao` | string |
| | Natureza Jurídica | `dados.data.defineRisco.consultaCredito.dadosCadastrais.naturezaJuridica` | string |
| | Ramo Atividade | `dados.data.defineRisco.consultaCredito.dadosCadastrais.ramoAtividade` | string |
| | Data Fundação | `dados.data.defineRisco.consultaCredito.dadosCadastrais.dataFundacao` | string |
| | Endereço | `dados.data.defineRisco.consultaCredito.dadosCadastrais.endereco` | string |
| | Bairro | `dados.data.defineRisco.consultaCredito.dadosCadastrais.bairro` | string |
| | Cidade | `dados.data.defineRisco.consultaCredito.dadosCadastrais.cidade` | string |
| | UF | `dados.data.defineRisco.consultaCredito.dadosCadastrais.uf` | string |
| | CEP | `dados.data.defineRisco.consultaCredito.dadosCadastrais.cep` | string |
| **Resumo Consulta** | Protestos Qtd | `dados.data.defineRisco.consultaCredito.resumoConsulta.protestos.quantidadeTotal` | number |
| | Protestos Valor | `dados.data.defineRisco.consultaCredito.resumoConsulta.protestos.valorTotal` | number |
| | Pendências Qtd | `dados.data.defineRisco.consultaCredito.resumoConsulta.pendenciasFinanceiras.quantidadeTotal` | number |
| | Pendências Valor | `dados.data.defineRisco.consultaCredito.resumoConsulta.pendenciasFinanceiras.valorTotal` | number |
| | Cheques SF Qtd | `dados.data.defineRisco.consultaCredito.resumoConsulta.chequesSemFundo.quantidadeTotal` | number |
| | Cheques SF Valor | `dados.data.defineRisco.consultaCredito.resumoConsulta.chequesSemFundo.valorTotal` | number |
| **Score Rating** | Score | `dados.data.scoreRating.score` | number |
| | Recomendação | `dados.data.scoreRating.recomendacao` | string |

## Estrutura da Resposta — CNPJ

```json
{
  "status": "sucesso",
  "dados": {
    "status": "success",
    "data": {
      "defineRisco": {
        "statusRetorno": 1,
        "consultaCredito": {
          "resumoConsulta": {
            "protestos": { "valorTotal": 0, "quantidadeTotal": 0 },
            "pendenciasFinanceiras": { "valorTotal": 0, "quantidadeTotal": 0 },
            "chequesSemFundo": { "valorTotal": 0, "quantidadeTotal": 0 }
          },
          "dadosCadastrais": {
            "razaoSocial": "string",
            "nomeFantasia": "string",
            "cnpj": "string",
            "situacao": "Ativo",
            "naturezaJuridica": "string",
            "ramoAtividade": "string",
            "dataFundacao": "DD/MM/YYYY",
            "endereco": "string",
            "bairro": "string",
            "cidade": "string",
            "uf": "string",
            "cep": "string"
          },
          "score": {
            "score": "string",
            "probabilidade": "string",
            "mensagem": "string"
          },
          "protestos": [],
          "pendenciasFinanceiras": [],
          "chequesSemFundo": []
        }
      },
      "scoreRating": {
        "score": 0,
        "recomendacao": "APROVAR_CAUTELA|APROVAR|NEGAR"
      }
    }
  }
}
```
