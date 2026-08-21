'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadScriptCards, stripHtml } = require('../testlib/harness');

// Extracts the "!sc-resume GUID-|-..." command embedded in an --i line's whispered button,
// exactly as a player's click would send it back to the API - except a real Roll20 client
// would have already resolved any ?{...} query / &#64;{target|...} placeholders in that
// command into the player's answer before sending (the --i handler HTML-entity-encodes the
// "@" as &#64; so Roll20's own attribute-substitution pass doesn't touch it first). Tests
// substitute those placeholders themselves.
function extractResumeCommand(message) {
	const match = message.match(/href="(!sc-resume [^"]+)"/);
	assert.ok(match, `expected an --i button with an !sc-resume href in: ${message}`);
	return match[1];
}

describe('Information Requests (--i)', () => {
	test('whispers the prompt and button, and hides the card for that pass', async () => {
		const { sendApi } = await loadScriptCards();
		const calls = await sendApi('!script {{ --iNeed more info;Click Me|q;UserName;What is your name? }}');

		// --i sets cardParameters.hidecard = "1" internally, so the only chat traffic this
		// pass produces is the whisper with the response button - no separate /desc card.
		assert.equal(calls.length, 1);
		assert.match(calls[0].message, /^\/w Test User/);
		assert.match(stripHtml(calls[0].message), /Need more info/);
		assert.match(stripHtml(calls[0].message), /Click Me/);
		assert.match(calls[0].message, /href="!sc-resume [^"]+-\|-UserName;\?\{What is your name\?\}"/);
	});

	test('formats the prompt text as bold when formatinforequesttext is enabled', async () => {
		const { sendApi } = await loadScriptCards();
		const calls = await sendApi('!script {{ --#formatinforequesttext|1 --i[b]Need more info[/b];Click Me|q;UserName;What is your name? }}');
		assert.match(calls[0].message, /<strong>Need more info<\/strong>|<b>Need more info<\/b>/);
	});

	test('resuming via !sc-resume stores the answer and continues the script', async () => {
		const { sendApi } = await loadScriptCards();
		const first = await sendApi(`!script {{
--iWhat is your name?;Click Me|q;UserName;What is your name?
--+You said|[&UserName]
}}`);
		const resumeCommand = extractResumeCommand(first[0].message)
			.replace(/\?\{[^}]*\}/, 'Fred');

		const second = await sendApi(resumeCommand);
		assert.equal(second.length, 1);
		assert.match(stripHtml(second[0].message), /You said\s+Fred/);
	});

	test('a target (t;) request resolves to the selected token id on resume', async () => {
		const { env, sendApi } = await loadScriptCards();
		const token = env.store.create('graphic', { name: 'Goblin' });

		const first = await sendApi(`!script {{
--iPick a target;Click Me|t;ChosenToken;Enemy
--+Target was|[&ChosenToken]
}}`);
		// Real Roll20 substitutes @{target|Enemy|token_id} for the id of whatever token the
		// player clicked on; simulate that resolution the same way the client would.
		const resumeCommand = extractResumeCommand(first[0].message)
			.replace(/&#64;\{target\|[^}]*\}/, token.id);

		const second = await sendApi(resumeCommand);
		assert.equal(env.logs.filter((l) => /error/i.test(l)).length, 0);
		assert.match(stripHtml(second[0].message), new RegExp(`Target was\\s+${token.id}`));
	});

	test('multiple stacked requests (t + q, joined by ||) all resolve on resume', async () => {
		const { env, sendApi } = await loadScriptCards();
		const token = env.store.create('graphic', { name: 'Goblin' });

		const first = await sendApi(`!script {{
--iNeed a target and a name;Click Me|t;ChosenToken;Enemy||q;UserName;What is your name?
--+Target|[&ChosenToken]
--+Name|[&UserName]
}}`);
		const resumeCommand = extractResumeCommand(first[0].message)
			.replace(/&#64;\{target\|[^}]*\}/, token.id)
			.replace(/\?\{[^}]*\}/, 'Fred');

		const second = await sendApi(resumeCommand);
		const text = stripHtml(second[0].message);
		assert.match(text, new RegExp(`Target\\s+${token.id}`));
		assert.match(text, /Name\s+Fred/);
	});
});
