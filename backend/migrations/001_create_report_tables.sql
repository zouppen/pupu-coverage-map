create table submissions (
  id bigserial primary key,
  project text not null,
  nick text not null,
  email text not null,
  feedback text,
  created_at timestamptz not null default now()
);

create table reception_reports (
  id bigserial primary key,
  submission_id bigint not null references submissions(id) on delete cascade,
  lat double precision not null check (lat >= -90 and lat <= 90),
  lng double precision not null check (lng >= -180 and lng <= 180),
  heard_a boolean not null,
  heard_b boolean not null,
  observed_at timestamp not null,
  comment text
);

create index submissions_project_created_at_idx
  on submissions (project, created_at desc);

create index reception_reports_submission_id_idx
  on reception_reports (submission_id);

create index reception_reports_observed_at_idx
  on reception_reports (observed_at desc);

create view reception_reports_view as
select
  r.id as report_id,
  r.submission_id,
  s.project,
  s.nick,
  s.email,
  s.feedback,
  s.created_at as submitted_at,
  r.lat,
  r.lng,
  r.heard_a,
  r.heard_b,
  case
    when r.heard_a and r.heard_b then 'both'
    when r.heard_a then 'a'
    when r.heard_b then 'b'
    else 'neither'
  end as heard_status,
  r.observed_at,
  r.comment
from reception_reports r
join submissions s on s.id = r.submission_id;
