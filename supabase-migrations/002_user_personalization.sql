-- Add personalization columns to public.users table
alter table public.users
-- Instagram data
add column if not exists instagram_handle text,
add column if not exists instagram_username text,

-- Business data
add column if not exists target_audience text,
add column if not exists main_pain_point text,
add column if not exists voice_tone text default 'professional',

-- User prompt for AI personalization (500 chars max)
add column if not exists user_prompt text check (char_length(user_prompt) <= 500),

-- Setup completion flag
add column if not exists setup_completed boolean default false,

-- Avatar upload
add column if not exists avatar_path text;

-- Add comment for documentation
comment on column public.users.instagram_handle is 'Nome do perfil do Instagram (ex: Shadowfeed AI)';
comment on column public.users.instagram_username is 'Username do Instagram (ex: @shadowfeed)';
comment on column public.users.target_audience is 'Público-alvo do conteúdo';
comment on column public.users.main_pain_point is 'Dor principal que resolve';
comment on column public.users.voice_tone is 'Tom de voz: formal, amigável, provocativo, inspiracional, humorístico';
comment on column public.users.user_prompt is 'Descrição do negócio para personalização da IA (max 500 caracteres)';
comment on column public.users.setup_completed is 'Flag indicando se o usuário completou o setup';
comment on column public.users.avatar_path is 'Caminho do avatar no storage';
