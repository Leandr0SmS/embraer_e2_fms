# Embraer E2 Honeywell NG FMS — MCDU (MC-860) Simulator

An interactive, web-based simulator of the **Embraer E190-E2 / E195-E2 Honeywell Next Generation (NG) Flight Management System (FMS)** and **Multifunction Control and Display Unit (MCDU MC-860)**.

Built with **React 19**, **TypeScript**, **Zustand**, **Tailwind CSS v4**, and **Vite**, this simulator replicates the authentic 14×24 character LCD display geometry, Honeywell NG FMS color conventions, hardware bezel & keypad layout, scratchpad syntax parser, TOLD V-speed calculations, flight-phase dynamic page presentations, and guided preflight training flows.

> **Disclaimer**: This application is an independent educational and procedural training tool. It is **not** certified for real-world flight operations or official flight crew qualification.

---

## Key Features

### 1. Authentic MC-860 Hardware Bezel & 14×24 LCD Display
- **Strict 14 Rows × 24 Columns Character Grid**:
  - **Line 1**: Page Title & Page Index (`1/3`)
  - **Lines 2–13**: 6 pairs of label/data lines aligned with Left (`1L–6L`) and Right (`1R–6R`) Line Select Keys (LSKs)
  - **Line 14**: Interactive Scratchpad & Priority Alert Message Queue
- **Honeywell NG FMS Color Palette & Typography**:
  - **Cyan**: Pilot-modifiable entries, unselected options, navigation prompts (`<` / `>`)
  - **Green**: Active/selected options (`*`), FMS-computed values, and page titles
  - **Magenta**: Active `TO` waypoint and active leg data
  - **Amber / Red**: Caution/warning alerts and out-of-envelope flags
  - **Reverse-Video Boxes (`■` / highlighted prompts)**: Confirmation actions (`■ENTER`, `■ACCEPT COMP`, `POS INIT>`)
- **Authentic MC-860 Physical Keypad**:
  - **Top 2-Row Function Matrix**: `PERF`, `NAV`, `PREV`, `FPL`, `PROG`, `RTE`, `CB` (Row 1) and `MENU`, `DLK`, `NEXT`, `[blank]`, `TRS`, `RADIO` (Row 2) + vertical `BRT/DIM` rocker
  - **Top LED Annunciators**: `FAIL`, `OFST`, `MSG`, `CALL`
  - **Left Alpha Keypad**: `A–Z` in 5 columns + `DEL` and `CLR`
  - **Right Round Numeric Keypad**: `1–9`, `0`, `+/-`, `/`, `.`, `SP`
  - **Interactive Concentric Rotary Knob (`( )`)**: Adjusts `TO TEMP` and `FLEX TEMP` on `T/O DATASET MENU 1/1`

### 2. Complete Preflight & In-Flight Page Suite
- **Power-Up & Initialization**:
  - `RADIO 1/1` (Cold & Dark power-up screen)
  - `NAV INDEX 1/2 & 2/2` (`IDENT`, `POS INIT`, `PATTERNS`, `CONVERSION`, `MAINTENANCE`, `CROSS LOAD`, `DEPARTURE`, `ARRIVAL`, `ALTN`, `WPT LIST`, `FLT SUM`, `POS SENSORS`, `FIX INFO`)
  - `NAV IDENT 1/1` (`DATE`, `UTC`, `SW NG 1.0`, `ACTIVE NDB`, `NON-ACTIVE NDB`, `NDB V2.08 23M`, dynamic `POS INIT>` vs `RTE>`)
  - `POSITION INIT 1/1` (`LAST POS`, `REF WPT`, `GPS 1 POS (LOADED)`)
