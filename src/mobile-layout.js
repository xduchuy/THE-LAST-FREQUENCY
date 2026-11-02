// Reuse the actual radio controls: resizing never creates a second game state.
export const MOBILE_QUERY = '(max-width: 900px), (max-width: 1023px) and (max-height: 540px)';

export function setupMobileLayout({ releaseCapture, pause, openJournal, openSettings, openHelp }) {
  const media = window.matchMedia(MOBILE_QUERY);
  const shell = document.getElementById('mobile-console');
  const slots = [];
  const byId = id => document.getElementById(id);
  const place = (node, target) => {
    const marker = document.createComment('desktop control position');
    node.before(marker);
    slots.push({ node, marker, target });
  };
  const mission = byId('mission-panel');
  place(byId('receiver-hud'), byId('mobile-receiver'));
  place(mission, byId('mobile-workspace'));
  place(byId('station-chips'), mission);
  for (const node of [mission.querySelector('.antenna-label'), byId('antenna'), mission.querySelector('.antenna-scale')]) {
    place(node, byId('mobile-antenna'));
  }
  place(byId('radio-controls'), byId('mobile-tuning'));
  for (const node of [mission.querySelector('.record-readout'), mission.querySelector('.capture-track')]) {
    place(node, byId('mobile-recording'));
  }
  place(byId('btn-hud-power'), byId('mobile-record-buttons'));
  place(byId('btn-capture'), byId('mobile-record-buttons'));

  function updateLayout() {
    releaseCapture();
    const focused = document.activeElement;
    shell.hidden = !media.matches;
    document.body.classList.toggle('mobile-layout', media.matches);
    if (media.matches) {
      for (const { node, target } of slots) target.append(node);
    } else {
      // Restore containers before their children, preserving the desktop order.
      for (const { node, marker } of slots) marker.after(node);
    }
    if (focused instanceof HTMLElement && focused !== document.body) focused.focus({ preventScroll: true });
  }
  function updateViewport() {
    const viewport = window.visualViewport;
    document.documentElement.style.setProperty('--viewport-height', `${viewport?.height ?? innerHeight}px`);
    document.documentElement.style.setProperty('--viewport-top', `${viewport?.offsetTop ?? 0}px`);
  }
  media.addEventListener('change', updateLayout);
  window.addEventListener('resize', () => { releaseCapture(); updateViewport(); });
  window.visualViewport?.addEventListener('resize', updateViewport);
  window.visualViewport?.addEventListener('scroll', updateViewport);
  updateViewport();
  updateLayout();
  const workspace = byId('mobile-workspace');
  function updateScrollHint() {
    workspace.classList.toggle('has-more', mission.scrollHeight - mission.clientHeight - mission.scrollTop > 12);
  }
  mission.addEventListener('scroll', updateScrollHint, { passive: true });
  const scrollObserver = new ResizeObserver(updateScrollHint);
  for (const node of [mission, byId('mission-feedback'), byId('station-chips')]) scrollObserver.observe(node);

  byId('btn-mobile-receiver').addEventListener('click', () => {
    mission.scrollTo({ top: 0, behavior: 'auto' });
  });
  byId('btn-mobile-journal').addEventListener('click', () => openJournal('tab-clues'));
  byId('btn-mobile-workbench').addEventListener('click', () => openJournal('tab-workbench'));
  byId('btn-mobile-settings').addEventListener('click', openSettings);
  byId('btn-mobile-help').addEventListener('click', openHelp);
  byId('btn-mobile-pause').addEventListener('click', pause);
}
