/**
 * @file make-routes.js
 * @author tartpvule
 * @license MIT
 * @version 1
 *
 * Usage:
 *  node make-routes.js resolvers.md relays.md resolvers_metadata.json relays_metadata.json
 */
// @ts-check
'use strict';

const CONFIG_MUST_NOT_BE_SAME = ['locations', 'entities'];
const CONFIG_MUST_BE_SAME = [];

const fs = require('fs');
const parsers = require('./parsers.js');

let resolvers_md_content = fs.readFileSync(process.argv[2], {
	encoding: 'utf8'
});
let resolvers_md = parsers.parseMD(resolvers_md_content);
let relays_md_content = fs.readFileSync(process.argv[3], {
	encoding: 'utf8'
});
let relays_md = parsers.parseMD(relays_md_content);

let resolvers_json_content = fs.readFileSync(process.argv[4], {
	encoding: 'utf8'
});
let resolvers_json = JSON.parse(resolvers_json_content);
let relays_json_content = fs.readFileSync(process.argv[5], {
	encoding: 'utf8'
});
let relays_json = JSON.parse(relays_json_content);

let routes = {};
for (let resolver_name in resolvers_json) {
	let resolver = resolvers_json[resolver_name];
	let resolver_stamp = parsers.parseStamp(resolvers_md[resolver_name].stamp);

	for (let relay_name in relays_json) {
		let relay = relays_json[relay_name];
		let relay_stamp = parsers.parseStamp(relays_md[relay_name].stamp);

		// MUST NOT be same IP address
		if (resolver_stamp.addr === relay_stamp.addr) {
			break;
		}

		let drop = false;
		for (let prop of CONFIG_MUST_NOT_BE_SAME) {
			if (anySame(resolver[prop], relay[prop])) {
				drop = true;
				break;
			}
		}
		if (drop) {
			break;
		}

		for (let prop of CONFIG_MUST_BE_SAME) {
			if (!allSame(resolver[prop], relay[prop])) {
				drop = true;
				break;
			}
		}
		if (drop) {
			break;
		}

		if (!routes[resolver_name]) {
			routes[resolver_name] = [];
		}
		routes[resolver_name].push(relay_name);
	}
}

let stringified = JSON.stringify(routes, null, ' ');
console.log(stringified);

/**
 * @param {any[]} A
 * @param {any[]} B
 */
function anySame(A, B) {
	for (let a of A) {
		for (let b of B) {
			if (a === b) {
				return true;
			}
		}
	}
	return false;
}
/**
 * @param {any[]} A
 * @param {any[]} B
 */
function allSame(A, B) {
	for (let a of A) {
		for (let b of B) {
			if (a !== b) {
				return false;
			}
		}
	}
	return true;
}
