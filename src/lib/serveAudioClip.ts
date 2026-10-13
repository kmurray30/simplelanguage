import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

type AudioClipLike = { audioData: unknown; mimeType: string };

// Safari (and other strict UAs) require a real 206 response to a Range request before an
// <audio> element will play at all - a plain 200 with the full body is not enough. Shared by
// every route that streams a cached AudioClip (words, suggestion pool words, ...).
export function serveAudioClip(req: NextRequest, clip: AudioClipLike): NextResponse {
  const data = clip.audioData as unknown as Buffer;
  const total = data.length;
  const range = req.headers.get("range");

  // The URL (word/pool-word id) stays the same even when the underlying clip is regenerated
  // (edited text, a flushed/retried synthesis, ...), so caching by URL alone would let browsers
  // serve a stale clip forever. ETag ties the cache to the actual bytes instead: "no-cache"
  // makes the browser always revalidate, and a matching ETag still short-circuits to a cheap
  // 304 with no body, so an unchanged clip costs no more than before.
  const etag = `"${createHash("md5").update(data).digest("hex")}"`;
  if (req.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers: { ETag: etag, "Cache-Control": "no-cache" } });
  }

  const baseHeaders = {
    "Content-Type": clip.mimeType,
    "Cache-Control": "no-cache",
    "Accept-Ranges": "bytes",
    ETag: etag,
  };

  if (range) {
    const match = range.match(/^bytes=(\d*)-(\d*)$/);
    if (match) {
      const start = match[1] ? parseInt(match[1], 10) : 0;
      const end = match[2] ? parseInt(match[2], 10) : total - 1;
      const clampedEnd = Math.min(end, total - 1);

      if (start <= clampedEnd && start < total) {
        const chunk = data.subarray(start, clampedEnd + 1);
        return new NextResponse(chunk as unknown as BodyInit, {
          status: 206,
          headers: {
            ...baseHeaders,
            "Content-Range": `bytes ${start}-${clampedEnd}/${total}`,
            "Content-Length": String(chunk.length),
          },
        });
      }

      return new NextResponse(null, {
        status: 416,
        headers: { ...baseHeaders, "Content-Range": `bytes */${total}` },
      });
    }
  }

  return new NextResponse(data as unknown as BodyInit, {
    headers: { ...baseHeaders, "Content-Length": String(total) },
  });
}
