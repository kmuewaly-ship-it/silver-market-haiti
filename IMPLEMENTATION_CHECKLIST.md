# ✅ CHECKLIST PASO A PASO - IMPLEMENTACIÓN COPILOT

**Fecha Inicio:** 27 Diciembre 2025  
**Status:** 🔴 NO INICIADO

---

## 📋 ORDEN DE IMPLEMENTACIÓN

### FASE 1: PREPARACIÓN (30 min)
- [ ] 1.1. Revisar hooks: `useSellerWallet`, `useCommissionOverrides`, `usePlatformSettings`, `usePickupPoints`
- [ ] 1.2. Confirmar tipos en `src/types/database.ts`
- [ ] 1.3. Verificar que migraciones SQL están aplicadas

---

## 🚀 TAREA 1: SELLER WALLET PAGE (Estimado: 2-3 horas)

### 1.1 Estructura Base
- [ ] Crear `src/pages/seller/SellerWalletPage.tsx`
- [ ] Importar componentes necesarios (Card, Button, Table, Tabs, Dialog, etc)
- [ ] Importar hook `useSellerWallet`
- [ ] Exportar componente

### 1.2 Stats Section (Cards Principales)
- [ ] Card: Saldo Disponible (monto + icon wallet)
- [ ] Card: Total Ganado (monto + icon trending up)
- [ ] Card: Retiros Pendientes (cantidad + icon clock)
- [ ] Card: Total Retirado (monto + icon check)
- [ ] Grid responsive para 4 cards

### 1.3 Tabla de Transacciones
- [ ] Crear tabla con columnas:
  - Fecha (formato: 27 dic, 2025)
  - Tipo (Venta, Comisión, Retiro, etc)
  - Descripción (breve)
  - Monto (con signo + o -)
  - Estado (completado, pendiente, etc)
- [ ] Implementar filtros por tipo
- [ ] Implementar filtros por fecha
- [ ] Paginación (si hay muchos datos)
- [ ] Estados visualizados con badges colored

### 1.4 Diálogo Solicitar Retiro
- [ ] Crear Dialog component
- [ ] Formulario con campos:
  - Monto a retirar (input numérico, max = saldo disponible)
  - Método de retiro (select: transferencia bancaria, etc)
  - Banco (input)
  - Número de cuenta (input, con máscara)
  - Titular cuenta (input)
- [ ] Validaciones:
  - Monto > 0
  - Monto <= saldo disponible
  - Todos los campos obligatorios
- [ ] Botón Solicitar (con loading state)
- [ ] Mensaje de confirmación

### 1.5 Integración en SellerLayout
- [ ] Agregar link/tab en menú sidebar
- [ ] Ruta: `/seller/wallet`
- [ ] Proteger ruta (solo para sellers)

---

## 🎯 TAREA 2: ADMIN COMMISSION OVERRIDES PAGE (Estimado: 2-2.5 horas)

### 2.1 Estructura Base
- [ ] Crear `src/pages/admin/AdminCommissionPage.tsx`
- [ ] Importar componentes necesarios
- [ ] Importar hook `useCommissionOverrides`
- [ ] Layout estándar Admin

### 2.2 Tabla de Comisiones Actuales
- [ ] Crear tabla con columnas:
  - Categoría (nombre)
  - Comisión Base (%)
  - Override (si existe) (%)
  - Última Modificación (fecha)
  - Acciones (editar, eliminar)
- [ ] Datos vienen del hook
- [ ] Status visual: badge "Overridden" si tiene custom commission
- [ ] Ordenable por columnas

### 2.3 Diálogo Crear/Editar Override
- [ ] Dialog component
- [ ] Formulario con:
  - Categoría (select, read-only si es edit)
  - Comisión Original (display, read-only)
  - Nueva Comisión (%) (input numérico)
  - Razón del cambio (textarea opcional)
  - Fecha inicio (date picker)
  - Fecha fin (date picker, opcional)
- [ ] Validaciones:
  - Comisión entre 0-100
  - Nueva comisión != original
- [ ] Botones: Guardar, Cancelar
- [ ] Success toast después de guardar

