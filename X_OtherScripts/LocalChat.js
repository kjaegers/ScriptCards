const localchat = (() => {
    on("ready", function() {
        on('chat:message', function (msg) {
            if (msg.type === "api") {
                if (msg.content.toLowerCase().startsWith("!localchat ")) {
                    var messageContent = msg.content.substring(11);
                    var sender = getObj("player", msg.playerid) || undefined;
                    if (sender) {
                        var sendPage = findPageIDForPlayer(msg.playerid);
                        allPlayers = findObjs({type:'player'});
                        _.each(allPlayers,function(p){
                            log(findPageIDForPlayer(p.id));
                            if (sendPage == findPageIDForPlayer(p.id)) {
                                WhisperTarget = p.get("displayname");
                                sendChat(msg.who, `/w "${WhisperTarget}" ${messageContent}`);
                            }
                        });
                    }
                }
            }
        })
    })

    function findPageIDForPlayer(playerid) {
        var playerPage = Campaign().get("playerpageid");
        var playerspecificpages = Campaign().get("playerspecificpages");
        if (playerspecificpages[playerid]) {
            playerPage = playerspecificpages[playerid]
        }
        return playerPage;
    }
})();
