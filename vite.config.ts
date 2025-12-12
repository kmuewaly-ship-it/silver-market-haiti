import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Chunks de vendors
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-ui": ["@radix-ui/react-dialog", "lucide-react"],
          
          // Chunks de features
          "feature-catalog": [
            "src/pages/ProductPage.tsx",
            "src/pages/CategoryProductsPage.tsx",
            "src/pages/CategoriesPage.tsx",
          ],
          "feature-store": [
            "src/pages/StoreProfilePage.tsx",
            "src/pages/StorePage.tsx",
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
}));
