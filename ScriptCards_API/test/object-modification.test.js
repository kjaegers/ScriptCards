'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadScriptCards, stripHtml } = require('../testlib/harness');

describe('object creation (--!o...)', () => {
	test('--!oc:Var|Name creates a character and stores its id in Var', async () => {
		const { env, sendApi } = await loadScriptCards();
		const calls = await sendApi('!script {{ --!oc:NewCharId|TestHero --+|[&NewCharId] }}');

		assert.equal(env.logs.filter((l) => /error/i.test(l)).length, 0);

		const characters = env.store.find({ type: 'character' });
		assert.equal(characters.length, 1);
		assert.equal(characters[0].get('name'), 'TestHero');

		// The id echoed into the card should be the same id the mock store assigned.
		assert.match(stripHtml(calls[0].message), new RegExp(characters[0].id));
	});
});
