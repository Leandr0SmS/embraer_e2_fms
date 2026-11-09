# **Project Plan: Embraer E2 Honeywell NG FMS MCDU Interactive Training Simulator (v3)**

## **1\. Executive Project Overview**

The objective of this project is to architect and build an interactive web-based simulator of the Multifunction Control and Display Unit (MCDU) for the Honeywell Next Generation (NG) Flight Management System (FMS), tailored for Embraer E190-E2 and E195-E2 aircraft. In modern commercial aviation training, access to physical aircraft flight decks or full-flight simulators is costly and restricted. This web application provides flight crews, student pilots, and instructors with a pixel-accurate, high-fidelity browser-based environment to master FMS page navigation, scratchpad entry rules, line select key operations, and guided preflight initialization sequences.

The simulator strictly replicates the physical and operational characteristics of the Honeywell MC-860 MCDU interface documented in the official pilot guide. This includes the 14-line by 24-character full-color display grid, the 12 Line Select Keys (1L–6L and 1R–6R), the dedicated function keys (PERF, NAV, FPL, PROG, RTE, PREV, NEXT, DEL, CLR), and the scratchpad data entry stack. By enabling both free-form navigation and structured procedural training, the application bridges the gap between theoretical pilot guide study and cockpit application.

## **2\. Recommended Technology Stack**

Building an avionics-grade simulator requires a modern web stack that delivers sub-millisecond input responsiveness, strict state predictability, precise visual rendering, and modular maintainability.

### **Primary Technology Components**

The table below outlines the core technology layers, selected frameworks, and technical justifications for building the MCDU simulator:

| Layer | Recommended Technology | Technical Rationale & Purpose |
| :---- | :---- | :---- |
| **Frontend Framework** | React 18 / 19 with TypeScript | Provides strong type safety for FMS data models, robust component lifecycle management, and scalable UI modularity. |
| **State Engine** | Zustand \+ XState | XState models complex FMS state transitions (such as pending flight plans, scratchpad stacks, and mode changes), while Zustand handles global aircraft state. |
| **UI & Styling** | Tailwind CSS \+ Custom CSS Grid | Enables exact 14x24 monospace character grid alignment, retro LCD glow effects, and responsive MCDU bezel scaling. |
| **Typography & Fonts** | Monospaced Vector Font (*Honeywell FMS Mono*) | Ensures exact 24-character line boundaries, font size hierarchy (small font for system data, large font for pilot entries), and box prompt character rendering. |
| **Audio Engine** | Web Audio API | Synthesizes tactile key click feedback, audible caution beeps, and scratchpad error chimes without external audio asset latency. |
| **Bundler & Tooling** | Vite | Delivers instant hot-module replacement during development and optimized production bundling. |
| **Testing & QA** | Vitest \+ Playwright | Vitest validates core FMS mathematical logic and state transitions, while Playwright provides end-to-end user key-press workflow validation. |

## **3\. Simulator Core Architecture & Feature Ideas**

The simulator architecture is divided into three primary modules: the **Hardware Visual Shell**, the **FMS State & Page Navigation Engine**, and the **Interactive Training & Assessment Engine**.

### **3.1 Hardware Visual Shell & Display Emulation**

* **Exact 14x24 Character LCD Renderer**: The display is structured as 14 rows, each containing exactly 24 character cells. Line 1 is designated for page title information, lines 2 through 13 display left, center, and right data fields, and line 14 serves as the working scratchpad.  
* **Dynamic Color Assignment Engine**: Adheres strictly to Honeywell NG FMS visual conventions documented in the system specifications:  
  * *Small Cyan Font*: System-computed default values, estimated time of arrival (ETA), distance-to-go (DTG), atmospheric data, and nav frequency data.  
  * *Large Green Font*: Flight crew manual entries, active route waypoints, lateral course data, and validated inputs.  
  * *Yellow*: FROM waypoint, active flight plan name, and warning alerts.  
  * *Magenta*: TO waypoint, active navigation mode annunciations, and advisory alerts.  
  * *White*: Page title headers, index prompts, and line select labels.  
  * *Reverse Video*: Scratchpad alert messages, required input highlights, and invalid entry warnings (such as takeoff CG mismatches or out-of-range speed values).  
  * *Box Prompts (`□□□□□`)*: Highlight mandatory initialization fields (such as ZFW, initial cruise altitude, and takeoff CG).  
* **Tactile Keypad & Scratchpad Stack**: Full emulation of the alphanumeric keypad, special characters (`+`, `-`, `/`, `.`, `SP`), `CLR` key (single character erase or scratchpad message clear), and `DEL` key (generates `DELETE` mode for line fields). Data entered into the scratchpad remains buffered across page transitions until up-selected to a line field.

### **3.2 Key Interactive Feature Concepts**

