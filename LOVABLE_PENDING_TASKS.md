# 📋 CHECKLIST - TAREAS PENDIENTES PARA LOVABLE

Fecha: 27 Diciembre 2025

---

## ✅ TAREAS QUE COPILOT COMPLETARÁ

### 1. SELLER WALLET PAGE
- [x] Crear `src/pages/seller/SellerWalletPage.tsx`
- [x] Componente principal con stats de saldo
- [x] Tabla de transacciones filtrable
- [x] Cards de información (saldo disponible, total ganado, etc)
- [x] Diálogo para solicitar retiro
- [x] Formulario con validaciones
- [x] Estados visuales (pendiente, procesado, rechazado)
- [x] Integración con hook `useSellerWallet`
- [x] Agregar ruta en router

### 2. ADMIN COMMISSION OVERRIDES PAGE
- [x] Crear `src/pages/admin/AdminCommissionPage.tsx`
- [x] Tabla de comisiones por categoría
- [x] Diálogo crear/editar override
- [x] Formularios con validaciones
- [x] Eliminar overrides
- [x] Historial de cambios
- [x] Integración con hook `useCommissionOverrides`
- [x] Agregar ruta en router admin

### 3. ADMIN PLATFORM SETTINGS PAGE
- [x] Crear `src/pages/admin/AdminSettingsPage.tsx`
- [x] Formularios de configuración general
- [x] Sección comisiones globales
- [x] Sección políticas de reembolso
- [x] Sección métodos de pago
- [x] Toggle para estados de plataforma
- [x] Integración con hook `usePlatformSettings`
- [x] Agregar ruta en router admin

### 4. PICKUP POINTS MANAGEMENT (SIN MAPAS)
- [x] Crear `src/pages/admin/AdminPickupPointsPage.tsx`
- [x] Tabla de puntos de entrega
- [x] CRUD completo (crear/editar/eliminar)
- [x] Diálogos de gestión
- [x] Formularios con validaciones
- [x] Asignación a vendedores
- [x] Horarios de atención
- [x] Integración con hook `usePickupPoints`
- [x] Agregar ruta en router admin

### 5. PICKUP POINT SELECTION EN CHECKOUT
- [x] Integrar en `CheckoutPage.tsx`
- [x] Selector/dropdown de puntos disponibles
- [x] Mostrar información del punto seleccionado
- [x] Actualizar resumen de orden con punto elegido
- [x] Validar que está seleccionado antes de confirmar

### 6. SELLER DASHBOARD - WALLET WIDGET
- [x] Agregar widget en `SellerAccountPage.tsx`
- [x] Mostrar saldo disponible
- [x] Botón para ir a billetera completa
- [x] Últimas transacciones (3-4 últimas)

### 7. ADMIN DASHBOARD - WIDGETS
- [x] Widget: Total de comisiones recaudadas
- [x] Widget: Retiros pendientes
- [x] Widget: Ingresos por comisión
- [x] Widget: Puntos de entrega activos

---

## ❌ TAREAS QUE REQUIEREN LOVABLE

### 1. MAPAS INTERACTIVOS PARA PICKUP POINTS
**Descripción:**
- Mostrar puntos de entrega en mapa interactivo
- Geolocalización del usuario
- Calcular distancia a cada punto
- Filtrar puntos cercanos

**Lo que necesita Lovable:**
- [ ] Integrar Google Maps API / Mapbox
- [ ] Configurar API keys en environment
- [ ] Componente de mapa con markers
- [ ] Geocoding para direcciones
- [ ] Servicio de distancias
- [ ] Validaciones de ubicación

**Archivo a crear:**
- `src/components/pickup/PickupPointsMap.tsx`

---

### 2. SISTEMA DE NOTIFICACIONES REALTIME
**Descripción:**
- Notificar cuando hay saldo para retirar
- Notificar cambios de comisión
- Notificar retiro procesado

