import { spawn } from "child_process";
import path from "path";

const WORKER_URL = `http://127.0.0.1:${process.env.WA_WORKER_PORT || "3311"}`;

async function pingWorker() {
  const response = await fetch(`${WORKER_URL}/status`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Worker responded ${response.status}`);
  }
  return response;
}

export async function ensureWaWorker() {
  try {
    await pingWorker();
    return;
  } catch {}

  const scriptPath = path.join(process.cwd(), "scripts", "wa-worker.cjs");
  const child = spawn(process.execPath, [scriptPath], {
    cwd: process.cwd(),
    detached: true,
    stdio: "ignore",
    env: process.env,
  });
  child.unref();

  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      await pingWorker();
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  throw new Error("WhatsApp worker failed to start");
}

export async function callWaWorker(pathname: string, init?: RequestInit) {
  await ensureWaWorker();
  return fetch(`${WORKER_URL}${pathname}`, {
    ...init,
    cache: "no-store",
  });
}
