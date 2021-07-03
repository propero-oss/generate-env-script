export function parseEnv(prefixes: string[], env: typeof process.env = process.env): Record<string, string> {
  return Object.fromEntries(Object.entries(env).filter(([name]) => prefixes.findIndex(prefix => name.startsWith(prefix)) !== -1)) as Record<string, string>;
}

export function envJson(prefixes: string[], env: typeof process.env = process.env) {
  return JSON.stringify(parseEnv(prefixes, env), null, 2);
}
