type CareLevel = 'NEUTRAL' | 'HOLDING' | 'ELEVATED' | 'CRISIS';
type Listener = (level: CareLevel) => void;

const listeners: Set<Listener> = new Set();

export const CareEvents = {
  emit(level: CareLevel) {
    listeners.forEach(l => l(level));
  },
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },
};
