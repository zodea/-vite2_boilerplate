import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'
import { ConfigEnv, loadEnv, UserConfigExport } from 'vite'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import { presetAttributify, presetUno } from 'unocss'
import { resolve } from 'path'
import { viteMockServe } from 'vite-plugin-mock'
import Components from 'unplugin-vue-components/vite'
import eslintPlugin from 'vite-plugin-eslint'
import styleImport from 'vite-plugin-style-import'
import Unocss from 'unocss/vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

function pathResolve(dir: string) {
  return resolve(process.cwd(), '.', dir)
}
// https://vitejs.dev/config/
export default ({ command, mode }: ConfigEnv): UserConfigExport => {
  const root = process.cwd()
  const env = loadEnv(mode, root)
  const isBuild = command === 'build'
  return {
    base: '/',
    resolve: {
      alias: [
        // /@/xxxx => src/xxxx
        {
          find: /\/@\//,
          replacement: pathResolve('src') + '/',
        },
        // /#/xxxx => types/xxxx
        {
          find: /\/#\//,
          replacement: pathResolve('types') + '/',
        },
      ],
    },
    server: {
      host: true,
      port: 3100,
      // Load proxy configuration from .env
      proxy: {},
    },
    esbuild: {
      pure: env.VITE_DROP_CONSOLE ? ['console.log', 'debugger'] : [],
    },
    build: {
      target: 'es2015',
      cssTarget: 'chrome80',
      outDir: 'dist',
      // minify: 'terser',
      /**
       * 当 minify=“minify:'terser'” 解开注释
       * Uncomment when minify="minify:'terser'"
       */
      // terserOptions: {
      //   compress: {
      //     keep_infinity: true,
      //     drop_console: VITE_DROP_CONSOLE,
      //   },
      // },
      // Turning off brotliSize display can slightly reduce packaging time
      brotliSize: false,
      chunkSizeWarningLimit: 2000,
    },
    // ant-design 系列配置的less项
    css: {
      preprocessorOptions: {
        less: {
          modifyVars: { hack: `true; @import (reference) "${resolve('src/design/config.less')}";` },
          javascriptEnabled: true,
        },
      },
    },
    plugins: [
      vue(),
      vueJsx(),
      eslintPlugin({
        fix: true,
      }),
      Unocss({
        presets: [presetAttributify({}), presetUno()],
        rules: [],
        shortcuts: {},
        theme: {},
      }),
      createSvgIconsPlugin({
        iconDirs: [pathResolve('src/assets/icons')],
        svgoOptions: isBuild && /**
         * 由于此处的图片由多个绘制路径组成，因此需要单独的配置压缩，可以在下面的链接测试具体的配置项
         * https://jakearchibald.github.io/svgomg/
         */ {
          plugins: [
            {
              name: 'preset-default',
              params: {
                overrides: {
                  collapseGroups: false,
                },
              },
            },
          ],
        },
        // default
        symbolId: 'icon-[dir]-[name]',
      }),
      Components({
        resolvers: [
          AntDesignVueResolver({
            importStyle: 'less',
          }),
        ],
        dts: true,
        include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
      }),
      styleImport({
        libs: [
          {
            libraryName: 'ant-design-vue',
            esModule: true,
            resolveStyle: (name) => {
              // 这里是无需额外引入样式文件的“子组件”列表
              const ignoreList = [
                'anchor-link',
                'sub-menu',
                'menu-item',
                'menu-item-group',
                'breadcrumb-item',
                'breadcrumb-separator',
                'form-item',
                'step',
                'select-option',
                'select-opt-group',
                'card-grid',
                'card-meta',
                'collapse-panel',
                'descriptions-item',
                'list-item',
                'list-item-meta',
                'table-column',
                'table-column-group',
                'tab-pane',
                'tab-content',
                'timeline-item',
                'tree-node',
                'skeleton-input',
                'skeleton-avatar',
                'skeleton-title',
                'skeleton-paragraph',
                'skeleton-image',
                'skeleton-button',
              ]
              // 这里是需要额外引入样式的子组件列表
              // 单独引入子组件时需引入组件样式，否则会在打包后导致子组件样式丢失
              const replaceList = {
                'typography-text': 'typography',
                'typography-title': 'typography',
                'typography-paragraph': 'typography',
                'typography-link': 'typography',
                'dropdown-button': 'dropdown',
                'input-password': 'input',
                'input-search': 'input',
                'input-group': 'input',
                'radio-group': 'radio',
                'checkbox-group': 'checkbox',
                'layout-sider': 'layout',
                'layout-content': 'layout',
                'layout-footer': 'layout',
                'layout-header': 'layout',
                'month-picker': 'date-picker',
              }

              return ignoreList.includes(name)
                ? ''
                : replaceList.hasOwnProperty(name)
                ? `ant-design-vue/es/${replaceList[name]}/style/index`
                : `ant-design-vue/es/${name}/style/index`
            },
          },
        ],
      }),
      viteMockServe({
        ignore: /^\_/,
        mockPath: 'mock',
        localEnabled: !isBuild,
        prodEnabled: isBuild,
        injectCode: `
          import { setupProdMockServer } from '../mock/_createProductionServer';

          setupProdMockServer();
          `,
      }),
    ],
  }
}
