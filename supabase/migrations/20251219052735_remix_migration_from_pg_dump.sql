CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'moderator',
    'user',
    'seller'
);


--
-- Name: approval_request_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.approval_request_type AS ENUM (
    'kyc_verification',
    'referral_bonus',
    'credit_limit_increase',
    'credit_activation'
);


--
-- Name: approval_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.approval_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);


--
-- Name: payment_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_method AS ENUM (
    'stripe',
    'moncash',
    'transfer'
);


--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'verified',
    'rejected'
);


--
-- Name: stock_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.stock_status AS ENUM (
    'in_stock',
    'low_stock',
    'out_of_stock'
);


--
-- Name: verification_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.verification_status AS ENUM (
    'unverified',
    'pending_verification',
    'verified',
    'rejected'
);


--
-- Name: fn_create_seller_store(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_create_seller_store() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_user_email TEXT;
  v_user_name TEXT;
  v_store_id UUID;
BEGIN
  -- Only process when a seller role is assigned
  IF NEW.role = 'seller' THEN
    -- Check if store already exists for this user
    SELECT id INTO v_store_id
    FROM public.stores
    WHERE owner_user_id = NEW.user_id
    LIMIT 1;
    
    IF v_store_id IS NULL THEN
      -- Get user info from profiles
      SELECT email, full_name INTO v_user_email, v_user_name
      FROM public.profiles
      WHERE id = NEW.user_id;
      
      -- Create store for the seller
      INSERT INTO public.stores (
        owner_user_id,
        name,
        slug,
        description,
        is_active
      ) VALUES (
        NEW.user_id,
        COALESCE(v_user_name, 'Mi Tienda'),
        'tienda-' || REPLACE(NEW.user_id::TEXT, '-', ''),
        'Tienda de ' || COALESCE(v_user_name, v_user_email),
        true
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: fn_handle_b2b_payment(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_handle_b2b_payment() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_cart_id UUID;
  v_buyer_id UUID;
  v_store_id UUID;
  v_item RECORD;
  v_catalog_id UUID;
  v_previous_stock INTEGER;
  v_product_images JSONB;
BEGIN
  -- Solo procesar cuando el status cambia a 'paid'
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    
    -- Obtener el buyer_id del pedido
    v_buyer_id := NEW.seller_id; -- En orders_b2b, seller_id es el comprador mayorista
    
    -- Buscar o crear la tienda del comprador
    SELECT id INTO v_store_id
    FROM public.stores
    WHERE owner_user_id = v_buyer_id
    LIMIT 1;
    
    IF v_store_id IS NULL THEN
      -- Crear tienda placeholder para el comprador
      INSERT INTO public.stores (owner_user_id, name, slug, description)
      VALUES (
        v_buyer_id,
        'Mi Tienda',
        'tienda-' || REPLACE(v_buyer_id::TEXT, '-', ''),
        'Tienda creada automáticamente'
      )
      RETURNING id INTO v_store_id;
    END IF;
    
    -- Procesar cada item del pedido
    FOR v_item IN 
      SELECT oi.*, p.imagen_principal, p.galeria_imagenes, p.descripcion_corta
      FROM public.order_items_b2b oi
      LEFT JOIN public.products p ON p.id = oi.product_id
      WHERE oi.order_id = NEW.id
    LOOP
      -- Preparar imágenes
      v_product_images := COALESCE(
        to_jsonb(ARRAY[v_item.imagen_principal] || COALESCE(v_item.galeria_imagenes, ARRAY[]::TEXT[])),
        '[]'::JSONB
      );
      
      -- Buscar si ya existe en el catálogo del seller
      SELECT id, stock INTO v_catalog_id, v_previous_stock
      FROM public.seller_catalog
      WHERE seller_store_id = v_store_id 
        AND source_product_id = v_item.product_id
      LIMIT 1;
      
      IF v_catalog_id IS NOT NULL THEN
        -- Actualizar stock existente
        UPDATE public.seller_catalog
        SET 
          stock = stock + v_item.cantidad,
          updated_at = now()
        WHERE id = v_catalog_id;
        
        -- Registrar movimiento
        INSERT INTO public.inventory_movements (
          seller_catalog_id,
          change_amount,
          previous_stock,
          new_stock,
          reason,
          reference_type,
          reference_id
        ) VALUES (
          v_catalog_id,
          v_item.cantidad,
          v_previous_stock,
          v_previous_stock + v_item.cantidad,
          'Importación por compra B2B',
          'b2b_order',
          NEW.id
        );
      ELSE
        -- Crear nueva entrada en el catálogo
        INSERT INTO public.seller_catalog (
          seller_store_id,
          source_product_id,
          source_order_id,
          sku,
          nombre,
          descripcion,
          precio_venta,
          precio_costo,
          stock,
          images
        ) VALUES (
          v_store_id,
          v_item.product_id,
          NEW.id,
          v_item.sku,
          v_item.nombre,
          v_item.descripcion_corta,
          v_item.precio_unitario * 1.3, -- Margen sugerido del 30%
          v_item.precio_unitario,
          v_item.cantidad,
          v_product_images
        )
        RETURNING id INTO v_catalog_id;
        
        -- Registrar movimiento inicial
        INSERT INTO public.inventory_movements (
          seller_catalog_id,
          change_amount,
          previous_stock,
          new_stock,
          reason,
          reference_type,
          reference_id
        ) VALUES (
          v_catalog_id,
          v_item.cantidad,
          0,
          v_item.cantidad,
          'Importación inicial por compra B2B',
          'b2b_order',
          NEW.id
        );
      END IF;
      
      -- Reducir stock del producto maestro
      UPDATE public.products
      SET stock_fisico = stock_fisico - v_item.cantidad
      WHERE id = v_item.product_id;
      
    END LOOP;
    
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: generate_payment_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_payment_number() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.payment_number := 'PAY-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$;


--
-- Name: generate_quote_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_quote_number() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.quote_number := 'QT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$;


--
-- Name: generate_referral_code(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_referral_code() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  new_code TEXT;
BEGIN
  -- Solo generar código para sellers verificados
  IF NEW.status = 'verified' AND (OLD IS NULL OR OLD.status != 'verified') THEN
    -- Generar código único
    new_code := 'SIVER' || UPPER(SUBSTRING(MD5(NEW.user_id::TEXT || NOW()::TEXT) FROM 1 FOR 6));
    
    -- Insertar código si no existe
    INSERT INTO public.referral_codes (user_id, code)
    VALUES (NEW.user_id, new_code)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: get_trending_products(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_trending_products(days_back integer DEFAULT 7, limit_count integer DEFAULT 20) RETURNS TABLE(product_id uuid, view_count bigint, product_data jsonb)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pv.product_id,
    COUNT(pv.id) as view_count,
    jsonb_build_object(
      'id', p.id,
      'nombre', p.nombre,
      'precio_mayorista', p.precio_mayorista,
      'precio_sugerido_venta', p.precio_sugerido_venta,
      'imagen_principal', p.imagen_principal,
      'categoria_id', p.categoria_id,
      'sku_interno', p.sku_interno,
      'stock_status', p.stock_status
    ) as product_data
  FROM product_views pv
  JOIN products p ON p.id = pv.product_id
  WHERE pv.viewed_at >= NOW() - (days_back || ' days')::INTERVAL
    AND p.is_active = true
  GROUP BY pv.product_id, p.id, p.nombre, p.precio_mayorista, p.precio_sugerido_venta, 
           p.imagen_principal, p.categoria_id, p.sku_interno, p.stock_status
  ORDER BY view_count DESC
  LIMIT limit_count;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: is_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;


--
-- Name: is_seller(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_seller(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT public.has_role(_user_id, 'seller')
$$;


SET default_table_access_method = heap;

--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sku_interno text NOT NULL,
    nombre text NOT NULL,
    descripcion_corta text,
    descripcion_larga text,
    categoria_id uuid,
    proveedor_id uuid,
    precio_mayorista numeric(10,2) DEFAULT 0 NOT NULL,
    precio_sugerido_venta numeric(10,2),
    moq integer DEFAULT 1 NOT NULL,
    stock_fisico integer DEFAULT 0 NOT NULL,
    stock_status public.stock_status DEFAULT 'in_stock'::public.stock_status NOT NULL,
    peso_kg numeric(6,3),
    dimensiones_cm jsonb,
    imagen_principal text,
    galeria_imagenes text[],
    url_origen text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    embedding public.vector(512),
    costo_base_excel numeric DEFAULT 0
);


--
-- Name: match_products(public.vector, double precision, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.match_products(query_embedding public.vector, match_threshold double precision, match_count integer) RETURNS SETOF public.products
    LANGUAGE plpgsql
    AS $$
begin
  return query
  select *
  from products
  where 1 - (products.embedding <=> query_embedding) > match_threshold
  order by products.embedding <=> query_embedding
  limit match_count;
end;
$$;


--
-- Name: update_stock_status(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_stock_status() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.stock_fisico = 0 THEN
    NEW.stock_status := 'out_of_stock';
  ELSIF NEW.stock_fisico < NEW.moq THEN
    NEW.stock_status := 'low_stock';
  ELSE
    NEW.stock_status := 'in_stock';
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: addresses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.addresses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    label text DEFAULT 'Casa'::text NOT NULL,
    full_name text NOT NULL,
    phone text,
    street_address text NOT NULL,
    city text NOT NULL,
    state text,
    postal_code text,
    country text DEFAULT 'Haiti'::text NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: admin_approval_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_approval_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    request_type public.approval_request_type NOT NULL,
    requester_id uuid NOT NULL,
    status public.approval_status DEFAULT 'pending'::public.approval_status NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    amount numeric,
    admin_comments text,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: admin_banners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_banners (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    image_url text NOT NULL,
    link_url text,
    target_audience text DEFAULT 'all'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    starts_at timestamp with time zone,
    ends_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: b2b_cart_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.b2b_cart_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cart_id uuid NOT NULL,
    product_id uuid,
    sku text NOT NULL,
    nombre text NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    total_price numeric(12,2) NOT NULL,
    color text,
    size text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT b2b_cart_items_quantity_check CHECK ((quantity > 0))
);


--
-- Name: b2b_carts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.b2b_carts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    buyer_user_id uuid NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    notes text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT b2b_carts_status_check CHECK ((status = ANY (ARRAY['open'::text, 'completed'::text, 'cancelled'::text])))
);


--
-- Name: b2b_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.b2b_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    payment_number text NOT NULL,
    seller_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    method public.payment_method NOT NULL,
    reference text NOT NULL,
    status public.payment_status DEFAULT 'pending'::public.payment_status NOT NULL,
    notes text,
    verified_by uuid,
    verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    parent_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_visible_public boolean DEFAULT true NOT NULL,
    description text,
    icon text,
    sort_order integer DEFAULT 0
);


--
-- Name: credit_movements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.credit_movements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    movement_type text NOT NULL,
    amount numeric NOT NULL,
    balance_before numeric NOT NULL,
    balance_after numeric NOT NULL,
    reference_id uuid,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: dynamic_expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dynamic_expenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre_gasto text NOT NULL,
    valor numeric DEFAULT 0 NOT NULL,
    tipo text NOT NULL,
    operacion text NOT NULL,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dynamic_expenses_operacion_check CHECK ((operacion = ANY (ARRAY['suma'::text, 'resta'::text]))),
    CONSTRAINT dynamic_expenses_tipo_check CHECK ((tipo = ANY (ARRAY['fijo'::text, 'porcentual'::text])))
);


--
-- Name: inventory_movements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_movements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid,
    seller_catalog_id uuid,
    change_amount integer NOT NULL,
    previous_stock integer,
    new_stock integer,
    reason text NOT NULL,
    reference_type text,
    reference_id uuid,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: kyc_verifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kyc_verifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    status public.verification_status DEFAULT 'unverified'::public.verification_status NOT NULL,
    id_front_url text,
    id_back_url text,
    fiscal_document_url text,
    submitted_at timestamp with time zone,
    reviewed_at timestamp with time zone,
    reviewed_by uuid,
    admin_comments text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: order_items_b2b; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items_b2b (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    product_id uuid,
    sku text NOT NULL,
    nombre text NOT NULL,
    cantidad integer NOT NULL,
    precio_unitario numeric(10,2) NOT NULL,
    descuento_percent numeric(5,2) DEFAULT 0.00,
    subtotal numeric(12,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: orders_b2b; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders_b2b (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    seller_id uuid NOT NULL,
    buyer_id uuid,
    status text DEFAULT 'draft'::text NOT NULL,
    total_amount numeric(12,2) DEFAULT 0.00 NOT NULL,
    total_quantity integer DEFAULT 0 NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    payment_method text,
    notes text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: pending_quotes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pending_quotes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    seller_id uuid NOT NULL,
    quote_number text NOT NULL,
    cart_snapshot jsonb NOT NULL,
    total_amount numeric DEFAULT 0 NOT NULL,
    total_quantity integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    admin_notes text,
    seller_notes text,
    whatsapp_sent_at timestamp with time zone,
    responded_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: price_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.price_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    value numeric DEFAULT 0 NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: product_price_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_price_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    campo_modificado text NOT NULL,
    valor_anterior text,
    valor_nuevo text,
    modificado_por uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: product_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_views (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    user_id uuid,
    session_id text,
    viewed_at timestamp with time zone DEFAULT now() NOT NULL,
    source text DEFAULT 'direct'::text
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    banner_url text
);


--
-- Name: referral_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referral_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    code text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: referral_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referral_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bonus_per_referral numeric DEFAULT 20 NOT NULL,
    referrals_for_credit_increase integer DEFAULT 5 NOT NULL,
    credit_increase_amount numeric DEFAULT 100 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: referrals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referrals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    referrer_id uuid NOT NULL,
    referred_id uuid NOT NULL,
    referral_code text NOT NULL,
    first_purchase_completed boolean DEFAULT false NOT NULL,
    first_purchase_at timestamp with time zone,
    bonus_amount numeric DEFAULT 0,
    bonus_approved boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: seller_catalog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seller_catalog (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    seller_store_id uuid NOT NULL,
    source_product_id uuid,
    source_order_id uuid,
    sku text NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    precio_venta numeric(12,2) DEFAULT 0 NOT NULL,
    precio_costo numeric(12,2) DEFAULT 0 NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    images jsonb DEFAULT '[]'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    imported_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: seller_credits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seller_credits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    credit_limit numeric DEFAULT 0 NOT NULL,
    balance_debt numeric DEFAULT 0 NOT NULL,
    max_cart_percentage integer DEFAULT 50 NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    activated_at timestamp with time zone,
    activated_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: seller_statuses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seller_statuses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid NOT NULL,
    image_url text NOT NULL,
    caption text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '24:00:00'::interval) NOT NULL
);


--
-- Name: sellers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sellers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    business_name text,
    is_verified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: stores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_user_id uuid NOT NULL,
    name text NOT NULL,
    slug text,
    description text,
    logo text,
    banner text,
    metadata jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    country text DEFAULT 'Haiti'::text,
    city text,
    instagram text,
    facebook text,
    whatsapp text,
    tiktok text
);


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suppliers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    contact_email text,
    contact_phone text,
    country text DEFAULT 'China'::text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


--
-- Name: admin_approval_requests admin_approval_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_approval_requests
    ADD CONSTRAINT admin_approval_requests_pkey PRIMARY KEY (id);


--
-- Name: admin_banners admin_banners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_banners
    ADD CONSTRAINT admin_banners_pkey PRIMARY KEY (id);


--
-- Name: b2b_cart_items b2b_cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.b2b_cart_items
    ADD CONSTRAINT b2b_cart_items_pkey PRIMARY KEY (id);


--
-- Name: b2b_carts b2b_carts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.b2b_carts
    ADD CONSTRAINT b2b_carts_pkey PRIMARY KEY (id);


--
-- Name: b2b_payments b2b_payments_payment_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.b2b_payments
    ADD CONSTRAINT b2b_payments_payment_number_key UNIQUE (payment_number);


--
-- Name: b2b_payments b2b_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.b2b_payments
    ADD CONSTRAINT b2b_payments_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- Name: credit_movements credit_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_movements
    ADD CONSTRAINT credit_movements_pkey PRIMARY KEY (id);


--
-- Name: dynamic_expenses dynamic_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dynamic_expenses
    ADD CONSTRAINT dynamic_expenses_pkey PRIMARY KEY (id);


--
-- Name: inventory_movements inventory_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_pkey PRIMARY KEY (id);


--
-- Name: kyc_verifications kyc_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kyc_verifications
    ADD CONSTRAINT kyc_verifications_pkey PRIMARY KEY (id);


--
-- Name: kyc_verifications kyc_verifications_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kyc_verifications
    ADD CONSTRAINT kyc_verifications_user_id_key UNIQUE (user_id);


--
-- Name: order_items_b2b order_items_b2b_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items_b2b
    ADD CONSTRAINT order_items_b2b_pkey PRIMARY KEY (id);


--
-- Name: orders_b2b orders_b2b_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders_b2b
    ADD CONSTRAINT orders_b2b_pkey PRIMARY KEY (id);


--
-- Name: pending_quotes pending_quotes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_quotes
    ADD CONSTRAINT pending_quotes_pkey PRIMARY KEY (id);


--
-- Name: price_settings price_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_settings
    ADD CONSTRAINT price_settings_key_key UNIQUE (key);


--
-- Name: price_settings price_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_settings
    ADD CONSTRAINT price_settings_pkey PRIMARY KEY (id);


--
-- Name: product_price_history product_price_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_price_history
    ADD CONSTRAINT product_price_history_pkey PRIMARY KEY (id);


--
-- Name: product_views product_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_views
    ADD CONSTRAINT product_views_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_sku_interno_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_interno_key UNIQUE (sku_interno);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: referral_codes referral_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_codes
    ADD CONSTRAINT referral_codes_code_key UNIQUE (code);


--
-- Name: referral_codes referral_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_codes
    ADD CONSTRAINT referral_codes_pkey PRIMARY KEY (id);


--
-- Name: referral_codes referral_codes_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_codes
    ADD CONSTRAINT referral_codes_user_id_key UNIQUE (user_id);


--
-- Name: referral_settings referral_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_settings
    ADD CONSTRAINT referral_settings_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_referred_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referred_id_key UNIQUE (referred_id);


--
-- Name: seller_catalog seller_catalog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seller_catalog
    ADD CONSTRAINT seller_catalog_pkey PRIMARY KEY (id);


--
-- Name: seller_credits seller_credits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seller_credits
    ADD CONSTRAINT seller_credits_pkey PRIMARY KEY (id);


--
-- Name: seller_credits seller_credits_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seller_credits
    ADD CONSTRAINT seller_credits_user_id_key UNIQUE (user_id);


--
-- Name: seller_statuses seller_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seller_statuses
    ADD CONSTRAINT seller_statuses_pkey PRIMARY KEY (id);


--
-- Name: sellers sellers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sellers
    ADD CONSTRAINT sellers_pkey PRIMARY KEY (id);


--
-- Name: stores stores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_pkey PRIMARY KEY (id);


--
-- Name: stores stores_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_slug_key UNIQUE (slug);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_admin_banners_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_banners_active ON public.admin_banners USING btree (is_active, target_audience, sort_order);


--
-- Name: idx_b2b_cart_items_cart; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_b2b_cart_items_cart ON public.b2b_cart_items USING btree (cart_id);


--
-- Name: idx_b2b_cart_items_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_b2b_cart_items_product ON public.b2b_cart_items USING btree (product_id);


--
-- Name: idx_b2b_carts_buyer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_b2b_carts_buyer ON public.b2b_carts USING btree (buyer_user_id);


--
-- Name: idx_b2b_carts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_b2b_carts_status ON public.b2b_carts USING btree (status);


--
-- Name: idx_categories_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categories_parent ON public.categories USING btree (parent_id);


--
-- Name: idx_categories_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categories_slug ON public.categories USING btree (slug);


--
-- Name: idx_categories_visible; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categories_visible ON public.categories USING btree (is_visible_public);


--
-- Name: idx_inventory_movements_catalog; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventory_movements_catalog ON public.inventory_movements USING btree (seller_catalog_id);


--
-- Name: idx_inventory_movements_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventory_movements_created ON public.inventory_movements USING btree (created_at);


--
-- Name: idx_inventory_movements_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventory_movements_product ON public.inventory_movements USING btree (product_id);


--
-- Name: idx_order_items_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_items_order ON public.order_items_b2b USING btree (order_id);


--
-- Name: idx_order_items_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_items_product ON public.order_items_b2b USING btree (product_id);


--
-- Name: idx_orders_b2b_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_b2b_created ON public.orders_b2b USING btree (created_at DESC);


--
-- Name: idx_orders_b2b_seller; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_b2b_seller ON public.orders_b2b USING btree (seller_id);


--
-- Name: idx_orders_b2b_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_b2b_status ON public.orders_b2b USING btree (status);


--
-- Name: idx_product_views_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_views_product_id ON public.product_views USING btree (product_id);


--
-- Name: idx_product_views_viewed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_views_viewed_at ON public.product_views USING btree (viewed_at DESC);


--
-- Name: idx_products_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_active ON public.products USING btree (is_active);


--
-- Name: idx_products_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_categoria ON public.products USING btree (categoria_id);


--
-- Name: idx_products_precio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_precio ON public.products USING btree (precio_mayorista);


--
-- Name: idx_products_sku; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_sku ON public.products USING btree (sku_interno);


--
-- Name: idx_seller_catalog_sku; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seller_catalog_sku ON public.seller_catalog USING btree (sku);


--
-- Name: idx_seller_catalog_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seller_catalog_source ON public.seller_catalog USING btree (source_product_id);


--
-- Name: idx_seller_catalog_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seller_catalog_store ON public.seller_catalog USING btree (seller_store_id);


--
-- Name: idx_seller_statuses_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seller_statuses_expires ON public.seller_statuses USING btree (expires_at);


--
-- Name: idx_seller_statuses_store_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seller_statuses_store_expires ON public.seller_statuses USING btree (store_id, expires_at DESC);


--
-- Name: idx_stores_owner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stores_owner ON public.stores USING btree (owner_user_id);


--
-- Name: idx_stores_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stores_slug ON public.stores USING btree (slug);


--
-- Name: b2b_payments generate_payment_number_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER generate_payment_number_trigger BEFORE INSERT ON public.b2b_payments FOR EACH ROW EXECUTE FUNCTION public.generate_payment_number();


--
-- Name: kyc_verifications generate_referral_code_on_verify; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER generate_referral_code_on_verify AFTER UPDATE ON public.kyc_verifications FOR EACH ROW EXECUTE FUNCTION public.generate_referral_code();


--
-- Name: user_roles on_seller_role_assigned; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_seller_role_assigned AFTER INSERT ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.fn_create_seller_store();


--
-- Name: pending_quotes set_quote_number; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_quote_number BEFORE INSERT ON public.pending_quotes FOR EACH ROW EXECUTE FUNCTION public.generate_quote_number();


--
-- Name: orders_b2b trg_b2b_payment_completed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_b2b_payment_completed AFTER UPDATE ON public.orders_b2b FOR EACH ROW EXECUTE FUNCTION public.fn_handle_b2b_payment();


--
-- Name: addresses update_addresses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON public.addresses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: admin_approval_requests update_admin_approval_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_admin_approval_requests_updated_at BEFORE UPDATE ON public.admin_approval_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: b2b_carts update_b2b_carts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_b2b_carts_updated_at BEFORE UPDATE ON public.b2b_carts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: b2b_payments update_b2b_payments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_b2b_payments_updated_at BEFORE UPDATE ON public.b2b_payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: categories update_categories_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dynamic_expenses update_dynamic_expenses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dynamic_expenses_updated_at BEFORE UPDATE ON public.dynamic_expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: kyc_verifications update_kyc_verifications_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_kyc_verifications_updated_at BEFORE UPDATE ON public.kyc_verifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: orders_b2b update_orders_b2b_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_orders_b2b_updated_at BEFORE UPDATE ON public.orders_b2b FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: price_settings update_price_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_price_settings_updated_at BEFORE UPDATE ON public.price_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: products update_product_stock_status; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_product_stock_status BEFORE INSERT OR UPDATE OF stock_fisico, moq ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_stock_status();


--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: seller_catalog update_seller_catalog_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_seller_catalog_updated_at BEFORE UPDATE ON public.seller_catalog FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: seller_credits update_seller_credits_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_seller_credits_updated_at BEFORE UPDATE ON public.seller_credits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: sellers update_sellers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_sellers_updated_at BEFORE UPDATE ON public.sellers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: stores update_stores_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: suppliers update_suppliers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: addresses addresses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: admin_approval_requests admin_approval_requests_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_approval_requests
    ADD CONSTRAINT admin_approval_requests_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: admin_approval_requests admin_approval_requests_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_approval_requests
    ADD CONSTRAINT admin_approval_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);


--
-- Name: b2b_cart_items b2b_cart_items_cart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.b2b_cart_items
    ADD CONSTRAINT b2b_cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.b2b_carts(id) ON DELETE CASCADE;


--
-- Name: b2b_cart_items b2b_cart_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.b2b_cart_items
    ADD CONSTRAINT b2b_cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: b2b_carts b2b_carts_buyer_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.b2b_carts
    ADD CONSTRAINT b2b_carts_buyer_user_id_fkey FOREIGN KEY (buyer_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: b2b_payments b2b_payments_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.b2b_payments
    ADD CONSTRAINT b2b_payments_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.sellers(id) ON DELETE CASCADE;


--
-- Name: b2b_payments b2b_payments_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.b2b_payments
    ADD CONSTRAINT b2b_payments_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES auth.users(id);


--
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id);


--
-- Name: credit_movements credit_movements_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_movements
    ADD CONSTRAINT credit_movements_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: inventory_movements inventory_movements_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: inventory_movements inventory_movements_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: inventory_movements inventory_movements_seller_catalog_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_seller_catalog_id_fkey FOREIGN KEY (seller_catalog_id) REFERENCES public.seller_catalog(id) ON DELETE SET NULL;


--
-- Name: kyc_verifications kyc_verifications_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kyc_verifications
    ADD CONSTRAINT kyc_verifications_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);


--
-- Name: kyc_verifications kyc_verifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kyc_verifications
    ADD CONSTRAINT kyc_verifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: order_items_b2b order_items_b2b_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items_b2b
    ADD CONSTRAINT order_items_b2b_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders_b2b(id) ON DELETE CASCADE;


--
-- Name: order_items_b2b order_items_b2b_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items_b2b
    ADD CONSTRAINT order_items_b2b_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: orders_b2b orders_b2b_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders_b2b
    ADD CONSTRAINT orders_b2b_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: orders_b2b orders_b2b_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders_b2b
    ADD CONSTRAINT orders_b2b_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: product_price_history product_price_history_modificado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_price_history
    ADD CONSTRAINT product_price_history_modificado_por_fkey FOREIGN KEY (modificado_por) REFERENCES auth.users(id);


--
-- Name: product_price_history product_price_history_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_price_history
    ADD CONSTRAINT product_price_history_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_views product_views_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_views
    ADD CONSTRAINT product_views_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_views product_views_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_views
    ADD CONSTRAINT product_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: products products_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categories(id);


--
-- Name: products products_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.suppliers(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: referral_codes referral_codes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_codes
    ADD CONSTRAINT referral_codes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: referrals referrals_referred_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referred_id_fkey FOREIGN KEY (referred_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: referrals referrals_referrer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: seller_catalog seller_catalog_seller_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seller_catalog
    ADD CONSTRAINT seller_catalog_seller_store_id_fkey FOREIGN KEY (seller_store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: seller_catalog seller_catalog_source_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seller_catalog
    ADD CONSTRAINT seller_catalog_source_order_id_fkey FOREIGN KEY (source_order_id) REFERENCES public.orders_b2b(id) ON DELETE SET NULL;


--
-- Name: seller_catalog seller_catalog_source_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seller_catalog
    ADD CONSTRAINT seller_catalog_source_product_id_fkey FOREIGN KEY (source_product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: seller_credits seller_credits_activated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seller_credits
    ADD CONSTRAINT seller_credits_activated_by_fkey FOREIGN KEY (activated_by) REFERENCES auth.users(id);


--
-- Name: seller_credits seller_credits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seller_credits
    ADD CONSTRAINT seller_credits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: seller_statuses seller_statuses_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seller_statuses
    ADD CONSTRAINT seller_statuses_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: sellers sellers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sellers
    ADD CONSTRAINT sellers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: stores stores_owner_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: inventory_movements Admins can insert movements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert movements" ON public.inventory_movements FOR INSERT WITH CHECK ((public.is_admin(auth.uid()) OR (created_by = auth.uid())));


--
-- Name: product_price_history Admins can insert price history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert price history" ON public.product_price_history FOR INSERT WITH CHECK (public.is_admin(auth.uid()));


--
-- Name: b2b_cart_items Admins can manage all cart items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all cart items" ON public.b2b_cart_items USING (public.is_admin(auth.uid()));


--
-- Name: b2b_carts Admins can manage all carts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all carts" ON public.b2b_carts USING (public.is_admin(auth.uid()));


--
-- Name: seller_catalog Admins can manage all catalog items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all catalog items" ON public.seller_catalog USING (public.is_admin(auth.uid()));


--
-- Name: seller_credits Admins can manage all credits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all credits" ON public.seller_credits USING (public.is_admin(auth.uid()));


--
-- Name: kyc_verifications Admins can manage all kyc; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all kyc" ON public.kyc_verifications USING (public.is_admin(auth.uid()));


--
-- Name: pending_quotes Admins can manage all quotes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all quotes" ON public.pending_quotes USING (public.is_admin(auth.uid()));


--
-- Name: referrals Admins can manage all referrals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all referrals" ON public.referrals USING (public.is_admin(auth.uid()));


--
-- Name: admin_approval_requests Admins can manage all requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all requests" ON public.admin_approval_requests USING (public.is_admin(auth.uid()));


--
-- Name: seller_statuses Admins can manage all statuses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all statuses" ON public.seller_statuses USING (public.is_admin(auth.uid()));


--
-- Name: stores Admins can manage all stores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all stores" ON public.stores USING (public.is_admin(auth.uid()));


--
-- Name: admin_banners Admins can manage banners; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage banners" ON public.admin_banners USING (public.is_admin(auth.uid()));


--
-- Name: categories Admins can manage categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage categories" ON public.categories USING (public.is_admin(auth.uid()));


--
-- Name: referral_codes Admins can manage codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage codes" ON public.referral_codes USING (public.is_admin(auth.uid()));


--
-- Name: dynamic_expenses Admins can manage dynamic expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage dynamic expenses" ON public.dynamic_expenses USING (public.is_admin(auth.uid()));


--
-- Name: credit_movements Admins can manage movements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage movements" ON public.credit_movements USING (public.is_admin(auth.uid()));


--
-- Name: b2b_payments Admins can manage payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage payments" ON public.b2b_payments USING (public.is_admin(auth.uid()));


--
-- Name: price_settings Admins can manage price settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage price settings" ON public.price_settings USING (public.is_admin(auth.uid()));


--
-- Name: products Admins can manage products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage products" ON public.products USING (public.is_admin(auth.uid()));


--
-- Name: user_roles Admins can manage roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage roles" ON public.user_roles TO authenticated USING (public.is_admin(auth.uid()));


--
-- Name: sellers Admins can manage sellers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage sellers" ON public.sellers USING (public.is_admin(auth.uid()));


--
-- Name: referral_settings Admins can manage settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage settings" ON public.referral_settings USING (public.is_admin(auth.uid()));


--
-- Name: suppliers Admins can manage suppliers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage suppliers" ON public.suppliers USING (public.is_admin(auth.uid()));


--
-- Name: inventory_movements Admins can view all movements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all movements" ON public.inventory_movements FOR SELECT USING (public.is_admin(auth.uid()));


--
-- Name: b2b_payments Admins can view all payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all payments" ON public.b2b_payments FOR SELECT USING (public.is_admin(auth.uid()));


--
-- Name: products Admins can view all products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all products" ON public.products FOR SELECT USING (public.is_admin(auth.uid()));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));


--
-- Name: sellers Admins can view all sellers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all sellers" ON public.sellers FOR SELECT USING (public.is_admin(auth.uid()));


--
-- Name: product_price_history Admins can view price history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view price history" ON public.product_price_history FOR SELECT USING (public.is_admin(auth.uid()));


--
-- Name: product_views Admins can view product views; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view product views" ON public.product_views FOR SELECT USING (public.is_admin(auth.uid()));


--
-- Name: suppliers Admins can view suppliers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view suppliers" ON public.suppliers FOR SELECT USING (public.is_admin(auth.uid()));


--
-- Name: orders_b2b Admins full access to orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins full access to orders" ON public.orders_b2b USING (public.is_admin(auth.uid()));


--
-- Name: order_items_b2b Admins manage all items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage all items" ON public.order_items_b2b USING (public.is_admin(auth.uid()));


--
-- Name: product_views Anyone can insert product views; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert product views" ON public.product_views FOR INSERT WITH CHECK (true);


--
-- Name: referral_codes Anyone can view codes for lookup; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view codes for lookup" ON public.referral_codes FOR SELECT USING (true);


--
-- Name: referral_settings Anyone can view settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view settings" ON public.referral_settings FOR SELECT USING (true);


--
-- Name: b2b_cart_items Cart items deletable with open cart; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Cart items deletable with open cart" ON public.b2b_cart_items FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.b2b_carts c
  WHERE ((c.id = b2b_cart_items.cart_id) AND (c.buyer_user_id = auth.uid()) AND (c.status = 'open'::text)))));


--
-- Name: b2b_cart_items Cart items insertable with open cart; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Cart items insertable with open cart" ON public.b2b_cart_items FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.b2b_carts c
  WHERE ((c.id = b2b_cart_items.cart_id) AND (c.buyer_user_id = auth.uid()) AND (c.status = 'open'::text)))));


--
-- Name: b2b_cart_items Cart items updatable with open cart; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Cart items updatable with open cart" ON public.b2b_cart_items FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.b2b_carts c
  WHERE ((c.id = b2b_cart_items.cart_id) AND (c.buyer_user_id = auth.uid()) AND (c.status = 'open'::text)))));


