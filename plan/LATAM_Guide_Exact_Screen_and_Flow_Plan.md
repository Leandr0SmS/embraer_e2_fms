# Implementation Plan: Exact LATAM E195 Quick-Guide (`Guia Rápido`) Screen-by-Screen & Button-by-Button Alignment

## 1. Objective
Update the Embraer E2 / E195 Honeywell NG FMS MCDU simulator so that a user following the **26-page LATAM Guia Rápido (`Preenchimento do FMS Embraer E195`)** sees **the exact same MCDU screens, field labels, empty box prompts (`□□□□□`), dashed placeholders (`-----`), colors, and LSK/button transitions** shown in every screenshot of the PDF (Pages 2 through 26), and can press the exact buttons and type the exact values to prepare the FMS from start to finish.

### Core Design Rules Confirmed by User
1. **Required vs. Optional Placeholders**:
   - **Empty Box Prompts (`□□□□□`)** indicate **required** pilot entries (e.g., `DEST □□□□□`, `CRZ ALT □□□□□`, `ZFW □□□□□□`, `TO CG □□.□%`, `WIND □□□°/□□`).
   - **Dashed Placeholders (`-----` / `--------` / `---`)** indicate **optional** or not-yet-computed entries (e.g., `CO ROUTE --------`, `FLIGHT ID --------`, `ALTN FUEL -----`, `V1/VR/V2/VFS ---`).
2. **Dynamic Current Date & Selectable Navigation Database (`navdb.ts`)**:
   - `DATE` and `UTC` on `NAV IDENT 1/1` dynamically reflect today's date (`DDMMMYY`) and current UTC time (`HHMMz`).
   - `ACTIVE NDB` and `NON-ACTIVE NDB` are loaded from a structured `NAV_DATABASES` catalog in `src/data/navdb.ts` (and can be cycled/swapped via `2R` on `NAV IDENT 1/1`), allowing future expansion with additional navigation databases.

---

## 2. Page-by-Page Audit of the LATAM PDF (Pages 2–26)

### Stage 1 — Navigation Index & Database Validation (PDF Pages 2–4)
| PDF Page | MCDU Screen Title | Initial Screen State in PDF | User Button / Input Action | Resulting Transition |
| :--- | :--- | :--- | :--- | :--- |
| **Page 2** | `NAV INDEX 1/2` | `1L ◄DATALINK`, `1R ATC►`<br>`2L ◄WPT LIST`, `2R FIX INFO►`<br>`3L ◄FPL LIST`, `3R SEC FPL MENU►`<br>`4L ◄CROSS PTS`, `4R FLT SUM►`<br>`5L ◄PATTERNS`, `5R HOLD►`<br>`6L ◄DEPARTURE`, `6R ARRIVAL►` | 1. Press **`NAV`** key on keypad to open `NAV INDEX 1/2`.<br>2. Press **`NEXT`** key on keypad. | Advances to `NAV INDEX 2/2` (Page 3). |
| **Page 3** | `NAV INDEX 2/2` | `1L ◄POS SENSORS`, `1R POS INIT►`<br>`2L ◄NAV IDENT`, `2R CONVERSION►`<br>`3L ◄DATA LOAD`, `3R MAINTENANCE►`<br>`4L ◄CLOSEST APT` | Press **`LSK 2L`** (`◄NAV IDENT`). | Opens `NAV IDENT 1/1` (Page 4). |
| **Page 4** | `NAV IDENT 1/1` | `1L DATE`: `19MAY26` (Cyan), `1R ACTIVE NDB`: `20APR 18MAY/23` (Yellow)<br>`2L UTC`: `0041z` (Cyan), `2R NON-ACTIVE NDB`: `26JAN 23FEB/23►` (Yellow)<br>`3L SW`: `NG 1.0` (Green), `3R NDB V2.08 23M`: `H3652304001` (Green)<br>`5L ◄LDG IDENT`, `6L ◄MAINTENANCE`, `6R RTE►` | Verify active database dates, then press **`LSK 6R`** (`RTE►`). | Opens `ACT RTE 1/2` in its initial unfilled state (Page 5). |

