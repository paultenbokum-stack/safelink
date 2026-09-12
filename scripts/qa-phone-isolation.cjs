const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');

function handler({ account = 'alice', records = {}, cache = new Map(), unavailable = false } = {}) {
  const reads = [];
  const source = readFileSync('src/app/api/location/share/route.js', 'utf8')
    .replace(/^import .*;\r?\n/gm, '')
    .replace(/export async function /g, 'async function ');
  const GET = runInNewContext(source + '\nGET;', {
    global: { _safelinkPhoneLocations: cache },
    Map, console: { warn() {}, error() {} },
    NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) },
    authenticateFirebaseRequest: async () => {
      if (!account) throw Error('UNAUTHENTICATED');
      return { uid: account };
    },
    getAdminFirestore: () => ({ collection: (collection) => ({
      doc: (id) => ({ get: async () => {
        reads.push(`${collection}/${id}`);
        if (unavailable) throw Error('Unavailable');
        return { exists: !!records[id], data: () => records[id] };
      } }),
    }) }),
  });
  return { GET, reads };
}

const alice = { id: 'phone_alice', uid: 'alice', isPhoneDevice: true, lat: 1, lng: 2 };
const bob = { id: 'phone_bob', uid: 'bob', isPhoneDevice: true, lat: 3, lng: 4 };

test('only reads and returns the authenticated phone, including with another cached account', async () => {
  const { GET, reads } = handler({ records: { phone_alice: alice, phone_bob: bob }, cache: new Map([['bob', bob]]) });
  const result = await GET({});
  assert.equal(result.body.locations.length, 1);
  assert.equal(result.body.locations[0].uid, 'alice');
  assert.deepEqual(reads, ['device_locations/phone_alice']);
});

test('fresh account sees no other account locations', async () => {
  const { GET } = handler({ records: { phone_bob: bob }, cache: new Map([['bob', bob]]) });
  assert.equal((await GET({})).body.locations.length, 0);
});

test('database failure falls back only to the same account cache', async () => {
  const { GET } = handler({ unavailable: true, cache: new Map([['alice', alice], ['bob', bob]]) });
  const result = await GET({});
  assert.equal(result.body.locations.length, 1);
  assert.equal(result.body.locations[0].uid, 'alice');
});

test('mismatched ownership is rejected in both storage paths', async () => {
  const { GET } = handler({ records: { phone_alice: bob }, cache: new Map([['alice', bob]]) });
  assert.equal((await GET({})).body.locations.length, 0);
});

test('unauthenticated request cannot read the database', async () => {
  const { GET, reads } = handler({ account: null });
  assert.equal((await GET({})).status, 401);
  assert.deepEqual(reads, []);
});
