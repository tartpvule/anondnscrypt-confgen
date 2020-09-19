# anondnscrypt-confgen

An Anonymized DNSCrypt configuration generator for [dnscrypt-proxy](https://github.com/DNSCrypt/dnscrypt-proxy).

## Introduction

Quoting from [Anonymized DNSCrypt Specification](https://github.com/DNSCrypt/dnscrypt-protocol/blob/master/ANONYMIZED-DNSCRYPT.txt):

> Clients choose the relay they want to use, as well as the server. As
> not doing so would defeat the purpose of Anonymized DNSCrypt, users
> should carefully choose them so that they are operated by different
> entities. Having these services on different networks is also
> recommended.

Given that the current public resolver list and relays list contains a lot of entries with no easily readable "entities" information, "Carefully choose" is very time-consuming, prone to error, and not scalable.

The current situation is that a user must parse English sentences in the description, search for additional information as deemed necessary, and manually put together the TOML configuration.

Even a human cannot to make *defitiviely correct* decisions in the general case due to the "additional information" part.

I filed [a feature request](https://github.com/DNSCrypt/dnscrypt-proxy/issues/1468) with the dnscrypt-proxy project to automate the process. I can't write Go, by the way.

In [a comment](https://github.com/DNSCrypt/dnscrypt-proxy/issues/1468#issuecomment-687702473) to that issue, I proposed to a structured metadata format, like so:

````
## skyfighter-dns

Country: Netherlands
Region: Western Europe
Entity: Scaleway.com, tuttimann
Some-other-thing: Foo

Uncensored, DNSSEC, no logging DNSCrypt server in Netherlands by Scaleway.com
Maintained by tuttimann

sdns://<a bunch of things>
````

Where instead of having to parse unstructured English sentences, relevant data like country, operating entities, etc. are put in an easily parsable format (HTTP Header-like).

Since **someone has to write the descriptions anyway**, putting them in a machine-parsable format would make decisions like `must not be same` or `must be same` easier programmatically.

## Implementation

This implementation is intentionally done in separate files to illustrate the steps involved.

This implementation is not extensively tested. Nothing blows up so far, but **I don't guarantee anything**.

Please report any issues you encouter.

## Caveats

* `make-metadata.js` is an ugly hacked-together thing that only crudely parses the unstructured English descriptions in the MD files. A human is still needed to correct the resulting JSON file. I am not skilled enough to teach a computer to read arbitrary English.

## Usage

1. Install NodeJS and npm

2. Download the scripts in this repository

3. `npm install binary-parser`

4. Make changes to `template.toml` as desired

5. Review `*.js` files and make changes to `CONFIG_*` consts as desired

6. Run `fetch-md.sh` or manually download the MD files (`public-resolvers.md` and `relays.md`)

7. If you have `resolvers_metadata.json` and `relays_metadata.json` already, skip to step 9

8. Depending on your source MD files...

   * If they have the metadata format above:

     `node parse-md-metadata.js public-resolvers.md > resolvers_metadata.json`

     `node parse-md-metadata.js relays.md > relays_metadata.json`

   * Else:

     `node make-metadata.js public-resolvers.md > resolvers_metadata.json`

     `node make-metadata.js relays.md > relays_metadata.json`

9. Review and correct `resolvers_metadata.json` and `relays_metadata.json`

10. `node make-routes.js public-resolvers.md relays.md resolvers_metadata.json relays_metadata.json > routes.json`

11. `node make-toml.js public-resolvers.md routes.json template.toml > dnscrypt-proxy.toml`

12. Copy `dnscrypt-proxy.toml` to `/etc/dnscrypt-proxy/dnscrypt-proxy.toml` or wherever your configuration file should be

13. If you removed source URLs from `template.toml`, copy `public-resolvers.md`, `public-resolvers.md.minisig`, `relays.md`, and `relays.md.minisig` to `/var/cache/dnscrypt-proxy/` or wherever your cache is (might need to be root)

14. Restart `dnscrypt-proxy` to use the new configuration file
