export async function onRequestGet({ env, params }) {
  const key = params.path ? `templates/${params.path}` : null;
  if (!key) return new Response("Missing key", { status: 400 });

  const obj = await env.TEMPLATES_BUCKET.get(key);
  if (!obj) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("etag", obj.httpEtag);

  return new Response(obj.body, { headers });
}
