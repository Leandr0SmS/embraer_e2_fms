# **Honeywell NG FMS MCDU Scratchpad Syntax & Data Entry Specification Guide**

## **1\. Scratchpad Architecture & Data Entry Fundamentals**

The Honeywell MC-860 Multifunction Control and Display Unit (MCDU) for the Honeywell Next Generation (NG) Flight Management System (FMS)—installed on Embraer E190-E2 and E195-E2 aircraft—uses Line 14 of its 14x24 character LCD display as an interactive working buffer known as the **scratchpad**.

Pilot entries made via the alphanumeric keypad accumulate in the scratchpad without affecting active flight guidance or performance states until line-selected into a data field via a Line Select Key (LSK 1L–6L or 1R–6R).

### **Scratchpad Processing & Validation Lifecycle**

```
[ Keypad Input ] ----> [ Scratchpad Buffer (Line 14) ]
                             |
                  Syntax & Range Validation
                             |
        +--------------------+--------------------+
        | Valid Input                             | Invalid
        v                                         v
[ Up-Select to LSK ]                     [ Reverse Video Alert ]
Data transferred to FMS memory           "INVALID ENTRY" pushed
Scratchpad cleared                       Original buffer stacked
```

### **1.1 Core Scratchpad Operating Rules**

1. **Character Budget & Alignment**: The scratchpad supports a maximum length of 24 characters. Entries are left-justified in large green font during manual typing.  
2. **Buffer Persistence Across Page Navigation**: Data typed into the scratchpad remains buffered across page transitions. Flipping from `ACT RTE` to `PERF INIT` retains the scratchpad text, allowing data to be carried across pages.  
3. **Up-Selection Mechanics**: Pushing an LSK when the scratchpad contains valid data transfers (up-selects) the data into the corresponding line field.  
4. **Down-Selection Mechanics**: Pushing an LSK when the scratchpad is completely empty down-selects the existing line field data into the scratchpad for inspection or editing.  
5. **Auto-Formatting Engine**: The FMS automatically normalizes shorthand inputs upon up-selection (e.g., three-digit altitude entries convert to Flight Levels, single-digit latitude inputs pad with leading zeros).

## **2\. Complete Scratchpad Data Entry Syntax Matrix**

The following reference table provides the exact syntax rules, character formats, legal ranges, auto-formatting conversions, and error message triggers for every supported data type in the Honeywell NG FMS.

