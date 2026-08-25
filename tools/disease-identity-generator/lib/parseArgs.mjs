export function parseArgs(argv) {
  const args = { flags: new Set(), positional: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i += 1;
      } else {
        args.flags.add(key);
      }
    } else {
      args.positional.push(token);
    }
  }
  return args;
}
