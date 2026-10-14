import {env} from 'cloudflare:workers';
import {memberAuthorized,owner} from '../../../lib/band';
import {getChatGPTUser} from '../../chatgpt-auth';
import {accessSettings,passwordHash,sessionCookie,unlocked} from '../../../lib/band-access';
const reply=(error:string,status:number)=>Response.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function POST(req:Request){try{
 if(req.headers.get('origin')!==new URL(req.url).origin||!await memberAuthorized())return reply('Acesso reservado aos e-mails autorizados.',403);
 const body:any=await req.json();if(body.action==='lock')return Response.json({ok:true},{headers:{'Set-Cookie':'band_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0','Cache-Control':'no-store'}});
 const u=(await getChatGPTUser())!;const id='attempt:'+u.userId;const now=Date.now();
 await env.DB!.prepare("INSERT INTO records(id,kind,data) VALUES(?,'private-auth',?) ON CONFLICT(id) DO UPDATE SET data=CASE WHEN json_extract(data,'$.until') < ? THEN excluded.data ELSE json_set(data,'$.count',json_extract(data,'$.count')+1) END").bind(id,JSON.stringify({count:1,until:now+15*60000}),now).run();
 const attempts=JSON.parse((await env.DB!.prepare('SELECT data FROM records WHERE id=?').bind(id).first<{data:string}>())!.data);if(attempts.count>5)return reply('Muitas tentativas. Tente novamente em 15 minutos.',429);
 const s=await accessSettings();if(typeof body.password!=='string'||body.password.length>128||await passwordHash(body.password,s.salt)!==s.hash)return reply('Senha incorreta.',403);
 if(body.action==='change'){
 if(!await owner()||!await unlocked())return reply('Somente o administrador pode trocar a senha.',403);
 if(typeof body.newPassword!=='string'||body.newPassword.length<4||body.newPassword.length>128)return reply('Use uma senha de 4 a 128 caracteres.',400);
 const salt=crypto.randomUUID();const changed=await env.DB!.prepare("UPDATE records SET data=? WHERE id='band-access' AND data=?").bind(JSON.stringify({...s,salt,hash:await passwordHash(body.newPassword,salt),version:s.version+1}),JSON.stringify(s)).run();if(!changed.meta.changes)return reply('A senha mudou em outro aparelho. Tente novamente.',409);
 }
 await env.DB!.prepare('DELETE FROM records WHERE id=?').bind(id).run();return Response.json({ok:true},{headers:{'Set-Cookie':await sessionCookie(),'Cache-Control':'no-store'}});
 }catch{return reply('Não foi possível validar o acesso. Tente novamente.',503);}}
