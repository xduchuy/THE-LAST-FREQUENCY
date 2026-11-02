/** Pure gameplay rules: seconds, MHz, degrees. Rendering and audio live in main.js. */
export const DIFFICULTIES = {
  cadet: { label: 'Tân binh', duration: 1080, drain: 0.055, capture: 3.5, drift: 0.004, threshold: 0.55 },
  operator: { label: 'Điện báo viên', duration: 720, drain: 0.085, capture: 4.5, drift: 0.012, threshold: 0.68 },
  veteran: { label: 'Cựu binh', duration: 540, drain: 0.115, capture: 6, drift: 0.02, threshold: 0.76 }
};
export const CHANNELS = [
  { id: 'borealis', freq: 3.20, bearing: 35, label: 'BOREALIS' },
  { id: 'echo7', freq: 4.75, bearing: 110, label: 'ECHO-7' },
  { id: 'orpheus', freq: 6.18, bearing: 65, label: 'ORPHEUS' },
  { id: 'k19', freq: 8.90, bearing: 145, label: 'K-19' },
  { id: 'helios4', freq: 11.40, bearing: 95, label: 'HELIOS-4' },
  { id: 'chronos_final', freq: 9.65, bearing: 80, label: 'CHRONOS' }
];
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
export function createMission(difficulty = 'operator') {
  if (!DIFFICULTIES[difficulty]) difficulty = 'operator';
  return { version: 3, difficulty, status: 'briefing', elapsed: 0, battery: 100, heat: 12,
    antenna: 90, coolant: 3, score: 0, combo: 0, collected: [], unlocked: false,
    progress: 0, captureId: null, scanCooldown: 0, trip: 0, overheats: 0,
    interruptions: 0, reason: '', lastCaptureAt: null, scans: 0, mistakes: 0 };
}
export function restoreMission(saved) {
  if (!saved || saved.version !== 3 || !DIFFICULTIES[saved.difficulty]) return createMission();
  const m = createMission(saved.difficulty);
  const limits = { elapsed: [0, DIFFICULTIES[m.difficulty].duration], battery: [0,100], heat: [0,100], antenna: [0,180], coolant: [0,3], score: [0,100000], combo: [0,6], scanCooldown: [0,18], trip: [0,8], overheats: [0,1000], interruptions: [0,10000], scans: [0,10000], mistakes: [0,10000] };
  for (const [key,[lo,hi]] of Object.entries(limits)) {
    if (Number.isFinite(saved[key])) m[key] = clamp(saved[key],lo,hi);
  }
  m.collected = [...new Set((Array.isArray(saved.collected) ? saved.collected : []).filter(id => CHANNELS.slice(0,5).some(c => c.id === id)))];
  m.unlocked = saved.unlocked === true && m.collected.length === 5;
  m.status = saved.status === 'won' && m.unlocked ? 'won' : saved.status === 'lost' ? 'lost' : saved.status === 'briefing' ? 'briefing' : 'paused';
  m.reason = m.status === 'lost' ? (m.battery <= 0 ? 'battery' : 'timeout') : '';
  m.lastCaptureAt = Number.isFinite(saved.lastCaptureAt) ? clamp(saved.lastCaptureAt,0,m.elapsed) : null;
  return m;
}
export function stormAt(m) {
  const phase = m.elapsed % 90;
  return { active: phase >= 60 && phase < 78, warning: phase >= 50 && phase < 60, next: phase < 60 ? 60-phase : 150-phase };
}
export function carrierFrequency(m, channel) {
  const d = DIFFICULTIES[m.difficulty].drift;
  return channel.freq + Math.sin(m.elapsed * 0.38 + channel.bearing) * d * (stormAt(m).active ? 1.4 : 1);
}
export function antennaGain(m, channel) {
  return Math.exp(-Math.pow((m.antenna-channel.bearing)/55,2));
}
export function captureDuration(m, id) {
  return id === 'chronos_final' ? 8 : DIFFICULTIES[m.difficulty].capture;
}
export function tickMission(m, dt, input = {}) {
  if (m.status !== 'playing' || !Number.isFinite(dt) || dt <= 0) return [];
  dt = Math.min(dt, 0.25);
  const events = [];
  m.elapsed += dt;
  m.scanCooldown = Math.max(0,m.scanCooldown-dt);
  m.trip = Math.max(0,m.trip-dt);
  const powered = input.powerOn && m.trip <= 0;
  const storm = stormAt(m).active;
  m.battery = clamp(m.battery + dt * (powered ? -(DIFFICULTIES[m.difficulty].drain + (input.holding ? 0.35 : 0) + (storm ? 0.05 : 0)) : 0.16),0,100);
  m.heat = clamp(m.heat + dt * (powered && input.holding ? (storm ? 8 : 6) : powered ? -0.65 : -3.5),0,100);
  if (m.heat >= 100) {
    m.trip = 8; m.heat = 72; m.battery = Math.max(0,m.battery-8); m.overheats++;
    m.combo = 0; events.push({type:'overheat'});
  }
  if (m.battery <= 0 || m.elapsed >= DIFFICULTIES[m.difficulty].duration) {
    m.status = 'lost'; m.reason = m.battery <= 0 ? 'battery' : 'timeout'; m.progress = 0;
    return [...events,{type:'lost',reason:m.reason}];
  }
  const ch = CHANNELS.find(c => c.id === input.stationId);
  const eligible = ch && (ch.id !== 'chronos_final' || m.unlocked) && !m.collected.includes(ch.id);
  const receiving = powered && m.trip <= 0 && input.holding && eligible && input.stable && input.signal >= DIFFICULTIES[m.difficulty].threshold;
  if (receiving) {
    if (m.captureId !== ch.id) { m.captureId = ch.id; m.progress = 0; }
    m.progress += dt;
    if (m.progress >= captureDuration(m,ch.id)) {
      m.progress = 0;
      m.combo = m.lastCaptureAt !== null && m.elapsed-m.lastCaptureAt < 90 ? m.combo+1 : 1;
      m.lastCaptureAt = m.elapsed;
      m.score += 1000 + Math.min(5,m.combo-1)*200;
      if (ch.id === 'chronos_final') {
        m.status = 'won';
        m.score += Math.round((DIFFICULTIES[m.difficulty].duration-m.elapsed)*10 + m.battery*20);
        events.push({type:'won',id:ch.id});
      } else {
        m.collected.push(ch.id); m.battery = Math.min(100,m.battery+7);
        events.push({type:'captured',id:ch.id});
      }
    }
  } else if (m.progress > 0) {
    m.progress = Math.max(0,m.progress-dt*1.8);
    if (m.progress === 0) { m.interruptions++; m.combo=0; events.push({type:'interrupted'}); }
  }
  return events;
}
export function useCoolant(m) {
  if (m.status !== 'playing' || m.coolant <= 0) return false;
  m.coolant--; m.heat=Math.max(0,m.heat-45); return true;
}
export function scan(m) {
  if (m.status !== 'playing' || m.scanCooldown > 0 || m.battery <= 3 || m.trip > 0) return null;
  const target = CHANNELS.find(c => !m.collected.includes(c.id) && (c.id !== 'chronos_final' || m.unlocked));
  if (!target) return null;
  m.battery-=3; m.scanCooldown=18; m.scans++;
  return target;
}
export function submitCode(m, code) {
  if (m.status !== 'playing' || m.collected.length < 5) return 'locked';
  if (m.unlocked) return 'unlocked';
  if (code === '7429') { m.unlocked = true; m.score+=1500; return 'correct'; }
  m.battery = Math.max(0,m.battery-5); m.elapsed+=15; m.combo=0; m.mistakes++;
  return 'wrong';
}
