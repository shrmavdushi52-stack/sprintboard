export const VERSION=2,KEY='sprintboard:v2';
export function validate(d){if(!d||!Array.isArray(d.cols)||!Array.isArray(d.cards))throw new Error('Expected {cols, cards}');
 const ids=new Set(d.cols.map(c=>c.id));
 d.cards.forEach(c=>{if(!c.id||typeof c.title!=='string'||!ids.has(c.col))throw new Error(`Invalid card: ${c.title??c.id}`)});
 return{cols:d.cols.map(c=>({id:c.id,name:String(c.name),wip:+c.wip||0})),cards:d.cards.map(c=>({labels:[],checklist:[],comments:[],activity:[],files:[],deps:[],assignee:'',desc:'',start:'',due:'',...c}))}}
export function load(store=globalThis.localStorage){try{const raw=store.getItem(KEY)??store.getItem('sb');return raw?validate(JSON.parse(raw)):null}catch{return null}}
export function persist(S,store=globalThis.localStorage){try{store.setItem(KEY,JSON.stringify({v:VERSION,...S}))}catch{}}
export const exportJSON=S=>JSON.stringify({v:VERSION,...S},null,2);
