export function escapeAction(stack, status) {
  const top = stack.at(-1);
  if (top === 'operations' || top === 'journal' || top === 'settings' || top === 'help') return { type: 'close', id: top };
  if (top === 'intro' || top === 'victory' || status === 'won' || status === 'lost') return { type: 'consume' };
  if (top === 'mission' || !top) return { type: status === 'playing' ? 'pause' : status === 'paused' ? 'resume' : 'consume' };
  return { type: 'consume' };
}

export function createOverlayManager(definitions, onChange = () => {}, doc = document) {
  const stack = [];
  const openers = new Map();
  const originalInert = new Map();
  const focusables = el => [...el.querySelectorAll('button, input, textarea, select, a[href], [tabindex]')]
    .filter(node => !node.disabled && node.tabIndex >= 0 && !node.closest('[inert]') && node.getClientRects().length);
  const topElement = () => definitions[stack.at(-1)]?.element;
  function focusTop() {
    const el = topElement();
    if (!el) return;
    const initial = definitions[stack.at(-1)].initialFocus;
    const target = (initial && el.querySelector(initial)) || el;
    target.focus({ preventScroll: true });
  }
  function sync() {
    for (const [el, inert] of originalInert) el.inert = inert;
    originalInert.clear();
    const top = topElement();
    if (top) {
      for (const el of doc.body.children) {
        if (el === top || el.contains(top) || definitions[stack.at(-1)].backdrop === el || el.tagName === 'SCRIPT') continue;
        originalInert.set(el, el.inert);
        el.inert = true;
      }
    }
    for (const [id, def] of Object.entries(definitions)) {
      const active = stack.includes(id);
      def.element.setAttribute('aria-hidden', String(!active || def.element !== top));
      def.element.inert = !active || def.element !== top;
      def.element.style.zIndex = String(60 + Math.max(0, stack.indexOf(id)));
    }
    onChange();
  }
  for (const def of Object.values(definitions)) {
    def.element.setAttribute('role', 'dialog');
    const heading=def.element.querySelector('h1,h2,h3');
    if(heading && !def.element.hasAttribute('aria-label') && !def.element.hasAttribute('aria-labelledby')) {
      if(!heading.id) heading.id=`${def.element.id}-title`;
      def.element.setAttribute('aria-labelledby',heading.id);
    }
    def.element.setAttribute('aria-modal', 'true');
    def.element.tabIndex = -1;
    def.element.inert = true;
    def.element.setAttribute('aria-hidden', 'true');
  }
  return {
    top: () => stack.at(-1),
    stack: () => [...stack],
    open(id, opener = doc.activeElement) {
      const def = definitions[id];
      if (stack.includes(id)) { focusTop(); return; }
      openers.set(id, opener);
      stack.push(id);
      def.show(); sync(); focusTop();
    },
    close(id, { restoreFocus = true } = {}) {
      if (!stack.includes(id)) return;
      const wasTop = stack.at(-1) === id;
      stack.splice(stack.indexOf(id), 1);
      definitions[id].hide(); sync();
      const opener = openers.get(id); openers.delete(id);
      if (!wasTop) return;
      if (restoreFocus && opener?.isConnected && !opener.closest('[inert]') && opener.getClientRects().length) opener.focus({ preventScroll: true });
      else if (stack.length) focusTop();
    },
    clear() { for (const id of [...stack].reverse()) this.close(id, { restoreFocus: false }); },
    handleTab(event) {
      const el = topElement(); if (!el || event.key !== 'Tab') return;
      const items = focusables(el);
      if (!items.length) { event.preventDefault(); el.focus(); return; }
      const first = items[0], last = items.at(-1), active = doc.activeElement;
      if (!el.contains(active) || active === el || (event.shiftKey && active === first) || (!event.shiftKey && active === last)) {
        event.preventDefault(); (event.shiftKey ? last : first).focus();
      }
    },
    containFocus(event) { const el = topElement(); if (el && !el.contains(event.target)) focusTop(); }
  };
}