### 2.4 Botones de Acción
- [ ] Botón "Crear Override" (abre dialog vacío)
- [ ] Botón Editar en tabla (abre dialog con datos)
- [ ] Botón Eliminar en tabla (con confirmación)
- [ ] Botón "Revertir a Comisión Base"

### 2.5 Historial de Cambios
- [ ] Section: "Últimos Cambios"
- [ ] Timeline o tabla simple con:
  - Fecha
  - Categoría
  - Cambio (de X% a Y%)
  - Quién lo cambió (admin name)

### 2.6 Integración en Admin
- [ ] Agregar en Admin menu
- [ ] Ruta: `/admin/commissions`
- [ ] Proteger ruta (solo admin)

---

## ⚙️ TAREA 3: ADMIN PLATFORM SETTINGS PAGE (Estimado: 2-2.5 horas)

### 3.1 Estructura Base
- [ ] Crear `src/pages/admin/AdminSettingsPage.tsx`
- [ ] Importar hook `usePlatformSettings`
- [ ] Layout con Tabs para secciones

### 3.2 Tab: CONFIGURACIÓN GENERAL
- [ ] Nombre de plataforma (input text)
- [ ] Email de soporte (input email)
- [ ] Teléfono de soporte (input tel)
- [ ] Dirección (textarea)
- [ ] País (select)
- [ ] Zona horaria (select)
- [ ] Botón Guardar

### 3.3 Tab: COMISIONES GLOBALES
- [ ] Comisión estándar B2B (%)
- [ ] Comisión estándar B2C (%)
- [ ] Comisión PayPal (%)
- [ ] Comisión Stripe (%)
- [ ] Monto mínimo de transacción ($)
- [ ] Monto máximo de transacción ($)
- [ ] Cada field con input + label
- [ ] Botón Guardar

### 3.4 Tab: POLÍTICAS
- [ ] Política de reembolso (textarea con editor)
- [ ] Política de privacidad (textarea con editor)
- [ ] Términos de servicio (textarea con editor)
- [ ] Política de cancelación (textarea con editor)
- [ ] Botón Guardar

### 3.5 Tab: MÉTODOS DE PAGO
- [ ] Tabla de métodos habilitados:
  - Nombre método
  - Activo (toggle)
  - Comisión (%)
  - Acciones
- [ ] Habilitar/Deshabilitar métodos
- [ ] Editar comisión de cada uno
- [ ] Botón Guardar Cambios

### 3.6 Tab: ESTADO DE PLATAFORMA
- [ ] Toggle: Plataforma activa/mantenimiento
- [ ] Toggle: Nuevo sellers pueden registrarse
- [ ] Toggle: Buyers pueden comprar
- [ ] Mensaje de mantenimiento (textarea)
- [ ] Horario inicio mantenimiento (datetime)
- [ ] Horario fin mantenimiento (datetime)
- [ ] Botón Aplicar

### 3.7 Integración en Admin
- [ ] Agregar en Admin menu principal
- [ ] Ruta: `/admin/settings`
- [ ] Proteger ruta

---

## 📍 TAREA 4: ADMIN PICKUP POINTS PAGE (Estimado: 2.5-3 horas)

### 4.1 Estructura Base
- [ ] Crear `src/pages/admin/AdminPickupPointsPage.tsx`
- [ ] Importar hook `usePickupPoints`
- [ ] Layout con tabla + diálogos

### 4.2 Tabla de Puntos Existentes
- [ ] Columnas:
  - Nombre del punto
  - Ciudad/Dirección
  - Teléfono
  - Email
  - Horario (abierto/cerrado badge)
  - Vendedores asignados (count)
  - Activo (toggle)
  - Acciones (editar, eliminar, ver detalles)
- [ ] Búsqueda por nombre
- [ ] Filtro por ciudad
- [ ] Filtro por estado (activo/inactivo)

### 4.3 Diálogo Crear Nuevo Punto
- [ ] Formulario con campos:
  - Nombre del punto (input text)
  - Dirección completa (textarea)
  - Ciudad (input / select)
  - Código postal (input)
  - Teléfono (input tel)
  - Email (input email)
  - Latitud (input numérico, para maps luego)
  - Longitud (input numérico, para maps luego)
  - Límite capacidad (input numérico, opcional)
  - Activo (checkbox)
