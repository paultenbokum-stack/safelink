const { chromium } = require('C:/Users/saffy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('fs');
const assert = require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base=process.env.QA_BASE || 'http://localhost:3080';
 fs.mkdirSync('.vercel/qa',{recursive:true});
 for(const route of ['/login','/signup','/login/verify','/about','/cream']){
  await page.goto(base+route,{waitUntil:'networkidle'});
  if(route==='/signup') {
   await page.getByText('Watch for your verification email',{exact:true}).waitFor();
   const password=page.locator('#signup-password');
   assert.equal(await password.getAttribute('minlength'),'8');
   assert.equal(await page.locator('#confirm-password').getAttribute('minlength'),'8');
   await password.fill('abc');
   await page.getByText('Too short',{exact:true}).waitFor();
   await password.fill('abcdefgh');
   await page.getByText('Weak',{exact:true}).waitFor();
   await password.fill('Abcdef1!');
   await page.getByText('Strong',{exact:true}).waitFor();
   await page.screenshot({path:'.vercel/qa/signup-password-strength.png',fullPage:true});
   await page.getByPlaceholder('e.g. Sipho').fill('QA');
   await page.getByPlaceholder('e.g. Khumalo').fill('Customer');
   await page.locator('input[type="tel"]').first().fill('64 657 0633');
   await page.locator('input[type="email"]').fill('qa@example.test');
   await page.locator('#confirm-password').fill('Abcdef1!');
   await page.getByRole('button',{name:/Continue to Circle & Home/i}).click();
   await page.getByRole('heading',{name:'Family Circle & Home'}).waitFor();
  }
  if(route==='/login/verify') await page.getByText(/mark it as Not spam before opening the verification link/i).waitFor();
  await page.screenshot({path:'.vercel/qa/'+route.slice(1)+'.png',fullPage:true});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);
  console.log(JSON.stringify({route,overflow,title:await page.locator('h1').first().textContent()}));
 }
 console.log(JSON.stringify({pageErrors:errors}));
 await browser.close();
})().catch(e=>{console.error(e.message);process.exitCode=1;});
