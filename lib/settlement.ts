export type Member = {id:string;name:string;email:string;instrument:string};
export const initialMembers:Member[]=Array.from({length:4},(_,i)=>({id:`member-${i+1}`,name:`Integrante ${i+1}`,email:'',instrument:''}));
export type Share={memberId:string;name:string;percent:number;amountCents:number;paidCents:number};
export function cents(value:unknown,label='Valor'):number{const raw=String(value??'').trim().replace(',','.');if(!/^\d+(\.\d{1,2})?$/.test(raw))throw Error(`${label}: use um valor positivo com até duas casas decimais.`);const n=Math.round(Number(raw)*100);if(!Number.isSafeInteger(n)||n>100000000000)throw Error(`${label} excede o limite.`);return n;}
export function calculate(gross:unknown,expenses:{title:string;amount:unknown}[],mode:string,members:{memberId:string;name:string;percent:unknown;paid:unknown}[]){
 const grossCents=cents(gross,'Cachê');if(!Array.isArray(expenses)||expenses.length>100)throw Error('Limite de 100 despesas por contrato.');
 const costs=expenses.map(x=>({title:String(x.title||'Despesa').slice(0,160),amountCents:cents(x.amount,'Despesa')}));
 const expenseCents=costs.reduce((sum,x)=>sum+x.amountCents,0);if(expenseCents>grossCents)throw Error('As despesas superam o cachê. Ajuste os valores antes de dividir.');
 if(!['equal','percent'].includes(mode))throw Error('Escolha o tipo de divisão.');
 if(members.length!==4||new Set(members.map(x=>x.memberId)).size!==4)throw Error('Informe os quatro integrantes, sem repetir.');
 const bps=members.map(x=>mode==='equal'?2500:cents(x.percent,'Porcentagem'));if(bps.some(x=>x>10000)||bps.reduce((s,x)=>s+x,0)!==10000)throw Error('As porcentagens precisam somar exatamente 100%.');
 const netCents=grossCents-expenseCents;
 const shares:Share[]=members.map((m,i)=>({memberId:m.memberId,name:String(m.name||'Integrante').trim().slice(0,80),percent:bps[i]/100,amountCents:Math.floor(netCents*bps[i]/10000),paidCents:cents(m.paid||0,'Repasse pago')}));
 let remaining=netCents-shares.reduce((s,x)=>s+x.amountCents,0);
 const order=members.map((_,i)=>({i,r:(netCents*bps[i])%10000})).sort((a,b)=>b.r-a.r||a.i-b.i);
 for(let i=0;i<remaining;i++)shares[order[i].i].amountCents++;
 if(shares.some(x=>x.paidCents>x.amountCents))throw Error('Um repasse pago não pode ultrapassar a parte do integrante.');
 return {grossCents,expenseCents,netCents,costs,shares,paidCents:shares.reduce((s,x)=>s+x.paidCents,0)};
}
export function normalizeSettlement(data:any){
 if(!String(data.title||'').trim())throw Error('Informe o nome do contrato ou show.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(data.date||''))throw Error('Informe a data do contrato.');
 const calc=calculate(data.gross,data.expenses||[],data.mode,data.members||[]);
 const receivedCents=cents(data.received||0,'Valor recebido');if(receivedCents>calc.grossCents)throw Error('O valor recebido supera o contrato.');
 return {title:String(data.title).trim().slice(0,160),date:data.date,showId:String(data.showId||'').slice(0,100),client:String(data.client||'').slice(0,160),notes:String(data.notes||'').slice(0,3000),mode:data.mode,gross:calc.grossCents/100,received:receivedCents/100,receivedCents,expenses:calc.costs.map(x=>({title:x.title,amount:x.amountCents/100})),members:calc.shares.map(x=>({memberId:x.memberId,name:x.name,percent:x.percent,paid:x.paidCents/100})),...calc};
}
