import { config } from 'dotenv'
// Carregar .env.local primeiro (padrao Next.js), depois .env
config({ path: '.env.local' })
config({ path: '.env' })

import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',

  migrations: {
    path: 'prisma/migrations',
  },

  datasource: {
    url: env('DATABASE_URL'),
  },

  migrate: {
    url: env('DIRECT_URL'),
  },
})
