// Removes only disposable QA identities created by this session's scripts.
const headers={Authorization:'Bearer '+process.env.SAFELINK_QA_GOOGLE_TOKEN,'x-goog-user-project':'safelink-b8071','Content-Type':'application/json'};
(async()=>{
 const r=await fetch('https://identitytoolkit.googleapis.com/v1/projects/safelink-b8071/accounts:batchGet?maxResults=1000',{headers});
 if(!r.ok)throw Error('QA inventory HTTP '+r.status);
 const data=await r.json();
 const accounts=(data.users||[]).filter(u=>/^safelink-qa-[0-9a-f-]+@example\.com$/.test(u.email||'')&&Number(u.createdAt)>Date.now()-3*60*60*1000);
 for(const u of accounts){
  for(const path of ['households/'+u.localId,'phone_sharing_consent/'+u.localId,'devices/phone_'+u.localId,'device_locations/phone_'+u.localId]){
   const cleanup=await fetch('https://firestore.googleapis.com/v1/projects/safelink-b8071/databases/(default)/documents/'+path,{method:'DELETE',headers});
   if(!cleanup.ok&&cleanup.status!==404)throw Error('QA record cleanup HTTP '+cleanup.status);
  }
  const deletion=await fetch('https://identitytoolkit.googleapis.com/v1/projects/safelink-b8071/accounts:delete',{method:'POST',headers,body:JSON.stringify({localId:u.localId})});
  if(!deletion.ok)throw Error('QA identity cleanup HTTP '+deletion.status);
 }
 console.log(JSON.stringify({removedDisposableQaAccounts:accounts.length}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
