import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../worker.js';
import recordings from '../audio/music/available.json' with { type: 'json' };

// In production workerd uses this stream's known size for Content-Length.
class TestFixedLengthStream extends TransformStream {
  constructor() { super(); }
}
const file = 'ittekimasu.mp3';
const path = '/audio/music/' + file;
const versioned = path + '?v=' + recordings[file].sha256.slice(0, 12);
const tag = '"song-etag"';

function serve(url = path, headers = {}, method = 'GET', { status = 200, known = true } = {}) {
  const calls = [];
  const stock = Uint8Array.from({ length: 24 }, (_, i) => i);
  let read = 0, cancelled = false;
  const assets = {
    async fetch(request) {
      calls.push(request);
      const head = { 'ETag': tag, 'Content-Type': 'audio/mpeg' };
      if (known) head['Content-Length'] = String(stock.length);
      const body = method === 'HEAD' || status === 304 ? null : new ReadableStream({
        pull(controller) {
          const chunk = stock.subarray(read, read + 4);
          if (!chunk.length) return controller.close();
          read += chunk.length;
          controller.enqueue(chunk);
        },
        cancel() { cancelled = true; },
      }, { highWaterMark: 0 });
      return new Response(body, { status, headers: head });
    },
  };
  const pending = [];
  const response = worker.fetch(new Request('https://game.example' + url, { method, headers }),
    { ASSETS: assets }, { waitUntil(work) { pending.push(work); } });
  return { response, calls, pending, get read() { return read; }, get cancelled() { return cancelled; } };
}

test('music ranges stream only the requested bytes, including Safari probes and suffixes', async t => {
  const saved = globalThis.FixedLengthStream;
  globalThis.FixedLengthStream = TestFixedLengthStream;
  t.after(() => { if (saved) globalThis.FixedLengthStream = saved; else delete globalThis.FixedLengthStream; });
  for (const [spec, start, end] of [['0-1', 0, 1], ['3-9', 3, 9], ['19-', 19, 23], ['-3', 21, 23], ['21-100', 21, 23], ['0-', 0, 23]]) {
    const run = serve(versioned, { Range: 'bytes=' + spec });
    const res = await run.response;
    assert.equal(res.status, 206);
    assert.equal(res.headers.get('Content-Range'), `bytes ${start}-${end}/24`);
    assert.equal(res.headers.get('Content-Length'), String(end - start + 1));
    assert.match(res.headers.get('Cache-Control'), /immutable/);
    assert.deepEqual([...new Uint8Array(await res.arrayBuffer())], Array.from({ length: end - start + 1 }, (_, i) => start + i));
    await Promise.all(run.pending);
    if (spec === '0-1') {
      assert.equal(run.read, 4);
      assert.equal(run.cancelled, true);
    }
  }
});

test('validators, HEAD and unsupported ranges preserve ordinary HTTP behavior', async () => {
  const conditional = await serve(versioned, { 'If-None-Match': '"other", W/' + tag, Range: 'bytes=0-1' }).response;
  assert.equal(conditional.status, 304);
  assert.equal(conditional.headers.get('ETag'), tag);
  assert.match(conditional.headers.get('Cache-Control'), /immutable/);
  const head = await serve(path, {}, 'HEAD', { known: false }).response;
  assert.equal(head.headers.get('Content-Length'), String(recordings[file].bytes));
  assert.equal(head.headers.get('Accept-Ranges'), 'bytes');
  assert.equal(head.body, null);
  for (const headers of [
    { Range: 'bytes=0-1', 'If-Range': '"stale"' }, { Range: 'bytes=1-2,8-9' }, { Range: 'items=0-1' },
  ]) {
    const full = await serve(path, headers).response;
    assert.equal(full.status, 200);
    assert.doesNotMatch(full.headers.get('Cache-Control'), /immutable/);
    assert.equal((await full.arrayBuffer()).byteLength, 24);
  }
  const entire = await serve(path, { Range: 'bytes=0-', 'If-Range': tag }).response;
  assert.equal(entire.status, 206);
  for (const range of ['bytes=24-', 'bytes=-0', 'bytes=8-3']) {
    const res = await serve(path, { Range: range }).response;
    assert.equal(res.status, 416);
    assert.equal(res.headers.get('Content-Range'), 'bytes */24');
    assert.equal(res.body, null);
  }
  const unknown = await serve('/audio/music/absent.mp3', {}, 'GET', { status: 404 }).response;
  assert.equal(unknown.status, 404);
  assert.equal(unknown.headers.has('Cache-Control'), false);
  const manifest = await serve('/audio/music/available.json').response;
  assert.equal(manifest.headers.has('Cache-Control'), false);
});
