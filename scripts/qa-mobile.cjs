const { chromium } = require('C:/Users/saffy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('fs');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base=process.env.QA_BASE || 'http://localhost:3080';
 fs.mkdirSync('.vercel/qa',{recursive:true});
 for(const route of ['/login','/signup','/login/verify','/about','/cream']){
  await page.goto(base+route,{waitUntil:'networkidle'});
  if(route==='/signup') await page.getByText('Watch for your verification email',{exact:true}).waitFor();
  if(route==='/login/verify') await page.getByText(/mark it as Not spam before opening the verification link/i).waitFor();
  await page.screenshot({path:'.vercel/qa/'+route.slice(1)+'.png',fullPage:true});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);
  console.log(JSON.stringify({route,overflow,title:await page.locator('h1').first().textContent()}));
 }
 console.log(JSON.stringify({pageErrors:errors}));
 await browser.close();
})().catch(e=>{console.error(e.message);process.exitCode=1;});
