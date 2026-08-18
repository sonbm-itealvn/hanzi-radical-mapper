import fs from 'fs';

console.log('[fix-wrangler.js] Running postbuild hook to fix Cloudflare configuration bug...');

const config = {
  name: "hanzi-radical-mapper",
  compatibility_date: "2026-08-15",
  observability: { enabled: true },
  assets: {
    directory: "dist/public",
    not_found_handling: "single-page-application"
  }
};

try {
  // Write correct config to wrangler.jsonc (overwrite any broken auto-generated one)
  fs.writeFileSync('wrangler.jsonc', JSON.stringify(config, null, 2));
  console.log('[fix-wrangler.js] Successfully wrote fixed wrangler.jsonc');
} catch (e) {
  console.error('[fix-wrangler.js] Error:', e);
}
