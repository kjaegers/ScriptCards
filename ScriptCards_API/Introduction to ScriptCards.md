# Introduction to ScriptCards

*A beginner's guide to Kurt Jaegers' ScriptCards API for Roll20*

---

## Who this is for

If you run games on Roll20 and you've ever thought "I wish this attack roll could automatically apply damage," or "I wish clicking one button could roll to-hit, roll damage, and post it all in one nicely formatted card" — this guide is for you. You don't need to know JavaScript, and you don't need any prior programming experience. If you've ever built a spreadsheet formula or followed a recipe with conditional steps ("if it's browning too fast, turn down the heat"), you already have the right instincts for this.

By the end of this guide, you'll be able to write scripts that roll dice, make decisions, loop over your selected tokens, read values off a character sheet, and produce polished, formatted output in the Roll20 chat window. Along the way we'll build up one running example — a simple weapon attack — a little more at each stage, so you can see how the pieces fit together rather than just reading about them in isolation.

For the full technical reference once you're comfortable with the basics, see the companion **ScriptCards Wiki** document. This guide is deliberately narrower — it's here to get you writing useful scripts as quickly as possible, not to catalog every feature.

---

## What is ScriptCards, actually?

ScriptCards is a Roll20 API script — meaning it's a small program that runs inside your Roll20 game (this requires a Pro subscription) and adds new capabilities to the chat window. Specifically, ScriptCards gives you a little scripting language of its own. You write a "script" using ScriptCards' syntax, paste it into chat (or save it as a macro or character ability), and ScriptCards reads through it line by line, doing whatever each line asks: rolling dice, checking conditions, reading character sheet values, and building up a formatted "card" that gets posted to chat when it's done.

Think of it like a very small, purpose-built programming language, designed specifically for the job of "take some inputs, do some dice-rolling and decision-making, and produce a nice-looking chat message." It isn't trying to be a general-purpose language — every feature in it exists because someone needed it for a tabletop-game task.

A finished ScriptCards output is called a **card**. It typically looks like a small formatted box in the chat window, with a colored title bar, one or more labeled lines of information, and sometimes clickable buttons. If you've ever seen someone's Roll20 game post a slick "Longsword Attack: Hit! 14 damage" box instead of a plain dice-roll message, there's a good chance ScriptCards (or its predecessor, PowerCards) built that.

---

## Installing ScriptCards

1. Open your Roll20 game and go to the **Game Settings** page.
2. Click into **API Scripts**.
3. Search for "ScriptCards" and click **Add Script**. This installs the current stable release and keeps it updated automatically through Roll20's OneClick system.
4. Give the sandbox a few seconds to restart, then you're ready to go.

That's it — no configuration is required to start experimenting. (Some advanced features, like support for the newest D&D 2024 character sheets, require switching to Roll20's "Experimental" sandbox — but you won't need that for anything in this guide.)

---

## Your first script

Every ScriptCards script starts the same way: the command `!script`, followed by your actual script wrapped in double curly braces. Type this into your Roll20 chat box and press enter:

```
!script {{
--+Hello|World
}}
```

You should see a small formatted card appear in the chat, with a default blue title bar reading "ScriptCards," and one line below it reading:

> **Hello:** World

Let's take that apart, because every single ScriptCards script — no matter how complicated — is built from lines that follow this same basic shape.

- `!script {{ ... }}` tells Roll20 "the API script named ScriptCards should process everything between these braces."
- Inside the braces, each line of your script starts with two dashes, `--`.
- Right after the dashes comes a short "tag" telling ScriptCards what kind of thing this line does. Here, the tag is `+`, which means "add a line to my output card."
- After the tag comes a vertical bar, `|`, and then the **content** of that line.
- For an output line specifically, the content is split into a label and a value, separated by another `|`. So `--+Hello|World` means: "add an output line labeled Hello, with the value World."

That's genuinely the whole pattern. A ScriptCards script is just a list of lines, each one a two-dash tag, a pipe, and some content — and different tags interpret that content differently. Learning ScriptCards is mostly learning what the different tags do, and this guide is going to walk through the ones you'll reach for constantly.

### Try it yourself

Change the script above so the label says "Greeting" instead of "Hello," and the value is your character's name instead of "World." You should see your change reflected immediately when you run it.

---

## Giving your card a title

Right now our card just says "ScriptCards" at the top, which isn't very informative. Let's fix that using a **settings** line — a line whose tag is `#`.

```
!script {{
--#title|Tavern Brawl
--+Hello|World
}}
```

