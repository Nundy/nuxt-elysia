import fs from 'node:fs'
import { defineNuxtModule, createResolver, addServerPlugin, addPlugin, addTemplate, addTypeTemplate } from '@nuxt/kit'
import ejs from 'ejs'
import { name, version } from '../package.json'

/**
 * 独立的API服务的路径配置选项
 */
export interface PathOptions {
  /** API服务的主机地址，例如 'http://localhost' */
  host: string
  /** API服务的端口，例如 4000 */
  port: number
  /** API路径前缀，例如 '_api' */
  prefix: string
  /** 是否自动启动独立的API服务 */
  isStart?: boolean
}

export interface ModuleOptions {
  /**
   * Specifies the module that exports the Elysia app factory function.
   *
   * The default value `~~/api` is a Nuxt default alias for `/api` path in
   * the Nuxt project root. This alias may resolve to `<root>/api.ts` or
   * `<root>/api/index.ts`.
   *
   * Default: `~~/api`
   */
  module: string
  /**
   * Specifies the path to mount the Elysia app.
   *
   * 可以是以下两种形式：
   * 1. 字符串形式（单服务）：例如 '_api'，表示将Elysia挂载到Nitro服务器上
   * 2. 对象形式（多服务,分离）：{host, port, prefix, isStart}，表示Elysia作为独立服务，Elysia挂载到Nitro服务器上，可完全发挥出Elysia的性能
   *
   * Set to empty string (`''`) to disable mounting the Elysia app.
   *
   * Default: `/_api`
   */
  path: string | PathOptions
  /**
   * Whether to enable Eden Treaty plugin.
   *
   * Default: `true`
   */
  treaty: boolean
  /**
   * When mounting the Elysia app in Bun, Elysia handler that returns a string
   * will not have any `Content-Type` header:
   *
   * ```ts
   * const app = new Elysia()
   *   .get('/plaintext', () => 'Hello world!)
   * ```
   *
   * This option adds a transform to add `Content-Type: text/plain`.
   *
   * Default: `true`
   */
  fixBunPlainTextResponse: boolean
  /**
   * Provides the list of request headers to be sent to the Elysia app on
   * server-side requests.
   *
   * The default value is `['Cookie']`, which will pass all cookies sent by
   * the browser to Elysia app. Set to `false` to disable passing any headers.
   *
   * Default: `['Cookie']`
   */
  treatyRequestHeaders: string[] | false
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name,
    version,
    configKey: 'nuxtElysia',
  },
  defaults: {
    module: '~~/api',
    path: '/_api',
    treaty: true,
    fixBunPlainTextResponse: true,
    treatyRequestHeaders: ['Cookie'],
  },
  async setup(_options, _nuxt) {
    const resolver = createResolver(import.meta.url)

    function renderTemplate<T extends ejs.Data>(name: string, data: T) {
      const templatePath = resolver.resolve(`./runtime/templates/${name}.ejs`)
      const template = fs.readFileSync(templatePath, { encoding: 'utf-8' })
      return ejs.render(template, data)
    }

    // Register types
    addTypeTemplate({
      filename: './nuxt-elysia/types.d.ts',
      getContents: () => renderTemplate('types', {
        module: _options.module,
      }),
      write: true,
    })

    // Register server plugin
    {
      const tmpl = addTemplate({
        filename: './nuxt-elysia/server-plugin.ts',
        getContents: () => renderTemplate('server-plugin', {
          module: _options.module,
          path: _options.path,
          fixBunPlainTextResponse: _options.fixBunPlainTextResponse,
        }),
        write: true,
      })

      addServerPlugin(tmpl.dst)
    }

    // Register client plugin
    if ((_options.path && typeof _options.path === 'string')
      || (typeof _options.path === 'object' && _options.path.prefix)
      || (_options.path && _options.treaty)) {
      const tmpl = addTemplate({
        filename: './nuxt-elysia/client-plugin.ts',
        getContents: () => renderTemplate('client-plugin', {
          path: _options.path,
          requestHeaders: _options.treatyRequestHeaders,
        }),
        write: true,
      })

      addPlugin(tmpl.dst)
    }
  },
})
