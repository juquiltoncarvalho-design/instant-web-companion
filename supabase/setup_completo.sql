-- ============================================================
-- Casa Inteligente - configuracao completa do Supabase
-- Projeto: ovyniziwplckiqkzkypm
-- Colar este ficheiro no SQL Editor e carregar em Run.
-- ============================================================

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


-- Lock old public single-row tables (deprecated)
COMMENT ON TABLE public.home_state IS 'DEPRECATED: replaced by home_states (per home)';
COMMENT ON TABLE public.ai_messages IS 'DEPRECATED: unused';
DROP POLICY IF EXISTS "home_state readable by all" ON public.home_state;
DROP POLICY IF EXISTS "home_state updatable by all" ON public.home_state;
DROP POLICY IF EXISTS "home_state insertable by all" ON public.home_state;
DROP POLICY IF EXISTS "ai_messages readable by all" ON public.ai_messages;
DROP POLICY IF EXISTS "ai_messages insertable by all" ON public.ai_messages;
REVOKE ALL ON public.home_state FROM anon, authenticated;
REVOKE ALL ON public.ai_messages FROM anon, authenticated;
ALTER PUBLICATION supabase_realtime DROP TABLE public.home_state;
ALTER PUBLICATION supabase_realtime DROP TABLE public.ai_messages;

-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text,
  blocked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (display_name) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Homes
CREATE TABLE public.homes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'A minha casa',
  owner_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.homes TO authenticated;
