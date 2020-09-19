/**
 * @file make-toml.js
 * @author tartpvule
 * @license MIT
 * @version 1
 *
 * Usage:
 *  node make-toml.js resolvers.md routes.json template.toml
 */
// @ts-check
'use strict';

// template.toml
const CONFIG_SUBSTR_DISABLED_NAMES = 'disabled_server_names = [\'<TEMPLATE>\']';
const CONFIG_SUBSTR_ROUTES = 'routes = [ { server_name=\'<TEMPLATE>\', via=[\'anon-<TEMPLATE>\'] } ]';

const fs = require('fs');
const parsers = require('./parsers.js');

let resolvers_md_content = fs.readFileSync(process.argv[2], {
	encoding: 'utf8'
});
let resolvers_md = parsers.parseMD(resolvers_md_content);

let routes_json = fs.readFileSync(process.argv[3], {
	encoding: 'utf8'
});
let routes = JSON.parse(routes_json);

let template_toml = fs.readFileSync(process.argv[4], {
	encoding: 'utf8'
});

let out_disabled_names = [];
let out_routes = [];

for (let resolver_name in resolvers_md) {
	if (!(resolver_name in routes)) {
		out_disabled_names.push(resolver_name);
		continue;
	}

	out_routes.push({
		server_name: resolver_name,
		via: routes[resolver_name]
	});
}

let output = template_toml
	.replace(CONFIG_SUBSTR_DISABLED_NAMES, 'disabled_server_names = ' + toTOML(out_disabled_names))
	.replace(CONFIG_SUBSTR_ROUTES, 'routes = ' + toTOML(out_routes))
;

console.log(output);

/**
 * @param {Object} obj
 */
function toTOML(obj) {
	// not supporting non-string primitives
	if (Array.isArray(obj)) {
		if (obj.length === 0) {
			return '[]';
		} else {
			let str;
			if (typeof obj[0] === 'object') {
				str = obj.map(function(v) {
					return toTOML(v);
				}).join(',');
			} else {
				str = '\'' + obj.join('\',\'') + '\'';
			}
			return '[' + str + ']';
		}
	} else {
		let output = [];
		for (let name in obj) {
			let val = obj[name];
			let str;
			if (typeof val === 'object') {
				str = toTOML(val);
			} else {
				str = '\'' + val + '\'';
			}
			output.push(name + '=' + str);
		}
		return '{' + output.join(',') + '}';
	}
}