--
-- Name: b2b_cart_items Cart items visible with parent cart; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Cart items visible with parent cart" ON public.b2b_cart_items FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.b2b_carts c
  WHERE ((c.id = b2b_cart_items.cart_id) AND ((c.buyer_user_id = auth.uid()) OR public.is_admin(auth.uid()))))));


--
-- Name: user_roles First user can self-assign admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "First user can self-assign admin" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (((auth.uid() = user_id) AND (NOT (EXISTS ( SELECT 1
   FROM public.user_roles user_roles_1
  WHERE (user_roles_1.role = 'admin'::public.app_role))))));


--
-- Name: order_items_b2b Items insertable with parent order; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Items insertable with parent order" ON public.order_items_b2b FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.orders_b2b o
  WHERE ((o.id = order_items_b2b.order_id) AND ((o.seller_id = auth.uid()) OR public.is_admin(auth.uid())) AND (o.status = 'draft'::text)))));


--
-- Name: order_items_b2b Items visible with parent order; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Items visible with parent order" ON public.order_items_b2b FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.orders_b2b o
  WHERE ((o.id = order_items_b2b.order_id) AND ((o.seller_id = auth.uid()) OR public.is_admin(auth.uid()))))));


--
-- Name: stores Owners can manage their stores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can manage their stores" ON public.stores USING ((owner_user_id = auth.uid()));