* **Up-Selection & Down-Selection Logic**: Pushing a Line Select Key when the scratchpad contains text transfers (up-selects) the data into the corresponding line field. Pushing an LSK when the scratchpad is empty down-selects the line data into the scratchpad for editing.  
* **Guided Preflight Sequence Mode**: Step-by-step interactive mode guiding pilots through the complete preflight initialization flow: `AVIONICS POWER` \\rightarrow `NAV IDENT` \\rightarrow `POSITION INIT` (if GPS position is uninitialized) \\rightarrow `ACT RTE` \\rightarrow `PERFORMANCE INIT (1/3–3/3)` \\rightarrow `TAKEOFF INIT (1/2–2/2)` \\rightarrow `TAKEOFF VSPEEDS` \\rightarrow `ACTIVE FLT PLAN`.  
* **Error Handling & Annunciation**: Real-time scratchpad alert annunciation (e.g., `INVALID ENTRY`, `INVALID DELETE`, `CHECK TAKEOFF CG`, `MOD FPL ACTION REQ'D`) with PFD `MSG` light trigger simulation.  
* **Scenario-Based Training & Fault Injection**: Instructors can inject system faults, such as GPS position invalidation at power-up, engine-out scenarios (`EO` mode), or route discontinuities, requiring trainees to perform corrective MCDU procedures.

## **4\. FMS Data Structure Specifications & State Models**

To ensure strict type safety and computational fidelity in the simulator, the core FMS data structures are modeled as explicit TypeScript interfaces. These models define the data fields, display formatting rules, scratchpad entry formats, and validation constraints for weights, speeds, flight plan points, atmospheric conditions, and flight levels.

### **4.1 Weight & Balance Data Model (`FmsWeightData`)**

Weight calculations in the Honeywell NG FMS drive critical takeoff performance, fuel predictions, and ceiling altitude computations. Weights are displayed in kilograms (KG) or pounds (LB) depending on Aircraft Personality Module (APM) configuration.

```ts
export interface FmsWeightData {
  /** Zero Fuel Weight in thousands (e.g. 45.0 for 45,000 kg). Uninitialized: null (renders as '□□.□') */
  zeroFuelWeight: number | null;
  /** Fuel Source selection: 'GAUGE' (synced with fuel sensing) or 'COMPUTED' (decremented by fuel flow) */
  fuelSource: 'GAUGE' | 'COMPUTED';
  /** Total Fuel on Board in thousands (e.g. 14.2 for 14,200 kg) */
  fuelOnBoard: number;
  /** Calculated Gross Weight = ZFW + FOB. Rendered in small cyan font */
  grossWeight: number | null;
  /** Takeoff Center of Gravity in % MAC (e.g. 29.0). Range: 10.0 to 40.0 % MAC. Uninitialized: null ('□□.□') */
  takeoffCg: number | null;
  /** Fuel Reserve Value. Can be in minutes (e.g. 45) or absolute weight (e.g. 2.1 = 2,100 kg) */
  fuelReserve: {
    mode: 'MINUTES' | 'WEIGHT';
    value: number; // minutes or thousands of kg/lb
  };
  /** Alternate Fuel allowance in thousands (e.g. 1.2). If null, FMS calculates trip fuel to alternate */
  alternateFuel: number | null;
  /** Takeoff / Landing Fuel Allowance (e.g. { takeoff: 0.4, landing: 0.2 }) */
  fuelAllowances: {
    takeoff: number;
    landing: number;
  };
}
```

#### **Weight Entry Validation & Range Rules**

* **ZFW Scratchpad Entry**: Accepts 2 to 3 digits with optional decimal (e.g., `45.0` or `45000`). Values outside certified aircraft operating limits (30.0 to 55.0 metric tonnes) trigger the `INVALID ENTRY` scratchpad warning.  
* **Takeoff CG Validation**: Must fall between certified forward and aft limits (10.0% to 40.0% MAC). If invalid or unentered prior to takeoff, the scratchpad displays `CHECK TAKEOFF CG` and the field renders in reverse video.  
* **Gross Weight Limit Check**: If computed GW \> MaxTOW, the Gross Weight value displays in reverse video.

### **4.2 Speed & Aerodynamic Target Model (`FmsSpeedData`)**

The speed data model governs takeoff V-speeds, climb/cruise/descent speed schedules, waypoint speed constraints, and airframe placard protection limits.

```ts
export interface FmsSpeedData {
  /** Takeoff V-Speeds in Knots Calibrated Airspeed (KCAS) */
  takeoffSpeeds: {
    v1: number | null;   // Decision speed
    vr: number | null;   // Rotate speed
    v2: number | null;   // Takeoff safety speed
    vfs: number | null;  // Final segment speed
  };
  /** Landing Reference and Approach Speeds in KCAS */
  landingSpeeds: {
    vref: number | null;
    vapp: number | null;
    vac: number | null;
    gaSpeed: number | null; // Go-Around target speed
  };
  /** Active Flight Phase Speed Schedule */
  activeSchedule: {
    climbMode: 'ECON' | 'MAX_RATE' | 'MAX_ANGLE' | 'MANUAL';
    climbCasMach: { cas: number; mach: number }; // e.g. { cas: 250, mach: 0.70 }
    cruiseMode: 'ECON' | 'LRC' | 'MANUAL';
    cruiseMach: number;                         // e.g. 0.78
    descentMode: 'ECON' | 'MANUAL';
    descentCasMach: { cas: number; mach: number };
  };
  /** Airframe Speed Limits */
  limits: {
    vmo: number; // Max Operating Velocity (e.g. 320 KCAS)
    mmo: number; // Max Operating Mach (e.g. 0.82)
    speedLimitAlt: { speed: number; alt: number }; // Default: 250 KCAS below 10,000 FT AFE
  };
}
```