---

### Stage 2 — Route Initialization & Activation (PDF Pages 5–6)
| PDF Page | MCDU Screen Title | Exact Screen State in PDF | User Button / Input Action | Resulting Transition |
| :--- | :--- | :--- | :--- | :--- |
| **Page 5** | `ACT RTE 1/2` *(Before entry)* | `1L ORIGIN`: `LOWW` (Green), `1R DEST`: `□□□□□` (5 green boxes)<br>`2L RUNWAY`: *(blank)*, `2R`: *(blank until DEST entered)*<br>`3L ◄DLK FPL`, `3R CO ROUTE`: `--------` (Green)<br>`4L FPL REQST`, `4R FPL REPORT`<br>`5L ◄OFFSET`, `5R FLIGHT ID`: `--------` (Green)<br>`6L ◄FPL LIST`, `6R DEPARTURE►` | 1. Type `SBGR` → press **`1L`** (`ORIGIN`).<br>2. Type `SBCF` → press **`1R`** (`DEST`).<br>3. Type `SBGO` → press **`2R`** (`ALTN DEST`).<br>4. Type `TAM3000` → press **`5R`** (`FLIGHT ID`). | Screen transitions to `MOD RTE 1/3` (Page 6). |
| **Page 6** | `MOD RTE 1/3` *(After entry)* | `1L ORIGIN`: `SBGR` (Green), `1R DEST`: `SBCF` (Cyan)<br>`2L RUNWAY`: *(blank)*, `2R ALTN DEST`: `SBGO` (Cyan)<br>`3L ◄DLK FPL`, `3R CO ROUTE`: `SBGR-SBCF` (White)<br>`4L FPL REQST`: `◄SEND`<br>`5L ◄OFFSET`, `5R FLIGHT ID`: `TAM3000` (White)<br>`6L ◄CANCEL`, `6R ACTIVATE►` | Press **`LSK 6R`** (`ACTIVATE►`) to activate the route, then press **`LSK 6R`** (`DEPARTURE►`) *(or auto-advance to `SBGR DEPARTURE 1/1` per Page 7)*. | Opens `SBGR DEPARTURE 1/1` (Page 7). |

---

### Stage 3 — Departure Runway, SID & Enroute/Alternate Route (PDF Pages 7–12)
| PDF Page | MCDU Screen Title | Exact Screen State in PDF | User Button / Input Action | Resulting Transition |
| :--- | :--- | :--- | :--- | :--- |
| **Page 7** | `SBGR DEPARTURE 1/1` *(Initial)* | Header: `ACTIVE` (left) / `SELECTED` (right)<br>`1L RUNWAY`: *(blank)*, `1R`: `RUNWAY►` (White)<br>`2L SID`: *(blank)*, `2R`: `SID` (White)<br>`6R`: `TAKEOFF►` | Press **`LSK 1R`** (`RUNWAY►`). | Opens `SBGR RUNWAYS 1/1` (Page 8). |
| **Page 8** | `SBGR RUNWAYS 1/1` | `1L`: `◄10L` (Green)<br>`2L`: `◄10R` (Green)<br>`3L`: `◄28L` (Green)<br>`4L`: `◄28R` (Green)<br>`6R`: `DEPARTURE►` | Press **`LSK 2L`** (`◄10R`). | Selects Runway `10R` and opens `SBGR SIDs 1/1` (Page 9). |
| **Page 9** | `SBGR SIDs 1/1` | `1L`: `◄CGO1A`, `1R`: `UKBE1D►`<br>`2L`: `◄EDLU1A`, `2R`: `UREM1A►`<br>`3L`: `◄NIBR1A`<br>`4L`: `◄OMNI`<br>`5L`: `◄REOR1A`<br>`6R`: `DEPARTURE►` (Reverse video White) | Press **`LSK 4L`** (`◄OMNI`). | Selects SID `OMNI` and returns to `SBGR DEPARTURE 1/1` (Page 10). |
| **Page 10** | `SBGR DEPARTURE 1/1` *(Selected)* | `1R RUNWAY►`: `RW10R` (Cyan)<br>`2R SID►`: `OMNI` (Cyan)<br>`6L`: `◄CLEAR SEL`, `6R`: `APPLY►` (White) | Press **`LSK 6R`** (`APPLY►`), then press **`NEXT`** key. | Opens `MOD RTE 2/3` (Page 11). |
| **Page 11** | `MOD RTE 2/3` | `1L VIA`: `H095°` (Cyan), `1R TO`: `MANUAL` (Cyan)<br>`2L`: `DIRECT` (Green), `2R`: `SBCF` (Green)<br>`6L`: `◄CANCEL`, `6R`: `ACTIVATE►` | Press **`LSK 6R`** (`ACTIVATE►`), then press **`NEXT`** key. | Opens `MOD ALTN RTE 3/3` (Page 12). |
| **Page 12** | `MOD ALTN RTE 3/3` | `1L VIA`: `DIRECT` (Green), `1R TO`: `SBGO` (Green)<br>`6L`: `◄CANCEL`, `6R`: `ACTIVATE►` (then `PERF INIT►`) | 1. Press **`LSK 6R`** once to `ACTIVATE►`.<br>2. Press **`LSK 6R`** again (`PERF INIT►`). | Opens `PERFORMANCE INIT-KG 1/3` (Page 13). |

