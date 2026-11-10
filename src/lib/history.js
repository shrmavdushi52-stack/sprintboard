// Snapshot-based undo/redo. Snapshots are opaque strings supplied by the caller.
export function createHistory(limit=100){let past=[],future=[];return{
 push(s){past.push(s);if(past.length>limit)past.shift();future=[]},
 undo(cur){if(!past.length)return null;future.push(cur);return past.pop()},
 redo(cur){if(!future.length)return null;past.push(cur);return future.pop()},
 canUndo:()=>past.length>0,canRedo:()=>future.length>0,clear(){past=[];future=[]}}}