#### **V-Speed Ordering Constraints & Verification Logic**

* **Sequential Order Rule**: The FMS enforces the strict aerodynamic ordering hierarchy: V\_1 \\le V\_R \\le V\_2 \\le \\frac{V\_{FS}}{1.19}  
* **Mismatch Annunciation**: If a pilot attempts to enter V\_1 \> V\_R, both V\_1 and V\_R values transition to white reverse video on `TAKEOFF VSPEEDS 2/2`. Similarly, if V\_R \> V\_2, V\_R and V\_2 display in reverse video.  
* **Crossover Altitude Logic**: In climb mode, CAS is targeted below the computed crossover altitude (minimum 15,000 FT AFE), while Mach is targeted at and above crossover.

### **4.3 Flight Plan & Waypoint Navigation Model (`FmsWaypoint` & `FmsFlightPlan`)**

The flight plan data structure represents the sequential list of active waypoints, lateral fix types, vertical constraints, and estimated flight progress calculations.

```ts
export interface FmsWaypointConstraint {
  /** Altitude Constraint Type: AT, AT_OR_ABOVE ('A'), AT_OR_BELOW ('B'), or WINDOW */
  altitudeType?: 'AT' | 'AT_OR_ABOVE' | 'AT_OR_BELOW' | 'WINDOW';
  /** Primary altitude in feet or Flight Level (e.g. 10000 or 280 for FL280) */
  altitudeValue1?: number;
  /** Secondary altitude for WINDOW constraints (e.g. 17000B16000A) */
  altitudeValue2?: number;
  /** Speed Constraint in KCAS or Mach (e.g. 210 for 210 KT or 0.75 for .75M) */
  speedConstraint?: number;
  /** Constraint Phase Override: 'CLB' (Climb) or 'DES' (Descent) */
  phaseOverride?: 'CLB' | 'DES';
  /** Irrational Constraint Flag: true if VNAV recomputation cannot achieve continuous path */
  isIrrational?: boolean;
}

export interface FmsWaypoint {
  id: string;
  ident: string;                       // 5-char max (e.g. 'VEXIM', 'SBGR09L')
  type: 'AIRPORT' | 'VOR' | 'NDB' | 'FIX' | 'LATLON' | 'DISCONTINUITY';
  coordinates: { lat: number; lon: number };
  constraint?: FmsWaypointConstraint;
  /** Computed Flight Progress Predictions */
  predictions: {
    etaUtc: string;                    // Format: 'HHMMz' (e.g. '1218z')
    dtgNm: number;                     // Distance to go from previous fix in NM
    cumulativeDtgNm: number;           // Total distance to destination in NM
    efobKg: number;                    // Estimated Fuel on Board in thousands (e.g. 13.8)
    predictedAltitudeFt: number;       // VNAV projected altitude
  };
}

export interface FmsFlightPlan {
  id: string;
  planType: 'ACTIVE' | 'MOD' | 'SECONDARY';
  origin: string;                      // Airport ICAO
  destination: string;                 // Airport ICAO
  runway: string | null;               // e.g. '09L'
  alternate: string | null;            // Airport ICAO
  flightId: string;                    // e.g. 'AZU1420'
  waypoints: FmsWaypoint[];
  activeWaypointIndex: number;         // Index of active TO waypoint
}
```

#### **Waypoint Constraint Parsing & Entry Formats**

* **Altitude Constraint Syntax**:  
  * `10000` \\rightarrow Hard `AT` 10,000 FT.  
  * `10000A` \\rightarrow `AT OR ABOVE` 10,000 FT.  
  * `10000B` \\rightarrow `AT OR BELOW` 10,000 FT.  
  * `16000A17000B` \\rightarrow `WINDOW` between 16,000 FT and 17,000 FT.  
* **Speed Constraint Formatting**: Entered in scratchpad as `210/` (210 KCAS) or `.75/` (0.75 Mach) and line-selected to LSK 1R–5R on `ACTIVE FLT PLAN`.  
* **Irrational Constraints**: If a pilot enters a descent constraint that violates the maximum continuous descent flight path angle (6.0^\\circ), the constraint is flagged `isIrrational = true` and displays in reverse video.

### **4.4 Atmospheric, Wind & Temperature Model (`FmsAtmosphericData`)**

Atmospheric parameters dictate true airspeed (TAS), groundspeed predictions, fuel burn rate, and VNAV approach temperature compensation.

