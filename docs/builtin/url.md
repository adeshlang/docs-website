---
id: url
title: URL Library
sidebar_label: URL
---

# URL Library

The **URL** builtin library provides zero-allocation URL parsing, protocol/hostname/port extraction, normalization, WHATWG URL standard compliance, and query parameter search manipulation via `URLSearchParams`.

It allows Adesh applications to inspect and construct URLs safely without regular expression hacking or unsafe string splitting. The implementation is backed by the native Rust `url` crate semantics and is available identically across all backends.

```
┌────────────────────────────────────────────────────────┐
│                    URL Module                          │
├────────────────────────────────────────────────────────┤
│  Parsing       → URL.parse(string) → URL object        │
│  Building      → new URL(href) / URL.builder()         │
│  Encoding      → percent-encode / decode, form codec   │
│  Query Params  → URLSearchParams (get/set/append)      │
│  Normalization → href, origin, host, href canonicalize │
└────────────────────────────────────────────────────────┘
```

---

## Namespace

| Name | What it provides |
| :--- | :--- |
| `URL` | The primary URL namespace for parsing and constructing URL objects and search parameters |

## Importing the library

```adesh
import URL;              // or import "std:URL" as URL;
import { URL, URLSearchParams } from "std:URL";
```

All operations are **pure** — parsing never mutates its input; mutation happens through `searchParams` on a URL instance.

---

## Architecture Diagram — URL Anatomy

```
  https://user:secret@api.example.com:8080/v1/products?category=tech&page=2#top
  \___/   \__/ \____/ \______________/ \__/\____________/ \___________________/ \__/
   proto  user  pass     hostname      port   pathname          search          hash
  |______________________| |________________| |_____________________________|
          origin                host                 path + query
  \________________________________________________________________________/
                                   href (full normalized URL)
```

```
URL object properties:

  url.href         → "https://user:secret@api.example.com:8080/v1/products?category=tech&page=2#top"
  url.protocol     → "https:"
  url.username     → "user"
  url.password     → "secret"
  url.hostname     → "api.example.com"
  url.port         → "8080"
  url.host         → "api.example.com:8080"
  url.pathname     → "/v1/products"
  url.search       → "?category=tech&page=2"
  url.hash         → "#top"
  url.origin       → "https://api.example.com:8080"
  url.searchParams → URLSearchParams { category→tech, page→2 }
```

---

## URL Parsing (`URL.parse`)

Parses a full URL string into a structured component object. Throws on malformed input.

| Function | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `URL.parse(urlString)` | Parse URL string into component properties | `urlString: string` | `URL` |
| `URL.canParse(urlString)` | Non-throwing parse check | `urlString: string` | `bool` |
| `URL.tryParse(urlString)` | Parses or returns `null` on failure | `urlString: string` | `URL \| null` |

### `URL` Object Properties

| Property | Type | Description |
|---|---|---|
| `url.href` | `string` | Full normalized URL string (canonical form). |
| `url.protocol` | `string` | URL scheme with trailing colon, e.g. `"https:"`, `"ftp:"`. |
| `url.username` | `string` | Extracted username (percent-decoded), or `""` if absent. |
| `url.password` | `string` | Extracted password (percent-decoded), or `""` if absent. |
| `url.hostname` | `string` | Host domain or IP, e.g. `"example.com"`, `"127.0.0.1"`, `"[::1]"`. |
| `url.port` | `string` | Explicit port string, or `""` if implicit/default. |
| `url.host` | `string` | Combined `hostname:port` (omits `:port` if default). |
| `url.pathname` | `string` | Resource path starting with `/`, e.g. `"/api/v1/users"`. |
| `url.search` | `string` | Query string including leading `?`, or `""` if none. |
| `url.hash` | `string` | Fragment including leading `#`, or `""` if none. |
| `url.origin` | `string` | `protocol + "//" + host`, e.g. `"https://example.com:8080"`. |
| `url.searchParams` | `URLSearchParams` | Live query param interface (mutations reflect in `href`/`search`). |