- [ ] Validaciones
- [ ] Botones: Crear, Cancelar
- [ ] Success toast

### 4.4 Diálogo Editar Punto
- [ ] Similar al crear, pero con datos precargados
- [ ] Campo read-only para ID
- [ ] Botones: Guardar, Cancelar
- [ ] Opción "Eliminar punto" (con confirmación)

### 4.5 Horarios de Atención (Expandable Section)
- [ ] Para cada día de la semana (Lunes-Domingo):
  - Checkbox: Abierto
  - Hora apertura (time picker)
  - Hora cierre (time picker)
- [ ] Validación: cierre > apertura
- [ ] Botón Guardar Horarios

### 4.6 Asignación de Vendedores
- [ ] Tab o expandable: "Vendedores Asignados"
- [ ] Lista de vendedores actuales (con opción remover)
- [ ] Modal/Dialog: Buscar y agregar nuevo vendedor
- [ ] Search de sellers por nombre/email
- [ ] Botones: Asignar, Cancelar

### 4.7 Botones Principales
- [ ] Botón "+ Nuevo Punto" (abre dialog crear)
- [ ] Botón "Editar" en tabla
- [ ] Botón "Eliminar" con confirmación
- [ ] Botón "Detalles" (abre modal con info completa)

### 4.8 Integración en Admin
- [ ] Agregar en Admin menu
- [ ] Ruta: `/admin/pickup-points`
- [ ] Proteger ruta

---

## 🛒 TAREA 5: CHECKOUT - INTEGRACIÓN PICKUP POINTS (Estimado: 1.5-2 horas)

### 5.1 Modificar CheckoutPage.tsx
- [ ] Encontrar sección de "Envío" o "Dirección de entrega"
- [ ] Agregar nuevo campo: "Punto de Entrega"

### 5.2 Selector de Pickup Point
- [ ] Input tipo select/combobox
- [ ] Cargar lista desde `usePickupPoints`
- [ ] Mostrar: Nombre + Dirección + Teléfono
- [ ] Buscar/filtrar puntos
- [ ] Validación: punto debe ser seleccionado antes de confirmar orden

### 5.3 Card de Información Seleccionada
- [ ] Mostrar cuando punto está seleccionado:
  - Nombre del punto
  - Dirección completa
  - Teléfono
  - Horarios de atención
  - Hora estimada de retiro (si disponible)

### 5.4 Actualizar Resumen de Orden
- [ ] Mostrar punto seleccionado en resumen
- [ ] Actualizar "tipo de envío" (cambiar a "Entrega en Punto")
- [ ] Actualizar costo si aplica

### 5.5 Validación antes de Confirmar
- [ ] Validar que punto esté seleccionado
- [ ] Mostrar error si no está seleccionado
- [ ] Botón "Confirmar Orden" deshabilitado hasta seleccionar

---

## 👤 TAREA 6: SELLER DASHBOARD - WALLET WIDGET (Estimado: 1 hora)

### 6.1 Modificar SellerAccountPage.tsx
- [ ] Encontrar sección apropiada (probablemente en Mi Tienda o nuevo tab)

### 6.2 Crear Widget
- [ ] Card pequeña con:
  - Título: "Mi Billetera"
  - Saldo disponible (grande y destacado)
  - Últimas 3-4 transacciones (lista simple)
  - Botón "Ver Billetera Completa" → link a `/seller/wallet`

### 6.3 Estilos
- [ ] Consistent con diseño actual
- [ ] Responsive (mobile-friendly)
- [ ] Color principal: verde para saldo

---

## 📊 TAREA 7: ADMIN DASHBOARD - WIDGETS (Estimado: 1.5 horas)

### 7.1 Modificar AdminDashboard.tsx
- [ ] Encontrar sección de widgets/stats

### 7.2 Widget 1: Total Comisiones Recaudadas
- [ ] Grande card con número principal
- [ ] Período: Este mes / Este año (selector)
- [ ] Tendencia (↑ o ↓ vs período anterior)
- [ ] Color: Azul

