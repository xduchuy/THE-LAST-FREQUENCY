// Relocate live nodes, never clone controls or register a second input pipeline.
export const MOBILE_QUERY = '(max-width: 900px), (max-width: 1023px) and (max-height: 540px)';
export function setupMobileLayout({ releaseCapture }) {
  const byId=id=>document.getElementById(id), media=matchMedia(MOBILE_QUERY);
  const canvas=byId('canvas-container'), footer=byId('room-footer'), status=byId('essential-status');
  const aux=byId('aux-controls'), fallback=byId('radio-fallback');
  function place(node,parent){if(node.parentElement!==parent)parent.append(node);}
  function controls(){
    const focused=document.activeElement;
    const ready=document.body.classList.contains('webgl-ready');
    place(aux,ready || !byId('operations-drawer').hidden ? byId('operations-controls') : media.matches?byId('radio-stage'):byId('desktop-radio-stage'));
    if(focused?.isConnected && focused.getClientRects().length)focused.focus({preventScroll:true});
  }
  function layout(){
    releaseCapture();const focused=document.activeElement;
    byId('mobile-console').hidden=!media.matches;
    document.body.classList.toggle('mobile-layout',media.matches);
    place(status,byId(media.matches?'mobile-receiver':'room-header'));
    const stage=byId(media.matches?'radio-stage':'desktop-radio-stage');
    place(canvas,stage);place(fallback,stage);
    place(footer,byId(media.matches?'mobile-dock':'game-hud'));
    byId('btn-operations').textContent=media.matches?'MENU':'CÔNG CỤ';
    controls();
    if(focused?.isConnected && focused.getClientRects().length)focused.focus({preventScroll:true});
  }
  function viewport(){const v=window.visualViewport;document.documentElement.style.setProperty('--viewport-height',`${v?.height??innerHeight}px`);document.documentElement.style.setProperty('--viewport-top',`${v?.offsetTop??0}px`);}
  media.addEventListener('change',layout);
  window.addEventListener('resize',()=>{releaseCapture();viewport();});
  window.visualViewport?.addEventListener('resize',viewport);
  window.visualViewport?.addEventListener('scroll',viewport);
  new MutationObserver(controls).observe(document.body,{attributes:true,attributeFilter:['class']});
  new MutationObserver(controls).observe(byId('operations-drawer'),{attributes:true,attributeFilter:['hidden']});
  viewport();layout();
  return {refreshControls:controls};
}
