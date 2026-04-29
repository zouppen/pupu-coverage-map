create table reception_reports (
  id bigserial primary key,
  project text not null,
  nick text not null,
  email text not null,
  feedback text,
  created_at timestamptz not null default now()
);

create table reception_entries (
  id bigserial primary key,
  report_id bigint not null references reception_reports(id) on delete cascade,
  lat double precision not null check (lat >= -90 and lat <= 90),
  lng double precision not null check (lng >= -180 and lng <= 180),
  heard_a boolean not null,
  heard_b boolean not null,
  observed_at timestamp not null,
  comment text
);

create index reception_reports_project_created_at_idx
  on reception_reports (project, created_at desc);

create index reception_entries_report_id_idx
  on reception_entries (report_id);

create index reception_entries_observed_at_idx
  on reception_entries (observed_at desc);

create view reception_entries_view as
select
  e.id as entry_id,
  e.report_id,
  r.project,
  r.nick,
  r.email,
  r.feedback,
  r.created_at as submitted_at,
  e.lat,
  e.lng,
  e.heard_a,
  e.heard_b,
  case
    when e.heard_a and e.heard_b then 'both'
    when e.heard_a then 'a'
    when e.heard_b then 'b'
    else 'neither'
  end as heard_status,
  e.observed_at,
  e.comment
from reception_entries e
join reception_reports r on r.id = e.report_id;
