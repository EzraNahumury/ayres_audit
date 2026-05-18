import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

// TEMPORARY DIAGNOSTIC — delete after WA worker issue is resolved.
// Tries to spawn the WA worker WITH stdout/stderr capture, reports what fails.
export async function GET() {
  const result: Record<string, unknown> = {
    cwd: process.cwd(),
    node: process.version,
    platform: process.platform,
    execPath: process.execPath,
  };

  // 1. Check if worker script exists
  const scriptPath = path.join(process.cwd(), "scripts", "wa-worker.cjs");
  result.scriptPath = scriptPath;
  result.scriptExists = fs.existsSync(scriptPath);

  // 2. Check write permission on wa_sessions
  const sessionsRoot = path.join(process.cwd(), "wa_sessions");
  try {
    fs.mkdirSync(sessionsRoot, { recursive: true });
    fs.writeFileSync(path.join(sessionsRoot, ".probe"), "ok");
    result.sessionsWritable = true;
  } catch (err) {
    result.sessionsWritable = false;
    result.sessionsError = err instanceof Error ? err.message : String(err);
  }

  // 3. Read worker.log if it exists
  const logFile = path.join(sessionsRoot, "worker.log");
  if (fs.existsSync(logFile)) {
    try {
      const content = fs.readFileSync(logFile, "utf8");
      result.workerLogTail = content.split("\n").slice(-50).join("\n");
    } catch (err) {
      result.workerLogError = err instanceof Error ? err.message : String(err);
    }
  } else {
    result.workerLogTail = "(file does not exist — worker never wrote anything)";
  }

  // 4. Try spawning worker AND capture stdout/stderr inline
  if (result.scriptExists) {
    const spawnResult = await new Promise<{ ok: boolean; stdout: string; stderr: string; exitCode: number | null; error?: string }>((resolve) => {
      let stdout = "";
      let stderr = "";
      let settled = false;
      const child = spawn(process.execPath, [scriptPath], {
        cwd: process.cwd(),
        env: process.env,
        stdio: ["ignore", "pipe", "pipe"],
      });

      child.stdout?.on("data", (chunk) => { stdout += chunk.toString(); });
      child.stderr?.on("data", (chunk) => { stderr += chunk.toString(); });

      child.on("error", (err) => {
        if (settled) return;
        settled = true;
        resolve({ ok: false, stdout, stderr, exitCode: null, error: err.message });
      });

      child.on("exit", (code) => {
        if (settled) return;
        settled = true;
        resolve({ ok: code === 0, stdout, stderr, exitCode: code });
      });

      // Give it 5 seconds — worker normally stays running, so a timeout here = "started OK"
      setTimeout(() => {
        if (settled) return;
        settled = true;
        try { child.kill(); } catch {}
        resolve({ ok: true, stdout, stderr, exitCode: null, error: "(timeout — worker still running, likely OK)" });
      }, 5000);
    });

    result.spawn = spawnResult;
  }

  return NextResponse.json(result, { status: 200 });
}

export const dynamic = "force-dynamic";
