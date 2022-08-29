import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
import vuetify from 'vite-plugin-vuetify'
//NEXT import vueI18n from '@intlify/vite-plugin-vue-i18n'


// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  assetsInclude: [ './public/.wellknown/**' ],
  plugins: [
		vue(),
		vuetify({ autoImport: true }),
    //NEXT vueI18n({
      //NEXT include: path.resolve(__dirname, './src/locales/**'),
    //NEXT }),
  ],
})
