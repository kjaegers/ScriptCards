'use strict';

// A minimal stand-in for the Roll20 API sandbox. scriptcards.js is written to run inside
// that sandbox and refers to globals like `on`, `sendChat`, `getObj`, `_`, etc. without ever
// importing them. This module builds an object graph that can be handed to Node's `vm` module
// as a context, so the real script file can be executed unmodified and observed from outside.
//
// It is deliberately not a full Roll20 emulator - only the pieces scriptcards.js actually
// touches are implemented with real behavior (events, chat, a generic in-memory object store,
// state, and the handful of underscore functions the script calls). Anything else it reaches
// for is auto-stubbed as a no-op function so the script never crashes on a missing global; add
// real behavior here as tests need it.

let uidCounter = 1;
function nextId(prefix) {
	return `${prefix}-${uidCounter++}`;
}

// scriptcards.js mixes `type`/`_type`, `id`/`_id`, `characterid`/`_characterid`, etc. when
// building findObjs() filters and reading properties. Roll20 accepts both forms, so property
// access here strips a leading underscore before touching the backing store.
function normalizeKey(key) {
	return key.charAt(0) === '_' ? key.slice(1) : key;
}

function makeRoll20Object(store, type, props) {
	const data = { ...props };
	data.type = type;
	if (!data.id) { data.id = nextId(type); }

	const obj = {
		id: data.id,
		get(prop, callback) {
			const value = data[normalizeKey(prop)];
			if (typeof callback === 'function') {
				// Roll20 fetches a couple of large fields (notes/gmnotes) asynchronously.
				setImmediate(() => callback(value));
				return undefined;
			}
			return value;
		},
		set(prop, value) {
			if (prop !== null && typeof prop === 'object') {
				Object.entries(prop).forEach(([key, val]) => { data[normalizeKey(key)] = val; });
			} else {
				data[normalizeKey(prop)] = value;
			}
		},
		remove() {
			store.objects.delete(data.id);
		},
	};
	Object.defineProperty(obj, '_data', { value: data, enumerable: false });
	return obj;
}

class Roll20Store {
	constructor() {
		this.objects = new Map();
	}

	create(type, props = {}) {
		const obj = makeRoll20Object(this, type, props);
		this.objects.set(obj.id, obj);
		return obj;
	}

	getById(type, id) {
		const obj = this.objects.get(id);
		if (!obj) { return undefined; }
		if (type && obj._data.type !== type) { return undefined; }
		return obj;
	}

	find(filter) {
		const entries = Object.entries(filter || {});
		return [...this.objects.values()].filter((obj) => entries.every(
			([key, value]) => obj._data[normalizeKey(key)] === value,
		));
	}

	filter(predicate) {
		return [...this.objects.values()].filter(predicate);
	}

	all() {
		return [...this.objects.values()];
	}
}

// The real underscore.js library, trimmed to exactly the functions scriptcards.js calls
// (isFunction, each, has, isEmpty, reduce, chain->reduce->value). If the script grows to use
// more of underscore's surface, extend this rather than reaching for the npm package - keeping
// this dependency-free is what lets the whole test suite run with zero `npm install`.
function makeUnderscore() {
	const _ = {};
	_.isFunction = (value) => typeof value === 'function';
	_.has = (obj, key) => obj != null && Object.prototype.hasOwnProperty.call(obj, key);
	_.isEmpty = (obj) => {
		if (obj == null) { return true; }
		if (Array.isArray(obj) || typeof obj === 'string') { return obj.length === 0; }
		if (typeof obj === 'object') { return Object.keys(obj).length === 0; }
		return true;
	};
	_.each = (list, iteratee) => {
		if (Array.isArray(list)) { list.forEach(iteratee); }
		else if (list && typeof list === 'object') { Object.keys(list).forEach((k) => iteratee(list[k], k, list)); }
	};
	_.reduce = (list, iteratee, memo) => {
		if (Array.isArray(list)) { return list.reduce((m, v, i) => iteratee(m, v, i), memo); }
		if (list && typeof list === 'object') { return Object.keys(list).reduce((m, k) => iteratee(m, list[k], k), memo); }
		return memo;
	};
	_.chain = (value) => {
		let current = value;
		const wrapper = {
			reduce(iteratee, memo) { current = _.reduce(current, iteratee, memo); return wrapper; },
			value() { return current; },
		};
		return wrapper;
	};
	return _;
}

/**
 * @param {object} [options]
 * @param {number[]} [options.rollQueue] - preset randomInteger() results, consumed in order,
 *   so dice-dependent tests are deterministic. Falls back to Math.random-based rolls once empty.
 * @param {Array<object>} [options.players] - player fixtures to seed the store with
 *   ({id, displayname, color, speakingas, isgm}). Defaults to a single GM player 'player-1'.
 * @param {boolean} [options.verbose] - echo log()/sendChat() calls to the real console
 */
