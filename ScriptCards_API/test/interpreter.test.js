'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadScriptCards, stripHtml } = require('../testlib/harness');

describe('output & variables', () => {
	test('a basic --+ output line renders its content', async () => {
		const { sendApi } = await loadScriptCards();
		const calls = await sendApi('!script {{ --+|Hello World }}');
		assert.equal(calls.length, 1);
		assert.match(stripHtml(calls[0].message), /Hello World/);
	});

	test('--/ comment lines are skipped entirely', async () => {
		const { env, sendApi } = await loadScriptCards();
		const calls = await sendApi('!script {{ --/|this should not appear --+|Visible }}');
		assert.equal(env.logs.filter((l) => /error/i.test(l)).length, 0);
		const text = stripHtml(calls[0].message);
		assert.match(text, /Visible/);
		assert.doesNotMatch(text, /this should not appear/);
	});

	test('string variables assign and append (+) correctly', async () => {
		const { sendApi } = await loadScriptCards();
		const calls = await sendApi('!script {{ --&Greeting|Hello --&Greeting|+, World --+|[&Greeting] }}');
		assert.match(stripHtml(calls[0].message), /Hello, World/);
	});
});

describe('dice rolling', () => {
	test('randomInteger is deterministic via the mock roll queue, and .Raw is the numeric total', async () => {
		// 1d20+1000 with a preset die result of 7 must total exactly 1007 - a value unlikely
		// to appear anywhere else in the card's boilerplate HTML, so it's safe to search for.
		const { sendApi } = await loadScriptCards({ rollQueue: [7] });
		const calls = await sendApi('!script {{ --=Attack|1d20+1000 --+Total|[$Attack.Raw] }}');
		assert.match(stripHtml(calls[0].message), /\b1007\b/);
	});
});

describe('branching', () => {
	test('case statement (--c) jumps to the matching label', async () => {
		// NB: --<| only returns from a real -->GOSUB call; it's a no-op after a plain --c/--^
		// jump, so falling through to it here would *not* stop execution at "You picked B" -
		// hence the explicit --^Done| jumps instead of following the older --<| pattern.
		const { env, sendApi } = await loadScriptCards();
		const calls = await sendApi(`!script {{
--&Choice|B
--c[&Choice]|A:GoA|B:GoB|C:GoC
--X|
--:GoA|
--+|You picked A
--^Done|
--:GoB|
--+|You picked B
--^Done|
--:GoC|
--+|You picked C
--:Done|
}}`);
		assert.equal(env.logs.filter((l) => /error/i.test(l)).length, 0);
		const text = stripHtml(calls[0].message);
		assert.match(text, /You picked B/);
		assert.doesNotMatch(text, /You picked A/);
		assert.doesNotMatch(text, /You picked C/);
	});

	test('GOSUB (--> / --<) calls a procedure and returns with a positional parameter', async () => {
		const { env, sendApi } = await loadScriptCards();
		const calls = await sendApi(`!script {{
--&Name|World
-->SayHello|[&Name]
--+After the call|We're back
--X|
--:SayHello|
--+Hello|[%1%]
--<|
}}`);
		assert.equal(env.logs.filter((l) => /error/i.test(l)).length, 0);
		const text = stripHtml(calls[0].message);
		assert.match(text, /Hello.*World/);
		assert.match(text, /After the call.*We're back/);
	});

	test('GOSUB to an undefined label logs an error instead of jumping', async () => {
		const { env, sendApi } = await loadScriptCards();
		await sendApi('!script {{ -->NoSuchProcedure| }}');
		assert.ok(env.logs.some((l) => /Label NoSuchProcedure is not defined/.test(l)));
	});
});

describe('loops', () => {
	test('numeric fornext loop (--%Var|Start;End;Step)', async () => {
		const { sendApi } = await loadScriptCards();
		const calls = await sendApi('!script {{ --%i|1;10;2 --+Value|[&i] --%| }}');
		const text = stripHtml(calls[0].message);
		for (const n of [1, 3, 5, 7, 9]) {
			assert.match(text, new RegExp(`\\b${n}\\b`));
		}
		assert.doesNotMatch(text, /\b(2|4|6|8|10)\b/);
	});

	test('foreach loop (--%Var|foreach;ArrayName) visits every element in order', async () => {
		const { sendApi } = await loadScriptCards();
		const calls = await sendApi(`!script {{
--~|array;define;Fruits;Apple;Banana;Cherry
--%f|foreach;Fruits
--+|[&f]
--%|
}}`);
		const text = stripHtml(calls[0].message);
		const applePos = text.indexOf('Apple');
		const bananaPos = text.indexOf('Banana');
		const cherryPos = text.indexOf('Cherry');
		assert.ok(applePos >= 0 && bananaPos > applePos && cherryPos > bananaPos, `expected Apple, Banana, Cherry in order; got: ${text}`);
	});
});
