import { json } from "@/lib/http";
import { readInteractions } from "@/lib/interactions";
export { OPTIONS } from "@/lib/http";
export async function GET(request:Request){try{return json(request,await readInteractions(new URL(request.url).searchParams.get("userId")));}catch{return json(request,{error:"互动数据暂时无法加载，桌游目录仍可浏览。"},503);}}
