import assert from 'node:assert/strict';
import test from 'node:test';
import {createSoundLimiter, musicTrackForState, soundKeyForEvent} from './audio-engine.mjs';

const fullSounds = Object.fromEntries([
  ['ActionSwing', 'ActionSwing.wav'],
  ['ActionFlip', 'ActionFlip.wav'],
  ['ActionBounce', 'ActionBounce.wav'],
  ...Array.from({length: 47}, (_, i) => [String(i), `sfx-${i}.wav`]),
]);

const legacySounds = {
  ActionSwing: 'ActionSwing.wav',
  ActionFlip: 'ActionFlip.wav',
  ActionBounce: 'ActionBounce.wav',
};

test('original countdown, timeout and hourglass sounds use IDs 14, 7 and 22',()=>{
 for(const cause of [{type:'timeout'},{reason:'timeout'},{sourceReason:7}]){
  const event={type:'death',cause};
  assert.equal(soundKeyForEvent(event,fullSounds),'7');
  assert.equal(soundKeyForEvent(event,legacySounds),undefined);
 }
 for(const soundId of [14,22])assert.equal(soundKeyForEvent({type:'sound',soundId},fullSounds),String(soundId));
});

const musicManifest = {
  tracks: Object.fromEntries(Array.from({length: 12}, (_, i) => {
    const key = 'song-' + String.fromCharCode(97 + i);
    return [key, `music-${key}.ogg`];
  })),
  titleTrack: 'song-a',
  victoryTrack: 'song-g',
  chapterTracks: ['song-b', 'song-c', 'song-d', 'song-e', 'song-f', 'song-h', 'song-i', 'song-j', 'song-k', 'song-l'],
};

test('soundKeyForEvent maps gameplay events to original ClockWerx sound indices and degrades gracefully on legacy manifests', () => {
  assert.equal(soundKeyForEvent({type: 'swing'}, fullSounds), 'ActionSwing');
  assert.equal(soundKeyForEvent({type: 'flip'}, fullSounds), 'ActionFlip');
  assert.equal(soundKeyForEvent({type: 'bounce'}, fullSounds), 'ActionBounce');
  assert.equal(soundKeyForEvent({type: 'reverse'}, fullSounds), '20');
  assert.equal(soundKeyForEvent({type: 'bonus'}, fullSounds), '21');
  assert.equal(soundKeyForEvent({type: 'goal'}, fullSounds), '43');
  assert.equal(soundKeyForEvent({type: 'checkpoint'}, fullSounds), '23');
  assert.equal(soundKeyForEvent({type: 'protected'}, fullSounds), '46');

  // Death variants
  assert.equal(soundKeyForEvent({type: 'death', cause: {type: 'door'}}, fullSounds), '13');
  assert.equal(soundKeyForEvent({type: 'death', cause: {soundArgument: 13}}, fullSounds), '13');
  assert.equal(soundKeyForEvent({type: 'death', cause: {reason: 'trapped-door'}}, fullSounds), '13');
  assert.equal(soundKeyForEvent({type: 'death', cause: {type: 'bomb'}}, fullSounds), '15');
  assert.equal(soundKeyForEvent({type: 'death', cause: {sourceReason: 15}}, fullSounds), '15');
  assert.equal(soundKeyForEvent({type: 'death', cause: {reason: 'enemy'}}, fullSounds), '0');

  // Doors, teleports, guns, bombs, slowdown
  assert.equal(soundKeyForEvent({type: 'door-toggle', soundArgument: 1}, fullSounds), '1');
  assert.equal(soundKeyForEvent({type: 'door-toggle', soundArgument: 2}, fullSounds), '2');
  assert.equal(soundKeyForEvent({type: 'door-toggle', soundArgument: 3}, fullSounds), '3');
  assert.equal(soundKeyForEvent({type: 'teleport-sound', dot: 26}, fullSounds), '26');
  assert.equal(soundKeyForEvent({type: 'gun-sound', gunTrigger: {id: 35}}, fullSounds), '35');
  assert.equal(soundKeyForEvent({type: 'gun-sound', gunTrigger: {id: 41}}, fullSounds), '41');
  assert.equal(soundKeyForEvent({type: 'bomb-sound', soundId: 11}, fullSounds), '11');
  assert.equal(soundKeyForEvent({type: 'bomb-sound', soundId: 12}, fullSounds), '12');
  assert.equal(soundKeyForEvent({type: 'bomb-sound', soundId: 22}, fullSounds), '22');
  assert.equal(soundKeyForEvent({type: 'slowdown', slow: true}, fullSounds), '24');
  assert.equal(soundKeyForEvent({type: 'slowdown', slow: false}, fullSounds), '25');

  // Player-only bounces and elevator controls avoid enemy spam
  assert.equal(soundKeyForEvent({type: 'wall-bounce', hand: 'player'}, fullSounds), '31');
  assert.equal(soundKeyForEvent({type: 'wall-bounce', hand: 'enemy-0'}, fullSounds), undefined);
  assert.equal(soundKeyForEvent({type: 'door-bounce', hand: 'player'}, fullSounds), '30');
  assert.equal(soundKeyForEvent({type: 'door-bounce', hand: 'enemy-1'}, fullSounds), undefined);
  assert.equal(soundKeyForEvent({type: 'elevator-enter', hand: 'player'}, fullSounds), '6');
  assert.equal(soundKeyForEvent({type: 'elevator-toggle', hand: 'enemy-0'}, fullSounds), undefined);

  // Legacy manifest with only 3 sounds ignores unavailable keys without throwing
  assert.equal(soundKeyForEvent({type: 'swing'}, legacySounds), 'ActionSwing');
  assert.equal(soundKeyForEvent({type: 'goal'}, legacySounds), undefined);
  assert.equal(soundKeyForEvent({type: 'death'}, legacySounds), undefined);
});

