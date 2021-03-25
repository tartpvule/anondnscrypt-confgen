/**
 * @file view-ip.js
 * @author tartpvule
 * @license MIT
 * @version 1
 *
 * Usage:
 *  node view-ip.js file.md
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

	console.log(stamp.addr);
}