```ts
export interface FmsAtmosphericData {
  /** Average Cruise Wind Direction (001–360 deg) and Speed (knots) */
  averageCruiseWind: { direction: number; speed: number } | null;
  /** Waypoint-Specific Winds Aloft (up to 4 altitudes per waypoint) */
  waypointWinds: Map<string, Array<{ altitudeFt: number; direction: number; speed: number; tempC: number }>>;
  /** Mean ISA Deviation in degrees Celsius (-50°C to +70°C). Default: 0 */
  isaDeviationC: number;
  /** Outside Air Temperature at Airport/Surface in °C */
  surfaceOatC: number | null;
  /** Flex Takeoff Assumed Temperature in °C (e.g. 46) */
  flexTemperatureC: number | null;
  /** VNAV Approach Temperature Compensation Configuration */
  tempCompensation: {
    status: 'OFF' | 'COLD' | 'HOT_COLD';
    landingOatC: number | null;
    isActivated: boolean; // True when compensated constraints are applied to active FLT PLAN
  };
}
```

#### **Atmospheric Modeling & Blending Rules**

* **Wind Blending Algorithm**: Sensed wind and temperature from aircraft sensors (ADS) are blended with forecast winds up to 200 NM. Beyond 200 NM, pure forecast models apply.  
* **Temperature Impact**: True airspeed (TAS) increases by approximately 5% for every \+20^\\circ\\text{C} increase above ISA standard temperature at fixed Mach.  
* **Temperature Compensation Range**: When `COLD` mode is active, temperature compensation adjusts approach waypoint altitude constraints for temperatures between 0^\\circ\\text{C} and \-50^\\circ\\text{C} DISA to guarantee obstacle clearance.

### **4.5 Flight Level & Altitude Navigation Model (`FmsAltitudeData`)**

The altitude data model maintains cruise altitude targets, transition altitudes, climb/descent profiles, and certified ceiling limits.

```ts
export interface FmsAltitudeData {
  /** Initial Cruise Altitude in Feet (e.g. 35000 or FL350). Uninitialized: null ('□□□□□') */
  cruiseAltitudeFt: number | null;
  /** Transition Altitude in Feet. Default: NAV DB value or 18,000 FT */
  transitionAltitudeFt: number;
  /** Above Field Elevation (AFE) Speed Transition Limit in Feet (e.g. 1500 FT) */
  afeLimitFt: number;
  /** VNAV Capture Altitude AFE in Feet (e.g. 1000 FT) */
  vnavCaptureAfeFt: number;
  /** Computed Optimum Cruise Altitude based on current Gross Weight */
  optimumAltitudeFt: number | null;
  /** Maximum Certified Ceiling Altitude (e.g. 41,000 FT for Embraer E2) */
  certifiedCeilingFt: number;
}
```

#### **Flight Level Formatting Rules**

* **Three-Digit Input Rule**: Any 3-digit numerical entry into altitude fields is interpreted as a Flight Level (e.g., `280` \\rightarrow `FL280` \= 28,000\\text{ FT}).  
* **Leading Zero Requirement**: Altitude entries under 1,000 feet require a leading zero in scratchpad (e.g., `008` \\rightarrow `800\text{ FT}`).

## **5\. Honeywell NG FMS MCDU Page Architecture & Navigation Map**

The simulator implements the complete page hierarchy starting from the primary FMS function keys (`PERF`, `NAV`, `FPL`, `PROG`, `RTE`).

### **5.1 Primary Page Navigation Hierarchy**

* **POWER-UP & DEFAULT PAGE**: Following avionics power-up, the MCDU defaults to the `RADIO` page. Selecting any FMS function key transitions directly to `NAV IDENT` (1/1) to verify database currency.  
* **PERFORMANCE (PERF) KEY**: Opens `PERF INDEX 1/2`.  
  * *PERF INDEX 1/2 Options*: `PERF INIT` (1/3–3/3), `TAKEOFF` (TAKEOFF INIT & TAKEOFF VSPEEDS), `DEP LIM`, `CLIMB`, `CRUISE`, `DES FORECAST`, `DESCENT`, `APP SPD`, `LANDING`, `GA LIM`.  
  * *PERF INDEX 2/2 Options*: `FUEL MGT`, `EO RANGE`.  
* **NAVIGATION (NAV) KEY**: Opens `NAV INDEX 1/2`.  
  * *NAV INDEX 1/2 Options*: `DATALINK`, `WPT LIST`, `FPL LIST`, `CROSS PTS`, `PATTERNS`, `DEPARTURE`, `ATC`, `FIX INFO`, `SEC FPL MENU`, `FLT SUM`, `HOLD`, `ARRIVAL`.  
  * *NAV INDEX 2/2 Options*: `POS SENSORS`, `NAV IDENT`, `DATA LOAD`, `CLOSEST APT`, `POS INIT`, `CONVERSION`, `MAINTENANCE`.  
* **FLIGHT PLAN (FPL) KEY**: Opens `ACTIVE FLT PLAN` (1/X), displaying waypoints, speed targets, altitude constraints, VNAV status, and direct-to options.  
* **PROGRESS (PROG) KEY**: Opens `PROGRESS` (1/3), presenting current FROM, TO, NEXT, and DEST waypoints with ATA/ETA, altitude, fuel predictions, wind, temperature, and RNP/EPU status.  
* **ROUTE (RTE) KEY**: Opens `ACT RTE` (1/3) while on the ground, allowing input of ORIGIN, DEST, RUNWAY, CO ROUTE, and FLIGHT ID.

