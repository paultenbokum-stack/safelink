const { chromium } = require('C:/Users/saffy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const { randomUUID } = require('crypto');
const fs = require('fs');
const base='https://safelink-app-peach.vercel.app';
const email=`safelink-qa-${randomUUID()}@example.com`;
const password=randomUUID()+'aA9!';
const key=process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const adminHeaders={Authorization:'Bearer '+process.env.SAFELINK_QA_GOOGLE_TOKEN,'x-goog-user-project':'safelink-b8071','Content-Type':'application/json'};
let uid, token, browser, qaPage;
async function api(path,body,admin=false){const r=await fetch('https://identitytoolkit.googleapis.com/v1/'+path+(admin?'':'?key='+key),{method:'POST',headers:admin?adminHeaders:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw Error('Firebase '+r.status+': '+d.error?.message);return d;}
async function request(path,options={}){return fetch(base+path,{...options,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',...options.headers}});}
(async()=>{
 try{
  browser=await chromium.launch({headless:true,channel:'msedge'});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  // Test session chooses not to share location. No real phone coordinates are sent.
  await context.addInitScript(()=>localStorage.setItem('popia_gps_consent','denied'));
  const page=await context.newPage();qaPage=page;const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('response',async r=>{if(r.url().includes('/api/profile/setup'))console.log(JSON.stringify({check:'profile setup response',status:r.status()}));});
  page.on('response',async res=>{if(res.url().includes('accounts:signUp')&&res.ok()){const d=await res.json();uid=d.localId;token=d.idToken;}});
  await page.goto(base+'/signup');
  await page.getByPlaceholder('e.g. Sipho').fill('Investor QA');
  await page.getByPlaceholder('e.g. Khumalo',{exact:true}).fill('Demo');
  await page.getByPlaceholder('82 345 6789').fill('820000000');
  await page.getByPlaceholder('sipho.khumalo@example.co.za').fill(email);
  await page.locator('#signup-password').fill(password);
  await page.locator('#confirm-password').fill(password);
  await page.getByRole('button',{name:'Continue to Circle & Home'}).click();
  await page.getByPlaceholder('e.g. 14 Protea Road, Estate Villa 4').fill('[Demo] QA address');
  await page.getByPlaceholder('e.g. Sandton / Bryanston').fill('[Demo] QA suburb');
  await page.getByPlaceholder('e.g. 2196').fill('2000');
  await page.getByRole('button',{name:'Continue to Emergency'}).click();
  await page.getByPlaceholder('e.g. Nomsa Khumalo').fill('[Demo] QA contact');
  await page.getByPlaceholder('+27 83 999 8877').fill('+27830000000');
  const saveResponse=page.waitForResponse(r=>r.url().includes('/api/profile/setup')&&r.request().method()==='POST');
  await page.getByRole('button',{name:'Create Account & Verify Email'}).click();
  const saved=await saveResponse;if(!saved.ok())throw Error('Profile save failed with HTTP '+saved.status());
  await page.waitForURL('**/login/verify',{timeout:45000});
  console.log('PASS: real signup UI saved profile and reached email verification');
  const blocked=await request('/api/devices');if(blocked.status!==401)throw Error('Unverified access not blocked');
  console.log('PASS: unverified account cannot access device API');
  // Generate a verification link for our disposable QA address without sending email.
  const link=await api('projects/safelink-b8071/accounts:sendOobCode',{requestType:'VERIFY_EMAIL',email,returnOobLink:true},true);
  const oobCode=new URL(link.oobLink).searchParams.get('oobCode');
  await api('accounts:update',{oobCode});
  await page.getByRole('button',{name:'I’ve verified my email'}).click();
  await page.waitForURL('**/dashboard',{timeout:30000});
  const signin=await api('accounts:signInWithPassword',{email,password,returnSecureToken:true});token=signin.idToken;
  const profile=await (await request('/api/profile/setup')).json();
  if(profile.household?.phoneVerified!==false)throw Error('Phone incorrectly verified');
  const devicesResponse=await request('/api/devices');const deviceData=await devicesResponse.json();
  console.log(JSON.stringify({check:'live devices API',status:devicesResponse.status,tracksolidResolved:deviceData.tracksolidResolved,accountDevices:deviceData.devices?.length}));
  const phonesResponse=await request('/api/location/share');
  const phones=await phonesResponse.json();
  if(!phonesResponse.ok || phones.locations?.length !== 0)throw Error('Fresh account can see unexpected phone locations');
  console.log('PASS: fresh account has no shared phone locations from other accounts');
  await page.getByText('Your Security Network',{exact:true}).waitFor();
  await page.getByText('Activity Timeline',{exact:true}).waitFor();
  fs.mkdirSync('.vercel/qa',{recursive:true});await page.screenshot({path:'.vercel/qa/production-dashboard.png',fullPage:true});
  console.log('PASS: verified login, dashboard, account profile and activity feed');
  let dispatchCalls=0;page.on('request',r=>{if(r.url().includes('/api/sos/dispatch')||/panic\.aura/.test(r.url()))dispatchCalls++;});
  await page.goto(base+'/sos');
  await page.getByRole('button',{name:/Armed Response.*Start demo/}).click();
  await page.getByText('✅ Response Dispatched',{exact:true}).waitFor({timeout:20000});
  await page.getByRole('button',{name:'Track Officer →'}).click();
  await page.getByText('[Demo] Response unit AR-402',{exact:true}).waitFor();
  await page.screenshot({path:'.vercel/qa/production-sos.png',fullPage:true});
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  await page.getByRole('button',{name:/Armed Response.*Start demo/}).waitFor();
  if(dispatchCalls)throw Error('SOS made a dispatch request');
  console.log('PASS: SOS sequence, officer demonstration and cancellation; zero dispatch requests');
  await page.goto(base+'/store');
  for(const name of ['Sentinel Personal Tag','Sentinel Vehicle GPS','Sentinel Pro (Armatek)'])await page.getByRole('heading',{name,exact:true}).waitFor();
  await page.screenshot({path:'.vercel/qa/production-store.png',fullPage:true});
  await page.getByRole('button',{name:'Add to Cart',exact:true}).first().click();
  await page.getByText('Your cart (1)',{exact:true}).waitFor();
  const checkout=await request('/api/paystack/initialize',{method:'POST',body:JSON.stringify({cart:[{id:'sentinel-personal',qty:1}],delivery:{name:'[Demo] Investor QA',phone:'+27820000000',addressLine1:'[Demo] QA address',suburb:'QA',city:'Johannesburg',province:'Gauteng',postalCode:'2000'}})});
  const payment=await checkout.json();
  console.log(JSON.stringify({check:'Paystack test initialization',status:checkout.status,mode:payment.mode,amount:payment.amount}));
  if(!checkout.ok){console.log('FAIL: Paystack initialization; remaining checks will continue');process.exitCode=1;}
  if(checkout.ok&&payment.mode!=='test')throw Error('Checkout not in test mode');
  if(payment.reference){await fetch('https://firestore.googleapis.com/v1/projects/safelink-b8071/databases/(default)/documents/paymentIntents/'+payment.reference,{method:'DELETE',headers:adminHeaders});}
  console.log('PASS: three store tiers and Add to Cart');
  await page.goto(base+'/map');
  await page.getByRole('button',{name:'Open device selector'}).waitFor();
  await page.locator('.gm-style,.leaflet-container,.mapboxgl-map').first().waitFor({timeout:30000});
  await page.waitForFunction(() => [...document.querySelectorAll('.leaflet-tile,.gm-style img')].some(img => img.complete && img.naturalWidth > 100), null, {timeout:30000});
  console.log('PASS: map tiles loaded');
  await page.screenshot({path:'.vercel/qa/production-map.png',fullPage:true});
  console.log(JSON.stringify({check:'map',mapSurface:await page.locator('.gm-style,.leaflet-container,.mapboxgl-map').count(),overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)}));
  for(const route of ['/about','/cream']){await page.goto(base+route);await page.getByRole('heading',{name:route==='/about'?'Why Safelink':'Partner Integrations',exact:true}).waitFor();}
  console.log(JSON.stringify({check:'production browser page errors',errors}));
 }catch(error){
  if(qaPage){await qaPage.screenshot({path:'.vercel/qa/production-failure.png',fullPage:true});console.log((await qaPage.locator('main').innerText()).replaceAll(email,'[QA email]').slice(-1200));}
  throw error;
 }finally{
  if(browser)await browser.close();
  if(uid){
   const intents=await fetch('https://firestore.googleapis.com/v1/projects/safelink-b8071/databases/(default)/documents:runQuery',{method:'POST',headers:adminHeaders,body:JSON.stringify({structuredQuery:{from:[{collectionId:'paymentIntents'}],where:{fieldFilter:{field:{fieldPath:'uid'},op:'EQUAL',value:{stringValue:uid}}}}})});
   if(!intents.ok)throw Error('QA payment intent cleanup query failed');
   for(const row of await intents.json()){
    if(row.document?.fields?.uid?.stringValue===uid){
     const removed=await fetch('https://firestore.googleapis.com/v1/'+row.document.name,{method:'DELETE',headers:adminHeaders});
     if(!removed.ok)throw Error('QA payment intent cleanup failed');
    }
   }
   for(const path of ['households/'+uid,'phone_sharing_consent/'+uid,'devices/phone_'+uid,'device_locations/phone_'+uid]){const r=await fetch('https://firestore.googleapis.com/v1/projects/safelink-b8071/databases/(default)/documents/'+path,{method:'DELETE',headers:adminHeaders});if(!r.ok&&r.status!==404)console.log('QA cleanup failed for '+path.split('/')[0]+': '+r.status);}
   await api('projects/safelink-b8071/accounts:delete',{localId:uid},true);
   console.log('Disposable QA account and profile removed');
  }
 }
})().catch(e=>{console.error(e.message);process.exitCode=1;});
