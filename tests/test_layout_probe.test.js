// Layout check on real Chromium: needs CDP_URL (workspace browser) or a local Playwright browser.
// Skipped when no browser is available; the Python tests cover the pipeline logic with a fake browser.
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('fs');const path=require('path');const os=require('os');
const base=path.resolve(__dirname,'../engine/render');const fixtures=path.join(__dirname,'fixtures/layout');
const canRun=!!process.env.CDP_URL||!!process.env.LAYOUT_TEST_LOCAL;
async function run(name,extra=[]){const {main}=require(base+'/render');const d=fs.mkdtempSync(path.join(os.tmpdir(),'layout-test-'));const report=path.join(d,'report.json');
 try{process.env.HTML_ROOT=fixtures;await main([path.join(fixtures,name),path.join(d,'out'),'--test','0.5','--layout',report,...extra]);
  const r=JSON.parse(fs.readFileSync(report));return {issues:r.frames[0].issues,marked:fs.existsSync(path.join(d,'out','issues_0.50.jpg'))};}
 finally{fs.rmSync(d,{recursive:true,force:true});delete process.env.HTML_ROOT;}}
test('flags the reported bad frame: badges across cards, text off frame',{skip:!canRun},async()=>{
 const {issues,marked}=await run('bad.html');const errors=issues.filter(i=>i.severity==='error');
 assert.ok(marked);const types=new Set(errors.map(i=>i.type));assert.ok(types.has('text_off_frame'));assert.ok(types.has('escapes_container'));
 for(const label of ['No equivalent, no practical workaround','Parameter action · Redesign','Custom extension · Blocker','Works as cross-filtering'])
  assert.ok(errors.some(i=>i.text.includes(label)),label);});
test('a clean frame with masks, contained badges and off-stage text has no findings',{skip:!canRun},async()=>{
 const {issues,marked}=await run('good.html');assert.deepEqual(issues,[]);assert.ok(!marked);});
test('text covered by a layer on top and text over text are errors',{skip:!canRun},async()=>{
 const {issues}=await run('covered.html');const types=new Set(issues.filter(i=>i.severity==='error').map(i=>i.type));
 assert.ok(types.has('text_covered'));assert.ok(types.has('text_overlap'));});
test('9:16 safe zone applies to text',{skip:!canRun},async()=>{
 const {issues}=await run('good.html',['--safe','240,200,380,60']);assert.ok(issues.some(i=>i.type==='text_outside_safe_zone'));});
