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
   const city=page.getByPlaceholder('e.g. Johannesburg');
   await page.getByText('Your role in this household',{exact:true}).waitFor();
   await page.getByText(/you remain the account administrator/i).waitFor();
   assert.equal(await city.inputValue(),'');
   assert.equal(await city.getAttribute('placeholder'),'e.g. Johannesburg');
   await page.screenshot({path:'.vercel/qa/signup-city-placeholder.png',fullPage:true});
   await city.fill('Ballito');
   assert.equal(await city.inputValue(),'Ballito');
   await page.getByPlaceholder('e.g. 14 Protea Road, Estate Villa 4').fill('10 Lake Street');
   await page.getByPlaceholder('e.g. Sandton / Bryanston').fill('Salt Rock');
   await page.getByRole('button',{name:/Continue to Emergency/i}).click();
   await page.getByRole('heading',{name:/Emergency Contact & Safeguard Protocols/i}).waitFor();
   await page.getByText('Emergency contact’s relationship to you *',{exact:true}).waitFor();
   await page.getByText(/does not give them access to your account or location/i).waitFor();
   await page.screenshot({path:'.vercel/qa/signup-emergency-relationship.png',fullPage:true});
   const submit=page.getByRole('button',{name:/Create Account & Verify Email/i});
   const submitIcon=submit.locator('.material-symbols-outlined');
   for(const width of [320,390,768]) {
    await page.setViewportSize({width,height:844});
    const [buttonBox,iconBox]=await Promise.all([submit.boundingBox(),submitIcon.boundingBox()]);
    assert.ok(buttonBox && iconBox,`Signup action geometry is available at ${width}px`);
    const rightInset=(buttonBox.x+buttonBox.width)-(iconBox.x+iconBox.width);
    assert.ok(rightInset>=14 && rightInset<=18,`Rocket right inset is 16px at ${width}px (received ${rightInset}px)`);
    assert.ok(iconBox.y>=buttonBox.y && iconBox.y+iconBox.height<=buttonBox.y+buttonBox.height,`Rocket stays vertically inside the action at ${width}px`);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false,`No signup overflow at ${width}px`);
    await submit.scrollIntoViewIfNeeded();
    await page.screenshot({path:`.vercel/qa/signup-action-${width}.png`,fullPage:true});
   }
   await page.setViewportSize({width:390,height:844});
  }
  if(route==='/login/verify') await page.getByText(/mark it as Not spam before opening the verification link/i).waitFor();
  await page.screenshot({path:'.vercel/qa/'+route.slice(1)+'.png',fullPage:true});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);
  console.log(JSON.stringify({route,overflow,title:await page.locator('h1').first().textContent()}));
 }
 console.log(JSON.stringify({pageErrors:errors}));
 await browser.close();
})().catch(e=>{console.error(e.message);process.exitCode=1;});
