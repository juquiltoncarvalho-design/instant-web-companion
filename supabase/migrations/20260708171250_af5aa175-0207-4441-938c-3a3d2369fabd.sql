
-- Single-row table holding the entire home state as JSON, publicly readable/writable (no auth on this dashboard).
CREATE TABLE public.home_state (
  id INT PRIMARY KEY DEFAULT 1,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO public.home_state (id, state) VALUES (1, '{}'::jsonb) ON CONFLICT (id) DO NOTHING;

GRANT SELECT, INSERT, UPDATE ON public.home_state TO anon, authenticated;
GRANT ALL ON public.home_state TO service_role;

ALTER TABLE public.home_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "home_state readable by all" ON public.home_state FOR SELECT USING (true);
CREATE POLICY "home_state updatable by all" ON public.home_state FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "home_state insertable by all" ON public.home_state FOR INSERT WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.home_state;

-- Chat log for the AI assistant
CREATE TABLE public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.ai_messages TO anon, authenticated;
GRANT ALL ON public.ai_messages TO service_role;

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_messages readable by all" ON public.ai_messages FOR SELECT USING (true);
CREATE POLICY "ai_messages insertable by all" ON public.ai_messages FOR INSERT WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_messages;
