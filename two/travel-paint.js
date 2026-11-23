// Share in-flight paint across every instance. A failed background demand is
// observed here; a visible figure can retry it without starting one per frame.
export function demandPaint(load) {
  let pending, retryAt=0;
  return () => {
    if (!pending || retryAt && performance.now()>=retryAt) {
      retryAt=0;
      pending=load();
      pending.catch(()=>{retryAt=performance.now()+3000;});
    }
    return pending;
  };
}
