import { create } from 'zustand';

export const useLiveTracker = create((set, get) => ({
  events: [],           // every tracked action, timestamped with gapMs
  wrongReadings: [],    // specific incorrect readings/values entered
  wrongMixes: [],       // specific incorrect combinations/orders
  retryCount: 0,
  hesitationFlags: [],  // long pauses between steps (>12000ms)
  lastActionTime: null,

  logEvent(event) {
    const now = Date.now();
    const state = get();
    const gap = state.lastActionTime ? now - state.lastActionTime : 0;

    const newEvent = { ...event, timestamp: now, gapMs: gap };
    const newHesitations = gap > 12000
      ? [...state.hesitationFlags, { beforeAction: event.type, gapMs: gap }]
      : state.hesitationFlags;

    set({
      events: [...state.events, newEvent],
      lastActionTime: now,
      hesitationFlags: newHesitations,
    });
  },

  logWrongReading(detail) {
    set((state) => ({ wrongReadings: [...state.wrongReadings, detail] }));
  },

  logWrongMix(detail) {
    set((state) => ({ wrongMixes: [...state.wrongMixes, detail] }));
  },

  logRetry() {
    set((state) => ({ retryCount: state.retryCount + 1 }));
  },

  getSummary() {
    const state = get();
    const totalTime = state.events.length > 0
      ? state.events[state.events.length - 1].timestamp - state.events[0].timestamp
      : 0;

    return {
      totalSteps: state.events.length,
      totalTimeMs: totalTime,
      retryCount: state.retryCount,
      hesitationCount: state.hesitationFlags.length,
      wrongReadings: state.wrongReadings,
      wrongMixes: state.wrongMixes,
      seemsUnsure: state.retryCount >= 3 || state.hesitationFlags.length >= 3,
      events: state.events,
    };
  },

  reset() {
    set({
      events: [],
      wrongReadings: [],
      wrongMixes: [],
      retryCount: 0,
      hesitationFlags: [],
      lastActionTime: null,
    });
  },
}));

export default useLiveTracker;
