# Catalog inventory and coverage

The coordinator inspected the decoded inventory of all **100 catalog levels in play order**, independently verified their resource hashes and EOF boundaries, and recorded their required source classes. The 20 unlisted resource blocks remain separate in `queue.json`. This table is a **data inventory**, not a claim that all levels are playable or visually reviewed. The active implementation/qualification queue is still at Spikes (ordinal 2).

Dots column is present / bonus / goal. Objects show source class code and count; abbreviations are retained where behavior has not yet been qualified. Actor/program/text column is WA actors / WP programs / inline dot programs / TX text records. A program existing in the resource does not mean an actor uses it: Spikes contains two unused WP programs with negative actor references. New classes means first occurrence in catalog order, not first tutorial introduction of a named mechanic.

| # | Level | RND2 ID | Dots / bonus / goal | Other object records | Actors / programs / inline / text | First source-class occurrence |
|---:|---|---:|---|---|---|---|
| 1 | Movement | 151 | 39 / 10 / 1 |  | 5 / 3 / 0 / 22 | WP, WA, TX |
| 2 | Spikes | 221 | 51 / 8 / 1 | SP:11 | 4 / 2 / 0 / 4 | SP |
| 3 | Walls | 222 | 62 / 9 / 1 | SP:2, WL:12 | 6 / 3 / 0 / 5 | WL |
| 4 | Doors | 223 | 58 / 9 / 1 | SP:3, WL:4, DR:3, DS:3 | 3 / 6 / 0 / 12 | DR, DS |
| 5 | Oil | 224 | 50 / 9 / 1 | SP:1, PU:3 | 2 / 5 / 0 / 9 | PU |
| 6 | Combo | 225 | 53 / 5 / 1 | SP:4, WL:14, PU:1 | 4 / 6 / 0 / 2 | reuses classes |
| 7 | More Spikes | 226 | 62 / 11 / 1 | SP:6 | 4 / 12 / 0 / 7 | reuses classes |
| 8 | More Doors | 227 | 57 / 9 / 1 | WL:9, DR:3, DS:6 | 2 / 7 / 0 / 4 | reuses classes |
| 9 | Some Dots | 11330 | 74 / 7 / 1 | SP:1, DR:1, DS:1, PU:2, WY:2 | 4 / 2 / 0 / 8 | WY |
| 10 | Bombs | 10963 | 88 / 0 / 1 | SP:2, WL:3, PU:2, BO:8, GO:2 | 5 / 3 / 0 / 4 | BO, GO |
| 11 | Curves | 154 | 42 / 7 / 1 | WY:2 | 8 / 2 / 0 / 0 | reuses classes |
| 12 | Homer | 210 | 25 / 5 / 1 |  | 8 / 3 / 0 / 0 | reuses classes |
| 13 | Touchdown | 1000 | 28 / 6 / 1 | SP:2, WL:6, DR:2, DS:2 | 6 / 4 / 0 / 0 | reuses classes |
| 14 | Tenacity | 1001 | 88 / 15 / 1 | SP:5, WL:9, DR:3, DS:4, GO:3, WY:1 | 8 / 4 / 0 / 0 | reuses classes |
| 15 | Ramble | 179 | 54 / 19 / 1 | WL:13 | 7 / 6 / 0 / 0 | reuses classes |
| 16 | Sparse | 171 | 29 / 8 / 1 | WL:1 | 9 / 6 / 0 / 0 | reuses classes |
| 17 | Pipeline | 1003 | 73 / 15 / 1 | WY:1 | 19 / 7 / 0 / 0 | reuses classes |
| 18 | Offshoots | 217 | 65 / 13 / 1 | GO:4, WY:2 | 18 / 11 / 0 / 0 | reuses classes |
| 19 | Link | 193 | 76 / 12 / 1 | WL:12, DR:6, DS:4, GO:5, WY:1 | 11 / 5 / 0 / 0 | reuses classes |
| 20 | Balance | 209 | 59 / 16 / 1 | SP:6, WL:3, DR:4, DS:1, WY:1 | 10 / 7 / 0 / 0 | reuses classes |
| 21 | Doubleback | 144 | 69 / 4 / 1 |  | 7 / 4 / 0 / 0 | reuses classes |
| 22 | Motion | 5009 | 87 / 7 / 1 | WL:8 | 12 / 6 / 0 / 0 | reuses classes |
| 23 | Candycane | 148 | 79 / 7 / 1 | EL:1 | 27 / 6 / 0 / 0 | EL |
| 24 | Forced Entry | 165 | 54 / 14 / 1 | WL:9, BO:17 | 11 / 3 / 0 / 0 | reuses classes |
| 25 | Tricolor | 199 | 56 / 11 / 1 |  | 20 / 11 / 0 / 0 | reuses classes |
| 26 | Cyclone | 159 | 38 / 9 / 1 | BO:21 | 18 / 5 / 0 / 0 | reuses classes |
| 27 | Prosperity | 196 | 59 / 30 / 1 | SP:7, BO:56, GO:4 | 16 / 4 / 0 / 0 | reuses classes |
| 28 | Enclosure | 203 | 88 / 30 / 1 | SP:1, WL:9, DR:3, DS:3, BO:18, WY:1 | 18 / 7 / 0 / 0 | reuses classes |
| 29 | Crossing | 5002 | 62 / 3 / 1 | SP:21, BO:39, WY:1 | 14 / 11 / 0 / 0 | reuses classes |
| 30 | Labyrinth | 5001 | 88 / 9 / 1 | SP:2, WL:12, DR:8, DS:8, BO:9, WY:2 | 20 / 14 / 0 / 0 | reuses classes |
| 31 | Hallway | 169 | 69 / 12 / 1 | WL:5, PU:2, WY:1 | 7 / 4 / 0 / 0 | reuses classes |
| 32 | Sentry | 202 | 56 / 16 / 1 | WL:6, PU:6 | 7 / 1 / 0 / 0 | reuses classes |
| 33 | Sinkers | 5008 | 63 / 5 / 1 | PU:2, EL:3 | 8 / 5 / 0 / 0 | reuses classes |
| 34 | Pigeonholes | 188 | 55 / 14 / 1 | SP:9, PU:4 | 14 / 10 / 0 / 0 | reuses classes |
| 35 | Hiccup | 228 | 56 / 13 / 1 | SP:2, PU:3, EL:1 | 12 / 6 / 0 / 0 | reuses classes |
| 36 | Stutter | 142 | 81 / 10 / 1 | WL:15, PU:9, BO:18, GO:3, WY:1, EL:3 | 13 / 5 / 0 / 0 | reuses classes |
| 37 | Quincunx | 135 | 63 / 6 / 1 | PU:2, BO:28 | 31 / 0 / 0 / 0 | reuses classes |
| 38 | Tempest | 220 | 48 / 12 / 1 | WY:2 | 28 / 2 / 0 / 0 | reuses classes |
| 39 | Dodger | 181 | 60 / 12 / 1 | SP:10, PU:5, GO:3, EL:10 | 13 / 2 / 0 / 0 | reuses classes |
| 40 | Hollow | 213 | 78 / 12 / 1 | SP:32, GO:4, EL:12 | 11 / 4 / 0 / 0 | reuses classes |
| 41 | Squiggle | 131 | 50 / 5 / 1 | HY:12, SP:3 | 11 / 8 / 0 / 0 | HY |
| 42 | Berserkeley | 170 | 71 / 39 / 1 | SP:2, WL:2, WY:2, EX:5, EL:2 | 15 / 2 / 0 / 0 | EX |
| 43 | Betwixt | 215 | 55 / 13 / 1 | SP:2, EX:2 | 18 / 5 / 0 / 0 | reuses classes |
| 44 | Weave | 189 | 58 / 10 / 1 | SP:6, WL:1, GO:5, EX:18 | 19 / 1 / 0 / 0 | reuses classes |
| 45 | Slide | 176 | 87 / 6 / 1 | SP:2, GO:1, EX:61 | 20 / 14 / 0 / 0 | reuses classes |
| 46 | Prop Wash | 219 | 70 / 8 / 1 | SP:7, PU:8, GO:8, EX:8 | 13 / 8 / 0 / 0 | reuses classes |
| 47 | Focus | 156 | 76 / 35 / 1 | SP:7, BO:8, EX:22 | 14 / 5 / 0 / 0 | reuses classes |
| 48 | Thriller | 133 | 70 / 2 / 1 | WL:6, BO:30, WY:1, EX:8 | 12 / 7 / 0 / 0 | reuses classes |
| 49 | Playground | 5003 | 54 / 0 / 1 | HY:8, EX:6 | 15 / 12 / 0 / 0 | reuses classes |
| 50 | Funhouse | 5010 | 63 / 33 / 1 | SP:1, PU:7, EX:20 | 17 / 5 / 0 / 0 | reuses classes |
| 51 | Bourbon | 168 | 47 / 29 / 1 | SP:1, BO:34, GO:5, EX:4 | 14 / 3 / 4 / 0 | reuses classes |
| 52 | Spires | 186 | 54 / 9 / 1 |  | 20 / 14 / 3 / 0 | reuses classes |
| 53 | Exile | 157 | 64 / 26 / 1 | SP:1, WL:1, EX:2, EL:1 | 10 / 2 / 5 / 0 | reuses classes |
| 54 | Square Dance | 173 | 49 / 12 / 1 | SP:2, WY:1 | 13 / 1 / 16 / 0 | reuses classes |
| 55 | Hokey Pokey | 163 | 45 / 12 / 1 | SP:1, PU:3 | 10 / 0 / 12 / 0 | reuses classes |
| 56 | Headache | 214 | 45 / 11 / 1 | SP:3 | 14 / 7 / 3 / 0 | reuses classes |
| 57 | Mortality | 212 | 64 / 10 / 1 | PU:2 | 19 / 2 / 0 / 0 | reuses classes |
| 58 | Death | 175 | 65 / 8 / 1 | SP:5 | 10 / 4 / 36 / 0 | reuses classes |
| 59 | Nasty | 496 | 69 / 24 / 1 | SP:12, WL:2, BO:20, GO:4, WY:1, EX:17 | 14 / 9 / 0 / 0 | reuses classes |
| 60 | Hitchhiker | 145 | 58 / 10 / 1 | SP:16, WL:1, PU:2, BO:31, GO:4, WY:1 | 11 / 8 / 1 / 0 | reuses classes |
| 61 | Diagonals | 153 | 50 / 12 / 1 | WY:1, EL:4, GN:4, TR:2 | 5 / 3 / 0 / 0 | GN, TR |
| 62 | Seesaw | 141 | 58 / 3 / 1 | SP:3, WL:3, PU:5, EL:2, GN:5, TR:2 | 9 / 6 / 0 / 0 | reuses classes |
| 63 | Treachery | 191 | 69 / 16 / 1 | SP:8, EX:1, EL:5, GN:3, TR:2 | 12 / 6 / 0 / 0 | reuses classes |
| 64 | Tubes | 207 | 38 / 12 / 1 | EX:15, GN:2, TR:1 | 13 / 1 / 19 / 0 | reuses classes |
| 65 | Slipstream | 134 | 62 / 12 / 1 | WL:5, DR:2, DS:1, PU:2, WY:1, GN:5, TR:4 | 9 / 0 / 5 / 0 | reuses classes |
| 66 | Gunrunner | 29042 | 81 / 9 / 1 | SP:3, WL:6, PU:1, GN:9, TR:1 | 9 / 6 / 0 / 0 | reuses classes |
| 67 | Chatter | 140 | 53 / 8 / 1 | HY:22, SP:2, GN:12, TR:2 | 10 / 5 / 0 / 0 | reuses classes |
| 68 | Jumble | 198 | 67 / 25 / 1 | SP:22, WL:9, DR:4, DS:6, PU:3, WY:1, EX:5, GN:3, TR:1 | 8 / 4 / 6 / 0 | reuses classes |
| 69 | Mishmash | 150 | 61 / 0 / 1 | SP:1, BO:28, WY:1, EX:16 | 18 / 1 / 0 / 0 | reuses classes |
| 70 | Descent | 136 | 46 / 10 / 1 | SP:4, WL:9, DR:1, DS:1, GO:8, WY:1, EX:2, GN:4, TR:3 | 7 / 6 / 7 / 0 | reuses classes |
| 71 | Saga | 184 | 69 / 9 / 1 | SP:4, WL:9, DR:2, DS:1, PU:5, BO:28, GO:5 | 24 / 3 / 0 / 0 | reuses classes |
| 72 | Firing Line | 185 | 75 / 7 / 1 | SP:5, WL:5, PU:4, BO:13, GO:4, WY:2, GN:9, TR:4 | 17 / 3 / 0 / 0 | reuses classes |
| 73 | Quest | 208 | 44 / 13 / 1 | SP:3, WL:2, PU:2, BO:4, EX:5 | 20 / 3 / 2 / 0 | reuses classes |
| 74 | Release | 195 | 30 / 11 / 1 | SP:2, WL:4, PU:6 | 23 / 7 / 0 / 0 | reuses classes |
| 75 | Wavicle | 204 | 57 / 11 / 1 | SP:2, WY:1, EX:16 | 12 / 3 / 22 / 0 | reuses classes |
| 76 | Transport | 177 | 70 / 12 / 1 | SP:3, WL:4, PU:4, WY:2, EL:2 | 12 / 2 / 3 / 0 | reuses classes |
| 77 | Contraction | 162 | 48 / 9 / 1 | SP:3, WL:2, BO:13, EX:1, EL:1 | 22 / 10 / 14 / 0 | reuses classes |
| 78 | Frustration | 172 | 81 / 24 / 1 | SP:1, WL:10, PU:3, EX:4, GN:4, TR:4 | 20 / 1 / 0 / 0 | reuses classes |
| 79 | Hypertension | 155 | 42 / 9 / 1 | HY:6, SP:1, WL:17, BO:2, WY:1 | 18 / 7 / 0 / 0 | reuses classes |
| 80 | Flywheels | 178 | 37 / 8 / 1 | SP:5, GO:8, EX:7 | 11 / 2 / 9 / 0 | reuses classes |
| 81 | Flail | 192 | 78 / 16 / 1 | SP:5 | 14 / 12 / 0 / 0 | reuses classes |
| 82 | Clutch | 129 | 79 / 9 / 1 | SP:7, WL:2 | 18 / 2 / 0 / 0 | reuses classes |
| 83 | Swing Out | 166 | 43 / 11 / 1 | WY:1 | 8 / 2 / 18 / 0 | reuses classes |
| 84 | Slow Motion | 201 | 72 / 15 / 1 | SP:7, WL:6, PU:3 | 23 / 5 / 0 / 0 | reuses classes |
| 85 | Orbit | 218 | 53 / 5 / 1 | SP:2 | 25 / 14 / 6 / 0 | reuses classes |
| 86 | Passage | 200 | 60 / 23 / 1 | SP:6, WL:4, DR:2, DS:2, EX:4 | 11 / 0 / 6 / 0 | reuses classes |
| 87 | Gearshift | 6551 | 67 / 7 / 1 | WL:1, WY:1 | 13 / 11 / 0 / 0 | reuses classes |
| 88 | Surrounded | 206 | 70 / 13 / 1 | SP:7, WL:14, BO:11, GO:9, EX:8 | 25 / 23 / 0 / 0 | reuses classes |
| 89 | Blowout | 182 | 60 / 10 / 1 | SP:5, WL:11, BO:28, EX:8 | 25 / 3 / 2 / 0 | reuses classes |
| 90 | Fade-out | 197 | 56 / 14 / 1 | SP:8, PU:7, EX:12 | 20 / 4 / 0 / 0 | reuses classes |
| 91 | Immunity | 158 | 51 / 8 / 1 | WL:3, BO:9 | 23 / 7 / 4 / 0 | reuses classes |
| 92 | Dizziness | 216 | 75 / 15 / 1 | HY:4, SP:4, WL:4, DR:1, DS:1, EX:7 | 11 / 9 / 8 / 0 | reuses classes |
| 93 | Twin Peaks | 187 | 54 / 15 / 1 | SP:2, EX:26 | 20 / 6 / 1 / 0 | reuses classes |
| 94 | Fracas | 130 | 71 / 3 / 1 | SP:10, DR:1, DS:1, WY:1 | 21 / 4 / 0 / 0 | reuses classes |
| 95 | Fallback | 161 | 45 / 9 / 1 | HY:4, SP:10, WL:3, PU:2, WY:2 | 12 / 6 / 19 / 0 | reuses classes |
| 96 | Box | 128 | 68 / 11 / 1 | EX:12, GN:7, TR:2 | 13 / 11 / 0 / 0 | reuses classes |
| 97 | March | 1004 | 86 / 17 / 1 | SP:3, WL:6, BO:20, WY:1 | 18 / 5 / 4 / 0 | reuses classes |
| 98 | Slaughter | 5004 | 86 / 6 / 1 | SP:10, WL:1, EX:32, GN:17, TR:8 | 3 / 2 / 0 / 0 | reuses classes |
| 99 | Crossfire | 8890 | 65 / 0 / 1 | SP:2, WL:5, PU:2, GN:7, TR:10 | 11 / 5 / 0 / 0 | reuses classes |
| 100 | Break In | 194 | 52 / 13 / 1 | SP:8, WL:6, PU:2, BO:60, GO:4, EX:1, EL:1 | 12 / 4 / 0 / 0 | reuses classes |

Source provenance and counts: [decoder review](decoder-astra-review.md). Per-level runtime/visual status: [queue](queue.json). Behavior and generation requirements: [requirements](requirements.md). Full raw maps, strings and byte offsets stay in the private decoded snapshot.
