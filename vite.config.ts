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
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
            return "vendor-react";
          }
          if (id.includes("node_modules/react-router-dom")) {
            return "vendor-router";
          }
          if (id.includes("node_modules/@radix-ui") || id.includes("node_modules/lucide-react")) {
            return "vendor-ui";
          }
          if (id.includes("node_modules/recharts") || id.includes("node_modules/chart.js")) {
            return "vendor-charts";
          }
          if (id.includes("node_modules/@supabase")) {
            return "vendor-supabase";
          }
          
          // Feature chunks - Admin
          if (id.includes("src/pages/admin/AdminCatalogo") || 
              id.includes("src/pages/admin/AdminCategor") ||
              id.includes("src/pages/admin/AdminConciliacion")) {
            return "feature-admin-catalog";
          }
          if (id.includes("src/pages/admin/AdminDashboard") ||
              id.includes("src/pages/admin/AdminPedidos")) {
            return "feature-admin-core";
          }
          if (id.includes("src/pages/admin/")) {
            return "feature-admin-other";
          }
          
          // Feature chunks - Seller
          if (id.includes("src/pages/seller/SellerCatalogo") ||
              id.includes("src/pages/seller/SellerInventario")) {
            return "feature-seller-catalog";
          }
          if (id.includes("src/pages/seller/SellerDashboard") ||
              id.includes("src/pages/seller/SellerCheckout")) {
            return "feature-seller-core";
          }
          if (id.includes("src/pages/seller/")) {
            return "feature-seller-other";
          }
          
          // Feature chunks - Product
          if (id.includes("src/pages/ProductPage") || 
              id.includes("src/pages/CategoryProductsPage") ||
              id.includes("src/pages/CategoriesPage")) {
            return "feature-catalog";
          }
          
          // Feature chunks - Store
          if (id.includes("src/pages/StoreProfilePage") ||
              id.includes("src/pages/StorePage")) {
            return "feature-store";
          }
          
          // Feature chunks - Cart & Checkout
          if (id.includes("src/pages/CartPage") ||
              id.includes("src/pages/CheckoutPage")) {
            return "feature-cart";
          }
          
          // Feature chunks - Account
          if (id.includes("src/pages/AccountPage") ||
              id.includes("src/pages/MyPurchasesPage")) {
            return "feature-account";
          }
          
          // Component chunks - Layout
          if (id.includes("src/components/layout/") || 
              id.includes("src/components/admin/") ||
              id.includes("src/components/seller/")) {
            return "shared-layout";
          }
          
          // Component chunks - Product
          if (id.includes("src/components/products/")) {
            return "shared-products";
          }
          
          // Component chunks - Categories
          if (id.includes("src/components/categories/")) {
            return "shared-categories";
          }
          
          // Component chunks - UI
          if (id.includes("src/components/ui/")) {
            return "shared-ui";
          }
          
          // Hooks
          if (id.includes("src/hooks/")) {
            return "shared-hooks";
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
}));
