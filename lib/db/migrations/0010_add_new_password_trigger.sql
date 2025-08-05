# Apply this migration to add new_password trigger to email_trigger_type

BEGIN;

-- Add new trigger type to email_trigger_type enum
do $do$
begin
    if not exists (select 1 from pg_type where typname = 'email_trigger_type') then
        raise exception 'enum type "email_trigger_type" does not exist';
    end if;

    -- Check if the value exists, if not, add it
    if not exists (select 1 from unnest(enum_range(NULL::email_trigger_type)) where unnest = 'new_password') then
        alter type email_trigger_type add value 'new_password';
    end if;
end;
$do$;

COMMIT;

