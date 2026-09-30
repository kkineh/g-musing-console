import { isRunning, subscribe } from "@/lib/runner";
import type { EngineEvent } from "@/lib/engine";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const turnId = Number(id);

  if (!Number.isInteger(turnId) || !isRunning(turnId)) {
    return new Response("event: done\ndata: {}\n\n", {
      headers: sseHeaders,
    });
  }

  const encoder = new TextEncoder();
  let unsubscribe = () => {};

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: EngineEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          unsubscribe();
        }
      };

      unsubscribe = subscribe(turnId, (event) => {
        send(event);
        if (event.kind === "result") {
          try {
            controller.enqueue(encoder.encode("event: done\ndata: {}\n\n"));
            controller.close();
          } catch {
            /* 이미 닫힘 */
          }
          unsubscribe();
        }
      });
    },
    cancel() {
      unsubscribe();
    },
  });

  return new Response(stream, { headers: sseHeaders });
}

const sseHeaders = {
  "content-type": "text/event-stream; charset=utf-8",
  "cache-control": "no-cache, no-transform",
  connection: "keep-alive",
};
