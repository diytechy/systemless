import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canShowSideControls,
  chapterOf,
  completionDetails,
  createGameMenu,
  levelMechanicCues,
  menuPadAction,
  moveChapter,
  moveInGrid,
  moveSlot,
  sideControlsSpec,
} from './game-menu.mjs';

test('the clock face maps four compass points and shoulder steps wrap', () => {
  assert.deepEqual(['up', 'right', 'down', 'left'].map(direction => moveSlot(2, direction, true)), [1, 2, 3, 4]);
  assert.equal(moveSlot(1, 'previous', true), 4);
  assert.equal(moveSlot(4, 'next', true), 1);
  assert.equal(moveSlot(3, 'previous', true), 2);
});

test('grid navigation moves one column or row and stays within the row edges', () => {
  assert.equal(moveSlot(1, 'right', false), 2);
  assert.equal(moveSlot(2, 'right', false), 2);
  assert.equal(moveSlot(2, 'down', false), 4);
  assert.equal(moveSlot(4, 'left', false), 3);
  assert.equal(moveSlot(3, 'up', false), 1);
  assert.equal(moveInGrid(3, 'down', 5, 10), 8);
  assert.equal(moveInGrid(8, 'up', 5, 10), 3);
  assert.equal(moveInGrid(4, 'right', 5, 10), 4);
  assert.equal(moveInGrid(5, 'left', 5, 10), 5);
  assert.equal(moveInGrid(9, 'down', 5, 10), 9);
});

test('chapter jumps preserve the tile position and clamp at the ends of the campaign', () => {
  assert.equal(chapterOf(10), 0);
  assert.equal(chapterOf(11), 1);
  assert.equal(chapterOf(100), 9);
  assert.equal(moveChapter(4, 1), 14);
  assert.equal(moveChapter(14, -1), 4);
  assert.equal(moveChapter(8, -1), 8);
  assert.equal(moveChapter(90, 1), 100);
  assert.equal(moveChapter(97, 1), 97);
});

test('controller buttons resolve to the actions of their current screen', () => {
  assert.equal(menuPadAction('title', {swing: true}), 'slot-play');
  assert.equal(menuPadAction('title', {flip: true}), 'slot-levels');
  assert.equal(menuPadAction('title', {bounce: true}), 'slot-hand');
  assert.equal(menuPadAction('title', {reverse: true}), 'slot-sound');
  assert.equal(menuPadAction('title', {pause: true}), 'previous');
  assert.equal(menuPadAction('title', {restart: true}), 'next');
  assert.equal(menuPadAction('title', {levels: true}), 'slot-reset');
  assert.equal(menuPadAction('title', {levels: true}, true), 'slot-keep');
  assert.equal(menuPadAction('title', {reverse: true}, true), 'slot-keep');
  assert.equal(menuPadAction('title', {swing: true}, true), 'activate');
  assert.equal(menuPadAction('title', {flip: true}, true), null);
  assert.equal(menuPadAction('levels', {swing: true}), 'activate');
  assert.equal(menuPadAction('levels', {flip: true}), 'previous-chapter');
  assert.equal(menuPadAction('levels', {bounce: true}), 'next-chapter');
  assert.equal(menuPadAction('levels', {reverse: true}), 'game-level-back');
  assert.equal(menuPadAction('levels', {levels: true}), 'game-level-back');
  assert.equal(menuPadAction('pause', {pause: true}), 'game-resume');
  assert.equal(menuPadAction('pause', {reverse: true}), 'game-resume');
  assert.equal(menuPadAction('pause', {swing: true}), 'activate');
  assert.equal(menuPadAction('complete', {swing: true}), 'activate');
  assert.equal(menuPadAction('complete', {restart: true}), null);
  assert.equal(menuPadAction('complete', {levels: true}), null);
  assert.equal(menuPadAction('complete', {pause: true}), null);
  for (const view of ['title', 'levels', 'pause', 'complete', 'play', 'loading']) {
    assert.equal(menuPadAction(view, {}), null);
  }
});

test('completion plaque reports round points separately from the campaign improvement', () => {
  assert.deepEqual(completionDetails(99, 3000, 40000, 42000, true), {
    level: 99, bonus: 3000, levelTotal: 4000, campaignTotal: 42000, delta: 2000, nextLevel: 100,
  });
  const final = completionDetails(100, 3000, 42000, 42000, true);
  assert.equal(final.delta, 0);
  assert.equal(final.nextLevel, null);
  assert.equal(completionDetails(1, 0, 0, 1000, false).nextLevel, null);
});

