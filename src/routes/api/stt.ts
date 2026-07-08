import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/stt")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("LOVABLE_API_KEY missing", { status: 500 });
        const form = await request.formData();
        const file = form.get("file");
        if (!(file instanceof Blob)) return new Response("file missing", { status: 400 });

        const type = (file.type || "").split(";")[0];
        const ext =
          type === "audio/webm" ? "webm" :
          type === "audio/mp4" ? "mp4" :
          type === "audio/mpeg" ? "mp3" :
          type === "audio/wav" || type === "audio/wave" ? "wav" :
          type === "audio/ogg" ? "ogg" : "webm";

        const upstream = new FormData();
        upstream.append("model", "openai/gpt-4o-mini-transcribe");
        upstream.append("file", file, `recording.${ext}`);

        const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}` },
          body: upstream,
        });
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          return new Response(body || "STT failed", { status: res.status });
        }
        const data = (await res.json()) as { text?: string };
        return Response.json({ text: data.text ?? "" });
      },
    },
  },
});
