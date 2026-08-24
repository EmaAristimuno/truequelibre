-- Bucket público para fotos de objetos publicados. Cada usuario solo puede
-- escribir dentro de su propia carpeta (prefijo = su user id), pero
-- cualquiera puede leer (necesario para que las fotos se vean en el feed).

insert into storage.buckets (id, name, public)
values ('item-images', 'item-images', true)
on conflict (id) do nothing;

create policy "item_images_public_read" on storage.objects for select
  using (bucket_id = 'item-images');

create policy "item_images_insert_own_folder" on storage.objects for insert
  with check (
    bucket_id = 'item-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "item_images_delete_own" on storage.objects for delete
  using (
    bucket_id = 'item-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