---

### Stage 4 — Performance Initialization 1/3, 2/3 & 3/3 (PDF Pages 13–16)
| PDF Page | MCDU Screen Title | Exact Screen State in PDF | User Button / Input Action | Resulting Transition |
| :--- | :--- | :--- | :--- | :--- |
| **Page 13** | `PERFORMANCE INIT-KG 1/3` | `1L TAIL *`: `OE-HDG` (Cyan), `1R PERF FACTOR`: `1.00` (Cyan)<br>`2L FUEL RESERVE`: `30 MIN` (Cyan), `2R`: `OR►`<br>`3L TO/LDG FUEL`: `142/105` (Cyan)<br>`4L ALTN FUEL`: `-----` (Green)<br>`5R`: `SEND REQST►` | 1. Optional/guided entry: Type `30` → **`2L`** (`30 MIN`), Type `142/105` → **`3L`**.<br>2. Press **`NEXT`** key. | Opens `PERFORMANCE INIT-KG 2/3` (Page 14). |
| **Page 14** | `PERFORMANCE INIT-KG 2/3` *(Unfilled)* | `1L CRZ ALT`: `□□□□□` (5 Cyan boxes), `1R STEP INC`: `0` (Cyan)<br>`2L CRZ WINDS`: `000T/0` (Cyan), `2R ISA DEV`: `+0°C` (Cyan)<br>`3L`: *(blank)*, `3R ZFW`: `□□□□□□` (6 Cyan boxes)<br>`4R (GAUGE) FUEL`: `(7600) 7600` (Cyan)<br>`5L TO CG`: `□□.□%` (Cyan boxes), `5R GROSS WT`: *(blank until ZFW set)* | 1. Type `400` → press **`1L`** (`FL400`).<br>2. Type `340/25` → press **`2L`** (`340T/25`).<br>3. Type `29.0` → press **`5L`** (`29.0%`).<br>4. Type `15` → press **`2R`** (`+15°C`).<br>5. Type `40000` → press **`3R`** (`40000`, computes `GROSS WT 47600`). | Screen matches Page 15 (`FL400`, `340T/25`, `+15°C`, `40000`, `29.0%`, `47600`). |
| **Page 15** | `PERFORMANCE INIT-KG 2/3` *(Filled)* | Shows all entered values in Cyan and `GROSS WT 47600`. | Press **`NEXT`** key on keypad. | Opens `PERFORMANCE INIT 3/3` (Page 16). |
| **Page 16** | `PERFORMANCE INIT 3/3` | `1L CLIMB SPEED`: `ECON(252/.65M)`, `1R`: `OR►`<br>`2L CRUISE SPEED`: `ECON(242/.65M)`, `2R`: `OR►`<br>`3L DESCENT SPEED`: `ECON(247/.65M)`, `3R`: `OR►`<br>`4L COST INDEX`: `□□□` → `1` (Cyan)<br>`6R`: `TO DATASET►` | 1. Type `1` → press **`4L`** (`COST INDEX`).<br>2. Press **`LSK 6R`** (`TO DATASET►`). | Opens `T/O DATASET MENU 1/1` (Page 17). |

