Hola Lovable — necesito que actualices el esquema de mi proyecto en Supabase para reflejar los cambios recientes del frontend B2B/B2C. Te detallo a continuación el objetivo, las tablas nuevas/actualizadas, políticas RLS, índices, datos de ejemplo (incluyendo las categorías que aparecen en el frontend) y pasos para aplicar y verificar la migración.

Contexto breve:
- Proyecto: siver-market-hub (frontend React/TS). Usamos Supabase para auth y DB.
- Cambios frontend clave: soporte B2B (productos mayoristas, MOQ, precio_b2b, stock_fisico, carrito B2B, checkout B2B), roles (ADMIN, SELLER, CLIENT), páginas públicas con categorías B2C.
- Tablas actuales probables: `profiles`, `user_roles`. Queremos extender/especificar más tablas y políticas.

Requerimientos de esquema (crear o alterar si ya existe):

1) Tabla `categories`
- Campos:
  - id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  - name TEXT NOT NULL
  - slug TEXT UNIQUE NOT NULL
  - parent_id UUID NULL REFERENCES categories(id) ON DELETE SET NULL
  - metadata JSONB NULL
  - created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
  - updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
- Índices:
  - UNIQUE index en `slug`
  - INDEX en `name`

2) Tabla `products`
- Campos:
  - id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  - sku TEXT UNIQUE NOT NULL
  - nombre TEXT NOT NULL
  - descripcion TEXT NULL
  - precio DECIMAL(10,2) NULL -- precio unitario B2C
  - precio_b2b DECIMAL(10,2) NOT NULL DEFAULT 0.00
  - moq INTEGER NOT NULL DEFAULT 1
  - stock_fisico INTEGER NOT NULL DEFAULT 0
  - imagen_principal TEXT NULL
  - categoria_id UUID NULL REFERENCES categories(id) ON DELETE SET NULL
  - is_active BOOLEAN DEFAULT true
  - created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
  - updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
- Índices:
  - INDEX(sku)
  - INDEX(categoria_id)
  - INDEX(precio_b2b)

3) Tabla `orders_b2b`
- Campos:
  - id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  - seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
  - buyer_id UUID NULL REFERENCES profiles(id) ON DELETE SET NULL
  - status TEXT NOT NULL DEFAULT 'draft' -- draft, placed, paid, shipped, cancelled
  - total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00
  - total_quantity INTEGER NOT NULL DEFAULT 0
  - currency TEXT NOT NULL DEFAULT 'USD'
  - metadata JSONB NULL
  - created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
  - updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
- Índices:
  - INDEX(seller_id)
  - INDEX(status)

4) Tabla `order_items_b2b`
- Campos:
  - id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  - order_id UUID NOT NULL REFERENCES orders_b2b(id) ON DELETE CASCADE
  - product_id UUID NULL REFERENCES products(id) ON DELETE SET NULL
  - sku TEXT
  - nombre TEXT
  - cantidad INTEGER NOT NULL
  - precio_unitario DECIMAL(10,2) NOT NULL
  - descuento_percent NUMERIC(5,2) DEFAULT 0.00
  - subtotal DECIMAL(12,2) NOT NULL
  - created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
- Índices:
  - INDEX(order_id)
  - INDEX(product_id)

5) Tabla `user_roles` (si no existe)
- Campos:
  - id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  - user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
  - role TEXT NOT NULL -- 'ADMIN' | 'SELLER' | 'CLIENT'
  - created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
- Índices:
  - INDEX(user_id)
  - UNIQUE(user_id) (si se usa 1 rol por usuario)

6) (Opcional) Tabla `suppliers` o `vendors` si se necesita en B2B
- Campos básicos: id, nombre, contact_info JSONB, created_at, updated_at

Políticas RLS recomendadas (activar RLS y crear policies):

A) Productos (`products`)
- ENABLE RLS
- Policy SELECT: PUBLIC puede seleccionar productos activos
  - USING: is_active = true
- Policy INSERT/UPDATE/DELETE: solo ADMIN puede modificar productos
  - USING/ WITH CHECK: EXISTS(SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'ADMIN')
- Si quieres permitir que SELLER cree/edite sus propios productos, agregar columna `owner_id UUID` y policy para owner.

B) Pedidos B2B (`orders_b2b`)
- ENABLE RLS
- Policy INSERT: SELLER y CLIENT pueden crear pedidos (SELLER typically)
  - WITH CHECK: EXISTS(SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('SELLER','ADMIN','CLIENT'))
  - Set `seller_id` to auth.uid() for seller-created orders (en backend o policy WITH CHECK)
- Policy SELECT: Seller puede ver solo sus órdenes; Admin puede ver todas
  - USING: ( (auth.uid() = seller_id) OR EXISTS(SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'ADMIN') )
- Policy UPDATE: Seller can update status while draft; Admin can update any

C) Order items (`order_items_b2b`)
- ENABLE RLS
- Policy: Allow select/insert when parent order allows (join on orders_b2b)

D) profiles / user_roles
- Mantener RLS según políticas actuales; admins manage roles.

---

CREAR las categorías que faltan (las que aparecen en el frontend B2C pero no están en la base de datos). Si la tabla `categories` no existe, créala (ver arriba). Si existe, insertar sólo las que falten (no duplicar).

