const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');

function handler({ decoded = { uid: 'alice' }, records = {}, cache = new Map(), unavailable = false } = {}) {
  const reads = [];
  const source = readFileSync('src/app/api/location/share/route.js', 'utf8')
    .replace(/^import .*;\r?\n/gm, '')
    .replace(/export async function /g, 'async function ');
  const GET = runInNewContext(source + '\nGET;', {
    global: { _safelinkPhoneLocations: cache },
    Map,
    console: { warn() {}, error() {} },
    NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) },
    authenticateFirebaseRequest: async () => {
      if (!decoded) throw Error('UNAUTHENTICATED');
      return decoded;
    },
    getFamilyCircleAccess: async user => {
      if (unavailable) throw Error('Unavailable');
      const guardianUid = user.familyMember ? user.guardianUid : user.uid;
      const household = records.households?.[guardianUid] || {};
      const members = household.members || [];
      const linkedMembers = members.filter(member => {
        const link = records.familyMemberships?.[member.linkedUid];
        return member.linkedUid && link?.guardianUid === guardianUid && link?.memberId === member.id;
      });
      if (user.familyMember && !linkedMembers.some(member => member.linkedUid === user.uid && member.id === user.familyMemberId)) throw Error('FORBIDDEN');
      return { guardianUid, household, members, linkedMembers, ownerUids: [guardianUid, ...linkedMembers.map(member => member.linkedUid)] };
    },
    getAdminFirestore: () => ({ collection: collection => ({
      doc: id => ({ get: async () => {
        reads.push(`${collection}/${id}`);
        if (unavailable) throw Error('Unavailable');
        const value = records[collection]?.[id];
        return { exists: value !== undefined, data: () => value };
      } }),
    }) }),
  });
  return { GET, reads };
}

const alice = { id: 'phone_alice', uid: 'alice', isPhoneDevice: true, lat: 1, lng: 2 };
const bob = { id: 'phone_bob', uid: 'bob', isPhoneDevice: true, lat: 3, lng: 4 };
const consent = { consentGranted: true };

test('returns the authenticated phone only after consent', async () => {
  const { GET } = handler({ records: {
    phone_sharing_consent: { alice: consent },
    device_locations: { phone_alice: alice },
  } });
  const result = await GET({});
  assert.equal(result.body.locations.length, 1);
  assert.equal(result.body.locations[0].uid, 'alice');
  assert.equal(result.body.locations[0].isOwn, true);
});

test('does not return a phone when consent is absent or revoked', async () => {
  const { GET } = handler({ records: {
    phone_sharing_consent: { alice: { consentGranted: false } },
    device_locations: { phone_alice: alice },
  } });
  assert.equal((await GET({})).body.locations.length, 0);
});

test('guardian receives a visible linked member who has consented', async () => {
  const { GET } = handler({ records: {
    households: { alice: { members: [{ id: 'member_bob', name: 'Bob', linkedUid: 'bob', locationSharing: true }] } },
    familyMemberships: { bob: { guardianUid: 'alice', memberId: 'member_bob' } },
    phone_sharing_consent: { alice: consent, bob: consent },
    device_locations: { phone_alice: alice, phone_bob: bob },
  } });
  const locations = (await GET({})).body.locations;
  assert.equal(JSON.stringify(Array.from(locations, item => item.uid).sort()), JSON.stringify(['alice', 'bob']));
  assert.equal(locations.find(item => item.uid === 'bob').nickname, 'Bob');
  assert.equal(locations.find(item => item.uid === 'bob').isOwn, false);
});

test('guardian cannot receive hidden, unverified, or non-consenting linked phones', async () => {
  const base = {
    households: { alice: { members: [{ id: 'member_bob', linkedUid: 'bob', locationSharing: false }] } },
    familyMemberships: { bob: { guardianUid: 'alice', memberId: 'member_bob' } },
    phone_sharing_consent: { bob: consent },
    device_locations: { phone_bob: bob },
  };
  assert.equal((await handler({ records: base }).GET({})).body.locations.length, 0);

  base.households.alice.members[0].locationSharing = true;
  base.familyMemberships.bob.guardianUid = 'mallory';
  assert.equal((await handler({ records: base }).GET({})).body.locations.length, 0);

  base.familyMemberships.bob.guardianUid = 'alice';
  base.phone_sharing_consent.bob.consentGranted = false;
  assert.equal((await handler({ records: base }).GET({})).body.locations.length, 0);
});

test('an invited member receives all visible, consenting family phones', async () => {
  const { GET, reads } = handler({
    decoded: { uid: 'bob', familyMember: true, guardianUid: 'alice', familyMemberId: 'member_bob' },
    records: {
      households: { alice: { adminFirstName: 'Alice', members: [{ id: 'member_bob', name: 'Bob', linkedUid: 'bob', locationSharing: true }] } },
      familyMemberships: { bob: { guardianUid: 'alice', memberId: 'member_bob' } },
      phone_sharing_consent: { bob: { consentGranted: true }, alice: { consentGranted: true } },
      device_locations: { phone_bob: bob, phone_alice: alice },
    },
  });
  const locations = (await GET({})).body.locations;
  assert.equal(JSON.stringify(Array.from(locations, item => item.uid).sort()), JSON.stringify(['alice', 'bob']));
  assert.equal(reads.some(path => path.includes('alice')), true);
});

test('joined family members remain listed when their GPS consent is off', async () => {
  const { GET } = handler({ records: {
    households: { alice: { adminFirstName: 'Alice', members: [{ id: 'member_bob', name: 'Bob', linkedUid: 'bob', locationSharing: true }] } },
    familyMemberships: { bob: { guardianUid: 'alice', memberId: 'member_bob' } },
    phone_sharing_consent: { alice: consent, bob: { consentGranted: false } },
    device_locations: { phone_alice: alice },
  } });
  const result = await GET({});
  assert.equal(result.body.familyMembers.find(member => member.uid === 'bob').sharingEnabled, false);
  assert.equal(result.body.locations.some(location => location.uid === 'bob'), false);
});

test('database failure never exposes cached coordinates', async () => {
  const { GET } = handler({ unavailable: true, cache: new Map([['alice', alice], ['bob', bob]]) });
  const result = await GET({});
  assert.equal(result.status, 503);
  assert.equal(result.body.locations, undefined);
});

test('unauthenticated request cannot read the database', async () => {
  const { GET, reads } = handler({ decoded: null });
  assert.equal((await GET({})).status, 401);
  assert.deepEqual(reads, []);
});
