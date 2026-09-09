---
id: on
title: on — Extend Target Marker
sidebar_label: on
description: The `on` keyword — primary companion to `extend` (extend [Name] on Type) and secondary event-handler clause. Parser, syntax, examples, errors.
---

# `on`

`on` is a **lexically reserved keyword** (`TokenKind::On`, `src/parsing/lexer.rs:968`) whose overwhelmingly dominant use is as the **mandatory target marker** in retroactive extension blocks:

```adesh
extend       on Person { fn greet() { … } }
extend Name  on Person { fn greet() { … } }
       ^^
       mandatory
```

:::info Relationship to `extend`
`on` has no independent semantics. It is the syntactic bridge that tells the `extend_decl()` parser (`src/parsing/parser/type_decls.rs:34-36`) where the optional extension name ends and the target type begins. See [`extend`](./extend) for the full specification.
:::

## The Only Production Syntax: `extend … on`

### Grammar

```ebnf
ExtendDecl ::= "extend" [ IDENT ] "on" IDENT "{" Method* "}"
```

* The parser peeks for `on` after an optional identifier to decide whether that identifier is an *extension name*:

  ```rust
  // src/parsing/parser/type_decls.rs:23-36 (simplified)
  if check(Identifier) {
      ident = consume_ident();
      if match(On) { name = Some(ident); }   // `extend Foo on Bar` → name="Foo"
      else { rewind(); }                       // `extend on Bar` → no name
  }
  if name.is_none() { consume(On, "Expect 'on' after extend"); }
  target = consume_ident("Expect target type name after 'on'");
  ```

* Without `on` the parser emits `Expect 'on' after extend` and stops.

### Examples (all valid)

```adesh
// anonymous — most common
extend on Counter {
    fn increment() { this.value += 1; }
}

// named — groups concern-specific methods
extend CounterOps on Counter {
    fn increment() { this.value += 1; }
    fn decrement() { this.value -= 1; }
}

// struct target
extend on Point {
    fn distance(other: Point) -> f64 {
        let dx = this.x - other.x;
        return Math.sqrt(dx*dx + other.y*other.y);
    }
}

// enum target (payload-aware this)
extend on Direction {
    fn opposite() {
        return match this {
            North => Direction.South(),
            South => Direction.North(),
            East  => Direction.West(),
            West  => Direction.East()
        };
    }
}

// builtin target (hypothetical extension)
extend on string {
    fn isBlank() -> bool { return this.trim().len() == 0; }
}

// multiple blocks accumulate on same target
extend on User { fn isValid() -> bool { return len(this.email) > 0; } }
extend UserDisplay on User { fn displayName() -> string { return this.username; } }
```

### Errors

| Source | Error | Cause |
|--------|-------|-------|
| `parser/type_decls.rs:35` | `Expect 'on' after extend` | Wrote `extend Person { … }` without `on` |
| `parser/type_decls.rs:37` | `Expect target type name after 'on'` | `extend on {` or `extend on 123` |
| `parser/type_decls.rs:38` | `Expect '{' before extension body` | `extend on Person fn foo(){}` missing braces |

Fix: always write `extend on Type {` or `extend Name on Type {`.

---

## Secondary (Experimental) Use: Event / Message Handler

Some earlier designs and editor grammars list `on` as an event-handler introducer. This syntax is **not implemented in the current parser `extend_decl` path** and is reserved for future actor/concurrent work:

```adesh
// RESERVED — not yet parsed (illustrative only, will error today)
on message(text: string) {
    print(f"received: {text}");
}
```

The ALS hover text historically described this secondary role (`als/src/hover.rs:381` earlier variant). Until `on message` is implemented, treat `on` as **exclusive to `extend on`**. The Docusaurus search index and `adesh.tmLanguage.json:136` both highlight `on` as a keyword regardless of context.

---

## Distinguishing `on` from Lookalikes

| Keyword | Role | Contains `on`? |
|---------|------|----------------|
| `on` | extension target marker | itself |
| `extend` | introduces retroactive extension | requires `on` |
| `extends` | class inheritance header | unrelated despite prefix — `class Dog extends Animal` |
| `instanceof` | runtime type test | no |

Spelling matters: `extends` ≠ `extend on`.

---

## See Also

* [`extend`](./extend) — full retroactive extension reference (anonymous, named, generics, async, enums)
* [`extends`](./extends) — class inheritance (`extends`, single-parent, field offset accumulation)
* [Structs, Classes & Extensions — §4](../structs-classes) — VTable vs symbol-table architecture with heap diagrams (search for Retroactive Type Extension)
* `examples/extend/*.adesh` — runnable extension suites