test('completion plaque navigates with D-pad/stick and activates highlighted command with Cross/A', () => {
  const byId = new Map();
  let activeElement = null;
  function makeNode(tag, id = '') {
    const attrs = new Map();
    const classes = new Set();
    const node = {
      tagName: tag.toUpperCase(),
      id,
      hidden: false,
      disabled: false,
      inert: false,
      textContent: '',
      dataset: {},
      style: {setProperty() {}},
      children: [],
      classList: {toggle(name, force) { force ? classes.add(name) : classes.delete(name); }},
      setAttribute(k, v) { attrs.set(k, String(v)); },
      getAttribute(k) { return attrs.get(k); },
      hasAttribute(k) { return attrs.has(k); },
      toggleAttribute(k, force) {
        const next = force === undefined ? !attrs.has(k) : Boolean(force);
        next ? attrs.set(k, '') : attrs.delete(k);
        return next;
      },
      focus() { activeElement = node; node.onfocus?.(); },
      click() { if (!node.disabled) node.onclick?.(); },
      append(...items) { node.children.push(...items); },
      replaceChildren(...items) { node.children = [...items]; },
      contains(other) { return other === node || node.children.some(c => c.contains?.(other)); },
      querySelector(sel) {
        if (sel === 'h2') return node.children.find(c => c.tagName === 'H2') ?? makeNode('h2');
        return null;
      },
      querySelectorAll(sel) {
        if (sel === '[data-screen]') return node.children.filter(c => 'screen' in c.dataset);
        if (sel === 'button') return Array.from(byId.values()).filter(n => n.tagName === 'BUTTON');
        return [];
      },
    };
    if (id) byId.set(id, node);
    return node;
  }

  globalThis.document = {
    get activeElement() { return activeElement; },
    getElementById: id => byId.get(id),
    createElement: tag => makeNode(tag),
  };

  try {
    const root = makeNode('div', 'game-overlay');
    const titleSection = makeNode('section', 'game-title-screen');
    titleSection.dataset.screen = 'title';
    titleSection.append(makeNode('h2', 'game-title'));
    const completeSection = makeNode('section', 'game-complete-screen');
    completeSection.dataset.screen = 'complete';
    completeSection.append(makeNode('h2', 'game-complete-title'));
    const pauseSection = makeNode('section', 'game-pause-screen');
    pauseSection.dataset.screen = 'pause';
    pauseSection.append(makeNode('h2', 'game-pause-title'));
    const levelsSection = makeNode('section', 'game-level-screen');
    levelsSection.dataset.screen = 'levels';
    levelsSection.append(makeNode('h2', 'game-level-title'));
    const loadingSection = makeNode('section', 'game-loading');
    loadingSection.dataset.screen = 'loading';
    loadingSection.append(makeNode('h2', 'game-loading-title'));
    root.append(titleSection, levelsSection, pauseSection, completeSection, loadingSection);

    for (const id of [
      'game-slots', 'game-level-grid', 'game-free-play', 'game-chapters', 'game-menu-status',
      'slot-confirm', 'slot-keep', 'slot-erase', 'slot-play', 'slot-levels', 'slot-hand', 'slot-sound',
      'slot-music', 'slot-difficulty', 'slot-players', 'slot-reset', 'slot-export', 'slot-controls', 'slot-confirm-label', 'game-level-back',
      'game-level-controls', 'game-pause-level', 'game-complete-level', 'game-complete-2p', 'game-complete-winner',
      'game-p1-label', 'game-p2-label', 'game-p1-summary', 'game-p2-summary', 'game-round-bonus',
      'game-finish-bonus', 'game-time-row', 'game-time-bonus', 'game-level-total', 'game-campaign-total', 'game-score-delta',
      'game-complete-controls',
    ]) makeNode(id === 'game-free-play' ? 'input' : id.includes('slot-') || id.includes('game-level-back') ? 'button' : 'div', id);

    const pauseActions = makeNode('div', 'pause-actions');
    const pauseButtons = ['game-resume', 'game-restart', 'game-pause-levels', 'game-sound', 'game-music', 'game-hand', 'game-difficulty', 'game-players', 'game-save-slots'].map(id => makeNode('button', id));
    pauseActions.append(...pauseButtons);
    pauseActions.querySelectorAll = () => pauseButtons;

    const completeActions = makeNode('div', 'complete-actions');
    const completeButtons = ['game-next', 'game-replay', 'game-complete-levels', 'game-complete-slots'].map(id => makeNode('button', id));
    completeActions.append(...completeButtons);
    completeActions.querySelectorAll = () => completeButtons;

    let restarted = 0;
    const played = [];
    const slotState = {started: false, currentLevel: 1, completedLevels: [], bestLevelScores: {}, campaignScore: 0, black: false, sound: true, music: true, freePlay: false};
    const settingsToggled = [];
    const menu = createGameMenu({
      root,
      getSlot: () => slotState,
      onView() {},
      onPlay: (slot, level) => played.push([slot, level]),
      onResume() {},
      onRestart: () => restarted++,
      onSetting(slot, name, value) { settingsToggled.push([slot, name]); slotState[name] = value ?? !slotState[name]; },
      onReset() {},
      onExport() {},
    });

    assert.equal(byId.get('slot-music').textContent, 'Music: On');
    assert.equal(byId.get('game-music').textContent, 'Music: On');
    byId.get('slot-music').click();
    assert.deepEqual(settingsToggled, [[1, 'music']]);
    assert.equal(byId.get('slot-music').textContent, 'Music: Off');
    assert.equal(byId.get('game-music').textContent, 'Music: Off');

    menu.setScenes([{ordinal: 1, title: 'Movement'}, {ordinal: 2, title: 'Two'}]);
    menu.setConnected(true, 'playstation');
    assert.equal(byId.get('game-complete-controls').hidden, false);
    assert.equal(byId.get('game-complete-controls').textContent, 'Stick / D-pad choose · ✕ select');
    assert.equal(byId.get('game-replay').textContent, 'Replay Level');
    assert.equal(byId.get('game-complete-levels').textContent, 'Level Select');
    assert.equal(byId.get('game-complete-slots').textContent, 'Save Slots');

    menu.complete({level: 1, bonus: 500, levelTotal: 1500, campaignTotal: 1500, delta: 1500, nextLevel: 2});
    assert.equal(byId.get('game-next').hasAttribute('data-selected'), true);
    menu.pad({direction: 'down', pressed: {}});
    assert.equal(byId.get('game-replay').hasAttribute('data-selected'), true);
    menu.pad({pressed: {swing: true}});
    assert.equal(restarted, 1);

    // Navigate down to Save Slots and activate.
    menu.complete({level: 1, bonus: 500, levelTotal: 1500, campaignTotal: 1500, delta: 1500, nextLevel: 2});
    menu.pad({direction: 'down', pressed: {}});
    menu.pad({direction: 'down', pressed: {}});
    menu.pad({direction: 'down', pressed: {}});
    assert.equal(byId.get('game-complete-slots').hasAttribute('data-selected'), true);
    menu.pad({pressed: {swing: true}});
    assert.equal(menu.view, 'title');

    menu.pad({direction: 'down', pressed: {}});
    menu.pad({direction: 'down', pressed: {}});
    assert.equal(document.activeElement.id, 'slot-difficulty');
    for (const difficulty of ['Easy', 'Medium', 'Hard', 'Child']) {
      menu.pad({pressed: {swing: true}});
      assert.equal(slotState.difficulty, difficulty);
      assert.equal(byId.get('slot-difficulty').textContent, 'Difficulty: ' + difficulty);
    }
    menu.show('pause');
    byId.get('game-difficulty').click();
    assert.equal(slotState.difficulty, 'Easy');
    menu.complete(completionDetails(2, 1000, 1500, 7800, true, {difficulty: 'Easy', remainingTime: 18.9}));
    assert.equal(byId.get('game-time-row').hidden, false);
    assert.equal(byId.get('game-finish-bonus').textContent, '5,000 pts');
    assert.equal(byId.get('game-time-bonus').textContent, '1,800 pts');

    // On level 100 (nextLevel null), Level Select button is hidden and skipped by navigation.
    menu.complete({level: 100, bonus: 0, levelTotal: 1000, campaignTotal: 50000, delta: 0, nextLevel: null});
    assert.equal(byId.get('game-complete-levels').hidden, true);
    assert.equal(byId.get('game-time-row').hidden, true);
    assert.equal(byId.get('game-complete-2p').hidden, true);
    menu.pad({direction: 'down', pressed: {}});
    menu.pad({direction: 'down', pressed: {}});
    assert.equal(byId.get('game-complete-slots').hasAttribute('data-selected'), true);
    assert.equal(played.length, 0);

    // 2P players toggle, 2-pad indicator, and 2P completion plaque breakdown.
    menu.setConnected(true, 'playstation', 2);
    menu.show('title');
    assert.equal(byId.get('slot-players').textContent, 'Players: 1P (2 Pads)');
    menu.pad({direction: 'down', pressed: {}});
    menu.pad({direction: 'down', pressed: {}});
    menu.pad({direction: 'right', pressed: {}});
    assert.equal(document.activeElement.id, 'slot-players');
    menu.pad({pressed: {swing: true}});
    assert.equal(slotState.players, 2);
    assert.equal(byId.get('slot-players').textContent, 'Players: 2P (2 Pads)');
    menu.complete({
      level: 2, bonus: 1000, levelTotal: 6000, campaignTotal: 12000, delta: 6000, nextLevel: 3,
      difficulty: 'Easy', completionBonus: 5000, timeBonus: 0,
      twoPlayer: {
        winner: 1, p1Hand: 'Gold', p2Hand: 'Black',
        player1: {won: false, died: true, levelTotal: 1000},
        player2: {won: true, died: false, levelTotal: 6000},
      },
    });
    assert.equal(byId.get('game-complete-2p').hidden, false);
    assert.equal(byId.get('game-complete-winner').textContent, 'Player 2 (Black) Wins!');
    assert.equal(byId.get('game-p1-label').textContent, 'P1 (Gold) · Out');
    assert.equal(byId.get('game-p2-label').textContent, 'P2 (Black) · Goal');
  } finally {
    delete globalThis.document;
  }
});

