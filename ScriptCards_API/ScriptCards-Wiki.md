# ScriptCards

**API Script Author:** Kurt J.
**Current Version:** 3.0.30
**Dependencies:** None
**Conflicts:** None
**GitHub Repository:** https://github.com/kjaegers/ScriptCards/
**ScriptCards Discord:** https://discord.gg/jSB4wTNpXb

---

## Table of Contents

1. [Overview](#overview)
2. [Requirements & Installation](#requirements--installation)
3. [Basic Script Structure](#basic-script-structure)
4. [Comments](#comments)
5. [Variable Types](#variable-types)
6. [Object & Property References](#object--property-references)
7. [Conditionals](#conditionals)
8. [Loops](#loops)
9. [Procedures & Subroutines (GOSUB)](#procedures--subroutines-gosub)
10. [Reentrant Scripts & Interactive Buttons](#reentrant-scripts--interactive-buttons) — including [Information Requests](#information-requests---i)
11. [Output & Card Formatting](#output--card-formatting)
12. [Card Settings Reference](#card-settings-reference)
13. [Dice Rolling](#dice-rolling)
14. [Dice Roll Formula Syntax](#dice-roll-formula-syntax)
15. [Using Dice Rolls in Equations](#using-dice-rolls-in-equations)
16. [Object Modification](#object-modification)
17. [Object Creation & Deletion](#object-creation--deletion)
18. [Repeating Sections](#repeating-sections)
19. [Hash Tables](#hash-tables)
20. [DataGrids](#datagrids)
21. [Pointers](#pointers)
22. [Save / Load & Persistent Storage](#save--load--persistent-storage)
23. [Triggers](#triggers)
24. [Libraries](#libraries)
25. [Running Scripts from Handouts](#running-scripts-from-handouts)
26. [Beacon (D&D 2024 / New-Sheet) Support](#beacon-dd-2024--new-sheet-support)
27. [API Integration (Calling Other Scripts)](#api-integration-calling-other-scripts)
28. [String Functions Reference](#string-functions-reference)
29. [Additional Command Families](#additional-command-families) — Case Statement, Data/Read Queue, GOTO, Emote, Wait/Delay, Visual Effects
30. [Console Logging & Debugging](#console-logging--debugging)
31. [Known Limitations](#known-limitations)
32. [Version History Highlights](#version-history-highlights)

---

## Overview

ScriptCards is a Roll20 Mod (API Script) that implements a scripting language interpreter. It executes macros ("scripts") with variables, loops, branching, and other standard programming-language features. It is widely considered the spiritual successor to the older PowerCards script, and is used to generate richly formatted "cards" in the chat window — for attack rolls, spell effects, NPC stat blocks, menus, and more — independent of a character sheet's built-in roll templates.

Output is typically displayed as a formatted card in the chat window, though output can be suppressed entirely when a script is only making changes to tokens, attributes, or other behind-the-scenes game state.

ScriptCards is system-neutral — it isn't built around any single game system's character sheet, though the community has built extensive libraries and example scripts for D&D 5E (2014), and Beacon-sheet (D&D 2024) support is in active development as of v3.0.x.

> *As with all Roll20 API scripts, ScriptCards requires a Pro-tier subscription to use in a game, and is not available in the free or Plus tiers.*

---

## Requirements & Installation

1. A Roll20 game with API Mod access (Pro-tier subscription, at time of writing).
2. From the game's **API Scripts** page, search for "ScriptCards" and either:
   - **Add Script**, to install and receive automatic updates via Roll20's OneClick system, or
   - **Import** a copy from the GitHub repository if you need the latest development/experimental build.
3. For **Beacon sheet support (D&D 2024 and other new-format character sheets)**, you must switch your game to the **Experimental sandbox** under Game Settings → API Scripts → Sandbox. The default sandbox does not expose Beacon sheet fields to the API. You'll also need to install the latest version oF ScriptCards from GitHub, since the OneClick version is currently behind the Beacon-support branch.

---

## Basic Script Structure

A ScriptCards script is invoked in Roll20 chat (or from a macro/ability) using the `!script` command, with the body wrapped in double curly braces:

```
!script {{
--#title|My Card Title
--+Hello|World
}}
```

Each line of a script begins with two dashes (`--`) followed by a **tag** identifying what kind of operation the line performs, then a pipe (`|`) separating the tag from its **content**. Roughly:

```
--TAG|content
```

Different tags interpret their content differently — as literal output text, as a variable assignment, as a dice expression, as a conditional test, and so on. The table below lists all currently implemented statement tags, with a brief description of their purpose. See the linked sections below for full details and examples.:

| First char | Purpose |
|---|---|
| `!` | Object modification/creation (tokens, attributes, handouts, tables, characters, abilities) |
| `a` | Play a Jukebox track — `--aTrackName\|` |
| `c` | **Case/switch statement** — see [Case Statement](#case-statement) |
| `d` | **Data read queue** — see [Data / Read Queue](#data--read-queue) |
| `e` | **Emote** (send chat as another name) — see [Additional Command Families](#additional-command-families) |
| `h` | Hash table set |
| `i` | **Information Request** — pause the script and ask the player for a target/query — see [Information Requests](#information-requests---i) |
| `l` | Load (from persistent storage) |
| `p` / `P` | Pointer read/write (`--Pr`, `--Ps`) |
| `r` / `R` | Repeating section reference |
| `s` | Save/stash (persistent storage, or stash a reentrant script) |
| `w` | **Wait/delay** a command — see [Additional Command Families](#additional-command-families) |
| `v` | **Visual effects** (Roll20 spell-effect animations) |
| `x` / `X` | End/Exit script |
| `z` | Z-order (front/back) |
| `~` | Function call (arrays, hashtables, strings, system, object, repeatingrow, roll, datagrid, etc.) |
| `^` | **GOTO** — jump to a label without pushing a return address |
| `@` | **API Integration** — call another API script directly |
| `#` | Card settings (title, subtitles, whisper target, etc. — any key in the settings table) |
| `+` / `*` | Output line (`+` = normal card output; `*` = GM-only/whisper-only output) |
| `=` | Roll (dice) variable assignment |
| `&` | String or array-element assignment |
| `\\` | **Console log** (writes to the API console — this is a *different* tag from `--/` comments) |
| `<` | Return from a GOSUB (`-->`) call |
| `>` | GOSUB — call a procedure at a label, pushing a return address |
| `]` | Block-end (closes a `[`-bracketed conditional true/false block) |
| `?` | Conditional |
| `%` | Loop (`foreach`, `while`, `until`, or numeric `fornext` — see [Loops](#loops)) |
| `:` | Label definition (target for `-->` GOSUB and `--^` GOTO) |
| `/` | Comment (Does not impact script execution) |

---

## Comments

Lines beginning with `--/` are treated as comments and are skipped entirely during processing — they have no effect on execution or performance.

```
!script {{
--/|This is a comment
--/|Script Name: Magic Missile v2.1
--/|Author: Me
--/|===============================
--/|This script handles Magic Missile casting
--/|Prompts for spell level and target count
--/|Applies damage to up to 9 targets
}}
```

**Best practice:** document *why* code does something, not just *what* it does. A comment like "reduce target HP by damage rolled, checking for defeat" is more useful than "subtract damage." Many experienced ScriptCards authors open complex scripts with a comment block outlining overall flow before the actual code, and place comments before procedures (to document parameters) and before conditionals (to explain the logic being tested).

---

## Variable Types

ScriptCards has several distinct variable types, each with its own assignment/reference syntax and its own namespace (so a String Variable and a Roll Variable can share the same name without colliding).

### String Variables

- **Assign:** `--&VariableName|Value`
- **Reference:** `[&VariableName]`
- **Append/concatenate:** start the content with `+` to append to the existing value rather than replace it.

```
!script {{
--&Greeting|Hello
--&Greeting|+, World
--+Output|[&Greeting]
}}
```

String Variables can be used almost anywhere — output lines, roll expressions, conditionals, function parameters, and even to construct other variable names or object references dynamically.

**Best practice:** use String Variables for all non-random numeric values (character attributes, calculated values, static numbers) rather than Roll Variables. String Variables are simpler — the same symbol (`&`) is used for both assignment and reference, versus Roll Variables' distinct `=`/`$` — and they don't carry the overhead/semantics of a dice roll.

A per-line **concatenation character** setting lets you change the append trigger from `+` to something else if you need string values that begin with a literal `+`:

```
--#concatenationcharacter|~
```
(alias: the misspelled `concatonationcharacter` is also accepted for backward compatibility.)

Note: simply *referencing* a string variable with `[&Name]` does not change its value.

### Roll (Dice) Variables

- **Assign:** `--=VariableName|DiceExpression`
- **Reference:** `[$VariableName]` (full HTML-formatted result), or with a modifier suffix:
  - `.Raw` — the raw numeric total (safe to use in math/conditionals)
  - `.Base` — the base die result before modifiers (useful for crit/fumble checks)
  - `.Total` — full formatted total (equivalent to no suffix in most contexts — avoid using in conditionals since it may include HTML)

```
!script {{
--=Attack|1d20+5
--+Attack Roll|[$Attack]
--?[$Attack.Base] -eq 20|CRIT_LABEL|NORMAL_LABEL
}}
```

You can also assign inline within a variable reference using `[=VariableName:DiceExpression]`.

Every roll variable is actually a small object with several properties on it, and **any** of them can be pulled out with `[$VariableName.PropertyName]`. This is the complete, authoritative list, taken directly from the object the interpreter builds for every dice roll:

| Suffix | Type | Meaning |
|---|---|---|
| *(none)* — defaults to `.Total` | number | Same as `.Total` below, but includes HTML formatting when output |
| `.Raw` | number | Alias for `.Total` — the final numeric result, safe to use in math/conditionals |
| `.Total` | number | Final numeric result after all modifiers |
| `.Base` | number | The base die result before flat modifiers are applied (useful for crit/fumble checks) |
| `.Text` | string | Full HTML-formatted result as shown on the card |
| `.Style` | string | The CSS style block currently applied to this roll's highlight (normal/crit/fumble/both) |
| `.RollText` | string | The original dice expression that was rolled, after variable substitution |
| `.PaddingDigits` | number | Zero-padding width applied to the displayed total, if set |
| `.DiceFont` | string | Font override for this roll's dice display, if set |
| `.Ones` | number | Count of natural 1s rolled |
| `.Aces` | number | Count of "aces" (exploding-die triggers) rolled |
| `.Odds` | number | Count of odd results rolled |
| `.Evens` | number | Count of even results rolled |
| `.RollCount` | number | Total number of individual dice rolled |
| `.KeptCount` | number | Number of dice kept (relevant for keep-highest/lowest expressions) |
| `.DroppedCount` | number | Number of dice dropped |
| `.RolledDice` | array | Every individual die result rolled, in order |
| `.KeptDice` | array | Just the dice that were kept |
| `.DroppedDice` | array | Just the dice that were dropped |
| `.tableEntryText` | string | Text of the matched entry, for a Rollable Table roll (`[T#TableName]`) |
| `.tableEntryImgURL` | string | Image URL of the matched table entry, if any |
| `.tableEntryValue` | number | Numeric value of the matched table entry's text, if it parses as a number (`0` otherwise) |
| `.tableEntryWeight` | number | Weight of the matched table entry (added v3.0.0a) |

Individual dice from `.RolledDice`/`.KeptDice`/`.DroppedDice` can also be indexed directly: `[$VariableName.RolledDice(N)]` returns the Nth die (1-based) from that set. The same three arrays can be pulled out as standalone array variables with `--~|array;fromrollvar;ArrayName;RollVariableName;type`, where `type` is `rolled`, `kept`, or `dropped`.

When using a roll variable inside a conditional or as part of math, use `.Raw`, `.Base`, or another non-HTML property — **not** the bare reference or `.Total` printed directly into HTML-bearing contexts — since `.Text` and the unsuffixed default may carry HTML/styling markup that breaks numeric comparisons.

### Arrays

Arrays store ordered collections of values, referenced with `[@ArrayName(index)]` (zero-based). Common construction functions (via `--~|array;...`):

- `array;define;ArrayName;Item1;Item2;...` — define a static array
- `array;attributes;ArrayName;CharacterID;(optional name-starts-with filter)` — array of attribute IDs on a character
- `array;abilities;ArrayName;CharacterID;(optional filter)` — array of ability object IDs
- `array;pagetokens;ArrayName;TokenID;(optional filters)` — array of token IDs on the same page as the given token, with filtering (see below)
- `array;fromkeys;ArrayName;HashTableName` — array of all keys in a hash table
- `array;fromplayerlist;ArrayName` — array of non-GM player IDs in the game
- `array;fromgmplayerlist;ArrayName` — array of GM player IDs
- `array;fromcontrolledcharacters;ArrayName;PlayerID` — array of character IDs controlled by a player
- `array;fromrollvar;ArrayName;RollVariableName;type` — extract `rolled`, `kept`, or `dropped` dice from a roll variable into an array
- `array;statusmarkers;...` — array of active status markers on a token (empty markers excluded)

Special built-in array `[@args(...)]` is populated automatically inside a called procedure with the parameters passed via GOSUB (see [Procedures](#procedures--subroutines-gosub)); `[@args(length)]` / `[@args(maxindex)]` return the parameter count / max index.

**`array;pagetokens` filter syntax** (as of v2.7.11): multiple filters can be chained, separated by semicolons; filters are cumulative and can only *remove* items (so `npc;pc` together always returns nothing, since each filter removes what the other would keep). Filter types:

- `npc` / `pc` — token type
- `attr:AttributeName=Value` or `attr:AttributeName~=PartialValue` — character attribute match (exact or partial, case-insensitive on value)
- `prop:PropertyName=Value` / `prop:PropertyName~=PartialValue` — character property match
- `tprop:PropertyName=Value` / `tprop:PropertyName~=PartialValue` — token property match

```
--~|array;pagetokens;Tokens;@{selected|token_id};tprop:tooltip~=hello
--~|array;pagetokens;Tokens;@{selected|token_id};attr:npc_type~=undead
--~|array;pagetokens;Tokens;@{selected|token_id};npc;tprop:name~=Dr
```

### Hash Tables (Associative Arrays)

- **Set:** `--h:HashTableName("Key")|Value` (creates the hash table if it doesn't exist)
- **Reference:** `[:HashTableName("Key")]`
- Setting a key's value to an empty string removes that key from the table entirely.
- `--~|hash;clear;HashTableName` clears all keys.
- `--~|hash;set;HashTableName;Key1==Value1;Key2==Value2;...` bulk-sets multiple keys (the function group accepts both `hash` and `hashtable` as aliases).

```
!script {{
--h:Fruits("Mango-Cost")|2sp
--h:Fruits("Mango-Size")|Medium
--&Fruit|Mango
--+[&Fruit] Cost|[:Fruits("[&Fruit]-Cost")]
}}
```

Hash tables can also be built automatically from existing game objects:

- `--~|hashtable;fromobject;HashTableName;objecttype;objectid` — parses all attributes (except bio/notes/gmnotes) of a character/graphic into key-value pairs.
- `--~|hashtable;fromrepeatingsection;CharacterID;repeating_section_name;key_field;HashTableName` — builds a lookup table from a repeating section, keyed as `RowIdentifier_AttributeName` (see [Repeating Sections](#repeating-sections) for details and caveats).
- `--~|hashtable;fromrepeatingrow;CharacterID;repeating_section_name;RowID;HashTableName` — one specific row's fields.
- `--~|hashtable;fromjson;HashTableName;JSONString` — parse a JSON string into a hash table.
- `--~|hashtable;getjukeboxtracks;HashTableName` — populates keys for every Jukebox track name → object ID, plus `TrackName-playing`, `TrackName-loop`, `TrackName-Volume` keys.
- `--~|hashtable;getplayerspecificpages;HashTableName` / `setplayerspecificpages` — read/write the campaign's per-player current-page assignments.

### DataGrids

*(Added v3.0.25, experimental as of this writing.)* DataGrids are a CSV-backed tabular variable type, currently loadable only from a handout:

```
--~|datagrid;fromhandout;DataGridName;HandoutNameOrID;field;qualifier;delimiter
```

- `field` (optional, default `notes`) — which handout field holds the CSV data (`notes` or `gmnotes`).
- `qualifier` (optional, no default) — text qualifier character, e.g. `` ` `` or `"`, needed if your data contains the delimiter character within a field. (As of v3.0.25a, using `"` as the qualifier can confuse parameter parsing — using `` ` `` is recommended until this is resolved.)
- `delimiter` (optional, default `,`) — field separator.

The handout's first line should contain column headers; subsequent lines are data rows.

**Reference syntax:** `[^DataGridName;RowReference;ColumnName]`
- `RowReference` can be a 1-based row number (row 1 = first data row, not the header), or a `ColumnName=Value` match.
- Returns an empty string if no match is found.


### Datagrid example

Given this content in the `notes` field of a handout named `SkillsTable`:

```csv
Ability,Skill,AttributeName
Strength,Athletics,Athletics
Dexterity,Acrobatics,Acrobatics
Dexterity,Sleight of Hand,SleightofHand
Dexterity,Stealth,Stealth
Intelligence,Arcana,Arcana
```

Load it into a DataGrid named `Skills`:

```
--~|datagrid;fromhandout;Skills;SkillsTable
```

Then these references resolve as follows:

| Reference | Result |
|---|---|
| `[^Skills;4;Ability]` | `Dexterity` |
| `[^Skills;1;Skill]` | `Acrobatics` |
| `[^Skills;2;AttributeName]` | `SleightofHand` |
| `[^Skills;Skill=Stealth;Ability]` | `Dexterity` |

---

## Object & Property References

The `[*...]` syntax is ScriptCards' general-purpose way to read properties from characters, tokens, pages, campaign settingsm, and arbitrary game objects.

### Basic forms

| Syntax | Meaning |
|---|---|
| `[*S:AttributeName]` | Attribute on the **source** character (set via `--#sourcetoken` or similar) |
| `[*T:AttributeName]` | Attribute on the **target** character |
| `[*CharacterID:AttributeName]` | Attribute on an explicit character ID |
| `[*C:PropertyName]` | Campaign-level property |
| `[*P:PropertyName]` | Page property |
| `[*O:ObjectID:objecttype:PropertyName]` | Generic object property lookup by explicit type (`character`, `graphic`, `player`, `ability`, etc.) |

### Prefixes for non-attribute data

- `t-PropertyName` — token (Graphic) property, e.g. `[*S:t-left]`, rather than a character-sheet attribute.
- `b-` / `c-` — **Beacon** sheet fields (D&D 2024 and other new-format sheets). `c-` stands for "computed" (the internal field name); `b-` is an alias meant to read more naturally as "Beacon." Example: `[*S:c-hp]`. See [Beacon Support](#beacon-dd-2024--new-sheet-support). 

>**NOTE** Beacon support is undergoing a large revision in ScriptCards 3.0.30 and beyond. The `c-` and `b-` are no longer available in favor of direct alias syntax.

### Special/pseudo fields

- `_defaulttoken` — treated the same as a bio-style field internally.
- `[*O:PlayerID:player:isgm]` — returns `1` if the player is a GM, `0` otherwise.
- `[*C:...]` supports at least `playerpageid`, `nodeVersion`, and `sandboxVersion` among campaign properties. The number of properties associated with campaigns is limited.

### Nested (Beacon-style) references

Some newer, "Beacon SDK"-based character sheets store attribute data as nested JSON rather than flat attributes. ScriptCards supports drilling into these with `->`:

```
[*S:role->role->name]
[*S:role->specialty->name]
```

If an intermediate field doesn't exist, you'll get `undefined` (missing base attribute) or `Object.object` (missing nested field) rather than an error.

### Default values

Append `:::DefaultValue` to an `[*S:...]`, `[*T:...]`, or ID-based reference to supply a fallback if the attribute isn't found:

```
[*S:Height:::50]
```

### Object references beyond `[*...]`

- `[*R:...]` — repeating section reference (see [Repeating Sections](#repeating-sections)).
- Pointer variables (`--P`) exist specifically to move values between objects *without* going through string-variable parsing, for content that might otherwise get mangled (e.g., an ability's action text that itself contains ScriptCards syntax). See [Pointers](#pointers).

---

## Conditionals

### Block conditional

```
--?"[&Value]" -eq "Target"|LABEL_OR_TAG
```

The general form is a condition followed by `|` and then either a jump target/label, or (in some contexts) `+True|+False` -style branches, e.g.:

```
--?1 -eq 2|+True|+False
```

### Inline conditional

`[?condition|TrueResult|FalseResult]` can be used **inline**, anywhere a value is expected:

```
--=Roll|1d20
--+Test|Evaluation: [?[$Roll.Raw] -gt 10|Roll 1 is HIGH|Roll 1 is Low]
```

Inline conditionals can be **nested**:

```
--&HitType|[?[$Roll.Base] -eq 20|Crit|[?[$Roll.Base] -eq 1|Fumble|[?[$Roll.Base] -ge @{target|npc_ac}|Hit|Miss] ] ]
```

**Important gotcha:** Roll20 treats `[[` and `]]` as the start/end of an inline roll and will error/misbehave if they appear adjacent — including *incidentally*, from nested brackets in conditionals. When nesting brackets deeply, separate adjacent closing brackets with spaces (`] ] ]` instead of `]]]`). There is no way around this — it's a Roll20-level limitation, not a ScriptCards one.

When using Roll Variable references inside conditionals, use `.Raw`, `.Base`, or another non-HTML modifier — **not** the bare reference or `.Total`, since those may contain HTML that breaks the comparison.

### Conditional blocks (if / else)

A `--?` conditional can execute **multiple lines**, not just a single branch target, by using `[` as the destination and closing the block with `--]|`. Confirmed against source (`blockDepth`/`blockSkip` handling in the conditional-block dispatcher) and used constantly throughout real scripts:

```
--?Condition|[
... lines that run only if Condition is true ...
--]|
```

For an if/else, close the true-block and immediately reopen a false-block on the same line:

```
--?Condition|[
... lines that run only if Condition is true ...
--]|[
... lines that run only if Condition is false ...
--]|
```

This is the idiomatic way to guard several lines behind one test, rather than repeating the same condition on every line or restructuring around labels. Blocks can be nested. Real example, from the 5E Character Action Menu:

```
--?[&sendGmInfo] -eq 1|[
  --+[*R:atkname] Attack|rolled [$ToHit] vs the target's AC[br][br]
  --*[*R:atkname] Attack|rolled [$ToHit] vs AC [b][$AC.Raw][/b]
--]|[
  --+[*R:atkname] Attack|rolled [$ToHit] vs AC [b][$AC.Raw][/b][br][br]
--]|
```

A `--?` line can also branch straight to `<` (return) as a guard clause, without a block at all — handy for bailing out of a procedure early:

```
--?[&UseEmojisToReplaceText] -ne 1|<
```

### Conditional operators

This is the **complete, verified list** from the source's comparison-operator dispatcher — both sides are numeric-coerced when possible before comparing, otherwise compared as strings:

| Operator | Meaning |
|---|---|
| `-gt` | Greater than |
| `-ge` | Greater than or equal |
| `-lt` | Less than |
| `-le` | Less than or equal |
| `-eq` | Equal |
| `-eqi` | Equal, case-insensitive (string comparison) |
| `-ne` | Not equal |
| `-nei` | Not equal, case-insensitive |
| `-inc` | Left side includes/contains right side (case-insensitive) |
| `-ninc` | Left side does not include right side (case-insensitive) |
| `-csinc` | Includes, case-**sensitive** |
| `-csninc` | Does not include, case-**sensitive** |
| `-match` | Right side is a regex; case-sensitive match against left side |
| `-imatch` | Right side is a regex; case-**insensitive** match |

Joiners: `-and`, `-or` combine multiple conditions in one `--?` line.

**Regex operators** (`-match`/`-imatch`, added v2.7.28) accept a regular expression as the right-hand side.

```
--?"[&name]" -match "(Medusa\|Fred\|Pixie)"|+Yes|+No
--?"[&name]" -imatch "^(Medusa\|Fred\|Pixie)"|+Yes|+No
--?"[&name]" -imatch "^a.*n$"|+Yes|+No
--?[$Roll.Raw] -match "^[1-2]$"|+Yes|+No
```

Regex values should be quoted. Escape a literal `|` inside the pattern with `\|`; if you need a literal backslash-pipe sequence, use `\\|`.

---

## Loops

A loop is opened with `--%LoopVar|...` and closed with a matching `--%|` (empty content). Loops track state on an internal stack, so nesting works as long as every opened loop has a matching close.

### `foreach`

```
--%LoopVar|foreach;ArrayName
... body ...
--%|
```

Iterates `LoopVar` over each element of `ArrayName`. The array must be non-empty — an empty or undefined array logs an error and the loop body never executes.

```
!script {{
--#title|Party Report
--#whisper|gm
--%tokenid|foreach;SC_SelectedTokens
--+[*[&tokenid]:character_name]|
--%|
}}
```

### `while` / `until`

```
--%LoopVar|while;Condition
... body ...
--%|
```
```
--%LoopVar|until;Condition
... body ...
--%|
```

The condition is evaluated with the same syntax as a `--?` conditional (`Left -op Right`). `while` runs the body as long as the condition is true; `until` runs the body until the condition becomes true (i.e., it's the inverse test). The condition is re-evaluated at the top of every pass, including before the very first one — if it's false on entry for `while` (or true on entry for `until`), the loop body is skipped entirely and execution jumps straight past the matching `--%|`.

### Numeric range (`fornext`)

```
--%LoopVar|Start;End;Step
```
or, with an implied step of `1`:
```
--%LoopVar|Start;End
```

All values must be numeric. `LoopVar` starts at `Start` and is incremented by `Step` each pass (referenced as a normal string variable, `[&LoopVar]`) until it passes `End`. A `Step` of `0` is an error. This numeric form has **no dedicated example anywhere in the changelog or wiki** — it appears to be a long-standing but never-publicized feature.

```
!script {{
--%i|1;10;2
--+Value|[&i]
--%|
}}
```
(Outputs 1, 3, 5, 7, 9.)

### Breaking out of a loop early

`%!` is a recognized **loop-control destination**, not just a special form of the closing tag — it can be used inline, at any point inside a loop body, as the direct target of a conditional (or case statement) result, immediately exiting the current innermost loop from wherever it's triggered:

This is the idiomatic way to break out of a loop early — no separate label or jump is needed. The moment `Condition` evaluates true, execution exits the loop immediately, regardless of loop type (`foreach`, `while`, `until`, or numeric) or how many iterations remain, and continues with whatever follows the loop's closing `--%|`.

```
!script {{
--%i|foreach;SomeArray
--?"[&i]" -eq "StopHere"|%!
--+Still going|[&i]
--%|
--+After the loop|Done
}}
```

The plain closing form, `--%|` (with no condition), still works as the normal per-iteration "advance and loop" line as documented above — `%!` specifically means "stop the loop now," and both can appear in the same loop as long as the loop still has exactly one matching `--%|` to mark where its body ends.

Both `--?` (conditionals) and `--c` (case statements) share this same destination mini-language — `%` advances the current loop's iteration counter, and `%!` (checked via the second character) forces it to exit — so a case statement can break a loop the same way a conditional can:
`--cSomeVar|StopHere:%!`

## Procedures & Subroutines (GOSUB)

```
!script {{
--&Name|World
-->SayHello|[&Name]
--+After the call|We're back
--X|

--:SayHello|
--+Hello|[%1%]
--<|
}}
```

- Parameters passed via a GOSUB call are available two ways inside the called block: as `[%1%]`, `[%2%]`, etc. (1-based positional references), **or** via the `args` array — `[@args(0)]`, `[@args(1)]`, ... (0-based). `[@args(length)]`/`[@args(maxindex)]` give the parameter count.
- `--X|` ends the main script body (or, inside a called block, acts as a hard stop rather than a normal return — use `--<|` to return properly to the caller).
- A GOSUB into an undefined label logs an error and does not jump.

**Benchmarking:** set `--#functionbenchmarking|1` to have ScriptCards log call counts per procedure (labels reached via `-->`) and total script execution time (ms) to the API console after the script finishes.

---

## Reentrant Scripts & Interactive Buttons

ScriptCards supports building interactive, multi-step chat menus using clickable buttons that re-invoke the script with a specific label to jump to.

- `--#reentrant|UniqueKey` — marks the script as reentrant, stashing its state under `UniqueKey` so it can resume later (e.g., after a button click). Using a value derived from the sending player's ID (e.g. `CopyAbilities-[&SendingPlayerID]`) keeps concurrent sessions from different players from colliding.
- `[rbutton]Label::LABEL_TARGET;OptionalPayload[/rbutton]` — a clickable button. Clicking it re-runs the script, jumping to the `--:LABEL_TARGET|` label, with the payload available as `[&reentryval]`.
- `--:LabelName|` — defines a jump target (used both for reentrant button targets and general `GOTO`-style branching from conditionals).
- `--#hidecard|1` — suppress card output for a given execution pass (useful when a reentrant script's first pass is only building a menu, or a later pass is only performing an action with no visible output).

Example (from the changelog, a simple ability-copy menu):

```
!script {{
--#reentrant|CopyAbilities-[&SendingPlayerID]
--&id|@{selected|character_id}
--&tid|@{target|character_id}
--#title|Ability Copy
--#leftsub|From [*[&id]:name]
--#rightsub|To [*[&tid]:name]
--+|[c][b]Click abilities to copy[/b][/c]
--~dummy|array;abilities;ability_list;[&id]
--%abils|foreach;ability_list
--&Name|[*O:[&abils]:ability:name]
--+|[c][rbutton][&Name]::COPY;[&abils][/rbutton][/c]
--%|
--X|
--:COPY|
--&Name|[*O:[&reentryval]:ability:name]
--+|Copied [&Name]
--X|
}}
```

`--i` statements ("stash" scripts) and reentrant scripts both persist state in memory until cleared. Run `!sc-purgestashedscripts` to manually free that memory (it's also cleared automatically on a sandbox restart).

### Information Requests — `--i`

An Information Request lets a script pause and ask the sending player for additional input — a target token, a text answer, a dropdown choice — before continuing. It uses the tag portion of the line to define the prompt text and button caption shown to the player, and the content portion to define one or more requests for information:

```
--i<PromptText>;<ButtonLabel>|<Type>;<VariableName>;<Prompt>||<Type>;<VariableName>;<Prompt>||...
```

- `PromptText` (everything after `i` up to the first `;`) is whispered to the sending player. It's run through normal inline formatting if `--#formatinforequesttext|1` is set (default is off).
- `ButtonLabel` is the caption of the button the player clicks to respond.
- The content portion is a series of information requests, each in the form `Type;VariableName;Prompt`, separated by double vertical bars (`||`). Multiple requests, of the same or different types, can be combined on one `--i` line.

Supported request types:

| Type | Meaning |
|---|---|
| `t` | **Target** — prompts the player to select a token via Roll20's target query. `Prompt` is the label shown in the "Choose Target" window (e.g. `Choose Target: Missile1Target`). The selected token's ID is stored in the string variable `VariableName`. |
| `q` | **Query** — prompts the player via a Roll20 roll query (`?{...}`). `Prompt` is the query text, without the surrounding `?{}`. The response is stored in the string variable `VariableName`. |

When execution reaches an `--i` line, ScriptCards stashes the remainder of the script (resuming at the next line) in memory, hides the card for the current pass, and whispers the player the prompt with a button. Clicking the button responds to the requested targets/queries and resumes the script where it left off, with each result available as `[&VariableName]`.

Example:

```
--iScriptCards needs additional information to continue;Click to select a target and provide information|t;MyNewTarget;Missile1Target||q;MyNameIs;What is your name?
```

This whispers "ScriptCards needs additional information to continue" along with a button labeled "Click to select a target and provide information". Clicking it asks the player to choose a target token (labeled `Missile1Target` in the target picker, stored in `[&MyNewTarget]`) and answer a text prompt ("What is your name?", stored in `[&MyNameIs]`).

A `q` request's prompt can include dropdown options, using the same `Question|Option1|Option2|...` syntax as a normal Roll20 roll query:

```
q;UserName;What is your name?|Fred|Bob|Sally|Nancy
```

This presents a dropdown with four choices instead of a free-text field.

---

## Output & Card Formatting

### Basic output line

```
--+Label|Content
```

Produces a labeled row on the card. An unlabeled row can be produced with `--+|Content` (empty label).

### Inline formatting tags

This is the complete, verified list from the source's inline-formatting processor — every one of these is a straight text replacement performed on output content before it's placed on the card.

**Text style**

| Tag | Renders as |
|---|---|
| `[B]...[/B]` | Bold |
| `[I]...[/I]` | Italic |
| `[U]...[/U]` | Underline |
| `[S]...[/S]` | Strikethrough |
| `[Q]...[/Q]` | Blockquote (indented) |
| `[#xxx]...[/#]` or `[#xxxxxx]...[/#]` | Colored text — 3- or 6-digit hex code, no `#` needed inside the closing tag |
| `[F123]...[/F]` | Font size in px — e.g. `[F18]big text[/F]` |
| `[F:FontName:123]...[/F]` | Font family, with optional size in px — e.g. `[F:Georgia:16]...[/F]` |

**Alignment / layout**

| Tag | Renders as |
|---|---|
| `[C]...[/C]` | Centered block |
| `[L]...[/L]` | Left-aligned block |
| `[R]...[/R]` | Right-aligned block (floated right, with a clearing div after) |
| `[J]...[/J]` | Justified block |
| `[hr]` | Horizontal rule |
| `[hr #color]` | Horizontal rule with a custom border color |
| `[br]` | Line break |

**Tables**

| Tag | Renders as |
|---|---|
| `[t]...[/t]` or `[t attrs]...[/t]` | `<table>` |
| `[tr attrs]...[/tr]` | Table row, styled with the `tablestyle` template piece |
| `[td attrs]...[/td]` | Table cell, styled with the `tdstyle` template piece |
| `[th attrs]...[/th]` | Table header cell, styled with the `thstyle` template piece |
| `[p]...[/p]` or `[p attrs]...[/p]` | Paragraph |

Any `attrs` you include (e.g. `colspan="2"`) pass straight through onto the generated HTML tag.

**Headers**

`[h1]...[/h1]` through `[h5]...[/h5]` — each styled via its own template piece (`h1style` through `h5style`).

**Media**

| Tag | Renders as |
|---|---|
| `[img ...]url[/img]` | `<img ... src="url">` — attributes like `width=` / `height=` go inside the opening tag as usual |
| `[webm]url[/webm]` | An autoplaying, looping, muted-by-default `<video>` element |
| `[sm]MarkerName[/sm]` | Renders the named status-marker icon inline as an image |

**Fake/decorative roll display**

````
[roll]Text[/roll]
[roll:c]Text[/roll]   -- styled as a crit
[roll:f]Text[/roll]   -- styled as a fumble
````

Wraps arbitrary text in the same tooltip/highlight styling used for real dice rolls (normal/crit/fumble), without it being an actual roll — useful for displaying a precomputed or narrative "roll-looking" value.

**Dice-font glyphs**

`[d4]N[/d4]`, `[d6]N[/d6]`, `[d8]N[/d8]`, `[d10]N[/d10]`, `[d12]N[/d12]`, `[d20]N[/d20]` — renders the number `N` as a themed die-face glyph in the corresponding die's font, colored/sized via the `dicefontcolor`/`dicefontsize` settings. Setting `usehollowdice` to a non-default value switches to the font's lowercase (hollow-style) glyph set.

**Buttons**

Three distinct button tags, all sharing the same optional customization syntax:

````
[button]Title::Action[/button]
[button:#TextColor:#BgColor:NNNpx:Hover Text]Title::Action[/button]
````

The customization segment (everything between `button` and the closing `]`) is optional and order-flexible — the parser just scans each `:`-separated piece: the first one starting with `#` is treated as text color, a second `#` piece as background color, a piece ending in `px` as font size, and anything else as hover-text. Omit whichever you don't need.

| Tag | Behavior |
|---|---|
| `[button]Title::Action[/button]` | Clicking sends `Action` as a chat command (with leading-underscore-to-`--` escaping applied unless `dontcheckbuttonsforapi` is set) |
| `[sheetbutton]Title::CharacterOrTokenID::AbilityName[/sheetbutton]` | Runs an ability on a specific character sheet. The middle parameter is resolved flexibly — it's tried as a character ID, then as a token ID (using the token's represented character), then as a character name match, in that order |
| `[rbutton]Title::ReentryLabel[/rbutton]` | Reentrant button — clicking re-invokes the script via `!sc-reentrant`, jumping to the `--:ReentryLabel|` label with the current `reentrant` key |

Example with full customization:
````
[button:#FFFFFF:#8B0000:14px:Click to attack!]Attack::!script {{ --+|Attack rolled! }}[/button]
````

**Colors can be dynamic, not just literal hex codes** — variable expansion happens *before* the button-tag regex runs, so a customization slot can be a variable reference that resolves to a color at runtime. This is used extensively in the 5E Character Action Menu to toggle button colors on/off (e.g., active vs. inactive modifier buttons):

```
--&nbuttoncolor|#[&GAM_Button_Inactive_Color]
--C[&currentAdvantageMode]|0:&nbuttoncolor;#[&GAM_Button_Active_Color]|...
[rbutton:#FFFFFF:[&nbuttoncolor]]N::SET_ADV_MODE;0[/rbutton]
```

Here the background-color slot is `[&nbuttoncolor]` rather than a literal `#RRGGBB` — a case statement (see [Additional Command Families → Case Statement](#case-statement)) sets `nbuttoncolor` to one hex value or another depending on current state, and the button picks that up when the line is output.

### Literal/unprocessed text blocks

Text wrapped in `${ ... $}` is treated as **literal** and is not split into separate script lines or run through variable-replacement processing. This is essential when embedding another ScriptCards script (or any content containing `--`, `{{`/`}}`, or characters that would otherwise be parsed) inside a value:

```
--!t:[&TID]|tooltip:${ !script !{!{ --+Hello|Tooltip! !}!} $}|name:Just For Fun
```

Because Roll20 treats a literal `{{`/`}}` pair specially, use the escape sequences `!{!{` and `!}!}` to represent literal `{{` and `}}` characters inside a script (this became reliable/supported as of v3.0.22a; prior versions only extracted the outermost `{{`/`}}` pair).

---

## Card Settings Reference

Settings are configured with `--#SettingName|Value`. **Any key in the source's `defaultParameters` object can be set this way** — there's no separate whitelist; the settings handler just checks whether the name (after alias resolution) exists in the parameters table. Below is the **complete list, pulled directly from source**, organized by purpose, with the real default value for each. This replaces the earlier skeleton table entirely.

### Aliases

A handful of setting names have accepted aliases — using either name has the same effect:

| Alias | Resolves to |
|---|---|
| `tablebackgroundcolor` | `tablebgcolor` |
| `titlecardbackgroundcolor` | `titlecardbackground` |
| `nominmaxhilight` | `nominmaxhighlight` |
| `norollhilight` | `norollhighlight` |
| `buttonbackgroundcolor` | `buttonbackground` |
| `concatentioncharacter` *(sic, misspelled in source)* | `concatenationcharacter` |
| `reentry` | `reentrant` |

### Card structure & behavior

| Setting | Default | Purpose |
|---|---|---|
| `reentrant` | `0` | Enables reentrant/stashed-state behavior, keyed by the given string |
| `title` | `ScriptCards` | Card title text |
| `leftsub` / `rightsub` | `""` | Left/right subtitle text |
| `subtitleseparator` | ` ♦ ` | Separator shown between subtitle elements |
| `tooltip` | `Sent by ScriptCards` | Tooltip text on the card |
| `whisper` | `""` | Whisper target (blank = public) |
| `sourcetoken` / `targettoken` | `""` | Sets the token used for `[*S:...]`/`[*T:...]`; also auto-populates `sourcecharacter`/`targetcharacter` if the token represents a character |
| `activepage` | `""` | Set to `playerpage` to use the campaign's current player-ribbon page, or a page ID directly |
| `debug` | `0` | Enables verbose console logging of internal processing |
| `hidecard` | `0` | Suppress the entire card for this pass |
| `hidetitlecard` | `0` | Suppress just the title portion |
| `dontcheckbuttonsforapi` | `0` | — |
| `roundup` | `0` | Rounds fractional dice results up instead of down |
| `overridetemplate` | `none` | Use an alternate visual template instead of default card styling |
| `parameterdelimiter` | `;` | Delimiter character used to split function parameters |
| `concatenationcharacter` | `+` | Character that triggers string-variable append instead of replace |
| `formatoutputforobjectmodification` | `0` | — |
| `executionlimit` | `40000` | Max processing iterations before the script is halted (loop-safety limit) |
| `inlineconditionseparator` | `\|` | Separator used in inline `[?...]` conditionals |
| `deferralcharacter` | `^` | Escape character used when building deferred calls to other APIs (SelectManager/ZeroFrame/Fetch) via `--@` |
| `locale` | `en-US` | *(Not actually supported by Roll20's JS sandbox per an inline source comment)* |
| `timezone` | `America/New_York` | — |
| `hpbar` | `3` | Which token bar (1–3) is treated as HP by default |
| `outputtagprefix` | `""` | Prefix added before every output line's tag/label |
| `outputcontentprefix` | `" "` | Prefix added before every output line's content |
| `enableattributesubstitution` | `0` | Enables recursive `@{...}` attribute substitution |
| `formatinforequesttext` | `0` | Set to `1` to run an `--i` [Information Request](#information-requests---i)'s prompt text through inline formatting before whispering it |
| `explodingonesandaces` | `0` | — |
| `functionbenchmarking` | `0` | Logs per-procedure call counts and total execution time after the script finishes |
| `limitmaxbarvalues` | `0` | Caps `--!t` bar-value writes at the bar's max |
| `gmoutputtarget` | `gm` | Where `--*` (GM-only output) lines are sent; set to `self` to whisper the executing player instead |
| `storagecharid` | `""` | Character ID used for subsequent `--s`/`--l` persistent-storage statements |
| `beaconsheet` | `0` | Enables Beacon (new-format) sheet field support (`b-`/`c-` prefixes) |
| `dontnotifyobservers` | `0` | Suppresses notifying other API scripts of token changes made by this script |
| `titletextalign` | `center` | CSS `text-align` for the title text specifically |
| `disablevariableexpansion` | `0` | Disables `[...]` variable expansion globally for the script |

### Parsing/processing toggles

Each of these gates a specific stage of the interpreter's normal processing — useful for edge cases where a script's literal text is being misinterpreted. Traced against the current source:

| Setting | Default | Description |
|---|---|---|
| `allowplaintextinrolls` | `0` | Governs whether a trailing bare word at the end of a roll expression is passed through as literal text rather than rejected. See note below. |
| `showfromfornonwhispers` | `0` | When enabled, non-whispered card output shows the sending player's name as the chat "from" speaker (normally blank/anonymous). |
| `allowinlinerollsinoutput` | `0` | When off (default), strips any literal `[[`/`]]` left in rendered output (replaced with spaces) so Roll20 doesn't mistake it for a native inline roll. Enabling it leaves them intact. |
| `nominmaxhighlight` | `0` | Forces a roll's display style to "normal" even if it would otherwise qualify for crit/fumble (min/max) highlighting. |
| `norollhighlight` | `0` | Forces a roll's display style to "none," overriding crit/fumble/normal highlighting entirely. |
| `disablestringexpansion` | `0` | *Currently inert* — declared and saved as a setting, but not read anywhere in the current source. |
| `disablerollvariableexpansion` | `0` | *Currently inert* — declared and saved as a setting, but not read anywhere in the current source. |
| `disableparameterexpansion` | `0` | *Currently inert* — declared and saved as a setting, but not read anywhere in the current source. |
| `disablerollprocessing` | `0` | When enabled, skips dice-roll parsing/execution entirely. |
| `disableattributereplacement` | `0` | *Currently inert* — declared and saved as a setting, but not read anywhere in the current source. |
| `attemptattributeparsing` | `0` | When enabled, attempts to resolve calculated/auto-calc character-sheet attributes instead of returning their raw stored value. |
| `disableinlineformatting` | `0` | When enabled, skips ScriptCards' own inline formatting tags (`[b]`, `[i]`, etc.) and returns the output line unprocessed. |

> **Potential issue under review:** `allowplaintextinrolls` is checked as `cardParameters.allowplaintextinrolls !== 0` — comparing the setting (a string, `"0"`/`"1"`) to the *number* `0` with strict inequality. A string is never strictly equal to a number, so this condition is `true` regardless of the setting's actual value — in the current source, this flag appears to always behave as if enabled. Flagged here for confirmation rather than treated as a fixed bug.

### Fonts, colors, and card visual styling

| Setting | Default |
|---|---|
| `tableborder` | `2px solid #000000;` |
| `tablebgcolor` | `#EEEEEE` |
| `tableborderradius` | `6px;` |
| `tableshadow` | `5px 3px 3px 0px #aaa;` |
| `titlecardbackground` | `#1C6EA4` |
| `titlecardgradient` | `0` |
| `titlecardbackgroundimage` | `""` |
| `titlecardbottomborder` | `2px solid #444444;` |
| `titlefontface` | `Contrail One` |
| `titlefontsize` | `1.2em` |
| `titlefontlineheight` | `1.2em` |
| `titlefontweight` | `strong` |
| `titlefontstyle` | `normal` |
| `titlefontshadow` | `-1px 1px 0 #000, 1px 1px 0 #000, 1px -1px 0 #000, -1px -1px 0 #000;` |
| `titlefontcolor` | `#FFFFFF` |
| `lineheight` | `normal` |
| `subtitlefontsize` | `13px` |
| `subtitlefontface` | `Tahoma` |
| `subtitlefontcolor` | `#FFFFFF` |
| `bodyfontsize` | `14px;` |
| `bodyfontface` | `Helvetica` |
| `bodybackgroundimage` | `""` |
| `oddrowbackground` / `evenrowbackground` | `#D0E4F5` / `#eeeeee` |
| `oddrowbackgroundimage` / `evenrowbackgroundimage` | `""` |
| `oddrowfontcolor` / `evenrowfontcolor` | `#000000` |
| `rollfontface` | `helvetica` |
| `dicefontcolor` | `#1C6EA4` |
| `dicefontsize` | `3.0em` |
| `usehollowdice` | `0` |

### Roll highlight colors (crit/fumble)

| Setting | Default |
|---|---|
| `rollhilightlineheight` | `1.0em` |
| `rollhilightcolornormal` | `#FFFEA2` |
| `rollhilightcolorcrit` | `#88CC88` |
| `rollhilightcolorfumble` | `#FFAAAA` |
| `rollhilightcolorboth` | `#8FA4D4` |

### Crit/fumble thresholds by die size

These default to the die's natural max (crit) and `1` (fumble) — override any of these to change what counts as a crit/fumble for a given die size when using `--~|roll;setrollhighlight`:

`critd20` (20), `critd100` (100), `critd10` (10), `critd8` (8), `critd6` (6), `critd4` (4), `fumbled20` (1), `fumbled100` (1), `fumbled10` (1), `fumbled8` (1), `fumbled6` (1), `fumbled4` (1).

### Emote block styling

| Setting | Default |
|---|---|
| `emotetext` | `""` |
| `emotebackground` | `#f5f5ba` |
| `emotefont` | `Georgia` |
| `emotefontweight` | `bold` |
| `emotefontsize` | `14px` |
| `emotestate` | `visible` |
| `emotefontcolor` | `""` |
| `emotesourcetokensize` / `emotetargettokensize` | `50` |
| `emotesourcetokenoverride` / `emotetargettokenoverride` | `0` |

### Buttons

| Setting | Default |
|---|---|
| `buttonbackground` | `#1C6EA4` |
| `buttonbackgroundimage` | `""` |
| `buttontextcolor` | `White` |
| `buttonbordercolor` | `#999999` |
| `buttonfontsize` | `x-small` |
| `buttonfontface` | `Tahoma` |
| `buttonpadding` | `5px` |
| `buttonwidth` | `auto` |

### User-defined free storage

`usersetting0` through `usersetting9` — all default to `""`. ScriptCards itself never reads these; they exist purely as ten free slots for script authors' own use, and are included when saving/loading "allsettings."

---

## Dice Rolling

ScriptCards has its own built-in dice roller, invoked via `--=VariableName|Expression` (see [Roll Variables](#roll-roll-variables) above).

> ⚠️ **Critical:** ScriptCards does **not** parse Roll20 native inline rolls (`[[ ... ]]`). Use ScriptCards' own `--=` roll statements instead. Mixing native inline-roll syntax into a ScriptCards script will not produce the expected result.

Roll results can be styled with a highlight for crits/fumbles:

```
--~|roll;setrollhighlight;RollVarName;identifier
```
where `identifier` is one of `none`, `crit`, `fumble`, or `both`. (`sethighlight` is an accepted alias for this same function.)

Rolled/kept/dropped dice from a roll (e.g., advantage rolls, keep-highest expressions) can be extracted into a standalone array:

```
--~|array;fromrollvar;ArrayName;RollVariableName;type
```
where `type` is `rolled`, `kept`, or `dropped`.

Rollable Table references use `[T#TableName]`. As of v3.0.0a, table roll results include a `.tableEntryWeight` property reflecting the weight value of the matched table entry.

---

## Dice Roll Formula Syntax

Each `NdX`-style term inside a `--=VariableName|...` roll expression is matched against a single
combined format regex before being rolled (confirmed in `handleDiceFormats`), so modifiers must
appear as a single unbroken token — no spaces inside `3d8kh1r<2`, for example.

### Customizing dice rolls

| Format Pattern | Example | Description |
|---|---|---|
| `XdY` | `3d8` | Simple format. Roll a Y-sided die X times |
| `XdYkhZ` | `2d20kh1` | Roll Y-sided die X times and keep the highest Z number of dice |
| `XdYklZ` | `4d6kl3` | Roll Y-sided die X times and keep the lowest Z number of dice |
| `XdY>Z` | `5d6>3` | Roll Y-sided die X times and count a 1 for each roll greater than Z |
| `XdY<Z` | `5d6<3` | Roll Y-sided die X times and count a 1 for each roll less than Z |
| `XdYr<Q` and `XdYr>Q` | `10d6r<2` | Roll a Y-sided die X times, rerolling results less than or equal (or greater than or equal) to Q |
| `XdYro<Q` and `XdYro>Q` | `10d6ro<2` | Roll a Y-sided die X times, rerolling results less than or equal (or greater than or equal) to Q one time, keeping the reroll result |
| `XdY!` and `XdY!>Q` and `XdY!<Q` | `8d6!` | Roll a Y-sided die X times, rerolling max results and adding them to the total for the die (or rerolling results >= or <= Q and adding) — exploding dice |
| `XdYkhZr<Q` and `XdYkhZr>Q` | `4d6kh3r<1` | Roll a Y-sided die X times, rerolling results less than or equal to (or greater than or equal to) Q, and keep the highest Z results |
| `XdY!h` and `XdY!l` | `4d6!h` | Roll 1dY X times. If the max number on the die is rolled, roll it again and add to that die's total. Return only the highest (h) or lowest (l) die roll (Deadlands skill checks) |
| `XdF` | `4dF` | Fudge dice support. Roll a Fudge die X times, with possible values of `+`, `-`, or blank. Roll hover text and `.Text` display the values appropriately |
| `XdYW`, `XdYWS`, `XdYWH`, `XdYWSH` | `4d6W` | Wild dice support (as seen in games like the d6 System). X‑1 dice of Y sides are rolled normally. 1 die of Y sides is rolled as an exploding die. The `S` modifier makes the Wild die eliminate itself from the total if its first roll is a 1. The `H` modifier makes a first roll of 1 on the Wild die remove the highest die among the non‑wild dice. None, one, or both can be specified |
| `XuY` | `3u8` | Roll a Y-sided die X times, but only generate unique values. If X is greater than Y, only Y dice will be rolled |
| `XmY` | `3m8` | Roll a Y-sided die X times, but always use the highest number on the die. E.g. `3m8` will always roll 24 |

> **Note (carried over from the original wiki text, not independently re-verified against this source dump):** `Y` cannot equal `0`; rolling `Xd0` reportedly produced a `NaN` result as of v1.7.7.

**Additional modifiers confirmed directly from the format regex in `handleDiceFormats`, not present in the original wiki table:**

| Format Pattern | Description |
|---|---|
| `XdYe` | "Emphasis" roll — keeps only the die result closest to the middle of the die's range, dropping the rest |
| `XdY#` | Trailing `#` suppresses this term's crit/fumble highlighting and excludes it from `.Base` tracking (`dontHilight`/`dontBase`) |
| `XdYf<Q` | Failure counting — subtracts 1 from the total for each die at or below Q, alongside `>Z` success counting, and marks the roll as a failure highlight |

**Potential issues under review** — the following points were noticed while cross-referencing the wiki text against the source's `handleDiceFormats` function, and are flagged here for the team to confirm intended behavior before this documentation is finalized:

- **`XdY<Z` vs `XdY>Z`:** the outer format regex captures the threshold digits but not the `<`/`>` character itself (`successThreshold = Number(matches[x].substring(1))`), and the success test later in the function is unconditionally `rollSet[x] > successThreshold`. As written, `<Z` does not appear to invert the comparison the way the wiki text describes — both forms currently seem to count successes as "greater than Z." Under review.
- **`XdYf<Q` / `XdYf>Q`:** the inner handler code checks for both `f<Q` and `f>Q`, but the top-level format-recognition regex only includes `(f\<\d+)?` — no `f>` variant — so `f>Q` may not actually reach the failure-counting logic. Under review.
- **`XdY!h` / `XdY!l`:** in the source, both branches of the `!h`/`!l` handler set `keeptype = "h"` (keep highest); only the explosion trigger value differs (`sides` for `!h`, `1` for `!l`). `!l` may not currently return the lowest die as the wiki text describes. Under review.

---

## Using Dice Rolls in Equations

The following operators are supported between dice/number terms in a roll equation:

| Operator | Operation |
|---|---|
| `+` | Addition |
| `-` | Subtraction |
| `*` | Multiplication |
| `/` | Division |
| `\` | Integer Division (rounds down by default) |
| `%` | Modulo (remainder of division) |

The `\` integer-division operator respects the `roundup` [card setting](#card-settings-reference):
when `roundup` is `0` (the default) results are floored (rounded down); when `roundup` is `1`,
results are ceiled (rounded up) instead.

**Additional post-roll math functions confirmed from source, not in the original wiki text:** after
the dice/number terms are totaled, a single trailing `{function}` term can transform the running
total:

| Function | Effect |
|---|---|
| `{abs}` | Absolute value |
| `{sqrt}` / `{squareroot}` | Square root |
| `{ceil}` | Round up |
| `{floor}` | Round down |
| `{round}` | Round to nearest integer |
| `{round:N}` | Round to N decimal places (max 6) |
| `{neg}` / `{negate}` | Negate the value |
| `{sin}`, `{cos}`, `{tan}`, `{asin}`, `{acos}`, `{atan}` | Trigonometric functions |
| `{square}` | Square the value |
| `{cube}` / `{cubed}` | Cube the value |
| `{cbrt}` / `{cuberoot}` | Cube root |
| `{pad:N}` | Zero-pad the displayed total to N digits (sets `.PaddingDigits`) |
| `{min:N}` | Clamp the total to a minimum of N |
| `{max:N}` | Clamp the total to a maximum of N |
| `{clamp:N:M}` | Clamp the total between N and M |

---

## Object Modification

Object modification commands use the `--!` prefix family, targeting characters (`--!a`, `--!c`), tokens (`--!t`), handouts (`--!h`/`--!oh`), and more. General conventions:

- Values containing a `:` should be double-quoted.
- Values containing a literal `|` should be escaped as `\|` (double-backslash-pipe, i.e. `\\|` in raw text) — supported in `--!a`, `--!t`, and `--c` statements since v2.7.27.
- Setting an attribute that doesn't exist and prefixing the name with `!` will auto-create it (as of v2.7.27a, this also works via the sheetworker path without requiring the `!` prefix in repeating-section value-setting contexts — see v2.6.6b).

### Attributes — `--!a`

```
--!a:CharacterID|AttributeName:NewValue
```
Sets a character-sheet attribute. Prefix the attribute name with `!` to create it if missing, e.g. `--!a:CharacterID|!AttributeName:NewValue`.

### Token/Graphic properties — `--!t`

```
--!t:TokenID|PropertyName:Value|PropertyName2:Value2
```
Property names can optionally be prefixed with `t-`/`T-` and will be mapped correctly either way (v2.7.31+). Supports `bar1`–`bar4` and their linked properties (`bar#_value`, `bar#_max`, `bar#_link`). Setting bar values respects the optional `limitmaxbarvalues` setting, which — if enabled — caps a bar's value at its max when set via `--!t`.

If HealthColors (a separate API script) is installed, `--!t` bar changes will trigger its update.

### Beacon/computed fields — `--!c`

```
--!c:CharacterID|c-hp:10
```
Sets a Beacon-sheet ("computed") field, prefixing the field name with `c-` or `b-`. Supports `+=`/`-=` relative adjustment the same as non-Beacon values. Requires the Experimental sandbox. Some Beacon fields are read-only; attempting to set one logs a console message rather than failing silently.

### Handouts — `--!oh` (create) / `--!h` (modify)

```
--!oh:NewHandoutID|name:"My Handout"|notes:"This is a handout note"
--!h:[&NewHandoutID]|gmnotes:"Appended after creation"
```
Multiple properties are `|`-separated as `PropertyName:Value`; quote values containing spaces. As of v3.0.19b, handout creation/modification processes inline formatting (bold/italic/etc.) in the `notes` property.

### Deletion — `--!x`

```
--!x:TokenID|Optional reason for deletion
```
Deletes a graphic object (token). At present, **only graphic objects** can be deleted via `--!x`. A log message records what was deleted and by whom.

### Z-order — `--z`

```
--z:objecttype:objectid|operation
```
Supports `tofront` and `toback` for graphics.

### Creating abilities — `--!ob`

**Resolved from source.** Confirmed syntax:

```
--!ob:ReturnVariable:CharacterID:AbilityName:IsTokenAction|ActionText
```

- `IsTokenAction` — pass `y` to make it a token action button; anything else is treated as false.
- `ActionText` (the line's content, after `|`) becomes the ability's macro text.
- The new ability's object ID is written into the string variable named by `ReturnVariable`.
- On failure (e.g. character not found, or fewer than 3 colon-separated parts before the `|`), the return variable is set to the literal string `OBJECT_CREATION_ERROR` — this same sentinel value is used by every other `--!o*` object-creation command, so it's worth checking for generically after any creation call.

```
!script {{
--&id|@{selected|character_id}
--!ob:NewAbilityID:[&id]:Fireball:y|!script {{ --+|Casting Fireball! }}
--+Created|[&NewAbilityID]
}}
```

### Creating characters — `--!oc`

```
--!oc:ReturnVariable|CharacterName;...
```
Creates a new character object; the new character's ID is written to `ReturnVariable`.

---

## Object Creation & Deletion

### Tokens/graphics — `--!ot`

```
--!ot:ReturnVariable|Property1=Value1|Property2=Value2;...
```
- Quote any value that contains (or could contain) a colon.
- Numeric properties are validated; an invalid value defaults to 0 (e.g., `left=HELLO` → `left=0`).
- Boolean properties accept `true`, `yes`, `on`, or `1` (anything else evaluates false).
- Defaults if unspecified: `subtype=token`, `layer=objects`, `pageid=<current player ribbon page>`, `left=200`, `top=200`, `width=70`, `height=70`.
- Each `sides` image (for multi-sided tokens) is validated for Roll20 URL correctness (must end in a valid `?...` query string). Attempting to set `imgsrc` to a Marketplace-hosted image logs a warning, since the API cannot use Marketplace images this way.

Example — duplicate a token, offset one grid square to the right:

```
!script {{
--&sourceTID|@{selected|token_id}
--#sourcetoken|[&sourceTID]
--!ot:NewTID|name:"[*S:t-name] Copy"|left:[=[*S:t-left]+70]|top:[*S:t-top]|width:[*S:t-width]|height:[*S:t-height]|imgsrc:"[*S:t-imgsrc]"|tooltip:"[*S:t-tooltip]"|bar1_value:"[*S:t-bar1_value]"|bar1_max:"[*S:t-bar1_max]"|bar2_value:"[*S:t-bar2_value]"|bar2_max:"[*S:t-bar2_max]"|bar3_value:"[*S:t-bar3_value]"|bar3_max:"[*S:t-bar3_max]"|represents:[*S:t-represents]|controlledby:[*S:t-controlledby]|showname:1|statusmarkers:[*S:t-statusmarkers]
--+TID|[&NewTID]
}}
```

### Deletion — `--~|object;token;delete`

```
--~|object;token;delete;tokenid1;tokenid2;...
```
Logs an entry noting the deleting player and token ID(s). (Note this predates and functions alongside the newer, single-object `--!x` command above.)

### Rollable tables and entries

```
--!o#:ReturnTableID|TableName;ShowToPlayers
--!oe:ReturnEntryID|TableID;EntryText;Weight;AvatarURL
```
- `ShowToPlayers` defaults to no; accepts `true`/`yes`/`1`.
- `Weight` defaults to 1. An avatar image **requires** a weight to be specified.

```
!script {{
--!o#:tableid|MySCTable
--!oe:entryid|[&tableid];Entry 1
--!oe:entryid|[&tableid];Entry 2
--!oe:entryid|[&tableid];Entry 3;2
--!oe:entryid|[&tableid];Entry 4;6
--!oe:entryid|[&tableid];Entry 5;10
}}
```

---

## Repeating Sections

### Direct reference — `--R`

```
--Rfirst|CharacterID;repeating_section_name
[*R:AttributeName]
```
Positions an internal "cursor" at the first row of the named repeating section; `[*R:AttributeName]` then reads a field from that row.

**Find a specific row by ID:**
```
--Rbysectionid|CharacterID;repeating_section_name;RowID
```
Optionally append `;1` for a case-insensitive match on the row ID.

**Search by field value:**
```
--rfind|CharacterID;SearchText;repeating_section_name;field_name
--rsearch|CharacterID;SearchText;repeating_section_name;field_name
```
`--rfind` requires an exact-ish match; `--rsearch` does a case-insensitive partial match compiled as a regex (escape special regex characters like `+` with a backslash).

### Iterating every row — `--Rnext`

```
--Rnext|
```

Advances the cursor to the next row in whatever repeating section `--Rfirst`/`--Rbysectionid`/etc. last positioned it on. Combined with a sentinel check, this is the standard way to loop over an entire repeating section:

```
--Rfirst|[&CharID];repeating_traits
--:TRAIT_LOOP|
--?"[*R:name]" -eq "NoRepeatingAttributeLoaded"|TRAIT_LOOP_DONE
--+Trait|[*R:name]
--Rnext|
--^TRAIT_LOOP|
--:TRAIT_LOOP_DONE|
```

`"NoRepeatingAttributeLoaded"` is the literal sentinel value `[*R:...]` resolves to once the cursor runs past the last row (or when a `find`/`search` positioning command matches nothing) — check for it by name, as shown above, to detect the end of the section. This exact pattern (cursor loop + sentinel check) appears repeatedly throughout the 5E Character Action Menu script for walking traits, actions, spells, and inventory sections.

### Jump to a row by index — `--Rbyindex`

```
--Rbyindex|CharacterID;repeating_section_name;RowIndex
```

Positions the cursor directly at a specific 0-based row index, without needing to know that row's section ID.

### Debug dump — `--Rdump`

```
--Rdump|
```

Logs every field of the row currently under the cursor to the API console — useful for checking what fields/values actually exist on a row while developing a script.

**Explicit indexed forms** (v2.4.3+):
```
[*R:CharacterID:section_name:rowindex:attribute]
[*R>CharacterID:section_name:rowindex:attribute]
[*R:CharacterID:section_name:rowcount]
```
- The first form reads a value directly by numeric row index.
- The `>` form instead returns the **full attribute name** (suitable for use as the target of a `--!a` command) rather than the value.
- The `rowcount` form returns the number of rows in the section.

Example — finding a related row in another repeating section via a shared ID field (D&D 5E sheet pattern, linking `repeating_attack` to `repeating_inventory`):

```
!script {{
--Rfirst|@{selected|character_id};repeating_attack
--&ItemID|[*R:itemid]
--Rbysectionid|@{selected|character_id};repeating_inventory;[&ItemID]
--+Item Name|[*R:itemname]
--+Properties|[*R:itemproperties]
}}
```

### Bulk hash-table conversion

```
--~|hashtable;fromrepeatingsection;CharacterID;repeating_section_name;key_field;HashTableName
```
Builds a lookup table keyed as `RowIdentifier_AttributeName` (plus a `_max` variant per key, usually empty). Unsupported field types (attributes containing `@{...}` references, inline rolls `[[`, or template references `{{`) are still represented in the table, but with placeholder values: `Unsupported (AttrRef)`, `Unsupported (InlineRoll)`, or `Unsupported (TemplateRef)`.

```
--~|hashtable;fromrepeatingrow;CharacterID;repeating_section_name;RowID;HashTableName
```
Same, scoped to one specific row (includes a `_sectionid` key).

### Copying rows between characters

```
--~|repeatingrow;copybyindex;SourceCharacterID;DestinationCharacterID;repeating_section_name;rowindex
--~|repeatingrow;copybyfieldmatch;SourceCharacterID;DestinationCharacterID;repeating_section_name;field_name;field_value
```
Both accept an optional trailing parameter specifying a **different** target repeating section name on the destination character (rather than mirroring the source section name) — e.g., copying a 1st-level spell into a 2nd-level spell section:

```
--~|repeatingrow;copybyfieldmatch;@{selected|character_id};@{target|character_id};repeating_spell-1;spellname;Hunter's Mark;repeating_spell-2
```

### Repeating section attribute discovery

```
--~|array;attributes;ArrayName;CharacterID;(optional name-starts-with filter)
```

---

## Hash Tables

See [Variable Types → Hash Tables](#hash-tables-associative-arrays) above for core syntax. Additional notes:

- Function group name accepts both `hash` and `hashtable`.
- Storing an empty string as a key's value removes that key.

---

## DataGrids

See [Variable Types → DataGrids](#datagrids) above.

---

## Pointers

Pointer variables move a value directly between two object properties, bypassing normal string-variable parsing — useful when the value might contain content (like embedded ScriptCards syntax) that would otherwise get mangled by normal variable substitution.

```
--Pr|PointerName::ObjectID::PropertyName    (read: pointer ← object property)
--Ps|PointerName::ObjectID::PropertyName    (set: object property ← pointer)
```

One more source-confirmed detail not in the changelog: you don't need to know or specify the object's type. The pointer functions try `graphic`, `text`, `path`, `card`, `character`, `handout`, `ability`, and `attribute` in turn until one matches the given ID.

```
!script {{
--Pr|TestPtr::@{selected|character_id}::name
--Ps|TestPtr::@{target|token_id}::tooltip
}}
```
This reads the selected character's name into pointer `TestPtr`, then writes that value into the targeted token's tooltip.

A more complete example — copying an ability (including its raw action text) from one character to another, using a reentrant menu:

```
!script {{
--#reentrant|CopyAbilities-[&SendingPlayerID]
--&id|@{selected|character_id}
--&tid|@{target|character_id}
--~dummy|array;abilities;ability_list;[&id]
--%abils|foreach;ability_list
--&Name|[*O:[&abils]:ability:name]
--+|[c][rbutton][&Name]::COPY;[&abils][/rbutton][/c]
--%|
--X|
--:COPY|
--&Name|[*O:[&reentryval]:ability:name]
--&Desc|[*O:[&reentryval]:ability:description]
--&IsAction|[*O:[&reentryval]:ability:istokenaction]
--Pread|ActionPointer::[&reentryval]::action
--!ob:NewID:[&tid]:[&Name]:[&isAction]|temp
--Pset|ActionPointer::[&NewID]::action
--+|Copied action [&Name] from [*[&id]:name] to [*[&tid]:name]
--X|
}}
```

---

## Save / Load & Persistent Storage

ScriptCards can persist data between script runs (and between Roll20 sessions) using a dedicated storage character.

**Setup:** create a character named exactly `ScriptCards_Storage`, then **restart the sandbox** once before using it.

### Typed save/load commands

```
--s$optionalprefix|VarName1;VarName2;...   (save Roll Variables)
--s&optionalprefix|VarName1;VarName2;...   (save String Variables)
--s@optionalprefix|VarName1;VarName2;...   (save Arrays)
--s:optionalprefix|VarName1;VarName2;...   (save Hash Tables)
--s#optionalprefix|SettingName1;...        (save Settings)

--l$optionalprefix|VarName1;VarName2;...   (load Roll Variables)
--l&optionalprefix|VarName1;VarName2;...   (load String Variables)
--l@optionalprefix|VarName1;VarName2;...   (load Arrays)
--l:optionalprefix|VarName1;VarName2;...   (load Hash Tables)
--l#optionalprefix|SettingName1;...        (load Settings)
```

**Important:** when saving/loading, refer to the **variable name itself** — not a `[&...]`/`[$...]`-style reference, since that would be replaced with the variable's current *value* before the save command ever ran.

Values are stored as attributes on the `ScriptCards_Storage` character with a type-specific prefix:
- `SCR_` — Roll Variable
- `SCS_` — String Variable
- `SCA_` — Array
- `SCH_` — Hash Table
- `SCT_` — ScriptCards Setting

The optional prefix lets you namespace multiple stored copies of the same variable name (e.g., per-character or per-script). `--s&fred|charactername` stores under attribute `SCS_fred-charactername`; omitting the prefix stores under `SCS_-charactername`.

**All settings at once:**
```
--s#Name|allsettings     (saves title, leftsub, rightsub, whisper as a set)
--l#Name|allsettings     (loads them all back)
--l#Name|title           (or load just one setting from a saved set)
```

**Storage character override for the current script:**
```
--#storagecharid|SomeCharacterID
```

**Ten free-form user settings** (`usersetting0` through `usersetting9`) are available for arbitrary configurable storage alongside named settings sets — ScriptCards itself doesn't use these, they're purely for script authors' own use.

---

## Triggers

Triggers let a ScriptCards script (defined as an **ability** on a special character, conventionally referred to as your "Triggers mule" — commonly named `ScriptCards_Triggers`) run automatically in response to Roll20 events, rather than being invoked manually.

### Supported trigger events (as documented in the changelog)

- `add:character`, `change:character`
- `add:graphic`, `change:graphic`, `destroy:graphic`
- `add:door`, `change:door`, `destroy:door`
- `add:pin`, `change:pin`, `destroy:pin`
- `add:page`, `change:page`, `destroy:page`
- `change:attribute` (and, as of v2.7.19+, **multiple** triggers can be registered for the same attribute)
- `chat:message` (marked **EXPERIMENTAL** at introduction, v2.7.36)

### Naming and variable conventions

Ability names on the Triggers character follow the pattern:
```
change:attribute:AttributeName
add:graphic
chat:message:SomeTextToWatchFor
```

Each trigger type populates its own set of string variables for use inside the ability's action, generally following the pattern `&Old...`/`&New...` for change events and `&XAdded`/`&XRemoved` for add/destroy events. For example:

- `change:door` → `&OldDoor[property]`, `&NewDoor[property]` (e.g. `&NewDoorisOpen`, `&OldDoor_id`)
- `add:door` → `&DoorAdded` (the ID of the new door)
- `destroy:door` → `&DoorRemoved[property]` for each property the object had before deletion
- `change:page` → `&PageOld[property]`, `&PageNew[property]`
- `add:page` → `&PageAdded` (the ID of the new page)
- `destroy:page` → `&PageRemoved[property]` for each property the page had before deletion
- `add:character` → `&CharAdded`
- `change:character` → `&CharChanged` plus `&CharOld...`/`&CharNew...` per changed property

**`chat:message` triggers** are special:
- Detected only at sandbox start — adding your *first* `chat:message` trigger requires a sandbox restart to activate; once enabled, additional ones can be added without restarting. Removing all of them does **not** disable the feature until the next restart.
- Spaces are not allowed in ability names, so use dashes; the matching code treats dashes and spaces as equivalent when checking for a match (but doesn't alter the actual message content).
- Must be a ScriptCards script and **must** include a `--/|TRIGGER_REPLACEMENTS` comment line — this is required because the implementation inserts a hidden marker in output to prevent a `chat:message` trigger from re-triggering itself off its own output.
- Matching is **case sensitive**.
- Populates: `&TriggerWho` (display name of sender), `&TriggerPlayerID`, `&TriggerType` (`general`, `rollresult`, `gmrollresult`, `emote`, `whisper`, `desc`, or `api`), `&TriggerContent` (full message text).

```
Ability Name: chat:message:FAILED-1-of-3
Action:
!script {{
--/|TRIGGER_REPLACEMENTS
--+Player [&TriggerWho]|failed their first death save!
}}
```

### TokenMod integration

If a `ScriptCards_Triggers` character exists when the sandbox starts, ScriptCards will register to observe TokenMod's changes and fire a `change:graphic` trigger when TokenMod reports one. This is **off by default** to avoid surprising existing setups — enable it by setting the attribute `listen_to_tokenmod` to `1` (current value) on the `ScriptCards_Triggers` character.

---

## Libraries

Libraries are reusable collections of ScriptCards procedures distributed as **handout** content, so they can be shared across scripts without copy-pasting.

**To use a library:**
1. Paste the library's contents into a **handout** whose name matches what the library expects (by convention, `ScriptCards Library <shortname>`, e.g. `ScriptCards Library snlib`).
2. Reference it in your script with the inclusion marker `+++libraryshortname+++` (e.g. `+++snlib+++`), which makes the library's procedures available for use within your script via normal `-->`/GOSUB calls.

The community-maintained `systemneutrallib` (`snlib`) is a good example, consolidating general-purpose utility procedures (status-marker increment/decrement helpers, turn-order lookups, etc.) that aren't tied to a specific game system, gathered from various individual sample scripts.

### Checking whether an optional library is actually present

Since a `+++libname+++` inclusion silently does nothing if the expected handout doesn't exist, a script that wants to treat a library as *optional* needs its own way to detect that. The 5E Character Action Menu's approach: the library itself defines a trivial "ping" procedure, and the consuming script calls it and checks whether a marker variable got set:

```
+++ActionMenuAddons+++
-->LibAMA_CHECK_FOR_LIBRARY|UseAddons
```

Inside `ActionMenuAddons`, `LibAMA_CHECK_FOR_LIBRARY` sets the string variable named by its parameter (here, `UseAddons`) to `1`. If the library handout isn't present, the GOSUB target doesn't exist, the call silently fails, and `UseAddons` is left unset — so the rest of the script can gate optional behavior behind `--?[&UseAddons] -eq "1"|[ ... --]|`. This is a reusable pattern worth documenting for anyone writing a library meant to be optional.

---

## Running Scripts from Handouts

*(Added v3.0.24a, experimental at introduction.)* Beyond running scripts from chat or abilities, `!sc-runhandout` executes ScriptCards content stored in a handout's `notes` or `gmnotes` field:

```
!sc-runhandout <HandoutName OR HandoutID> [--option|value ...]
```

Options:

| Option | Purpose |
|---|---|
| `--field|<notes\|gmnotes>` | Which handout field holds the script (default `notes`) |
| `--select|<tokenid or comma-separated list>` | Populates `SC_SelectedTokens` |
| `--target|<tokenid or comma-separated list>` | Populates `SC_TargetTokens` (a target-equivalent of `SC_SelectedTokens`) |
| `--var|Name|Value` | Creates a string variable; repeatable for multiple variables |
| `--mergeselect|<true\|1>` | Merges `--select` tokens with the currently VTT-selected tokens instead of replacing them (VTT selection appears first in the merged array; duplicates are not repeated) |

```
!sc-runhandout ScriptCards_MagicMissile
!sc-runhandout ScriptCards_MagicMissile --select|@{selected|token_id} --target|@{target|token_id} --var|SpellLevel|3
```

**Important caveats:**
1. Scripts read from a handout do **not** pass through Roll20's chat server, so `@{selected|...}`-style inline references and `?{...}` roll-queries are **not** processed automatically — pass any needed values explicitly via `--select`/`--target`/`--var` instead.
2. All HTML/rich-text formatting is stripped when the handout is read — you can use Roll20's rich-text editor (bold, italics, etc.) purely to make the handout easier to *read and maintain*, but that formatting will not appear in the executed script. ScriptCards' own inline formatting tags in your **output** lines still work normally.
3. Anything possible in a chat-window ScriptCard should also work from a handout; if you find an exception, it's considered a bug worth reporting.

---

## Beacon (D&D 2024 / New-Sheet) Support

"Beacon" is Roll20's newer character-sheet SDK/architecture (used by D&D 2024 and some newer community sheets), with a hierarchical internal data structure rather than the older flat attribute model. Support for it is a major, still-evolving area of ScriptCards as of v3.0.x.

### Enabling

- Requires the **Experimental sandbox** (Game Settings → API Scripts → Sandbox). The default sandbox does not expose Beacon fields to the API at all.
- Set `--#beaconsheet|1` in your script to enable Beacon-specific handling.

### Reading and writing fields

- Read: `[*S:c-hp]` or `[*S:b-hp]` (the `c-`/`b-` prefixes are interchangeable; `c-` reflects the internal "computed" field name, `b-` is offered as a friendlier alias).
- Write: `--!c:CharacterID|c-hp:10` (supports `+=`/`-=` relative adjustment).
- Some fields are **read-only**; writing to one logs a console message rather than erroring silently.

```
!script {{
--&id|@{selected|character_id}
--+Current HP|[*[&id]:c-hp]
--=NewHP|1d20
--!c:[&id]|c-hp:[$NewHP.Raw]
--+New HP|[*[&id]:c-hp]
}}
```

### Field-name mapping differences

Beacon's hierarchical structure means many field names differ from their D&D 2014 flat-attribute equivalents. For example, `hp` in the 2014 sheet corresponds to `sheet->hitpoints->currentHP` internally in the 2024 sheet (though a flat `hp` alias is provided for convenience). A reference table of known field mappings is being maintained in the GitHub repo as `DND2024_beacon_sheet_reference.md`, described as a living/growing document.

### Known limitations (experimental as of v3.0.30)

- `c-`/`b-` prefixed reads/writes are **not currently supported** for non-D&D Beacon sheets (community sheets built on the Beacon SDK generally have much simpler structures than the D&D 2024 sheet, but ScriptCards' current field-mapping tables are D&D-2024-focused).
- Because this breaks scripts written against non-D&D Beacon sheets that expected `c-`/`b-` to work generically, a future update is expected to make ScriptCards gracefully strip/ignore unsupported prefixes rather than fail.
- v3.0.30 credits **Timothy B.** (creator of Tim's Spellbook Mod and Tim's NPC Stat Block Mod) as the primary author of this expanded Beacon support.

---

## API Integration (Calling Other Scripts)

ScriptCards has **two distinct ways** to integrate with other API scripts, confirmed from source. The first draft only had the first of these.

### Calling another script's ability directly — `--@`

See [Additional Command Families → API Integration](#additional-command-families) for the general-purpose form (`--@apicommandname|params...`), which builds and sends a `!apicommandname ...` chat command directly — this is what the wiki's "API Integration (call other API scripts)" feature bullet refers to.

### Running an ability on a character — `system;runaction`

A second, different mechanism: rather than calling another API script's command syntax directly, this looks up and runs an **ability** (macro) defined on a character, which may itself contain a call into another API script:

```
--~|system;runaction;CharacterID;AbilityName;param1;param2;param3;param4;...
```

This looks up ability `AbilityName` (case sensitive) on the given character, reads its Action text, and replaces `[REPL1]`, `[REPL2]`, etc. with the supplied parameters. The sequence `-_-_` in the target ability's action gets replaced with a double-dash (`--`) in the final generated macro, letting the called action safely include tag-prefix-like sequences.

Because these calls are issued by the API directly (not by a player sending a chat message), there is no "current player" context — interactive elements (targets, roll queries) in the called action won't work, but you can still pass IDs explicitly as `[REPL]` parameters.

```
--~|system;runaction;@{Macro_Mule|character_id};SetMarker;@{selected|token_id};+;blue
```
(`runability` is an accepted alias for `runaction`.)

**Known limitation:** the Roll20 API does not expose certain context (the sending player's ID, currently selected tokens) to a script invoked this way, unless that context is passed explicitly. If a target script relies on reading that context itself, it cannot be reliably driven this way.

### Which one to use

- **`--@`** — call another API script's `!command` syntax directly, as if you'd typed it in chat yourself. Best when you just need to trigger another script's existing chat command (e.g. `--@token-mod|--ids [&TID] --set statusmarkers|blue`).
- **`system;runaction`** — run a specific ability/macro stored on a character sheet, with parameter substitution. Best when the integration logic already lives in a character ability you want to reuse/parameterize.

---

## String Functions Reference

**There are two separate, complete string-function systems in ScriptCards**, confirmed directly from source. The first draft conflated them; they're distinct.

### System 1 — Inline modifiers: `[&VariableName(function)]`

Applied directly inside a variable reference. This is the complete list from the source dispatcher:

| Function | Effect |
|---|---|
| `length` | String length |
| `tolowercase` (aliases `lower`, `tolower`, `lowercase`) | Lowercase |
| `touppercase` (aliases `upper`, `toupper`, `uppercase`) | Uppercase |
| `totitlecase` (aliases `titlecase`, `title`) | Title Case |
| `reverse` | Reverses the string front-to-back |
| `contains` / `includes` (case-sensitive), `icontains` / `iincludes` (case-insensitive) | `[&Var(contains,text)]` → `1` or `0` |
| `word` | `[&Var(word,N)]` — Nth space-separated word (1-based); negative N counts from the end; `0` returns the full string |
| `indexof` / `iindexof` | Position of a substring (case-sensitive / insensitive); `-1` if not found |
| `lastindexof` / `ilastindexof` | Position of the *last* occurrence |
| `replace` | `[&Var(replace,find,replacement)]` — replaces the first occurrence |
| `replaceall` | Replaces every occurrence (guards against the replacement text containing the search text, to avoid an infinite loop — logs an error and leaves the value unchanged if so) |
| `before` | Everything before the first occurrence of a substring (returns the full string if not found) |
| `after` | Everything after the first occurrence |
| `split` | `[&Var(split,delimiter,index)]` — splits and returns one piece |
| `numbersonly` | Keeps only digits `0`–`9` |
| `nonumbers` | Removes digits |
| `numericonly` | Keeps only `-`, `.`, and digits |
| `alphaonly` | Keeps only letters |
| `isnumeric` | `1` if the value is all digits, else `0` |
| `(#)` or `(#,#)` — numeric args | Substring form: single number = start index to end; two numbers = start,length (negative length trims from the end instead) |

Example, given `&Test` = `-abc123.zyx89`:
```
[&Test(numbersonly)]  → 12389
[&Test(nonumbers)]    → -abc.zyx
[&Test(alphaonly)]    → abczyx
[&Test(numericonly)]  → -123.89
[&Test(reverse)]      → 98yzx.321cba-
```

### System 2 — Function calls: `--~|string;function;...`

A completely separate family, invoked via the function-call tag rather than inline. Confirmed list, grouped by parameter count:

**Two parameters** (`--~ResultVar|string;function;SourceValue`):

| Function | Effect |
|---|---|
| `strlength` / `length` | Length, returned as a **roll variable** (not a string variable) |
| `tolowercase` | Lowercase |
| `touppercase` | Uppercase |
| `striphtml` | Strips HTML tags |
| `striplinefeeds` (aliases `linefeedstobr`, `linefeedstobrs`) | Replaces line breaks (`\r\n`/`\n`) with `<br>` |
| `brtolinefeed` (aliases `brtolinefeeds`, `brstolinefeed`, `brstolinefeeds`) | Replaces `<br>` tags back with `\n` |
| `trim` | Trims leading/trailing whitespace |
| `onlynumbers` | Strips non-digits, preserving a leading `-` if present |
| `nonumbers` | Strips digits |
| `totitlecase` | Title Case |
| `bytes` | Logs the character-code of each character in the named string variable to console (debug aid, not a transform — note this takes the *variable name*, not its value) |

**Three parameters** (`--~ResultVar|string;function;Arg;SourceValue`):

| Function | Effect |
|---|---|
| `split` | Splits `SourceValue` on delimiter `Arg`; results go into `ResultVar1`, `ResultVar2`, ... and the count goes into a roll variable `ResultVarCount` |
| `before` | Everything before the first occurrence of `Arg` in `SourceValue` |
| `after` | Everything after the first occurrence of `Arg` |
| `left` | First `Arg` characters of `SourceValue` |
| `right` | Last `Arg` characters of `SourceValue` |
| `stripchars` | Removes every character found in `Arg` from `SourceValue` |

**Four parameters** (`--~ResultVar|string;function;Arg1;Arg2;SourceValue`):

| Function | Effect |
|---|---|
| `substring` | `substring;start;length;SourceValue` — 1-based start position |
| `replace` | Replaces the first occurrence of `Arg1` with `Arg2` |
| `replaceall` | Replaces every occurrence (same self-reference guard as the inline version) |

**Variable parameters:**

| Function | Effect |
|---|---|
| `replaceencoding` | Decodes `%xx`-style percent-encoded characters (angle/square/curly brackets, quotes, commas, percent, ampersand, parens, plus, minus, divide, equals) across all remaining parameters joined together |

**Global escaping:** `\[` and `\]` are automatically converted to literal `[` and `]` anywhere in a script (v2.7.26+), letting you include literal brackets without them being parsed as a reference.

---

## Additional Command Families

These don't appear in the wiki summary, the changelog, or any forum thread I found — they only turned up by reading the dispatcher directly. All are confirmed from source.

### Case Statement

A multi-way branch, similar in spirit to a `switch` statement, and sharing its destination mini-language with `--?` conditionals (see the destination-code table below):

```
--cVariableOrValue|Match1:Destination1|Match2:Destination2|...
```

`VariableOrValue` (the tag content after `c`) is compared case-insensitively against each `Match` in turn. On the first match, the corresponding `Destination` is executed. Escaped `\|` inside a destination lets a literal `|` appear where needed.

**Destination codes** (shared with `--?` block conditionals):

| Prefix | Meaning |
|---|---|
| *(none)* | GOTO — jump to a label |
| `>LabelName;params` | GOSUB — call a label, pushing a return address |
| `<` | Return from the current GOSUB |
| `%` or `%!` | Loop control — advance the current loop, or (`%!`) break out of it |
| `+Tag;Content` | Emit a normal output line directly |
| `*Tag;Content` | Emit a GM-only output line directly |
| `=VarName;Value` | Set a roll variable |
| `&VarName;Value` | Set a string variable |

```
!script {{
--&Choice|B
--cChoice|A:GoA|B:GoB|C:GoC
--X|
--:GoA|
--+|You picked A
--<|
--:GoB|
--+|You picked B
--<|
--:GoC|
--+|You picked C
--<|
}}
```

### Data / Read Queue

A BASIC-style `DATA`/`READ` mechanism — a script can preload a queue of values and pull from it sequentially.

```
--d!|Value1;Value2;Value3;...
```
Preloads the queue (processed in the pre-pass, before the script runs, so it works regardless of where in the script it's placed).

```
--dVariableName|
```
Reads the next value off the queue into string variable `VariableName`. If the queue is empty, the variable is set to `EndOfDataError`.

```
--d<|
```
Resets ("restores") the queue back to its original loaded state, so it can be read through again from the start.

### GOTO

```
--^LabelName|
```
Jumps directly to a label with no return address pushed — see [Procedures & Subroutines](#procedures--subroutines-gosub).

### API Integration — calling another API script directly

```
--@apicommandname|params...
```
Builds and sends `!apicommandname params...` to Roll20's chat/API pipeline as the executing player — this is the general-purpose "API Integration" feature referenced in the wiki's feature summary. Full details, including the underscore-escaping and SelectManager/ZeroFrame/Fetch deferral behavior, and how this compares to the separate `system;runaction` mechanism, are in [API Integration (Calling Other Scripts)](#api-integration-calling-other-scripts).

### Emote

```
--eSpeakerName|MessageContent
```
Sends `MessageContent` to chat as spoken by `SpeakerName` (via Roll20's `sendChat`) — independent of the card itself. Useful for narration/flavor text that shouldn't be part of the formatted card.

### Wait / Delay

```
--wSeconds:TagAndContent|
```
or, with no delay parsing (just wait for game-driven continuation):
```
--w|
```

Delays execution of a follow-up mini-script by `Seconds`, re-invoking ScriptCards after the delay with the given tag/content, automatically hiding the card (or just the title card, if the delayed tag starts with `+` or `*`) for that follow-up run.

### Visual Effects

```
--vtoken|effectParams...
```
Triggers Roll20's built-in visual-effects system (spell-effect animations, etc.) targeting a token, using space-separated parameters. This wraps Roll20's native `spawnFx`/visual effects API rather than implementing its own animation system.

---

## Console Logging & Debugging

### `--\` — direct console log

**Correcting the first draft:** the console-log tag is a **backslash (`--\`)**, not the comment tag (`--/`). These are two completely different tags that happen to look similar — `--/` lines are filtered out before the script ever executes and produce no output anywhere, while `--\` lines are actively processed and write their content to the API console.

```
--\|Whatever you want logged appears here
```

### `--~|system;dumpvariables;TYPE`

Logs the current value of all variables of the given type to the API console. **Complete, confirmed list of types:**

| Type | Dumps |
|---|---|
| `rolls` | All roll variables |
| `string` | All string variables |
| `array` | All array variables |
| `hash` (aliases `hashtable`, `hashtables`) | All hash tables |

Console logs are accessible via Game Settings → API Scripts → the console log, persist across a script's execution, and remain visible after the script finishes — useful for reviewing execution history without exposing internal mechanics to players (unlike chat output, which is visible in-game).

`--#functionbenchmarking|1` (see [Card Settings](#card-settings-reference)) logs per-procedure call counts and total script execution time after the run completes.

### `--~|system;readsetting;SettingName`

A small related utility found in source but not documented anywhere: reads the current value of any card setting into a string variable, e.g. `--~CurrentTitle|system;readsetting;title`.

---

## Known Limitations

- **Does not parse Roll20 native inline rolls** (`[[ ... ]]`). Use ScriptCards' own `--=` roll statements.
- **`[[`/`]]` adjacency**: nested bracket syntax (e.g. deeply nested inline conditionals) can accidentally produce adjacent `[[` or `]]` sequences, which Roll20 misinterprets as inline-roll delimiters. Separate them with a space.
- **Only graphic objects** can currently be deleted via `--!x` (not characters, handouts, etc., through that specific command).
- **API-invoked actions lack player/session context** (selected tokens, sending player ID) unless explicitly passed — relevant when using `system;runaction` to call another script's macro.
- **DataGrids** are experimental, with a known text-qualifier parsing issue when using `"` as the qualifier character (use `` ` `` instead for now).
- Roll20's own sandbox will detect and halt genuine infinite loops automatically.
- **Dice formula edge cases:** several dice-formula modifiers documented under [Dice Roll Formula Syntax](#dice-roll-formula-syntax) — the `<`/`>` direction on success counting, the `f>Q` failure-counting variant, and the `!l` (keep-lowest) exploding-die modifier — appear to behave differently from their documented description when read against the current source. These are flagged there as potential issues under review rather than confirmed bugs.

---

## Version History Highlights

This is a **summarized** version history covering major/breaking changes, not a full line-by-line changelog (the complete changelog is authoritative and lives at `ScriptCards_API/changelog.txt` in the GitHub repo — link this document to it rather than duplicating it in full).

- **v3.0.30 (experimental):** Major expansion of Beacon/D&D 2024 sheet support (primarily by Timothy B.), including a field-mapping reference doc.
- **v3.0.24a–v3.0.25a (experimental):** `!sc-runhandout` (run scripts stored in handouts); DataGrids (CSV-backed tabular variables from handouts).
- **v3.0.23:** `--!x` token deletion command.
- **v3.0.22:** Literal-text blocks (`${ ... $}`) and `{{`/`}}` escaping (`!{!{`/`!}!}`); repeating-row copy by field name.
- **v3.0.21:** Repeating-row copy by index (experimental); new turn-order `next`/`previous` functions.
- **v3.0.19:** Message queuing (prevents concurrent script runs from clobbering shared variables); handout creation/modification (`--!oh`/`--!h`).
- **v3.0.17:** Pointer variables (`--P`); array `abilities` function.
- **v3.0.0 — BREAKING:** Script converted to **async** code to support Beacon sheets. Direct `bio`/`notes`/`gmnotes` field access added. Beacon fields accessible via `b-`/`c-` prefixes (Experimental sandbox required).
- **v2.7.36:** `chat:message` triggers (experimental).
- **v2.7.30:** Graphic/token creation (`--!ot`) and deletion (`object;token;delete`).
- **v2.7.29:** Initial Beacon SDK nested-reference support (`->` syntax) for pre-2024-sheet Beacon sheets like Candela Obscura.
- **v2.7.28:** Regex conditional operators (`-match`/`-imatch`); `\|` escaping in tag/content separation.
- **v2.7.0:** Major refactor for maintainability/sandbox friendliness; `--z` (z-order); `--#storagecharid`; `--#gmoutputtarget`; `--#functionbenchmarking`; `SC_VERSION_NUMERIC`.
- **v2.6.4 — BREAKING:** `[*...]` object-type specifier changed from `::` to `:::` to avoid colliding with status-marker names. *(Scripts written before this version using the old `::` object-type syntax may need review.)*
- **v2.6.2:** Hash tables (associative arrays) introduced.
- **v2.6.0 (experimental):** Typed persistent save/load system (`--s$`/`--s&`/`--s@`/`--s:`/`--s#` and load counterparts) via a dedicated `ScriptCards_Storage` character.
- **v2.5.0:** `speakingas` settable via object modification using `^` instead of `|`.
- **v2.4.5:** Rollable table/table-entry creation (`--!o#`/`--!oe`).
- **v2.4.3:** Explicit indexed repeating-section references (`[*R:CharID:section:rowindex:attribute]` and the `[*R>...]` attribute-name form).
