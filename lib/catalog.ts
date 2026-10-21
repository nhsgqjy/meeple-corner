import data from "../public/catalog/games.json";
export type CatalogGame = { id:string; title:string; category:string; players:string; minutes:number; complexity:string; description:string; symbol:string; accent:string; coverUrl:string; featured:boolean; createdAt:string; isNew:boolean };
export const catalog = data.games as CatalogGame[];
export function findCatalogGame(id:string) { return catalog.find(game=>game.id===id); }
