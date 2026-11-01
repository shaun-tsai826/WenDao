// store 骨架用（task 2.5）：還沒實作的 action 一律丟出這個錯誤，
// 萬一提前被呼叫，畫面和 console 都看得出是哪個 task 還沒做，而不是默默什麼都不做。
export function notImplemented(action: string, task: string): never {
  throw new Error(`${action} 尚未實作（task ${task}）`);
}
