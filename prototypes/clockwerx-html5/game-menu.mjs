import {isLevelUnlocked, slotLabels, slotSummary} from './progress.mjs';

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

export function completionDetails(level, bonus, oldCampaign, newCampaign, nextAvailable) {
  return {
    level, bonus, levelTotal: bonus + completionBonus, campaignTotal: newCampaign,
    delta: newCampaign - oldCampaign,
    nextLevel: level < campaignLevels && nextAvailable ? level + 1 : null,
  };
}

export function menuPadAction(view, pressed, confirming = false) {
  if (view === 'title' && !confirming) {
    if (pressed.levels) return 'slot-reset';
    if (pressed.swing) return 'slot-play';
    if (pressed.flip) return 'slot-levels';
    if (pressed.reverse) return 'slot-hand';
    if (pressed.bounce) return 'slot-sound';
    if (pressed.pause) return 'previous';
    if (pressed.restart) return 'next';
  }
  if (view === 'title' && confirming) {
    if (pressed.levels || pressed.bounce) return 'slot-keep';
    if (pressed.swing) return 'activate';
  }
  if (view === 'levels') {
    if (pressed.levels || pressed.bounce) return 'game-level-back';
    if (pressed.swing) return 'activate';
    if (pressed.flip) return 'previous-chapter';
    if (pressed.reverse) return 'next-chapter';
  }
  if (view === 'pause') {
    if (pressed.pause || pressed.bounce) return 'game-resume';
    if (pressed.levels) return 'game-pause-levels';
    if (pressed.swing) return 'activate';
  }
  if (view === 'complete') {
    if (pressed.levels) return 'game-complete-levels';
    if (pressed.restart) return 'game-replay';
    if (pressed.swing) return 'game-next';
    if (pressed.pause) return 'game-complete-slots';
  }
  return null;
}

export function createGameMenu({root, getSlot, onView, onPlay, onResume, onRestart, onSetting, onReset, onExport}) {
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
  let levelButtons = [];
  let view = 'title', levelReturn = 'title', selectedSlot = 1, selectedLevel = 1, roundLevel = 1;
  let needleAngle = 0, connected = false, busy = false, confirming = false, command = 0, result;

  const focus = node => node?.focus({preventScroll: true});
  const text = (id, value) => { $(id).textContent = value; };

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
    $('slot-controls').hidden = !connected;
    text('game-level-controls', connected ? 'Stick / D-pad choose · A play · X / Y change chapter · B back'
      : 'Arrows choose · Enter play · PgUp / PgDn change chapter');
    text('game-replay', connected ? 'Replay Level · R2' : 'Replay Level · R');
    text('game-complete-levels', connected ? 'Level Select · Start' : 'Level Select');
    text('game-complete-slots', connected ? 'Save Slots · R1' : 'Save Slots');
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
    text('game-hand', $('slot-hand').textContent);
    text('game-sound', $('slot-sound').textContent);
  }

  function renderSlots(takeFocus = false) {
    for (const [i, button] of slotButtons.entries()) {
      const slot = getSlot(i + 1);
      const summary = slotSummary(slot, campaignLevels);
      const level = playableLevel(slot);
      const title = titles.get(level);
      const detail = summary.started ? 'Lv ' + level + (title ? ' · ' + title : '') : 'Empty Slot';
      const saved = summary.updatedUtc ? lastPlayed.format(new Date(summary.updatedUtc)) : '—';
      button.replaceChildren(
        part('span', 'slot-roman', summary.label), part('span', 'slot-level', detail),
        part('span', 'slot-progress', summary.cleared + ' / ' + summary.totalLevels),
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
    selectedSlot = id;
    highlightSlot(takeFocus);
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
    return view === 'title' || view === 'loading' || (view === 'levels' && levelReturn === 'title');
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
    onSetting(selectedSlot, name);
    if (view === 'title') renderSlots();
    else if (view === 'levels') renderLevels(false);
    else refreshActions();
  };
  $('slot-play').onclick = () => onPlay(selectedSlot, playableLevel(getSlot(selectedSlot)));
  $('slot-levels').onclick = () => levels('title');
  $('slot-hand').onclick = $('game-hand').onclick = () => setting('black');
  $('slot-sound').onclick = $('game-sound').onclick = () => setting('sound');
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
    if (view === 'title' && !confirming) selectSlot(moveSlot(selectedSlot, direction, connected));
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
    setScenes(scenes) {
      for (const [index, scene] of scenes.entries()) titles.set(scene.ordinal ?? index + 1, scene.title);
      renderSlots();
    },
    setConnected(value) {
      if (connected === value) return;
      connected = value;
      cards.dataset.layout = connected ? 'radial' : 'grid';
      updateControls();
    },
    setRound(level) { roundLevel = level; },
    complete(details) {
      result = details;
      text('game-complete-title', details.level === campaignLevels ? 'Victory' : 'Level Complete');
      text('game-complete-level', 'Lv ' + details.level + ' · ' + titles.get(details.level));
      text('game-round-bonus', points(details.bonus));
      text('game-finish-bonus', points(completionBonus));
      text('game-level-total', points(details.levelTotal));
      text('game-campaign-total', points(details.campaignTotal));
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
        else return false;
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
      if (direction && view !== 'complete') navigate(direction);
      const action = menuPadAction(view, pressed, confirming);
      if (action === 'activate') activate();
      else if (action === 'previous' || action === 'next') navigate(action);
      else if (action === 'previous-chapter' || action === 'next-chapter') changeChapter(action === 'previous-chapter' ? -1 : 1);
      else if (action) $(action).click();
    },
  };
}
