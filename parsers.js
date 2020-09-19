/**
 * @file parsers.js
 * @author tartpvule
 * @license MIT
 * @version 1
 */
// @ts-check
'use strict';

const BinaryParser = require('binary-parser').Parser;

const DNSCryptParser = new BinaryParser()
	.endianess('little')
	.uint8('protocol', { assert: 0x01 })
	.bit1('props_dnssec') /* BUG: 8 bits parsed as big endian */
	.bit1('props_nolog')
	.bit1('props_nofilter')
	.uint8('props_reserved1')
	.uint16('props_reserved2')
	.uint32('props_reserved3')
	.uint8('addr_len')
	.string('addr', {
		length: 'addr_len'
	})
	.uint8('pk_len')
	.buffer('pk', {
		length: 'pk_len'
	})
	.uint8('providerName_len')
	.string('providerName', {
		length: 'providerName_len'
	})
;
const RelayParser = new BinaryParser()
	.endianess('little')
	.uint8('protocol', { assert: 0x81 })
	.uint8('addr_len')
	.string('addr', {
		length: 'addr_len'
	})
;

exports.DNSCryptParser = DNSCryptParser;
exports.RelayParser = RelayParser;

/**
 * @param {string} str Stamp
 */
function parseStamp(str) {
	let buffer = Buffer.from(str, 'base64');

	let parsed;
	if (buffer[0] === 0x01) {
		parsed = DNSCryptParser.parse(buffer);
	} else if (buffer[0] === 0x81) {
		parsed = RelayParser.parse(buffer);
	} else {
		return null;
	}

	return parsed;
}

exports.parseStamp = parseStamp;

/**
 * @param {string} str File content
 */
function parseMD(str) {
	let entries = {};
	let p = 0;
	while (p < str.length) {
		let ns = str.indexOf('\n## ', p);
		if (ns === -1) {
			break;
		}
		let ne = str.indexOf('\n', ns + 4);
		if (ne === -1) {
			break;
		}
		let name = str.substring(ns + 4, ne);
		p = ne + 1;

		let ss = str.indexOf('\nsdns://', p);
		if (ss === -1) {
			break;
		}
		let se = str.indexOf('\n', ss + 8);
		if (se === -1) {
			se = str.length;
		}
		let stamp = str.substring(ss + 8, se);
		p = se + 1;

		let description = str.substring(ne + 1, ss);

		entries[name] = {
			description: description,
			stamp: stamp
		};
	}

	return entries;
}

exports.parseMD = parseMD;