---

### Stage 5 — T/O Dataset Menu (PDF Pages 17–18)
| PDF Page | MCDU Screen Title | Exact Screen State in PDF | User Button / Input Action | Resulting Transition |
| :--- | :--- | :--- | :--- | :--- |
| **Page 17** | `T/O DATASET MENU 1/1` *(Initial)* | `1L 19K8`: `°TO-1` (Green), `1R ATTCS`: `OFF ON◄-` (`ON` Green)<br>`2L 17K9`: `°TO-2` (White), `2R REF ECS`: `OFF◄- ON` (`OFF` Green)<br>`3L 17K1`: `°TO-3` (White), `3R REF A/I`: `OFF ENG ALL◄-` (`OFF` Green)<br>`4L TO TEMP`: `10 C` (White), `4R FLEX T/O`: `OFF◄- ON` (`OFF` Green)<br>`5L`: `■ENTER` (Reverse White)<br>`6L`: `◄TRS`, `6R`: `FMS TAKEOFF►` | 1. Press **`3L`** to select `°TO-3` (Green).<br>2. Press **`4L`** (or type `20` → **`4L`** / use Knob) to set `TO TEMP` to `20 C`.<br>3. Press **`2R`** to toggle `REF ECS` to `OFF ON◄-` (`ON` Green).<br>4. Press **`4R`** to toggle `FLEX T/O` to `OFF ON◄-` (`ON` Green) and set `5R FLEX TEMP` to `C [25 C]`. | Screen matches Page 18. |
| **Page 18** | `T/O DATASET MENU 1/1` *(Final)* | Shows `°TO-3` (Green), `TO TEMP 20 C`, `ATTCS ON◄-`, `REF ECS ON◄-`, `REF A/I OFF`, `FLEX T/O ON◄-`, `FLEX TEMP C [25 C]`. | 1. Press **`LSK 5L`** (`■ENTER`).<br>2. Press **`LSK 6R`** (`FMS TAKEOFF►`). | Opens `TAKEOFF INIT 1/2` (Page 19). |

---

