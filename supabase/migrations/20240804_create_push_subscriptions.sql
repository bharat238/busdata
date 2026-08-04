-- Create push_subscriptions table for storing web push notification subscriptions
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  muted boolean default false,
  created_at timestamptz default now()
);

-- Add unique constraint on endpoint to prevent duplicate subscriptions
alter table public.push_subscriptions
  add constraint push_subscriptions_endpoint_key unique (endpoint);

-- Enable Row Level Security
alter table public.push_subscriptions enable row level security;

-- Allow inserts (for frontend subscription flow)
create policy "Allow insert for all users"
  on public.push_subscriptions
  for insert
  with check (true);

-- Note: No SELECT/UPDATE/DELETE policies added yet.
-- These should be added based on your authentication requirements.