```adesh
import URL;

let u = URL.parse("https://user:secret@api.example.com:8080/v1/products?category=tech&page=2#top");

print("Protocol:", u.protocol); // "https:"
print("Username:", u.username); // "user"
print("Password:", u.password); // "secret"
print("Host:", u.host);         // "api.example.com:8080"
print("Hostname:", u.hostname); // "api.example.com"
print("Port:", u.port);         // "8080"
print("Path:", u.pathname);     // "/v1/products"
print("Query:", u.search);      // "?category=tech&page=2"
print("Fragment:", u.hash);     // "#top"
print("Origin:", u.origin);     // "https://api.example.com:8080"
print("Href:", u.href);         // full normalized URL
```

### Parsing Edge Cases & Normalization

| Input | Normalized `href` | Notes |
|---|---|---|
| `https://example.com:443/` | `https://example.com/` | default port stripped |
| `http://example.com:80/a` | `http://example.com/a` | default port stripped |
| `https://example.com/foo/../bar` | `https://example.com/bar` | path normalization |
| `https://example.com/%20a` | `https://example.com/%20a` | percent preserved |
| `https://[::1]:8080/` | `https://[::1]:8080/` | IPv6 bracketed |
| `not a url` | throws `TypeError` | use `canParse` to avoid throw |

### Error Table

| Condition | Error | Recovery |
|---|---|---|
| Missing scheme | `TypeError: Invalid URL` | Use `tryParse` or `canParse` |
| Invalid port (`:99999`) | `TypeError: Invalid URL` | Validate before parsing |
| Space in host | `TypeError: Invalid URL` | Percent-encode first |
| Empty string | `TypeError: Invalid URL` | Guard with `if (s.len() > 0)` |

---

## URL Building

Construct URLs programmatically without string concatenation:

```adesh
import URL;

let u = URL.parse("https://example.com/");
u.pathname = "/api/v1/users";
u.searchParams.set("page", "1");
u.searchParams.set("sort", "desc");
u.hash = "#results";

print(u.href); // "https://example.com/api/v1/users?page=1&sort=desc#results"
```

### Builder / Constructor Forms

| Form | Example | Notes |
|---|---|---|
| `URL.parse(str)` | `URL.parse("https://a.com/x")` | static parse |
| `new URL(str)` | `let u = new URL("https://a.com/x")` | constructor form |
| `new URL(path, base)` | `new URL("/api", "https://example.com")` | resolve relative against base |
| `URL.fromParts(obj)` | `URL.fromParts({ protocol:"https:", hostname:"a.com", pathname:"/x" })` | from parts object |

```adesh
import URL;

let base = URL.parse("https://example.com/docs/");
let relative = new URL("../api/v2", base.href);
print(relative.href); // "https://example.com/api/v2"
```

---

## Query Parameters (`URLSearchParams`)

`URLSearchParams` provides methods to read, insert, update, and delete query parameters. It is **live** — mutations immediately update the parent URL's `search` and `href`.

| Method | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `searchParams.get(key)` | Fetch first value for `key` | `key: string` | `string \| null` |
| `searchParams.getAll(key)` | Fetch all values for `key` (multi-value) | `key: string` | `string[]` |
| `searchParams.has(key)` | Check if parameter key exists | `key: string` | `bool` |
| `searchParams.set(key, val)` | Set / replace key (removes duplicates) | `key: string`, `val: string` | `void` |
| `searchParams.append(key, val)` | Append key value (allows duplicates) | `key: string`, `val: string` | `void` |
| `searchParams.delete(key)` | Delete key and all its values | `key: string` | `void` |
| `searchParams.keys()` | All keys as array | — | `string[]` |
| `searchParams.values()` | All values as array | — | `string[]` |
| `searchParams.entries()` | All `[key, value]` pairs | — | `Array<[string,string]>` |
| `searchParams.toString()` | Format as query string (`"key=val&a=b"`) without leading `?` | — | `string` |
| `searchParams.sort()` | Sort params by key | — | `void` |

```adesh
import URL;

let u = URL.parse("https://example.com/search?q=adeshlang&lang=en");

// Read parameters
print("q:", u.searchParams.get("q"));       // "adeshlang"
print("has lang:", u.searchParams.has("lang")); // true
print("all q:", u.searchParams.getAll("q"));    // ["adeshlang"]

// Mutate parameters
u.searchParams.set("page", "1");
u.searchParams.append("filter", "active");
u.searchParams.append("filter", "recent"); // multi-value key

print(u.searchParams.toString());
// "q=adeshlang&lang=en&page=1&filter=active&filter=recent"
print(u.search); // "?q=adeshlang&lang=en&page=1&filter=active&filter=recent"
print(u.href);   // full URL with updated query

// Delete
u.searchParams.delete("lang");
print(u.searchParams.has("lang")); // false

// Sort
u.searchParams.sort();
print(u.searchParams.toString()); // keys alphabetically sorted
```

