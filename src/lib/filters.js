export const KEYS=['view','assignee','label','from','to','q','sort'];
export const parseFilters=search=>{const p=new URLSearchParams(search);return Object.fromEntries(KEYS.map(k=>[k,p.get(k)||'']))};
export const serializeFilters=F=>{const u=new URLSearchParams();KEYS.forEach(k=>F[k]&&u.set(k,F[k]));return u.toString()};
export const matches=(F,c)=>(!F.assignee||c.assignee===F.assignee)&&(!F.label||c.labels.includes(F.label))&&(!F.from||c.due>=F.from)&&(!F.to||c.due<=F.to)&&(!F.q||c.title.toLowerCase().includes(F.q.toLowerCase()));
