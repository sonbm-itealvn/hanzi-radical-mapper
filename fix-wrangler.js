import fs from 'fs';

console.log('[fix-wrangler.js] Running postbuild hook to fix Cloudflare configuration bug...');

const config = {
  name: "hanzi-radical-mapper",
  compatibility_date: "2026-08-15",
  assets: {
    directory: "dist/public",
    binding: "ASSETS"
  }
};

try {
  // If Cloudflare auto-generated wrangler.jsonc, delete it to prevent conflict
  if (fs.existsSync('wrangler.jsonc')) {
    console.log('[fix-wrangler.js] Found auto-generated wrangler.jsonc. Deleting it...');
    fs.unlinkSync('wrangler.jsonc');
  }

  // Rewrite wrangler.json forcefully to include directory property
  fs.writeFileSync('wrangler.json', JSON.stringify(config, null, 2));
  console.log('[fix-wrangler.js] Successfully wrote fixed wrangler.json');
} catch (e) {
  console.error('[fix-wrangler.js] Error:', e);
}
