// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devServer: {
    port: 3003,
  },
  devtools: { enabled: false },
  modules: [
    '@nuxt/ui',
    '@nuxtjs/color-mode',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@artmizu/nuxt-prometheus',
    'nuxt3-winston-log',
  ],

  nuxt3WinstonLog: {
    maxSize: "1024m",
    maxFiles: "14d",
  },

  // Component auto-import configuration
  components: [
    {
      path: '~/components',
      pathPrefix: true,
    },
    {
      path: '~/components/layout',
      pathPrefix: true,
    },
    {
      path: '~/components/ui-library',
      pathPrefix: true,
    }
  ],
  colorMode: {
    classSuffix: ''
  },
  // Top-level transpile configuration for Nuxt 3
  build: {
    transpile: ['@jridgewell/sourcemap-codec', 'magic-string']
  },
  // Vite configuration for StackBlitz/WebContainer compatibility
  vite: {
    plugins: [
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@deliveroo/pdf-core': resolve(__dirname, '../tms-frontend/packages/pdf-core/src/index.ts'),
      },
    },
    optimizeDeps: {
      include: ['@jridgewell/sourcemap-codec'],
      force: true
    },
    ssr: {
      noExternal: ['@jridgewell/sourcemap-codec', 'magic-string']
    },
  },

  css: [
    '~/assets/css/main.css',
    'leaflet/dist/leaflet.css'
  ],
  app: {
    head: {
      title: 'Deliveroo Logistics - European Transportation & Warehousing',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Professional logistics services across Europe. Road transportation and warehousing solutions connecting Poland with Europe.' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap' }
      ]
    }
  },

})
