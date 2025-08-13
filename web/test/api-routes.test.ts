import assert from 'node:assert';
import { POST as runPost } from '../app/api/run/route.ts';
import { GET as profileGet, POST as profilePost } from '../app/api/profile/route.ts';

async function runTests() {
  // POST /api/run invalid payload
  {
    const req = new Request('http://localhost/api/run', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ score: 'bad' })
    });
    const res = await runPost(req);
    assert.strictEqual(res.status, 400);
    const json = await res.json();
    assert.strictEqual(json.ok, false);
    assert.ok(json.error);
    console.log('POST /api/run invalid payload: ok');
  }

  // GET /api/profile missing userId
  {
    const req = new Request('http://localhost/api/profile');
    const res = await profileGet(req);
    assert.strictEqual(res.status, 400);
    const json = await res.json();
    assert.strictEqual(json.ok, false);
    assert.ok(json.error);
    console.log('GET /api/profile requires userId: ok');
  }

  // POST /api/profile invalid payload
  {
    const req = new Request('http://localhost/api/profile', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ handle: 'abc' })
    });
    const res = await profilePost(req);
    assert.strictEqual(res.status, 400);
    const json = await res.json();
    assert.strictEqual(json.ok, false);
    assert.ok(json.error);
    console.log('POST /api/profile invalid payload: ok');
  }

  console.log('All tests passed');
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
