---
id: crypto
title: Crypto Library
sidebar_label: Crypto
---

# Crypto Library

The **Crypto** builtin library is a production-grade cryptography ecosystem for Adesh — secure by default, modern, and built around the principle of *difficulty-of-misuse*. It provides hashing, message authentication (HMAC), key derivation (HKDF), memory-hard password hashing (Argon2id), authenticated encryption (AEAD), CSPRNG tokens, Ed25519 signatures, X25519 key exchange, constant-time comparisons, hex/base64 encodings, X.509 certificate inspection, JWT/JWK, content identifiers, and encrypted file containers. Everything is implemented natively in Rust on top of audited crates (`aes-gcm`, `chacha20poly1305`, `argon2`, `ed25519-dalek`, `x25519-dalek`, `hkdf`, `blake3`, `sha2`, `sha3`, `rsa`, `jsonwebtoken`-style primitives, and the `zeroize` secure-memory crate).

## Namespace

| Name | What it provides |
| :--- | :--- |
| `Crypto` | The namespace: 30 functions covering hashing, MACs, KDFs, password hashing, AEAD encryption, randomness, signatures, key exchange, encodings, certificates, JWT, and file encryption |

## Importing the library

```adesh
import Crypto;              // or import "std:Crypto" as Crypto;
```

## Hashing & file digests

Hash string or byte-array data with SHA-2, SHA-3, BLAKE2, or BLAKE3, and hash files without loading them into memory (64 KB buffered streaming reader).

```adesh
import Crypto;

let message = "Adesh Production Cryptography Ecosystem 2026";

print(Crypto.sha256(message));   // hex digest
print(Crypto.sha512(message));   // hex digest
print(Crypto.blake3(message));   // hex digest
```

| Function | Description |
| :--- | :--- |
| `hash(algo, data)` | Generic digest as byte array. `algo` is one of `sha256`, `sha384`, `sha512`, `sha512_224`, `sha512_256`, `sha3_224`, `sha3_256`, `sha3_384`, `sha3_512`, `blake2b`, `blake3` (defaults to `sha256`) |
| `sha256(data)` | SHA-256 digest as a lowercase hex string |
| `sha512(data)` | SHA-512 digest as a lowercase hex string |
| `blake3(data)` | High-speed BLAKE3 digest as a lowercase hex string |
| `hashFile(path, algo?)` | Streamed file digest as hex string; `algo` defaults to `sha256` |
| `sha256File(path)` | Shorthand for `hashFile(path, "sha256")` |
| `blake3File(path)` | Shorthand for `hashFile(path, "blake3")` |

```adesh
// Stream a large file without loading it all into RAM
let sha256File = Crypto.hashFile("Cargo.toml", "sha256");
let blake3File = Crypto.hashFile("Cargo.toml", "blake3");
print(sha256File, blake3File);
```

`data`/`path` accept a string or a byte array. The generic `hash` returns raw bytes; `sha256`, `sha512`, `blake3`, `hashFile`, `sha256File`, and `blake3File` return hex strings.

## HMAC & HKDF

Message authentication and key derivation using HMAC-SHA256 and HKDF-SHA256.

```adesh
import Crypto;

let key = "sk_live_99887766554433221100";
let body = "{\"amount\":1000,\"currency\":\"USD\"}";

let signature = Crypto.hmac(key, body);
print(Crypto.encodeHex(signature));
print(Crypto.hmacVerify(key, body, signature));   // true
```

| Function | Description |
| :--- | :--- |
| `hmac(key, message)` | HMAC-SHA256 authentication tag as a byte array |
| `hmacVerify(key, message, tag)` | Verifies an HMAC tag in constant time, returns `Bool` |
| `hkdf(ikm, salt, info, length)` | Derives `length` bytes of key material from input key material (`ikm`); `salt` may be `null`, `info` is a string, `length` defaults to 32 |

```adesh
let derivedKey = Crypto.hkdf("HighEntropyInputKeyMaterialSecretBytes", "ApplicationSalt2026", "database-encryption-key-v1", 32);
print(Crypto.encodeHex(derivedKey));
```

