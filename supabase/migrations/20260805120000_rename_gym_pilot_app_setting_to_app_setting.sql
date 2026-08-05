alter table if exists public.gym_pilot_app_setting rename to app_setting;

do $$
begin
  if exists (select 1 from pg_trigger where tgname = 'gym_pilot_app_setting_set_updated_at') then
    alter trigger gym_pilot_app_setting_set_updated_at on public.app_setting rename to app_setting_set_updated_at;
  end if;
end $$;
