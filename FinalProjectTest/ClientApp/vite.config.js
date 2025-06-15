import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,       // 👈 Force Vite to always use this port
        strictPort: true, // 👈 Don't auto-increment if port is busy (fail instead)
    },
})
