import { supabase } from "@/integrations/supabase/client";
export async function confirmCritical(action: string): Promise<boolean> {
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email;
  const hasPassword = data.user?.identities?.some((i) => i.provider === "email");
  if (!email || !hasPassword) return window.confirm(`Confirmar: ${action}?`);
  const pw = window.prompt(`${action}: escreve a tua palavra-passe para confirmar`);
  if (!pw) return false;
  const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
  if (error) { window.alert("Palavra-passe errada."); return false; }
  return true;
}