| Data Parameter | MCDU Input Syntax | Format Specification | Allowed Range / Limits | Auto-Formatting / Normalization | Invalid Entry Trigger |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **Latitude** | `Nddmm.mm` or `Sddmm.mm` | Prefix `N` or `S`, 2-digit deg, 2-digit min, optional decimal & 2-digit hundredths | Lat: `0°` to `90°` Min: `0.0` to `59.99` | `N0` \\rightarrow `N00°00.00` `N1234.5` \\rightarrow `N12°34.50` | Out of range, missing `N`/`S` prefix, minutes \\ge 60 |
| **Longitude** | `Edddmm.mm` or `Wdddmm.mm` | Prefix `E` or `W`, 3-digit deg, 2-digit min, optional decimal & 2-digit hundredths | Long: `0°` to `180°` Min: `0.0` to `59.99` | `W0` \\rightarrow `W000°00.00` `W12345.6` \\rightarrow `W123°45.60` | Out of range, missing `E`/`W` prefix, minutes \\ge 60 |
| **Combined Lat/Long** | `Nddmm.mmWdddmm.mm` | Full latitude string concatenated directly with longitude string (no space) | World coordinates within `N/S 90°`, `E/W 180°` | `N50W050` \\rightarrow `N50°00.00 W050°00.00` | Syntax error, space inserted, invalid lat or long |
| **Airway Insertion** | `start.airway.end` | `[START_WPT].[AIRWAY].[END_WPT]` | Valid NDB airway & waypoints | `GUP.J102.ALS` inserts intermediate waypoints | Waypoint not on airway, airway not in DB |
| **Shorthand Airway** | `airway.end` | `[AIRWAY].[END_WPT]` (Start wpt must be in active FPL) | Adjacent to active waypoint | `J102.ALS` attached to active `GUP` | Preceding waypoint not on specified airway |
| **Multi-Airway Chain** | `start.airway1.airway2.end` | `[START].[AWY1].[AWY2].[END]` | Intersecting airways in DB | `TCS.J65.J4.PKE` computes airway intersection | Airways do not intersect, invalid DB identifiers |
| **Altitude / Flight Level** | `ddd` (FL) or `dddd` / `ddddd` (FT) | 3 digits \= Flight Level 1, 2, 4, 5 digits \= Feet | `-1,300 FT` to `60,000 FT` `FL000` to `FL600` | `280` \\rightarrow `FL280` `3000` \\rightarrow `3000FT` `050` \\rightarrow `FL050` | Above certified ceiling (e.g. \>41,000\\text{ ft} for E2), range exceedance |
| **VNAV Altitude Constraint** | `dddddA` / `dddddB` / `ddddd` | Append `A` (At or Above), `B` (At or Below), or none (At) | Up to 5 digits \+ suffix | `10000A` \\rightarrow `10000A` `FL180B` \\rightarrow `18000B` | Contradictory constraint, altitude \< \-1300\\text{ ft} |
| **Window Constraint** | `dddddAdddddB` | `[LOWER_ALT]A[UPPER_ALT]B` | Lower alt \< Upper alt | `16000A17000B` \\rightarrow Window 16,000–17,000 | Lower alt \> Upper alt, invalid syntax |
| **Calibrated Airspeed (CAS)** | `dd` or `ddd` | 2 or 3 numeric digits | `75 KTS` to `320 KTS` (or V\_{MO}) | `250` \\rightarrow `250 KTS` | Speed \< 75\\text{ KTS} or \> V\_{MO} (`320 KTS`) |
| **Mach Speed** | `.dd` | Decimal point followed by 2 digits | `.30` to `.82` Mach (or M\_{MO}) | `.78` \\rightarrow `M .78` | Speed \< .30 or \> .82 |
| **Gross Weight / ZFW / Fuel** | `dddd` to `dddddd` | 4 to 6 numeric digits (LB or KG) | `0` to `999,999` LB/KG (ZFW: `1,000`–`999,999`) | `42500` \\rightarrow `42.5` (displayed in thousands on summary pages) | Exceeds max ramp weight, ZFW out of bounds |
| **Wind Direction / Speed** | `ddd/ss` | 1 to 3 digit direction, slash, 1 to 2 digit speed | Dir: `0°` to `360°` Speed: `0` to `99 KTS` | `270/35` \\rightarrow `270° / 035` `80/12` \\rightarrow `080° / 012` | Direction \> 360°, Tailwind \> 15\\text{ KTS} alert, missing slash |
| **Outside Air Temp / ISA Dev** | `+dd` / `-dd` or `dd` | Optional sign, up to 2 numeric digits | Temp: `-55°C` to `+55°C` ISA Dev: `-80°C` to `+50°C` | `+5` \\rightarrow `+05°C` `-12` \\rightarrow `-12°C` | Temp \< \-55°C or \> \+55°C, ISA Dev out of range |
| **Hold Inbound Course & Turn** | `ddd/L` or `ddd/R` or `/L` / `/R` | 1 to 3 digit course, slash, turn direction (`L`/`R`) | Course: `0°` to `359°` Turn: `L` or `R` | `180/R` \\rightarrow `180° / RIGHT` `/L` \\rightarrow Left turn only | Course \\ge 360°, invalid turn character |
| **Hold Leg Distance / Time** | `d.d` / `dd.d` | Numeric with decimal | Dist: `1.0` to `20.0 NM` Time: `0.5` to `3.0 MIN` | `1.5` \\rightarrow `1.5 MIN` or `1.5 NM` | Dist \> 20.0\\text{ NM}, Time \> 3.0\\text{ MIN} |
| **Lateral Offset** | `Ld.d` or `Rd.d` | Prefix `L` (Left) or `R` (Right) \+ distance in NM | `0.1 NM` to `30.0 NM` | `L5` \\rightarrow `L 5.0 NM` `R12.5` \\rightarrow `R 12.5 NM` | Distance \> 30.0\\text{ NM}, offset on sharp turn |
| **Place / Bearing / Distance** | `[WPT]/ddd/ddd.d` | Waypoint identifier, slash, bearing, slash, distance | Bearing: `0`–`359°` Dist: `0.1`–`9,999.9 NM` | `PXR/090/30` \\rightarrow `&PBD01` `PXR/090T/30` (True BRG) | Waypoint not in DB, bearing \\ge 360° |
| **Place // Distance** | `[WPT]//ddd.d` | Waypoint identifier, double slash, distance | Dist: `0.1`–`9,999.9 NM` | `DRK//20` \\rightarrow `&PD01` | Missing double slash, waypoint invalid |
| **Place / Bearing Intersect** | `[WPT1]/ddd/[WPT2]/ddd` | Wpt1, slash, Brg1, slash, Wpt2, slash, Brg2 | Bearing: `0`–`359°` | `PXR/090/BXK/300` \\rightarrow `&PBPB01` | Radials do not intersect |
| **QNH / QFE Altimeter** | `dd.dd` (inHg) or `dddd` (hPa/mb) | Decimal format for inHg, integer for hPa/mb | inHg: `16.00` to `32.00` hPa: `542` to `1083` | `2992` \\rightarrow `29.92 INHG` `1013` \\rightarrow `1013 HPA` | Value outside barometric range |
| **Runway Heading & Slope** | `dd` / `ddd` (Hdg), `+d.d` (Slope) | 2-digit rwy number or 3-digit degrees; slope with sign | Hdg: `0`–`360°` / `01`–`36` Slope: `-2.0%` to `+2.0%` | `09` \\rightarrow `090°` `+0.2` \\rightarrow `+0.2%` | Slope \> 2.0\\%, heading invalid |