## Password hashing (Argon2id)

Memory-hard password hashing and verification. Hashes are **self-describing** `$argon2id$` strings that embed the algorithm, parameters, and salt, so verification needs no extra configuration.

```adesh
import Crypto;

let hash = Crypto.hashPassword("SuperSecretPassword2026!");
print(hash);                                        // $argon2id$v=19$m=19456,t=2,p=1$...

print(Crypto.verifyPassword("SuperSecretPassword2026!", hash));  // true
print(Crypto.verifyPassword("WrongPassword!", hash));            // false
```

| Function | Description |
| :--- | :--- |
| `hashPassword(password)` | Hashes a password with Argon2id and a fresh CSPRNG salt; returns a `$argon2id$` string |
| `verifyPassword(password, hash)` | Verifies a password against an Argon2id hash string; returns `Bool` |

## Authenticated encryption (AEAD)

Authenticated encryption with AES-256-GCM. `seal` generates a fresh random 96-bit nonce for you and returns `{ nonce, ciphertext }`; the low-level `encryptAead`/`decryptAead` take an explicit key and nonce (32-byte key, 12-byte nonce). Wrong-key or tampered input makes `decryptAead` return `null` rather than an error.

```adesh
import Crypto;

let key = Crypto.randomBytes(32);
let secretText = "Credit Card Number: 4111-2222-3333-4444";

let sealed = Crypto.seal(key, secretText);
print(Crypto.encodeHex(sealed.nonce));
print(Crypto.encodeHex(sealed.ciphertext));

let decrypted = Crypto.decryptAead(key, sealed.nonce, sealed.ciphertext);
print(decrypted != null);   // true
```

| Function | Description |
| :--- | :--- |
| `seal(key, plaintext)` | AES-256-GCM seal with an automatically generated random 96-bit nonce; returns `{ nonce, ciphertext }` |
| `encryptAead(key, nonce, plaintext)` | AES-256-GCM encrypt with explicit `key` (32 bytes) and `nonce` (12 bytes); returns ciphertext bytes |
| `decryptAead(key, nonce, ciphertext)` | Decrypts and verifies the authentication tag; returns plaintext bytes, or `null` on tag mismatch / wrong key |

## Secure randomness & tokens (CSPRNG)