### 7.3 Widget 2: Retiros Pendientes
- [ ] Card con cantidad de retiros pendientes
- [ ] Monto total pendiente
- [ ] Link a "Ver todos los retiros"
- [ ] Color: Naranja

### 7.4 Widget 3: Ingresos por Comisión (Gráfico)
- [ ] Gráfico de línea o barras (últimos 30 días)
- [ ] X: Días, Y: Monto de comisiones
- [ ] Tooltip con detalles
- [ ] Color: Verde

### 7.5 Widget 4: Puntos de Entrega Activos
- [ ] Card con cantidad de puntos activos
- [ ] Cantidad de vendedores asignados total
- [ ] Link a gestión de puntos
- [ ] Color: Púrpura

---

## 🔗 TAREA 8: AGREGAR RUTAS (Estimado: 30 min)

### 8.1 Router Seller
- [ ] Encontrar archivo de rutas para seller
- [ ] Agregar ruta: `/seller/wallet` → `SellerWalletPage`

### 8.2 Router Admin
- [ ] Encontrar archivo de rutas para admin
- [ ] Agregar ruta: `/admin/commissions` → `AdminCommissionPage`
- [ ] Agregar ruta: `/admin/settings` → `AdminSettingsPage`
- [ ] Agregar ruta: `/admin/pickup-points` → `AdminPickupPointsPage`

### 8.3 Navegación Menu
- [ ] Agregar link en Admin menu sidebar
- [ ] Agregar link en Seller menu sidebar

---

## 🧪 TAREA 9: TESTING Y VALIDACIÓN (Estimado: 1 hora)

### 9.1 Verificar Compilación
- [ ] Sin errores de TypeScript
- [ ] Sin errores de imports
- [ ] Sin warnings importantes

### 9.2 Probar Funcionalidad
- [ ] Seller Wallet: Cargar datos, filtrar, abrir dialogo
- [ ] Admin Commissions: Ver tabla, crear override, eliminar
- [ ] Admin Settings: Cambiar settings, guardar
- [ ] Admin Pickup Points: CRUD completo
- [ ] Checkout: Seleccionar punto, validar
- [ ] Widgets: Se cargan correctamente

### 9.3 Testing Responsivo
- [ ] Desktop (1920px)
- [ ] Tablet (768px)
- [ ] Mobile (375px)

### 9.4 Performance
- [ ] Verificar que no hay memory leaks
- [ ] Verificar que no hay console errors

---

## 📤 TAREA 10: COMMIT Y PUSH FINAL (Estimado: 15 min)

### 10.1 Git Status
- [ ] `git status` para ver cambios
- [ ] Verificar que no hay archivos no deseados

### 10.2 Commit
- [ ] `git add -A`
- [ ] `git commit -m "feat: Complete seller wallet, commission overrides, platform settings, and pickup points management UI"`

### 10.3 Push
- [ ] `git push origin main`
- [ ] Verificar que push fue exitoso

### 10.4 Mensaje para Lovable
- [ ] Copiar archivo `LOVABLE_PENDING_TASKS.md`
- [ ] Enviar a Lovable con actualización de status

---

## 📋 RESUMEN FINAL

| Tarea | Estimado | Status |
|-------|----------|--------|
| 1. Seller Wallet | 2-3h | ⬜ |
| 2. Commission Overrides | 2-2.5h | ⬜ |
| 3. Platform Settings | 2-2.5h | ⬜ |
| 4. Pickup Points | 2.5-3h | ⬜ |
| 5. Checkout Integration | 1.5-2h | ⬜ |
| 6. Seller Dashboard Widget | 1h | ⬜ |
| 7. Admin Dashboard Widgets | 1.5h | ⬜ |
| 8. Agregar Rutas | 30min | ⬜ |
| 9. Testing | 1h | ⬜ |
| 10. Git & Push | 15min | ⬜ |
| **TOTAL** | **16-17h** | ⬜ |

---

**Status Global:** 🔴 NO INICIADO

¡Listo para comenzar cuando digas! 🚀
