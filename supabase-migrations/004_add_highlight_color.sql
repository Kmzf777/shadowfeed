-- Add highlight_color column to public.users table
alter table public.users
add column if not exists highlight_color text default '#8a00c4';

-- Add comment for documentation
comment on column public.users.highlight_color is 'Cor de destaque escolhida pelo usuário (hex code)';
