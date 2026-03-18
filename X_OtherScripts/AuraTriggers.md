# AuraTriggers (Roll20 API Script)

## Status

AuraTriggers is currently **experimental**.

- API version: `0.6`
- Author: Kurt Jaegers
- Runtime warning from script: not ready for live/production games yet

## What It Does

AuraTriggers watches token movement and aura changes, then:

- Detects when tokens enter, remain inside, or exit configured auras
- Adds/removes status markers when configured
- Fires optional chat actions for enter/inside/exit events
- Can trigger optional source/target VFX and jukebox sounds on enter/exit
- Supports circular and square aura geometry (matching Roll20 aura shape)

The script reads aura behavior rules from each aura token's `gmnotes` JSON.

## How It Works

1. On `ready`, the script initializes state and registers listeners.
2. On startup (`ready`), it builds aura caches for all pages.
3. On `add:graphic`:
	 - Rebuilds aura cache for the token page.
	 - Immediately evaluates overlap for the new token.
4. On `destroy:graphic`:
	 - Checks whether the deleted token was the source of any active auras.
	 - Cleans up affected tokens by removing tracked membership for those auras.
	 - Runs exit chat actions and removes status markers when `removeOnExit` is enabled.
	 - Rebuilds the aura cache for the token page.
5. On `change:graphic`:
	 - If aura settings or `gmnotes` changed, it cleans up disabled auras first, then rebuilds the active aura list for that page.
	 - If the changed token is an aura source token, it rechecks all tokens on that page.
	 - If token position changed, it checks overlap against active auras.
6. Overlap checks determine one of four events:
	 - `enter`
	 - `inside`
	 - `exit`
	 - `none`
7. Based on event + aura config, it updates status markers and optionally sends chat actions.
8. On enter/exit events, optional VFX and sound effects can also be triggered.

## Chat Commands

### `!at-rebuild`

Rebuilds aura caches for all pages and whispers total active aura count to GM.

### `!at-clearallauras`

Sets `aura1_radius` and `aura2_radius` to `0` on all graphics across all pages, then rebuilds aura lists.

### `!at-checkall`

Forces overlap checks for all graphic tokens on all pages.

### `!at-report`

Logs all currently cached active auras via `log()`, including page id, aura name, and configured `attributeFilter` (or `(none)`).

## Aura Configuration in `gmnotes`

AuraTriggers expects `gmnotes` on the aura token to decode into a JSON array. The JSON must be an array of objects, where each object defines one aura behavior configuration. Each object must include a `color` field that exactly matches the token's `aura1_color` or `aura2_color` to be applied.

