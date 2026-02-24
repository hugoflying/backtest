export async function onRequestGet({ env, params }) {
  if (!env?.TEMPLATES_BUCKET) {
    return new Response("Missing R2 binding", { status: 500 });
  }

  if (!params?.path) {
    return new Response("Missing path", { status: 400 });
  }

  const key = `templates/${params.path}`;
  const obj = await env.TEMPLATES_BUCKET.get(key);

  if (!obj) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(obj.body, {
    headers: {
      "Content-Type": "application/pdf"
    }
  });
}
