import assert from 'node:assert/strict';
import {calculate,normalizeSettlement,initialMembers} from '../lib/settlement.ts';
const members=(perc=[25,25,25,25])=>initialMembers.map((m,i)=>({memberId:m.id,name:m.name,percent:perc[i],paid:0}));
const equal=calculate('3000',[{title:'Som',amount:'600'}],'equal',members());assert.equal(equal.netCents,240000);assert.deepEqual(equal.shares.map(x=>x.amountCents),[60000,60000,60000,60000]);
const custom=calculate('3000',[{title:'Som',amount:'600'}],'percent',members([40,30,20,10]));assert.deepEqual(custom.shares.map(x=>x.amountCents),[96000,72000,48000,24000]);
const tiny=calculate('0.03',[],'equal',members());assert.deepEqual(tiny.shares.map(x=>x.amountCents),[1,1,1,0]);
for(let n=1;n<300;n++){const r=calculate((n/100).toFixed(2),[],'percent',members([33.33,33.33,33.33,.01]));assert.equal(r.shares.reduce((s,x)=>s+x.amountCents,0),n);}
assert.throws(()=>calculate(100,[],'percent',members([40,30,20,20])),/100%/);assert.throws(()=>calculate(100,[{title:'',amount:101}],'equal',members()),/superam/);assert.throws(()=>calculate(-1,[],'equal',members()));assert.throws(()=>calculate(1.001,[],'equal',members()));
const paid=members();paid[0].paid=26;assert.throws(()=>calculate(100,[],'equal',paid),/ultrapassar/);
const input={title:'Show',date:'2026-10-01',gross:100,received:50,mode:'equal',members:members(),expenses:[]};const record=normalizeSettlement(input);input.members[0].name='Novo nome';assert.equal(record.shares[0].name,'Integrante 1');assert.throws(()=>normalizeSettlement({...input,received:101}),/supera/);
console.log('Divisão igual, percentuais, centavos, despesas, pagamentos e preservação do histórico: OK');
