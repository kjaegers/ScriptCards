The examples in this directory are intended for use with the experimental version of ScriptCards that includes support for event triggers.

Please note that a colon (:) is not a valid filename character, so I have replaced them with underscores (_) in the filenames here. These
trigger scripts should be placed on abilites on your ScriptCards_Triggers character with names matching these filenames, but with colons in
the place of the underscores, so "change:campaign:playerpageid", etc.

ScriptCards Triggers Documentation:

Triggers are a new feature introduced with ScriptCards 2.0.0 and allow you to establish a character in your game with abilities that will 
be executed in response to various game events that are exposed to the API. The idea here is that you can have things that happen in-game 
trigger ScriptCards scripts to be executed when the event occurs.

What is an Event?
A Roll20 API script can register with the server to have functions executed when something changes in your campaign. There are three types 
of events that ScriptCards can monitor: add, destroy, and change. (Note that there are two additional event types, “ready” and “chat” that 
are not supported by ScriptCards Triggers.

Each of the event types is further classified by what time of object is impacted, so if an attribute on a character is changed, the 
“change:attribute” event will be executed. The following events can be used with ScriptCards Triggers:

change:campaign:playerpageid
  -- Object Properties: &PreviousPageID and &NewPageID
change:campaign:turnorder
  -- Object Properties: Currently there are no object parameters for the turnorder change event
change:character
  -- Object Properties: &CharacterOld and &CharacterNew followed by the property name (ex. CharacterOldavatar) - _id, _type, avatar, name,
     archived, inplayerjournals, controlledby, _defaulttoken.
change:attribute:*
  -- Object Properties: &AttributeOld and &AttributeNew followed by the property name (ex. AttributeOldname) - _id, _type, _characterid,
     name, current, max
add:graphic
  -- Object Properties: &GraphicAdded followed by the property name (ex. GraphicAddedtop) - _id, _type, _subtype, _cardid, _pageid,
     imgsrc, represents, left, top, width, height, rotation, layer, isdrawing, flipv, fliph, name, gmnotes, tooltip, show_tooltip, controlledby,
     bar1_link, bar2_link, bar3_link, bar1_value, bar2_value, bar3_value, bar1_max, bar2_max, bar3_max, bar_location, compact_bar, aura11_radius,
     aura2_radius, aura1_color, aura2_color, aura1_square, aura2_square, tint_color, statusmarkers, showname, showplayers_name, showplayers_bar1,
     showplayers_bar2, showplayers_bar3, showplayers_aura1, showplayers_aura2, showplayers_aura3, playersedit_name, playersedit_bar1, playersedit_bar2,
     playersedit_bar3, playersedit_aura1, playersedit_aura2, lastmove, sides, currentSide, lockMovement
destroy:graphic
  -- Object Properties: &GraphicRemoved followed by the property name (ex. GraphicRemovedtop) - _id, _type, _subtype, _cardid, _pageid,
     imgsrc, represents, left, top, width, height, rotation, layer, isdrawing, flipv, fliph, name, gmnotes, tooltip, show_tooltip, controlledby,
     bar1_link, bar2_link, bar3_link, bar1_value, bar2_value, bar3_value, bar1_max, bar2_max, bar3_max, bar_location, compact_bar, aura11_radius,
     aura2_radius, aura1_color, aura2_color, aura1_square, aura2_square, tint_color, statusmarkers, showname, showplayers_name, showplayers_bar1,
     showplayers_bar2, showplayers_bar3, showplayers_aura1, showplayers_aura2, showplayers_aura3, playersedit_name, playersedit_bar1, playersedit_bar2,
     playersedit_bar3, playersedit_aura1, playersedit_aura2, lastmove, sides, currentSide, lockMovement
change:graphic:
  -- Object Properties: &GraphicOld and &GraphicNew followed by the property name (ex. GraphicOldtop) - _id, _type, _subtype, _cardid, _pageid,
     imgsrc, represents, left, top, width, height, rotation, layer, isdrawing, flipv, fliph, name, gmnotes, tooltip, show_tooltip, controlledby,
     bar1_link, bar2_link, bar3_link, bar1_value, bar2_value, bar3_value, bar1_max, bar2_max, bar3_max, bar_location, compact_bar, aura11_radius,
     aura2_radius, aura1_color, aura2_color, aura1_square, aura2_square, tint_color, statusmarkers, showname, showplayers_name, showplayers_bar1,
     showplayers_bar2, showplayers_bar3, showplayers_aura1, showplayers_aura2, showplayers_aura3, playersedit_name, playersedit_bar1, playersedit_bar2,
     playersedit_bar3, playersedit_aura1, playersedit_aura2, lastmove, sides, currentSide, lockMovement
add:page
  -- Object Properties: &PageAdded followed by the property name (ex. PageAddedwidth) - _id, _type, _zorder, name, width, height, background_color,
     archived, jukeboxtrigger, showdarkness, fog_opacity, showgrid, grid_opacity, gridcolor, grid_type, gridlabels, snapping_increment, scale_number,
     scale_units, diagonaltype, dynamic_lighting_enabled, daylight_mode_enabled, daylightModeOpacity, explorer_mode, force_lighting_refresh,
     fog_opacity, lightupdatedrop, showlighting, lightenforcelos, lightrestrictmovement, lightglobalillum
destroy:page
  -- Object Properties: &PageRemoved followed by the property name (ex. PageRemovedwidth) - _id, _type, _zorder, name, width, height, background_color,
     archived, jukeboxtrigger, showdarkness, fog_opacity, showgrid, grid_opacity, gridcolor, grid_type, gridlabels, snapping_increment, scale_number,
     scale_units, diagonaltype, dynamic_lighting_enabled, daylight_mode_enabled, daylightModeOpacity, explorer_mode, force_lighting_refresh,
     fog_opacity, lightupdatedrop, showlighting, lightenforcelos, lightrestrictmovement, lightglobalillum
change:page
  -- Object Properties: &PageOld and &PageNew followed by the property name (ex. PageOldwidth) - _id, _type, _zorder, name, width, height, background_color,
     archived, jukeboxtrigger, showdarkness, fog_opacity, showgrid, grid_opacity, gridcolor, grid_type, gridlabels, snapping_increment, scale_number,
     scale_units, diagonaltype, dynamic_lighting_enabled, daylight_mode_enabled, daylightModeOpacity, explorer_mode, force_lighting_refresh,
     fog_opacity, lightupdatedrop, showlighting, lightenforcelos, lightrestrictmovement, lightglobalillum

Events marked with :* at the end require you to define the particular property of an object that you wish to be alerted to, as some changes 
can cascade into a huge number of event calls that can cause timing issues if you were to try to respond to them all. For example, you can 
watch for a particular attribute on a character sheet to change, such as “hp”, by using the event name “change:attribute:hp”, but you cannot 
watch ALL attributes (change:attribute is not supported).

Setting up for ScriptCard Triggers

In order to utilize ScriptCard Triggers, you will need to create a character in your game named exactly “ScriptCards_Triggers”. This name 
is case sensitive, and the character must exist in the game at the time the API sandbox starts for Triggers to be enabled. If you have a 
correctly named character, you will see a message in the API console similar to “ScriptCards Triggers Active. Trigger Character ID 
is -N1W93TIw0ofPHUglMV1” when the sandbox starts. If you add the character after the sandbox is running, just restart the sandbox from the 
API console to have the script re-detect the character.

Object Parameters are generated dynamically, so as Roll20 adds new object properties they will be automatically available to your triggers.

Setting up an Event Handler

In order to respond to events, you will need to create Abilities on the ScriptCards_Triggers character that are named after the event you 
wish to respond to. The content of the ability is the macro you wish to have execute when the event is triggered.

Note:There is no strict requirement that the executed even needs to be a ScriptCard – ScriptCards will simply sendChat whatever is in the 
ability – but if it is not a properly formed ScriptCard the object parameters that would be passed to a ScriptCard won’t be available.

Here is a sample ability, with the name “change:campaign:playerpageid”:
!script {{
  --/|TRIGGER_REPLACEMENTS
  --#title|The action moves to...
  --#activepage|[&NewPageID]
  --+|[b][c][*P:name][/c][/b]
}}

The most important component to notice here is the line “--/|TRIGGER_REPLACEMENTS” which will be replaced with the object parameters for 
the object that triggered the event when it is called.

This simple script just displays a card letting the players know that the page has been changed and providing the name of the new page.

Object Parameters
All events include object parameters of some kind. For “change” events, there will be two sets of parameters: old values and new values. For 
“destroy” events, a full set of parameters for the item that was removed will be passed to the script. Finally, for “add” events, just the object 
ID of the new object will be provided.

For “change” events, a series of string variables will be created on the card that provide access to the object’s previous information with a 
name like “AttributeOldproperty” (such as AttributeOldcurrent for the value of the attribute before the change – as opposed to AttributeOldmax 
which would hold the maximum value). There is a similar set of variables for the new properties, named in the format AttributeNewproperty” 
(i.e., AttributeNewcurrent).

Note that ScriptCards variable names are case sensitive, and the property names are pulled from the objects themselves which can be referenced 
at https://wiki.roll20.net/API:Objects#Page. Note that there are some oddities in the way Roll20 names some properties by prefixing them with an 
underscore, so AttributeOld_characterid is correct, while AttributeOldcharacterid will return nothing.

API Generated Events

********Critical Note********: The Roll20 system only fires events in response to changes made through the UI. It does not fire events for 
changes made to objects through the API, so setting an attribute value in ScriptCards or via Token Mod will not cause your triggers to fire.
A future update to ScriptCards will include firing of events for objects changed through the --! command, but as of 1.9.5 this is not yet
implemented.
