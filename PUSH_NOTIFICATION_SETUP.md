# Push Notification Setup Guide

This document contains the SQL commands needed to schedule the push notification reminders via pg_cron in Supabase.

## Prerequisites

Before running the SQL below, ensure you have:
1. Deployed the `send-reminders` Edge Function to Supabase
2. Added the Edge Function URL and your service role key to the SQL below

## pg_cron Schedule Setup

**IMPORTANT:** pg_cron runs in UTC. India (IST) is UTC+5:30. The three default times convert as follows:
- 8:30 AM IST = 3:00 AM UTC
- 1:30 PM IST = 8:00 AM UTC  
- 6:30 PM IST = 1:00 PM UTC

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Enable pg_cron and pg_net extensions (if not already enabled)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Schedule morning reminder (8:30 AM IST = 3:00 AM UTC)
select cron.schedule(
  'reminder-morning',
  '0 3 * * *',
  $$select net.http_post(
    url:='<YOUR_EDGE_FUNCTION_URL>',
    headers:='{"Authorization": "Bearer <YOUR_SERVICE_ROLE_KEY>"}'::jsonb,
    body:='{}'::jsonb
  )$$
);

-- Schedule afternoon reminder (1:30 PM IST = 8:00 AM UTC)
select cron.schedule(
  'reminder-afternoon',
  '0 8 * * *',
  $$select net.http_post(
    url:='<YOUR_EDGE_FUNCTION_URL>',
    headers:='{"Authorization": "Bearer <YOUR_SERVICE_ROLE_KEY>"}'::jsonb,
    body:='{}'::jsonb
  )$$
);

-- Schedule evening reminder (6:30 PM IST = 1:00 PM UTC)
select cron.schedule(
  'reminder-evening',
  '0 13 * * *',
  $$select net.http_post(
    url:='<YOUR_EDGE_FUNCTION_URL>',
    headers:='{"Authorization": "Bearer <YOUR_SERVICE_ROLE_KEY>"}'::jsonb,
    body:='{}'::jsonb
  )$$
);
```

**Replace the placeholders:**
- `<YOUR_EDGE_FUNCTION_URL>`: Your deployed Edge Function URL (e.g., `https://your-project.supabase.co/functions/v1/send-reminders`)
- `<YOUR_SERVICE_ROLE_KEY>`: Your Supabase service role key (found in Project Settings > API)

## How to Change Reminder Times

Since each time window is its own separate pg_cron schedule, changing a time requires two steps:

1. **Unschedule the existing job:**
   ```sql
   select cron.unschedule('reminder-morning');  -- or 'reminder-afternoon' or 'reminder-evening'
   ```

2. **Reschedule with the new UTC time:**
   ```sql
   select cron.schedule(
     'reminder-morning',
     '<NEW_CRON_EXPRESSION>',  -- e.g., '0 4 * * *' for 9:30 AM IST
     $$select net.http_post(
       url:='<YOUR_EDGE_FUNCTION_URL>',
       headers:='{"Authorization": "Bearer <YOUR_SERVICE_ROLE_KEY>"}'::jsonb,
       body:='{}'::jsonb
     )$$
   );
   ```

**Cron format:** `minute hour day-of-month month day-of-week`
- `0 3 * * *` = 3:00 AM UTC (8:30 AM IST)
- `0 8 * * *` = 8:00 AM UTC (1:30 PM IST)
- `0 13 * * *` = 1:00 PM UTC (6:30 PM IST)

**Time conversion formula:** IST time - 5.5 hours = UTC time

## View Scheduled Jobs

To see all scheduled cron jobs:
```sql
select * from cron.job;
```

## Troubleshooting

- If notifications aren't arriving, check the Edge Function logs in Supabase
- Ensure pg_cron and pg_net extensions are enabled
- Verify the Edge Function URL and service role key are correct
- Check that the `push_subscriptions` table has unmuted subscriptions
