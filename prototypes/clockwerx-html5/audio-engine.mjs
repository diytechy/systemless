const eventSounds = {
  swing: 'ActionSwing', flip: 'ActionFlip', bounce: 'ActionBounce',
  reverse: '20', bonus: '21', goal: '43', checkpoint: '23', protected: '46',
};

function eventSoundKey(event) {
  switch (event.type) {
    case 'death': {
      const {cause} = event;
      if (cause?.type === 'timeout' || cause?.reason === 'timeout' || cause?.sourceReason === 7) return '7';
      if (cause?.type === 'door' || cause?.soundArgument === 13 ||
          cause?.reason === 13 || ['door', 'trapped-door'].includes(cause?.reason)) return '13';
      if (cause?.type === 'bomb' || cause?.reason === 15 || cause?.sourceReason === 15 ||
          cause?.reason === 'bomb') return '15';
      return '0';
    }
    case 'door-toggle': return event.soundArgument;
    case 'teleport-sound': return event.dot ?? event.soundId ?? 26;
    case 'gun-sound': return event.gunTrigger?.id;
    case 'bomb-sound':
    case 'sound': return event.soundId ?? event.id;
    case 'slowdown': return (event.slow ?? event.enabled) ? '24' : '25';
    case 'wall-bounce': return (event.hand === 'player' || event.hand === 'player2') ? '31' : undefined;
    case 'door-bounce': return (event.hand === 'player' || event.hand === 'player2') ? '30' : undefined;
    case 'elevator-enter':
    case 'elevator-toggle': return (event.hand === 'player' || event.hand === 'player2') ? '6' : undefined;
    default: return Object.hasOwn(eventSounds, event.type) ? eventSounds[event.type] : undefined;
  }
}

export function soundKeyForEvent(event, sounds) {
  const key = eventSoundKey(event);
  if (key != null && sounds && Object.hasOwn(sounds, key) && sounds[key]) return String(key);
}

export function musicTrackForState({view, level, coversBoard, musicManifest}) {
  if (view === 'title' || (view === 'levels' && coversBoard)) return musicManifest?.titleTrack;
  if (view === 'complete') return musicManifest?.victoryTrack;
  if (['play', 'pause', 'levels'].includes(view)) {
    return musicManifest?.chapterTracks?.[Math.floor((level - 1) / 10)];
  }
}

export function createSoundLimiter({cooldownMs = 35, now = () => performance.now()} = {}) {
  const lastPlayed = new Map();
  return key => {
    const time = now();
    if (time - (lastPlayed.get(key) ?? -Infinity) < cooldownMs) return false;
    lastPlayed.set(key, time);
    return true;
  };
}
