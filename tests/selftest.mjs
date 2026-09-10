// Regression self-test for RateRight. Extracts the app's real <script>, evaluates it
// against a minimal browser stub, and asserts computeRate().
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf8');

function el(){ return {value:'',textContent:'',style:{},addEventListener(){},setAttribute(){},getAttribute(){return null;},querySelectorAll(){return[];},onclick:null}; }
const ids={};
globalThis.document={getElementById:id=>ids[id]||(ids[id]=el()),querySelectorAll:()=>[],documentElement:el()};
globalThis.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
globalThis.window={matchMedia:()=>({matches:false})};
globalThis.matchMedia=globalThis.window.matchMedia;

const js=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).sort((a,b)=>b.length-a.length)[0];
eval(js+`\n;globalThis.__t={computeRate};`);
const t=globalThis.__t;

let n=0; const check=(name,fn)=>{fn();n++;console.log('  ok -',name);};
const base={target:90000,expenses:12000,tax:25,weeks:46,hours:40,billable:60};

check('computeRate: revenue, hourly, day, week',()=>{
  const r=t.computeRate(base);
  // grossUp = 90000/0.75 = 120000; revenue = 132000; billable hrs = 46*40*0.6 = 1104
  assert.ok(Math.abs(r.grossUp-120000)<0.01);
  assert.ok(Math.abs(r.revenueNeeded-132000)<0.01);
  assert.ok(Math.abs(r.billableHours-1104)<0.001);
  assert.ok(Math.abs(r.hourly-119.565)<0.01,'hourly '+r.hourly);
  assert.ok(Math.abs(r.day-r.hourly*8)<0.001);
  assert.ok(Math.abs(r.week-r.hourly*40)<0.001);
  assert.ok(Math.abs(r.taxPortion-30000)<0.01); // 120000 - 90000
});
check('computeRate: edges (no billable hours, tax≥100%)',()=>{
  assert.equal(t.computeRate({...base,billable:0}).hourly,Infinity);
  assert.equal(t.computeRate({...base,tax:100}).grossUp,Infinity);
});
check('computeRate: higher utilization lowers the required rate',()=>{
  assert.ok(t.computeRate({...base,billable:80}).hourly < t.computeRate(base).hourly);
});

console.log(`\n${n} checks passed.`);
