import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { cityPlugin } from './server/cityPlugin'
import { classroomRaceProxy } from './server/classroomRaceProxy'
import { raceLessonPlugin } from './server/raceLessonPlugin'

export default defineConfig({
  plugins: [react(), tailwindcss(), classroomRaceProxy(), raceLessonPlugin(), cityPlugin()],
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
