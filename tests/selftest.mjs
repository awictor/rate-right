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
globalThis.location={hash:'',origin:'',pathname:''};
globalThis.window={matchMedia:()=>({matches:false}),location:globalThis.location};
globalThis.matchMedia=globalThis.window.matchMedia;
try{Object.defineProperty(globalThis,'navigator',{value:{clipboard:{writeText:()=>Promise.resolve()}},configurable:true});}catch{}

const js=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).sort((a,b)=>b.length-a.length)[0];
eval(js+`\n;globalThis.__t={computeRate,projectQuote,salaryEquivalent,encodeInputs,decodeInputs,summaryText,minViableRate,billableSensitivity};`);
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

check('projectQuote: hours × rate + contingency',()=>{
  const q=t.projectQuote(base,40,15); // hourly 119.565; base 4782.6; quote ×1.15
  assert.ok(Math.abs(q.base-40*q.hourly)<0.001);
  assert.ok(Math.abs(q.quote-q.base*1.15)<0.001);
  assert.ok(Math.abs(q.quote-5499.98)<0.5,'quote '+q.quote);
});

check('salaryEquivalent: W2 salary, salaried hourly, premium',()=>{
  const se=t.salaryEquivalent(base); // grossUp 120000 -> salaried hourly 57.69; hourly 119.57 -> ~2.07x
  assert.ok(Math.abs(se.salary-120000)<0.01);
  assert.ok(Math.abs(se.salariedHourly-57.692)<0.01,'sh '+se.salariedHourly);
  assert.ok(Math.abs(se.premiumX-2.072)<0.02,'prem '+se.premiumX);
});

check('share codec: round-trips inputs, rejects garbage',()=>{
  assert.deepEqual(t.decodeInputs(t.encodeInputs(base)),base);
  assert.equal(t.decodeInputs('!!!bad'),null);
});

check('summaryText: multiline with rate + salary lines',()=>{
  const txt=t.summaryText(base);
  assert.ok(txt.split('\n').length>=5);
  assert.match(txt,/\/hr/);
  assert.match(txt,/Equivalent W2 salary/);
});

check('minViableRate: expenses / billable hours',()=>{
  // 12000 / 1104 = 10.87
  assert.ok(Math.abs(t.minViableRate(base)-10.8696)<0.01,'floor '+t.minViableRate(base));
  assert.equal(t.minViableRate({...base,billable:0}),Infinity);
});

check('billableSensitivity: higher utilization lowers required rate',()=>{
  const rows=t.billableSensitivity(base,[40,60,80]);
  assert.equal(rows.length,3);
  assert.ok(rows[0].hourly>rows[1].hourly && rows[1].hourly>rows[2].hourly);
  assert.ok(Math.abs(rows[1].hourly-t.computeRate(base).hourly)<0.001); // 60% == base
});

console.log(`\n${n} checks passed.`);