## **6\. Comprehensive FMS Page Visual Layout Specifications & Screen Mockups**

To serve as the primary reference for frontend developers and UI engineers, this section outlines the precise 14-line screen visual layout, line select key (LSK) prompt mappings, font sizing, color assignments, and page transition triggers for every core FMS page in the Embraer E2 Honeywell NG FMS.

### **6.1 FMS Visual Color & Typography Rules**

Following Honeywell NG FMS avionics specifications, the 14x24 monospace display applies six distinct visual styles:

1. **Header (Line 1\)**: Centered title in White text, with page numbers (e.g., `1/3`) right-aligned.  
2. **Small Font (Cyan/White)**: Data field labels (e.g., `TAIL #`, `ZFW`, `CRZ ALT`), computed calculations (ETA, DTG), and system defaults.  
3. **Large Font (Green)**: Active pilot entries, validated flight plan waypoints, and confirmed settings.  
4. **Prompts (`<` and `>`)**: White arrows on Lines 2–13 pointing toward LSKs, signaling available sub-pages or toggle actions.  
5. **Box Prompts (`□□□□□`)**: Small cyan square boxes displayed for compulsory initialization data.  
6. **Scratchpad (Line 14\)**: Bottom line reserved for pilot typing buffer and reverse-video warning alerts (e.g., `INVALID ENTRY`).

### **6.2 Power-Up & System Initialization Pages**

#### **Page 1: NAV IDENT (1/1)**

*Accessed via power-up FMS key push or `NAV INDEX 2/2` (2L).*

| Line | Left Select (LSK 1L–6L) | Line Header / Center Field | Right Select (LSK 1R–6R) | Typography & Visual Color |
| :---- | :---- | :---- | :---- | :---- |
| **1** |  | **NAV IDENT 1/1** |  | White Title |
| **2** | `MODEL` `E195-E2` |  | `NAV DB` `AIRAC 2405` | Small Cyan Label / Large Green Data |
| **3** | `ENGINES` `PW1900G` |  | `ACTIVE DATES` `16MAY-12JUN` | Small Cyan Label / Large Green Data |
| **4** | `SOFTWARE` `LOAD 11.0` |  | `INACTIVE DB` `18APR-15MAY` | Small Cyan Label / Small White Data |
| **5** | `<LDG IDENT` |  | `DB PART NUMBER` `DS31908001` | White Prompt (5L) / Small Cyan Data |
| **6** | `<MAINTENANCE` |  | `POS INIT>` | White Prompts (6L / 6R Reverse Video if position invalid) |
| **14** |  | `[ SCRATCHPAD BUFFER ]` |  | Green Scratchpad |

*Operational Logic*: Pilot verifies AIRAC database validity dates. Pushing `6R` (`POS INIT>`) sequences to Position Initialization. Pushing `5L` opens `LDG IDENT`.

#### **Page 2: POSITION INIT (1/1)**

*Accessed via `NAV IDENT` (6R) or `NAV INDEX 2/2` (1R).*

| Line | Left Select (LSK 1L–6L) | Line Header / Center Field | Right Select (LSK 1R–6R) | Typography & Visual Color |
| :---- | :---- | :---- | :---- | :---- |
| **1** |  | **POSITION INIT 1/1** |  | White Title |
| **2** | `LAST POS` `S23°37.4 W046°39.4` |  | `LOAD>` | Small Cyan Label / Large Green Coords / White Prompt |
| **3** | `REF WPT` `SBGR ARP` |  | `LOAD>` | Small Cyan Label / Large Green ARP / White Prompt |
| **4** | `GPS 1 POS` `S23°37.3 W046°39.5` |  | `LOAD>` | Small Cyan Label / Large Green GPS / White Prompt |
| **5** | `SET POS` `□□°□□.□ □□□°□□.□` |  |  | Small Cyan Label / Box Prompts |
| **6** | `<POS SENSORS` |  | `RTE>` | White Prompts (6L / 6R) |
| **14** |  | `[ SCRATCHPAD BUFFER ]` |  | Green Scratchpad |

*Operational Logic*: Pushing `1R`, `2R`, or `3R` loads the selected coordinates into the FMS position buffer. Once loaded, line `6R` displays `RTE>`, advancing the pilot directly to Route Setup.

### **6.3 Route & Flight Plan Pages**

#### **Page 3: ACT RTE (1/3)**

*Accessed via `RTE` Function Key or `POS INIT` (6R).*

| Line | Left Select (LSK 1L–6L) | Line Header / Center Field | Right Select (LSK 1R–6R) | Typography & Visual Color |
| :---- | :---- | :---- | :---- | :---- |
| **1** |  | **ACT RTE 1/3** |  | White Title |
| **2** | `ORIGIN` `SBGR` |  | `DEST` `SBRJ` | Small Cyan Label / Large Green Airport Identifiers |
| **3** | `RUNWAY` `09L` |  | `ALTN` `SBGL` | Small Cyan Label / Large Green Runway & Alternate |
| **4** | `CO ROUTE` `GRUJSD01` |  | `FLIGHT ID` `AZU1420` | Small Cyan Label / Large Green Flight ID |
| **5** | `<OFFSET` |  |  | White Prompt (5L) |
| **6** | `<PERF INIT` |  | `NEXT PAGE>` | White Prompts (6L / 6R) |
| **14** |  | `[ SCRATCHPAD BUFFER ]` |  | Green Scratchpad |