## **3\. Geographic & Flight Planning Data Entry Specifications**

### **3.1 Temporary Waypoint Creation Syntax**

When non-database waypoints or custom intersections are entered into the active flight plan, the FMS dynamically computes and assigns temporary waypoint identifiers prefixed with an ampersand (`&`):

1. **Latitude / Longitude (`&LLxx`)**:  
   * **Scratchpad Input**: `N5000.00W05000.00` or `N50W050`  
   * **FMS Assigned Identifier**: `&LL01`, `&LL02`, etc.  
   * **Lifecycle**: Retained only for current flight duration.  
2. **Place / Bearing / Distance (`&PBDxx`)**:  
   * **Scratchpad Input**: `PXR/090/30` (Magnetic) or `PXR/090T/30` (True bearing).  
   * **FMS Assigned Identifier**: `&PBD01`.  
   * **Usage**: Defines a waypoint along a radial from a known VOR/FIX.  
3. **Place // Distance (`&PDxx`)**:  
   * **Scratchpad Input**: `DRK//20` (Double slash indicates 0° radial offset, i.e., along current leg).  
   * **FMS Assigned Identifier**: `&PD01`.  
4. **Place / Bearing / Place / Bearing (`&PBPBxx`)**:  
   * **Scratchpad Input**: `PXR/090/BXK/300`  
   * **FMS Assigned Identifier**: `&PBPB01`.  
   * **Validation Error**: If the two radials are parallel or do not intersect within 999 NM, the scratchpad annunciates `RADIALS DO NOT INTERSECT`.

### **3.2 Airway String Entry Logic**

Airways can be entered using three distinct scratchpad syntaxes:

* **Full Segment Insertion**: `GUP.J102.ALS` entered at an empty `VIA.TO` prompt inserts all intermediate waypoints along jet route `J102` between `GUP` and `ALS`.  
* **Shorthand Continuation**: If `GUP` is already the active waypoint in the flight plan, typing `J102.ALS` into the scratchpad and up-selecting to the line immediately below `GUP` populates the airway segment.  
* **Airway-to-Airway Junction**: Typing `TCS.J65.J4.PKE` automatically resolves the intersection point between `J65` and `J4`, expanding all intermediate waypoints without requiring manual intersection lookup.

## **4\. Vertical Navigation, Performance & Weight Data Rules**

### **4.1 Altitude Interpretation Algorithm**

The FMS parses scratchpad altitude entries based on digit count:

```ts
function parseMCDUAltitudeInput(input: string): AltitudeParseResult {
  const cleanInput = input.trim().toUpperCase();
  
  // Suffix constraint checks
  const isAtOrAbove = cleanInput.endsWith('A');
  const isAtOrBelow = cleanInput.endsWith('B');
  const numericStr = cleanInput.replace(/[AB]/g, '');

  const value = parseInt(numericStr, 10);
  if (isNaN(value)) return { valid: false, error: "INVALID ENTRY" };

  // 3-Digit Rule: Interpreted as Flight Level
  if (numericStr.length === 3) {
    const flightLevel = value;
    const altitudeFeet = flightLevel * 100;
    if (flightLevel < 0 || flightLevel > 600) return { valid: false, error: "EXCEEDS CERT CEILING" };
    return { valid: true, display: `FL${flightLevel}`, feet: altitudeFeet, type: isAtOrAbove ? 'ABOVE' : isAtOrBelow ? 'BELOW' : 'AT' };
  }

  // 1, 2, 4, 5-Digit Rule: Interpreted as Feet
  if (value < -1300 || value > 60000) return { valid: false, error: "EXCEEDS CERT CEILING" };
  return { valid: true, display: `${value}FT`, feet: value, type: isAtOrAbove ? 'ABOVE' : isAtOrBelow ? 'BELOW' : 'AT' };
}
```

