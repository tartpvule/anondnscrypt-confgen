/**
 * @file make-metadata.js
 * @author tartpvule
 * @license MIT
 * @version 2
 *
 * Usage:
 *  node make-metadata.js file.md
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

	if (entry.description.includes('incompatible with DNS anonymization') ||
		entry.description.includes('incompatible with anonymization')
	) {
		continue;
	}

	/*
	 Locations:
	  "in AMS"
	  "in Netherlands - NL"
	  "in Barcelona, Spain"
	  "in CA - Vancouver"
	  "in South Korea"
	  "in US - Los Angeles, CA"
	  "Location: Toronto, Canada"
	  "in Seattle, WA (USA)"
	  "in Amsterdam, The Netherlands"
	  "in Amsterdam"
	  "in Netherlands"
	*/

	let p;
	let description = entry.description.replace(/\r?\n/g, ' ');

	let Locations = new Set();
	p = 0;
	while (p < description.length) {
		let sb = description.indexOf(' in ', p);
		if (sb === -1) {
			sb = description.indexOf('Location: ', p);
			if (sb === -1) {
				break;
			} else {
				sb += 10;
			}
		} else {
			sb += 4;
		}
		p = sb;
		if (description.substring(p, p + 4).toLowerCase() === 'the ') {
			p += 4;
		}

		let ns;
		while (p < description.length) {
			ns = description.indexOf(' ', p);
			let w = description.substring(p, ns);
			if (!w ||
				w[0] !== w[0].toUpperCase()
			) {
				ns = p - 1;
				break;
			}
			if (w.endsWith('.')) {
				ns -= 1;
				break;
			}
			p = ns + 1;
		}

		if (!(/[A-Za-z\)]/).test(description[ns - 1])) {
			ns -= 1;
		}
		let word = description.substring(sb, ns);


		Locations.add(word);
	}

	/*
	 Entity:
	  "on Scaleway"
	  "by https://cryptostorm.is/"
	  "on DigitalOcean"
	  "by evilvibes.com"
	  "by @ibksturm, aka Andreas Ziegler"
	  "by Eric Lagergren (@ericlagergren)"
	  "on Vultr"
	  "by MegaNerd.nl (https://www.meganerd.nl/encrypted-dns-server)"
	  "by yofiji"
	*/
	let Entities = new Set();
	p = 0;
	while (p < description.length) {
		let sb = description.indexOf(' by ', p);
		if (sb === -1) {
			sb = description.indexOf(' on ', p);
			if (sb === -1) {
				break;
			}
		}
		sb += 4;
		p = sb;

		let ns;
		let first = true;
		while (p < description.length) {
			ns = description.indexOf(' ', p);
			let w = description.substring(p, ns);
			if (!w) {
				ns = p;
				break;
			}
			if (w[0] !== w[0].toUpperCase()) {
				if (first) {
					break;
				} else {
					ns = p;
				}
			}
			if (first) {
				first = false;
			}
			if (w.startsWith('(')) {
				ns = p;
				break;
			}
			if (w.endsWith('.') ||
				w.endsWith(',')
			) {
				ns -= 1;
				break;
			}
			p = ns + 1;
		}

		if (description[ns - 1] === '.') {
			ns -= 1;
		}
		let word = description.substring(sb, ns);
		Entities.add(word);

		p = ns;
	}

	Metadata[entry_name] = {
		locations: Array.from(Locations),
		entities: Array.from(Entities)
	};
}

let stringified = JSON.stringify(Metadata, null, ' ');
console.log(stringified);
