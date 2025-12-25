import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 30, // 30 minutos
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function showRuntimeOverlay(err: { message?: string; stack?: string } | string) {
  const msg = typeof err === 'string' ? err : (err.message || 'Error desconocido');
  const stack = typeof err === 'string' ? '' : (err.stack || '');
  let el = document.getElementById('__runtime_error_overlay__');
  if (!el) {
    el = document.createElement('div');
    el.id = '__runtime_error_overlay__';
    el.style.position = 'fixed';
    el.style.left = '0';
    el.style.top = '0';
    el.style.right = '0';
    el.style.bottom = '0';
    el.style.zIndex = '99999';
    el.style.background = 'rgba(0,0,0,0.6)';
    el.style.color = 'white';
    el.style.padding = '24px';
    el.style.overflow = 'auto';
    el.innerHTML = `<div style="max-width:900px;margin:48px auto;background:#111827;padding:20px;border-radius:10px;">
      <h2 style="margin:0 0 8px;color:#fecaca">Runtime Error</h2>
      <pre id="__runtime_error_text__" style="white-space:pre-wrap;color:#fff;background:transparent"></pre>
      <div style="margin-top:12px;display:flex;gap:8px"><button id="__runtime_error_reload__" style="background:#ef4444;color:white;border:none;padding:8px 12px;border-radius:6px;">Recargar</button></div>
    </div>`;
    document.body.appendChild(el);
    const btn = document.getElementById('__runtime_error_reload__');
    btn?.addEventListener('click', () => window.location.reload());
  }
  const text = document.getElementById('__runtime_error_text__');
  if (text) text.textContent = msg + '\n\n' + stack;
}

window.addEventListener('error', (e) => {
  console.error('Global error caught:', e.error || e.message, e.error?.stack);
  showRuntimeOverlay(e.error || e.message || String(e));
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled rejection:', e.reason);
  showRuntimeOverlay(e.reason || 'Unhandled promise rejection');
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </QueryClientProvider>
);
