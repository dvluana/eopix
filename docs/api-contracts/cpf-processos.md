---
title: "CPF Processos"
---

Processos judiciais em todos os tribunais.

## Request

```json
{
  "cpf": "{{cpf}}",
  "link": "r-acoes-e-processos-judiciais"
}
```

## Campos Disponíveis

| Seção | Campo | Path JSON | Tipo |
|-------|-------|-----------|------|
| **Identificação** | Número Único | `dados.data.acoesProcessos.acoes.processos[].numeroProcessoUnico` | string |
| | UF | `dados.data.acoesProcessos.acoes.processos[].uf` | string |
| | Tribunal | `dados.data.acoesProcessos.acoes.processos[].tribunal` | string |
| | Sistema | `dados.data.acoesProcessos.acoes.processos[].sistema` | string |
| | Segmento | `dados.data.acoesProcessos.acoes.processos[].segmento` | string |
| | Grau | `dados.data.acoesProcessos.acoes.processos[].grauProcesso` | string |
| | URL | `dados.data.acoesProcessos.acoes.processos[].urlProcesso` | string |
| **Status** | Ramo do Direito | `dados.data.acoesProcessos.acoes.processos[].statusPj.ramoDireito` | string |
| | Status Processo | `dados.data.acoesProcessos.acoes.processos[].statusPj.statusProcesso` | string |
| | Data Arquivamento | `dados.data.acoesProcessos.acoes.processos[].statusPj.dataArquivamento` | string |
| **Datas** | Data Autuação | `dados.data.acoesProcessos.acoes.processos[].dataAutuacao` | string |
| | Data Distribuição | `dados.data.acoesProcessos.acoes.processos[].dataDistribuicao` | string |
| | Data Processamento | `dados.data.acoesProcessos.acoes.processos[].dataProcessamento` | string |
| **Classe/Assunto** | Classe | `dados.data.acoesProcessos.acoes.processos[].classeProcessual.nome` | string |
| | Código CNJ | `dados.data.acoesProcessos.acoes.processos[].classeProcessual.codigoCnj` | string |
| | Assuntos | `dados.data.acoesProcessos.acoes.processos[].assuntosCNJ[].titulo` | string |
| | Assunto Principal | `dados.data.acoesProcessos.acoes.processos[].assuntosCNJ[].principal` | boolean |
| **Valor** | Moeda | `dados.data.acoesProcessos.acoes.processos[].valorCausa.moeda` | string |
| | Valor | `dados.data.acoesProcessos.acoes.processos[].valorCausa.valor` | number |
| **Partes** | Nome | `dados.data.acoesProcessos.acoes.processos[].partes[].nome` | string |
| | CPF | `dados.data.acoesProcessos.acoes.processos[].partes[].cpf` | string |
| | CNPJ | `dados.data.acoesProcessos.acoes.processos[].partes[].cnpj` | string |
| | Polo | `dados.data.acoesProcessos.acoes.processos[].partes[].polo` | string |
| | Tipo | `dados.data.acoesProcessos.acoes.processos[].partes[].tipo` | string |
| **Advogados** | Nome | `dados.data.acoesProcessos.acoes.processos[].partes[].advogados[].nome` | string |
| | CPF | `dados.data.acoesProcessos.acoes.processos[].partes[].advogados[].cpf` | string |
| | OAB Número | `dados.data.acoesProcessos.acoes.processos[].partes[].advogados[].oab.numero` | string |
| | OAB UF | `dados.data.acoesProcessos.acoes.processos[].partes[].advogados[].oab.uf` | string |
| **Julgador** | Órgão Julgador | `dados.data.acoesProcessos.acoes.processos[].orgaoJulgador` | string |
| | Juiz | `dados.data.acoesProcessos.acoes.processos[].juiz` | string |
| | Relator | `dados.data.acoesProcessos.acoes.processos[].relator` | string |
| **Flags** | Segredo Justiça | `dados.data.acoesProcessos.acoes.processos[].segredoJustica` | boolean |
| | Justiça Gratuita | `dados.data.acoesProcessos.acoes.processos[].justicaGratuita` | boolean |
| | Digital | `dados.data.acoesProcessos.acoes.processos[].processoDigital` | boolean |
| | Prioritário | `dados.data.acoesProcessos.acoes.processos[].prioritario` | boolean |

## Estrutura da Resposta

```json
{
  "status": "sucesso",
  "dados": {
    "status": "success",
    "data": {
      "acoesProcessos": {
        "acoes": {
          "id": "string",
          "processos": [{
            "uf": "string",
            "tribunal": "TJ-SC|TRF-4|etc",
            "sistema": "string",
            "segmento": "JUSTICA ESTADUAL|JUSTICA FEDERAL|etc",
            "grauProcesso": "1|2",
            "numeroProcessoUnico": "string",
            "urlProcesso": "string",
            "statusPj": {
              "ramoDireito": "DIREITO CIVIL|DIREITO PENAL|etc",
              "statusProcesso": "EM TRAMITACAO|ARQUIVAMENTO DEFINITIVO",
              "dataArquivamento": "YYYY-MM-DD HH:mm:ss"
            },
            "dataAutuacao": "YYYY-MM-DD HH:mm:ss",
            "dataDistribuicao": "YYYY-MM-DD HH:mm:ss",
            "classeProcessual": {
              "nome": "string",
              "codigoCnj": "string"
            },
            "assuntosCNJ": [{
              "codigo": "string",
              "titulo": "string",
              "principal": true
            }],
            "valorCausa": {
              "moeda": "R$",
              "valor": 0
            },
            "partes": [{
              "nome": "string",
              "cpf": "string",
              "cnpj": "string",
              "polo": "ATIVO|PASSIVO|TERCEIRO INTERESSADO",
              "tipo": "AUTOR|REU|APELANTE|APELADO|etc",
              "advogados": [{
                "nome": "string",
                "cpf": "string",
                "oab": { "uf": "string", "numero": "string" },
                "tipo": "ADVOGADO|PROCURADOR"
              }]
            }],
            "juiz": "string",
            "relator": "string",
            "orgaoJulgador": "string",
            "segredoJustica": false,
            "justicaGratuita": false,
            "processoDigital": true,
            "prioritario": false
          }]
        }
      }
    }
  }
}
```