### **4.2 Weight & Balance Initialization Validation**

For Honeywell NG FMS performance calculations to commence, four compulsory fields must be initialized on `PERFORMANCE INIT 2/3`:

1. **Cruise Altitude (`CRZ ALT`)**: Must be entered at LSK `2L` (displayed as `□□□□□` until entered).  
2. **Zero Fuel Weight (`ZFW`)**: Entered at LSK `3R` in thousands of LB/KG (e.g., `42.5` or `42500`).  
3. **Fuel on Board (`FOB`)**: Automatically read from fuel sensors or manually entered at `4R`.  
4. **Takeoff Center of Gravity (`TAKEOFF CG`)**: Entered at LSK `5L` (e.g., `24.5`).

**Gross Weight Auto-Calculation Formula**: \\text{Gross Weight (GW)} \= \\text{ZFW} \+ \\text{FOB}

If Gross Weight exceeds the aircraft design limit (e.g., Maximum Ramp Weight), `GROSS WT` at `5R` displays in **Reverse Video Yellow/Cyan**, and the scratchpad triggers `EXCEEDS MAX GROSS WEIGHT`. If Takeoff CG is outside Aero Engine Database (AEDB) envelope limits, LSK `5L` displays in **Reverse Video**, and the scratchpad annunciates `CHECK TAKEOFF CG`.

## **5\. Scratchpad Editing Stack & Key Execution Engine**

### **5.1 Clear (`CLR`) Key Operation Logic**

The `CLR` key performs a dual-role function depending on whether a system alert message or manual text is currently displayed in Line 14:

```
[ PUSH 'CLR' KEY ]
        |
  Is Message Present in Scratchpad?
       /                  \
   YES/                    \NO
     v                      v
[ Clear Alert Message ]     [ Delete Last Input Character ]
Un-stack next message       Buffer length reduced by 1
or restore typed buffer     If empty, scratchpad remains clear
```

### **5.2 Delete (`DEL`) Key & `DELETE` Mode**

Pushing the `DEL` key writes `DELETE` into the scratchpad buffer in large green font.

* **Line Field Deletion**: Up-selecting `DELETE` to an LSK clears optional fields (such as speed limits, alternate airports, or secondary flight plans) or resets system parameters to AEDB default values.  
* **Waypoint Deletion**: Up-selecting `DELETE` to a flight plan waypoint LSK removes the waypoint and connects the surrounding path, closing the discontinuity.  
* **Scratchpad String Clear via Dash Suffix**: If a pilot types a partial scratchpad entry followed by a dash (`-`) (e.g., `N50W050-`), pushing the `DEL` key immediately clears the entire scratchpad string.

### **5.3 Core FMS Scratchpad Message Priority Queue**

When multiple system conditions occur simultaneously, the FMS stacks scratchpad alert messages in priority order (First In, Last Out for equal priority). The table below lists critical message definitions and resolution actions:

| Scratchpad Message | Priority Level | Trigger Cause | Resolution Action |
| :---- | :---- | :---- | :---- |
| `INVALID ENTRY` | High (Immediate) | Input fails syntax check, digit count, or numeric bounds | Push `CLR` to remove message; re-type valid entry |
| `INVALID DELETE` | High (Immediate) | Attempted to delete a mandatory field (e.g., origin airport) | Push `CLR`; mandatory fields cannot be deleted |
| `CHECK TAKEOFF CG` | High (Advisory) | Takeoff CG entry is outside AEDB allowable envelope | Re-enter valid CG at `PERF INIT 2/3` LSK `5L` |
| `EXCEEDS CERT CEILING` | Medium | Cruise altitude entered above aircraft certified limit | Re-enter cruise ALT \\le certified ceiling |
| `WAYPOINT NOT ON AIRWAY` | Medium | Entered airway does not contain the preceding flight plan waypoint | Verify airway identifier or preceding waypoint |
| `NO CROSSING POINT FOUND` | Medium | Lat/Long crossing search does not intersect active route | Check target latitude or longitude target |
| `MOD FPL ACTION REQD` | Medium | Attempted secondary flight plan swap while active route has unconfirmed MOD | Cancel or activate current MOD flight plan |
| `CHECK SPEED CONSTRAINT` | Low (Advisory) | VNAV predicts aircraft cannot decelerate to meet target speed | Deploy speedbrakes or adjust VNAV profile |

