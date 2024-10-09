import type {APIRoute} from "astro";
import {z} from "astro:schema";

const downloadVideoSchema = z.object({
  url: z.string(),
  name: z.string(),
  size: z.number(),
});
export type DownloadVideo = z.infer<typeof downloadVideoSchema>;

export const POST: APIRoute = async ({request}) => {
  const fd = await request.formData();
  const payload = fd.get("payload");
  if (!payload) {
    return new Response(null, {
      status: 400,
      statusText: "bad request",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  const json = JSON.parse(payload.toString());
  const parsed = downloadVideoSchema.safeParse(json);
  if (parsed.error) {
    return new Response(JSON.stringify(parsed.error), {
      status: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
  try {
    const res = await fetch(parsed.data.url);
    console.log({res});
    if (!res.ok) {
      return new Response(null, {
        status: 500,
      });
    }
    return new Response(res.body, {
      headers: {
        "Content-Type": "application/octet-stream; charset=utf-8",
        "Content-Disposition": `attachment; filename=${parsed.data.name}.mp4`,
        "Content-Length": `${parsed.data.size}`,
      },
    });
  } catch (e) {
    console.error(e);
    return new Response(null, {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
};
