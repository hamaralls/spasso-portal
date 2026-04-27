-- migration 010: alt text e legenda da imagem de capa
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS featured_image_alt text,
  ADD COLUMN IF NOT EXISTS featured_image_caption text;
