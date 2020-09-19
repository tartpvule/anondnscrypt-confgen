/**
 * @file parse-md-metadata.js
 * @author tartpvule
 * @license MIT
 * @version 1
 *
 * Usage:
 *  node parse-md-metadata.js file.md
 */
// @ts-check
'use strict';

const CONFIG_MUST_NOALL = true;
const CONFIG_NO_OPENNIC = true;
const CONFIG_NO_IPV6 = true;

const fs = require('fs');
const parsers = require('./parsers.js');

let md_content = fs.readFileSync(process.argv[2], {
	encoding: 'utf8'
});
let md = parsers.parseMD(md_content);

let Metadata = {};

for (let entry_name in md) {
	let entry = md[entry_name];

	let stamp = parsers.parseStamp(entry.stamp);
	if (!stamp) {
		continue;
	}

	if (CONFIG_MUST_NOALL &&
		stamp.protocol === 0x01 &&
		//@ts-ignore
		!(stamp.props_dnssec && stamp.props_nolog && stamp.props_nofilter)
	) {
		continue;
	}
	if (CONFIG_NO_OPENNIC &&
		(entry.description.includes('OpenNIC') || entry_name.includes('opennic'))
	) {
		continue;
	}
	if (CONFIG_NO_IPV6 &&
		stamp.addr.startsWith('[')
	) {
		continue;
	}

	let metadata = {};

	let lines = entry.description.split('\n');
	for (let line of lines) {
		let i = line.indexOf(':');
		if (i === -1) {
			continue;
		}

		let prop = line.substring(0, i).trim().toLowerCase();
		let values = line.substring(i + 1).split(',').map(function(v) {
			return v.trim();
		});

		metadata[prop] = values;
	}

	Metadata[entry_name] = metadata;
}

let stringified = JSON.stringify(Metadata, null, ' ');
console.log(stringified);
