# APIFull — Contratos de API (EOPIX)

> Fonte oficial de documentação de APIs externas usadas no EOPIX.
> Última revisão: 27/02/2026.

## Regras De Governança

- Este arquivo e seus sibling são a fonte de verdade para contratos de API.
- Postman é artefato auxiliar (não canônico).
- Toda mudança de endpoint/payload/parse deve ser atualizada aqui no mesmo commit.

## Status No EOPIX (Código Atual)

| Tipo | Endpoints Utilizados |
|------|---|
| **CPF** | `r-cpf-completo` + `r-acoes-e-processos-judiciais` + `srs-premium` |
| **CNPJ** | `ic-dossie-juridico` + `srs-premium` |

**Nota:** O endpoint `cnpj` está documentado em `cnpj-dossie.md` para referência, mas **não é usado no pipeline principal atual**.

## Visão Geral dos Endpoints

| Endpoint | Link | Parâmetro | Arquivo | Descrição |
|----------|------|-----------|---------|-----------|
| CPF Completo | `r-cpf-completo` | `cpf` | `cpf-cadastral.md` | Dados cadastrais, endereços, telefones, emails e empresas |
| Ações e Processos | `r-acoes-e-processos-judiciais` | `cpf` | `cpf-processos.md` | Processos judiciais em todos os tribunais |
| CNPJ Completo | `cnpj` | `cnpj` | `cnpj-dossie.md` | Dados da empresa, sócios, atividades e regime tributário *(não usado)* |
| Dossiê Jurídico | `ic-dossie-juridico` | `document` | `cnpj-dossie.md` | Relatório jurídico empresarial completo |
| Serasa Premium (CPF) | `srs-premium` | `document` | `cpf-financeiro.md` | Score de crédito, protestos e pendências |
| Serasa Premium (CNPJ) | `srs-premium` | `document` | `cnpj-financeiro.md` | Score de crédito, protestos e pendências |

## Notas de Uso

### Exemplo de Request (todos os endpoints)

```javascript
const response = await fetch('https://api.apifull.com.br/consulta', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer {{token}}'
  },
  body: JSON.stringify({
    cpf: '12345678900',        // ou cnpj ou document
    link: 'r-cpf-completo'    // link da API desejada
  })
});
```

### Status de Retorno

| Status | Significado |
|--------|-------------|
| `"sucesso"` | Consulta realizada com sucesso |
| `statusRetorno: 1` | Dados encontrados |
| `statusRetorno: 0` | Sem dados para o documento |

### Tipos de Dados Comuns

| Tipo | Formato | Exemplo |
|------|---------|---------|
| CPF | 11 dígitos | `"12345678900"` |
| CNPJ | 14 dígitos | `"12345678000199"` |
| Data | DD/MM/YYYY | `"25/02/1981"` |
| DateTime | YYYY-MM-DD HH:mm:ss | `"2025-01-15 00:00:00"` |
| Moeda | String | `"R$"` |
| Valor | Number ou String | `9505.24` ou `"4305"` |
