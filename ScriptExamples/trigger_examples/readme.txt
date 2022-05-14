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
change:campaign:turnorder
change:character
change:attribute:*
add:graphic
destroy:graphic
change:graphic:*
add:page
destroy:page
change:page

Events marked with :* at the end require you to define the particular property of an object that you wish to be alerted to, as some changes 
can cascade into a huge number of event calls that can cause timing issues if you were to try to respond to them all. For example, you can 
watch for a particular attribute on a character sheet to change, such as “hp”, by using the event name “change:attribute:hp”, but you cannot 
watch ALL attributes (change:attribute is not supported).

Setting up for ScriptCard Triggers

In order to utilize ScriptCard Triggers, you will need to create a character in your game named exactly “ScriptCard_Triggers”. This name 
is case sensitive, and the character must exist in the game at the time the API sandbox starts for Triggers to be enabled. If you have a 
correctly named character, you will see a message in the API console similar to “ScriptCards Triggers Active. Trigger Character ID 
is -N1W93TIw0ofPHUglMV1” when the sandbox starts. If you add the character after the sandbox is running, just restart the sandbox from the 
API console to have the script re-detect the character.

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