- **Route & Departure/Arrival Workflows**:
  - `ACT/MOD RTE 1/3` (`ORIGIN`, `DEST`, `ALTN DEST`, `FLIGHT ID`, `CO ROUTE`)
  - Multi-screen **`DEPARTURE`** chain: `DEPARTURE 1/1` → `DEPARTURE RUNWAYS` → `DEPARTURE SIDS` → `DEPARTURE TRANS` → `6R APPLY>`
  - `ACT/MOD RTE 2/3` (`VIA` / `TO` airway expansion with 2-step `THEN □□□□□` + `>>DISCONTINUITY<<` resolution)
  - `ALTN RTE 3/3` (Alternate route legs and fuel summary)
  - Multi-screen **`ARRIVAL`** chain: `ARRIVAL 1/1` → `RUNWAYS` → `STARS` → `STAR TRANS` → `APPROACH` → `APPR TRANS` → `6R APPLY>`
- **Performance, Thrust Rating & Takeoff Initialization**:
  - `PERFORMANCE INIT-KG 1/3` (Tail `#`, Perf Factor, Fuel Reserve, Altn Fuel, Fuel Allowances)
  - `PERFORMANCE INIT-KG 2/3` (`CRZ ALT`, `PASSENGERS`, `ZERO FUEL WT` at `3R`, `(GAUGE) FUEL` at `4R`, `TAKEOFF CG` at `5L`, `GROSS WT` at `5R`, `<CONFIRM INIT`)
  - `PERFORMANCE INIT-KG 3/3` (`STEP INC`, `CRZ MODES`, `SPEEDLIM/ALT`, `COST INDEX`, `TRANS ALT`, `TO DATASET>`)
  - `CRUISE MODES 1/1` (`ECON`, `MAX END`, `LRC`, `MANUAL`)
  - `T/O DATASET MENU 1/1` (`*TO-1`, `*TO-2`, `*TO-3`, `TO TEMP`, `■ENTER`, `ATTCS`, `REF ECS`, `REF A/I`, `FLEX T/O`, `FLEX TEMP`, `FMS TAKEOFF>`)
  - `TAKEOFF INIT 1/2 & 2/2` (Runway wind & live headwind/crosswind component arrows `↑/↓/←/→`, Runway condition `DRY/WET/CNTMNTD`, `TAKEOFF FLAPS 1/1` sub-page)
  - `TAKEOFF 1/1` (`V1`, `VR`, `V2`, `VFS`, `TO PITCH`, and `DEP LIM>`)
  - `DEPARTURE LIMIT 1/1` (`SPEED LIMIT`, `AFE LIMIT`, `VNAV CAP AFE`, `EO BANK LIM`, `FLT PLAN>`)
- **Flight-Phase Dynamic Presentations & Approach/Landing**:
  - **Flight Phase Selector**: Switch live between `PREFLIGHT`, `TAKEOFF`, `CLIMB`, `CRUISE`, `DESCENT`, `APPROACH`, and `MISSED_APPROACH`
  - Dynamic `ACTIVE FLT PLAN` headers (`Origin/Rwy`, `SID`, `DIRECT`, `VIA Airway`, `STAR`, `Approach`) and phase-aware Row 6 prompts (`6L <PERF INIT`, `6R DEPARTURE>` in Preflight vs `6R ARRIVAL>` in Cruise/Descent/Approach)
  - `PROGRESS 1/3–3/3` (`TKOF` vs `DEST` / `ALTN` ETA, DTG, Fuel Remaining, Wind/TAS/SAT/ISA, Cross-track error, Nav sensor status)
  - `LANDING INIT 1/1` → `ROAAS 1/1` → `LANDING 1/1` (Approach & Landing V-Speeds `VREF`, `VAPP`, `VAC`, `VFS` with reverse-video `COMP` and `■ACCEPT COMP`)
  - `MISSED APPROACH 1/1` & `ALTERNATE FPL 1/1`
  - `HOLDING PATTERN`, `CUSTOM WAYPOINT` (`Lat/Lon`, `PBD`, `PBPB`, `Along-Track`), `FIX INFO`, and `RTE OFFSET`

