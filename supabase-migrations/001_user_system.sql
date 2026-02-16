-- Create a table for public profiles
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.users enable row level security;

create policy "Public profiles are viewable by everyone."
  on public.users for select
  using ( true );

create policy "Users can insert their own profile."
  on public.users for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on public.users for update
  using ( auth.uid() = id );

-- Trigger to handle new user signups
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

-- Trigger the function every time a user is created
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Add user_id to sf_posts
alter table public.sf_posts 
add column if not exists user_id uuid references public.users(id) on delete set null;

-- Update sf_posts RLS
alter table public.sf_posts enable row level security;

create policy "Posts are viewable by everyone."
  on public.sf_posts for select
  using ( true );

create policy "Users can insert their own posts."
  on public.sf_posts for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own posts."
  on public.sf_posts for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own posts."
  on public.sf_posts for delete
  using ( auth.uid() = user_id );

-- Allow service role to do everything (for backend)
create policy "Service role can do everything"
  on public.sf_posts
  using ( auth.role() = 'service_role' )
  with check ( auth.role() = 'service_role' );