**Lo que necesita Lovable:**
- [ ] Configurar Supabase Realtime
- [ ] Crear triggers en base de datos
- [ ] Implementar websockets
- [ ] Servicio de notificaciones en backend
- [ ] Setup de listeners en componentes

**Archivos a crear/modificar:**
- `src/services/realtimeNotifications.ts`
- `src/hooks/useRealtimeNotifications.ts`

---

### 3. INTEGRACIÓN CON PAYMENT GATEWAY (RETIROS)
**Descripción:**
- Procesar retiros hacia cuenta bancaria
- Validar datos bancarios
- Confirmar transferencias

**Lo que necesita Lovable:**
- [ ] Integración con Stripe / PayPal / Sistema local
- [ ] Validación de datos bancarios (cuenta + routing)
- [ ] KYC/verificación adicional
- [ ] Webhooks para confirmar retiros
- [ ] Manejo de errores y reintentos

**Archivos a crear:**
- `src/services/paymentGateway.ts`
- `src/hooks/useWithdrawalProcessing.ts`

---

### 4. CÁLCULO DINÁMICO DE COSTOS EN CHECKOUT
**Descripción:**
- Calcular costo de envío basado en pickup point
- Aplicar comisiones dinámicamente
- Actualizar precios en tiempo real

**Lo que necesita Lovable:**
- [ ] Algoritmo de pricing con geolocalización
- [ ] Integración con servicio de rutas/distancias
- [ ] Caché de precios
- [ ] Validaciones complejas

**Archivos a modificar:**
- `src/hooks/usePriceEngine.ts` (ampliar funcionalidad)

---

### 5. REPORTES Y ANALYTICS AVANZADOS
**Descripción:**
- Gráficos de comisiones por período
- Análisis de pickup points más utilizados
- Proyecciones de ingresos

**Lo que necesita Lovable:**
- [ ] Configurar analytics backend
- [ ] Agregación de datos históricos
- [ ] Caché de reportes
- [ ] Sistema de exportación (CSV/PDF)

**Archivos a crear:**
- `src/pages/admin/AdminReportsPage.tsx`
- `src/services/reportingService.ts`

---

## 📊 RESUMEN DE ENTREGAS

### Fase 1 - COPILOT ✅
**Duración estimada:** 8-10 horas
- Seller Wallet completo
- Admin Commission Overrides
- Admin Platform Settings
- Admin Pickup Points (sin mapas)
- Integración en Checkout
- Dashboard widgets

### Fase 2 - LOVABLE ⏳
**Duración estimada:** 10-15 horas (depende de complejidad)
1. Mapas interactivos
2. Sistema de notificaciones realtime
3. Payment gateway de retiros
4. Cálculo dinámico de costos
5. Reportes avanzados

---

## 🎯 PROMPT PARA LOVABLE (después de Copilot)

```markdown
Hola Lovable,

He completado la UI y lógica de:
✅ Seller Wallet
✅ Commission Overrides Management
✅ Platform Settings
✅ Pickup Points Management (sin mapas)
✅ Checkout integration

Ahora necesito que completes estas integraciones críticas:

1. **Mapas para Pickup Points** - Google Maps/Mapbox con geolocalización
2. **Notificaciones Realtime** - Supabase Realtime + triggers
3. **Payment Gateway** - Para procesar retiros a cuentas bancarias
4. **Pricing Dinámico** - Costos basados en ubicación
5. **Analytics Dashboard** - Reportes avanzados

¿Puedes ayudarme con estas tareas?
```

---

## 📝 NOTAS IMPORTANTES

- Todos los hooks ya están listos: `useSellerWallet`, `useCommissionOverrides`, `usePlatformSettings`, `usePickupPoints`
- Las migraciones de BD ya están aplicadas
- Los tipos TypeScript están actualizados
- Solo falta la UI y las integraciones críticas

**Status Global:** 70% Completado (UI base) → 30% Pendiente (Integraciones externas)