### 3. Guided Preflight Trainer & Instructor Fault Injection
- **10-Step Interactive Guided Preflight Sequence** with one-click **"Do Step"** auto-execution or manual MCDU entry
- **Official Scenario Presets**:
  - **LATAM E195 Guia Rápido**: `SBGR → SBCF` (ALTN `SBGO`, RWY `10R`, SID `OMNI`, `FL400`, ZFW `40000 KG`, CG `29.0%`, `TO-3` FLEX `25°C`)
  - **Honeywell E2 Pilot's Guide**: `KPHX → KMSP` (ALTN `KDLH`, RWY `08`, SID `SILOW4.RSK`, `J44.DVV`, `J114.ONL`, STAR `KASPR6.MCW`, Approach `ILS 30L.HASTI`, `FL330`, ZFW `38500 KG`, CG `23.5%`, `TO-1` FLEX `35°C`)
- **Instructor Station Fault Injection**:
  - `UNINITIALIZED_POS` (`POS INIT REQUIRED`)
  - `INVALID_CG` (`CHECK TAKEOFF CG`)
  - `OVERWEIGHT_GW` (`EXCEEDS MAX GROSS WEIGHT`)
  - `ROUTE_DISCONTINUITY` (`ROUTE DISCONTINUITY`)
  - `VSPEED_MISMATCH` (`CHECK VSPEEDS`)
  - `ENGINE_OUT` (`EO MAX CONT THRUST`)

---

## Getting Started

### Prerequisites
- **Node.js** `>= 18.x`
- **npm** `>= 9.x`

### Installation

```bash
# Install dependencies
npm install
```

### Running the Simulator in Development Mode

```bash
npm run dev
```

Then open the local URL printed in the terminal (typically `http://localhost:5173`) in your browser.

### Running Tests & Building for Production

```bash
# Run the Vitest unit & integration test suite
npm test

# Type-check and build the production bundle into dist/
npm run build

# Preview the production build locally
npm run preview
```

---

## Project Structure

```text
e2_fms/
├── src/
│   ├── audio/
│   │   └── soundEngine.ts          # Web Audio API tactile key click & alert chime synthesizer
│   ├── components/
│   │   ├── mcdu/
│   │   │   ├── McduBezel.tsx       # MC-860 hardware frame, LSKs, annunciators & screen wrapper
│   │   │   ├── McduKeypad.tsx      # 2-row Function Matrix, Left Alpha, Right Numeric & Rotary Knob
│   │   │   └── McduScreen.tsx      # Strict 14x24 character grid LCD renderer
│   │   └── training/
│   │       ├── GuidedPreflightPanel.tsx # 10-step Guided Preflight Trainer & Scenario Presets
│   │       └── InstructorDrawer.tsx     # Telemetry Monitor & Fault Scenario Injector
│   ├── data/
│   │   └── navdb.ts                # Static AIRAC 2405 airports, runways, SIDs, STARs, airways & fixes
│   ├── engine/
│   │   └── scratchpadParser.ts     # Scratchpad entry parsers (ZFW, CG, Wind, Alt/Speed, Custom Wpts)
│   ├── pages/
│   │   ├── initPages.ts            # RADIO, NAV INDEX 1/2-2/2, NAV IDENT, POS INIT
│   │   ├── rteFplPages.ts          # ACT/MOD RTE 1-3, DEPARTURE chain, ACTIVE FLT PLAN, HOLD
│   │   ├── perfTakeoffPages.ts     # PERF INIT 1-3, CRUISE MODES, T/O DATASET, TAKEOFF INIT/VSPEEDS, DEP LIM
│   │   ├── navProgressPages.ts     # PROGRESS 1-3, ARRIVAL chain, LANDING INIT/ROAAS/LANDING, FIX, OFFSET
│   │   └── pageRegistry.ts         # Unified MCDU page dispatcher
│   ├── store/
│   │   └── useFmsStore.ts          # Unified Zustand FMS state machine, LSK router & TOLD engine
│   ├── types/
│   │   └── fms.ts                  # Core TypeScript interfaces and MCDU display cell models
│   └── utils/
│       └── geo.ts                  # Great-circle Haversine distance, bearing & coordinate formatters
├── FMS_Pages_and_Flow_Correction_Plan.md
├── LICENSE
├── package.json
└── README.md
```

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
