import {isLevelUnlocked, slotLabels, slotSummary} from './progress.mjs';
import {DIFFICULTIES} from './actor-clocks.mjs';
import {completionBonusForDifficulty,timeBonusForDifficulty} from './score.mjs';
import {ratingForScore, sanitizeInitials, stepInitialChar} from './leaderboard.mjs';

export const campaignLevels = 100;
export const completionBonus = 1000;
export const chapterSize = 10;
export const chapterOf = level => Math.floor((level - 1) / chapterSize);
const columns = 5;
const chapterCount = campaignLevels / chapterSize;
const arrows = {ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right'};
const radialSlots = {up: 1, right: 2, down: 3, left: 4};
const number = new Intl.NumberFormat();
const lastPlayed = new Intl.DateTimeFormat(undefined, {dateStyle: 'medium', timeStyle: 'short'});
const points = value => number.format(value) + ' pts';
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export function moveInGrid(index, direction, width, count) {
  const rowStart = index - index % width;
  if (direction === 'left') return Math.max(rowStart, index - 1);
  if (direction === 'right') return Math.min(count - 1, rowStart + width - 1, index + 1);
  if (direction === 'up' && index >= width) return index - width;
  if (direction === 'down' && index + width < count) return index + width;
  return index;
}

export function moveSlot(slot, direction, radial) {
  if (direction === 'previous') return (slot + 2) % slotLabels.length + 1;
  if (direction === 'next') return slot % slotLabels.length + 1;
  if (radial) return radialSlots[direction] ?? slot;
  return moveInGrid(slot - 1, direction, 2, slotLabels.length) + 1;
}

export function moveChapter(level, offset) {
  const chapter = clamp(chapterOf(level) + offset, 0, chapterCount - 1);
  return chapter * chapterSize + (level - 1) % chapterSize + 1;
}

export function nextDifficulty(difficulty = 'Child') {
  return DIFFICULTIES[(DIFFICULTIES.indexOf(difficulty) + 1) % DIFFICULTIES.length];
}

export function completionDetails(level, bonus, oldCampaign, newCampaign, nextAvailable, timing) {
  const finish = completionBonusForDifficulty(timing?.difficulty);
  const time = timeBonusForDifficulty(timing?.difficulty ?? 'Child', timing?.remainingTime);
  return {
    level, bonus, levelTotal: bonus + finish + time, campaignTotal: newCampaign,
    delta: newCampaign - oldCampaign,
    nextLevel: level < campaignLevels && nextAvailable ? level + 1 : null,
    ...(timing ? {difficulty: timing.difficulty, completionBonus: finish, timeBonus: time} : {}),
  };
}

export function padGlyphs(padFamily = null) {
  if (padFamily === 'playstation') {
    return {
      label: 'PlayStation',
      swing: '✕',
      reverse: '○',
      flip: '□',
      bounce: '△',
      pause: 'R1',
      restart: 'R2',
      levels: 'Options',
    };
  }
  if (padFamily === 'xbox') {
    return {
      label: 'Xbox',
      swing: 'A',
      reverse: 'B',
      flip: 'X',
      bounce: 'Y',
      pause: 'RB',
      restart: 'RT',
      levels: 'Start',
    };
  }
  return {
    label: 'Controller',
    swing: '✕ / A',
    reverse: '○ / B',
    flip: '□ / X',
    bounce: '△ / Y',
    pause: 'R1',
    restart: 'R2',
    levels: 'Start',
  };
}

export function levelMechanicCues(board) {
  if (!board || (board.ordinal ?? 1) === 1 || board.title === 'Movement') return [];
  const cues = [];
  if (board.spikes?.length || board.rotatingSpikeRules || board.movingSpikeRules ||
      board.enemies?.some(h => h.sourceActorType === 4)) cues.push('Spikes');
  if (board.walls?.length) cues.push('Walls');
  if (board.doors?.length) cues.push('Doors');
  if (board.puddles?.length || board.slidingOilRules || board.gunTriggerOilRules) cues.push('Oil');
  if (board.teleportRules || board.teleports?.length || board.slidingTeleportRules ||
      board.dots?.some(d => d.teleport)) cues.push('Teleports');
  if (board.elevatorRules || board.elevators?.length || board.movingElevatorRules ||
      board.dots?.some(d => d.upDown)) cues.push('Elevators');
  if (board.bombRules || board.bombs?.length || board.slidingBombRules || board.movingBombRules ||
      board.movingBusterBombRules || board.staticSlidingBombGoodieRules ||
      board.movingBombSpikeWaystationRules || board.staticBombElevatorRules) cues.push('Bombs & Matches');
  if (board.gunTriggerProjectileRules || board.gunTriggerChild?.guns?.length ||
      board.guns?.length) cues.push('Guns & Triggers');
  if (board.dots?.some(d => d.waystation)) cues.push('Checkpoints');
  if (board.dots?.some(d => d.ring)) cues.push('Bonus Rings');
  return cues;
}

export function sideControlsSpec(inputMode = 'keyboard-mouse', cues = [], players = 1, padCount = 0) {
  if (players === 2) {
    if (inputMode === 'playstation' || inputMode === 'xbox' || inputMode === 'gamepad') {
      const g = padGlyphs(inputMode === 'gamepad' ? null : inputMode);
      const dualPads = padCount >= 2;
      return {
        modeLabel: dualPads ? '2P · Dual Controllers' : '2P · Pad + Keys',
        rows: [
          {action: 'swing', keys: dualPads ? `P1 / P2: ${g.swing}` : `P1: ${g.swing} · P2: Enter / →`, label: 'Swing through next dot'},
          {action: 'flip', keys: dualPads ? `P1 / P2: ${g.flip}` : `P1: ${g.flip} · P2: R-Shift / ↑`, label: 'Bounce to next dot (Flip)'},
          {action: 'reverse', keys: dualPads ? `P1 / P2: ${g.reverse}` : `P1: ${g.reverse} · P2: ↓ / /`, label: 'Flip direction (Reverse)'},
          {action: 'bounce', keys: dualPads ? `P1 / P2: ${g.bounce}` : `P1: ${g.bounce} · P2: ←`, label: 'Bounce off dot'},
        ],
        meta: `${g.pause} Pause · ${g.levels} Levels · ${g.restart} Restart`,
        cues: Array.isArray(cues) ? cues : [],
      };
    }
    return {
      modeLabel: '2P · Keyboard',
      rows: [
        {action: 'swing', keys: 'P1: Space / D · P2: Enter / →', label: 'Swing through next dot'},
        {action: 'flip', keys: 'P1: L-Shift / X · P2: R-Shift / ↑', label: 'Bounce to next dot (Flip)'},
        {action: 'reverse', keys: 'P1: W / C · P2: ↓ / /', label: 'Flip direction (Reverse)'},
        {action: 'bounce', keys: 'P1: Z · P2: ←', label: 'Bounce off dot'},
      ],
      meta: 'P / Esc Pause & Levels',
      cues: Array.isArray(cues) ? cues : [],
    };
  }
  if (inputMode === 'playstation' || inputMode === 'xbox' || inputMode === 'gamepad') {
    const g = padGlyphs(inputMode === 'gamepad' ? null : inputMode);
    return {
      modeLabel: g.label,
      rows: [
        {action: 'swing', keys: g.swing, label: 'Swing through next dot'},
        {action: 'flip', keys: g.flip, label: 'Bounce to next dot (Flip)'},
        {action: 'reverse', keys: g.reverse, label: 'Flip direction (Reverse)'},
        {action: 'bounce', keys: g.bounce, label: 'Bounce off dot'},
      ],
      meta: `${g.pause} Pause · ${g.levels} Levels · ${g.restart} Restart`,
      cues: Array.isArray(cues) ? cues : [],
    };
  }
  return {
    modeLabel: 'Keyboard & Mouse',
    rows: [
      {action: 'swing', keys: 'Space · D · L-Click', label: 'Swing through next dot'},
      {action: 'flip', keys: 'L-Shift · X · L+R Click', label: 'Bounce to next dot (Flip)'},
      {action: 'reverse', keys: 'W · C · R-Click', label: 'Flip direction (Reverse)'},
      {action: 'bounce', keys: 'Z', label: 'Bounce off dot'},
    ],
    meta: 'P / Esc Pause & Levels',
    cues: Array.isArray(cues) ? cues : [],
  };
}

export function canShowSideControls({gameMode, playLayout, view, viewportWidth, viewportHeight}) {
  if (!gameMode || playLayout || view !== 'play') return false;
  if (!(viewportWidth > 0 && viewportHeight >= 420)) return false;
  const boardWidth = Math.min(viewportWidth, viewportHeight * 4 / 3);
  return (viewportWidth - boardWidth) / 2 >= 200;
}

export function menuPadAction(view, pressed, confirming = false) {
  if (view === 'title' && !confirming) {
    if (pressed.levels) return 'slot-reset';
    if (pressed.swing) return 'slot-play';
    if (pressed.flip) return 'slot-levels';
    if (pressed.bounce) return 'slot-hand';
    if (pressed.reverse) return 'slot-sound';
    if (pressed.pause) return 'previous';
    if (pressed.restart) return 'next';
  }
  if (view === 'title' && confirming) {
    if (pressed.levels || pressed.reverse) return 'slot-keep';
    if (pressed.swing) return 'activate';
  }
  if (view === 'levels') {
    if (pressed.levels || pressed.reverse) return 'game-level-back';
    if (pressed.swing) return 'activate';
    if (pressed.flip) return 'previous-chapter';
    if (pressed.bounce) return 'next-chapter';
  }
  if (view === 'pause') {
    if (pressed.pause || pressed.reverse) return 'game-resume';
    if (pressed.levels) return 'game-pause-levels';
    if (pressed.swing) return 'activate';
  }
  if (view === 'complete') {
    if (pressed.swing) return 'activate';
  }
  if (view === 'scores') {
    if (pressed.levels || pressed.reverse) return 'game-scores-back';
    if (pressed.flip) return 'previous-scores-tab';
    if (pressed.bounce) return 'next-scores-tab';
    if (pressed.swing) return 'activate';
  }
  return null;
}

export function createGameMenu({
  root, getSlot, getLeaderboard = () => ({lastInitials: 'AAA', tables: {}}),
  onView, onSlotChange = () => {}, onPlay, onResume, onRestart, onSetting, onReset, onExport, onRecordScore = () => null,
}) {
  const $ = id => document.getElementById(id);
  const screen = Object.fromEntries(Array.from(root.querySelectorAll('[data-screen]'), node => [node.dataset.screen, node]));
  const cards = $('game-slots');
  const grid = $('game-level-grid');
  const freePlay = $('game-free-play');
  const chapters = $('game-chapters');
  const notice = $('game-menu-status');
  const confirm = $('slot-confirm');
  const confirmButtons = [$('slot-keep'), $('slot-erase')];
  const pauseButtons = Array.from($('pause-actions').querySelectorAll('button'));
  const completionButtons = Array.from($('complete-actions').querySelectorAll('button'));
  const titles = new Map();
  const chapterButtons = [];
  const slotButtons = [];
  const scoresTabs = $('game-scores-tabs');
  const scoresList = $('game-scores-list');
  const scoreTabButtons = [];
  const initialButtons = ['initial-0', 'initial-1', 'initial-2'].map(id => $(id)).filter(Boolean);
  let levelButtons = [];
  let view = 'title', levelReturn = 'title', scoresReturn = 'title', selectedSlot = 1, selectedLevel = 1, roundLevel = 1;
  let scoresDifficulty = 'Child', initialsChars = ['A', 'A', 'A'], scoreRecorded = false;
  let needleAngle = 0, connected = false, padFamily = null, connectedCount = 0, busy = false, confirming = false, command = 0, result;

  const focus = node => node?.focus({preventScroll: true});
  const text = (id, value) => { const el = $(id); if (el) el.textContent = value; };

  function makeButton(className) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'game-button ' + className;
    return button;
  }

  function part(tag, className, value) {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = value;
    return node;
  }

  function mark(buttons, index, takeFocus, pressed = false) {
    for (const [i, button] of buttons.entries()) {
      button.toggleAttribute('data-selected', i === index);
      if (pressed) button.setAttribute('aria-pressed', String(i === index));
    }
    if (takeFocus) focus(buttons[index]);
  }

  function updateControls() {
    root.toggleAttribute('data-gamepad', connected);
    const g = padGlyphs(padFamily);
    const slotControls = $('slot-controls');
    slotControls.hidden = !connected;
    if (connected) {
      slotControls.textContent = `Stick / D-pad choose · ${g.swing} play · ${g.flip} levels · ${g.bounce} hand · ${g.reverse} sound · ${g.levels} reset · Down from III for difficulty`;
    }
    text('game-level-controls', connected
      ? `Stick / D-pad choose · ${g.swing} play · ${g.flip} / ${g.bounce} change chapter · ${g.reverse} back`
      : 'Arrows choose · Enter play · PgUp / PgDn change chapter');
    $('game-complete-controls').hidden = !connected;
    text('game-complete-controls', `Stick / D-pad choose · ${g.swing} select`);
    text('game-scores-controls', connected
      ? `Stick / D-pad or ${g.flip} / ${g.bounce} difficulty · ${g.reverse} back`
      : 'Left / Right difficulty · Esc back');
    text('game-replay', connected ? 'Replay Level' : 'Replay Level · R');
    text('game-complete-levels', 'Level Select');
    text('game-complete-slots', 'Save Slots');
  }

  function message(value, error = false) {
    notice.textContent = value;
    notice.hidden = !value;
    notice.classList.toggle('error', error);
  }

  function setBusy(value, status = '') {
    const finished = busy && !value;
    busy = value;
    root.setAttribute('aria-busy', String(value));
    refreshActions();
    message(status);
    if (finished && !root.contains(document.activeElement)) {
      if (view === 'title') focus(slotButtons[selectedSlot - 1]);
      if (view === 'levels') focus(levelButtons[(selectedLevel - 1) % chapterSize]);
      if (view === 'complete') focus(completionButtons[command]);
    }
  }

  function playableLevel(slot) {
    if (titles.has(slot.currentLevel)) return slot.currentLevel;
    const next = (slot.completedLevels.at(-1) ?? 0) + 1;
    return titles.has(next) ? next : titles.keys().next().value ?? slot.currentLevel;
  }

  function refreshActions() {
    for (const button of root.querySelectorAll('button')) {
      button.disabled = (busy && button.id !== 'slot-export') || (!titles.size && button.hasAttribute('data-needs-levels'));
    }
    freePlay.disabled = busy;
    const slot = getSlot(selectedSlot);
    text('slot-play', slot.started ? 'Continue' : 'Play');
    text('slot-hand', 'Hand: ' + (slot.black ? 'Black' : 'Gold'));
    text('slot-sound', 'Sound: ' + (slot.sound ? 'On' : 'Off'));
    text('slot-music', 'Music: ' + (slot.music ? 'On' : 'Off'));
    text('slot-difficulty', 'Difficulty: ' + (slot.difficulty ?? 'Child'));
    const players = slot.players === 2 ? 2 : 1;
    text('slot-players', 'Players: ' + players + 'P' + (connectedCount >= 2 ? ' (2 Pads)' : ''));
    text('game-hand', $('slot-hand').textContent);
    text('game-sound', $('slot-sound').textContent);
    text('game-music', $('slot-music').textContent);
    text('game-difficulty', $('slot-difficulty').textContent);
    text('game-players', 'Players: ' + players + 'P');
  }

  function renderSlots(takeFocus = false) {
    for (const [i, button] of slotButtons.entries()) {
      const slot = getSlot(i + 1);
      const summary = slotSummary(slot, campaignLevels);
      const level = playableLevel(slot);
      const title = titles.get(level);
      const detail = summary.started ? 'Lv ' + level + (title ? ' · ' + title : '') : 'Empty Slot';
      const saved = summary.updatedUtc ? lastPlayed.format(new Date(summary.updatedUtc)) : '—';
      const rating = ratingForScore(summary.campaignScore).title;
      button.replaceChildren(
        part('span', 'slot-roman', summary.label), part('span', 'slot-level', detail),
        part('span', 'slot-progress', summary.cleared + ' / ' + summary.totalLevels + ' · ' + rating),
        part('strong', 'slot-score', points(summary.campaignScore)),
        part('span', 'slot-hand' + (slot.black ? ' black' : ''), summary.hand),
        part('span', 'slot-time', 'Last played ' + saved),
      );
    }
    highlightSlot(takeFocus);
  }

  function highlightSlot(takeFocus) {
    mark(slotButtons, selectedSlot - 1, takeFocus, true);
    const angle = (selectedSlot - 1) * 90;
    needleAngle += ((angle - needleAngle + 540) % 360 + 360) % 360 - 180;
    cards.style.setProperty('--needle-angle', needleAngle + 'deg');
    refreshActions();
  }

  function selectSlot(id, takeFocus = true) {
    const changed = selectedSlot !== id;
    selectedSlot = id;
    highlightSlot(takeFocus);
    if (changed) onSlotChange();
  }

  function renderLevels(takeFocus = true) {
    const chapter = chapterOf(selectedLevel);
    for (const [i, button] of chapterButtons.entries()) {
      button.setAttribute('aria-pressed', String(i === chapter));
      button.classList.toggle('primary', i === chapter);
    }
    const slot = getSlot(selectedSlot);
    freePlay.checked = slot.freePlay;
    levelButtons = Array.from({length: chapterSize}, (_, index) => {
      const level = chapter * chapterSize + index + 1;
      const title = titles.get(level);
      const enabled = Boolean(title) && isLevelUnlocked(slot, level);
      const cleared = slot.completedLevels.includes(level);
      const button = makeButton('level-tile');
      button.setAttribute('aria-disabled', String(!enabled));
      button.setAttribute('aria-label', 'Level ' + level + (title ? ', ' + title : ', unavailable') +
        (cleared ? ', cleared' : '') + (title && !enabled ? ', locked' : '') +
        (Object.hasOwn(slot.bestLevelScores, level) ? ', best ' + points(slot.bestLevelScores[level]) : ''));
      button.append(part('span', 'level-tile-number', level + (cleared ? ' ✓' : '')),
        part('span', 'level-tile-name', title ?? 'Unavailable'),
        part('span', 'level-tile-score', Object.hasOwn(slot.bestLevelScores, level) ? points(slot.bestLevelScores[level])
          : !title ? '' : enabled ? '—' : 'Locked'));
      button.onfocus = () => {
        selectedLevel = level;
        mark(levelButtons, index, false);
      };
      button.onclick = () => {
        selectedLevel = level;
        mark(levelButtons, index, true);
        if (enabled && !busy) onPlay(selectedSlot, level);
      };
      return button;
    });
    grid.replaceChildren(...levelButtons);
    mark(levelButtons, (selectedLevel - 1) % chapterSize, takeFocus);
  }

  function show(next) {
    view = next;
    root.hidden = next === 'play';
    root.dataset.view = next;
    for (const [name, section] of Object.entries(screen)) section.hidden = name !== next;
    if (next !== 'play') {
      const heading = screen[next].querySelector('h2');
      root.setAttribute('aria-labelledby', heading.id);
      screen[next].append(notice);
    }
    message('');
    onView(next, coversBoard());
    if (next === 'title') renderSlots(true);
    else if (next === 'levels') renderLevels();
    else if (next === 'scores') renderScores(true);
    else if (next === 'pause') {
      text('game-pause-level', 'Lv ' + roundLevel + ' · ' + titles.get(roundLevel));
      command = 0;
      mark(pauseButtons, command, true);
      refreshActions();
    } else if (next === 'complete') {
      command = 0;
      mark(completionButtons.filter(button => !button.hidden), command, true);
    } else if (next === 'loading') focus($('game-loading-title'));
  }

  function coversBoard() {
    return view === 'title' || view === 'loading' || (view === 'levels' && levelReturn === 'title')
      || (view === 'scores' && scoresReturn === 'title');
  }

  function renderScores(takeFocus = false) {
    if (!scoresList) return;
    for (const [i, button] of scoreTabButtons.entries()) {
      const active = DIFFICULTIES[i] === scoresDifficulty;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('primary', active);
    }
    const board = getLeaderboard();
    const entries = board?.tables?.[scoresDifficulty] ?? [];
    if (!entries.length) {
      const li = document.createElement('li');
      li.className = 'scores-empty';
      li.textContent = `No ${scoresDifficulty} scores recorded yet. Complete levels to claim a spot!`;
      scoresList.replaceChildren(li);
    } else {
      scoresList.replaceChildren(...entries.map((entry, idx) => {
        const li = document.createElement('li');
        li.className = 'scores-row' + (idx < 3 ? ' top-rank' : '');
        li.append(
          part('span', 'scores-rank', '#' + (idx + 1)),
          part('span', 'scores-initials', entry.initials),
          part('span', 'scores-rating', entry.rating + ' · Slot ' + entry.slotLabel),
          part('span', 'scores-level', 'Lv ' + entry.highestLevel),
          part('strong', 'scores-points', points(entry.score)),
        );
        return li;
      }));
    }
    if (takeFocus) focus($('game-scores-back'));
  }

  function openScores(from, difficulty) {
    scoresReturn = from;
    scoresDifficulty = DIFFICULTIES.includes(difficulty) ? difficulty : (getSlot(selectedSlot)?.difficulty ?? 'Child');
    show('scores');
  }

  function stepScoresTab(offset) {
    const idx = Math.max(0, DIFFICULTIES.indexOf(scoresDifficulty));
    scoresDifficulty = DIFFICULTIES[(idx + offset + DIFFICULTIES.length) % DIFFICULTIES.length];
    renderScores(false);
  }

  function renderInitials() {
    for (let i = 0; i < initialButtons.length; i++) {
      initialButtons[i].textContent = initialsChars[i] ?? 'A';
    }
  }

  function levels(from) {
    levelReturn = from;
    selectedLevel = from === 'title' ? playableLevel(getSlot(selectedSlot)) : roundLevel;
    show('levels');
  }

  function startConfirm() {
    if (busy) return;
    confirming = true;
    command = 0;
    confirm.hidden = false;
    cards.inert = $('slot-actions').inert = true;
    text('slot-confirm-label', 'Erase all progress and settings in Slot ' + slotLabels[selectedSlot - 1] + '?');
    mark(confirmButtons, command, true);
  }

  function endConfirm() {
    confirming = false;
    confirm.hidden = true;
    cards.inert = $('slot-actions').inert = false;
    renderSlots(true);
  }

  for (let id = 1; id <= slotLabels.length; id++) {
    const button = makeButton('slot-card');
    button.dataset.slot = id;
    button.onfocus = () => selectSlot(id, false);
    button.onclick = () => selectSlot(id);
    slotButtons.push(button);
    cards.append(button);
  }
  for (let chapter = 0; chapter < chapterCount; chapter++) {
    const button = makeButton('');
    const first = chapter * chapterSize + 1;
    button.textContent = first + '–' + (first + chapterSize - 1);
    button.setAttribute('aria-label', 'Chapter ' + (chapter + 1) + ', levels ' + button.textContent);
    button.onclick = () => {
      if (!busy) {
        selectedLevel = first;
        renderLevels();
      }
    };
    chapterButtons.push(button);
    chapters.append(button);
  }
  const setting = name => {
    if (busy) return;
    const slot = getSlot(selectedSlot);
    const nextValue = name === 'difficulty' ? nextDifficulty(slot.difficulty)
      : name === 'players' ? (slot.players === 2 ? 1 : 2)
      : undefined;
    onSetting(selectedSlot, name, nextValue);
    if (view === 'title') renderSlots();
    else if (view === 'levels') renderLevels(false);
    else refreshActions();
  };
  $('slot-play').onclick = () => onPlay(selectedSlot, playableLevel(getSlot(selectedSlot)));
  $('slot-levels').onclick = () => levels('title');
  $('slot-hand').onclick = $('game-hand').onclick = () => setting('black');
  $('slot-sound').onclick = $('game-sound').onclick = () => setting('sound');
  $('slot-music').onclick = $('game-music').onclick = () => setting('music');
  $('slot-difficulty').onclick = $('game-difficulty').onclick = () => setting('difficulty');
  if ($('slot-players')) $('slot-players').onclick = () => setting('players');
  if ($('game-players')) $('game-players').onclick = () => setting('players');
  if (scoresTabs) {
    for (const diff of DIFFICULTIES) {
      const button = makeButton('');
      button.textContent = diff;
      button.onclick = () => { scoresDifficulty = diff; renderScores(false); };
      scoreTabButtons.push(button);
      scoresTabs.append(button);
    }
  }
  for (let i = 0; i < initialButtons.length; i++) {
    initialButtons[i].onclick = () => {
      initialsChars[i] = stepInitialChar(initialsChars[i], 1);
      renderInitials();
    };
  }
  if ($('game-record-score')) {
    $('game-record-score').onclick = () => {
      if (!result || scoreRecorded) return;
      const slot = getSlot(selectedSlot);
      const highestLevel = Math.max(result.level ?? 1, slot?.completedLevels?.at(-1) ?? 1);
      const saved = onRecordScore({
        initials: sanitizeInitials(initialsChars.join(''), 'AAA'),
        difficulty: result.difficulty ?? slot?.difficulty ?? 'Child',
        score: result.campaignTotal,
        highestLevel,
        slotLabel: slotLabels[selectedSlot - 1],
      });
      if (saved?.qualified) {
        scoreRecorded = true;
        text('game-initials-prompt', `Saved #${saved.rank} on ${saved.entry.difficulty} Top Scores!`);
        $('game-record-score').disabled = true;
        mark(completionButtons, command, true);
      }
    };
  }
  if ($('slot-scores')) $('slot-scores').onclick = () => openScores('title');
  if ($('game-pause-scores')) $('game-pause-scores').onclick = () => openScores('pause');
  if ($('game-complete-scores')) $('game-complete-scores').onclick = () => openScores('complete', result?.difficulty);
  if ($('game-scores-back')) $('game-scores-back').onclick = () => { if (!busy) show(scoresReturn); };
  $('slot-reset').onclick = startConfirm;
  $('slot-keep').onclick = endConfirm;
  $('slot-erase').onclick = () => { onReset(selectedSlot); endConfirm(); };
  $('slot-export').onclick = onExport;
  freePlay.onchange = () => setting('freePlay');
  $('game-level-back').onclick = () => { if (!busy) show(levelReturn); };
  $('game-resume').onclick = onResume;
  $('game-restart').onclick = $('game-replay').onclick = onRestart;
  $('game-pause-levels').onclick = () => levels('pause');
  $('game-complete-levels').onclick = () => levels('complete');
  $('game-save-slots').onclick = $('game-complete-slots').onclick = () => show('title');
  $('game-next').onclick = () => result.nextLevel ? onPlay(selectedSlot, result.nextLevel) : levels('complete');
  for (const buttons of [pauseButtons, completionButtons, confirmButtons]) {
    for (const [index, button] of buttons.entries()) button.onfocus = () => {
      command = index;
      mark(buttons, command, false);
    };
  }
  message('Loading levels…');
  refreshActions();
  updateControls();

  function navigate(direction) {
    if (view === 'title' && !confirming) {
      const diffBtn = $('slot-difficulty'), playersBtn = $('slot-players'), scoresBtn = $('slot-scores');
      const bottomRow = [diffBtn, playersBtn, scoresBtn].filter(Boolean);
      const rowIndex = bottomRow.indexOf(document.activeElement);
      if (rowIndex >= 0) {
        if (direction === 'up') focus(slotButtons[selectedSlot - 1]);
        else if (direction === 'right' && rowIndex + 1 < bottomRow.length) focus(bottomRow[rowIndex + 1]);
        else if (direction === 'left' && rowIndex > 0) focus(bottomRow[rowIndex - 1]);
        return;
      }
      const next = moveSlot(selectedSlot, direction, connected);
      if (direction === 'down' && selectedSlot >= 3 && next === selectedSlot) focus(diffBtn);
      else selectSlot(next);
    }
    else if (view === 'scores') {
      if (direction === 'left') stepScoresTab(-1);
      else if (direction === 'right') stepScoresTab(1);
      return;
    }
    else if (view === 'complete' && (initialButtons.includes(document.activeElement) || document.activeElement === $('game-record-score'))) {
      const saveBtn = $('game-record-score');
      if (document.activeElement === saveBtn) {
        if (direction === 'left' && initialButtons.length) focus(initialButtons.at(-1));
        else if (direction === 'down') mark(completionButtons, command, true);
        return;
      }
      const idx = initialButtons.indexOf(document.activeElement);
      if (direction === 'up') { initialsChars[idx] = stepInitialChar(initialsChars[idx], 1); renderInitials(); return; }
      if (direction === 'down') { initialsChars[idx] = stepInitialChar(initialsChars[idx], -1); renderInitials(); return; }
      if (direction === 'right') { focus(initialButtons[idx + 1] ?? saveBtn); return; }
      if (direction === 'left' && idx > 0) { focus(initialButtons[idx - 1]); return; }
      if (direction === 'left' && idx === 0) { mark(completionButtons, command, true); return; }
      return;
    }
    else if (view === 'levels') {
      const currentIndex = (selectedLevel - 1) % chapterSize;
      if (document.activeElement === freePlay) {
        if (direction === 'down') mark(levelButtons, currentIndex, true);
        return;
      }
      if (direction === 'up' && currentIndex < columns) {
        focus(freePlay);
        return;
      }
      const index = moveInGrid(currentIndex, direction, columns, chapterSize);
      selectedLevel = chapterOf(selectedLevel) * chapterSize + index + 1;
      mark(levelButtons, index, true);
    } else if (view === 'pause' || view === 'complete' || confirming) {
      if (view === 'complete' && direction === 'up' && command === 0 && !scoreRecorded && $('game-initials-box') && !$('game-initials-box').hidden && initialButtons.length) {
        focus(initialButtons[0]);
        return;
      }
      const buttons = confirming ? confirmButtons : view === 'pause' ? pauseButtons : completionButtons;
      const step = direction === 'up' || direction === 'left' ? -1 : 1;
      do { command = (command + step + buttons.length) % buttons.length; } while (buttons[command].hidden);
      mark(buttons, command, true);
    }
  }

  function changeChapter(offset) {
    selectedLevel = moveChapter(selectedLevel, offset);
    renderLevels();
  }

  function activate() {
    if (confirming) confirmButtons[command].click();
    else if (view === 'levels') {
      if (document.activeElement === freePlay) freePlay.click();
      else levelButtons[(selectedLevel - 1) % chapterSize].click();
    }
    else if (view === 'pause') pauseButtons[command].click();
    else if (view === 'complete') {
      const active = document.activeElement;
      if (initialButtons.includes(active) || active === $('game-record-score')) active.click();
      else completionButtons[command].click();
    } else if (view === 'scores') $('game-scores-back')?.click();
  }

  return {
    get view() { return view; },
    get boardVisible() { return !coversBoard(); },
    get slotId() { return selectedSlot; },
    selectSlot,
    setBusy,
    message,
    show,
    levels,
    scores: openScores,
    setScenes(scenes) {
      for (const [index, scene] of scenes.entries()) titles.set(scene.ordinal ?? index + 1, scene.title);
      renderSlots();
    },
    setConnected(value, family = null, count = value ? 1 : 0) {
      const nextFamily = value ? family : null;
      const nextCount = value ? Math.max(1, count) : 0;
      if (connected === value && padFamily === nextFamily && connectedCount === nextCount) return;
      connected = value;
      padFamily = nextFamily;
      connectedCount = nextCount;
      cards.dataset.layout = connected ? 'radial' : 'grid';
      refreshActions();
      updateControls();
    },
    setRound(level) { roundLevel = level; },
    complete(details) {
      result = details;
      text('game-complete-title', details.level === campaignLevels ? 'Victory' : 'Level Complete');
      text('game-complete-level', 'Lv ' + details.level + ' · ' + titles.get(details.level));
      const box2p = $('game-complete-2p');
      if (box2p) {
        const two = details.twoPlayer;
        box2p.hidden = !two;
        if (two) {
          const p1Hand = two.p1Hand ?? 'Gold';
          const p2Hand = two.p2Hand ?? 'Black';
          text('game-complete-winner', two.winner === 'tie' ? 'Tie Game!'
            : two.winner === 0 ? `Player 1 (${p1Hand}) Wins!`
            : `Player 2 (${p2Hand}) Wins!`);
          text('game-p1-label', `P1 (${p1Hand}) · ${two.player1.won ? 'Goal' : 'Out'}`);
          text('game-p2-label', `P2 (${p2Hand}) · ${two.player2.won ? 'Goal' : 'Out'}`);
          text('game-p1-summary', points(two.player1.levelTotal));
          text('game-p2-summary', points(two.player2.levelTotal));
        }
      }
      text('game-round-bonus', points(details.bonus));
      text('game-finish-bonus', points(details.completionBonus ?? completionBonus));
      $('game-time-row').hidden = !details.difficulty || details.difficulty === 'Child';
      text('game-time-bonus', points(details.timeBonus ?? 0));
      text('game-level-total', points(details.levelTotal));
      text('game-campaign-total', points(details.campaignTotal));
      text('game-skill-rating', ratingForScore(details.campaignTotal).title);
      const ratingBanner = $('game-rating-banner');
      if (ratingBanner) {
        ratingBanner.hidden = !details.ratingPromoted;
        if (details.ratingPromoted) {
          text('game-rating-title', 'Congratulations! New Rating: ' + details.ratingPromoted.title);
          text('game-rating-text', 'Because of your successes so far, keep up the good work!');
        }
      }
      const initialsBox = $('game-initials-box');
      if (initialsBox) {
        scoreRecorded = false;
        const showInitials = Boolean(details.qualifiesLeaderboard);
        initialsBox.hidden = !showInitials;
        if (showInitials) {
          const seed = sanitizeInitials(getLeaderboard()?.lastInitials, 'AAA').padEnd(3, 'A');
          initialsChars = [seed[0], seed[1], seed[2]];
          renderInitials();
          text('game-initials-prompt', 'New Top Score! Enter initials:');
          if ($('game-record-score')) $('game-record-score').disabled = false;
        }
      }
      text('game-score-delta', '+' + points(details.delta));
      $('game-score-delta').hidden = details.delta <= 0;
      text('game-next', details.nextLevel ? 'Next Level · Lv ' + details.nextLevel
        : details.level === campaignLevels ? 'Victory / Level Select' : 'Level Select');
      $('game-complete-levels').hidden = !details.nextLevel;
      show('complete');
    },
    key(event) {
      if (view === 'play') return false;
      if (busy) return event.code !== 'Tab';
      if (arrows[event.code]) navigate(arrows[event.code]);
      else if (view === 'levels' && (event.code === 'PageUp' || event.code === 'PageDown')) {
        changeChapter(event.code === 'PageUp' ? -1 : 1);
      } else if (!event.repeat && ((view === 'pause' && event.code === 'KeyP') || event.code === 'Escape')) {
        if (confirming) endConfirm();
        else if (view === 'pause') onResume();
        else if (view === 'levels') show(levelReturn);
        else if (view === 'scores') show(scoresReturn);
        else return false;
      } else if (view === 'complete' && initialButtons.includes(document.activeElement) && /^[A-Za-z0-9]$/.test(event.key ?? '')) {
        const idx = initialButtons.indexOf(document.activeElement);
        initialsChars[idx] = event.key.toUpperCase();
        renderInitials();
        if (idx + 1 < initialButtons.length) focus(initialButtons[idx + 1]);
        else focus($('game-record-score'));
      } else if (!event.repeat && view === 'complete' && event.code === 'KeyR') onRestart();
      else if (event.code === 'Enter') {
        if (event.repeat) return true;
        const focused = document.activeElement;
        if (view === 'title' && focused?.matches('.slot-card')) $('slot-play').click();
        else if (focused?.matches('button, input') && screen[view].contains(focused)) focused.click();
        else if (view === 'complete') $('game-next').click();
        else return false;
      } else if (event.code === 'Tab') {
        const available = Array.from(screen[view].querySelectorAll('button, input')).filter(node =>
          !node.disabled && !node.closest('[hidden], [inert]'));
        if (!available.length) return true;
        if (event.shiftKey && document.activeElement === available[0]) focus(available.at(-1));
        else if (!event.shiftKey && document.activeElement === available.at(-1)) focus(available[0]);
        else return false;
      } else return false;
      return true;
    },
    pad({direction, pressed}) {
      if (busy) return;
      if (direction) navigate(direction);
      if (view === 'title' && !confirming && pressed.swing &&
        [$('slot-difficulty'), $('slot-players'), $('slot-scores')].filter(Boolean).includes(document.activeElement)) {
        document.activeElement.click();
        return;
      }
      const action = menuPadAction(view, pressed, confirming);
      if (action === 'activate') activate();
      else if (action === 'previous' || action === 'next') navigate(action);
      else if (action === 'previous-chapter' || action === 'next-chapter') changeChapter(action === 'previous-chapter' ? -1 : 1);
      else if (action === 'previous-scores-tab' || action === 'next-scores-tab') stepScoresTab(action === 'previous-scores-tab' ? -1 : 1);
      else if (action) $(action).click();
    },
  };
}
