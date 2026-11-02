import { DIFFICULTIES, SIMULATION_STEP, MAX_CAPTURE_GAP, tickMission, endMission, evaluateReception } from './mission.js';
export const STALL_THRESHOLD = MAX_CAPTURE_GAP;

/** Monotonic wall-time authority with a 20 Hz simulation; never counts offline time. */
export class MissionClock {
  constructor() {
    this.mission = null;
    this.lastNow = null;
    this.active = false;
    this.pending = 0;
    this.simElapsed = 0;
    this.lastElapsed = 0;
    this.previous = null;
  }

  snapshot(m, input) {
    return { holding: input.holding === true, canCapture: evaluateReception(m, input).canCapture, stationId: input.stationId };
  }

  noteInput(m, input) {
    if (this.mission === m && this.active) this.previous = this.snapshot(m, input);
  }

  advance(m, now, active, input = {}) {
    const idle = () => ({ events: [], stall: false, steps: 0 });
    if (!Number.isFinite(now)) return idle();
    // A restored/new mission or an explicit time penalty starts a fresh anchor.
    if (this.mission !== m || this.lastNow === null || Math.abs(m.elapsed - this.lastElapsed) > 1e-7) {
      this.mission = m;
      this.lastNow = now;
      this.pending = 0;
      this.simElapsed = this.lastElapsed = m.elapsed;
      this.active = active && m.status === 'playing';
      this.previous = this.active ? this.snapshot(m, input) : null;
      return idle();
    }
    if (now < this.lastNow) return idle();
    const delta = (now - this.lastNow) / 1000;
    this.lastNow = now;
    const wasActive = this.active;
    this.active = active && m.status === 'playing';
    // The previous activity flag owns the interval, including the instant of Pause.
    if (!wasActive || m.status !== 'playing') {
      this.previous = this.active ? this.snapshot(m, input) : null;
      return idle();
    }

    const stall = delta > STALL_THRESHOLD;
    const target = Math.min(DIFFICULTIES[m.difficulty].duration, m.elapsed + delta);
    this.pending += Math.max(0, target - m.elapsed);
    const reception = evaluateReception(m, input), previous = this.previous;
    const continuous = !stall && previous?.holding === true && previous?.canCapture && reception.canCapture && previous.stationId === input.stationId;
    // A long unobserved interval uses known idle power, with no recording/hold heat.
    const sample = { ...input, holding: stall ? false : input.holding, captureAllowed: Boolean(continuous) };
    const events = [];
    let steps = 0;
    // Bounded by one mission duration (at most 21,601), even for an arbitrary stall.
    const budget = Math.ceil(DIFFICULTIES[m.difficulty].duration / SIMULATION_STEP) + 1;
    while (this.pending + 1e-9 >= SIMULATION_STEP && m.status === 'playing' && steps < budget) {
      m.elapsed = this.simElapsed;
      events.push(...tickMission(m, SIMULATION_STEP, sample));
      this.simElapsed = m.elapsed;
      this.pending = Math.max(0, this.pending - SIMULATION_STEP);
      steps++;
    }
    if (m.status === 'playing') {
      m.elapsed = target; // Includes the sub-step remainder in the display/save authority.
      if (endMission(m)) events.push({ type: 'lost', reason: m.reason });
    }
    this.lastElapsed = m.elapsed;
    this.previous = this.snapshot(m, input);
    if (stall) this.previous = null;
    if (m.status !== 'playing') {
      this.previous = null;
      this.active = false;
    }
    return { events, stall, steps, delta };
  }
}
