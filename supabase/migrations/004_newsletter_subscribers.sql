CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  nome       TEXT,
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  active     BOOLEAN DEFAULT true
);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon insert"
  ON newsletter_subscribers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow anon read active count"
  ON newsletter_subscribers FOR SELECT
  USING (true);

-- RPC para inscritos com upsert (ignora duplicatas)
CREATE OR REPLACE FUNCTION subscribe_newsletter(sub_email TEXT, sub_nome TEXT DEFAULT NULL)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  INSERT INTO newsletter_subscribers (email, nome)
  VALUES (lower(trim(sub_email)), sub_nome)
  ON CONFLICT (email) DO UPDATE SET
    active = true,
    nome   = coalesce(subscribe_newsletter.sub_nome, newsletter_subscribers.nome),
    subscribed_at = newsletter_subscribers.subscribed_at;
$$;

GRANT EXECUTE ON FUNCTION subscribe_newsletter(TEXT, TEXT) TO anon;
