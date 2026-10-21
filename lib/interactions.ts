import { env } from "cloudflare:workers";
import { catalog } from "./catalog";
import { isUserId } from "./boardgame";
export async function readInteractions(userId:string|null) {
  if(!env.DB)throw new Error("DB unavailable");
  const uid=isUserId(userId)?userId:"";
  const rounds=await env.DB.prepare("SELECT id,title,is_active AS isActive,created_at AS createdAt,closed_at AS closedAt FROM voting_rounds ORDER BY created_at DESC,id DESC LIMIT 20").all<{id:string;title:string;isActive:number;createdAt:string;closedAt:string|null}>();
  const allRounds=rounds.results.map(r=>({...r,isActive:!!r.isActive}));
  const currentRound=allRounds.find(r=>r.isActive)||null;
  const [wants,scores,ballots]=await Promise.all([
    env.DB.prepare("SELECT game_id AS id,COUNT(*) AS count,MAX(CASE WHEN user_id=? THEN 1 ELSE 0 END) AS mine FROM votes GROUP BY game_id").bind(uid).all<{id:string;count:number;mine:number}>(),
    env.DB.prepare("SELECT game_id AS id,COUNT(*) AS count,AVG(score) AS average,MAX(CASE WHEN user_id=? THEN score ELSE 0 END) AS mine FROM ratings GROUP BY game_id").bind(uid).all<{id:string;count:number;average:number;mine:number}>(),
    env.DB.prepare("SELECT game_id AS id,COUNT(*) AS count,MAX(CASE WHEN user_id=? THEN 1 ELSE 0 END) AS mine FROM round_votes WHERE round_id=? GROUP BY game_id").bind(uid,currentRound?.id||"").all<{id:string;count:number;mine:number}>()
  ]);
  const wanted=new Map(wants.results.map(r=>[r.id,r])),rated=new Map(scores.results.map(r=>[r.id,r])),voted=new Map(ballots.results.map(r=>[r.id,r]));
  const games=catalog.map(g=>({id:g.id,wantCount:wanted.get(g.id)?.count||0,myWant:!!wanted.get(g.id)?.mine,voteCount:voted.get(g.id)?.count||0,myVote:!!voted.get(g.id)?.mine,ratingCount:rated.get(g.id)?.count||0,averageRating:rated.get(g.id)?.average||0,myRating:rated.get(g.id)?.mine||0}));
  const ids=catalog.map(g=>g.id);
  const people=currentRound&&ids.length?await env.DB.prepare("SELECT COUNT(DISTINCT user_id) AS count FROM round_votes WHERE round_id=? AND game_id IN ("+ids.map(()=>"?").join(",")+")").bind(currentRound.id,...ids).first<{count:number}>():null;
  return {games,currentRound,participantCount:people?.count||0,roundHistory:allRounds.filter(r=>!r.isActive)};
}
