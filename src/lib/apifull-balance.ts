interface BalanceResult {
  balance: number
  sufficient: boolean
}

/**
 * Check APIFull account balance.
 * Returns { sufficient: true } if balance >= threshold or if check fails (fail open).
 * Threshold: env APIFULL_MIN_BALANCE or default 20 (covers CNPJ worst case R$18.72).
 */
export async function checkApifullBalance(): Promise<BalanceResult> {
  const apiKey = process.env.APIFULL_API_KEY
  if (!apiKey) {
    return { balance: -1, sufficient: true }
  }

  const threshold = parseFloat(process.env.APIFULL_MIN_BALANCE || '20')

  try {
    const res = await fetch('https://api.apifull.com.br/api/get-balance', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'EOPIX/1.0',
      },
    })

    if (!res.ok) {
      console.warn(`APIFull balance check failed: HTTP ${res.status}`)
      return { balance: -1, sufficient: true }
    }

    const data = await res.json()
    const balance = typeof data.dados?.Saldo === 'number'
      ? data.dados.Saldo
      : parseFloat(data.dados?.Saldo || '0')

    return { balance, sufficient: balance >= threshold }
  } catch (err) {
    console.warn('APIFull balance check error:', err)
    return { balance: -1, sufficient: true }
  }
}
