import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { classroomRacePlugin } from './server/classroomRacePlugin'
import { raceLessonPlugin } from './server/raceLessonPlugin'

export default defineConfig({
  plugins: [react(), tailwindcss(), classroomRacePlugin(), raceLessonPlugin()],
  build: {
    rollupOptions: { input: { app: 'index.html', classroom: 'classroom/index.html' } },
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  server: {
    fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/.classroom-races/**'] },
  },
})
