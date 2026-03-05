# CPF Completo (`ic-cpf-completo`)

Dados cadastrais, endereços, telefones, emails e empresas vinculadas.

## Request

```json
{
  "cpf": "{{cpf}}",
  "link": "ic-cpf-completo"
}
```

## Campos Disponíveis

| Seção | Campo | Path JSON | Tipo |
|-------|-------|-----------|------|
| **Dados Pessoais** | Nome | `dados.data.cadastralPF.dadosCadastrais.nome` | string |
| | CPF | `dados.data.cadastralPF.dadosCadastrais.cpf` | string |
| | Data Nascimento | `dados.data.cadastralPF.dadosCadastrais.dataNascimento` | string |
| | Nome da Mãe | `dados.data.cadastralPF.dadosCadastrais.nomeMae` | string |
| | Sexo | `dados.data.cadastralPF.dadosCadastrais.sexo` | string |
| **Endereços** | Logradouro | `dados.data.cadastralPF.enderecos[].logradouro` | string |
| | Número | `dados.data.cadastralPF.enderecos[].numero` | string |
| | Complemento | `dados.data.cadastralPF.enderecos[].complemento` | string |
| | Bairro | `dados.data.cadastralPF.enderecos[].bairro` | string |
| | Cidade | `dados.data.cadastralPF.enderecos[].cidade` | string |
| | CEP | `dados.data.cadastralPF.enderecos[].cep` | string |
| | UF | `dados.data.cadastralPF.enderecos[].uf` | string |
| **Telefones** | DDD | `dados.data.cadastralPF.telefones[].ddd` | string |
| | Número | `dados.data.cadastralPF.telefones[].numero` | string |
| | Tipo | `dados.data.cadastralPF.telefones[].tipo` | string |
| **Emails** | Email | `dados.data.cadastralPF.emails[].email` | string |
| **Empresas** | CNPJ | `dados.data.participacaoEmEmpresas.participacaoEmEmpresas[].cnpj` | string |
| | Nome Empresa | `dados.data.participacaoEmEmpresas.participacaoEmEmpresas[].empresa` | string |

## Estrutura da Resposta

```json
{
  "status": "sucesso",
  "dados": {
    "status": "success",
    "data": {
      "cadastralPF": {
        "statusRetorno": 1,
        "dadosCadastrais": {
          "nome": "string",
          "cpf": "string",
          "dataNascimento": "DD/MM/YYYY",
          "nomeMae": "string",
          "sexo": "Masculino|Feminino"
        },
        "enderecos": [{
          "logradouro": "string",
          "numero": "string",
          "complemento": "string",
          "bairro": "string",
          "cidade": "string",
          "cep": "string",
          "uf": "string"
        }],
        "telefones": [{
          "ddd": "string",
          "numero": "string",
          "tipo": "TELEFONE MÓVEL|TELEFONE RESIDENCIAL"
        }],
        "emails": [{
          "email": "string"
        }]
      },
      "participacaoEmEmpresas": {
        "participacaoEmEmpresas": [{
          "cnpj": "string",
          "empresa": "string"
        }]
      }
    }
  }
}
```
