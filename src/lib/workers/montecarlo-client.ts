import type { MCProgress, MCRequest, MCResult, MCResultMessage } from "./montecarlo.worker";

let worker: Worker | null = null;

function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL("./montecarlo.worker.ts", import.meta.url), {
    type: "module",
  });
  return worker;
}

export function runMonteCarlo(
  req: Omit<MCRequest, "type" | "id">,
  onProgress?: (done: number, total: number) => void,
): Promise<MCResult> {
  const id = crypto.randomUUID();
  const w = getWorker();
  return new Promise((resolve, reject) => {
    function onMessage(e: MessageEvent<MCProgress | MCResultMessage>) {
      const data = e.data;
      if (!data || data.id !== id) return;
      if (data.type === "progress") {
        onProgress?.(data.done, data.total);
      } else if (data.type === "result") {
        w.removeEventListener("message", onMessage);
        w.removeEventListener("error", onError);
        resolve(data.result);
      }
    }
    function onError(e: ErrorEvent) {
      w.removeEventListener("message", onMessage);
      w.removeEventListener("error", onError);
      reject(e.error ?? new Error(e.message));
    }
    w.addEventListener("message", onMessage);
    w.addEventListener("error", onError);
    w.postMessage({ type: "run", id, ...req } satisfies MCRequest);
  });
}
