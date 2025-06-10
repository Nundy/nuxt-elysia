#!/usr/bin/env bun

/**
 * Bun专用Elysia服务启动脚本
 */

import Elysia from 'elysia'
import apiService from './playground/api.ts'

const PORT = process.env.PORT || 4000

async function start() {
  try {
    const app = await apiService()
    const prefix = process.env.NUXT_ENV_ELYSIA_PREFIX || '/_api'
    const prefixApp = new Elysia({
      prefix,
    })
    prefixApp.use(app)

    prefixApp.listen(PORT, () => {
      console.log(`\n🦊 Elysia服务已启动: http://localhost:${PORT}${prefix}`)
      console.log(`📚 Swagger文档: http://localhost:${PORT}${prefix}/swagger`)
    })
  }
  catch (error) {
    console.error('启动服务时出错:', error)
    process.exit(1)
  }
}

start()
