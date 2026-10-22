"use client";

import { cleanNickname, isUserId } from "../lib/boardgame";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";

type Game = { id:string; title:string; category:string; players:string; minutes:number; durationLabel?:string; complexity:string; description:string; symbol:string; accent:string; coverUrl:string; coverMobileUrl?:string; coverDesktopUrl?:string; featured:boolean; recommendationOrder?:number; createdAt:string; isNew:boolean; wantCount:number; myWant:boolean; voteCount:number; myVote:boolean; voterColors?:string[]; ratingCount:number; averageRating:number; myRating:number; myComment:string };
type Round = { id:string; title:string; isActive:boolean; createdAt:string; closedAt:string|null };
type Identity = { userId:string; nickname:string };
type Metric = Pick<Game,"id"|"wantCount"|"myWant"|"voteCount"|"myVote"|"voterColors"|"ratingCount"|"averageRating"|"myRating"|"myComment">;
type CatalogEntry = Omit<Game,keyof Omit<Metric,"id">>;
type CatalogData = { games:Metric[]; currentRound:Round|null; participantCount:number; playerColor?:string|null; roundHistory:Round[] };
type Modal = "nickname"|"admin"|"round"|"rating"|null;
type Page = "home"|"library";
type Scope = "推荐"|"全部"|"人气"|"上新";
declare global { interface Window { __MEEPLE_CONFIG__?: { apiBase:string; assetBase:string } } }
function apiBase() { return typeof window === "undefined" ? "" : (window.__MEEPLE_CONFIG__?.apiBase || "").replace(/\/$/,""); }
function asset(path:string) { if (/^https?:/.test(path)) return path; if(path.startsWith("/api/"))return apiBase()+path; return (typeof window === "undefined" ? "" : window.__MEEPLE_CONFIG__?.assetBase || "")+path; }
async function request<T>(path:string, init?:RequestInit):Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(()=>controller.abort(),15000);
  const headers = new Headers(init?.headers);
  if(init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type","application/json");
  let response:Response;
  try {
    response = await fetch(apiBase()+path,{...init,headers,signal:controller.signal});
  } catch(error) {
    if(error instanceof Error && error.name === "AbortError") throw new Error("连接数据服务超时，请稍后重试。");
    throw new Error(typeof navigator!=="undefined" && !navigator.onLine ? "当前网络已断开，请联网后重试。" : "暂时无法连接数据服务。请尝试更换网络，或使用系统浏览器打开后重试。");
  } finally { clearTimeout(timeout); }
  if(!response.headers.get("content-type")?.includes("application/json")) throw new Error("数据服务暂时不可访问，请稍后重试。你的操作尚未保存。");
  const data = await response.json().catch(()=>({error:"服务返回异常，请稍后重试。"})) as {error?:string};
  if(!response.ok)throw new Error(data.error || "保存失败，请重试。");
  return data as T;
}
function Meeple({className="",color}:{className?:string;color?:string}) { return <svg className={className} style={color?{color}:undefined} viewBox="0 0 40 44" fill="currentColor" aria-hidden="true"><path d="M14 12C9 4 15 0 20 0s11 4 6 12l11 7c4 3 2 8-3 8h-6l7 13c1 3-2 4-5 4H10c-3 0-6-1-5-4l7-13H6c-5 0-7-5-3-8z"/></svg>; }
function Heart({filled=false}:{filled?:boolean}) { return <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.4 4.6a5.6 5.6 0 0 0-8.4.6 5.6 5.6 0 0 0-8.4-.6c-2.2 2.2-2 5.7.2 8L12 21l8.2-8.4c2.2-2.3 2.4-5.8.2-8z"/></svg>; }
function Stars({value,onChange,label,disabled=false}:{value:number;onChange?:(n:number)=>void;label:string;disabled?:boolean}) {
  const [preview,setPreview]=useState<number|null>(null);
  const dragging=useRef(false);
  useEffect(()=>setPreview(null),[value,disabled]);
  const shown=preview??value;
  const fromPointer=(e:React.PointerEvent<HTMLInputElement>)=>{const box=e.currentTarget.getBoundingClientRect();return Math.min(5,Math.max(.5,Math.ceil((e.clientX-box.left)/box.width*10)/2));};
  return <div className={"stars "+(onChange?"stars-picker":"")} aria-label={onChange?undefined:label} role={onChange?undefined:"img"}>
    {[1,2,3,4,5].map(n=><span key={n} className="star star-fill" aria-hidden="true">★<span style={{width:Math.max(0,Math.min(1,shown-n+1))*100+"%"}}>★</span></span>)}
    {onChange&&<input className="star-slider" type="range" min="0.5" max="5" step="0.5" value={preview??Math.max(.5,value)} aria-label={label} aria-valuetext={shown?shown+" 星":"尚未评分"} disabled={disabled}
      onPointerDown={e=>{if(disabled)return;e.preventDefault();dragging.current=true;e.currentTarget.setPointerCapture(e.pointerId);setPreview(fromPointer(e));}}
      onPointerMove={e=>{if(dragging.current)setPreview(fromPointer(e));}}
      onPointerUp={e=>{if(!dragging.current)return;dragging.current=false;const score=fromPointer(e);setPreview(score);onChange(score);}}
      onPointerCancel={()=>{dragging.current=false;setPreview(null);}}
      onChange={e=>setPreview(Number(e.currentTarget.value))}
      onKeyUp={e=>{if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(e.key)){onChange(Number(e.currentTarget.value));}}}
      onBlur={()=>setPreview(null)}/>}
  </div>;
}
function Cover({game,small=false}:{game:Game;small?:boolean}) { const [failed,setFailed]=useState(false); useEffect(()=>setFailed(false),[game.coverUrl]); return <div className={"cover-art art-"+game.id+(small?" small-cover":"")+(game.coverUrl&&!failed?" has-cover":"")}>
  <span className="cover-symbol" aria-hidden="true">{game.symbol}</span>{game.coverUrl&&!failed&&<picture>{game.coverMobileUrl&&<source media="(max-width: 760px)" srcSet={asset(game.coverMobileUrl)}/>}<img src={asset((small?game.coverMobileUrl:game.coverDesktopUrl)||game.coverUrl)} alt={game.title+"封面"} loading="lazy" decoding="async" onError={()=>setFailed(true)}/></picture>}{!small&&<span className="cover-category">{game.category.split(" · ")[0]}</span>}{game.isNew&&!small&&<span className="new-tag">NEW</span>}</div>; }
