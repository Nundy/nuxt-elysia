console.log(process.env.NUXT_ENV)
export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: { enabled: true },
  compatibilityDate: '2025-03-14',
  nuxtElysia: {
    path: process.env.NODE_ENV === 'production'
      ? {
          host: 'http://localhost',
          port: 4000,
          prefix: '/_api',
          isStart: true,
        }
      : '/_api',
  },
})