--
-- Name: admin_banners Public can view active banners; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view active banners" ON public.admin_banners FOR SELECT USING (((is_active = true) AND ((starts_at IS NULL) OR (starts_at <= now())) AND ((ends_at IS NULL) OR (ends_at > now()))));


--
-- Name: seller_catalog Public can view active catalog items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view active catalog items" ON public.seller_catalog FOR SELECT USING ((is_active = true));


--
-- Name: products Public can view active products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view active products" ON public.products FOR SELECT USING ((is_active = true));


--
-- Name: seller_statuses Public can view active statuses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view active statuses" ON public.seller_statuses FOR SELECT USING ((expires_at > now()));


--
-- Name: stores Public can view active stores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view active stores" ON public.stores FOR SELECT USING ((is_active = true));


--
-- Name: categories Public can view categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view categories" ON public.categories FOR SELECT USING (true);


--
-- Name: orders_b2b Sellers can create own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers can create own orders" ON public.orders_b2b FOR INSERT WITH CHECK ((seller_id = auth.uid()));


--
-- Name: pending_quotes Sellers can create quotes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers can create quotes" ON public.pending_quotes FOR INSERT WITH CHECK ((auth.uid() = seller_id));


--
-- Name: sellers Sellers can insert their own record; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers can insert their own record" ON public.sellers FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: orders_b2b Sellers can update draft orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers can update draft orders" ON public.orders_b2b FOR UPDATE USING (((seller_id = auth.uid()) AND (status = 'draft'::text)));


