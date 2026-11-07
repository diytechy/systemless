"""Local reproducible queue classification; reads catalogue evidence only."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent
inventory = json.loads((ROOT / 'inventory.json').read_text(encoding='utf-8'))
queue_path = ROOT / 'queue.json'
previous = {row['slug']: row for row in json.loads(queue_path.read_text(encoding='utf-8-sig'))['games']} if queue_path.exists() else {}
aliases = {
    'ClockWerx Folder': ('clockwerx', 'ClockWerx'),
    'Koji the Frog': ('koji', 'Koji the Frog'),
    '2Del': ('koji', 'Koji the Frog'),
    'Delirium 1.1 Folder': ('delirium', 'Delirium'),
    'Bolo f': ('bolo', 'Bolo'), 'Bolo': ('bolo', 'Bolo'),
    'MacPipes ƒ': ('macpipes', 'MacPipes'),
    'Mantra v1.02 Folder': ('mantra', 'Mantra'),
    'Mantra II v1.02 ƒ': ('mantra-ii', 'Mantra II'),
    'DreamLight® Verttice™ 3.0 ƒ': ('verttice', 'DreamLight Verttice'),
    'Blobbo 1.0 Lite ƒ': ('blobbo', 'Blobbo'),
    'Blobbo1.0.1 Fullversion': ('blobbo', 'Blobbo'),
    'Zap\'T\'Balls v3.6': ('zap-t-balls', "Zap'T'Balls"),
    'Zap\'T\'Balls v7.1': ('zap-t-balls', "Zap'T'Balls"),
    'Gold Digger 1.3.0': ('gold-digger', 'Gold Digger'),
    'PactheMan4.5.1': ('pac-the-man', 'Pac the Man'),
    'New Ruckus!': ('ruckus', 'Ruckus'),
    'More ScruffyStuff': ('scruffy-ii', 'Scruffy II'),
    'FVoy Folder': ('fantastic-voyage', 'Fantastic Voyage'),
    'Star Trek TNG': ('star-trek-final-unity', 'Star Trek: A Final Unity'),
}
helpers = {
    'Gold Edit', 'Ruckus Manual', 'BMAPEdit 2.0.1', 'Bolo Finder',
    'Internet Bolo Buddy 1.0.1', 'Bolo Team App', 'PoPE 1.0', 'Blueprints',
    'Bonkreator', 'Chiral Basics', 'ScenMaker', 'FVoyage File Converter',
    'LemmingsCheat', 'Lemmings 1.4.2a patch', 'Blobbo 1.0->1.0.1 Lite patch',
}
games = {}
excluded = []
for volume in inventory['volumes']:
    for app in volume.get('applications', []):
        path = app['path']
        parts = path.split('/')
        base = parts[-1]
        reason = None
        if app.get('resource_types') == ['alis']:
            reason = 'Finder alias, not a separate executable'
        elif path.startswith('Trash/'):
            reason = 'Trash duplicate; not selected over an active copy'
        elif volume['source'] == 'Content\\Boot' and parts[0] not in ('Deliverance™ ƒ', 'Gold Digger 1.3.0'):
            reason = 'OS/utility/helper application, outside game queue'
        elif parts[0] == 'Marthon Tools':
            reason = 'Marathon editing tools; no Marathon game executable in this folder'
        elif base in helpers or re.search(r'register|registration|installer', base, re.I):
            reason = 'Auxiliary editor/manual/installer/registration application'
        if reason:
            excluded.append({'source': volume['source'], 'path': path, 'reason': reason})
            continue
        if parts[0] == 'Lemmings':
            slug, title = ('oh-no-more-lemmings', 'Oh No! More Lemmings') if base == 'Oh No! More Lemmings' else ('lemmings', 'Lemmings')
        else:
            slug, title = aliases.get(parts[0], (None, base))
            if slug is None:
                title = re.sub(r'\(FAT\)|\(256 Colors\)|\(Black & White\)| PPC', '', title).strip()
                slug = re.sub('[^a-z0-9]+', '-', title.lower()).strip('-')
        row = games.setdefault(slug, {'slug': slug, 'title': title, 'status': 'pending', 'candidates': [],
                                     'depth_size': 'unknown; verify per executable',
                                     'preferences_save_id': 'unassigned; no browser entry yet',
                                     'controls': 'unverified', 'timing': 'not yet measured'})
        candidate = {key: app.get(key) for key in ('path', 'architecture', 'version_strings', 'preferred_partition_bytes', 'data_sha256', 'resource_sha256')}
        candidate.update(source=volume['source'], configured=volume['configured'])
        row['candidates'].append(candidate)
excluded_non_appl = []
container_audit = []
for volume in inventory['volumes']:
    for item in volume.get('container_candidates', []):
        path = item['path']
        if path.startswith('Lemmings/ONML/'):
            associated = 'oh-no-more-lemmings' if '/Oh No! More Lemmings/' in path else 'lemmings'
            reason = 'Original disk-image variant/content for the queued Lemmings title; not a new family'
        elif path == 'Gold_Digger_1.3.0.sit':
            associated, reason = 'gold-digger', 'Archive for an already queued title; contents/version not independently checked'
        elif path == 'Trash/Koji_the_Frog.SIT':
            associated, reason = 'koji', 'Trash archive variant, version unverified; preserve without replacing current2.0.4/save identity'
        elif '/Recent Items/' in path:
            associated, reason = None, 'Zero-data Recent Items reference, not a selected archive payload'
        else:
            associated, reason = None, 'Runtime/tool/tutorial container by source location/name; not identified as a game'
        record = dict(item, source=volume['source'], associated_game=associated, classification=reason)
        container_audit.append(record)
        if associated in games:
            games[associated].setdefault('associated_containers', []).append(record)
    for app in volume.get('non_appl_program_candidates', []):
        if app['path'].startswith('Desk Invaders II'):
            row = games.setdefault('desk-invaders-ii', {'slug':'desk-invaders-ii','title':'Desk Invaders II','status':'pending','candidates':[],
                'depth_size':'unknown; desk-accessory requirements to verify','preferences_save_id':'unassigned; no browser entry','controls':'unverified','timing':'not yet measured'})
            candidate = {key: app.get(key) for key in ('path','architecture','version_strings','preferred_partition_bytes','data_sha256','resource_sha256','finder_type','resource_types','program_kind')}
            candidate.update(source=volume['source'],configured=volume['configured'])
            row['candidates'].append(candidate)
        else:
            excluded_non_appl.append({'source':volume['source'],'path':app['path'],'reason':'System/utility desk accessory; not classified as a game'})
first = ['clockwerx', 'koji', 'delirium']
queue = [games[k] for k in first] + [games[k] for k in sorted(games) if k not in first]
for row in queue:
    if row['slug'] in first:
        row['depth_size'] = '640x480, ' + ('4-bit' if row['slug'] == 'delirium' else '8-bit')
        row['preferences_save_id'] = {'clockwerx': 'clockwerx-personal-10; ClockWerx Scores/Settings', 'koji': 'koji-personal-204; Koji 2.0 Registration/Koji Registration', 'delirium': 'delirium-personal-11; Delirium 1.1 Preferences'}[row['slug']]
    if row['slug'] in previous:
        for field in ('status', 'timing', 'report', 'accepted_setting', 'review', 'depth_size', 'preferences_save_id', 'controls'):
            if field in previous[row['slug']]:
                row[field] = previous[row['slug']][field]
result = {'schema': 1, 'games': queue, 'excluded_applications': excluded,
          'excluded_non_application_programs': excluded_non_appl,
          'container_audit': container_audit,
          'disc_note': 'Configured Star Trek disc catalogue has an out-of-bounds partition; its game executable was separately found on 002. No disc content silently inferred.'}
queue_path.write_text(json.dumps(result, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
lines = ['# Inventory and sequential queue', '',
         'Read-only catalogue evidence, 2026-11-07. All nine disk images and the configured disc were hashed before/after with equal hashes. No source mounted or modified. APPL/Finder type and CODE/cfrg establish candidate architecture, not runtime compatibility. Boot Recent Items are aliases; helpers and Trash copies are explicitly classified in queue.json. Unconfigured 005/007/008 were inspected as supplementary media.', '',
         'Default depth, required sibling resources, preferences and controls for unprepared games remain unverified until their worker inspects the title. Resource version strings can include library versions; workers must resolve ambiguity. Absence of a browser route is preparation work, not proof of incompatibility. The coverage audit also records container-like files, top-level folders and non-APPL desk accessories; Desk Invaders II is queued separately rather than omitted for lacking APPL type.', '',
         f'{len(queue)} game families; alternate versions/architectures remain listed under their individual title. {len(excluded)} auxiliary/alias/utility APPL entries excluded with reasons. Configured Star Trek disc has a partition-boundary error, preserved in inventory.json.', '',
         '| Order | Title | Sources / executable candidates | Architecture evidence | Status |', '|---:|---|---|---|---|']
for i, row in enumerate(queue, 1):
    candidates = '<br>'.join(c['source'] + ': ' + c['path'] for c in row['candidates'])
    arches = ', '.join(sorted({c['architecture'] for c in row['candidates']}))
    lines.append(f"| {i} | {row['title']} | {candidates} | {arches} | {row['status']} |")
(ROOT / 'inventory-and-queue.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
print(len(queue), 'game families;', len(excluded), 'excluded APPL entries')
print('\n'.join(f"{i+1}: {row['slug']} ({len(row['candidates'])} candidates)" for i, row in enumerate(queue)))