*Operational Logic*: Crew inputs Origin (`1L`), Destination (`1R`), Runway (`2L`), and Flight ID (`3R`). Pushing `6L` (`PERF INIT`) advances to Performance Initialization.

#### **Page 4: ACTIVE FLT PLAN (1/X)**

*Accessed via `FPL` Function Key.*

| Line | Left Select (LSK 1L–6L) | Line Header / Center Field | Right Select (LSK 1R–6R) | Typography & Visual Color |
| :---- | :---- | :---- | :---- | :---- |
| **1** |  | **ACTIVE FLT PLAN 1/4** |  | White Title |
| **2** | `FROM` `SBGR09L` | `1214z` `0.0NM` | `3000FT` `14.2G` | Yellow (FROM Wpt) / Small Cyan ATA/DTG / Small Cyan Alt/Fuel |
| **3** | `TO` `VEXIM` | `1218z` `18NM` | `FL100` `13.8G` | Magenta (TO Wpt) / Small Cyan ETA/DTG / Small Cyan Alt/Fuel |
| **4** | `NEXT` `BUSPA` | `1229z` `74NM` | `FL280` `12.9G` | Large Green Wpt / Small Cyan Predictions |
| **5** | `DEST` `SBRJ` | `1305z` `210NM` | `300FT` `10.5G` | Large Green Dest / Small Cyan Predictions |
| **6** | `<PERF DATA` |  | `PROGRESS>` | White Prompts (6L / 6R) |
| **14** |  | `[ SCRATCHPAD BUFFER ]` |  | Green Scratchpad |

*Operational Logic*: Waypoints display speed/altitude constraints, ETAs, and fuel predictions. Down-selecting an LSK copies the waypoint to the scratchpad; up-selecting inserts a waypoint or creates a Direct-To (`DIR`).

### **6.4 Performance Initialization Pages**

#### **Page 5: PERF INDEX 1/2**

*Accessed via `PERF` Function Key.*

| Line | Left Select (LSK 1L–6L) | Line Header / Center Field | Right Select (LSK 1R–6R) | Typography & Visual Color |
| :---- | :---- | :---- | :---- | :---- |
| **1** |  | **PERF INDEX 1/2** |  | White Title |
| **2** | `<PERF INIT` |  | `CRUISE>` | White Prompts (2L / 2R) |
| **3** | `<TAKEOFF` |  | `DES FORECAST>` | White Prompts (3L / 3R) |
| **4** | `<DEP LIM` |  | `DESCENT>` | White Prompts (4L / 4R) |
| **5** | `<CLIMB` |  | `APP SPD>` | White Prompts (5L / 5R) |
| **6** | `<LANDING` |  | `INDEX 2/2>` | White Prompts (6L / 6R) |
| **14** |  | `[ SCRATCHPAD BUFFER ]` |  | Green Scratchpad |

*Operational Logic*: Index menu granting instant access to all performance sub-modules. Pushing `6R` pages to `PERF INDEX 2/2` (Fuel Mgt & EO Range).

#### **Page 6: PERFORMANCE INIT 1/3**

*Accessed via `PERF INDEX 1/2` (2L) or `ACT RTE` (6L).*

| Line | Left Select (LSK 1L–6L) | Line Header / Center Field | Right Select (LSK 1R–6R) | Typography & Visual Color |
| :---- | :---- | :---- | :---- | :---- |
| **1** |  | **PERFORMANCE INIT 1/3** |  | White Title |
| **2** | `TAIL #` `PR-E2A` |  | `PERF FACTOR` `+0.0%` | Small Cyan Label / Large Green Tail & Factor |
| **3** | `FUEL RESERVE` `45 MIN` |  | `RESERVE MODE` `MINUTES>` | Small Cyan Label / Large Green Fuel Reserve / White Prompt |
| **4** | `TO / LDG ALW` `0.4 / 0.2` |  |  | Small Cyan Label / Large Green Fuel Allowance |
| **5** | `ALTN FUEL` `1.2` |  | `DLK PERF>` | Small Cyan Label / Large Green Altn Fuel / White Prompt |
| **6** |  |  | `NEXT PAGE>` | White Prompt (6R) |
| **14** |  | `[ SCRATCHPAD BUFFER ]` |  | Green Scratchpad |

*Operational Logic*: Sets fuel reserves and performance degradation factors. Pushing `6R` (`NEXT PAGE>`) advances to `PERFORMANCE INIT 2/3`.

#### **Page 7: PERFORMANCE INIT 2/3**

*Accessed via `NEXT` Key on `PERFORMANCE INIT 1/3`.*

