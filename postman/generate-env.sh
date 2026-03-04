#!/bin/bash
# Gera o environment do Postman com as chaves reais do .env.local

cd "$(dirname "$0")/.."
source .env.local

cat > postman/eopix-env.postman_environment.json << EOF
{
  "id": "eopix-env",
  "name": "EOPIX Environment",
  "values": [
    {
      "key": "SERPER_API_KEY",
      "value": "${SERPER_API_KEY}",
      "type": "secret",
      "enabled": true
    },
    {
      "key": "APIFULL_API_KEY",
      "value": "${APIFULL_API_KEY}",
      "type": "secret",
      "enabled": true
    },
    {
      "key": "TEST_CPF",
      "value": "92615155253",
      "type": "default",
      "enabled": true
    },
    {
      "key": "TEST_CNPJ",
      "value": "38235301000177",
      "type": "default",
      "enabled": true
    },
    {
      "key": "TEST_NAME",
      "value": "LUANA",
      "type": "default",
      "enabled": true
    }
  ],
  "_postman_variable_scope": "environment"
}
EOF

echo "Environment gerado com sucesso!"