test('levelMechanicCues hides cues on Level 1 Movement and summarizes active mechanics elsewhere', () => {
  assert.deepEqual(levelMechanicCues({ordinal: 1, title: 'Movement', spikes: [{id: 0}], dots: [{ring: true}]}), []);
  assert.deepEqual(levelMechanicCues({title: 'Movement', walls: [{id: 0}]}), []);
  assert.deepEqual(levelMechanicCues({
    ordinal: 15,
    title: 'Chaos',
    spikes: [{id: 0}],
    walls: [{id: 0}],
    doors: [{id: 0}],
    puddles: [{id: 0}],
    teleportRules: true,
    elevatorRules: true,
    bombRules: true,
    gunTriggerProjectileRules: true,
    dots: [{waystation: true}, {ring: true}],
  }), [
    'Spikes',
    'Walls',
    'Doors',
    'Oil',
    'Teleports',
    'Elevators',
    'Bombs & Matches',
    'Guns & Triggers',
    'Checkpoints',
    'Bonus Rings',
  ]);
  assert.deepEqual(levelMechanicCues({ordinal: 2, title: 'Plain', dots: [{kind: 'dot'}]}), []);
});

test('sideControlsSpec formats PlayStation, Xbox, generic controller, and Keyboard & Mouse panels', () => {
  const ps = sideControlsSpec('playstation', ['Spikes', 'Walls']);
  assert.equal(ps.modeLabel, 'PlayStation');
  assert.deepEqual(ps.rows.map(r => r.keys), ['✕', '□', '○', '△']);
  assert.deepEqual(ps.cues, ['Spikes', 'Walls']);

  const xb = sideControlsSpec('xbox', []);
  assert.equal(xb.modeLabel, 'Xbox');
  assert.deepEqual(xb.rows.map(r => r.keys), ['A', 'X', 'B', 'Y']);

  const km = sideControlsSpec('keyboard-mouse', ['Teleports']);
  assert.equal(km.modeLabel, 'Keyboard & Mouse');
  assert.deepEqual(km.rows.map(r => r.keys), ['Space · D · L-Click', 'L-Shift · X · L+R Click', 'W · C · R-Click', 'Z']);
  assert.deepEqual(km.cues, ['Teleports']);

  const twoPads = sideControlsSpec('playstation', [], 2, 2);
  assert.equal(twoPads.modeLabel, '2P · Dual Controllers');
  assert.equal(twoPads.rows[0].keys, 'P1 / P2: ✕');
  const twoKeys = sideControlsSpec('keyboard-mouse', ['Walls'], 2, 0);
  assert.equal(twoKeys.modeLabel, '2P · Keyboard');
  assert.match(twoKeys.rows[0].keys, /P2: Enter/);
});