| Line | Left Select (LSK 1L–6L) | Line Header / Center Field | Right Select (LSK 1R–6R) | Typography & Visual Color |
| :---- | :---- | :---- | :---- | :---- |
| **1** |  | **PERFORMANCE INIT 2/3** |  | White Title |
| **2** | `CRZ ALT` `□□□□□` |  | `PASS` `114` | Small Cyan Label / Box Prompts (2L) / Large Green (2R) |
| **3** | `CRZ WIND` `270° / 035` |  | `ZFW` `□□.□` | Small Cyan Label / Large Green Wind / Box Prompts ZFW |
| **4** | `ISA DEV` `+05°C` |  | `FOB (GAUGE)` `14.2` | Small Cyan Label / Large Green ISA & Gauge Fuel |
| **5** | `TAKEOFF CG` `□□.□` |  | `GROSS WT` `51.8` | Small Cyan Label / Box Prompts CG / Small Cyan GW |
| **6** | `<CONFIRM INIT` |  | `TAKEOFF INIT>` | Reverse Video Prompt (6L) / White Prompt (6R) |
| **14** |  | `[ SCRATCHPAD BUFFER ]` |  | Green Scratchpad |

*Operational Logic*: Requires pilot to input Cruise Altitude (`2L`), Zero Fuel Weight (`3R`), and Takeoff CG (`5L`). Once ZFW and FOB are entered, Gross Weight (`5R`) auto-calculates. Selecting `6L` (`CONFIRM INIT`) confirms performance computations.

#### **Page 8: TAKEOFF INIT 1/2**

*Accessed via `PERF INDEX 1/2` (3L) or `PERFORMANCE INIT 2/3` (6R).*

| Line | Left Select (LSK 1L–6L) | Line Header / Center Field | Right Select (LSK 1R–6R) | Typography & Visual Color |
| :---- | :---- | :---- | :---- | :---- |
| **1** |  | **TAKEOFF INIT 1/2** |  | White Title |
| **2** | `RWY HDG / ELEV` `093° / 2459FT` |  | `TAKEOFF GW` `51.8` | Small Cyan Label / Large Green Runway Data & GW |
| **3** | `PRESS ALT / OAT` `2410FT / +22°C` |  | `SURFACE WIND` `080° / 12` | Small Cyan Label / Large Green Baro & Wind Data |
| **4** | `RWY SLOPE` `+0.2%` |  | `RWY COND` `DRY>` | Small Cyan Label / Large Green Slope & Toggle Prompt |
| **5** | `AFE LIMIT` `1500FT` |  | `VNAV CAP AFE` `1000FT` | Small Cyan Label / Large Green Altitude Limits |
| **6** | `<PERF INIT` |  | `TAKEOFF VSPEEDS>` | White Prompts (6L / 6R) |
| **14** |  | `[ SCRATCHPAD BUFFER ]` |  | Green Scratchpad |

*Operational Logic*: Auto-populates database runway heading, elevation, and weight. Pushing `4R` toggles runway condition (`DRY` / `WET` / `CNTMNTD`). Pushing `6R` advances to Takeoff V-Speeds.

#### **Page 9: TAKEOFF VSPEEDS (2/2)**

*Accessed via `TAKEOFF INIT 1/2` (6R).*

| Line | Left Select (LSK 1L–6L) | Line Header / Center Field | Right Select (LSK 1R–6R) | Typography & Visual Color |
| :---- | :---- | :---- | :---- | :---- |
| **1** |  | **TAKEOFF VSPEEDS 2/2** |  | White Title |
| **2** | `V1` `134 KT` |  | `FLAP` `2` | Small Cyan Label / Large Green V-Speeds & Flap setting |
| **3** | `VR` `138 KT` |  | `PITCH TRIM` `4.2 UP` | Small Cyan Label / Large Green VR & Pitch Trim |
| **4** | `V2` `142 KT` |  | `TO FLEX` `48°C` | Small Cyan Label / Large Green V2 & Flex Temp |
| **5** | `VFS` `182 KT` |  | `TAKEOFF RSVD` `TO-1` | Small Cyan Label / Large Green VFS & Thrust Mode |
| **6** | `<TAKEOFF INIT` |  | `ACTIVE FLT PLAN>` | White Prompts (6L / 6R) |
| **14** |  | `[ SCRATCHPAD BUFFER ]` |  | Green Scratchpad |

*Operational Logic*: Accepts pilot V-speed entries or TOLD database calculated speeds. Pushing `6R` (`ACTIVE FLT PLAN>`) completes the preflight initialization sequence.

### **6.5 Navigation & Progress Monitoring Pages**

#### **Page 10: NAV INDEX 1/2**

*Accessed via `NAV` Function Key.*

