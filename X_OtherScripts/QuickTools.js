// QuickTest.js - A collection of small utilities. These were written over time as I was working on other
//                scripts, generally to get information for what I was working on for something else.
//                They are not really very good code, but someone might find them helpful
//
// !gettoks - dumps information about every token in the game to the API log
// !getplayers - dumps information about every token in the game to the API log
// !getchars - dumps information about every character in the game to the API log
// !liststatusmarkers - dumps the name and image url for all defined status markers to the API log
// !crashsandbox - No surprise here... intentionally crash the sandbox :)
// !dumpdice # - Display all of the characters in the dice font (# is the dice sides) to chat (ie, !dumpdice 10)
// !clearchat - Writes a bunch of linebreaks to the chat window to push the current contents off the top
// !rolltable tablename - Rolls on the specified table and outputs the result (respects weighting)
// !turnorder - dumps information on the entries in the turn tracker to the API log

const QuickTest = (() => {
    on('chat:message', function (msg) {
        if (msg.type === "api") {
            var apiCmdText = msg.content.toLowerCase();
            var processThisAPI = false;

            if (apiCmdText.startsWith("!gettoks")) {
                log("In Get Toks");
                findObjs({ _type: "graphic" }).forEach((item) => {
                    log(`Name:${item.get("name")}, ID:${item.id}, Represents:${item.get("represents")}`);
                });
            }

            if (apiCmdText.startsWith("!getplayers")) {
                findObjs({ _type: "player" }).forEach((item) => {
                    log(`Name:${item.get("displayname")}, ID:${item.id}, UserID: ${item.get("_d20userid")}`);
                });
            }

            if (apiCmdText.startsWith("!getchars")) {
                findObjs({ _type: "character" }).forEach((item) => {
                    log(`Name:${item.get("name")}, ID:${item.id}, Controlledby:${item.get("controlledby")}`);
                });
            }

            if (apiCmdText.startsWith("!liststatusmarkers")) {
                const tokenMarkers = JSON.parse(Campaign().get("token_markers"));
                for (var x = 0; x < tokenMarkers.length; x++) {
                    log(`Name: ${tokenMarkers[x].name}, URL: ${tokenMarkers[x].url}`);
                }
            }

            if (apiCmdText.startsWith("!crashsandbox")) {
                var crash = null;
                log(crash.ToString());
            }

            if (apiCmdText.startsWith("!dumpdice ")) {
                var dicetype = apiCmdText.substring(10).trim();
                sendChat("", "<span style='color: blue; font-size:30px; font-family: dicefontd" + dicetype + ";'>abcdefghijklknopqrstuvwxyz0123456789-=[]{};:'?</span>")
            }

            if (apiCmdText.startsWith("!clearchat")) {
                log("clearing chat...");
                sendChat("", "<br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br>")
            }

            if (apiCmdText.startsWith("!rolltable ")) {
                var table = msg.content.substring(11).trim();
                sendChat("", rollOnRollableTable(table));
            }

            if (apiCmdText.startsWith("!getallattrs")) {
                var token = msg.selected[0]
                var charid
                var char = undefined
                if (token !== undefined) {
                    var actualToken = getObj("graphic", token._id);
                    charid = actualToken.get("represents");
                    char = getObj("character", charid);
                }                
                findObjs({ type: "attribute", characterid: charid }).forEach((item) => {
                    log(`Name:${item.get("name")}, ID:${item.id}, Character:${item.get("characterid")}`);
                });
            }

            if (apiCmdText.startsWith("!getbeaconattr")) {
                var token = msg.selected[0]
                log("=== Beacon Attributes ===");
                var charid
                var char = undefined
                if (token !== undefined) {
                    var actualToken = getObj("graphic", token._id);
                    charid = actualToken.get("represents");
                    char = getObj("character", charid);
                }
                var splits = apiCmdText.substring(15).trim().split(" ");
                var attrname = splits[0];
                var attr = findObjs({ type: "attribute", _characterid: charid, name: attrname })[0]
                for (let x=1; x<splits.length; x++) {
                    attr = attr[splits[x]];
                }
                for (var key in attr) {
                    if (typeof attr[key] !== "function" && typeof attr[key] == "object") {
                        log(`Attribute: ${key} - [Sub Object]`);
                    }
                    if (typeof attr[key] !== "function" && typeof attr[key] != "object") {
                        log(`Attribute: ${key} = ${attr[key]}`);
                    }
                }
            }

            if (apiCmdText.startsWith("!ability ")) {
                var token = msg.selected[0]
                var charid
                var char = undefined
                if (token !== undefined) {
                    var actualToken = getObj("graphic", token._id);
                    charid = actualToken.get("represents");
                    char = getObj("character", charid);
                }
                var abilname = apiCmdText.substring(9).trim();
                var ability = findObjs({ type: "ability", _characterid: charid, name: abilname })[0]
                var action = ability.get('action').replace(/@\{([^|]*?|[^|]*?\|max|[^|]*?\|current)\}/g, '@{' + (char.get('name')) + '|$1}');
                action = `{& select ${charid}} ${action}`
                log(action)
                sendChat(char.get("name"), action);
            }

            if (apiCmdText.startsWith("!turnorder")) {
                var turnorder = JSON.parse(Campaign().get("turnorder"));
                log(turnorder);
            }

            if (apiCmdText.startsWith("!getallattributes")) {
                var charid
                if (token !== undefined) {
                    var actualToken = getObj("graphic", token._id);
                    charid = actualToken.get("represents") || undefined;
                }
                if (charid) { log(findObjs({ type: "attribute", _characterid: charid })); }
            }
        }
    })

    function rollOnRollableTable(tableName) {
        var theTable = findObjs({ type: "rollabletable", name: tableName })[0];
        if (theTable) {
            var tableItems = findObjs({ type: "tableitem", _rollabletableid: theTable.id });
            if (tableItems !== undefined) {
                var rollResults = {};
                var rollIndex = 0;
                var lastRollIndex = 0;
                var itemCount = 0;
                var maxRoll = 0;
                tableItems.forEach(function (item) {
                    var thisWeight = parseInt(item.get("weight"));
                    rollIndex += thisWeight;
                    for (var x = lastRollIndex + 1; x <= rollIndex; x++) {
                        rollResults[x] = itemCount;
                    }
                    itemCount += 1;
                    maxRoll += thisWeight;
                    lastRollIndex += thisWeight;
                });
                var tableRollResult = randomInteger(maxRoll);
                return tableItems[rollResults[tableRollResult]].get("name");
            } else {
                return "";
            }
        }
        return "";
    }
})();