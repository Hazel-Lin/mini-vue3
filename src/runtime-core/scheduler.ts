export const nextTick = (fn) =>{
  return fn ? Promise.resolve().then(fn) : Promise.resolve();
}

const quque:any[] = [];
let isFlushPending = false;
// 异步队列
export const queueJobs = (job) =>{
  if(!quque.includes(job)){
    quque.push(job);
  }
  queueFlush();
}
function queueFlush() {
  if (isFlushPending) return;
  isFlushPending = true;

  nextTick(flushJobs);
}

function flushJobs() {
  isFlushPending = false;
  let job;
  // 取出队列中的第一个任务执行
  while(job = quque.shift()){
    job && job();
  }
}

