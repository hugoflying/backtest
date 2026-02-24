export async function onRequestGet({ env, params }) {
  if (!env?.TEMPLATES_BUCKET) {
    return new Response("Missing R2 binding", { status: 500 });
  }

  if (!params?.path) {
    return new Response("Missing path", { status: 400 });
  }

  // Décode correctement les espaces (%20) et caractères spéciaux
  const filename = decodeURIComponent(params.path);

  // Sécurité basique contre ../
  if (filename.includes("..")) {
    return new Response("Invalid path", { status: 400 });
  }

  const key = `templates/${filename}`;

  const obj = await env.TEMPLATES_BUCKET.get(key);

  if (!obj) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(obj.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