Cryptographically secure random bytes, tokens, and UUIDs backed by OS entropy — suitable for keys, nonces, salts, and session tokens (not the same as `Random`'s PRNG, which is for reproducible simulation).

```adesh
import Crypto;

print(Crypto.randomToken(32, "hex"));       // 64-char hex token
print(Crypto.randomToken(32, "base64"));    // base64 token
print(Crypto.randomUuid());                 // UUID v4
```

| Function | Description |
| :--- | :--- |
| `randomBytes(count)` | `count` bytes of OS-entropy CSPRNG output as a byte array |
| `randomToken(length, encoding)` | Random token as a string in `"hex"` or `"base64"` (base64 is the default) |
| `randomUuid()` | Cryptographically secure UUID v4 string |

## Digital signatures (Ed25519)

High-speed Edwards-curve signatures using 32-byte keys and 64-byte signatures.

```adesh
import Crypto;

let keypair = Crypto.generateEd25519();
let document = "Legal Terms and Conditions Agreement v1.0";

let signature = Crypto.signEd25519(keypair.privateKey, document);
print(Crypto.encodeHex(signature));

print(Crypto.verifyEd25519(keypair.publicKey, document, signature));  // true
```

| Function | Description |
| :--- | :--- |
| `generateEd25519()` | Generates a keypair as `{ privateKey, publicKey }` (32-byte each) |
| `signEd25519(privateKey, message)` | Signs a message; returns the 64-byte signature as a byte array |
| `verifyEd25519(publicKey, message, signature)` | Verifies a signature; returns `Bool` |

## Key exchange (X25519)

Curve25519 Diffie-Hellman key agreement deriving a 32-byte shared secret.

```adesh
import Crypto;

let alice = Crypto.generateX25519();
let bob   = Crypto.generateX25519();

let aliceShared = Crypto.exchangeX25519(alice.secretKey, bob.publicKey);
let bobShared   = Crypto.exchangeX25519(bob.secretKey, alice.publicKey);

print(Crypto.constantTimeEquals(aliceShared, bobShared));   // true
```

| Function | Description |
| :--- | :--- |
| `generateX25519()` | Generates a keypair as `{ secretKey, publicKey }` (32-byte each) |
| `exchangeX25519(secretKey, peerPublicKey)` | Performs X25519 key agreement; returns the 32-byte shared secret |

## Constant-time comparison

Compares two byte arrays or strings in constant time to avoid timing side-channels. Use this instead of `==` for secrets, signatures, and MACs.

```adesh
let a = Crypto.randomBytes(32);
let b = Crypto.randomBytes(32);
print(Crypto.constantTimeEquals(a, a));   // true
print(Crypto.constantTimeEquals(a, b));   // false
```

| Function | Description |
| :--- | :--- |
| `constantTimeEquals(a, b)` | Constant-time equality check; returns `Bool` |

## Encodings (hex & base64)

Convert between raw bytes and their textual hex / standard base64 representations.

```adesh
import Crypto;

let rawBytes = [65, 100, 101, 115, 104, 76, 97, 110, 103];
let hexStr  = Crypto.encodeHex(rawBytes);
let b64Str  = Crypto.encodeBase64(rawBytes);

print(hexStr);                      // "41646573684c616e67"
print(b64Str);                      // "QWRlc2hMYW5n"
print(Crypto.decodeHex(hexStr));    // byte array
print(Crypto.decodeBase64(b64Str)); // byte array
```

| Function | Description |
| :--- | :--- |
| `encodeHex(bytes)` | Bytes → lowercase hex string |
| `decodeHex(hexStr)` | Hex string → byte array (errors on invalid hex) |
| `encodeBase64(bytes)` | Bytes → standard base64 string |
| `decodeBase64(b64Str)` | Base64 string → byte array (errors on invalid base64) |

## Certificates & JWT

Parse X.509 certificate metadata from PEM, sign and safely verify JWTs (HS256 with an explicit algorithm whitelist to prevent *alg confusion* attacks), and compute RFC 7638 JWK thumbprints.

```adesh
import Crypto;

let certPem = "-----BEGIN CERTIFICATE-----\nMIIBtzCCASwCCQD5y6064x2JzTANBgkqhkiG9w0BAQsFADANMQswCQYDVQQDDAJh\nZGgwHhcNMjYwODExMDYwMDAwWhcNMjcwODExMDYwMDAwWjANMQswCQYDVQQDDAJh\nZGgwXDANBgkqhkiG9w0BAQEFAANLADBIAkEA02f1u2d123456789abcdef012345\n6789abcdef0123456789abcdef0123456789abcdef0123456789abcdefIDAQAB\nMA0GCSqGSIb3DQEBCwUAA0EANx123456789abcdef0123456789abcdef0123456\n789abcdef0123456789abcdef0123456789abcdef\n-----END CERTIFICATE-----";

let cert = Crypto.parseCertificate(certPem);
print(cert.subject, cert.issuer, cert.fingerprintSha256);
```

| Function | Description |
| :--- | :--- |
| `parseCertificate(pemStr)` | Parses an X.509 PEM certificate; returns `{ subject, issuer, serialNumber, notBefore, notAfter, fingerprintSha256, isCa }` |
| `signJwt(claimsJsonStr, secret)` | Signs a JSON claims object with HS256; returns a JWT string |
| `verifyJwt(token, secret, allowedAlgos)` | Verifies a JWT against an explicit algorithm whitelist (e.g. `["HS256"]`); returns the verified claims as a JSON string, or errors on failure |
| `jwkThumbprint(jwkJsonStr)` | Computes the canonical RFC 7638 JWK thumbprint (Base64Url SHA-256 of the canonical JSON) |

```adesh
let claimsJsonStr = "{\"sub\":\"user_789\",\"iss\":\"adeshlang-auth\",\"exp\":2524608000}";
let hmacSecret = "super_secret_jwt_signing_key_32_bytes!!";

let jwtToken = Crypto.signJwt(claimsJsonStr, hmacSecret);
print(jwtToken);

// Always pass an explicit algorithm whitelist
let verifiedClaims = Crypto.verifyJwt(jwtToken, hmacSecret, ["HS256"]);
print(verifiedClaims);
```

## Content identifiers & encrypted file containers

Compute content-addressable identifiers and encrypt/decrypt self-describing file payloads with a passphrase (Argon2id-derived key + AES-256-GCM).

```adesh
import Crypto;

let cid = Crypto.contentId("Immutable Blockchain Block Transaction Dataset");
print(cid);   // "sha256-<digest>"

let passphrase = "MasterEncryptionPassphrase2026!";
let payload = Crypto.encryptFile(passphrase, "Confidential Company Quarter Audit File");
let decrypted = Crypto.decryptFile(passphrase, payload);
```

| Function | Description |
| :--- | :--- |
| `contentId(data)` | Content-addressable identifier in the form `sha256-<digest>` |
| `encryptFile(passphrase, plaintextBytes)` | Encrypts a byte payload into a self-describing container; returns ciphertext bytes |
| `decryptFile(passphrase, payloadBytes)` | Decrypts an encrypted container back to plaintext bytes |

## Complete example

```adesh
import Crypto;

// 1. Hash a message
let message = "Adesh Production Cryptography Ecosystem 2026";
print("SHA-256:", Crypto.sha256(message));

// 2. Password hashing (Argon2id)
let hash = Crypto.hashPassword("SuperSecretPassword2026!");
print("Argon2id:", hash);
print("Verify:", Crypto.verifyPassword("SuperSecretPassword2026!", hash));

// 3. Authenticated encryption with auto-generated nonce
let key = Crypto.randomBytes(32);
let sealed = Crypto.seal(key, "Credit Card Number: 4111-2222-3333-4444");
let decrypted = Crypto.decryptAead(key, sealed.nonce, sealed.ciphertext);
print("Decryption Successful:", decrypted != null);

// 4. Ed25519 signatures
let keypair = Crypto.generateEd25519();
let signature = Crypto.signEd25519(keypair.privateKey, message);
print("Signature Valid:", Crypto.verifyEd25519(keypair.publicKey, message, signature));

// 5. Secure tokens
print("Token:", Crypto.randomToken(32, "hex"));
print("UUID:", Crypto.randomUuid());
```

## Notes

- **Secure by default.** `seal` always generates a fresh random nonce; `decryptAead` returns `null` on authentication failure instead of leaking data or panicking.
- **Never roll your own crypto.** HMAC verification (`hmacVerify`), signature checks, and equality on secrets use constant-time comparisons to prevent timing side-channels.
- **Algorithm choices** are modern and audited: SHA-256/SHA-512/SHA-3/BLAKE2/BLAKE3 for hashing, HMAC-SHA256 + HKDF-SHA256 for MACs/KDFs, Argon2id for passwords, AES-256-GCM for AEAD, Ed25519 for signatures, X25519 for key agreement, HS256 JWT (with algorithm whitelist), RFC 7638 JWK thumbprints, and `sha256-<digest>` content identifiers.
- **`hashFile` / `sha256File` / `blake3File`** stream files through a 64 KB buffer, so multi-gigabyte files can be hashed without exhausting memory.
- **Wrong keys and bad input** surface as `null` returns (`decryptAead`) or runtime errors (invalid hex/base64, invalid JWT claims, invalid hash algorithm) — always check return values.
- **Sensitive material is zeroized** in memory where possible (`zeroize`), and secrets like signing keys should be kept in byte arrays obtained from `randomBytes` / keypair generators rather than string literals.
- Byte-array results (`hash`, `hmac`, `hkdf`, `encryptAead`, `decryptAead`, signatures, shared secrets, `randomBytes`) can be sent to `encodeHex`/`encodeBase64` for storage or transport.