GRANT UPDATE (name) ON public.homes TO authenticated;
GRANT ALL ON public.homes TO service_role;
ALTER TABLE public.homes ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.home_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('owner','member','viewer')),
  added_by uuid,
  added_at timestamptz NOT NULL DEFAULT now(),
  removed_at timestamptz,
  removed_by uuid
);
CREATE UNIQUE INDEX home_members_active ON public.home_members(home_id, user_id) WHERE removed_at IS NULL;
GRANT SELECT ON public.home_members TO authenticated;
GRANT ALL ON public.home_members TO service_role;
ALTER TABLE public.home_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.home_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('member','viewer')),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz
);
GRANT SELECT ON public.home_invites TO authenticated;
GRANT ALL ON public.home_invites TO service_role;
ALTER TABLE public.home_invites ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.home_role(_home uuid, _user uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.role FROM public.home_members m
  JOIN public.profiles p ON p.id = m.user_id
  WHERE m.home_id = _home AND m.user_id = _user AND m.removed_at IS NULL AND NOT p.blocked
  LIMIT 1
$$;
CREATE OR REPLACE FUNCTION public.is_home_member(_home uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.home_role(_home, _user) IS NOT NULL
$$;
CREATE OR REPLACE FUNCTION public.can_control_home(_home uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(public.home_role(_home, _user) IN ('owner','member'), false)
$$;

CREATE POLICY "profiles self or admin" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.home_members a JOIN public.home_members b ON a.home_id = b.home_id
               WHERE a.user_id = auth.uid() AND a.removed_at IS NULL AND b.user_id = profiles.id));
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "homes members read" ON public.homes FOR SELECT TO authenticated
  USING (public.is_home_member(id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "homes owner rename" ON public.homes FOR UPDATE TO authenticated
  USING (public.home_role(id, auth.uid()) = 'owner') WITH CHECK (public.home_role(id, auth.uid()) = 'owner');

CREATE POLICY "members read" ON public.home_members FOR SELECT TO authenticated
  USING (public.is_home_member(home_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "invites owner read" ON public.home_invites FOR SELECT TO authenticated
  USING (public.home_role(home_id, auth.uid()) = 'owner');

CREATE TABLE public.home_states (
  home_id uuid PRIMARY KEY REFERENCES public.homes(id) ON DELETE CASCADE,
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT, UPDATE ON public.home_states TO authenticated;
GRANT ALL ON public.home_states TO service_role;
ALTER TABLE public.home_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "state members read" ON public.home_states FOR SELECT TO authenticated
  USING (public.is_home_member(home_id, auth.uid()));
CREATE POLICY "state controllers update" ON public.home_states FOR UPDATE TO authenticated
  USING (public.can_control_home(home_id, auth.uid())) WITH CHECK (public.can_control_home(home_id, auth.uid()));

CREATE TABLE public.presence_sensors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
  room text NOT NULL,
  occupied boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'manual',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (home_id, room)
);
GRANT SELECT ON public.presence_sensors TO authenticated;
GRANT UPDATE (occupied, source) ON public.presence_sensors TO authenticated;
GRANT ALL ON public.presence_sensors TO service_role;
ALTER TABLE public.presence_sensors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sensors members read" ON public.presence_sensors FOR SELECT TO authenticated
  USING (public.is_home_member(home_id, auth.uid()));
CREATE POLICY "sensors controllers update" ON public.presence_sensors FOR UPDATE TO authenticated
  USING (public.can_control_home(home_id, auth.uid())) WITH CHECK (public.can_control_home(home_id, auth.uid()));

CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid REFERENCES public.homes(id) ON DELETE CASCADE,
  actor_id uuid,
  action text NOT NULL,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit owner or admin" ON public.audit_log FOR SELECT TO authenticated
  USING (public.home_role(home_id, auth.uid()) = 'owner' OR actor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  home_id uuid REFERENCES public.homes(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.notifications TO authenticated;
GRANT UPDATE (read) ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif own read" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notif own update" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.record_audit(_home uuid, _action text, _details jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _owner uuid; _actor uuid := auth.uid(); _name text;
BEGIN
  INSERT INTO public.audit_log(home_id, actor_id, action, details) VALUES (_home, _actor, _action, _details);
  SELECT owner_id INTO _owner FROM public.homes WHERE id = _home;
  IF _owner IS NOT NULL AND _actor IS NOT NULL AND _actor <> _owner THEN
    SELECT coalesce(display_name, email, 'AlguÃ©m') INTO _name FROM public.profiles WHERE id = _actor;
    INSERT INTO public.notifications(user_id, home_id, title, body)
    VALUES (_owner, _home, coalesce(_name, 'AlguÃ©m') || ' fez uma alteraÃ§Ã£o', _action);
  END IF;
END $$;
REVOKE EXECUTE ON FUNCTION public.record_audit(uuid, text, jsonb) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.trg_home_state_audit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE k text; o jsonb; n jsonb; changes text[] := '{}';
BEGIN
  NEW.updated_by := auth.uid();
  NEW.updated_at := now();
  FOR k IN SELECT jsonb_object_keys(coalesce(NEW.state->'rooms','{}'::jsonb)) LOOP
    o := OLD.state->'rooms'->k; n := NEW.state->'rooms'->k;
    IF o IS DISTINCT FROM n THEN
      IF (o->>'light') IS DISTINCT FROM (n->>'light') THEN changes := changes || (k || ': luz ' || CASE WHEN (n->>'light')::boolean THEN 'acesa' ELSE 'apagada' END); END IF;
      IF (o->>'window') IS DISTINCT FROM (n->>'window') THEN changes := changes || (k || ': janela ' || CASE WHEN (n->>'window')::boolean THEN 'aberta' ELSE 'fechada' END); END IF;
      IF (o->'tv'->>'on') IS DISTINCT FROM (n->'tv'->>'on') THEN changes := changes || (k || ': TV ' || CASE WHEN (n->'tv'->>'on')::boolean THEN 'ligada' ELSE 'desligada' END); END IF;
    END IF;
  END LOOP;
  IF (OLD.state->>'siren') IS DISTINCT FROM (NEW.state->>'siren') THEN
    changes := changes || ('sirene ' || CASE WHEN (NEW.state->>'siren')::boolean THEN 'LIGADA' ELSE 'desligada' END);
  END IF;
  IF coalesce(array_length(changes, 1), 0) > 0 THEN
    PERFORM public.record_audit(NEW.home_id, array_to_string(changes, '; '), NULL);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER home_state_audit BEFORE UPDATE ON public.home_states FOR EACH ROW EXECUTE FUNCTION public.trg_home_state_audit();

CREATE OR REPLACE FUNCTION public.trg_presence_audit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  IF OLD.occupied IS DISTINCT FROM NEW.occupied THEN
    PERFORM public.record_audit(NEW.home_id, NEW.room || ': presenÃ§a ' || CASE WHEN NEW.occupied THEN 'detetada' ELSE 'vazia' END, NULL);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER presence_audit BEFORE UPDATE ON public.presence_sensors FOR EACH ROW EXECUTE FUNCTION public.trg_presence_audit();

CREATE OR REPLACE FUNCTION public.create_home_for(_user uuid, _name text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _home uuid; r text;
BEGIN
  INSERT INTO public.homes(name, owner_id) VALUES (_name, _user) RETURNING id INTO _home;
  INSERT INTO public.home_members(home_id, user_id, role, added_by) VALUES (_home, _user, 'owner', _user);
  INSERT INTO public.home_states(home_id) VALUES (_home);
  FOREACH r IN ARRAY ARRAY['sala','quarto1','quarto2','cozinha','banheiro','corredor'] LOOP
    INSERT INTO public.presence_sensors(home_id, room) VALUES (_home, r);
  END LOOP;
  INSERT INTO public.audit_log(home_id, actor_id, action) VALUES (_home, _user, 'Casa criada');
  RETURN _home;
END $$;
REVOKE EXECUTE ON FUNCTION public.create_home_for(uuid, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.accept_pending_invites_for(_user uuid, _email text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE i record;
BEGIN
  FOR i IN SELECT * FROM public.home_invites WHERE lower(email) = lower(_email) AND accepted_at IS NULL LOOP
    IF NOT EXISTS (SELECT 1 FROM public.home_members WHERE home_id = i.home_id AND user_id = _user AND removed_at IS NULL) THEN
      INSERT INTO public.home_members(home_id, user_id, role, added_by) VALUES (i.home_id, _user, i.role, i.created_by);
      INSERT INTO public.audit_log(home_id, actor_id, action) VALUES (i.home_id, _user, 'Entrou na casa: ' || _email);
      INSERT INTO public.notifications(user_id, home_id, title, body) VALUES (i.created_by, i.home_id, 'Novo membro', _email || ' entrou na casa');
    END IF;
    UPDATE public.home_invites SET accepted_at = now() WHERE id = i.id;
  END LOOP;
END $$;
REVOKE EXECUTE ON FUNCTION public.accept_pending_invites_for(uuid, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _name text := coalesce(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(coalesce(NEW.email, 'utilizador'), '@', 1));
BEGIN
  INSERT INTO public.profiles(id, email, display_name) VALUES (NEW.id, NEW.email, _name);
  INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'user');
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  PERFORM public.create_home_for(NEW.id, 'Casa de ' || _name);
  IF NEW.email IS NOT NULL THEN PERFORM public.accept_pending_invites_for(NEW.id, NEW.email); END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.invite_member(_home uuid, _email text, _role text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid; _e text := lower(trim(_email));
BEGIN
  IF coalesce(public.home_role(_home, auth.uid()), '') <> 'owner' THEN RAISE EXCEPTION 'SÃ³ o dono pode convidar'; END IF;
  IF _role NOT IN ('member','viewer') THEN RAISE EXCEPTION 'Papel invÃ¡lido'; END IF;
  INSERT INTO public.home_invites(home_id, email, role, created_by) VALUES (_home, _e, _role, auth.uid());
  INSERT INTO public.audit_log(home_id, actor_id, action) VALUES (_home, auth.uid(), 'Convite enviado a ' || _e || ' (' || _role || ')');
  SELECT id INTO _uid FROM auth.users WHERE lower(email) = _e;
  IF _uid IS NOT NULL THEN PERFORM public.accept_pending_invites_for(_uid, _e); END IF;
END $$;
REVOKE EXECUTE ON FUNCTION public.invite_member(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.invite_member(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.remove_member(_home uuid, _user uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF coalesce(public.home_role(_home, auth.uid()), '') <> 'owner' AND _user <> auth.uid() THEN RAISE EXCEPTION 'SÃ³ o dono pode remover membros'; END IF;
  IF EXISTS (SELECT 1 FROM public.homes WHERE id = _home AND owner_id = _user) THEN RAISE EXCEPTION 'O dono nÃ£o pode ser removido'; END IF;
  UPDATE public.home_members SET removed_at = now(), removed_by = auth.uid()
    WHERE home_id = _home AND user_id = _user AND removed_at IS NULL;
  PERFORM public.record_audit(_home, 'Membro saiu/removido: ' || coalesce((SELECT email FROM public.profiles WHERE id = _user), _user::text), NULL);
END $$;
REVOKE EXECUTE ON FUNCTION public.remove_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.remove_member(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.change_member_role(_home uuid, _user uuid, _role text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF coalesce(public.home_role(_home, auth.uid()), '') <> 'owner' THEN RAISE EXCEPTION 'SÃ³ o dono'; END IF;
  IF _role NOT IN ('member','viewer') THEN RAISE EXCEPTION 'Papel invÃ¡lido'; END IF;
  UPDATE public.home_members SET role = _role WHERE home_id = _home AND user_id = _user AND removed_at IS NULL AND role <> 'owner';
  INSERT INTO public.audit_log(home_id, actor_id, action) VALUES (_home, auth.uid(), 'Papel alterado para ' || _role);
END $$;
REVOKE EXECUTE ON FUNCTION public.change_member_role(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.change_member_role(uuid, uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_blocked(_user uuid, _blocked boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'SÃ³ administradores'; END IF;
  IF _user = auth.uid() THEN RAISE EXCEPTION 'NÃ£o te podes bloquear a ti prÃ³prio'; END IF;
  UPDATE public.profiles SET blocked = _blocked WHERE id = _user;
  INSERT INTO public.audit_log(actor_id, action, details) VALUES (auth.uid(), CASE WHEN _blocked THEN 'Conta bloqueada' ELSE 'Conta desbloqueada' END, jsonb_build_object('user', _user));
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_set_blocked(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_blocked(uuid, boolean) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.home_role(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_home_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_control_home(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.home_role(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_home_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_control_home(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

DO $$
DECLARE u record; _name text;
BEGIN
  FOR u IN SELECT * FROM auth.users ORDER BY created_at LOOP
    _name := coalesce(u.raw_user_meta_data->>'full_name', split_part(coalesce(u.email,'utilizador'), '@', 1));
    INSERT INTO public.profiles(id, email, display_name) VALUES (u.id, u.email, _name) ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles(user_id, role) VALUES (u.id, 'user') ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
      INSERT INTO public.user_roles(user_id, role) VALUES (u.id, 'admin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.homes WHERE owner_id = u.id) THEN
      PERFORM public.create_home_for(u.id, 'Casa de ' || _name);
    END IF;
  END LOOP;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.home_states;
ALTER PUBLICATION supabase_realtime ADD TABLE public.presence_sensors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