Settings lines configure how the card looks and behaves, rather than adding a visible line of output. `--#title|Tavern Brawl` sets the card's title to "Tavern Brawl." There are dozens of settings you can adjust this way — colors, fonts, who the card gets whispered to, and much more — but `title` is the one you'll use in nearly every script you write, so it's a good one to start with.

You can add a subtitle on the left and right side of the title bar too:

```
!script {{
--#title|Tavern Brawl
--#leftsub|Round 1
--#rightsub|Grog vs. Table
--+Hello|World
}}
```

Settings lines can go anywhere in your script, but it's common practice to put them near the top, so anyone reading your script later can see at a glance what the card is going to look like before they get into the actual logic.

---

## Rolling dice

Static text is fine, but the reason you're here is dice. ScriptCards has its own built-in dice roller, separate from Roll20's normal inline `[[ ]]` rolls — and this is important enough to say clearly up front:

> **ScriptCards does not understand Roll20's `[[ ]]` inline roll syntax.** If you put `[[1d20]]` inside a ScriptCards script, it won't work the way you expect. Always use ScriptCards' own dice syntax, which we're about to cover.

To roll dice, you use the `=` tag to create something called a **roll variable** — a named container that holds the result of a dice roll (and some extra information about that roll, which we'll get to later).

```
!script {{
--#title|Attack Roll
--=Attack|1d20+5
--+Result|[$Attack]
}}
```

Here's what's happening:

- `--=Attack|1d20+5` rolls one twenty-sided die, adds 5, and stores the result in a roll variable named `Attack`.
- `--+Result|[$Attack]` adds an output line. But instead of a plain word like "World," the value here is `[$Attack]` — a **reference** back to the roll variable we just created. Square brackets with a `$` inside them mean "substitute in the value of this roll variable here."

Run it a few times. You'll notice the roll comes out formatted nicely, often with a colored highlight if you roll very high or very low — ScriptCards automatically styles natural 1s and natural 20s differently, which is a nice touch you get for free.

### Reading just the number

Sometimes you don't want the whole nicely-formatted roll — you just want the plain number, so you can compare it to something. For that, add `.Raw` after the variable name inside the brackets:

```
!script {{
--=Attack|1d20+5
--+Formatted|[$Attack]
--+Just the number|[$Attack.Raw]
}}
```

`.Raw` and a handful of other "suffixes" like `.Base` (the roll before any bonuses were added — handy for checking for a natural 20) let you pull specific pieces of information out of a roll. We'll use `.Raw` and `.Base` constantly once we get to decision-making, a few sections from now.

---

## String variables: remembering things that aren't dice rolls

Not everything you want to store is a dice roll. Maybe you want to remember a character's name, a weapon's damage type, or a simple on/off setting. For that, ScriptCards has **string variables**, which use the `&` symbol instead of `=`/`$`.

```
!script {{
--&WeaponName|Rusty Dagger
--&DamageType|piercing
--+Weapon|[&WeaponName]
--+Damage Type|[&DamageType]
}}
```

The pattern should look familiar by now: `--&VariableName|Value` sets a string variable, and `[&VariableName]` reads it back. String variables are the workhorse variable type in ScriptCards — reach for them by default for anything that isn't a dice roll, even for plain numbers. They're simpler than roll variables (no `.Raw` suffix needed — a string variable is just its value) and they don't carry any of the "this was a dice roll" bookkeeping that roll variables do.

You can also build a string up piece by piece, rather than setting it all at once, by starting the new content with a `+`:

```
!script {{
--&Description|The dagger is
--&Description|+ rusty
--&Description|+ and slightly bent.
--+Result|[&Description]
}}
```

Each of those lines *appends* to `Description` instead of replacing it, because the content starts with `+`. This turns out to be really useful once you start building things up in a loop, which we'll see shortly.

---

## Making decisions: conditionals

A script that always does the same thing regardless of what you rolled isn't much better than typing the result by hand. The real power shows up once your script can make decisions — and for that, we use the `?` tag.

Let's write a script that rolls to hit, and tells us whether it was a critical hit, a critical miss (a "fumble"), or a normal roll:

```
!script {{
--#title|Attack Roll
--=Attack|1d20+5
--+Roll|[$Attack]
--?[$Attack.Base] -eq 20|CRIT
--?[$Attack.Base] -eq 1|FUMBLE
--X|

--:CRIT|
--+Result|Critical Hit!
--X|

--:FUMBLE|
--+Result|Critical Fumble!
--X|
}}
```

There's a lot going on here, so let's slow down.

**The conditional line itself:**
```
--?[$Attack.Base] -eq 20|CRIT
```
This reads almost like English: "if `[$Attack.Base]` is equal to (`-eq`) 20, jump to `CRIT`." Notice we're using `.Base` here, not `.Raw` — `.Base` gives us the raw die result *before* the `+5` bonus was added, which is exactly what we want, since a natural 20 is still a crit even with modifiers.

**The jump target:**
`CRIT` isn't a variable — it's a **label**, a named point elsewhere in the script that we can jump to. Labels are defined with the `:` tag: `--:CRIT|` marks the spot that a conditional (or several other things) can jump to by name.

**Why the `--X|` lines?**
Without them, execution would just fall through from one section into the next — after finishing the main part of the script, it would keep going straight into the `CRIT` section even if we didn't jump there. `--X|` tells ScriptCards "the script (or this branch of it) ends here." It's very common to see a script's main logic end with `--X|`, followed by one or more labeled sections that are only ever reached by jumping to them.

Try running that script a bunch of times. Most of the time you'll just see the roll with no special result line — because neither conditional matched, so neither jump happened, and we just fell through to the final `--X|`. Every so often you'll roll a natural 20 or natural 1 and see the special message.

### A shorter way for simple yes/no decisions

Jumping to labels is powerful, but it's overkill for something simple like "set this value to X if true, otherwise Y." For that, ScriptCards has an **inline conditional**, which you can drop directly into any value:

```
!script {{
--=Attack|1d20+5
--+Roll|[$Attack]
--+Outcome|[?[$Attack.Base] -eq 20|Critical Hit!|Just a normal roll.]
}}
```

The pattern is `[?condition|IfTrue|IfFalse]`. No labels, no jumping — just a compact "pick one of two values" right where you need it. This is perfect for short decisions; for anything that needs several lines of follow-up logic, the label-and-jump style from before is the better tool.

---

## Comparing things: the operators you'll actually use

You just saw `-eq` (equal to). Here are the comparisons you'll reach for most often, in roughly the order you'll need them:

| Operator | Meaning | Example |
|---|---|---|
| `-eq` | equal to | `[$Attack.Base] -eq 20` |
| `-ne` | not equal to | `[&Status] -ne "Dead"` |
| `-gt` | greater than | `[$Attack.Raw] -gt [*T:npc_ac]` |
| `-ge` | greater than or equal to | `[$Damage.Raw] -ge 10` |
| `-lt` | less than | `[$Attack.Base] -lt 5` |
| `-le` | less than or equal to | — |
| `-inc` | contains (for text) | `"[&Description]" -inc "fire"` |

Everything on the left and right of the operator gets compared, and text values should generally be wrapped in double quotes (as in the `-inc` example above), especially if there's any chance the value contains spaces.

There's a longer, complete list of every comparison operator ScriptCards supports — including case-sensitive and regular-expression variants — in the full reference document. The ones in the table above will cover the overwhelming majority of what you write.

---

## Reading values off a character sheet

So far every value in our scripts has been something we typed in by hand. The real payoff comes when we start pulling values directly off a character sheet — an attack bonus, a weapon's damage die, a saving throw modifier — so the script adapts automatically to whichever character is using it.

ScriptCards reads character sheet attributes using square brackets with an asterisk, `[*...]`. The most common form you'll use is `[*S:AttributeName]`, which reads an attribute from the current **source** character.

Before you can use `[*S:...]`, you need to tell ScriptCards *which* character is the source. The easiest way, in a real game, is to have a token selected and read its ID with `@{selected|token_id}`:

```
!script {{
--&SourceTokenID|@{selected|token_id}
--#sourcetoken|[&SourceTokenID]
--+Character Name|[*S:character_name]
--+Strength|[*S:strength]
}}
```

Select a token on your Roll20 map, then run this script (as a macro or from chat while that token is selected), and you'll see the character's name and Strength score pulled straight off their sheet. `character_name` and `strength` here are the internal attribute names used by whatever character sheet template your game uses — for the standard D&D 5E sheet, common ones you'll want include `strength_mod`, `dexterity_mod`, `pb` (proficiency bonus), and `hp` (hit points), among many others. If you're not sure what an attribute is called, the character sheet's own settings usually let you inspect attribute names, or you can ask in the ScriptCards Discord community.

### Putting it together: an attack roll that uses the character sheet

Now we can combine everything so far into something genuinely useful — an attack roll that pulls the character's Strength modifier and proficiency bonus automatically:

```
!script {{
--&SourceTokenID|@{selected|token_id}
--#sourcetoken|[&SourceTokenID]
--#title|[*S:character_name] attacks!

--=Attack|1d20 + [*S:strength_mod] + [*S:pb]
--+Attack Roll|[$Attack]

--?[$Attack.Base] -eq 20|CRIT
--?[$Attack.Base] -eq 1|FUMBLE
--X|

--:CRIT|
--=Damage|2d6 + [*S:strength_mod]
--+Result|Critical Hit! Damage: [$Damage]
--X|

--:FUMBLE|
--+Result|Critical Fumble!
--X|
}}
```

Notice that `[*S:strength_mod]` is dropped directly into the dice expression, right alongside the `1d20`. Character-sheet references, string variables, and roll variables can all be freely mixed together inside a dice expression, an output line, or almost anywhere else in a script — ScriptCards resolves all of them before doing anything else with the line.

---

## Doing something more than once: loops

Say you want to report every token you currently have selected, not just one. For that, we use a **loop**, tagged with `%`.

```
!script {{
--#title|Selected Tokens
--%tokenid|foreach;SC_SelectedTokens
--+Token|[*[&tokenid]:character_name]
--%|
}}
```

`SC_SelectedTokens` is a built-in list (an **array**) that ScriptCards automatically fills with the IDs of whatever tokens you currently have selected on the map — you don't have to set it up yourself. The loop above says: "for each item in `SC_SelectedTokens`, put it into the variable `tokenid`, run the lines below, then repeat." The closing `--%|` (empty content) marks where the loop's body ends.

Select two or three tokens and run that script — you'll get one output line per token, each showing that token's character name.

Notice the reference `[*[&tokenid]:character_name]` — this is reading a character sheet attribute, just like before, except instead of using the fixed `S:` shortcut for "the source character," we're plugging in a variable (`[&tokenid]`) as the ID directly. This pattern — using a variable inside another reference — comes up constantly once you start looping over things, so it's worth getting comfortable with early.

### Building up a list with a loop

Combining loops with the string-append trick from earlier lets you build up a single combined line of text from a whole list of things:

```
!script {{
--&Names|
--%tokenid|foreach;SC_SelectedTokens
--&Names|+[*[&tokenid]:character_name], 
--%|
--+Everyone Selected|[&Names]
}}
```

Each pass through the loop appends another name (plus a comma and a space) onto `Names`, so by the time the loop finishes, `Names` holds every selected character's name in one comma-separated line.

---

## Making it interactive: buttons

Everything so far has run once and posted a static result. ScriptCards can also produce **clickable buttons** that trigger more ScriptCards code when clicked — this is how those slick "click to roll damage" or multi-step menus you may have seen in other people's games actually work.

The simplest form is a plain button, using `[button]Label::Action[/button]` inside an output line:

```
!script {{
--#title|Ready to Roll?
--+|[button]Roll Damage::!script {{ --+Damage|2d6+3 }}[/button]
}}
```

Click the button that appears, and it runs the mini-script after the `::` — in this case, posting a new card with a damage roll. You can put any valid ScriptCards script after the `::`, including one that references variables, checks conditions, and so on.

### Reentrant scripts: multi-step menus

For anything more involved than a single follow-up action — think a menu of spells to cast, or a series of "pick a target, then pick a damage type" steps — ScriptCards has a feature called **reentrant scripts**. The idea is that clicking a button re-runs your *entire* script from the top, but tells it to jump straight to a specific label, almost like the conditional jumps we saw earlier, except triggered by a click instead of a dice roll.

Here's a small two-step menu as an example:

```
!script {{
--#reentrant|SimpleMenu
--#title|Choose One
--+|[rbutton]Say Hello::GREET[/rbutton]
--+|[rbutton]Say Goodbye::FAREWELL[/rbutton]
--X|

--:GREET|
--+|Hello there!
--X|

--:FAREWELL|
--+|Farewell, adventurer.
--X|
}}
```

A few new things here:

- `--#reentrant|SimpleMenu` marks the script as reentrant and gives it a name (`SimpleMenu`), so ScriptCards knows to "remember" this script and be ready to resume it later.
- `[rbutton]Label::TargetLabel[/rbutton]` — note the `r` — creates a **reentrant button**, distinct from the plain `[button]` we used before. Clicking it re-runs the whole script, but jumps straight to the label named after the `::`, skipping the menu-building part entirely.
- The `GREET` and `FAREWELL` sections are ordinary labels, exactly like the ones we used for conditionals earlier.

Run the script, and you'll see the two-button menu. Click either button, and instead of running the *entire* script fresh from the top (which would just show you the menu again), it jumps directly to the label you clicked and shows you that section's output instead.

This pattern — a reentrant script with a menu at the top and a handful of labeled sections below — is the backbone of most of the more elaborate ScriptCards tools you'll see in the wild, including full character action menus with dozens of buttons for spells, attacks, and abilities.

---

## Formatting your output

A card full of plain text works, but ScriptCards gives you a set of inline formatting tags — similar in spirit to BBCode, if you've ever used an old-school forum — to make your cards easier to read at a glance.

```
!script {{
--#title|Formatting Demo
--+|[b]Bold text[/b] and [i]italic text[/i]
--+|[c]Centered text[/c]
--+|Damage type: [#ff0000]fire[/#]
--+|[hr]
--+|Everything above the line is separate from what's below.
}}
```

A few of the most useful ones to know right away:

- `[b]...[/b]` — bold
- `[i]...[/i]` — italic
- `[c]...[/c]` — centered
- `[#hexcolor]...[/#]` — colored text, e.g. `[#ff0000]this is red[/#]`
- `[hr]` — a horizontal divider line
- `[br]` — a line break within a single output line

There are quite a few more — tables, headers, images, dice-font glyphs — covered in full in the reference document. Bold, italic, centering, and color will get you most of the way to a card that looks intentional rather than thrown together.

---

## A complete example: putting it all together

Let's close out by writing one script that uses nearly everything from this guide at once — a reasonably complete weapon attack that rolls to hit against a target, checks for a crit or a miss, and rolls damage accordingly.

```
!script {{
--&SourceTokenID|@{selected|token_id}
--#sourcetoken|[&SourceTokenID]
--&TargetTokenID|@{target|token_id}
--#targettoken|[&TargetTokenID]

--#title|[*S:character_name] attacks [*T:character_name]!

--=Attack|1d20 + [*S:strength_mod] + [*S:pb]
--+Attack Roll|[$Attack]

--?[$Attack.Base] -eq 20|CRIT
--?[$Attack.Base] -eq 1|FUMBLE
--?[$Attack.Raw] -ge [*T:ac]|HIT
--+Result|Miss!
--X|

--:CRIT|
--=Damage|4d6 + [*S:strength_mod]
--+Result|[b]Critical Hit![/b] Damage: [$Damage]
--X|

--:FUMBLE|
--+Result|[b]Critical Fumble![/b]
--X|

--:HIT|
--=Damage|2d6 + [*S:strength_mod]
--+Result|Hit! Damage: [$Damage]
--X|
}}
```

To use this script, select your attacking token, target the defending token (Roll20's target tool, usually a crosshair icon), and run the script. It will:

1. Read both the source and target tokens.
2. Title the card using both characters' names.
3. Roll to hit, using the source's Strength modifier and proficiency bonus.
4. Check, in order, whether the roll was a crit, a fumble, or a normal hit or miss against the target's AC.
5. Roll and display damage appropriately for whichever outcome occurred.

Every piece of that script is something we built up individually over the course of this guide — settings lines, roll and string variables, conditionals with jumps, character-sheet references for both a source and a target, and inline formatting. A real, "production" combat script (like the kind you'll find in the ScriptCards example library) adds a great deal more polish on top of this — damage types, resistances, saving throws, buttons to apply damage automatically to the target's hit points — but structurally, it's built from exactly these same pieces, just more of them.

---

## Where to go from here

You now know enough ScriptCards to write genuinely useful scripts: variables, dice rolling, conditionals, loops, character sheet references, buttons, and basic formatting. That's a solid foundation, and a large fraction of real-world ScriptCards scripts don't go dramatically further than what's in this guide — they just apply these same tools more times, to more situations.

When you're ready to go deeper, the full **ScriptCards Wiki** reference document covers:

- The complete list of variable types, including arrays and hash tables for working with more structured data
- Every conditional operator, including regular-expression matching
- Reading and writing repeating sections (multiple attacks, spells, or inventory items on a character sheet)
- Creating and modifying tokens, handouts, and characters directly from a script
- Triggers — scripts that run automatically in response to game events, rather than being run by hand
- Persisting data between script runs and even between sessions
- The complete card-settings reference, for fully customizing how your cards look

A few other things worth knowing about as you keep learning:

- The **ScriptCards Discord** is an active, friendly community, and by far the fastest way to get help when a script isn't behaving the way you expect.
- The GitHub repository's `ScriptCards_Examples` folder has dozens of real, working scripts — including a full D&D 5E action menu — that are worth reading through once you're comfortable with the basics here. Reading other people's finished scripts is one of the best ways to pick up patterns and techniques that aren't obvious from a reference document alone.
- Don't be afraid to build things incrementally and test constantly. Add one line, run the script, see what happened, then add the next line. ScriptCards scripts are quick to test, and that tight feedback loop is the fastest way to learn what each piece actually does.

Good luck, and happy scripting.
