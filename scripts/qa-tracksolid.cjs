const fs = require('fs');
(async () => {
  // Exercise the same server API client without writing its token cache to Firestore.
  const source = fs.readFileSync('src/lib/tracksolid.js','utf8')
    .replace("import 'server-only';", '')
    .replace("import { getAdminFirestore } from './firebase-admin';", "const getAdminFirestore = () => { throw new Error('QA uses memory cache'); };");
  const mod = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
  const data = await mod.listDevices(process.env.TRACKSOLID_USER_ID);
  console.log(JSON.stringify({tracksolidCode:data.code,deviceCount:data.result?.length}));
  if (data.code === 0 && data.result?.length) {
    const loc = await mod.getDeviceLocation(data.result[0].imei);
    const points = Array.isArray(loc.result) ? loc.result : [loc.result];
    console.log(JSON.stringify({locationCode:loc.code,hasRealCoordinates:points.some(p => p && Number.isFinite(parseFloat(p.lat)) && Number.isFinite(parseFloat(p.lng)))}));
  }
})().catch(e => { console.error('TrackSolid QA failed: ' + e.message); process.exitCode=1; });
