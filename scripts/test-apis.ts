/**
 * Script para testar todas as APIs externas
 * Executa: npx tsx scripts/test-apis.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

// Carrega variáveis de ambiente
config({ path: resolve(process.cwd(), ".env.local") });

interface TestResult {
  api: string;
  status: "success" | "error" | "skipped";
  message: string;
  data?: unknown;
}

const results: TestResult[] = [];

async function testBrasilAPI(): Promise<TestResult> {
  console.log("\n🧪 Testando BrasilAPI...");
  try {
    const response = await fetch(
      "https://brasilapi.com.br/api/cnpj/v1/00000000000191",
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; EOPIX/1.0)",
        },
      }
    );
    const data = await response.json();
    if (response.ok && data.razao_social) {
      return {
        api: "BrasilAPI",
        status: "success",
        message: `Empresa: ${data.razao_social}`,
        data: { cnpj: data.cnpj, razao_social: data.razao_social },
      };
    }
    return {
      api: "BrasilAPI",
      status: "error",
      message: `HTTP ${response.status}`,
      data,
    };
  } catch (error) {
    return {
      api: "BrasilAPI",
      status: "error",
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

async function testDatajud(): Promise<TestResult> {
  console.log("\n🧪 Testando Datajud...");
  try {
    const response = await fetch(
      "https://api-publica.datajud.cnj.jus.br/api_publica_tjsp/_search",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "APIKey cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==",
        },
        body: JSON.stringify({ size: 1 }),
      }
    );
    const data = await response.json();
    if (response.ok && data.hits) {
      return {
        api: "Datajud",
        status: "success",
        message: `Total de processos disponíveis: ${data.hits.total.value}+`,
        data: { total: data.hits.total },
      };
    }
    return {
      api: "Datajud",
      status: "error",
      message: `HTTP ${response.status}`,
      data,
    };
  } catch (error) {
    return {
      api: "Datajud",
      status: "error",
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

async function testAsaas(): Promise<TestResult> {
  console.log("\n🧪 Testando ASAAS...");
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) {
    return { api: "ASAAS", status: "skipped", message: "API key não configurada" };
  }

  try {
    // Testa endpoint de customers do sandbox
    const response = await fetch(
      "https://sandbox.asaas.com/api/v3/customers?limit=1",
      {
        headers: {
          accept: "application/json",
          access_token: apiKey,
        },
      }
    );
    const data = await response.json();
    if (response.ok) {
      return {
        api: "ASAAS",
        status: "success",
        message: `Sandbox OK - ${data.totalCount ?? 0} customers encontrados`,
        data: { totalCount: data.totalCount },
      };
    }
    return {
      api: "ASAAS",
      status: "error",
      message: data.errors?.[0]?.description || `HTTP ${response.status}`,
      data,
    };
  } catch (error) {
    return {
      api: "ASAAS",
      status: "error",
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

async function testAPIFull(): Promise<TestResult> {
  console.log("\n🧪 Testando APIFull...");
  const apiKey = process.env.APIFULL_API_KEY;
  if (!apiKey) {
    return { api: "APIFull", status: "skipped", message: "API key não configurada" };
  }

  try {
    // Testa com CPF de exemplo (inválido para verificar se a API responde)
    const response = await fetch(
      "https://api.apifull.com.br/v2/cpf/00000000000",
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    const data = await response.json();
    // Mesmo com erro de CPF inválido, a API está respondendo
    if (response.status === 200 || response.status === 400 || response.status === 404) {
      return {
        api: "APIFull",
        status: "success",
        message: `API respondendo - ${data.message || "OK"}`,
        data,
      };
    }
    if (response.status === 401 || response.status === 403) {
      return {
        api: "APIFull",
        status: "error",
        message: "Token inválido ou expirado",
        data,
      };
    }
    return {
      api: "APIFull",
      status: "error",
      message: `HTTP ${response.status}`,
      data,
    };
  } catch (error) {
    return {
      api: "APIFull",
      status: "error",
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

async function testEscavador(): Promise<TestResult> {
  console.log("\n🧪 Testando Escavador...");
  const apiKey = process.env.ESCAVADOR_API_KEY;
  if (!apiKey || apiKey.endsWith("...")) {
    return {
      api: "Escavador",
      status: "skipped",
      message: "API key incompleta (truncada com ...)",
    };
  }

  try {
    // Testa endpoint de monitoramentos (v1)
    const response = await fetch(
      "https://api.escavador.com/api/v1/monitoramentos-tribunal",
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
        redirect: "follow",
      }
    );

    // Tenta parsear como JSON
    const text = await response.text();
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(text);
    } catch {
      return {
        api: "Escavador",
        status: "error",
        message: "Resposta não é JSON - verifique configuração da conta",
      };
    }

    if (response.ok) {
      return {
        api: "Escavador",
        status: "success",
        message: "API autenticada com sucesso",
        data,
      };
    }
    if (data.error === "Unauthenticated.") {
      return {
        api: "Escavador",
        status: "error",
        message: "Token não aceito - verifique configuração no painel Escavador",
      };
    }
    return {
      api: "Escavador",
      status: "error",
      message: `HTTP ${response.status}: ${data.error || data.message || "Erro"}`,
      data,
    };
  } catch (error) {
    return {
      api: "Escavador",
      status: "error",
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

async function testSerper(): Promise<TestResult> {
  console.log("\n🧪 Testando Serper...");
  const apiKey = process.env.SERPER_API_KEY;

  if (!apiKey) {
    return {
      api: "Serper",
      status: "skipped",
      message: "API key não configurada",
    };
  }

  try {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: "teste", num: 1 }),
    });
    const data = await response.json();
    if (response.ok && data.organic) {
      return {
        api: "Serper",
        status: "success",
        message: `${data.organic.length} resultados encontrados`,
        data: { firstResult: data.organic[0]?.title },
      };
    }
    return {
      api: "Serper",
      status: "error",
      message: data.message || `HTTP ${response.status}`,
      data,
    };
  } catch (error) {
    return {
      api: "Serper",
      status: "error",
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

async function testOpenAI(): Promise<TestResult> {
  console.log("\n🧪 Testando OpenAI...");
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { api: "OpenAI", status: "skipped", message: "API key não configurada" };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Diga apenas: OK" }],
        max_tokens: 10,
      }),
    });
    const data = await response.json();
    if (response.ok && data.choices?.[0]?.message?.content) {
      return {
        api: "OpenAI",
        status: "success",
        message: `Resposta: "${data.choices[0].message.content.trim()}"`,
        data: { model: data.model, usage: data.usage },
      };
    }
    if (data.error) {
      return {
        api: "OpenAI",
        status: "error",
        message: data.error.message || `HTTP ${response.status}`,
        data: data.error,
      };
    }
    return {
      api: "OpenAI",
      status: "error",
      message: `HTTP ${response.status}`,
      data,
    };
  } catch (error) {
    return {
      api: "OpenAI",
      status: "error",
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("           TESTE DE APIs EXTERNAS - EOPIX");
  console.log("═══════════════════════════════════════════════════════════");

  // Executa todos os testes
  results.push(await testBrasilAPI());
  results.push(await testDatajud());
  results.push(await testAsaas());
  results.push(await testAPIFull());
  results.push(await testEscavador());
  results.push(await testSerper());
  results.push(await testOpenAI());

  // Exibe resumo
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("                      RESUMO");
  console.log("═══════════════════════════════════════════════════════════");

  for (const result of results) {
    const icon =
      result.status === "success"
        ? "✅"
        : result.status === "error"
          ? "❌"
          : "⏭️";
    console.log(`${icon} ${result.api.padEnd(15)} ${result.message}`);
  }

  const successCount = results.filter((r) => r.status === "success").length;
  const errorCount = results.filter((r) => r.status === "error").length;
  const skippedCount = results.filter((r) => r.status === "skipped").length;

  console.log("\n───────────────────────────────────────────────────────────");
  console.log(
    `Total: ${successCount} ✅ sucesso | ${errorCount} ❌ erro | ${skippedCount} ⏭️ pulado`
  );
  console.log("═══════════════════════════════════════════════════════════\n");

  // Exit com erro se algum teste falhou
  if (errorCount > 0) {
    process.exit(1);
  }
}

main();
