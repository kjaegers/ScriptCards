on("ready", function() {
    var d = new Date();
    var html = "<table border=2 width=100%><tr><td bgcolor=goldenrod colspan=2 align=center><font color=black><strong>API Sandbox Alert</strong></font></td></tr>";
    html += `<tr><td colspan=2>The API Sandbox has started or restarted (${d.toDateString()} ${d.toTimeString()}). If this is unexpected, it is likely that your sandbox crashed. `;
    html += "If that is the case, it is recommended that you manually restart the sandbox, as API scripts running in your game are/will become ";
    html += "unstable.<br /><br /><strong>NOTE:</strong> This is expected behavior if you just launched your game or made updates to your running API ";
    html += "scripts.";
    html += "</td></tr></table>";

    sendChat("PCMHelper:", "/w gm " + html);
})