alter table blogs 
add column if not exists gallery_images text[] default array[]::text[];
