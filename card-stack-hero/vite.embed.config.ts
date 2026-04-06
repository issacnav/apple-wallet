import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist-embed',
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/embed.tsx'),
      name: 'CardStackEmbed',
      formats: ['es'],
      fileName: 'card-stack',
    },
    rollupOptions: {
      output: {
        assetFileNames: 'card-stack[extname]',
      },
    },
  },
})
