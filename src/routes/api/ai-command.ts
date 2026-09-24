import { createFileRoute } from "@tanstack/react-router";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { createLovableAiGateway } from "@/lib/ai-gateway.server";

const ActionSchema = z.object({
  reply: z.string(),
  actions: z.array(
    z.object({
      room: z.string().describe("room id like 'sala' or empty string for global scene/siren/pomodoro"),
      device: z.string().describe("one of: light, window, ac, tv, scene, siren, pomodoro"),
      op: z.string().describe("operation like on/off/open/close/morning/night/leaving/channel/volume/mute/start/pause/stop/reset"),
      value: z.number().describe("numeric value for temperature/channel/volume, or 0 if not applicable"),
    }),
  ),
});

const SYSTEM_PROMPT = `Es a Ana, a assistente de voz de uma casa inteligente, em portugues de Portugal. Recebes um comando do utilizador (por vezes comecado por "Ana,") e o estado atual da casa em JSON, e respondes com JSON no formato {reply, actions}.

Divisoes disponiveis: sala, quarto1, quarto2, cozinha, banheiro (casa de banho; sem TV), corredor (sem TV).
Dispositivos por divisao: light (on/off), window (open/close), ac (on/off + temperatura), tv (on/off + canal 1-8 + volume 0-100).

Cenas globais (room=""): op="morning" acende tudo, op="night" apaga tudo, op="leaving" apaga+fecha tudo.

Operacoes validas:
- light: op="on" ou "off"
- window: op="open" ou "close"
- ac: op="on" (value=temperatura), "off"
- tv: op="on", "off", "channel" (value=numero), "volume" (value=0-100), "mute"
- scene: op="morning", "night", "leaving" (room="")
- siren: op="on" ou "off" (room="") — sirene de emergencia, so quando o utilizador pede alarme/emergencia/sirene
- pomodoro: op="start", "pause", "stop" ou "reset" (room="")

Responde curto e amigavel, na primeira pessoa como a Ana. Se o utilizador pergunta algo (temperatura, estado da casa, quanto tempo falta no Pomodoro), responde na "reply" e deixa "actions" vazio.`;

export const Route = createFileRoute("/api/ai-command")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { message: string; state: unknown };
          const key = process.env.LOVABLE_API_KEY;
          if (!key) throw new Error("LOVABLE_API_KEY missing");

          const gateway = createLovableAiGateway(key);
          const { output } = await generateText({
            model: gateway("google/gemini-3-flash-preview"),
            output: Output.object({ schema: ActionSchema }),
            system: SYSTEM_PROMPT,
            prompt: `Estado atual: ${JSON.stringify(body.state)}\n\nComando: ${body.message}`,
          });
          return Response.json(output);
        } catch (err) {
          if (NoObjectGeneratedError.isInstance(err)) {
            console.error("ai raw text:", err.text);
            // Try to salvage
            try {
              const jsonMatch = err.text?.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.reply) return Response.json({ reply: parsed.reply, actions: parsed.actions ?? [] });
              }
            } catch {
              // fall through
            }
            return Response.json({ reply: err.text?.slice(0, 240) ?? "Não percebi.", actions: [] });
          }
          const msg = err instanceof Error ? err.message : "erro";
          console.error("ai-command error:", msg);
          return Response.json(
            { reply: `Desculpa, tive um problema: ${msg}`, actions: [] },
            { status: 200 },
          );
        }
      },
    },
  },
});
