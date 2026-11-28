export async function runScript(script: string, args: string[] = []): Promise<void> {
  const child = Bun.spawn([process.execPath, script, ...args], { stdout: 'pipe', stderr: 'pipe' });
  const [exitCode, stderr] = await Promise.all([
    child.exited,
    new Response(child.stderr).text(),
  ]);
  if (exitCode !== 0) throw new Error(stderr);
}
