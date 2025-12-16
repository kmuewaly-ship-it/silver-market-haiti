-- 1. Habilitar la extensión pgvector
create extension if not exists vector;

-- 2. Añadir columna de embeddings (512 dimensiones para CLIP)
alter table products 
add column if not exists embedding vector(512);

-- 3. Crear la función de búsqueda por similitud
create or replace function match_products (
  query_embedding vector(512),
  match_threshold float,
  match_count int
)
returns setof products
language plpgsql
as $$
begin
  return query
  select *
  from products
  where 1 - (products.embedding <=> query_embedding) > match_threshold
  order by products.embedding <=> query_embedding
  limit match_count;
end;
$$;