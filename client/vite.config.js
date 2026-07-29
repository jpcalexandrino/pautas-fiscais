import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      "@/components/ui": path.resolve(import.meta.dirname, "./src/shared/components/ui"),
      "@/components/layout": path.resolve(import.meta.dirname, "./src/shared/components/layout"),
      "@/components": path.resolve(import.meta.dirname, "./src/shared/components"),
      "@/lib": path.resolve(import.meta.dirname, "./src/shared/lib"),
      "@/utils": path.resolve(import.meta.dirname, "./src/shared/utils"),
      "@/hooks": path.resolve(import.meta.dirname, "./src/shared/hooks"),
      "@": path.resolve(import.meta.dirname, "./src"),
      "@features": path.resolve(import.meta.dirname, "./src/features"),
      "@shared": path.resolve(import.meta.dirname, "./src/shared"),
      "@app": path.resolve(import.meta.dirname, "./src/app"),
    },
  },
})