test('canShowSideControls only shows on widescreen game-mode desktop play without overlapping the 4:3 canvas', () => {
  assert.equal(canShowSideControls({gameMode: true, playLayout: false, view: 'play', viewportWidth: 1920, viewportHeight: 1080}), true);
  assert.equal(canShowSideControls({gameMode: true, playLayout: false, view: 'play', viewportWidth: 1600, viewportHeight: 900}), true);
  assert.equal(canShowSideControls({gameMode: true, playLayout: false, view: 'play', viewportWidth: 1280, viewportHeight: 720}), false);
  assert.equal(canShowSideControls({gameMode: true, playLayout: false, view: 'play', viewportWidth: 1024, viewportHeight: 768}), false);
  assert.equal(canShowSideControls({gameMode: true, playLayout: false, view: 'play', viewportWidth: 800, viewportHeight: 1200}), false);
  assert.equal(canShowSideControls({gameMode: true, playLayout: true, view: 'play', viewportWidth: 1920, viewportHeight: 1080}), false);
  assert.equal(canShowSideControls({gameMode: true, playLayout: false, view: 'pause', viewportWidth: 1920, viewportHeight: 1080}), false);
  assert.equal(canShowSideControls({gameMode: false, playLayout: false, view: 'play', viewportWidth: 1920, viewportHeight: 1080}), false);
});
