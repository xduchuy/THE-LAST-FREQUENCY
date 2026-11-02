export function keyboardAction(event, blocked = false) {
  if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return null;
  if (event.key === 'Escape') return event.repeat ? null : 'escape';
  if (blocked) return null;
  const el = event.target;
  if (el?.isContentEditable || ['INPUT','TEXTAREA','SELECT'].includes(el?.tagName)) return null;
  if (event.code === 'Space') {
    if (event.repeat) return null;
    const control=el?.closest?.('button, a, [role="button"]');
    return control && control.id!=='btn-capture' ? null : 'capture';
  }
  const key = event.key.toLowerCase();
  if (event.repeat && !['arrowleft','arrowright','a','d'].includes(key)) return null;
  return ({ p:'power', m:'mute', j:'journal', k:'workbench', r:'scan', c:'coolant', arrowleft:'left', a:'left', arrowright:'right', d:'right' })[key] || null;
}
export function setupInputManager({ overlays, escape, actions, release, releaseKeyboard = release, blur, visibility }, win = window, doc = document) {
  win.addEventListener('keydown', event => {
    overlays.handleTab(event);
    const action = keyboardAction(event, Boolean(overlays.top()));
    if (!action) return;
    event.preventDefault();
    if (action === 'escape') escape();
    else actions[action]?.(event);
  });
  win.addEventListener('keyup', event => { if (event.code === 'Space') releaseKeyboard(); });
  win.addEventListener('blur', () => { release(); blur(); });
  doc.addEventListener('visibilitychange', () => { release(); visibility(doc.hidden); });
  doc.addEventListener('focusin', event => overlays.containFocus(event));
}

// Relative motion avoids a jump at touch-down and bounds sensitivity per event.
export function dragDelta(type, dx, dy, fine = false, touch = false) {
  const movement = Math.max(-40, Math.min(40, dx + dy * (type === 'tuning' ? 0.5 : 1)));
  return movement * (type === 'volume' ? 0.004 : fine ? 0.0015 : touch ? 0.003 : 0.006);
}
export function pointerCoordinates(x, y, rect) {
  return { x: ((x-rect.left)/rect.width)*2-1, y: -((y-rect.top)/rect.height)*2+1 };
}

// Preserve sub-step movement until the frequency rounds to the next 0.01 MHz.
export function accumulateDrag(value, type, dx, dy, fine = false, touch = false) {
  const next=value+dragDelta(type,dx,dy,fine,touch);
  return Math.max(type==='volume'?0:3,Math.min(type==='volume'?1:12,next));
}

export function ownsPointer(ownerId, event) {
  return Number.isInteger(ownerId) && ownerId===event?.pointerId;
}
export function smoothApproach(value,target,rate,seconds){
  return value+(target-value)*(1-Math.exp(-rate*Math.max(0,seconds)));
}
