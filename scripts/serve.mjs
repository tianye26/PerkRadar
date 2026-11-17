import { spawn } from "node:child_process";
// Avoid shell interpolation: HOST is an argument, never executable text.
const mode = process.argv[2];
if (!["dev", "start"].includes(mode)) throw new Error("Invalid server mode");
// Flags passed after `npm run dev -- ...` land in argv after the mode
// (e.g. the Uppcoder platform starts `npm run dev -- -H 127.0.0.1 -p 8000`).
// Honor them; fall back to env, then to the local defaults.
const flagValue = (names) => {
  const args = process.argv.slice(3);
  for (let i = 0; i < args.length; i++) {
    if (names.includes(args[i]) && args[i + 1] !== undefined) return args[i + 1];
    for (const name of names) {
      if (args[i].startsWith(`${name}=`)) return args[i].slice(name.length + 1);
    }
  }
  return undefined;
};
const host = flagValue(["-H", "--hostname"]) || process.env.HOST || "127.0.0.1";
const port = flagValue(["-p", "--port"]) || process.env.PORT || "38471";
const args = ["node_modules/next/dist/bin/next", mode, "-H", host, "-p", port];
if (mode === "dev") args.push("--turbopack");
const child = spawn(process.execPath, args, { stdio: "inherit" });
for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, () => child.kill(signal));
child.on("error", () => process.exit(1));
child.on("exit", (code) => process.exit(code ?? 1));