function createRoll20Environment(options = {}) {
	const store = new Roll20Store();
	const state = {};
	const chatCalls = [];
	const logs = [];
	const pings = [];
	const fx = [];
	const jukebox = [];
	const eventHandlers = {};
	const rollQueue = Array.isArray(options.rollQueue) ? options.rollQueue.slice() : [];

	function on(event, handler) {
		(eventHandlers[event] = eventHandlers[event] || []).push(handler);
	}
	function off(event, handler) {
		if (!eventHandlers[event]) { return; }
		eventHandlers[event] = eventHandlers[event].filter((h) => h !== handler);
	}
	function dispatch(event, ...args) {
		(eventHandlers[event] || []).forEach((handler) => handler(...args));
	}

	function randomInteger(max) {
		if (rollQueue.length > 0) { return rollQueue.shift(); }
		return Math.floor(Math.random() * max) + 1;
	}

	function generateUUID() {
		return `test-uuid-${uidCounter++}`;
	}

	function log(...args) {
		const line = args.length === 1 ? args[0] : args.map(String).join(' ');
		logs.push(line);
		if (options.verbose) { console.log('[ScriptCards]', line); } // eslint-disable-line no-console
	}

	function sendChat(from, message, callback) {
		chatCalls.push({ from, message });
		if (typeof callback === 'function') { callback([]); }
	}

	function getObj(type, id) { return store.getById(type, id); }
	function createObj(type, props) { return store.create(type, props); }
	function findObjs(filter) { return store.find(filter); }
	function filterObjs(predicate) { return store.filter(predicate); }
	function getAllObjs() { return store.all(); }

	function playerIsGM(id) {
		const player = store.getById('player', id);
		return !!(player && player.get('isgm'));
	}

	function Campaign() {
		return {
			get(prop) {
				if (prop === 'token_markers') { return JSON.stringify(options.tokenMarkers || []); }
				return undefined;
			},
		};
	}

	const players = options.players || [
		{ id: 'player-1', displayname: 'Test User', color: '#ff0000', speakingas: 'Test User', isgm: true },
	];
	players.forEach((p) => store.create('player', p));

	// Standard JS built-ins, taken from this (outer) realm. A vm context normally gets its own
	// fresh copies of these auto-installed by V8, but that auto-install is keyed on the global
	// object not already claiming the property - and our catch-all `has` trap below always
	// answers "yes" (so arbitrary Roll20 globals resolve instead of throwing ReferenceError),
	// which as a side effect tells V8 these already exist. So they're supplied explicitly here
	// instead. Reusing the outer realm's constructors (rather than context-native ones) is safe
	// here because the script never round-trips objects across a realm boundary.
	const builtins = {
		Object, Array, Function, String, Number, Boolean, Symbol,
		Error, TypeError, RangeError, SyntaxError, ReferenceError, EvalError, URIError,
		RegExp, Date, Math, JSON, Map, Set, WeakMap, WeakSet, Promise, Proxy, Reflect,
		ArrayBuffer, Uint8Array, Int32Array, Float64Array,
		parseInt, parseFloat, isNaN, isFinite,
		encodeURIComponent, decodeURIComponent, encodeURI, decodeURI,
		console, setTimeout, clearTimeout, setInterval, clearInterval, setImmediate, clearImmediate,
		NaN, Infinity, undefined,
	};

	const target = {
		...builtins,
		on,
		off,
		log,
		sendChat,
		getObj,
		createObj,
		findObjs,
		filterObjs,
		getAllObjs,
		Campaign,
		state,
		_: makeUnderscore(),
		randomInteger,
		generateUUID,
		playerIsGM,
		toFront() {},
		toBack() {},
		sendPing(...args) { pings.push(args); },
		spawnFx(...args) { fx.push({ kind: 'spawnFx', args }); },
		spawnFxWithDefinition(...args) { fx.push({ kind: 'spawnFxWithDefinition', args }); },
		spawnFxBetweenPoints(...args) { fx.push({ kind: 'spawnFxBetweenPoints', args }); },
		playJukeboxPlaylist(...args) { jukebox.push(args); },
	};

	// Any global the script reaches for that isn't explicitly modeled above becomes a
	// no-op stub the first time it's touched, instead of throwing ReferenceError. This is
	// what lets a 16k-line Roll20 script load without having to catalog every API call site.
	const sandbox = new Proxy(target, {
		has() { return true; },
		get(t, prop) {
			if (prop in t) { return t[prop]; }
			if (typeof prop === 'symbol') { return undefined; }
			const stub = () => undefined;
			t[prop] = stub;
			return stub;
		},
	});

	return {
		sandbox,
		store,
		state,
		chatCalls,
		logs,
		pings,
		fx,
		jukebox,
		rollQueue,
		dispatch,
	};
}

module.exports = { createRoll20Environment };