function BoardCard({game,onWant,onVote,onRate,hasRound,busy}:{game:Game;onWant:(g:Game)=>void;onVote:(g:Game)=>void;onRate:(g:Game,n:number)=>void;hasRound:boolean;busy:boolean}) { return <article className={"game-card accent-"+game.accent+(game.myVote?" is-voted":"")}>
  <Cover game={game}/><div className="card-content"><div className="card-title-row"><div><p className="eyebrow">{game.category}</p><h3>{game.title}</h3>{game.ratingCount>0&&<div className="rating-row title-rating"><Stars value={game.averageRating} label={"平均评分 "+game.averageRating.toFixed(1)}/><span className="rating-copy">{game.averageRating.toFixed(1)+" · "+game.ratingCount+" 人"}</span></div>}</div><span className="vote-count" title="想玩人数"><Heart filled={game.myWant}/>{game.wantCount}</span></div>
  <p className="game-description">{game.description||"挑一款好游戏，和朋友一起开局。"}</p><div className="game-facts"><span>♙ {game.players} 人</span><span>◷ {game.durationLabel || `${game.minutes} 分钟`}</span><span className={"weight weight-"+game.complexity}>{game.complexity}</span></div>
  
  <div className="rate-picker"><span>{game.myRating?"我的评分":"玩过这款？"}</span><button type="button" className="open-rating" disabled={busy} onClick={()=>onRate(game,game.myRating)}>{game.myRating?<><span className="personal-score">★ {game.myRating.toFixed(1)}</span></>:"去评分 ☆"}</button></div>
  <div className="card-actions"><button type="button" className={"want-button "+(game.myWant?"wanted":"")} aria-pressed={game.myWant} aria-label={(game.myWant?"取消想玩":"想玩")+game.title} onClick={()=>onWant(game)} disabled={busy}><Heart filled={game.myWant}/><span>{game.myWant?"已想玩":"想玩"}</span></button><button type="button" className={"vote-button "+(game.myVote?"voted":"")} aria-pressed={game.myVote} aria-label={(game.myVote?"取消本轮投票":"本轮投票给")+game.title} title={hasRound?"每款一票，可同时投多款":"等待管理员开启本轮投票"} disabled={busy||!hasRound} onClick={()=>onVote(game)}><Meeple/><span>{game.myVote?"已投票":"投票"}</span></button></div></div></article>; }
