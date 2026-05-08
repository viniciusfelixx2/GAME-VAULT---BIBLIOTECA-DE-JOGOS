-- GameVault - Banco de dados Supabase
-- Execute este arquivo no SQL Editor do Supabase antes de usar o frontend.

create extension if not exists "pgcrypto";

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name varchar(80) not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  name varchar(120) not null,
  platform varchar(80) not null,
  price numeric(10,2) not null default 0 check (price >= 0),
  status varchar(30) not null default 'Quero jogar' check (status in ('Quero jogar', 'Jogando', 'Finalizado', 'Pausado')),
  rating numeric(3,1) not null default 0 check (rating >= 0 and rating <= 10),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists games_set_updated_at on public.games;
create trigger games_set_updated_at
before update on public.games
for each row execute function public.set_updated_at();

alter table public.categories enable row level security;
alter table public.games enable row level security;

-- Políticas da tabela categories
create policy "Usuários podem visualizar suas categorias"
on public.categories for select
to authenticated
using (auth.uid() = user_id);

create policy "Usuários podem cadastrar suas categorias"
on public.categories for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Usuários podem atualizar suas categorias"
on public.categories for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Usuários podem excluir suas categorias"
on public.categories for delete
to authenticated
using (auth.uid() = user_id);

-- Políticas da tabela games
create policy "Usuários podem visualizar seus jogos"
on public.games for select
to authenticated
using (auth.uid() = user_id);

create policy "Usuários podem cadastrar seus jogos"
on public.games for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Usuários podem atualizar seus jogos"
on public.games for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Usuários podem excluir seus jogos"
on public.games for delete
to authenticated
using (auth.uid() = user_id);

-- Índices para melhorar consultas REST
create index if not exists idx_categories_user_id on public.categories(user_id);
create index if not exists idx_games_user_id on public.games(user_id);
create index if not exists idx_games_category_id on public.games(category_id);
