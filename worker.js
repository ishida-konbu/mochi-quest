import recordings from './audio/music/available.json' with { type: 'json' };

// Static Assets currently serves complete MP3s for Range requests. Safari probes the
// first two bytes, then asks for the rest or the end of the recording as needed.
function byteRange(value, size) {
  const match = /^bytes=(\d*)-(\d*)$/i.exec(value?.trim() || '');
  if (!match || (!match[1] && !match[2])) return null;
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(size - 1, Number(match[2])) : size - 1;
  return { start, end };
}

function ifRangeMatches(value, headers) {
  if (!value) return true;
  if (value.startsWith('"')) return value === headers.get('etag');
  const modified = headers.get('last-modified');
  return modified !== null && Date.parse(value) === Date.parse(modified);
}

async function copyRange(body, writable, start, end) {
  const reader = body.getReader(), writer = writable.getWriter();
  let offset = 0;
  try {
    while (offset <= end) {
      const { value, done } = await reader.read();
      if (done) throw new Error('Truncated music asset');
      const next = offset + value.byteLength;
      if (next > start) {
        await writer.write(value.subarray(Math.max(0, start - offset), end + 1 - offset));
      }
      offset = next;
    }
    await writer.close();
  } catch (error) {
    await writer.abort(error);
  } finally {
    await reader.cancel();
  }
}

export default {
  async fetch(request, env, context) {
    const url = new URL(request.url), path = url.pathname;
    if (!/^\/audio\/music\/[^/]+\.mp3$/.test(path) || !['GET', 'HEAD'].includes(request.method)) {
      return env.ASSETS.fetch(request);
    }
    const upstream = new Request(request);
    upstream.headers.set('Accept-Encoding', 'identity');
    const asset = await env.ASSETS.fetch(upstream);
    if (![200, 206, 304].includes(asset.status)) return asset;
    const track = recordings[path.slice('/audio/music/'.length)];
    const headers = new Headers(asset.headers);
    headers.set('Cache-Control', track?.sha256 && url.searchParams.get('v') === track.sha256.slice(0, 12)
      ? 'public, max-age=31536000, immutable' : 'public, max-age=86400');
    // The ASSETS binding can omit Content-Length even when workerd knows the size
    // internally. The release manifest records the exact bytes verified at build.
    const size = Number(headers.get('Content-Length') ?? track?.bytes);
    const knownSize = Number.isSafeInteger(size) && size >= 0;
    if (knownSize || asset.status === 206) headers.set('Accept-Ranges', 'bytes');
    if (asset.status === 206) return new Response(asset.body, { status: 206, headers });
    const tag = headers.get('ETag');
    const matches = (request.headers.get('If-None-Match') || '').split(',')
      .some(value => value.trim() === '*' || (tag && value.trim().replace(/^W\//, '') === tag));
    if (asset.status === 304 || (asset.status === 200 && matches)) {
      asset.body?.cancel();
      headers.delete('Content-Length');
      return new Response(null, { status: 304, headers });
    }
    if (request.method === 'HEAD') {
      if (knownSize) headers.set('Content-Length', String(size));
      return new Response(null, { status: asset.status, headers });
    }
    const range = knownSize && ifRangeMatches(request.headers.get('If-Range'), headers) &&
      byteRange(request.headers.get('Range'), size);
    if (!range) return new Response(asset.body, { status: asset.status, headers });
    const { start, end } = range;
    if (start > end || start >= size) {
      asset.body?.cancel();
      headers.set('Content-Range', 'bytes */' + size);
      headers.set('Content-Length', '0');
      headers.set('Cache-Control', 'no-store');
      return new Response(null, { status: 416, headers });
    }
    const count = end - start + 1;
    headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
    headers.set('Content-Length', String(count));
    if (count === size) return new Response(asset.body, { status: 206, headers });
    // workerd derives Content-Length from the stream's known size.
    const out = new FixedLengthStream(count);
    context.waitUntil(copyRange(asset.body, out.writable, start, end));
    return new Response(out.readable, { status: 206, headers });
  },
};