### Stage 6 — Takeoff Init 1/2, 2/2, Flaps, Takeoff Speeds & Departure Limit (PDF Pages 19–26)
| PDF Page | MCDU Screen Title | Exact Screen State in PDF | User Button / Input Action | Resulting Transition |
| :--- | :--- | :--- | :--- | :--- |
| **Page 19** | `TAKEOFF INIT 1/2` *(Unfilled Wind)* | `1L RWY HDG`: `095°` (Green), `1R GROSS WT`: `47600KG` (Green)<br>`2L P ALT/B SET`: `2450/1013` (Cyan), `2R ELEV`: `2450` (Green)<br>`3L RWY SLOPE`: `0.0%` (Cyan), `3R WIND`: `□□□°/□□` (Cyan boxes)<br>`4L RWY CONDITION`: `-►DRY/WET/CNTMNTD` (`DRY` Cyan), `4R WIND`: *(blank until 3R wind entered)*<br>`5R`: `SEND REQST►`<br>`6L`: `◄PERF INIT` | 1. Verify/select **`4L`** (`RWY CONDITION` `DRY`).<br>2. Type `200/05` → press **`3R`** (`WIND`). | Computes wind components `↑1  ←5` on `4R` (Page 20). |
| **Page 20** | `TAKEOFF INIT 1/2` *(Filled Wind)* | `3R WIND`: `200°/05` (Cyan)<br>`4R WIND`: `↑1  ←5` (`↑1` White, `←5` Cyan) | Press **`NEXT`** key on keypad. | Opens `TAKEOFF INIT 2/2` (Page 21). |
| **Page 21** | `TAKEOFF INIT 2/2` | `1L FLAPS`: `FLAP 2` (Green), `1R`: `OR►`<br>`2L TO CG`: `29.0%` (Cyan), `2R TO TEMP`: `+20°C` (Cyan)<br>`3L/3R MODE<-FLEX TO-->TEMP`: `ON` (Green) / `+25°C` (Cyan)<br>`4L/4R MODE<-DATASET->ATTCS`: `TO-3` (Green) / `ON` (Green)<br>`6L`: `◄TO DATASET`, `6R`: `TAKEOFF►` | Press **`LSK 1R`** (`OR►`). | Opens `TAKEOFF FLAPS 1/1` (Page 22). |
| **Page 22** | `TAKEOFF FLAPS 1/1` | `1L`: `◄FLAP-1` (White), `1R`: `RETURN►`<br>`2L`: `◄FLAP-2 (ACT)` (Large White)<br>`3L`: `◄FLAP-3` (White)<br>`4L`: `◄FLAP-4` (White) | Press **`LSK 2L`** (`◄FLAP-2`). | Selects Flap 2 and returns automatically to `TAKEOFF INIT 2/2` (Page 23). |
| **Page 23** | `TAKEOFF INIT 2/2` | `1L FLAPS`: `FLAP 2` (Green) | Press **`LSK 6R`** (`TAKEOFF►`). | Opens `TAKEOFF 1/1` with dashed `---` speeds (Page 24). |
| **Page 24** | `TAKEOFF 1/1` *(Unfilled Speeds)* | `1L V1`: `---` (Magenta)<br>`2L VR`: `---` (Cyan), `2R FLAPS`: `2` (Green)<br>`3L V2`: `---` (White), `3R PITCH TRIM`: `3.4UP` (Green)<br>`4L VFS`: `---` (Cyan), `4R TO PITCH`: *(blank)*<br>`5L`: `◄LANDING`, `5R`: `CLIMB►`<br>`6L`: `◄TO INIT`, `6R`: `DEP LIM►` | 1. Type `135` → press **`1L`** (`V1`).<br>2. Type `140` → press **`2L`** (`VR`).<br>3. Type `142` → press **`3L`** (`V2`).<br>4. Type `195` → press **`4L`** (`VFS`). | Displays `135` (Magenta), `140` (Cyan), `142` (White), `195` (Cyan), and `TO PITCH 8.2` (Cyan) as in Page 25. |
| **Page 25** | `TAKEOFF 1/1` *(Filled Speeds)* | Shows entered V-speeds and `TO PITCH 8.2`. | Press **`LSK 6R`** (`DEP LIM►`). | Opens `DEPARTURE LIMIT 1/1` (Page 26). |
| **Page 26** | `DEPARTURE LIMIT 1/1` | `1L SPEED LIMIT`: `152` (Cyan)<br>`2L AFE LIMIT`: `3000` (Cyan)<br>`3L VNAV CAP AFE`: `1000` (Cyan)<br>`4L/4R VNAV CAP<-EO->BANK LIM`: `1000` (Cyan) / `15°` (Green)<br>`6L`: `◄TAKEOFF`, `6R`: `FLT PLAN►` | Verify/enter `152` (`1L`), `3000` (`2L`), `1000` (`3L`), `1000` (`4L`), then press **`LSK 6R`** (`FLT PLAN►`). | Completes FMS preparation and opens `ACTIVE FLT PLAN`. |

---

## 3. Planned Code Changes

### Step A — Navigation Database & Initial LATAM Cold State (`src/data/navdb.ts` & `src/store/useFmsStore.ts`)
1. **Update `SBGR` Runways & SIDs in `src/data/navdb.ts`** to match Pages 8 & 9 of the PDF:
   - Runways: `10L` (hdg `095°`, elev `2450 FT`), `10R` (hdg `095°`, elev `2450 FT`), `28L` (hdg `275°`, elev `2450 FT`), `28R` (hdg `275°`, elev `2450 FT`), while keeping `09L`/`09R`/`27L` aliases for backward compatibility with existing tests.
   - SIDs: `CGO1A`, `EDLU1A`, `NIBR1A`, `OMNI`, `REOR1A`, `UKBE1D`, `UREM1A` (and `VEXIM1A` for legacy test compatibility), where `OMNI` inserts the `H095° -> MANUAL` initial heading vector leg shown on Page 11 (`MOD RTE 2/3`).