test('musicTrackForState selects title, victory, and chapter tracks matching original SSPC', () => {
  assert.equal(musicTrackForState({view: 'title', level: 1, coversBoard: true, musicManifest}), 'song-a');
  assert.equal(musicTrackForState({view: 'levels', level: 25, coversBoard: true, musicManifest}), 'song-a');
  assert.equal(musicTrackForState({view: 'levels', level: 25, coversBoard: false, musicManifest}), 'song-d');
  assert.equal(musicTrackForState({view: 'complete', level: 1, coversBoard: false, musicManifest}), 'song-g');
  assert.equal(musicTrackForState({view: 'play', level: 1, coversBoard: false, musicManifest}), 'song-b');
  assert.equal(musicTrackForState({view: 'play', level: 10, coversBoard: false, musicManifest}), 'song-b');
  assert.equal(musicTrackForState({view: 'play', level: 11, coversBoard: false, musicManifest}), 'song-c');
  assert.equal(musicTrackForState({view: 'play', level: 50, coversBoard: false, musicManifest}), 'song-f');
  assert.equal(musicTrackForState({view: 'play', level: 51, coversBoard: false, musicManifest}), 'song-h');
  assert.equal(musicTrackForState({view: 'play', level: 100, coversBoard: false, musicManifest}), 'song-l');
  assert.equal(musicTrackForState({view: 'play', level: 1, coversBoard: false, musicManifest: null}), undefined);
});

test('createSoundLimiter throttles rapid duplicate keys independently', () => {
  let t = 100;
  const allow = createSoundLimiter({cooldownMs: 35, now: () => t});
  assert.equal(allow('ActionSwing.wav'), true);
  t = 120;
  assert.equal(allow('ActionSwing.wav'), false);
  assert.equal(allow('sfx-12-Explosion.wav'), true);
  t = 135;
  assert.equal(allow('ActionSwing.wav'), true);
});
