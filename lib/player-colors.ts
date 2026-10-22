import { env } from 'cloudflare:workers';

// Fixed colors are allocated atomically and retained across voting rounds.
const palette = ['#ef6048','#3378d4','#259b75','#9460c8','#d59a16','#df6397',
  '#2199b5','#d8752b','#6871c1','#6d9b32','#b14f64','#417e81',
  '#ba6fbb','#94723b','#3862a0','#a34e30','#56844a','#815bc0'];

export async function playerColor(userId:string):Promise<string> {
  const db=env.DB;
  if(!db)throw new Error('DB unavailable');
  const existing=await db.prepare('SELECT color FROM player_colors WHERE user_id=?').bind(userId).first<{color:string}>();
  if(existing)return existing.color;
  for(let attempt=0;attempt<64;attempt++) {
    const color=palette[attempt] || `hsl(${(parseInt(userId.slice(0,8),16)+attempt*137.508)%360} 58% 46%)`;
    await db.prepare('INSERT OR IGNORE INTO player_colors (user_id,color) VALUES (?,?)').bind(userId,color).run();
    const saved=await db.prepare('SELECT color FROM player_colors WHERE user_id=?').bind(userId).first<{color:string}>();
    if(saved)return saved.color;
  }
  throw new Error('Unable to allocate player color');
}