Strict JSON parsing is used, so formatting errors will cause the entire `gmnotes` entry to be ignored. The script logs parsing errors to the API console. I recommend using a JSON linter (such as https://jsonlint.com/) to validate your config before pasting it into the gmnotes field. Always paste as plain text (CTRL-Shift-V).

You can define one or more objects for the same aura color. Every matching entry for `aura1_color` and `aura2_color` is loaded and processed.

Example:

```json
[
	{
		"name": "Blessing Field",
		"color": "#00ff00",
		"icon": "angel-outfit",
		"toPCs": true,
		"toNPCs": true,
		"toGraphics": false,
		"toLayers": "objects,gmlayer",
		"applySelf": false,
		"removeOnExit": true,
		"chatActionOnEnter": "/em [TNAME] enters [ANAME]",
		"chatActionWhileInside": "!script --target [TID] --aura [ANAME]",
		"chatActionOnExit": "/em [TNAME] leaves [ANAME]"
	},
	{
		"name": "Blessing Field Visual",
		"color": "#00ff00",
		"icon": "angel-outfit",
		"toGraphics": true,
		"toLayers": ["map", "objects"]
	}
]
```

### Field Reference

- `name` (string): Display/logical name for the aura effect.
- `color` (string): Must exactly match the aura color on token, with the # sign (`aura1_color` or `aura2_color`).
- `icon` (string): Roll20 status marker key to apply while in aura.
- `toPCs` (boolean, default `true`): Apply to player-controlled character tokens.
- `toNPCs` (boolean, default `true`): Apply to non-player-controlled character tokens.
- `toGraphics` (boolean, default `false`): Apply to non-character graphics.
- `toLayers` (string, default `objects`): Restrict affected targets to specific Roll20 layers. 
    Examples: `"objects,gmlayer"`.
    Supported layer values: `objects` (alias `token`), `gmlayer`, `map`, `walls`, `foreground`.
- `applySelf` (boolean, default `false`): Apply the aura effect to the aura source token itself.
- `removeOnExit` (boolean, default `true`): Remove status marker when token exits aura.
- `chatActionOnEnter` (string, default `""`): Sent once when token enters an aura.
- `chatActionWhileInside` (string, default `""`): Sent on movement checks while token remains inside an aura.
- `chatActionOnExit` (string, default `""`): Sent once when token exits an aura.
- `sourceVfxOnEnter` (string, optional): VFX played at aura source token on enter event.
- `targetVfxOnEnter` (string, optional): VFX played at affected token on enter event.
- `sourceVfxOnExit` (string, optional): VFX played at aura source token on exit event.
- `targetVfxOnExit` (string, optional): VFX played at affected token on exit event.
- `soundOnEnter` (string, optional): Jukebox track title to play on enter event.
- `soundOnExit` (string, optional): Jukebox track title to play on exit event.
- `attributeFilter` (string, optional): Additional character-attribute condition(s) required for the aura to apply.

If multiple aura entries use the same `color`, all of them are applied.

### `attributeFilter` Syntax

- Multiple conditions can be chained with `|`.
- Each condition is parsed as: `<attrName> <operator> <value>`.
- The first token is always the attribute name.
- The second token is always the comparison operator.
- All remaining tokens are joined as the value (so values can include spaces).
- Note that "name" and "character_name" are special-cased to check the character's name instead of an attribute, and "token_name" checks the token name.

Supported operators:

- `-eq` (equals)
- `-ne` (not equals)
- `-lt` (less than, numeric)
- `-gt` (greater than, numeric)
- `-le` (less than or equal, numeric)
- `-ge` (greater than or equal, numeric)
- `-inc` (contains)
- `-ninc` (does not contain)
- `-startswith`
- `-endswith`

Example:
- "attributeFilter": "class -eq wizard"

## Matching Rules

- Aura entries are loaded only for tokens with non-zero `aura1_radius` and/or `aura2_radius`.
- Every JSON aura entry whose `color` matches one of the token's aura colors is used.
- Multiple entries with the same color are all applied; the script does not stop at the first match.
- Internal aura tracking uses a unique composite id format: `tokenId_color_jsonIndex`.
- Effective radius in pixels is computed from Roll20 aura radius units using page scale.
- Circular and square checks include token width when determining overlap.
- Aura source detection uses an internal helper (`tokenHasActiveAura`) against cached page aura data.
- Layer filters are applied after token-type checks (`toPCs`, `toNPCs`, `toGraphics`).

## Event Variables for Chat Actions

These placeholders are replaced inside chat action strings:

- `[TNAME]` -> moving token name
- `[ANAME]` -> aura effect name from JSON `name`
- `[ATNAME]` -> aura source token name
- `[TID]` -> moving token id
- `[ATID]` -> aura source token id

Unknown placeholders are left unchanged.

## Token Categories

The script classifies moving tokens as:

- PC token: represents a character with non-empty `controlledby`
- NPC token: represents a character with empty `controlledby`
- Graphic token: does not represent a character

Use `toPCs`, `toNPCs`, and `toGraphics` to control targeting.

## Defaults and Safety Behavior

- Missing/invalid `gmnotes` JSON does not crash the script; invalid JSON entries are ignored.
- If a field is omitted, defaults listed above are used.
- Status markers are added idempotently (no duplicates).
- If an aura source token is deleted, impacted tokens are cleaned up using tracked aura membership data.
- Missing character attributes used by `attributeFilter` are treated as empty strings instead of causing runtime errors.
- Enter/exit VFX and sound effects are processed in the same branch as enter/exit chat actions.

## Known Limitations (Current Build)

- Aura caching rebuilds based on `add:graphic`, `destroy:graphic`, `change:graphic`, startup, and manual commands; unusual edge cases may still require `!at-rebuild`.
- Marked as in development/testing by author.

## Minimal Setup Checklist

1. Install `AuraTriggers.js` in Roll20 API scripts.
2. Create or choose an aura source token.
3. Set aura radius/color (`aura1` and/or `aura2`) on that token.
4. Put JSON config in that token's `gmnotes` using matching `color` values.
5. Move a target token into/out of aura to test enter/inside/exit behavior.
6. Use `!at-rebuild` after major token/aura edits.

## Troubleshooting

- No effects firing:
	- Confirm aura radius is non-zero.
	- Confirm `gmnotes` JSON parses correctly.
	- Confirm JSON `color` exactly matches token aura color.
- Marker never removed:
	- Verify `removeOnExit` is `true`.
- Wrong targets affected:
	- Verify `toPCs`, `toNPCs`, `toGraphics` flags.
	- Verify `toLayers` includes the moving token's layer.
- Script appears stale:
	- Run `!at-rebuild`.

