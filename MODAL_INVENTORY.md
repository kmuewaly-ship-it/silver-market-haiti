# 📋 Inventario de Ventanas Emergentes (Modales/Drawers)

## Resumen Ejecutivo
**Total de ventanas emergentes activas: 2 principales**

---

## 1. 🖥️ **VariantDrawer** (Desktop - Drawer a la derecha)
**Ubicación:** `src/components/products/VariantDrawer.tsx`

### Características:
- **Tipo:** Custom HTML/CSS Drawer (no usa componente UI pre-construido)
- **Dimensiones:** 332px × 945px fijo
- **Posición:** Desliza desde la derecha (right side)
- **Animación:** `slideInRight 0.3s ease-out`
- **Visibilidad:** Solo DESKTOP (≥768px) - `if (isMobile) return null;`
- **Control:** Global state `useVariantDrawerStore`

### Gestión:
```tsx
const { isOpen, product, close, onComplete } = useVariantDrawerStore();
```

### Usado en páginas/componentes:
- ✅ `src/pages/ProductPage.tsx` - Importado y rendido en línea
- ✅ `src/components/landing/ProductCard.tsx` - Abierto vía store
- ✅ `src/components/b2b/ProductCardB2B.tsx` - Abierto vía store
- ✅ `src/pages/MarketplacePage.tsx` - Abierto vía store

### Contenido:
- Selector de variantes (VariantSelector component)
- Cantidad selector (+ / -)
- Panel de negocios B2B (inversión, ganancia, PVP)
- Botón "Comprar B2B" / "Añadir al Carrito"
- Botón "Cancelar"

### Estilo:
```css
Overlay: bg-black/50, fade animation
Panel: bg-white, shadow-2xl, border-left
Close button: X icon en header
Body scroll lock: Sí (automático)
```

---

## 2. 📱 **ProductBottomSheet** (Mobile/Tablet - Bottom Sheet)
**Ubicación:** `src/components/products/ProductBottomSheet.tsx`

### Características:
- **Tipo:** Drawer component de shadcn/ui (`DrawerContent`, `DrawerHeader`, etc.)
- **Dimensiones:** Responsive - ancho completo (<768px), max-height 90vh
- **Posición:** Desliza desde abajo (bottom sheet)
- **Animación:** Nativa del componente Drawer
- **Visibilidad:** Móvil/Tablet (<768px)
- **Control:** Estado local por página + props

### Gestión por página:
```tsx
// ProductPage.tsx
const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
<ProductBottomSheet 
  product={{id, name, price...}}
  isOpen={isBottomSheetOpen}
  onClose={() => setIsBottomSheetOpen(false)}
/>
```

### Usado en páginas/componentes:
- ✅ `src/pages/ProductPage.tsx` - Estado local individual
- ✅ `src/pages/MarketplacePage.tsx` - Estado local individual
- ✅ `src/components/landing/ProductCard.tsx` - Estado local individual
- ✅ `src/components/b2b/ProductCardB2B.tsx` - Estado local individual

### Contenido:
- Imagen del producto (16h×16w sm:20h×20w)
- Nombre del producto
- Precio actual (costo para sellers)
- Selector de cantidad (- / +)
- Panel de negocios B2B (inversión, ganancia, PVP)
- Botón "Comprar B2B" / "Añadir al Carrito"
- Botón "Cancelar"
- Fallback: "Cargando producto..." cuando product es null

### Componentes shadcn/ui usados:
```tsx
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
```

---

## 3. 📊 **TrendsPage Sheet** (Filtros móviles)
**Ubicación:** `src/pages/TrendsPage.tsx`

### Características:
- **Tipo:** Sheet component de shadcn/ui (`SheetContent`, `SheetHeader`, etc.)
- **Propósito:** Panel de filtros en TrendsPage
- **Posición:** Desde la izquierda (left side)
- **Visibilidad:** Solo móvil (`md:hidden`)
- **Control:** Estado local `filtersOpen`