--
-- Name: pending_quotes Sellers can update own quotes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers can update own quotes" ON public.pending_quotes FOR UPDATE USING (((auth.uid() = seller_id) AND (status = 'pending'::text)));


--
-- Name: sellers Sellers can update their own record; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers can update their own record" ON public.sellers FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: orders_b2b Sellers can view own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers can view own orders" ON public.orders_b2b FOR SELECT USING ((seller_id = auth.uid()));


--
-- Name: pending_quotes Sellers can view own quotes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers can view own quotes" ON public.pending_quotes FOR SELECT USING ((auth.uid() = seller_id));


--
-- Name: sellers Sellers can view their own record; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers can view their own record" ON public.sellers FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: seller_catalog Store owners can manage their catalog; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Store owners can manage their catalog" ON public.seller_catalog USING ((EXISTS ( SELECT 1
   FROM public.stores s
  WHERE ((s.id = seller_catalog.seller_store_id) AND (s.owner_user_id = auth.uid())))));


--
-- Name: seller_statuses Store owners can manage their statuses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Store owners can manage their statuses" ON public.seller_statuses USING ((EXISTS ( SELECT 1
   FROM public.stores s
  WHERE ((s.id = seller_statuses.store_id) AND (s.owner_user_id = auth.uid())))));


