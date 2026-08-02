# Supabase Database Setup & Configuration Guide

This guide details setting up the Supabase PostgreSQL database, SQL schema, Row Level Security (RLS) policies, and storage buckets for the Ashoka Premier League auction system.

## Setup Steps

1. **Create Supabase Project**: Create a new project in your Supabase dashboard.
2. **Execute Master SQL Schema**:
   - Go to **SQL Editor → New Query**.
   - Copy and execute the complete script in [`supabase/schema.sql`](file:///d:/Downloads/Whole%20new%20Web/supabase/schema.sql).
3. **Storage Bucket Setup**:
   - Create two public storage buckets: `player-photos` and `team-logos`.
   - Set public read policies for both buckets so avatars and team logos render on the frontend.
4. **Copy API Credentials**:
   - Navigate to **Project Settings → API**.
   - Copy `Project URL`, `anon public key`, and `service_role key`.
   - Add these credentials to your `.env.local` file and cloud host environment settings.

## Database Tables & RLS Summary

| Table Name | Public Read | Public Insert | Admin / Captain Writes |
| :--- | :--- | :--- | :--- |
| `players` | Approved Only | Pending Only | Admin Only |
| `teams` | Yes | No | Admin Only |
| `captains` | Restricted (RLS) | No | Admin Only |
| `bids` | Yes | No | Validated Captain API |
| `auction` | Yes | No | Admin API |
| `seasons` | Yes | No | Admin API |

## Verifying Realtime WebSockets

Ensure **Realtime** is enabled for the `auction`, `bids`, `players`, and `teams` tables in your Supabase dashboard under **Database → Replication** to allow instant WebSocket updates on live auction displays.