2. **Update `loadScenarioPreset('LATAM_SBGR_SBCF')` in `src/store/useFmsStore.ts`**:
   - Set the initial state so the user starts at the beginning of the LATAM guide with:
     - `origin: 'LOWW'`, `destination: ''` (`□□□□□`), `alternate: ''`, `flightId: ''`, `runway: ''`, `sid: null` (matching Page 5 before the user types `SBGR`, `SBCF`, `SBGO`, `TAM3000`!).
     - `tailNumber: 'OE-HDG'`, `fuelOnBoard: 7.6` (`(7600) 7600`), `fuelReserve: { mode: 'MINUTES', value: 30 }`, `fuelAllowances: { takeoff: 0.142, landing: 0.105 }` (`142/105`), `alternateFuel: null` (`-----`), `cruiseAltitudeFt: null` (`□□□□□`), `zeroFuelWeight: null` (`□□□□□□`), `takeoffCg: null` (`□□.□%`), `averageCruiseWind: { direction: 0, speed: 0 }` (`000T/0`), `isaDeviationC: 0` (`+0°C`), `costIndex: 1`.
     - `toDataset`: `thrustRating: 'TO-1'`, `toTempC: 10`, `attcs: true`, `refEcs: 'OFF'`, `refAntiIce: 'OFF'`, `flexTakeoff: false`, `flexTempC: 25`, `entered: false` (matching Page 17 before the user configures Page 18!).
     - `atmosphere.surfaceWind: null` (`□□□°/□□` on Page 19 until the user enters `200/05` on Page 20!).
     - `speeds.takeoffSpeeds: { v1: null, vr: null, v2: null, vfs: null }` (`---` on Page 24 until the user enters `135`, `140`, `142`, `195` on Page 25!).
     - `altitude.afeLimitFt: 3000`, `vnavCaptureAfeFt: 1000`, `vnavCaptureEoAfeFt: 1000`, `departureSpeedLimit: '152'` (matching Page 26!).

### Step B — Exact Screen Layouts & Colors (`src/pages/initPages.ts`, `src/pages/rteFplPages.ts`, `src/pages/perfTakeoffPages.ts`)
1. **`NAV IDENT 1/1` (`initPages.ts`)**:
   - Match Page 4 colors: `DATE` (`19MAY26`) and `UTC` (`0041z`) in Cyan, `ACTIVE NDB` and `NON-ACTIVE NDB►` in Yellow/Amber, `SW` (`NG 1.0`) and `H3652304001` (`NDB V2.08 23M` label in green) in Green.
2. **`ACT/MOD RTE 1/2 & 1/3`, `DEPARTURE 1/1`, `RUNWAYS 1/1`, `SIDs 1/1`, `MOD RTE 2/3`, `MOD ALTN RTE 3/3` (`rteFplPages.ts`)**:
   - `ACT RTE 1/2` (when `destination` is empty): `1R DEST` shows `□□□□□` in Green, `2L RUNWAY` is blank, `2R ALTN DEST` is hidden until `DEST` is entered, `3R CO ROUTE` shows `--------`, `5R FLIGHT ID` shows `--------`.
   - `MOD RTE 1/3` (Page 6): `1L SBGR` (Green), `1R SBCF` (Cyan), `2R SBGO` (Cyan), `3R SBGR-SBCF` (White), `4L ◄SEND`, `5R TAM3000` (White), `6L ◄CANCEL`, `6R ACTIVATE►`.
   - `SBGR DEPARTURE 1/1` (Pages 7 & 10): Clean 2-row layout (`RUNWAY` on Row 1, `SID` on Row 2; `ACTIVE` / `SELECTED` header).
   - `SBGR RUNWAYS 1/1` (Page 8): Show `◄10L`, `◄10R`, `◄28L`, `◄28R` on `1L–4L`.
   - `SBGR SIDs 1/1` (Page 9): Two-column SID list (`1L ◄CGO1A`..`5L ◄REOR1A` and `1R UKBE1D►`..`2R UREM1A►`) with reverse-video `6R DEPARTURE►`.
   - `MOD RTE 2/3` (Page 11): Show `1L VIA H095°` (Cyan) / `1R TO MANUAL` (Cyan) and `2L DIRECT` (Green) / `2R SBCF` (Green).
   - `MOD ALTN RTE 3/3` (Page 12): Show `1L VIA DIRECT` (Green) / `1R TO SBGO` (Green), `6L ◄CANCEL`, `6R ACTIVATE►` (and `PERF INIT►` once activated).
