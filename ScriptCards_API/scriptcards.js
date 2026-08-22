/* eslint-disable no-undef */
/* eslint-disable no-useless-escape */
/* eslint-disable no-redeclare */
// Github:   https://gist.github.com/kjaegers/515dff0f04c006d7192e0fec534d96bf
// By:       Kurt Jaegers
// Contact:  https://app.roll20.net/users/2365448/kurt-j
if (typeof MarkStart === "function") MarkStart('ScriptCards');
var API_Meta = API_Meta || {};
API_Meta.ScriptCards = { offset: Number.MAX_SAFE_INTEGER, lineCount: -1 };
{ try { throw new Error(''); } catch (e) { API_Meta.ScriptCards.offset = (parseInt(e.stack.split(/\n/)[1].replace(/^.*:(\d+):.*$/, '$1'), 10) - 10); } }

var scriptCardsStashedScripts = {};

const ScriptCards = (async () => { // eslint-disable-line no-unused-vars
	/*

		ScriptCards implements a run-time scripting language interpreter for the Roll20 system. It contains no system-specific code, and can process scripts
		entered into the chat window, either directly, through cut/paste, or executed from macros, character abilities, etc.
		
		A ScriptCard script consists of one or more lines, each delimited by a double dash (--) starting the line, followed by a statement type identifier.
	
		After the identifier, is a line tag, followed by a vertical bar (|) character, followed by the line content. The scripting language supports 
		end-inclusion of function libraries with the +++libname+++ directive, which will be pre-parsed and removed from the script. Any number of libraries 
		can be specified by separating library names (case sensitive) with semicolons (;). 
	
		Please see the ScriptCards Wiki Entry on Roll20 at https://wiki.roll20.net/Script:ScriptCards for details.
	*/

	const APINAME = "ScriptCards";
	const APIVERSION = "3.0.25a-beacon-experimental.136 EXPERIMENTAL";
	const NUMERIC_VERSION = "300251"
	const APIAUTHOR = "Kurt Jaegers";
	const debugMode = false;

	const parameterAliases = {
		"tablebackgroundcolor": "tablebgcolor",
		"titlecardbackgroundcolor": "titlecardbackground",
		"nominmaxhilight": "nominmaxhighlight",
		"norollhilight": "norollhilight",
		"buttonbackgroundcolor": "buttonbackground",
		"concatentioncharacter": "concatenationcharacter",
		"reentry": "reentrant"
	}

	var lastExecutedByID;
	var lastExecutedDisplayName;

	// These are the parameters that all cards will start with. This table is copied to the
	// cardParameters table inside the processing loop and that table is updated with settings
	// from --# lines in the script.
	const defaultParameters = {
		reentrant: "0",
		tableborder: "2px solid #000000;",
		tablebgcolor: "#EEEEEE",
		tableborderradius: "6px;",
		tableshadow: "5px 3px 3px 0px #aaa;",
		title: "ScriptCards",
		titlecardbackground: "#1C6EA4",
		titlecardgradient: "0",
		titlecardbackgroundimage: "",
		titlecardbottomborder: "2px solid #444444;",
		titlefontface: "Contrail One",
		titlefontsize: "1.2em",
		titlefontlineheight: "1.2em",
		titlefontweight: "strong",
		titlefontstyle: "normal",
		titlefontshadow: "-1px 1px 0 #000, 1px 1px 0 #000, 1px -1px 0 #000, -1px -1px 0 #000;",
		lineheight: "normal",
		rollhilightlineheight: "1.0em",
		rollhilightcolornormal: "#FFFEA2",
		rollhilightcolorcrit: "#88CC88",
		rollhilightcolorfumble: "#FFAAAA",
		rollhilightcolorboth: "#8FA4D4",
		titlefontcolor: "#FFFFFF",
		subtitlefontsize: "13px",
		subtitlefontface: "Tahoma",
		subtitlefontcolor: "#FFFFFF",
		subtitleseparator: " &" + "#x2666; ",
		tooltip: "Sent by ScriptCards",
		bodyfontsize: "14px;",
		bodyfontface: "Helvetica",
		oddrowbackground: "#D0E4F5",
		evenrowbackground: "#eeeeee",
		oddrowfontcolor: "#000000",
		evenrowfontcolor: "#000000",
		bodybackgroundimage: "",
		oddrowbackgroundimage: "",
		evenrowbackgroundimage: "",
		whisper: "",
		emotetext: "",
		sourcetoken: "",
		targettoken: "",
		activepage: "",
		emotebackground: "#f5f5ba",
		emotefont: "Georgia",
		emotefontweight: "bold",
		emotefontsize: "14px",
		emotestate: "visible",
		emotefontcolor: "",
		emotesourcetokensize: "50",
		emotetargettokensize: "50",
		emotesourcetokenoverride: "0",
		emotetargettokenoverride: "0",
		rollfontface: "helvetica",
		leftsub: "",
		rightsub: "",
		sourcecharacter: "",
		targetcharacter: "",
		activepageobject: undefined,
		debug: "0",
		hidecard: "0",
		hidetitlecard: "0",
		dontcheckbuttonsforapi: "0",
		roundup: "0",
		buttonbackground: "#1C6EA4",
		buttonbackgroundimage: "",
		buttontextcolor: "White",
		buttonbordercolor: "#999999",
		buttonfontsize: "x-small",
		buttonfontface: "Tahoma",
		buttonpadding: "5px",
		parameterdelimiter: ";",
		concatenationcharacter: "+",
		formatoutputforobjectmodification: "0",
		dicefontcolor: "#1C6EA4",
		dicefontsize: "3.0em",
		usehollowdice: "0",
		allowplaintextinrolls: "0",
		showfromfornonwhispers: "0",
		allowinlinerollsinoutput: "0",
		nominmaxhighlight: "0",
		norollhighlight: "0",
		disablestringexpansion: "0",
		disablerollvariableexpansion: "0",
		disableparameterexpansion: "0",
		disablerollprocessing: "0",
		disableattributereplacement: "0",
		attemptattributeparsing: "0",
		disableinlineformatting: "0",
		executionlimit: "40000",
		inlineconditionseparator: "|",
		deferralcharacter: "^",
		locale: "en-US", //apparently not supported by Roll20's Javascript implementation...
		timezone: "America/New_York",
		hpbar: "3",
		outputtagprefix: "",
		outputcontentprefix: " ",
		enableattributesubstitution: "0",
		formatinforequesttext: "0",
		overridetemplate: "none",
		explodingonesandaces: "0",
		functionbenchmarking: "0",
		limitmaxbarvalues: "0",
		gmoutputtarget: "gm",
		storagecharid: "",
		beaconsheet: "0",
		buttonwidth: "auto",
		styleTableTag: " border-collapse:separate; border: solid black 2px; border-radius: 6px; -moz-border-radius: 6px; ",
		stylenone: " text-align: center; font-size: 100%; display: inline-block; font-weight: bold; height: !{rollhilightlineheight}; min-width: 1.75em; margin-top: -1px; margin-bottom: 1px; padding: 0px 2px; ",
		stylenormal: " text-align: center; font-size: 100%; display: inline-block; font-weight: bold; height: !{rollhilightlineheight}; min-width: 1.75em; margin-top: -1px; margin-bottom: 1px; padding: 0px 2px; border: 1px solid; border-radius: 3px; background-color: !{rollhilightcolornormal}; border-color: #87850A; color: #000000;",
		stylefumble: " text-align: center; font-size: 100%; display: inline-block; font-weight: bold; height: !{rollhilightlineheight}; min-width: 1.75em; margin-top: -1px; margin-bottom: 1px; padding: 0px 2px; border: 1px solid; border-radius: 3px; background-color: !{rollhilightcolorfumble}; border-color: #660000; color: #660000;",
		stylecrit: " text-align: center; font-size: 100%; display: inline-block; font-weight: bold; height: !{rollhilightlineheight}; min-width: 1.75em; margin-top: -1px; margin-bottom: 1px; padding: 0px 2px; border: 1px solid; border-radius: 3px; background-color: !{rollhilightcolorcrit}; border-color: #004400; color: #004400;",
		styleboth: " text-align: center; font-size: 100%; display: inline-block; font-weight: bold; height: !{rollhilightlineheight}; min-width: 1.75em; margin-top: -1px; margin-bottom: 1px; padding: 0px 2px; border: 1px solid; border-radius: 3px; background-color: !{rollhilightcolorboth}; border-color: #061539; color: #061539;",
		titletextalign: "center",
		disablevariableexpansion: 0,
		dontnotifyobservers: 0,

		// These settings can be used freely and are stored with the format storage commands
		usersetting0: "",
		usersetting1: "",
		usersetting2: "",
		usersetting3: "",
		usersetting4: "",
		usersetting5: "",
		usersetting6: "",
		usersetting7: "",
		usersetting8: "",
		usersetting9: "",

		critd20: "20",
		critd100: "100",
		critd10: "10",
		critd8: "8",
		critd6: "6",
		critd4: "4",
		fumbled20: "1",
		fumbled100: "1",
		fumbled10: "1",
		fumbled8: "1",
		fumbled6: "1",
		fumbled4: "1",
	};

	const bioFields = {
		"bio": 1,
		"gmnotes": 1,
		"notes": 1,
		"_defaulttoken": 1
	};

	const SettingsThatAreColors = [
		"tablebgcolor",
		"titlecardbackground",
		"rollhilightcolornormal",
		"rollhilightcolorcrit",
		"rollhilightcolorfumble",
		"rollhilightcolorboth",
		"titlefontcolor",
		"subtitlefontcolor",
		"oddrowbackground",
		"evenrowbackground",
		"oddrowfontcolor",
		"evenrowfontcolor",
		"emotebackground",
		"buttonbackground",
		"buttonbordercolor",
		"dicefontcolor"
	];

	const SettingsThatAreBooleans = [
		"debug",
		"hidecard",
		"hidetitlecard",
		"dontcheckbuttonsforapi",
		"roundup",
		"usehollowdice",
		"allowplaintextinrolls",
		"showfromfornonwhispers",
		"allowinlinerollsinoutput",
		"nominmaxhighlight",
		"norollhighlight",
		"disablestringexpansion",
		"disablerollvariableexpansion",
		"disableparameterexpansion",
		"disablerollprocessing",
		"disableattributereplacement",
		"attemptattributeparsing",
		"disableinlineformatting",
		"enableattributesubstitution",
		"formatinforequesttext",
		"explodingonesandaces",
		"functionbenchmarking",
		"limitmaxbarvalues",
		"beaconsheet",
	];

	const SettingsThatAreNumbers = [
		"emotesourcetokensize",
		"emotetargettokensize"
	]

	const TokenAttrsThatAreNumbers = [
		"left", "top", "width", "height", "rotation"
	]

	const EncodingReplaements = [
		"%5B:[",
		"%5D:]",
		"%7B:{",
		"%7C:|",
		"%7D:}",
		"%20: ",
		"%21:!",
		'%22:"',
		"%23:#",
		"%24:$",
		"%25:%",
		"%26:&",
		"%27:'",
		"%28,(",
		"%29,)",
		"%2A:*",
		"%2B:+",
		"%2C:,",
		"%2D:-",
		"%2E:.",
		"%2F:/",
		"%3C:<",
		"%3D:=",
		"%3E:>",
	]

	//---------------------------------------------------------------------------------------
	// Handles registering token change events for other api scripts
	//---------------------------------------------------------------------------------------
	const observers = {
		tokenChange: []
	};

	const observeTokenChange = (handler) => {
		if (handler && _.isFunction(handler)) {
			observers.tokenChange.push(handler);
		}
	};

	const notifyObservers = (event, obj, prev) => {
		if (observers[event]) {
			_.each(observers[event], (handler) => {
				try {
					handler(obj, prev);
				} catch (e) {
					log(`ScriptCards: An observer threw an exception in handler: ${handler}. Error: ${e.message}`);
				}
			});
		} else {
			log(`ScriptCards: No observers found for event: ${event}`);
		}
	};
	//---------------------------------------------------------------------------------------
	//---------------------------------------------------------------------------------------

	//---------------------------------------------------------------------------------------
	// "borrowed" from token-mod to force lighting updates after modifying tokens
	//---------------------------------------------------------------------------------------

	const getActivePages = () => [...new Set([
		Campaign().get('playerpageid'),
		...Object.values(Campaign().get('playerspecificpages')),
		...findObjs({
			type: 'player',
			online: true
		})
			.filter((p) => playerIsGM(p.id))
			.map((p) => p.get('lastpage'))
	])
	];

	const forceLightUpdateOnPage = (() => {
		const forPage = (pid) => (getObj('page', pid) || { set: () => { } }).set('force_lighting_refresh', true);
		let pids = new Set();
		let t;

		return (pid) => {
			pids.add(pid);
			clearTimeout(t);
			t = setTimeout(() => {
				let activePages = getActivePages();
				[...pids].filter(p => activePages.includes(p)).forEach(forPage);
				pids.clear();
			}, 100);
		};
	})();

	// HTML Templates for the various pieces of the output card. Replaced sections are marked with
	// !{...} syntax, and will have values substituted in them when the output line is built.
	var htmlTemplate = `<div style="display: table; border: !{tableborder}; background-color: !{tablebgcolor}; width: 100%; text-align: left; border-radius: !{tableborderradius}; border-collapse: separate; box-shadow: !{tableshadow};"><div style="display: table-header-group; background-color: !{titlecardbackground}; background-image: !{titlecardbackgroundimage}; border-bottom: !{titlecardbottomborder}"><div style="display: table-row;"><div style="display: table-cell; padding: 2px 2px; text-align: !{titletextalign};"><span style="font-family: !{titlefontface}; font-style:!{titlefontstyle}; font-size: !{titlefontsize}; line-height: !{titlefontlineheight}; font-weight: !{titlefontweight}; color: !{titlefontcolor}; text-shadow: !{titlefontshadow}">=X=TITLE=X=</span><br /><span style="font-family: !{subtitlefontface}; font-variant: normal; font-size: !{subtitlefontsize}; font-style:normal; font-weight: bold; color: !{subtitlefontcolor}; ">=X=SUBTITLE=X=</span></div></div></div><div style="display: table-row-group; background-image:!{bodybackgroundimage};">`;
	var htmlTemplateHiddenTitle = `<div style="display: table; border: !{tableborder}; background-color: !{tablebgcolor}; width: 100%; text-align: left; border-radius: !{tableborderradius}; border-collapse: separate; box-shadow: !{tableshadow};"><div style="display: table-row-group; background-image:!{bodybackgroundimage};">`;
	var htmlRowTemplate = `<div style="display: table-row; =X=ROWBG=X=;"><div style="display: table-cell; padding: 0px 0px; font-family: !{bodyfontface}; font-style: normal; font-weight:normal; font-size: !{bodyfontsize}; "><span style="line-height: !{lineheight}; color: =X=FONTCOLOR=X=;">=X=ROWDATA=X=</span></div></div>`;
	var htmlTemplateEnd = `</div></div><br />`;
	var buttonStyle = 'display:inline-block; background-color:!{buttonbackground}; padding:!{buttonpadding}; background-image:!{buttonbackgroundimage}; color: !{buttontextcolor}; text-align: center; vertical-align:middle; border-radius: 5px; border-color:!{buttonbordercolor}; font-family: !{buttonfontface}; font-size:!{buttonfontsize}; width:!{buttonwidth};';
	var gradientStyle = "linear-gradient(rgba(255, 255, 255, .3), rgba(255, 255, 255, 0))";

	// Objects to hold various variables and things we could need while running a script.
	var stringVariables = {};
	var rollVariables = {};
	var arrayVariables = {};
	var arrayIndexes = {};
	var hashTables = {};
	var tokenMarkerURLs = [];
	var templates = {};
	var benchmarks = {};
	var pointerVariables = {};
	var dataGrids = {};

	//---------------------------------------------------------------------------------------
	// Optional Beacon sheet adapters
	//---------------------------------------------------------------------------------------
	// ScriptCards' interpreter, formatting, variables, object handling, and other generic
	// facilities are defined above. Sheet-specific Beacon compatibility belongs here, after
	// the generic core, and is initialized only when a matching Beacon sheet is actually used.
	const DND2024_BEACON_SHEET_NAME = "dnd2024byroll20";
	let dnd2024BeaconAdapterConstants;

	function createDnd2024BeaconAdapter() {
		const collections = Object.freeze({
			abilityScores: "abilityscores",
			actions: "actions",
			armorClasses: "armorclasses",
			attacks: "attacks",
			attunements: "attunements",
			backgrounds: "backgrounds",
			classes: "classes",
			classLevels: "classlevels",
			conditions: "conditions",
			currencies: "currencies",
			damages: "damages",
			defenses: "defenses",
			exhaustions: "exhaustions",
			features: "features",
			hitDices: "hitdices",
			hitPoints: "hitpoints",
			items: "items",
			languages: "languages",
			modifiers: "modifiers",
			preparedSpellSlots: "preparedspellslots",
			proficiencies: "proficiencies",
			resources: "resources",
			restDisplays: "restdisplays",
			rollBonuses: "rollbonuses",
			senses: "senses",
			sizes: "sizes",
			skills: "skills",
			species: "species",
			speeds: "speeds",
			spells: "spells",
			spellSlots: "spellslots",
			spellcastings: "spellcastings",
			subclasses: "subclasses",
			upcastings: "upcastings",
			weaponMasteryChanges: "weaponmasterychanges",
			weaponMasteryKnowns: "weaponmasteryknowns",
			weaponMasterySlots: "weaponmasteryslots",
			weaponMasteries: "weaponmasteries"
		});

		const fields = Object.freeze({
			type: "type",
			name: "name",
			shortID: "shortID",
			enabled: "_enabled",
			arrayPosition: "arrayPosition",
			parentID: "parentID",
			childIDs: "childIDs",
			actionType: "actionType",
			spellLevel: "spellLevel",
			slotType: "_slotType",
			ability: "ability",
			category: "category",
			proficiency: "proficiency",
			proficiencyLevel: "proficiencyLevel",
			classID: "classID",
			level: "level",
			totalLevel: "totalLevel",
			speed: "speed",
			isTemp: "isTemp",
			value: "value"
		});

		const valuePaths = Object.freeze({
			formulaFlatValue: Object.freeze([["valueFormula", "flatValue"], ["flatValue"], ["value"]])
		});

		const abilityNames = Object.freeze({
			str: "Strength", strength: "Strength",
			dex: "Dexterity", dexterity: "Dexterity",
			con: "Constitution", constitution: "Constitution",
			int: "Intelligence", intelligence: "Intelligence",
			wis: "Wisdom", wisdom: "Wisdom",
			cha: "Charisma", charisma: "Charisma"
		});

		const skillNames = Object.freeze({
			acrobatics: "Acrobatics", animalhandling: "Animal Handling",
			arcana: "Arcana", athletics: "Athletics", deception: "Deception",
			history: "History", insight: "Insight", intimidation: "Intimidation",
			investigation: "Investigation", medicine: "Medicine", nature: "Nature",
			perception: "Perception", performance: "Performance",
			persuasion: "Persuasion", religion: "Religion",
			sleightofhand: "Sleight of Hand", stealth: "Stealth", survival: "Survival"
		});

		const standardSkillAbilities = Object.freeze({
			acrobatics: "Dexterity", animalhandling: "Wisdom", arcana: "Intelligence",
			athletics: "Strength", deception: "Charisma", history: "Intelligence",
			insight: "Wisdom", intimidation: "Charisma", investigation: "Intelligence",
			medicine: "Wisdom", nature: "Intelligence", perception: "Wisdom",
			performance: "Charisma", persuasion: "Charisma", religion: "Intelligence",
			sleightofhand: "Dexterity", stealth: "Dexterity", survival: "Wisdom"
		});

		const actionTypes = Object.freeze({
			action: "Action",
			bonusAction: "Bonus Action",
			freeAction: "Free Action",
			reaction: "Reaction",
			legendary: "Legendary",
			mythic: "Mythic"
		});

		const spellSlotOrdinals = Object.freeze({
			1: "FIRST", 2: "SECOND", 3: "THIRD", 4: "FOURTH", 5: "FIFTH",
			6: "SIXTH", 7: "SEVENTH", 8: "EIGHTH", 9: "NINTH"
		});

		const storedAliases = {
			hp: ["hitpoints", "currentHP"],
			hptemp: ["hitpoints", "tempHP"],
			size: ["about", "characteristics", "size"],
			alignment: ["about", "characteristics", "alignment"],
			creaturetype: ["character", "creatureType"],
			npctype: ["character", "creatureType"],
			pronouns: ["character", "pronouns"],
			experience: ["classLevel", "currentExp"],
			inspiration: ["inspiration", "isInspired"],
			npcacnotes: ["npc", "acNotes"],
			npcchallenge: ["npc", "challengeRating"],
			npccustomxp: ["npc", "customXP"],
			npcgear: ["npc", "gear"],
			npchabitat: ["npc", "habitat"],
			npclegendaryactions: ["npc", "legendaryActionCompendiumNum"],
			npclegendaryactionsdesc: ["npc", "legendaryActionSummary"],
			npcmythicactionsdesc: ["npc", "mythicActionSummary"],
			npchpformula: ["npc", "rollHP"],
			npctreasure: ["npc", "treasure"]
		};
		const writableStoredAliases = {
			hp: true,
			hptemp: true,
			size: true,
			alignment: true,
			experience: true,
			inspiration: true
		};
		const structuredWriteAliases = {};
		for (let level = 1; level <= 9; level++) {
			const slotAlias = `lvl${level}slotsexpended`;
			const slotPath = ["spellSlots", "currentByLevel", spellSlotOrdinals[level]];
			storedAliases[slotAlias] = slotPath;
			writableStoredAliases[slotAlias] = true;
			structuredWriteAliases[slotAlias] = slotPath;
		}

		const repeatingSections = {};
		const defineRepeating = (sectionName, descriptor) => {
			repeatingSections[sectionName.toLowerCase()] = Object.freeze({
				collections: Object.freeze((descriptor.collections || []).slice()),
				displayOrderPaths: descriptor.displayOrderPaths
					? Object.freeze(descriptor.displayOrderPaths.map((path) => Object.freeze(path.slice())))
					: undefined,
				actionTypes: descriptor.actionTypes ? Object.freeze(descriptor.actionTypes.slice()) : undefined,
				categories: descriptor.categories ? Object.freeze(descriptor.categories.slice()) : undefined,
				spellLevel: descriptor.spellLevel,
				purpose: descriptor.purpose
			});
		};
		const actionCollections = [collections.actions, collections.attacks];
		defineRepeating("repeating_npcaction", {
			collections: actionCollections, displayOrderPaths: [["actions", "actionDisplayOrder"]], actionTypes: [actionTypes.action], purpose: "ordinary actions and attacks"
		});
		defineRepeating("repeating_npcbonusaction", {
			collections: actionCollections, displayOrderPaths: [["actions", "bonusActionDisplayOrder"]], actionTypes: [actionTypes.bonusAction], purpose: "bonus actions and attacks"
		});
		defineRepeating("repeating_npcfreeaction", {
			collections: actionCollections, displayOrderPaths: [["actions", "freeActionDisplayOrder"]], actionTypes: [actionTypes.freeAction], purpose: "free actions and attacks"
		});
		defineRepeating("repeating_npcreaction", {
			collections: actionCollections, displayOrderPaths: [["actions", "reactionDisplayOrder"]], actionTypes: [actionTypes.reaction], purpose: "reactions and reaction attacks"
		});
		defineRepeating("repeating_npcaction-l", {
			collections: actionCollections, actionTypes: [actionTypes.legendary], purpose: "legendary actions"
		});
		defineRepeating("repeating_npcaction-m", {
			collections: actionCollections, actionTypes: [actionTypes.mythic], purpose: "mythic actions"
		});
		const featureDisplayOrderPaths = [["features", "classFeatureDisplayOrder"], ["features", "featsDisplayOrder"], ["features", "otherDisplayOrder"], ["features", "speciesTraitsDisplayOrder"]];
		defineRepeating("repeating_npctrait", {
			collections: [collections.features], displayOrderPaths: featureDisplayOrderPaths, purpose: "NPC traits and features"
		});
		defineRepeating("repeating_traits", {
			collections: [collections.features], displayOrderPaths: featureDisplayOrderPaths, purpose: "PC features and traits"
		});
		defineRepeating("repeating_attack", {
			collections: [collections.attacks], displayOrderPaths: [["attacks", "attackDisplayOrder"]], purpose: "PC and NPC attack definitions"
		});
		defineRepeating("repeating_inventory", {
			collections: [collections.items], displayOrderPaths: [["inventory", "equipmentDisplayOrder"], ["inventory", "otherPossessionsDisplayOrder"]], purpose: "inventory items"
		});
		defineRepeating("repeating_item", {
			collections: [collections.items], displayOrderPaths: [["inventory", "equipmentDisplayOrder"], ["inventory", "otherPossessionsDisplayOrder"]], purpose: "inventory item compatibility"
		});
		defineRepeating("repeating_resource", {
			collections: [collections.resources], purpose: "resource records"
		});
		defineRepeating("repeating_tool", {
			collections: [collections.proficiencies], categories: ["Tool"], purpose: "tool proficiencies"
		});
		defineRepeating("repeating_spell", {
			collections: [collections.spells], displayOrderPaths: [["spells", "displayOrder"]], purpose: "all spells"
		});
		defineRepeating("repeating_spell-cantrip", {
			collections: [collections.spells], displayOrderPaths: [["spells", "displayOrder", 0]], spellLevel: 0, purpose: "cantrips"
		});
		for (let level = 1; level <= 9; level++) {
			defineRepeating(`repeating_spell-${level}`, {
				collections: [collections.spells], displayOrderPaths: [["spells", "displayOrder", level]], spellLevel: level, purpose: `level ${level} spells`
			});
		}

		const adapter = Object.freeze({
			sheetName: DND2024_BEACON_SHEET_NAME,
			rootNames: Object.freeze({ store: "store", builder: "builder", appState: "appState" }),
			storePaths: Object.freeze({
				integrants: Object.freeze(["integrants", "integrants"]),
				actionDisplayOrder: Object.freeze(["actions", "actionDisplayOrder"]),
				bonusActionDisplayOrder: Object.freeze(["actions", "bonusActionDisplayOrder"]),
				freeActionDisplayOrder: Object.freeze(["actions", "freeActionDisplayOrder"]),
				reactionDisplayOrder: Object.freeze(["actions", "reactionDisplayOrder"]),
				attackDisplayOrder: Object.freeze(["attacks", "attackDisplayOrder"]),
				classFeatureDisplayOrder: Object.freeze(["features", "classFeatureDisplayOrder"]),
				featsDisplayOrder: Object.freeze(["features", "featsDisplayOrder"]),
				otherFeatureDisplayOrder: Object.freeze(["features", "otherDisplayOrder"]),
				speciesTraitsDisplayOrder: Object.freeze(["features", "speciesTraitsDisplayOrder"]),
				spellDisplayOrder: Object.freeze(["spells", "displayOrder"]),
				equipmentDisplayOrder: Object.freeze(["inventory", "equipmentDisplayOrder"]),
				otherPossessionsDisplayOrder: Object.freeze(["inventory", "otherPossessionsDisplayOrder"]),
				weaponMasteryDisplayOrder: Object.freeze(["weaponMasteries", "masteryDisplayOrder"]),
				usedHitDiceData: Object.freeze(["rest", "usedHitDiceData"])
			}),
			collections,
			fields,
			valuePaths,
			storedAliases: Object.freeze(storedAliases),
			writableStoredAliases: Object.freeze(writableStoredAliases),
			structuredWriteAliases: Object.freeze(structuredWriteAliases),
			abilityNames,
			skillNames,
			standardSkillAbilities,
			actionTypes,
			proficiencyCategories: Object.freeze({ skill: "Skill", savingThrow: "Saving Throw" }),
			movementModes: Object.freeze({ walking: "Walk", burrowing: "Burrow", climbing: "Climb", flying: "Fly", swimming: "Swim" }),
			currencyNames: Object.freeze({ cp: "Copper", sp: "Silver", ep: "Electrum", gp: "Gold", pp: "Platinum" }),
			spellSlotOrdinals,
			repeatingSections: Object.freeze(repeatingSections),
			xpByChallenge: new Map([
				[0, 10], [0.125, 25], [0.25, 50], [0.5, 100],
				[1, 200], [2, 450], [3, 700], [4, 1100], [5, 1800], [6, 2300],
				[7, 2900], [8, 3900], [9, 5000], [10, 5900], [11, 7200], [12, 8400],
				[13, 10000], [14, 11500], [15, 13000], [16, 15000], [17, 18000],
				[18, 20000], [19, 22000], [20, 25000], [21, 33000], [22, 41000],
				[23, 50000], [24, 62000], [25, 75000], [26, 90000], [27, 105000],
				[28, 120000], [29, 135000], [30, 155000]
			])
		});
		return adapter;
	}

	function validateDnd2024BeaconAdapter(adapter) {
		const collectionCount = Object.keys(adapter.collections || {}).length;
		const abilityCount = new Set(Object.values(adapter.abilityNames || {})).size;
		const skillCount = Object.keys(adapter.skillNames || {}).length;
		const repeatingCount = Object.keys(adapter.repeatingSections || {}).length;
		const repeatingSections = adapter.repeatingSections || {};
		const descriptorHasActionType = (sectionName, actionType) => {
			const descriptor = repeatingSections[sectionName];
			const normalizedActionType = normalizeBeaconLookupName(actionType);
			return !!descriptor
				&& Array.isArray(descriptor.actionTypes)
				&& descriptor.actionTypes.some((value) => normalizeBeaconLookupName(value) === normalizedActionType);
		};
		const descriptorHasCategory = (sectionName, category) => {
			const descriptor = repeatingSections[sectionName];
			const normalizedCategory = normalizeBeaconLookupName(category);
			return !!descriptor
				&& Array.isArray(descriptor.categories)
				&& descriptor.categories.some((value) => normalizeBeaconLookupName(value) === normalizedCategory);
		};
		const descriptorHasCollection = (sectionName, collectionName) => {
			const descriptor = repeatingSections[sectionName];
			const normalizedCollection = normalizeBeaconLookupName(collectionName);
			return !!descriptor
				&& Array.isArray(descriptor.collections)
				&& descriptor.collections.some((value) => normalizeBeaconLookupName(value) === normalizedCollection);
		};
		const descriptorHasDisplayOrderPath = (sectionName, expectedPath) => {
			const descriptor = repeatingSections[sectionName];
			const normalizedExpected = expectedPath.map((value) => normalizeBeaconLookupName(value));
			return !!descriptor
				&& Array.isArray(descriptor.displayOrderPaths)
				&& descriptor.displayOrderPaths.some((path) =>
					Array.isArray(path)
					&& path.length === normalizedExpected.length
					&& path.every((value, index) => normalizeBeaconLookupName(value) === normalizedExpected[index])
				);
		};
		const spellSections = Array.from({ length: 9 }, (_, index) => `repeating_spell-${index + 1}`);
		const requiredRepeatingSections = [
			"repeating_npcaction", "repeating_npcbonusaction", "repeating_npcfreeaction",
			"repeating_npcreaction", "repeating_npcaction-l", "repeating_npcaction-m",
			"repeating_npctrait", "repeating_traits", "repeating_attack", "repeating_inventory",
			"repeating_item", "repeating_resource", "repeating_tool", "repeating_spell",
			"repeating_spell-cantrip", ...spellSections
		];
		const valid = collectionCount >= 38
			&& abilityCount === 6
			&& skillCount === 18
			&& repeatingCount >= requiredRepeatingSections.length
			&& requiredRepeatingSections.every((sectionName) => repeatingSections[sectionName])
			&& descriptorHasActionType("repeating_npcaction", "Action")
			&& descriptorHasActionType("repeating_npcbonusaction", "Bonus Action")
			&& descriptorHasActionType("repeating_npcfreeaction", "Free Action")
			&& descriptorHasActionType("repeating_npcreaction", "Reaction")
			&& descriptorHasActionType("repeating_npcaction-l", "Legendary")
			&& descriptorHasActionType("repeating_npcaction-m", "Mythic")
			&& descriptorHasCategory("repeating_tool", "Tool")
			&& descriptorHasCollection("repeating_npcaction", "actions")
			&& descriptorHasCollection("repeating_npcaction", "attacks")
			&& descriptorHasCollection("repeating_npcbonusaction", "actions")
			&& descriptorHasCollection("repeating_npcbonusaction", "attacks")
			&& descriptorHasCollection("repeating_npcfreeaction", "actions")
			&& descriptorHasCollection("repeating_npcfreeaction", "attacks")
			&& descriptorHasCollection("repeating_npcreaction", "actions")
			&& descriptorHasCollection("repeating_npcreaction", "attacks")
			&& descriptorHasCollection("repeating_npcaction-l", "actions")
			&& descriptorHasCollection("repeating_npcaction-l", "attacks")
			&& descriptorHasCollection("repeating_npcaction-m", "actions")
			&& descriptorHasCollection("repeating_npcaction-m", "attacks")
			&& descriptorHasCollection("repeating_npctrait", "features")
			&& descriptorHasCollection("repeating_traits", "features")
			&& descriptorHasCollection("repeating_attack", "attacks")
			&& descriptorHasCollection("repeating_inventory", "items")
			&& descriptorHasCollection("repeating_item", "items")
			&& descriptorHasCollection("repeating_resource", "resources")
			&& descriptorHasCollection("repeating_tool", "proficiencies")
			&& descriptorHasCollection("repeating_spell", "spells")
			&& descriptorHasCollection("repeating_spell-cantrip", "spells")
			&& spellSections.every((sectionName) => descriptorHasCollection(sectionName, "spells"))
			&& descriptorHasDisplayOrderPath("repeating_npcaction", ["actions", "actionDisplayOrder"])
			&& descriptorHasDisplayOrderPath("repeating_npcbonusaction", ["actions", "bonusActionDisplayOrder"])
			&& descriptorHasDisplayOrderPath("repeating_npcfreeaction", ["actions", "freeActionDisplayOrder"])
			&& descriptorHasDisplayOrderPath("repeating_npcreaction", ["actions", "reactionDisplayOrder"])
			&& descriptorHasDisplayOrderPath("repeating_npctrait", ["features", "classFeatureDisplayOrder"])
			&& descriptorHasDisplayOrderPath("repeating_npctrait", ["features", "featsDisplayOrder"])
			&& descriptorHasDisplayOrderPath("repeating_npctrait", ["features", "otherDisplayOrder"])
			&& descriptorHasDisplayOrderPath("repeating_npctrait", ["features", "speciesTraitsDisplayOrder"])
			&& descriptorHasDisplayOrderPath("repeating_traits", ["features", "classFeatureDisplayOrder"])
			&& descriptorHasDisplayOrderPath("repeating_traits", ["features", "featsDisplayOrder"])
			&& descriptorHasDisplayOrderPath("repeating_traits", ["features", "otherDisplayOrder"])
			&& descriptorHasDisplayOrderPath("repeating_traits", ["features", "speciesTraitsDisplayOrder"])
			&& descriptorHasDisplayOrderPath("repeating_attack", ["attacks", "attackDisplayOrder"])
			&& descriptorHasDisplayOrderPath("repeating_inventory", ["inventory", "equipmentDisplayOrder"])
			&& descriptorHasDisplayOrderPath("repeating_inventory", ["inventory", "otherPossessionsDisplayOrder"])
			&& descriptorHasDisplayOrderPath("repeating_item", ["inventory", "equipmentDisplayOrder"])
			&& descriptorHasDisplayOrderPath("repeating_item", ["inventory", "otherPossessionsDisplayOrder"])
			&& descriptorHasDisplayOrderPath("repeating_spell", ["spells", "displayOrder"])
			&& descriptorHasDisplayOrderPath("repeating_spell-cantrip", ["spells", "displayOrder", 0])
			&& Number(repeatingSections["repeating_spell-cantrip"].spellLevel) === 0
			&& spellSections.every((sectionName, index) =>
				Number(repeatingSections[sectionName].spellLevel) === index + 1
				&& descriptorHasDisplayOrderPath(sectionName, ["spells", "displayOrder", index + 1])
			);
		if (!valid) {
			log(`ScriptCards Error: D&D 2024 Beacon adapter coverage validation failed (${collectionCount} collections, ${abilityCount} abilities, ${skillCount} skills, ${repeatingCount} repeating sections).`);
		}
		addBeaconPerformanceStat("dnd2024AdapterCollectionDefinitions", collectionCount);
		addBeaconPerformanceStat("dnd2024AdapterRepeatingSectionDefinitions", repeatingCount);
		return valid;
	}

	function getDnd2024BeaconAdapter(characterId) {
		if (!is2024Sheet(characterId)) {
			return undefined;
		}
		if (!dnd2024BeaconAdapterConstants) {
			dnd2024BeaconAdapterConstants = createDnd2024BeaconAdapter();
			validateDnd2024BeaconAdapter(dnd2024BeaconAdapterConstants);
			addBeaconPerformanceStat("dnd2024AdapterInitializations");
		}
		return dnd2024BeaconAdapterConstants;
	}
	//---------------------------------------------------------------------------------------

	var beaconStructuredIndexCache = new Map();
	var beaconPerformanceStats = {};
	// Caches per-card Beacon sheet-item reads and successful writes. Missing and
	// error results are stored separately so Map.has() continues to indicate that
	// a usable value exists.
	var beaconSheetItemCache = new Map();
	var beaconSheetItemMissCache = new Map();
	var beaconSheetItemPending = new Map();
	var beaconSheetItemQueue = [];
	var beaconSheetItemActiveReads = 0;
	var beaconSheetItemGeneration = new Map();
	var beaconReadAheadPromises = new Set();
	var beaconReadAheadReferenceCache = new Set();
	const BEACON_NATIVE_READ_CONCURRENCY = 3;
	const BEACON_READ_AHEAD_WINDOW = 8;
	var beaconRepeatingStateCache = new Map();
	var beaconRepeatingWritableTargetCache = new Map();
	var beaconRepeatingWritableTargets = [];
	var beaconAttributeRepeatingRowCache = new Map();
	const getBeaconSheetItemCacheKey = (characterId, operation, name) =>
		`${characterId}\u0000${operation}\u0000${String(name).toLowerCase()}`;

	function addBeaconPerformanceStat(name, amount = 1) {
		beaconPerformanceStats[name] = Number(beaconPerformanceStats[name] || 0) + amount;
	}

	function addBeaconPerformanceDetail(groupName, detailName, values = {}) {
		if (!beaconPerformanceStats[groupName] || typeof beaconPerformanceStats[groupName] !== "object" || Array.isArray(beaconPerformanceStats[groupName])) {
			beaconPerformanceStats[groupName] = {};
		}
		const key = String(detailName);
		if (!beaconPerformanceStats[groupName][key]) {
			beaconPerformanceStats[groupName][key] = {};
		}
		const detail = beaconPerformanceStats[groupName][key];
		for (const [name, amount] of Object.entries(values)) {
			detail[name] = Number(detail[name] || 0) + Number(amount || 0);
		}
	}

	function getBeaconSheetItemGeneration(characterId) {
		return Number(beaconSheetItemGeneration.get(String(characterId)) || 0);
	}

	function updateBeaconQueuePeak() {
		const currentDepth = beaconSheetItemQueue.length;
		const previousDepth = Number(beaconPerformanceStats.sheetItemQueueMaxDepth || 0);
		if (currentDepth > previousDepth) {
			beaconPerformanceStats.sheetItemQueueMaxDepth = currentDepth;
		}
	}

	function pumpBeaconSheetItemQueue() {
		while (beaconSheetItemActiveReads < BEACON_NATIVE_READ_CONCURRENCY && beaconSheetItemQueue.length > 0) {
			const task = beaconSheetItemQueue.shift();
			beaconSheetItemActiveReads++;
			addBeaconPerformanceStat("sheetItemQueueStarts");
			if (beaconSheetItemActiveReads > Number(beaconPerformanceStats.sheetItemConcurrentPeak || 0)) {
				beaconPerformanceStats.sheetItemConcurrentPeak = beaconSheetItemActiveReads;
			}
			const queueWait = Date.now() - task.queuedAt;
			addBeaconPerformanceStat("sheetItemQueueWaitMilliseconds", queueWait);
			Promise.resolve()
				.then(task.run)
				.then(task.resolve, task.reject)
				.finally(() => {
					beaconSheetItemActiveReads--;
					pumpBeaconSheetItemQueue();
				});
		}
	}

	function enqueueBeaconSheetItemRead(run) {
		addBeaconPerformanceStat("sheetItemQueuedReads");
		return new Promise((resolve, reject) => {
			beaconSheetItemQueue.push({ run, resolve, reject, queuedAt: Date.now() });
			updateBeaconQueuePeak();
			pumpBeaconSheetItemQueue();
		});
	}

	async function executeBeaconSheetItemRead(characterId, name, normalizedOperation, cacheKey, cacheResult, generation) {
		addBeaconPerformanceStat("sheetItemSdkCalls");
		const detailName = `${normalizedOperation}:${String(name)}`;
		const started = Date.now();
		try {
			const value = await getSheetItem(characterId, name, normalizedOperation);
			const elapsed = Date.now() - started;
			const unresolved = beaconLookupIsUnresolved(value);
			addBeaconPerformanceStat("sheetItemMilliseconds", elapsed);
			addBeaconPerformanceDetail("sheetItemCallDetails", detailName, {
				calls: 1,
				milliseconds: elapsed,
				unresolved: unresolved ? 1 : 0
			});
			if (cacheResult && generation === getBeaconSheetItemGeneration(characterId)) {
				if (unresolved) {
					beaconSheetItemMissCache.set(cacheKey, { value });
					addBeaconPerformanceStat("sheetItemUnresolved");
				} else {
					beaconSheetItemCache.set(cacheKey, value);
					beaconSheetItemMissCache.delete(cacheKey);
				}
			}
			return value;
		} catch (error) {
			const elapsed = Date.now() - started;
			addBeaconPerformanceStat("sheetItemMilliseconds", elapsed);
			addBeaconPerformanceStat("sheetItemErrors");
			addBeaconPerformanceDetail("sheetItemCallDetails", detailName, {
				calls: 1,
				milliseconds: elapsed,
				errors: 1
			});
			if (cacheResult && generation === getBeaconSheetItemGeneration(characterId)) {
				beaconSheetItemMissCache.set(cacheKey, { error: error && error.message ? error.message : String(error) });
			}
			throw error;
		}
	}

	async function readBeaconSheetItem(characterId, name, operation = "current", options = {}) {
		const normalizedOperation = String(operation || "current").toLowerCase();
		const cacheKey = getBeaconSheetItemCacheKey(characterId, normalizedOperation, name);
		const fresh = options.fresh === true;
		const cacheResult = options.cacheResult !== false;
		const generation = getBeaconSheetItemGeneration(characterId);
		addBeaconPerformanceStat("sheetItemRequests");

		if (!fresh && beaconSheetItemCache.has(cacheKey)) {
			addBeaconPerformanceStat("sheetItemCacheHits");
			return beaconSheetItemCache.get(cacheKey);
		}
		if (!fresh && beaconSheetItemMissCache.has(cacheKey)) {
			addBeaconPerformanceStat("sheetItemNegativeCacheHits");
			const cachedMiss = beaconSheetItemMissCache.get(cacheKey);
			if (cachedMiss && cachedMiss.error) {
				throw new Error(cachedMiss.error);
			}
			return cachedMiss ? cachedMiss.value : undefined;
		}

		if (!fresh && beaconSheetItemPending.has(cacheKey)) {
			const pending = beaconSheetItemPending.get(cacheKey);
			if (pending && pending.generation === generation) {
				addBeaconPerformanceStat("sheetItemPendingHits");
				return pending.promise;
			}
		}

		const promise = enqueueBeaconSheetItemRead(() => executeBeaconSheetItemRead(
			characterId,
			name,
			normalizedOperation,
			cacheKey,
			cacheResult,
			generation
		));
		if (!fresh) {
			const pending = { promise, generation };
			beaconSheetItemPending.set(cacheKey, pending);
			promise.finally(() => {
				if (beaconSheetItemPending.get(cacheKey) === pending) {
					beaconSheetItemPending.delete(cacheKey);
				}
			}).catch(() => {});
		}
		return promise;
	}

	function trackBeaconReadAheadPromise(promise) {
		if (!promise || typeof promise.then !== "function") {
			return;
		}
		beaconReadAheadPromises.add(promise);
		promise.finally(() => beaconReadAheadPromises.delete(promise)).catch(() => {});
	}

	async function settleBeaconReadAheadPromises() {
		while (beaconReadAheadPromises.size > 0) {
			const pending = Array.from(beaconReadAheadPromises);
			await Promise.allSettled(pending);
		}
	}

	function stripBeaconReadAheadProtectedBlocks(value) {
		return String(value == null ? "" : value).replace(/\$\{[\s\S]*?\$\}/g, "");
	}

	function getBeaconReadAheadCharacter(selector, cardParameters) {
		let activeCharacter = "";
		const normalizedSelector = String(selector || "").trim();
		if (normalizedSelector.toLowerCase() === "s") {
			activeCharacter = cardParameters.sourcetoken || cardParameters.sourcecharacter || "";
		} else if (normalizedSelector.toLowerCase() === "t") {
			activeCharacter = cardParameters.targettoken || cardParameters.targetcharacter || "";
		} else if (normalizedSelector.startsWith("-")) {
			activeCharacter = normalizedSelector;
		}
		if (!activeCharacter) {
			return undefined;
		}
		let character = getObj("character", activeCharacter);
		if (!character) {
			const token = getObj("graphic", activeCharacter);
			if (token && token.get("represents")) {
				character = getObj("character", token.get("represents"));
			}
		}
		return character;
	}

	function beaconReadAheadLineIsBarrier(rawLine) {
		const tag = String(getLineTag(rawLine, 0, false) || "").trim().toLowerCase();
		if (!tag || tag.startsWith("/")) {
			return false;
		}
		return tag.startsWith("?")
			|| tag.startsWith("c")
			|| tag.startsWith("^")
			|| tag.startsWith(">")
			|| tag.startsWith("<")
			|| tag.startsWith("%")
			|| tag.startsWith("]")
			|| tag.startsWith("i")
			|| tag.startsWith("w")
			|| tag.startsWith("!")
			|| tag.startsWith("~")
			|| tag.startsWith("r")
			|| tag.startsWith("x")
			|| tag.startsWith("@")
			|| tag.startsWith("#sourcetoken")
			|| tag.startsWith("#sourcecharacter")
			|| tag.startsWith("#targettoken")
			|| tag.startsWith("#targetcharacter")
			|| tag.startsWith("#beaconsheet");
	}

	function startBeaconReadAhead(cardLines, startLine, cardParameters) {
		if (String(cardParameters && cardParameters.beaconsheet) !== "1" || !Array.isArray(cardLines)) {
			return;
		}
		addBeaconPerformanceStat("readAheadWindowScans");
		const endLine = Math.min(cardLines.length, Number(startLine) + BEACON_READ_AHEAD_WINDOW);
		for (let index = Number(startLine); index < endLine; index++) {
			const rawLine = stripBeaconReadAheadProtectedBlocks(cardLines[index]);
			if (!rawLine || String(getLineTag(rawLine, index, false) || "").trim().startsWith("/")) {
				continue;
			}

			const characterReferencePattern = /\[\*(S|T|-[^:\[\]]+):([^\[\]]+)\]/gi;
			let match;
			while ((match = characterReferencePattern.exec(rawLine)) !== null) {
				addBeaconPerformanceStat("sheetItemPrefetchCandidates");
				const character = getBeaconReadAheadCharacter(match[1], cardParameters);
				let attributeName = String(match[2] || "").trim();
				if (!character || !attributeName || attributeName.includes("[") || attributeName.includes("]")
					|| attributeName.toLowerCase().startsWith("t-") || attributeName.endsWith("*")) {
					continue;
				}
				if (attributeName.includes(":::")) {
					attributeName = attributeName.substring(0, attributeName.indexOf(":::"));
				}
				const referenceKey = `character\u0000${character.id}\u0000${getBeaconSheetItemGeneration(character.id)}\u0000${attributeName.toLowerCase()}`;
				if (beaconReadAheadReferenceCache.has(referenceKey)) {
					addBeaconPerformanceStat("sheetItemPrefetchReused");
					continue;
				}
				beaconReadAheadReferenceCache.add(referenceKey);
				addBeaconPerformanceStat("sheetItemPrefetchStarted");
				trackBeaconReadAheadPromise(
					getPageTokenCharacterAttributeValue(character, attributeName, true, false).catch(() => ({ found: false }))
				);
			}

			if (repeatingBeaconState && repeatingBeaconState.rows && repeatingBeaconState.rows[repeatingIndex]) {
				const repeatingReferencePattern = /\[\*R:([^\[\]]+)\]/gi;
				while ((match = repeatingReferencePattern.exec(rawLine)) !== null) {
					let fieldName = String(match[1] || "").trim();
					if (!fieldName || fieldName.includes(":") || fieldName.toLowerCase() === "$fieldlist$") {
						continue;
					}
					let operation = "current";
					if (fieldName.endsWith("^")) {
						fieldName = fieldName.slice(0, -1);
						operation = "max";
					}
					addBeaconPerformanceStat("sheetItemPrefetchCandidates");
					const row = repeatingBeaconState.rows[repeatingIndex];
					const referenceKey = `repeating\u0000${repeatingBeaconState.characterId}\u0000${getBeaconSheetItemGeneration(repeatingBeaconState.characterId)}\u0000${repeatingBeaconState.sectionName}\u0000${row.id}\u0000${operation}\u0000${fieldName.toLowerCase()}`;
					if (beaconReadAheadReferenceCache.has(referenceKey)) {
						addBeaconPerformanceStat("sheetItemPrefetchReused");
						continue;
					}
					beaconReadAheadReferenceCache.add(referenceKey);
					addBeaconPerformanceStat("sheetItemPrefetchStarted");
					trackBeaconReadAheadPromise(
						getBeaconRepeatingField(
							repeatingBeaconState,
							repeatingIndex,
							fieldName,
							operation,
							false
						).catch(() => undefined)
					);
				}
			}

			if (beaconReadAheadLineIsBarrier(rawLine)) {
				break;
			}
		}
	}

	function clearBeaconCacheEntriesForCharacter(cache, characterId) {
		const prefix = `${characterId}\u0000`;
		for (const key of cache.keys()) {
			if (String(key).startsWith(prefix)) {
				cache.delete(key);
			}
		}
	}

	function invalidateBeaconCharacterCaches(characterId) {
		const normalizedCharacterId = String(characterId);
		beaconSheetItemGeneration.set(
			normalizedCharacterId,
			getBeaconSheetItemGeneration(normalizedCharacterId) + 1
		);
		beaconStructuredIndexCache.delete(characterId);
		clearBeaconCacheEntriesForCharacter(beaconSheetItemCache, characterId);
		clearBeaconCacheEntriesForCharacter(beaconSheetItemMissCache, characterId);
		clearBeaconCacheEntriesForCharacter(beaconSheetItemPending, characterId);
		clearBeaconCacheEntriesForCharacter(beaconRepeatingStateCache, characterId);
	}

	const getBeaconComputedSummary = () => {
		let computedSummary;
		try {
			const campaign = Campaign();
			if (campaign && typeof campaign.get === "function") {
				computedSummary = campaign.get("computedSummary");
			}
			if (typeof computedSummary === "undefined" && campaign) {
				computedSummary = campaign.computedSummary;
			}
		} catch (error) {
			return undefined;
		}

		return computedSummary && typeof computedSummary === "object" && !Array.isArray(computedSummary)
			? computedSummary
			: undefined;
	};

	const getBeaconComputedTokenBarProperty = (propertyName) => {
		if (typeof propertyName !== "string" || !propertyName) {
			return undefined;
		}

		const computedSummary = getBeaconComputedSummary();
		if (!computedSummary) {
			return undefined;
		}

		if (Object.prototype.hasOwnProperty.call(computedSummary, propertyName)) {
			return {
				property: propertyName,
				metadata: computedSummary[propertyName]
			};
		}

		const normalizedPropertyName = propertyName.toLowerCase();
		const matchingProperties = Object.keys(computedSummary).filter((name) => name.toLowerCase() === normalizedPropertyName);
		if (matchingProperties.length !== 1) {
			return undefined;
		}

		return {
			property: matchingProperties[0],
			metadata: computedSummary[matchingProperties[0]]
		};
	};

	//We use several variables to track repeating section (--R) commands
	var repeatingSection = undefined;
	var repeatingSectionIDs = undefined;
	var repeatingIndex = undefined;
	var repeatingCharID = undefined;
	var repeatingCharAttrs = undefined;
	var repeatingSectionName = undefined;
	var repeatingBeaconState = undefined;
	var triggerCharID = undefined;
	var storageCharID = undefined;
	var bioCharID = undefined;
	var repeatScriptCard = false;

	// Store labels and their corresponding line numbers for branching
	var lineLabels = {};
	var labelChecking = {};

	// The returnStack stores the line number to return to after a gosub, while the parameter stack stores parameter lists for nested gosubs
	var returnStack = [];
	var parameterStack = [];
	var tableLineCounter = 0;

	// Builds up a list of lines that will appear on the output display
	var outputLines = [];
	var bareoutputLines = [];
	var gmonlyLines = [];
	var lineCounter = 1;
	var lastBlockAction = "";

	// Storage for any Library handouts found in the game
	var ScriptCardsLibrary = {};

	// The Dice Fonts in Roll20 use these letters to represent the characters that display
	// the dice value (J=0, A=1, B=2, etc) To get the appropriate letter to display, we can
	// just the substring numeric position in this string to find the matching letter.
	const diceLetters = "JABCDEFGHIJKLMNOPQRSTUVWYZ";

	// Used for storing parameters passed to a subroutine with --> or --?|> lines
	var callParamList = {};

	// Message queue system to prevent concurrent processing
	var messageQueue = [];
	var isProcessingQueue = false;

	// Process messages from the queue sequentially
	async function processMessageQueue() {
		if (isProcessingQueue || !messageQueue || messageQueue.length === 0) {
			return;
		}

		isProcessingQueue = true;

		while ((messageQueue !== undefined) && messageQueue.length > 0) {
			const msg = messageQueue.shift();
			try {
				await handleChatMessage(msg);
			} catch (error) {
				log(`ScriptCards Error processing message: ${error.message}`);
				if (error.stack) log(error.stack);
			}
		}

		isProcessingQueue = false;
	}

	// Handle a single chat message
	async function handleChatMessage(msg) {
		if (msg.type === "api") {
			var apiCmdText = msg.content.toLowerCase().trim();
			var processThisAPI = false;
			var isResume = false;
			var isReentrant = false;
			var resumeArgs;
			var cardContent;
			var handoutVariables = [];
			var handoutSelected = [];
			var handoutTarget = [];
			var cardLines = [];

			// !sc-liststoredsettings creates a new scriptcard and sends it to
			// chat. With no parameters, it reports a list of all of the stored settings
			// groups. If a stored settings group name is passed, it will list all of the
			// customized settings for that group.
			if (apiCmdText.startsWith("!sc-liststoredsettings")) {
				var metaCard = "!scriptcard {{ ";
				metaCard += "--#title|Stored Settings Report ";
				if (apiCmdText.split(" ").length == 1) {
					metaCard += "--#leftsub|Settings List "
					var stored = state[APINAME].storedSettings;
					for (const key in stored) {
						metaCard += `--+${key}|[r][button]Show::!sc-liststoredsettings ${key}[/button] [button]Delete::!sc-deletestoredsettings ${key}[/button][/r]`;
					}
				} else {
					var settingName = msg.content.substring(msg.content.indexOf(" ")).trim();
					if (settingName) {
						metaCard += `--#leftsub|Setting List --#rightsub|${settingName} `;
						var stored = state[APINAME].storedSettings[settingName];
						for (const key in stored) {
							if (stored[key] !== defaultParameters[key]) {
								metaCard += `--+${key}|${stored[key]} [r][button]Edit::!sc-editstoredsetting ${settingName}|${key}|?{New Value|${stored[key]}}[/button] [button]Delete::!sc-deleteindividualstoredsetting ${settingName}|${key}[/button][/r]`;
							}
						}
						metaCard += `--+|[c][button]Add Setting::!sc-addstoredsetting ${settingName}|?{Setting Name?}|?{Setting Value?}[/button][/c]`
					}
				}
				metaCard += " }};"
				sendChat("API", metaCard);
			}

			if (apiCmdText.startsWith("!sc-reloadtemplates")) {
				reload_template_mule();
				sendChat("ScriptCards", `/w ${msg.who} Templates mule reloaded. ${Object.keys(templates).length} defined templates.`)
			}

			if (apiCmdText.startsWith("!sc-deletestoredsettings ")) {
				var settingName = msg.content.substring(msg.content.indexOf(" ")).trim();
				if (state[APINAME].storedSettings[settingName]) {
					delete state[APINAME].storedSettings[settingName];
					metaCard = `!scriptcard {{ --#title|Remove Stored Setting --#leftsub|${settingName} --+|The setting group ${settingName} has been deleted. }} `;
					sendChat("API", metaCard);
				} else {
					metaCard = `!scriptcard {{ --#title|Remove Stored Setting --#leftsub|${settingName} --+|No stored settings group named ${settingName} was found. }} `;
					sendChat("API", metaCard);
				}
			}

			if (apiCmdText.startsWith("!sc-runhandout ")) {
				let handoutName = msg.content.substring(msg.content.indexOf(" ")).trim();
				if (handoutName.indexOf(" --") === -1) {
					handoutName = handoutName.trim();
				} else {
					handoutName = handoutName.substring(0, handoutName.indexOf(" --")).trim();
				}
				let handoutOptionList = msg.content.substring(msg.content.indexOf(" ")).trim();
				handoutOptionList = handoutOptionList.substring(handoutOptionList.indexOf(" ")).trim();
				let handoutField = "notes";
				let handoutOptions = (handoutOptionList.match(/--[^|\s]+\|[\s\S]*?(?=(?:\s--[^|\s]+\|)|$)/g) || []).map((opt) => opt.trim());
				let handout = undefined;
				let clearSelect = false;
				let wasSelected = false;
				let wasMerge = false;
				try {
					handout = findObjs({ type: "handout", name: handoutName })[0];
				} catch (e) {
				}
				if (!handout) {
					try {
						handout = findObjs({ type: "handout", id: handoutName })[0];
					} catch (e) {
					}
				}

				// Parse the handout options and set the appropriate values for use later
				if (handoutOptions && handoutOptions.length > 0) {
					for (let i = 0; i < handoutOptions.length; i++) {
						let option = handoutOptions[i];
						let optionName = option.substring(0, option.indexOf("|")).trim();
						let optionValue = option.substring(option.indexOf("|") + 1).trim();
						switch (optionName.toLowerCase()) {
							case "--selectedtoken":
							case "--selected":
							case "--select":
							case "--selectedtokens":
								handoutSelected = optionValue.split(",").map((id) => id.trim());
								clearSelect = true;
								wasSelected = true;
								break;
							case "--targettoken":
							case "--target":
							case "--targettokens":
								handoutTarget = optionValue.split(",").map((id) => id.trim());
								break;
							case "--field":
							case "--handoutfield":
								if (optionValue.toLowerCase() === "gmnotes" || optionValue.toLowerCase() === "notes") {
									handoutField = optionValue;
								} else {
									log("ScriptCards: Invalid handout field specified for !sc-runhandout. Defaulting to notes.");
								}
								break;
							case "--mergeselect":
								if (optionValue.toLowerCase() === "true" || optionValue === "1") {
									wasMerge = true;
								}
								break;
						}
						if (optionName.startsWith("--var")) {
							handoutVariables.push({ name: optionValue.substring(0, optionValue.indexOf("|")).trim(), value: optionValue.substring(optionValue.indexOf("|") + 1).trim() });
						}
					}
				}

				if (handout) {
					let handoutText = await getBioField(handout, handoutField);
					msg.content = handoutText.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
					apiCmdText = msg.content;
					if (wasSelected && !wasMerge) {
						msg.selected = [];
					}
				}
			}

			if (apiCmdText.startsWith("!sc-deleteindividualstoredsetting ")) {
				try {
					var settingSet = msg.content.substring(msg.content.indexOf(" ")).trim().split("|")[0];
					var settingName = msg.content.substring(msg.content.indexOf(" ")).trim().split("|")[1];

					if (state[APINAME].storedSettings[settingSet] && state[APINAME].storedSettings[settingSet][settingName]) {
						delete state[APINAME].storedSettings[settingSet][settingName];
						metaCard = `!scriptcard {{ --#title|Remove Stored Setting --#leftsub|${settingSet} --#rightsub|${settingName} --+|The setting ${settingName} has been deleted from the stored setting set ${settingSet}. }} `;
						sendChat("API", metaCard);
					} else {
						metaCard = `!scriptcard {{ --#title|Remove Stored Setting --#leftsub|${settingName} --#rightsub|${settingName} --+|No stored setting named ${settingName} found in group ${settingSet}. }} `;
						sendChat("API", metaCard);
					}
				} catch { log(`An error occured processing deleteindividualstoredsetting request for ${msg.content}`) }
			}

			if (apiCmdText.startsWith("!sc-editstoredsetting ")) {
				try {
					var settingSet = msg.content.substring(msg.content.indexOf(" ")).trim().split("|")[0];
					var settingName = msg.content.substring(msg.content.indexOf(" ")).trim().split("|")[1];
					var newValue = msg.content.substring(msg.content.indexOf(" ")).trim().split("|")[2];

					if (state[APINAME].storedSettings[settingSet] && state[APINAME].storedSettings[settingSet][settingName]) {
						state[APINAME].storedSettings[settingSet][settingName] = newValue;
						metaCard = `!scriptcard {{ --#title|Edit Stored Setting --#leftsub|${settingSet} --#rightsub|${settingName} --+|The setting ${settingName} in set ${settingSet} has been updated to ${newValue}. }} `;
						sendChat("API", metaCard);
					} else {
						metaCard = `!scriptcard {{ --#title|Remove Stored Setting --#leftsub|${settingName} --#rightsub|${settingName} --+|No stored setting named ${settingName} found in group ${settingSet}. }} `;
						sendChat("API", metaCard);
					}
				} catch { log(`An error occured processing editstoredsetting request for ${msg.content}`) }
			}

			if (apiCmdText.startsWith("!sc-addstoredsetting ")) {
				try {
					var settingSet = msg.content.substring(msg.content.indexOf(" ")).trim().split("|")[0];
					var settingName = msg.content.substring(msg.content.indexOf(" ")).trim().split("|")[1];
					var newValue = msg.content.substring(msg.content.indexOf(" ")).trim().split("|")[2];

					if (state[APINAME].storedSettings[settingSet] && !(state[APINAME].storedSettings[settingSet][settingName])) {
						state[APINAME].storedSettings[settingSet][settingName] = newValue;
						metaCard = `!scriptcard {{ --#title|Add Stored Setting --#leftsub|${settingSet} --#rightsub|${settingName} --+|The setting ${settingName} in set ${settingSet} has been updated to ${newValue}. }} `;
						sendChat("API", metaCard);
					} else {
						metaCard = `!scriptcard {{ --#title|Add Stored Setting --#leftsub|${settingName} --#rightsub|${settingName} --+|Either ${settingSet} group does not exist, or a setting named ${settingName} is already defined in the group. }} `;
						sendChat("API", metaCard);
					}
				} catch { log(`An error occured processing addstoredsetting request for ${msg.content}`) }
			}

			if (apiCmdText.startsWith("!sc-purgestoredsettings")) {
				delete state[APINAME].storedSettings
				state[APINAME].storedSettings = {}
			}

			if (apiCmdText.startsWith("!sc-resume ")) {
				var resumeString = msg.content.substring(11);
				resumeArgs = resumeString.split("-|-");
				if (scriptCardsStashedScripts[resumeArgs[0]]) {
					isResume = true;
					processThisAPI = true;
				}
			}

			if (apiCmdText.startsWith("!sc-reentrant ")) {
				var resumeString = msg.content.substring(14);
				resumeArgs = resumeString.split("-|-");
				if (scriptCardsStashedScripts[resumeArgs[0]]) {
					isResume = true;
					isReentrant = true;
					processThisAPI = true;
				}
			}

			if (apiCmdText.startsWith("!sc-purgestachedscripts")) {
				scriptCardsStashedScripts = {};
			}

			if (apiCmdText.startsWith("!scriptcards ")) { processThisAPI = true; }
			if (apiCmdText.startsWith("!scriptcard ")) { processThisAPI = true; }
			if (apiCmdText.startsWith("!script ")) { processThisAPI = true; }
			if (apiCmdText.startsWith("!scriptcards{{")) { processThisAPI = true; }
			if (apiCmdText.startsWith("!scriptcard{{")) { processThisAPI = true; }
			if (apiCmdText.startsWith("!script{{")) { processThisAPI = true; }
			if (processThisAPI) {
				var cardParameters = {};
				Object.assign(cardParameters, defaultParameters);
				if (storageCharID) {
					cardParameters.storagecharid = storageCharID
				}
				if (state[APINAME].storedSettings["Default"] != null) {
					newSettings = state[APINAME].storedSettings["Default"];
					for (var key in newSettings) {
						cardParameters[key] = newSettings[key];
					}
				}
				msg.content = processInlinerolls(msg);

				scriptStartTimestamp = Date.now();

				outputLines = [];
				bareoutputLines = [];
				gmonlyLines = [];
				lineCounter = 1;

				// Store labels and their corresponding line numbers for branching
				lineLabels = {};
				labelChecking = {};

				benchmarks = {};
				beaconPerformanceStats = {
					structuredRootParses: 0,
					typedIndexBuilds: 0,
					typedIndexMilliseconds: 0,
					typedAttributesScanned: 0,
					typedObjectsVisited: 0,
					stableIdentityLookups: 0,
					stableIdentityDirectHits: 0,
					localCompatibilityRequests: 0,
					localCompatibilityHits: 0,
					localCompatibilityMilliseconds: 0,
					localCompatibilityBypassedSdk: 0,
					sheetItemRequests: 0,
					sheetItemSdkCalls: 0,
					sheetItemCacheHits: 0,
					sheetItemNegativeCacheHits: 0,
					sheetItemPendingHits: 0,
					sheetItemQueuedReads: 0,
					sheetItemQueueStarts: 0,
					sheetItemQueueMaxDepth: 0,
					sheetItemQueueWaitMilliseconds: 0,
					sheetItemConcurrentPeak: 0,
					sheetItemPrefetchCandidates: 0,
					sheetItemPrefetchStarted: 0,
					sheetItemPrefetchReused: 0,
					readAheadWindowScans: 0,
					sheetItemMilliseconds: 0,
					sheetItemUnresolved: 0,
					sheetItemErrors: 0,
					repeatingStateRequests: 0,
					repeatingStateBuilds: 0,
					repeatingStateCacheHits: 0,
					repeatingEnumerationMilliseconds: 0,
					repeatingRowsEnumerated: 0,
					repeatingFieldRequests: 0,
					repeatingLocalFieldHits: 0,
					repeatingLocalAliasHits: 0,
					repeatingFieldSdkCalls: 0,
					repeatingCanonicalFallbacks: 0,
					sheetItemCallDetails: {},
					localCompatibilityMissDetails: {},
					repeatingSectionDetails: {}
				};

				// The returnStack stores the line number to return to after a gosub, while the parameter stack stores parameter lists for nexted gosubs
				returnStack = [];
				parameterStack = [];
				tableLineCounter = 0;

				// Clear out any pre-existing roll variables
				rollVariables = {};
				stringVariables = {};
				arrayVariables = {};
				arrayIndexes = {};
				hashTables = {};
				pointerVariables = {};
				beaconStructuredIndexCache.clear();
				beaconSheetItemCache.clear();
				beaconSheetItemMissCache.clear();
				beaconSheetItemPending.clear();
				beaconSheetItemQueue = [];
				beaconSheetItemActiveReads = 0;
				beaconSheetItemGeneration.clear();
				beaconReadAheadPromises.clear();
				beaconReadAheadReferenceCache.clear();
				beaconRepeatingStateCache.clear();
				beaconRepeatingWritableTargetCache.clear();
				beaconRepeatingWritableTargets = [];
				beaconAttributeRepeatingRowCache.clear();

				loopControl = {};
				loopStack = [];

				scriptData = [];
				saveScriptData = [];
				lastBlockAction = "";
				executionCounter = 0;

				stringVariables["ScriptCards_Version"] = APIVERSION;
				stringVariables["SC_VERSION_NUMERIC"] = NUMERIC_VERSION

				if (msg.playerid) {
					var sendingPlayer = getObj("player", msg.playerid);
					if (sendingPlayer) {
						stringVariables["SendingPlayerID"] = msg.playerid;
						stringVariables["OriginalSendingPlayerID"] = msg.playerid;
						lastExecutedByID = msg.playerid;
						stringVariables["SendingPlayerName"] = sendingPlayer.get("_displayname");
						stringVariables["OriginalSendingPlayerName"] = sendingPlayer.get("_displayname");
						lastExecutedDisplayName = sendingPlayer.get("_displayname");
						stringVariables["SendingPlayerColor"] = sendingPlayer.get("color");
						stringVariables["OriginalSendingPlayerColor"] = sendingPlayer.get("color");
						stringVariables["SendingPlayerSpeakingAs"] = sendingPlayer.get("speakingas");
						stringVariables["OriginalSendingPlayerSpeakingAs"] = sendingPlayer.get("speakingas");
						stringVariables["SendingPlayerIsGM"] = playerIsGM(msg.playerid) ? "1" : "0";
						stringVariables["OriginalSendingPlayerIsGM"] = playerIsGM(msg.playerid) ? "1" : "0";
					}
				}

				arrayVariables["SC_SelectedTokens"] = [];
				arrayVariables["SC_TargetTokens"] = [];

				if (msg.selected) {
					for (let x = 0; x < msg.selected.length; x++) {
						arrayVariables["SC_SelectedTokens"].push(msg.selected[x]._id);
						arrayIndexes["SC_SelectedTokens"] = 0;
					}
				}

				if (handoutSelected && handoutSelected.length > 0) {
					for (let x = 0; x < handoutSelected.length; x++) {
						arrayVariables["SC_SelectedTokens"].push(handoutSelected[x]);
						arrayIndexes["SC_SelectedTokens"] = 0;
					}
				}

				if (handoutTarget && handoutTarget.length > 0) {
					for (let x = 0; x < handoutTarget.length; x++) {
						arrayVariables["SC_TargetTokens"].push(handoutTarget[x]);
						arrayIndexes["SC_TargetTokens"] = 0;
					}
				}

				for (let i = 0; i < handoutVariables.length; i++) {
					stringVariables[handoutVariables[i].name] = handoutVariables[i].value;
					log(`ScriptCards: Setting variable ${handoutVariables[i].name} to ${handoutVariables[i].value}`);
				}

				if (isResume) {
					var stashIndex = resumeArgs[0];
					if (scriptCardsStashedScripts[stashIndex].scriptContent) { cardLines = JSON.parse(scriptCardsStashedScripts[stashIndex].scriptContent); }
					if (scriptCardsStashedScripts[stashIndex].cardParameters) { cardParameters = JSON.parse(scriptCardsStashedScripts[stashIndex].cardParameters); }
					if (scriptCardsStashedScripts[stashIndex].stringVariables) { stringVariables = JSON.parse(scriptCardsStashedScripts[stashIndex].stringVariables); }
					if (scriptCardsStashedScripts[stashIndex].rollVariables) { rollVariables = JSON.parse(scriptCardsStashedScripts[stashIndex].rollVariables); }
					if (scriptCardsStashedScripts[stashIndex].pointerVariables) { pointerVariables = JSON.parse(scriptCardsStashedScripts[stashIndex].pointerVariables); }
					if (scriptCardsStashedScripts[stashIndex].arrayVariables) { arrayVariables = JSON.parse(scriptCardsStashedScripts[stashIndex].arrayVariables); }
					if (scriptCardsStashedScripts[stashIndex].arrayIndexes) { arrayIndexes = JSON.parse(scriptCardsStashedScripts[stashIndex].arrayIndexes); }
					if (scriptCardsStashedScripts[stashIndex].hashTables) { hashTables = JSON.parse(scriptCardsStashedScripts[stashIndex].hashTables); }
					if (scriptCardsStashedScripts[stashIndex].returnStack) { returnStack = JSON.parse(scriptCardsStashedScripts[stashIndex].returnStack); }
					if (scriptCardsStashedScripts[stashIndex].parameterStack) { parameterStack = JSON.parse(scriptCardsStashedScripts[stashIndex].parameterStack); }
					if (scriptCardsStashedScripts[stashIndex].outputLines) { outputLines = JSON.parse(scriptCardsStashedScripts[stashIndex].outputLines); }
					if (scriptCardsStashedScripts[stashIndex].bareoutputLines) { bareoutputLines = JSON.parse(scriptCardsStashedScripts[stashIndex].bareoutputLines); }
					if (scriptCardsStashedScripts[stashIndex].gmonlyLines) { gmonlyLines = JSON.parse(scriptCardsStashedScripts[stashIndex].gmonlyLines); }
					if (scriptCardsStashedScripts[stashIndex].repeatingSectionIDs) { repeatingSectionIDs = JSON.parse(scriptCardsStashedScripts[stashIndex].repeatingSectionIDs); }
					if (scriptCardsStashedScripts[stashIndex].repeatingSection) { repeatingSection = JSON.parse(scriptCardsStashedScripts[stashIndex].repeatingSection); }
					if (scriptCardsStashedScripts[stashIndex].repeatingCharAttrs) { repeatingCharAttrs = JSON.parse(scriptCardsStashedScripts[stashIndex].repeatingCharAttrs); }
					if (scriptCardsStashedScripts[stashIndex].repeatingBeaconState) { repeatingBeaconState = JSON.parse(scriptCardsStashedScripts[stashIndex].repeatingBeaconState); }
					if (scriptCardsStashedScripts[stashIndex].loopControl) { loopControl = scriptCardsStashedScripts[stashIndex].loopControl; }
					if (scriptCardsStashedScripts[stashIndex].loopStack) { loopStack = scriptCardsStashedScripts[stashIndex].loopStack; }
					//if (scriptCardsStashedScripts[stashIndex].loopCounter) {loopCounter = scriptCardsStashedScripts[stashIndex].loopCounter; }
					repeatingCharID = scriptCardsStashedScripts[stashIndex].repeatingCharID;
					repeatingSectionName = scriptCardsStashedScripts[stashIndex].repeatingSectionName;
					repeatingIndex = scriptCardsStashedScripts[stashIndex].repeatingIndex;
					lineCounter = scriptCardsStashedScripts[stashIndex].programCounter;

					if (cardParameters.sourcetoken) {
						var charLookup = getObj("graphic", cardParameters.sourcetoken);
						if (charLookup != null && charLookup.get("represents") !== "") {
							cardParameters.sourcecharacter = getObj("character", charLookup.get("represents"));
						} else {
							cardParameters.sourcecharacter = undefined;
						}
					}

					if (cardParameters.targettoken) {
						var charLookup = getObj("graphic", cardParameters.targettoken);
						if (charLookup != null && charLookup.get("represents") !== "") {
							cardParameters.targetcharacter = getObj("character", charLookup.get("represents"));
						} else {
							cardParameters.targetcharacter = undefined;
						}
					}

					if (msg.selected) {
						arrayVariables["SC_SelectedTokens"] = [];
						for (let x = 0; x < msg.selected.length; x++) {
							arrayVariables["SC_SelectedTokens"].push(msg.selected[x]._id);
							arrayIndexes["SC_SelectedTokens"] = 0;
						}
					}

					if (!isReentrant) {
						for (var x = 1; x < resumeArgs.length; x++) {
							var thisInfo = resumeArgs[x].split(cardParameters.parameterdelimiter);
							stringVariables[thisInfo[0].trim()] = thisInfo[1].trim();
						}
					}
					if (!isReentrant && scriptCardsStashedScripts[resumeArgs[0]]) { delete scriptCardsStashedScripts[resumeArgs[0]]; }

					if (msg.playerid) {
						var sendingPlayer = getObj("player", msg.playerid);
						if (sendingPlayer) {
							stringVariables["SendingPlayerID"] = msg.playerid;
							lastExecutedByID = msg.playerid;
							stringVariables["SendingPlayerName"] = sendingPlayer.get("_displayname");
							lastExecutedDisplayName = sendingPlayer.get("_displayname");
							stringVariables["SendingPlayerColor"] = sendingPlayer.get("color");
							stringVariables["SendingPlayerSpeakingAs"] = sendingPlayer.get("speakingas");
							stringVariables["SendingPlayerIsGM"] = playerIsGM(msg.playerid) ? "1" : "0";
						}
					}

				} else {
					// Strip out all newlines in the input text
					cardContent = msg.content.replace(/(\r\n|\n|\r)/gm, " ");
					cardContent = cardContent.replace(/(<br ?\/?>)*/g, "");
					cardContent = cardContent.replace(/\}\}/g, " }}");
					cardContent = cardContent.replace(/\\\\\[/g, "[");
					cardContent = cardContent.replace(/\\\\\]/g, "]");
					cardContent = cardContent.trim();
					if (cardContent.charAt(cardContent.length - 1) !== "}") {
						if (cardContent.charAt(cardContent.length - 2) !== "}") {
							cardContent += "}";
						}
						cardContent += "}";
					}

					var libraries = cardContent.match(/\+\+\+[\s\S]*?\+\+\+(?=(?:(?:(?!\$\{|\$\})[\s\S])*\$\{(?:(?!\$\{|\$\})[\s\S])*\$\})*(?:(?!\$\{|\$\})[\s\S])*$)/g);
					if (libraries) {
						cardContent = insertLibraryContent(cardContent, libraries[0].replace(/\+\+\+/g, ""));
						//cardContent = cardContent.replace(/\+\+\+(?=(?:(?:(?!\$\{|\$\})[\s\S])*\$\{(?:(?!\$\{|\$\})[\s\S])*\$\})*(?:(?!\$\{|\$\})[\s\S])*$)/g, "")
						cardContent = removeLibraryBlocks(cardContent);
					}

					// Split the card into an array of tag-based (--) lines
					//let cardWork = cardContent.match(/\{\{(.*?)\}\}/gis)
					let cardWork = getFirstOutermostDoubleBraceBlock(cardContent);
					//cardWork = cardWork.trim().slice(2, cardWork.length - 2);
					cardWork = cardWork.trim().slice(2, -2);
					if (cardWork) {
						cardWork = cardWork.replaceAll("!{!{", "{{").replaceAll("!}!}", "}}");
						//var cardLines = cardWork[0].substring(2, cardWork[0].length - 3).split("--")
						if ((cardWork.indexOf("$}") > -1) && (cardWork.indexOf("${") > -1)) {
							cardLines = cardWork
								.substring(2, cardWork.length - 3)
								.split(/--(?=(?:(?:(?!\$\{|\$\})[\s\S])*\$\{(?:(?!\$\{|\$\})[\s\S])*\$\})*(?:(?!\$\{|\$\})[\s\S])*$)/);
						} else {
							cardLines = cardWork.split("--");
						}
					}
					//var cardLines = cardContent.match(/\{\{(.*?)\}\}/gis) ? (" " + cardContent.match(/\{\{(.*?)\}\}/gis)[0]).substring(2,-2).split("--") : []
				}

				// pre-parse line labels and store line numbers for branching and for data lines to store in the data structure
				for (let x = 0; x < cardLines.length; x++) {
					let thisTag = getLineTag(cardLines[x], x, false)
					let isRedef = false;
					if (thisTag.charAt(0) == ":") {
						if (lineLabels[thisTag.substring(1)]) {
							log(`ScriptCards Warning: redefined label ${thisTag.substring(1)}`);
							isRedef = true;
						}
						if (labelChecking[thisTag.substring(1).toLowerCase()] && !isRedef) {
							log(`ScriptCards Warning: Similar labels ${labelChecking[thisTag.substring(1).toLowerCase()]} and ${thisTag.substring(1)}`);
						}
						lineLabels[thisTag.substring(1)] = x;
						labelChecking[thisTag.substring(1).toLowerCase()] = thisTag.substring(1);
					}
					if (thisTag.toLowerCase() === "d!") {
						var thisData = CSVtoArray(getLineContent(cardLines[x]));
						while (thisData.length > 0) {
							let dataElement = thisData.shift();
							scriptData.push(dataElement);
							saveScriptData.push(dataElement);
						}
					}
				}

				if (isReentrant) {
					outputLines = [];
					bareoutputLines = [];
					gmonlyLines = [];
					var entryLabel = resumeArgs[1].split(";")[0];
					stringVariables["reentryval"] = resumeArgs[1].split(";")[1];
					if (lineLabels[entryLabel]) {
						lineCounter = lineLabels[entryLabel]
					} else {
						log(`ScriptCards Error: Label ${resumeArgs[1]} is not defined for reentrant script`)
					}
				}

				// Process card lines starting with the first line (cardLines[0] will contain an empty string due to the split)
				do {
					while (lineCounter < cardLines.length) {

						startBeaconReadAhead(cardLines, lineCounter, cardParameters);
						let thisTag = await replaceVariableContent(getLineTag(cardLines[lineCounter], lineCounter, true), cardParameters, false);
						const lowerTag = thisTag.toLowerCase();
						const preserveObjectModificationEscapedPipes = lowerTag.startsWith("!a:")
							|| lowerTag.startsWith("!c:")
							|| (String(cardParameters.beaconsheet) === "1" && lowerTag.startsWith("!or:"));
						const lineContent = getLineContent(cardLines[lineCounter], preserveObjectModificationEscapedPipes);
						let thisContent = await replaceVariableContent(lineContent, cardParameters, (thisTag.charAt(0) == "+" || thisTag.charAt(0) == "*" || thisTag.charAt(0) == "&"));

						if (cardParameters.debug == 1) {
							log(`Line Counter: ${lineCounter}, Tag:${thisTag}, Content:${thisContent}`);
						}

						if (thisTag.charAt(0) !== "/") {

							// Handle Stashing and asking for info
							if (thisTag.charAt(0).toLowerCase() == "i") {
								var myGuid = uuidv4();
								var stashType = thisTag.substring(1);
								var stashList = thisContent.split("||");
								var buildLine = "";
								var varList = "";
								for (var x = 0; x < stashList.length; x++) {
									var theseParams = stashList[x].split(";");
									if (theseParams[0].toLowerCase() == "t") {
										if (buildLine !== "") { buildLine += "-|-"; varList += ";"; }
										buildLine += theseParams[1] + ";&#64;{target|" + theseParams[2] + "|token_id}";
										varList += theseParams[1];
									}
									if (theseParams[0].toLowerCase() == "q") {
										if (buildLine !== "") { buildLine += "-|-"; varList += cardParameters.parameterdelimiter; }
										buildLine += theseParams[1] + cardParameters.parameterdelimiter + "?{" + theseParams[2] + "}";
										varList += theseParams[1];
									}
								}
								var flavorText = stashType.split(";")[0];
								if (cardParameters.formatinforequesttext !== "0") {
									flavorText = processInlineFormatting(flavorText, cardParameters, false);
								}
								var buttonLabel = stashType.split(";")[1];

								stashAScript(myGuid, cardLines, cardParameters, stringVariables, rollVariables, returnStack, parameterStack, lineCounter + 1, outputLines, "", "X", arrayVariables, arrayIndexes, gmonlyLines, bareoutputLines);
								lineCounter = cardLines.length + 100;
								cardParameters.hidecard = "1";
								sendChat(msg.who, `/w ${msg.who} ${flavorText}` + makeButton(buttonLabel, `!sc-resume ${myGuid}-|-${buildLine}`, cardParameters));
							}

							// *********** STARTHERE

							switch (thisTag.charAt(0).toLowerCase()) {
								case "!": await handleObjectModificationCommands(thisTag, thisContent, cardParameters); break;
								case "a": playJukeboxTrack(thisContent); break;
								case "c": await handleCaseCommand(thisTag, thisContent, cardParameters, cardLines); break;
								case "d": handleDataReadCommands(thisTag); break;
								case "e": handleEmoteCommands(thisTag, thisContent); break;
								case "h": handleHasTableCommands(thisTag, hashTables, thisContent); break;
								case "l": handleLoadCommands(thisTag, thisContent, cardParameters); break;
								case "p": handlePointerCommand(thisTag, thisContent); break;
								case "r": await handleRepeatingAttributeCommands(thisTag, thisContent, cardParameters); break;
								case "s": handleStashLines(thisTag, thisContent, cardParameters); break;
								case "w": await handleWaitStatements(thisTag, thisContent, cardParameters); break;
								case "v": handleVisualEffectsCommand(thisTag, thisContent, cardParameters); break;
								case "x": {
									await settleBeaconReadAheadPromises();
									if (cardParameters.functionbenchmarking == "1") { reportBenchmarkingData(); }
									(cardParameters["reentrant"] !== 0) ? stashAScript(cardParameters["reentrant"], cardLines, cardParameters, stringVariables, rollVariables, returnStack, parameterStack, lineCounter + 1, outputLines, varList, "X", arrayVariables, arrayIndexes, gmonlyLines, bareoutputLines) : null
									lineCounter = cardLines.length + 1;
								} break;
								case "z": handleZOrderSettingCommands(thisTag, thisContent); break;
								case "~": await handleFunctionCommands(thisTag, thisContent, cardParameters, msg); break;
								case "^": if (lineLabels[thisTag.substring(1)]) { lineCounter = lineLabels[thisTag.substring(1)] } else { log(`ScriptCards Error: Label ${jumpTo} is not defined on line ${lineCounter} (${thisTag}, ${thisContent})`) } break;
								case "@": handleAPICallCommands(thisTag, thisContent, cardParameters, msg); break;
								case "#": handleCardSettingsCommands(thisTag, thisContent, cardParameters); break;
								case "+": case "*": await handleOutputCommands(thisTag, thisContent, cardParameters); break;
								case "=": await handleRollVariableSetCommand(thisTag, thisContent, cardParameters); break;
								case "&": await setStringOrArrayElement(thisTag.substring(1), thisContent, cardParameters); break;
								case "\\": handleConsoleLogs(thisTag, thisContent); break;
								case "<": if (returnStack.length > 0) {
									arrayVariables["args"] = [];
									callParamList = parameterStack.pop();
									if (callParamList) {
										for (const value of Object.values(callParamList)) {
											arrayVariables["args"].push(value.toString().trim());
										}
									}
									lineCounter = returnStack.pop();
								} break;
								case ">": handleGosubCommands(thisTag, thisContent, cardParameters); break;
								case "]": handleBlockEndCommand(thisTag, thisContent, cardLines); break;
								case "?": await handleConditionalBlock(thisTag, thisContent, cardParameters, cardLines); break;
								//case "%": handleLoopStatements(thisTag, thisContent, cardParameters, cardLines); break;
							}

							// Handle looping statements
							if (thisTag.charAt(0) === "%") {
								var loopCounter = thisTag.substring(1);
								if (loopCounter && loopCounter !== "!") {
									if (loopControl[loopCounter]) { log(`ScriptCards: Warning - loop counter ${loopCounter} reused inside itself on line ${lineCounter}.`); }
									var params = thisContent.split(cardParameters.parameterdelimiter);
									if (params.length === 2 && params[0].toLowerCase().endsWith("each")) {
										// This will be a for-each loop, so the first (and only) parameter must be an array name
										if (arrayVariables[params[1]] && arrayVariables[params[1]].length > 0) {
											loopControl[loopCounter] = { loopType: "foreach", initial: 0, current: 0, end: arrayVariables[params[1]].length - 1, step: 1, nextIndex: lineCounter, arrayName: params[1] }
											stringVariables[loopCounter] = arrayVariables[params[1]][0];
											loopStack.push(loopCounter);
											if (cardParameters.debug == 1) { log(`ScriptCards: Info - Beginning of loop ${loopCounter}`) }
										} else {
											log(`ScriptCards For...Each loop without a defined array or with empty array on line ${lineCounter}`)
										}
									}
									if (params.length === 2 && (params[0].toLowerCase().endsWith("while") || params[0].toLowerCase().endsWith("until"))) {
										var originalContent = getLineContent(cardLines[lineCounter]);
										var contentParts = originalContent.split(cardParameters.parameterdelimiter);
										var isTrue = await processFullConditional(await replaceVariableContent(contentParts[1], cardParameters)) || params[0].toLowerCase().endsWith("until");
										if (isTrue) {
											loopControl[loopCounter] = { loopType: params[0].toLowerCase().endsWith("until") ? "until" : "while", initial: 0, current: 0, end: 999999, step: 1, nextIndex: lineCounter, condition: contentParts[1] }
											stringVariables[loopCounter] = "true";
											loopStack.push(loopCounter);
											if (cardParameters.debug == 1) { log(`ScriptCards: Info - Beginning of loop ${loopCounter}`) }
										} else {
											var line = lineCounter;
											for (line = lineCounter + 1; line < cardLines.length; line++) {
												if (getLineTag(cardLines[line], line, "").trim() == "%") {
													lineCounter = line;
													break;
												}
											}
											if (lineCounter > cardLines.length) {
												log(`ScriptCards: Warning - no end block marker found for loop block started ${loopCounter}`);
												lineCounter = cardLines.length + 1;
											}
										}
									}
									if (params.length === 2 && (!params[0].toLowerCase().endsWith("each")) && (!params[0].toLowerCase().endsWith("until")) && (!params[0].toLowerCase().endsWith("while"))) { params.push("1"); } // Add a "1" as the assumed step value if only two parameters
									if (params.length === 3) {
										if (isNumeric(params[0]) && isNumeric(params[1]) && isNumeric(params[2]) && parseInt(params[2]) != 0) {
											loopControl[loopCounter] = { loopType: "fornext", initial: parseInt(params[0]), current: parseInt(params[0]), end: parseInt(params[1]), step: parseInt(params[2]), nextIndex: lineCounter }
											stringVariables[loopCounter] = params[0];
											loopStack.push(loopCounter);
											if (cardParameters.debug == 1) { log(`ScriptCards: Info - Beginning of loop ${loopCounter}`) }
										} else {
											if (parseInt(params[2] == 0)) {
												log(`ScriptCards: Error - cannot use loop step of 0 at line ${lineCounter}`)
											} else {
												log(`ScriptCards: Error - loop initialization contains non-numeric values on line ${lineCounter}`)
											}
										}
									}
								} else {
									if (loopStack.length >= 1) {
										var currentLoop = loopStack[loopStack.length - 1];
										if (loopControl[currentLoop]) {
											loopControl[currentLoop].current += loopControl[currentLoop].step;
											switch (loopControl[currentLoop].loopType) {
												case "fornext":
													stringVariables[currentLoop] = loopControl[currentLoop].current.toString();
													break;
												case "foreach":
													try {
														var beforeLoopEnded = stringVariables[currentLoop]
														stringVariables[currentLoop] = arrayVariables[loopControl[currentLoop].arrayName][loopControl[currentLoop].current]
													} catch {
														stringVariables[currentLoop] = "ArrayError"
													}
													break;
												case "while":
													var isTrue = await processFullConditional(await replaceVariableContent(loopControl[currentLoop].condition, cardParameters));
													if (!isTrue) {
														loopControl[currentLoop].current = loopControl[currentLoop].end + 1;
														loopControl[currentLoop].step = 1;
													}
													break;
												case "until":
													var isTrue = await processFullConditional(await replaceVariableContent(loopControl[currentLoop].condition, cardParameters));
													if (isTrue) {
														loopControl[currentLoop].current = loopControl[currentLoop].end + 1;
														loopControl[currentLoop].step = 1;
													}
													break;

											}
											if ((loopControl[currentLoop].step > 0 && loopControl[currentLoop].current > loopControl[currentLoop].end) ||
												(loopControl[currentLoop].step < 0 && loopControl[currentLoop].current < loopControl[currentLoop].end) ||
												loopCounter == "!") {
												stringVariables[currentLoop] = beforeLoopEnded;
												loopStack.pop();
												delete loopControl[currentLoop];
												if (cardParameters.debug == 1) { log(`ScriptCards: Info - End of loop ${currentLoop}`) }
												if (loopCounter == "!") {
													var line = lineCounter;
													for (line = lineCounter + 1; line < cardLines.length; line++) {
														if (getLineTag(cardLines[line], line, "").trim() == "%") {
															lineCounter = line;
															break;
														}
													}
													if (lineCounter > cardLines.length) {
														log(`ScriptCards: Warning - no end block marker found for loop block started ${loopCounter}`);
														lineCounter = cardLines.length + 1;
													}
												}
											} else {
												lineCounter = loopControl[currentLoop].nextIndex;
											}
										}
									} else {
										log(`ScriptCards: Error - Loop end statement without an active loop on line ${lineCounter}`);
									}
								}
							}
						}

						executionCounter++;

						if (executionCounter > cardParameters.executionlimit) {
							log("ScriptCards Error: Execution Limit Reached. Terminating Script;")
							lineCounter = cardLines.length + 1;
						}
						lineCounter++;
					}
				} while (repeatScriptCard)

				await settleBeaconReadAheadPromises();
				var subtitle = "";
				if ((cardParameters.leftsub !== "") && (cardParameters.rightsub !== "")) {
					subtitle = cardParameters.leftsub + cardParameters.subtitleseparator + cardParameters.rightsub;
				}
				if ((cardParameters.leftsub !== "") && (cardParameters.rightsub == "")) {
					subtitle = cardParameters.leftsub;
				}
				if ((cardParameters.leftsub == "") && (cardParameters.rightsub !== "")) {
					subtitle = cardParameters.rightsub;
				}

				subtitle = processInlineFormatting(subtitle, cardParameters, (cardParameters.overridetemplate.toLowerCase() !== "none"));

				var gmoutput = (gmonlyLines.length > 0) ? gmoutput = htmlTemplateHiddenTitle.replace("=X=TITLE=X=", cardParameters.title).replace("=X=SUBTITLE=X=", subtitle) : ""

				var cardOutput = (cardParameters.hidetitlecard == "0") ? (htmlTemplate.replace("=X=TITLE=X=", cardParameters.title).replace("=X=SUBTITLE=X=", subtitle))
					: htmlTemplateHiddenTitle.replace("=X=TITLE=X=", cardParameters.title).replace("=X=SUBTITLE=X=", subtitle);

				cardOutput += outputLines.join("")
				gmoutput += gmonlyLines.join("")

				cardOutput += htmlTemplateEnd;
				cardOutput = replaceStyleInformation(cardOutput, cardParameters);

				if (gmonlyLines.length > 0) {
					gmoutput += htmlTemplateEnd;
					gmoutput = replaceStyleInformation(gmoutput, cardParameters);
				}

				var emote = "";
				var emoteLeft = "";
				var emoteRight = "";

				if (cardParameters.emotestate == "visible") {
					if (cardParameters.sourcetoken !== "") {
						var thisToken = getObj("graphic", cardParameters.sourcetoken.trim());
						if (thisToken != null && thisToken.get("imgsrc") !== "") {
							emoteLeft = `<img src=${thisToken.get("imgsrc")} style='height: ${cardParameters.emotesourcetokensize}px; min-width: ${cardParameters.emotesourcetokensize}px; float: left;'></img>`;
						}
					}
					if (cardParameters.targettoken !== "") {
						var thisToken = getObj("graphic", cardParameters.targettoken.trim());
						if (thisToken != null && thisToken.get("imgsrc") !== "") {
							emoteRight = `<img src=${thisToken.get("imgsrc")} style='height: ${cardParameters.emotetargettokensize}px; min-width: ${cardParameters.emotetargettokensize}px; float: left;'></img>`;
						}
					}
				}

				if (cardParameters.emotesourcetokenoverride !== "0") {
					emoteLeft = `<img src=${cardParameters.emotesourcetokenoverride} style='height: ${cardParameters.emotesourcetokensize}px; min-width: ${cardParameters.emotesourcetokensize}px; float: left;'></img>`;
				}

				if (cardParameters.emotetargettokenoverride !== "0") {
					emoteRight = `<img src=${cardParameters.emotetargettokenoverride} style='height: ${cardParameters.emotesourcetokensize}px; min-width: ${cardParameters.emotesourcetokensize}px; float: left;'></img>`;
				}

				if (cardParameters.emotetext !== "" || emoteLeft !== "" || emoteRight !== "") {
					if (emoteLeft == "") { emoteLeft = "&nbsp;" }
					if (emoteRight == "") { emoteRight = "&nbsp;" }
					emote = "<div style='display: table; margin: -5px 0px 3px -7px; font-weight: normal; font-style: normal; background: " + cardParameters.emotebackground + "'>" + emoteLeft + "<div style='display: table-cell; width: 100%; " + " font-size: " + cardParameters.emotefontsize + "; font-weight: " + cardParameters.emotefontweight + "; color: " + cardParameters.emotefontcolor + "; font-family: " + cardParameters.emotefont + "; " + "vertical-align: middle; text-align: center; padding: 0px 2px;'>" + cardParameters.emotetext + "</div><div style='display: table-cell; margin: -5px 0px 3px -7px; font-weight: normal; font-style: normal;'>" + emoteRight + "</div></div>"
					emote = await replaceVariableContent(emote, cardParameters, false);
				}

				var from = cardParameters.showfromfornonwhispers !== "0" ? msg.who : "";

				cardOutput = removeInlineRolls(cardOutput, cardParameters);
				emote = removeInlineRolls(emote, cardParameters);

				if (cardParameters.overridetemplate.toLowerCase() !== "none") {
					var textCode = templates[cardParameters.overridetemplate].textcode;
					if (textCode && textCode.indexOf("font-style:") == -1) {
						textCode = textCode.slice(0, textCode.lastIndexOf(";")) + "; font-style: normal;" + textCode.slice(textCode.lastIndexOf(";") + 1)
					}
					var titleCode = templates[cardParameters.overridetemplate].titlecode
					if (titleCode && titleCode.indexOf("font-style:") == -1) {
						titleCode = titleCode.slice(0, titleCode.lastIndexOf(";")) + "; font-style: normal;" + titleCode.slice(titleCode.lastIndexOf(";") + 1)
					}
					var boxCode = templates[cardParameters.overridetemplate].boxcode
					if (boxCode && boxCode.indexOf("font-style:") == -1) {
						boxCode = boxCode.slice(0, boxCode.lastIndexOf(";")) + "; font-style: normal;" + boxCode.slice(boxCode.lastIndexOf(";") + 1)
					}
					cardOutput = boxCode + titleCode + cardParameters.title + textCode;
					if (subtitle != "") {
						cardOutput += `<div align=center ${FillTemplateStyle("subtitlestyle", cardParameters, true)}> ${subtitle}</div>`
					}
					for (var x = 0; x < outputLines.length; x++) {
						cardOutput += bareoutputLines[x];
					}
					cardOutput += templates[cardParameters.overridetemplate].buttonwrapper
					cardOutput += '</div></div></div>' + templates[cardParameters.overridetemplate].footer + "</div>"
					cardOutput = replaceStyleInformation(cardOutput, cardParameters);
					cardOutput = removeInlineRolls(cardOutput, cardParameters);
				}

				if (cardParameters.hidecard == "0") {
					if (emote !== "") {
						if (cardParameters.whisper == "" || cardParameters.whisper == "0") {
							sendChat(from, "/desc " + emote + " " + cardOutput);
						} else {
							var whispers = cardParameters.whisper.split(",");
							for (var w in whispers) {
								var WhisperTarget = whispers[w].trim();
								if (WhisperTarget == "self") {
									WhisperTarget = getObj("player", msg.playerid).get("displayname");
								}
								sendChat(msg.who, `/w "${WhisperTarget}" ${emote} ${cardOutput}`);
							}
						}
					} else {
						if (cardParameters.whisper == "" || cardParameters.whisper == "0") {
							sendChat(from, "/desc " + cardOutput);
						} else {
							var whispers = cardParameters.whisper.split(",");
							for (var w in whispers) {
								var WhisperTarget = whispers[w].trim();
								if (WhisperTarget == "self") {
									WhisperTarget = getObj("player", msg.playerid).get("displayname");
								}
								sendChat(msg.who, `/w "${WhisperTarget}" ${cardOutput}`);
							}
						}
					}
				}

				if (gmonlyLines.length > 0) {
					var gmWhisperTarget = cardParameters.gmoutputtarget
					if (gmWhisperTarget == "self") {
						gmWhisperTarget = getObj("player", msg.playerid).get("displayname");
					}
					sendChat("API", "/w " + gmWhisperTarget + " " + gmoutput);
				}
				beaconStructuredIndexCache.clear();
				beaconSheetItemCache.clear();
				beaconSheetItemMissCache.clear();
				beaconSheetItemPending.clear();
				beaconSheetItemQueue = [];
				beaconSheetItemActiveReads = 0;
				beaconSheetItemGeneration.clear();
				beaconReadAheadPromises.clear();
				beaconReadAheadReferenceCache.clear();
				beaconRepeatingStateCache.clear();
				beaconRepeatingWritableTargetCache.clear();
				beaconRepeatingWritableTargets = [];
				beaconAttributeRepeatingRowCache.clear();
			}
		}
	}

	on('ready', function () {
		// if ScriptCards has never been run in this game, create state information to store
		// configuration and values between sessions/sandbox instances.
		if (!state[APINAME]) { state[APINAME] = { module: APINAME, schemaVersion: APIVERSION, config: {}, persistentVariables: {} }; }
		if (state[APINAME].storedVariables == undefined) { state[APINAME].storedVariables = {}; }
		if (state[APINAME].storedSettings == undefined) { state[APINAME].storedSettings = {}; }
		if (state[APINAME].storedStrings == undefined) { state[APINAME].storedStrings = {}; }
		if (state[APINAME].storedSnippets == undefined) { state[APINAME].storedSnippets = {}; }
		if (state[APINAME].triggersenabled == undefined) { state[APINAME].triggersenabled = true; }
		if (state[APINAME].playerscandelete == undefined) { state[APINAME].playerscandelete = false; }

		if (APIVERSION.indexOf("EXPERIMENTAL") !== -1) {
			sendChat(APINAME, "/w gm " + APINAME + " version " + APIVERSION + " initializing. Warning: This version is experimental and may contain bugs. Use with caution.");
		}

		reload_template_mule();

		const findBioMule = findObjs({ _type: "character", name: "ScriptCards_BioMule" })[0];
		if (findBioMule) {
			const bioCharID = findBioMule.id;
			log(`ScriptCards Bio Mule Active. BioMule Character ID is ${bioCharID}`);
		}

		if (state[APINAME].triggersenabled) {
			const findTriggerChar = findObjs({ _type: "character", name: "ScriptCards_Triggers" })[0];
			if (findTriggerChar) {
				const triggerCharID = findTriggerChar.id;
				log(`ScriptCards Triggers Active. Trigger Character ID is ${triggerCharID}`);

				log(`ScriptCards Message Triggers enabled? ${checkForMessageTriggers(triggerCharID) == true ? "Yes" : "No"}`)

				on('change:campaign:turnorder', () => onChangeCampaignTurnorder(triggerCharID));

				const handleAbilityTrigger = (eventName, replacementGenerator) => {
					on(eventName, (obj, prev) => {
						var newEventName = eventName;
						//log(`Raw attribute trigger: ${newEventName}`)
						if (eventName == "change:attribute") {
							newEventName = eventName + ":" + prev.name
						}
						//log(`Parsed attribute trigger: ${newEventName}`)
						const abilities = findObjs({ type: "ability", _characterid: triggerCharID, name: newEventName });
						if (Array.isArray(abilities) && abilities.length > 0) {
							const replacement = replacementGenerator(obj, prev);
							abilities.forEach(ability => {
								const metacard = ability.get("action").replace("--/|TRIGGER_REPLACEMENTS", replacement);
								sendChat("API", metacard);
							});
						}
					});
				};

				if (checkForMessageTriggers(triggerCharID)) {
					on('chat:message', function (msg) {
						onChatMessagTrigger(triggerCharID, msg);
					});
				}

				handleAbilityTrigger('change:campaign:playerpageid', (obj, prev) =>
					` --&PreviousPageID|${prev.playerpageid} --&NewPageID|${obj.get("playerpageid")} `
				);

				handleAbilityTrigger('change:attribute', (obj, prev) => {
					let replacement = "";
					for (const property in prev) {
						replacement += ` ${getSafeTriggerString("AttributeOld" + property, prev[property])} ${getSafeTriggerString("AttributeNew" + property, obj.get(property))} `;
					}
					return replacement;
				});

				handleAbilityTrigger('change:graphic', (obj, prev) => {
					let replacement = "";
					for (const property in prev) {
						if (property !== "gmnotes" && property !== "notes" && property !== "bio") {
							replacement += ` ${getSafeTriggerString("GraphicOld" + property, prev[property])} ${getSafeTriggerString("GraphicNew" + property, obj.get(property))} `;
						}
					}
					return replacement;
				});

				handleAbilityTrigger('change:pin', (obj, prev) => {
					let replacement = "";
					for (const property in prev) {
						replacement += ` ${getSafeTriggerString("PinOld" + property, prev[property])} ${getSafeTriggerString("PinNew" + property, obj.get(property))} `;
					}
					return replacement;
				});

				handleAbilityTrigger('change:door', (obj, prev) => {
					let replacement = "";
					for (const property in prev) {
						replacement += ` ${getSafeTriggerString("DoorOld" + property, prev[property])} ${getSafeTriggerString("DoorNew" + property, obj.get(property))} `;
					}
					return replacement;
				});

				handleAbilityTrigger('change:page', (obj, prev) => {
					let replacement = "";
					for (const property in prev) {
						replacement += ` ${getSafeTriggerString("PageOld" + property, prev[property])} ${getSafeTriggerString("PageNew" + property, obj.get(property))} `;
					}
					return replacement;
				});

				handleAbilityTrigger('change:character', (obj, prev) => {
					let replacement = getSafeTriggerString("CharChanged", obj.id);
					for (const property in prev) {
						replacement += ` ${getSafeTriggerString("CharOld" + property, prev[property])} ${getSafeTriggerString("CharNew" + property, obj.get(property))} `;
						replacement += ` ${getSafeTriggerString("CharacterOld" + property, prev[property])} ${getSafeTriggerString("CharacterNew" + property, obj.get(property))} `;
					}
					return replacement;
				});

				handleAbilityTrigger('add:attribute', (obj) =>
					` ${getSafeTriggerString("AttributeAdded", obj.id)} `
				);

				handleAbilityTrigger('add:page', (obj) =>
					` ${getSafeTriggerString("PageAdded", obj.id)} `
				);

				handleAbilityTrigger('add:character', (obj) =>
					` ${getSafeTriggerString("CharAdded", obj.id)} `
				);

				handleAbilityTrigger('destroy:page', (obj) => {
					const copy = Object.assign({}, obj);
					let replacement = "";
					for (const property in copy.attributes) {
						try {
							replacement += ` ${getSafeTriggerString("PageRemoved" + property, copy.attributes[property])} `;
						} catch (e) {
							// do nothing
						}
					}
					return replacement;
				});

				handleAbilityTrigger('add:graphic', (obj) =>
					` ${getSafeTriggerString("GraphicAdded", obj.id)} `
				);

				handleAbilityTrigger('add:pin', (obj) =>
					` ${getSafeTriggerString("Pin", obj.id)} `
				);

				handleAbilityTrigger('destroy:graphic', (obj) => {
					const copy = Object.assign({}, obj);
					let replacement = "";
					for (const property in copy.attributes) {
						try {
							replacement += ` ${getSafeTriggerString("GraphicRemoved" + property, copy.attributes[property])} `;
						} catch (e) {
							// do nothing
						}
					}
					return replacement;
				});

				handleAbilityTrigger('destroy:pin', (obj) => {
					const copy = Object.assign({}, obj);
					let replacement = "";
					for (const property in copy.attributes) {
						try {
							replacement += ` ${getSafeTriggerString("PinRemoved" + property, copy.attributes[property])} `;
						} catch (e) {
							// do nothing
						}
					}
					return replacement;
				});

				handleAbilityTrigger('add:door', (obj) =>
					` ${getSafeTriggerString("DoorAdded", obj.id)} `
				);

				handleAbilityTrigger('destroy:door', (obj) => {
					const copy = Object.assign({}, obj);
					let replacement = "";
					for (const property in copy.attributes) {
						try {
							replacement += ` ${getSafeTriggerString("DoorRemoved" + property, copy.attributes[property])} `;
						} catch (e) {
							// do nothing
						}
					}
					return replacement;
				});

				setTimeout(() => {
					const attrib = findObjs({ type: "attribute", _characterid: triggerCharID, name: `listen_to_tokenmod` });
					if (attrib && attrib[0] && attrib[0].get("current") == "1") {
						if (typeof TokenMod !== 'undefined' && TokenMod.ObserveTokenChange) {
							TokenMod.ObserveTokenChange((obj, prev) => {
								const abilities = findObjs({ type: "ability", _characterid: triggerCharID, name: `change:graphic` });
								if (Array.isArray(abilities) && abilities.length > 0) {
									let replacement = "";
									for (const property in prev) {
										replacement += ` --&GraphicOld${property}|${prev[property]} --&GraphicNew${property}|${obj.get(property)}`;
									}
									const metacard = abilities[0].get("action").replace("--/|TRIGGER_REPLACEMENTS", replacement);
									sendChat("API", metacard);
								}
							});
							log('ScriptCards: Triggers character exists, so registered with TokenMod to observe token changes.');
						}
					}
				}, 1);
			} else {
				log(`ScriptCards Triggers could not find character named "ScriptCards_Triggers"`);
			}
		}

		var findStorageChar = findObjs({ _type: "character", name: "ScriptCards_Storage" })[0];
		if (findStorageChar) { storageCharID = findStorageChar.id; log(`ScriptCards Storage character: ${storageCharID} `) }

		// Retrieve the list of token/status markers from the Campaign and create an associative
		// array that links the marker name to the URL of the marker image for use in the
		// [sm]...[/sm] inline formatting syntax. This allows us to fully support custom token
		// marker sets.
		const tokenMarkers = JSON.parse(Campaign().get("token_markers"));
		tokenMarkers.forEach(({ name, url }) => {
			tokenMarkerURLs[name] = url;
		});

		// Cache any library handouts
		loadLibraryHandounts();

		API_Meta.ScriptCards.version = APIVERSION;
		API_Meta.ScriptCards.numericVersion = NUMERIC_VERSION;

		// Log that the script is "ready". We also include the meta offset which can be used
		// to track sandbox crash errors by subtracting the offset from the line number that the
		// sandbox reports to contain the error.
		log(`-=> ${APINAME} - ${APIVERSION} by ${APIAUTHOR} Ready <=- Meta Offset : ${API_Meta.ScriptCards.offset}`);

		if (APIVERSION.toLowerCase().endsWith("experimental")) {
			log(`-=> NOTE: This is an experimental version of ScriptCards and is not recommended for widespread use at this time. <=-`);
		}

		// When a handout changes, recache the library handouts
		on("change:handout", function () {
			loadLibraryHandounts();
		});

		// Main processing area... looing for api commands to handle.
		// While the main ScriptCards command is !scriptcards (or !script, or !scriptcard) we also
		// respond to several other commands, including:
		// !sc-liststoredsettings - Provides a list of stored settings groups (via --s)
		// !sc-deletestoredsettings - Delete a stored settings group
		// !sc-resume - resume a card paused with --i
		// !sc-reentrant - resume execution of a card at a particular label
		// Register chat:message handler with queue system
		on('chat:message', function (msg) {
			messageQueue.push(msg);
			processMessageQueue();
		});
	});

	function getAttributeReferenceCharacter(characterOrTokenId) {
		let character = getObj("character", characterOrTokenId);
		if (character) {
			return character;
		}
		const token = getObj("graphic", characterOrTokenId);
		if (token && token.get("represents")) {
			character = getObj("character", token.get("represents"));
		}
		return character;
	}

	async function getAttributeReferenceValue(characterOrTokenId, attributeName, cardParameters, operation = "current") {
		const character = getAttributeReferenceCharacter(characterOrTokenId);
		const requestedName = String(attributeName == null ? "" : attributeName).trim();
		if (!character || !requestedName) {
			return { found: false, value: undefined };
		}

		const beaconMode = cardParameters && String(cardParameters.beaconsheet) === "1";
		if (beaconMode && /^repeating_/i.test(requestedName)) {
			const repeatingTarget = await resolveBeaconAttributeSetRepeatingTarget(
				character.id,
				requestedName,
				false
			);
			if (repeatingTarget.success) {
				const value = await getBeaconRepeatingField(
					repeatingTarget.state,
					repeatingTarget.rowIndex,
					repeatingTarget.fieldName,
					repeatingTarget.operation,
					cardParameters.debug === "1"
				);
				if (!beaconLookupIsUnresolved(value)) {
					return { found: true, value, source: "beacon-repeating" };
				}
			}
		}

		const lookupName = operation === "max" && !requestedName.endsWith("^")
			? `${requestedName}^`
			: requestedName;
		return await getPageTokenCharacterAttributeValue(
			character,
			lookupName,
			beaconMode,
			cardParameters && cardParameters.debug === "1"
		);
	}

	async function resolveAttributeSubstitution(characterid, reference, cardParameters) {
		if (typeof reference !== "string") {
			return reference;
		}

		const attributeReferencePattern = /\@(?:[\{])[\w|\s|À-ÖØ-öø-ÿ|\%|\(|\:|\.|\_|\>|\^|\-\+|\)]*?(?!\w+[\{])(\})/g;
		const seen = new Set();
		let substitutionCount = 0;
		while (reference.match(attributeReferencePattern) != null && substitutionCount < 100) {
			if (seen.has(reference)) {
				if (cardParameters && cardParameters.debug === "1") {
					log(`ScriptCards: Circular nested attribute substitution stopped for ${reference}`);
				}
				break;
			}
			seen.add(reference);
			const thisMatch = reference.match(attributeReferencePattern)[0];
			const attrName = thisMatch.substring(2, thisMatch.length - 1);
			const lookup = await getAttributeReferenceValue(characterid, attrName, cardParameters, "current");
			const replacement = lookup.found && lookup.value != null ? lookup.value : "";
			const nextReference = reference.replace(thisMatch, replacement);
			if (nextReference === reference) {
				break;
			}
			reference = nextReference;
			substitutionCount++;
		}
		if (substitutionCount >= 100 && cardParameters && cardParameters.debug === "1") {
			log(`ScriptCards: Nested attribute substitution limit reached for ${reference}`);
		}

		return reference;
	}

	async function replaceVariableContent(content, cardParameters, rollHilighting) {
		if (cardParameters && cardParameters.disablevariableexpansion && cardParameters.disablevariableexpansion == 1) { return content }
		var failCount = 0;
		const failLimit = 1000;
		if (content === undefined) { return content }
		if (!(typeof content.match == 'function')) { return content }
		content = content.replace(/\[&zwnj;/g, "[")
		var rexMatch;
		rexMatch = /(?=(?:(?:(?!\$\{|\$\})[\s\S])*\$\{(?:(?!\$\{|\$\})[\s\S])*\$\})*(?:(?!\$\{|\$\})[\s\S])*$)\[(?:[\$&@%\*~=:\?^])[^\[\]]*?(?!\.+[\[])(\])/g
		//while (content.match(/\[(?:[\$|\&|\@|\%|\*|\~|\=|\:|\?])[^\[\]]*?(?!\.+[\[])(\])/g) != null) {
		while (content.match(rexMatch) != null) {
			var thisMatch = content.match(rexMatch)[0];
			var replacement = "";
			switch (thisMatch.charAt(1)) {
				case "&":
					// Replace a string variable
					if (thisMatch.match(/(?<=\[\&).*?(?=[\(])/g) != null) {
						// String variable with substring information
						var vName = thisMatch.match(/(?<=\[\&).*?(?=[\(])/g)[0];
						if (stringVariables[vName] != null) {
							try {
								var TestMatch = thisMatch.match(/(?<=\().*?(?=[)]])/g)[0].toString();
								var substringInfo = TestMatch.split(/(?<!\\),/);
								for (let x = 0; x < substringInfo.length; x++) {
									substringInfo[x] = substringInfo[x].replace("\\", "")
								}
								if (isNaN(substringInfo[0])) {
									switch (substringInfo[0].toLowerCase()) {
										case "length": replacement = stringVariables[vName].length; break;

										case "tolowercase":
										case "lower":
										case "tolower":
										case "lowercase": replacement = stringVariables[vName].toLowerCase(); break;

										case "reverse":
											replacement = stringVariables[vName].split("").reverse().join("");
											break;

										case "touppercase":
										case "upper":
										case "toupper":
										case "uppercase": replacement = stringVariables[vName].toUpperCase(); break;

										case "totitlecase":
										case "titlecase":
										case "title":
											replacement = stringVariables[vName].toLowerCase()
												.split(' ')
												.map(function (word) {
													return (word.charAt(0).toUpperCase() + word.slice(1));
												})
												.join(" ")
											break;

										case "contains":
										case "includes":
										case "icontains":
										case "iincludes":
											if (substringInfo.length == 2) {
												var c1 = stringVariables[vName]; var c2 = substringInfo[1]
												if (substringInfo[0].toLowerCase().startsWith("i")) { c1 = c1.toLowerCase(); c2 = c2.toLowerCase(); }
												if (c1.includes(c2)) {
													replacement = "1"
												} else {
													replacement = "0"
												}
											} else {
												replacement = "Contains Argument Error"
												log("ScriptCards Error : String contains evalulation incorrect arguments")
											}
											break;

										case "word":
											if (substringInfo.length == 2) {
												var words = stringVariables[vName].split(/[\s]/);
												if (parseInt(substringInfo[1]) > 0) {
													replacement = words[parseInt(substringInfo[1]) - 1] || "";
												} else {
													if (parseInt(substringInfo[1]) == 0) {
														replacement = stringVariables[vName];
													} else {
														replacement = words[words.length + parseInt(substringInfo[1])] || "";
													}
												}
											} else {
												replacement = "Word Argument Error"
												log("ScriptCards Error : String contains evalulation incorrect arguments")
											}
											break;

										case "indexof":
										case "iindexof":
											if (substringInfo.length == 2) {
												var c1 = stringVariables[vName]; var c2 = substringInfo[1]
												if (substringInfo[0].toLowerCase().startsWith("i")) { c1 = c1.toLowerCase(); c2 = c2.toLowerCase(); }
												replacement = c1.indexOf(c2);
											} else {
												replacement = "Indexof Argument Error"
												log("ScriptCards Error : String contains evalulation incorrect arguments")
											}
											break;

										case "lastindexof":
										case "ilastindexof":
											if (substringInfo.length == 2) {
												var c1 = stringVariables[vName]; var c2 = substringInfo[1]
												if (substringInfo[0].toLowerCase().startsWith("i")) { c1 = c1.toLowerCase(); c2 = c2.toLowerCase(); }
												replacement = c1.lastIndexOf(c2);
											} else {
												replacement = "Indexof Argument Error"
												log("ScriptCards Error : String contains evalulation incorrect arguments")
											}
											break;

										case "replace":
											if (substringInfo.length == 3) {
												replacement = stringVariables[vName].replace(substringInfo[1], substringInfo[2]);
											} else {
												replacement = "";
											}
											break;

										case "replaceall":
											if (substringInfo.length == 3) {
												try {
													if (substringInfo[2].indexOf(substringInfo[1]) == -1) {
														var str = stringVariables[vName];
														while (str.includes(substringInfo[1])) { str = str.replace(substringInfo[1], substringInfo[2]) }
														replacement = str;
													} else {
														log(`ScriptCards Error : Replace all string cannot contain the search string: ${substringInfo[0]}, ${substringInfo[1]}, ${substringInfo[2]}`);
														replacement = stringVariables[vName];
													}
												} catch (e) {
													log(e);
												}
											} else {
												replacement = "";
											}
											break;

										case "before":
											if (substringInfo.length == 2) {
												if (stringVariables[vName].includes(substringInfo[1])) {
													replacement = stringVariables[vName].substring(0, stringVariables[vName].indexOf(substringInfo[1]))
												} else {
													replacement = stringVariables[vName]
												}
											} else {
												log(`ScriptCards Error : Before string reference doesn't contains a search parameter`);
												replacement = stringVariables[vName];
											}
											break;

										case "after":
											if (substringInfo.length == 2) {
												if (stringVariables[vName].includes(substringInfo[1])) {
													replacement = stringVariables[vName].substring(stringVariables[vName].indexOf(substringInfo[1]) + substringInfo[1].length)
												} else {
													replacement = stringVariables[vName]
												}
											} else {
												log(`ScriptCards Error : After string reference doesn't contains a search parameter`);
												replacement = stringVariables[vName];
											}
											break;

										case "split":
											if (substringInfo.length == 3)
												replacement = stringVariables[vName].split(substringInfo[1])[substringInfo[2]]
											else
												replacment = stringVariables[vName]
											break;

										case "numbersonly":
											replacement = stringVariables[vName].replace(/[^0-9]/g, "");
											break;

										case "nonumbers":
											replacement = stringVariables[vName].replace(/[0-9]/g, "");
											break;

										case "numericonly":
											replacement = stringVariables[vName].replace(/[^\-\.\d]/g, "");
											break;
										case "alphaonly":
											replacement = stringVariables[vName].replace(/[^a-zA-Z]/g, "");
											break;

										case "isnumeric":
											replacement = /^\d+$/.test(stringVariables[vName]) ? "1" : "0";
											break;

									}
								} else {
									if (substringInfo.length == 1) {
										if (parseInt(substringInfo[0]) >= 0) {
											replacement = stringVariables[vName].substring(parseInt(substringInfo[0]));
										} else {
											replacement = stringVariables[vName].substring(stringVariables[vName].length + parseInt(substringInfo[0]));
										}
									} else {
										if (parseInt(substringInfo[0]) >= 0) {
											var first = parseInt(substringInfo[0]);
											var last = first + parseInt(substringInfo[1]);
											if (parseInt(substringInfo[1]) < 0) {
												last = stringVariables[vName].length - Math.abs(parseInt(substringInfo[1]));
											}
											replacement = stringVariables[vName].substring(first, last);
										} else {
											var first = stringVariables[vName].length + parseInt(substringInfo[0]);
											var last = first + parseInt(substringInfo[1]);
											replacement = stringVariables[vName].substring(first, last);
										}
									}
								}
							} catch (e) {
								log(e)
								replacement = "Substring reference error."
							}
						} else {
							if (vName.startsWith("zwnj;")) {
								replacement = "[" + vName.replace(/zwnj;/g, "") + "]"
							} else {
								replacement = ""
							}
						}
					} else {
						var vName = thisMatch.substring(2, thisMatch.length - 1);
						if (stringVariables[vName] != null) {
							replacement = stringVariables[vName];
						} else {
							if (vName.startsWith("zwnj;")) {
								replacement = "[" + vName.replace(/zwnj;/g, "") + "]"
							} else {
								replacement = "";
							}
						}
						if (cardParameters.debug !== "0") {
							log(`ContentIn: ${content} Match: ${thisMatch}, vName: ${vName}, replacement ${replacement}`)
						}
					}
					break;

				case "^":
					// Data Grid References
					let ref = thisMatch.substring(2, thisMatch.length - 1).split(";");
					if (ref.length == 3) {
						let gridName = ref[0];
						let rowReference = ref[1];
						let colName = ref[2];
						let rowIndex = rowReference;

						// If the row reference contains "=", treat it as a Column=Value lookup
						if (rowReference.indexOf("=") > -1) {
							let equalsPos = rowReference.indexOf("=");
							let searchColumn = rowReference.substring(0, equalsPos).trim();
							let searchValue = rowReference.substring(equalsPos + 1).trim();

							rowIndex = undefined;

							if (dataGrids[gridName]) {
								for (let rowNum in dataGrids[gridName]) {
									if (
										dataGrids[gridName].hasOwnProperty(rowNum) &&
										dataGrids[gridName][rowNum][searchColumn] !== undefined &&
										dataGrids[gridName][rowNum][searchColumn] === searchValue
									) {
										rowIndex = rowNum;
										break;
									}
								}
							}

							//log(`Data Grid Search: ${gridName}, ${searchColumn}=${searchValue}, Found Row: ${rowIndex}`);
						}

						//log(`Data Grid Reference: ${gridName}, Row: ${rowIndex}, Column: ${colName}`);

						if (
							rowIndex !== undefined &&
							dataGrids[gridName] &&
							dataGrids[gridName][rowIndex] &&
							dataGrids[gridName][rowIndex][colName] !== undefined
						) {
							replacement = dataGrids[gridName][rowIndex][colName];
						} else {
							replacement = "";
							log(`ScriptCards Error: Data grid reference ${thisMatch} is invalid or no matching row was found.`);
						}
					}
					break;

				case ":":
					try {
						var hashparams = thisMatch.substring(2, thisMatch.length - 1);
						var hashName = hashparams.split('("')[0];
						var hashKey = hashparams.split('("')[1];

						if (hashName != null && hashKey != null) {
							hashKey = hashKey.substring(0, hashKey.indexOf('")'))
						}

						if (hashName && hashKey) {
							replacement = hashTables[hashName][hashKey]
						} else {
							replacement = "";
						}
					} catch (e) {
						replacement = "";
					}

					break;

				case "$":
					// Replace a roll variable
					try {
						var vName = thisMatch.match(/(?<=\[\$).*?(?=[\.|\]])/g)[0];
						var vSuffix = "Total";
						if (thisMatch.match(/(?<=\.).*?(?=[\.|\]])/g) != null) {
							vSuffix = thisMatch.match(/(?<=\.).*?(?=[\.|\]])/g)[0];
						}
						if (rollVariables[vName] != null) {
							var rawValue = rollVariables[vName]["Total"].toString();
							if (rollVariables[vName].PaddingDigits > rawValue.length) {
								rawValue = rawValue.padStart(rollVariables[vName].PaddingDigits, '0');
							}
							switch (vSuffix.toLocaleLowerCase()) {
								case "raw":
								case "total":
									replacement = rawValue;
									break;

								default:
									replacement = rollVariables[vName][vSuffix];
							}
							if (vSuffix.startsWith("RolledDice") || vSuffix.startsWith("KeptDice") || vSuffix.startsWith("DroppedDice")) {
								if (thisMatch.match(/(?<=\().*?(?=[)]])/g)) {
									var vIndex = thisMatch.match(/(?<=\().*?(?=[)]])/g)[0];
									if (vIndex) {
										vIndex -= 1;
										var suffixName = vSuffix.substring(0, vSuffix.indexOf("("));
										replacement = rollVariables[vName][suffixName][vIndex];
									} else {
										replacement = "0";
									}
								}
							}
						}
						debugOutput(`RollHilighting: ${rollHilighting}, Suffix: ${vSuffix}`);
						if (rollHilighting == true && vSuffix == "Total" && rollVariables[vName] != null) {
							replacement = buildTooltip(replacement, "Roll: " + rollVariables[vName].RollText.replace("<", "L").replace(">", "G") + "<br /><br />Result: " + rollVariables[vName].Text, rollVariables[vName].Style);
						}
						if (cardParameters.debug !== "0") {
							log(`ContentIn: ${content} Match: ${thisMatch}, vName: ${vName}, vSuffix: ${vSuffix}, replacement ${replacement}`)
						}
					} catch (e) {
						replacement = "";
					}
					break;

				case "~":
					// Replace a settings reference
					var vName = thisMatch.substring(2, thisMatch.length - 1);
					replacement = cardParameters[vName.toLowerCase()] || "";
					break;

				case "=":
					var vName = "ScriptCardsInternalDummyRollVariable";
					var rollFormula = thisMatch.substring(2, thisMatch.length - 1);
					if (thisMatch.indexOf(":") > 0 && thisMatch.indexOf(":") < thisMatch.indexOf("]")) {
						vName = thisMatch.substring(2, thisMatch.indexOf(":"));
						rollFormula = thisMatch.substring(thisMatch.indexOf(":") + 1, thisMatch.length - 1);
					}
					rollVariables[vName] = await parseDiceRoll(rollFormula, cardParameters);
					replacement = rollVariables[vName]["Total"]
					break;

				case "@":
					// Replace Array References
					if (thisMatch.match(/(?<=\[\$|\@).*?(?=[\(])/g)) {
						var vName = thisMatch.match(/(?<=\[\$|\@).*?(?=[\(])/g)[0];
						var vIndex = 0;
						var TestMatch = thisMatch.match(/(?<=\().*?(?=[)]])/g)[0].toString();
						if (TestMatch == "" || TestMatch.toLowerCase() == "length") {
							if (arrayVariables[vName] != null) {
								replacement = arrayVariables[vName].length.toString();
							} else {
								replacement = "undefined array";
							}
						}
						if (TestMatch.toLowerCase() == "lastindex" || TestMatch.toLowerCase() == "maxindex") {
							if (arrayVariables[vName] != null) {
								replacement = (arrayVariables[vName].length - 1).toString();
							} else {
								replacement = "undefined array";
							}
						}
						if (thisMatch.match(/(?<=\().*?(?=[)]])/g) != null) {
							vIndex = parseInt(thisMatch.match(/(?<=\().*?(?=[)]])/g)[0]);
							if (arrayVariables[vName] != null) {
								if (arrayVariables[vName] && arrayVariables[vName].length > vIndex) {
									replacement = arrayVariables[vName][vIndex];
								}
							} else {
								replacement = "undefined array";
							}
						}
						if (cardParameters.debug !== "0") {
							log(`ContentIn: ${content} Match: ${thisMatch}, vName: ${vName}, vIndex: ${vIndex}, replacement ${replacement}`)
						}
					} else {
						log(`Array reference error : ${thisMatch}`)
					}
					break;

				case "%":
					// Replace gosub parameter references
					if (thisMatch.match(/(?:\[\%)(.*?)(?:\%\])/g) !== null) {
						var vName = thisMatch.match(/(?:\[\%)(.*?)(?:\%\])/g)[0];
						if (vName !== null) {
							vName = vName.substring(2, vName.length - 2);
							if (callParamList[vName] != null) {
								replacement = callParamList[vName];
							}
						}
					}
					break;

				case "?":
					// Replace inline conditional references
					try {
						let Pieces = (thisMatch.substring(2, thisMatch.length - 1)).split(cardParameters.inlineconditionseparator)
						if (await processFullConditional(Pieces[0])) {
							replacement = Pieces[1]
						} else {
							replacement = Pieces[2]
						}
					} catch (e) {
						replacement = "";
					}
					break;

				case "*":
					// Replace ability references
					var activeCharacter = ""
					if (thisMatch.charAt(2).toLowerCase() == "s") {
						if (cardParameters.sourcetoken != null || cardParameters.sourcecharacter != null) {
							activeCharacter = cardParameters.sourcetoken || cardParameters.sourcecharacter;
						}
					}
					if (thisMatch.charAt(2).toLowerCase() == "t") {
						if (cardParameters.targettoken != null || cardParameters.targetcharacter != null) {
							activeCharacter = cardParameters.targettoken || cardParameters.targetcharacter;
						}
					}
					if (thisMatch.charAt(2) == "-") {
						activeCharacter = thisMatch.substring(2, thisMatch.indexOf(":"));
					}
					if (activeCharacter !== "") {
						var workString = thisMatch;

						if (cardParameters.enableattributesubstitution !== "0") { workString = await resolveAttributeSubstitution(activeCharacter, thisMatch, cardParameters); }
						var token;
						var attribute = "";
						var defaultValue = null;
						var useDefaultValue = false;
						var hasSubFields = false;
						var subfields = undefined;
						var opType = "current";
						var returnID = false;

						var attrName = workString.substring(workString.indexOf(":") + 1, workString.length - 1);

						if (attrName.indexOf(":::") >= 0) {
							defaultValue = attrName.substring(attrName.indexOf(":::") + 3, attrName.length);
							attrName = attrName.substring(0, attrName.indexOf(":::"))
							useDefaultValue = true;
						}
						var character = getObj("character", activeCharacter);
						if (character === undefined) {
							token = getObj("graphic", activeCharacter);
							if (token != null) {
								character = getObj("character", token.get("represents"));
							}
						}
						if (character != null) {
							if (attrName.endsWith("^")) {
								attrName = attrName.substring(0, attrName.length - 1);
								opType = "max";
							}
							if (attrName.endsWith("*")) {
								attrName = attrName.substring(0, attrName.length - 1);
								returnID = "true";
							}
						}
						if (attrName.indexOf("->") >= 0) {
							subfields = attrName.split("->");
							hasSubFields = true;
							attrName = subfields[0];
						}
						if (token != null && attrName.toLowerCase().startsWith("t-")) {
							if (attrName.toLowerCase() == "t-bio" || attrName.toLowerCase() == "t-notes") {
								attribute = await getBioField(token, attrName.substring(2));
							} else {
								const tokenValue = token.get(attrName.substring(2));
								if (tokenValue !== undefined && tokenValue !== null) {
									attribute = tokenValue.toString();
								}
							}
						}

						if (character != null && !attrName.toLowerCase().startsWith("t-")) {
							if (bioFields[attrName.toLowerCase()] == 1 && !hasSubFields) {
								attribute = await getBioField(character, attrName);
							} else {
								const characterLookupName = hasSubFields ? subfields.join("->") : attrName;
								const lookupRequest = opType === "max" ? `${characterLookupName}^` : characterLookupName;
								const characterLookup = await getPageTokenCharacterAttributeValue(
									character,
									lookupRequest,
									String(cardParameters.beaconsheet) === "1",
									cardParameters.debug === "1"
								);
								if (characterLookup.found) {
									attribute = returnID && characterLookup.attributeId
										? characterLookup.attributeId
										: characterLookup.value;
								} else if (characterLookup.authoritativeMiss) {
									attribute = undefined;
								} else if (returnID) {
									attribute = undefined;
								} else {
									attribute = character.get(attrName);
									if (hasSubFields && attribute !== undefined && attribute !== null) {
										for (var sf = 1; sf < subfields.length; sf++) {
											if (attribute === undefined || attribute === null) {
												break;
											}
											attribute = attribute[subfields[sf]];
										}
									}
								}
							}
						}
						if (character != null
							&& !attrName.toLowerCase().startsWith("t-")
							&& cardParameters.attemptattributeparsing != 0) {
							attribute = await ParseCalculatedAttribute(attribute, character, cardParameters);
						}
						if (token == undefined && character == undefined) {
							// Try finding a Player object
							var player = getObj("player", activeCharacter);
							if (player != null) {
								attribute = player.get(attrName) || "";
							}
						}
						replacement = attribute;
						if (useDefaultValue && (replacement == null || replacement == undefined || replacement == "")) {
							replacement = defaultValue;
						}
						if (character != null) {
							if (cardParameters.enableattributesubstitution !== "0") {
								replacement = await resolveAttributeSubstitution(character.get("_id"), replacement, cardParameters);
							}
						}

					}

					if (thisMatch.charAt(2).toLowerCase() == "g") {
						// Game State Variables
						var objectInfo = StripAndSplit(thisMatch, ":");
						replacement = ""

						if (state[objectInfo[1]] != null) {
							var baseObj = state[objectInfo[1]]
							for (var ai = 2; ai < objectInfo.length; ai++) {
								if (Object.prototype.hasOwnProperty.call(baseObj, objectInfo[ai])) {
									baseObj = baseObj[objectInfo[ai]]
								} else {
									replacement = "StateObjectReferenceError"
								}
							}
						}
						if (replacement !== "StateObjectReferenceError") {
							replacement = baseObj.toString() == "[object Object]" ? JSON.stringify(baseObj) : baseObj.toString();
						}
					}

					if (thisMatch.charAt(2).toLowerCase() == "p") {
						// page attributes
						var attrName = thisMatch.substring(4, thisMatch.length - 1);
						if (cardParameters.activepageobject) {
							replacement = cardParameters.activepageobject.get(attrName) || "";
						} else {
							const thisPage = getObj("page", Campaign().get("playerpageid"));
							if (thisPage) {
								replacement = thisPage.get(attrName) || "";
							}
						}
					}

					if (thisMatch.charAt(2).toLowerCase() == "c") {
						// campaign attributes
						let attrName = thisMatch.substring(4, thisMatch.length - 1);
						if (attrName == "playerpage") { attrName = "playerpageid" }
						replacement = Campaign().get(attrName) || "";
						if (replacement == "") {
							switch (attrName.toLowerCase()) {
								case "nodeversion": replacement = Campaign().nodeVersion; break;
								case "sandboxversion": replacement = Campaign().sandboxVersion; break;
							}
						}
					}

					if (thisMatch.charAt(2).toLowerCase() == "o") {
						// object attributes. Format is [*Oobjectid:objecttype:property]
						var objectInfo = thisMatch.replace("[", "").replace("]", "").split(":");
						if (objectInfo.length == 4) {
							var objectID = objectInfo[1];
							var objectType = objectInfo[2];
							var propertyName = objectInfo[3];
							var thisObj = getObj(objectType, objectID);
							if (thisObj != null && !(propertyName == "action")) {
								if ((bioFields[propertyName.toLowerCase()] == 1 && objectType !== "graphic")
									|| propertyName.toLowerCase() == "defaulttoken") {
									replacement = await getBioField(thisObj, propertyName) || "";
								} else {
									replacement = thisObj.get(propertyName) || "";
								}
							} else {
								replacement = "";
							}
							if (thisObj != null && objectType == "player" && propertyName.toLowerCase() == "isgm") {
								replacement = (playerIsGM(thisObj.id)) ? 1 : 0
							}
						} else {
							replacment = ""
						}
					}

					if (thisMatch.charAt(2).toLowerCase() == "r") {
						// Repeating section attributes
						if (String(cardParameters.beaconsheet) === "1") {
							replacement = await resolveBeaconRepeatingReference(thisMatch, cardParameters);
						} else {
							var opType = "";
							var repSectionHandled = false;
							var attrName = thisMatch.substring(4, thisMatch.length - 1);
							if (attrName.toLowerCase() == "$fieldlist$") {
								replacement = "";
								if (repeatingSection) {
									for (var x = 0; x < repeatingSection.length; x++) {
										replacement += repeatingSection[x].split("|")[0] + "|";
									}
								}
								replacement.slice(0, -1)
								repSectionHandled = true
							}
							if (attrName.match(/(\-.*)\:(.*)\:(\d*)\:(.*)/) && !repSectionHandled) {
								replacement = ""
								var values = attrName.match(/(\-.*)\:(.*)\:(\d*)\:(.*)/)
								values.shift();
								repeatingSectionIDs = getRepeatingSectionIDs(values[0], values[1])
								if (values[3].endsWith("^")) { values[3] = values[3].substring(0, values[3].length - 1) + "_max" }
								if (repeatingSectionIDs) {
									if (thisMatch.charAt(3) == ":") {
										let repeatingIndex = Number(values[2]);
										let repeatingCharID = values[0];
										let repeatingSectionName = values[1];
										fillCharAttrs(findObjs({ _type: 'attribute', _characterid: repeatingCharID }));
										repeatingSection = getSectionAttrsByID(repeatingCharID, repeatingSectionName, repeatingSectionIDs[repeatingIndex]);
										repeatingIndex = Number(values[2]);
										if (repeatingSectionIDs) {
											for (let i in repeatingSection) {
												if (repeatingSection[i].split("|")[0] == values[3]) {
													replacement = repeatingSection[i].split("|").slice(1, 999).join("|");
												}
											}
										}
									} else {
										replacement = values[1] + "_" + repeatingSectionIDs[Number(values[2])] + "_" + values[3]
									}
								}
								repSectionHandled = true
							}
							if (attrName.match(/(\-.*)\:(.*)\:rowcount/) && !repSectionHandled) {
								replacement = ""
								let values = attrName.match(/(\-.*)\:(.*)\:rowcount/)
								values.shift();
								repeatingSectionIDs = getRepeatingSectionIDs(values[0], values[1])
								replacement = repeatingSectionIDs.length;
								repSectionHandled = true
							}
							if (!repSectionHandled) {
								if (attrName.endsWith("^")) {
									attrName = attrName.substring(0, attrName.length - 1);
									opType = "_max";
								}
								var searchText = attrName + opType + "|";
								if (thisMatch.charAt(3) == ":") {
									if (repeatingSectionIDs) {
										for (var i in repeatingSection) {
											if (repeatingSection[i].startsWith(searchText)) {
												replacement = repeatingSection[i].split("|").slice(1, 999).join("|");
												//charId = repeatingCharID;
											}
										}
									}
								} else {
									replacement = repeatingSectionName + "_" + repeatingSectionIDs[repeatingIndex] + "_" + attrName + opType;
								}
								if (!repeatingSection) { replacement = "NoRepeatingAttributeLoaded" }
								if (repeatingSection && repeatingSection.length <= 1) { replacement = "NoRepeatingAttributeLoaded" }
							}
						}

					}

					break;
			}

			content = content.replace(thisMatch, replacement);

			failCount++;
			if (failCount > failLimit) return content;
		}
		return content;
	}

	function stripEscapmentMarkers(content) {
		return content.replaceAll("${", "").replaceAll("$}", "");
	}

	function getLineTag(line, linenum, logerror) {
		// (?<!\\)\|
		if (!line) {
			if (logerror) {
				log(`ScriptCards Error: Line ${linenum} is undefined or null.`);
			}
			return "/Error - No Line Tag Specified";
		}
		if (line.match(/(?<!\\\\)\|/)) {
			return line.split(/(?<!\\\\)\|/)[0].replaceAll("\\\\|", "|").trim();
		} else {
			if (line.trim() !== "" && logerror) {
				log(`ScriptCards Error: Line ${linenum} is missing a | character. (${line})`);
			}
			return "/Error - No Line Tag Specified";
		}
	}

	function getLineContent(line, preserveEscapedPipes = false) {
		if (!line) {
			return "/Error - No Line Content Specified";
		}
		const divider = line.match(/(?<!\\)\|/) ? line.search(/(?<!\\\\)\|/) : -1;
		if (divider < 0) {
			return "/Error - No Line Content Specified";
		}
		const content = line.substring(divider + 1);
		return (preserveEscapedPipes ? content : content.replaceAll("\\\\|", "|")).trim();
	}

	// Take a "Roll Text" string (ie, "1d20 + 5 [Str] + 3 [Prof]") and execute the rolls.
	async function parseDiceRoll(rollText, cardParameters) {
		if (cardParameters.disablerollprocessing !== "0") { return content; }
		rollText = await replaceVariableContent(rollText, cardParameters, false);
		rollText = removeBRs(rollText);
		rollText = removeTags(rollText);
		rollText = cleanUpRollSpacing(rollText);
		rollText = rollText.trim();
		var rollComponents = rollText.split(" ");
		var rollResult = {
			Total: 0,
			Base: 0,
			Ones: 0,
			Aces: 0,
			Odds: 0,
			Evens: 0,
			RollText: rollText,
			Text: "",
			Style: "",
			tableEntryText: "",
			tableEntryImgURL: "",
			tableEntryValue: "",
			tableEntryWeight: "",
			RolledDice: [],
			KeptDice: [],
			DroppedDice: [],
			RollCount: 0,
			KeptCount: 0,
			DroppedCount: 0,
			PaddingDigits: 0,
			DiceFont: ""
		}
		var hadOne = false;
		var hadAce = false;
		rollResult.Style = cardParameters.stylenormal;
		var currentOperator = "+";

		for (var x = 0; x < rollComponents.length; x++) {
			var text = rollComponents[x];
			//log(text)
			var componentHandled = false;

			if (text.match(/^(\d+[dDuUmM][fF\d]+)([eE])?([kK][lLhH]\d+)?([rR][<\>]\d+)?([rR][oO][<\>]\d+)?(![HhLl])?(![<\>]\d+)?(!)?([Ww][Ss][Xx])?([Ww][Ss])?([Ww][Xx])?([Ww])?([\><]\d+)?(f\<\d+)?(\#)?$/)) {
				var thisRollHandled = handleDiceFormats(text);
				componentHandled = true;

				if (thisRollHandled.wasWild) { hadOne = thisRollHandled.hadOne; hadAce = thisRollHandled.hadAce; }
				if (thisRollHandled.highlightasfailure) { hadOne = true }

				var dieCount = thisRollHandled.rollSet.length;
				rollResult.RollCount += dieCount;
				rollResult.RolledDice.push(...thisRollHandled.rawRollSet);
				rollResult.KeptCount += thisRollHandled.keptRollSet.length;
				rollResult.KeptDice.push(...thisRollHandled.keptRollSet);
				rollResult.DroppedCount += thisRollHandled.droppedRollSet.length;
				rollResult.DroppedDice.push(...thisRollHandled.droppedRollSet);

				for (var i = 0; i < dieCount; i++) {
					if (thisRollHandled.rollSet[i] == 1) {
						rollResult.Ones++;
						if (!thisRollHandled.dontHilight) { hadOne = true; }
					}
					if (thisRollHandled.rollTextSet[i].indexOf("!") > 0 && cardParameters.explodingonesandaces !== "1") {
						rollResult.Aces += 1;
					}
					if (thisRollHandled.rollTextSet[i].indexOf("!") > 0 && cardParameters.explodingonesandaces == "1") {
						// Handle reroll ones counting
						let subrolls = thisRollHandled.rollTextSet[i].split("!");
						for (var x = 1; x < subrolls.length; x++) {
							if (subrolls[x] == "1") {
								rollResult.Ones += 1;
							}
						}
						rollResult.Aces += subrolls.length - 1;
					}
					if (thisRollHandled.rollSet[i] >= thisRollHandled.sides) {
						rollResult.Aces++;
						if (!thisRollHandled.dontHilight) { hadAce = true; }
					}
					if (thisRollHandled.rollSet[i] % 2 == 0) {
						rollResult.Evens++;
					} else {
						rollResult.Odds++;
					}
				}

				switch (currentOperator) {
					case "+": rollResult.Total += thisRollHandled.rollTotal; if (!thisRollHandled.dontBase) { rollResult.Base += thisRollHandled.rollTotal; } break;
					case "-": rollResult.Total -= thisRollHandled.rollTotal; if (!thisRollHandled.dontBase) { rollResult.Base -= thisRollHandled.rollTotal; } break;
					case "*": rollResult.Total *= thisRollHandled.rollTotal; if (!thisRollHandled.dontBase) { rollResult.Base *= thisRollHandled.rollTotal; } break;
					case "/": rollResult.Total /= thisRollHandled.rollTotal; if (!thisRollHandled.dontBase) { rollResult.Base /= thisRollHandled.rollTotal; } break;
					case "%": rollResult.Total %= thisRollHandled.rollTotal; if (!thisRollHandled.dontBase) { rollResult.Base %= thisRollHandled.rollTotal; } break;
					case "\\": rollResult.Total = cardParameters.roundup == "0" ? Math.floor(rollResult.Total / thisRollHandled.rollTotal) : Math.ceil(rollResult.Total / thisRollHandled.rollTotal);
						if (!thisRollHandled.dontBase) { rollResult.Base = cardParameters.roundup == "0" ? Math.floor(rollResult.Base / thisRollHandled.rollTotal) : Math.ceil(rollResult.Base / thisRollHandled.rollTotal); }
						break;
				}

				rollResult.Text += "(" + thisRollHandled.rollText + ") ";
			}

			if (!componentHandled) {
				// A mathmatical function
				if (text.match(/^\{.*\}$/)) {
					componentHandled = true;
					var operation = text.substring(1, text.length - 1);
					var precision = 0;
					var value1 = 0;
					var value2 = 0;
					if (operation.toLowerCase().startsWith("round:")) {
						precision = Math.min(6, parseInt(operation.substring(6)));
						operation = "ROUND:";
					}
					if (operation.toLowerCase().startsWith("pad:")) {
						value1 = parseFloat(operation.substring(4));
						operation = "PAD";
					}
					if (operation.toLowerCase().startsWith("min:")) {
						value1 = parseFloat(operation.substring(4));
						operation = "MIN";
					}
					if (operation.toLowerCase().startsWith("max:")) {
						value1 = parseFloat(operation.substring(4));
						operation = "MAX";
					}
					if (operation.toLowerCase().startsWith("clamp:")) {
						var range = operation.substring(6);
						if (range.indexOf(":") > 0) {
							value1 = parseInt(range.split(":")[0]);
							value2 = parseInt(range.split(":")[1]);
							operation = "CLAMP";
						}
					}
					switch (operation.toLowerCase()) {
						case "abs":
							rollResult.Total = Math.abs(rollResult.Total);
							rollResult.Text += "{ABS}";
							break;

						case "sqrt":
						case "squareroot":
							rollResult.Total = Math.sqrt(rollResult.Total);
							rollResult.Text += "{SQRT}";
							break;

						case "ceil":
							rollResult.Total = Math.ceil(rollResult.Total);
							rollResult.Text += "{CEIL}";
							break;

						case "floor":
							rollResult.Total = Math.floor(rollResult.Total);
							rollResult.Text += "{FLOOR}";
							break;

						case "round":
							rollResult.Total = Math.round(rollResult.Total);
							rollResult.Text += "{ROUND}";
							break;

						case "neg":
						case "negate":
							rollResult.Total = rollResult.Total * -1;
							rollResult.Text += "{NEGATE}";
							break;

						case "sin":
							rollResult.Total = Math.sin(rollResult.Total);
							rollResult.Text += "{SIN}";
							break;

						case "cos":
							rollResult.Total = Math.cos(rollResult.Total);
							rollResult.Text += "{COS}";
							break;

						case "tan":
							rollResult.Total = Math.tan(rollResult.Total);
							rollResult.Text += "{TAN}";
							break;

						case "asin":
							rollResult.Total = Math.asin(rollResult.Total);
							rollResult.Text += "{ASIN}";
							break;

						case "acos":
							rollResult.Total = Math.acos(rollResult.Total);
							rollResult.Text += "{ACOS}";
							break;

						case "atan":
							rollResult.Total = Math.atan(rollResult.Total);
							rollResult.Text += "{ATAN}";
							break;

						case "square":
							rollResult.Total = rollResult.Total * rollResult.Total;
							rollResult.Text += "{SQUARE}";
							break;

						case "cube":
						case "cubed":
							rollResult.Total = rollResult.Total * rollResult.Total * rollResult.Total;
							rollResult.Text += "{CUBE}";
							break;

						case "cbrt":
						case "cuberoot":
							rollResult.Total = Math.cbrt(rollResult.Total);
							rollResult.Text += "{CUBEROOT}";
							break;

						case "round:":
							rollResult.Total = rollResult.Total.toFixed(precision);
							break;

						case "pad":
							rollResult.PaddingDigits = value1;
							break;

						case "min":
							if (rollResult.Total < value1) {
								rollResult.Total = value1
							}
							rollResult.Text += `{MIN:${value1}}`;
							break;

						case "max":
							if (rollResult.Total > value1) {
								rollResult.Total = value1
							}
							rollResult.Text += `{MAX:${value1}}`;
							break;

						case "clamp":
							if (rollResult.Total < value1) {
								rollResult.Total = value1
							}
							if (rollResult.Total > value2) {
								rollResult.Total = value2
							}
							rollResult.Text += `{CLAMP:${value1}:${value2}}`;
							break;
					}
				}
			}

			// An operator
			if (!componentHandled) {
				if (text.match(/^[\+\-\*\/\\\%]$/)) {// && !text.match(/^-\d*$/)) {
					componentHandled = true;
					currentOperator = text;
					componentHandled = true;
					//rollResult.Text += `${currentOperator} `;
					rollResult.Text += currentOperator == "*" ? "x " : currentOperator + " ";
				}
			}

			// A bare number within parens (just strip them)
			if (!componentHandled) {
				if (text.match(/^\([+-]?(\d*\.)?\d*#*\)$/)) {
					text = text.substring(1, text.length - 1)
				}
				if (text.match(/^[+-]?(\d*\.)?\d*#$/)) {
					text = text.substring(0, text.length - 1)
				}
				// Just a number
				if (text.match(/^[+-]?(\d*\.)?\d*$/)) {
					componentHandled = true;
					rollResult.Text += `${text} `;

					if (!isNaN(text)) {
						switch (currentOperator) {
							case "+": rollResult.Total += Number(text.replace("#", "")); break;
							case "-": rollResult.Total -= Number(text.replace("#", "")); break;
							case "*": rollResult.Total *= Number(text.replace("#", "")); break;
							case "/": rollResult.Total /= Number(text.replace("#", "")); break;
							case "%": rollResult.Total %= Number(text.replace("#", "")); break;
							case "\\": rollResult.Total = cardParameters.roundup == "0" ? Math.floor(rollResult.Total / Number(text.replace("#", ""))) : Math.ceil(rollResult.Total / Number(text.replace("#", ""))); break;
						}
					}
				}
			}

			// A card variable
			if (!componentHandled) {
				if (text.match(/^\[\$.+\]$/)) {
					componentHandled = true;
					var thisKey = text.substring(2, text.length - 1);
					//var thisValue = Number(inlineReplaceRollVariables(thisKey, cardParameters), cardParameters);
					var thisValue = Number(await replaceVariableContent(thisKey, cardParameters, false));

					if (rollVariables[thisKey]) {
						rollResult.Text += `(${rollVariables[thisKey].Text}) `;
					} else {
						rollResult.Text += `${thisValue} `;
					}

					switch (currentOperator) {
						case "+": rollResult.Total += thisValue; break;
						case "-": rollResult.Total -= thisValue; break;
						case "*": rollResult.Total *= thisValue; break;
						case "/": rollResult.Total /= thisValue; break;
						case "%": rollResult.Total %= thisValue; break;
						case "\\": rollResult.Total = cardParameters.roundup == "0" ? Math.floor(rollResult.Total / thisValue) : Math.ceil(rollResult.Total / thisValue); break;
					}
				}
			}

			// A Rollable Table Result
			if (!componentHandled) {
				if (text.match(/\[[Tt]\#.+?\]/g)) {
					componentHandled = true;
					var rollTableName = text.substring(3, text.length - 1);
					var tableResult = rollOnRollableTable(rollTableName);
					if (tableResult) {
						rollResult.tableEntryText = tableResult[0];
						rollResult.tableEntryImgURL = tableResult[1];
						rollResult.Total = tableResult[2];
						rollResult.Base = tableResult[2];
						rollResult.RollText = `[T#${rollTableName}]`;
						rollResult.Text = tableResult[0];
						rollResult.tableEntryValue = isNaN(rollResult.tableEntryText) ? 0 : parseInt(rollResult.tableEntryText);
						rollResult.tableEntryWeight = tableResult[3];
					}
				}

				if (text.match(/\\[[Tt]\@.+?\]/g)) {
					componentHandled = true;
					var rollArrayName = text.substring(3, text.length - 1);
					var arrayResult = rollFromArray(rollArrayName);
					if (arrayResult) {
						rollResult.tableEntryText = arrayResult[0];
						rollResult.tableEntryImgURL = "";
						rollResult.Total = arrayResult[2];
						rollResult.Base = arrayResult[2];
						rollResult.RollText = `[T@${rollArrayName}]`;
						rollResult.Text = arrayResult[0];
						rollResult.tableEntryValue = isNaN(rollResult.tableEntryText) ? 0 : parseInt(rollResult.tableEntryText);
						rollResult.tableEntryWeight = arrayResult[3];
					}
				}
			}

			// Flavor Text
			if (!componentHandled) {
				if (text.match(/^\[.+\]$/)) {
					//log(`Flavor Text: ${text}`)
					componentHandled = true;
					if ((text.charAt(1) !== "$") && (text.charAt(1) !== "=")) {
						if (text.charAt(1) == "t" || text.charAt(1) == "T") {
							if (text.charAt(2) !== "#") {
								rollResult.Text += ` [&zwnj;${text.substring(1)} `;
							}
						}
						rollResult.Text += ` ${text} `;
					}
				}
			}

			// Plain Text
			if (!componentHandled) {
				if (text.match(/\b[A-Za-z]+\b$/) && cardParameters.allowplaintextinrolls !== 0) {
					componentHandled = true;
					rollResult.Text += ` ${text} `;
				}
			}

			if (!componentHandled) {
				componentHandled = true;
				rollResult.Text += `${text} `;
			}
		}

		if (hadOne && hadAce) { rollResult.Style = cardParameters.styleboth; }
		if (hadOne && !hadAce) { rollResult.Style = cardParameters.stylefumble; }
		if (!hadOne && hadAce) { rollResult.Style = cardParameters.stylecrit; }
		if (cardParameters.nominmaxhighlight !== "0") { rollResult.Style = cardParameters.stylenormal; }
		if (cardParameters.norollhighlight !== "0") { rollResult.Style = cardParameters.stylenone; }

		rollResult.Style = replaceStyleInformation(rollResult.Style, cardParameters);

		rollResult.Text = rollResult.Text.replace(/\+ \+/g, " + ");
		rollResult.Text = rollResult.Text.replace(/\- \-/g, " - ");

		return rollResult;
	}

	function cleanUpRollSpacing(input) {
		input = input.replace(/\+/g, " + ");
		//input = input.replace(/\-(?![^[]*?])/g, " - ");
		input = input.replace(/(?<![:])\-(?![^[]*?])/g, " - ");
		input = input.replace(/\*/g, " * ");
		input = input.replace(/\//g, " / ");
		input = input.replace(/\\/g, " \\ ")
		input = input.replace(/\%/g, " % ");
		input = input.replace(/\[/g, " [&zwnj;");
		input = input.replace(/\[\&zwnj;T\#/g, " [T#");
		input = input.replace(/\]/g, "] ");
		input = input.replace(/\s+/g, " ");
		input = input.replace(/\* \- /g, "* -");
		input = input.replace(/\- \- /g, "- -");
		input = input.replace(/\/ \- /g, "/ -");
		input = input.replace(/\\ \- /g, "\ -");
		input = input.replace(/\% \- /g, "% -");
		return input;
	}

	function buildRowOutput(tag, content, tagprefix, contentprefix) {
		return htmlRowTemplate.replace("=X=ROWDATA=X=", `<strong>${tagprefix}${tag}</strong>${contentprefix}${content}`);
	}

	function buildRawRowOutput(tag, content, tagprefix, contentprefix) {
		return `<div><strong>${tagprefix}${tag}</strong>${contentprefix}${content}</div>`;
	}

	function buildTooltip(text, tip, style) {
		var tooltipStyle = ` font-family: ${defaultParameters.titlefont}; font-size: ${defaultParameters.titlefontsize}; font-weight: normal; font-style: normal; ${style} `;
		return `<span style='${tooltipStyle}' class='showtip tipsy' title='${tip.toString().replace(/\~/g, "")}'>${text}</span>`;
	}

	async function processFullConditional(conditional, cardParameters) {
		// Remove multiple spaces
		var trimmed = conditional.replace(/\s+/g, ' ').trim();
		var parts = trimmed.match(/(?:[^\s"]+|"[^"]*")+/g);
		if (!parts) { return false; }
		/*
		var alljoinersAnd = true;
		var alljoinersOr = true;
		// Currently disabled... beginnings of short-circuit evaluation
		for (var x = 0; x < parts.length; x++) {
			if (parts[x].toLowerCase() !== "-and" || parts[x].toLowerCase() !== "-or") {
				if (parts[x].toLowerCase() == "-and") { alljoinersOr = false; }
				if (parts[x].toLowerCase() == "-or") { alljoinersAnd = false; }
			}
		}
		//log(`AllJoinersAnd: ${alljoinersAnd} AllJoinersOr: ${alljoinersOr}`)
		*/
		var currentJoiner = "none";
		var overallResult = true;
		if (parts.length < 3) { return false; }
		while (parts.length >= 3) {
			var thisCondition = `${parts[0]} ${parts[1]} ${parts[2]}`;
			var thisResult = await evaluateConditional(thisCondition, cardParameters);
			parts.shift();
			parts.shift();
			parts.shift();
			switch (currentJoiner) {
				case "none": overallResult = thisResult; break;
				case "-and": overallResult = overallResult && thisResult; break;
				case "-or": overallResult = overallResult || thisResult; break;
			}
			/*
			if (alljoinersAnd && !overallResult) { log(`False, exiting`); x = parts.length + 1; }
			if (alljoinersOr && overallResult) { log(`True, exiting`); x = parts.length + 1; }
			*/
			if (parts.length > 0) {
				if ((parts[0].toLowerCase() == "-or") || (parts[0].toLowerCase() == "-and")) {
					currentJoiner = parts[0].toLowerCase();
				} else {
					log(`ScriptCards conditional error: Condition contains an invalid clause joiner on line. Only -and and -or are supported. Assume results are incorrect. ${conditional} - ${thisContent}`);
				}
				parts.shift();
			}
		}
		return overallResult;
	}

	async function evaluateConditional(conditional, cardParameters) {
		// /(?<![\\\\])\|/
		var components = conditional.match(/(?:[^\s"]+|"[^"]*")+/g);
		if (!components) { return false; }
		if (components.length !== 3) {
			return false;
		}
		var left = await replaceVariableContent(components[0], cardParameters)
		left = left.replace(/\"/g, "", cardParameters, false);
		var right = await replaceVariableContent(components[2])
		right = right.replace(/\"/g, "", cardParameters, false);
		if (!isNaN(left) && left !== "") { left = parseFloat(left); }
		if (!isNaN(right) && right !== "") { right = parseFloat(right); }
		switch (components[1]) {
			case "-gt": if (left > right) return true; break;
			case "-ge": if (left >= right) return true; break;
			case "-lt": if (left < right) return true; break;
			case "-le": if (left <= right) return true; break;
			case "-eq": if (left == right) return true; break;
			case "-eqi": if (left.toString().toLowerCase() == right.toString().toLowerCase()) return true; break;
			case "-ne": if (left !== right) return true; break;
			case "-nei": if (left.toString().toLowerCase() !== right.toString().toLowerCase()) return true; break;
			case "-inc": if (left.toString().toLowerCase().indexOf(right.toString().toLowerCase()) >= 0) return true; break;
			case "-ninc": if (left.toString().toLowerCase().indexOf(right.toString().toLowerCase()) < 0) return true; break;
			case "-csinc": if (left.toString().indexOf(right.toString()) >= 0) return true; break;
			case "-csninc": if (left.toString().indexOf(right.toString()) < 0) return true; break;
			case "-match": { let r = new RegExp(right, "g"); if (r.test(left)) return true; } break;
			case "-imatch": { let r = new RegExp(right, "gi"); if (r.test(left)) return true; } break;
		}
		return false;
	}

	function replaceStyleInformation(outputLine, cardParmeters) {
		var styleList = [
			"tableborder", "tablebgcolor", "tableborderradius", "tableshadow", "titlecardbackground", "titlecardbottomborder",
			"titlefontsize", "titlefontlineheight", "titlefontcolor", "bodyfontsize", "subtitlefontsize", "subtitlefontcolor", "titlefontshadow",
			"titlefontface", "bodyfontface", "subtitlefontface", "buttonbackground", "buttonpadding", "buttonbackgroundimage", "buttontextcolor", "buttonbordercolor",
			"dicefontcolor", "dicefontsize", "lineheight", "buttonfontsize", "buttonfontface", "titlecardbackgroundimage", "bodybackgroundimage",
			"rollhilightlineheight", "rollhilightcolornormal", "rollhilightcolorfumble", "rollhilightcolorcrit", "rollhilightcolorboth",
			"titletextalign", "titlefontweight", "titlefontstyle",
		];

		for (var x = 0; x < styleList.length; x++) {
			outputLine = outputLine.replace(new RegExp("!{" + styleList[x] + "}", "g"), cardParmeters[styleList[x]].replace(/\"/g, "'"));
		}
		return outputLine;
	}

	function processInlineFormatting(outputLine, cardParameters, raw) {
		if (cardParameters.disableinlineformatting !== "0") { return outputLine; }
		outputLine = outputLine.replace(/\[\#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})\](.*?)\[\/[\#]\]/g, "<span style='color: #$1;'>$2</span>"); // [#xxx] or [#xxxx]...[/#] for color codes. xxx is a 3-digit hex code
		outputLine = outputLine.replace(/\[hr(.*?)\]/gi, '<hr style="width:95%; align:center; margin:0px 0px 5px 5px; border-top:2px solid $1;">');
		outputLine = outputLine.replace(/\[br\]/gi, "<br />");
		outputLine = outputLine.replace(/\[tr(.*?)\]/gi, `<tr ${FillTemplateStyle("tablestyle", cardParameters, raw)} $1>`);
		outputLine = outputLine.replace(/\[\/tr\]/gi, "</tr>");
		outputLine = outputLine.replace(/\[td(.*?)\]/gi, `<td ${FillTemplateStyle("tdstyle", cardParameters, raw)} $1>`);
		outputLine = outputLine.replace(/\[\/td\]/gi, "</td>");
		outputLine = outputLine.replace(/\[th(.*?)\]/gi, `<th ${FillTemplateStyle("thstyle", cardParameters, raw)} $1>`);
		outputLine = outputLine.replace(/\[\/th\]/gi, `</th>`);
		outputLine = outputLine.replace(/\[h1(.*?)\]/gi, `<h1 ${FillTemplateStyle("h1style", cardParameters, raw)} $1>`);
		outputLine = outputLine.replace(/\[\/h1\]/gi, `</h1>`);
		outputLine = outputLine.replace(/\[h2(.*?)\]/gi, `<h2 ${FillTemplateStyle("h2style", cardParameters, raw)} $1>`);
		outputLine = outputLine.replace(/\[\/h2\]/gi, `</h2>`);
		outputLine = outputLine.replace(/\[h3(.*?)\]/gi, `<h3 ${FillTemplateStyle("h3style", cardParameters, raw)} $1>`);
		outputLine = outputLine.replace(/\[\/h3\]/gi, `</h3>`);
		outputLine = outputLine.replace(/\[h4(.*?)\]/gi, `<h4 ${FillTemplateStyle("h4style", cardParameters, raw)} $1>`);
		outputLine = outputLine.replace(/\[\/h4\]/gi, `</h4>`);
		outputLine = outputLine.replace(/\[h5(.*?)\]/gi, `<h5 ${FillTemplateStyle("h5style", cardParameters, raw)} $1>`);
		outputLine = outputLine.replace(/\[\/h5\]/gi, `</h5>`);
		outputLine = outputLine.replace(/\[t\s+?(.*?)\]/gi, "<table $1>");
		outputLine = outputLine.replace(/\[t\]/gi, "<table>");
		outputLine = outputLine.replace(/\[\/t\]/gi, "</table>");
		outputLine = outputLine.replace(/\[p\s+?(.+?)\]/gi, "<p $1>");
		outputLine = outputLine.replace(/\[p\]/gi, "<p>");
		outputLine = outputLine.replace(/\[\/p\]/gi, "</p>");
		outputLine = outputLine.replace(/\[[Ff](\d+)\](.*?)\[\/F\]/gi, "<div style='font-size:$1px;'>$2</div>"); // [F8] for font size 8
		outputLine = outputLine.replace(/\[[Ff]\:([a-zA-Z\s]*)\:?(\d+)?\](.*?)\[\/[Ff]\]/gi, "<span style='font-family:$1; font-size:$2px'>$3</span>"); // [F8] for font size 8
		outputLine = outputLine.replace(/\[[Bb]\](.*?)\[\/[Bb]\]/g, "<b>$1</b>"); // [B]...[/B] for bolding
		outputLine = outputLine.replace(/\[[Ii]\](.*?)\[\/[Ii]\]/g, "<i>$1</i>"); // [I]...[/I] for italics
		outputLine = outputLine.replace(/\[[Uu]\](.*?)\[\/[Uu]\]/g, "<u>$1</u>"); // [U]...[/u] for underline
		outputLine = outputLine.replace(/\[[Ss]\](.*?)\[\/[Ss]\]/g, "<s>$1</s>"); // [S]...[/s] for strikethru
		outputLine = outputLine.replace(/\[[Qq]\](.*?)\[\/[Qq]\]/g, "<blockquote style='margin-left:10px';>$1</blockquote>"); // [S]...[/s] for strikethru
		outputLine = outputLine.replace(/\[[Cc]\](.*?)\[\/[Cc]\]/g, "<div style='text-align: center; display:block;'>$1</div>"); // [C]..[/C] for center
		outputLine = outputLine.replace(/\[[Ll]\](.*?)\[\/[Ll]\]/g, "<div style='text-align: left;'>$1</div>"); // [L]..[/L] for left
		outputLine = outputLine.replace(/\[[Rr]\](.*?)\[\/[Rr]\]/g, "<div style='text-align: right; float: right;'>$1</div><div style='clear: both;'></div>"); // [R]..[/R] for right
		outputLine = outputLine.replace(/\[[Jj]\](.*?)\[\/[Jj]\]/g, "<div style='text-align: justify; display:block;'>$1</div>"); // [J]..[/J] for justify

		var fakerolls = outputLine.match(/(\[roll(.*?)\](.*?)\[\/roll\])/gi)
		for (let fakeroll in fakerolls) {
			var base = fakerolls[fakeroll].replace(/\[roll(.*?)\]/, "").replace(/\[\/roll(.*?)\]/, "")
			let style = cardParameters.stylenormal
			if (fakerolls[fakeroll].substring(5, 7).toLowerCase() == ":c") {
				style = cardParameters.stylecrit
			}
			if (fakerolls[fakeroll].substring(5, 7).toLowerCase() == ":f") {
				style = cardParameters.stylefumble
			}
			var work = buildTooltip(base, "Roll: " + base + "<br /><br />Result: " + base, style)
			outputLine = outputLine.replace(fakerolls[fakeroll], work)
		}

		var images = outputLine.match(/(\[img(.*?)\](.*?)\[\/img\])/gi);
		for (var image in images) {
			var work = images[image].replace("[img", "<img").replace("[/img]", "></img>").replace("]", " src=");
			outputLine = outputLine.replace(images[image], work);
		}
		var webms = outputLine.match(/(\[webm(.*?)\](.*?)\[\/webm\])/gi);
		for (var webm in webms) {
			var work = webms[webm].replace("[webm]", "<video autoplay loop width=100% &#115;&#114;&#99;='").replace("[/webm]", "' type=video/webm></video>");
			outputLine = outputLine.replace(webms[webm], work);
		}
		var statusmarkers = outputLine.match(/\[sm(.*?)\](.*?)\[\/sm\]/gi);
		for (var sm in statusmarkers) {
			var markername = statusmarkers[sm].substring(statusmarkers[sm].indexOf("]") + 1);
			markername = markername.substring(0, markername.indexOf("["));
			var work = statusmarkers[sm].replace("[sm", "<img ").replace("[/sm]", "></img>").replace("]", " src=" + tokenMarkerURLs[markername]);
			outputLine = outputLine.replace(statusmarkers[sm], work);
		}
		var buttons = outputLine.match(/\[button(\:\#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}))?(\:\#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}))?(\:([0-9]{1,})PX)?(\:(.*?))?\](.*?)\:\:(.*?)\[\/button\]/gi);
		for (var button in buttons) {
			var customTextColor = undefined;
			var customBackgroundColor = undefined;
			var customfontsize = undefined;
			let customHoverText = undefined;
			var basebutton = buttons[button].replace(/\[button(\:\#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}))?(\:\#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}))?(\:([0-9]{1,})PX)?(\:.+?)?\]/gi, "[button]");
			//log(basebutton);
			if (basebutton.toLowerCase() !== buttons[button].toLowerCase()) {
				var tempbutton = buttons[button].replace("[button:", "").replace("[Button:", "").replace("[BUTTON:", "").split("]")[0];
				var customs = tempbutton.split(":");
				var firstColorUsed = false;
				for (var c in customs) {
					if (customs[c].startsWith("#")) {
						if (firstColorUsed) { customBackgroundColor = customs[c]; } else { customTextColor = customs[c]; firstColorUsed = true; }
					} else {
						if (customs[c].toLowerCase().endsWith("px")) {
							customfontsize = customs[c];
						} else {
							if (customs[c] !== "[rbutton") customHoverText = customs[c];
						}
					}
				}
			}
			var title = basebutton.split("::")[0].replace("[button]", "").replace("[Button]", "").replace("[BUTTON]", "");
			var action = basebutton.split("::")[1].replace("[/button]", "").replace("[/Button]", "").replace("[/BUTTON]", "");
			if (cardParameters.dontcheckbuttonsforapi == "0") {
				action = action.replace(/(^|\ +)_/g, " --");
			}
			if (raw == true) {
				outputLine = outputLine.replace(buttons[button], makeTemplateButton(title, action, cardParameters));
			} else {
				outputLine = outputLine.replace(buttons[button], makeButton(title, action, cardParameters, customTextColor, customBackgroundColor, customfontsize, customHoverText));
			}
		}

		var sheetbuttons = outputLine.match(/\[sheetbutton(\:\#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}))?(\:\#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}))?(\:([0-9]{1,})PX)?(\:(.*?))?\](.*?)\:\:(.*?)\:\:(.*?)\[\/sheetbutton\]/gi);
		for (var button in sheetbuttons) {
			var customTextColor = undefined;
			var customBackgroundColor = undefined;
			var customfontsize = undefined;
			let customHoverText = undefined;
			var basebutton = sheetbuttons[button].replace(/\[sheetbutton(\:\#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}))?(\:\#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}))?(\:([0-9]{1,})PX)?(\:.+?)?\]/gi, "[sheetbutton]");
			if (basebutton.toLowerCase() !== sheetbuttons[button].toLowerCase()) {
				var tempbutton = sheetbuttons[button].replace("[sheetbutton:", "").replace("[Sheetbutton:", "").replace("[SHEETBUTTON:", "").split("]")[0];
				var customs = tempbutton.split(":");
				var firstColorUsed = false;
				for (var c in customs) {
					if (customs[c].startsWith("#")) {
						if (firstColorUsed) { customBackgroundColor = customs[c]; } else { customTextColor = customs[c]; firstColorUsed = true; }
					} else {
						if (customs[c].toLowerCase().endsWith("px")) {
							customfontsize = customs[c];
						} else {
							if (customs[c] !== "[rbutton") customHoverText = customs[c];
						}
					}
				}
			}
			var title = basebutton.split("::")[0].replace("[sheetbutton]", "").replace("[Sheetbutton]", "").replace("[SHEETBUTTON]", "");
			var actor = "";
			var tryID = basebutton.split("::")[1];
			if (getObj("character", tryID)) {
				actor = tryID;
			} else {
				if (getObj("graphic", tryID)) {
					if (getObj("character", getObj("graphic", tryID).get("represents"))) {
						actor = getObj("graphic", tryID).get("represents");
					}
				}
			}
			if (actor == "") {
				// eslint-disable-next-line no-unused-vars
				var possible = findObjs({ type: "character" }).filter(function (value, index, arg) { return value.get("name").toLowerCase().trim() == tryID.toLowerCase().trim() });
				if (possible.length > 0) {
					actor = possible[0].get("_id");
				}
			}
			if (actor !== "") {
				var action = "~" + actor + "|" + basebutton.split("::")[2].replace("[/sheetbutton]", "").replace("[/Sheetbutton]", "").replace("[/SHEETBUTTON]", "");
				if (cardParameters.dontcheckbuttonsforapi == "0") {
					action = action.replace(/(^|\ +)_/g, " --");
				}
				if (raw == true) {
					outputLine = outputLine.replace(sheetbuttons[button], makeTemplateButton(title, action, cardParameters));
				} else {
					outputLine = outputLine.replace(sheetbuttons[button], makeButton(title, action, cardParameters, customTextColor, customBackgroundColor, customfontsize, customHoverText));
				}
			}
		}

		var reentrantbuttons = outputLine.match(/\[rbutton(\:\#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}))?(\:\#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}))?(\:([0-9]{1,})PX)?(\:(.*?))?\](.*?)\:\:(.*?)\[\/rbutton\]/gi);
		for (var button in reentrantbuttons) {
			var customTextColor = undefined;
			var customBackgroundColor = undefined;
			var customfontsize = undefined;
			var customHoverText = undefined;
			var basebutton = reentrantbuttons[button].replace(/\[rbutton(\:\#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}))?(\:\#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}))?(\:([0-9]{1,})PX)?(\:.+?)?\]/gi, "[rbutton]");
			if (basebutton.toLowerCase() !== reentrantbuttons[button].toLowerCase()) {
				var tempbutton = reentrantbuttons[button].replace("[rbutton:", "").replace("[Rbutton:", "").replace("[RBUTTON:", "").split("]")[0];
				var customs = tempbutton.split(":");
				var firstColorUsed = false;
				for (var c in customs) {
					if (customs[c].startsWith("#")) {
						if (firstColorUsed) { customBackgroundColor = customs[c]; } else { customTextColor = customs[c]; firstColorUsed = true; }
					} else {
						if (customs[c].toLowerCase().endsWith("px")) {
							customfontsize = customs[c];
						} else {
							if (customs[c] !== "[rbutton") customHoverText = customs[c];
						}
					}
				}
			}
			var title = basebutton.split("::")[0].replace("[rbutton]", "").replace("[Rbutton]", "").replace("[RBUTTON]", "");
			var reentrylabel = basebutton.split("::")[1].replace("[/rbutton]", "").replace("[/Rbutton]", "").replace("[/RBUTTON]", "");
			var action = "!sc-reentrant " + cardParameters["reentrant"] + "-|-" + reentrylabel
			if (raw == true) {
				outputLine = outputLine.replace(reentrantbuttons[button], makeTemplateButton(title, action, cardParameters));
			} else {
				outputLine = outputLine.replace(reentrantbuttons[button], makeButton(title, action, cardParameters, customTextColor, customBackgroundColor, customfontsize, customHoverText));
			}
		}

		//DiceFont Stuff
		var dicefontchars = diceLetters;
		if (cardParameters.usehollowdice !== "0") { dicefontchars = dicefontchars.toLowerCase(); }
		outputLine = outputLine.replace(/\[d4\](.*?)\[\/d4\]/g, function (x) { var side = parseInt(x.replace("[d4]", "").replace("[/d4]", "").trim()); return "<span style='color: !{dicefontcolor}; font-size:!{dicefontsize}; font-family: dicefontd4;'>" + dicefontchars.charAt(side) + "</span>" });
		outputLine = outputLine.replace(/\[d6\](.*?)\[\/d6\]/g, function (x) { var side = parseInt(x.replace("[d6]", "").replace("[/d6]", "").trim()); return "<span style='color: !{dicefontcolor}; font-size:!{dicefontsize}; font-family: dicefontd6;'>" + dicefontchars.charAt(side) + "</span>" });
		outputLine = outputLine.replace(/\[d8\](.*?)\[\/d8\]/g, function (x) { var side = parseInt(x.replace("[d8]", "").replace("[/d8]", "").trim()); return "<span style='color: !{dicefontcolor}; font-size:!{dicefontsize}; font-family: dicefontd8;'>" + dicefontchars.charAt(side) + "</span>" });
		outputLine = outputLine.replace(/\[d10\](.*?)\[\/d10\]/g, function (x) { var side = parseInt(x.replace("[d10]", "").replace("[/d10]", "").trim()); return "<span style='color: !{dicefontcolor}; font-size:!{dicefontsize}; font-family: dicefontd10;'>" + dicefontchars.charAt(side) + "</span>" });
		outputLine = outputLine.replace(/\[d12\](.*?)\[\/d12\]/g, function (x) { var side = parseInt(x.replace("[d12]", "").replace("[/d12]", "").trim()); return "<span style='color: !{dicefontcolor}; font-size:!{dicefontsize}; font-family: dicefontd12;'>" + dicefontchars.charAt(side) + "</span>" });
		outputLine = outputLine.replace(/\[d20\](.*?)\[\/d20\]/g, function (x) { var side = parseInt(x.replace("[d20]", "").replace("[/d20]", "").trim()); return "<span style='color: !{dicefontcolor}; font-size:!{dicefontsize}; font-family: dicefontd20;'>" + dicefontchars.charAt(side) + "</span>" });

		return outputLine;
	}

	function makeButton(title, url, parameters, customTextColor, customBackgroundColor, customfontsize, customHoverText) {
		var thisButtonStyle = buttonStyle;
		let thisHoverText = "";
		if (customTextColor) { thisButtonStyle = thisButtonStyle.replace("!{buttontextcolor}", customTextColor) }
		if (customBackgroundColor) { thisButtonStyle = thisButtonStyle.replace("!{buttonbackground}", customBackgroundColor) }
		if (customfontsize) { thisButtonStyle = thisButtonStyle.replace("!{buttonfontsize}", customfontsize) }
		if (customHoverText) { thisHoverText = ` title="${customHoverText}" ` }
		if (parameters.buttonwidth !== "auto") { thisButtonStyle = thisButtonStyle.replace("!{buttonwidth}", `${parameters.buttonwidth}`); }
		return `<a style="${replaceStyleInformation(thisButtonStyle, parameters)}" ${thisHoverText}" href="${removeTags(removeBRs(url))}">${removeBRs(title)}</a>`;
	}

	function makeTemplateButton(title, url, parameters) {
		if (parameters.overridetemplate !== "none") {
			return `<a ${templates[parameters.overridetemplate].buttonstyle} href="${removeTags(removeBRs(url))}">${removeBRs(title)}</a>`;
		} else {
			return "Template button without Template"
		}
	}

	function removeInlineRolls(text, cardParameters) {
		if (cardParameters.allowinlinerollsinoutput !== "0") { return text; }
		return text.replace(/\[\[/g, " ").replace(/\]\]/g, " ");
	}

	function fillCharAttrs(attrs) {
		if (!attrs) { return; }
		repeatingCharAttrs = {};
		attrs.forEach(function (x) {
			repeatingCharAttrs[x.get("name")] = x.get("current");
		});
	}

	function getRepeatingSectionIDs(charid, prefix) {
		const repeatingAttrs = {};
		regExp = new RegExp(`^${prefix}_(-[-A-Za-z0-9]+?|\\d+)_`);
		let repOrder;
		// Get attributes
		findObjs({
			_type: 'attribute',
			_characterid: charid
		}).forEach(o => {
			const attrName = o.get('name');
			if (attrName.search(regExp) === 0)
				repeatingAttrs[attrName] = o;
			else if (attrName === `_reporder_${prefix}`)
				repOrder = o.get('current').split(',');
		});
		if (!repOrder)
			repOrder = [];
		// Get list of repeating row ids by prefix from repeatingAttrs
		const unorderedIds = [...new Set(Object.keys(repeatingAttrs)
			.map(n => n.match(regExp))
			.filter(x => !!x)
			.map(a => a[1]))];
		const repRowIds = [...new Set(repOrder.filter(x => unorderedIds.includes(x)).concat(unorderedIds))];
		return repRowIds;
	}

	function getSectionAttrs(charid, entryname, sectionname, searchtext, fuzzy, joiner = "|") {
		var return_set = [];
		var char_attrs = findObjs({ type: "attribute", _characterid: charid });
		try {
			var action_prefix = undefined;
			if (!fuzzy) {
				for (let i = 0; i < char_attrs.length; i++) {
					let attr = char_attrs[i];
					let attrName = attr.get("name");
					let attrCurrent = attr.get("current");
					if (attrName.startsWith(sectionname) && attrName.endsWith(searchtext) && attrCurrent == entryname) {
						action_prefix = attrName.slice(0, -searchtext.length);
						break;
					}
				}
			} else {
				var thisRegex = new RegExp(entryname, "i");
				for (let i = 0; i < char_attrs.length; i++) {
					let attr = char_attrs[i];
					let attrName = attr.get("name");
					let attrCurrent = attr.get("current");
					if (attrName.startsWith(sectionname) && attrName.match(searchtext) && attrCurrent.match(thisRegex)) {
						action_prefix = attrName.slice(0, -searchtext.length);
						break;
					}
				}
			}
			if (!action_prefix) {
				return return_set;
			}
		} catch {
			return return_set;
		}

		try {
			action_attrs = [];
			for (let i = 0; i < char_attrs.length; i++) {
				if (char_attrs[i].get("name").startsWith(action_prefix)) {
					action_attrs.push(char_attrs[i]);
				}
			}
		} catch {
			return return_set;
		}

		for (let i = 0; i < action_attrs.length; i++) {
			let z = action_attrs[i];
			if (z.get("name")) {
				return_set.push(z.get("name").toString().replace(action_prefix, "") + "|" + z.get("current").toString().replace(/(?:\r\n|\r|\n)/g, "<br>").replace("@{", "").replace("}", ""));
				return_set.push(z.get("name").toString().replace(action_prefix, "") + "_max|" + z.get("max").toString());
			}
		}

		var PrefixEntry = "xxxActionIDxxxx" + joiner + action_prefix.replace(sectionname + "_", "");
		PrefixEntry = PrefixEntry.substring(0, PrefixEntry.length - 1);

		return_set.unshift(PrefixEntry);

		return (return_set);
	}

	function getSectionAttrsEx(charid, entryname, sectionname, searchtext, fuzzy, joiner = "|") {
		var return_set = [];
		var char_attrs = findObjs({ type: "attribute", _characterid: charid });

		try {
			if (!fuzzy) {
				var action_prefix = char_attrs
					.filter(function (z) {
						return (z.get("name").startsWith(sectionname) && z.get("name").endsWith(searchtext))
					})
					.filter(entry => entry.get("current") == entryname)[0]
					.get("name").slice(0, -searchtext.length);
			} else {
				var thisRegex = new RegExp(entryname, "i")
				var action_prefix = char_attrs
					.filter(function (z) {
						return (z.get("name").startsWith(sectionname) && z.get("name").match(searchtext))
					})
					.filter(entry => entry.get("current").match(thisRegex))[0]
					.get("name").slice(0, -searchtext.length);
			}
		} catch {
			return return_set;
		}

		try {
			action_attrs = char_attrs.filter(function (z) { return (z.get("name").startsWith(action_prefix)); })
		} catch {
			return return_set;
		}

		action_attrs.forEach(function (z) {
			if (z.get("name")) {
				return_set.push(z.get("name").toString().replace(action_prefix, "") + joiner + z.get("current").toString().replace(/(?:\r\n|\r|\n)/g, "<br>").replace("@{", "").replace("}", ""));
				return_set.push(z.get("name").toString().replace(action_prefix, "") + "_max" + joiner + z.get("max").toString());
			}
		})

		return (return_set);
	}

	function getSectionAttrsByID(charid, sectionname, sectionID, joiner = "|") {
		var return_set = [];
		var action_prefix = sectionname + "_" + sectionID + "_";

		try {
			var action_attrs = findObjs({ type: "attribute", _characterid: charid })
			action_attrs = action_attrs.filter(function (z) { return (z.get("name").startsWith(action_prefix)); })
		} catch {
			return return_set;
		}

		action_attrs.forEach(function (z) {
			try {
				return_set.push(z.get("name").replace(action_prefix, "") + joiner + z.get("current").toString().replace(/(?:\r\n|\r|\n)/g, "<br>"));//.replace(/[\[\]\@]/g, " "));
				return_set.push(z.get("name").replace(action_prefix, "") + "_max" + joiner + z.get("max").toString());
				// eslint-disable-next-line no-empty
			} catch { log(`Attribute lookup error parsing ${z.get("name'")}`) }
		})
		return (return_set);
	}

	function copyRepeatingSectionRow(destCharacter, repeatingSectionName, repeatingSection, delimiter, destRepeatinSection) {
		let newRowID = generateRowID();
		stringVariables["SC_LAST_CREATED_ROWID"] = newRowID;

		for (let x = 0; x < repeatingSection.length; x += 2) {
			try {
				let attrName = repeatingSection[x].split(delimiter)[0].trim();
				let attrValue = repeatingSection[x].split(delimiter)[1].trim();
				let attrMax = repeatingSection[x + 1].split(delimiter)[1].trim();
				let newAttribute = createObj("attribute", {
					name: `${destRepeatinSection}_${newRowID}_${attrName}`,
					_characterid: destCharacter.id,
					current: "",
					max: attrMax
				})
				newAttribute.setWithWorker({ current: attrValue });
			} catch (err) {
				log(`Error processing repeating section row ${x}: ${err}`);
			}
		}
	}

	function rollOnRollableTable(tableName) {
		var theTable = findObjs({ type: "rollabletable", name: tableName })[0];
		if (theTable != null) {
			var tableItems = findObjs({ type: "tableitem", _rollabletableid: theTable.id });
			if (tableItems != null) {
				var rollResults = {};
				var rollIndex = 0;
				var lastRollIndex = 0;
				var itemCount = 0;
				var maxRoll = 0;
				var nonOneWeights = 0;
				tableItems.forEach(function (item) {
					try {
						var thisWeight = parseInt(item.get("weight"));
						if (isNaN(thisWeight)) { thisWeight = 1 }
						if (thisWeight !== 1) { nonOneWeights += 1; }
						rollIndex += thisWeight;
						for (var x = lastRollIndex + 1; x <= rollIndex; x++) {
							rollResults[x] = itemCount;
						}
						itemCount += 1;
						maxRoll += thisWeight;
						lastRollIndex += thisWeight;
					} catch {
						log(`ScriptCards: Exception attempting to get rollable table item information`)
					}
				});
				var tableRollResult = randomInteger(maxRoll);
				try {
					if (nonOneWeights == 0) {
						return [tableItems[rollResults[tableRollResult]].get("name"), tableItems[rollResults[tableRollResult]].get("avatar"), tableRollResult, tableItems[rollResults[tableRollResult]].get("weight")];
					} else {
						return [tableItems[rollResults[tableRollResult]].get("name"), tableItems[rollResults[tableRollResult]].get("avatar"), 0, tableItems[rollResults[tableRollResult]].get("weight")];
					}
				} catch {
					log(`ScriptCards: Exception while reading table results for table item ${tableRollResult}`)
					return "", ""
				}
			} else {
				return ["", ""];
			}
		}
	}

	function rollFromArray(arrayName) {
		if (theTable != arrayVariables[arrayName]) {
			var rolledItem = randomInteger(arrayVariables[arrayName].length);
			return [arrayVariables[arrayName][rolledItem - 1], "", rolledItem, rolledItem];
		} else {
			return ["", ""];
		}
	}

	function loadLibraryHandounts() {
		ScriptCardsLibrary = {};
		var handouts = filterObjs(function (obj) {
			if (obj.get("type") == "handout" && obj.get("name").startsWith("ScriptCards Library")) { return true; } else { return false; }
		});
		if (handouts) {
			handouts.forEach(function (handout) {
				var libraryName = handout.get("name").replace("ScriptCards Library", "").trim();
				//var libraryContent = "";
				handout.get("notes", function (notes) {
					if (notes) {
						notes = notes.replace(/\<p\>/g, " ").replace(/\<\/p\>/g, " ").replace(/\<br\>/g, " ").replace(/&nbsp;/g, " ").replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&");
					}
					ScriptCardsLibrary[libraryName] = notes;
				});
			});
		}
	}

	function insertLibraryContent(cardContent, libraryList) {
		if (!libraryList) { return cardContent; }
		cardContent = cardContent.substring(0, cardContent.length - 2);
		var libs = libraryList.split(";");
		cardContent += " --X| ";
		for (var x = 0; x < libs.length; x++) {
			if (ScriptCardsLibrary[libs[x]]) {
				cardContent += ScriptCardsLibrary[libs[x]];
			}
		}
		cardContent += " }}";
		return cardContent;
	}

	function stashAScript(stashIndex, scriptContent, cardParameters, stringVariables, rollVariables, returnStack, parameterStack, programCounter, outputLines, resultStringName, stashType, arrayVariables, arrayIndexes, gmonlyLines, bareoutputLines) {
		if (scriptCardsStashedScripts[stashIndex]) { delete scriptCardsStashedScripts[stashIndex]; }

		scriptCardsStashedScripts[stashIndex] = {};
		scriptCardsStashedScripts[stashIndex].scriptContent = JSON.stringify(scriptContent);
		scriptCardsStashedScripts[stashIndex].cardParameters = JSON.stringify(cardParameters);
		scriptCardsStashedScripts[stashIndex].stringVariables = JSON.stringify(stringVariables);
		scriptCardsStashedScripts[stashIndex].rollVariables = JSON.stringify(rollVariables);
		scriptCardsStashedScripts[stashIndex].arrayVariables = JSON.stringify(arrayVariables);
		scriptCardsStashedScripts[stashIndex].arrayIndexes = JSON.stringify(arrayIndexes);
		scriptCardsStashedScripts[stashIndex].pointerVariables = JSON.stringify(pointerVariables);
		scriptCardsStashedScripts[stashIndex].hashTables = JSON.stringify(hashTables);
		scriptCardsStashedScripts[stashIndex].returnStack = JSON.stringify(returnStack);
		scriptCardsStashedScripts[stashIndex].parameterStack = JSON.stringify(parameterStack);
		scriptCardsStashedScripts[stashIndex].outputLines = JSON.stringify(outputLines);
		scriptCardsStashedScripts[stashIndex].gmonlyLines = JSON.stringify(gmonlyLines);
		scriptCardsStashedScripts[stashIndex].bareoutputLines = JSON.stringify(bareoutputLines);
		scriptCardsStashedScripts[stashIndex].repeatingSectionIDs = JSON.stringify(repeatingSectionIDs);
		scriptCardsStashedScripts[stashIndex].repeatingSection = JSON.stringify(repeatingSection);
		scriptCardsStashedScripts[stashIndex].repeatingCharAttrs = JSON.stringify(repeatingCharAttrs);
		scriptCardsStashedScripts[stashIndex].repeatingBeaconState = JSON.stringify(repeatingBeaconState);
		scriptCardsStashedScripts[stashIndex].repeatingCharID = repeatingCharID;
		scriptCardsStashedScripts[stashIndex].repeatingSectionName = repeatingSectionName;
		scriptCardsStashedScripts[stashIndex].repeatingIndex = repeatingIndex;
		scriptCardsStashedScripts[stashIndex].programCounter = programCounter;
		scriptCardsStashedScripts[stashIndex].resultStringName = resultStringName;
		scriptCardsStashedScripts[stashIndex].loopControl = loopControl;
		scriptCardsStashedScripts[stashIndex].loopStack = loopStack;
		scriptCardsStashedScripts[stashIndex].stashType = stashType;
	}

	function uuidv4() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
			var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	}

	function isNumeric(n) {
		return !isNaN(parseInt(n));
	}

	function isNumber(n) {
		return !isNaN(Number(n));
	}

	// Despite the name, this function takes a semicolon separated value string and returns an
	// array of objects. Used to parse parameter lists to gosub branches.
	function CSVtoArray(text) {
		var re_valid = /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^;'"\s\\]*(?:\s+[^;'"\s\\]+)*)\s*(?:;\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^;'"\s]*(?:\s+[^;'"\s\\]+)*)\s*)*$/;
		var re_value = /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^;'"\s]*(?:\s+[^;'"\s\\]+)*))\s*(?:;|$)/g;
		// Return NULL if input string is not well formed CSV string.
		if (!re_valid.test(text)) {
			log(`ScriptCards Error: Parameter content is not valid. Do you have unescaped quotes or qoutes not surrounding escaped values? (${text})`)
			return null;
		}

		var a = []; // Initialize array to receive values.
		text.replace(re_value, // "Walk" the string using replace with callback.
			function (m0, m1, m2, m3) {

				// Remove backslash from \' in single quoted values.
				if (m1 != null) a.push(m1.replace(/\\'/g, "'"));

				// Remove backslash from \" in double quoted values.
				else if (m2 != null) a.push(m2.replace(/\\"/g, '"'));
				else if (m3 != null) a.push(m3);
				return ''; // Return empty string.
			});

		// Handle special case of empty last value.
		if (/,\s*$/.test(text)) a.push('');
		return a;
	}

	// ScriptCards doesn't directly support inline rolls, but there are cases where some sheets
	// are so strange that an inline roll is required to retrieve simple values. This routine
	// is run before processing script lines and replaces the inline roll markers with their
	// final values as literal strings.
	function processInlinerolls(msg) {
		if (_.has(msg, 'inlinerolls')) {
			return _.chain(msg.inlinerolls)
				.reduce(function (m, v, k) {
					var ti = _.reduce(v.results.rolls, function (m2, v2) {
						if (_.has(v2, 'table')) {
							m2.push(_.reduce(v2.results, function (m3, v3) {
								m3.push(v3.tableItem.name);
								return m3;
							}, []).join(', '));
						}
						return m2;
					}, []).join(', ');
					m['$[[' + k + ']]'] = (ti.length && ti) || v.results.total || 0;
					return m;
				}, {})
				.reduce(function (m, v, k) {
					return m.replace(k, v);
				}, msg.content)
				.value();
		} else {
			return msg.content;
		}
	}

	function debugOutput(msg) {
		if (debugMode) { log(msg) }
	}

	function isBlank(str) {
		return (!str || /^\s*$/.test(str));
	}

	function removeTags(str) {
		if ((str === null) || (str === ''))
			return false;
		else
			return str.toString().replace(/(<([^>]+)>)/ig, '');
	}

	function removeBRs(str) {
		if ((str === null) || (str === '') || (str === undefined))
			return false;
		else
			return str.toString().replace(/<br \/\>/ig, '').replace(/<br\/\>/ig, '');
	}

	var playJukeboxTrack = function (trackname) {
		var track = findObjs({ type: 'jukeboxtrack', title: trackname })[0];
		if (track) {
			track.set('softstop', false);
			track.set('playing', true);
		} else {
			log(`ScriptCards warning: Jukebox track ${trackname} not found in game.`);
		}
	}

	// eslint-disable-next-line no-unused-vars
	function handleDiceFormats(text, rollResult, hadOne, hadAce, currentOperator) {
		// Split the dice roll into components
		var matches = text.toLowerCase().match(/^(\d+[dDuUmM][fF\d]+)([eE])?([kK][lLhH]\d+)?([rR][<\>]\d+)?([rR][oO][<\>]\d+)?(![HhLl])?(![<\>]\d+)?(!)?([Ww][Ss][Xx])?([Ww][Ss])?([Ww][Xx])?([Ww])?([\><]\d+)?(f\<\d+)?(\#)?$/);

		var resultSet = {
			rollSet: [],
			rollTextSet: [],
			rollText: "",
			rollTotal: 0,
			hadOne: false,
			hadAce: false,
			dontHilight: false,
			highlightasfailure: false,
			dontBase: false,
			sides: 6,
			rawRollSet: [],
			droppedRollSet: [],
			keptRollSet: [],
			diceFontSet: []
		};

		// Just some defaults
		var count = 1;
		var sides = 6;
		var fudgeDice = false;
		var fudgeText = ["-", "0", "+"];
		var keeptype = "a";
		var keepcount = count;
		var rerollThreshold = undefined;
		var rerollType = "x";
		var rerollUnlimited = true;
		var rollUnique = false;
		var explodeValue = 0;
		var isWildDie = false;
		var minRollValue = 1;
		var wildDieDropSelf = false;
		var wildDieDropHighest = false;
		var successThreshold = 0;
		var failureThreshold = 0;

		if (matches) {
			for (var x = 1; x < matches.length; x++) {
				if (matches[x]) {

					// Handle XdY
					if (matches[x].match(/^\d+[dD][fF\d]+$/)) {
						count = matches[x].split("d")[0]
						keepcount = count;
						sides = matches[x].split("d")[1]
						if (sides == "f") { sides = 3; fudgeDice = true; }
					}

					// Handle XmY (X dice, always returning the highest possible (sides) roll value)
					if (matches[x].match(/^\d+[mM]\d+$/)) {
						count = matches[x].split("m")[0]
						keepcount = count;
						sides = matches[x].split("m")[1]
						minRollValue = Number(sides);
						if (sides == "f") { sides = 3; fudgeDice = true; }
						log(`ScriptCards: Player ${lastExecutedDisplayName}(${lastExecutedByID}) used an XmY dice formula in a roll: ${text}`)
					}

					// Handle XuY (Roll XdY dice, always getting a unique value on the roll)
					if (matches[x].match(/^\d+[uU]\d+$/)) {
						count = matches[x].split("u")[0]
						keepcount = count;
						sides = matches[x].split("u")[1]
						if (parseInt(keepcount) > parseInt(sides)) { keepcount = sides; count = sides; log(`ScriptCards: Attempt to roll more than ${sides} unique d${sides}`) }
						rollUnique = true;
					}

					// Handle keep highest/lowest
					if (matches[x].match(/^[kK][lLhH]\d+$/)) {
						keeptype = matches[x].charAt(1);
						keepcount = Number(matches[x].substring(2));
					}

					// Handle keep furthest from center (rolling with emphasis)
					if (matches[x].match(/^[eE]$/)) {
						keeptype = "e";
						keepcount = 1;
					}

					// Handle reroll thresholds (r>Z, r<Z)
					if (matches[x].match(/^[rR][\<\>]\d+$/)) {
						rerollType = matches[x].charAt(1);
						rerollThreshold = Number(matches[x].substring(2));
						rerollUnlimited = true;
					}

					// Handle reroll once (ro>Z, ro<Z)
					if (matches[x].match(/^[rR][oO][\<\>]\d+$/)) {
						rerollType = matches[x].charAt(2);
						rerollThreshold = Number(matches[x].substring(3));
						rerollUnlimited = false;
					}

					// Handle exploding dice (!h or !l)
					if (matches[x].match(/^![HhLl]$/)) {
						keepcount = 1;
						if (matches[x].charAt(1) == "h") {
							explodeValue = sides;
							keeptype = "h";
						} else {
							explodeValue = 1;
							keeptype = "h";
						}
					}

					// Handle exploding dice without rerolls
					if (matches[x].match(/^![\<\>]\d+$/)) {
						explodeValue = Number(matches[x].substring(2));
					}

					// Handle exploding dice
					if (matches[x].match(/^!$/)) {
						explodingType = "h";
						explodeValue = sides;
					}

					// Handle counting successes
					if (matches[x].match(/^[\><]\d+/)) {
						successThreshold = Number(matches[x].substring(1));
					}

					// Handle failure counting
					if (matches[x].match(/^f[\><]\d+/)) {
						failureThreshold = Number(matches[x].substring(2));
					}

					// Handle Wild Dice
					if (matches[x].match(/^([Ww])?([Xx])?([Ss])?([Xx])?$/)) {
						isWildDie = true;
						count--;
						if (matches[x].indexOf("s") > 0) {
							wildDieDropSelf = true;
						}
						if (matches[x].indexOf("x") > 0) {
							wildDieDropHighest = true;
						}
					}

					// Handle counting successes
					if (matches[x].match(/^\#$/)) {
						resultSet.dontHilight = true;
						resultSet.dontBase = true;
					}
				}
			}

			resultSet.sides = sides;

			// Roll the dice
			for (var x = 0; x < count; x++) {
				do {
					var thisDiceRoll = rollWithReroll(sides, rerollThreshold, rerollType, rerollUnlimited);
					var thisRoll = Number(thisDiceRoll[1]);
				} while (resultSet.rollSet.includes(thisRoll) && rollUnique)
				if (Number(minRollValue) > 1) {
					thisRoll = Number(minRollValue);
					thisDiceRoll[0] = sides.toString() + ` {MIN ${minRollValue}}`;
				}
				if (fudgeDice) { thisRoll -= 2; resultSet.dontHilight = true }
				var thisTotal = thisRoll;
				//var thisText = thisTotal.toString();
				var thisText = thisDiceRoll[0];
				if (fudgeDice) {
					thisText = fudgeText[thisRoll + 1];
				}
				while ((explodeValue > 0) && (thisRoll >= explodeValue)) {
					thisReroll = rollWithReroll(sides, rerollThreshold, rerollType, rerollUnlimited);
					thisRoll = Number(thisReroll[1]);
					thisTotal += Number(thisReroll[1]);
					thisText += "!" + thisReroll[0].toString();
				}
				resultSet.rollSet.push(thisTotal);
				resultSet.rawRollSet.push(thisTotal);
				resultSet.rollTextSet.push(thisText);
				switch (sides) {
					case 20: rollSet.diceFontSet.push("[d20]thisTotal[/d20]"); break;
					case 12: rollSet.diceFontSet.push("[d12]thisTotal[/d12]"); break;
					case 10: rollSet.diceFontSet.push("[d10]thisTotal[/d10]"); break;
					case 8: rollSet.diceFontSet.push("[d8]thisTotal[/d8]"); break;
					case 6: rollSet.diceFontSet.push("[d6]thisTotal[/d6]"); break;
					case 4: rollSet.diceFontSet.push("[d4]thisTotal[/d4]"); break;
				}
			}

			// If we are keeping highest or lowest number of dice, eliminate the ones to remove
			if (keepcount !== count) {
				var removeCount = count - keepcount;
				for (var x = 0; x < removeCount; x++) {
					if (keeptype == "h") { removeLowestRoll(resultSet.rollSet, resultSet.rollTextSet, resultSet.droppedRollSet) }
					if (keeptype == "l") { removeHighestRoll(resultSet.rollSet, resultSet.rollTextSet, resultSet.droppedRollSet) }
					if (keeptype == "e") { removeClosestRolls(resultSet.rollSet, resultSet.rollTextSet, resultSet.droppedRollSet, sides / 2) }
				}
				for (var x = 0; x < count; x++) {
					if (!resultSet.rollTextSet[x].startsWith("[x")) {
						resultSet.keptRollSet.push(resultSet.rollSet[x]);
					}
				}
			} else {
				resultSet.keptRollSet.push(...resultSet.rollSet);
			}

			// Handle the Wild Die if present
			if (isWildDie) {
				var thisRoll = randomInteger(sides);
				var thisTotal = thisRoll;
				var thisText = thisTotal.toString();
				while (thisRoll == sides) {
					thisRoll = randomInteger(sides);
					thisTotal += thisRoll;
					thisText += "!" + thisRoll.toString();
				}
				if (thisTotal == 1) { resultSet.hadOne = true; }
				if (thisTotal >= sides) { resultSet.hadAce = true; }
				if (thisTotal == 1 && wildDieDropHighest) { removeHighestRoll(resultSet.rollSet, resultSet.rollTextSet) }
				if (thisTotal > 1 || !wildDieDropSelf) {
					thisText = "W:" + thisText;
				} else {
					thisText = "W:[x" + thisText + "x]";
				}
				resultSet.rollSet.push(thisTotal);
				resultSet.rollTextSet.push(thisText);
				resultSet.dontHilight = true;
			}
		}

		// Compute the totals for the roll
		var thisResult = 0;
		var thisResultText = "";
		if (successThreshold == 0) {
			for (var x = 0; x < resultSet.rollSet.length; x++) {
				thisResult += resultSet.rollSet[x];
				thisResultText += resultSet.rollTextSet[x] + (x == resultSet.rollSet.length - 1 ? "" : ",");
			}
		} else {
			for (var x = 0; x < resultSet.rollSet.length; x++) {
				if (resultSet.rollSet[x] > successThreshold) {
					thisResult += 1
				}
				if (failureThreshold > 0 && resultSet.rollSet[x] < failureThreshold) {
					thisResult -= 1
					resultSet.highlightasfailure = true
				}
				thisResultText += resultSet.rollTextSet[x] + (x == resultSet.rollSet.length - 1 ? "" : ",");
			}
			resultSet.dontHilight = true;
		}
		resultSet.rollTotal = thisResult;
		resultSet.rollText = thisResultText;

		return resultSet;
	}

	function rollWithReroll(sides, rerollThreshold, rType, unlimited) {
		var thisRoll = randomInteger(sides);
		var rollText = "";
		var once = false;
		while (rType == ">" && (unlimited || !once) && thisRoll >= rerollThreshold) { rollText += `[x${thisRoll}x]`; thisRoll = randomInteger(sides); once = true; }
		while (rType == "<" && (unlimited || !once) && thisRoll <= rerollThreshold) { rollText += `[x${thisRoll}x]`; thisRoll = randomInteger(sides); once = true; }
		rollText += thisRoll;
		return [rollText, thisRoll]
	}

	function removeHighestRoll(rollSet, rollSetText, droppedRollSet) {
		var highest = -1;
		var highestIndex = -1;
		for (var x = 0; x < rollSet.length; x++) {
			if (rollSet[x] > highest) {
				highest = rollSet[x];
				highestIndex = x;
			}
		}
		if (highestIndex > -1) {
			droppedRollSet.push(rollSet[highestIndex]);
			rollSet[highestIndex] = 0;
			rollSetText[highestIndex] = "[x" + rollSetText[highestIndex] + "x]"
		}
	}

	function removeLowestRoll(rollSet, rollSetText, droppedRollSet) {
		var lowest = Number.MAX_SAFE_INTEGER;
		var lowestIndex = -1;
		for (var x = 0; x < rollSet.length; x++) {
			if (rollSet[x] < lowest && rollSet[x] > 0) {
				lowest = rollSet[x];
				lowestIndex = x;
			}
		}
		if (lowestIndex > -1) {
			droppedRollSet.push(rollSet[lowestIndex]);
			rollSet[lowestIndex] = 0;
			rollSetText[lowestIndex] = "[x" + rollSetText[lowestIndex] + "x]"
		}
	}

	function removeClosestRolls(rollSet, rollSetText, droppedRollSet, centerValue) {
		var difference = 0;
		var emphasisIndex = -1;
		for (var x = 0; x < rollSet.length; x++) {
			if ((Math.abs(centerValue - rollSet[x]) < difference && rollSet[x] > 0)
				|| (emphasisIndex == -1)
				|| (Math.abs(centerValue - rollSet[x] && rollSet[x] > rollSet[emphasisIndex])
				)) {
				difference = Math.abs(centerValue - rollSet[x]);
				emphasisIndex = x;
			}
		}
		if (emphasisIndex > -1) {
			for (let x = 0; x < rollSet.length; x++) {
				if (x !== emphasisIndex) {
					droppedRollSet.push(rollSet[rollSet[x]])
				}
			}
			rollSet[emphasisIndex] = 0;
			rollSetText[emphasisIndex] = "[x" + rollSetText[emphasisIndex] + "x]"
		}
	}

	function StripAndSplit(content, delimeter) {
		//log(content)
		//var work = content.replace("[","").replace(")","").replace("(","").replace(")","")
		var work = content.replace(/[^a-z0-9áéíóúñü:; \,_-]/gim, "");
		return work.split(delimeter);
	}

	const getCleanImgsrc = (imgsrc) => {
		if (imgsrc.startsWith('https://s3.amazonaws.com/files.d20.io/marketplace')) {
			log(`ScriptCards: imgsrc property appears to be a marketplace image. ${imgsrc}. imgsrc properties must be from the user's asset library.`);
		}
		let parts = imgsrc.match(/(.*\/images\/.*)(thumb|med|original|max)([^?]*)(\?[^?]+)?$/);
		if (parts) {
			return parts[1] + 'thumb' + parts[3] + (parts[4] ? parts[4] : `?${Math.round(Math.random() * 9999999)}`);
		}
		return;
	};

	function DelaySandboxExecution(thisContent) {
		var now = new Date;
		var startTime = (now.getHours() * 60 * 60) + (now.getMinutes() * 60) + now.getSeconds();
		var delay = parseFloat(thisContent);
		if (delay > 10) { delay = 10; }
		var endTime = startTime + delay;
		while (endTime > (now.getHours() * 60 * 60) + (now.getMinutes() * 60) + now.getSeconds()) {
			now = new Date;
		}
	}

	function delayFunction(speaker, output) {
		return function () {
			sendChat("ScriptCards", output.trim());
		}
	}

	const generateUUID = (() => {
		let a = 0;
		let b = [];
		return () => {
			let c = (new Date()).getTime() + 0;
			let f = 7;
			let e = new Array(8);
			let d = c === a;
			a = c;
			for (; 0 <= f; f--) {
				e[f] = "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz".charAt(c % 64);
				c = Math.floor(c / 64);
			}
			c = e.join("");
			if (d) {
				for (f = 11; 0 <= f && 63 === b[f]; f--) {
					b[f] = 0;
				}
				b[f]++;
			} else {
				for (f = 0; 12 > f; f++) {
					b[f] = Math.floor(64 * Math.random());
				}
			}
			for (f = 0; 12 > f; f++) {
				c += "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz".charAt(b[f]);
			}
			return c;
		};
	})();

	const generateRowID = () => generateUUID().replace(/_/g, "Z");

	async function setStringOrArrayElement(varName, varValue, cardParameters) {
		// Determine if the varName is a string or Array Element
		if (varName.match(/(.*)\((-?\d*)\)/)) {
			// It's an array element reference, split into a name and index
			var match = varName.match(/(.*)\((-?\d*)\)/);
			var arrayName = match[1];
			var arrayIndex = match[2];

			if (isNumber(arrayIndex)) {
				// If the array doesn't exist, create an empty array
				if (arrayVariables[arrayName] == null) {
					arrayVariables[arrayName] = [];
				}
				if (arrayVariables[arrayName].length >= (arrayIndex - 1) && arrayIndex >= 0) {
					arrayVariables[arrayName][arrayIndex] = varValue;
				} else {
					if (arrayIndex < 0) {
						arrayVariables[arrayName].unshift(varValue);
					} else {
						arrayVariables[arrayName].push(varValue);
					}
				}
			}
		} else {
			if (varValue == null) { varValue = "" }

			//if (typeof (varValue) === 'string' && varValue.charAt(0) == "+") {
			if (typeof (varValue) === 'string' && varValue.charAt(0) == cardParameters.concatenationcharacter) {
				varValue = (stringVariables[varName] || "") + varValue.substring(1);
			}

			stringVariables[varName] = await replaceVariableContent(varValue, cardParameters, true);
		}
	}

	function reload_template_mule() {
		templates = {}

		if (typeof Supernotes_Templates != "undefined") {
			templates = Object.assign({}, Supernotes_Templates);
		}

		templates["dnd5e"] = {
			boxcode: `<div style='background-image: linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)), url(https://i.imgur.com/8Mm94QY.png); background-size: 100% 100%; box-shadow: 0 0 3px #fff; display: block; text-align: left; font-size: 13px; padding: 5px; margin-bottom: 2px; color: black; font-family: serif; white-space: pre-wrap; line-height:1.2em; font-style:normal'>`, //"Bookinsanity", 
			titlecode: `<div style='margin: 0.5em 1em 0.25em 1em; font-size: 18px; font-variant: small-caps; border-bottom: 2px solid #d3b63b; font-family: "MrEavesSmallCaps", Monsterrat, serif; color: #8b281c; display: block; margin-block-start: 1em; margin-block-end: 0; margin-inline-start: 0px; margin-inline-end: 0px; font-weight: bold;'>`, //padding-bottom: .1rem;
			textcode: "</div><div><div style='font-weight: normal; display: block; margin: 0 1em 0 1em;'>",
			buttonwrapper: `<div style='display:block;'>`,
			buttonstyle: `style='display:inline-block; margin: 0px; font-size: 10px; color:#fff; padding: 2px 1px 1px 2px; background-color: #d00; text-align: center; border-radius: 5px;'`,
			playerbuttonstyle: `style='display:inline-block; color:#000; font-weight:normal; background-color: transparent;padding: 0px; border: none;'`,
			buttondivider: `<span style='color:#000; margin:0px;'> • </span>`,
			handoutbuttonstyle: `style='display:inline-block; color:#13f2fc; font-weight:normal; background-color: transparent; padding: 0px; border: none;'`,
			footer: ""
		};
		templates["dnd1e_green"] = {
			boxcode: `<div style='background-color: #b5dcb0; box-shadow: 0 0 3px #fff; display: block; text-align: left; font-size: 13px; padding: 5px; margin-bottom: 2px; color: black; font-family: sans-serif; white-space: pre-wrap; line-height:1.3em; font-style:normal'>`,
			titlecode: `<div style='margin: 0.5em 1em 0.25em 1em; font-size: 16px; font-variant: small-caps; font-family: "Goblin One", sans-serif; color: #000; display: block; margin-block-start: 1em; margin-block-end: 0; margin-inline-start: 0px; margin-inline-end: 0px; font-weight: bold;'>`, //padding-bottom: .1rem;
			textcode: "</div><div><div style='font-weight: normal; display: block; margin: 0 1em 0 1em;'>",
			buttonwrapper: `<div style='display:block;'>`,
			buttonstyle: `style='display:inline-block; font-size: 10px; color:#000; padding: 2px 0px 2px 0px; background-color: transparent; border: 1px solid black; text-align: center; border-radius: 0px;'`,
			playerbuttonstyle: `style='display:inline-block; color:#000; font-weight:normal; background-color: transparent;padding: 0px; border: none;'`,
			buttondivider: `<span style='color:#000; margin:0px;'> • </span>`,
			handoutbuttonstyle: `style='display:inline-block; color:#13f2fc; font-weight:normal; background-color: transparent; padding: 0px; border: none;'`,
			footer: ""
		};
		templates["dnd1e_amber"] = {
			boxcode: `<div style='background-color: #f3d149; box-shadow: 0 0 3px #fff; display: block; text-align: left; font-size: 13px; padding: 5px; margin-bottom: 2px; color: black; font-family: sans-serif; white-space: pre-wrap; line-height:1.3em; font-style:normal'>`,
			titlecode: `<div style='margin: 0.5em 1em 0.25em 1em; font-size: 16px; font-variant: small-caps; font-family: "Goblin One", sans-serif; color: #000; display: block; margin-block-start: 1em; margin-block-end: 0; margin-inline-start: 0px; margin-inline-end: 0px; font-weight: bold;'>`, //padding-bottom: .1rem;
			textcode: "</div><div><div style='font-weight: normal; display: block; margin: 0 1em 0 1em;'>",
			buttonwrapper: `<div style='display:block;'>`,
			buttonstyle: `style='display:inline-block; font-size: 10px; color:#000; padding: 2px 1px 1px 2px; background-color: transparent; border: 1px solid black; text-align: center; border-radius: 0px;'`,
			playerbuttonstyle: `style='display:inline-block; color:#000; font-weight:normal; background-color: transparent;padding: 0px; border: none;'`,
			buttondivider: `<span style='color:#000; margin:0px;'> • </span>`,
			handoutbuttonstyle: `style='display:inline-block; color:#13f2fc; font-weight:normal; background-color: transparent; padding: 0px; border: none;'`,
			footer: ""
		};

		try {
			var findTemplateChar = findObjs({ _type: "character", name: "ScriptCards_TemplateMule" })[0];
		} catch {
			log(`ScriptCards: TemplateMule not found`)
		}

		try {
			if (findTemplateChar) {
				const muleTemplates = findObjs({ _type: "ability", characterid: findTemplateChar.id });
				if (muleTemplates) {
					muleTemplates.forEach(template => {
						const tempName = template.get("name");
						templates[tempName] = templates[tempName] || {};
						const templateText = template.get("action");
						const templateLines = templateText.split("||");

						templateLines.forEach(line => {
							const pieces = line.replace(/(\r\n|\n|\r)/gm, "").split("::");
							if (pieces && pieces.length === 2) {
								const [key, value] = pieces.map(piece => piece.trim());
								const formattedValue = value.replace(/\{/g, "<").replace(/\}/g, ">");

								const templateKeys = [
									'boxcode', 'titlecode', 'textcode', 'buttonwrapper', 'buttonstyle',
									'footer', 'tablestyle', 'thstyle', 'tdstyle', 'trstyle',
									'subtitlestyle', 'h1style', 'h2style', 'h3style', 'h4style', 'h5style'
								];

								if (templateKeys.includes(key)) {
									templates[tempName][key] = formattedValue;
								}
							}
						});
					});
				}
			}
		} catch (error) {
			log("ScriptCards: Error parsing Templates Mule. Mule templates may not be available");
		}
		log(`ScriptCards: ${Object.keys(templates).length} Templates loaded`);
	}

	async function ParseCalculatedAttribute(attribute, character, cardParameters) {
		if (typeof attribute !== "string") {
			return attribute;
		}
		const seen = new Set();
		let parseCount = 0;
		while (attribute.match(/\@\{(.*?)\}/g) != null && parseCount < 100) {
			if (seen.has(attribute)) {
				if (cardParameters && cardParameters.debug === "1") {
					log(`ScriptCards: Circular calculated-attribute reference stopped for ${attribute}`);
				}
				break;
			}
			seen.add(attribute);
			const thisMatch = attribute.match(/\@\{(.*?)\}/g)[0];
			const attributeName = thisMatch.replace("@{", "").replace("}", "");
			let replacement = "";
			try {
				const lookup = await getAttributeReferenceValue(character.id, attributeName, cardParameters, "current");
				replacement = lookup.found && lookup.value != null ? lookup.value : "";
			} catch (error) {
				log(`Failure looking up attribute ${thisMatch}`);
			}
			const nextAttribute = attribute.replace(thisMatch, replacement);
			if (nextAttribute === attribute) {
				break;
			}
			attribute = nextAttribute;
			parseCount++;
		}
		if (parseCount >= 100 && cardParameters && cardParameters.debug === "1") {
			log(`ScriptCards: Calculated-attribute parsing limit reached for ${attribute}`);
		}
		attribute = attribute.replace(/floor\((.*?)\)/g, "$1 {FLOOR}"); // Remove double square brackets
		attribute = attribute.replace(/ceil\((.*?)\)/g, "$1 {CEIL}"); // Remove double square brackets
		attribute = attribute.replace(/\[\[(.*?)\]\]/g, "$1"); // Remove double square brackets
		attribute = attribute.replace(/\((.*?)\)/g, "$1"); // Remove double square brackets
		return attribute;
	}

	function FillTemplateStyle(piece, cardParameters, raw) {
		if (!raw || cardParameters.overridetemplate === "none") {
			return "";
		}

		const templateStyle = templates[cardParameters.overridetemplate][piece];
		return templateStyle ? `style='${templateStyle}'` : "";
	}

	function storeVariable(charid, prefix, varname, type, cardParameters = null) {
		try {
			let attributeName;
			let variableValue;

			switch (type) {
				case 'roll':
					attributeName = `SCR_${prefix}-${varname}`;
					variableValue = JSON.stringify(rollVariables[varname]);
					break;
				case 'string':
					attributeName = `SCS_${prefix}-${varname}`;
					variableValue = stringVariables[varname];
					break;
				case 'array':
					attributeName = `SCA_${prefix}-${varname}`;
					variableValue = JSON.stringify(arrayVariables[varname]);
					break;
				case 'hash':
					attributeName = `SCH_${prefix}-${varname}`;
					variableValue = JSON.stringify(hashTables[varname]);
					if (variableValue === '{}') {
						const testObj = findObjs({ type: "attribute", characterid: charid, name: attributeName })[0];
						if (testObj) {
							testObj.remove();
						}
						return;
					}
					break;
				case 'setting':
					if (cardParameters && cardParameters[varname] !== undefined) {
						attributeName = `SCT_${prefix}-${varname}`;
						variableValue = cardParameters[varname];
					} else {
						log(`Attempted to store ${varname} setting, which does not exist`);
						return;
					}
					break;
				default:
					log(`Unknown variable type: ${type}`);
					return;
			}

			const testObj = findObjs({ type: "attribute", characterid: charid, name: attributeName })[0];
			if (testObj) {
				testObj.set("current", variableValue);
			} else {
				createObj("attribute", {
					name: attributeName,
					current: variableValue,
					characterid: charid
				});
			}
		} catch (e) {
			log(`Unable to store ${type} ${varname} on ${charid}, error ${e}`);
		}
	}

	function loadVariable(charid, prefix, varname, type, cardParameters = null) {
		try {
			let testname = "unknown"
			switch (type) {
				case "roll": testname = `SCR_${prefix}-${varname}`; break;
				case "string": testname = `SCS_${prefix}-${varname}`; break;
				case "array": testname = `SCA_${prefix}-${varname}`; break;
				case "hash": testname = `SCH_${prefix}-${varname}`; break;
				case "setting": testname = `SCT_${prefix}-${varname}`; break;
			}
			let charobj = getObj("character", charid)
			if (charobj) {
				let attr = findObjs({ type: "attribute", characterid: charid, name: testname })[0];
				if (attr) {
					switch (type) {
						case "roll": rollVariables[varname] = JSON.parse(attr.get("current")); break;
						case "string": stringVariables[varname] = attr.get("current"); break;
						case "array": arrayVariables[varname] = JSON.parse(attr.get("current")); break;
						case "hash": hashTables[varname] = JSON.parse(attr.get("current")); break;
						case "setting": cardParameters[varname] = attr.get("current"); break;
					}
				} else {
					log(`ScriptCards: Attribute ${testname} not found on Storage Mule ${charid}`)
				}
			}
		} catch (e) {
			log(`Unable to load ${varname} on ${charid}, error ${e} `)
		}
	}

	function handleEmoteCommands(thisTag, thisContent) {
		/*
		try {
			var characterName = thisTag.substring(1);
			var macroName = thisContent.trim();
			log("gothere")
			if (characterName.length >= 1) {
				log("sendwithname")
				sendChat("ScriptCards", `%{${characterName}|${macroName}}`);
			} else {
				sendChat("ScriptCards", `#${macroName}`);
			}
		} catch (e) {
			log(`Error generating echo command: ${e}. thisTag: ${thisTag}, thisContent: ${thisContent}`)
		}
		*/
		try {
			var sendAs = thisTag.substring(1);
			sendChat(sendAs, thisContent);
		} catch (e) {
			log(`Error generating echo command: ${e}. thisTag: ${thisTag}, thisContent: ${thisContent}`)
		}
	}

	function handlePointerCommand(thisTag, thisContent) {
		try {
			var pointerArgs = thisContent.split("::");
			const objTypes = ["graphic", "text", "path", "graphic", "card", "character", "handout", "ability", "attribute"];
			if (thisTag.charAt(1).toLowerCase() == "r") {
				let found = false;
				let exitLoop = false;
				let i = 0;
				do {
					var thisObj = getObj(objTypes[i], pointerArgs[1]);
					if (thisObj) {
						found = true;
						exitLoop = true;
					} else {
						i++;
						if (i >= objTypes.length) {
							exitLoop = true;
						}
					}
				} while (!found && !exitLoop);
				if (thisObj) {
					let thisProperty = thisObj.get(pointerArgs[2]);
					if (thisProperty !== undefined) {
						pointerVariables[pointerArgs[0]] = thisProperty;
					} else {
						log(`ScriptCards: Property ${pointerArgs[2]} not found on object ${pointerArgs[1]}`);
					}
				} else {
					log(`ScriptCards: Unable to read object ${pointerArgs[1]} property ${pointerArgs[2]} into pointer variable ${pointerArgs[0]}. Object not found.`);
				}
			}
			if (thisTag.charAt(1).toLowerCase() == "s") {
				let found = false;
				let exitLoop = false;
				let i = 0;
				do {
					var thisObj = getObj(objTypes[i], pointerArgs[1]);
					if (thisObj) {
						found = true;
						exitLoop = true;
					} else {
						i++;
						if (i >= objTypes.length) {
							exitLoop = true;
						}
					}
				} while (!found && !exitLoop);
				if (thisObj && pointerVariables[pointerArgs[0]] !== undefined) {
					{
						thisObj.set(pointerArgs[2], pointerVariables[pointerArgs[0]]);
					}
				} else {
					log(`ScriptCards: Unable to set object ${pointerArgs[1]} property ${pointerArgs[2]} to value of pointer variable ${pointerArgs[0]}. Object or pointer variable not found.`);
				}
			}
		} catch (e) {
			log(`Error generating pointer variable: ${e}. thisTag: ${thisTag}, thisContent: ${thisContent}`)
		}
	}

	function handleConsoleLogs(thisTag, thisContent) {
		try {
			log(thisContent);
		} catch (e) {
			log(e);
		}
	}

	function handleHasTableCommands(thisTag, hashTables, thisContent) {
		try {
			let hashparams = thisTag.substring(2);
			let tableName = hashparams.split('("')[0];
			let tableKey = hashparams.split('("')[1];
			tableKey = tableKey.substring(0, tableKey.indexOf('")'));
			if (hashTables[tableName] === undefined) {
				hashTables[tableName] = {};
			}
			if (thisContent == null || thisContent.trim() == "") {
				delete hashTables[tableName][tableKey];
			} else {
				hashTables[tableName][tableKey] = thisContent;
			}
		} catch (e) {
			log(`Error setting hash table ${e.message}, thisTag: ${thisTag}, thisContent: ${thisContent}`)
		}
	}

	async function handleWaitStatements(thisTag, thisContent, cardParameters) {
		try {
			if (thisTag.length == 1) {
				DelaySandboxExecution(thisContent);
			} else {
				if (thisTag.indexOf(":") > 0) {
					var delayArgs = thisTag.substring(1).split(":");
					var delayLength = delayArgs[0];
					delayArgs.shift();
					var delayCommand = delayArgs.join(":");
					var hideInfo = "--#hidecard|1"
					if (delayCommand.charAt(0) == "+" || delayCommand.charAt(0) == "*") {
						hideInfo = "--#hidetitlecard|1"
					}
					setTimeout(delayFunction("", `!script {{ ${hideInfo} --${await replaceVariableContent(delayCommand, cardParameters)}|${await replaceVariableContent(thisContent, cardParameters)} }}`), parseFloat(delayLength) * 1000)
				}
			}
		} catch (e) {
			log(`Error setting up wait statement ${e.message}, thisTag: ${thisTag}, thisContent: ${thisContent}`)
		}
	}

	/*
	function handleLoopStatements(thisTag, thisContent, cardParameters, cardLines) {
		let loopCounter = undefined || thisTag.substring(1);
		if (loopCounter && loopCounter !== "" && loopCounter !== "!") {
			if (loopControl[loopCounter]) { log(`ScriptCards: Warning - loop counter ${loopCounter} reused inside itself on line ${lineCounter}.`); }
			let params = thisContent.split(cardParameters.parameterdelimiter);
			if (params.length === 2 && params[0].toLowerCase().endsWith("each")) {
				// This will be a for-each loop, so the first (and only) parameter must be an array name
				if (arrayVariables[params[1]] && arrayVariables[params[1]].length > 0) {
					loopControl[loopCounter] = { loopType: "foreach", initial: 0, current: 0, end: arrayVariables[params[1]].length - 1, step: 1, nextIndex: lineCounter, arrayName: params[1] }
					stringVariables[loopCounter] = arrayVariables[params[1]][0];
					loopStack.push(loopCounter);
					if (cardParameters.debug == 1) { log(`ScriptCards: Info - Beginning of loop ${loopCounter}`) }
				} else {
					log(`ScriptCards For...Each loop without a defined array or with empty array on line ${lineCounter}`)
				}
			}
			if (params.length === 2 && (params[0].toLowerCase().endsWith("while") || params[0].toLowerCase().endsWith("until"))) {
				let originalContent = getLineContent(cardLines[lineCounter]);
				let contentParts = originalContent.split(cardParameters.parameterdelimiter);
				let isTrue = await processFullConditional(await replaceVariableContent(contentParts[1], cardParameters)) || params[0].toLowerCase().endsWith("until");
				if (isTrue) {
					loopControl[loopCounter] = { loopType: params[0].toLowerCase().endsWith("until") ? "until" : "while", initial: 0, current: 0, end: 999999, step: 1, nextIndex: lineCounter, condition: contentParts[1] }
					stringVariables[loopCounter] = "true";
					loopStack.push(loopCounter);
					if (cardParameters.debug == 1) { log(`ScriptCards: Info - Beginning of loop ${loopCounter}`) }
				} else {
					let line = lineCounter;
					for (line = lineCounter + 1; line < cardLines.length; line++) {
						if (getLineTag(cardLines[line], line, "").trim() == "%") {
							lineCounter = line;
						}
					}
					if (lineCounter > cardLines.length) {
						log(`ScriptCards: Warning - no end block marker found for loop block started ${loopCounter}`);
						lineCounter = cardLines.length + 1;
					}
				}
			}
			if (params.length === 2 && (!params[0].toLowerCase().endsWith("each")) && (!params[0].toLowerCase().endsWith("until")) && (!params[0].toLowerCase().endsWith("while"))) { params.push("1"); } // Add a "1" as the assumed step value if only two parameters
			if (params.length === 3) {
				if (isNumeric(params[0]) && isNumeric(params[1]) && isNumeric(params[2]) && parseInt(params[2]) != 0) {
					loopControl[loopCounter] = { loopType: "fornext", initial: parseInt(params[0]), current: parseInt(params[0]), end: parseInt(params[1]), step: parseInt(params[2]), nextIndex: lineCounter }
					stringVariables[loopCounter] = params[0];
					loopStack.push(loopCounter);
					if (cardParameters.debug == 1) { log(`ScriptCards: Info - Beginning of loop ${loopCounter}`) }
				} else {
					if (parseInt(params[2] == 0)) {
						log(`ScriptCards: Error - cannot use loop step of 0 at line ${lineCounter}`)
					} else {
						log(`ScriptCards: Error - loop initialization contains non-numeric values on line ${lineCounter}`)
					}
				}
			}
		} else {
			if (loopStack.length >= 1) {
				let currentLoop = loopStack[loopStack.length - 1];
				if (loopControl[currentLoop]) {
					loopControl[currentLoop].current += loopControl[currentLoop].step;
					switch (loopControl[currentLoop].loopType) {
						case "fornext":
							stringVariables[currentLoop] = loopControl[currentLoop].current.toString();
							break;
						case "foreach":
							try {
								var beforeLoopEnded = stringVariables[currentLoop]
								stringVariables[currentLoop] = arrayVariables[loopControl[currentLoop].arrayName][loopControl[currentLoop].current]
							} catch {
								stringVariables[currentLoop] = "ArrayError"
							}
							break;
						case "while":
							var isTrue = await processFullConditional(await replaceVariableContent(loopControl[currentLoop].condition, cardParameters));
							if (!isTrue) {
								loopControl[currentLoop].current = loopControl[currentLoop].end + 1;
								loopControl[currentLoop].step = 1;
							}
							break;
						case "until":
							var isTrue = await processFullConditional(await replaceVariableContent(loopControl[currentLoop].condition, cardParameters));
							if (isTrue) {
								loopControl[currentLoop].current = loopControl[currentLoop].end + 1;
								loopControl[currentLoop].step = 1;
							}
							break;

					}
					if ((loopControl[currentLoop].step > 0 && loopControl[currentLoop].current > loopControl[currentLoop].end) ||
						(loopControl[currentLoop].step < 0 && loopControl[currentLoop].current < loopControl[currentLoop].end) ||
						loopCounter == "!") {
						stringVariables[currentLoop] = beforeLoopEnded;
						loopStack.pop();
						delete loopControl[currentLoop];
						if (cardParameters.debug == 1) { log(`ScriptCards: Info - End of loop ${currentLoop}`) }
						if (loopCounter == "!") {
							let line = lineCounter;
							for (line = lineCounter + 1; line < cardLines.length; line++) {
								if (getLineTag(cardLines[line], line, "").trim() == "%") {
									lineCounter = line;
								}
							}
							if (lineCounter > cardLines.length) {
								log(`ScriptCards: Warning - no end block marker found for loop block started ${loopCounter}`);
								lineCounter = cardLines.length + 1;
							}
						}
					} else {
						lineCounter = loopControl[currentLoop].nextIndex;
					}
				}
			} else {
				log(`ScriptCards: Error - Loop end statement without an active loop on line ${lineCounter}`);
			}
		}
	}
		*/

	function handleCardSettingsCommands(thisTag, thisContent, cardParameters) {
		try {
			let paramName = thisTag.substring(1).toLowerCase();
			paramName = parameterAliases[paramName] || paramName;
			if (cardParameters[paramName] != null) {
				cardParameters[paramName] = thisContent;
				if (cardParameters.debug == "1") { log(`Setting parameter ${paramName} to value ${thisContent} - ${cardParameters[paramName]}`) }
			} else {
				if (cardParameters.debug == "1") { log(`Unable to set parameter ${paramName} to value ${thisContent}`) }
			}

			switch (paramName) {
				case "sourcetoken":
					var charLookup = getObj("graphic", thisContent.trim());
					if (charLookup != null && charLookup.get("represents") !== "") {
						cardParameters.sourcecharacter = getObj("character", charLookup.get("represents"));
					}
					break;

				case "targettoken":
					var charLookup = getObj("graphic", thisContent.trim());
					if (charLookup != null && charLookup.get("represents") !== "") {
						cardParameters.targetcharacter = getObj("character", charLookup.get("represents"));
					}
					break;

				case "activepage":
					if (thisContent.trim().toLowerCase() === "playerpage") {
						cardParameters.activepageobject = getObj("page", Campaign().get("playerpageid"));
					} else {
						var pageLookup = getObj("page", thisContent.trim());
						if (pageLookup != null) {
							cardParameters.activepageobject = pageLookup;
						}
					}
					break;

				case "overridetemplate":
					if (templates[thisContent.trim()] != null) {
						cardParameters.overridetemplate = thisContent.trim();
					} else {
						if (thisContent.trim() !== "none") {
							log(`ScriptCards: Unknown template ${thisContent.trim()} specified. Template names are case sensitive. Reverting to "none"`)
						}
						cardParameters.overridetemplate = "none";
					}
					break;

				case "titlecardgradient":
					if (thisContent.trim() !== "0") {
						cardParameters["titlecardbackgroundimage"] = gradientStyle;
					} else {
						cardParameters["titlecardbackgroundimage"] = "";
					}
					break;

				case "buttontextcolor":
					if (thisContent.trim().match(/^[0-9a-fA-F]{6}$/)) {
						//cardParameters["buttontextcolor"] = `#${thisContent.trim()}`;
					}
					break;

				case "bodybackgroundimage":
					if (thisContent.trim() !== "") {
						cardParameters.oddrowbackground = "#00000000";
						cardParameters.evenrowbackground = "#00000000";
					}
					break;

				case "subtitleseperator":
					cardParameters.subtitleseparator = thisContent;
					break;

				case "evenrowbackgroundimage":
					if (thisContent.trim() !== "") {
						cardParameters.evenrowbackground = "#00000000";
					}
					break;

				case "oddrowbackgroundimage":
					if (thisContent.trim() !== "") {
						cardParameters.oddrowbackground = "#00000000";
					}
					break;
			}
			if (SettingsThatAreColors.includes(paramName)) {
				if (thisContent.trim().match(/^[0-9a-fA-F]{8}$/)) {
					cardParameters[paramName] = `#${thisContent.trim()}`;
				}
				if (thisContent.trim().match(/^[0-9a-fA-F]{6}$/)) {
					cardParameters[paramName] = `#${thisContent.trim()}`;
				}
				if (thisContent.trim().match(/^[0-9a-fA-F]{3}$/)) {
					cardParameters[paramName] = `#${thisContent.trim()}`;
				}
				if (thisContent.trim() == "") {
					cardParameters[paramName] = "#00000000"
				}
			}
			if (SettingsThatAreBooleans.includes(paramName)) {
				if (thisContent.trim().toLowerCase() == "true"
					|| thisContent.trim().toLowerCase() == "yes"
					|| thisContent.trim().toLowerCase() == "on"
					|| thisContent.trim() == "1"
					|| thisContent.trim().toLowerCase() == "show") {
					cardParameters[paramName] = "1";
				} else {
					cardParameters[paramName] = "0";
				}
				if (paramName == "beaconsheet") {
					if (cardParameters[paramName] == "1") {
						sheetType = "beacon";
					} else {
						sheetType = "classic";
					}
				}
			}
			if (SettingsThatAreNumbers.includes(paramName)) {
				cardParameters[paramName] = thisContent.match(/\d+/)[0]
			}
		} catch (e) {
			log(`Error setting card parameter ${e.message}, thisTag: ${thisTag}, thisContent: ${thisContent}`)
		}
	}

	function handleZOrderSettingCommands(thisTag, thisContent) {
		try {
			let statementParams = thisTag.split(":");
			let contentParams = thisContent.split(" ");
			if (statementParams[1].toLowerCase() == "graphic" || statementParams[1].toLowerCase() == "token") {
				if (contentParams[0].toLowerCase() == "tofront") {
					let thisObj = getObj("graphic", statementParams[2]);
					if (thisObj) { toFront(thisObj); }
				}
				if (contentParams[0].toLowerCase() == "toback") {
					let thisObj = getObj("graphic", statementParams[2]);
					if (thisObj) { toBack(thisObj); }
				}
			}
		} catch (e) {
			log(`Error setting z-order ${e.message}, thisTag: ${thisTag}, thisContent: ${thisContent}`)
		}
	}

	async function handleObjectModificationCommands(thisTag, thisContent, cardParameters) {
		try {
			if (thisTag.length > 1) {
				if (thisTag.charAt(2) == ":" || thisTag.charAt(3) == ":") {
					let objectType = thisTag.substring(1, 2).toLowerCase();
					switch (objectType) {
						case "o":
							switch (thisTag.substring(2, 3).toLowerCase()) {
								case "c": {
									let settings = thisContent.split(cardParameters.parameterdelimiter);
									let newChar = createObj("character", { name: settings[0] });
									if (newChar) {
										stringVariables[thisTag.substring(4)] = newChar.id
									} else {
										stringVariables[thisTag.substring(4)] = "OBJECT_CREATION_ERROR";
									}
								}
									break;

								case "h": {
									let regexSplit = /\|(?=(?:[^"]*"[^"]*")*[^"]*$)/
									let settings = thisContent.split(regexSplit);
									let hProps = {}
									for (let x = 0; x < settings.length; x++) {
										//log(`Setting ${x} is ${settings[x]}`)
										let setting = settings[x].split(":");
										let settingName = setting.shift();
										let settingValue = setting.join(":");
										if (settingValue) {
											settingValue = settingValue.trim();
											if (settingValue.startsWith('"') && settingValue.endsWith('"')) {
												settingValue = settingValue.substring(1, settingValue.length - 1);
											}
											hProps[settingName] = getSafeTokenProperty(settingName, settingValue);
											if (settingName.endsWith("notes")) {
												hProps[settingName] = processInlineFormatting(settingValue, cardParameters);
											}
										}
									}

									try {
										var newHandout = createObj("handout", hProps);
									} catch (e) {
										log(e)
									}

									if (newHandout) {
										stringVariables[thisTag.substring(4)] = newHandout.id
									} else {
										stringVariables[thisTag.substring(4)] = "OBJECT_CREATION_ERROR";
									}
								}
									break;

								case "t": {
									let regexSplit = /\|(?=(?:[^"]*"[^"]*")*[^"]*$)(?=(?:(?:(?!\$\{|\$\})[\s\S])*\$\{(?:(?!\$\{|\$\})[\s\S])*\$\})*(?:(?!\$\{|\$\})[\s\S])*$)/
									let settings = thisContent.split(regexSplit);
									let tProps = {}
									if (settings) {
										for (let x = 0; x < settings.length; x++) {
											if (settings[x]) {
												let setting = settings[x].match(/(".*?"|[^":\s]+)(?=\s*:|\s*$)/g);
												let settingName = setting[0];
												let settingValue = settings[x].substring(settings[x].indexOf(":") + 1);

												if (settingName) {
													if (settingValue.startsWith('"') && settingValue.endsWith('"')) {
														settingValue = settingValue.substring(1, settingValue.length - 1);
													}
													if (settingName.startsWith("t-") || settingName.startsWith("T-")) {
														settingName = settingName.substring(2);
													}
													if (settingName.toLowerCase() === "imgsrc") {
														settingValue = getCleanImgsrc(settingValue.replaceAll("\\\"", ""));
													}
													tProps[settingName] = getSafeTokenProperty(settingName, stripEscapmentMarkers(settingValue));
												}
											}
										}
									}
									if (tProps["subtype"] == undefined) { tProps["subtype"] = "token"; }
									if (tProps["layer"] == undefined) { tProps["layer"] = "objects"; }
									if (tProps["pageid"] == undefined) { tProps["pageid"] = Campaign().get("playerpageid"); }
									if (tProps["left"] == undefined) { tProps["left"] = 200; }
									if (tProps["top"] == undefined) { tProps["top"] = 200; }
									if (tProps["width"] == undefined) { tProps["width"] = 70; }
									if (tProps["height"] == undefined) { tProps["height"] = 70; }
									try {
										var newToken = createObj("graphic", tProps);
									} catch (e) {
										log(e)
									}

									if (newToken) {
										stringVariables[thisTag.substring(4)] = newToken.id
									} else {
										stringVariables[thisTag.substring(4)] = "OBJECT_CREATION_ERROR";
									}
								}
									break;

								case "p": {
									let regexSplit = /\|(?=(?:[^"]*"[^"]*")*[^"]*$)/
									let settings = thisContent.split(regexSplit);
									let tProps = {}
									for (let x = 0; x < settings.length; x++) {
										//log(`Setting ${x} is ${settings[x]}`)
										let setting = settings[x].match(/(".*?"|[^":\s]+)(?=\s*:|\s*$)/g);
										if (setting[1]) {
											if (setting[1].startsWith('"') && setting[1].endsWith('"')) {
												setting[1] = setting[1].substring(1, setting[1].length - 1);
											}
											tProps[setting[0]] = getSafeTokenProperty(setting[0], setting[1]);
										}
									}
									if (tProps["subtype"] == undefined) { tProps["subtype"] = "token"; }
									if (tProps["layer"] == undefined) { tProps["layer"] = "objects"; }
									if (tProps["pageid"] == undefined) { tProps["pageid"] = Campaign().get("playerpageid"); }
									if (tProps["left"] == undefined) { tProps["left"] = 200; }
									if (tProps["top"] == undefined) { tProps["top"] = 200; }
									if (tProps["width"] == undefined) { tProps["width"] = 70; }
									if (tProps["height"] == undefined) { tProps["height"] = 70; }
									try {
										var newToken = createObj("graphic", tProps);
									} catch (e) {
										log(e)
									}

									if (newToken) {
										stringVariables[thisTag.substring(4)] = newToken.id
									} else {
										stringVariables[thisTag.substring(4)] = "OBJECT_CREATION_ERROR";
									}
								}
									break;

								case "#": {
									let returnVarName = thisTag.substring(4);
									let settings = thisContent.split(cardParameters.parameterdelimiter);
									if (returnVarName && settings[0]) {
										let showPlayers = false;
										if (settings[1] && (settings[1].toLowerCase() == "true" || settings[1].toLowerCase() == "yes" || settings[1] == "1")) {
											showPlayers = true;
										}
										var newTable = createObj("rollabletable", { name: settings[0], showplayers: showPlayers })
										if (newTable) {
											stringVariables[returnVarName] = newTable.id
										} else {
											stringVariables[returnVarName] = "OBJECT_CREATION_ERROR";
										}
									}
								}
									break;

								case "e": {
									let returnVarName = thisTag.substring(4);
									let settings = thisContent.split(cardParameters.parameterdelimiter);
									if (returnVarName && settings[0] && settings[1]) {
										let weight = 1;
										let avatar = "";
										if (settings[2]) {
											weight = parseInt(settings[2]) || 1;
										}
										if (settings[3]) {
											avatar = getCleanImgsrc(settings[3]);
										}
										var newTableEntry = createObj("tableitem", { _rollabletableid: settings[0], name: settings[1], weight: weight, avatar: avatar })
										if (newTableEntry) {
											stringVariables[returnVarName] = newTableEntry.id
										} else {
											stringVariables[returnVarName] = "OBJECT_CREATION_ERROR";
										}
									}
								}
									break;

								case "b": {
									let attributeInfo = thisTag.substring(4).split(":");
									if (attributeInfo.length >= 3) {
										let theCharacter = getObj("character", attributeInfo[1])
										let isTokenAction = (attributeInfo[3] != null && attributeInfo[3].toLowerCase() == "y") ? true : false
										if (theCharacter != null) {
											let newAbility = createObj("ability", {
												name: attributeInfo[2],
												_characterid: attributeInfo[1],
												action: thisContent,
												istokenaction: isTokenAction
											});
											stringVariables[attributeInfo[0]] = newAbility.id;
										} else {
											stringVariables[attributeInfo[0]] = "OBJECT_CREATION_ERROR";
										}
									} else {
										stringVariables[attributeInfo[0]] = "OBJECT_CREATION_ERROR";
									}
								}
									break;

								case "r": {
									let charInfo = thisTag.substring(4).split(":");
									if (String(cardParameters.beaconsheet) === "1" && (charInfo.length < 2 || !charInfo[0].trim() || !charInfo[1].trim())) {
										stringVariables["SC_LAST_CREATED_ROWID"] = "";
										log(`ScriptCards Error: Beacon --!or requires both a character ID and a SectionName.`);
										break;
									}
									if (charInfo.length >= 2) {
										var theCharacter = getObj("character", charInfo[0])
										var theSection = charInfo[1];
										if (String(cardParameters.beaconsheet) === "1") {
											const created = await createBeaconOriginalRepeatingRow(
												charInfo[0],
												theSection,
												thisContent,
												cardParameters.debug === "1"
											);
											if (created.success) {
												stringVariables["SC_LAST_CREATED_ROWID"] = created.rowId;
											} else {
												stringVariables["SC_LAST_CREATED_ROWID"] = created.partialRowId || "";
												log(`ScriptCards Error: Beacon --!or failed: ${created.error}.`);
											}
											break;
										}

										var rowID = generateRowID();
										stringVariables["SC_LAST_CREATED_ROWID"] = rowID;
										var repeatingInfo = thisContent.split("|");
										if (theCharacter != null) {
											for (var x = 0; x < repeatingInfo.length; x++) {
												var subInfo = repeatingInfo[x].replace(":::").split(":");
												subInfo.push("");
												subInfo.push("");
												subInfo.push("");
												try {
													// eslint-disable-next-line no-unused-vars
													var newAttribute = createObj("attribute",
														{
															name: `repeating_${theSection}_${rowID}_${subInfo[0].trim()}`,
															_characterid: theCharacter.id,
															//current: subInfo[1].trim(),
															current: "",
															max: subInfo[2].replace(/%3A/gi, ":").trim()
														}
													)
													newAttribute.setWithWorker({ current: subInfo[1].replace(/%3A/gi, ":").trim() });
												} catch {
													log(`ScriptCards: Error creating repeating section values on character ${theCharacter}, section ${theSection}`)
												}
											}
										}

									}
								}
									break;
							}
							break;

						case "x": {
							// object deletion - currently tokens only
							log(`ScriptCards: Attempting to delete object with id ${thisTag.substring(3)} from script run by ${stringVariables.SendingPlayerName}`);
							var tokenID = thisTag.substring(3);
							if (tokenID.toLowerCase() == "s" && cardParameters.sourcetoken) { tokenID = cardParameters.sourcetoken; }
							if (tokenID.toLowerCase() == "t" && cardParameters.targettoken) { tokenID = cardParameters.targettoken; }
							var theToken = getObj("graphic", tokenID);
							if (theToken) {
								log(`ScriptCards: Deleting token with id ${theToken.id} from script run by ${stringVariables.SendingPlayerName}`);
								theToken.remove();
							}
						}

						case "h": {
							var handoutID = thisTag.substring(3);
							let regexSplit = /\|(?=(?:[^"]*"[^"]*")*[^"]*$)/
							let settings = thisContent.split(regexSplit);
							let hProps = {}

							for (let x = 0; x < settings.length; x++) {
								let setting = settings[x].split(":");
								let settingName = setting.shift();
								let settingValue = setting.join(":");
								if (settingValue) {
									if (settingValue.startsWith('"') && settingValue.endsWith('"')) {
										settingValue = settingValue.substring(1, settingValue.length - 1);
									}
									hProps[settingName] = getSafeTokenProperty(settingName, settingValue);
									if (settingName.endsWith("notes")) {
										hProps[settingName] = processInlineFormatting(settingValue, cardParameters);
									}
								}
							}

							try {
								var theHandout = getObj("handout", handoutID);
							} catch (e) {
								log(e)
							}

							if (theHandout) {
								stringVariables[thisTag.substring(4)] = theHandout.id

								_.each(hProps, function (settingValue, settingName) {
									theHandout.set(settingName, settingValue);
								});

								/*
																for (let i = 0; i < settings.length; i++) {
																	let thisSetting = settings[i].split(":");
								
																	let settingName = thisSetting.shift();
																	let settingValue = thisSetting.join(':').replace(/\\\\\|/gi, "|");
								
																	if (settingValue && (settingValue.startsWith("+=") || settingValue.startsWith("-="))) {
																		let currentValue = theHandout.get(settingName);
																		let delta = settingValue.substring(2);
																		if (isNumber(currentValue) && isNumber(delta)) {
																			settingValue = settingValue.startsWith("+=") ? Number(currentValue) + Number(delta) : Number(currentValue) - Number(delta);
																		} else {
																			settingValue = currentValue + delta;
																		}
																	}
								
																	if (cardParameters.formatoutputforobjectmodification == "1") {
																		settingValue = processInlineFormatting(settingValue, cardParameters, false);
																	}
								
																	if (theHandout && typeof (theHandout.get(settingName)) == "boolean" && settingValue) {
																		switch (settingValue.toLowerCase()) {
																			case "true": case "on": case "1": settingValue = true; break;
																			case "false": case "off": case "0": settingValue = false; break;
																			case "": case "toggle": case "flip": settingValue = !(theHandout.get(settingName)); break;
																		}
																	}
								
																	//if (settingName && settingValue) { 
																	if (settingName) {
								
																		theHandout.set(settingName, settingValue);
																		if (cardParameters.dontnotifyobservers !== "1") {
																			notifyObservers('handoutChange', theHandout, prevHandout);
																		}
																	}
																}
																	*/
							}
						}


							break;

						case "t": {
							var tokenID = thisTag.substring(3);
							if (tokenID.toLowerCase() == "s" && cardParameters.sourcetoken) { tokenID = cardParameters.sourcetoken; }
							if (tokenID.toLowerCase() == "t" && cardParameters.targettoken) { tokenID = cardParameters.targettoken; }
							let regexSplit = /\|(?=(?:[^"]*"[^"]*")*[^"]*$)(?=(?:(?:(?!\$\{|\$\})[\s\S])*\$\{(?:(?!\$\{|\$\})[\s\S])*\$\})*(?:(?!\$\{|\$\})[\s\S])*$)/
							let settings = thisContent.split(regexSplit);
							log(`Settings for token modification: ${settings}`)
							//let settings = thisContent.split(/(?<![\\\\])\|/);
							let theToken = getObj("graphic", tokenID);
							let prevTok = JSON.parse(JSON.stringify(theToken));

							if (theToken) {
								for (let i = 0; i < settings.length; i++) {
									let thisSetting = settings[i].split(":");

									let settingName = thisSetting.shift();
									if (settingName.startsWith("t-")) {
										settingName = settingName.substring(2);
									}
									let settingValue = thisSetting.join(':').replace(/\\\\\|/gi, "|");
									settingValue = stripEscapmentMarkers(settingValue);

									if (settingName.toLowerCase() == "night_vision_effect" && (settingValue.trim().toLowerCase() == "dimming")) {
										settingValue = "Dimming_0"
									}

									if (settingName.toLowerCase() == "imgsrc") { settingValue = getCleanImgsrc(settingValue); }

									if (settingName.toLowerCase() == "bar1_link" ||
										settingName.toLowerCase() == "bar2_link" ||
										settingName.toLowerCase() == "bar3_link" ||
										settingName.toLowerCase() == "bar4_link") {
										log(1)
										let theChar = getObj("character", theToken.get("represents"));
										if (theChar != null) {
											const beaconComputedBarProperty = getBeaconComputedTokenBarProperty(settingValue);
											if (beaconComputedBarProperty && beaconComputedBarProperty.metadata
												&& beaconComputedBarProperty.metadata.tokenBarValue === true) {
												settingValue = beaconComputedBarProperty.property;
											} else {
												try {
													var theAttribute = findObjs({ _type: "attribute", _characterid: theChar.get("_id"), name: settingValue })[0];
												} catch { log("Error setting bar link. Attribute not found.") }

												if (theAttribute != null) {
													settingValue = theAttribute.get("_id");
												}
											}
										}
									}

									if (settingName.toLowerCase() == "currentside") {
										if (settingValue) {
											let sides = theToken.get("sides").split("|");
											if (sides[Number(settingValue)]) {
												if (settingValue == "0") { settingValue = ""; }
												theToken.set("currentSide", settingValue);
												// Note: Remove this for March 2024 API Update
												var newImgSrc = getCleanImgsrc(sides[Number(settingValue)].replace("%3A", ":").replace("%3F", "?"));
												theToken.set("imgsrc", newImgSrc);
											}
										}
									}

									if (settingValue && (settingValue.startsWith("+=") || settingValue.startsWith("-="))) {
										let currentValue = theToken.get(settingName);
										let delta = settingValue.substring(2);
										if (isNumber(currentValue) && isNumber(delta)) {
											settingValue = settingValue.startsWith("+=") ? Number(currentValue) + Number(delta) : Number(currentValue) - Number(delta);
										} else {
											settingValue = currentValue + delta;
										}
									}
									if (cardParameters.formatoutputforobjectmodification == "1") {
										settingValue = processInlineFormatting(settingValue, cardParameters, false);
									}

									if (theToken && typeof (theToken.get(settingName)) == "boolean" && settingValue) {
										switch (settingValue.toLowerCase()) {
											case "true": case "on": case "1": settingValue = true; break;
											case "false": case "off": case "0": settingValue = false; break;
											case "": case "toggle": case "flip": settingValue = !(theToken.get(settingName)); break;
										}
									}

									if (cardParameters.limitmaxbarvalues !== "0" && (settingName.toLowerCase() == "bar1_value" ||
										settingName.toLowerCase() == "bar2_value" || settingName.toLowerCase() == "bar3_value" ||
										settingName.toLowerCase() == "bar4_value")) {
										let sMaxname = settingName.toLowerCase().replace("value", "max");
										if (theToken.get(sMaxname) && settingValue > theToken.get(sMaxname)) {
											settingValue = theToken.get(sMaxname);
										}
									}

									//if (settingName && settingValue) { 
									if (settingName) {
										if (TokenAttrsThatAreNumbers.includes(settingName)) {
											settingValue = Number(settingValue)
										}

										let tokenSettingChanged = false;
										let beaconComputedBarHandled = false;
										if (/^bar[1-4]_value$/i.test(settingName)) {
											const barLinkName = settingName.toLowerCase().replace("_value", "_link");
											const barLink = theToken.get(barLinkName);
											const beaconComputedBarProperty = getBeaconComputedTokenBarProperty(barLink);
											if (beaconComputedBarProperty && beaconComputedBarProperty.metadata
												&& beaconComputedBarProperty.metadata.tokenBarValue === true) {
												beaconComputedBarHandled = true;
												const representedCharacterID = theToken.get("represents");
												if (beaconComputedBarProperty.metadata.readonly === true) {
													log(`ScriptCards Error: Beacon linked token bar "${barLinkName}" uses read-only computed property "${beaconComputedBarProperty.property}".`);
												} else if (!representedCharacterID) {
													log(`ScriptCards Error: Beacon linked token bar "${barLinkName}" cannot be updated because the token does not represent a character.`);
												} else if (typeof setComputed !== "function") {
													log(`ScriptCards Error: Beacon linked token bar "${barLinkName}" cannot be updated because setComputed() is unavailable.`);
												} else {
													try {
														await setComputed({
															characterId: representedCharacterID,
															property: beaconComputedBarProperty.property,
															args: [settingValue]
														});
														invalidateBeaconCharacterCaches(representedCharacterID);
														tokenSettingChanged = true;
													} catch (error) {
														const errorMessage = error && error.message ? error.message : error;
														log(`ScriptCards Error: Beacon linked token bar "${barLinkName}" failed to update "${beaconComputedBarProperty.property}": ${errorMessage}`);
													}
												}
											}
										}

										if (!beaconComputedBarHandled) {
											theToken.set(settingName, settingValue);
											tokenSettingChanged = true;
										}
										if (tokenSettingChanged && cardParameters.dontnotifyobservers !== "1") {
											notifyObservers('tokenChange', theToken, prevTok);
										}
									}

									if ('undefined' !== typeof HealthColors && HealthColors.Update) {
										HealthColors.Update(theToken, prevTok);
									}


									forceLightUpdateOnPage();

								}
							} else {
								log(`ScriptCards Error: Modify Token called without valid TokenID`)
							}
						}
							break;

						case "c": {
							var charID = thisTag.substring(3);
							if (charID.toLowerCase() == "s") {
								if (cardParameters.sourcecharacter) {
									charID = cardParameters.sourcecharacter.id;
								}
							}
							if (charID.toLowerCase() == "t") {
								if (cardParameters.targetcharacter) {
									charID = cardParameters.targetcharacter.id;
								}
							}
							var settings = thisContent.split(/(?<![\\\\])\|/);
							var theCharacter = getObj("character", charID);
							if (theCharacter) {
								for (var i = 0; i < settings.length; i++) {
									var thisSetting = settings[i].split(":");
									var settingName = thisSetting.shift();
									if (settingName.startsWith("!")) {
										log(`ScriptCards Error: --!c does not create custom attributes. Use --!a:${charID}|!AttributeName:value for Beacon user.* attributes.`);
										continue;
									}
									const beacon = String(cardParameters.beaconsheet) === "1";
									let setType = "current";
									if (/^(?:b-|c-)/i.test(settingName)) {
										log(`ScriptCards Error: Beacon prefixes have been removed. Use "${settingName.substring(2)}" with --#beaconsheet|1.`);
										continue;
									}
									if (beacon) {
										if (settingName.endsWith("^")) {
											setType = "max";
											settingName = settingName.slice(0, -1);
										}
										if (settingName.toLowerCase().startsWith("user.")) {
											log(`ScriptCards Error: Beacon custom attribute "${settingName}" must be written with --!a, not --!c.`);
											continue;
										}
									}
									var settingValue = thisSetting.join(':').replace(/\\\\\|/gi, "|");

									if (beacon) {
										const structuredAliasWrite = await writeDnd2024BeaconStructuredAlias(
											charID,
											settingName,
											settingValue,
											setType
										);
										if (structuredAliasWrite.handled) {
											if (!structuredAliasWrite.success) {
												log(`ScriptCards Error: Beacon compatibility write "${settingName}" failed: ${structuredAliasWrite.error}`);
											} else if (cardParameters.debug === "1") {
												log(`ScriptCards Beacon compatibility write: ${settingName}.${setType} = ${JSON.stringify(structuredAliasWrite.value)} through ${structuredAliasWrite.writeRoute}.`);
											}
											continue;
										}
									}

									if (beacon && settingName.includes("->")) {
										const nestedWrite = await writeBeaconStructuredPath(charID, settingName, settingValue, setType);
										if (!nestedWrite.success) {
											log(`ScriptCards Error: Beacon nested write "${settingName}" failed: ${nestedWrite.error}`);
										} else if (cardParameters.debug === "1") {
											log(`ScriptCards Beacon nested write: submitted ${nestedWrite.rootName}.${nestedWrite.operation}->${nestedWrite.path.join("->")} through ${nestedWrite.writeRoute || "structured write"}, changing ${JSON.stringify(nestedWrite.previousValue)} to ${JSON.stringify(nestedWrite.value)}. Reread the sheet to verify persistence.`);
										}
										continue;
									}

									var beaconWriteCacheKey;
									var beaconSheetValue;
									if (beacon) {
										beaconWriteCacheKey = getBeaconSheetItemCacheKey(charID, setType, settingName);
										const dnd2024Adapter = getDnd2024BeaconAdapter(charID);
										const normalizedSettingName = normalizeBeaconLookupName(settingName);
										const localStoredAlias = dnd2024Adapter
											&& dnd2024Adapter.writableStoredAliases[normalizedSettingName]
											? resolveDnd2024BeaconStoredAlias(charID, settingName, setType, [])
											: { handled: false, found: false, value: undefined };
										if (localStoredAlias.handled && localStoredAlias.found) {
											beaconSheetValue = localStoredAlias.value;
										} else if (beaconSheetItemCache.has(beaconWriteCacheKey)) {
											beaconSheetValue = beaconSheetItemCache.get(beaconWriteCacheKey);
										} else {
											try {
												beaconSheetValue = await readBeaconSheetItem(charID, settingName, setType);
											} catch (error) {
												beaconSheetValue = undefined;
											}
										}
										if (beaconLookupIsUnresolved(beaconSheetValue) && setType === "max") {
											try {
												const currentValue = await readBeaconSheetItem(charID, settingName, "current");
												if (!beaconLookupIsUnresolved(currentValue)) {
													beaconSheetValue = "";
												}
											} catch (error) {
												beaconSheetValue = undefined;
											}
										}
										if (beaconLookupIsUnresolved(beaconSheetValue)) {
											log(`ScriptCards Error: Beacon sheet value "${settingName}" does not exist. Use --!a to create user.* custom attributes.`);
											continue;
										}
									}

									if (settingValue.startsWith("+=") || settingValue.startsWith("-=")) {
										var currentValue;
										if (bioFields[settingName.toLowerCase()] == 1) {
											currentValue = await getBioField(theCharacter, settingName);
										} else if (beacon) {
											currentValue = beaconSheetValue;
										} else {
											currentValue = theCharacter.get(settingName);
										}
										var delta = settingValue.substring(2);
										if (isNumber(currentValue) && isNumber(delta)) {
											settingValue = settingValue.startsWith("+=") ? Number(currentValue) + Number(delta) : Number(currentValue) - Number(delta);
										} else {
											settingValue = currentValue + delta;
										}
									}
									if (settingName.toLowerCase() == "defaulttoken") {
										var theToken = getObj("graphic", settingValue)
										if (theToken) {
											setDefaultTokenForCharacter(theCharacter, theToken)
										}
									} else {
										if (beacon) {
											try {
												await setSheetItem(charID, settingName, settingValue, setType, { allowThrow: true });
												invalidateBeaconCharacterCaches(charID);
											} catch (error) {
												const errorMessage = error && error.message ? error.message : error;
												log(`ScriptCards Error: Beacon native write "${settingName}" failed: ${errorMessage}`);
											}
										} else {
											theCharacter.set(settingName, settingValue);
										}
									}
								}
							} else {
								log(`ScriptCards Error: Modify character called without valid characterID`)
							}
						}
							break;

						case "a": {
							var objectID = thisTag.substring(3);
							if (objectID.toLowerCase() == "s") {
								if (cardParameters.sourcecharacter) {
									objectID = cardParameters.sourcecharacter.id;
								}
							}
							if (objectID.toLowerCase() == "t") {
								if (cardParameters.targetcharacter) {
									objectID = cardParameters.targetcharacter.id;
								}
							}
							var characterObj = undefined;
							var tokenTest = getObj("graphic", objectID);
							if (tokenTest) {
								characterObj = getObj("character", tokenTest.get("represents"));
							} else {
								characterObj = getObj("character", objectID);
							}
							if (characterObj != null) {
								var settings = thisContent.split(/(?<![\\\\])\|/);
								if (String(cardParameters.beaconsheet) === "1") {
									const getExistingBeaconAttributeTarget = async (lookupName, operation) => {
										const explicitCustomLookup = lookupName.toLowerCase().startsWith("user.");
										const schemaProperty = explicitCustomLookup
											? undefined
											: getBeaconComputedTokenBarProperty(lookupName);
										const resolvedLookupName = schemaProperty ? schemaProperty.property : lookupName;
										const requestedCacheKey = getBeaconSheetItemCacheKey(characterObj.id, operation, resolvedLookupName);
										const currentCacheKey = getBeaconSheetItemCacheKey(characterObj.id, "current", resolvedLookupName);
										const maxCacheKey = getBeaconSheetItemCacheKey(characterObj.id, "max", resolvedLookupName);
										let exists = beaconSheetItemCache.has(currentCacheKey)
											|| beaconSheetItemCache.has(maxCacheKey);
										let value = beaconSheetItemCache.has(requestedCacheKey)
											? beaconSheetItemCache.get(requestedCacheKey)
											: undefined;

										if (!exists || value === undefined) {
											try {
												const requestedValue = await readBeaconSheetItem(characterObj.id, resolvedLookupName, operation);
												if (!beaconLookupIsUnresolved(requestedValue)) {
													exists = true;
													value = requestedValue;
													beaconSheetItemCache.set(requestedCacheKey, requestedValue);
												}
											} catch (error) {
												value = undefined;
											}
										}

										if (!exists && operation === "max") {
											if (beaconSheetItemCache.has(currentCacheKey)) {
												exists = true;
											} else {
												try {
													const currentValue = await readBeaconSheetItem(characterObj.id, resolvedLookupName, "current");
													if (!beaconLookupIsUnresolved(currentValue)) {
														exists = true;
														beaconSheetItemCache.set(currentCacheKey, currentValue);
													}
												} catch (error) {
													exists = false;
												}
											}
										}

										const schemaMatched = !exists && schemaProperty !== undefined;
										if (schemaMatched) {
											exists = true;
										}

										return {
											exists,
											value,
											cacheKey: requestedCacheKey,
											lookupName: resolvedLookupName,
											schemaMatched
										};
									};

									for (var i = 0; i < settings.length; i++) {
										var thisSetting = settings[i].split(":");
										var settingName = thisSetting.shift();
										var createAttribute = false;
										var setType = "current";
										if (settingName.startsWith("!")) {
											createAttribute = true;
											settingName = settingName.substring(1);
										}
										if (settingName.endsWith("^")) {
											setType = "max";
											settingName = settingName.slice(0, -1);
										}
										if (settingName.startsWith("$")) {
											settingName = settingName.substring(1);
										}
										if (!settingName) {
											continue;
										}
										if (settingName.toLowerCase().startsWith("b-") || settingName.toLowerCase().startsWith("c-")) {
											log(`ScriptCards Error: Beacon prefixes have been removed. Use "${settingName.substring(2)}" instead.`);
											continue;
										}
										if (settingName.includes("->")) {
											log(`ScriptCards Error: Beacon structured path "${settingName}" must be written with --!c, not --!a.`);
											continue;
										}

										var settingValue = thisSetting.join(":").replace(/\\\\\|/gi, "|");
										const explicitCustomAttribute = settingName.toLowerCase().startsWith("user.");
										if (!explicitCustomAttribute && !/^repeating_/i.test(settingName)) {
											const structuredAliasWrite = await writeDnd2024BeaconStructuredAlias(
												characterObj.id,
												settingName,
												settingValue,
												setType
											);
											if (structuredAliasWrite.handled) {
												if (!structuredAliasWrite.success) {
													log(`ScriptCards Error: Beacon --!a compatibility write "${settingName}" failed: ${structuredAliasWrite.error}`);
												} else if (cardParameters.debug === "1") {
													log(`ScriptCards Beacon --!a compatibility write: ${settingName}.${setType} = ${JSON.stringify(structuredAliasWrite.value)} through ${structuredAliasWrite.writeRoute}.`);
												}
												continue;
											}
										}

										if (!explicitCustomAttribute && /^repeating_/i.test(settingName)) {
											const repeatingResult = await setExistingBeaconRepeatingAttribute(
												characterObj.id,
												settingName,
												settingValue,
												setType,
												cardParameters.debug === "1"
											);
											if (!repeatingResult.success) {
												log(`ScriptCards Error: Beacon --!a repeating write "${settingName}" failed: ${repeatingResult.error}`);
											}
											continue;
										}
										const bareSettingName = explicitCustomAttribute ? settingName.substring(5) : settingName;
										const customSettingName = explicitCustomAttribute ? settingName : `user.${settingName}`;
										let targetSettingName;
										let targetInfo;
										let targetRoute;

										if (explicitCustomAttribute) {
											targetInfo = await getExistingBeaconAttributeTarget(customSettingName, setType);
											if (targetInfo.exists || createAttribute) {
												targetSettingName = customSettingName;
												targetRoute = targetInfo.exists ? "existing custom attribute" : "new custom attribute";
											}
										} else {
											const nativeInfo = await getExistingBeaconAttributeTarget(bareSettingName, setType);
											if (nativeInfo.exists) {
												targetSettingName = nativeInfo.lookupName || bareSettingName;
												targetInfo = nativeInfo;
												targetRoute = nativeInfo.schemaMatched
													? "native sheet schema item"
													: "existing native sheet item";
											} else {
												const customInfo = await getExistingBeaconAttributeTarget(customSettingName, setType);
												if (customInfo.exists || createAttribute) {
													targetSettingName = customSettingName;
													targetInfo = customInfo;
													targetRoute = customInfo.exists ? "existing custom attribute" : "new custom attribute";
												}
											}
										}

										if (!targetSettingName) {
											continue;
										}
										if (!targetInfo.exists && !settingValue) {
											continue;
										}

										var existingSheetValue = targetInfo.value;
										if (targetInfo.exists && existingSheetValue === undefined) {
											existingSheetValue = "";
										}
										if (settingValue.startsWith("+=") || settingValue.startsWith("-=")) {
											var delta = settingValue.substring(2);
											if (!targetInfo.exists) {
												settingValue = settingValue.startsWith("+=") ? delta : `-${delta}`;
												if (isNumber(settingValue)) {
													settingValue = Number(settingValue);
												}
											} else if (isNumber(existingSheetValue) && isNumber(delta)) {
												settingValue = settingValue.startsWith("+=") ? Number(existingSheetValue) + Number(delta) : Number(existingSheetValue) - Number(delta);
											} else {
												settingValue = existingSheetValue + delta;
											}
										}

										try {
											await setSheetItem(characterObj.id, targetSettingName, settingValue, setType, { allowThrow: true });
											invalidateBeaconCharacterCaches(characterObj.id);
											if (cardParameters.debug === "1") {
												log(`ScriptCards Beacon --!a write: ${targetSettingName}.${setType} = ${JSON.stringify(settingValue)} through ${targetRoute}.`);
											}
										} catch (error) {
											const errorMessage = error && error.message ? error.message : error;
											log(`ScriptCards Error: Beacon --!a write "${targetSettingName}" failed: ${errorMessage}`);
										}
									}
									break;
								}

								for (var i = 0; i < settings.length; i++) {
									var thisSetting = settings[i].split(":");
									var settingName = thisSetting.shift();
									var createAttribute = false;
									var useSheetWorker = true;
									var setType = "current";
									if (settingName.startsWith("!")) {
										createAttribute = true;
										settingName = settingName.substring(1);
									}
									if (settingName.startsWith("repeating_")) {
										createAttribute = true;
									}
									if (settingName.endsWith("^")) {
										setType = "max";
										settingName = settingName.slice(0, -1);
									}
									if (settingName.startsWith("$")) {
										useSheetWorker = false;
										settingName = settingName.substring(1);
									}
									var settingValue = thisSetting.join(":").replace(/\\\\\|/gi, "|");
									var theAttribute = findObjs({
										type: 'attribute',
										characterid: characterObj.id,
										name: settingName
									}, { caseInsensitive: true })[0];
									if (!bioFields[settingName.toLowerCase()] == 1) {
										if (theAttribute) {
											if (settingValue.startsWith("+=") || settingValue.startsWith("-=")) {
												var currentValue = theAttribute.get(setType);
												var delta = settingValue.substring(2);
												if (isNumber(currentValue) && isNumber(delta)) {
													settingValue = settingValue.startsWith("+=") ? Number(currentValue) + Number(delta) : Number(currentValue) - Number(delta);
												} else {
													settingValue = currentValue + delta;
												}
											}
											if (setType == "current" && useSheetWorker) {
												theAttribute.setWithWorker({ current: settingValue });
											}
											if (setType == "max" && useSheetWorker) {
												theAttribute.setWithWorker({ max: settingValue });
											}
											if (!useSheetWorker) {
												theAttribute.set(setType, settingValue);
											}
										} else {
											if (createAttribute && settingValue) {
												if (settingValue.toString().startsWith("+=")) {
													settingValue = settingValue.substring(2);
													if (isNumber(settingValue)) { settingValue = Number(settingValue) }
												}
												if (settingValue.toString().startsWith("-=")) {
													settingValue = "-" + settingValue.substring(2);
													if (isNumber(settingValue)) { settingValue = Number(settingValue) }
												}
												theAttribute = createObj('attribute', {
													characterid: characterObj.id,
													name: settingName,
													current: setType == "sc_create_dummy" ? "" : "",
													max: setType == "max" ? "sc_create_dummy" : ""
												});

												if (setType == "current" && useSheetWorker) {
													theAttribute.setWithWorker({ current: settingValue });
												}
												if (setType == "max" && useSheetWorker) {
													theAttribute.setWithWorker({ max: settingValue });
												}
												if (!useSheetWorker) {
													theAttribute.set(setType, settingValue);
												}
											}
										}
									} else {
										log(`ScriptCards Error: Setting notes, gmnotes, or bio are not currently supported.`);
									}
								}
							} else {
								log(`ScriptCards Error: Modify attribute called without valid ID ${thisTag}, ${thisContent}`)
							}
						}
							break;
					}
				} else {
					var objectInfo = thisTag.substring(1).split(":");
					if (objectInfo.length == 2) {
						var objectType = objectInfo[0];
						var objectID = objectInfo[1];
						var thisObject = getObj(objectType, objectID);
						if (thisObject != null) {
							var settings = thisContent.split(/(?<![\\\\])\|/);
							for (var i = 0; i < settings.length; i++) {
								var thisSetting = settings[i].split(":");
								var settingName = thisSetting.shift();
								var settingValue = thisSetting.join(':').replace(/\\\\\|/gi, "|");
								if (settingName.toLowerCase() == "imgsrc") {
									settingValue = getCleanImgsrc(settingValue);
								}

								if (settingName.toLowerCase() == "night_vision_effect") {
									if (settingValue.toLowerCase() == "dimming") {
										settingValue = "Dimming_0"
									}
								}

								if (cardParameters.formatoutputforobjectmodification == "1") {
									settingValue = processInlineFormatting(settingValue, cardParameters, false);
								}

								if (typeof (thisObject.get(settingName)) == "boolean" && (settingValue != null)) {
									switch (settingValue.toLowerCase()) {
										case "true": settingValue = true; break;
										case "false": settingValue = false; break;
									}
								}

								if (settingName.toLowerCase() == "speakingas") {
									settingValue = settingValue.replace("^", "|")
								}

								if (settingName != null) {
									thisObject.set(settingName, settingValue);
								}
							}
							if (objectType.toLowerCase() == "graphic") { forceLightUpdateOnPage() }
						} else {
							log(`ScriptCards Error: Modify object called without valid object type or object ID`)
						}
					}
				}
			}
		} catch (e) {
			log(`Error updating/adding object ${e.message}, thisTag: ${thisTag}, thisContent: ${thisContent}`)
		}
	}

	function handleDataReadCommands(thisTag) {
		try {
			if (thisTag.charAt(1) !== "!") {
				if (thisTag.charAt(1) == "<") {
					scriptData = saveScriptData.slice(0);
				} else {
					if (scriptData.length > 0) {
						stringVariables[thisTag.substring(1)] = scriptData.shift();
					} else {
						stringVariables[thisTag.substring(1)] = "EndOfDataError";
					}
				}
			}
		} catch (e) {
			log(`Error reading data ${e.message}, thisTag: ${thisTag}, thisContent: ${thisContent}`)
		}
	}

	function handleAPICallCommands(thisTag, thisContent, cardParameters, msg) {
		try {
			let apicmd = thisTag.substring(1);
			let spacer = " ";
			let slash = "\\";

			// Replace _ with --
			let params = thisContent.replace(/(^|\ +)_/g, " --");

			// Remove deferral markers from deferred SelectManager/ZeroFrame calls
			let regex = new RegExp(`${slash}{${slash}${cardParameters.deferralcharacter}(${slash}&.*?)${slash}}`, "g");
			params = params.replace(regex, "{$1}");

			// Remove deferral markers from deferred Fetch calls
			regex = new RegExp(`${slash}@${slash}${cardParameters.deferralcharacter}${slash}((.*?)${slash})`, "g");
			params = params.replace(regex, "@($1)");
			regex = new RegExp(`${slash}*${slash}${cardParameters.deferralcharacter}${slash}((.*?)${slash})`, "g");
			params = params.replace(regex, "*($1)");
			regex = new RegExp(`get${slash}${cardParameters.deferralcharacter}${slash}.`, "g");
			params = params.replace(regex, "get.");
			regex = new RegExp(`set${slash}${cardParameters.deferralcharacter}${slash}.`, "g");
			params = params.replace(regex, "set.");

			var apiMessage = `!${apicmd}${spacer}${params}`.trim();
			if (cardParameters.debug !== "0") {
				log(`ScriptCards: Making API call - ${apiMessage}`);
			}
			sendChat(msg.who, apiMessage);
		} catch (e) {
			log(`Error calling API command ${e.message}, thisTag: ${thisTag}, thisContent: ${thisContent}`)
		}
	}

	async function handleOutputCommands(thisTag, thisContent, cardParameters) {
		try {
			let rowData = buildRowOutput(thisTag.substring(1), await replaceVariableContent(thisContent.replace(/\[&zwnj;/g, "["), cardParameters, true), cardParameters.outputtagprefix, cardParameters.outputcontentprefix);
			let rawRowData = buildRawRowOutput(thisTag.substring(1), await replaceVariableContent(thisContent.replace(/\[&zwnj;/g, "["), cardParameters, true), cardParameters.outputtagprefix, cardParameters.outputcontentprefix);

			tableLineCounter += 1;
			if (tableLineCounter % 2 == 0) {
				while (rowData.indexOf("=X=FONTCOLOR=X=") > 0) { rowData = rowData.replace("=X=FONTCOLOR=X=", cardParameters.evenrowfontcolor); }
				while (rowData.indexOf("=X=ROWBG=X=") > 0) { rowData = rowData.replace("=X=ROWBG=X=", ` background: ${cardParameters.evenrowbackground}; background-image: ${cardParameters.evenrowbackgroundimage}; `); }
				//while(rowData.indexOf("=X=ROWBG=X=") > 0) { rowData = rowData.replace("=X=ROWBG=X=", ` background: ${cardParameters.evenrowbackground}; `); }
			} else {
				while (rowData.indexOf("=X=FONTCOLOR=X=") > 0) { rowData = rowData.replace("=X=FONTCOLOR=X=", cardParameters.oddrowfontcolor); }
				while (rowData.indexOf("=X=ROWBG=X=") > 0) { rowData = rowData.replace("=X=ROWBG=X=", ` background: ${cardParameters.oddrowbackground}; background-image: ${cardParameters.oddrowbackgroundimage}; `); }
				//while(rowData.indexOf("=X=ROWBG=X=") > 0) { rowData = rowData.replace("=X=ROWBG=X=", ` background: ${cardParameters.oddrowbackground}; `); }
			}
			rowData = processInlineFormatting(rowData, cardParameters, false);
			rawRowData = processInlineFormatting(rawRowData, cardParameters, true);

			rowData = stripEscapmentMarkers(rowData);
			rawRowData = stripEscapmentMarkers(rawRowData);

			thisTag.charAt(0) == "+" ? outputLines.push(rowData) : gmonlyLines.push(rowData)
			thisTag.charAt(0) == "+" ? bareoutputLines.push(rawRowData) : null
		} catch (e) {
			log(`Error adding output/gmoutput line ${e.message}, thisTag: ${thisTag}, thisContent: ${thisContent}`)
		}
	}

	function handleGosubCommands(thisTag, thisContent, cardParameters) {
		try {
			parameterStack.push(callParamList);
			let paramList = CSVtoArray(thisContent.trim());
			callParamList = {};
			arrayVariables["args"] = []
			let paramCount = 1;

			if (paramList) {
				paramList.forEach(function (item) {
					arrayVariables["args"].push(item.toString().trim());
					callParamList[paramCount] = item.toString().trim();
					paramCount++;
				});
			}
			let jumpTo = thisTag.substring(1);
			if (cardParameters.functionbenchmarking == "1") {
				benchmarks[jumpTo] ? benchmarks[jumpTo] += 1 : benchmarks[jumpTo] = 1
			}
			if (lineLabels[jumpTo]) {
				returnStack.push(lineCounter);
				lineCounter = lineLabels[jumpTo];
			} else { log(`ScriptCards Error: Label ${jumpTo} is not defined on line ${lineCounter} (${thisTag}, ${thisContent})`) }
		} catch (e) {
			log(`Error executing gosub ${e.message}, thisTag: ${thisTag}, thisContent: ${thisContent}`)
		}
	}

	function handleVisualEffectsCommand(thisTag, thisContent, cardParameters) {
		try {
			if (thisTag.length > 1) {
				let effectType = thisTag.substring(1).toLowerCase();
				let params = thisContent.split(" ");
				switch (effectType) {
					case "token":
						if (params.length >= 2) {
							let s = getObj("graphic", params[0]);
							if (s) {
								var x = s.get("left");
								var y = s.get("top");
								var pid = s.get("_pageid");
								if (params[1].toLowerCase() == "ping") {
									let moveall = false;
									if (params[2] && params[2].toLowerCase() == "moveall") {
										moveall = true;
									}
									sendPing(x, y, pid, stringVariables["SendingPlayerID"], moveall);
								} else {
									let effectInfo = findObjs({
										_type: "custfx",
										name: params[1].trim()
									});
									if (!_.isEmpty(effectInfo)) {
										spawnFxWithDefinition(x, y, effectInfo[0].get('definition'), pid);
									} else {
										let t = params[1].trim();
										if (t !== "" && t !== "none") {
											spawnFx(x, y, t, pid);
										}
									}
								}
							}
						}
						break;
					case "betweentokens":
						if (params.length >= 3) {
							var s = getObj("graphic", params[0]);
							var p = getObj("graphic", params[1]);
							if (s && p) {
								var x1 = s.get("left");
								var y1 = s.get("top");
								var x2 = p.get("left");
								var y2 = p.get("top");
								var pid = s.get("_pageid");

								var effectInfo = findObjs({
									_type: "custfx",
									name: params[2].trim()
								});
								if (!_.isEmpty(effectInfo)) {
									var angleDeg = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
									if (angleDeg < 0) {
										angleDeg += 360;
									}
									var definition = effectInfo[0].get('definition');
									definition.angle = angleDeg;
									spawnFxWithDefinition(x1, y1, definition, pid);
								} else {
									var t = params[2].trim();
									if (t !== "" && t !== "none") {
										spawnFxBetweenPoints({ x: x1, y: y1 }, { x: x2, y: y2 }, t, pid);
									}
								}

							}
						}
						break;

					case "point":
						var x = params[0];
						var y = params[1];
						var pid = Campaign().get("playerpageid");
						if (cardParameters.activepage !== "") {
							pid = cardParameters.activepage;
						}
						if (params[2].toLowerCase() == "ping") {
							var moveall = false;
							if (params[3] && params[3].toLowerCase() == "moveall") {
								moveall = true;
							}
							sendPing(x, y, pid, stringVariables["SendingPlayerID"], moveall);
						} else {
							var effectInfo = findObjs({
								_type: "custfx",
								name: params[2].trim()
							});
							if (!_.isEmpty(effectInfo)) {
								spawnFxWithDefinition(x, y, effectInfo[0].get('definition'), pid);
							} else {
								var t = params[2].trim();
								if (x && y) {
									if (t !== "" && t !== "none") {
										spawnFx(x, y, t, pid);
									}
								}
							}
						}
						break;

					case "line":
						var x1 = params[0];
						var y1 = params[1];
						var x2 = params[2];
						var y2 = params[3];
						var t = params[4];
						var pid = Campaign().get("playerpageid");
						if (cardParameters.activepage !== "") {
							pid = cardParameters.activepage;
						}
						if (x1 && y1 && x2 && y2 && t && pid) {
							spawnFxBetweenPoints({ x: x1, y: y1 }, { x: x2, y: y2 }, t, pid);
						}
						break;
				}
			}
		} catch (e) {
			log(`Error creating VFX ${e.message}, thisTag: ${thisTag}, thisContent: ${thisContent}`)
		}
	}

	function handleStashLines(thisTag, thisContent, cardParameters) {
		try {
			if (thisTag.charAt(0).toLowerCase() == "s") {
				switch (thisTag.substring(1).toLowerCase()) {
					case "rollvariables":
						if (thisContent.trim().length > 0) {
							state[APINAME].storedVariables[thisContent.trim()] = JSON.parse(JSON.stringify(rollVariables));
						}
						break;

					case "stringvariables":
						if (thisContent.trim().length > 0) {
							state[APINAME].storedStrings[thisContent.trim()] = JSON.parse(JSON.stringify(stringVariables));
						}
						break;

					case "settings":
						if (thisContent.trim().length > 0) {
							state[APINAME].storedSettings[thisContent.trim()] = {};
							for (var key in cardParameters) {
								if (cardParameters[key] !== defaultParameters[key]) {
									state[APINAME].storedSettings[thisContent.trim()][key] = cardParameters[key];
								}
							}
						}
						break;
				}

				// Handle variable storage and recall
				if ("$&@#:".includes(thisTag.charAt(1))) {
					let varType = thisTag.charAt(1)
					let prefix = ""
					if (thisTag.length > 2) {
						prefix = thisTag.substring(2)
					}
					let varList = thisContent.split(cardParameters.parameterdelimiter)
					if (cardParameters.storagecharid && varList) {
						if (varType == "$") {
							//varList.forEach((element) => storeRollVar(cardParameters.storagecharid, prefix, element));
							varList.forEach((element) => storeVariable(storageCharID, prefix, element, "roll", cardParameters));
						}
						if (varType == "&") {
							//varList.forEach((element) => storeStringVar(cardParameters.storagecharid, prefix, element));
							varList.forEach((element) => storeVariable(storageCharID, prefix, element, "string", cardParameters));
						}
						if (varType == "@") {
							//varList.forEach((element) => storeArray(cardParameters.storagecharid, prefix, element));
							varList.forEach((element) => storeVariable(storageCharID, prefix, element, "array", cardParameters));
						}
						if (varType == ":") {
							//varList.forEach((element) => storeHashTable(cardParameters.storagecharid, prefix, element));
							varList.forEach((element) => storeVariable(storageCharID, prefix, element, "hash", cardParameters));
						}
						if (varType == "#") {
							if (thisContent.toLowerCase().trim() == "allsettings") {
								varList = [];
								for (var key in cardParameters) {
									if (cardParameters[key] !== defaultParameters[key]) {
										if (key != "storagecharid") {
											varList.push(key);
										}
									}
								}
							}
							//varList.forEach((element) => storeSetting(cardParameters.storagecharid, prefix, element.toLowerCase(), 
							varList.forEach((element) => storeVariable(storageCharID, prefix, element, "setting", cardParameters));
						}
					}
				}
			}
		} catch (e) {
			log(`Error stashing content ${e.message}, thisTag: ${thisTag}, thisContent: ${thisContent}`)
		}
	}

	function handleLoadCommands(thisTag, thisContent, cardParameters) {
		try {
			if (thisTag.charAt(0).toLowerCase() == "l") {
				switch (thisTag.substring(1).toLowerCase()) {
					case "rollvariables":
						if (thisContent.trim().length > 0 && state[APINAME].storedVariables[thisContent.trim()] != null) {
							newVariables = state[APINAME].storedVariables[thisContent.trim()];
							for (var key in newVariables) {
								rollVariables[key] = JSON.parse(JSON.stringify(newVariables[key]));
							}
						}
						break;

					case "stringvariables":
						if (thisContent.trim().length > 0 && state[APINAME].storedStrings[thisContent.trim()] != null) {
							newVariables = state[APINAME].storedStrings[thisContent.trim()];
							for (var key in newVariables) {
								stringVariables[key] = JSON.parse(JSON.stringify(newVariables[key]));
							}
						}
						break;

					case "settings":
						if (thisContent.trim().length > 0) {
							if (thisContent.trim().length > 0 && state[APINAME].storedSettings[thisContent.trim()] != null) {
								newSettings = state[APINAME].storedSettings[thisContent.trim()];
								for (var key in newSettings) {
									cardParameters[key] = newSettings[key];
								}
							} else {
								log(`Attempt to load stored settings ${thisContent.trim()}, but setting list not found.`)
							}
						}
						break;
				}
				if ("$&@#:".includes(thisTag.charAt(1))) {
					var varType = thisTag.charAt(1)
					var prefix = ""
					if (thisTag.length > 2) {
						prefix = thisTag.substring(2)
					}
					let varList = thisContent.split(cardParameters.parameterdelimiter)
					if (cardParameters.storagecharid && varList) {
						var thisType = "unknown";
						switch (varType) {
							case "$": thisType = "roll"; break;
							case "&": thisType = "string"; break;
							case "@": thisType = "array"; break;
							case ":": thisType = "hash"; break;
						}
						if (!(thisType === "unknown")) {
							varList.forEach((element) => loadVariable(cardParameters.storagecharid, prefix, element, thisType, cardParameters));
						} else {
							if (varType == "#") {
								thisType = "setting";
								if (thisContent.toLowerCase().trim() == "allsettings") {
									varList = [];
									for (var key in cardParameters) {
										if (key != "storagecharid") {
											varList.push(key);
										}
									}
								}
								varList.forEach((element) => loadVariable(cardParameters.storagecharid, prefix, element, thisType, cardParameters));
							}
						}
					}
				}

			}
		} catch (e) {
			log(`Error loading stashed content ${e.message}, thisTag: ${thisTag}, thisContent: ${thisContent}`)
		}
	}

	function handleBlockEndCommand(thisTag, thisContent, cardLines) {
		try {
			if (thisContent.charAt(0) === "[") {
				if (lastBlockAction === "S") {
					lastBlockAction = "";
				}
				if (lastBlockAction === "E") {
					var line = lineCounter;
					for (line = lineCounter + 1; line < cardLines.length; line++) {
						if (getLineTag(cardLines[line], line, "").trim() === "]") {
							lineCounter = line;
							break;
						}
					}
					if (lineCounter > cardLines.length) {
						log(`ScriptCards: Warning - no end block marker found for block started on line ${lineCounter}`);
						lineCounter = cardLines.length + 1;
					}
					lastBlockAction = "";
				}
			} else {
				lastBlockAction = "";
			}
		} catch (e) {
			log(`Error ending block statement ${e.message}, thisTag: ${thisTag}, thisContent: ${thisContent}`)
		}
	}

	async function handleFunctionCommands(thisTag, thisContent, cardParameters, msg) {
		try {
			var variableName = thisTag.substring(1);
			var params = thisContent.split(cardParameters.parameterdelimiter);
			switch (params[0].toLowerCase()) {
				case "character":
					if (params.length >= 4) {
						switch (params[1].toLowerCase()) {
							case "runability":
								var charid = undefined
								var char = getObj("character", params[2]);
								if (char === undefined) {
									var actualToken = getObj("graphic", params[2]);
									if (actualToken != null) {
										charid = actualToken.get("represents");
										char = getObj("character", charid);
									}
								} else {
									charid = char.get("_id");
								}
								if (char != null) {
									var abilname = params[3]
									var ability = findObjs({ type: "ability", _characterid: charid, name: abilname })
									//if (ability != null && ability !== []) {
									if (Array.isArray(ability) && ability.length > 0) {
										ability = ability[0]
										if (ability != null) {
											sendChat(char.get("name"), ability.get('action').replace(/@\{([^|]*?|[^|]*?\|max|[^|]*?\|current)\}/g, '@{' + (char.get('name')) + '|$1}'));
										}
									}
								}
								break;
						}
					}
					break;

				case "system":
					if (params.length >= 3) {
						switch (params[1].toLowerCase()) {
							case "date":
								var d = new Date();
								switch (params[2].toLowerCase()) {
									case "getdatetime":
										//log(cardParameters.locale);
										try {
											stringVariables[variableName] = d.toLocaleString(cardParameters.locale, { timeZone: cardParameters.timezone });
										} catch {
											stringVariables[variableName] = "Unknown/Invalid Locale or TimeZone";
										}
										break;
									case "gettime":
										try {
											stringVariables[variableName] = d.toLocaleTimeString(cardParameters.locale, { timeZone: cardParameters.timezone });
										} catch {
											stringVariables[variableName] = "Unknown/Invalid Locale or TimeZone";
										}
										break;
									case "getdate":
										try {
											stringVariables[variableName] = d.toLocaleDateString(cardParameters.locale, { timeZone: cardParameters.timezone });
										} catch {
											stringVariables[variableName] = "Unknown/Invalid Locale or TimeZone";
										}
										break;
									case "getraw":
									case "gettimestamp":
										stringVariables[variableName] = d.getTime();
										break;
								}
								break;

							case "playerisgm":
								stringVariables[variableName] = playerIsGM(params[2] || "") ? 1 : 0
								break;

							case "runaction":
							case "runability":
								var ability = findObjs({ type: "ability", _characterid: params[2], name: params[3] });
								var metacard = ability[0].get("action")
								if (Array.isArray(ability) && ability.length > 0) {
									for (let x = 4; x < params.length; x++) {
										metacard = metacard.replace(`[REPL${x - 3}]`, params[x])
									}
									metacard = metacard.replaceAll("-_-_", "--")
									sendChat("API", metacard);
								}
								break;

							case "readsetting":
								stringVariables[variableName] = cardParameters[params[2].toLowerCase()] || "UnknownSetting";
								break;

							case "dumpvariables":
								switch (params[2].toLowerCase()) {
									case "rolls":
										for (var key in rollVariables) {
											log(`RollVariable: ${key}, Value: ${rollVariables[key]}`)
										}
										break;

									case "string":
										for (var key in stringVariables) {
											log(`StringVariable: ${key}, Value: ${stringVariables[key]}`)
										}
										break;

									case "array":
										for (var key in arrayVariables) {
											log(`ArrayVariable: ${key}, Value: ${arrayVariables[key]}`)
										}
										break;

									case "hash":
									case "hashtable":
									case "hashtables":
										for (var key in hashTables) {
											log(`Hash: ${key}, Value: ${JSON.stringify(hashTables[key])}`)
										}
										break
								}
								break;

							case "findability":
								// Params: 2-character name, 3-ability name
								stringVariables[variableName] = "AbilityNotFound";
								var theChar = findObjs({ _type: "character", name: params[2] });
								if (theChar[0]) {
									var theAbility = findObjs({ _type: "ability", _characterid: theChar[0].id, name: params[3] });
									if (theAbility[0]) {
										stringVariables[variableName] = theAbility[0].id;
									}
								}
								break;

							case "dropoutputlines":
								if (params[2].toLowerCase() == "all" || params[2].toLowerCase() == "both" || params[2].toLowerCase() == "direct") {
									outputLines = [];
									bareoutputLines = [];
								}
								if (params[2].toLowerCase() == "all" || params[2].toLowerCase() == "both" || params[2].toLowerCase() == "gmonly") {
									gmonlyLines = [];
								}
						}
					}
					break;

				case "roll":
				case "rollvar":
				case "rollvariable":
					switch (params[1].toLowerCase()) {
						case "sethilight":
						case "sethighlight":
						case "setrollhighlight":
						case "sethighlightmode":
						case "sethilightmode":
							if (params[3].toLowerCase() == "none") {
								rollVariables[params[2]].Style = cardParameters.stylenormal;
							}
							if (params[3].toLowerCase() == "crit" || params[3].toLowerCase() == "critical") {
								rollVariables[params[2]].Style = cardParameters.stylecrit;
							}
							if (params[3].toLowerCase() == "fumble") {
								rollVariables[params[2]].Style = cardParameters.stylefumble;
							}
							if (params[3].toLowerCase() == "both") {
								rollVariables[params[2]].Style = cardParameters.styleboth;
							}
							break;
					}
					break;

				case "repeatingrow": {
					const repeatingRowOperation = String(params[1] || "").toLowerCase();

					if (String(cardParameters.beaconsheet) === "1" && repeatingRowOperation === "copybyindex") {
						stringVariables["SC_LAST_CREATED_ROWID"] = "";
						if (params.length < 6 || params.length > 7) {
							log(
								`ScriptCards Error: Beacon repeatingrow;copybyindex requires ` +
								`SourceCharacterID;DestinationCharacterID;source_repeating_section_name;row_index` +
								` and accepts an optional destination_repeating_section_name.`
							);
							break;
						}

						const sourceCharacter = getObj("character", params[2]);
						const destCharacter = getObj("character", params[3]);
						if (!sourceCharacter) {
							log(`ScriptCards Error: Unable to find source character ${params[2]} for Beacon repeatingrow;copybyindex.`);
							break;
						}
						if (!destCharacter) {
							log(`ScriptCards Error: Unable to find destination character ${params[3]} for Beacon repeatingrow;copybyindex.`);
							break;
						}

						const copied = await copyBeaconRepeatingRowByIndex(
							sourceCharacter.id,
							destCharacter.id,
							params[4],
							params[6] || params[4],
							params[5],
							cardParameters.debug == 1
						);
						if (copied.success) {
							stringVariables["SC_LAST_CREATED_ROWID"] = copied.rowId;
						} else {
							log(`ScriptCards Error: Beacon repeatingrow;copybyindex failed: ${copied.error}.`);
						}
						break;
					}

					if (String(cardParameters.beaconsheet) === "1" && repeatingRowOperation === "copybyfieldmatch") {
						stringVariables["SC_LAST_CREATED_ROWID"] = "";
						if (params.length < 7 || params.length > 8) {
							log(
								`ScriptCards Error: Beacon repeatingrow;copybyfieldmatch requires ` +
								`SourceCharacterID;DestinationCharacterID;source_repeating_section_name;field_name;field_value` +
								` and accepts an optional destination_repeating_section_name.`
							);
							break;
						}

						const sourceCharacter = getObj("character", params[2]);
						const destCharacter = getObj("character", params[3]);
						if (!sourceCharacter) {
							log(`ScriptCards Error: Unable to find source character ${params[2]} for Beacon repeatingrow;copybyfieldmatch.`);
							break;
						}
						if (!destCharacter) {
							log(`ScriptCards Error: Unable to find destination character ${params[3]} for Beacon repeatingrow;copybyfieldmatch.`);
							break;
						}

						const copied = await copyBeaconRepeatingRowByFieldMatch(
							sourceCharacter.id,
							destCharacter.id,
							params[4],
							params[7] || params[4],
							params[5],
							params[6],
							cardParameters.debug == 1
						);
						if (copied.success) {
							stringVariables["SC_LAST_CREATED_ROWID"] = copied.rowId;
						} else if (copied.noMatch) {
							if (cardParameters.debug == 1) {
								log(`ScriptCards Beacon repeatingrow;copybyfieldmatch: ${copied.error}.`);
							}
						} else {
							log(`ScriptCards Error: Beacon repeatingrow;copybyfieldmatch failed: ${copied.error}.`);
						}
						break;
					}

					if (String(cardParameters.beaconsheet) === "1" && repeatingRowOperation === "copyfromdatagrid") {
						stringVariables["SC_LAST_CREATED_ROWID"] = "";
						log(
							`ScriptCards Error: Beacon repeatingrow;copyfromdatagrid is not supported because ` +
							`data-grid rows do not define canonical Beacon record structure. ` +
							`No Roll20 Attribute objects were created.`
						);
						break;
					}

					var variableName = thisTag.substring(1);
					if (params.length >= 6) {
						if (params[1].toLowerCase() == "copybyindex") {
							let sourceCharacter = getObj("character", params[2]);
							let destCharacter = getObj("character", params[3]);
							let section = params[4];
							let sourceRow = params[5];
							let destRepeatinSection = section;
							if (params[6]) { destRepeatinSection = params[6]; }
							stringVariables["SC_LAST_CREATED_ROWID"] = "";

							if (!sourceCharacter) {
								log(`ScriptCards Error: Unable to find source character ${params[2]} for repeatingrow;copybyindex.`);
								break;
							}
							if (!destCharacter) {
								log(`ScriptCards Error: Unable to find destination character ${params[3]} for repeatingrow;copybyindex.`);
								break;
							}


							repeatingSectionIDs = getRepeatingSectionIDs(params[2], params[4]);
							if (repeatingSectionIDs) {
								repeatingIndex = Number(sourceRow);
								repeatingCharID = sourceCharacter.id;
								repeatingSectionName = section;
								fillCharAttrs(findObjs({ _type: 'attribute', _characterid: repeatingCharID }));
								repeatingSection = getSectionAttrsByID(repeatingCharID, repeatingSectionName, repeatingSectionIDs[repeatingIndex], "-|-");

								copyRepeatingSectionRow(destCharacter, repeatingSectionName, repeatingSection, "-|-", destRepeatinSection);
							}
						}
					}

					if (params.length >= 7) {
						if (params[1].toLowerCase() == "copybyfieldmatch") {
							let sourceCharacter = getObj("character", params[2]);
							let destCharacter = getObj("character", params[3]);
							let section = params[4];
							let matchField = params[5];
							let matchValue = params[6];
							let destRepeatinSection = section;
							if (params[7]) { destRepeatinSection = params[7]; }
							stringVariables["SC_LAST_CREATED_ROWID"] = "";

							if (!sourceCharacter) {
								log(`ScriptCards Error: Unable to find source character ${params[2]} for repeatingrow;copybyfieldmatch.`);
								break;
							}
							if (!destCharacter) {
								log(`ScriptCards Error: Unable to find destination character ${params[3]} for repeatingrow;copybyfieldmatch.`);
								break;
							}


							repeatingSectionIDs = getRepeatingSectionIDs(params[2], params[4]);
							if (repeatingSectionIDs) {
								repeatingCharID = sourceCharacter.id;
								repeatingSectionName = section;
								fillCharAttrs(findObjs({ _type: 'attribute', _characterid: repeatingCharID }));
								repeatingSection = getSectionAttrsEx(sourceCharacter.id, matchValue, section, matchField, true, "-|-");
								if (Array.isArray(repeatingSection) && repeatingSection.length > 0) {
									copyRepeatingSectionRow(destCharacter, repeatingSectionName, repeatingSection, "-|-", destRepeatinSection);
								}
							} else if (cardParameters.debug == 1) {
								log(`ScriptCards repeatingrow;copybyfieldmatch: no source repeating rows were found in ${section}.`);
							}
						}
					}

					if (params[1].toLowerCase() == "copyfromdatagrid") {
						// copyfromdatagrid;characterid;section;datagrid;row-or-column=value
						//
						// Examples:
						// copyfromdatagrid;-ABC123;repeatingattack;Items;5
						// copyfromdatagrid;-ABC123;repeatingattack;Items;Name=Longsword

						let destCharacter = getObj("character", params[2]);
						let repeatingSectionName = params[3];
						let gridName = params[4];
						let rowReference = params[5];
						let rowIndex = rowReference;

						if (!destCharacter) {
							log(
								`ScriptCards Error: Unable to find destination character ` +
								`${params[2]} for repeating row copy.`
							);
							break;
						}

						if (!dataGrids[gridName]) {
							log(
								`ScriptCards Error: Data grid ${gridName} does not exist.`
							);
							break;
						}

						// If the row reference contains "=", treat it as
						// a Column=Value lookup.
						if (rowReference.indexOf("=") > -1) {
							let equalsPos = rowReference.indexOf("=");
							let searchColumn = rowReference
								.substring(0, equalsPos)
								.trim();

							let searchValue = rowReference
								.substring(equalsPos + 1)
								.trim();

							rowIndex = undefined;

							for (let rowNum in dataGrids[gridName]) {
								if (
									dataGrids[gridName].hasOwnProperty(rowNum) &&
									dataGrids[gridName][rowNum][searchColumn] !== undefined &&
									dataGrids[gridName][rowNum][searchColumn] === searchValue
								) {
									rowIndex = rowNum;
									break;
								}
							}

							log(
								`Data Grid Search: ${gridName}, ` +
								`${searchColumn}=${searchValue}, ` +
								`Found Row: ${rowIndex}`
							);
						}

						if (
							rowIndex === undefined ||
							!dataGrids[gridName][rowIndex]
						) {
							log(
								`ScriptCards Error: Unable to find data grid row ` +
								`${rowReference} in grid ${gridName}.`
							);
							break;
						}

						let gridRow = dataGrids[gridName][rowIndex];
						let newRowID = generateRowID();

						stringVariables["SC_LAST_CREATED_ROWID"] = newRowID;

						for (let fieldName in gridRow) {
							if (!gridRow.hasOwnProperty(fieldName)) {
								continue;
							}

							// Fields beginning with "__" are metadata and
							// should not be copied to the repeating row.
							if (fieldName.indexOf("__") === 0) {
								continue;
							}

							let attrValue = gridRow[fieldName];

							try {
								let newAttribute = createObj("attribute", {
									name:
										`${repeatingSectionName}_` +
										`${newRowID}_` +
										`${fieldName}`,
									_characterid: destCharacter.id,
									current: "",
									max: ""
								});

								newAttribute.setWithWorker({
									current:
										attrValue !== undefined &&
											attrValue !== null
											? String(attrValue)
											: ""
								});
							} catch (err) {
								log(
									`Error creating repeating section field ` +
									`${fieldName}: ${err}`
								);
							}
						}

						log(
							`ScriptCards: Created repeating row ${newRowID} ` +
							`in ${repeatingSectionName} from ` +
							`${gridName} row ${rowIndex}.`
						);
					}
					break;
				}

				case "turnorder":
					var variableName = thisTag.substring(1);
					if (params.length >= 2) {
						if (params[1].toLowerCase() == "clear") {
							Campaign().set("turnorder", "");
						}
						if ((params[1].toLowerCase() == "next") || params[1].toLowerCase() == "advance") {
							let turnorder = [];
							if (Campaign().get("turnorder") !== "") {
								turnorder = JSON.parse(Campaign().get("turnorder"));
							}
							if (turnorder.length > 0) {
								let currentTurn = turnorder.shift(); // Remove first element
								turnorder.push(currentTurn); // Add it to the end
								Campaign().set("turnorder", JSON.stringify(turnorder));
							}
						}
						if ((params[1].toLowerCase() == "previous") || params[1].toLowerCase() == "rewind") {
							let turnorder = [];
							if (Campaign().get("turnorder") !== "") {
								turnorder = JSON.parse(Campaign().get("turnorder"));
							}
							if (turnorder.length > 0) {
								let lastTurn = turnorder.pop(); // Remove last element
								turnorder.unshift(lastTurn); // Add it to the beginning
								Campaign().set("turnorder", JSON.stringify(turnorder));
							}
						}
						if (params[1].toLowerCase() == "getcurrentactor") {
							var turnorder = [];
							if (Campaign().get("turnorder") !== "") {
								turnorder = JSON.parse(Campaign().get("turnorder"));
							}
							//if (turnorder !== []) {
							if (Array.isArray(turnorder) && turnorder.length > 0) {
								stringVariables[variableName] = turnorder[0].id
							}
						}
						if (params[1].toLowerCase() == "sort") {
							var turnorder = [];
							if (Campaign().get("turnorder") !== "") {
								turnorder = JSON.parse(Campaign().get("turnorder"));
								turnorder.sort((a, b) => (Number(a.pr) > Number(b.pr)) ? 1 : ((Number(b.pr) > Number(a.pr)) ? -1 : 0))
								turnorder.reverse();
								Campaign().set("turnorder", JSON.stringify(turnorder));
							}
						}
					}
					if (params.length == 3) {
						if (params[1].toLowerCase() == "removetoken") {
							var turnorder = [];
							if (Campaign().get("turnorder") !== "") {
								turnorder = JSON.parse(Campaign().get("turnorder"));
							}
							for (var x = turnorder.length - 1; x >= 0; x--) {
								if (turnorder[x].id == params[2]) {
									turnorder.splice(x, 1);
								}
							}
							Campaign().set("turnorder", JSON.stringify(turnorder));
						}
						if (params[1].toLowerCase() == "removecustom") {
							var turnorder = [];
							if (Campaign().get("turnorder") !== "") {
								turnorder = JSON.parse(Campaign().get("turnorder"));
							}
							for (var x = turnorder.length - 1; x >= 0; x--) {
								if (turnorder[x].id == -1 && turnorder[x].custom == params[2]) {
									turnorder.splice(x, 1);
								}
							}
							Campaign().set("turnorder", JSON.stringify(turnorder));
						}
						if (params[1].toLowerCase() == "findtoken") {
							var turnorder = JSON.parse(Campaign().get("turnorder"));
							for (var x = turnorder.length - 1; x >= 0; x--) {
								if (turnorder[x].id.trim() == params[2].trim()) {
									stringVariables[variableName] = turnorder[x].pr;
									//log(`Set variable to ${turnorder[x].pr}`)
								}
							}
						}
						if (params[1].toLowerCase() == "sort") {
							var turnorder = [];
							if (Campaign().get("turnorder") !== "") {
								turnorder = JSON.parse(Campaign().get("turnorder"));
								turnorder.sort((a, b) => (Number(a.pr) > Number(b.pr)) ? 1 : ((Number(b.pr) > Number(a.pr)) ? -1 : 0))
								turnorder.reverse();
								if ((params[2].toLowerCase().startsWith("a"))) { turnorder.reverse(); }
								if ((params[2].toLowerCase().startsWith("u"))) { turnorder.reverse(); }
								Campaign().set("turnorder", JSON.stringify(turnorder));
							}
						}
					}
					if (params.length == 4 || params.length == 5 || params.length == 6 || params.length == 7) {
						if (params[1].toLowerCase() == "addtoken") {
							var turnorder = [];
							if (Campaign().get("turnorder") !== "") {
								turnorder = JSON.parse(Campaign().get("turnorder"));
							}
							var custom = params[4] || ""
							var formula = params[5] || ""
							var t = getObj('graphic', params[2]);
							if (t) {
								turnorder.push({
									id: params[2],
									pr: params[3],
									_pageid: t.get('pageid'),
									custom: custom,
									formula: formula
								});
							}
							Campaign().set("turnorder", JSON.stringify(turnorder));
						}
						if (params[1].toLowerCase() == "replacetoken") {
							var turnorder = [];
							if (Campaign().get("turnorder") !== "") {
								turnorder = JSON.parse(Campaign().get("turnorder"));
							}
							var wasfound = false;
							var custom = params[4] || ""
							var formula = params[5] || ""
							for (var x = turnorder.length - 1; x >= 0; x--) {
								if (turnorder[x].id.trim() == params[2].trim()) {
									turnorder[x].pr = params[3];
									turnorder[x].custom = custom;
									turnorder[x].formula = formula;
									wasfound = true;
								}
							}
							if (!wasfound) {
								var t = getObj('graphic', params[2]);
								if (t) {
									turnorder.push({
										id: params[2],
										pr: params[3],
										_pageid: t.get('pageid'),
										custom: custom,
										formula: formula
									});
								}
							}
							Campaign().set("turnorder", JSON.stringify(turnorder));
						}
						if (params[1].toLowerCase() == "addcustom") {
							var turnorder = [];
							if (Campaign().get("turnorder") !== "") {
								turnorder = JSON.parse(Campaign().get("turnorder"));
							}
							var custom = undefined || params[2]
							var pr = undefined || params[3]
							var formula = undefined || params[4]
							var insertionPoint = turnorder.length
							if (params[5]) {
								var insertion = params[5] || ""
								if (insertion !== "") {
									var foundIndex = -1
									if (insertion.toLowerCase() == "top") { insertionPoint = 0 }
									if (insertion.toLowerCase() == "bottom") { insertionPoint = turnorder.length }
									for (let to = 0; to < turnorder.length; to++) {
										if (turnorder[to].id == insertion.substring(insertion.indexOf(":") + 1)) {
											foundIndex = to
										}
									}
									if (foundIndex != -1) {
										if (insertion.toLowerCase().startsWith("before:") || insertion.toLowerCase().startsWith("above:")) {
											insertionPoint = foundIndex
										}
										if (insertion.toLowerCase().startsWith("after:") || insertion.toLowerCase().startsWith("below:")) {
											insertionPoint = foundIndex + 1
										}
									}
								}
							}
							turnorder.splice(insertionPoint, 0, {
								id: "-1",
								pr: pr,
								_pageid: Campaign().get('playerpageid'),
								custom: custom,
								formula: formula,
							});

							Campaign().set("turnorder", JSON.stringify(turnorder));
						}
					}
					break;

				// Chebyshev Unit distance between two tokens (params[1] and params[2]) (4E/5E)
				case "chebyshevdistance":
				case "distance":
				case "euclideandistance":
				case "manhattandistance":
				case "taxicabdistance":
					var result = 0;
					if (params.length >= 3) {
						let token1 = getObj("graphic", params[1]);
						let token2 = getObj("graphic", params[2]);
						if (token1 != null && token2 != null) {
							try {
								let scale = 1.0;
								let page = getObj("page", token1.get("_pageid"));
								if (page) { scale = page.get("snapping_increment") }
								let t1 = getTokenCoords(token1, scale)
								let t2 = getTokenCoords(token2, scale)
								if (params[0].toLowerCase() == "distance" || params[0].toLowerCase() == "chebyshevdistance") {
									result = Math.floor(Math.max(Math.abs(t1.x - t2.x), Math.abs(t1.y - t2.y)));
								}
								if (params[0].toLowerCase() == "euclideandistance") {
									result = Math.floor(Math.sqrt(Math.pow((t1.x - t2.x), 2) + Math.pow((t1.y - t2.y), 2)));
								}
								if (params[0].toLowerCase() == "manhattandistance" || params[0].toLowerCase() == "taxicabdistance") {
									result = Math.abs(t2.x - t1.x) + Math.abs(t2.y - t1.y);
								}
							} catch {
								result = 0;
							}
						}
					}
					rollVariables[variableName] = await parseDiceRoll(result.toString(), cardParameters);
					break;

				case "euclideanpixel":
				case "euclideanlong":
					var result = 0;
					if (params.length >= 3) {
						var token1 = getObj("graphic", params[1]);
						var token2 = getObj("graphic", params[2]);
						if (token1 != null && token2 != null) {
							try {
								var scale = 1.0;
								var page = getObj("page", token1.get("_pageid"));
								if (page) { scale = page.get("snapping_increment") }
								// Calculate the euclidean unit distance between two tokens (params[1] and params[2])
								let t1 = getTokenCoords(token1, (1 / 70))
								let t2 = getTokenCoords(token2, (1 / 70))
								result = Math.floor(Math.sqrt(Math.pow((t1.x - t2.x), 2) + Math.pow((t1.y - t2.y), 2)));
								if (params[0].toLowerCase() == "euclideanlong") { result = result / (scale * 70); }
							} catch {
								result = 0;
							}
						}
					}
					rollVariables[variableName] = await parseDiceRoll(result.toString(), cardParameters);
					break;

				case "getselected":
					if (msg.selected) {
						for (var x = 0; x < msg.selected.length; x++) {
							var obj = getObj(msg.selected[x]._type, msg.selected[x]._id);
							stringVariables[variableName + (x + 1).toString()] = obj.get("id");
						}
						stringVariables[variableName + "Count"] = msg.selected.length.toString();
						rollVariables[variableName + "Count"] = await parseDiceRoll(msg.selected.length.toString(), cardParameters);
					} else {
						stringVariables[variableName + "Count"] = "0";
						rollVariables[variableName + "Count"] = await parseDiceRoll("0", cardParameters);
					}
					break;

				case "stateitem":
					if (params.length == 3) {
						switch (params[1].toLowerCase()) {
							case "write":
								if (params[2].toLowerCase() == "rollvariable") {
									if (rollVariables[variableName]) {
										state[APINAME].storedRollVariable = Object.assign(rollVariables[variableName]);
									}
								}
								if (params[2].toLowerCase() == "stringvariable") {
									if (stringVariables[variableName]) {
										state[APINAME].storedStringVariable = Object.assign(stringVariables[variableName]);
									}
								}
								if (params[2].toLowerCase() == "array") {
									if (arrayVariables[variableName]) {
										state[APINAME].storedArrayVariable = Object.assign(arrayVariables[variableName]);
										state[APINAME].storedArrayIndex = Object.assign(arrayIndexes[variableName]);
									}
								}
								break;

							case "read":
								if (params[2].toLowerCase() == "rollvariable") {
									if (state[APINAME].storedRollVariable) { rollVariables[variableName] = Object.assign(state[APINAME].storedRollVariable); }
								}
								if (params[2].toLowerCase() == "stringvariable") {
									if (state[APINAME].storedStringVariable) { stringVariables[variableName] = Object.assign(state[APINAME].storedStringVariable); }
								}
								if (params[2].toLowerCase() == "array") {
									if (state[APINAME].storedArrayVariable) {
										arrayVariables[variableName] = Object.assign(state[APINAME].storedArrayVariable);
										arrayIndexes[variableName] = Object.assign(state[APINAME].storedArrayIndex);
									}
								}
								break;
						}
					}
					break;

				case "math": //min,max,clamp,round,floor,ceil
				case "round":
				case "range":
					switch (params[1].toLowerCase()) {
						case "min":
						case "max":
							if (params.length == 4) {
								let val1 = await parseDiceRoll(params[2], cardParameters);
								let val2 = await parseDiceRoll(params[3], cardParameters);
								rollVariables[variableName] = params[1].toLowerCase() == "min" ? (val1.Total <= val2.Total ? val1 : val2) :
									val1.Total >= val2.Total ? val1 : val2;
							}
							break;

						case "abs":
							if (params.length == 3 && !isNaN(parseFloat((params[2])))) {
								rollVariables[variableName] = await parseDiceRoll(Math.abs(parseFloat(params[2])), cardParameters)
							}
							break;

						case "sqrt":
						case "squareroot":
							if (params.length == 3 && !isNaN(parseFloat((params[2])))) {
								rollVariables[variableName] = await parseDiceRoll(Math.sqrt(parseFloat(params[2])), cardParameters)
							}
							break;

						case "clamp":
							if (params.length == 5) {
								let val = await parseDiceRoll(params[2], cardParameters);
								let lower = await parseDiceRoll(params[3], cardParameters);
								let upper = await parseDiceRoll(params[4], cardParameters);
								val.Total >= lower.Total && val.Total <= upper.Total ? rollVariables[variableName] = val :
									val.Total < lower.Total ? rollVariables[variableName] = lower : rollVariables[variableName] = upper;
							}
							break;
					}

					if (params.length == 3) {
						if (params[1].toLowerCase() == "down" || params[1].toLowerCase() == "floor") {
							rollVariables[variableName] = await parseDiceRoll(Math.floor(Number(params[2])).toString(), cardParameters);
						}
						if (params[1].toLowerCase() == "up" || params[1].toLowerCase() == "ceil") {
							rollVariables[variableName] = await parseDiceRoll(Math.ceil(Number(params[2])).toString(), cardParameters);
						}
						if (params[1].toLowerCase() == "closest" || params[1].toLowerCase() == "round") {
							rollVariables[variableName] = await parseDiceRoll(Math.round(Number(params[2])).toString(), cardParameters);
						}
					}

					if (params.length == 4 && params[1].toLowerCase() == "angle") {
						var token1 = getObj("graphic", params[2]);
						var token2 = getObj("graphic", params[3]);
						if (token1 && token2) {
							var angle = Math.atan2(token2.get("top") - token1.get("top"), token2.get("left") - token1.get("left"));
							angle *= 180 / Math.PI;
							angle -= 270;
							while (angle < 0) { angle = 360 + angle }
							stringVariables[variableName] = angle;
						}
					}
					break;

				case "attribute":
					if (params.length > 4) {
						if (params[1].toLowerCase() == "set") {
							if (String(cardParameters.beaconsheet) === "1") {
								const beaconAttributeResult = await setBeaconAttributeFunction(
									params[2],
									params[3],
									params[4],
									cardParameters.debug === "1"
								);
								if (!beaconAttributeResult.success) {
									log(`ScriptCards Error: Beacon attribute;set failed: ${beaconAttributeResult.error}.`);
								}
								break;
							}
							var theCharacter = getObj("character", params[2]);
							if (theCharacter) {
								var oldAttrs = findObjs({ _type: "attribute", _characterid: params[2], name: params[3].trim() });
								if (oldAttrs.length > 0) {
									oldAttrs.forEach(function (element) { element.remove(); });
								}
								if (params[4] !== "") {
									createObj("attribute", { _characterid: params[2], name: params[3].trim(), current: params[4].trim() });
								}
							}
						}
					}
					break;

				case "stringfuncs": // strlength, substring, replace, split, before, after
				case "strings":
				case "string":
					if (params.length == 3) {
						switch (params[1].toLowerCase()) {
							//stringfuncs;strlength;string
							case "strlength":
							case "length":
								rollVariables[variableName] = await parseDiceRoll((params[2].length.toString()), cardParameters)
								break;

							case "tolowercase":
								await setStringOrArrayElement(variableName, params[2].toLowerCase(), cardParameters)
								break;

							case "touppercase":
								await setStringOrArrayElement(variableName, params[2].toUpperCase(), cardParameters)
								break;

							case "striphtml":
								await setStringOrArrayElement(variableName, params[2].replace(/<[^>]*>?/gm, ''), cardParameters)
								break;

							case "striplinefeeds":
							case "linefeedstobr":
							case "linefeedstobrs":
								await setStringOrArrayElement(variableName, params[2].replace(/\r?\n/gm, "<br>"), cardParameters)
								break;

							case "brtolinefeed":
							case "brtolinefeeds":
							case "brstolinefeed":
							case "brstolinefeeds":
								await setStringOrArrayElement(variableName, params[2].replace(/<br\s*\/?>/gi, '\n'), cardParameters)
								break;


							case "trim":
								await setStringOrArrayElement(variableName, params[2].trim(), cardParameters)
								break;

							case "onlynumbers":
								var tempvalue = params[2].trim().startsWith("-") ? "-" : "";
								tempvalue += params[2].replace(/\D/g, '')
								await setStringOrArrayElement(variableName, tempvalue, cardParameters)
								break;

							case "nonumbers":
								await setStringOrArrayElement(variableName, params[2].replace(/\d/g, ''), cardParameters)
								break;

							case "totitlecase":
								await setStringOrArrayElement(variableName,
									params[2].toLowerCase()
										.split(' ')
										.map(function (word) {
											return (word.charAt(0).toUpperCase() + word.slice(1));
										})
										.join(" "),
									cardParameters);
								break;

							case "bytes":
								for (let z = 0; z < stringVariables[params[2]].length; z++) {
									log(stringVariables[params[2]].charCodeAt(z))
								}
								break;
						}
					}

					if (params.length == 4) {
						switch (params[1].toLowerCase()) {
							//stringfuncs;split;delimeter;string
							case "split":
								var splits = params[3].split(params[2]);
								rollVariables[variableName + "Count"] = await parseDiceRoll(splits.length.toString(), cardParameters);
								for (var x = 0; x < splits.length; x++) {
									stringVariables[variableName + (x + 1).toString()] = splits[x];
								}
								break;

							//stringfuncs;before;delimiter;string
							case "before":
								if (params[3].indexOf(params[2]) < 0) {
									await setStringOrArrayElement(variableName, params[3], cardParameters)
								} else {
									await setStringOrArrayElement(variableName, params[3].substring(0, params[3].indexOf(params[2])), cardParameters);
								}
								break;

							//stringfuncs;after;delimeter;string
							case "after":
								if (params[3].indexOf(params[2]) < 0) {
									await setStringOrArrayElement(variableName, params[3], cardParameters)
								} else {
									await setStringOrArrayElement(variableName, params[3].substring(params[3].indexOf(params[2]) + params[2].length), cardParameters);
								}
								break;

							//stringfuncs;left;count;string
							case "left":
								if (params[3].length < Number(params[2])) {
									await setStringOrArrayElement(variableName, params[3], cardParameters)
								} else {
									await setStringOrArrayElement(variableName, params[3].substring(0, Number(params[2])), cardParameters);
								}
								break;

							//stringfuncs;right;count;string
							case "right":
								if (params[3].length < Number(params[2])) {
									await setStringOrArrayElement(variableName, params[3], cardParameters)
								} else {
									await setStringOrArrayElement(variableName, params[3].substring(params[3].length - Number(params[2])), cardParameters);
								}
								break;

							case "stripchars":
								var str = params[3]
								for (var i = 0; i < params[2].length; i++) {
									while (str.includes(params[2].substring(i, i + 1))) {
										str = str.replace(params[2].substring(i, i + 1), "")
									}
								}
								await setStringOrArrayElement(variableName, str, cardParameters);
								break;

						}
					}

					if (params.length == 5) {
						switch (params[1].toLowerCase()) {
							//stringfuncs0;substring1;start2;length3;string4
							case "substring":
								await setStringOrArrayElement(variableName, params[4].substring(Number(params[2]) - 1, Number(params[3]) + Number(params[2]) - 1), cardParameters);
								break;

							case "replace":
								await setStringOrArrayElement(variableName, params[4].replace(params[2], params[3]), cardParameters);
								break;

							case "replaceall":
								if (!params[3].includes(params[2])) {
									var str = params[4];
									while (str.includes(params[2])) { str = str.replace(params[2], params[3]) }
									await setStringOrArrayElement(variableName, str, cardParameters);
								}
								break;
						}
					}

					if (params.length > 2) {
						switch (params[1].toLowerCase()) {
							case "replaceencoding":
								var tempparams = Object.assign(params);
								tempparams.shift();
								tempparams.shift();
								var tempString = tempparams.join();
								for (let zz = 0; zz < EncodingReplaements.length; zz++) {
									let f = EncodingReplaements[zz].split(":")[0]
									let r = EncodingReplaements[zz].split(":")[1]
									if (f && tempString && r) {
										tempString = tempString.replaceAll(f.toUpperCase(), r);
										tempString = tempString.replaceAll(f.toLowerCase(), r);
									}
								}
								if (variableName) { await setStringOrArrayElement(variableName, tempString, cardParameters) }
								break;
						}
					}
					break;

				case "datagrid":
					if (params[1].toLowerCase() == "fromhandout") {
						// fromhandout;hashname;handoutname/id;field;qualifier;delimiter
						//
						// Examples:
						// fromhandout;TestDG;My Handout;notes;",;
						// fromhandout;TestDG;My Handout;notes;";|
						//
						// Structure:
						// {
						//     "rownum": {
						//         "columnname1": "value1",
						//         "columnname2": "value2"
						//     }
						// }

						let tableName = params[2];
						dataGrids[tableName] = {};

						let handoutName = params[3];
						let handoutField = (params[4] || "notes").trim().toLowerCase();
						let textQualifier = params[5] || "`";
						let delimiter = params[6] || ",";

						if (
							handoutField !== "notes" &&
							handoutField !== "gmnotes"
						) {
							//log(`ScriptCards Error: Invalid handout field ` + `[${handoutField}]. Defaulting to notes.`							);
							handoutField = "notes";
						}

						let handoutFormat = "csv";
						let handout = undefined;

						// Parse a single delimited line, respecting an optional text qualifier.
						let parseDelimitedLine = function (line, delimiter, qualifier) {
							//log(`ScriptCards: Parsing line "${line}" with delimiter "${delimiter}" and qualifier "${qualifier}".`);
							let values = [];
							let currentValue = "";
							let inQualifiedValue = false;

							// Defensive normalization. An empty delimiter would otherwise
							// cause the parsing loop to never advance.
							if (
								typeof delimiter !== "string" ||
								delimiter.length === 0
							) {
								delimiter = ",";
							}

							if (typeof qualifier !== "string") {
								qualifier = "";
							}

							for (let i = 0; i < line.length; i++) {
								let currentChar = line[i];

								// Handle qualifier characters.
								if (
									qualifier.length > 0 &&
									line.substring(i, i + qualifier.length) === qualifier
								) {
									// A doubled qualifier inside a qualified value represents
									// a literal qualifier.
									if (
										inQualifiedValue &&
										line.substring(
											i + qualifier.length,
											i + (qualifier.length * 2)
										) === qualifier
									) {
										currentValue += qualifier;
										i += (qualifier.length * 2) - 1;
									} else {
										inQualifiedValue = !inQualifiedValue;
										i += qualifier.length - 1;
									}
								}

								// Only recognize delimiters outside qualified fields.
								else if (
									!inQualifiedValue &&
									line.substring(i, i + delimiter.length) === delimiter
								) {
									values.push(currentValue.trim());
									currentValue = "";

									i += delimiter.length - 1;
								}

								else {
									currentValue += currentChar;
								}
							}

							values.push(currentValue.trim());

							return values;
						};

						//log(`ScriptCards: Loading handout ${handoutName} into data grid ${tableName}.`);
						try {
							handout = findObjs({
								type: "handout",
								name: handoutName
							})[0];
						} catch (e) {
						}

						if (!handout) {
							try {
								handout = findObjs({
									type: "handout",
									id: handoutName
								})[0];
							} catch (e) {
							}
						}

						//log(`ScriptCards: Handout ${handoutName} found: ${handout ? "Yes" : "No"}.`);

						if (handout) {
							if (handoutFormat.toLowerCase() == "csv") {
								//log(`ScriptCards: tableName      = [${tableName}]`);
								//log(`ScriptCards: handoutName    = [${handoutName}]`);
								//log(`ScriptCards: handoutField   = [${handoutField}]`);
								//log(`ScriptCards: textQualifier  = [${textQualifier}]`);
								//log(`ScriptCards: delimiter      = [${delimiter}]`);
								//log(`ScriptCards: params         = ${JSON.stringify(params)}`);
								//log(`ScriptCards: About to call getBioField.`);
								let handoutContent = await getBioField(
									handout,
									handoutField
								);

								handoutContent = handoutContent
									.replace(/<br\s*\/?>/gi, "\n")
									.replace(/<\/p>/gi, "\n")
									.replace(/<[^>]*>/g, "")
									.replace(/&nbsp;/g, "")
									.replace(/&amp;/g, "&")
									.replace(/&lt;/g, "<")
									.replace(/&gt;/g, ">")
									.replace(/&quot;/g, '"')
									.replace(/&#39;/g, "'")
									.trim();


								let lines = handoutContent.split(/\r?\n/);

								//log(
								//	`ScriptCards DataGrid Parameters: ` +
								//	`qualifier=[${textQualifier}] ` +
								//	`qualifierLength=${textQualifier.length}, ` +
								//	`delimiter=[${delimiter}] ` +
								//	`delimiterLength=${delimiter.length}`
								//);

								// Parse headings using the configured delimiter and qualifier.
								let headings = parseDelimitedLine(
									lines[0],
									delimiter,
									textQualifier
								);

								for (let j = 1; j < lines.length; j++) {
									let line = lines[j];

									// Skip blank lines.
									if (line.trim() === "") {
										continue;
									}

									let vals = parseDelimitedLine(
										line,
										delimiter,
										textQualifier
									);

									dataGrids[tableName][j] = {};

									for (let k = 0; k < headings.length; k++) {
										let key = headings[k].trim();

										// Use an empty string if this row has fewer values
										// than there are headings.
										let value =
											vals[k] !== undefined
												? vals[k].trim()
												: "";

										//log(`ScriptCards: Setting data grid ${tableName}[${j}][${key}] = ${value}`);
										dataGrids[tableName][j][key] = value;
									}
								}
							}
						} else {
							log(
								`ScriptCards Error: Unable to find handout ${handoutName}`
							);
						}
					}
					break;
				case "hashtable":
				case "hash":
					if (params.length == 3) {
						if (params[1].toLowerCase() == "clear") {
							hashTables[params[2]] = {};
						}
					}

					if (params.length > 2) {
						if (params[1].toLowerCase() == "set") {
							try {
								let tableName = params[2];
								if (hashTables[tableName] === undefined) {
									hashTables[tableName] = {};
								}
								for (var x = 3; x < params.length; x++) {
									if (params[x].indexOf("==") > 0) {
										let thisKey = params[x].split("==")[0]
										let thisValue = params[x].split("==")[1]
										hashTables[tableName][thisKey] = thisValue
									}
								}
							} catch (e) {
								log(`ScriptCards: Error encounted: ${e}`)
							}
						}

						if (params[1].toLowerCase() == "fromobject") {
							try {
								let tableName = params[2];
								hashTables[tableName] = {};
								let theObject = getObj(params[3], params[4])
								let jsonArray = Object.entries(theObject.attributes);
								for (let j = 0; j < jsonArray.length; j++) {
									hashTables[tableName][jsonArray[j][0]] = jsonArray[j][1]
								}
							} catch (e) {
								log(`ScriptCards: Error encounted: ${e}`)
							}
						}

						if (params[1].toLowerCase() == "fromjson") {
							try {
								let tableName = params[2];
								hashTables[tableName] = {};
								let parse = [...params];
								parse.shift();
								parse.shift();
								parse.shift();
								//let jsonData = parse.join("")
								//let theObject = JSON.parse(jsonData)
								//let jsonArray = Object.entries(theObject);
								//let parts = extractKeyValuePairs(theObject)
								let parts = extractKeyValuePairsFromJson(parse.join(""))
								//log(parts)
								for (let j = 0; j < parts.length; j++) {
									let part = parts[j].split(": ")
									hashTables[tableName][part[0]] = part[1]
								}
								/*
								for (let j = 0; j < jsonArray.length; j++) {
									log(jsonArray[j][0] + " Type:" + jsonArray[j][1])
									if (jsonArray[j][1] == "[object Object]") {
										log (`***** Object Object *****`)
										let subArray = Object.entries(jsonArray[j][1])
										for (let q=0; q<subArray.length; q++) {
											hashTables[tableName][jsonArray[j][0] + "_" + subArray[q][0]] = subArray[q][1]
										}
									} else {
										hashTables[tableName][jsonArray[j][0]] = jsonArray[j][1]
									}
								}
								console.log(hashTables[tableName])
								*/
							} catch (e) {
								log(`ScriptCards: Error encounted: ${e}`)
							}
						}



						if (params[1].toLowerCase() == "fromrepeatingsection") {
							try {
								let charid = params[2]
								let sectionname = params[3]
								let identifier = params[4]
								let hashname = params[5]
								let rowID = ""

								hashTables[hashname] = {};

								if (String(cardParameters.beaconsheet) === "1") {
									const beaconState = await buildBeaconRepeatingState(charid, sectionname, cardParameters.debug === "1");
									if (beaconState) {
										for (let rowIndex = 0; rowIndex < beaconState.rows.length; rowIndex++) {
											const identifierValue = await getBeaconRepeatingField(beaconState, rowIndex, identifier, "current", cardParameters.debug === "1");
											rowID = normalizeRepeatingHashValue(identifierValue);
											const rowFields = await getBeaconRepeatingHashFields(beaconState, rowIndex, identifier, cardParameters.debug === "1");
											for (const [rowName, rowValue] of Object.entries(rowFields)) {
												hashTables[hashname][rowID + "_" + rowName] = normalizeRepeatingHashValue(rowValue)
											}
											hashTables[hashname][rowID + "_sectionid"] = beaconState.rows[rowIndex].id
										}
									}
								} else {
									let sectionIDs = getRepeatingSectionIDs(charid, sectionname)

									for (let x = 0; x < sectionIDs.length; x++) {
										let thisSection = getSectionAttrsByID(charid, sectionname, sectionIDs[x])
										for (let y = 0; y < thisSection.length; y++) {
											let rowName = thisSection[y].split("|")[0]
											let rowValue = thisSection[y].split("|")[1]
											if (rowName.toLowerCase() == identifier) {
												rowID = rowValue
											}
										}

										for (let y = 0; y < thisSection.length; y++) {
											let rowName = thisSection[y].split("|")[0]
											let rowValue = normalizeRepeatingHashValue(thisSection[y].split("|")[1])
											hashTables[hashname][rowID + "_" + rowName] = rowValue
										}
										hashTables[hashname][rowID + "_sectionid"] = sectionIDs[x]

									}
								}
							} catch (e) {
								log(`ScriptCards: Error occured converting repeating section to hash table: ${e}`)
							}
						}

						if (params[1].toLowerCase() == "fromrepeatingrow") {
							try {
								let charid = params[2]
								let sectionname = params[3]
								let sectionID = params[4]
								let hashname = params[5]

								hashTables[hashname] = {};

								if (String(cardParameters.beaconsheet) === "1") {
									const beaconState = await buildBeaconRepeatingState(charid, sectionname, cardParameters.debug === "1");
									if (beaconState) {
										const rowIndex = beaconState.rows.findIndex((row) => String(row.id) === String(sectionID));
										if (rowIndex >= 0) {
											const rowFields = await getBeaconRepeatingHashFields(beaconState, rowIndex, undefined, cardParameters.debug === "1");
											for (const [rowName, rowValue] of Object.entries(rowFields)) {
												hashTables[hashname][rowName] = normalizeRepeatingHashValue(rowValue)
											}
											hashTables[hashname]["_sectionid"] = beaconState.rows[rowIndex].id
										}
									}
								} else {
									let thisSection = getSectionAttrsByID(charid, sectionname, sectionID)
									for (let y = 0; y < thisSection.length; y++) {
										let rowName = thisSection[y].split("|")[0]
										let rowValue = normalizeRepeatingHashValue(thisSection[y].split("|")[1])
										hashTables[hashname][rowName] = rowValue
									}
								}
							} catch (e) {
								log(`ScriptCards: Error occured converting repeating row to hash table: ${e}`)
							}
						}

						if (params[1].toLowerCase() == "getjukeboxtracks") {
							try {
								hashTables[params[2]] = {};
								let tracks = findObjs({ type: 'jukeboxtrack' });
								for (let j = 0; j < tracks.length; j++) {
									hashTables[params[2]][tracks[j].get("title")] = tracks[j].get("_id")
									hashTables[params[2]][tracks[j].get("title") + "-playing"] = tracks[j].get("playing")
									hashTables[params[2]][tracks[j].get("title") + "-loop"] = tracks[j].get("loop")
									hashTables[params[2]][tracks[j].get("title") + "-volume"] = tracks[j].get("volume")
								}
							} catch (e) {
								log(`ScriptCards: Error encounted: ${e}`)
							}
						}
						if (params[1].toLowerCase() == "getplayerspecificpages") {
							try {
								hashTables[params[2]] = {};
								let pairs = breakObjectIntoPairs(Campaign().get("playerspecificpages"));
								for (let j = 0; j < pairs.length; j++) {
									hashTables[params[2]][pairs[j][0]] = pairs[j][1]
								}
							} catch (e) {
								log(e);
							}
						}
						if (params[1].toLowerCase() == "setplayerspecificpages") {
							try {
								var tempArray = [];
								if (hashTables[params[2]]) {
									Object.keys(hashTables[params[2]]).forEach(function (key) {
										let thisTemp = [];
										thisTemp.push(key)
										thisTemp.push(hashTables[params[2]][key])
										tempArray.push(thisTemp);
									});
								} else { tempArray = undefined }
								tempArray ? Campaign().set("playerspecificpages", arrayPairsToObject(tempArray)) : Campaign().set("playerspecificpages", false)
							} catch (e) { log(e) }
						}
					}
					break;

				case "array":
					if (params.length > 2) {
						if (params[1].toLowerCase() == "define") {
							arrayVariables[params[2]] = [];
							for (var x = 3; x < params.length; x++) {
								arrayVariables[params[2]].push(params[x]);
							}
							arrayIndexes[params[2]] = 0;
						}
						if (params[1].toLowerCase() == "sort") {
							if (arrayVariables[params[2]]) {
								arrayVariables[params[2]].sort();
								if (params[3] != null) {
									if (params[3].toLowerCase().startsWith("desc")) {
										arrayVariables[params[2]].reverse();
									}
								}
							}
						}
						if (params[1].toLowerCase() == "numericsort") {
							if (arrayVariables[params[2]]) {
								arrayVariables[params[2]].sort(function (a, b) { return parseInt(a) - parseInt(b) });
								if (params[3] != null) {
									if (params[3].toLowerCase().startsWith("desc")) {
										arrayVariables[params[2]].reverse();
									}
								}
							}
						}

						if (params[1].toLowerCase() == "fromrollvar") {
							// param2 = array, param3 = rollvar, param3 = rolled/kept/dropped
							try {
								arrayVariables[params[2]] = [];
								if (rollVariables[params[3]]) {
									switch (params[4].toLowerCase()) {
										case "rolled":
											arrayVariables[params[2]] = [...rollVariables[params[3]].RolledDice];
											break;
										case "kept":
											arrayVariables[params[2]] = [...rollVariables[params[3]].KeptDice];
											break;
										case "dropped":
											arrayVariables[params[2]] = [...rollVariables[params[3]].DroppedDice];
											break;
									}
								}
							} catch (e) {
								log(`ScriptCards: array fromrolleddice error: ${e}`)
							}
						}

						if (params[1].toLowerCase() == "fromtable") {
							arrayVariables[params[2]] = [];
							var theTable = findObjs({ type: "rollabletable", name: params[3] })[0];
							if (theTable != null) {
								var tableItems = findObjs({ type: "tableitem", _rollabletableid: theTable.id });
								if (tableItems != null) {
									tableItems.forEach(function (item) {
										arrayVariables[params[2]].push(item.get("name"))
									})
								}
								if (variableName) { stringVariables[variableName] = arrayVariables[params[2]].length; }
							}
						}

						if (params[1].toLowerCase() == "fromhashtablekeys" ||
							params[1].toLowerCase() == "fromkeys") {
							arrayVariables[params[2]] = [];
							if (hashTables[params[3]]) {
								Object.keys(hashTables[params[3]]).forEach(function (key) {
									arrayVariables[params[2]].push(key);
								});
							}
							var theTable = findObjs({ type: "rollabletable", name: params[3] })[0];
							if (theTable != null) {
								var tableItems = findObjs({ type: "tableitem", _rollabletableid: theTable.id });
								if (tableItems != null) {
									tableItems.forEach(function (item) {
										arrayVariables[params[2]].push(item.get("name"))
									})
								}
								if (variableName) { stringVariables[variableName] = arrayVariables[params[2]].length; }
							}
						}

						if (params[1].toLowerCase() == "fromtableweighted") {
							arrayVariables[params[2]] = [];
							var theTable = findObjs({ type: "rollabletable", name: params[3] })[0];
							if (theTable != null) {
								var tableItems = findObjs({ type: "tableitem", _rollabletableid: theTable.id });
								if (tableItems != null) {
									tableItems.forEach(function (item) {
										for (let w = 0; w < Number(item.get("weight")); w++) {
											arrayVariables[params[2]].push(item.get("name"))
										}
									})
								}
								if (variableName) { stringVariables[variableName] = arrayVariables[params[2]].length; }
							}
						}

						if (params[1].toLowerCase() == "stringify") {
							if (arrayVariables[params[2]]) {
								var sep = cardParameters.parameterdelimiter;
								if (params[3] != null && params[3] != null) {
									sep = params[3];
								}
								await setStringOrArrayElement(variableName, arrayVariables[params[2]].join(sep), cardParameters);
							} else {
								await setStringOrArrayElement(variableName, "", cardParameters);
							}
						}

						if (params[1].toLowerCase() == "fromcontrolledcharacters") {
							arrayVariables[params[2]] = [];
							var chars = findObjs({ type: "character" });
							if (chars && chars[0]) {
								for (let x = 0; x < chars.length; x++) {
									if (chars[x].get("controlledby").includes(params[3])) {
										arrayVariables[params[2]].push(chars[x].id)
									}
								}
							}
						}

						if (params[1].toLowerCase() == "fromplayerlist") {
							arrayVariables[params[2]] = [];
							var players = findObjs({ type: "player" });
							for (let x = 0; x < players.length; x++) {
								if (!playerIsGM(players[x].id)) {
									arrayVariables[params[2]].push(players[x].id)
								}
							}
						}

						if (params[1].toLowerCase() == "fromgmplayerlist") {
							arrayVariables[params[2]] = [];
							var players = findObjs({ type: "player" });
							for (let x = 0; x < players.length; x++) {
								if (playerIsGM(players[x].id)) {
									arrayVariables[params[2]].push(players[x].id)
								}
							}
						}

						if (params[1].toLowerCase() == "pagedoors") {
							arrayVariables[params[2]] = [];
							var pageid = params[3];
							var templateToken = getObj("graphic", params[3]);
							var foundTokens = []
							if (templateToken) {
								pageid = templateToken.get("_pageid");
							}
							if (getObj("page", pageid)) {
								foundTokens = findObjs({ _type: "door", _pageid: pageid });
							}
							arrayVariables[params[2]] = [];
							for (let l = 0; l < foundTokens.length; l++) {
								arrayVariables[params[2]].push(foundTokens[l].id);
							}
							if (foundTokens.length > 0) {
								arrayIndexes[params[2]] = 0;
								if (variableName) { stringVariables[variableName] = arrayVariables[params[2]].length; }
							} else {
								arrayVariables[params[2]] = [];
								if (variableName) { stringVariables[variableName] = "0"; }
							}
						}

						if (params[1].toLowerCase() == "pagetokens") {
							arrayVariables[params[2]] = [];
							var pageid = params[3];
							var templateToken = getObj("graphic", params[3]);
							var foundTokens = []
							if (templateToken) {
								pageid = templateToken.get("_pageid");
							}
							if (getObj("page", pageid)) {
								foundTokens = findObjs({ _type: "graphic", _pageid: pageid });
							}
							if (params[4]) {
								for (let p = 4; p < params.length; p++) {
									for (let t = foundTokens.length - 1; t >= 0; t--) {
										if (params[p].toLowerCase() == "char" || params[p].toLowerCase() == "chars") {
											if (isBlank(foundTokens[t].get("represents"))) {
												foundTokens.splice(t, 1);
											}
										}

										if (params[p].toLowerCase() == "graphic" || params[p].toLowerCase() == "graphics") {
											if (!isBlank(foundTokens[t].get("represents"))) {
												foundTokens.splice(t, 1);
											}
										}

										if (params[p].toLowerCase() == "npc" || params[p].toLowerCase() == "npcs") {
											if (isBlank(foundTokens[t].get("represents"))) {
												foundTokens.splice(t, 1);
											} else {
												if (!isBlank(getObj("character", foundTokens[t].get("represents")).get("controlledby"))) {
													foundTokens.splice(t, 1);
												}
											}
										}

										if (params[p].toLowerCase() == "pc" || params[p].toLowerCase() == "pcs") {
											if (isBlank(foundTokens[t].get("represents"))) {
												foundTokens.splice(t, 1);
											} else {
												if (isBlank(getObj("character", foundTokens[t].get("represents")).get("controlledby"))) {
													foundTokens.splice(t, 1);
												}
											}
										}

										if (params[p].toLowerCase().startsWith("attr:") ||
											params[p].toLowerCase().startsWith("prop:") ||
											params[p].toLowerCase().startsWith("tprop:")) {
											var attrFilter = "";
											var attrValue = "";
											let subfilter = params[p].toLowerCase().split(":")[0];
											if (subfilter.indexOf("~") > 0) {
												subfilter = subfilter.slice(0, -1)
											}
											try {
												if (params[p].indexOf("=") >= 0) {
													attrFilter = params[p].split(":")[1].split("=")[0];
													attrValue = (params[p].split(":")[1].split("=")[1]).toLowerCase().trim();
												}
												if (params[p].indexOf("~=") >= 0) {
													subfilter = subfilter + "_partial";
													attrFilter = params[p].split(":")[1].split("~=")[0];
													attrValue = (params[p].split(":")[1].split("~=")[1]).toLowerCase().trim();
												}
											} catch (e) {
												log('Incorrect pagetokens attribute filter syntax.')
											}
											var charobj = getObj("character", foundTokens[t].get("represents"));
											if (subfilter.startsWith("tp") || charobj) {
												switch (subfilter) {
													case "attr":
														if (!charobj) {
															foundTokens.splice(t, 1);
														} else {
															const attributeResult = await getPageTokenCharacterAttributeValue(
																charobj,
																attrFilter,
																String(cardParameters.beaconsheet) === "1",
																cardParameters.debug === "1"
															);
															const comparableValue = attributeResult.found
																? String(attributeResult.value == null ? "" : attributeResult.value).toLowerCase().trim()
																: undefined;
															if (!attributeResult.found || comparableValue !== attrValue) {
																foundTokens.splice(t, 1);
															}
														}
														break;

													case "attr_partial":
														if (!charobj) {
															foundTokens.splice(t, 1);
														} else {
															const attributeResult = await getPageTokenCharacterAttributeValue(
																charobj,
																attrFilter,
																String(cardParameters.beaconsheet) === "1",
																cardParameters.debug === "1"
															);
															const comparableValue = attributeResult.found
																? String(attributeResult.value == null ? "" : attributeResult.value).toLowerCase().trim()
																: undefined;
															if (!attributeResult.found || comparableValue.indexOf(attrValue) === -1) {
																foundTokens.splice(t, 1);
															}
														}
														break;

													case "prop":
														try {
															var charobj = getObj("character", foundTokens[t].get("represents"));
															if (charobj.get(attrFilter).toLowerCase().trim() !== attrValue) {
																foundTokens.splice(t, 1);
															}
														} catch (e) {
															//
														}
														break;

													case "prop_partial":
														try {
															var charobj = getObj("character", foundTokens[t].get("represents"));
															if (charobj.get(attrFilter).toLowerCase().trim().indexOf(attrValue) == -1) {
																foundTokens.splice(t, 1);
															}
														} catch (e) {
															//
														}
														break;

													case "tprop":
														try {
															if (foundTokens[t].get(attrFilter).toLowerCase().trim() !== attrValue) {
																foundTokens.splice(t, 1);
															}
														} catch (e) {
															//
														}
														break;

													case "tprop_partial":
														try {
															if (foundTokens[t].get(attrFilter).toLowerCase().trim().indexOf(attrValue) == -1) {
																foundTokens.splice(t, 1);
															}
														} catch (e) {
															//
														}
														break;
												}

											} else {
												foundTokens.splice(t, 1);
											}
										}
									}
								}
							}
							arrayVariables[params[2]] = [];
							for (let l = 0; l < foundTokens.length; l++) {
								arrayVariables[params[2]].push(foundTokens[l].id);
							}
							if (foundTokens.length > 0) {
								arrayIndexes[params[2]] = 0;
								if (variableName) { stringVariables[variableName] = arrayVariables[params[2]].length; }
							} else {
								arrayVariables[params[2]] = [];
								if (variableName) { stringVariables[variableName] = "0"; }
							}
						}

						if (params[1].toLowerCase().startsWith("objects:")) {
							var details = params[1].split(":");
							var objects = findObjs({ _type: details[1].toLowerCase() });
							var lookupField = "name";
							if (details[1].toLowerCase() == "player") { lookupField = "_displayname"; }
							if (details[1].toLowerCase() == "jukeboxtrack") { lookupField = "title"; }
							if (details[1].toLowerCase() == "hand") { lookupField = "_type"; }
							if (details[1].toLowerCase() == "card") { lookupField = "_type"; }
							if (details[1].toLowerCase() == "campaign") { lookupField = "_type"; }
							if (details[1].toLowerCase() == "path") { lookupField = "stroke"; }
							if (details[1].toLowerCase() == "text") { lookupField = "text"; }
							arrayVariables[params[2]] = [];
							for (var x = 0; x < objects.length; x++) {
								if (params[3] != null) {
									var okFilter = false || params[3] == "";
									var okChar = !(params[4] != null) || objects[x].get("characterid") == params[4];
									if (objects[x].get(lookupField).toLowerCase().startsWith(params[3].toLowerCase())) {
										okFilter = true;
									}
									if (okFilter && okChar) {
										arrayVariables[params[2]].push(objects[x].get("_id"));
									}
								} else {
									arrayVariables[params[2]].push(objects[x].get("_id"));
								}
							}
						}

						if (params[1].toLowerCase() == "attributes") {
							// Note P1=attributes, P2=array name, P3=character id, P4=Name Starts with
							try {
								var foundAttrs = findObjs({ type: "attribute", characterid: params[3] });
								if (foundAttrs && foundAttrs[0]) {
									arrayVariables[params[2]] = []
									for (let x = 0; x < foundAttrs.length; x++) {
										if (params[4]) {
											if (foundAttrs[x].get("name").startsWith(params[4])) {
												arrayVariables[params[2]].push(foundAttrs[x].id)
											}
										} else {
											arrayVariables[params[2]].push(foundAttrs[x].id)
										}
									}
								}
							} catch (e) { log(e); }
						}

						if (params[1].toLowerCase() == "abilities") {
							// Note P1=abilities, P2=array name, P3=character id, P4=Name Starts with
							try {
								var foundAbilities = findObjs({ type: "ability", characterid: params[3] });
								if (foundAbilities && foundAbilities[0]) {
									arrayVariables[params[2]] = []
									for (let x = 0; x < foundAbilities.length; x++) {
										if (params[4]) {
											if (foundAbilities[x].get("name").startsWith(params[4])) {
												arrayVariables[params[2]].push(foundAbilities[x].id)
											}
										} else {
											arrayVariables[params[2]].push(foundAbilities[x].id)
										}
									}
								}
							} catch (e) { log(e); }
						}

						// Return the names of all properties associated with an object.
						if (params[1].toLowerCase() == "properties") {
							// Note P1=properties, P2=array name, P3=object id, P4=Name Starts with
							const objTypes = ["graphic", "text", "path", "graphic", "card", "character", "handout", "ability", "attribute"];
							try {
								let found = false;
								let objIndex = 0;
								log(objTypes[objIndex])
								while (!found && objIndex < objTypes.length) {
									//log(`looking for ${objTypes[objIndex]} with id ${params[3]}`)
									var properties = findObjs({ type: objTypes[objIndex], _id: params[3] });
									if (properties && properties[0]) {
										found = true;
										//log(`Found object of type ${objTypes[objIndex]} with id ${params[3]}`)
									} else {
										objIndex++;
									}
								}
								if (properties && properties[0]) {
									arrayVariables[params[2]] = []
									log(properties[0].attributes)
									var objProps = Object.keys(properties[0]);
									for (let x = 0; x < objProps.length; x++) {
										if (params[4]) {
											if (objProps[x].startsWith(params[4])) {
												arrayVariables[params[2]].push(objProps[x])
											}
										} else {
											arrayVariables[params[2]].push(objProps[x])
										}
									}
								}
							} catch (e) { log(`properties error: ${e}`); }
						}

						if (params[1].toLowerCase() == "selectedtokens") {
							if (msg.selected) {
								arrayVariables[params[2]] = [];
								for (var x = 0; x < msg.selected.length; x++) {
									var obj = getObj(msg.selected[x]._type, msg.selected[x]._id);
									arrayVariables[params[2]].push(obj.get("id"));
								}
								arrayIndexes[params[2]] = 0;
								if (variableName) { stringVariables[variableName] = arrayVariables[params[2]].length; }
							} else {
								arrayVariables[params[2]] = [];
								if (variableName) { stringVariables[variableName] = "0"; }
							}
						}
						if (params[1].toLowerCase() == "statusmarkers") {
							arrayVariables[params[2]] = [];
							var theToken = getObj("graphic", params[3]);
							if (theToken) {
								var markers = theToken.get("statusmarkers").split(",");
								for (var x = 0; x < markers.length; x++) {
									if (markers[x].trim() != "") {
										arrayVariables[params[2]].push(markers[x]);
									}
								}
								arrayIndexes[params[2]] = 0;
							}
						}
						if (params[1].toLowerCase() == "add") {
							if (!arrayVariables[params[2]]) { arrayVariables[params[2]] = []; arrayIndexes[params[2]] = 0; }
							for (var x = 3; x < params.length; x++) {
								arrayVariables[params[2]].push(params[x]);
							}
						}
						if (params[1].toLowerCase() == "remove") {
							if (arrayVariables[params[2]] && arrayVariables[params[2]].length > 0) {
								for (var x = 3; x < params.length; x++) {
									for (var i = arrayVariables[params[2]].length - 1; i >= 0; i--) {
										if (arrayVariables[params[2]][i] == params[x]) {
											arrayVariables[params[2]].splice(i, 1);
										}
									}
								}
							}
							if (arrayVariables[params[2]] && arrayVariables[params[2]].length == 0) {
								delete arrayVariables[params[2]];
								delete arrayIndexes[params[2]];
							} else {
								arrayIndexes[params[2]] = 0;
							}
						}
						if (params[1].toLowerCase() == "removeat") {
							if (arrayVariables[params[2]] && arrayVariables[params[2]].length > 0) {
								if (Number(params[3] < arrayVariables[params[2]].length)) {
									arrayVariables[params[2]].splice(Number(params[3]), 1);
								}
							}
							if (arrayVariables[params[2]] && arrayVariables[params[2]].length == 0) {
								delete arrayVariables[params[2]];
								delete arrayIndexes[params[2]];
							} else {
								arrayIndexes[params[2]] = 0;
							}
						}
						if (params[1].toLowerCase() == "setindex") {
							if (arrayVariables[params[2]] && arrayVariables[params[2]].length > 0) {
								if (arrayVariables[params[2]].length > Number(params[3])) {
									arrayIndexes[params[2]] = Number(params[3]);
								}
							}
						}

						if (params[1].toLowerCase() == "getindex") {
							if (arrayVariables[params[2]] && arrayVariables[params[2]].length > 0) {
								stringVariables[variableName] = arrayIndexes[params[2]];
							} else {
								stringVariables[variableName] = "ArrayError";
							}
						}

						if (params[1].toLowerCase() == "indexof") {
							if (arrayVariables[params[2]] && arrayVariables[params[2]].length > 0) {
								var wasFound = arrayVariables[params[2]].indexOf(params[3]);
								if (wasFound >= 0) {
									stringVariables[variableName] = wasFound.toString();
								} else {
									stringVariables[variableName] = "ArrayError";
								}
							} else {
								stringVariables[variableName] = "ArrayError";
							}
						}

						if (params[1].toLowerCase() == "getlength" || params[1].toLowerCase() == "getcount") {
							if (arrayVariables[params[2]]) {
								stringVariables[variableName] = arrayVariables[params[2]].length;
							} else {
								stringVariables[variableName] = "ArrayError";
							}
						}

						if (params[1].toLowerCase() == "getcurrent") {
							if (arrayVariables[params[2]] && arrayVariables[params[2]].length > 0) {
								stringVariables[variableName] = arrayVariables[params[2]][arrayIndexes[params[2]]];
							} else {
								stringVariables[variableName] = "ArrayError";
							}
						}

						if (params[1].toLowerCase() == "getfirst") {
							if (arrayVariables[params[2]] && arrayVariables[params[2]].length > 0) {
								arrayIndexes[params[2]] = 0;
								stringVariables[variableName] = arrayVariables[params[2]][arrayIndexes[params[2]]];
							} else {
								stringVariables[variableName] = "ArrayError";
							}
						}

						if (params[1].toLowerCase() == "getlast") {
							if (arrayVariables[params[2]]) {
								arrayIndexes[params[2]] = arrayVariables[params[2]].length - 1;
								stringVariables[variableName] = arrayVariables[params[2]][arrayIndexes[params[2]]];
							} else {
								stringVariables[variableName] = "ArrayError";
							}
						}

						if (params[1].toLowerCase() == "getnext") {
							if (arrayVariables[params[2]]) {
								if (arrayIndexes[params[2]] < arrayVariables[params[2]].length - 1) {
									arrayIndexes[params[2]]++;
									stringVariables[variableName] = arrayVariables[params[2]][arrayIndexes[params[2]]];
								} else {
									stringVariables[variableName] = "ArrayError";
								}
							} else {
								stringVariables[variableName] = "ArrayError";
							}
						}

						if (params[1].toLowerCase() == "getprevious") {
							if (arrayVariables[params[2]]) {
								if (arrayIndexes[params[2]] > 0) {
									arrayIndexes[params[2]]--;
									stringVariables[variableName] = arrayVariables[params[2]][arrayIndexes[params[2]]];
								} else {
									stringVariables[variableName] = "ArrayError";
								}
							} else {
								stringVariables[variableName] = "ArrayError";
							}
						}
					}
					if (params.length == 5) {
						if (params[1].toLowerCase() == "replace") {
							if (arrayVariables[params[2]]) {
								for (var i = 0; i < arrayVariables[params[2]].length; i++) {
									if (arrayVariables[params[2]][i] == params[3]) {
										arrayVariables[params[2]][i] = params[4];
									}
								}

							}
							arrayIndexes[params[2]] = 0;
						}
						if (params[1].toLowerCase() == "setatindex") {
							if (arrayVariables[params[2]]) {
								var index = Number(params[3]);
								if (arrayVariables[params[2]].length >= index) {
									arrayVariables[params[2]][index] = params[4];
								}
							}
						}
						if (params[1].toLowerCase() == "fromstring") {
							arrayVariables[params[2]] = [];
							var splitString = params[4].split(params[3]);
							for (var x = 0; x < splitString.length; x++) {
								arrayVariables[params[2]].push(splitString[x]);
							}
							arrayIndexes[params[2]] = 0;
						}

						if (params[1].toLowerCase() == "fromrollabletable" || params[1].toLowerCase() == "fromtable") {
							// params: 1-fromrollabletable, 2-array name, 3-table name, 4-name or avatar or both)
							if (params[2] !== "") {
								arrayVariables[params[2]] = [];
								var theTable = findObjs({ type: "rollabletable", name: params[3] })[0];
								if (theTable != null) {
									findObjs({ type: "tableitem", _rollabletableid: theTable.id }).forEach(function (item) {
										if (item !== null) {
											switch (params[4].toLowerCase()) {
												case "avatar":
												case "image":
													arrayVariables[params[2]].push(item.get("avatar"));
													break;

												case "name":
												case "text":
													arrayVariables[params[2]].push(item.get("name"));
													break;

												case "both":
													arrayVariables[params[2]].push(`${item.get("name")}|${item.get("avatar")}`)
													break;
											}
										}
									});
								}
							}
						}
					}
					if (params.length == 6) {
						if (params[1].toLowerCase() == "fromrepeatingsection" || params[1].toLowerCase() == "fromrepsection") {
							if (params[2] !== "") {
								try {
									arrayVariables[params[2]] = [];
									if (String(cardParameters.beaconsheet) === "1") {
										const beaconState = await buildBeaconRepeatingState(params[3], params[4], cardParameters.debug === "1");
										if (beaconState) {
											for (let rowIndex = 0; rowIndex < beaconState.rows.length; rowIndex++) {
												const value = await getBeaconRepeatingField(beaconState, rowIndex, params[5], "current", cardParameters.debug === "1");
												arrayVariables[params[2]].push(value === undefined ? "" : value);
											}
										}
									} else {
										var pushValue = "";
										var localSectionIDs = getRepeatingSectionIDs(params[3], params[4]);
										if (localSectionIDs && localSectionIDs.length > 0) {
											for (var x = 0; x < localSectionIDs.length; x++) {
												var thisRepeatingSection = getSectionAttrsByID(params[3], params[4], localSectionIDs[x]);
												pushValue = "";
												for (var q = 0; q < thisRepeatingSection.length; q++) {
													if (thisRepeatingSection[q].split("|")[0] == params[5]) {
														pushValue = thisRepeatingSection[q].split("|")[1];
													}
												}
												arrayVariables[params[2]].push(pushValue);
											}
										}
									}
								} catch {
									arrayVariables[params[2]] = [];
								}
							}
						}
					}
					if (params.length == 7) {
						if (params[1].toLowerCase() == "fullrepeatingsection" || params[1].toLowerCase() == "fullrepsection") {
							if (params[2] !== "") {
								try {
									arrayVariables[params[2]] = [];
									var attrList = params[5].split(":");
									if (String(cardParameters.beaconsheet) === "1") {
										const beaconState = await buildBeaconRepeatingState(params[3], params[4], cardParameters.debug === "1");
										if (beaconState) {
											for (let rowIndex = 0; rowIndex < beaconState.rows.length; rowIndex++) {
												const rowValues = [];
												for (const fieldName of attrList) {
													const value = await getBeaconRepeatingField(beaconState, rowIndex, fieldName, "current", cardParameters.debug === "1");
													rowValues.push(value === undefined ? "" : value);
												}
												arrayVariables[params[2]].push(rowValues.join(params[6]));
											}
										}
									} else {
										var pushValue = "";
										var localSectionIDs = getRepeatingSectionIDs(params[3], params[4]);
										if (localSectionIDs && localSectionIDs.length > 0) {
											for (var x = 0; x < localSectionIDs.length; x++) {
												pushValue = [];
												var thisRepeatingSection = getSectionAttrsByID(params[3], params[4], localSectionIDs[x]);
												for (var y = 0; y < attrList.length; y++) {
													var found = false
													for (var q = 0; q < thisRepeatingSection.length; q++) {
														if (thisRepeatingSection[q].split("|")[0] == attrList[y]) {
															if (thisRepeatingSection[q].split("|")[1] != null) {
																pushValue.push(thisRepeatingSection[q].split("|")[1]);
																found = true
															} else {
																pushValue.push("");
															}

														}
													}
													if (!found) { pushValue.push(""); }
												}
												arrayVariables[params[2]].push(pushValue.join(params[6]));
											}
										}
									}
								} catch {
									arrayVariables[params[2]] = [];
								}
							}
						}
					}
					break;

				case "object":
					if ((params[1].toLowerCase() == "token" || params[1].toLowerCase() == "graphic") &&
						(params[2].toLowerCase() == "remove" || params[2].toLowerCase() == "delete")) {
						for (let x = 3; x < params.length; x++) {
							var tokenID = params[x].trim();
							try {
								var theToken = getObj("graphic", tokenID);
								if (theToken) {
									theToken.remove();
									log(`ScriptCards: Token ${tokenID} removed by user ${stringVariables["SendingPlayerID"]} (${stringVariables["SendingPlayerName"]}).`);
								}
							} catch (e) {
								log(e);
							}
						}
					}
					break;
			}
		} catch (e) {
			log(`Error executing function  ${e.message}, thisTag: ${thisTag}, thisContent: ${thisContent}`)
		}
	}

	async function handleRollVariableSetCommand(thisTag, thisContent, cardParameters) {
		try {
			var rollIDName = thisTag.substring(1).trim();
			if (rollIDName.indexOf('.') == -1) {
				rollVariables[rollIDName] = await parseDiceRoll(await replaceVariableContent(thisContent, cardParameters), cardParameters, true);
			} else {
				var parts = rollIDName.split(".");
				if (parts[0] && rollVariables[parts[0]]) {
					if (parts[1] && rollVariables[parts[0]][parts[1]]) {
						rollVariables[parts[0]][parts[1]] = await replaceVariableContent(thisContent, cardParameters);
					}
				}
			}
		} catch (e) {
			log(`Error setting roll variable ${e.message}, thisTag: ${thisTag}, thisContent: ${thisContent}`)
		}
	}


	const BEACON_REPEATING_VISIBLE_FIELDS = new Set(["name", "label", "title"]);
	const BEACON_REPEATING_CLASSIFIER_SUFFIXES = ["type", "category", "section", "level"];
	const BEACON_RECORD_ORDER_FIELDS = ["arrayPosition", "position", "order", "index"];
	const BEACON_REPEATING_PROTECTED_FIELDS = new Set([
		"id", "uuid", "shortid", "xxxactionidxxxx", "enabled",
		"arrayposition", "position", "order", "index",
		"createdtime", "created", "timestamp", "parentid", "childids", "relations",
		"scriptcardsrepeatingsection"
	]);
	const BEACON_REPEATING_LOCAL_READ_EXCLUDED_FIELDS = new Set([
		...BEACON_REPEATING_PROTECTED_FIELDS,
		"type", "kind", "category", "subtype", "section", "recordtype", "entrytype", "level"
	]);
	const BEACON_REPEATING_CONTENT_FIELDS = new Set([
		"name", "label", "title", "slug", "description", "text", "notes",
		"display", "displayname", "builderdisplayname", "source",
		...BEACON_REPEATING_PROTECTED_FIELDS,
		"value", "current", "max", "maximum", "flatvalue",
		"valueformula", "formula", "amount", "quantity"
	]);

	function normalizeBeaconOriginalRepeatingSection(sectionName) {
		const requestedSection = String(sectionName == null ? "" : sectionName).trim();
		if (!requestedSection) {
			return "";
		}
		return requestedSection.toLowerCase().startsWith("repeating_")
			? requestedSection
			: `repeating_${requestedSection}`;
	}


	function beaconRepeatingCreationComparable(value) {
		if (value === null || value === undefined) {
			return String(value);
		}
		if (typeof value === "string") {
			return value.trim().toLowerCase();
		}
		return String(value);
	}

	function beaconRepeatingCreationStructuralField(fieldName, fieldValue, sectionName) {
		const normalized = normalizeBeaconLookupName(fieldName);
		if (["type", "kind", "category"].includes(normalized)) {
			return true;
		}
		if (["subtype", "section", "recordtype", "entrytype"].includes(normalized)) {
			return true;
		}

		const classifierSuffix = BEACON_REPEATING_CLASSIFIER_SUFFIXES
			.find((suffix) => normalized.endsWith(suffix));
		if (!classifierSuffix) {
			return false;
		}

		const normalizedSection = normalizeBeaconLookupName(
			String(sectionName == null ? "" : sectionName).replace(/^repeating_/i, "")
		);
		const normalizedValue = normalizeBeaconLookupName(fieldValue);
		if (!normalizedSection || !normalizedValue) {
			return false;
		}
		const fieldStem = normalized.substring(0, normalized.length - classifierSuffix.length);
		return normalizedSection.includes(normalizedValue)
			|| normalizedValue.includes(normalizedSection)
			|| (fieldStem && normalizedSection.includes(fieldStem));
	}

	function beaconRepeatingRelationshipHasValues(value) {
		const parsed = parseBeaconStructuredValue(value);
		const relationshipValue = parsed === undefined ? value : parsed;
		if (Array.isArray(relationshipValue)) {
			return relationshipValue.some((item) => String(item == null ? "" : item).trim() !== "");
		}
		if (relationshipValue && typeof relationshipValue === "object") {
			return Object.keys(relationshipValue).length > 0;
		}
		return String(relationshipValue == null ? "" : relationshipValue).trim() !== "";
	}

	function beaconRepeatingRecordHasMeaningfulFields(record, sectionName) {
		if (!record || typeof record !== "object" || Array.isArray(record)) {
			return false;
		}
		return Object.entries(record).some(([fieldName, fieldValue]) => {
			const normalizedField = normalizeBeaconLookupName(fieldName);
			if (normalizedField === "childids" || normalizedField === "relations") {
				return beaconRepeatingRelationshipHasValues(fieldValue);
			}
			if (!normalizedField
				|| normalizedField === "scriptcardsrepeatingsection"
				|| BEACON_REPEATING_PROTECTED_FIELDS.has(normalizedField)
				|| beaconRepeatingCreationStructuralField(fieldName, fieldValue, sectionName)) {
				return false;
			}
			if (fieldValue === undefined || fieldValue === null || fieldValue === "") {
				return false;
			}
			if (Array.isArray(fieldValue)) {
				return fieldValue.length > 0;
			}
			if (typeof fieldValue === "object") {
				return Object.keys(fieldValue).length > 0;
			}
			return true;
		});
	}


	function beaconRepeatingCreationChildCount(record) {
		const childIDs = beaconProperty(record, "childIDs");
		if (Array.isArray(childIDs)) {
			return childIDs.length;
		}
		const parsed = parseBeaconStructuredValue(childIDs);
		return Array.isArray(parsed) ? parsed.length : 0;
	}

	function chooseBeaconRepeatingCreationRow(state) {
		if (!state || !Array.isArray(state.rows)) {
			return undefined;
		}
		const rows = state.rows.filter((row) =>
			row
			&& row.record
			&& typeof row.record === "object"
			&& !Array.isArray(row.record)
			&& row.rootName
			&& Array.isArray(row.path)
			&& row.path.length > 0
		);
		rows.sort((left, right) => {
			const leftScore = beaconRepeatingCreationChildCount(left.record) * 100
				+ Object.values(left.record).filter((value) => value && typeof value === "object").length * 10
				+ Object.keys(left.record).length;
			const rightScore = beaconRepeatingCreationChildCount(right.record) * 100
				+ Object.values(right.record).filter((value) => value && typeof value === "object").length * 10
				+ Object.keys(right.record).length;
			return leftScore - rightScore;
		});
		return rows[0];
	}

	function buildBeaconRepeatingCreationProfile(state) {
		const exemplarRow = chooseBeaconRepeatingCreationRow(state);
		if (!exemplarRow) {
			return undefined;
		}

		const exemplar = exemplarRow.record;
		const canonicalRows = state.rows
			.filter((row) =>
				row
				&& row.record
				&& typeof row.record === "object"
				&& !Array.isArray(row.record)
				&& row.attributeId
				&& row.rootName
				&& Array.isArray(row.path)
				&& row.path.length > 0
			)
			.map((row) => row.record);
		const membershipFields = {};

		for (const [fieldName, fieldValue] of Object.entries(exemplar)) {
			if (fieldValue === undefined || !beaconPrimitive(fieldValue)) {
				continue;
			}
			const normalizedField = normalizeBeaconLookupName(fieldName);
			const alwaysCopy = ["type", "kind", "category"].includes(normalizedField);
			if (!alwaysCopy && !beaconRepeatingCreationStructuralField(fieldName, fieldValue, state.sectionName)) {
				continue;
			}
			if (BEACON_REPEATING_CONTENT_FIELDS.has(normalizedField)) {
				continue;
			}

			const sharedBySection = canonicalRows.every((record) => {
				const key = beaconOwnPropertyKey(record, fieldName);
				return key !== undefined
					&& record[key] !== undefined
					&& beaconPrimitive(record[key])
					&& beaconRepeatingCreationComparable(record[key]) === beaconRepeatingCreationComparable(fieldValue);
			});
			if (alwaysCopy || sharedBySection || canonicalRows.length === 1) {
				membershipFields[fieldName] = fieldValue;
			}
		}

		return {
			rootName: exemplarRow.rootName,
			rootAttributeName: exemplarRow.rootAttributeName || exemplarRow.rootName,
			rootAttributeId: exemplarRow.attributeId,
			parentPath: exemplarRow.path.slice(0, -1),
			exemplar: JSON.parse(JSON.stringify(exemplar)),
			membershipFields
		};
	}

	function generateBeaconRepeatingShortID(characterId) {
		const indexed = getBeaconTypedCollectionIndex(characterId, "current", false);
		for (let attempt = 0; attempt < 100; attempt++) {
			const candidate = generateRowID().slice(-9);
			if (!findBeaconRepeatingCanonicalEntry(indexed, candidate)) {
				return candidate;
			}
		}
		return generateRowID();
	}

	function parseBeaconOriginalRepeatingFields(content) {
		const text = String(content == null ? "" : content);
		if (!text.trim()) {
			return [];
		}
		return text.split(/(?<![\\\\])\|/)
			.map((fieldText) => {
				const parts = fieldText.split(":");
				const name = String(parts.shift() || "").trim();
				const current = String(parts.shift() || "").replace(/%3A/gi, ":").replace(/\\\\\|/gi, "|").trim();
				const max = parts.join(":").replace(/%3A/gi, ":").replace(/\\\\\|/gi, "|").trim();
				return { name, current, max };
			})
			.filter((field) => field.name);
	}

	function parseBeaconBooleanValue(value) {
		if (typeof value === "boolean") {
			return { success: true, value };
		}
		const normalized = String(value).trim().toLowerCase();
		if (["1", "true", "yes", "on"].includes(normalized)) {
			return { success: true, value: true };
		}
		if (["0", "false", "no", "off"].includes(normalized)) {
			return { success: true, value: false };
		}
		return { success: false };
	}

	function coerceBeaconRepeatingCreationValue(value, sampleValue) {
		if (typeof sampleValue === "number" && isNumber(value)) {
			return Number(value);
		}
		if (typeof sampleValue === "boolean") {
			const parsedBoolean = parseBeaconBooleanValue(value);
			if (parsedBoolean.success) {
				return parsedBoolean.value;
			}
		}
		return value;
	}

	function resolveBeaconRepeatingCreationField(profile, fieldName) {
		const exemplar = profile.exemplar || {};
		return beaconOwnPropertyKey(exemplar, fieldName) || fieldName;
	}

	function beaconRepeatingResetValue(sampleValue) {
		if (Array.isArray(sampleValue)) {
			return [];
		}
		if (sampleValue && typeof sampleValue === "object") {
			return {};
		}
		if (typeof sampleValue === "string") {
			const parsed = parseBeaconStructuredValue(sampleValue);
			if (Array.isArray(parsed)) {
				return "[]";
			}
			if (parsed && typeof parsed === "object") {
				return "{}";
			}
		}
		return "";
	}

	function beaconRepeatingIdentityValue(fieldName, sampleValue, rowId) {
		const normalizedField = normalizeBeaconLookupName(fieldName);
		if (normalizedField === "uuid") {
			return uuidv4();
		}
		if (normalizedField === "id"
			&& typeof sampleValue === "string"
			&& /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sampleValue)) {
			return uuidv4();
		}
		return rowId;
	}

	function applyBeaconRepeatingCreationBase(record, profile, characterId, siblingRecords) {
		const exemplar = profile.exemplar || {};
		const protectedFields = new Set();
		const availableFields = Array.from(new Set(
			Object.keys(record).concat(Object.keys(exemplar))
		));

		let identityFields = availableFields.filter((fieldName) =>
			["id", "uuid", "shortid", "xxxactionidxxxx"].includes(normalizeBeaconLookupName(fieldName))
		);
		if (!identityFields.length) {
			identityFields = ["shortID"];
		}
		const primaryIdentityField = identityFields.find((fieldName) =>
			normalizeBeaconLookupName(fieldName) === "shortid"
		) || identityFields.find((fieldName) =>
			normalizeBeaconLookupName(fieldName) === "xxxactionidxxxx"
		) || identityFields.find((fieldName) =>
			normalizeBeaconLookupName(fieldName) === "uuid"
		) || identityFields[0];
		const primarySampleKey = beaconOwnPropertyKey(exemplar, primaryIdentityField);
		const primarySampleValue = primarySampleKey === undefined
			? record[primaryIdentityField]
			: exemplar[primarySampleKey];
		const primaryIdentityName = normalizeBeaconLookupName(primaryIdentityField);
		const rowId = primaryIdentityName === "uuid"
			|| (primaryIdentityName === "id"
				&& typeof primarySampleValue === "string"
				&& /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(primarySampleValue))
			? uuidv4()
			: generateBeaconRepeatingShortID(characterId);
		for (const fieldName of identityFields) {
			const sampleKey = beaconOwnPropertyKey(exemplar, fieldName);
			const sampleValue = sampleKey === undefined ? record[fieldName] : exemplar[sampleKey];
			record[fieldName] = fieldName === primaryIdentityField
				? rowId
				: beaconRepeatingIdentityValue(fieldName, sampleValue, rowId);
			protectedFields.add(fieldName);
		}

		let enabledFields = availableFields.filter((fieldName) =>
			normalizeBeaconLookupName(fieldName) === "enabled"
		);
		if (!enabledFields.length) {
			enabledFields = ["_enabled"];
		}
		for (const fieldName of enabledFields) {
			record[fieldName] = true;
			protectedFields.add(fieldName);
		}

		const normalizedOrderFields = BEACON_RECORD_ORDER_FIELDS
			.map((candidate) => normalizeBeaconLookupName(candidate));
		let orderFields = availableFields.filter((fieldName) =>
			normalizedOrderFields.includes(normalizeBeaconLookupName(fieldName))
		);
		if (!orderFields.length) {
			orderFields = ["arrayPosition"];
		}
		const primaryOrderField = orderFields[0];
		let highestOrder = -1;
		for (const sibling of siblingRecords) {
			const siblingOrder = Number(beaconProperty(sibling, primaryOrderField));
			if (Number.isFinite(siblingOrder) && siblingOrder > highestOrder) {
				highestOrder = siblingOrder;
			}
		}
		for (const fieldName of orderFields) {
			record[fieldName] = highestOrder + 1;
			protectedFields.add(fieldName);
		}

		const now = Date.now();
		for (const fieldName of availableFields) {
			const normalizedField = normalizeBeaconLookupName(fieldName);
			const sampleKey = beaconOwnPropertyKey(exemplar, fieldName);
			const sampleValue = Object.prototype.hasOwnProperty.call(record, fieldName)
				? record[fieldName]
				: (sampleKey === undefined ? undefined : exemplar[sampleKey]);
			if (normalizedField === "parentid") {
				record[fieldName] = beaconRepeatingResetValue(sampleValue);
				protectedFields.add(fieldName);
			} else if (normalizedField === "childids" || normalizedField === "relations") {
				record[fieldName] = beaconRepeatingResetValue(sampleValue);
				protectedFields.add(fieldName);
			} else if (["createdtime", "created", "timestamp"].includes(normalizedField)) {
				record[fieldName] = typeof sampleValue === "string" ? String(now) : now;
				protectedFields.add(fieldName);
			}
		}

		return {
			rowId,
			protectedFields: Array.from(protectedFields)
		};
	}

	function beaconRepeatingCreationProtectedFields(profile, baseInfo) {
		return new Set(
			Array.from(BEACON_REPEATING_PROTECTED_FIELDS)
				.concat(Object.keys(profile.membershipFields || {}))
				.concat(baseInfo.protectedFields || [])
				.map((field) => normalizeBeaconLookupName(field))
				.filter((field) => field)
		);
	}

	function getBeaconStructuredContainer(root, path) {
		let container = root;
		for (let index = 0; index < path.length; index++) {
			const selected = selectBeaconStructuredWriteKey(container, path[index]);
			if (!selected.success) {
				return { success: false, error: `${selected.error} at ${path.slice(0, index + 1).join("->")}` };
			}
			container = container[selected.key];
		}
		return container && typeof container === "object"
			? { success: true, container }
			: { success: false, error: `the selected Beacon container is not an object or array` };
	}


	function cloneBeaconRepeatingCreationProfile(profile) {
		if (!profile || typeof profile !== "object") {
			return undefined;
		}
		try {
			const cloned = JSON.parse(JSON.stringify(profile));
			delete cloned.rootAttributeId;
			return cloned;
		} catch (error) {
			return undefined;
		}
	}

	function deriveBeaconRepeatingNumericDestinationProfile(
		sourceProfile,
		sourceSectionName,
		destinationSectionName
	) {
		const sourceStem = beaconRepeatingCanonicalSectionStem(sourceSectionName);
		const destinationStem = beaconRepeatingCanonicalSectionStem(destinationSectionName);
		const sourceNumbers = Array.from(sourceStem.matchAll(/\d+/g), (match) => Number(match[0]));
		const destinationNumbers = Array.from(destinationStem.matchAll(/\d+/g), (match) => Number(match[0]));
		if (sourceNumbers.length !== 1 || destinationNumbers.length !== 1) {
			return undefined;
		}
		if (sourceStem.replace(/\d+/g, "") !== destinationStem.replace(/\d+/g, "")) {
			return undefined;
		}
		const profile = cloneBeaconRepeatingCreationProfile(sourceProfile);
		if (!profile) {
			return undefined;
		}
		let changed = false;
		for (const fieldName of Object.keys(profile.membershipFields || {})) {
			if (!normalizeBeaconLookupName(fieldName).endsWith("level")) {
				continue;
			}
			const sourceValue = profile.membershipFields[fieldName];
			if (Number(sourceValue) !== sourceNumbers[0]) {
				continue;
			}
			profile.membershipFields[fieldName] = typeof sourceValue === "string"
				? String(destinationNumbers[0])
				: destinationNumbers[0];
			const exemplarField = beaconOwnPropertyKey(profile.exemplar || {}, fieldName);
			if (exemplarField !== undefined) {
				const exemplarValue = profile.exemplar[exemplarField];
				profile.exemplar[exemplarField] = typeof exemplarValue === "string"
					? String(destinationNumbers[0])
					: destinationNumbers[0];
			}
			changed = true;
		}
		return changed ? profile : undefined;
	}

	function getBeaconRepeatingCreationProfileSchemaSample(value) {
		if (Array.isArray(value)) {
			return { type: "array" };
		}
		if (value && typeof value === "object") {
			return {
				type: "object",
				keys: Object.keys(value).sort().reduce((result, key) => {
					result[key] = getBeaconRepeatingCreationProfileSchemaSample(value[key]);
					return result;
				}, {})
			};
		}
		if (typeof value === "string") {
			if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
				return { type: "uuid-string" };
			}
			const parsed = parseBeaconStructuredValue(value);
			if (Array.isArray(parsed)) {
				return { type: "json-array-string" };
			}
			if (parsed && typeof parsed === "object") {
				return { type: "json-object-string" };
			}
		}
		return { type: value === null ? "null" : typeof value };
	}

	function getBeaconRepeatingCreationProfileSchemaSignature(profile) {
		if (!profile || typeof profile !== "object") {
			return "";
		}
		const exemplar = profile.exemplar && typeof profile.exemplar === "object"
			? profile.exemplar
			: {};
		const exemplarSchema = Object.keys(exemplar).sort().reduce((result, key) => {
			result[key] = getBeaconRepeatingCreationProfileSchemaSample(exemplar[key]);
			return result;
		}, {});
		const membershipFields = profile.membershipFields && typeof profile.membershipFields === "object"
			? Object.keys(profile.membershipFields).sort().reduce((result, key) => {
				result[key] = profile.membershipFields[key];
				return result;
			}, {})
			: {};
		try {
			return JSON.stringify({
				rootName: normalizeBeaconLookupName(profile.rootAttributeName || profile.rootName),
				parentPath: Array.isArray(profile.parentPath) ? profile.parentPath.map((segment) => String(segment)) : [],
				membershipFields,
				exemplarSchema
			});
		} catch (error) {
			return "";
		}
	}

	function getBeaconRepeatingCreationProfileCache() {
		if (!state[APINAME]) {
			state[APINAME] = { module: APINAME, schemaVersion: APIVERSION, config: {}, persistentVariables: {} };
		}
		if (!state[APINAME].beaconRepeatingCreationProfiles
			|| typeof state[APINAME].beaconRepeatingCreationProfiles !== "object"
			|| Array.isArray(state[APINAME].beaconRepeatingCreationProfiles)) {
			state[APINAME].beaconRepeatingCreationProfiles = {};
		}
		return state[APINAME].beaconRepeatingCreationProfiles;
	}

	function getBeaconRepeatingSheetIdentity(characterId) {
		const character = getObj("character", characterId);
		const sheetName = character ? character.get("charactersheetname") : "";
		return normalizeBeaconLookupName(sheetName || "unknown-beacon-sheet");
	}

	function getBeaconRepeatingCreationProfileCacheKey(characterId, sectionName) {
		const normalizedSection = normalizeBeaconOriginalRepeatingSection(sectionName);
		if (!normalizedSection) {
			return "";
		}
		return `${getBeaconRepeatingSheetIdentity(characterId)}\u0000${normalizeBeaconLookupName(normalizedSection)}`;
	}

	function cacheBeaconRepeatingCreationProfile(characterId, sectionName, profile) {
		const cacheKey = getBeaconRepeatingCreationProfileCacheKey(characterId, sectionName);
		const cachedProfile = cloneBeaconRepeatingCreationProfile(profile);
		if (!cacheKey || !cachedProfile) {
			return false;
		}
		const cache = getBeaconRepeatingCreationProfileCache();
		const existingSignature = getBeaconRepeatingCreationProfileSchemaSignature(cache[cacheKey]);
		const proposedSignature = getBeaconRepeatingCreationProfileSchemaSignature(cachedProfile);
		if (existingSignature && existingSignature === proposedSignature) {
			return false;
		}
		cache[cacheKey] = cachedProfile;
		return true;
	}

	function getCachedBeaconRepeatingCreationProfile(characterId, sectionName) {
		const cacheKey = getBeaconRepeatingCreationProfileCacheKey(characterId, sectionName);
		const cached = cacheKey ? getBeaconRepeatingCreationProfileCache()[cacheKey] : undefined;
		const profile = cloneBeaconRepeatingCreationProfile(cached);
		if (!profile || !profile.parentPath || !Array.isArray(profile.parentPath)) {
			return undefined;
		}
		const normalizedProfileRoot = normalizeBeaconLookupName(profile.rootAttributeName || profile.rootName);
		const normalizedProfilePath = profile.parentPath.map((segment) => normalizeBeaconLookupName(segment));
		if (normalizedProfileRoot === "builder"
			|| normalizedProfilePath.includes("alldecisions")
			|| normalizedProfilePath.includes("decisions")) {
			invalidateCachedBeaconRepeatingCreationProfile(characterId, sectionName);
			return undefined;
		}

		const rootAttribute = findObjs({
			_type: "attribute",
			_characterid: characterId,
			name: profile.rootAttributeName || profile.rootName
		}, { caseInsensitive: true })[0];
		if (!rootAttribute) {
			return undefined;
		}
		const parsedRoot = parseBeaconStructuredValue(rootAttribute.get("current"));
		if (!parsedRoot || typeof parsedRoot !== "object") {
			return undefined;
		}
		const located = getBeaconStructuredContainer(parsedRoot, profile.parentPath);
		if (!located.success) {
			return undefined;
		}
		profile.rootAttributeId = rootAttribute.id;
		profile.rootAttributeName = rootAttribute.get("name");
		return profile;
	}


	function invalidateCachedBeaconRepeatingCreationProfile(characterId, sectionName) {
		const cacheKey = getBeaconRepeatingCreationProfileCacheKey(characterId, sectionName);
		const cache = getBeaconRepeatingCreationProfileCache();
		if (!cacheKey || !Object.prototype.hasOwnProperty.call(cache, cacheKey)) {
			return false;
		}
		delete cache[cacheKey];
		return true;
	}

	async function findBeaconRepeatingCreationProfile(characterId, sectionName, targetState, debug, options = {}) {
		const skipCache = options && options.skipCache === true;
		const logContext = options && options.logContext ? String(options.logContext) : "--!or";
		let profile = buildBeaconRepeatingCreationProfile(targetState);
		if (profile) {
			const cacheUpdated = cacheBeaconRepeatingCreationProfile(characterId, sectionName, profile);
			if (debug && cacheUpdated) {
				log(`ScriptCards Beacon ${logContext}: refreshed the shared ${sectionName} creation profile from the destination character.`);
			}
			return { success: true, profile, learnedFrom: characterId, source: "destination exemplar" };
		}

		if (!skipCache) {
			profile = getCachedBeaconRepeatingCreationProfile(characterId, sectionName);
			if (profile) {
				if (debug) {
					log(`ScriptCards Beacon ${logContext}: using the shared ${sectionName} creation profile for ${getBeaconRepeatingSheetIdentity(characterId)}.`);
				}
				return { success: true, profile, learnedFrom: "cached profile", source: "cached profile" };
			}
		}

		const destinationSheetIdentity = getBeaconRepeatingSheetIdentity(characterId);
		for (const character of findObjs({ _type: "character" })) {
			if (!character || character.id === characterId
				|| getBeaconRepeatingSheetIdentity(character.id) !== destinationSheetIdentity) {
				continue;
			}
			const candidateState = await buildBeaconRepeatingState(character.id, sectionName, false);
			profile = buildBeaconRepeatingCreationProfile(candidateState);
			if (profile) {
				const cacheUpdated = cacheBeaconRepeatingCreationProfile(characterId, sectionName, profile);
				if (debug) {
					log(
						`ScriptCards Beacon ${logContext}: learned ${sectionName} creation metadata from character ${character.id}`
						+ `${cacheUpdated ? " and updated the shared profile" : " using the existing shared profile"}.`
					);
				}
				return { success: true, profile, learnedFrom: character.id, source: "cross-character exemplar" };
			}
		}

		return {
			success: false,
			error: `section "${sectionName}" has no native example row on the destination character or any other compatible Beacon character, and no previously learned profile is available. The current Beacon SDK does not expose a safe generic repeating-row constructor, so ScriptCards will not create an untyped record`
		};
	}

	function ensureBeaconOriginalRepeatingVisibleName(fields) {
		const visibleIdentity = fields.find((field) =>
			BEACON_REPEATING_VISIBLE_FIELDS.has(normalizeBeaconLookupName(field.name))
			&& String(field.current).trim() !== ""
		);
		if (!visibleIdentity) {
			fields.push({ name: "name", current: "New Entry", max: "" });
		}
		return fields;
	}


	function clearLoadedBeaconRepeatingState(characterId) {
		if (!repeatingBeaconState || String(repeatingBeaconState.characterId) !== String(characterId)) {
			return;
		}
		setCurrentBeaconRepeatingRow(undefined, -1);
	}

	function restoreBeaconStructuredRoots(rootAttribute, rollbackProperties, characterId) {
		try {
			rootAttribute.setWithWorker(rollbackProperties);
			invalidateBeaconCharacterCaches(characterId);
			clearLoadedBeaconRepeatingState(characterId);
			return "";
		} catch (error) {
			return error && error.message ? error.message : String(error);
		}
	}

	function refreshLoadedBeaconRepeatingState(characterId, rootName, path, value) {
		if (!repeatingBeaconState || String(repeatingBeaconState.characterId) !== String(characterId)) {
			return;
		}

		const normalizedRoot = normalizeBeaconLookupName(rootName) === "sheet"
			? "store"
			: normalizeBeaconLookupName(rootName);
		const recordPath = Array.isArray(path) ? path.slice(0, -1) : [];
		const fieldName = Array.isArray(path) && path.length ? path[path.length - 1] : undefined;
		const normalizedField = normalizeBeaconLookupName(fieldName);
		if (BEACON_REPEATING_PROTECTED_FIELDS.has(normalizedField)
			|| beaconRepeatingCreationStructuralField(fieldName, value, repeatingBeaconState.sectionName)) {
			clearLoadedBeaconRepeatingState(characterId);
			return;
		}

		for (const row of repeatingBeaconState.rows || []) {
			row.values = {};
			delete row.completeFieldEntries;
			if (!fieldName
				|| normalizeBeaconLookupName(row.rootName) !== normalizedRoot
				|| !Array.isArray(row.path)
				|| row.path.length !== recordPath.length
				|| row.path.some((segment, index) => String(segment) !== String(recordPath[index]))) {
				continue;
			}

			const canonicalField = beaconOwnPropertyKey(row.record || {}, fieldName);
			if (canonicalField !== undefined) {
				row.record[canonicalField] = value;
				row.values[`current\u0000${String(canonicalField).toLowerCase()}`] = beaconRepeatingValue(value);
			}
		}

		if (repeatingBeaconState.rows && repeatingBeaconState.rows[repeatingIndex]) {
			repeatingSection = beaconRepeatingSectionArray(repeatingBeaconState.rows[repeatingIndex]);
		}
	}

	async function pollBeaconUntilSuccess(check, attempts = 20, delayMilliseconds = 50) {
		let result = { success: false };
		for (let attempt = 0; attempt < attempts; attempt++) {
			result = await check(attempt) || { success: false };
			if (result.success) {
				return result;
			}
			if (attempt < attempts - 1) {
				await new Promise((resolve) => setTimeout(resolve, delayMilliseconds));
			}
		}
		return result;
	}

	async function waitForCreatedBeaconRepeatingRow(characterId, sectionName, rowId) {
		const result = await pollBeaconUntilSuccess(async () => {
			invalidateBeaconCharacterCaches(characterId);
			const state = await buildBeaconRepeatingState(characterId, sectionName, false);
			const row = state && state.rows
				? state.rows.find((candidate) => String(candidate.id) === String(rowId))
				: undefined;
			return { success: Boolean(row), row };
		}, 10);
		return result.success ? result.row : undefined;
	}



	async function copyBeaconRepeatingRowByFieldMatch(
		sourceCharacterId,
		destinationCharacterId,
		sourceSectionName,
		destinationSectionName,
		matchField,
		matchValue,
		debug
	) {
		if (!getObj("character", sourceCharacterId)) {
			return { success: false, error: `source character "${sourceCharacterId}" was not found` };
		}
		if (!getObj("character", destinationCharacterId)) {
			return { success: false, error: `destination character "${destinationCharacterId}" was not found` };
		}

		const normalizedSourceSection = normalizeBeaconOriginalRepeatingSection(sourceSectionName);
		const normalizedDestinationSection = normalizeBeaconOriginalRepeatingSection(destinationSectionName);
		if (!normalizedSourceSection) {
			return { success: false, error: `a source repeating-section name is required` };
		}
		if (!normalizedDestinationSection) {
			return { success: false, error: `a destination repeating-section name is required` };
		}
		if (matchField === undefined || matchField === null || String(matchField).trim() === "") {
			return { success: false, error: `a source-row field name is required` };
		}

		let matcher;
		try {
			matcher = new RegExp(String(matchValue === undefined || matchValue === null ? "" : matchValue), "i");
		} catch (error) {
			return {
				success: false,
				error: `match value "${matchValue}" is not a valid regular expression: ${error.message}`
			};
		}

		const sourceState = await buildBeaconRepeatingState(
			sourceCharacterId,
			normalizedSourceSection,
			debug
		);
		if (!sourceState) {
			return {
				success: false,
				error: `source section "${normalizedSourceSection}" is not exposed as a Beacon repeating section`
			};
		}

		let matchedRow;
		let matchedIndex = -1;
		let matchedValue = "";
		let regexMatchedRow;
		let regexMatchedIndex = -1;
		let regexMatchedValue = "";
		const literalMatchValue = String(matchValue === undefined || matchValue === null ? "" : matchValue);
		for (let rowIndex = 0; rowIndex < (sourceState.rows || []).length; rowIndex++) {
			const fieldValue = await getBeaconRepeatingField(
				sourceState,
				rowIndex,
				matchField,
				"current",
				debug
			);
			const comparableValue = fieldValue === undefined || fieldValue === null
				? ""
				: String(fieldValue);

			// Try a literal case-insensitive field match before fuzzy or regular-expression
			// matching so names containing punctuation, such as "Dagger (Ranged)", do not
			// require escaping.
			if (comparableValue.toLowerCase() === literalMatchValue.toLowerCase()) {
				matchedRow = sourceState.rows[rowIndex];
				matchedIndex = rowIndex;
				matchedValue = comparableValue;
				break;
			}
			if (!regexMatchedRow && matcher.test(comparableValue)) {
				regexMatchedRow = sourceState.rows[rowIndex];
				regexMatchedIndex = rowIndex;
				regexMatchedValue = comparableValue;
			}
		}
		if (!matchedRow && regexMatchedRow) {
			matchedRow = regexMatchedRow;
			matchedIndex = regexMatchedIndex;
			matchedValue = regexMatchedValue;
		}

		if (!matchedRow) {
			return {
				success: false,
				noMatch: true,
				error: `no row in "${normalizedSourceSection}" matched field "${matchField}" against "${matchValue}"`
			};
		}

		const copied = await copyBeaconResolvedRepeatingRow(
			sourceCharacterId,
			destinationCharacterId,
			normalizedSourceSection,
			normalizedDestinationSection,
			matchedRow,
			debug,
			"copybyfieldmatch"
		);
		if (copied.success) {
			copied.matchField = String(matchField);
			copied.matchValue = String(matchValue === undefined || matchValue === null ? "" : matchValue);
			copied.matchedFieldValue = matchedValue;
			copied.sourceRowIndex = matchedIndex;
		}
		return copied;
	}

	async function copyBeaconRepeatingRowByIndex(
		sourceCharacterId,
		destinationCharacterId,
		sourceSectionName,
		destinationSectionName,
		sourceRowIndex,
		debug
	) {
		if (!getObj("character", sourceCharacterId)) {
			return { success: false, error: `source character "${sourceCharacterId}" was not found` };
		}
		if (!getObj("character", destinationCharacterId)) {
			return { success: false, error: `destination character "${destinationCharacterId}" was not found` };
		}

		const normalizedSourceSection = normalizeBeaconOriginalRepeatingSection(sourceSectionName);
		const normalizedDestinationSection = normalizeBeaconOriginalRepeatingSection(destinationSectionName);
		if (!normalizedSourceSection) {
			return { success: false, error: `a source repeating-section name is required` };
		}
		if (!normalizedDestinationSection) {
			return { success: false, error: `a destination repeating-section name is required` };
		}

		const numericRowIndex = Number(sourceRowIndex);
		if (!Number.isInteger(numericRowIndex) || numericRowIndex < 0) {
			return { success: false, error: `source row index "${sourceRowIndex}" is not a non-negative integer` };
		}

		const sourceState = await buildBeaconRepeatingState(
			sourceCharacterId,
			normalizedSourceSection,
			debug
		);
		if (!sourceState) {
			return {
				success: false,
				error: `source section "${normalizedSourceSection}" is not exposed as a Beacon repeating section`
			};
		}
		const sourceRow = sourceState.rows && sourceState.rows[numericRowIndex];
		if (!sourceRow) {
			return {
				success: false,
				error: `source section "${normalizedSourceSection}" has no row at index ${numericRowIndex}`
			};
		}

		const copied = await copyBeaconResolvedRepeatingRow(
			sourceCharacterId,
			destinationCharacterId,
			normalizedSourceSection,
			normalizedDestinationSection,
			sourceRow,
			debug,
			"copybyindex"
		);
		if (copied.success) {
			copied.sourceRowIndex = numericRowIndex;
		}
		return copied;
	}


	function beaconRepeatingRelationshipIds(value) {
		const parsed = parseBeaconStructuredValue(value);
		if (!Array.isArray(parsed)) {
			return [];
		}
		return parsed
			.map((item) => String(item == null ? "" : item).trim())
			.filter((item) => item !== "");
	}

	function beaconRepeatingRelationshipValue(sampleValue, ids) {
		const normalizedIds = Array.from(ids || []).map((item) => String(item));
		if (Array.isArray(sampleValue)) {
			return normalizedIds;
		}
		if (typeof sampleValue === "string") {
			const parsed = parseBeaconStructuredValue(sampleValue);
			if (Array.isArray(parsed)) {
				return JSON.stringify(normalizedIds);
			}
		}
		return normalizedIds;
	}

	function setBeaconRepeatingRecordField(record, fieldName, value) {
		const existingField = beaconOwnPropertyKey(record, fieldName);
		record[existingField === undefined ? fieldName : existingField] = value;
	}

	function beaconRepeatingContainerRecords(container) {
		return Array.isArray(container)
			? container.filter((record) => record && typeof record === "object")
			: Object.values(container).filter((record) => record && typeof record === "object");
	}

	function allocateBeaconRepeatingCanonicalKey(container) {
		if (Array.isArray(container)) {
			return String(container.length);
		}
		let canonicalKey;
		do {
			canonicalKey = uuidv4();
		} while (Object.prototype.hasOwnProperty.call(container, canonicalKey));
		return canonicalKey;
	}

	function insertBeaconRepeatingCanonicalRecord(container, canonicalKey, record) {
		if (Array.isArray(container)) {
			container.push(record);
			return;
		}
		container[canonicalKey] = record;
	}

	function setBeaconRepeatingCanonicalRecord(container, canonicalKey, record) {
		if (!container || typeof container !== "object") {
			return { success: false, error: `the destination canonical container is unavailable` };
		}
		if (Array.isArray(container)) {
			if (!/^\d+$/.test(String(canonicalKey))) {
				return { success: false, error: `canonical array key "${canonicalKey}" is not numeric` };
			}
			const index = Number(canonicalKey);
			while (container.length <= index) {
				container.push(null);
			}
			container[index] = record;
			return { success: true };
		}
		container[canonicalKey] = record;
		return { success: true };
	}

	function remapBeaconRepeatingMaxRelationships(record, canonicalKeyMap) {
		if (!record || typeof record !== "object" || Array.isArray(record)) {
			return;
		}
		const parentField = beaconOwnPropertyKey(record, "parentID");
		if (parentField !== undefined) {
			const mappedParent = canonicalKeyMap.get(String(record[parentField]));
			if (mappedParent !== undefined) {
				record[parentField] = mappedParent;
			}
		}
		const childField = beaconOwnPropertyKey(record, "childIDs");
		if (childField !== undefined) {
			const sourceChildren = beaconRepeatingRelationshipIds(record[childField]);
			const mappedChildren = sourceChildren
				.map((childId) => canonicalKeyMap.get(String(childId)))
				.filter((childId) => childId !== undefined);
			record[childField] = beaconRepeatingRelationshipValue(record[childField], mappedChildren);
		}
	}

	function copyBeaconRepeatingMaxRecords(
		sourceMaxRoot,
		sourceParentPath,
		destinationMaxRoot,
		destinationCurrentRoot,
		destinationParentPath,
		canonicalKeyMap
	) {
		if (!sourceMaxRoot || typeof sourceMaxRoot !== "object") {
			return { success: true, copiedCount: 0, expected: [] };
		}
		const sourceLocated = getBeaconStructuredContainer(sourceMaxRoot, sourceParentPath);
		if (!sourceLocated.success) {
			return { success: true, copiedCount: 0, expected: [] };
		}
		const scaffolded = ensureBeaconStructuredParentPath(
			destinationMaxRoot,
			destinationCurrentRoot,
			destinationParentPath.concat("__scriptcards_max_record__")
		);
		if (!scaffolded.success) {
			return scaffolded;
		}
		const destinationLocated = getBeaconStructuredContainer(destinationMaxRoot, destinationParentPath);
		if (!destinationLocated.success) {
			return destinationLocated;
		}

		const expected = [];
		for (const [sourceCanonicalKey, destinationCanonicalKey] of canonicalKeyMap.entries()) {
			const sourceRecord = getBeaconRepeatingCanonicalRecord(sourceLocated.container, sourceCanonicalKey);
			if (sourceRecord === undefined || sourceRecord === null) {
				continue;
			}
			let clonedRecord = sourceRecord;
			try {
				clonedRecord = JSON.parse(JSON.stringify(sourceRecord));
			} catch (error) {
				return {
					success: false,
					error: `maximum data for canonical record "${sourceCanonicalKey}" could not be cloned: ${error.message}`
				};
			}
			remapBeaconRepeatingMaxRelationships(clonedRecord, canonicalKeyMap);
			const inserted = setBeaconRepeatingCanonicalRecord(
				destinationLocated.container,
				destinationCanonicalKey,
				clonedRecord
			);
			if (!inserted.success) {
				return inserted;
			}
			expected.push({
				path: destinationParentPath.concat(destinationCanonicalKey),
				value: clonedRecord
			});
		}
		return { success: true, copiedCount: expected.length, expected };
	}

	function getBeaconRepeatingCanonicalRecord(container, canonicalKey) {
		if (!container || typeof container !== "object") {
			return undefined;
		}
		if (Array.isArray(container)) {
			if (!/^\d+$/.test(String(canonicalKey))) {
				return undefined;
			}
			return container[Number(canonicalKey)];
		}
		return container[canonicalKey];
	}

	function applyBeaconRepeatingLinkedParent(record, parentCanonicalKey) {
		const parentField = beaconOwnPropertyKey(record, "parentID");
		if (parentField !== undefined || parentCanonicalKey !== "") {
			setBeaconRepeatingRecordField(record, parentField === undefined ? "parentID" : parentField, parentCanonicalKey);
		}
	}

	function applyBeaconRepeatingLinkedChildren(record, sourceSampleValue, childCanonicalKeys) {
		const childField = beaconOwnPropertyKey(record, "childIDs");
		if (childField !== undefined || childCanonicalKeys.length) {
			setBeaconRepeatingRecordField(
				record,
				childField === undefined ? "childIDs" : childField,
				beaconRepeatingRelationshipValue(sourceSampleValue, childCanonicalKeys)
			);
		}
	}

	function cloneBeaconRepeatingLinkedRecordGraph(
		sourceContainer,
		destinationContainer,
		sourceCanonicalKey,
		destinationParentCanonicalKey,
		destinationCharacterId,
		canonicalKeyMap,
		generatedRowIds
	) {
		const normalizedSourceKey = String(sourceCanonicalKey);
		if (canonicalKeyMap.has(normalizedSourceKey)) {
			return {
				success: true,
				canonicalKey: canonicalKeyMap.get(normalizedSourceKey),
				createdCount: 0
			};
		}

		const sourceRecord = getBeaconRepeatingCanonicalRecord(sourceContainer, sourceCanonicalKey);
		if (!sourceRecord || typeof sourceRecord !== "object" || Array.isArray(sourceRecord)) {
			return {
				success: false,
				error: `linked Beacon record key "${sourceCanonicalKey}" was not found beside the source repeating row`
			};
		}

		let clonedRecord;
		try {
			clonedRecord = JSON.parse(JSON.stringify(sourceRecord));
		} catch (error) {
			return {
				success: false,
				error: `linked Beacon record "${sourceCanonicalKey}" could not be cloned: ${error.message}`
			};
		}

		const childField = beaconOwnPropertyKey(sourceRecord, "childIDs");
		const sourceChildValue = childField === undefined ? undefined : sourceRecord[childField];
		const sourceChildKeys = beaconRepeatingRelationshipIds(sourceChildValue);
		const linkedProfile = {
			exemplar: sourceRecord,
			membershipFields: {}
		};

		let baseInfo;
		for (let attempt = 0; attempt < 20; attempt++) {
			baseInfo = applyBeaconRepeatingCreationBase(
				clonedRecord,
				linkedProfile,
				destinationCharacterId,
				beaconRepeatingContainerRecords(destinationContainer)
			);
			if (!generatedRowIds.has(String(baseInfo.rowId))) {
				break;
			}
			baseInfo = undefined;
		}
		if (!baseInfo) {
			return {
				success: false,
				error: `a unique identity could not be generated for linked Beacon record "${sourceCanonicalKey}"`
			};
		}
		generatedRowIds.add(String(baseInfo.rowId));

		const destinationCanonicalKey = allocateBeaconRepeatingCanonicalKey(destinationContainer);
		canonicalKeyMap.set(normalizedSourceKey, destinationCanonicalKey);
		applyBeaconRepeatingLinkedParent(clonedRecord, destinationParentCanonicalKey);
		insertBeaconRepeatingCanonicalRecord(destinationContainer, destinationCanonicalKey, clonedRecord);

		const destinationChildKeys = [];
		let createdCount = 1;
		for (const sourceChildKey of sourceChildKeys) {
			const clonedChild = cloneBeaconRepeatingLinkedRecordGraph(
				sourceContainer,
				destinationContainer,
				sourceChildKey,
				destinationCanonicalKey,
				destinationCharacterId,
				canonicalKeyMap,
				generatedRowIds
			);
			if (!clonedChild.success) {
				return clonedChild;
			}
			destinationChildKeys.push(clonedChild.canonicalKey);
			createdCount += clonedChild.createdCount;
		}
		applyBeaconRepeatingLinkedChildren(clonedRecord, sourceChildValue, destinationChildKeys);

		return {
			success: true,
			canonicalKey: destinationCanonicalKey,
			rowId: baseInfo.rowId,
			createdCount
		};
	}


	async function copyBeaconResolvedRepeatingRow(
		sourceCharacterId,
		destinationCharacterId,
		normalizedSourceSection,
		normalizedDestinationSection,
		sourceRow,
		debug,
		operationName
	) {
		if (!sourceRow.record
			|| typeof sourceRow.record !== "object"
			|| Array.isArray(sourceRow.record)
			|| !sourceRow.rootName
			|| !Array.isArray(sourceRow.path)
			|| sourceRow.path.length === 0) {
			return {
				success: false,
				error: `source row ${sourceRow.id || "unknown"} has no retained canonical Beacon record`
			};
		}

		const destinationState = await buildBeaconRepeatingState(
			destinationCharacterId,
			normalizedDestinationSection,
			debug
		);
		if (!destinationState) {
			return {
				success: false,
				error: `destination section "${normalizedDestinationSection}" is not exposed as a Beacon repeating section`
			};
		}

		const sourceProfile = buildBeaconRepeatingCreationProfile({
			characterId: sourceCharacterId,
			sectionName: normalizedSourceSection,
			rows: [sourceRow]
		});
		if (!sourceProfile) {
			return {
				success: false,
				error: `source row ${sourceRow.id || "unknown"} could not supply a canonical creation profile`
			};
		}

		let destinationProfile = buildBeaconRepeatingCreationProfile(destinationState);
		let destinationProfileSource = "destination exemplar";
		if (!destinationProfile && normalizedDestinationSection === normalizedSourceSection) {
			destinationProfile = sourceProfile;
			destinationProfileSource = "source row";
		}
		if (!destinationProfile && normalizedDestinationSection !== normalizedSourceSection) {
			destinationProfile = deriveBeaconRepeatingNumericDestinationProfile(
				sourceProfile,
				normalizedSourceSection,
				normalizedDestinationSection
			);
			if (destinationProfile) {
				destinationProfileSource = "source numeric-section translation";
			}
		}
		if (!destinationProfile) {
			const discovered = await findBeaconRepeatingCreationProfile(
				destinationCharacterId,
				normalizedDestinationSection,
				destinationState,
				debug,
				{ logContext: `repeatingrow;${operationName}` }
			);
			if (!discovered.success) {
				return {
					success: false,
					error: `destination section "${normalizedDestinationSection}" has no usable creation profile: ${discovered.error}`
				};
			}
			destinationProfile = discovered.profile;
			destinationProfileSource = discovered.source;
		}

		const rootName = destinationProfile.rootAttributeName || destinationProfile.rootName;
		const rootAttribute = findObjs({
			_type: "attribute",
			_characterid: destinationCharacterId,
			name: rootName
		}, { caseInsensitive: true })[0];
		if (!rootAttribute) {
			return {
				success: false,
				error: `destination character has no structured Beacon root named "${rootName}"`
			};
		}

		const rawRoot = rootAttribute.get("current");
		const parsedRoot = parseBeaconStructuredValue(rawRoot);
		if (!parsedRoot || typeof parsedRoot !== "object") {
			return {
				success: false,
				error: `destination Beacon root "${rootName}" does not contain structured current data`
			};
		}

		let updatedRoot;
		let newRecord;
		try {
			updatedRoot = JSON.parse(JSON.stringify(parsedRoot));
			newRecord = JSON.parse(JSON.stringify(sourceRow.record));
		} catch (error) {
			return {
				success: false,
				error: `Beacon repeating-row data could not be cloned: ${error.message}`
			};
		}

		const located = getBeaconStructuredContainer(updatedRoot, destinationProfile.parentPath);
		if (!located.success) {
			return located;
		}
		const container = located.container;
		const siblingRecords = beaconRepeatingContainerRecords(container);

		const sourceRootAttribute = sourceRow.attributeId
			? getObj("attribute", sourceRow.attributeId)
			: findObjs({
				_type: "attribute",
				_characterid: sourceCharacterId,
				name: sourceRow.rootAttributeName || sourceRow.rootName
			}, { caseInsensitive: true })[0];
		if (!sourceRootAttribute) {
			return {
				success: false,
				error: `source row ${sourceRow.id || "unknown"} has no readable structured Beacon root`
			};
		}
		const parsedSourceRoot = parseBeaconStructuredValue(sourceRootAttribute.get("current"));
		const parsedSourceMaxRoot = parseBeaconStructuredValue(sourceRootAttribute.get("max"));
		if (!parsedSourceRoot || typeof parsedSourceRoot !== "object") {
			return {
				success: false,
				error: `source Beacon root "${sourceRow.rootAttributeName || sourceRow.rootName}" does not contain structured current data`
			};
		}
		const sourceLocated = getBeaconStructuredContainer(parsedSourceRoot, sourceRow.path.slice(0, -1));
		if (!sourceLocated.success) {
			return {
				success: false,
				error: `source linked-record container could not be resolved: ${sourceLocated.error}`
			};
		}
		const sourceContainer = sourceLocated.container;
		const sourceCanonicalKey = String(sourceRow.path[sourceRow.path.length - 1]);
		const sourceChildField = beaconOwnPropertyKey(sourceRow.record, "childIDs");
		const sourceChildValue = sourceChildField === undefined
			? undefined
			: sourceRow.record[sourceChildField];
		const sourceChildKeys = beaconRepeatingRelationshipIds(sourceChildValue);

		if (normalizedDestinationSection !== normalizedSourceSection) {
			for (const sourceMembershipField of Object.keys(sourceProfile.membershipFields || {})) {
				const sourceRecordField = beaconOwnPropertyKey(newRecord, sourceMembershipField);
				const destinationMembershipField = beaconOwnPropertyKey(
					destinationProfile.membershipFields || {},
					sourceMembershipField
				);
				if (sourceRecordField !== undefined && destinationMembershipField === undefined) {
					delete newRecord[sourceRecordField];
				}
			}
		}
		for (const [fieldName, fieldValue] of Object.entries(destinationProfile.membershipFields || {})) {
			const existingField = beaconOwnPropertyKey(newRecord, fieldName);
			newRecord[existingField === undefined ? fieldName : existingField] = fieldValue;
		}

		const baseInfo = applyBeaconRepeatingCreationBase(
			newRecord,
			destinationProfile,
			destinationCharacterId,
			siblingRecords
		);
		const rowId = baseInfo.rowId;
		const generatedRowIds = new Set([String(rowId)]);

		const canonicalKey = allocateBeaconRepeatingCanonicalKey(container);
		insertBeaconRepeatingCanonicalRecord(container, canonicalKey, newRecord);

		const canonicalKeyMap = new Map([[sourceCanonicalKey, canonicalKey]]);
		const destinationChildKeys = [];
		let linkedRecordCount = 0;
		for (const sourceChildKey of sourceChildKeys) {
			const clonedChild = cloneBeaconRepeatingLinkedRecordGraph(
				sourceContainer,
				container,
				sourceChildKey,
				canonicalKey,
				destinationCharacterId,
				canonicalKeyMap,
				generatedRowIds
			);
			if (!clonedChild.success) {
				return clonedChild;
			}
			destinationChildKeys.push(clonedChild.canonicalKey);
			linkedRecordCount += clonedChild.createdCount;
		}
		applyBeaconRepeatingLinkedChildren(newRecord, sourceChildValue, destinationChildKeys);

		const rawMaxRoot = rootAttribute.get("max");
		let copiedMaximums = { success: true, copiedCount: 0, expected: [] };
		let updatedMaxRoot;
		if (parsedSourceMaxRoot && typeof parsedSourceMaxRoot === "object") {
			const parsedDestinationMaxRoot = parseBeaconStructuredValue(rawMaxRoot);
			const destinationMaxTemplate = parsedDestinationMaxRoot && typeof parsedDestinationMaxRoot === "object"
				? parsedDestinationMaxRoot
				: (Array.isArray(updatedRoot) ? [] : {});
			try {
				updatedMaxRoot = JSON.parse(JSON.stringify(destinationMaxTemplate));
			} catch (error) {
				return { success: false, error: `destination Beacon max root "${rootName}" could not be cloned: ${error.message}` };
			}
			copiedMaximums = copyBeaconRepeatingMaxRecords(
				parsedSourceMaxRoot,
				sourceRow.path.slice(0, -1),
				updatedMaxRoot,
				updatedRoot,
				destinationProfile.parentPath,
				canonicalKeyMap
			);
			if (!copiedMaximums.success) {
				return copiedMaximums;
			}
		}

		const writeProperties = {
			current: typeof rawRoot === "string" ? JSON.stringify(updatedRoot) : updatedRoot
		};
		if (copiedMaximums.copiedCount) {
			writeProperties.max = typeof rawMaxRoot === "string" ? JSON.stringify(updatedMaxRoot) : updatedMaxRoot;
		}
		try {
			rootAttribute.setWithWorker(writeProperties);
		} catch (error) {
			return {
				success: false,
				error: error && error.message ? error.message : error
			};
		}

		const rollbackProperties = { current: rawRoot };
		if (copiedMaximums.copiedCount) {
			rollbackProperties.max = rawMaxRoot;
		}

		for (const expectedMaximum of copiedMaximums.expected) {
			const persistedMaximum = await waitForBeaconStructuredWrite(
				rootAttribute,
				expectedMaximum.path,
				expectedMaximum.value,
				"max"
			);
			if (!persistedMaximum.success) {
				const rollbackError = restoreBeaconStructuredRoots(rootAttribute, rollbackProperties, destinationCharacterId);
				return {
					success: false,
					partialRowId: rollbackError ? rowId : "",
					rolledBack: !rollbackError,
					error: rollbackError
						? `copied maximum data for row ${rowId} did not persist, and rollback failed: ${rollbackError}`
						: `copied maximum data for row ${rowId} did not persist; the destination roots were restored`
				};
			}
		}

		clearLoadedBeaconRepeatingState(destinationCharacterId);
		const projectedRow = await waitForCreatedBeaconRepeatingRow(
			destinationCharacterId,
			normalizedDestinationSection,
			rowId
		);
		let sourceProjectionConflict = false;
		if (projectedRow && normalizedDestinationSection !== normalizedSourceSection) {
			invalidateBeaconCharacterCaches(destinationCharacterId);
			const oldSectionState = await buildBeaconRepeatingState(
				destinationCharacterId,
				normalizedSourceSection,
				false
			);
			sourceProjectionConflict = Boolean(
				oldSectionState
				&& Array.isArray(oldSectionState.rows)
				&& oldSectionState.rows.some((candidate) => String(candidate.id) === String(rowId))
			);
		}
		if (!projectedRow || sourceProjectionConflict) {
			const rollbackError = restoreBeaconStructuredRoots(rootAttribute, rollbackProperties, destinationCharacterId);
			const verificationError = sourceProjectionConflict
				? `canonical row ${rowId} appeared in both ${normalizedSourceSection} and ${normalizedDestinationSection}`
				: `canonical row ${rowId} was written but its ${normalizedDestinationSection} projection was not verified`;
			return {
				success: false,
				partialRowId: rollbackError ? rowId : "",
				rolledBack: !rollbackError,
				error: rollbackError
					? `${verificationError}, and rollback failed: ${rollbackError}`
					: `${verificationError}; the destination root was restored`
			};
		}

		if (debug) {
			log(
				`ScriptCards Beacon repeatingrow;${operationName}: copied ` +
				`${normalizedSourceSection} row ${sourceRow.id} from character ${sourceCharacterId} ` +
				`to ${normalizedDestinationSection} row ${rowId} on character ${destinationCharacterId} ` +
				`at ${rootName}->${destinationProfile.parentPath.concat(canonicalKey).join("->")} ` +
				`using ${destinationProfileSource}, and verified its computed projection` +
				`${linkedRecordCount ? ` with ${linkedRecordCount} remapped linked record(s)` : ""}` +
				`${copiedMaximums.copiedCount ? ` and ${copiedMaximums.copiedCount} copied maximum record(s)` : ""}.`
			);
		}
		return {
			success: true,
			rowId,
			canonicalKey,
			sourceRowId: sourceRow.id,
			sourceSectionName: normalizedSourceSection,
			sectionName: normalizedDestinationSection,
			destinationProfileSource,
			linkedRecordCount,
			maximumRecordCount: copiedMaximums.copiedCount
		};
	}


	async function attemptCreateBeaconOriginalRepeatingRow(characterId, normalizedSection, suppliedFields, discovered, debug) {
		const profile = discovered.profile;
		let rootAttribute = profile.rootAttributeId
			? getObj("attribute", profile.rootAttributeId)
			: undefined;
		if (!rootAttribute || String(rootAttribute.get("_characterid")) !== String(characterId)) {
			rootAttribute = findObjs({
				_type: "attribute",
				_characterid: characterId,
				name: profile.rootAttributeName || profile.rootName
			}, { caseInsensitive: true })[0];
		}
		if (!rootAttribute) {
			return {
				success: false,
				profileInvalid: true,
				error: `the character has no structured Beacon root named "${profile.rootAttributeName || profile.rootName}"`
			};
		}

		const rawRoot = rootAttribute.get("current");
		const parsedRoot = parseBeaconStructuredValue(rawRoot);
		if (!parsedRoot || typeof parsedRoot !== "object") {
			return {
				success: false,
				profileInvalid: true,
				error: `Beacon root "${profile.rootAttributeName || profile.rootName}" does not contain structured current data`
			};
		}
		let updatedRoot;
		try {
			updatedRoot = JSON.parse(JSON.stringify(parsedRoot));
		} catch (error) {
			return { success: false, error: `Beacon root "${profile.rootAttributeName || profile.rootName}" could not be cloned: ${error.message}` };
		}

		const hasMaximumValues = suppliedFields.some((supplied) => supplied.max !== "");
		const rawMaxRoot = rootAttribute.get("max");
		let updatedMaxRoot;
		if (hasMaximumValues) {
			const parsedMaxRoot = parseBeaconStructuredValue(rawMaxRoot);
			const maxTemplate = parsedMaxRoot && typeof parsedMaxRoot === "object"
				? parsedMaxRoot
				: (Array.isArray(parsedRoot) ? [] : {});
			try {
				updatedMaxRoot = JSON.parse(JSON.stringify(maxTemplate));
			} catch (error) {
				return { success: false, error: `Beacon max root "${profile.rootAttributeName || profile.rootName}" could not be cloned: ${error.message}` };
			}
		}

		const located = getBeaconStructuredContainer(updatedRoot, profile.parentPath);
		if (!located.success) {
			return { success: false, profileInvalid: true, error: located.error };
		}
		const container = located.container;
		const siblingRecords = Array.isArray(container)
			? container.filter((record) => record && typeof record === "object")
			: Object.values(container).filter((record) => record && typeof record === "object");
		const newRecord = JSON.parse(JSON.stringify(profile.membershipFields || {}));
		const baseInfo = applyBeaconRepeatingCreationBase(newRecord, profile, characterId, siblingRecords);
		const rowId = baseInfo.rowId;
		const protectedFields = beaconRepeatingCreationProtectedFields(profile, baseInfo);
		const maximumWrites = [];

		for (const supplied of suppliedFields) {
			const currentField = resolveBeaconRepeatingCreationField(profile, supplied.name);
			if (protectedFields.has(normalizeBeaconLookupName(supplied.name))
				|| protectedFields.has(normalizeBeaconLookupName(currentField))) {
				return {
					success: false,
					error: `field "${supplied.name}" controls Beacon row identity, ordering, relationships, enabled state, or section membership and cannot be supplied to --!or`
				};
			}
			const currentSampleKey = beaconOwnPropertyKey(profile.exemplar, currentField);
			const currentSample = currentSampleKey === undefined ? undefined : profile.exemplar[currentSampleKey];
			newRecord[currentField] = coerceBeaconRepeatingCreationValue(supplied.current, currentSample);
			if (supplied.max !== "") {
				maximumWrites.push({
					fieldName: currentField,
					value: coerceBeaconRepeatingCreationValue(supplied.max, currentSample),
					sampleValue: currentSample
				});
			}
		}

		const canonicalKey = allocateBeaconRepeatingCanonicalKey(container);
		insertBeaconRepeatingCanonicalRecord(container, canonicalKey, newRecord);
		const recordPath = profile.parentPath.concat(canonicalKey);

		if (maximumWrites.length) {
			for (const maximumWrite of maximumWrites) {
				const maximumPath = recordPath.concat(maximumWrite.fieldName);
				const scaffolded = ensureBeaconStructuredParentPath(updatedMaxRoot, updatedRoot, maximumPath);
				if (!scaffolded.success) {
					return { success: false, error: scaffolded.error };
				}
				const written = setBeaconStructuredLeaf(
					updatedMaxRoot,
					maximumPath,
					maximumWrite.value,
					true,
					maximumWrite.sampleValue
				);
				if (!written.success) {
					return { success: false, error: written.error };
				}
				maximumWrite.value = written.value;
				maximumWrite.path = maximumPath;
			}
		}

		const writeProperties = {
			current: typeof rawRoot === "string" ? JSON.stringify(updatedRoot) : updatedRoot
		};
		if (maximumWrites.length) {
			writeProperties.max = typeof rawMaxRoot === "string" ? JSON.stringify(updatedMaxRoot) : updatedMaxRoot;
		}
		try {
			rootAttribute.setWithWorker(writeProperties);
		} catch (error) {
			return { success: false, error: error && error.message ? error.message : error };
		}

		const rollbackProperties = { current: rawRoot };
		if (maximumWrites.length) {
			rollbackProperties.max = rawMaxRoot;
		}

		for (const maximumWrite of maximumWrites) {
			const persistedMaximum = await waitForBeaconStructuredWrite(
				rootAttribute,
				maximumWrite.path,
				maximumWrite.value,
				"max"
			);
			if (!persistedMaximum.success) {
				const rollbackError = restoreBeaconStructuredRoots(rootAttribute, rollbackProperties, characterId);
				return {
					success: false,
					partialRowId: rollbackError ? rowId : "",
					rolledBack: !rollbackError,
					error: rollbackError
						? `maximum for canonical row ${rowId} did not persist, and rollback failed: ${rollbackError}`
						: `maximum for canonical row ${rowId} did not persist; the destination roots were restored`
				};
			}
		}

		clearLoadedBeaconRepeatingState(characterId);
		const projectedRow = await waitForCreatedBeaconRepeatingRow(characterId, normalizedSection, rowId);
		if (!projectedRow) {
			const rollbackError = restoreBeaconStructuredRoots(rootAttribute, rollbackProperties, characterId);
			return {
				success: false,
				profileInvalid: !rollbackError,
				partialRowId: rollbackError ? rowId : "",
				rolledBack: !rollbackError,
				error: rollbackError
					? `canonical row ${rowId} was written but Beacon did not expose it through ${normalizedSection}, and rollback failed: ${rollbackError}`
					: `canonical row ${rowId} was written but Beacon did not expose it through ${normalizedSection}; the destination roots were restored`
			};
		}
		cacheBeaconRepeatingCreationProfile(characterId, normalizedSection, profile);
		if (debug) {
			log(`ScriptCards Beacon --!or: created native ${normalizedSection} row ${rowId} at ${(profile.rootAttributeName || profile.rootName)}->${recordPath.join("->")} using ${discovered.source}, verified its computed projection${maximumWrites.length ? `, and stored ${maximumWrites.length} maximum value(s) in the parallel max tree` : ""}.`);
		}
		return {
			success: true,
			rowId,
			canonicalKey,
			sectionName: normalizedSection,
			learnedFrom: discovered.learnedFrom,
			maximumCount: maximumWrites.length
		};
	}

	async function createBeaconOriginalRepeatingRow(characterId, sectionName, content, debug) {
		if (!getObj("character", characterId)) {
			return { success: false, error: `character "${characterId}" was not found` };
		}
		const normalizedSection = normalizeBeaconOriginalRepeatingSection(sectionName);
		if (!normalizedSection) {
			return { success: false, error: `a SectionName is required` };
		}
		let targetState = await buildBeaconRepeatingState(characterId, normalizedSection, debug);
		if (!targetState) {
			return { success: false, error: `section "${normalizedSection}" is not exposed as a Beacon repeating section` };
		}

		const suppliedFields = ensureBeaconOriginalRepeatingVisibleName(
			parseBeaconOriginalRepeatingFields(content)
		);
		let discovered = await findBeaconRepeatingCreationProfile(
			characterId,
			normalizedSection,
			targetState,
			debug
		);
		if (!discovered.success) {
			return { success: false, error: discovered.error };
		}

		let result = await attemptCreateBeaconOriginalRepeatingRow(
			characterId,
			normalizedSection,
			suppliedFields,
			discovered,
			debug
		);
		if (result.success
			|| discovered.source !== "cached profile"
			|| result.profileInvalid !== true
			|| result.rolledBack === false) {
			return result;
		}

		invalidateCachedBeaconRepeatingCreationProfile(characterId, normalizedSection);
		if (debug) {
			log(
				`ScriptCards Beacon --!or: the shared ${normalizedSection} creation profile failed native verification and was removed. `
				+ `Searching compatible characters for a fresh exemplar.`
			);
		}
		invalidateBeaconCharacterCaches(characterId);
		targetState = await buildBeaconRepeatingState(characterId, normalizedSection, false);
		discovered = await findBeaconRepeatingCreationProfile(
			characterId,
			normalizedSection,
			targetState,
			debug,
			{ skipCache: true }
		);
		if (!discovered.success) {
			return {
				success: false,
				error: `the cached ${normalizedSection} creation profile failed (${result.error}), and ScriptCards could not learn a replacement: ${discovered.error}`
			};
		}

		result = await attemptCreateBeaconOriginalRepeatingRow(
			characterId,
			normalizedSection,
			suppliedFields,
			discovered,
			debug
		);
		return result;
	}

	function getBeaconRepeatingSectionSpec(sectionName) {
		const requestedSection = normalizeBeaconOriginalRepeatingSection(sectionName);
		if (!requestedSection) {
			return undefined;
		}

		const computedProperty = getBeaconComputedTokenBarProperty(requestedSection);
		return {
			lookupSection: requestedSection,
			property: computedProperty
				&& computedProperty.metadata
				&& computedProperty.metadata.readonly === true
				? computedProperty.property
				: undefined
		};
	}

	function beaconRepeatingCanonicalSectionStem(sectionName) {
		return normalizeBeaconLookupName(
			String(sectionName == null ? "" : sectionName).replace(/^repeating_/i, "")
		);
	}

	function dnd2024BeaconRepeatingCanonicalEntryIsLiveIntegrant(entry, adapter) {
		if (!entry || !Array.isArray(entry.path) || !adapter) {
			return false;
		}
		const normalizedRoot = normalizeBeaconLookupName(entry.rootName || entry.rootAttributeName);
		const normalizedPath = entry.path.map((segment) => normalizeBeaconLookupName(segment));
		const integrantsPath = adapter.storePaths.integrants.map((segment) => normalizeBeaconLookupName(segment));
		return normalizedRoot === normalizeBeaconLookupName(adapter.rootNames.store)
			&& normalizedPath.length >= integrantsPath.length + 1
			&& integrantsPath.every((segment, index) => normalizedPath[index] === segment);
	}

	function dnd2024BeaconSpellLevel(value) {
		const normalized = normalizeBeaconLookupName(value);
		if (normalized === "cantrip") {
			return 0;
		}
		const numeric = Number(value);
		return Number.isFinite(numeric) ? numeric : undefined;
	}

	function dnd2024BeaconRepeatingRecordKey(entry, adapter) {
		if (!entry || !Array.isArray(entry.path) || !adapter) {
			return undefined;
		}
		const integrantsLength = adapter.storePaths.integrants.length;
		return entry.path.length > integrantsLength ? String(entry.path[integrantsLength]) : undefined;
	}

	function dnd2024BeaconDisplayOrderKeys(characterId, descriptor) {
		if (!descriptor || !descriptor.displayOrderPaths || !descriptor.displayOrderPaths.length) {
			return { authoritative: false, keys: [] };
		}
		const keys = [];
		const appendKeys = (value) => {
			const parsed = parseBeaconStructuredValue(value);
			if (parsed !== undefined && parsed !== value && parsed && typeof parsed === "object") {
				appendKeys(parsed);
				return;
			}
			if (Array.isArray(value)) {
				for (const item of value) {
					appendKeys(item);
				}
				return;
			}
			if (value && typeof value === "object") {
				for (const item of Object.values(value)) {
					appendKeys(item);
				}
				return;
			}
			if (value !== undefined && value !== null && String(value).trim() !== "") {
				// A display-order bucket containing one record may be returned as a
				// scalar string instead of an array.
				keys.push(String(value).trim());
			}
		};
		for (const path of descriptor.displayOrderPaths) {
			appendKeys(readDnd2024BeaconStoreValue(characterId, path));
		}
		// Empty arrays (including serialized "[]") do not identify section
		// membership. Imported NPCs commonly leave these arrays empty and rely on
		// the canonical record's actionType instead. Only a bucket that yielded at
		// least one record key is authoritative.
		return { authoritative: keys.length > 0, keys };
	}

	function dnd2024BeaconRecordMatchesRepeatingDescriptor(record, descriptor, adapter, displayOrderAuthoritative) {
		if (!record || typeof record !== "object" || Array.isArray(record) || !descriptor || !adapter) {
			return false;
		}

		// A populated display-order bucket is the sheet's authoritative section
		// membership. Semantic fields are fallback classifiers only for sections
		// without a usable order array (for example Legendary/Mythic and Tools).
		if (!displayOrderAuthoritative && descriptor.actionTypes && descriptor.actionTypes.length) {
			const actualActionType = normalizeBeaconLookupName(beaconProperty(record, adapter.fields.actionType));
			const allowedActionTypes = descriptor.actionTypes.map((value) => normalizeBeaconLookupName(value));
			if (!actualActionType || !allowedActionTypes.includes(actualActionType)) {
				return false;
			}
		}
		if (!displayOrderAuthoritative && descriptor.categories && descriptor.categories.length) {
			const actualCategory = normalizeBeaconLookupName(beaconProperty(record, adapter.fields.category));
			const allowedCategories = descriptor.categories.map((value) => normalizeBeaconLookupName(value));
			if (!actualCategory || !allowedCategories.includes(actualCategory)) {
				return false;
			}
		}
		if (!displayOrderAuthoritative && descriptor.spellLevel !== undefined) {
			let spellLevelValue = beaconProperty(record, "level");
			if (spellLevelValue === undefined) {
				spellLevelValue = beaconProperty(record, adapter.fields.spellLevel);
			}
			const actualSpellLevel = dnd2024BeaconSpellLevel(spellLevelValue);
			if (actualSpellLevel !== descriptor.spellLevel) {
				return false;
			}
		}
		return true;
	}

	function inferDnd2024BeaconRepeatingCanonicalRows(characterId, sectionName, indexed) {
		const adapter = getDnd2024BeaconAdapter(characterId);
		const normalizedSection = normalizeBeaconOriginalRepeatingSection(sectionName).toLowerCase();
		const descriptor = adapter && adapter.repeatingSections[normalizedSection];
		if (!adapter || !descriptor || !indexed || !indexed.index || !indexed.index.current) {
			return { supported: false, rows: [], descriptor: undefined };
		}

		const displayOrder = dnd2024BeaconDisplayOrderKeys(characterId, descriptor);
		const collectionEntries = [];
		const availableRecordKeys = new Set();
		for (const collectionName of descriptor.collections) {
			const entries = indexed.index.current.get(normalizeBeaconLookupName(collectionName)) || [];
			for (const entry of entries) {
				if (!dnd2024BeaconRepeatingCanonicalEntryIsLiveIntegrant(entry, adapter)) {
					continue;
				}
				collectionEntries.push(entry);
				const recordKey = dnd2024BeaconRepeatingRecordKey(entry, adapter);
				if (recordKey) {
					availableRecordKeys.add(String(recordKey));
				}
			}
		}

		// A non-empty order array can contain stale record keys after sheet edits or
		// imports. It is authoritative only when at least one key still identifies a
		// live record in the descriptor's canonical collections. Preserve the first
		// occurrence of each matching key so duplicate order entries cannot reshuffle
		// an otherwise valid section.
		const matchedDisplayOrderKeys = [];
		const seenDisplayOrderKeys = new Set();
		for (const key of displayOrder.keys) {
			const normalizedKey = String(key);
			if (!availableRecordKeys.has(normalizedKey) || seenDisplayOrderKeys.has(normalizedKey)) {
				continue;
			}
			seenDisplayOrderKeys.add(normalizedKey);
			matchedDisplayOrderKeys.push(normalizedKey);
		}
		const displayOrderAuthoritative = matchedDisplayOrderKeys.length > 0;
		const displayOrderIndex = new Map(matchedDisplayOrderKeys.map((key, index) => [key, index]));
		const candidates = [];
		const seen = new Set();
		for (const entry of collectionEntries) {
			const recordKey = dnd2024BeaconRepeatingRecordKey(entry, adapter);
			if (displayOrderAuthoritative && (!recordKey || !displayOrderIndex.has(recordKey))) {
				continue;
			}
			// Display-order membership determines whether and where the sheet shows a
			// record. Semantic category fields are used only when the section has no
			// authoritative order bucket.
			if (!dnd2024BeaconRecordMatchesRepeatingDescriptor(
				entry.record, descriptor, adapter, displayOrderAuthoritative
			)) {
				continue;
			}
			const rowId = entry.stableIdentity || beaconRecordStableIdentity(entry.record);
			if (!rowId) {
				continue;
			}
			const uniqueKey = `${entry.attributeId}\u0000${entry.path.join("\u0000")}`;
			if (seen.has(uniqueKey)) {
				continue;
			}
			seen.add(uniqueKey);
			candidates.push({
				entry,
				rowId: String(rowId),
				displayOrder: displayOrderAuthoritative ? displayOrderIndex.get(recordKey) : undefined
			});
		}

		const rows = candidates
			.sort((left, right) => {
				if (displayOrderAuthoritative) {
					return left.displayOrder - right.displayOrder;
				}
				return beaconRecordOrder(left.entry.record) - beaconRecordOrder(right.entry.record)
					|| left.entry.discoveryIndex - right.entry.discoveryIndex;
			})
			.map((candidate, rowIndex) => ({
				id: candidate.rowId,
				selector: `$${rowIndex}`,
				characterId,
				record: candidate.entry.record,
				attributeId: candidate.entry.attributeId,
				rootName: candidate.entry.rootName,
				rootAttributeName: candidate.entry.rootAttributeName,
				path: candidate.entry.path.slice(),
				values: {},
				canonicalSectionInference: true
			}));
		return { supported: true, rows, descriptor, displayOrderAuthoritative };
	}

	function findBeaconRepeatingCanonicalEntry(indexed, rowId) {
		if (!indexed || !indexed.index || !rowId) {
			return undefined;
		}
		beaconPerformanceStats.stableIdentityLookups++;
		const entry = indexed.index.byStableIdentity.current.get(String(rowId));
		if (entry) {
			beaconPerformanceStats.stableIdentityDirectHits++;
		}
		return entry;
	}

	async function buildBeaconRepeatingState(characterId, sectionName, debug) {
		addBeaconPerformanceStat("repeatingStateRequests");
		const normalizedSectionName = String(sectionName == null ? "" : sectionName).toLowerCase();
		const stateCacheKey = `${characterId}\u0000${normalizedSectionName}`;
		if (beaconRepeatingStateCache.has(stateCacheKey)) {
			addBeaconPerformanceStat("repeatingStateCacheHits");
			const cachedState = beaconRepeatingStateCache.get(stateCacheKey);
			if (debug) {
				log(`ScriptCards Beacon repeating: ${sectionName} reused a cached per-card repeating state containing ${cachedState.rows.length} row(s).`);
			}
			return cachedState;
		}
		addBeaconPerformanceStat("repeatingStateBuilds");
		const repeatingStarted = Date.now();
		const spec = getBeaconRepeatingSectionSpec(sectionName);
		if (!spec) {
			if (debug) {
				log(`ScriptCards Beacon repeating: ${sectionName} is not exposed as a read-only computed repeating property.`);
			}
			return undefined;
		}

		const indexed = getBeaconTypedCollectionIndex(characterId, "current", false);
		const rows = [];
		let computedRows = 0;
		let unmatchedRows = 0;
		let inferredRows = 0;

		// D&D 2024 repeating projections use explicit section descriptors backed by
		// registered canonical record families. Unknown sections use generic SDK
		// enumeration; section names are never guessed.
		const dnd2024Inference = inferDnd2024BeaconRepeatingCanonicalRows(
			characterId,
			spec.lookupSection,
			indexed
		);
		if (dnd2024Inference.supported) {
			rows.push(...dnd2024Inference.rows);
			inferredRows = dnd2024Inference.rows.length;
			addBeaconPerformanceStat("repeatingCanonicalEnumerationHits");
			addBeaconPerformanceStat("repeatingCanonicalRows", inferredRows);
			addBeaconPerformanceStat("dnd2024RepeatingCanonicalEnumerationHits");
			addBeaconPerformanceStat("dnd2024RepeatingCanonicalRows", inferredRows);
			addBeaconPerformanceDetail("dnd2024RepeatingDescriptorDetails", spec.lookupSection, {
				requests: 1,
				rows: inferredRows,
				displayOrderHits: dnd2024Inference.displayOrderAuthoritative ? 1 : 0
			});
		} else if (spec.property) {
			const maximumRows = 1000;
			for (let position = 0; position < maximumRows; position++) {
				const selector = `$${position}`;
				const identityLookup = `${spec.property}_${selector}_id`;
				let rowId;
				try {
					rowId = await readBeaconSheetItem(characterId, identityLookup, "current");
				} catch (error) {
					if (debug) {
						log(`ScriptCards Beacon repeating: ${identityLookup} ended enumeration: ${error.message}`);
					}
					break;
				}
				if (beaconLookupIsUnresolved(rowId) || String(rowId).trim() === "") {
					break;
				}

				computedRows++;
				rowId = String(rowId).trim();
				const entry = findBeaconRepeatingCanonicalEntry(indexed, rowId);
				if (!entry) {
					unmatchedRows++;
					continue;
				}
				rows.push({
					id: rowId,
					selector,
					record: entry.record,
					attributeId: entry.attributeId,
					rootName: entry.rootName,
					rootAttributeName: entry.rootAttributeName,
					path: entry.path.slice(),
					values: {}
				});
			}
		}

		const repeatingState = {
			characterId,
			sectionName: spec.lookupSection,
			rows,
			enumerationRoute: dnd2024Inference.supported ? "D&D 2024 canonical section descriptor" : "computed projection"
		};
		const learnedProfile = buildBeaconRepeatingCreationProfile(repeatingState);
		if (learnedProfile) {
			cacheBeaconRepeatingCreationProfile(characterId, spec.lookupSection, learnedProfile);
		}

		const repeatingElapsed = Date.now() - repeatingStarted;
		addBeaconPerformanceStat("repeatingEnumerationMilliseconds", repeatingElapsed);
		addBeaconPerformanceStat("repeatingRowsEnumerated", computedRows + inferredRows);
		addBeaconPerformanceDetail("repeatingSectionDetails", normalizedSectionName, {
			builds: 1,
			milliseconds: repeatingElapsed,
			computedRows,
			matchedRows: rows.length - inferredRows,
			inferredRows,
			unmatchedRows
		});
		beaconRepeatingStateCache.set(stateCacheKey, repeatingState);
		if (debug) {
			log(
				`ScriptCards Beacon repeating: ${sectionName} enumerated ${computedRows} computed row(s) by position, ` +
				`matched ${rows.length - inferredRows} projected canonical record(s), inferred ${inferredRows} canonical section row(s), ` +
				`and excluded ${unmatchedRows} unmatched projection row(s); ${beaconIndexStatus(indexed)}.`
			);
		}

		return repeatingState;
	}

	function beaconRepeatingValue(value) {
		if (value === undefined || value === null) {
			return "";
		}
		if (typeof value === "object") {
			try {
				return JSON.stringify(value);
			} catch (error) {
				return "";
			}
		}
		return String(value).replace(/(?:\r\n|\r|\n)/g, "<br>");
	}


	function resolveBeaconRepeatingCanonicalAliasField(record, fieldName, sectionName) {
		const directField = beaconOwnPropertyKey(record, fieldName);
		if (directField !== undefined) {
			return directField;
		}
		const normalizedRequested = normalizeBeaconLookupName(fieldName);
		if (!normalizedRequested) {
			return undefined;
		}
		const suffixMatches = Object.keys(record || {}).filter((candidate) => {
			const normalizedCandidate = normalizeBeaconLookupName(candidate);
			return normalizedCandidate.length >= 4 && normalizedRequested.endsWith(normalizedCandidate);
		});
		if (suffixMatches.length === 1) {
			return suffixMatches[0];
		}
		const sectionStem = beaconRepeatingCanonicalSectionStem(sectionName).replace(/\d+$/g, "");
		if (sectionStem && normalizedRequested.startsWith(sectionStem)) {
			const remainder = normalizedRequested.slice(sectionStem.length);
			const remainderField = Object.keys(record || {}).find((candidate) =>
				normalizeBeaconLookupName(candidate) === remainder
			);
			if (remainderField) {
				return remainderField;
			}
		}
		return undefined;
	}

	function getBeaconRepeatingCanonicalField(record, fieldName, operation, sectionName) {
		const requestedField = resolveBeaconRepeatingCanonicalAliasField(record, fieldName, sectionName) || fieldName;

		if (operation === "max") {
			return "";
		}

		const value = beaconProperty(record, requestedField);
		return value === undefined ? "" : beaconRepeatingValue(value);
	}

	function getBeaconRepeatingCompatibilityRowId(row) {
		if (!row) {
			return "";
		}

		const shortIdField = beaconOwnPropertyKey(row.record, "shortID");
		if (shortIdField !== undefined) {
			const shortId = row.record[shortIdField];
			if (beaconPrimitive(shortId)
				&& !beaconLookupIsUnresolved(shortId)
				&& String(shortId).trim() !== "") {
				return String(shortId).trim();
			}
		}

		return row.id === undefined || row.id === null ? "" : String(row.id);
	}

	function getBeaconRepeatingCanonicalMaxField(row, fieldName, sectionName) {
		if (!row || !Array.isArray(row.path) || row.path.length === 0) {
			return undefined;
		}

		const requestedField = resolveBeaconRepeatingCanonicalAliasField(
			row.record,
			fieldName,
			sectionName
		) || fieldName;
		const canonicalField = beaconOwnPropertyKey(row.record, requestedField) || requestedField;
		let rootAttribute = row.attributeId ? getObj("attribute", row.attributeId) : undefined;
		if (!rootAttribute && row.rootAttributeName && row.characterId) {
			rootAttribute = findObjs({
				_type: "attribute",
				_characterid: row.characterId,
				name: row.rootAttributeName
			}, { caseInsensitive: true })[0];
		}
		if (!rootAttribute) {
			return undefined;
		}

		const maxRoot = parseBeaconStructuredValue(rootAttribute.get("max"));
		if (!maxRoot || typeof maxRoot !== "object") {
			return undefined;
		}
		const located = getBeaconStructuredExistingLeaf(
			maxRoot,
			row.path.concat(canonicalField)
		);
		return located.success ? beaconRepeatingValue(located.value) : undefined;
	}

	async function getBeaconRepeatingWritablePath(state, rowIndex, fieldName, debug, operation = "current", options = {}) {
		if (!state || !state.rows || !state.rows[rowIndex]) {
			return { success: false, error: `no Beacon repeating row is loaded` };
		}

		const row = state.rows[rowIndex];
		if (!row.rootName && !row.rootAttributeName) {
			return {
				success: false,
				error: `the loaded Beacon repeating row is a computed projection without a retained writable structured root`
			};
		}
		if (!Array.isArray(row.path) || row.path.length === 0) {
			return { success: false, error: `the loaded Beacon repeating row has no retained canonical record path` };
		}

		const requestedField = String(fieldName == null ? "" : fieldName).trim();
		const normalizedField = normalizeBeaconLookupName(requestedField);
		if (!requestedField || requestedField.includes("->")) {
			return { success: false, error: `a single repeating-row field name is required` };
		}
		if (!options.allowProtected && (BEACON_REPEATING_PROTECTED_FIELDS.has(normalizedField)
			|| ["xxxactionidxxxx", "id", "shortid", "uuid"].includes(normalizedField))) {
			return { success: false, error: `Beacon repeating row identity and structural fields are not writable` };
		}

		let canonicalField = beaconOwnPropertyKey(row.record, requestedField);
		let sampleValue = canonicalField === undefined ? undefined : row.record[canonicalField];
		if (canonicalField === undefined) {
			const translatedLookup = `${state.sectionName}_${row.selector}_${requestedField}`;
			let translatedValue;
			try {
				translatedValue = await readBeaconSheetItem(state.characterId, translatedLookup, "current");
			} catch (error) {
				translatedValue = undefined;
			}
			if (!beaconLookupIsUnresolved(translatedValue)) {
				const matchingFields = Object.entries(row.record || {})
					.filter(([, value]) => value === null || ["string", "number", "boolean"].includes(typeof value))
					.filter(([, value]) => beaconRepeatingValue(value) === String(translatedValue));
				if (matchingFields.length === 1) {
					canonicalField = matchingFields[0][0];
					sampleValue = matchingFields[0][1];
				}
			}
		}

		if (canonicalField === undefined) {
			const inferredFields = new Map();
			for (let candidateIndex = 0; candidateIndex < state.rows.length; candidateIndex++) {
				if (candidateIndex === rowIndex) {
					continue;
				}
				const candidateRow = state.rows[candidateIndex];
				let candidateField = beaconOwnPropertyKey(candidateRow.record, requestedField);
				if (candidateField === undefined) {
					const candidateLookup = `${state.sectionName}_${candidateRow.selector}_${requestedField}`;
					let candidateTranslatedValue;
					try {
						candidateTranslatedValue = await readBeaconSheetItem(
							state.characterId,
							candidateLookup,
							"current"
						);
					} catch (error) {
						candidateTranslatedValue = undefined;
					}
					if (!beaconLookupIsUnresolved(candidateTranslatedValue)) {
						const candidateMatches = Object.entries(candidateRow.record || {})
							.filter(([, value]) => value === null || ["string", "number", "boolean"].includes(typeof value))
							.filter(([, value]) => beaconRepeatingValue(value) === String(candidateTranslatedValue));
						if (candidateMatches.length === 1) {
							candidateField = candidateMatches[0][0];
						}
					}
				}
				if (candidateField !== undefined) {
					const candidateValue = candidateRow.record[candidateField];
					if (candidateValue === null || ["string", "number", "boolean"].includes(typeof candidateValue)) {
						inferredFields.set(normalizeBeaconLookupName(candidateField), {
							fieldName: candidateField,
							sampleValue: candidateValue
						});
					}
				}
			}
			if (inferredFields.size === 1) {
				const inferred = Array.from(inferredFields.values())[0];
				canonicalField = inferred.fieldName;
				sampleValue = inferred.sampleValue;
			}
		}

		if (canonicalField === undefined) {
			canonicalField = requestedField;
		}

		const currentRecordField = beaconOwnPropertyKey(row.record, canonicalField);
		const createMissingCurrentLeaf = currentRecordField === undefined;
		if (!createMissingCurrentLeaf) {
			canonicalField = currentRecordField;
			sampleValue = row.record[currentRecordField];
		}

		const createMissingLeaf = operation === "max" ? true : createMissingCurrentLeaf;
		const currentValue = createMissingCurrentLeaf ? undefined : row.record[canonicalField];
		if (!options.allowContainerDelete && currentValue !== null && currentValue !== undefined
			&& !["string", "number", "boolean"].includes(typeof currentValue)) {
			return {
				success: false,
				error: `field "${canonicalField}" is an object or array; repeating writes may update only a primitive leaf`
			};
		}

		const rootAttributeName = row.rootAttributeName || row.rootName;
		const rootLookup = normalizeBeaconLookupName(rootAttributeName) === "store"
			? "sheet"
			: rootAttributeName;
		const path = [rootLookup].concat(row.path, canonicalField).join("->");
		if (debug) {
			log(
				`ScriptCards Beacon repeating: writable ${operation} field ${requestedField} resolved to ${path}${operation === "max" ? "^" : ""}` +
				`${createMissingLeaf ? " and may create the missing final leaf" : ""}.`
			);
		}
		return {
			success: true,
			path,
			characterId: state.characterId,
			sectionName: state.sectionName,
			rowId: row.id,
			recordPath: row.path.slice(),
			fieldName: canonicalField,
			operation,
			createMissingLeaf,
			sampleValue
		};
	}

	async function readBeaconRepeatingProjectedField(state, row, fieldName, operation, debug) {
		const lookupName = `${state.sectionName}_${row.selector}_${fieldName}`;
		addBeaconPerformanceStat("repeatingFieldSdkCalls");
		let value;
		try {
			value = await readBeaconSheetItem(state.characterId, lookupName, operation);
		} catch (error) {
			if (debug) {
				log(`ScriptCards Beacon repeating: ${lookupName} failed: ${error.message}`);
			}
		}

		if (beaconLookupIsUnresolved(value)) {
			const canonicalValue = getBeaconRepeatingCanonicalField(row.record, fieldName, operation, state.sectionName);
			addBeaconPerformanceStat("repeatingCanonicalFallbacks");
			return canonicalValue;
		}
		return beaconRepeatingValue(value);
	}

	async function getBeaconRepeatingField(state, rowIndex, fieldName, operation, debug) {
		if (!state || !state.rows || !state.rows[rowIndex]) {
			return undefined;
		}

		addBeaconPerformanceStat("repeatingFieldRequests");
		const row = state.rows[rowIndex];
		const cacheKey = `${operation}\u0000${String(fieldName).toLowerCase()}`;
		if (Object.prototype.hasOwnProperty.call(row.values, cacheKey)) {
			return row.values[cacheKey];
		}
		if (normalizeBeaconLookupName(fieldName) === "xxxactionidxxxx") {
			const compatibilityRowId = getBeaconRepeatingCompatibilityRowId(row);
			row.values[cacheKey] = compatibilityRowId;
			return compatibilityRowId;
		}

		let value;
		if (operation === "max") {
			value = getBeaconRepeatingCanonicalMaxField(row, fieldName, state.sectionName);
		}

		// A projected repeating row has already been matched to its canonical Beacon
		// record by stable identity. Exact primitive fields and unambiguous legacy
		// aliases of primitive fields are read directly from that record. Structural
		// classifiers, computed values, containers, and unresolved fields still use
		// the native sheet-item route.
		if (value === undefined && operation === "current") {
			const normalizedField = normalizeBeaconLookupName(fieldName);
			if (!BEACON_REPEATING_LOCAL_READ_EXCLUDED_FIELDS.has(normalizedField)) {
				const canonicalField = resolveBeaconRepeatingCanonicalAliasField(
					row.record,
					fieldName,
					state.sectionName
				);
				if (canonicalField !== undefined) {
					const canonicalValue = row.record[canonicalField];
					if (canonicalValue === null || beaconPrimitive(canonicalValue)) {
						value = beaconRepeatingValue(canonicalValue);
						addBeaconPerformanceStat("repeatingLocalFieldHits");
						if (normalizeBeaconLookupName(canonicalField) !== normalizedField) {
							addBeaconPerformanceStat("repeatingLocalAliasHits");
						}
					}
				}
			}
		}

		if (value === undefined && row.canonicalSectionInference && operation === "current") {
			value = await readBeaconRepeatingProjectedField(state, row, fieldName, operation, debug);
		} else if (value === undefined && row.canonicalSectionInference) {
			value = getBeaconRepeatingCanonicalField(row.record, fieldName, operation, state.sectionName);
			addBeaconPerformanceStat("repeatingCanonicalFallbacks");
		} else if (value === undefined) {
			value = await readBeaconRepeatingProjectedField(state, row, fieldName, operation, debug);
		}
		row.values[cacheKey] = value;
		return value;
	}

	function getBeaconRepeatingRecordFields(row) {
		const fields = {};
		for (const [field, value] of Object.entries(row && row.record || {})) {
			if (normalizeBeaconLookupName(field) === "scriptcardsrepeatingsection") {
				continue;
			}
			fields[field] = beaconRepeatingValue(value);
		}
		return fields;
	}

	function beaconRepeatingSectionArray(row) {
		return row
			? [`xxxActionIDxxxx|${getBeaconRepeatingCompatibilityRowId(row)}`].concat(
				Object.entries(getBeaconRepeatingRecordFields(row)).map(([field, value]) => `${field}|${value}`)
			)
			: undefined;
	}

	function addBeaconRepeatingFieldCandidate(candidates, candidate, trusted) {
		if (candidate === undefined || candidate === null) {
			return;
		}
		const fieldName = String(candidate).trim();
		if (!/^[A-Za-z_][A-Za-z0-9_-]*$/.test(fieldName)
			|| /^repeating_/i.test(fieldName)
			|| /_max$/i.test(fieldName)) {
			return;
		}
		const normalizedField = normalizeBeaconLookupName(fieldName);
		if (!normalizedField || ["xxxactionidxxxx", "scriptcardsrepeatingsection"].includes(normalizedField)) {
			return;
		}
		const existing = candidates.get(normalizedField);
		if (!existing || (trusted && !existing.trusted)) {
			candidates.set(normalizedField, { fieldName, trusted: Boolean(trusted) });
		}
	}

	function collectBeaconRepeatingMetadataCandidates(value, candidates, depth = 0, seen = new Set()) {
		if (depth > 8 || value === undefined || value === null) {
			return;
		}
		if (typeof value === "string") {
			addBeaconRepeatingFieldCandidate(
				candidates,
				value,
				Boolean(getBeaconComputedTokenBarProperty(value))
			);
			return;
		}
		if (typeof value !== "object" || seen.has(value)) {
			return;
		}
		seen.add(value);
		if (Array.isArray(value)) {
			for (const entry of value) {
				collectBeaconRepeatingMetadataCandidates(entry, candidates, depth + 1, seen);
			}
			return;
		}
		for (const [key, entry] of Object.entries(value)) {
			addBeaconRepeatingFieldCandidate(
				candidates,
				key,
				Boolean(getBeaconComputedTokenBarProperty(String(key)))
			);
			collectBeaconRepeatingMetadataCandidates(entry, candidates, depth + 1, seen);
		}
	}

	function getBeaconRepeatingFieldCandidates(state, row) {
		const candidates = new Map();
		const record = row && row.record || {};
		for (const fieldName of Object.keys(record)) {
			if (normalizeBeaconLookupName(fieldName) !== "scriptcardsrepeatingsection") {
				addBeaconRepeatingFieldCandidate(candidates, fieldName, true);
			}
		}

		for (const cacheKey of Object.keys(row && row.values || {})) {
			const separator = cacheKey.indexOf("\u0000");
			if (separator >= 0 && cacheKey.substring(0, separator) === "current") {
				addBeaconRepeatingFieldCandidate(candidates, cacheKey.substring(separator + 1), true);
			}
		}

		const computedSummary = getBeaconComputedSummary();
		if (!computedSummary) {
			return candidates;
		}

		const sectionProperty = getBeaconComputedTokenBarProperty(state.sectionName);
		if (sectionProperty && sectionProperty.metadata) {
			collectBeaconRepeatingMetadataCandidates(sectionProperty.metadata, candidates);
		}

		const sectionFamily = normalizeBeaconLookupName(
			String(state.sectionName || "")
				.replace(/^repeating_/i, "")
				.split("-")[0]
		);
		for (const propertyName of Object.keys(computedSummary)) {
			if (/^repeating_/i.test(propertyName)) {
				const sectionPrefix = `${state.sectionName}_$`;
				if (propertyName.toLowerCase().startsWith(sectionPrefix.toLowerCase())) {
					const selectorEnd = propertyName.indexOf("_", sectionPrefix.length);
					if (selectorEnd >= 0 && selectorEnd < propertyName.length - 1) {
						addBeaconRepeatingFieldCandidate(candidates, propertyName.substring(selectorEnd + 1), true);
					}
				}
				continue;
			}
			const normalizedProperty = normalizeBeaconLookupName(propertyName);
			const canonicalAlias = resolveBeaconRepeatingCanonicalAliasField(record, propertyName, state.sectionName);
			const sectionRelated = sectionFamily && normalizedProperty.startsWith(sectionFamily);

			// A global computed name is not a repeating-row alias merely because it
			// happens to end with a canonical field name. For example, character_name,
			// npc_name, and every skill *_type property all suffix-match Spell fields
			// named name or type. Require both a section-family prefix and a canonical
			// field relationship before admitting a global computed property.
			if (sectionRelated && canonicalAlias !== undefined) {
				addBeaconRepeatingFieldCandidate(candidates, propertyName, true);
			}
		}
		return candidates;
	}

	async function getBeaconRepeatingCompleteFields(state, rowIndex, debug) {
		if (!state || !state.rows || !state.rows[rowIndex]) {
			return undefined;
		}
		const row = state.rows[rowIndex];
		if (Array.isArray(row.completeFieldEntries)) {
			return row.completeFieldEntries.slice();
		}

		const entries = [`xxxActionIDxxxx|${getBeaconRepeatingCompatibilityRowId(row)}`];
		const added = new Set(["xxxactionidxxxx"]);
		const addFieldPair = async (fieldName, currentValue) => {
			const normalizedField = normalizeBeaconLookupName(fieldName);
			if (!normalizedField || added.has(normalizedField)) {
				return;
			}
			added.add(normalizedField);
			entries.push(`${fieldName}|${currentValue === undefined ? "" : currentValue}`);
			const maxValue = await getBeaconRepeatingField(state, rowIndex, fieldName, "max", false);
			entries.push(`${fieldName}_max|${maxValue === undefined ? "" : maxValue}`);
		};

		const recordFields = getBeaconRepeatingRecordFields(row);
		for (const [fieldName, value] of Object.entries(recordFields)) {
			await addFieldPair(fieldName, value);
		}

		const candidates = getBeaconRepeatingFieldCandidates(state, row);
		let translatedFields = 0;
		for (const candidate of candidates.values()) {
			const fieldName = candidate.fieldName;
			const normalizedField = normalizeBeaconLookupName(fieldName);
			if (added.has(normalizedField)) {
				continue;
			}

			const canonicalAlias = resolveBeaconRepeatingCanonicalAliasField(row.record || {}, fieldName, state.sectionName);
			let currentValue;
			let fieldExists = canonicalAlias !== undefined;
			if (row.canonicalSectionInference) {
				if (!fieldExists && !candidate.trusted) {
					continue;
				}
				currentValue = await getBeaconRepeatingField(state, rowIndex, fieldName, "current", false);
				fieldExists = fieldExists || candidate.trusted;
			} else {
				const lookupName = `${state.sectionName}_${row.selector}_${fieldName}`;
				try {
					currentValue = await readBeaconSheetItem(state.characterId, lookupName, "current");
				} catch (error) {
					currentValue = undefined;
				}
				if (!beaconLookupIsUnresolved(currentValue)) {
					currentValue = beaconRepeatingValue(currentValue);
					fieldExists = true;
				} else if (fieldExists) {
					currentValue = await getBeaconRepeatingField(state, rowIndex, fieldName, "current", false);
				}
			}
			if (!fieldExists) {
				continue;
			}
			await addFieldPair(fieldName, currentValue);
			translatedFields++;
		}

		row.completeFieldEntries = entries.slice();
		if (debug) {
			log(
				`ScriptCards Beacon repeating: ${state.sectionName} row ${row.id} field inventory contains ` +
				`${recordFields && Object.keys(recordFields).length || 0} canonical field(s), ${translatedFields} translated/public field(s), ` +
				`and ${(entries.length - 1) / 2} current/max field pair(s).`
			);
		}
		return entries;
	}

	function normalizeRepeatingHashValue(value) {
		let rowValue = value === undefined || value === null ? "" : String(value);
		if (rowValue.indexOf("@{") > -1) { return "Unsupported (AttrRef)"; }
		if (rowValue.indexOf("[[") > -1) { return "Unsupported (InlineRoll)"; }
		if (rowValue.indexOf("{{") > -1) { return "Unsupported (TemplateRef)"; }
		return rowValue;
	}

	async function getBeaconRepeatingHashFields(state, rowIndex, identifierField, debug) {
		if (!state || !state.rows || !state.rows[rowIndex]) {
			return {};
		}

		const row = state.rows[rowIndex];
		const recordFields = getBeaconRepeatingRecordFields(row);
		const fields = { ...recordFields };

		// Classic repeating hashes include a companion field_max entry for every
		// repeating Attribute. Beacon records do not expose Attribute objects, so
		// resolve each field through the same repeating max lookup and retain an
		// empty string when the sheet has no corresponding maximum value.
		for (const fieldName of Object.keys(recordFields)) {
			const maxValue = await getBeaconRepeatingField(state, rowIndex, fieldName, "max", debug);
			fields[`${fieldName}_max`] = maxValue === undefined ? "" : maxValue;
		}

		fields.xxxActionIDxxxx = getBeaconRepeatingCompatibilityRowId(row);
		fields.id = row.id;

		if (identifierField && !beaconOwnPropertyKey(fields, identifierField)) {
			const identifierValue = await getBeaconRepeatingField(state, rowIndex, identifierField, "current", debug);
			fields[identifierField] = identifierValue === undefined ? "" : identifierValue;
			const identifierMaxValue = await getBeaconRepeatingField(state, rowIndex, identifierField, "max", debug);
			fields[`${identifierField}_max`] = identifierMaxValue === undefined ? "" : identifierMaxValue;
		}
		return fields;
	}

	function setCurrentBeaconRepeatingRow(state, index) {
		const selectedIndex = Number(index);
		const hasRow = state && state.rows && state.rows[selectedIndex];
		repeatingBeaconState = hasRow ? state : undefined;
		repeatingCharID = hasRow ? state.characterId : undefined;
		repeatingSectionName = hasRow ? state.sectionName : undefined;
		repeatingSectionIDs = hasRow ? state.rows.map((row) => row.id) : undefined;
		repeatingIndex = hasRow ? selectedIndex : undefined;
		repeatingSection = hasRow ? beaconRepeatingSectionArray(state.rows[selectedIndex]) : undefined;
	}

	function normalizeBeaconRepeatingWritableTargetPath(path) {
		const segments = String(path == null ? "" : path)
			.trim()
			.split("->")
			.map((segment) => segment.trim())
			.filter((segment) => segment !== "");
		if (segments.length > 0) {
			const rootName = normalizeBeaconLookupName(segments[0]);
			if (rootName === "store") {
				segments[0] = "sheet";
			}
		}
		return segments.join("->").toLowerCase();
	}

	function registerBeaconRepeatingWritableTarget(writable) {
		const normalizedPath = normalizeBeaconRepeatingWritableTargetPath(writable.path);
		const context = {
			characterId: String(writable.characterId),
			sectionName: writable.sectionName,
			rowId: writable.rowId,
			recordPath: Array.isArray(writable.recordPath) ? writable.recordPath.slice() : undefined,
			fieldName: writable.fieldName,
			operation: writable.operation || "current",
			createMissingLeaf: writable.createMissingLeaf,
			sampleValue: writable.sampleValue,
			normalizedPath
		};
		const cacheKey = `${context.characterId}\u0000${context.operation}\u0000${normalizedPath}`;
		beaconRepeatingWritableTargetCache.set(cacheKey, context);
		beaconRepeatingWritableTargets.push(context);
	}

	function consumeBeaconRepeatingWritableTarget(characterId, path, operation = "current") {
		const normalizedCharacterId = String(characterId);
		const normalizedOperation = String(operation || "current").toLowerCase();
		const normalizedPath = normalizeBeaconRepeatingWritableTargetPath(path);
		const cacheKey = `${normalizedCharacterId}\u0000${normalizedOperation}\u0000${normalizedPath}`;
		let context = beaconRepeatingWritableTargetCache.get(cacheKey);
		if (context) {
			beaconRepeatingWritableTargetCache.delete(cacheKey);
			const queuedIndex = beaconRepeatingWritableTargets.indexOf(context);
			if (queuedIndex >= 0) {
				beaconRepeatingWritableTargets.splice(queuedIndex, 1);
			}
			return context;
		}

		const queuedIndex = beaconRepeatingWritableTargets.findIndex((candidate) =>
			String(candidate.characterId) === normalizedCharacterId
			&& candidate.operation === normalizedOperation
			&& candidate.normalizedPath === normalizedPath
		);
		if (queuedIndex < 0) {
			return undefined;
		}
		context = beaconRepeatingWritableTargets.splice(queuedIndex, 1)[0];
		beaconRepeatingWritableTargetCache.delete(
			`${context.characterId}\u0000${context.operation}\u0000${context.normalizedPath}`
		);
		return context;
	}

	async function resolveBeaconRepeatingReference(thisMatch, cardParameters) {
		const returnWritableName = thisMatch.charAt(3) === ">";
		let attrName = thisMatch.substring(4, thisMatch.length - 1);

		if (returnWritableName) {
			let operation = "current";
			if (attrName.endsWith("^")) {
				attrName = attrName.substring(0, attrName.length - 1);
				operation = "max";
			}

			const values = attrName.split(":");
			let state = repeatingBeaconState;
			let rowIndex = repeatingIndex;
			let fieldName = attrName;
			if (values.length >= 4) {
				state = await buildBeaconRepeatingState(values[0], values[1], cardParameters.debug === "1");
				rowIndex = Number(values[2]);
				fieldName = values.slice(3).join(":");
			}

			const writable = await getBeaconRepeatingWritablePath(
				state,
				rowIndex,
				fieldName,
				cardParameters.debug === "1",
				operation
			);
			if (!writable.success) {
				log(`ScriptCards Error: Beacon repeating write target [*R>${attrName}] failed: ${writable.error}.`);
				return "";
			}
			registerBeaconRepeatingWritableTarget(writable);
			return operation === "max" ? `${writable.path}^` : writable.path;
		}

		if (attrName.toLowerCase() === "$fieldlist$") {
			if (!repeatingBeaconState || !repeatingBeaconState.rows[repeatingIndex]) {
				return "NoRepeatingAttributeLoaded";
			}
			const completeFields = await getBeaconRepeatingCompleteFields(
				repeatingBeaconState,
				repeatingIndex,
				cardParameters.debug === "1"
			);
			return completeFields.map((entry) => entry.split("|")[0]).join("|") + "|";
		}

		const values = attrName.split(":");
		if (values.length === 3 && values[2].toLowerCase() === "rowcount") {
			const state = await buildBeaconRepeatingState(values[0], values[1], cardParameters.debug === "1");
			return state ? state.rows.length : 0;
		}
		if (values.length >= 4) {
			let fieldName = values.slice(3).join(":");
			let operation = "current";
			if (fieldName.endsWith("^")) {
				fieldName = fieldName.substring(0, fieldName.length - 1);
				operation = "max";
			}
			const state = await buildBeaconRepeatingState(values[0], values[1], cardParameters.debug === "1");
			const value = await getBeaconRepeatingField(state, Number(values[2]), fieldName, operation, cardParameters.debug === "1");
			return value === undefined ? "" : value;
		}

		if (!repeatingBeaconState || !repeatingBeaconState.rows[repeatingIndex]) {
			return "NoRepeatingAttributeLoaded";
		}

		let operation = "current";
		if (attrName.endsWith("^")) {
			attrName = attrName.substring(0, attrName.length - 1);
			operation = "max";
		}
		const value = await getBeaconRepeatingField(
			repeatingBeaconState,
			repeatingIndex,
			attrName,
			operation,
			cardParameters.debug === "1"
		);
		return value === undefined ? "" : value;
	}

	async function handleBeaconRepeatingAttributeCommands(thisTag, thisContent, cardParameters) {
		const command = thisTag.substring(1).toLowerCase();
		const param = thisContent.split(cardParameters.parameterdelimiter);
		const debug = cardParameters.debug === "1";

		switch (command) {
			case "find":
			case "search": {
				const state = await buildBeaconRepeatingState(param[0], param[2], debug);
				let foundIndex = -1;
				if (state) {
					let matcher;
					if (command === "search") {
						try {
							matcher = new RegExp(param[1], "i");
						} catch (error) {
							log(`ScriptCards Error: Beacon repeating search pattern "${param[1]}" is invalid: ${error.message}`);
						}
					}
					for (let index = 0; index < state.rows.length && foundIndex < 0; index++) {
						const value = await getBeaconRepeatingField(state, index, param[3], "current", debug);
						if (command === "find" && String(value) === String(param[1])) {
							foundIndex = index;
						}
						if (command === "search" && matcher && matcher.test(String(value))) {
							foundIndex = index;
						}
					}
				}
				setCurrentBeaconRepeatingRow(state, foundIndex);
				break;
			}
			case "first": {
				const state = await buildBeaconRepeatingState(param[0], param[1], debug);
				setCurrentBeaconRepeatingRow(state, 0);
				break;
			}
			case "byindex": {
				if (param[0] && param[1] && param[2] !== undefined) {
					const state = await buildBeaconRepeatingState(param[0], param[1], debug);
					setCurrentBeaconRepeatingRow(state, Number(param[2]));
				} else {
					setCurrentBeaconRepeatingRow(undefined, 0);
				}
				break;
			}
			case "bysectionid": {
				if (param[0] && param[1] && param[2]) {
					const state = await buildBeaconRepeatingState(param[0], param[1], debug);
					const caseInsensitive = param[3] && (param[3] === "1" || param[3].toLowerCase() === "i");
					const requestedId = caseInsensitive ? param[2].toLowerCase().trim() : param[2].trim();
					const index = state ? state.rows.findIndex((row) => {
						const rowId = caseInsensitive ? row.id.toLowerCase().trim() : row.id.trim();
						return rowId === requestedId;
					}) : -1;
					setCurrentBeaconRepeatingRow(state, index);
				} else {
					setCurrentBeaconRepeatingRow(undefined, 0);
				}
				break;
			}
			case "next":
				if (repeatingBeaconState && repeatingBeaconState.rows[repeatingIndex + 1]) {
					setCurrentBeaconRepeatingRow(repeatingBeaconState, repeatingIndex + 1);
				} else {
					setCurrentBeaconRepeatingRow(undefined, -1);
				}
				break;
			case "dump":
				if (repeatingBeaconState && repeatingBeaconState.rows[repeatingIndex]) {
					const completeFields = await getBeaconRepeatingCompleteFields(
						repeatingBeaconState,
						repeatingIndex,
						debug
					);
					for (const field of completeFields) {
						log(field);
					}
				}
				break;
		}
	}

	async function handleRepeatingAttributeCommands(thisTag, thisContent, cardParameters) {
		if (String(cardParameters.beaconsheet) === "1") {
			try {
				await handleBeaconRepeatingAttributeCommands(thisTag, thisContent, cardParameters);
			} catch (error) {
				log(`Error processing Beacon Repeating Section command ${error.message}, thisTag: ${thisTag}, thisContent: ${thisContent} line ${lineCounter}`);
			}
			return;
		}

		repeatingBeaconState = undefined;
		try {
			var command = thisTag.substring(1).toLowerCase();
			var param = thisContent.split(cardParameters.parameterdelimiter);
			//log(`Processing Repeating Section Command: ${command}, Params: ${param}`)
			switch (command.toLowerCase()) {
				case "find":
				case "search":
					var fuzzy = (command.toLowerCase() == "search" ? true : false)
					repeatingSection = getSectionAttrs(param[0], param[1], param[2], param[3], fuzzy);
					fillCharAttrs(findObjs({ _type: 'attribute', _characterid: param[0] }));
					repeatingCharID = param[0];
					repeatingSectionName = param[2];
					if (repeatingSection && repeatingSection[0]) {
						repeatingSectionIDs = [];
						repeatingSectionIDs.push(repeatingSection[0].split("|")[1]);
						repeatingIndex = 0;
					} else {
						repeatingSectionIDs = [];
						repeatingSectionIDs[0] = "NoRepeatingAttributeLoaded";
						repeatingIndex = 0;
					}
					break;
				case "first":
					repeatingSectionIDs = getRepeatingSectionIDs(param[0], param[1]);
					if (repeatingSectionIDs) {
						repeatingIndex = 0;
						repeatingCharID = param[0];
						repeatingSectionName = param[1];
						fillCharAttrs(findObjs({ _type: 'attribute', _characterid: repeatingCharID }));
						repeatingSection = getSectionAttrsByID(repeatingCharID, repeatingSectionName, repeatingSectionIDs[repeatingIndex]);
						repeatingIndex = 0;
					} else {
						repeatingSection = undefined;
					}
					break;
				case "byindex":
					if (param[0] && param[1] && param[2]) {
						repeatingSectionIDs = getRepeatingSectionIDs(param[0], param[1]);
						if (repeatingSectionIDs) {
							repeatingIndex = Number(param[2]);
							repeatingCharID = param[0];
							repeatingSectionName = param[1];
							fillCharAttrs(findObjs({ _type: 'attribute', _characterid: repeatingCharID }));
							repeatingSection = getSectionAttrsByID(repeatingCharID, repeatingSectionName, repeatingSectionIDs[repeatingIndex]);
							repeatingIndex = Number(param[2]);
						} else {
							repeatingSection = undefined;
						}
					} else {
						repeatingSection = undefined;
					}
					break;
				case "bysectionid":
					if (param[0] && param[1] && param[2]) {
						let charID = param[0]
						let secName = param[1]
						var ci = false
						if (param[3] && (param[3] == "1" || param[3].toLowerCase() == "i")) {
							ci = true
						}
						repeatingSectionIDs = getRepeatingSectionIDs(charID, secName);
						if (repeatingSectionIDs) {
							repeatingIndex = undefined;
							for (let x = 0; x < repeatingSectionIDs.length; x++) {
								if (repeatingSectionIDs[x].trim() == param[2].trim()) {
									repeatingIndex = x;
								}
								if (ci && repeatingSectionIDs[x].toLowerCase().trim() == param[2].toLowerCase().trim()) {
									repeatingIndex = x;
								}
							}
							repeatingCharID = charID;
							repeatingSectionName = secName;
							fillCharAttrs(findObjs({ _type: 'attribute', _characterid: repeatingCharID }));
							repeatingSection = getSectionAttrsByID(repeatingCharID, repeatingSectionName, repeatingSectionIDs[repeatingIndex]);
						} else {
							repeatingSection = undefined;
						}
					} else {
						repeatingSection = undefined;
					}
					break;
				case "next":
					if (repeatingSectionIDs) {
						if (repeatingSectionIDs[repeatingIndex + 1]) {
							repeatingIndex++;
							repeatingSection = getSectionAttrsByID(repeatingCharID, repeatingSectionName, repeatingSectionIDs[repeatingIndex]);
						} else {
							repeatingSection = undefined;
							repeatingSectionIDs = undefined;
						}
					} else {
						repeatingSection = undefined;
						repeatingSectionIDs = undefined;
					}
					break;
				case "dump":
					if (repeatingSection) {
						for (var x = 0; x < repeatingSection.length; x++) {
							log(repeatingSection[x]);
						}
					}
					break;
			}
		} catch (e) {
			log(`Error processing Repeating Section command ${e.message}, thisTag: ${thisTag}, thisContent: ${thisContent} line ${lineCounter}`)
		}
	}

	async function handleConditionalBlock(thisTag, thisContent, cardParameters, cardLines) {
		try {
			var isTrue = await processFullConditional(thisTag.substring(1));
			var trueDest = thisContent.trim();
			var falseDest = undefined;
			var varName = undefined;
			var varValue = undefined;
			var resultType = "goto";
			if (trueDest.indexOf("|") >= 0) {
				falseDest = trueDest.split("|")[1].trim();
				trueDest = trueDest.split("|")[0].trim();
			}
			if (cardParameters.debug == 1) { log(`Condition ${thisTag.substring(1)} evaluation result: ${isTrue}`); }
			var jumpDest = isTrue ? trueDest : falseDest;
			var blockSkip = false;
			var blockChar = "]";
			if (falseDest == "[" || trueDest == "]") {
				blockDepth++
			}
			if (isTrue && falseDest == "[") { blockSkip = true; }
			if (!isTrue && trueDest == "[") { blockSkip = true; }
			if (jumpDest) {
				switch (jumpDest.charAt(0)) {
					case ">": resultType = "gosub"; break;
					case "<": resultType = "return"; break;
					case "%": resultType = "next"; break;
					case "[": resultType = "block"; break;
					case "+": resultType = "directoutput"; break;
					case "*": resultType = "gmoutput"; break;
					case "=":
					case "&":
						jumpDest.charAt(0) == "=" ? resultType = "rollset" : resultType = "stringset";
						jumpDest = jumpDest.substring(1);
						varName = jumpDest.split(cardParameters.parameterdelimiter)[0];
						varValue = jumpDest.split(cardParameters.parameterdelimiter)[1];
						break;
				}

				switch (resultType) {
					case "goto":
						if (lineLabels[jumpDest]) {
							lineCounter = lineLabels[jumpDest];
						} else {
							log(`ScriptCards Error: Label ${jumpDest} is not defined on line ${lineCounter} (${thisTag}, ${thisContent})`);
						}
						break;
					case "return":
						arrayVariables["args"] = []
						if (returnStack.length > 0) {
							arrayVariables["args"] = [];
							callParamList = parameterStack.pop();
							if (callParamList) {
								for (const value of Object.values(callParamList)) {
									arrayVariables["args"].push(value.toString().trim());
								}
							}
							lineCounter = returnStack.pop();
						}
						break;
					case "directoutput":
					case "gmoutput":
						if (jumpDest.split(";") != null) {
							var conditionalTag = jumpDest.split(";")[0];
							var conditionalContent = jumpDest.substring(jumpDest.indexOf(";") + 1);
							if (jumpDest.indexOf(";") < 0) {
								conditionalContent = "";
							}
							var rowData = buildRowOutput(conditionalTag.substring(1), await replaceVariableContent(conditionalContent, cardParameters, true), cardParameters.outputtagprefix, cardParameters.outputcontentprefix);

							tableLineCounter += 1;
							if (tableLineCounter % 2 == 0) {
								while (rowData.indexOf("=X=FONTCOLOR=X=") > 0) { rowData = rowData.replace("=X=FONTCOLOR=X=", cardParameters.evenrowfontcolor); }
								while (rowData.indexOf("=X=ROWBG=X=") > 0) { rowData = rowData.replace("=X=ROWBG=X=", ` background: ${cardParameters.evenrowbackground}; background-image: ${cardParameters.evenrowbackgroundimage}; `); }
							} else {
								while (rowData.indexOf("=X=FONTCOLOR=X=") > 0) { rowData = rowData.replace("=X=FONTCOLOR=X=", cardParameters.oddrowfontcolor); }
								while (rowData.indexOf("=X=ROWBG=X=") > 0) { rowData = rowData.replace("=X=ROWBG=X=", ` background: ${cardParameters.oddrowbackground}; background-image: ${cardParameters.oddrowbackgroundimage}; `); }
							}
							rowData = processInlineFormatting(rowData, cardParameters, false);
							if (resultType == "directoutput") {
								outputLines.push(rowData);
							} else {
								gmonlyLines.push(rowData);
							}
						}
						break;
					case "gosub":
						jumpDest = jumpDest.substring(1);
						parameterStack.push(callParamList);
						var paramList = CSVtoArray(jumpDest.trim());
						callParamList = {};
						var paramCount = 0;
						arrayVariables["args"] = []
						if (paramList) {
							paramList.forEach(function (item) {
								callParamList[paramCount] = item.toString().trim();
								arrayVariables["args"].push(item.toString().trim());
								paramCount++;
							});
						}
						returnStack.push(lineCounter);
						jumpDest = jumpDest.split(cardParameters.parameterdelimiter)[0];
						if (lineLabels[jumpDest]) {
							lineCounter = lineLabels[jumpDest];
						} else {
							log(`ScriptCards Error: Label ${jumpDest} is not defined on line ${lineCounter} (${thisTag}, ${thisContent})`);
						}
						break;
					case "rollset":
						rollVariables[varName] = await parseDiceRoll(await replaceVariableContent(varValue, cardParameters, false), cardParameters);
						break;
					case "stringset":
						if (varName) {
							await setStringOrArrayElement(varName, varValue, cardParameters);
						} else {
							log(`ScriptCards Error: Variable name or value not specified in conditional on line ${lineCounter} (${thisTag}) ${thisContent}`);
						}
						break;
					case "next":
						if (loopStack.length >= 1) {
							var currentLoop = loopStack[loopStack.length - 1];
							var breakLoop = false;
							if (loopControl[currentLoop]) {
								loopControl[currentLoop].current += loopControl[currentLoop].step;
								switch (loopControl[currentLoop].loopType) {
									case "fornext":
										stringVariables[currentLoop] = loopControl[currentLoop].current.toString();
										break;
									case "foreach":
										if (jumpDest.charAt(1) !== "!") {
											try {
												stringVariables[currentLoop] = arrayVariables[loopControl[currentLoop].arrayName][loopControl[currentLoop].current]
											} catch {
												stringVariables[currentLoop] = "ArrayError"
											}
										}
										break;
									case "while":
									case "until":
										breakLoop = true;
										break;
								}
								if ((loopControl[currentLoop].step > 0 && loopControl[currentLoop].current > loopControl[currentLoop].end) ||
									(loopControl[currentLoop].step < 0 && loopControl[currentLoop].current < loopControl[currentLoop].end) ||
									jumpDest.charAt(1) == "!" || breakLoop) {
									loopStack.pop();
									delete loopControl[currentLoop];
									blockSkip = true;
									blockChar = "%";
								} else {
									lineCounter = loopControl[currentLoop].nextIndex;
								}
							}
						}
						break;
					case "block":
						lastBlockAction = "E";
						break;
				}
			}
			if (blockSkip) {
				var line = lineCounter;
				if (blockChar === "]") { lastBlockAction = "S"; }
				for (line = lineCounter + 1; line < cardLines.length; line++) {
					if (getLineTag(cardLines[line], line, "").trim() == blockChar) {
						lineCounter = line + (blockChar == "]" ? 0 : 0);
						break;
					}
				}
				if (lineCounter > cardLines.length) {
					log(`ScriptCards: Warning - no end block marker found for block started reference on line ${lineCounter}`);
					lineCounter = cardLines.length + 1;
				}
			}
		} catch (e) {
			log(`Error processing conditional ${e.message}, thisTag: ${thisTag}, thisContent: ${thisContent} line: ${lineCounter}`)
		}
	}

	async function handleCaseCommand(thisTag, thisContent, cardParameters, cardLines) {
		try {
			var testvalue = thisTag.substring(1);
			var cases = thisContent.split(/(?<![\\\\])\|/);
			var blockSkip = false;
			var blockChar = "";
			if (cases) {
				for (var x = 0; x < cases.length; x++) {
					var testcase = cases[x].split(":")[0].replace(/\\\\\|/gi, "|");
					if (testvalue.toLowerCase() == testcase.toLowerCase()) {
						var jumpDest = cases[x].split(":")[1];
						var resultType = "goto";
						var varName = undefined;
						var varValue = undefined;
						if (jumpDest) {
							switch (jumpDest.charAt(0)) {
								case ">": resultType = "gosub"; break;
								case "<": resultType = "return"; break;
								case "%": resultType = "next"; break;
								case "+": resultType = "directoutput"; break;
								case "*": resultType = "gmoutput"; break;
								case "=":
								case "&":
									jumpDest.charAt(0) == "=" ? resultType = "rollset" : resultType = "stringset";
									jumpDest = jumpDest.substring(1);
									varName = jumpDest.split(cardParameters.parameterdelimiter)[0];
									varValue = jumpDest.split(cardParameters.parameterdelimiter)[1];
									break;
							}

							switch (resultType) {
								case "goto":
									if (lineLabels[jumpDest]) {
										lineCounter = lineLabels[jumpDest];
									} else {
										log(`ScriptCards Error: Label ${jumpDest} is not defined on line ${lineCounter} (${thisTag}, ${thisContent})`);
									}
									break;
								case "return":
									arrayVariables["args"] = []
									if (returnStack.length > 0) {
										callParamList = parameterStack.pop();
										if (callParamList) {
											for (const value of Object.values(callParamList)) {
												arrayVariables["args"].push(value.toString().trim());
											}
										}
										lineCounter = returnStack.pop();
									}
									break;
								case "directoutput":
								case "gmoutput":
									if (jumpDest.split(";") != null) {
										var conditionalTag = jumpDest.split(";")[0];
										var conditionalContent = jumpDest.substring(jumpDest.indexOf(";") + 1);
										if (jumpDest.indexOf(";") < 0) {
											conditionalContent = "";
										}
										var rowData = buildRowOutput(conditionalTag.substring(1), await replaceVariableContent(conditionalContent, cardParameters, true), cardParameters.outputtagprefix, cardParameters.outputcontentprefix);

										tableLineCounter += 1;
										if (tableLineCounter % 2 == 0) {
											while (rowData.indexOf("=X=FONTCOLOR=X=") > 0) { rowData = rowData.replace("=X=FONTCOLOR=X=", cardParameters.evenrowfontcolor); }
											while (rowData.indexOf("=X=ROWBG=X=") > 0) { rowData = rowData.replace("=X=ROWBG=X=", ` background: ${cardParameters.evenrowbackground}; background-image: ${cardParameters.evenrowbackgroundimage}; `); }
										} else {
											while (rowData.indexOf("=X=FONTCOLOR=X=") > 0) { rowData = rowData.replace("=X=FONTCOLOR=X=", cardParameters.oddrowfontcolor); }
											while (rowData.indexOf("=X=ROWBG=X=") > 0) { rowData = rowData.replace("=X=ROWBG=X=", ` background: ${cardParameters.oddrowbackground}; background-image: ${cardParameters.oddrowbackgroundimage}; `); }
										}

										rowData = processInlineFormatting(rowData, cardParameters, false);
										if (resultType == "directoutput") {
											outputLines.push(rowData);
										} else {
											gmonlyLines.push(rowData);
										}
									}
									break;
								case "gosub":
									jumpDest = jumpDest.substring(1);
									parameterStack.push(callParamList);
									var paramList = CSVtoArray(jumpDest.trim());
									callParamList = {};
									var paramCount = 0;
									arrayVariables["args"] = []
									if (paramList) {
										paramList.forEach(function (item) {
											callParamList[paramCount] = item.toString().trim();
											arrayVariables["args"].push(item.toString().trim());
											paramCount++;
										});
									}
									returnStack.push(lineCounter);
									jumpDest = jumpDest.split(cardParameters.parameterdelimiter)[0];
									if (lineLabels[jumpDest]) {
										lineCounter = lineLabels[jumpDest];
									} else {
										log(`ScriptCards Error: Label ${jumpDest} is not defined on line ${lineCounter} (${thisTag}, ${thisContent})`);
									}
									break;
								case "rollset":
									rollVariables[varName] = await parseDiceRoll(await replaceVariableContent(varValue, cardParameters), cardParameters, true);
									break;
								case "stringset":
									if (varName) {
										await setStringOrArrayElement(varName, varValue, cardParameters);
									} else {
										log(`ScriptCards Error: Variable name or value not specified in conditional on line ${lineCounter} (${thisTag}) ${thisContent}`);
									}
									break;
								case "next":
									if (loopStack.length >= 1) {
										var currentLoop = loopStack[loopStack.length - 1];
										var breakLoop = false;
										if (loopControl[currentLoop]) {
											loopControl[currentLoop].current += loopControl[currentLoop].step;
											switch (loopControl[currentLoop].loopType) {
												case "fornext":
													stringVariables[currentLoop] = loopControl[currentLoop].current.toString();
													break;
												case "foreach":
													if (jumpDest.charAt(1) !== "!") {
														try {
															stringVariables[currentLoop] = arrayVariables[loopControl[currentLoop].arrayName][loopControl[currentLoop].current]
														} catch {
															stringVariables[currentLoop] = "ArrayError"
														}
													}
													break;
												case "while":
												case "until":
													breakLoop = true;
													break;
											}
											if ((loopControl[currentLoop].step > 0 && loopControl[currentLoop].current > loopControl[currentLoop].end) ||
												(loopControl[currentLoop].step < 0 && loopControl[currentLoop].current < loopControl[currentLoop].end) ||
												jumpDest.charAt(1) == "!" || breakLoop) {
												loopStack.pop();
												delete loopControl[currentLoop];
												blockSkip = true;
												blockChar = "%";
											} else {
												lineCounter = loopControl[currentLoop].nextIndex;
											}
										}
									}
									break;
							}
							x = cases.length + 1;
						}
					}
				}
			}
			if (blockSkip) {
				var line = lineCounter;
				for (line = lineCounter + 1; line < cardLines.length; line++) {
					if (getLineTag(cardLines[line], line, "").trim() == blockChar) {
						lineCounter = line;
						break;
					}
				}
				if (lineCounter > cardLines.length) {
					log(`ScriptCards: Warning - no end block marker found for block started reference on line ${lineCounter}`);
					lineCounter = cardLines.length + 1;
				}
			}
		} catch (e) {
			log(`Error processing case statement ${e.message}, thisTag: ${thisTag}, thisContent: ${thisContent}`)
		}

	}

	function getSafeTokenProperty(propName, propValue) {
		let ret = propValue;

		// Convert numeric properties
		const numericProps = [
			"left", "top", "width", "height", "light_radius", "light_dimradius",
			"light_angle", "light_losangle", "light_multiplier", "adv_fow_view_distance",
			"light_sensitivity_radius", "rotation"
		];
		if (numericProps.includes(propName)) {
			let numValue = Number(propValue);
			if (isNaN(numValue)) {
				numValue = parseFloat(propValue);
			}
			if (isNaN(numValue)) {
				numValue = 0;
			}
			return numValue;
		}

		// Convert boolean properties
		const booleanProps = [
			"isdrawing", "flipv", "fliph", "aura1_square", "aura2_square", "showname",
			"showplayers_name", "showplayers_bar1", "showplayers_bar2", "showplayers_bar3", "showplayers_bar4",
			"showplayers_aura1", "showplayers_aura2", "playersedit_name", "playersedit_bar1",
			"playersedit_bar2", "playersedit_bar3", "playersedit_bar4", , "playersedit_aura1", "playersedit_aura2",
			"light_otherplayers", "light_hassight", "lockmovement"
		];
		if (booleanProps.includes(propName)) {
			return ["true", "yes", "on", "1"].includes(propValue.toLowerCase());
		}

		// Clean image source
		if (propName === "imgsrc") {
			return getCleanImgsrc(propValue);
		}

		// Clean sides property
		if (propName === "sides") {
			const sides = propValue.split("|").map(side => getCleanImgsrc(side));
			return sides.join("|");
		}

		return ret;
	}

	function reportBenchmarkingData() {
		log(benchmarks);
		if (beaconPerformanceStats && Object.values(beaconPerformanceStats).some((value) => Number(value) !== 0)) {
			log({ ScriptCardsBeaconPerformance: beaconPerformanceStats });
		}
		let difference = Date.now() - scriptStartTimestamp
		log(`Script Execution Time: ${difference} ms`)
		log(`Executed script lines: ${executionCounter}`)
	}

	/*
	const getNotes = function (prop, obj) {
		return new Promise((resolve, reject) => {
			obj.get(prop, (p) => {
				resolve(p);
			});
		});
	};
	*/

	/*
	function getSafeTriggerString(prefix, property) {
		try {
			let prop = property
			prop == null ? prop = "" : prop = prop.toString()
			if (prop.toString().indexOf("--") < 0) {
				return ` --&${prefix}|${prop} `
			}
			let split = prop.split("--")
			let ret = ""
			for (let x = 0; x < split.length; x++) {
				ret += ` --&${prefix}|${x == 0 ? "" : "+-"}${split[x]}${x < (split.length - 1) ? "-" : ""}`
			}
			return ret;
		} catch (e) {
			log(`Error creating safe trigger string: ${e.message}`)
		}
	}
	*/

	function getSafeTriggerString(prefix, property) {
		try {
			let prop = property ? property.toString() : "";

			if (!prop.includes("--")) {
				return ` --&${prefix}|${prop} `;
			}

			const split = prop.split("--");
			let result = split.map((part, index) => {
				const separator = index === 0 ? "" : "+-";
				const suffix = index < split.length - 1 ? "-" : "";
				return ` --&${prefix}|${separator}${part}${suffix}`;
			}).join("");

			return result;
		} catch (error) {
			log(`Error creating safe trigger string: ${error.message}`);
			return "";
		}
	}

	return {
		ObserveTokenChange: observeTokenChange
	};

	function breakObjectIntoPairs(obj) {
		return Object.entries(obj);
	}

	function arrayPairsToObject(arrayPairs) {
		if (!arrayPairs) {
			return undefined;
		}

		const obj = {};
		arrayPairs.forEach(pair => {
			const [key, value] = pair;
			obj[key] = value;
		});

		return obj;
	}

	function getTokenCoords(token, scale) {
		try {
			const left = token.get("left");
			const top = token.get("top");
			const scaledLeft = left / (scale * 70);
			const scaledTop = top / (scale * 70);
			//log(`Token ID: ${token.id}, Scale: ${scale}, Left: ${left}, Top: ${top}, Scaled Left: ${scaledLeft}, Scaled Top: ${scaledTop}`);

			return { x: scaledLeft, y: scaledTop };
		} catch (error) {
			log(`Error in getTokenCoords for token ID ${token.id}: ${error.message}`);
			return { x: 0, y: 0 };
		}
	}

	function onChangeCampaignTurnorder(triggerCharID) {
		try {
			const abilities = findObjs({ type: "ability", _characterid: triggerCharID, name: "change:campaign:turnorder" });
			if (Array.isArray(abilities) && abilities.length > 0) {
				const replacement = ` `;
				abilities.forEach(ability => {
					const action = ability.get("action");
					const metacard = action.replace("--/|TRIGGER_REPLACEMENTS", replacement);
					sendChat("API", metacard);
				});
			} else {
				log(`No abilities found for character ID: ${triggerCharID}`);
			}
		} catch (error) {
			log(`Error in onChangeCampaignTurnorder: ${error.message}`);
		}
	}

	function checkForMessageTriggers(triggerCharID) {
		const abilities = findObjs({ type: "ability", _characterid: triggerCharID });
		if (Array.isArray(abilities) && abilities.length > 0) {
			for (let x = 0; x < abilities.length; x++) {
				let abname = abilities[x].get("name")
				if (abname) {
					if (abname.startsWith("chat:message:")) {
						return true;
					}
				}
			}
		}
		return false;
	}

	function onChatMessagTrigger(triggerCharID, msg) {
		if (msg && msg.content && msg.content.indexOf("SC_TRIGGER_GENERATED") < 0) {
			const abilities = findObjs({ type: "ability", _characterid: triggerCharID });
			if (Array.isArray(abilities) && abilities.length > 0) {
				for (let x = 0; x < abilities.length; x++) {
					let abname = abilities[x].get("name")
					if (abname) {
						if (abname.startsWith("chat:message:")) {
							let testVal = abname.replace("chat:message:", "").replaceAll("-", " ");
							if (msg.content.replace("-", " ").indexOf(testVal) >= 0) {
								replacement = " --+|<SC_TRIGGER_GENERATED> "
								replacement += `--&TriggerWho|${msg.who} `;
								replacement += `--&TriggerPlayerID|${msg.playerid} `;
								replacement += `--&TriggerType|${msg.type} `;
								replacement += `--&TriggerContent|${msg.content}`;
								const action = abilities[x].get("action");
								if (action.indexOf("--/|TRIGGER_REPLACEMENTS") >= 0) {
									const metacard = action.replace("--/|TRIGGER_REPLACEMENTS", replacement);
									sendChat("API", metacard);
									//log(msg)
								} else {
									log(`ScriptCards Error : message-based triggers MUST be ScriptCards with a replacement section`)
								}
							}
						}
					}
				}
			}
		}
	}

	async function getBioField(charobj, field) {
		return new Promise((resolve) => {
			charobj.get(field, function (resp) {
				resolve(resp);
			})
		})
	}

	function extractKeyValuePairsFromJson(jsonString) {
		let obj;
		try {
			obj = JSON.parse(jsonString);
		} catch (e) {
			console.error("Invalid JSON string provided:", e);
			return [];
		}

		return extractKeyValuePairs(obj);
	}

	function is2024Sheet(charID) {
		let char = getObj("character", charID);
		if (char) {
			return char.get("charactersheetname") === DND2024_BEACON_SHEET_NAME;
		} else {
			return false;
		}
	}

	function getFirstOutermostDoubleBraceBlock(text) {
		let depth = 0;
		let start = -1;
		let inProtectedBlock = false;

		for (let i = 0; i < text.length; i++) {
			const two = text.slice(i, i + 2);

			// Enter ${ ... $} protected block.
			// While in this mode, {{ and }} are ignored completely.
			if (!inProtectedBlock && two === "${") {
				inProtectedBlock = true;
				i++;
				continue;
			}

			// Exit ${ ... $} protected block.
			if (inProtectedBlock && two === "$}") {
				inProtectedBlock = false;
				i++;
				continue;
			}

			// Ignore everything inside ${ ... $}
			if (inProtectedBlock) {
				continue;
			}

			// Start or nested {{
			if (two === "{{") {
				if (depth === 0) {
					start = i;
				}

				depth++;
				i++;
				continue;
			}

			// End }}
			if (two === "}}" && depth > 0) {
				depth--;
				i++;

				if (depth === 0 && start !== -1) {
					return text.slice(start, i + 1);
				}
			}
		}

		return null;
	}


	// Generic typed-collection support for Beacon [*...] references. Exact local
	// structured and typed routes are preferred when they can answer safely; the
	// native sheet-item route remains the fallback for values that are not mapped
	// locally or whose sheet-defined computation must remain authoritative.
	function beaconLookupIsUnresolved(value) {
		if (value === undefined || value === null) {
			return true;
		}
		if (typeof value === "string") {
			const normalized = value.trim().toLowerCase();
			return normalized === "undefined"
				|| normalized === "object.object"
				|| normalized === "[object object]"
				|| normalized.includes("&{template:error}")
				|| normalized.includes("no attribute or sheet field found");
		}
		return typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0;
	}

	function beaconLookupMayMaskCollection(value) {
		return value === 0 || (typeof value === "string" && value.trim() === "0");
	}

	function resolveRoll20CharacterPseudoAttribute(character, lookupName, operation = "current") {
		if (!character || String(operation).toLowerCase() !== "current") {
			return { found: false, value: undefined };
		}

		const normalized = String(lookupName == null ? "" : lookupName)
			.trim()
			.toLowerCase();
		switch (normalized) {
			case "character_id":
				return { found: true, value: character.id, source: "character-pseudo" };
			case "character_name":
				return { found: true, value: character.get("name"), source: "character-pseudo" };
			default:
				return { found: false, value: undefined };
		}
	}

	async function getPageTokenCharacterAttributeValue(character, attributeName, beaconMode, debugEnabled) {
		const requestedName = String(attributeName == null ? "" : attributeName).trim();
		if (!character || !requestedName) {
			return { found: false, value: undefined };
		}

		let lookupName = requestedName;
		let operation = "current";
		if (lookupName.endsWith("^")) {
			operation = "max";
			lookupName = lookupName.slice(0, -1);
		}

		if (!lookupName.includes("->")) {
			const pseudoAttribute = resolveRoll20CharacterPseudoAttribute(character, lookupName, operation);
			if (pseudoAttribute.found) {
				return pseudoAttribute;
			}
		}

		if (beaconMode) {
			const lookupParts = lookupName.split("->");
			const baseLookupName = lookupParts[0];
			const resolvedBeaconValue = await resolveBeaconReferenceValue(
				character,
				baseLookupName,
				operation,
				lookupParts.length > 1 ? lookupParts.slice(1) : [],
				debugEnabled
			);
			if (resolvedBeaconValue.found) {
				return resolvedBeaconValue;
			}
			// A local authoritative miss means the requested Beacon value is known to
			// be absent or deliberately unsupported. Preserve that result so the outer
			// character-reference layer does not retry it as a native user.* field.
			if (resolvedBeaconValue.authoritativeMiss) {
				return resolvedBeaconValue;
			}
		}

		const classicLookupName = lookupName;
		const allowClassicFallback = !classicLookupName.includes("->");
		if (allowClassicFallback) {
			try {
				const classicAttribute = findObjs({
					_type: "attribute",
					_characterid: character.id,
					name: classicLookupName
				})[0];
				if (classicAttribute) {
					return {
						found: true,
						value: classicAttribute.get(operation),
						attributeId: classicAttribute.id,
						source: "attribute"
					};
				}
			} catch (error) {
				// Continue to the remaining lookup routes.
			}
		}

		if (!beaconMode) {
			try {
				const value = getAttrByName(character.id, classicLookupName, operation);
				return value === undefined
					? { found: false, value: undefined }
					: { found: true, value, source: "getAttrByName" };
			} catch (error) {
				return { found: false, value: undefined };
			}
		}

		// Bare names may still address an existing Beacon custom field after the
		// native/translated lookup and exact classic Attribute lookup both miss.
		if (allowClassicFallback && !classicLookupName.toLowerCase().startsWith("user.")) {
			const customLookupName = `user.${classicLookupName}`;
			try {
				const customValue = await readBeaconSheetItem(character.id, customLookupName, operation);
				if (!beaconLookupIsUnresolved(customValue)) {
					return { found: true, value: customValue, source: "beacon-custom" };
				}
			} catch (error) {
				// Missing custom attributes simply remain unresolved.
			}
		}

		return { found: false, value: undefined };
	}

	function normalizeBeaconLookupName(value) {
		return String(value == null ? "" : value).toLowerCase().replace(/[^a-z0-9]/g, "");
	}

	function parseBeaconStructuredValue(value) {
		if (value && typeof value === "object") {
			return value;
		}
		if (typeof value !== "string") {
			return undefined;
		}
		const trimmed = value.trim();
		if (!trimmed || !((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]")))) {
			return undefined;
		}
		try {
			const parsed = JSON.parse(trimmed);
			return parsed && typeof parsed === "object" ? parsed : undefined;
		} catch (error) {
			return undefined;
		}
	}

	function beaconOwnPropertyKey(object, propertyName) {
		if (!object || typeof object !== "object") {
			return undefined;
		}
		if (Object.prototype.hasOwnProperty.call(object, propertyName)) {
			return propertyName;
		}
		const normalized = normalizeBeaconLookupName(propertyName);
		return Object.keys(object).find((candidate) => normalizeBeaconLookupName(candidate) === normalized);
	}

	function beaconProperty(object, propertyName) {
		const key = beaconOwnPropertyKey(object, propertyName);
		return key === undefined ? undefined : object[key];
	}


	function coerceBeaconStructuredWriteValue(value, currentValue) {
		let result = value;
		if (typeof result === "string" && (result.startsWith("+=") || result.startsWith("-="))) {
			const add = result.startsWith("+=");
			const delta = result.substring(2);
			if (isNumber(currentValue) && isNumber(delta)) {
				result = add
					? Number(currentValue) + Number(delta)
					: Number(currentValue) - Number(delta);
			} else if (add) {
				result = `${currentValue == null ? "" : currentValue}${delta}`;
			} else {
				return {
					success: false,
					error: `-= requires a numeric existing value and numeric delta for structured Beacon paths`
				};
			}
		}

		if (typeof currentValue === "number") {
			if (!isNumber(result)) {
				return {
					success: false,
					error: `the existing Beacon value is numeric, but "${result}" is not numeric`
				};
			}
			return { success: true, value: Number(result) };
		}

		if (typeof currentValue === "boolean") {
			const parsedBoolean = parseBeaconBooleanValue(result);
			return parsedBoolean.success
				? parsedBoolean
				: {
					success: false,
					error: `the existing Beacon value is boolean; use 1/0, true/false, yes/no, or on/off`
				};
		}

		if (currentValue && typeof currentValue === "object") {
			return {
				success: false,
				error: `structured Beacon writes may update only an existing primitive leaf, not an object or array`
			};
		}

		return { success: true, value: result == null ? "" : String(result) };
	}

	function selectBeaconStructuredWriteKey(container, selector) {
		if (!container || typeof container !== "object") {
			return { success: false, error: `the parent value is not an object or array` };
		}

		if (Array.isArray(container)) {
			if (/^\d+$/.test(String(selector))) {
				const index = Number(selector);
				return index >= 0 && index < container.length
					? { success: true, key: index }
					: { success: false, error: `array index ${selector} is outside the available range` };
			}

			const identity = normalizeBeaconLookupName(selector);
			const matches = container
				.map((record, index) => ({ record, index }))
				.filter((entry) =>
					entry.record
					&& typeof entry.record === "object"
					&& !Array.isArray(entry.record)
					&& normalizeBeaconLookupName(beaconRecordIdentity(entry.record)) === identity
				);
			return matches.length === 1
				? { success: true, key: matches[0].index }
				: {
					success: false,
					error: matches.length
						? `array selector "${selector}" matched more than one record`
						: `array selector "${selector}" did not match a record`
				};
		}

		const key = beaconOwnPropertyKey(container, selector);
		return key === undefined
			? { success: false, error: `property "${selector}" does not exist` }
			: { success: true, key };
	}

	function coerceBeaconStructuredCreatedValue(value, sampleValue) {
		let result = value;
		if (typeof result === "string" && (result.startsWith("+=") || result.startsWith("-="))) {
			const subtract = result.startsWith("-=");
			result = `${subtract ? "-" : ""}${result.substring(2)}`;
		}

		if (typeof sampleValue === "number") {
			if (!isNumber(result)) {
				return {
					success: false,
					error: `the corresponding repeating-row field is numeric, but "${result}" is not numeric`
				};
			}
			return { success: true, value: Number(result) };
		}

		if (typeof sampleValue === "boolean") {
			const parsedBoolean = parseBeaconBooleanValue(result);
			return parsedBoolean.success
				? parsedBoolean
				: {
					success: false,
					error: `the corresponding repeating-row field is boolean; use 1/0, true/false, yes/no, or on/off`
				};
		}

		return { success: true, value: result == null ? "" : String(result) };
	}

	function setBeaconStructuredLeaf(root, path, value, allowCreateLeaf, sampleValue, preserveBlank = false) {
		if (!root || typeof root !== "object" || !Array.isArray(path) || path.length === 0) {
			return { success: false, error: `the structured Beacon path is empty or invalid` };
		}

		const located = getBeaconStructuredContainer(root, path.slice(0, -1));
		if (!located.success) {
			return located;
		}
		const target = located.container;
		const selectedLeaf = selectBeaconStructuredWriteKey(target, path[path.length - 1]);
		if (!selectedLeaf.success) {
			if (!allowCreateLeaf || Array.isArray(target)) {
				return {
					success: false,
					error: `${selectedLeaf.error} at ${path.join("->")}`
				};
			}
			const created = preserveBlank && value === ""
				? { success: true, value: "" }
				: coerceBeaconStructuredCreatedValue(value, sampleValue);
			if (!created.success) {
				return created;
			}
			const leafName = String(path[path.length - 1]);
			target[leafName] = created.value;
			return {
				success: true,
				previousValue: undefined,
				value: created.value,
				createdLeaf: true
			};
		}

		const currentValue = target[selectedLeaf.key];
		const coerced = preserveBlank && value === ""
			? { success: true, value: "" }
			: coerceBeaconStructuredWriteValue(value, currentValue);
		if (!coerced.success) {
			return { success: false, error: coerced.error };
		}

		target[selectedLeaf.key] = coerced.value;
		return { success: true, previousValue: currentValue, value: coerced.value, createdLeaf: false };
	}



	function getBeaconStructuredExistingLeaf(root, path) {
		if (!root || typeof root !== "object" || !Array.isArray(path) || path.length === 0) {
			return { success: false, error: `the structured Beacon path is empty or invalid` };
		}

		const located = getBeaconStructuredContainer(root, path.slice(0, -1));
		if (!located.success) {
			return located;
		}
		const selectedLeaf = selectBeaconStructuredWriteKey(located.container, path[path.length - 1]);
		if (!selectedLeaf.success) {
			return selectedLeaf;
		}
		return { success: true, value: located.container[selectedLeaf.key] };
	}

	function beaconStructuredWriteValuesMatch(actual, expected) {
		if (Object.is(actual, expected)) {
			return true;
		}
		if (actual === null || actual === undefined || expected === null || expected === undefined) {
			return false;
		}
		if (typeof actual === "object" && typeof expected === "object") {
			try {
				return JSON.stringify(actual) === JSON.stringify(expected);
			} catch (error) {
				return false;
			}
		}
		return typeof actual === typeof expected && String(actual) === String(expected);
	}

	function ensureBeaconStructuredParentPath(root, templateRoot, path) {
		if (!root || typeof root !== "object" || !templateRoot || typeof templateRoot !== "object") {
			return { success: false, error: `the structured max root or current-tree template is unavailable` };
		}

		let container = root;
		let template = templateRoot;
		for (const selector of path.slice(0, -1)) {
			const templateSelection = selectBeaconStructuredWriteKey(template, selector);
			if (!templateSelection.success) {
				return { success: false, error: `${templateSelection.error} in the current-tree template` };
			}
			const templateChild = template[templateSelection.key];
			if (!templateChild || typeof templateChild !== "object") {
				return { success: false, error: `the current-tree template path reaches a primitive before ${path.join("->")}` };
			}

			let selection = selectBeaconStructuredWriteKey(container, selector);
			if (!selection.success) {
				if (Array.isArray(container)) {
					if (!/^\d+$/.test(String(selector))) {
						return { success: false, error: `cannot create non-numeric array selector "${selector}" in the max tree` };
					}
					const index = Number(selector);
					while (container.length <= index) {
						container.push(undefined);
					}
					container[index] = Array.isArray(templateChild) ? [] : {};
					selection = { success: true, key: index };
				} else {
					const key = Array.isArray(template) ? String(selector) : templateSelection.key;
					container[key] = Array.isArray(templateChild) ? [] : {};
					selection = { success: true, key };
				}
			}

			if (!container[selection.key] || typeof container[selection.key] !== "object") {
				return { success: false, error: `the max-tree path ${selector} is not an object or array` };
			}
			container = container[selection.key];
			template = templateChild;
		}
		return { success: true };
	}

	async function waitForBeaconStructuredWrite(rootAttribute, path, expectedValue, operation = "current") {
		return await pollBeaconUntilSuccess(async () => {
			const parsedRoot = parseBeaconStructuredValue(rootAttribute.get(operation));
			const observed = getBeaconStructuredExistingLeaf(parsedRoot, path);
			const value = observed.success ? observed.value : undefined;
			return {
				success: observed.success && beaconStructuredWriteValuesMatch(value, expectedValue),
				value
			};
		});
	}

	async function waitForBeaconRepeatingWriteProjection(context, expectedValue) {
		const result = await pollBeaconUntilSuccess(async () => {
			invalidateBeaconCharacterCaches(context.characterId);
			const state = await buildBeaconRepeatingState(context.characterId, context.sectionName, false);
			const rowIndex = state && state.rows
				? state.rows.findIndex((row) => String(row.id) === String(context.rowId))
				: -1;
			const value = rowIndex >= 0
				? await getBeaconRepeatingField(
					state,
					rowIndex,
					context.fieldName,
					context.operation || "current",
					false
				)
				: undefined;
			return {
				success: rowIndex >= 0 && String(value) === beaconRepeatingValue(expectedValue),
				state,
				rowIndex,
				value
			};
		});
		return result.success
			? result
			: { success: false, value: result.value };
	}


	// Resolves a typed-collection shorthand such as
	// speeds->0->valueFormula->flatValue to the retained
	// structured Attribute root and canonical record path. This is generic
	// Beacon behavior: collection names come from each record's own type/kind/category.
	function resolveBeaconTypedCollectionWritePath(characterId, requestedSegments, operation = "current") {
		const segments = Array.isArray(requestedSegments)
			? requestedSegments.map((segment) => String(segment).trim())
			: [];
		if (segments.length < 3 || segments.some((segment) => !segment)) {
			return { success: false, matched: false };
		}

		const collectionName = segments[0];
		const normalizedCollectionName = normalizeBeaconLookupName(collectionName);
		const selector = segments[1];
		const leafPath = segments.slice(2);
		let sourceOperation = operation;
		let indexed = getBeaconTypedCollectionIndex(characterId, operation, false);
		let collectionEntries = getBeaconPreferredTypedEntries(indexed, operation, normalizedCollectionName, false);
		if (!collectionEntries.length) {
			if (!indexed.index.fallbackBuilt[operation]) {
				indexed = getBeaconTypedCollectionIndex(characterId, operation, true);
			}
			collectionEntries = getBeaconPreferredTypedEntries(indexed, operation, normalizedCollectionName, true);
		}

		// Max trees are commonly empty even when a matching current record exists.
		// Retain the current record's canonical path and scaffold the max parent path
		// using the current tree when the write itself targets max.
		if (!collectionEntries.length && operation === "max") {
			sourceOperation = "current";
			indexed = getBeaconTypedCollectionIndex(characterId, "current", false);
			collectionEntries = getBeaconPreferredTypedEntries(indexed, "current", normalizedCollectionName, false);
			if (!collectionEntries.length) {
				if (!indexed.index.fallbackBuilt.current) {
					indexed = getBeaconTypedCollectionIndex(characterId, "current", true);
				}
				collectionEntries = getBeaconPreferredTypedEntries(indexed, "current", normalizedCollectionName, true);
			}
		}
		if (!collectionEntries.length) {
			return { success: false, matched: false };
		}

		let entry;
		if (/^\d+$/.test(String(selector))) {
			entry = collectionEntries[Number(selector)];
			if (!entry) {
				return {
					success: false,
					matched: true,
					error: `typed Beacon collection "${collectionName}" has no record at index ${selector}`
				};
			}
		} else {
			const matches = findBeaconCollectionSelectorMatches(collectionEntries, selector);
			if (matches.length !== 1) {
				return {
					success: false,
					matched: true,
					error: matches.length > 1
						? `typed Beacon collection "${collectionName}" has ${matches.length} records matching selector "${selector}"; use a numeric index or another unique selector`
						: `typed Beacon collection "${collectionName}" has no unique record matching selector "${selector}"`
				};
			}
			entry = matches[0];
		}

		if (!entry || !Array.isArray(entry.path)) {
			return {
				success: false,
				matched: true,
				error: `typed Beacon collection "${collectionName}" did not retain a canonical record path`
			};
		}
		const rootAttribute = (entry.attributeId && getObj("attribute", entry.attributeId))
			|| findObjs({
				_type: "attribute",
				_characterid: characterId,
				name: entry.rootAttributeName || entry.rootName
			}, { caseInsensitive: true })[0];
		if (!rootAttribute) {
			return {
				success: false,
				matched: true,
				error: `typed Beacon record "${collectionName}->${selector}" no longer has its structured Attribute root`
			};
		}

		return {
			success: true,
			matched: true,
			collectionName,
			selector,
			sourceOperation,
			rootName: entry.rootName || entry.rootAttributeName,
			rootAttributeName: entry.rootAttributeName || entry.rootName,
			rootAttribute,
			path: entry.path.concat(leafPath),
			recordPath: entry.path.slice()
		};
	}

	async function writeBeaconStructuredPath(characterId, lookupPath, settingValue, operation = "current", options = {}) {
		const normalizedLookupPath = String(lookupPath == null ? "" : lookupPath).trim();
		let segments = normalizedLookupPath
			.split("->")
			.map((segment) => segment.trim());
		if (segments.length < 2 || segments.some((segment) => !segment)) {
			return {
				success: false,
				error: `nested Beacon writes require a root and at least one existing subfield`
			};
		}

		operation = String(operation || "current").toLowerCase();
		if (!['current', 'max'].includes(operation)) {
			return { success: false, error: `Beacon structured writes support only current or max` };
		}

		const requestedSegments = segments.slice();
		const requestedRoot = segments.shift();
		let rootName = normalizeBeaconLookupName(requestedRoot) === "sheet"
			? "store"
			: requestedRoot;
		let rootAttribute = findObjs({
			_type: "attribute",
			_characterid: characterId,
			name: rootName
		}, { caseInsensitive: true })[0];
		let typedCollectionResolution;
		if (!rootAttribute) {
			typedCollectionResolution = resolveBeaconTypedCollectionWritePath(
				characterId,
				requestedSegments,
				operation
			);
			if (!typedCollectionResolution.success) {
				return {
					success: false,
					error: typedCollectionResolution.error
						|| `the character has no structured Beacon root or typed collection named "${rootName}"`
				};
			}
			rootName = typedCollectionResolution.rootName;
			rootAttribute = typedCollectionResolution.rootAttribute;
			segments = typedCollectionResolution.path.slice();
			addBeaconPerformanceStat("typedCollectionWritePathResolutions");
		}

		const rawRoot = rootAttribute.get(operation);
		let parsedRoot = parseBeaconStructuredValue(rawRoot);
		const currentRoot = operation === "max"
			? parseBeaconStructuredValue(rootAttribute.get("current"))
			: parsedRoot;
		if ((!parsedRoot || typeof parsedRoot !== "object") && operation === "max" && currentRoot && typeof currentRoot === "object") {
			parsedRoot = Array.isArray(currentRoot) ? [] : {};
		}
		if (!parsedRoot || typeof parsedRoot !== "object") {
			return {
				success: false,
				error: `Beacon root "${rootName}" does not contain structured ${operation} data`
			};
		}

		let updatedRoot;
		try {
			updatedRoot = JSON.parse(JSON.stringify(parsedRoot));
		} catch (error) {
			return {
				success: false,
				error: `Beacon root "${rootName}" could not be cloned: ${error.message}`
			};
		}

		const repeatingWriteContext = consumeBeaconRepeatingWritableTarget(
			characterId,
			normalizedLookupPath,
			operation
		);
		if (repeatingWriteContext && repeatingWriteContext.operation !== operation) {
			return {
				success: false,
				error: `the repeating write target expected ${repeatingWriteContext.operation}, but the command requested ${operation}`
			};
		}
		if (operation === "max" && (repeatingWriteContext || typedCollectionResolution)) {
			const scaffolded = ensureBeaconStructuredParentPath(updatedRoot, currentRoot, segments);
			if (!scaffolded.success) {
				return { success: false, error: scaffolded.error };
			}
		}
		const updated = setBeaconStructuredLeaf(
			updatedRoot,
			segments,
			settingValue,
			Boolean(options.createMissingLeaf || (repeatingWriteContext && repeatingWriteContext.createMissingLeaf)),
			repeatingWriteContext ? repeatingWriteContext.sampleValue : options.sampleValue,
			Boolean(options.preserveBlank)
		);
		if (!updated.success) {
			return { success: false, error: updated.error };
		}

		const writeValue = typeof rawRoot === "string"
			? JSON.stringify(updatedRoot)
			: updatedRoot;
		try {
			rootAttribute.setWithWorker({ [operation]: writeValue });
		} catch (error) {
			return { success: false, error: error && error.message ? error.message : error };
		}

		const persisted = await waitForBeaconStructuredWrite(rootAttribute, segments, updated.value, operation);
		if (!persisted.success) {
			return {
				success: false,
				error: `the write was submitted, but ${rootName}.${operation}->${segments.join("->")} did not persist within the verification window`
			};
		}

		invalidateBeaconCharacterCaches(characterId);
		if (repeatingWriteContext) {
			const projected = await waitForBeaconRepeatingWriteProjection(repeatingWriteContext, updated.value);
			if (!projected.success) {
				return {
					success: false,
					error: `the canonical write persisted, but Beacon did not refresh ${repeatingWriteContext.sectionName} row ${repeatingWriteContext.rowId} field ${repeatingWriteContext.fieldName} within the verification window`
				};
			}
			setCurrentBeaconRepeatingRow(projected.state, projected.rowIndex);
		} else if (operation === "current") {
			refreshLoadedBeaconRepeatingState(characterId, rootName, segments, updated.value);
		}
		return {
			success: true,
			rootName,
			operation,
			path: segments,
			previousValue: updated.previousValue,
			value: updated.value,
			writeRoute: repeatingWriteContext
				? `attribute.setWithWorker and verified repeating projection${updated.createdLeaf ? " with missing leaf creation" : ""}`
				: (typedCollectionResolution
					? `typed collection ${typedCollectionResolution.collectionName}->${typedCollectionResolution.selector} translated to ${rootName}.${operation}->${segments.join("->")}`
					: "attribute.setWithWorker and verified root")
		};
	}


	function deleteBeaconStructuredValue(root, path) {
		if (!root || typeof root !== "object" || !Array.isArray(path) || path.length === 0) {
			return { success: false, error: `the structured Beacon path is empty or invalid` };
		}
		const located = getBeaconStructuredContainer(root, path.slice(0, -1));
		if (!located.success) {
			return { success: true, existed: false };
		}
		const selected = selectBeaconStructuredWriteKey(located.container, path[path.length - 1]);
		if (!selected.success) {
			return { success: true, existed: false };
		}
		const previousValue = located.container[selected.key];
		const arrayElement = Array.isArray(located.container);
		if (arrayElement) {
			located.container.splice(Number(selected.key), 1);
		} else {
			delete located.container[selected.key];
		}
		return { success: true, existed: true, previousValue, arrayElement };
	}

	async function waitForBeaconStructuredDelete(
		rootAttribute,
		path,
		previousValue,
		operation = "current",
		allowReplacement = false
	) {
		const previousSerialized = previousValue && typeof previousValue === "object"
			? JSON.stringify(previousValue)
			: previousValue;
		let stableChecks = 0;
		return await pollBeaconUntilSuccess(async () => {
			const parsedRoot = parseBeaconStructuredValue(rootAttribute.get(operation));
			const observed = getBeaconStructuredExistingLeaf(parsedRoot, path);
			if (!observed.success) {
				stableChecks++;
				return { success: stableChecks >= 3 };
			}
			if (allowReplacement) {
				const observedSerialized = observed.value && typeof observed.value === "object"
					? JSON.stringify(observed.value)
					: observed.value;
				if (!beaconStructuredWriteValuesMatch(observedSerialized, previousSerialized)) {
					stableChecks++;
					return { success: stableChecks >= 3, replacementValue: observed.value };
				}
			}
			stableChecks = 0;
			return { success: false };
		});
	}

	async function waitForBeaconRepeatingRowDeletion(context) {
		const result = await pollBeaconUntilSuccess(async () => {
			invalidateBeaconCharacterCaches(context.characterId);
			const state = await buildBeaconRepeatingState(context.characterId, context.sectionName, false);
			const rowIndex = state && state.rows
				? state.rows.findIndex((row) => String(row.id) === String(context.rowId))
				: -1;
			return { success: rowIndex < 0, state, rowIndex };
		});
		return result.success ? result : { success: false };
	}

	async function deleteBeaconStructuredPath(characterId, lookupPath, operation = "current") {
		const normalizedLookupPath = String(lookupPath == null ? "" : lookupPath).trim();
		let segments = normalizedLookupPath
			.split("->")
			.map((segment) => segment.trim());
		if (segments.length < 2 || segments.some((segment) => !segment)) {
			return { success: false, error: `nested Beacon deletes require a root and at least one subfield` };
		}
		operation = String(operation || "current").toLowerCase();
		if (!["current", "max"].includes(operation)) {
			return { success: false, error: `Beacon structured deletes support only current or max` };
		}
		const requestedSegments = segments.slice();
		const requestedRoot = segments.shift();
		let rootName = normalizeBeaconLookupName(requestedRoot) === "sheet" ? "store" : requestedRoot;
		const repeatingDeleteContext = consumeBeaconRepeatingWritableTarget(
			characterId,
			normalizedLookupPath,
			operation
		);
		if (repeatingDeleteContext && repeatingDeleteContext.operation !== operation) {
			return {
				success: false,
				error: `the repeating delete target expected ${repeatingDeleteContext.operation}, but the command requested ${operation}`
			};
		}
		let rootAttribute = findObjs({
			_type: "attribute",
			_characterid: characterId,
			name: rootName
		}, { caseInsensitive: true })[0];
		let typedCollectionResolution;
		if (!rootAttribute) {
			typedCollectionResolution = resolveBeaconTypedCollectionWritePath(
				characterId,
				requestedSegments,
				operation
			);
			if (!typedCollectionResolution.success) {
				if (typedCollectionResolution.matched) {
					return { success: false, error: typedCollectionResolution.error };
				}
				return { success: true, existed: false, rootName, operation, path: segments };
			}
			rootName = typedCollectionResolution.rootName;
			rootAttribute = typedCollectionResolution.rootAttribute;
			segments = typedCollectionResolution.path.slice();
			addBeaconPerformanceStat("typedCollectionDeletePathResolutions");
		}
		const rawRoot = rootAttribute.get(operation);
		const parsedRoot = parseBeaconStructuredValue(rawRoot);
		if (!parsedRoot || typeof parsedRoot !== "object") {
			return { success: true, existed: false, rootName, operation, path: segments };
		}
		let updatedRoot;
		try {
			updatedRoot = JSON.parse(JSON.stringify(parsedRoot));
		} catch (error) {
			return { success: false, error: `Beacon root "${rootName}" could not be cloned: ${error.message}` };
		}

		const deleted = deleteBeaconStructuredValue(updatedRoot, segments);
		if (!deleted.success) {
			return deleted;
		}
		if (!deleted.existed) {
			return { success: true, existed: false, rootName, operation, path: segments };
		}

		let recordPruned = false;
		let rowDeleted = false;
		let prunedPreviousValue;
		let prunedArrayElement = false;
		if (repeatingDeleteContext && Array.isArray(repeatingDeleteContext.recordPath)) {
			const remainingRecord = getBeaconStructuredExistingLeaf(updatedRoot, repeatingDeleteContext.recordPath);
			if (remainingRecord.success
				&& remainingRecord.value
				&& typeof remainingRecord.value === "object"
				&& !Array.isArray(remainingRecord.value)) {
				if (!beaconRepeatingRecordHasMeaningfulFields(
					remainingRecord.value,
					repeatingDeleteContext.sectionName
				)) {
					prunedPreviousValue = remainingRecord.value;
					const removedRecord = deleteBeaconStructuredValue(updatedRoot, repeatingDeleteContext.recordPath);
					recordPruned = removedRecord.success && removedRecord.existed;
					prunedArrayElement = Boolean(removedRecord.arrayElement);
					rowDeleted = recordPruned && operation === "current";
				}
			}
		}

		let rawCompanionMaxRoot;
		let updatedCompanionMaxRoot;
		let companionMaxDeleted;
		if (rowDeleted && repeatingDeleteContext && Array.isArray(repeatingDeleteContext.recordPath)) {
			rawCompanionMaxRoot = rootAttribute.get("max");
			const parsedCompanionMaxRoot = parseBeaconStructuredValue(rawCompanionMaxRoot);
			if (parsedCompanionMaxRoot && typeof parsedCompanionMaxRoot === "object") {
				try {
					updatedCompanionMaxRoot = JSON.parse(JSON.stringify(parsedCompanionMaxRoot));
				} catch (error) {
					return { success: false, error: `Beacon max root "${rootName}" could not be cloned for row cleanup: ${error.message}` };
				}
				companionMaxDeleted = deleteBeaconStructuredValue(
					updatedCompanionMaxRoot,
					repeatingDeleteContext.recordPath
				);
			}
		}

		const writeProperties = {
			[operation]: typeof rawRoot === "string" ? JSON.stringify(updatedRoot) : updatedRoot
		};
		if (companionMaxDeleted && companionMaxDeleted.success && companionMaxDeleted.existed) {
			writeProperties.max = typeof rawCompanionMaxRoot === "string"
				? JSON.stringify(updatedCompanionMaxRoot)
				: updatedCompanionMaxRoot;
		}
		try {
			rootAttribute.setWithWorker(writeProperties);
		} catch (error) {
			return { success: false, error: error && error.message ? error.message : error };
		}

		const rollbackProperties = { [operation]: rawRoot };
		if (companionMaxDeleted && companionMaxDeleted.success && companionMaxDeleted.existed) {
			rollbackProperties.max = rawCompanionMaxRoot;
		}

		const verifyPath = recordPruned && repeatingDeleteContext && Array.isArray(repeatingDeleteContext.recordPath)
			? repeatingDeleteContext.recordPath
			: segments;
		const verifyPreviousValue = recordPruned ? prunedPreviousValue : deleted.previousValue;
		const allowReplacement = recordPruned ? prunedArrayElement : Boolean(deleted.arrayElement);
		const persisted = await waitForBeaconStructuredDelete(
			rootAttribute,
			verifyPath,
			verifyPreviousValue,
			operation,
			allowReplacement
		);
		if (!persisted.success) {
			const rollbackError = restoreBeaconStructuredRoots(rootAttribute, rollbackProperties, characterId);
			return {
				success: false,
				rolledBack: !rollbackError,
				error: rollbackError
					? `the delete was submitted, ${rootName}.${operation}->${verifyPath.join("->")} remained present, and rollback failed: ${rollbackError}`
					: `the delete was submitted, but ${rootName}.${operation}->${verifyPath.join("->")} remained present; the root was restored`
			};
		}

		if (companionMaxDeleted && companionMaxDeleted.success && companionMaxDeleted.existed) {
			const companionPersisted = await waitForBeaconStructuredDelete(
				rootAttribute,
				repeatingDeleteContext.recordPath,
				companionMaxDeleted.previousValue,
				"max",
				Boolean(companionMaxDeleted.arrayElement)
			);
			if (!companionPersisted.success) {
				const rollbackError = restoreBeaconStructuredRoots(rootAttribute, rollbackProperties, characterId);
				return {
					success: false,
					rolledBack: !rollbackError,
					error: rollbackError
						? `the current row was removed, its companion max record remained, and rollback failed: ${rollbackError}`
						: `the current row was removed, but its companion max record remained; both roots were restored`
				};
			}
		}

		invalidateBeaconCharacterCaches(characterId);
		if (repeatingDeleteContext) {
			if (rowDeleted) {
				const projected = await waitForBeaconRepeatingRowDeletion(repeatingDeleteContext);
				if (!projected.success) {
					return {
						success: false,
						error: `the canonical row was deleted, but ${repeatingDeleteContext.sectionName} row ${repeatingDeleteContext.rowId} remained projected`
					};
				}
				clearCachedBeaconAttributeRepeatingRow(characterId, repeatingDeleteContext.sectionName, repeatingDeleteContext.rowId);
				clearLoadedBeaconRepeatingState(characterId);
			} else {
				// Beacon may continue to expose a synthesized/defaulted compatibility value after
				// the canonical leaf is deleted. Treat the persisted root deletion as authoritative
				// and refresh the projected row.
				invalidateBeaconCharacterCaches(characterId);
				const state = await buildBeaconRepeatingState(characterId, repeatingDeleteContext.sectionName, false);
				const rowIndex = state && state.rows
					? state.rows.findIndex((row) => String(row.id) === String(repeatingDeleteContext.rowId))
					: -1;
				if (rowIndex < 0) {
					clearLoadedBeaconRepeatingState(characterId);
				} else {
					setCurrentBeaconRepeatingRow(state, rowIndex);
				}
			}
		} else {
			clearLoadedBeaconRepeatingState(characterId);
		}
		return {
			success: true,
			existed: true,
			rootName,
			operation,
			path: segments,
			previousValue: deleted.previousValue,
			recordPruned,
			rowDeleted,
			companionMaxDeleted: Boolean(companionMaxDeleted && companionMaxDeleted.existed),
			writeRoute: rowDeleted
				? `attribute.setWithWorker with empty canonical row pruning${companionMaxDeleted && companionMaxDeleted.existed ? " and companion max cleanup" : ""}`
				: (recordPruned && operation === "max"
					? "attribute.setWithWorker with empty maximum-record pruning"
					: (typedCollectionResolution
						? `typed collection ${typedCollectionResolution.collectionName}->${typedCollectionResolution.selector} translated to ${rootName}.${operation}->${segments.join("->")} for verified property deletion`
						: "attribute.setWithWorker with verified property deletion"))
		};
	}

	function cacheBeaconAttributeRepeatingRow(state, rowIndex) {
		if (!state || !state.rows || !state.rows[rowIndex]) {
			return;
		}
		const row = state.rows[rowIndex];
		const key = `${state.characterId}\u0000${state.sectionName.toLowerCase()}\u0000${String(row.id)}`;
		let record = row.record;
		try {
			record = JSON.parse(JSON.stringify(row.record));
		} catch (error) {
			// Use the unmodified snapshot when cloning is unavailable.
		}
		beaconAttributeRepeatingRowCache.set(key, {
			characterId: String(state.characterId),
			sectionName: state.sectionName,
			row: {
				...row,
				record,
				path: Array.isArray(row.path) ? row.path.slice() : row.path,
				values: {}
			}
		});
	}

	function getCachedBeaconAttributeRepeatingTarget(characterId, requestedName) {
		for (const cached of beaconAttributeRepeatingRowCache.values()) {
			if (String(cached.characterId) !== String(characterId)) {
				continue;
			}
			const prefix = `${cached.sectionName}_${cached.row.id}_`;
			if (!requestedName.toLowerCase().startsWith(prefix.toLowerCase())) {
				continue;
			}
			let fieldName = requestedName.substring(prefix.length);
			let operation = "current";
			if (/_max$/i.test(fieldName)) {
				fieldName = fieldName.substring(0, fieldName.length - 4);
				operation = "max";
			}
			return {
				state: {
					characterId: cached.characterId,
					sectionName: cached.sectionName,
					rows: [cached.row],
					enumerationRoute: "attribute;set cached canonical row"
				},
				rowIndex: 0,
				fieldName,
				operation
			};
		}
		return undefined;
	}

	function clearCachedBeaconAttributeRepeatingRow(characterId, sectionName, rowId) {
		const key = `${characterId}\u0000${String(sectionName).toLowerCase()}\u0000${String(rowId)}`;
		beaconAttributeRepeatingRowCache.delete(key);
	}

	async function resolveBeaconAttributeSetRepeatingTarget(characterId, attributeName, debug, options = {}) {
		const requestedName = String(attributeName == null ? "" : attributeName).trim();
		if (!/^repeating_/i.test(requestedName)) {
			return { success: false, error: `the name is not a repeating attribute` };
		}
		const cachedTarget = options.allowCached === false
			? undefined
			: getCachedBeaconAttributeRepeatingTarget(characterId, requestedName);
		if (cachedTarget) {
			if (debug) {
				log(`ScriptCards Beacon ${options.logPrefix || "attribute;set"}: ${requestedName} reused the cached canonical row path after its public projection changed.`);
			}
			return { success: true, ...cachedTarget };
		}
		const testState = async (state) => {
			if (!state || !Array.isArray(state.rows)) {
				return undefined;
			}
			const prefix = `${state.sectionName}_`;
			if (!requestedName.toLowerCase().startsWith(prefix.toLowerCase())) {
				return undefined;
			}
			const remainder = requestedName.substring(prefix.length);
			const rows = state.rows.slice().sort((left, right) => String(right.id).length - String(left.id).length);
			for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
				const rowPrefix = `${rows[rowIndex].id}_`;
				if (remainder.startsWith(rowPrefix)) {
					const actualIndex = state.rows.findIndex((row) => String(row.id) === String(rows[rowIndex].id));
					let fieldName = remainder.substring(rowPrefix.length);
					let operation = options.operationOverride || "current";
					if (!options.operationOverride && /_max$/i.test(fieldName)) {
						fieldName = fieldName.substring(0, fieldName.length - 4);
						operation = "max";
					}
					return { state, rowIndex: actualIndex, fieldName, operation };
				}
			}
			return undefined;
		};

		if (repeatingBeaconState && String(repeatingBeaconState.characterId) === String(characterId)) {
			const loadedMatch = await testState(repeatingBeaconState);
			if (loadedMatch) {
				if (options.cache !== false) {
					cacheBeaconAttributeRepeatingRow(loadedMatch.state, loadedMatch.rowIndex);
				}
				return { success: true, ...loadedMatch };
			}
		}

		const underscorePositions = [];
		for (let index = "repeating_".length; index < requestedName.length; index++) {
			if (requestedName[index] === "_") {
				underscorePositions.push(index);
			}
		}
		for (const position of underscorePositions) {
			const sectionName = requestedName.substring(0, position);
			const state = await buildBeaconRepeatingState(characterId, sectionName, false);
			const match = await testState(state);
			if (match) {
				if (options.cache !== false) {
					cacheBeaconAttributeRepeatingRow(match.state, match.rowIndex);
				}
				if (debug) {
					log(`ScriptCards Beacon ${options.logPrefix || "attribute;set"}: ${requestedName} resolved to ${state.sectionName} row ${state.rows[match.rowIndex].id} field ${match.fieldName}${match.operation === "max" ? " max" : ""}.`);
				}
				return { success: true, ...match };
			}
		}
		return { success: false, error: `no Beacon repeating row matched "${requestedName}"` };
	}

	async function setExistingBeaconRepeatingAttribute(characterId, attributeName, value, operation, debug) {
		const requestedName = String(attributeName == null ? "" : attributeName).trim();
		const settingValue = String(value == null ? "" : value);
		const target = await resolveBeaconAttributeSetRepeatingTarget(
			characterId,
			requestedName,
			debug,
			{
				allowCached: false,
				cache: false,
				operationOverride: operation,
				logPrefix: "--!a"
			}
		);
		if (!target.success) {
			return {
				success: false,
				error: `${target.error}; --!a does not create Beacon repeating rows. Create the row with --!or first.`
			};
		}

		const writable = await getBeaconRepeatingWritablePath(
			target.state,
			target.rowIndex,
			target.fieldName,
			debug,
			operation,
			{ allowProtected: true }
		);
		if (!writable.success) {
			return writable;
		}

		const row = target.state.rows[target.rowIndex];
		let fieldExists = false;
		let existingValue = "";
		if (operation === "max") {
			let rootAttribute = row.attributeId ? getObj("attribute", row.attributeId) : undefined;
			if (!rootAttribute && row.rootAttributeName) {
				rootAttribute = findObjs({
					_type: "attribute",
					_characterid: characterId,
					name: row.rootAttributeName
				}, { caseInsensitive: true })[0];
			}
			if (rootAttribute) {
				const maxRoot = parseBeaconStructuredValue(rootAttribute.get("max"));
				const located = getBeaconStructuredExistingLeaf(maxRoot, row.path.concat(writable.fieldName));
				if (located.success) {
					fieldExists = true;
					existingValue = located.value;
				}
			}
		} else {
			const existingKey = beaconOwnPropertyKey(row.record, writable.fieldName);
			if (existingKey !== undefined) {
				fieldExists = true;
				existingValue = row.record[existingKey];
			}
		}

		let finalValue = settingValue;
		if (settingValue.startsWith("+=") || settingValue.startsWith("-=")) {
			const add = settingValue.startsWith("+=");
			const delta = settingValue.substring(2);
			if (!fieldExists) {
				finalValue = add ? delta : `-${delta}`;
				if (isNumber(finalValue)) {
					finalValue = Number(finalValue);
				}
			} else if (isNumber(existingValue) && isNumber(delta)) {
				finalValue = add
					? Number(existingValue) + Number(delta)
					: Number(existingValue) - Number(delta);
			} else {
				finalValue = `${existingValue == null ? "" : existingValue}${delta}`;
			}
		}

		registerBeaconRepeatingWritableTarget(writable);
		const result = await writeBeaconStructuredPath(
			characterId,
			writable.path,
			finalValue,
			operation,
			{
				createMissingLeaf: true,
				sampleValue: writable.sampleValue,
				preserveBlank: finalValue === ""
			}
		);
		if (debug && result.success) {
			log(`ScriptCards Beacon --!a repeating write: ${requestedName}.${operation} = ${JSON.stringify(finalValue)} through ${result.writeRoute || "canonical repeating write"}.`);
		}
		return result;
	}

	async function getBeaconAttributeSetSheetItemTarget(characterId, requestedName, operation) {
		const explicitCustom = requestedName.toLowerCase().startsWith("user.");
		const schemaProperty = explicitCustom ? undefined : getBeaconComputedTokenBarProperty(requestedName);
		const nativeName = schemaProperty ? schemaProperty.property : requestedName;
		try {
			const nativeValue = await readBeaconSheetItem(characterId, nativeName, operation);
			if (!beaconLookupIsUnresolved(nativeValue)) {
				return { exists: true, targetName: nativeName, value: nativeValue, route: explicitCustom ? "custom sheet item" : "native sheet item" };
			}
		} catch (error) {
			// Missing values continue to custom fallback or creation.
		}
		if (explicitCustom) {
			return { exists: false, targetName: requestedName, value: undefined, route: "custom sheet item" };
		}
		const customName = `user.${requestedName}`;
		try {
			const customValue = await readBeaconSheetItem(characterId, customName, operation);
			if (!beaconLookupIsUnresolved(customValue)) {
				return { exists: true, targetName: customName, value: customValue, route: "custom sheet item" };
			}
		} catch (error) {
			// Missing custom values can be created by a nonblank set.
		}
		return { exists: false, targetName: customName, value: undefined, route: "custom sheet item" };
	}

	async function waitForBeaconSheetItem(characterId, name, operation, expected, missing) {
		const result = await pollBeaconUntilSuccess(async () => {
			let value;
			try {
				value = await readBeaconSheetItem(characterId, name, operation, { fresh: true, cacheResult: false });
			} catch (error) {
				value = undefined;
			}
			const valueMatches = beaconStructuredWriteValuesMatch(value, expected)
				|| (value !== undefined && value !== null && expected !== undefined && expected !== null
					&& String(value) === String(expected));
			return { success: missing ? beaconLookupIsUnresolved(value) : valueMatches, value };
		});
		return result.success ? result : { success: false };
	}

	async function setBeaconAttributeFunction(characterId, attributeName, value, debug) {
		const character = getObj("character", characterId);
		if (!character) {
			return { success: false, error: `unable to find character ${characterId}` };
		}
		const requestedName = String(attributeName == null ? "" : attributeName).trim();
		const settingValue = String(value == null ? "" : value).trim();
		if (!requestedName) {
			return { success: false, error: `an attribute name is required` };
		}

		if (/^(?:b-|c-)/i.test(requestedName)) {
			return { success: false, error: `Beacon prefixes have been removed; use "${requestedName.substring(2)}"` };
		}

		const explicitBeacon = requestedName.includes("->");
		if (!explicitBeacon) {
			const exactClassicAttributes = findObjs({
				_type: "attribute",
				_characterid: characterId,
				name: requestedName
			});
			if (exactClassicAttributes.length) {
				exactClassicAttributes.forEach((attribute) => attribute.remove());
				if (settingValue !== "") {
					createObj("attribute", { _characterid: characterId, name: requestedName, current: settingValue });
				}
				invalidateBeaconCharacterCaches(characterId);
				if (debug) {
					log(`ScriptCards Beacon attribute;set: used exact classic Attribute replacement for ${requestedName}; ${settingValue === "" ? "deleted" : "recreated"} ${exactClassicAttributes.length} matching object(s).`);
				}
				return { success: true, route: "classic Attribute objects", deleted: settingValue === "" };
			}
		}

		if (/^repeating_/i.test(requestedName)) {
			const target = await resolveBeaconAttributeSetRepeatingTarget(characterId, requestedName, debug);
			if (!target.success) {
				return settingValue === "" ? { success: true, existed: false, route: "missing repeating attribute" } : target;
			}
			const writable = await getBeaconRepeatingWritablePath(
				target.state,
				target.rowIndex,
				target.fieldName,
				debug,
				target.operation,
				{ allowProtected: true, allowContainerDelete: settingValue === "" }
			);
			if (!writable.success) {
				return writable;
			}
			registerBeaconRepeatingWritableTarget(writable);
			const result = settingValue === ""
				? await deleteBeaconStructuredPath(characterId, writable.path, target.operation)
				: await writeBeaconStructuredPath(characterId, writable.path, settingValue, target.operation, { createMissingLeaf: true, sampleValue: writable.sampleValue });
			if (debug && result.success) {
				log(`ScriptCards Beacon attribute;set: ${requestedName} ${settingValue === "" ? "deleted" : "set"} through ${result.writeRoute || "canonical repeating write"}${result.rowDeleted ? "; the empty canonical row was removed" : ""}.`);
			}
			return result;
		}

		let operation = "current";
		let beaconName = requestedName;
		if (beaconName.endsWith("^")) {
			operation = "max";
			beaconName = beaconName.substring(0, beaconName.length - 1);
		}
		if (beaconName.includes("->")) {
			const result = settingValue === ""
				? await deleteBeaconStructuredPath(characterId, beaconName, operation)
				: await writeBeaconStructuredPath(characterId, beaconName, settingValue, operation, { createMissingLeaf: true });
			if (debug && result.success) {
				log(`ScriptCards Beacon attribute;set: ${beaconName}${operation === "max" ? "^" : ""} ${settingValue === "" ? "deleted" : "set"} through ${result.writeRoute || "structured write"}.`);
			}
			return result;
		}

		const structuredAliasWrite = await writeDnd2024BeaconStructuredAlias(
			characterId,
			beaconName,
			settingValue,
			operation
		);
		if (structuredAliasWrite.handled) {
			if (debug && structuredAliasWrite.success) {
				log(`ScriptCards Beacon attribute;set compatibility write: ${beaconName}.${operation} = ${JSON.stringify(structuredAliasWrite.value)} through ${structuredAliasWrite.writeRoute}.`);
			}
			return structuredAliasWrite;
		}

		const target = await getBeaconAttributeSetSheetItemTarget(characterId, beaconName, operation);
		if (!target.exists && settingValue === "") {
			return { success: true, existed: false, route: "missing sheet item" };
		}

		if (settingValue === "" && target.targetName.toLowerCase().startsWith("user.")) {
			const backingAttributes = findObjs({
				_type: "attribute",
				_characterid: characterId,
				name: target.targetName
			});
			if (backingAttributes.length) {
				backingAttributes.forEach((attribute) => attribute.remove());
				beaconSheetItemCache.delete(getBeaconSheetItemCacheKey(characterId, operation, target.targetName));
				invalidateBeaconCharacterCaches(characterId);
				const verified = await waitForBeaconSheetItem(characterId, target.targetName, operation, undefined, true);
				if (!verified.success) {
					return { success: false, error: `custom sheet item "${target.targetName}" remained after its backing Attribute object was removed` };
				}
				if (debug) {
					log(`ScriptCards Beacon attribute;set: deleted custom sheet item ${target.targetName} by removing ${backingAttributes.length} backing Attribute object(s).`);
				}
				return { success: true, deleted: true, route: "custom Attribute object removal" };
			}
		}

		try {
			await setSheetItem(characterId, target.targetName, settingValue, operation, { allowThrow: true });
			invalidateBeaconCharacterCaches(characterId);
		} catch (error) {
			return { success: false, error: error && error.message ? error.message : error };
		}
		const verified = await waitForBeaconSheetItem(characterId, target.targetName, operation, settingValue, false);
		if (!verified.success) {
			return { success: false, error: `${target.targetName}.${operation} did not persist as ${JSON.stringify(settingValue)}` };
		}
		if (debug) {
			log(`ScriptCards Beacon attribute;set: ${settingValue === "" ? "cleared" : "set"} ${target.targetName}.${operation} through ${target.route}.`);
		}
		return { success: true, value: settingValue, route: target.route, cleared: settingValue === "" };
	}

	function beaconPrimitive(value) {
		return value === null || value === undefined || ["string", "number", "boolean"].includes(typeof value);
	}

	function beaconFirstPrimitive(record, paths) {
		for (const path of paths) {
			let value = record;
			for (const property of path) {
				value = beaconProperty(value, property);
				if (value === undefined || value === null) {
					break;
				}
			}
			if (beaconPrimitive(value) && value !== undefined && value !== null && String(value).trim() !== "") {
				return value;
			}
		}
		return undefined;
	}

	function beaconRecordIdentity(record) {
		const identity = beaconFirstPrimitive(record, [["name"], ["label"], ["title"], ["slug"]]);
		return identity === undefined ? "" : String(identity).trim();
	}

	function beaconRecordStableIdentity(record) {
		const identity = beaconFirstPrimitive(record, [["shortID"], ["uuid"]]);
		return identity === undefined ? "" : String(identity).trim();
	}

	function beaconEntryRawIdentities(entry) {
		const identities = new Set();
		if (entry && entry.record && typeof entry.record === "object") {
			for (const key of ["_id", "id", "key", "uuid"]) {
				const value = beaconProperty(entry.record, key);
				if (value !== undefined && value !== null && String(value).trim() !== "") {
					identities.add(String(value).trim());
				}
			}
		}
		const normalizedPath = entry && Array.isArray(entry.path)
			? entry.path.map((segment) => normalizeBeaconLookupName(segment))
			: [];
		if (entry
			&& normalizeBeaconLookupName(entry.rootName) === "store"
			&& normalizedPath.length >= 3
			&& normalizedPath[0] === "integrants"
			&& normalizedPath[1] === "integrants") {
			const pathKey = entry.path[entry.path.length - 1];
			if (pathKey !== undefined && pathKey !== null && String(pathKey).trim() !== "") {
				identities.add(String(pathKey).trim());
			}
		}
		return identities;
	}

	function beaconRecordEnabledState(record) {
		for (const key of ["_enabled", "enabled"]) {
			const value = beaconProperty(record, key);
			if (value !== undefined) {
				return ![false, 0, null, "false", "0", "off", "no"].includes(
					typeof value === "string" ? value.trim().toLowerCase() : value
				);
			}
		}
		return undefined;
	}

	function beaconRecordOrder(record) {
		for (const key of BEACON_RECORD_ORDER_FIELDS) {
			const value = Number(beaconProperty(record, key));
			if (Number.isFinite(value)) {
				return value;
			}
		}
		return Number.MAX_SAFE_INTEGER;
	}

	function pluralizeBeaconType(value) {
		const phrase = String(value == null ? "" : value).trim();
		if (!phrase) {
			return "";
		}
		const words = phrase.split(/\s+/);
		const word = words.pop();
		let pluralWord;
		if (/s$/i.test(word) && !/(ss|us|is)$/i.test(word)) {
			return phrase;
		}
		if (/is$/i.test(word)) {
			pluralWord = `${word.slice(0, -2)}es`;
		} else if (/[^aeiou]y$/i.test(word)) {
			pluralWord = `${word.slice(0, -1)}ies`;
		} else if (/(s|x|z|ch|sh)$/i.test(word)) {
			pluralWord = `${word}es`;
		} else {
			pluralWord = `${word}s`;
		}
		return words.concat(pluralWord).join(" ");
	}

	function readBeaconSubfields(value, subfields) {
		let result = parseBeaconStructuredValue(value) || value;
		for (const subfield of subfields) {
			result = parseBeaconStructuredValue(result) || result;
			if (Array.isArray(result) && !/^\d+$/.test(String(subfield))) {
				const identity = normalizeBeaconLookupName(subfield);
				const matches = result.filter((record) =>
					record
					&& typeof record === "object"
					&& !Array.isArray(record)
					&& beaconRecordEnabledState(record) !== false
					&& normalizeBeaconLookupName(beaconRecordIdentity(record)) === identity
				);
				if (matches.length !== 1) {
					return undefined;
				}
				result = matches[0];
			} else {
				result = beaconProperty(result, subfield);
			}
			if (result === undefined || result === null) {
				return undefined;
			}
		}
		return result;
	}


	function getBeaconPreferredTypedEntries(indexed, operation, collectionName, allowBuilderFallback) {
		if (!indexed || !indexed.index || !indexed.index[operation]) {
			return [];
		}
		const entries = indexed.index[operation].get(normalizeBeaconLookupName(collectionName)) || [];
		const authoritative = entries.filter((entry) => normalizeBeaconLookupName(entry.rootName) !== "builder");
		return authoritative.length || !allowBuilderFallback ? authoritative : entries;
	}

	function getBeaconAuthoritativeTypedEntries(characterId, operation, collectionName) {
		const indexed = getBeaconTypedCollectionIndex(characterId, operation, false);
		return getBeaconPreferredTypedEntries(indexed, operation, collectionName, false);
	}

	function beaconProficiencyIsActive(value) {
		if (value === undefined || value === null || value === false || value === 0) {
			return false;
		}
		const normalized = normalizeBeaconLookupName(value);
		return !["", "0", "false", "off", "no", "none", "notproficient", "untrained"].includes(normalized);
	}


	function getBeaconAuthoritativeTypedRecords(characterId, operation, collectionName) {
		return getBeaconAuthoritativeTypedEntries(characterId, operation, collectionName).map((entry) => entry.record);
	}

	function beaconNumericPrimitive(record, paths) {
		const value = beaconFirstPrimitive(record, paths);
		const number = Number(value);
		return Number.isFinite(number) ? number : undefined;
	}

	function beaconSingleNumericRecordValue(characterId, collectionName, predicate, valuePaths, operation = "current") {
		const matches = getBeaconAuthoritativeTypedRecords(characterId, operation, collectionName)
			.filter((record) => !predicate || predicate(record));
		const activeMatches = dnd2024BeaconActiveRecords(characterId, matches);
		if (!activeMatches || activeMatches.length !== 1) {
			return undefined;
		}
		return beaconNumericPrimitive(activeMatches[0], valuePaths);
	}

	function readDnd2024BeaconStoreValue(characterId, path, operation = "current") {
		const adapter = getDnd2024BeaconAdapter(characterId);
		if (!adapter) {
			return undefined;
		}
		const index = getBeaconStructuredIndex(characterId);
		const storeRoot = getBeaconStructuredRoot(index, operation, adapter.rootNames.store);
		if (!storeRoot.found) {
			return undefined;
		}
		const value = readBeaconSubfields(storeRoot.value, path);
		return beaconLookupIsUnresolved(value) ? undefined : value;
	}

	function dnd2024ChallengeNumber(value) {
		if (value === undefined || value === null || String(value).trim() === "") {
			return undefined;
		}
		const text = String(value).trim();
		if (text.includes("/")) {
			const parts = text.split("/").map(Number);
			if (parts.length === 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1]) && parts[1] !== 0) {
				return parts[0] / parts[1];
			}
		}
		const number = Number(text);
		return Number.isFinite(number) ? number : undefined;
	}

	function dnd2024ChallengeXp(characterId, value) {
		const adapter = getDnd2024BeaconAdapter(characterId);
		const challenge = dnd2024ChallengeNumber(value);
		if (!adapter || challenge === undefined) {
			return undefined;
		}
		return adapter.xpByChallenge.get(challenge);
	}

	function dnd2024BeaconClassLevelTotal(characterId) {
		const adapter = getDnd2024BeaconAdapter(characterId);
		if (!adapter) {
			return undefined;
		}
		const candidates = getBeaconAuthoritativeTypedRecords(characterId, "current", adapter.collections.classLevels)
			.filter((record) => {
				const classId = beaconProperty(record, adapter.fields.classID);
				return classId !== undefined && classId !== null && String(classId).trim() !== "";
			});
		const records = dnd2024BeaconActiveRecords(characterId, candidates);
		if (!records) {
			return undefined;
		}
		const classLevels = [];
		for (const record of records) {
			const value = Number(beaconProperty(record, adapter.fields.totalLevel));
			if (!Number.isFinite(value) || value <= 0) {
				return undefined;
			}
			classLevels.push(value);
		}
		return classLevels.length
			? classLevels.reduce((total, contribution) => total + contribution, 0)
			: undefined;
	}

	function dnd2024BeaconProficiencyBonus(characterId) {
		const adapter = getDnd2024BeaconAdapter(characterId);
		if (!adapter) {
			return undefined;
		}
		let level = dnd2024BeaconClassLevelTotal(characterId);
		if (level === undefined) {
			const challenge = dnd2024ChallengeNumber(readDnd2024BeaconStoreValue(characterId, adapter.storedAliases.npcchallenge));
			if (challenge !== undefined) {
				level = Math.max(1, challenge);
			}
		}
		return level === undefined ? undefined : 2 + Math.floor((level - 1) / 4);
	}

	function dnd2024BeaconAbilityRecordKeys(record) {
		const values = [
			beaconProperty(record, "ability"),
			beaconProperty(beaconProperty(record, "valueFormula"), "ability")
		]
			.filter((value) => value !== undefined && value !== null && String(value).trim() !== "")
			.map((value) => normalizeBeaconLookupName(value));
		return [...new Set(values)];
	}

	function dnd2024BeaconAbilityScore(characterId, abilityName) {
		const adapter = getDnd2024BeaconAdapter(characterId);
		if (!adapter) {
			return undefined;
		}

		const normalizedAbility = normalizeBeaconLookupName(abilityName);
		const candidates = getBeaconAuthoritativeTypedRecords(characterId, "current", adapter.collections.abilityScores)
			.filter((record) => dnd2024BeaconAbilityRecordKeys(record).includes(normalizedAbility));
		if (candidates.some((record) => dnd2024BeaconAbilityRecordKeys(record).length !== 1)) {
			return undefined;
		}
		const records = dnd2024BeaconActiveRecords(characterId, candidates);

		if (!records || !records.length) {
			return undefined;
		}

		let baseScore;
		let modifyTotal = 0;
		let minimumScore;

		for (const record of records) {
			const value = beaconNumericPrimitive(record, adapter.valuePaths.formulaFlatValue);
			if (value === undefined) {
				return undefined;
			}

			const calculation = normalizeBeaconLookupName(beaconProperty(record, "calculation"));
			if (calculation === "setbase") {
				// Multiple different base values are ambiguous. Defer to the native SDK result.
				if (baseScore !== undefined && baseScore !== value) {
					return undefined;
				}
				baseScore = value;
				continue;
			}

			if (calculation === "modify") {
				modifyTotal += value;
				continue;
			}

			if (calculation === "minimum") {
				minimumScore = minimumScore === undefined ? value : Math.max(minimumScore, value);
				continue;
			}

			// A single simple score record supplies the base score.
			if (!calculation && records.length === 1) {
				baseScore = value;
				continue;
			}

			return undefined;
		}

		if (baseScore === undefined) {
			return undefined;
		}

		const combinedScore = baseScore + modifyTotal;
		return minimumScore === undefined ? combinedScore : Math.max(combinedScore, minimumScore);
	}

	function dnd2024BeaconAbilityModifier(characterId, abilityName) {
		const score = dnd2024BeaconAbilityScore(characterId, abilityName);
		return score === undefined ? undefined : Math.floor((score - 10) / 2);
	}

	function dnd2024BeaconProficiencyMultiplier(value) {
		if (!beaconProficiencyIsActive(value)) {
			return 0;
		}
		const numeric = Number(value);
		if (Number.isFinite(numeric)) {
			if (numeric === 0.5 || numeric === 1 || numeric === 2) {
				return numeric;
			}
			return undefined;
		}
		const normalized = normalizeBeaconLookupName(value);
		if (normalized.includes("expert") || normalized.includes("double")) {
			return 2;
		}
		if (normalized.includes("half")) {
			return 0.5;
		}
		if (normalized.includes("proficien") || normalized.includes("trained")) {
			return 1;
		}
		return undefined;
	}

	function dnd2024BeaconProficiencyContribution(proficiencyBonus, multiplier) {
		if (!Number.isFinite(proficiencyBonus) || !Number.isFinite(multiplier)) {
			return undefined;
		}
		return multiplier === 0.5
			? Math.floor(proficiencyBonus / 2)
			: proficiencyBonus * multiplier;
	}

	function dnd2024BeaconRollBonusTargetText(record) {
		return `${dnd2024BeaconFlattenText(beaconProperty(record, "bonusCategory"))}, ${dnd2024BeaconFlattenText(beaconProperty(record, "bonusName"))}`
			.trim()
			.toLowerCase();
	}

	function dnd2024BeaconRollBonusCouldAffect(record, targetType, targetName, abilityName) {
		const targetText = dnd2024BeaconRollBonusTargetText(record);
		if (!targetText.replace(/[\s,]/g, "")) {
			// An unclassified Roll Bonus is not safe to dismiss from a local total.
			return true;
		}
		if (targetText.includes("all roll") || targetText.includes("all check")) {
			return true;
		}
		if (targetType === "skill") {
			const skill = String(targetName || "").trim().toLowerCase();
			const ability = String(abilityName || "").trim().toLowerCase();
			return (skill && targetText.includes(skill))
				|| targetText.includes("ability check")
				|| targetText.includes("skill check")
				|| targetText.includes("skills")
				|| (ability && targetText.includes(`${ability} check`));
		}
		if (targetType === "save") {
			const ability = String(abilityName || targetName || "").trim().toLowerCase();
			return targetText.includes("saving throw")
				|| (ability && (targetText.includes(`${ability} save`) || targetText.includes(`${ability} saving`)));
		}
		if (targetType === "initiative") {
			return targetText.includes("initiative")
				|| targetText.includes("ability check")
				|| targetText.includes("dexterity check");
		}
		return true;
	}

	function dnd2024BeaconHasRelevantRollBonus(characterId, targetType, targetName, abilityName) {
		const adapter = getDnd2024BeaconAdapter(characterId);
		if (!adapter) {
			return false;
		}
		const canonicalRecords = dnd2024BeaconCanonicalRecords(characterId);
		const records = getBeaconAuthoritativeTypedRecords(characterId, "current", adapter.collections.rollBonuses);
		for (const record of records) {
			if (!dnd2024BeaconRollBonusCouldAffect(record, targetType, targetName, abilityName)) {
				continue;
			}
			const detailsText = dnd2024BeaconFlattenText(beaconProperty(record, "bonusDetails")).toLowerCase();
			// Advantage and disadvantage records affect dice selection, not the numeric
			// compatibility totals projected by ScriptCards.
			if (detailsText.includes("keep highest") || detailsText.includes("keep lowest")) {
				continue;
			}
			// Unknown activation is deliberately conservative and preserves the SDK fallback.
			if (dnd2024BeaconRecordActivationState(record, canonicalRecords, adapter) !== false) {
				return true;
			}
		}
		return false;
	}

	function dnd2024BeaconSkillTotal(characterId, skillName) {
		const adapter = getDnd2024BeaconAdapter(characterId);
		if (!adapter) {
			return undefined;
		}
		const skillSelection = findDnd2024BeaconActiveTypedRecord(characterId, adapter.collections.skills, (candidate) =>
			normalizeBeaconLookupName(beaconProperty(candidate, "name")) === normalizeBeaconLookupName(skillName)
		);
		if (!skillSelection.resolved) {
			return undefined;
		}
		const skillRecord = skillSelection.record;
		const abilityName = skillRecord && beaconProperty(skillRecord, "ability")
			? String(beaconProperty(skillRecord, "ability"))
			: adapter.standardSkillAbilities[normalizeBeaconLookupName(skillName)];
		// Only a Roll Bonus that could affect this skill makes the local total unsafe.
		if (dnd2024BeaconHasRelevantRollBonus(characterId, "skill", skillName, abilityName)) {
			return undefined;
		}
		const abilityModifier = abilityName ? dnd2024BeaconAbilityModifier(characterId, abilityName) : undefined;
		const proficiencyBonus = dnd2024BeaconProficiencyBonus(characterId);
		if (abilityModifier === undefined || proficiencyBonus === undefined) {
			return undefined;
		}
		const proficiencySelection = findDnd2024BeaconActiveTypedRecord(characterId, adapter.collections.proficiencies, (candidate) =>
			normalizeBeaconLookupName(beaconProperty(candidate, adapter.fields.category)) === normalizeBeaconLookupName(adapter.proficiencyCategories.skill)
			&& normalizeBeaconLookupName(beaconProperty(candidate, adapter.fields.proficiency)) === normalizeBeaconLookupName(skillName)
		);
		if (!proficiencySelection.resolved) {
			return undefined;
		}
		const proficiencyRecord = proficiencySelection.record;
		const multiplier = proficiencyRecord
			? dnd2024BeaconProficiencyMultiplier(beaconProperty(proficiencyRecord, adapter.fields.proficiencyLevel))
			: 0;
		const contribution = dnd2024BeaconProficiencyContribution(proficiencyBonus, multiplier);
		return contribution === undefined ? undefined : abilityModifier + contribution;
	}


	function dnd2024BeaconFlattenText(value) {
		if (Array.isArray(value)) {
			return value.map((entry) => dnd2024BeaconFlattenText(entry)).filter(Boolean).join(", ");
		}
		if (value && typeof value === "object") {
			return Object.values(value).map((entry) => dnd2024BeaconFlattenText(entry)).filter(Boolean).join(", ");
		}
		if (value === undefined || value === null) {
			return "";
		}
		if (typeof value === "string") {
			const trimmed = value.trim();
			if ((trimmed.startsWith("[") && trimmed.endsWith("]"))
				|| (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
				try {
					return dnd2024BeaconFlattenText(JSON.parse(trimmed));
				} catch (error) {
					// Ordinary text may legitimately begin and end with brackets.
				}
			}
			return trimmed;
		}
		return String(value);
	}

	function dnd2024BeaconValueIsTrue(value) {
		return parseBeaconBooleanValue(value).value === true;
	}

	function dnd2024BeaconValueIsFalse(value) {
		return parseBeaconBooleanValue(value).value === false;
	}

	function dnd2024BeaconCanonicalRecords(characterId) {
		const adapter = getDnd2024BeaconAdapter(characterId);
		if (!adapter) {
			return undefined;
		}
		const index = getBeaconStructuredIndex(characterId);
		const storeRoot = getBeaconStructuredRoot(index, "current", adapter.rootNames.store);
		if (!storeRoot.found) {
			return undefined;
		}
		const records = readBeaconSubfields(storeRoot.value, adapter.storePaths.integrants);
		return records && typeof records === "object" && !Array.isArray(records) ? records : undefined;
	}

	function dnd2024BeaconRecordActivationState(record, canonicalRecords, adapter) {
		if (!record || typeof record !== "object" || !adapter) {
			return undefined;
		}

		let current = record;
		let requiresEquip = false;
		let itemRecord;
		let chainComplete = false;
		const visitedParentIds = new Set();

		for (let depth = 0; depth < 64; depth++) {
			if (beaconRecordEnabledState(current) === false) {
				return false;
			}

			const type = normalizeBeaconLookupName(beaconProperty(current, adapter.fields.type));
			if (type === "condition" || type === "effect") {
				const active = beaconProperty(current, "_active");
				if (dnd2024BeaconValueIsFalse(active)) {
					return false;
				}
				if (!dnd2024BeaconValueIsTrue(active)) {
					return undefined;
				}
			}
			if (type === "attunement") {
				const attuned = beaconProperty(current, "_attuned");
				if (dnd2024BeaconValueIsFalse(attuned)) {
					return false;
				}
				if (!dnd2024BeaconValueIsTrue(attuned)) {
					return undefined;
				}
			}
			if (type === "item") {
				itemRecord = current;
			}

			const requireEquip = beaconProperty(current, "requireEquip");
			if (requireEquip !== undefined && requireEquip !== null && String(requireEquip).trim() !== "") {
				if (dnd2024BeaconValueIsTrue(requireEquip)) {
					requiresEquip = true;
				} else if (!dnd2024BeaconValueIsFalse(requireEquip)) {
					return undefined;
				}
			}

			const parentIdValue = beaconProperty(current, adapter.fields.parentID);
			const parentId = parentIdValue === undefined || parentIdValue === null
				? ""
				: String(parentIdValue).trim();
			if (!parentId) {
				chainComplete = true;
				break;
			}
			if (!canonicalRecords || visitedParentIds.has(parentId)) {
				return undefined;
			}
			visitedParentIds.add(parentId);
			const parent = canonicalRecords[parentId];
			if (!parent || typeof parent !== "object") {
				return undefined;
			}
			current = parent;
		}
		if (!chainComplete) {
			return undefined;
		}

		if (requiresEquip) {
			if (!itemRecord) {
				return undefined;
			}
			const equipped = beaconProperty(beaconProperty(itemRecord, "equipData"), "equipped");
			if (dnd2024BeaconValueIsFalse(equipped)) {
				return false;
			}
			if (!dnd2024BeaconValueIsTrue(equipped)) {
				return undefined;
			}
		}

		return true;
	}

	function dnd2024BeaconActiveRecords(characterId, records) {
		const adapter = getDnd2024BeaconAdapter(characterId);
		if (!adapter || !Array.isArray(records)) {
			return undefined;
		}
		const canonicalRecords = dnd2024BeaconCanonicalRecords(characterId);
		const active = [];
		for (const record of records) {
			const state = dnd2024BeaconRecordActivationState(record, canonicalRecords, adapter);
			if (state === undefined) {
				return undefined;
			}
			if (state) {
				active.push(record);
			}
		}
		return active;
	}

	function findDnd2024BeaconActiveTypedRecord(characterId, collectionName, predicate, operation = "current") {
		const candidates = getBeaconAuthoritativeTypedRecords(characterId, operation, collectionName)
			.filter((record) => !predicate || predicate(record));
		const active = dnd2024BeaconActiveRecords(characterId, candidates);
		return active === undefined || active.length > 1
			? { resolved: false, record: undefined }
			: { resolved: true, record: active[0] };
	}

	function dnd2024BeaconClassProjection(characterId) {
		const adapter = getDnd2024BeaconAdapter(characterId);
		const canonicalRecords = dnd2024BeaconCanonicalRecords(characterId);
		if (!adapter || !canonicalRecords) {
			return undefined;
		}

		const classEntries = getBeaconAuthoritativeTypedEntries(characterId, "current", adapter.collections.classes);
		const activeClassRecords = dnd2024BeaconActiveRecords(characterId, classEntries.map((entry) => entry.record));
		if (!activeClassRecords) {
			return undefined;
		}
		const activeClassSet = new Set(activeClassRecords);
		const classByIdentity = new Map();
		for (const entry of classEntries) {
			if (!activeClassSet.has(entry.record)) {
				continue;
			}
			const name = dnd2024BeaconFlattenText(beaconProperty(entry.record, adapter.fields.name));
			const identities = [...new Set([
				...beaconEntryRawIdentities(entry),
				name,
				normalizeBeaconLookupName(name)
			])];
			if (!name || !identities.length) {
				return undefined;
			}
			const classInfo = { name, identities, record: entry.record };
			for (const identity of identities) {
				const existing = classByIdentity.get(identity);
				if (existing && existing.record !== entry.record) {
					return undefined;
				}
				classByIdentity.set(identity, classInfo);
			}
		}

		const levelEntries = getBeaconAuthoritativeTypedEntries(characterId, "current", adapter.collections.classLevels)
			.filter((entry) => {
				const classId = beaconProperty(entry.record, adapter.fields.classID);
				return classId !== undefined && classId !== null && String(classId).trim() !== "";
			});
		const activeLevelRecords = dnd2024BeaconActiveRecords(characterId, levelEntries.map((entry) => entry.record));
		if (!activeLevelRecords) {
			return undefined;
		}
		const activeLevelSet = new Set(activeLevelRecords);
		const activeLevelEntries = levelEntries.filter((entry) => activeLevelSet.has(entry.record));
		const groupsByClassId = new Map();
		for (const entry of activeLevelEntries) {
			const classId = String(beaconProperty(entry.record, adapter.fields.classID)).trim();
			const classInfo = classByIdentity.get(classId) || classByIdentity.get(normalizeBeaconLookupName(classId));
			const contribution = Number(beaconProperty(entry.record, adapter.fields.totalLevel));
			if (!classInfo || !Number.isFinite(contribution) || contribution <= 0) {
				return undefined;
			}
			if (!groupsByClassId.has(classId)) {
				groupsByClassId.set(classId, {
					classId,
					classInfo,
					level: 0,
					levelEntries: [],
					subclassName: "",
					subclassResolved: true
				});
			}
			const group = groupsByClassId.get(classId);
			group.level += contribution;
			group.levelEntries.push(entry);
		}
		const groups = [...groupsByClassId.values()];
		if (!groups.length) {
			return undefined;
		}

		const subclassRecords = getBeaconAuthoritativeTypedRecords(characterId, "current", adapter.collections.subclasses);
		const activeSubclassRecords = dnd2024BeaconActiveRecords(characterId, subclassRecords);
		if (!activeSubclassRecords) {
			return undefined;
		}
		for (const group of groups) {
			const classIdentities = new Set([group.classId, ...group.classInfo.identities]);
			const matchingSubclasses = activeSubclassRecords.filter((record) => {
				const parentId = beaconProperty(record, adapter.fields.parentID);
				return parentId !== undefined && parentId !== null && classIdentities.has(String(parentId).trim());
			});
			if (matchingSubclasses.length > 1) {
				group.subclassResolved = false;
			} else if (matchingSubclasses.length === 1) {
				group.subclassName = dnd2024BeaconFlattenText(beaconProperty(matchingSubclasses[0], adapter.fields.name));
				if (!group.subclassName) {
					group.subclassResolved = false;
				}
			}
		}

		groups.sort((left, right) => left.classInfo.name.localeCompare(right.classInfo.name));
		let primary;
		if (groups.length === 1) {
			primary = groups[0];
		} else {
			const hitPointRecords = dnd2024BeaconActiveRecords(
				characterId,
				getBeaconAuthoritativeTypedRecords(characterId, "current", adapter.collections.hitPoints)
			);
			const hitDiceRecords = dnd2024BeaconActiveRecords(
				characterId,
				getBeaconAuthoritativeTypedRecords(characterId, "current", adapter.collections.hitDices)
			);
			if (hitPointRecords && hitDiceRecords) {
				const fullFirstLevelGroups = groups.filter((group) => group.levelEntries.some((entry) => {
					if (Number(beaconProperty(entry.record, adapter.fields.level)) !== 1) {
						return false;
					}
					const levelKeys = beaconEntryRawIdentities(entry);
					const levelHitPoints = hitPointRecords.filter((record) => {
						const parentId = beaconProperty(record, adapter.fields.parentID);
						return parentId !== undefined && parentId !== null
							&& levelKeys.has(String(parentId).trim())
							&& !dnd2024BeaconValueIsTrue(beaconProperty(record, adapter.fields.isTemp));
					});
					const levelHitDice = hitDiceRecords.filter((record) => {
						const parentId = beaconProperty(record, adapter.fields.parentID);
						return parentId !== undefined && parentId !== null && levelKeys.has(String(parentId).trim());
					});
					return levelHitPoints.some((hitPointRecord) => {
						const hitPointValue = beaconNumericPrimitive(hitPointRecord, adapter.valuePaths.formulaFlatValue);
						return Number.isFinite(hitPointValue) && levelHitDice.some((hitDiceRecord) => {
							const dieSize = Number(beaconProperty(hitDiceRecord, "dieSize"));
							return Number.isFinite(dieSize) && dieSize > 0 && hitPointValue === dieSize;
						});
					});
				}));
				if (fullFirstLevelGroups.length === 1) {
					primary = fullFirstLevelGroups[0];
				}
			}
		}

		return {
			groups,
			primary,
			secondary: primary ? groups.filter((group) => group !== primary) : []
		};
	}

	function dnd2024BeaconHitDiceTotals(characterId) {
		const adapter = getDnd2024BeaconAdapter(characterId);
		if (!adapter) {
			return undefined;
		}
		const records = dnd2024BeaconActiveRecords(
			characterId,
			getBeaconAuthoritativeTypedRecords(characterId, "current", adapter.collections.hitDices)
		);
		if (!records || !records.length) {
			return undefined;
		}

		let maximum = 0;
		const dieSizes = new Set();
		for (const record of records) {
			const dieCount = Number(beaconProperty(record, "dieCount"));
			const dieSize = Number(beaconProperty(record, "dieSize"));
			if (!Number.isFinite(dieCount) || dieCount < 0 || !Number.isFinite(dieSize) || dieSize <= 0) {
				return undefined;
			}
			maximum += dieCount;
			dieSizes.add(dieSize);
		}

		let used = 0;
		const usedData = readDnd2024BeaconStoreValue(characterId, adapter.storePaths.usedHitDiceData);
		if (usedData !== undefined) {
			const parsedUsedData = parseBeaconStructuredValue(usedData) || usedData;
			if (!parsedUsedData || typeof parsedUsedData !== "object" || Array.isArray(parsedUsedData)) {
				return undefined;
			}
			for (const entry of Object.values(parsedUsedData)) {
				const usedHitDice = Number(beaconProperty(entry, "usedHitDice"));
				if (!Number.isFinite(usedHitDice) || usedHitDice < 0) {
					return undefined;
				}
				used += usedHitDice;
			}
		}

		return {
			current: Math.max(0, maximum - used),
			maximum,
			dieSizes
		};
	}

	function dnd2024BeaconAggregateProficiencyFlag(characterId, category) {
		const adapter = getDnd2024BeaconAdapter(characterId);
		if (!adapter) {
			return undefined;
		}
		const candidates = getBeaconAuthoritativeTypedRecords(characterId, "current", adapter.collections.proficiencies)
			.filter((record) => normalizeBeaconLookupName(beaconProperty(record, adapter.fields.category)) === normalizeBeaconLookupName(category));
		const records = dnd2024BeaconActiveRecords(characterId, candidates);
		if (!records) {
			return undefined;
		}
		for (const record of records) {
			const multiplier = dnd2024BeaconProficiencyMultiplier(beaconProperty(record, adapter.fields.proficiencyLevel));
			if (multiplier === undefined) {
				return undefined;
			}
			if (multiplier > 0) {
				return 1;
			}
		}
		return 0;
	}

	function dnd2024BeaconReactionFlag(characterId) {
		const adapter = getDnd2024BeaconAdapter(characterId);
		if (!adapter) {
			return undefined;
		}
		const candidates = [
			...getBeaconAuthoritativeTypedRecords(characterId, "current", adapter.collections.actions),
			...getBeaconAuthoritativeTypedRecords(characterId, "current", adapter.collections.attacks)
		].filter((record) => normalizeBeaconLookupName(beaconProperty(record, adapter.fields.actionType))
			=== normalizeBeaconLookupName(adapter.actionTypes.reaction));
		const records = dnd2024BeaconActiveRecords(characterId, candidates);
		return records === undefined ? undefined : (records.length ? 1 : 0);
	}

	function dnd2024BeaconFormattedLanguages(characterId) {
		const adapter = getDnd2024BeaconAdapter(characterId);
		if (!adapter) {
			return undefined;
		}
		const records = dnd2024BeaconActiveRecords(
			characterId,
			getBeaconAuthoritativeTypedRecords(characterId, "current", adapter.collections.languages)
		);
		if (!records) {
			return undefined;
		}
		const names = records.map((record) => dnd2024BeaconFlattenText(beaconProperty(record, adapter.fields.name)));
		if (names.some((name) => !name)) {
			return undefined;
		}
		return [...new Set(names)].sort((left, right) => left.localeCompare(right)).join(", ");
	}

	function dnd2024BeaconFormattedSenses(characterId) {
		const adapter = getDnd2024BeaconAdapter(characterId);
		if (!adapter) {
			return undefined;
		}
		const records = dnd2024BeaconActiveRecords(
			characterId,
			getBeaconAuthoritativeTypedRecords(characterId, "current", adapter.collections.senses)
		);
		if (!records) {
			return undefined;
		}
		const formatted = [];
		for (const record of records) {
			const rawName = dnd2024BeaconFlattenText(beaconProperty(record, adapter.fields.name));
			if (!rawName) {
				return undefined;
			}
			const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);
			const ignoreValue = parseBeaconBooleanValue(beaconProperty(record, "ignoreValue"));
			if (!ignoreValue.success) {
				return undefined;
			}
			if (ignoreValue.value) {
				formatted.push(name);
				continue;
			}
			const value = beaconNumericPrimitive(record, adapter.valuePaths.formulaFlatValue);
			if (!Number.isFinite(value)) {
				return undefined;
			}
			formatted.push(`${name} ${value} ft.`);
		}
		return [...new Set(formatted)].sort((left, right) => left.localeCompare(right)).join(", ");
	}

	function dnd2024BeaconFormattedDefense(characterId, lookupName) {
		const adapter = getDnd2024BeaconAdapter(characterId);
		if (!adapter) {
			return undefined;
		}
		const records = dnd2024BeaconActiveRecords(
			characterId,
			getBeaconAuthoritativeTypedRecords(characterId, "current", adapter.collections.defenses)
		);
		if (!records) {
			return undefined;
		}
		const normalizedLookup = normalizeBeaconLookupName(lookupName);
		const values = [];
		for (const record of records) {
			const defense = normalizeBeaconLookupName(beaconProperty(record, "defense"));
			if (!["vulnerability", "resistance", "immunity"].includes(defense)) {
				return undefined;
			}
			const damage = dnd2024BeaconFlattenText(beaconProperty(record, "damage"));
			const condition = dnd2024BeaconFlattenText(beaconProperty(record, "condition"));
			let selected = "";
			if (normalizedLookup === "npcvulnerabilities" && defense === "vulnerability") {
				selected = damage;
			} else if (normalizedLookup === "npcresistances" && defense === "resistance") {
				selected = damage;
			} else if (normalizedLookup === "npcimmunities" && defense === "immunity" && damage) {
				selected = damage;
			} else if (normalizedLookup === "npcconditionimmunities" && defense === "immunity" && condition) {
				selected = condition;
			}
			if ((normalizedLookup === "npcvulnerabilities" && defense === "vulnerability" && !damage)
				|| (normalizedLookup === "npcresistances" && defense === "resistance" && !damage)
				|| (normalizedLookup === "npcimmunities" && defense === "immunity" && !damage && !condition)) {
				return undefined;
			}
			if (selected) {
				values.push(selected);
			}
		}
		return [...new Set(values)].sort((left, right) => left.localeCompare(right)).join(", ");
	}

	function dnd2024BeaconSpellcastingAbility(characterId) {
		const adapter = getDnd2024BeaconAdapter(characterId);
		if (!adapter) {
			return undefined;
		}
		const spellcastings = dnd2024BeaconActiveRecords(
			characterId,
			getBeaconAuthoritativeTypedRecords(characterId, "current", adapter.collections.spellcastings)
		);
		if (!spellcastings || !spellcastings.length) {
			return undefined;
		}
		const abilities = new Set();
		for (const record of spellcastings) {
			const rawAbility = beaconFirstPrimitive(record, [["ability"], ["spellcastingAbility"]]);
			const normalizedAbility = normalizeBeaconLookupName(rawAbility);
			const abilityName = adapter.abilityNames[normalizedAbility];
			if (!abilityName) {
				return undefined;
			}
			abilities.add(abilityName);
		}
		return abilities.size === 1 ? [...abilities][0] : undefined;
	}

	function dnd2024BeaconSpellHeaderBonuses(characterId) {
		const adapter = getDnd2024BeaconAdapter(characterId);
		const canonicalRecords = dnd2024BeaconCanonicalRecords(characterId);
		if (!adapter || !canonicalRecords) {
			return undefined;
		}

		let attack = 0;
		let save = 0;
		const rollBonuses = getBeaconAuthoritativeTypedRecords(characterId, "current", adapter.collections.rollBonuses);
		for (const record of rollBonuses) {
			const categoryText = dnd2024BeaconFlattenText(beaconProperty(record, "bonusCategory")).toLowerCase();
			const nameText = dnd2024BeaconFlattenText(beaconProperty(record, "bonusName")).toLowerCase();
			const detailsText = dnd2024BeaconFlattenText(beaconProperty(record, "bonusDetails")).toLowerCase();
			const targetText = `${categoryText}, ${nameText}`;
			const targetsAttack = targetText.includes("spell attack") || targetText.includes("spellcasting");
			const targetsSave = targetText.includes("spell save") || targetText.includes("spellcasting");
			if (!targetsAttack && !targetsSave) {
				continue;
			}

			const activation = dnd2024BeaconRecordActivationState(record, canonicalRecords, adapter);
			if (activation === false) {
				continue;
			}
			if (activation === undefined) {
				return undefined;
			}

			if (detailsText.includes("keep highest") || detailsText.includes("keep lowest")) {
				continue;
			}

			const rawBonusValue = beaconProperty(record, "bonusValue");
			const bonusValue = rawBonusValue === undefined || rawBonusValue === null
				|| (typeof rawBonusValue === "string" && rawBonusValue.trim() === "")
				? undefined
				: Number(rawBonusValue);
			if (detailsText !== "modifier" || !Number.isFinite(bonusValue)
				|| !dnd2024BeaconValueIsFalse(beaconProperty(record, "totalRoll"))) {
				// An unsupported spell-targeted bonus calculation makes the local total unsafe.
				// Defer to the native SDK result.
				return undefined;
			}
			if (targetsAttack) {
				attack += bonusValue;
			}
			if (targetsSave) {
				save += bonusValue;
			}
		}
		return { attack, save };
	}

	function dnd2024BeaconSpellHeader(characterId) {
		const abilityName = dnd2024BeaconSpellcastingAbility(characterId);
		const abilityModifier = abilityName ? dnd2024BeaconAbilityModifier(characterId, abilityName) : undefined;
		const proficiencyBonus = dnd2024BeaconProficiencyBonus(characterId);
		const bonuses = dnd2024BeaconSpellHeaderBonuses(characterId);
		if (abilityModifier === undefined || proficiencyBonus === undefined || !bonuses) {
			return undefined;
		}
		return {
			attack: abilityModifier + proficiencyBonus + bonuses.attack,
			save: 8 + abilityModifier + proficiencyBonus + bonuses.save
		};
	}

	function dnd2024BeaconSpellSlotLevelNumber(value, adapter) {
		const numeric = Number(value);
		if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 9) {
			return numeric;
		}
		const normalized = normalizeBeaconLookupName(value);
		for (const [level, ordinal] of Object.entries(adapter.spellSlotOrdinals)) {
			if (normalizeBeaconLookupName(ordinal) === normalized) {
				return Number(level);
			}
		}
		return undefined;
	}

	function dnd2024BeaconNormalSpellSlotTotal(characterId, requestedLevel) {
		const adapter = getDnd2024BeaconAdapter(characterId);
		const canonicalRecords = dnd2024BeaconCanonicalRecords(characterId);
		if (!adapter || !canonicalRecords || !Number.isInteger(requestedLevel)
			|| requestedLevel < 1 || requestedLevel > 9) {
			return undefined;
		}

		const candidates = getBeaconAuthoritativeTypedRecords(characterId, "current", adapter.collections.spellSlots)
			.filter((record) => {
				const slotType = normalizeBeaconLookupName(beaconProperty(record, adapter.fields.slotType));
				return !slotType.includes("pact")
					&& dnd2024BeaconSpellSlotLevelNumber(
						beaconProperty(record, adapter.fields.spellLevel),
						adapter
					) === requestedLevel;
			});
		const matchingRecords = dnd2024BeaconActiveRecords(characterId, candidates);
		if (!matchingRecords) {
			return undefined;
		}

		// No active non-Pact entitlement record means that this normal slot level has
		// zero capacity. Pact capacity is intentionally not projected through lvlN_slots_total.
		if (!matchingRecords.length) {
			return 0;
		}

		let baseValue;
		let modifyValue = 0;
		let minimumValue;
		let simpleValue;
		let hasCalculatedRecord = false;

		for (const record of matchingRecords) {
			const rawValue = beaconFirstPrimitive(record, adapter.valuePaths.formulaFlatValue);
			if (rawValue === undefined || rawValue === null
				|| (typeof rawValue === "string" && rawValue.trim() === "")) {
				return undefined;
			}
			const value = Number(rawValue);
			if (!Number.isFinite(value)) {
				return undefined;
			}

			const calculation = normalizeBeaconLookupName(beaconProperty(record, "calculation"));
			if (calculation === "setbase") {
				hasCalculatedRecord = true;
				// Conflicting live Set Base values are ambiguous. Defer to the native result.
				if (baseValue !== undefined && baseValue !== value) {
					return undefined;
				}
				baseValue = value;
				continue;
			}

			if (calculation === "modify") {
				hasCalculatedRecord = true;
				modifyValue += value;
				continue;
			}

			if (calculation === "minimum") {
				hasCalculatedRecord = true;
				minimumValue = minimumValue === undefined ? value : Math.max(minimumValue, value);
				continue;
			}

			// One simple finite Spell Slot record may define the capacity. Mixing a simple
			// value with formula records is ambiguous and requires the native alias.
			if (!calculation && simpleValue === undefined) {
				simpleValue = value;
				continue;
			}

			return undefined;
		}

		if (simpleValue !== undefined) {
			if (hasCalculatedRecord || matchingRecords.length !== 1) {
				return undefined;
			}
			return Math.max(0, simpleValue);
		}

		let total = (baseValue === undefined ? 0 : baseValue) + modifyValue;
		if (minimumValue !== undefined) {
			total = Math.max(total, minimumValue);
		}
		return Math.max(0, total);
	}

	function resolveDnd2024BeaconComputedAlias(characterId, lookupName, operation) {
		const adapter = getDnd2024BeaconAdapter(characterId);
		if (!adapter) {
			return { handled: false };
		}
		const normalized = normalizeBeaconLookupName(lookupName);

		if ((operation === "max" && normalized === "hp")
			|| (operation === "current" && normalized === "hpmax")) {
			const value = beaconSingleNumericRecordValue(
				characterId,
				adapter.collections.hitPoints,
				(record) => normalizeBeaconLookupName(beaconProperty(record, adapter.fields.isTemp)) !== "true",
				adapter.valuePaths.formulaFlatValue
			);
			return value === undefined ? { handled: false } : { handled: true, found: true, value: String(value), source: "dnd2024-local-hp-max" };
		}
		if ((operation === "max" && normalized === "hitdice")
			|| (operation === "current" && normalized === "hitdicemax")) {
			const totals = dnd2024BeaconHitDiceTotals(characterId);
			return totals === undefined
				? { handled: false }
				: { handled: true, found: true, value: String(totals.maximum), source: "dnd2024-local-hit-dice-max" };
		}
		if (operation !== "current") {
			return { handled: false };
		}

		if (normalized === "level") {
			const value = dnd2024BeaconClassLevelTotal(characterId);
			return value === undefined ? { handled: false } : { handled: true, found: true, value: String(value), source: "dnd2024-local-level" };
		}

		if (["class", "baselevel", "classdisplay"].includes(normalized)
			|| /^multiclass[1-3](?:flag|lvl|subclass)?$/.test(normalized)) {
			const projection = dnd2024BeaconClassProjection(characterId);
			if (!projection) {
				return { handled: false };
			}
			if (normalized === "classdisplay") {
				const value = projection.groups.map((group) => `${group.classInfo.name} ${group.level}`).join(", ");
				return { handled: true, found: true, value, source: "dnd2024-local-class-display" };
			}
			if (!projection.primary) {
				return { handled: false };
			}
			if (normalized === "class") {
				return { handled: true, found: true, value: projection.primary.classInfo.name, source: "dnd2024-local-primary-class" };
			}
			if (normalized === "baselevel") {
				return { handled: true, found: true, value: String(projection.primary.level), source: "dnd2024-local-primary-class-level" };
			}
			const multiclassMatch = normalized.match(/^multiclass([1-3])(flag|lvl|subclass)?$/);
			if (multiclassMatch) {
				const secondary = projection.secondary[Number(multiclassMatch[1]) - 1];
				const field = multiclassMatch[2] || "name";
				if (field === "flag") {
					return { handled: true, found: true, value: secondary ? "1" : "0", source: "dnd2024-local-multiclass-flag" };
				}
				if (!secondary) {
					return { handled: true, found: true, value: "", source: "dnd2024-local-empty-multiclass-slot" };
				}
				if (field === "lvl") {
					return { handled: true, found: true, value: String(secondary.level), source: "dnd2024-local-multiclass-level" };
				}
				if (field === "subclass") {
					return secondary.subclassResolved
						? { handled: true, found: true, value: secondary.subclassName, source: "dnd2024-local-multiclass-subclass" }
						: { handled: false };
				}
				return { handled: true, found: true, value: secondary.classInfo.name, source: "dnd2024-local-multiclass-class" };
			}
		}

		if (normalized === "npcxp") {
			const customXp = readDnd2024BeaconStoreValue(characterId, adapter.storedAliases.npccustomxp);
			if (customXp !== undefined && customXp !== null && String(customXp).trim() !== "" && Number.isFinite(Number(customXp))) {
				return { handled: true, found: true, value: String(Number(customXp)), source: "dnd2024-local-npc-xp-override" };
			}
			const xp = dnd2024ChallengeXp(characterId, readDnd2024BeaconStoreValue(characterId, adapter.storedAliases.npcchallenge));
			return xp === undefined ? { handled: false } : { handled: true, found: true, value: String(xp), source: "dnd2024-local-npc-xp" };
		}

		if (normalized === "pb") {
			const value = dnd2024BeaconProficiencyBonus(characterId);
			return value === undefined ? { handled: false } : { handled: true, found: true, value: String(value), source: "dnd2024-local-pb" };
		}

		if (["spellattackbonus", "spellsavedc"].includes(normalized)) {
			const header = dnd2024BeaconSpellHeader(characterId);
			if (!header) {
				return { handled: false };
			}
			const value = normalized === "spellattackbonus" ? header.attack : header.save;
			return { handled: true, found: true, value: String(value), source: "dnd2024-local-spell-header" };
		}

		if (["spellattackmod", "spelldcmod"].includes(normalized)) {
			const abilityName = dnd2024BeaconSpellcastingAbility(characterId);
			const abilityModifier = abilityName
				? dnd2024BeaconAbilityModifier(characterId, abilityName)
				: undefined;
			return abilityModifier === undefined
				? { handled: false }
				: { handled: true, found: true, value: String(abilityModifier), source: "dnd2024-local-spellcasting-modifier" };
		}

		if (normalized === "spellcastingability") {
			const abilityName = dnd2024BeaconSpellcastingAbility(characterId);
			const abilityModifier = abilityName
				? dnd2024BeaconAbilityModifier(characterId, abilityName)
				: undefined;
			return abilityModifier === undefined
				? { handled: false }
				: { handled: true, found: true, value: `${abilityModifier}+`, source: "dnd2024-local-spellcasting-ability" };
		}

		if (normalized === "hitdice") {
			const totals = dnd2024BeaconHitDiceTotals(characterId);
			return totals === undefined
				? { handled: false }
				: { handled: true, found: true, value: String(totals.current), source: "dnd2024-local-hit-dice-current" };
		}

		if (["hitdietype", "hitdiefinal"].includes(normalized)) {
			const totals = dnd2024BeaconHitDiceTotals(characterId);
			return totals && totals.dieSizes.size > 1
				? { handled: true, found: false, value: undefined, source: "dnd2024-local-mixed-hit-dice-unsupported" }
				: { handled: false };
		}

		if ([
			"classresource", "classresourcemax", "classresourcename",
			"otherresource", "otherresourcemax", "otherresourcename",
			"defaultcriticalrange"
		].includes(normalized)) {
			return { handled: true, found: false, value: undefined, source: "dnd2024-local-unsupported-compatibility-alias" };
		}

		const spellSlotTotalMatch = normalized.match(/^lvl([1-9])slotstotal$/);
		if (spellSlotTotalMatch) {
			const value = dnd2024BeaconNormalSpellSlotTotal(characterId, Number(spellSlotTotalMatch[1]));
			return value === undefined
				? { handled: false }
				: { handled: true, found: true, value: String(value), source: "dnd2024-local-normal-spell-slot-total" };
		}

		if (["speed", "npcspeed"].includes(normalized)) {
			const value = beaconSingleNumericRecordValue(
				characterId,
				adapter.collections.speeds,
				(record) => normalizeBeaconLookupName(beaconProperty(record, adapter.fields.speed)) === normalizeBeaconLookupName(adapter.movementModes.walking),
				adapter.valuePaths.formulaFlatValue
			);
			return value === undefined ? { handled: false } : { handled: true, found: true, value: String(value), source: "dnd2024-local-speed" };
		}

		if (["ac", "npcac"].includes(normalized)) {
			const value = beaconSingleNumericRecordValue(
				characterId,
				adapter.collections.armorClasses,
				null,
				adapter.valuePaths.formulaFlatValue
			);
			return value === undefined ? { handled: false } : { handled: true, found: true, value: String(value), source: "dnd2024-local-ac" };
		}

		if (["npcvulnerabilities", "npcresistances", "npcimmunities", "npcconditionimmunities"].includes(normalized)) {
			const value = dnd2024BeaconFormattedDefense(characterId, normalized);
			return value === undefined
				? { handled: false }
				: { handled: true, found: true, value, source: "dnd2024-local-npc-defenses" };
		}

		if (normalized === "npcsavingflag") {
			const value = dnd2024BeaconAggregateProficiencyFlag(characterId, adapter.proficiencyCategories.savingThrow);
			return value === undefined
				? { handled: false }
				: { handled: true, found: true, value: String(value), source: "dnd2024-local-npc-saving-flag" };
		}

		if (normalized === "npcskillsflag") {
			const value = dnd2024BeaconAggregateProficiencyFlag(characterId, adapter.proficiencyCategories.skill);
			return value === undefined
				? { handled: false }
				: { handled: true, found: true, value: String(value), source: "dnd2024-local-npc-skills-flag" };
		}

		if (normalized === "npcreactionsflag") {
			const value = dnd2024BeaconReactionFlag(characterId);
			return value === undefined
				? { handled: false }
				: { handled: true, found: true, value: String(value), source: "dnd2024-local-npc-reactions-flag" };
		}

		if (normalized === "npcsenses") {
			const value = dnd2024BeaconFormattedSenses(characterId);
			return value === undefined
				? { handled: false }
				: { handled: true, found: true, value, source: "dnd2024-local-npc-senses" };
		}

		if (normalized === "npclanguages") {
			const value = dnd2024BeaconFormattedLanguages(characterId);
			return value === undefined
				? { handled: false }
				: { handled: true, found: true, value, source: "dnd2024-local-npc-languages" };
		}

		if (["initiativebonus", "initmod"].includes(normalized)) {
			if (dnd2024BeaconHasRelevantRollBonus(characterId, "initiative", "Initiative", "Dexterity")) {
				return { handled: false };
			}
			const value = dnd2024BeaconAbilityModifier(characterId, "Dexterity");
			return value === undefined ? { handled: false } : { handled: true, found: true, value: String(value), source: "dnd2024-local-initiative" };
		}

		if (normalized === "npcstealthbase") {
			const value = dnd2024BeaconSkillTotal(characterId, "Stealth");
			return value === undefined ? { handled: false } : { handled: true, found: true, value: String(value), source: "dnd2024-local-stealth" };
		}

		if (["passivewisdom", "passiveperceptionmod"].includes(normalized)) {
			const perception = dnd2024BeaconSkillTotal(characterId, "Perception");
			return perception === undefined ? { handled: false } : { handled: true, found: true, value: String(10 + perception), source: "dnd2024-local-passive-wisdom" };
		}


		for (const [skillKey, skillName] of Object.entries(adapter.skillNames)) {
			if ([`${skillKey}prof`, `${skillKey}type`].includes(normalized)) {
				const proficiencySelection = findDnd2024BeaconActiveTypedRecord(characterId, adapter.collections.proficiencies, (candidate) =>
					normalizeBeaconLookupName(beaconProperty(candidate, adapter.fields.category)) === normalizeBeaconLookupName(adapter.proficiencyCategories.skill)
					&& normalizeBeaconLookupName(beaconProperty(candidate, adapter.fields.proficiency)) === normalizeBeaconLookupName(skillName)
				);
				if (!proficiencySelection.resolved) {
					return { handled: false };
				}
				const level = proficiencySelection.record
					? beaconProperty(proficiencySelection.record, adapter.fields.proficiencyLevel)
					: undefined;
				const multiplier = proficiencySelection.record ? dnd2024BeaconProficiencyMultiplier(level) : 0;
				if (multiplier === undefined) {
					return { handled: false };
				}
				const value = normalized === `${skillKey}type`
					? String(multiplier)
					: (multiplier > 0 ? "1" : "0");
				return {
					handled: true,
					found: true,
					value,
					source: normalized === `${skillKey}type` ? "dnd2024-local-skill-type" : "dnd2024-local-skill-prof"
				};
			}
			if ([`${skillKey}bonus`, `${skillKey}flat`, `npc${skillKey}`, `npc${skillKey}base`].includes(normalized)) {
				const value = dnd2024BeaconSkillTotal(characterId, skillName);
				return value === undefined ? { handled: false } : { handled: true, found: true, value: String(value), source: "dnd2024-local-skill-total" };
			}
		}

		for (const abilityName of new Set(Object.values(adapter.abilityNames))) {
			const abilityKey = normalizeBeaconLookupName(abilityName);
			const abbreviation = abilityKey.slice(0, 3);
			if (normalized === `${abilityKey}saveprof`) {
				const proficiencySelection = findDnd2024BeaconActiveTypedRecord(characterId, adapter.collections.proficiencies, (candidate) =>
					normalizeBeaconLookupName(beaconProperty(candidate, adapter.fields.category)) === normalizeBeaconLookupName(adapter.proficiencyCategories.savingThrow)
					&& normalizeBeaconLookupName(beaconProperty(candidate, adapter.fields.proficiency)) === abilityKey
				);
				if (!proficiencySelection.resolved) {
					return { handled: false };
				}
				const level = proficiencySelection.record
					? beaconProperty(proficiencySelection.record, adapter.fields.proficiencyLevel)
					: undefined;
				return {
					handled: true,
					found: true,
					value: beaconProficiencyIsActive(level) ? "1" : "0",
					source: "dnd2024-local-save-prof"
				};
			}
			if ([`${abilityKey}savebonus`, `${abilityKey}savemod`, `npc${abbreviation}save`, `npc${abbreviation}savebase`].includes(normalized)) {
				if (dnd2024BeaconHasRelevantRollBonus(characterId, "save", abilityName, abilityName)) {
					return { handled: false };
				}
				const abilityModifier = dnd2024BeaconAbilityModifier(characterId, abilityName);
				const proficiencyBonus = dnd2024BeaconProficiencyBonus(characterId);
				if (abilityModifier === undefined || proficiencyBonus === undefined) {
					return { handled: false };
				}
				const proficiencySelection = findDnd2024BeaconActiveTypedRecord(characterId, adapter.collections.proficiencies, (candidate) =>
					normalizeBeaconLookupName(beaconProperty(candidate, adapter.fields.category)) === normalizeBeaconLookupName(adapter.proficiencyCategories.savingThrow)
					&& normalizeBeaconLookupName(beaconProperty(candidate, adapter.fields.proficiency)) === abilityKey
				);
				if (!proficiencySelection.resolved) {
					return { handled: false };
				}
				const proficiencyRecord = proficiencySelection.record;
				const multiplier = proficiencyRecord
					? dnd2024BeaconProficiencyMultiplier(beaconProperty(proficiencyRecord, adapter.fields.proficiencyLevel))
					: 0;
				const contribution = dnd2024BeaconProficiencyContribution(proficiencyBonus, multiplier);
				return contribution === undefined
					? { handled: false }
					: { handled: true, found: true, value: String(abilityModifier + contribution), source: "dnd2024-local-save-total" };
			}
		}

		return { handled: false };
	}

	function beaconTypedCollectionKnownMissing(characterId, lookupName, operation, subfields) {
		if (!Array.isArray(subfields) || subfields.length === 0) {
			return false;
		}
		let indexed = getBeaconTypedCollectionIndex(characterId, operation, false);
		const key = normalizeBeaconLookupName(lookupName);
		let entries = getBeaconPreferredTypedEntries(indexed, operation, key, false);
		if (!entries.length) {
			if (!indexed.index.fallbackBuilt[operation]) {
				indexed = getBeaconTypedCollectionIndex(characterId, operation, true);
			}
			entries = getBeaconPreferredTypedEntries(indexed, operation, key, true);
		}
		if (!entries.length) {
			return false;
		}
		const entry = selectBeaconCollectionEntry(entries, subfields[0]);
		if (!entry) {
			return true;
		}
		return subfields.length > 1 && beaconLookupIsUnresolved(readBeaconSubfields(entry.record, subfields.slice(1)));
	}

	async function writeDnd2024BeaconStructuredAlias(characterId, lookupName, settingValue, operation = "current") {
		const adapter = getDnd2024BeaconAdapter(characterId);
		if (!adapter || operation !== "current") {
			return { handled: false };
		}
		const normalizedLookupName = normalizeBeaconLookupName(lookupName);
		const aliasPath = adapter.structuredWriteAliases[normalizedLookupName];
		if (!aliasPath) {
			return { handled: false };
		}
		const result = await writeBeaconStructuredPath(
			characterId,
			`sheet->${aliasPath.join("->")}`,
			settingValue,
			operation
		);
		return {
			handled: true,
			...result,
			writeRoute: result.success
				? `D&D 2024 compatibility alias ${lookupName} -> sheet->${aliasPath.join("->")}`
				: result.writeRoute
		};
	}

	function resolveDnd2024BeaconStoredAlias(characterId, lookupName, operation, subfields) {
		const adapter = getDnd2024BeaconAdapter(characterId);
		if (!adapter || operation !== "current") {
			return { handled: false, found: false, value: undefined };
		}
		const normalizedLookupName = normalizeBeaconLookupName(lookupName);
		const aliasPath = adapter.storedAliases[normalizedLookupName];
		if (!aliasPath) {
			return { handled: false, found: false, value: undefined };
		}
		const index = getBeaconStructuredIndex(characterId);
		const storeRoot = getBeaconStructuredRoot(index, operation, adapter.rootNames.store);
		if (!storeRoot.found) {
			return { handled: false, found: false, value: undefined };
		}
		const value = readBeaconSubfields(storeRoot.value, aliasPath.concat(subfields || []));
		if (beaconLookupIsUnresolved(value)) {
			// Roll20 can omit the optional tempHP leaf entirely until the value has
			// been used. Treat the known hp_temp compatibility alias as an existing
			// blank value so reads stay local and a direct native write can initialize it.
			return normalizedLookupName === "hptemp" && (!subfields || subfields.length === 0)
				? { handled: true, found: true, value: "", source: "dnd2024-local-stored-empty" }
				: { handled: false, found: false, value: undefined };
		}
		return {
			handled: true,
			found: true,
			value: beaconPrimitive(value) ? String(value) : JSON.stringify(value),
			source: "dnd2024-local-stored"
		};
	}

	function resolveBeaconLocalCompatibilityLookup(character, lookupName, operation, subfields, debug) {
		const started = Date.now();
		addBeaconPerformanceStat("localCompatibilityRequests");
		const normalized = normalizeBeaconLookupName(lookupName);
		const localSubfields = Array.isArray(subfields) ? subfields : [];
		const dnd2024Adapter = getDnd2024BeaconAdapter(character.id);
		const dnd2024Sheet = !!dnd2024Adapter;
		if (dnd2024Sheet) {
			addBeaconPerformanceStat("dnd2024CompatibilityFastPathRequests");
		}
		let result = { handled: false, found: false, value: undefined };

		// Explicit nested Beacon paths are canonical structured lookups. Resolving
		// them locally avoids a redundant SDK request for the same Attribute root.
		if (localSubfields.length > 0) {
			const structured = resolveBeaconStructuredLookup(
				character.id,
				lookupName,
				operation,
				localSubfields,
				debug
			);
			if (structured.found) {
				result = { handled: true, found: true, value: structured.value, source: "beacon-local-structured" };
			} else if (structured.authoritativeMiss) {
				result = { handled: true, found: false, value: undefined, source: "beacon-local-structured-miss" };
			}
		}

		// A bare D&D typed-collection name is also a complete structured lookup.
		// Resolve it locally before getSheetItem() so requests such as classes,
		// subclasses, spells, and spellslots do not incur a failed native SDK call
		// before falling back to the already indexed canonical records.
		if (!result.handled && dnd2024Sheet && localSubfields.length === 0) {
			const isKnownTypedCollection = Object.values(dnd2024Adapter.collections)
				.some((collectionName) => normalizeBeaconLookupName(collectionName) === normalized);
			if (isKnownTypedCollection) {
				const structured = resolveBeaconStructuredLookup(
					character.id,
					lookupName,
					operation,
					[],
					debug
				);
				result = structured.found
					? { handled: true, found: true, value: structured.value, source: "dnd2024-local-typed-collection" }
					: { handled: true, found: false, value: undefined, source: "dnd2024-local-typed-collection-miss" };
				if (!structured.found) {
					addBeaconPerformanceStat("localTypedCollectionMisses");
				}
			}
		}

		if (!result.handled && operation === "current") {
			if (normalized === "charactername") {
				result = { handled: true, found: true, value: character.get("name") || "", source: "character-object" };
			} else if (dnd2024Sheet && normalized === "npcname") {
				result = { handled: true, found: true, value: character.get("name") || "", source: "dnd2024-character-object" };
			} else if (dnd2024Sheet && normalized === "npc") {
				const appStateAttribute = findObjs({ _type: "attribute", _characterid: character.id, name: dnd2024Adapter.rootNames.appState })[0];
				if (appStateAttribute) {
					const appState = String(appStateAttribute.get("current") || "").trim().toLowerCase();
					result = { handled: true, found: true, value: appState === "npc" ? "1" : "0", source: "dnd2024-appstate" };
				}
			} else if (dnd2024Sheet && normalized === "npcactype") {
				// D&D 2024 Beacon has no independent 2014 npc_actype field.
				result = { handled: true, found: true, value: "", source: "dnd2024-compatibility-empty" };
			}
		}

		if (!result.handled && localSubfields.length > 0
			&& beaconTypedCollectionKnownMissing(character.id, lookupName, operation, localSubfields)) {
			result = { handled: true, found: false, value: undefined, source: "beacon-local-typed-miss" };
			addBeaconPerformanceStat("localTypedCollectionMisses");
		}

		if (!result.handled && dnd2024Sheet) {
			result = resolveDnd2024BeaconStoredAlias(character.id, lookupName, operation, localSubfields);
		}

		if (!result.handled && dnd2024Sheet) {
			result = resolveDnd2024BeaconComputedAlias(character.id, lookupName, operation);
			if (result.handled) {
				addBeaconPerformanceStat("localComputedCompatibilityHits");
			}
		}

		if (!result.handled && dnd2024Sheet && operation === "current") {
			let abilityKey = normalized;
			let wantsModifier = false;
			if (abilityKey.endsWith("mod")) {
				abilityKey = abilityKey.slice(0, -3);
				wantsModifier = true;
			}
			const abilityName = dnd2024Adapter.abilityNames[abilityKey];
			if (abilityName) {
				const score = dnd2024BeaconAbilityScore(character.id, abilityName);
				if (score !== undefined && Number.isFinite(Number(score))) {
					const value = wantsModifier ? Math.floor((Number(score) - 10) / 2) : Number(score);
					result = { handled: true, found: true, value: String(value), source: wantsModifier ? "beacon-local-ability-mod" : "beacon-local-ability" };
				}
			}
		}

		if (!result.handled && dnd2024Sheet && operation === "current") {
			const saveFlagMatch = normalized.match(/^npc(str|dex|con|int|wis|cha)saveflag$/);
			if (saveFlagMatch) {
				const abilityName = dnd2024Adapter.abilityNames[saveFlagMatch[1]];
				const selection = findDnd2024BeaconActiveTypedRecord(character.id, dnd2024Adapter.collections.proficiencies, (candidate) =>
					normalizeBeaconLookupName(beaconProperty(candidate, dnd2024Adapter.fields.category)) === normalizeBeaconLookupName(dnd2024Adapter.proficiencyCategories.savingThrow)
					&& normalizeBeaconLookupName(beaconProperty(candidate, dnd2024Adapter.fields.proficiency)) === normalizeBeaconLookupName(abilityName)
				);
				if (selection.resolved) {
					const level = selection.record ? beaconProperty(selection.record, dnd2024Adapter.fields.proficiencyLevel) : undefined;
					result = { handled: true, found: true, value: beaconProficiencyIsActive(level) ? "1" : "0", source: "beacon-local-save-flag" };
				}
			}
		}

		if (!result.handled && dnd2024Sheet && operation === "current") {
			const skillFlagMatch = normalized.match(/^npc(.+)flag$/);
			if (skillFlagMatch && dnd2024Adapter.skillNames[skillFlagMatch[1]]) {
				const skillName = dnd2024Adapter.skillNames[skillFlagMatch[1]];
				const selection = findDnd2024BeaconActiveTypedRecord(character.id, dnd2024Adapter.collections.proficiencies, (candidate) =>
					normalizeBeaconLookupName(beaconProperty(candidate, dnd2024Adapter.fields.category)) === normalizeBeaconLookupName(dnd2024Adapter.proficiencyCategories.skill)
					&& normalizeBeaconLookupName(beaconProperty(candidate, dnd2024Adapter.fields.proficiency)) === normalizeBeaconLookupName(skillName)
				);
				if (selection.resolved) {
					const level = selection.record ? beaconProperty(selection.record, dnd2024Adapter.fields.proficiencyLevel) : undefined;
					result = { handled: true, found: true, value: beaconProficiencyIsActive(level) ? "1" : "0", source: "beacon-local-skill-flag" };
				}
			}
		}

		if (result.handled) {
			addBeaconPerformanceStat("localCompatibilityHits");
			addBeaconPerformanceStat("localCompatibilityBypassedSdk");
			if (dnd2024Sheet && (String(result.source || "").startsWith("dnd2024")
				|| String(result.source || "").startsWith("beacon-local"))) {
				addBeaconPerformanceStat("dnd2024CompatibilityFastPathHits");
			}
		} else {
			const missName = `${operation}:${String(lookupName)}${localSubfields.length ? `->${localSubfields.join("->")}` : ""}`;
			addBeaconPerformanceDetail("localCompatibilityMissDetails", missName, { requests: 1 });
		}
		addBeaconPerformanceStat("localCompatibilityMilliseconds", Date.now() - started);
		return result;
	}

	async function resolveBeaconReferenceValue(character, lookupName, operation, subfields, debug) {
		const localLookup = resolveBeaconLocalCompatibilityLookup(character, lookupName, operation, subfields, debug);
		if (localLookup.handled) {
			return {
				found: localLookup.found,
				value: localLookup.value,
				source: localLookup.source,
				authoritativeMiss: localLookup.found === false
			};
		}

		const nativeLookupName = normalizeBeaconLookupName(lookupName) === "sheet" ? "store" : lookupName;
		let nativeLookupError;
		let nativeLookupValue;
		try {
			nativeLookupValue = await readBeaconSheetItem(character.id, nativeLookupName, operation);
		} catch (error) {
			nativeLookupError = error;
			nativeLookupValue = undefined;
		}

		const nativeLookupUnresolved = beaconLookupIsUnresolved(nativeLookupValue);
		let nativeResolvedValue = nativeLookupValue;
		let nativeSubfieldUnresolved = false;
		if (!nativeLookupUnresolved && subfields && subfields.length) {
			nativeResolvedValue = readBeaconSubfields(nativeLookupValue, subfields);
			nativeSubfieldUnresolved = beaconLookupIsUnresolved(nativeResolvedValue);
		}

		if (nativeLookupUnresolved || nativeSubfieldUnresolved || beaconLookupMayMaskCollection(nativeLookupValue)) {
			const structuredLookup = resolveBeaconStructuredLookup(
				character.id,
				lookupName,
				operation,
				subfields || [],
				debug
			);
			if (structuredLookup.found) {
				return { found: true, value: structuredLookup.value, source: "beacon-structured" };
			}
		}

		if (!nativeLookupUnresolved && !nativeSubfieldUnresolved) {
			return { found: true, value: nativeResolvedValue, source: "beacon-native" };
		}
		if (debug && nativeLookupError) {
			log(`ScriptCards Beacon lookup: native lookup for ${lookupName} failed and no structured value was found: ${nativeLookupError.message}`);
		}
		return { found: false, value: undefined, source: "beacon-unresolved" };
	}

	function formatBeaconRecord(record, operation) {
		if (beaconPrimitive(record)) {
			return record == null ? "" : String(record);
		}
		if (Array.isArray(record)) {
			return record.map((item) => formatBeaconRecord(item, operation)).filter((item) => item !== "").join(", ");
		}

		const label = beaconRecordIdentity(record);
		const valuePaths = operation === "max"
			? [["max"], ["maximum"], ["maxValue"]]
			: [["flatValue"], ["valueFormula", "flatValue"], ["formula", "flatValue"], ["displayValue"], ["display"], ["text"], ["current"], ["value"], ["calculatedValue"], ["computedValue"], ["amount"], ["quantity"]];
		const value = beaconFirstPrimitive(record, valuePaths);
		const unit = beaconFirstPrimitive(record, [["unit"], ["units"], ["suffix"], ["displayUnit"], ["valueUnit"]]);

		if (label) {
			return value !== undefined && String(value) !== label
				? `${label} ${value}${unit === undefined ? "" : ` ${unit}`}`.trim()
				: label;
		}
		return value === undefined ? "" : `${value}${unit === undefined ? "" : ` ${unit}`}`.trim();
	}

	function createBeaconStructuredIndex(characterId) {
		const attributes = findObjs({ _type: "attribute", _characterid: characterId })
			.map((attribute, discoveryIndex) => {
				const rootAttributeName = attribute.get("name");
				const rootName = normalizeBeaconLookupName(rootAttributeName);
				return {
					attribute,
					attributeId: attribute.id,
					rootName,
					rootAttributeName,
					priority: rootName === "store" ? 0 : rootName === "builder" ? 2 : 1,
					discoveryIndex
				};
			})
			.sort((left, right) => left.priority - right.priority || left.discoveryIndex - right.discoveryIndex);

		return {
			characterId,
			attributes,
			current: new Map(),
			max: new Map(),
			roots: { current: new Map(), max: new Map() },
			rootMisses: { current: new Set(), max: new Set() },
			parsedAttributeValues: { current: new Map(), max: new Map() },
			candidates: { current: new Map(), max: new Map() },
			allEntries: { current: [], max: [] },
			byStableIdentity: { current: new Map(), max: new Map() },
			scannedAttributes: { current: new Set(), max: new Set() },
			primaryBuilt: { current: false, max: false },
			fallbackBuilt: { current: false, max: false },
			discoveryCounter: { current: 0, max: 0 },
			deduplicated: 0,
			disabled: 0,
			operationStats: {
				current: { deduplicated: 0, disabled: 0 },
				max: { deduplicated: 0, disabled: 0 }
			}
		};
	}

	function getBeaconStructuredIndex(characterId) {
		if (!beaconStructuredIndexCache.has(characterId)) {
			beaconStructuredIndexCache.set(characterId, createBeaconStructuredIndex(characterId));
		}
		return beaconStructuredIndexCache.get(characterId);
	}

	function parseBeaconStructuredAttribute(index, source, operation) {
		if (index.parsedAttributeValues[operation].has(source.attributeId)) {
			return index.parsedAttributeValues[operation].get(source.attributeId);
		}
		const root = parseBeaconStructuredValue(source.attribute.get(operation));
		index.parsedAttributeValues[operation].set(source.attributeId, root);
		beaconPerformanceStats.structuredRootParses++;
		return root;
	}

	function getBeaconStructuredRoot(index, operation, rootName) {
		const normalizedRootName = normalizeBeaconLookupName(rootName) === "sheet"
			? "store"
			: normalizeBeaconLookupName(rootName);
		if (index.roots[operation].has(normalizedRootName)) {
			return { found: true, value: index.roots[operation].get(normalizedRootName).value, cacheHit: true };
		}
		if (index.rootMisses[operation].has(normalizedRootName)) {
			return { found: false, value: undefined, cacheHit: true };
		}

		for (const source of index.attributes) {
			if (source.rootName !== normalizedRootName) {
				continue;
			}
			const root = parseBeaconStructuredAttribute(index, source, operation);
			if (root === undefined) {
				continue;
			}
			index.roots[operation].set(normalizedRootName, {
				value: root,
				priority: source.priority,
				attributeId: source.attributeId,
				rootAttributeName: source.rootAttributeName
			});
			return { found: true, value: root, cacheHit: false };
		}

		index.rootMisses[operation].add(normalizedRootName);
		return { found: false, value: undefined, cacheHit: false };
	}

	function scanBeaconTypedAttribute(index, source, operation) {
		if (index.scannedAttributes[operation].has(source.attributeId)) {
			return;
		}
		index.scannedAttributes[operation].add(source.attributeId);
		beaconPerformanceStats.typedAttributesScanned++;

		const root = parseBeaconStructuredAttribute(index, source, operation);
		if (root === undefined) {
			return;
		}
		const existingRoot = index.roots[operation].get(source.rootName);
		if (!existingRoot || source.priority < existingRoot.priority) {
			index.roots[operation].set(source.rootName, {
				value: root,
				priority: source.priority,
				attributeId: source.attributeId,
				rootAttributeName: source.rootAttributeName
			});
		}

		const seenObjects = new WeakSet();
		const walk = (value, path) => {
			if (!value || typeof value !== "object" || seenObjects.has(value)) {
				return;
			}
			seenObjects.add(value);
			beaconPerformanceStats.typedObjectsVisited++;

			if (!Array.isArray(value)) {
				const collectionKey = normalizeBeaconLookupName(pluralizeBeaconType(
					beaconFirstPrimitive(value, [["type"], ["kind"], ["category"]])
				));
				if (collectionKey) {
					if (!index.candidates[operation].has(collectionKey)) {
						index.candidates[operation].set(collectionKey, []);
					}
					index.candidates[operation].get(collectionKey).push({
						record: value,
						discoveryIndex: index.discoveryCounter[operation]++,
						stableIdentity: beaconRecordStableIdentity(value),
						enabledState: beaconRecordEnabledState(value),
						attributeId: source.attributeId,
						rootName: source.rootName,
						rootAttributeName: source.rootAttributeName,
						priority: source.priority,
						path: path.slice()
					});
				}
			}

			const children = Array.isArray(value) ? value.entries() : Object.entries(value);
			for (const [childKey, child] of children) {
				if (child && typeof child === "object") {
					path.push(childKey);
					walk(child, path);
					path.pop();
				}
			}
		};

		walk(root, []);
	}

	function finalizeBeaconTypedOperation(index, operation) {
		const collectionIndex = new Map();
		const allEntries = [];
		const allEntryKeys = new Set();
		const byStableIdentity = new Map();
		let deduplicated = 0;
		let disabled = 0;

		for (const [collectionKey, entries] of index.candidates[operation]) {
			const identityGroups = new Map();
			const activeEntries = [];
			const entryScope = (entry) => normalizeBeaconLookupName(entry.rootName) === "builder"
				? "builder"
				: "authoritative";
			const enabledRawIdentities = new Map([
				["authoritative", new Set()],
				["builder", new Set()]
			]);
			for (const entry of entries) {
				if (entry.enabledState !== false) {
					for (const rawIdentity of beaconEntryRawIdentities(entry)) {
						enabledRawIdentities.get(entryScope(entry)).add(rawIdentity);
					}
				}
			}

			for (const entry of entries) {
				const scope = entryScope(entry);
				const overwrittenBy = beaconFirstPrimitive(entry.record, [["overwrittenBy"]]);
				if (overwrittenBy !== undefined
					&& enabledRawIdentities.get(scope).has(String(overwrittenBy).trim())) {
					continue;
				}

				if (!entry.stableIdentity) {
					if (entry.enabledState === false) {
						disabled++;
					} else {
						activeEntries.push(entry);
					}
					continue;
				}
				const scopedIdentity = `${scope}\u0000${entry.stableIdentity}`;
				if (!identityGroups.has(scopedIdentity)) {
					identityGroups.set(scopedIdentity, []);
				}
				identityGroups.get(scopedIdentity).push(entry);
			}

			for (const group of identityGroups.values()) {
				deduplicated += group.length - 1;
				const usable = group.filter((entry) => entry.enabledState !== false);
				if (!group.some((entry) => entry.enabledState === true) && usable.length !== group.length) {
					disabled++;
					continue;
				}
				activeEntries.push(usable.reduce((best, entry) =>
					entry.priority < best.priority ? entry : best
				));
			}

			activeEntries.sort((left, right) =>
				beaconRecordOrder(left.record) - beaconRecordOrder(right.record)
				|| left.discoveryIndex - right.discoveryIndex
			);
			collectionIndex.set(collectionKey, activeEntries);

			for (const entry of activeEntries) {
				const entryKey = `${entry.attributeId}\u0000${entry.path.join("\u0000")}`;
				if (!allEntryKeys.has(entryKey)) {
					allEntryKeys.add(entryKey);
					allEntries.push(entry);
				}
				if (entry.stableIdentity) {
					const existing = byStableIdentity.get(String(entry.stableIdentity));
					if (!existing
						|| entry.priority < existing.priority
						|| (entry.priority === existing.priority && entry.discoveryIndex < existing.discoveryIndex)) {
						byStableIdentity.set(String(entry.stableIdentity), entry);
					}
				}
			}
		}

		allEntries.sort((left, right) =>
			left.priority - right.priority
			|| left.discoveryIndex - right.discoveryIndex
		);
		index[operation] = collectionIndex;
		index.allEntries[operation] = allEntries;
		index.byStableIdentity[operation] = byStableIdentity;
		index.operationStats[operation] = { deduplicated, disabled };
		index.deduplicated = index.operationStats.current.deduplicated + index.operationStats.max.deduplicated;
		index.disabled = index.operationStats.current.disabled + index.operationStats.max.disabled;
	}

	function ensureBeaconTypedOperation(index, operation, includeFallback) {
		const start = Date.now();
		let built = false;
		if (!index.primaryBuilt[operation]) {
			for (const source of index.attributes) {
				if (source.rootName !== "builder") {
					scanBeaconTypedAttribute(index, source, operation);
				}
			}
			index.primaryBuilt[operation] = true;
			built = true;
		}
		if (includeFallback && !index.fallbackBuilt[operation]) {
			for (const source of index.attributes) {
				if (source.rootName === "builder") {
					scanBeaconTypedAttribute(index, source, operation);
				}
			}
			index.fallbackBuilt[operation] = true;
			built = true;
		}
		if (built) {
			finalizeBeaconTypedOperation(index, operation);
			beaconPerformanceStats.typedIndexBuilds++;
			beaconPerformanceStats.typedIndexMilliseconds += Date.now() - start;
		}
		return built;
	}

	function getBeaconTypedCollectionIndex(characterId, operation = "current", includeFallback = false) {
		const index = getBeaconStructuredIndex(characterId);
		const built = ensureBeaconTypedOperation(index, operation, includeFallback);
		return { index, cacheHit: !built, operation, includeFallback };
	}

	function beaconRecordSelectorValues(record) {
		if (!record || typeof record !== "object") {
			return [];
		}

		// Typed records do not all expose their human identity as a top-level name or
		// label. For example, a Speed record stores its movement mode in the speed value.
		// Inspect identity fields recursively, then fall back to top-level primitives.
		const preferredKeys = [
			"shortID", "uuid", "name", "label", "title", "slug",
			"ability", "speed", "skill", "proficiency", "currency",
			"spellLevel", "actionType", "category", "type"
		];
		const nestedIdentityKeys = ["shortID", "uuid", "id", "key", "name", "label", "title", "slug", "value", "type"];
		const values = [];
		const seen = new Set();
		const visited = new Set();
		const addValue = (value) => {
			if (value === undefined || value === null || !beaconPrimitive(value)) {
				return;
			}
			const normalized = normalizeBeaconLookupName(value);
			if (!normalized || seen.has(normalized)) {
				return;
			}
			seen.add(normalized);
			values.push(normalized);
		};
		const addIdentityValue = (value, depth = 0) => {
			if (value === undefined || value === null) {
				return;
			}
			if (beaconPrimitive(value)) {
				addValue(value);
				return;
			}
			if (depth >= 3 || typeof value !== "object" || visited.has(value)) {
				return;
			}
			visited.add(value);
			if (Array.isArray(value)) {
				for (const item of value) {
					addIdentityValue(item, depth + 1);
				}
				return;
			}
			for (const key of nestedIdentityKeys) {
				const nestedValue = beaconProperty(value, key);
				if (nestedValue !== undefined) {
					addIdentityValue(nestedValue, depth + 1);
				}
			}
			for (const nestedValue of Object.values(value)) {
				addIdentityValue(nestedValue, depth + 1);
			}
		};

		for (const key of preferredKeys) {
			addIdentityValue(beaconProperty(record, key));
		}
		for (const value of Object.values(record)) {
			addValue(value);
		}
		return values;
	}

	function findBeaconCollectionSelectorMatches(collectionEntries, selector) {
		const identity = normalizeBeaconLookupName(selector);
		if (!identity) {
			return [];
		}
		return collectionEntries.filter((entry) =>
			beaconRecordSelectorValues(entry.record).includes(identity)
		);
	}

	function selectBeaconCollectionEntry(collectionEntries, selector) {
		if (/^\d+$/.test(String(selector))) {
			return collectionEntries[Number(selector)];
		}
		const matches = findBeaconCollectionSelectorMatches(collectionEntries, selector);
		return matches.length === 1 ? matches[0] : undefined;
	}


	function beaconIndexStatus(indexed) {
		const operation = indexed.operation || "current";
		const stats = indexed.index.operationStats[operation] || { deduplicated: 0, disabled: 0 };
		return indexed.cacheHit ? `reused cached ${operation} index`
			: `built ${operation} index, removed ${stats.deduplicated} mirrored record(s), and excluded ${stats.disabled} disabled record(s)`;
	}

	function resolveBeaconStructuredLookup(characterId, lookupName, operation, subfields, debug) {
		const normalizedLookupName = normalizeBeaconLookupName(lookupName) === "sheet"
			? "store"
			: normalizeBeaconLookupName(lookupName);
		const structuredIndex = getBeaconStructuredIndex(characterId);
		const structuredRoot = getBeaconStructuredRoot(structuredIndex, operation, normalizedLookupName);

		if (structuredRoot.found) {
			const rootValue = subfields.length
				? readBeaconSubfields(structuredRoot.value, subfields)
				: structuredRoot.value;
			if (!beaconLookupIsUnresolved(rootValue)) {
				if (debug) {
					log(`ScriptCards Beacon lookup: ${lookupName} resolved from a structured ${operation} root; ${structuredRoot.cacheHit ? "reused cached root" : "parsed root only"}.`);
				}
				return {
					found: true,
					value: beaconPrimitive(rootValue) ? String(rootValue) : JSON.stringify(rootValue)
				};
			}
			if (subfields.length) {
				if (debug) {
					log(`ScriptCards Beacon lookup: ${lookupName} resolved to an authoritative structured ${operation} root, but ${subfields.join("->")} is not present.`);
				}
				return { found: false, value: undefined, authoritativeMiss: true };
			}
		}

		let indexed = getBeaconTypedCollectionIndex(characterId, operation, false);
		let collectionEntries = getBeaconPreferredTypedEntries(indexed, operation, normalizedLookupName, false);
		if (!collectionEntries.length) {
			if (!indexed.index.fallbackBuilt[operation]) {
				indexed = getBeaconTypedCollectionIndex(characterId, operation, true);
			}
			collectionEntries = getBeaconPreferredTypedEntries(indexed, operation, normalizedLookupName, true);
		}

		if (!collectionEntries.length) {
			if (debug) {
				log(`ScriptCards Beacon lookup: no structured root or typed ${operation} collection matched ${lookupName}; ${beaconIndexStatus(indexed)}.`);
			}
			return { found: false, value: undefined };
		}

		let selected;
		if (!subfields.length) {
			selected = collectionEntries.map((entry) => entry.record);
		} else {
			const entry = selectBeaconCollectionEntry(collectionEntries, subfields[0]);
			selected = entry
				? subfields.length === 1
					? entry.record
					: readBeaconSubfields(entry.record, subfields.slice(1))
				: undefined;
		}

		if (selected === undefined || selected === null) {
			if (debug) {
				log(`ScriptCards Beacon lookup: ${lookupName} matched a typed ${operation} collection (${collectionEntries.length} record(s)), but ${subfields.join("->")} did not resolve to a value.`);
			}
			return { found: false, value: undefined };
		}

		if (debug) {
			log(`ScriptCards Beacon lookup: ${lookupName} resolved from a typed ${operation} collection (${collectionEntries.length} record(s); ${beaconIndexStatus(indexed)}).`);
		}
		return { found: true, value: formatBeaconRecord(selected, operation) };
	}
	function extractKeyValuePairs(obj, prefix = '') {
		let result = [];

		for (const [key, value] of Object.entries(obj)) {
			const newKey = prefix ? `${prefix}_${key}` : key;

			if (Array.isArray(value)) {
				value.forEach((item, index) => {
					const arrayKey = `${newKey}_${index}`;
					if (typeof item === 'object' && item !== null) {
						result = result.concat(extractKeyValuePairs(item, arrayKey));
					} else {
						result.push(`${arrayKey}: ${item}`);
					}
				});
			} else if (typeof value === 'object' && value !== null) {
				result = result.concat(extractKeyValuePairs(value, newKey));
			} else {
				result.push(`${newKey}: ${value}`);
			}
		}

		return result;
	}

	function removeLibraryBlocks(text) {
		const protectedBlocks = [];

		// Protect ${ ... $} blocks
		text = text.replace(/\$\{[\s\S]*?\$\}/g, match => {
			const placeholder = `__PROTECTED_BLOCK_${protectedBlocks.length}__`;
			protectedBlocks.push(match);
			return placeholder;
		});

		// Remove +++ ... +++ blocks outside protected areas
		text = text.replace(/\+\+\+[\s\S]*?\+\+\+/g, "");

		// Restore protected blocks
		text = text.replace(/__PROTECTED_BLOCK_(\d+)__/g, (_, index) => {
			return protectedBlocks[Number(index)];
		});

		return text;
	}

})();

// log(`Error setting z-order ${e.message}, thisTag: ${thisTag}, thisContent: ${thisContent}`)

// Meta marker for the end of ScriptCards
{ try { throw new Error(''); } catch (e) { API_Meta.ScriptCards.lineCount = (parseInt(e.stack.split(/\n/)[1].replace(/^.*:(\d+):.*$/, '$1'), 10) - API_Meta.ScriptCards.offset); } }

// Support for AirBag Crash Handler (if installed)
if (typeof MarkStop === "function") MarkStop('ScriptCards');