### Componentes shadcn/ui usados:
```tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
```

### Contenido:
- Filtros de búsqueda/tendencias
- Trigger: Botón con icono de filtro

---

## 📍 Matriz de Distribución

| Componente | Tipo | Desktop | Mobile | Páginas |
|-----------|------|---------|--------|---------|
| **VariantDrawer** | Custom Drawer | ✅ | ❌ | ProductPage, ProductCard, ProductCardB2B, MarketplacePage |
| **ProductBottomSheet** | shadcn/Drawer | ❌ | ✅ | ProductPage, ProductCard, ProductCardB2B, MarketplacePage |
| **TrendsSheet** | shadcn/Sheet | ❌ | ✅ | TrendsPage |

---

## 🔄 Flujos de Interacción

### Flujo 1: Agregar producto a carrito
```
Usuario click "Agregar al Pedido"
  ├─ Si DESKTOP (≥768px):
  │  └─ Abre VariantDrawer vía useVariantDrawerStore.open(product)
  └─ Si MOBILE (<768px):
     └─ Abre ProductBottomSheet vía setIsBottomSheetOpen(true)
```

### Flujo 2: Cerrar modales
```
Usuario click "Cancelar" o overlay
  ├─ VariantDrawer:
  │  └─ useVariantDrawerStore.close()
  └─ ProductBottomSheet:
     └─ onClose() callback → setIsBottomSheetOpen(false)
```

### Flujo 3: Agregar al carrito
```
Usuario click "Añadir al Carrito" / "Comprar B2B"
  ├─ Validar cantidad y variantes
  ├─ Agregar a useCart (B2C) o useB2BCartSupabase (B2B)
  └─ Cerrar modal y mostrar toast de éxito
```

---

## ✅ Estado Actual de Implementación

### VariantDrawer
- ✅ Compilando sin errores
- ✅ Renderizado solo en desktop
- ✅ Dimensiones 332×945px correcto
- ✅ Global state store funcionando
- ✅ B2B profit calculator activo

### ProductBottomSheet
- ✅ Compilando sin errores (sintaxis corregida)
- ✅ Renderizado solo en mobile/tablet
- ✅ Drawer component shadcn/ui funcionando
- ✅ Fallback "Cargando producto..." activo
- ✅ B2B profit calculator activo

### TrendsPage Sheet
- ✅ Compilando sin errores
- ✅ Filtros móviles funcionando
- ✅ Solo visible en móvil

---

## 🎯 Recomendaciones Futuras

1. **Unificación de estado** (Opcional):
   - Podrías migrar ProductBottomSheet a un store global similar a VariantDrawer
   - Ventaja: Una única fuente de verdad para ambas modales
   - Desventaja: Complejidad adicional

2. **Customización estilística** (Opcional):
   - VariantDrawer usa CSS customizado
   - ProductBottomSheet usa shadcn/Drawer
   - Podrías unificar el estilo para coherencia visual

3. **Performance** (Bajo prioridad):
   - Ambas modales re-renderan cuando cambia el estado del carrito
   - Considerar useCallback para handlers

---

## 📊 Estadísticas

- **Total de archivos con modales:** 7
  - ProductPage.tsx
  - ProductCard.tsx
  - ProductCardB2B.tsx
  - MarketplacePage.tsx
  - TrendsPage.tsx
  - VariantDrawer.tsx
  - ProductBottomSheet.tsx

- **Total de componentes emergentes:** 3
  - VariantDrawer (custom)
  - ProductBottomSheet (shadcn/Drawer)
  - TrendsPage Sheet (shadcn/Sheet)

- **Líneas de código en modales:**
  - VariantDrawer: 292 líneas
  - ProductBottomSheet: ~280 líneas
  - TrendsPage Sheet: ~17 líneas (dentro de TrendsPage)