--
-- Name: inventory_movements Store owners can view their movements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Store owners can view their movements" ON public.inventory_movements FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.seller_catalog sc
     JOIN public.stores s ON ((s.id = sc.seller_store_id)))
  WHERE ((sc.id = inventory_movements.seller_catalog_id) AND (s.owner_user_id = auth.uid())))));


--
-- Name: b2b_carts Users can create own carts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own carts" ON public.b2b_carts FOR INSERT WITH CHECK ((buyer_user_id = auth.uid()));


--
-- Name: addresses Users can create their own addresses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own addresses" ON public.addresses FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: addresses Users can delete their own addresses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own addresses" ON public.addresses FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: kyc_verifications Users can insert own kyc; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own kyc" ON public.kyc_verifications FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: referrals Users can insert referrals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert referrals" ON public.referrals FOR INSERT WITH CHECK ((auth.uid() = referred_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((auth.uid() = id));


--
-- Name: kyc_verifications Users can update own kyc; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own kyc" ON public.kyc_verifications FOR UPDATE USING (((auth.uid() = user_id) AND (status = 'unverified'::public.verification_status)));


--
-- Name: b2b_carts Users can update own open carts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own open carts" ON public.b2b_carts FOR UPDATE USING (((buyer_user_id = auth.uid()) AND (status = 'open'::text)));


--
-- Name: addresses Users can update their own addresses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own addresses" ON public.addresses FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = id));


--
-- Name: b2b_carts Users can view own carts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own carts" ON public.b2b_carts FOR SELECT USING ((buyer_user_id = auth.uid()));


--
-- Name: referral_codes Users can view own code; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own code" ON public.referral_codes FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: seller_credits Users can view own credits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own credits" ON public.seller_credits FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: kyc_verifications Users can view own kyc; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own kyc" ON public.kyc_verifications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: credit_movements Users can view own movements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own movements" ON public.credit_movements FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: referrals Users can view own referrals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own referrals" ON public.referrals FOR SELECT USING (((auth.uid() = referrer_id) OR (auth.uid() = referred_id)));


--
-- Name: admin_approval_requests Users can view own requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own requests" ON public.admin_approval_requests FOR SELECT USING ((auth.uid() = requester_id));


--
-- Name: addresses Users can view their own addresses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own addresses" ON public.addresses FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING ((auth.uid() = id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: addresses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_approval_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_approval_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_banners; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_banners ENABLE ROW LEVEL SECURITY;

--
-- Name: b2b_cart_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.b2b_cart_items ENABLE ROW LEVEL SECURITY;

--
-- Name: b2b_carts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.b2b_carts ENABLE ROW LEVEL SECURITY;

--
-- Name: b2b_payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.b2b_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

--
-- Name: credit_movements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.credit_movements ENABLE ROW LEVEL SECURITY;

--
-- Name: dynamic_expenses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dynamic_expenses ENABLE ROW LEVEL SECURITY;

--
-- Name: inventory_movements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

--
-- Name: kyc_verifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;

--
-- Name: order_items_b2b; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.order_items_b2b ENABLE ROW LEVEL SECURITY;

--
-- Name: orders_b2b; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orders_b2b ENABLE ROW LEVEL SECURITY;

--
-- Name: pending_quotes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pending_quotes ENABLE ROW LEVEL SECURITY;

--
-- Name: price_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.price_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: product_price_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_price_history ENABLE ROW LEVEL SECURITY;

--
-- Name: product_views; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: referral_codes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

--
-- Name: referral_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.referral_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: referrals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

--
-- Name: seller_catalog; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seller_catalog ENABLE ROW LEVEL SECURITY;

--
-- Name: seller_credits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seller_credits ENABLE ROW LEVEL SECURITY;

--
-- Name: seller_statuses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seller_statuses ENABLE ROW LEVEL SECURITY;

--
-- Name: sellers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

--
-- Name: stores; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

--
-- Name: suppliers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


