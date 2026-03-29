/* eslint-disable no-undef */
/* eslint-disable no-useless-escape */
/* eslint-disable no-redeclare */
// Github:   https://github.com/kjaegers/ScriptCards/blob/main/X_OtherScripts/AuraTriggers.js
// By:       Kurt Jaegers
// Roll20:   https://app.roll20.net/users/2365448/kurt-j
// Discord:  https://discord.gg/jSB4wTNpXb

if (typeof MarkStart === "function") MarkStart('AuraTriggers');
var API_Meta = API_Meta || {};
API_Meta.AuraTriggers = { offset: Number.MAX_SAFE_INTEGER, lineCount: -1 };
{ try { throw new Error(''); } catch (e) { API_Meta.AuraTriggers.offset = (parseInt(e.stack.split(/\n/)[1].replace(/^.*:(\d+):.*$/, '$1'), 10) - 10); } }
const AuraTriggers = (() => {

    // Used for the state storage system so it is transportable between API scripts.
    const APINAME = "AuraTriggers";

    const APIAUTHOR = "Kurt Jaegers";

    // Configuration schema version. This represents the last time changes were made to the configuration values
    // saved between sessions, and is not necessarially the same as the API version number.
    const APIVERSION = "0.7";

    var APILANGUAGE = "english";

    // No config settings defined at this time
    var configSettings = {
    }

    const tokensInAuras = new Map();

    var activeAuras = {};

    function handleObservedTokenChange(obj) {
        if (!obj || typeof obj.get !== "function") {
            return;
        }

        const tokenId = obj.get("_id");
        const pageId = obj.get("_pageid") || obj.get("_pageId");
        const gmnotes = decodeAndStripHtmlSimple(obj.get("gmnotes"));
        const hasValidJson = (() => {
            try {
                JSON.parse(gmnotes || "[]");
                return true;
            } catch (e) {
                return false;
            }
        })();

        if (hasValidJson && pageId) {
            BuildAuraList(pageId);
        }

        if (tokenId) {
            checkAuraOverlap(tokenId);
        }
    }

    function registerScriptCardsObserver(attempt) {
        const maxAttempts = 50;
        const retryDelayMs = 200;
        const tryCount = attempt || 0;

        if (typeof ScriptCards === "undefined") {
            if (tryCount < maxAttempts) {
                setTimeout(function () {
                    registerScriptCardsObserver(tryCount + 1);
                }, retryDelayMs);
            }
            return;
        }

        // ScriptCards exports an async module Promise.
        if (ScriptCards && typeof ScriptCards.then === "function") {
            ScriptCards.then(function (api) {
                if (api && typeof api.ObserveTokenChange === "function") {
                    api.ObserveTokenChange(function (obj) {
                        handleObservedTokenChange(obj);
                    });
                }
            }).catch(function (e) {
                log(`${APINAME}: Unable to register ScriptCards observer: ${e.message}`);
            });
            return;
        }

        // Backward-compatible fallback if ScriptCards is an object export.
        if (typeof ScriptCards.ObserveTokenChange === "function") {
            ScriptCards.ObserveTokenChange(function (obj) {
                handleObservedTokenChange(obj);
            });
            return;
        }

        if (tryCount < maxAttempts) {
            setTimeout(function () {
                registerScriptCardsObserver(tryCount + 1);
            }, retryDelayMs);
        }
    }

    on('ready', function () {
        // Check if the state object for this API script has been initialized, and if not, initialize it.
        if (!state[APINAME]) {
            initializeState();
        }

        registerScriptCardsObserver(0);

        if (typeof TokenMod !== 'undefined' && TokenMod.ObserveTokenChange) {
            TokenMod.ObserveTokenChange((obj, _prev) => {
                handleObservedTokenChange(obj);
            });            
        }

        // Display API info in the console log
        log(`-=> ${APINAME} - ${APIVERSION} by ${APIAUTHOR} Ready <=- Meta Offset : ${API_Meta.AuraTriggers.offset}`);
        sendChat("AuraTriggers", `${APINAME} v${APIVERSION} is loaded, but this API Mod is in development/testing and NOT ready for prime time. DO NOT USE in your live game yet!.`);
        let pageList = findObjs({ _type: "page" });
        if (pageList && Array.isArray(pageList)) {
            _.each(pageList, function (page) {
                if (page && typeof page.get === "function") {
                    BuildAuraList(page.get("_id"));
                }
            });
        }

        // Monitor for new Graphics objects (includes tokens)
        on('add:graphic', function (obj) {
            if (obj && typeof obj.get === "function") {
                BuildAuraList(obj.get("_pageid"));
                checkAuraOverlap(obj.get("_id"));
            }
        });

        on('change:campaign:turnorder', function(obj, prev) {
            if (obj.get("turnorder") === prev.turnorder) { return }
            if (obj.get("turnorder") === "") { return }
            
            let turnorder, oldTurnOrder;
            try {
                turnorder = JSON.parse(obj.get("turnorder"));
                oldTurnOrder = JSON.parse(prev.turnorder || "[]");
            } catch (e) {
                log(`AuraTriggers: Error parsing turnorder JSON - ${e.message}`);
                return;
            }
            
            if (!Array.isArray(turnorder) || !Array.isArray(oldTurnOrder)) {
                log(`AuraTriggers: Turnorder is not an array`);
                return;
            }
            
            if (turnorder.length === 0 || oldTurnOrder.length === 0) { return }
            let currentTurn = turnorder[0];
            let previousTurn = oldTurnOrder[0];
            if (currentTurn.id === previousTurn.id) { return }
            let currentToken = getObj("graphic", currentTurn.id);
            let previousToken = getObj("graphic", previousTurn.id);
            if (currentToken && tokensInAuras.has(currentTurn.id)) {
                // Starting turn in an aura   
                processStartTurnInAura(currentToken);
            }
            if (previousToken && tokensInAuras.has(previousTurn.id)) {
                // Ended turn in an aura
                processEndTurnInAura(previousToken);
            }
        });

        on('destroy:graphic', function (obj) {
            if (!obj || typeof obj.get !== "function") {
                return;
            }
            cleanupDestroyedTokenAuras(obj);
            removeTokenFromAllAuras(tokensInAuras, obj.get("_id"));
            setTimeout(function () {
                BuildAuraList(obj.get("_pageid"));
            }, 200);
        });

        // Monitor for changes to Graphics objects (includes tokens)
        on('change:graphic', function (obj, prev) {
            if (!obj || typeof obj.get !== "function") {
                return;
            }
            // If the aura list on this page is empty, build it.
            if (activeAuras[obj.get("_pageid")] === undefined) {
                BuildAuraList(obj.get("_pageid"));
            }

            // If the aura information has changed, rebuild the aura list for this page.
            if ((obj.get("aura1_radius") !== prev.aura1_radius) || (obj.get("aura2_radius") !== prev.aura2_radius) ||
                (obj.get("aura1_color") !== prev.aura1_color) || (obj.get("aura2_color") !== prev.aura2_color) ||
                (obj.get("aura1_square") !== prev.aura1_square) || (obj.get("aura2_square") !== prev.aura2_square) ||
                (obj.get("gmnotes") !== prev.gmnotes)) {
                // Clean up any auras that have been disabled without re-triggering enter actions
                cleanupDisabledAuras(obj, prev);
                BuildAuraList(obj.get("_pageid"));
            };

            // If the modified token is on the aura list, check all tokens on the page for overlaps
            // To allow time for Roll20 to update the token's position, this is done with a slight delay.
            if (tokenHasActiveAura(obj.get("_id"))) {
                setTimeout(function () {
                    let pageTokens = findObjs({ _type: "graphic", _pageid: obj.get("_pageid") });
                    if (pageTokens && Array.isArray(pageTokens)) {
                        _.each(pageTokens, function (token) {
                            if (token && typeof token.get === "function") {
                                checkAuraOverlap(token.get("_id"));
                            }
                        });
                    }
                }, 200);
            }

            // If the token has moved, check for aura overlaps with this token.
            if ((obj.get("left") !== prev.left) || (obj.get("top") !== prev.top)) {
                if (obj.get("aura1_radius") !== 0 || obj.get("aura2_radius") !== 0) {
                    BuildAuraList(obj.get("_pageid"));
                }
                checkAuraOverlap(obj.get("_id"));
            }
        });

        // Handle direct API commands for utilities and testing
        on('chat:message', function (msg) {
            // Clears ALL auras on ALL tokens in the game. Use with caution!
            if (msg.type == "api" && msg.content.indexOf("!at-clearallauras") === 0) {
                log("Clearing all auras on all pages.");
                let objList = findObjs({ _type: "graphic" });
                if (objList && Array.isArray(objList)) {
                    _.each(objList, function (obj) {
                        if (obj && typeof obj.set === "function") {
                            obj.set("aura1_radius", 0);
                            obj.set("aura2_radius", 0);
                        }
                    });
                }
                let pageList = findObjs({ _type: "page" });
                if (pageList && Array.isArray(pageList)) {
                    _.each(pageList, function (page) {
                        if (page && typeof page.get === "function") {
                            BuildAuraList(page.get("_id"));
                        }
                    });
                }
            }

            // Report all active auras
            if (msg.type == "api" && msg.content.indexOf("!at-report") === 0) {
                let pageIds = Object.keys(activeAuras);
                let totalAuras = 0;

                if (pageIds.length === 0) {
                    log("AuraTriggers Report: No cached aura data found. Run !at-rebuild first if needed.");
                    return;
                }

                _.each(pageIds, function (pageId) {
                    let pageAuras = activeAuras[pageId] || [];
                    totalAuras += pageAuras.length;

                    _.each(pageAuras, function (auraInfo) {
                        let filterText = auraInfo.aura_attribute_filter ? auraInfo.aura_attribute_filter : "(none)";
                        log(`AuraTriggers Report | Page: ${pageId} | Aura: ${auraInfo.auraName || "(unnamed)"} | Attribute Filter: ${filterText}`);
                    });
                });

                log(`AuraTriggers Report Complete | Total Auras: ${totalAuras}`);
            }


            // Rebuilds the aura lists for all pages.
            if (msg.type == "api" && (msg.content.indexOf("!at-rebuild") === 0)) {
                log("Rebuilding aura lists for all pages.");
                let auraCount = 0;
                let pageList = findObjs({ _type: "page" });
                if (pageList && Array.isArray(pageList)) {
                    _.each(pageList, function (page) {
                        if (page && typeof page.get === "function") {
                            BuildAuraList(page.get("_id"));
                            // Safety check in case BuildAuraList didn't initialize properly
                            if (activeAuras[page.get("_id")] && Array.isArray(activeAuras[page.get("_id")])) {
                                auraCount += activeAuras[page.get("_id")].length;
                            }
                        }
                    });
                }
                sendChat("AuraTriggers", "/w gm Aura lists rebuilt for all pages. Total active auras: " + auraCount);
            }

            // Check for overlaps on all tokens on all pages.
            if (msg.type == "api" && msg.content.indexOf("!at-checkall") === 0) {
                let pages = findObjs({ _type: "page" });
                if (pages && Array.isArray(pages)) {
                    _.each(pages, function (page) {
                        if (page && typeof page.get === "function") {
                            let pageTokens = findObjs({ _type: "graphic", _pageid: page.get("_id") });
                            if (pageTokens && Array.isArray(pageTokens)) {
                                _.each(pageTokens, function (token) {
                                    if (token && typeof token.get === "function") {
                                        checkAuraOverlap(token.get("_id"));
                                    }
                                });
                            }
                        }
                    });
                }
            }
        });
    });

    // Scan all tokens on the page to find tokens with auras. If the aura is referenced in the gmnotes, add it to the
    // activeAuras list for the page and cache its information.
    function BuildAuraList(pageId) {
        let pageGraphics = findObjs({ _type: "graphic", _pageid: pageId });
        activeAuras[pageId] = [];

        // Safety check for pageGraphics
        if (!pageGraphics || !Array.isArray(pageGraphics)) {
            log(`AuraTriggers: pageGraphics is not an array for page ${pageId}`);
            return;
        }

        let scale = 1.0
        let mapIncrement = 5;

        if (pageGraphics.length !== 0) {
            scale = pageGraphics[0].get("snapping_increment") || 1;
            mapIncrement = pageGraphics[0].get("scale_number") || 5;
        }

        _.each(pageGraphics, function (graphic) {
            if (!graphic || typeof graphic.get !== "function") {
                return;
            }
            if ((graphic.get("aura1_radius") !== 0) || (graphic.get("aura2_radius") !== 0)) {
                auraInfo = (decodeAndStripHtmlSimple(graphic.get("gmnotes")))
                let auraParsed = undefined;
                if (auraInfo) {
                    try {
                        auraParsed = JSON.parse(auraInfo);
                    } catch (e) {
                        log(`${APINAME}: Error parsing JSON on token '${graphic.get("name")}': ${e.message}`);
                    }
                }

                let auraActions = []

                if (Math.abs(graphic.get("aura1_radius")) > 0) {
                    let aura1Matches = getAurasByColor(auraParsed, graphic.get("aura1_color"));
                    auraActions.push.apply(auraActions, aura1Matches);
                }
                if (Math.abs(graphic.get("aura2_radius")) > 0) {
                    let aura2Matches = getAurasByColor(auraParsed, graphic.get("aura2_color"));
                    auraActions.push.apply(auraActions, aura2Matches);
                }

                _.each(auraActions, function (auraAction) {
                    let workRadius = undefined;
                    let workSquare = false;
                    let workIcon = undefined;
                    let c1 = graphic.get("aura1_color");
                    let c2 = graphic.get("aura2_color");
                    if (auraAction.color == graphic.get("aura1_color")) {
                        workRadius = graphic.get("aura1_radius");
                        workSquare = graphic.get("aura1_square");
                        workIcon = auraAction.icon;
                    }
                    if (auraAction.color == graphic.get("aura2_color")) {
                        workRadius = graphic.get("aura2_radius");
                        workSquare = graphic.get("aura2_square");
                        workIcon = auraAction.icon;
                    }

                    let thisTokenAura = {
                        tokenId: graphic.get("_id"),
                        aura_active: true,
                        aura_radius: (mapIncrement !== 0) ? (workRadius / mapIncrement * 70) : 0,
                        aura_square: workSquare,
                        auraCoords: getTokenCoordsPixel(graphic),
                        auraTokenName: graphic.get("name"),
                        auraName: auraAction.name,
                        auraToNPCs: (auraAction.toNPCs !== undefined) ? auraAction.toNPCs : true,
                        auraToPCs: (auraAction.toPCs !== undefined) ? auraAction.toPCs : true,
                        auraToGraphics: (auraAction.toGraphics !== undefined) ? auraAction.toGraphics : false,
                        removeOnExit: (auraAction.removeOnExit !== undefined) ? auraAction.removeOnExit : true,
                        aura_icon: workIcon,
                        aura_attribute_filter: auraAction.attributeFilter || null,
                        aura_id: graphic.get("_id") + "_" + auraAction.color + "_" + (auraAction._jsonIndex !== undefined ? auraAction._jsonIndex : "0"),
                        aura_chataction_enter: (auraAction.chatActionOnEnter !== undefined) ? auraAction.chatActionOnEnter : "",
                        aura_chataction_exit: (auraAction.chatActionOnExit !== undefined) ? auraAction.chatActionOnExit : "",
                        aura_chataction_inside: (auraAction.chatActionWhileInside !== undefined) ? auraAction.chatActionWhileInside : "",
                        aura_chataction_startturn: (auraAction.chatActionOnStartTurn !== undefined) ? auraAction.chatActionOnStartTurn : "",
                        aura_chataction_endturn: (auraAction.chatActionOnEndTurn !== undefined) ? auraAction.chatActionOnEndTurn : "",
                        aura_applySelf: (auraAction.applySelf !== undefined) ? auraAction.applySelf : false,
                        onObjectLayer: auraAction.toLayers ? auraAction.toLayers.includes("objects") || auraAction.toLayers.includes("token") : true,
                        onGMLayer: auraAction.toLayers ? auraAction.toLayers.includes("gmlayer") : false,
                        onMapLayer: auraAction.toLayers ? auraAction.toLayers.includes("map") : false,
                        onWallLayer: auraAction.toLayers ? auraAction.toLayers.includes("walls") : false,
                        onForegroundLayer: auraAction.toLayers ? auraAction.toLayers.includes("foreground") : false,
                        aura_sourcevfx_onenter: auraAction.sourceVfxOnEnter || null,
                        aura_sourcevfx_onexit: auraAction.sourceVfxOnExit || null,
                        aura_sourcevfx_whileinside: auraAction.sourceVfxWhileInside || null,
                        aura_sourcevfx_onstartturn: auraAction.sourceVfxOnStartTurn || null,
                        aura_sourcevfx_onendturn: auraAction.sourceVfxOnEndTurn || null,
                        aura_targetvfx_onenter: auraAction.targetVfxOnEnter || null,
                        aura_targetvfx_onexit: auraAction.targetVfxOnExit || null,
                        aura_targetvfx_whileinside: auraAction.targetVfxWhileInside || null,
                        aura_targetvfx_onstartturn: auraAction.targetVfxOnStartTurn || null,
                        aura_targetvfx_onendturn: auraAction.targetVfxOnEndTurn || null,
                        aura_sound_onenter: auraAction.soundOnEnter || null,
                        aura_sound_onexit: auraAction.soundOnExit || null,
                        aura_sound_whileinside: auraAction.soundWhileInside || null,
                        aura_sound_onstartturn: auraAction.soundOnStartTurn || null,
                        aura_sound_onendturn: auraAction.soundOnEndTurn || null
                    }
                    activeAuras[pageId].push(thisTokenAura);
                }
                );
            }
        });
    }

    function checkAuraOverlap(tokenId) {
        let token = getObj("graphic", tokenId);
        if (!token) {
            log(`AuraTriggers: Cannot check aura overlap - token ${tokenId} not found`);
            return;
        }
        
        let isCharacter = token.get("represents") ? true : false;
        let theCharacter = getObj("character", token.get("represents"));
        let isPC = theCharacter ? (theCharacter.get("controlledby") !== "") : false;

        let pageId = token.get("_pageid");

        let t1 = getTokenCoordsPixel(token)

        // Ensure the active auras list exists for this page
        if (!activeAuras[pageId]) {
            BuildAuraList(pageId);
        }
        
        // Additional safety check in case BuildAuraList failed
        if (!activeAuras[pageId] || !Array.isArray(activeAuras[pageId])) {
            log(`AuraTriggers: activeAuras[${pageId}] is not properly initialized`);
            return;
        }

        _.each(activeAuras[pageId], function (auraInfo) {
            let checkAura = false;

            if (auraInfo.tokenId == tokenId && auraInfo.aura_applySelf) { checkAura = true; }
            if (auraInfo.tokenId !== tokenId && isCharacter && !isPC && auraInfo.auraToNPCs) { checkAura = true; }
            if (auraInfo.tokenId !== tokenId && isPC && auraInfo.auraToPCs) { checkAura = true; }
            if (auraInfo.tokenId !== tokenId && !isCharacter && auraInfo.auraToGraphics) { checkAura = true; }
            if (token.get("layer") === "objects" && !auraInfo.onObjectLayer) { checkAura = false; }
            if (token.get("layer") === "gmlayer" && !auraInfo.onGMLayer) { checkAura = false; }
            if (token.get("layer") === "map" && !auraInfo.onMapLayer) { checkAura = false; }
            if (token.get("layer") === "walls" && !auraInfo.onWallLayer) { checkAura = false; }
            if (token.get("layer") === "foreground" && !auraInfo.onForegroundLayer) { checkAura = false; }
            if (auraInfo.aura_attribute_filter && isCharacter && theCharacter) {
                let attrCheck = true;
                let attrList = auraInfo.aura_attribute_filter.split("|").map(s => s.trim().toLowerCase());
                _.each(attrList, function (attr) {
                    let attrParts = attr.trim().split(/\s+/);
                    let attrName = attrParts[0];
                    let attrComp = attrParts[1];
                    let attrValue = attrParts.slice(2).join(" ");

                    if (!attrName || !attrComp || attrValue === "") {
                        attrCheck = false;
                        return;
                    }

                    let rawAttrValue = NewGetAttrByName(theCharacter.id, attrName);
                    if (attrName.toLowerCase() == "name" || attrName.toLowerCase() == "character_name") { rawAttrValue = theCharacter.get("name"); }
                    if (attrName.toLowerCase() == "token_name") { rawAttrValue = token.get("name"); }
                    if (rawAttrValue) { rawAttrValue = String(rawAttrValue).trim().toLowerCase(); }
                    let curValue = (rawAttrValue === undefined || rawAttrValue === null) ? "" : String(rawAttrValue).trim().toLowerCase();
                    let testRes = false;
                    switch (attrComp) {
                        case "-eq":
                            testRes = curValue == attrValue;
                            break;
                        case "-lt":
                            testRes = parseFloat(curValue) < parseFloat(attrValue);
                            break;
                        case "-gt":
                            testRes = parseFloat(curValue) > parseFloat(attrValue);
                            break;
                        case "-le":
                            testRes = parseFloat(curValue) <= parseFloat(attrValue);
                            break;
                        case "-ge":
                            testRes = parseFloat(curValue) >= parseFloat(attrValue);
                            break;
                        case "-ne":
                            testRes = curValue != attrValue;
                            break;
                        case "-inc":
                            testRes = curValue.includes(attrValue);
                            break;
                        case "-ninc":
                            testRes = !curValue.includes(attrValue);
                            break;
                        case "-startswith":
                            testRes = curValue.startsWith(attrValue);
                            break;
                        case "-endswith":
                            testRes = curValue.endsWith(attrValue);
                            break;
                        default:
                            testRes = false;
                    }
                    attrCheck = testRes;
                });
                if (!attrCheck) { checkAura = false; }
            }

            if (checkAura) {

                let event = "none";
                if (auraInfo.aura_active && !auraInfo.aura_square && auraInfo.aura_icon) {
                    if (isWithinAura(t1, auraInfo.auraCoords, auraInfo.aura_radius)) {
                        event = updateTokenAuraMembership(tokensInAuras, tokenId, auraInfo.aura_id, true);
                        if (auraInfo.aura_icon) {
                            AddTokenStatusMarker(token, auraInfo.aura_icon);
                        }
                    } else {
                        event = updateTokenAuraMembership(tokensInAuras, tokenId, auraInfo.aura_id, false);
                        if (auraInfo.aura_icon && auraInfo.removeOnExit) {
                            RemoveTokenStatusMarker(token, auraInfo.aura_icon);
                        }
                    }
                }

                if (auraInfo.aura_active && auraInfo.aura_square && auraInfo.aura_icon) {
                    if (isWithinSquareAura(t1, auraInfo.auraCoords, auraInfo.aura_radius)) {
                        event = updateTokenAuraMembership(tokensInAuras, tokenId, auraInfo.aura_id, true);
                        AddTokenStatusMarker(token, auraInfo.aura_icon);
                    } else {
                        event = updateTokenAuraMembership(tokensInAuras, tokenId, auraInfo.aura_id, false);
                        if (auraInfo.aura_icon && auraInfo.removeOnExit) {
                            RemoveTokenStatusMarker(token, auraInfo.aura_icon);
                        }
                    }
                }

                let sourceToken = getObj("graphic", auraInfo.tokenId);

                if (event == "enter" && auraInfo.aura_chataction_enter) {
                    sendChat("AuraTriggers", replaceVariables(auraInfo.aura_chataction_enter, auraInfo, token));
                    if (auraInfo.aura_sourcevfx_onenter && sourceToken) { playVFX(sourceToken, auraInfo.aura_sourcevfx_onenter); }
                    if (auraInfo.aura_targetvfx_onenter && token) { playVFX(token, auraInfo.aura_targetvfx_onenter); }

                    if (auraInfo.aura_sound_onenter) { playJukeboxTrack(auraInfo.aura_sound_onenter); }
                }

                if (event == "exit" && auraInfo.aura_chataction_exit) {
                    sendChat("AuraTriggers", replaceVariables(auraInfo.aura_chataction_exit, auraInfo, token));
                    if (auraInfo.aura_sourcevfx_onexit && sourceToken) { playVFX(sourceToken, auraInfo.aura_sourcevfx_onexit); }
                    if (auraInfo.aura_targetvfx_onexit && token) { playVFX(token, auraInfo.aura_targetvfx_onexit); }

                    if (auraInfo.aura_sound_onexit) { playJukeboxTrack(auraInfo.aura_sound_onexit); }
                }

                if (event == "inside" && auraInfo.aura_chataction_inside) {
                    sendChat("AuraTriggers", replaceVariables(auraInfo.aura_chataction_inside, auraInfo, token));
                    if (auraInfo.aura_sourcevfx_whileinside && sourceToken) { playVFX(sourceToken, auraInfo.aura_sourcevfx_whileinside); }
                    if (auraInfo.aura_targetvfx_whileinside && token) { playVFX(token, auraInfo.aura_targetvfx_whileinside); }
                    
                    if (auraInfo.aura_sound_whileinside) { playJukeboxTrack(auraInfo.aura_sound_whileinside); }
                }
            }
        });
    }

    function cleanupDestroyedTokenAuras(token) {
        if (!token) {
            return;
        }

        let pageId = token.get("_pageid");
        let tokenAuras = getTokenActiveAuras(token.get("_id"), pageId);

        if (!tokenAuras || !Array.isArray(tokenAuras) || tokenAuras.length === 0) {
            return;
        }

        _.each(tokenAuras, function (auraInfo) {
            _.each(Array.from(tokensInAuras.entries()), function (entry) {
                let targetTokenId = entry[0];
                let auraSet = entry[1];

                if (!auraSet || !auraSet.has(auraInfo.aura_id)) {
                    return;
                }

                let targetToken = getObj("graphic", targetTokenId);
                if (!targetToken) {
                    return;
                }
                if (targetToken) {
                    processAuraExit(targetToken, auraInfo);
                }

                removeTokenFromAura(tokensInAuras, targetTokenId, auraInfo.aura_id);
            });
        });
    }

    function processAuraExit(token, auraInfo) {
        if (!token || !auraInfo) {
            return;
        }

        if (auraInfo.aura_icon && auraInfo.removeOnExit) {
            RemoveTokenStatusMarker(token, auraInfo.aura_icon);
        }

        if (auraInfo.aura_chataction_exit) {
            sendChat("AuraTriggers", replaceVariables(auraInfo.aura_chataction_exit, auraInfo, token));
        }
    }

    function processStartTurnInAura(token) {
        if (!token || typeof token.get !== "function") {
            return;
        }

        let tokenId = token.get("_id");
        let pageId = token.get("_pageid");

        // Check if this token is in any auras
        if (!tokensInAuras.has(tokenId)) {
            return;
        }

        // Get the set of aura IDs this token is in
        let auraSet = tokensInAuras.get(tokenId);
        if (!auraSet || auraSet.size === 0) {
            return;
        }

        // Get the active auras for this page
        let pageAuras = activeAuras[pageId];
        if (!pageAuras || !Array.isArray(pageAuras)) {
            return;
        }

        // For each aura the token is in, check if it has a start turn action
        _.each(pageAuras, function (auraInfo) {
            if (auraSet.has(auraInfo.aura_id) && auraInfo.aura_chataction_startturn) {
                sendChat("AuraTriggers", replaceVariables(auraInfo.aura_chataction_startturn, auraInfo, token));
                
                let sourceToken = getObj("graphic", auraInfo.tokenId);
                if (auraInfo.aura_sourcevfx_onstartturn && sourceToken) { playVFX(sourceToken, auraInfo.aura_sourcevfx_onstartturn); }
                if (auraInfo.aura_targetvfx_onstartturn && token) { playVFX(token, auraInfo.aura_targetvfx_onstartturn); }
                
                if (auraInfo.aura_sound_onstartturn) { playJukeboxTrack(auraInfo.aura_sound_onstartturn); }
            }
        });
    }

    function processEndTurnInAura(token) {
        if (!token || typeof token.get !== "function") {
            return;
        }

        let tokenId = token.get("_id");
        let pageId = token.get("_pageid");

        // Check if this token is in any auras
        if (!tokensInAuras.has(tokenId)) {
            return;
        }

        // Get the set of aura IDs this token is in
        let auraSet = tokensInAuras.get(tokenId);
        if (!auraSet || auraSet.size === 0) {
            return;
        }

        // Get the active auras for this page
        let pageAuras = activeAuras[pageId];
        if (!pageAuras || !Array.isArray(pageAuras)) {
            return;
        }

        // For each aura the token is in, check if it has an end turn action
        _.each(pageAuras, function (auraInfo) {
            if (auraSet.has(auraInfo.aura_id) && auraInfo.aura_chataction_endturn) {
                sendChat("AuraTriggers", replaceVariables(auraInfo.aura_chataction_endturn, auraInfo, token));
                
                let sourceToken = getObj("graphic", auraInfo.tokenId);
                if (auraInfo.aura_sourcevfx_onendturn && sourceToken) { playVFX(sourceToken, auraInfo.aura_sourcevfx_onendturn); }
                if (auraInfo.aura_targetvfx_onendturn && token) { playVFX(token, auraInfo.aura_targetvfx_onendturn); }
                
                if (auraInfo.aura_sound_onendturn) { playJukeboxTrack(auraInfo.aura_sound_onendturn); }
            }
        });
    }

    function cleanupDisabledAuras(newTokenObj, prevTokenObj) {
        if (!newTokenObj || !prevTokenObj) {
            return;
        }

        let pageId = newTokenObj.get("_pageid");
        let tokenId = newTokenObj.get("_id");
        let oldAuras = getOldAuraList(prevTokenObj, pageId, tokenId);
        let newAuras = getNewAuraList(newTokenObj, pageId, tokenId);

        // Find auras that existed before but don't exist now
        let disabledAuras = oldAuras.filter(function (oldAura) {
            return !newAuras.some(function (newAura) {
                return oldAura.aura_id === newAura.aura_id;
            });
        });

        // Clean up each disabled aura
        _.each(disabledAuras, function (disabledAura) {
            _.each(Array.from(tokensInAuras.entries()), function (entry) {
                let targetTokenId = entry[0];
                let auraSet = entry[1];

                if (!auraSet || !auraSet.has(disabledAura.aura_id)) {
                    return;
                }

                let targetToken = getObj("graphic", targetTokenId);
                if (!targetToken) {
                    return;
                }
                if (targetToken) {
                    processAuraExit(targetToken, disabledAura);
                }

                removeTokenFromAura(tokensInAuras, targetTokenId, disabledAura.aura_id);
            });
        });
    }

    function getOldAuraList(prevObj, pageId, tokenId) {
        let auras = [];
        let pageAuras = activeAuras[pageId];
        if (!pageAuras) {
            return auras;
        }

        // Filter for auras from this token
        return pageAuras.filter(function (aura) {
            return aura.tokenId === tokenId;
        });
    }

    function getNewAuraList(newTokenObj, pageId, tokenId) {
        let auras = [];
        let gmnotes = decodeAndStripHtmlSimple(newTokenObj.get("gmnotes"));
        let auraParsed = undefined;
        if (gmnotes) {
            try {
                auraParsed = JSON.parse(gmnotes);
            } catch (e) {
                // Invalid JSON, no auras
            }
        }

        // Check aura1
        if (newTokenObj.get("aura1_radius") !== 0) {
            let aura1Matches = getAurasByColor(auraParsed, newTokenObj.get("aura1_color"));
            _.each(aura1Matches, function (auraAction) {
                auras.push({
                    aura_id: tokenId + "_" + auraAction.color + "_" + (auraAction._jsonIndex !== undefined ? auraAction._jsonIndex : "0"),
                    name: auraAction.name,
                    aura_icon: auraAction.icon,
                    removeOnExit: (auraAction.removeOnExit !== undefined) ? auraAction.removeOnExit : true,
                    aura_chataction_exit: (auraAction.chatActionOnExit !== undefined) ? auraAction.chatActionOnExit : "",
                    auraTokenName: newTokenObj.get("name"),
                    auraName: auraAction.name
                });
            });
        }

        // Check aura2
        if (newTokenObj.get("aura2_radius") !== 0) {
            let aura2Matches = getAurasByColor(auraParsed, newTokenObj.get("aura2_color"));
            _.each(aura2Matches, function (auraAction) {
                auras.push({
                    aura_id: tokenId + "_" + auraAction.color + "_" + (auraAction._jsonIndex !== undefined ? auraAction._jsonIndex : "0"),
                    name: auraAction.name,
                    aura_icon: auraAction.icon,
                    removeOnExit: (auraAction.removeOnExit !== undefined) ? auraAction.removeOnExit : true,
                    aura_chataction_exit: (auraAction.chatActionOnExit !== undefined) ? auraAction.chatActionOnExit : "",
                    auraTokenName: newTokenObj.get("name"),
                    auraName: auraAction.name
                });
            });
        }

        return auras;
    }

    // Compares old aura IDs to new ones to identify which were disabled.
    // Uses aura_id for stable comparison.

    // Returns true if the given token (by id) is the source of at least one active aura on its page.
    function tokenHasActiveAura(tokenId) {
        let token = getObj("graphic", tokenId);
        if (!token) { return false; }
        let pageId = token.get("_pageid");
        let pageAuras = activeAuras[pageId];
        if (!pageAuras || pageAuras.length === 0) { return false; }
        return pageAuras.some(function (aura) {
            return aura.tokenId === tokenId && aura.aura_active;
        });
    }

    function getTokenActiveAuras(tokenId, pageId) {
        let pageAuras = activeAuras[pageId];
        if (!pageAuras || pageAuras.length === 0) {
            return [];
        }

        return pageAuras.filter(function (aura) {
            return aura.tokenId === tokenId && aura.aura_active;
        });
    }

    function initializeState() {
        if (APINAME == undefined || APINAME == "") {
            // Abort because APINAME isn't defined and we don't want to
            // mess up the game state object.
            return;
        }

        state[APINAME] = {
            module: APINAME,
            schemaVersion: APIVERSION,
            config: {},
        }

        // Set the defaults for configuration items.
        _.each(configSettings, function (item, key) {
            state[APINAME].config[key] = item.defaultValue;
        });
    }

    function getTokenCoordsPixel(token) {
        try {
            return { x: token.get("left"), y: token.get("top"), width: token.get("width") };
        } catch (error) {
            log(`${APINAME}: Error in getTokenCoordsPixel for token ID ${token.id}: ${error.message}`);
            return { x: 0, y: 0, width: 0 };
        }
    }

    function AddTokenStatusMarker(token, marker) {
        if (!token || typeof token.get !== "function" || !marker) {
            return;
        }
        let currentMarkers = token.get("statusmarkers");
        let markerList = currentMarkers ? currentMarkers.split(",") : [];
        if (!markerList.includes(marker)) {
            markerList.push(marker);
            token.set("statusmarkers", markerList.join(","));
        }
    }

    function RemoveTokenStatusMarker(token, marker) {
        if (!token || typeof token.get !== "function" || !marker) {
            return;
        }
        let currentMarkers = token.get("statusmarkers");
        let markerList = currentMarkers ? currentMarkers.split(",") : [];
        if (markerList.includes(marker)) {
            markerList = markerList.filter(m => m !== marker);
            token.set("statusmarkers", markerList.join(","));
        }
    }

    function isWithinAura(t1, t2, aura_radius) {
        const dx = t1.x - t2.x;
        const dy = t1.y - t2.y;

        const distanceSquared = dx * dx + dy * dy;

        const r1 = t1.width / 2;
        const r2 = t2.width / 2;
        const maxDistance = Math.floor(r2 + aura_radius + r1);

        return distanceSquared < (maxDistance * maxDistance);
    }

    function isWithinSquareAura(t1, t2, aura_radius) {
        const r1 = t1.width / 2;
        const r2 = t2.width / 2;

        const auraLeft = t2.x - r2 - aura_radius;
        const auraRight = t2.x + r2 + aura_radius;
        const auraTop = t2.y - r2 - aura_radius;
        const auraBottom = t2.y + r2 + aura_radius;

        const closestX = Math.max(auraLeft, Math.min(t1.x, auraRight));
        const closestY = Math.max(auraTop, Math.min(t1.y, auraBottom));

        const dx = t1.x - closestX;
        const dy = t1.y - closestY;

        return (dx * dx + dy * dy) < (r1 * r1);
    }

    function decodeAndStripHtmlSimple(input) {
        if (typeof input !== "string") {
            return "";
        }

        let decoded = input;

        try {
            decoded = decodeURIComponent(input);
        } catch (e) {
            decoded = input;
        }

        decoded = decoded.replace(/<[^>]*>/g, "");

        const htmlEntities = {
            nbsp: " ",
            amp: "&",
            lt: "<",
            gt: ">",
            quot: '"',
            apos: "'",
            "#39": "'"
        };

        decoded = decoded.replace(/&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity) => {
            const lower = entity.toLowerCase();

            if (htmlEntities[lower] !== undefined) {
                return htmlEntities[lower];
            }

            if (lower.startsWith("#x")) {
                const code = parseInt(lower.slice(2), 16);
                return isNaN(code) ? "" : String.fromCharCode(code);
            }

            if (lower.startsWith("#")) {
                const code = parseInt(lower.slice(1), 10);
                return isNaN(code) ? "" : String.fromCharCode(code);
            }

            return "";
        });

        return decoded;
    }

    function NewGetAttrByName(characterId, attrName, valueType) {
        if (!characterId || !attrName) {
            return undefined;
        }

        let attrs = findObjs({
            _type: "attribute",
            _characterid: characterId
        }) || [];

        let targetName = String(attrName).toLowerCase();
        let attrObj = attrs.find(function (attr) {
            let name = attr.get("name");
            return name && String(name).toLowerCase() === targetName;
        });

        if (!attrObj) {
            return undefined;
        }

        if (valueType && String(valueType).toLowerCase() === "max") {
            return attrObj.get("max");
        }

        return attrObj.get("current");
    }

    function getAurasByColor(auras, color) {
        if (!Array.isArray(auras)) {
            return [];
        }

        return auras.map((a, index) => a.color === color ? Object.assign({}, a, { _jsonIndex: index }) : null).filter(a => a !== null);
    }

    function ensureTokenAuraSet(state, tokenId) {
        if (!state.has(tokenId)) {
            state.set(tokenId, new Set());
        }
        return state.get(tokenId);
    }

    function addTokenToAura(state, tokenId, auraId) {
        const auraSet = ensureTokenAuraSet(state, tokenId);
        auraSet.add(auraId);
    }

    function removeTokenFromAura(state, tokenId, auraId) {
        const auraSet = state.get(tokenId);
        if (!auraSet) {
            return;
        }

        auraSet.delete(auraId);

        if (auraSet.size === 0) {
            state.delete(tokenId);
        }
    }

    function removeTokenFromAllAuras(state, tokenId) {
        if (!state.has(tokenId)) {
            return;
        }

        state.delete(tokenId);
    }

    function isTokenInAuraSet(state, tokenId, auraId) {
        const auraSet = state.get(tokenId);
        return auraSet ? auraSet.has(auraId) : false;
    }

    function updateTokenAuraMembership(state, tokenId, auraId, isCurrentlyInside) {
        const wasInside = isTokenInAuraSet(state, tokenId, auraId);

        if (isCurrentlyInside && !wasInside) {
            addTokenToAura(state, tokenId, auraId);
            return "enter";
        }

        if (!isCurrentlyInside && wasInside) {
            removeTokenFromAura(state, tokenId, auraId);
            return "exit";
        }

        if (isCurrentlyInside && wasInside) {
            return "inside";
        }

        return "none";
    }

    function replaceVariables(text, auraInfo, token) {
        if (typeof text !== "string") {
            return "";
        }

        if (!token || typeof token.get !== "function" || !auraInfo) {
            return text;
        }

        const result = replaceTemplateVars(text, {
            TNAME: token.get("name"),
            ANAME: auraInfo.auraName,
            ATNAME: auraInfo.auraTokenName,
            TID: token.get("_id"),
            ATID: auraInfo.tokenId
        });

        return result;
    }

    function replaceTemplateVars(text, values) {
        if (typeof text !== "string") {
            return "";
        }

        if (!values || typeof values !== "object") {
            return text;
        }

        return text.replace(/\[([A-Z0-9_]+)\]/gi, (match, key) => {
            const normalizedKey = key.toUpperCase();

            if (Object.prototype.hasOwnProperty.call(values, normalizedKey)) {
                const value = values[normalizedKey];
                return value === null || value === undefined ? "" : String(value);
            }

            return match;
        });
    }

    function playJukeboxTrack(trackname) {
        if (!trackname) {
            return;
        }
        let trackList = findObjs({ type: 'jukeboxtrack', title: trackname });
        let track = (trackList && Array.isArray(trackList) && trackList.length > 0) ? trackList[0] : null;
        if (track && typeof track.set === "function") {
            track.set('softstop', false);
            track.set('playing', true);
        } else {
            log(`${APINAME}: Jukebox track ${trackname} not found in game.`);
        }
    }

    function playVFX(token, vfx) {
        try {
            if (!token || typeof token.get !== "function" || !vfx) {
                return;
            }

            if (token) {
                var x = token.get("left");
                var y = token.get("top");
                var pid = token.get("_pageid");
                if (vfx.toLowerCase() == "ping" || vfx.toLowerCase() == "pingall") {
                    sendPing(x, y, pid, APINAME, (vfx.toLowerCase() == "pingall"));
                } else {
                    let effectInfo = findObjs({
                        _type: "custfx",
                        name: vfx.trim()
                    });
                    if (!_.isEmpty(effectInfo)) {
                        spawnFxWithDefinition(x, y, effectInfo[0].get('definition'), pid);
                    } else {
                        let t = vfx.trim();
                        if (t !== "" && t !== "none") {
                            spawnFx(x, y, t, pid);
                        }
                    }
                }
            }

        } catch (e) {
            log(`${APINAME}: Error creating VFX ${e.message} ${vfx}`)
        }
    }


})();

// Meta marker for the end of AuraTriggers
{ try { throw new Error(''); } catch (e) { API_Meta.AuraTriggers.lineCount = (parseInt(e.stack.split(/\n/)[1].replace(/^.*:(\d+):.*$/, '$1'), 10) - API_Meta.AuraTriggers.offset); } }

// Support for AirBag Crash Handler (if installed)
if (typeof MarkStop === "function") MarkStop('AuraTriggers');