3. **`PERFORMANCE INIT-KG 1/3–3/3`, `T/O DATASET MENU 1/1`, `TAKEOFF INIT 1/2–2/2`, `TAKEOFF FLAPS 1/1`, `TAKEOFF 1/1`, `DEPARTURE LIMIT 1/1` (`perfTakeoffPages.ts`)**:
   - `PERF INIT-KG 1/3` (Page 13): `TAIL *` (`OE-HDG`), `PERF FACTOR` (`1.00`), `FUEL RESERVE` (`30 MIN`), `TO/LDG FUEL` (`142/105`), `ALTN FUEL` (`-----`), `5R SEND REQST►`.
   - `PERF INIT-KG 2/3` (Pages 14 & 15): 6-box `□□□□□□` for `ZFW`, blank `3L` and blank `5R GROSS WT` until `ZFW` is entered, `(7600) 7600` for `(GAUGE) FUEL`, Cyan for pilot-entered `FL400`, `340T/25`, `+15°C`, `40000`, `29.0%`.
   - `PERF INIT 3/3` (Page 16): Title `PERFORMANCE INIT 3/3`, `ECON(252/.65M)`, `ECON(242/.65M)`, `ECON(247/.65M)`, `COST INDEX` (`1` in Cyan), `6R TO DATASET►`.
   - `T/O DATASET MENU 1/1` (Pages 17 & 18): `19K8` / `°TO-1`, `17K9` / `°TO-2`, `17K1` / `°TO-3` labels and degree bullets `°`, `TO TEMP` (`10 C` -> `20 C`), `ATTCS` (`OFF ON◄-`), `REF ECS` (`OFF◄- ON` / `OFF ON◄-`), `REF A/I` (`OFF ENG ALL◄-`), `FLEX T/O` (`OFF◄- ON` / `OFF ON◄-`), `FLEX TEMP` (`C [25 C]` only visible when `FLEX T/O` is `ON`).
   - `TAKEOFF INIT 1/2` (Pages 19 & 20): When surface wind is uninitialized, `3R WIND` shows `□□□°/□□` in Cyan and `4R WIND` is blank; once `200/05` is entered on `3R`, `3R` shows `200°/05` and `4R` shows `↑1   5` with `←` above `5` (`WIND ←` on label line, `↑1   5` on data line).
   - `TAKEOFF FLAPS 1/1` (Page 22): Active flap shows `(ACT)` in large White (`◄FLAP-2 (ACT)`), others in small White (`◄FLAP-1`, `◄FLAP-3`, `◄FLAP-4`).
   - `TAKEOFF 1/1` (Pages 24 & 25): Unentered speeds show `---` (`V1` in Magenta, `VR` in Cyan, `V2` in White, `VFS` in Cyan) and blank `TO PITCH`; entered speeds show numeric values (`135` Magenta, `140` Cyan, `142` White, `195` Cyan) and `TO PITCH 8.2` (Cyan).

### Step C — Interactive Step-by-Step Guided Trainer (`src/components/training/GuidedPreflightPanel.tsx`)
Update `GuidedPreflightPanel.tsx` so each guided step corresponds directly to the pages of the LATAM Guia Rápido, highlighting the exact target keypad button (`NAV`, `NEXT`) or LSK (`1L`–`6R`) and showing the exact scratchpad string to type (`SBGR`, `SBCF`, `SBGO`, `TAM3000`, `400`, `340/25`, `29.0`, `15`, `40000`, `1`, `20`, `25`, `200/05`, `135`, `140`, `142`, `195`).
