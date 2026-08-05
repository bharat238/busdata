-- Add missing RLS policies for push_subscriptions table
-- This fixes the bug where toggle mute/unmute doesn't update the database

-- Allow SELECT for all users (needed to read muted status)
create policy "Allow select for all users"
  on public.push_subscriptions
  for select
  using (true);

-- Allow UPDATE for all users (needed to toggle mute status)
create policy "Allow update for all users"
  on public.push_subscriptions
  for update
  using (true)
  with check (true);

-- Allow DELETE for all users (needed to clean up expired subscriptions)
create policy "Allow delete for all users"
  on public.push_subscriptions
  for delete
  using (true);
