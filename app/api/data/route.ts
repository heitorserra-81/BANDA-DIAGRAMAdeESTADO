import { admin,db,readAll,defaults,owner } from '../../../lib/band';
import { getChatGPTUser } from '../../chatgpt-auth';
import { normalizeSettlement,cents } from '../../../lib/settlement';
const reply=(error:string,status=400)=>Response.json({error},{status});
export async function GET(req:Request){try{const internal=new URL(req.url).searchParams.has('internal');if(internal&&!await admin())return reply('Acesso reservado à banda.',403);const all=await readAll();const config={...defaults,...all.find(x=>x.id==='config')};if(!internal){delete config.members;delete config.lineup;delete config.defaultShares;delete config.defaultSplit;}const items=internal?all:all.filter(x=>['show','photo','video','track'].includes(x.kind)&&x.published!==false&&config[({show:'agenda',photo:'photos',video:'videos',track:'music'} as any)[x.kind]]);return Response.json({items:items.filter(x=>x.id!=='config'),config,currentEmail:internal?(await getChatGPTUser())?.email:undefined,canManageMembers:internal&&await owner()},{headers:{'Cache-Control':'no-store'}});}catch(e){console.error(e);return reply('Não foi possível carregar os dados. Tente novamente.',503);}}
export async function POST(req:Request){try{
 if(new URL(req.url).origin!==req.headers.get('origin'))return reply('Origem inválida',403);
 if(!await admin())return reply('Acesso reservado à banda.',403);
 const body:any=await req.json();if(JSON.stringify(body).length>50000)return reply('Conteúdo muito longo');
 const {id,kind,...payload}=body;
 if(!['show','photo','video','transaction','song','rehearsal','config','settlement','track','showplan','presence'].includes(kind)||typeof id!=='string'||!id||id.length>100||(id==='config')!==(kind==='config'))return reply('Dados inválidos');
 const old=await db().prepare('SELECT kind,data FROM records WHERE id = ?').bind(id).first<{kind:string,data:string}>();if(old&&old.kind!==kind)return reply('Tipo de registro inválido');
 let data:any=payload;

 if(['showplan','presence'].includes(kind)){
  const show=await db().prepare("SELECT id FROM records WHERE id=? AND kind='show'").bind(String(payload.showId||'')).first();if(!show)return reply('Cadastre o show antes de abrir a ficha.');
  if(kind==='presence'){
   const u=(await getChatGPTUser())!;const row=await db().prepare("SELECT data FROM records WHERE id='config'").first<{data:string}>();const lineup=row?JSON.parse(row.data).lineup||[]:[];const member=lineup.find((m:any)=>m.email&&m.email.toLowerCase()===u.email.toLowerCase());
   if(!member||id!==`presence:${payload.showId}:${member.id}`||!['yes','no'].includes(payload.status))return reply('Confirme apenas a sua própria presença.',403);
   data={showId:payload.showId,memberId:member.id,status:payload.status,at:new Date().toISOString()};
  }else{
   if(id!=='plan:'+payload.showId)return reply('Ficha inválida.');
   const prev=old?JSON.parse(old.data):null;if((payload.revision||0)!==(prev?.revision||0))return reply('A ficha foi alterada por outro integrante. Feche e abra novamente para carregar a versão atual.',409);
   const equipment=payload.equipment||[];if(!Array.isArray(equipment)||equipment.length>100||equipment.some((x:any)=>!x||typeof x.id!=='string'||!String(x.title||'').trim()))return reply('Confira os itens do checklist (máximo de 100).');
   data={showId:payload.showId,revision:(prev?.revision||0)+1,address:String(payload.address||'').slice(0,500),arrival:String(payload.arrival||'').slice(0,5),soundcheck:String(payload.soundcheck||'').slice(0,5),client:String(payload.client||'').slice(0,160),phone:String(payload.phone||'').slice(0,80),notes:String(payload.notes||'').slice(0,3000),setlist:String(payload.setlist||'').slice(0,10000),equipment:equipment.map((x:any)=>({id:x.id.slice(0,100),title:String(x.title).slice(0,120),memberId:String(x.memberId||'').slice(0,30),done:!!x.done}))};
   if(old){const result=await db().prepare('UPDATE records SET data=? WHERE id=? AND data=?').bind(JSON.stringify(data),id,old.data).run();if(!result.meta.changes)return reply('A ficha mudou. Feche e reabra antes de salvar.',409);}else{const result=await db().prepare('INSERT OR IGNORE INTO records(id,kind,data) VALUES(?,?,?)').bind(id,kind,JSON.stringify(data)).run();if(!result.meta.changes)return reply('Uma ficha já foi criada. Feche e reabra.',409);}
   return Response.json({ok:true,revision:data.revision});
  }
 }
 if(kind==='config'){
  const prev=old?JSON.parse(old.data):{};
  if(!await owner()){delete data.members;delete data.lineup;}
  data={...prev,...data};
  if(data.lineup){if(!Array.isArray(data.lineup)||data.lineup.length!==4||data.lineup.some((x:any,i:number)=>x.id!==`member-${i+1}`||!String(x.name||'').trim()||(x.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x.email))))return reply('Confira os nomes e e-mails dos quatro integrantes.');}
  if(data.defaultSplit==='percent'){const values=(data.defaultShares||[]).map((x:any)=>cents(x,'Porcentagem'));if(values.length!==4||values.some((x:number)=>x>10000)||values.reduce((s:number,x:number)=>s+x,0)!==10000)return reply('A divisão padrão precisa somar 100%.');}
 }
 if(kind==='transaction'){cents(data.amount);if(!['income','expense'].includes(data.type))return reply('Tipo inválido');}
 if(kind==='track'&&(!String(data.title||'').trim()||!String(data.url||'').startsWith('/api/media/')))return reply('Informe o título e envie um arquivo de áudio.');
 if(kind==='settlement'){
  const prev=old?JSON.parse(old.data):null;if(prev&&payload.revision!==prev.revision)return reply('Outra pessoa alterou este contrato. Atualize a lista antes de editar novamente.',409);
  data=normalizeSettlement(payload);if(data.members.some((m:any)=>!/^member-[1-4]$/.test(m.memberId)))return reply('Integrante inválido');
  const user=await getChatGPTUser();const stamp=new Date().toISOString();
  data={...data,revision:(prev?.revision||0)+1,updatedAt:stamp,history:[...(prev?.history||[]).slice(-19),{at:stamp,by:user?.displayName||'Integrante',action:prev?'Atualizado':'Criado',grossCents:data.grossCents,netCents:data.netCents,shares:data.shares,receivedCents:data.receivedCents}]};
  if(old){const result=await db().prepare('UPDATE records SET data = ? WHERE id = ? AND data = ?').bind(JSON.stringify(data),id,old.data).run();if(!result.meta.changes)return reply('O contrato foi alterado por outra pessoa. Atualize e tente novamente.',409);}else{await db().prepare('INSERT INTO records (id,kind,data) VALUES (?,?,?)').bind(id,kind,JSON.stringify(data)).run();}
 }else await db().prepare('INSERT INTO records (id,kind,data) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').bind(id,kind,JSON.stringify(data)).run();
 return Response.json({ok:true});
 }catch(e){console.error(e);return reply(e instanceof Error?e.message:'Não foi possível salvar. Seus dados permanecem no formulário.',400);}}
export async function DELETE(req:Request){try{if(new URL(req.url).origin!==req.headers.get('origin')||!await admin())return reply('Sem permissão',403);const id=new URL(req.url).searchParams.get('id');if(!id||id==='config')return reply('Registro inválido');const old=await db().prepare('SELECT kind,data FROM records WHERE id = ?').bind(id).first<{kind:string,data:string}>();if(old?.kind==='private-auth'||old?.kind==='presence')return reply('Registro protegido.',403);if(old?.kind==='settlement')return reply('Contratos ficam no histórico. Edite o registro para corrigir os valores.');await db().prepare('DELETE FROM records WHERE id = ?').bind(id).run();return Response.json({ok:true});}catch{return reply('Não foi possível excluir.',500);}}