export default function Home() {
  const [page,setPage]=useState<Page>("home");
  useEffect(()=>{const sync=()=>{if(window.location.hash&&!window.location.hash.startsWith("#/"))return;const next=window.location.hash.startsWith("#/library")?"library":"home";setPage(next);setQuery("");setCategory("全部类型");setScope("人气");window.scrollTo(0,0);};sync();window.addEventListener("hashchange",sync);return()=>window.removeEventListener("hashchange",sync);},[]);
  useEffect(()=>{document.title=page==="library"?"桌游小馆 · 桌游库":"桌游小馆 · 今天玩什么？";},[page]);
  const [identity,setIdentity]=useState<Identity|null>(null),[nameDraft,setNameDraft]=useState("");
  const [playerColor,setPlayerColor]=useState("#ef6048");
  const [entries,setEntries]=useState<CatalogEntry[]>([]),[metrics,setMetrics]=useState<Metric[]>([]),[catalogError,setCatalogError]=useState(""),[interactionReady,setInteractionReady]=useState(false);
  const games=useMemo(()=>entries.map(g=>({...g,wantCount:0,myWant:false,voteCount:0,myVote:false,ratingCount:0,averageRating:0,myRating:0,myComment:"",...metrics.find(m=>m.id===g.id)})),[entries,metrics]);
  const [round,setRound]=useState<Round|null>(null),[history,setHistory]=useState<Round[]>([]),[participantCount,setParticipantCount]=useState(0);
  const [query,setQuery]=useState(""),[category,setCategory]=useState("全部类型"),[scope,setScope]=useState<Scope>("人气");
  const [modal,setModal]=useState<Modal>(null),[isAdmin,setIsAdmin]=useState(false),[adminKey,setAdminKey]=useState(""),[adminDraft,setAdminDraft]=useState("");
  const [roundTitle,setRoundTitle]=useState("");
  const [busyIds,setBusyIds]=useState<Set<string>>(new Set()),[formBusy,setFormBusy]=useState(false),[formError,setFormError]=useState(""),[notice,setNotice]=useState(""),[loading,setLoading]=useState(true),[loadError,setLoadError]=useState("");
  const pendingGames=useRef(new Set<string>()),ratingSubmit=useRef(false),hasLoaded=useRef(false);
  const [ratingGameId,setRatingGameId]=useState(""),[ratingDraft,setRatingDraft]=useState(0),[commentDraft,setCommentDraft]=useState(""),[ratingSaving,setRatingSaving]=useState(false),[ratingSaved,setRatingSaved]=useState(false);
  const ratingGame=games.find(g=>g.id===ratingGameId);
  const searchRef=useRef<HTMLInputElement>(null),sequence=useRef(0),dialogRef=useRef<HTMLElement>(null);
  const reloadCatalog=useCallback(async()=>{setLoading(true);try{const response=await fetch(asset("/catalog/games.json"));if(!response.ok)throw new Error("桌游目录加载失败，请重试。");const data=await response.json() as {games:CatalogEntry[]};if(!Array.isArray(data.games))throw new Error("桌游目录格式有误。");setEntries(data.games);setCatalogError("");}catch(e){setCatalogError(e instanceof Error?e.message:"桌游目录加载失败。");}finally{setLoading(false);}},[]);
  useEffect(()=>{void reloadCatalog();},[reloadCatalog]);
  const load=useCallback(async(userId:string)=>{const seq=++sequence.current;try{const data=await request<CatalogData>("/api/interactions?userId="+encodeURIComponent(userId));if(seq!==sequence.current)return false;setMetrics(data.games);setRound(data.currentRound);setHistory(data.roundHistory);setParticipantCount(data.participantCount);if(data.playerColor)setPlayerColor(data.playerColor);hasLoaded.current=true;setInteractionReady(true);setLoadError("");return true;}catch(e){if(seq===sequence.current){setLoadError(e instanceof Error?e.message:"互动数据加载失败。");setInteractionReady(hasLoaded.current);}return false;}},[]);
  useEffect(()=>{let saved:Identity|null=null;try{const p=JSON.parse(localStorage.getItem("warm-table-player")||"null");if(isUserId(p?.userId)&&cleanNickname(p?.nickname))saved={userId:p.userId,nickname:cleanNickname(p.nickname)};}catch{}const person=saved||{userId:crypto.randomUUID(),nickname:""};setIdentity(person);setNameDraft(person.nickname);if(!person.nickname)setModal("nickname");},[]);
  useEffect(()=>{if(!identity)return;void load(identity.userId);const timer=setInterval(()=>{if(!document.hidden&&!ratingSubmit.current)void load(identity.userId);},60000);const refresh=()=>{if(!document.hidden&&!ratingSubmit.current)void load(identity.userId);};window.addEventListener("focus",refresh);return()=>{clearInterval(timer);window.removeEventListener("focus",refresh);};},[identity,load]);
  useEffect(()=>{function keyboard(e:KeyboardEvent){if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();searchRef.current?.focus();}if(e.key==="Escape"&&modal&&!(modal==="nickname"&&!identity?.nickname)&&!formBusy&&!ratingSaving)setModal(null);if(e.key==="Tab"&&modal&&dialogRef.current){const nodes=Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select,textarea,a[href]'));const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}window.addEventListener("keydown",keyboard);return()=>window.removeEventListener("keydown",keyboard);},[modal,identity,formBusy,ratingSaving]);
  useEffect(()=>{setFormError("");document.body.style.overflow=modal?"hidden":"";return()=>{document.body.style.overflow="";};},[modal]);
  const categories=useMemo(()=>["全部类型",...Array.from(new Set(games.map(g=>g.category.split(" · ")[0])))],[games]);
  const visibleGames=useMemo(()=>{
    const q=page==="library"?query.trim().toLowerCase():"";
    let list=games.filter(g=>(!q||(g.title+g.category+g.description).toLowerCase().includes(q))&&(page!=="library"||category==="全部类型"||g.category.split(" · ")[0]===category));
    if(page==="home")list=list.filter(g=>scope==="上新"?g.isNew:g.featured);
    list.sort(page==="home"&&scope==="人气"?(a,b)=>(a.recommendationOrder??99)-(b.recommendationOrder??99):page==="home"&&scope==="上新"?(a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id):(a,b)=>b.wantCount-a.wantCount||b.averageRating-a.averageRating||a.title.localeCompare(b.title,"zh"));
    return list;
  },[games,query,category,scope,page]);
  const ranked=[...games].filter(g=>g.voteCount>0).sort((a,b)=>b.voteCount-a.voteCount||b.wantCount-a.wantCount||a.title.localeCompare(b.title,"zh"));
  const totalVotes=games.reduce((a,g)=>a+g.voteCount,0),myPicks=games.filter(g=>g.myVote);
  function openModal(next:Modal){setFormError("");setModal(next);}
  function saveName(e:FormEvent){
    e.preventDefault();if(!identity)return;
    const nickname=cleanNickname(nameDraft);
    if(!nickname){setFormError("请填写一个有效的昵称。");return;}
    const saved={userId:identity.userId,nickname};
    try{localStorage.setItem("warm-table-player",JSON.stringify(saved));}
    catch{setFormError("浏览器无法保存身份，请允许网站存储数据后重试。");return;}
    setIdentity(saved);setNameDraft(nickname);setFormError("");setModal(null);
  }
  async function toggle(game:Game,kind:"want"|"vote"){if(!identity)return;if(!interactionReady){setNotice("互动服务暂时不可用，请重试后再操作。");return;}if(!identity.nickname){openModal("nickname");return;}if(kind==="vote"&&!round){setNotice("请等待管理员开启新一轮投票。");return;}if(pendingGames.current.has(game.id))return;pendingGames.current.add(game.id);setBusyIds(new Set(pendingGames.current));try{await request("/api/games/"+game.id+"/"+kind,{method:"PUT",body:JSON.stringify({userId:identity.userId,active:kind==="want"?!game.myWant:!game.myVote,...(kind==="vote"?{roundId:round?.id}:{})})});if(!(await load(identity.userId))){setNotice("操作已保存，但最新汇总暂时无法刷新，请重试。");return;}setNotice(kind==="want"?(game.myWant?"已取消想玩":"已加入想玩清单"):(game.myVote?"已取消本轮投票":"已投给「"+game.title+"」"));}catch(e){setNotice(e instanceof Error?e.message:"保存失败，请重试。");}finally{pendingGames.current.delete(game.id);setBusyIds(new Set(pendingGames.current));}}
  function chooseRating(game:Game){if(!identity?.nickname){openModal("nickname");return;}setRatingGameId(game.id);setRatingDraft(game.myRating);setCommentDraft(game.myComment||"");setRatingSaved(false);openModal("rating");}
  async function saveRating(e:FormEvent){
    e.preventDefault();if(!identity||!ratingGame||ratingDraft<.5||ratingSubmit.current)return;
    ratingSubmit.current=true;sequence.current++;setRatingSaving(true);setFormError("");
    try{
      const result=await request<{ok:boolean;rating:Pick<Game,"id"|"ratingCount"|"averageRating"|"myRating"|"myComment">}>("/api/games/"+ratingGame.id+"/rating",{method:"PUT",body:JSON.stringify({userId:identity.userId,score:ratingDraft,comment:commentDraft})});
      setMetrics(previous=>{const found=previous.find(m=>m.id===ratingGame.id);return [...previous.filter(m=>m.id!==ratingGame.id),{wantCount:found?.wantCount||0,myWant:found?.myWant||false,voteCount:found?.voteCount||0,myVote:found?.myVote||false,...result.rating}];});
      setRatingSaved(true);
    }catch(error){setFormError(error instanceof Error?error.message:"评分未保存，请重试。");}
    finally{ratingSubmit.current=false;setRatingSaving(false);}
  }
  async function verify(e:FormEvent){e.preventDefault();setFormBusy(true);setFormError("");try{await request("/api/admin/verify",{method:"POST",body:JSON.stringify({key:adminDraft})});setAdminKey(adminDraft);setAdminDraft("");setIsAdmin(true);}catch(e){setFormError(e instanceof Error?e.message:"口令验证失败。");}finally{setFormBusy(false);}}
  function newRound(){setRoundTitle(new Intl.DateTimeFormat("zh-CN",{month:"long",day:"numeric",timeZone:"Asia/Shanghai"}).format(new Date())+" · 今天玩什么？");openModal("round");}
  async function startRound(e:FormEvent){e.preventDefault();setFormBusy(true);setFormError("");try{await request("/api/rounds",{method:"POST",headers:{"x-admin-key":adminKey},body:JSON.stringify({title:roundTitle})});if(identity)await load(identity.userId);setModal(null);setNotice("新一轮投票已开启，快来决定今天玩什么！");}catch(e){setFormError(e instanceof Error?e.message:"开启投票失败。");}finally{setFormBusy(false);}}

  const canClose=!(modal==="nickname"&&!identity?.nickname)&&!formBusy&&!ratingSaving;
  return <main className={"site-shell page-"+page}><header className="topbar"><a className="brand" href="#/home" aria-label="桌游小馆首页"><span className="brand-mark"><Meeple/></span><span><strong>桌游小馆</strong><small>GOOD GAMES. GREAT FRIENDS.</small></span></a><nav className="topnav" aria-label="主导航"><a href="#/home" aria-label="主页" className={page==="home"?"nav-active":""} aria-current={page==="home"?"page":undefined}><svg className="home-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/></svg><span className="home-nav-label">主页</span></a><a href="#/library" className={page==="library"?"nav-active":""} aria-current={page==="library"?"page":undefined}>桌游库</a></nav><div className="profile-actions"><button type="button" className="profile-pill" onClick={()=>{setNameDraft(identity?.nickname||"");openModal("nickname");}}><span className="avatar player-meeple" aria-label="我的米宝"><Meeple color={playerColor}/></span><span>{identity?.nickname||"设置昵称"}</span><span className="chevron">⌄</span></button><button type="button" className={"admin-link "+(isAdmin?"admin-active":"")} onClick={()=>openModal("admin")}>{isAdmin?"管理面板":"管理"}</button></div></header>
  {notice&&<div className="notice global-notice" role="status"><span>✦</span>{notice}<button type="button" onClick={()=>setNotice("")} aria-label="关闭提示">×</button></div>}
  {page==="home"&&<><section id="top" className="hero"><div className="hero-copy"><span className="overline"><span className="live-dot"/>好朋友，集合开桌！</span><h1>今天<em>玩什么？</em></h1><p>好游戏 · 好朋友 · 好时光</p><span className="hero-scribble" aria-hidden="true"/><a className="hero-cta" href="#/library">挑一款，再投上一票 <span>↗</span></a></div><div className="hero-art"><picture><source media="(max-width: 760px)" srcSet={asset("/party-hero-mobile.webp")} type="image/webp"/><img src={asset("/party-hero-rounded.png")} alt="卡通朋友围桌玩游戏，举起棋子庆祝" fetchPriority="high" decoding="async"/></picture></div><span className="hero-confetti confetti-a" aria-hidden="true"/><span className="hero-confetti confetti-b" aria-hidden="true"/></section>
  {totalVotes>0&&<>
  <section id="voting" className="voting-section"><div className="section-heading"><div><h2 className="decision-title"><span>就决定</span><em>是你了！</em><i aria-hidden="true">✦</i></h2><p className="section-subtitle">{round?participantCount+" 人参与 · "+totalVotes+" 票":"选好桌游，再一起决定今天的主角。"}</p></div>{isAdmin&&<button type="button" className="new-round-button" onClick={newRound}>＋ 新开投票</button>}</div>
  {myPicks.length>0&&<div className="vote-rule"><span className="my-pick" title={myPicks.map(g=>g.title).join("、")}>你已投了 {myPicks.length} 款</span></div>}
  {!round?<div className="vote-empty"><div className="empty-token-row"><Meeple/><Meeple/><Meeple/></div><h3>一桌好游戏，等开票！</h3><p>{isAdmin?"点击「新开投票」，让朋友们一起选。":"管理员开启投票后，点桌游卡片上的「投票」就能参加。"}</p>{isAdmin&&<button type="button" className="new-round-button" onClick={newRound}>开启第一轮投票</button>}</div>:ranked.length?<div className="ranking-list">{ranked.map((g,i)=><article className={"rank-row rank-"+i} key={g.id}><span className="rank-number">{String(i+1).padStart(2,"0")}</span><Cover game={g} small/><div className="rank-main"><h3>{g.title}</h3><div className="meeple-votes" aria-label={g.voteCount+" 人投票"}>{Array.from({length:Math.min(g.voteCount,16)},(_,n)=><Meeple key={n} color={g.voterColors?.[n]||"#ef6048"}/>)}{g.voteCount>16&&<span>＋{g.voteCount-16}</span>}</div></div><div className="rank-result"><strong>{g.voteCount}<small> 票</small></strong><button type="button" className={g.myVote?"picked":""} disabled={busyIds.has(g.id)||!interactionReady} aria-pressed={g.myVote} aria-label={(g.myVote?"取消排名投票":"排名投票给")+g.title} onClick={()=>void toggle(g,"vote")}>{g.myVote?"✓ 已投":"投这款"}</button></div></article>)}</div>:<div className="vote-empty"><div className="empty-token-row"><Meeple/><Meeple/><Meeple/></div><h3>第一票，由你决定</h3><p>到桌游库挑一款并投票，小人就会来到这里。</p><a className="see-all" href="#/library">去挑一款 →</a></div>}
  </section>
  </>}
  </>}
  <section id="catalog" className="catalog-section"><div className="catalog-heading"><div className="section-heading"><div><p className="overline">PICK A LITTLE HAPPINESS</p><h2>{page==="library"?"桌游库":scope==="人气"?"今日推荐":"找点新乐趣"}</h2><p className="section-subtitle">{page==="library"?"全部桌游都在这里，想玩、投票，也别忘了评分。":scope==="人气"?"今天的人气之选，一起找找想玩的那款。":"新添的桌游"}</p></div><span className="shelf-count">{games.length} 款桌游</span></div>
  <div className="catalog-tools">{page==="home"&&<div className="scope-tabs" role="tablist" aria-label="桌游目录视图">{(["人气","上新"] as Scope[]).map((s,i)=><button role="tab" type="button" aria-selected={scope===s} key={s} className={scope===s?"selected":""} onClick={()=>setScope(s)}><span aria-hidden="true">{["♥","✧"][i]}</span>{s}</button>)}</div>}{page==="library"&&<label className="search-box"><span aria-hidden="true">⌕</span><input ref={searchRef} aria-label="搜索桌游" placeholder="搜索桌游名称、类型…" value={query} onChange={e=>setQuery(e.target.value)}/><kbd>⌘ K</kbd></label>}</div></div>
  {page==="library"&&<div className="type-filter"><span>游戏类型</span><div className="category-tabs" role="tablist" aria-label="游戏类型">{categories.map(c=><button key={c} type="button" role="tab" aria-selected={category===c} className={category===c?"active":""} onClick={()=>setCategory(c)}>{c}</button>)}</div></div>}
  {loadError&&<div className="notice error-notice" role="alert">{interactionReady?"最新汇总暂未刷新，可继续尝试操作。":"互动服务暂时不可用，桌游目录仍可浏览。"}{loadError}<button type="button" onClick={()=>identity&&void load(identity.userId)}>重试</button></div>}
  {catalogError&&<div className="notice error-notice" role="alert">{catalogError}<button type="button" onClick={()=>void reloadCatalog()}>重试目录</button></div>}
  {loading?<div className="empty-state"><Meeple className="empty-meeple"/><p>正在摆好桌游…</p></div>:!games.length&&catalogError?<div className="empty-state"><Meeple className="empty-meeple"/><h3>暂时连接不上桌游清单</h3><p>请检查网络后点击上方「重试」。</p></div>:visibleGames.length?<div className="game-grid">{visibleGames.map(g=><BoardCard key={g.id} game={g} onWant={g=>void toggle(g,"want")} onVote={g=>void toggle(g,"vote")} onRate={g=>chooseRating(g)} hasRound={!!round} busy={busyIds.has(g.id)||!interactionReady}/>)}</div>:<div className="empty-state"><span className="loading-mark">✧</span><h3>{page==="home"&&scope==="上新"&&!query?"还没有新上架的桌游":"没有找到符合条件的桌游"}</h3><p>{page==="home"&&scope==="上新"?"新添的桌游会出现在这里。":"试试换个关键词或游戏类型。"}</p><button type="button" onClick={()=>{setQuery("");setCategory("全部类型");window.location.hash="/library";}}>看看全部桌游</button></div>}
  {page==="home"&&<a className="see-all" href="#/library">逛逛全部 {games.length} 款桌游 <span>→</span></a>}
  </section>
  <aside className="rating-reminder"><span>★</span><p><strong>玩过别忘了评分哦</strong><small>给游戏留个 0.5–5 星，让下一次选择更有灵感。</small></p><a href="#/library">去评分 ↗</a></aside>
  <footer className="footer"><a className="brand footer-brand" href="#/home"><span className="brand-mark"><Meeple/></span><span><strong>桌游小馆</strong><small>GOOD GAMES. GREAT FRIENDS.</small></span></a><p>把好时光，摆上桌。</p><button type="button" className="footer-admin" onClick={()=>openModal("admin")}>{isAdmin?"管理面板":"管理员入口"}</button></footer>
  {modal&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&canClose)setModal(null);}}><section ref={dialogRef} className={"dialog dialog-"+modal+(modal==="admin"&&isAdmin?" admin-dashboard":"")} role="dialog" aria-modal="true" aria-labelledby="dialog-title">{canClose&&<button type="button" className="dialog-close" onClick={()=>setModal(null)} aria-label="关闭">×</button>}
  {modal==="nickname"&&<form onSubmit={saveName}><span className="dialog-icon nickname-meeple"><Meeple color={playerColor}/></span><p className="overline">TAKE YOUR SEAT</p><h2 id="dialog-title">给自己来个小马甲</h2><label className="field-label">我的昵称<input autoFocus required maxLength={14} placeholder="比如：小树" value={nameDraft} onChange={e=>setNameDraft(e.target.value)}/></label>{formError&&<p className="form-error" role="alert">{formError}</p>}<button className="primary-button" type="submit" disabled={formBusy}>{formBusy?"保存中…":"坐下来 →"}</button></form>}
  {modal==="admin"&&!isAdmin&&<form onSubmit={verify}><span className="dialog-icon"><Meeple/></span><p className="overline">KEEP THE GOOD GAMES COMING</p><h2 id="dialog-title">管理员入口</h2><p className="dialog-intro">使用单独提供的管理口令，管理今天的投票轮次。桌游目录和图片通过 GitHub 维护。</p><label className="field-label">管理口令<input autoFocus required type="password" autoComplete="current-password" placeholder="请输入管理口令" value={adminDraft} onChange={e=>setAdminDraft(e.target.value)}/></label>{formError&&<p className="form-error" role="alert">{formError}</p>}<button type="submit" disabled={formBusy} className="primary-button">{formBusy?"验证中…":"进入管理面板 →"}</button></form>}
  {modal==="admin"&&isAdmin&&<><p className="overline">SHELF KEEPER</p><h2 id="dialog-title">管理面板</h2><p className="dialog-intro">为今天开启一轮新投票。桌游清单与图片在 GitHub 中维护。</p><div className="admin-toolbar"><button type="button" className="new-round-button" onClick={newRound}>＋ 新开投票</button></div><div className="admin-round-state"><span>{round?"当前投票进行中":"当前没有进行中的投票"}</span><small>{history.length?"最近 "+history.length+" 轮历史记录已保留":"想玩清单和评分独立于投票轮次"}</small></div><p className="dialog-intro">目录文件：public/catalog/games.json<br/>封面目录：public/images/</p><a className="secondary-button" href="https://github.com/nhsgqjy/meeple-corner/tree/main/public" target="_blank" rel="noreferrer">前往 GitHub 维护目录 ↗</a><button className="exit-admin" type="button" onClick={()=>{setAdminKey("");setIsAdmin(false);setModal(null);setNotice("已退出管理模式");}}>退出管理模式</button></>}
  {modal==="rating"&&ratingGame&&<form className={"rating-form "+(ratingSaved?"is-saved":"")} onSubmit={saveRating}>
    <div className="rating-game-heading"><Cover game={ratingGame} small/><div><p className="overline">我的游戏体验</p><h2 id="dialog-title">{ratingGame.title}</h2></div></div>
    {ratingSaved?<div className="rating-success" role="status"><span className="saved-check">✓</span><h3>评分已保存</h3><p>你的 <strong>{ratingDraft.toFixed(1)} 星</strong> 已记下，之后随时可以修改。</p><Stars value={ratingDraft} label={ratingDraft+" 星"}/>{commentDraft.trim()&&<p className="saved-comment">“{commentDraft.trim()}”</p>}<button type="button" className="primary-button" onClick={()=>setModal(null)}>完成</button></div>:<>
      <p className="rating-invitation">这次体验怎么样？滑动星星，选一个你的分数。</p>
      <div className="rating-score-preview" aria-live="polite"><strong>{ratingDraft?ratingDraft.toFixed(1):"—"}</strong><span>{ratingDraft?"/ 5":"还没选分数"}</span></div>
      <div className="rating-adjust"><button type="button" aria-label="减少半星" disabled={ratingSaving||ratingDraft<=.5} onClick={()=>setRatingDraft(n=>Math.max(.5,n-.5))}>−</button><Stars value={ratingDraft} label={"给"+ratingGame.title+"评分"} onChange={setRatingDraft} disabled={ratingSaving}/><button type="button" aria-label="增加半星" disabled={ratingSaving||ratingDraft>=5} onClick={()=>setRatingDraft(n=>Math.min(5,n+.5))}>＋</button></div>
      <p className="rating-caption">{ratingDraft>=4.5?"太喜欢了，还想再开一局！":ratingDraft>=3.5?"很好玩，值得再玩。":ratingDraft>=2.5?"还不错，看场合再玩。":ratingDraft>0?"这次不太合我的口味。":"支持半星，选好后再确认。"}</p>
      {ratingGame.myRating>0&&<p className="previous-rating">上次评分：{ratingGame.myRating.toFixed(1)} 星</p>}
      <label className="rating-comment-label">一句话评论 <span>选填</span><textarea maxLength={80} rows={2} disabled={ratingSaving} placeholder="比如：节奏轻快，很适合朋友聚会。" value={commentDraft} onChange={e=>setCommentDraft(e.target.value.replace(/[\r\n]+/g," "))}/><small>{commentDraft.length}/80</small></label>
      {formError&&<p className="form-error" role="alert">{formError}</p>}
      <button className="primary-button" type="submit" disabled={ratingSaving||ratingDraft<.5}>{ratingSaving?"正在保存…":ratingDraft?"确认评分 · "+ratingDraft.toFixed(1)+" 星":"请先选择分数"}</button>
      <button type="button" className="rating-cancel" disabled={ratingSaving} onClick={()=>setModal(null)}>暂不评分</button>
    </>}
  </form>}
  {modal==="round"&&<form onSubmit={startRound}><span className="dialog-icon"><Meeple/></span><p className="overline">A FRESH ROUND, A NEW ADVENTURE</p><h2 id="dialog-title">新开一轮投票</h2><p className="dialog-intro">{round?"当前轮次会结束并保留记录，新一轮从零票开始。":"开启后，每位朋友可以投给多款想玩的游戏，每款一票。"}想玩清单和评分会继续保留。</p><label className="field-label">本轮投票名称<input autoFocus required maxLength={40} value={roundTitle} onChange={e=>setRoundTitle(e.target.value)}/></label><p className="round-hint">每人可投多款 · 每款一票 · 可分别取消</p>{formError&&<p className="form-error" role="alert">{formError}</p>}<button type="submit" className="primary-button" disabled={formBusy}>{formBusy?"开启中…":"开启新投票 →"}</button></form>}
  </section></div>}
  </main>;
}
