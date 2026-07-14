-- AL Suhaim University: run this entire file in Supabase SQL Editor.
-- It is safe to re-run for schema/policies. Do not place a service_role key in the frontend.

create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('admin', 'lecturer', 'student');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  role public.app_role not null default 'student',
  staff_number text unique,
  student_number text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    lower(coalesce(new.email, '')),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    -- Never trust a browser-supplied role: public sign-up always creates students.
    'student'
  ) on conflict (id) do nothing;
  insert into public.students (id, registration_no)
  values (new.id, 'STU-' || upper(replace(new.id::text, '-', '')))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute procedure public.set_updated_at();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
create or replace function public.is_lecturer()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'lecturer');
$$;

create table if not exists public.students (
  id uuid primary key references public.profiles(id) on delete cascade,
  registration_no text unique not null,
  program text, class_name text, faculty text, phone text, gender text,
  date_of_birth date, admission_date date, sponsor text, bio text, photo_url text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.lecturers (
  id uuid primary key references public.profiles(id) on delete cascade,
  faculty text, status text not null default 'Active',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.units (
  code text primary key, name text not null, credits integer not null check (credits > 0),
  faculty text, active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.class_offerings (
  id uuid primary key default gen_random_uuid(), unit_code text not null references public.units(code) on delete restrict,
  lecturer_id uuid references public.lecturers(id) on delete set null, day_of_week text, time_range text,
  venue text, semester text, offered boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references public.students(id) on delete cascade,
  offering_id uuid not null references public.class_offerings(id) on delete cascade,
  created_at timestamptz not null default now(), unique(student_id, offering_id)
);
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references public.students(id) on delete cascade,
  offering_id uuid not null references public.class_offerings(id) on delete cascade,
  session_date date not null, status text not null check (status in ('Present','Absent','Late','Excused')),
  marked_by uuid not null references public.lecturers(id), created_at timestamptz not null default now(),
  unique(student_id, offering_id, session_date)
);
create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references public.students(id) on delete cascade,
  offering_id uuid not null references public.class_offerings(id) on delete cascade,
  score numeric(5,2) not null check (score between 0 and 100), grade text not null,
  lecturer_id uuid not null references public.lecturers(id), updated_at timestamptz not null default now(),
  unique(student_id, offering_id)
);
create table if not exists public.fees (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references public.students(id) on delete cascade,
  amount numeric(12,2) not null check (amount >= 0), paid numeric(12,2) not null default 0 check (paid >= 0 and paid <= amount),
  status text not null, due_date date, updated_at timestamptz not null default now()
);
create table if not exists public.accommodations (
  id uuid primary key default gen_random_uuid(), student_id uuid not null unique references public.students(id) on delete cascade,
  hostel text not null, room text not null, bed text, package text, status text not null,
  check_in date, notes text, updated_at timestamptz not null default now()
);
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(), audience text not null default 'all' check (audience in ('all','student','lecturer','admin')),
  title text not null, body text not null, author_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.app_settings (
  id boolean primary key default true check (id), registration_enabled boolean not null default true,
  registration_open_date date, registration_close_date date, semester text, updated_at timestamptz not null default now()
);
insert into public.app_settings (id) values (true) on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.lecturers enable row level security;
alter table public.units enable row level security;
alter table public.class_offerings enable row level security;
alter table public.enrollments enable row level security;
alter table public.attendance enable row level security;
alter table public.grades enable row level security;
alter table public.fees enable row level security;
alter table public.accommodations enable row level security;
alter table public.announcements enable row level security;
alter table public.app_settings enable row level security;

-- Profiles: users can see/edit only their own non-privileged fields; admins manage all.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid() or public.is_admin()) with check (
  public.is_admin() or (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()))
);

-- Directory and academic records.
drop policy if exists students_access on public.students;
create policy students_access on public.students for select to authenticated using (id = auth.uid() or public.is_admin() or public.is_lecturer());
drop policy if exists students_admin_write on public.students;
create policy students_admin_write on public.students for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists lecturers_read on public.lecturers;
create policy lecturers_read on public.lecturers for select to authenticated using (true);
drop policy if exists lecturers_admin_write on public.lecturers;
create policy lecturers_admin_write on public.lecturers for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists units_read on public.units;
create policy units_read on public.units for select to authenticated using (true);
drop policy if exists units_admin_write on public.units;
create policy units_admin_write on public.units for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists offerings_read on public.class_offerings;
create policy offerings_read on public.class_offerings for select to authenticated using (true);
drop policy if exists offerings_admin_write on public.class_offerings;
create policy offerings_admin_write on public.class_offerings for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists enrollment_read on public.enrollments;
create policy enrollment_read on public.enrollments for select to authenticated using (student_id = auth.uid() or public.is_admin() or public.is_lecturer());
drop policy if exists enrollment_student_insert on public.enrollments;
create policy enrollment_student_insert on public.enrollments for insert to authenticated with check (student_id = auth.uid() or public.is_admin());
drop policy if exists enrollment_student_delete on public.enrollments;
create policy enrollment_student_delete on public.enrollments for delete to authenticated using (student_id = auth.uid() or public.is_admin());

drop policy if exists attendance_read on public.attendance;
create policy attendance_read on public.attendance for select to authenticated using (student_id = auth.uid() or public.is_admin() or marked_by = auth.uid());
drop policy if exists attendance_lecturer_write on public.attendance;
create policy attendance_lecturer_write on public.attendance for all to authenticated using (public.is_admin() or marked_by = auth.uid()) with check (public.is_admin() or marked_by = auth.uid());
drop policy if exists grades_read on public.grades;
create policy grades_read on public.grades for select to authenticated using (student_id = auth.uid() or public.is_admin() or lecturer_id = auth.uid());
drop policy if exists grades_lecturer_write on public.grades;
create policy grades_lecturer_write on public.grades for all to authenticated using (public.is_admin() or lecturer_id = auth.uid()) with check (public.is_admin() or lecturer_id = auth.uid());
drop policy if exists fees_read on public.fees;
create policy fees_read on public.fees for select to authenticated using (student_id = auth.uid() or public.is_admin());
drop policy if exists fees_admin_write on public.fees;
create policy fees_admin_write on public.fees for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists accommodation_read on public.accommodations;
create policy accommodation_read on public.accommodations for select to authenticated using (student_id = auth.uid() or public.is_admin());
drop policy if exists accommodation_admin_write on public.accommodations;
create policy accommodation_admin_write on public.accommodations for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists announcements_read on public.announcements;
create policy announcements_read on public.announcements for select to authenticated using (audience = 'all' or audience = (select role::text from public.profiles where id = auth.uid()) or public.is_admin());
drop policy if exists announcements_admin_write on public.announcements;
create policy announcements_admin_write on public.announcements for all to authenticated using (public.is_admin()) with check (public.is_admin() and author_id = auth.uid());
drop policy if exists settings_read on public.app_settings;
create policy settings_read on public.app_settings for select to authenticated using (true);
drop policy if exists settings_admin_write on public.app_settings;
create policy settings_admin_write on public.app_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- After an account has confirmed its email, promote it from the SQL editor:
-- update public.profiles set role = 'admin' where email = 'admin@your-domain.edu';
-- For a lecturer, also set a staff number and make the matching directory record:
-- update public.profiles set role = 'lecturer', staff_number = 'EDE001-2026-01' where email = 'lecturer@your-domain.edu';
-- insert into public.lecturers (id, faculty) select id, 'Education' from public.profiles where email = 'lecturer@your-domain.edu' on conflict (id) do update set faculty = excluded.faculty;
