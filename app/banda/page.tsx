import BandApp from '../ui';
import { requireChatGPTUser } from '../chatgpt-auth';
import BandLock from '../band-lock';
import {unlocked} from '../../lib/band-access';
import { memberAuthorized } from '../../lib/band';
export const dynamic='force-dynamic';
export default async function Banda(){await requireChatGPTUser('/banda');if(!await memberAuthorized())return <main className="denied"><h1>Área da banda</h1><p>Seu e-mail ainda não está autorizado. Peça ao administrador para incluí-lo nas configurações.</p><a href="/">Voltar ao site</a></main>;if(!await unlocked())return <main className="access-page"><BandLock/></main>;return <BandApp internal/>}