| Line | Left Select (LSK 1L–6L) | Line Header / Center Field | Right Select (LSK 1R–6R) | Typography & Visual Color |
| :---- | :---- | :---- | :---- | :---- |
| **1** |  | **NAV INDEX 1/2** |  | White Title |
| **2** | `<DATALINK` |  | `ATC>` | White Prompts (2L / 2R) |
| **3** | `<WPT LIST` |  | `FIX INFO>` | White Prompts (3L / 3R) |
| **4** | `<FPL LIST` |  | `SEC FPL MENU>` | White Prompts (4L / 4R) |
| **5** | `<PATTERNS` |  | `HOLD>` | White Prompts (5L / 5R) |
| **6** | `<DEPARTURE` |  | `ARRIVAL>` | White Prompts (6L / 6R) |
| **14** |  | `[ SCRATCHPAD BUFFER ]` |  | Green Scratchpad |

*Operational Logic*: Navigation function menu providing direct access to procedures, secondary flight plans (`SEC FPL MENU`), holds, and ATC communications. Pushing `NEXT` key advances to `NAV INDEX 2/2`.

#### **Page 11: PROGRESS 1/3**

*Accessed via `PROG` Function Key.*

| Line | Left Select (LSK 1L–6L) | Line Header / Center Field | Right Select (LSK 1R–6R) | Typography & Visual Color |
| :---- | :---- | :---- | :---- | :---- |
| **1** |  | **PROGRESS 1/3** |  | White Title |
| **2** | `FROM` `SBGR` | `1214z` `ALT 2459` | `FUEL` `14.2G` | Yellow (FROM Wpt) / Small Cyan ATA & Fuel |
| **3** | `TO` `VEXIM` | `1218z` `DTG 18NM` | `ETA` `1218z` | Magenta (TO Wpt) / Small Cyan DTG & ETA |
| **4** | `DEST` `SBRJ` | `1305z` `DTG 210NM` | `EFOB` `10.5G` | Large Green Dest / Small Cyan DTG & EFOB |
| **5** | `WIND` `280° / 042` |  | `SAT / TAT` `-42°C / -18°C` | Small Cyan Atmospheric Data |
| **6** | `NAV 1` `VOR BCO 115.3` | `GPS-D` `EPU 0.04` | `NAV 2` `VOR CPN 116.2` | Small Cyan Radios / Green Active Sensor (`GPS-D`) |
| **14** |  | `[ SCRATCHPAD BUFFER ]` |  | Green Scratchpad |

*Operational Logic*: Primary in-flight monitoring screen displaying active waypoint progress, atmospheric wind data, estimated fuel at destination (`EFOB`), active navigation sensor (`GPS-D`), and Estimated Position Uncertainty (`EPU`).

## **7\. Phased Implementation Roadmap & Milestones**

The project is structured into five sequential phases over a 12-week development lifecycle to ensure continuous validation and incremental delivery.

### **Implementation Phases Breakdown**

The breakdown below organizes the development timeline into strategic milestones:

| Phase | Development Focus | Key Deliverables & Technical Goals | Timeline |
| :---- | :---- | :---- | :---- |
| **Phase 1** | **UI Frame & Display Foundation** | Build MC-860 physical bezel, 14x24 monospace grid renderer, font hierarchy, Web Audio click engine, and keyboard event bindings. | Weeks 1–2 |
| **Phase 2** | **Scratchpad & State Machine Engine** | Implement scratchpad editing stack, `CLR` / `DEL` key behaviors, up-select / down-select algorithms, and core message annunciation buffer. | Weeks 3–4 |
| **Phase 3** | **Function Keys & Page Hierarchy** | Build page router and index system for `PERF`, `NAV`, `FPL`, `PROG`, and `RTE` primary indices and secondary sub-pages. | Weeks 5–7 |
| **Phase 4** | **Preflight Initialization & Data Validation** | Implement procedure-driven preflight workflow (`NAV IDENT` \\rightarrow `POS INIT` \\rightarrow `ACT RTE` \\rightarrow `PERFORMANCE INIT` \\rightarrow `TAKEOFF INIT` \\rightarrow `TAKEOFF VSPEEDS`). | Weeks 8–10 |
| **Phase 5** | **Guided Training, Testing & Deployment** | Add guided training mode, instructor scenario configuration, automated test suites (Vitest/Playwright), and web deployment. | Weeks 11–12 |

## **8\. Testing, Quality Assurance & Avionics Validation Strategy**

To ensure strict compliance with the Honeywell NG FMS Pilot Guide manual specifications, the web simulator undergoes rigorous automated and manual validation.

### **Testing Framework Strategy**

1. **Unit & State Logic Testing (Vitest)**:  
   * Verify scratchpad character limit enforcement (max 24 characters).  
   * Test numeric range validation (e.g., Gross Weight exceedance alerts, V1 \> VR error triggers, invalid altitude formats).  
   * Validate weight and fuel arithmetic calculations (Gross Weight \= ZFW \+ Fuel on Board).  
2. **User Interface & Key Interaction E2E Testing (Playwright)**:  
   * Automate complete preflight initialization key sequence and confirm line field updates.  
   * Test `PREV` and `NEXT` paging keys across multi-page displays (such as `PERF INIT 1/3` to `3/3`).  
   * Verify screen color transitions upon data validation (cyan to green).  
3. **Avionics Procedure Validation**:  
   * Cross-check page prompt availability at `6L` and `6R` against standard Embraer E2 operating procedures.

