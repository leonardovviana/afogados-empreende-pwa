-- Adds a persistent total_amount column to exhibitor_registrations so the
-- application can rely on stored totals instead of recalculating them on the fly.

alter table public.exhibitor_registrations
  add column if not exists total_amount numeric(12, 2) not null default 0;

-- Backfill existing rows using the current pricing rules.
update public.exhibitor_registrations
set total_amount = (
  case payment_method
  when 'R$ 700,00 Lançamento' then 700
    when 'R$ 850,00 Após o lançamento' then 850
    when 'R$ 750,00 Dois ou mais stands' then 750
    else 0
  end
) * greatest(stands_quantity, 1);

-- Ensure the default remains after the backfill (some Postgres versions reset defaults).
alter table public.exhibitor_registrations
  alter column total_amount set default 0;