Categorías a asegurar (22):
1. Mujer (slug: mujer)
2. Curvy (slug: curvy)
3. Niños (slug: ninos)
4. Hombre (slug: hombre)
5. Sweaters (slug: sweaters)
6. Celulares y Accs (slug: celulares-y-accs)
7. Joyería y accs (slug: joyeria-y-accs)
8. Tops (slug: tops)
9. Hogar y Vida (slug: hogar-y-vida)
10. Belleza y salud (slug: belleza-y-salud)
11. Zapatos (slug: zapatos)
12. Deportes y Aire Libre (slug: deportes-y-aire-libre)
13. Automotriz (slug: automotriz)
14. Mezclilla (slug: mezclilla)
15. Ropa Interior y Pijamas (slug: ropa-interior-y-pijamas)
16. Bebé y maternidad (slug: bebe-y-maternidad)
17. Vestidos (slug: vestidos)
18. Bottoms (slug: bottoms)
19. Abrigos y Trajes (slug: abrigos-y-trajes)
20. Bolsas y Equipaje (slug: bolsas-y-equipaje)
21. Útiles escolares y de oficina (slug: utiles-escolares-y-oficina)
22. Juguetes y juegos (slug: juguetes-y-juegos)

SQL safe-insert (insertar solo si no existe):

-- Crear tabla si no existe
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inserciones idempotentes para las 22 categorías
INSERT INTO categories (id, name, slug)
SELECT gen_random_uuid(), 'Mujer', 'mujer'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'mujer');

INSERT INTO categories (id, name, slug)
SELECT gen_random_uuid(), 'Curvy', 'curvy'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'curvy');

INSERT INTO categories (id, name, slug)
SELECT gen_random_uuid(), 'Niños', 'ninos'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'ninos');

INSERT INTO categories (id, name, slug)
SELECT gen_random_uuid(), 'Hombre', 'hombre'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'hombre');

INSERT INTO categories (id, name, slug)
SELECT gen_random_uuid(), 'Sweaters', 'sweaters'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'sweaters');

INSERT INTO categories (id, name, slug)
SELECT gen_random_uuid(), 'Celulares y Accs', 'celulares-y-accs'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'celulares-y-accs');

INSERT INTO categories (id, name, slug)
SELECT gen_random_uuid(), 'Joyería y accs', 'joyeria-y-accs'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'joyeria-y-accs');

INSERT INTO categories (id, name, slug)
SELECT gen_random_uuid(), 'Tops', 'tops'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'tops');

INSERT INTO categories (id, name, slug)
SELECT gen_random_uuid(), 'Hogar y Vida', 'hogar-y-vida'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'hogar-y-vida');

INSERT INTO categories (id, name, slug)
SELECT gen_random_uuid(), 'Belleza y salud', 'belleza-y-salud'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'belleza-y-salud');

INSERT INTO categories (id, name, slug)
SELECT gen_random_uuid(), 'Zapatos', 'zapatos'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'zapatos');

INSERT INTO categories (id, name, slug)
SELECT gen_random_uuid(), 'Deportes y Aire Libre', 'deportes-y-aire-libre'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'deportes-y-aire-libre');

INSERT INTO categories (id, name, slug)
SELECT gen_random_uuid(), 'Automotriz', 'automotriz'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'automotriz');

INSERT INTO categories (id, name, slug)
SELECT gen_random_uuid(), 'Mezclilla', 'mezclilla'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'mezclilla');

INSERT INTO categories (id, name, slug)
SELECT gen_random_uuid(), 'Ropa Interior y Pijamas', 'ropa-interior-y-pijamas'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'ropa-interior-y-pijamas');

INSERT INTO categories (id, name, slug)
SELECT gen_random_uuid(), 'Bebé y maternidad', 'bebe-y-maternidad'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'bebe-y-maternidad');

INSERT INTO categories (id, name, slug)
SELECT gen_random_uuid(), 'Vestidos', 'vestidos'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'vestidos');

INSERT INTO categories (id, name, slug)
SELECT gen_random_uuid(), 'Bottoms', 'bottoms'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'bottoms');

INSERT INTO categories (id, name, slug)
SELECT gen_random_uuid(), 'Abrigos y Trajes', 'abrigos-y-trajes'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'abrigos-y-trajes');

INSERT INTO categories (id, name, slug)
SELECT gen_random_uuid(), 'Bolsas y Equipaje', 'bolsas-y-equipaje'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'bolsas-y-equipaje');

INSERT INTO categories (id, name, slug)
SELECT gen_random_uuid(), 'Útiles escolares y de oficina', 'utiles-escolares-y-oficina'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'utiles-escolares-y-oficina');

INSERT INTO categories (id, name, slug)
SELECT gen_random_uuid(), 'Juguetes y juegos', 'juguetes-y-juegos'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'juguetes-y-juegos');

---

Seeds adicionales y verificación (opcional):
- Después de crear las categorías, ejecutar las inserciones de productos mock (ya listadas en el prompt anterior) vinculando `categoria_id` mediante `SELECT id FROM categories WHERE slug = '...'

Consultas de verificación:
- SELECT count(*) FROM categories;
- SELECT * FROM categories ORDER BY name;

Rollback:
- Para eliminar sólo estas categorías si se desean borrar:
DELETE FROM categories WHERE slug IN (
  'mujer','curvy','ninos','hombre','sweaters','celulares-y-accs','joyeria-y-accs','tops','hogar-y-vida','belleza-y-salud','zapatos','deportes-y-aire-libre','automotriz','mezclilla','ropa-interior-y-pijamas','bebe-y-maternidad','vestidos','bottoms','abrigos-y-trajes','bolsas-y-equipaje','utiles-escolares-y-oficina','juguetes-y-juegos'
);

---

Pasos recomendados para ejecutar:
1) Backup snapshot de la DB actual.
2) Ejecutar el script en staging.
3) Validar con las consultas de verificación.
4) Migrar a producción y ejecutar seeds si procede.

Por favor, ejecuta el script y devuelve logs de ejecución y cualquier error o advertencia. Gracias.