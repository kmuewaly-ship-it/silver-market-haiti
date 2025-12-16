-- 1. Enable the pgvector extension to work with embeddings
create extension if not exists vector;

-- 2. Add the embedding column to your products table
-- We use 512 dimensions because that's what the CLIP model (Xenova/clip-vit-base-patch32) outputs.
alter table products 
add column if not exists embedding vector(512);

-- 3. Create an index for faster searching (optional but recommended for production)
create index on products using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- 4. Create the search function (RPC)
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
