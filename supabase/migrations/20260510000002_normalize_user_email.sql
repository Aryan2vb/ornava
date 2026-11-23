-- Normalize email identity before more beta user data lands.

update app_users
set email = lower(trim(email))
where email is not null
  and email <> lower(trim(email));

alter table app_users
  drop constraint if exists app_users_email_normalized_check;

alter table app_users
  add constraint app_users_email_normalized_check
  check (email is null or email = lower(trim(email)));
