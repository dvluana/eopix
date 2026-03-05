# Serasa Premium — Variante CPF (`srs-premium`)

Score de crédito, protestos e pendências financeiras para CPF.

**Nota:** A variante CNPJ está documentada em `cnpj-financeiro.md`.

## Request

```json
{
  "document": "{{cpf_ou_cnpj}}",
  "link": "srs-premium"
}
```

## Campos Disponíveis — CPF

| Seção | Campo | Path JSON | Tipo |
|-------|-------|-----------|------|
| **Dados Cadastrais** | Nome | `dados.data.serasaPremium.consultaCredito.dadosCadastrais.nome` | string |
| | CPF | `dados.data.serasaPremium.consultaCredito.dadosCadastrais.cpf` | string |
| | Data Nascimento | `dados.data.serasaPremium.consultaCredito.dadosCadastrais.dataNascimento` | string |
| | Nome Mãe | `dados.data.serasaPremium.consultaCredito.dadosCadastrais.nomeMae` | string |
| | Situação | `dados.data.serasaPremium.consultaCredito.dadosCadastrais.situacao` | string |
| **Sócios** | Empresa | `dados.data.serasaPremium.consultaCredito.socios[].empresa` | string |
| | CNPJ | `dados.data.serasaPremium.consultaCredito.socios[].cnpj` | string |
| | Participação % | `dados.data.serasaPremium.consultaCredito.socios[].participacaoEmPorcentagem` | string |
| | UF | `dados.data.serasaPremium.consultaCredito.socios[].uf` | string |
| | Data Entrada | `dados.data.serasaPremium.consultaCredito.socios[].dataEntrada` | string |
| **Pendências** | Data | `dados.data.serasaPremium.consultaCredito.pendenciasFinanceiras[].data` | string |
| | Valor | `dados.data.serasaPremium.consultaCredito.pendenciasFinanceiras[].valor` | string |
| | Informante | `dados.data.serasaPremium.consultaCredito.pendenciasFinanceiras[].informante` | string |
| | Tipo | `dados.data.serasaPremium.consultaCredito.pendenciasFinanceiras[].tipoPendencia` | string |
| | Contrato | `dados.data.serasaPremium.consultaCredito.pendenciasFinanceiras[].contrato` | string |
| **Protestos** | Data | `dados.data.serasaPremium.consultaCredito.protestos[].data` | string |
| | Valor | `dados.data.serasaPremium.consultaCredito.protestos[].valor` | string |
| | Cartório | `dados.data.serasaPremium.consultaCredito.protestos[].cartorio` | string |
| | Cidade | `dados.data.serasaPremium.consultaCredito.protestos[].cidade` | string |
| **Score** | Score | `dados.data.serasaPremium.consultaCredito.score.score` | string |
| | Probabilidade | `dados.data.serasaPremium.consultaCredito.score.probabilidade` | string |
| | Mensagem | `dados.data.serasaPremium.consultaCredito.score.mensagem` | string |

## Estrutura da Resposta — CPF

```json
{
  "status": "sucesso",
  "dados": {
    "status": "success",
    "data": {
      "serasaPremium": {
        "statusRetorno": 1,
        "consultaCredito": {
          "dadosCadastrais": {
            "nome": "string",
            "cpf": "string",
            "dataNascimento": "DD/MM/YYYY",
            "nomeMae": "string",
            "situacao": "REGULAR"
          },
          "socios": [{
            "empresa": "string",
            "cnpj": "string",
            "participacaoEmPorcentagem": "string",
            "uf": "string",
            "dataEntrada": "DD/MM/YYYY"
          }],
          "pendenciasFinanceiras": [{
            "data": "DD/MM/YYYY",
            "valor": "string",
            "informante": "string",
            "tipoPendencia": "DEVEDOR",
            "contrato": "string"
          }],
          "protestos": [{
            "data": "DD/MM/YYYY",
            "valor": "string",
            "cartorio": "string",
            "cidade": "string"
          }],
          "score": {
            "score": "string",
            "probabilidade": "string",
            "mensagem": "string"
          }
        }
      }
    }
  }
}
```
