import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  extensionApi: 'firefox',
  manifestVersion: 3,
  modules: ['@wxt-dev/module-react'],
  zip: {
    artifactTemplate: '{{name}}-{{browser}}.zip',
  },
  manifest: {
    name: 'ImageGrab',
    description: 'Quickly save images from any webpage',
    permissions: ['downloads', 'contextMenus', 'activeTab', 'scripting', 'storage'],
    icons: {
      48: 'icon.svg',
      96: 'icon.svg',
      128: 'icon.svg',
    },
  },
});
