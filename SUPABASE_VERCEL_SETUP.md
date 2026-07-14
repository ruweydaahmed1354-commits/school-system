# Supabase + Vercel setup

## 1. Create the database

1. Create a Supabase project.
2. Open **SQL Editor** and run the complete contents of `supabase/setup.sql`.
3. In **Authentication > URL Configuration**, set the Site URL to your Vercel URL, for example `https://your-school.vercel.app`.
4. Add these Redirect URLs:
   - `https://your-school.vercel.app/auth/login.html`
   - `https://your-school.vercel.app/auth/login.html?portal=student`
   - `http://localhost:3000/auth/login.html` (only if you use a local server)
5. Keep email confirmation enabled in **Authentication > Providers > Email** for production.

## 2. Create the first administrator

Register the administrator's email through the student registration page, confirm the email, then run this in the SQL Editor (replace the address):

```sql
update public.profiles
set role = 'admin'
where email = 'admin@your-domain.edu';
```

The app does not allow public admin or lecturer registration. Create staff users in Supabase Auth (Dashboard > Authentication > Users > Invite user), then run the lecturer promotion example at the bottom of `supabase/setup.sql`.

## 3. Deploy to Vercel

Import this `School-Management-System-main` folder into Vercel. No build command is required.

In **Project Settings > Environment Variables**, add the following for Production, Preview, and Development:

| Name | Value |
| --- | --- |
| `SUPABASE_URL` | Your project URL, such as `https://abccompany.supabase.co` |
| `SUPABASE_ANON_KEY` | Your Supabase publishable/anon key |

Redeploy after adding the variables. The browser gets these values only from `/api/config`; the Supabase `service_role` key must never be added to Vercel or the frontend.

## What changed

- Supabase Auth handles login, sign-up, email confirmation, reset emails, session restoration, logout, and role checks.
- SQL creates the university tables and row-level security policies for students, lecturers, and admins.
- The existing dashboard JavaScript still keeps its legacy page-state cache in localStorage. Authentication and all new database access are secure Supabase-backed; migrate each dashboard's localStorage CRUD calls to the matching tables before treating the old demo records as shared production data.
