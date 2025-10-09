alter table public.exhibitor_registrations
    add column if not exists stand_selection_slot_allowlist text;

comment on column public.exhibitor_registrations.stand_selection_slot_allowlist is 'Lista normalizada de stands liberados para a janela atual (valores separados por vírgula).';
