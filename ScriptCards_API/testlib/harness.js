'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { createRoll20Environment } = require('./roll20-mock');

const SCRIPT_PATH = path.join(__dirname, '..', 'scriptcards.js');
const SOURCE = fs.readFileSync(SCRIPT_PATH, 'utf8');

// Waits for a dispatched chat message to finish being processed. scriptcards.js handles
// 'chat:message' fire-and-forget (it queues the message and kicks off an async processor
// without returning/awaiting that promise), so there's no promise to await here directly.
// Instead this polls chatCalls until it stops growing for a short quiet period, bounded by
// an overall timeout so a script that legitimately produces no output (e.g. --#hidecard|1)
// doesn't hang the test.
async function waitForIdle(env, { timeoutMs = 1000, quietMs = 25 } = {}) {
	const start = Date.now();
	let lastCount = env.chatCalls.length;
	let lastChangeAt = start;
	for (;;) {
		await new Promise((resolve) => { setImmediate(resolve); });
		const now = Date.now();
		if (env.chatCalls.length !== lastCount) {
			lastCount = env.chatCalls.length;
			lastChangeAt = now;
		} else if (now - lastChangeAt >= quietMs) {
			return;
		}
		if (now - start >= timeoutMs) { return; }
	}
}

/**
 * Loads a fresh copy of scriptcards.js into its own vm context (own Roll20Store, own state,
 * own `scriptCardsStashedScripts`, etc.) so tests never leak state into one another.
 *
 * @param {object} [envOptions] - forwarded to createRoll20Environment (rollQueue, players, ...)
 */
async function loadScriptCards(envOptions = {}) {
	const env = createRoll20Environment(envOptions);
	const context = vm.createContext(env.sandbox);
	const script = new vm.Script(SOURCE, { filename: 'scriptcards.js' });
	script.runInContext(context);

	// Roll20 fires 'ready' once on sandbox startup; scriptcards.js only registers its
	// 'chat:message' handler inside that callback, so it must run before anything else.
	env.dispatch('ready');

	/**
	 * Simulates a player sending an API chat command (e.g. `!script {{ ... }}` or
	 * `!sc-resume ...`) and waits for ScriptCards to finish reacting to it.
	 *
	 * @param {string} content - the raw chat message text
	 * @param {object} [overrides] - overrides for the Roll20 msg object (who, playerid, ...)
	 * @returns {Promise<Array<{from: string, message: string}>>} sendChat() calls made while
	 *   handling this message
	 */
	async function sendApi(content, overrides = {}) {
		const before = env.chatCalls.length;
		const msg = {
			type: 'api',
			content,
			who: 'Test User',
			playerid: 'player-1',
			selected: [],
			target: [],
			...overrides,
		};
		env.dispatch('chat:message', msg);
		await waitForIdle(env);
		return env.chatCalls.slice(before);
	}

	return { env, sendApi };
}

// Strips HTML tags and collapses whitespace, so assertions can check the visible text of a
// rendered card without hard-coding its markup/styling.
function stripHtml(html) {
	return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

module.exports = { loadScriptCards, stripHtml };
