export default {
  async fetch(request: Request, env: any, ctx: any) {
    // Cloudflare Workers Assets will automatically serve static files from dist/public.
    // This fetch handler only catches requests that didn't match any static asset.
    return new Response("Not found", { status: 404 });
  }
};