---

## Encoding & Decoding

URLs must percent-encode special characters. The URL library handles this automatically, with explicit helpers for manual control:

| Function | Description | Example |
|---|---|---|
| `URL.encode(str)` | Percent-encode a string for URL use | `URL.encode("hello world")` → `"hello%20world"` |
| `URL.decode(str)` | Percent-decode a string | `URL.decode("hello%20world")` → `"hello world"` |
| `URL.encodeComponent(str)` | Encode a URL component (query value, path segment) | encodes `&`, `=`, `?`, `#` |
| `URL.decodeComponent(str)` | Decode a URL component | decodes `%XX` |
| `URL.encodeForm(obj)` | Encode object as `application/x-www-form-urlencoded` | `{a:"1 2"}` → `"a=1+2"` or `"a=1%202"` |
| `URL.decodeForm(str)` | Decode form-encoded string to object | `"a=1&b=2"` → `{a:"1", b:"2"}` |

```adesh
import URL;

print(URL.encodeComponent("hello & world = test?"));
// "hello%20%26%20world%20%3D%20test%3F"

print(URL.decodeComponent("hello%20world"));
// "hello world"

let form = URL.encodeForm({ q: "adesh lang", page: "1" });
print(form); // "q=adesh+lang&page=1"  (form encoding)

// URLSearchParams does encoding automatically:
let u = URL.parse("https://example.com/");
u.searchParams.set("q", "hello & world");
print(u.search); // "?q=hello+%26+world"  (encoded)
```

### Encoding Rules

| Char | In Path | In Query (searchParams) | In Fragment |
|---|---|---|---|
| space | `%20` | `+` or `%20` | `%20` |
| `&` `=` | `%26` `%3D` | `%26` `%3D` | `%26` `%3D` |
| `#` `?` | `%23` `%3F` | `%23` `%3F` | literal `#` handling |
| unicode `é` | `%C3%A9` (UTF-8) | `%C3%A9` | `%C3%A9` |

---

## Complete Example — URL Builder + Signed Request

```adesh
import URL;

fn buildSearchUrl(base: string, query: string, page: i32): string {
    let u = URL.parse(base);
    u.pathname = "/api/search";
    u.searchParams.set("q", query);
    u.searchParams.set("page", str(page));
    u.searchParams.set("lang", "en");
    u.searchParams.sort();
    return u.href;
}

let url = buildSearchUrl("https://example.com", "adesh lang", 2);
print(url);
// "https://example.com/api/search?lang=en&page=2&q=adesh+lang"

// Parse it back
let parsed = URL.parse(url);
print("Protocol:", parsed.protocol);
print("Path:", parsed.pathname);
print("Query q:", parsed.searchParams.get("q"));
print("Origin:", parsed.origin);

// Handle invalid URL gracefully
let bad = URL.tryParse("not a url");
if (bad == null) {
    print("Invalid URL detected");
}
if (!URL.canParse("https://example.com")) {
    print("This will not print — it can parse");
}
```

---

## Notes & Edge Cases

- **WHATWG compliance**: parsing follows the WHATWG URL Standard — same behavior as `new URL()` in browsers/Node.js.
- **Default ports**: `https:443`, `http:80`, `ftp:21`, `ws:80`, `wss:443` are stripped in `href` canonicalization.
- **Case**: scheme and hostname are lowercased; path/query/fragment preserve case.
- **Percent-encoding**: already-encoded sequences are not double-encoded by `searchParams.set`.
- **IPv6**: hosts like `[::1]` retain brackets in `hostname`/`host`/`href`.
- **Mutations are live**: `searchParams.set` immediately updates `url.search` and `url.href`.

## Related

- [Net Library](/docs/builtin/net) — TCP/UDP sockets that consume parsed URLs
- [HTTP Library](/docs/builtin/http) — higher-level HTTP client that takes URL strings
- [Encoding Library](/docs/builtin/encoding) — percent, base64, hex codecs
- Implementation: `src/runtime/stdlib_src/url/` and `src/runtime/stdlib_src/encoding/`
