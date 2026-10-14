import { env } from 'cloudflare:workers';
import {unlocked} from './band-access';
import { initialMembers } from './settlement';
import { getChatGPTUser } from '../app/chatgpt-auth';
export function db(){if(!env.DB)throw new Error('Banco indisponível');return env.DB;}
export async function owner(){return (await getChatGPTUser())?.email.toLowerCase()==='heitorserra@gmail.com';}
export async function memberAuthorized(){const u=await getChatGPTUser();if(!u)return false;if(u.email.toLowerCase()==='heitorserra@gmail.com')return true;const row=await db().prepare("SELECT data FROM records WHERE id = ?").bind('config').first<{data:string}>();const c=row?JSON.parse(row.data):{};return [...(c.members||'').toLowerCase().split(/[\s,;]+/),...(c.lineup||[]).map((m:any)=>String(m.email||'').toLowerCase())].includes(u.email.toLowerCase());}
export async function admin(){return await memberAuthorized() && await unlocked();}
export const defaults={showTools:true,music:true,settlements:true,rehearsals:true,lineup:initialMembers,defaultSplit:'equal',defaultShares:[25,25,25,25],agenda:true,photos:true,videos:true,contact:true,finance:true,repertoire:true,youtube:true,external:true,whatsapp:'',email:'',instagram:'',price:'Sob consulta',bio:'Quatro integrantes, diferentes influências e a mesma paixão pela música. Conheça a Diagrama de Estado.',members:'',logo:'/banda.jpeg',photo:'/banda.jpeg'};
export async function readAll(){const r=await db().prepare("SELECT id, kind, data FROM records WHERE kind != 'private-auth'").all<{id:string,kind:string,data:string}>();return r.results.map(x=>({id:x.id,kind:x.kind,...JSON.parse(x.data)}));}
