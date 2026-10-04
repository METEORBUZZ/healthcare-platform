import fs from 'node:fs';
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    server: 'src/server.ts',
    migrate: 'src/db/migrate.ts',
    seed: 'src/db/seed.ts',
    createAdmin: 'src/db/create-admin.ts',
  },
  format: ['esm'],
  target: 'node20',
  platform: 'node',
  sourcemap: true,
  clean: true,
  // The shared workspace package ships TypeScript source, so it must be bundled.
  // Everything else stays external and is installed from package.json at runtime.
  noExternal: ['@healthcare/shared'],
  async onSuccess() {
    fs.cpSync('src/db/migrations', 'dist/migrations', { recursive: true });
  },
});
