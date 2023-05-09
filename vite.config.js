import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { default as EbtConfig } from './ebt-config.mjs'

// https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
import vuetify from 'vite-plugin-vuetify'


// https://vitejs.dev/config/
export default defineConfig({
  base: EbtConfig.basePath,
  assetsInclude: [ './public/.wellknown/**' ],
  plugins: [
		vue(),
		vuetify({ autoImport: true }),
  ],
})
