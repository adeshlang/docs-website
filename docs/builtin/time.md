---
id: time
title: Time Library
sidebar_label: Time
---

# Time Library

The **Time** builtin library is Adesh's production-grade date, time, and duration system. It provides monotonic **Instant** and wall-clock **SystemTime** measurements, ISO-style **Duration** math, naive **Date** / **TimeOfDay** / **DateTime**, timezone-aware **UTC**, **Offset**, and **Zoned** date-times, parsing and formatting, plus `Period`, `Stopwatch`, `Timer`, and interval helpers.

The API is written in Adesh itself (`src/stdlib/Time.adesh`) on top of native `time.*` primitives (system clock, monotonic clock, sleep, format/parse, and timezone lookup), so it works consistently across every backend.

## Classes

| Class | What it represents |
| :--- | :--- |
| `Duration` | A length of time measured in nanoseconds |
| `Instant` | A monotonic point in time (stopwatch-friendly) |
| `SystemTime` | A wall-clock point relative to the Unix epoch |
| `Date` | A calendar date (year, month, day) |
| `TimeOfDay` | A time within the day (hour … nanosecond) |
| `DateTime` | A naive local date + time (no timezone) |
| `UtcDateTime` | An exact moment in UTC |
| `UtcOffset` | A fixed UTC offset (`+05:30`, `Z`, …) |
| `OffsetDateTime` | A UTC moment with a fixed offset |
| `TimeZone` / `ZonedDateTime` | A named zone (e.g. `"America/New_York"`) and a moment in it |
| `Weekday` / `Month` | Day-of-week and month abstractions |
| `Period` | A calendar-based span (years, months, days) |
| `Stopwatch` / `Timer` / `Interval` | Elapsed-time and scheduling utilities |
| `Measurement` | A value plus the duration it took to produce |
| `TimeError` / `ParseTimeError` | Errors with `message()`, `kind()` / `position()` |

## Importing the library

```adesh
import Time;      // or import time;
```

Access classes through the namespace: `Time.dateYmd(2024, 6, 21)`, `Duration.seconds(5)`, `new Time.Date(...)`. Factory functions avoid `new` for the most common cases.

---

## `Duration` — lengths of time

Internally stored as a `bigint` count of **nanoseconds**.

**Construction** — static factories and free functions:

| Factory | Unit |
| :--- | :--- |
| `Duration.fromNanos(n)` / `Duration.nanoseconds(n)` | nanoseconds |
| `Duration.microseconds(n)` | microseconds |
| `Duration.milliseconds(n)` | milliseconds |
| `Duration.seconds(n)` | seconds |
| `Duration.minutes(n)` | minutes |
| `Duration.hours(n)` | hours |
| `Duration.days(n)` | days |
| `Time.durationZero()` | 0 |
| `Time.durationMilliseconds(n)` / `Time.durationSeconds(n)` / … | free-function forms |

**Accessors** — `nanoseconds()`…`weeks()` return the component within the next larger unit (like Rust's `std::time::Duration`); `wholeSeconds()` / `wholeMilliseconds()` / `wholeDays()` etc. return the total count in that unit; `asSecondsF64()` / `asMillisecondsF64()` give float totals.

**Arithmetic & comparison** — `checkedAdd`, `checkedSub`, `checkedMul`, `checkedDiv`, `negated()`, `abs()`, `min`, `max`, `clamp(min, max)`, and `lt` / `gt` / `eq` / `lte` / `gte`.

```adesh
import Time;

let timeout = Duration.seconds(5);
let tiny     = Duration.milliseconds(250);

print(tiny.wholeMilliseconds());        // 250
print(timeout.asSecondsF64());          // 5.0
print(tiny.lt(timeout));                // true
print(timeout.toString());              // 5s
print(Duration.seconds(3725).toString());  // 1h 2m 5s

// Timeout from the process library takes any Duration:
let result = Process.builder("git")
    .args(["status"])
    .runTimeout(Duration.seconds(5))
    .run();
```

---

## `Instant` & `SystemTime` — "now"

| Factory | Returns | Meaning |
| :--- | :--- | :--- |
| `Time.instantNow()` | `Instant` | Monotonic clock — only useful for measuring elapsed time |
| `Time.systemTimeNow()` | `SystemTime` | Wall-clock time since the Unix epoch |
| `Time.systemTimeEpoch()` | `SystemTime` | `1970-01-01T00:00:00Z` |
| `Time.systemTimeFromUnixSeconds(sec)` / `…Milliseconds` / `…Microseconds` / `…Nanoseconds` | `SystemTime` | Build from a Unix timestamp |

- `Instant`: `.elapsed()` → `Duration`, `.add`/`.sub`/`.checkedAdd`/`.checkedSub`, `.nanoseconds()`, comparisons, `toString()`.
- `SystemTime`: `.durationSinceEpoch()`, `.epochSeconds()`/`.epochMilliseconds()`, `.toUnixSeconds()`/`…Milliseconds`/`…Microseconds`/`…Nanoseconds`, `.add`/`.sub`, comparisons, `.toUtcDateTime()`.

```adesh
import Time;

let start = Time.instantNow();
// ... do work ...
let elapsed = start.elapsed();
print("Took", elapsed.toString());

let now = Time.systemTimeNow();
print(now.toUnixSeconds());            // seconds since the epoch
```

---

## `Date` — calendar dates

Construct with `Time.dateYmd(year, month, day)` (validated; invalid dates throw `TimeError`). Also `Time.dateToday()` and `Time.dateTodayUtc()`.

| Group | Methods |
| :--- | :--- |
| Accessors | `year()`, `month()`, `day()`, `weekday()`, `dayOfYear()`, `weekOfYear()`, `isLeapYear()`, `daysInMonth()`, `daysInYear()` |
| Arithmetic | `addDays(n)`, `addWeeks(n)`, `addMonths(n)`, `addYears(n)`, `subDays(n)`, `nextDay()`, `previousDay()` |
| Weekday-based | `next(Weekday)`, `previous(Weekday)` |
| Month edges | `firstDayOfMonth()`, `lastDayOfMonth()` |
| Copy-with | `withYear(y)`, `withMonth(m)`, `withDay(d)` |
| Combine | `atStartOfDay()`, `at(TimeOfDay)` → `DateTime` |
| Math | `daysSince(other)`, `toEpochDays()` |
| Compare | `lt`, `gt`, `eq` |
| Output | `format(pattern)`, `toIsoString()` (`yyyy-MM-dd`) |

```adesh
import Time;

let d = Time.dateYmd(2024, 2, 29);       // leap day — valid
print(d.weekday());                      // Thursday
print(d.isLeapYear());                   // true
print(d.addMonths(1).toIsoString());     // 2024-03-29
print(d.daysSince(Time.dateYmd(2024, 1, 1)));  // 59
print(d.next(Time.weekdayFromInt(1)));   // next Monday
```

:::tip
`addMonths`/`addYears` clamp the day to the target month's length (e.g. Jan 31 + 1 month → Feb 29/28).
:::

---

## `TimeOfDay` — time within a day

Construct with `Time.timeOfDay(hour, minute, second, nanosecond)` or `Time.timeNow()` / `Time.timeNowUtc()`.

| Group | Methods |
| :--- | :--- |
| Accessors | `hour()`, `minute()`, `second()`, `nanosecond()`, `millisecond()`, `microsecond()`, `secondsSinceMidnight()` |
| Arithmetic | `addHours(h)`, `subHours(h)`, `addMinutes(m)`, `subMinutes(m)` (wraps around midnight) |
| Compare | `lt`, `gt`, `eq` |
| Output | `toIsoString()` (`HH:mm:ss[.fffffffff]`) |

```adesh
import Time;

let t = Time.timeOfDay(23, 59, 30, 0);
print(t.addMinutes(45).toIsoString());   // 00:44:30 (wraps)
print(t.secondsSinceMidnight());         // 86370
```

---

## `DateTime` — naive local date-time

Construct with `Time.dateTime(date, timeOfDay)` or `Time.dateTimeCreate(y, m, d, h, mi, s, ns)`; get "now" with `Time.dateTimeNow()`.

| Group | Methods |
| :--- | :--- |
| Accessors | `date()`, `time()`, `year()`, `month()`, `day()`, `hour()`, `minute()`, `second()`, `nanosecond()`, `weekday()`, `dayOfYear()` |
| Copy-with | `withYear`, `withMonth`, `withDay`, `withHour`, `withMinute`, `withSecond`, `withNanosecond` |
| Truncate | `truncateToSecond()`, `truncateToMinute()` |
| Arithmetic | `addDays`, `subDays`, `addHours`, `subHours`, `addMonths`, `addYears` |
| Difference | `durationUntil(other)`, `durationSince(other)` |
| Compare | `lt`, `gt`, `eq` |
| Output | `format(pattern)`, `toIsoString()` (`yyyy-MM-ddTHH:mm:ss[.n]`) |

```adesh
import Time;

let dt = Time.dateTime(Time.dateYmd(2024, 6, 21), Time.timeOfDay(10, 30, 0, 0));
let nextWeek = dt.addDays(7);

print(dt.toIsoString());                 // 2024-06-21T10:30:00
print(dt.durationUntil(nextWeek));       // 7d
print(dt.lt(nextWeek));                  // true
print(dt.format("dd/MM/yyyy HH:mm:ss")); // 21/06/2024 10:30:00
```

---

## UTC, Offsets & Timezones

### `UtcDateTime` — exact moment in UTC

Factories: `Time.utcDateTimeNow()`, `Time.utcDateTimeFromUnixSeconds(sec)`, `Time.utcDateTimeFromNanos(ns)`.

| Group | Methods |
| :--- | :--- |
| Unix accessors | `unixSeconds()`, `unixMilliseconds()`, `unixNanoseconds()` |
| Calendar accessors | `year()`…`second()` (computed in UTC) |
| Convert | `toOffset(offset)` → `OffsetDateTime`, `toZone(tz)` → `ZonedDateTime` |
| Arithmetic | `add(d)`, `sub(d)`, `durationSince(other)` |
| Compare | `lt`, `gt`, `eq` |
| Output | `format(pattern)`, `toIsoString()` (`…Z`), `toRfc3339()` |

### `UtcOffset` — fixed offset

Factories: `Time.utcOffsetHours(h)`, `Time.utcOffsetHoursMinutes(h, m)`, `Time.utcOffsetParse("+05:30")`, `Time.utcOffsetZero()`.

Methods: `totalSeconds()`, `hours()`, `minutes()`/`minutesPart()`, `secondsPart()`, `isUtc()`, `isPositive()`, `isNegative()`, `lt`/`gt`/`eq`, `toString()` (`Z`, `+05:30`, `-07:00`).

### `OffsetDateTime` — UTC moment + fixed offset

Factories: `Time.offsetDateTimeNow(offset)`, `Time.offsetDateTimeParse("2024-06-15T08:00:00+05:30")`.

Methods: `offset()`, `toUtc()`, `toOffset(newOffset)`/`withOffset(newOffset)`, `unixSeconds()`, calendar accessors (`date()`, `time()`, `year()`…`second()` in local terms), `add`/`sub`, comparisons, `format`, `toIsoString()`, `toRfc3339()`.

### `TimeZone` & `ZonedDateTime` — named zones

Factories: `Time.timeZoneUtc()`, `Time.timeZoneLocal()`, `Time.timeZoneOf("America/New_York")`, `Time.zonedDateTimeNow(tz)`.

- `TimeZone`: `name()`, `offsetAt(instant)` → `UtcOffset` (resolves DST for the given instant).
- `ZonedDateTime`: `zone()`, `timeZoneName()`, `offset()` (at that instant), `toUtc()`, `toZone(other)`/`withTimeZone(other)`, calendar accessors, `unixSeconds()`, `format`, `toIsoString()` (includes `XXX` offset).

```adesh
import Time;

let utc = Time.utcDateTimeParse("2024-06-15T08:00:00Z");

// Fixed offset
let ist = utc.toOffset(Time.utcOffsetHoursMinutes(5, 30));
print(ist.toIsoString());                // 2024-06-15T13:30:00.000000+05:30

// Named zone (DST-aware)
let ny = utc.toZone(Time.timeZoneOf("America/New_York"));
print(ny.toIsoString());                 // ...-04:00 (EDT in June)

// RFC 3339 round-trip
let odt = Time.offsetDateTimeParse("2024-06-15T08:00:00-07:00");
print(odt.toUtc().toIsoString());        // 2024-06-15T15:00:00.000000Z
```

---

## `Weekday` & `Month`

Construct via `Time.weekdayFromInt(n)` (0=Monday…6=Sunday) or `Time.monthFromInt(m)` (1–12).

- `Weekday`: `numberFromMonday()` (0=Mon), `numberFromSunday()` (0=Sun), `isWeekend()`, `next()`, `previous()`, `name()`, `shortName()`.
- `Month`: `number()`, `days()` (non-leap), `daysInYear(y)`, `daysIn(year)`, `next()`, `previous()`, `name()`, `shortName()`.

---

## `Period` — calendar spans

A span of `(years, months, days)` that respects calendar rules when applied to a `Date`.

Factories: `Time.period(y, m, d)`, `Time.periodYears(y)`, `Time.periodMonths(m)`, `Time.periodDays(d)`, `Time.periodBetween(start, end)`.

| Group | Methods |
| :--- | :--- |
| Accessors | `years()`, `months()`, `days()` |
| Arithmetic | `add(other)`, `sub(other)`, `negated()`, `abs()` |
| Apply to date | `addToDate(date)`, `subFromDate(date)` |
| Output | `toString()` (ISO `PnYnMnD`, `P0D` for zero) |

```adesh
import Time;

let age = Time.period(1, 6, 10);            // 1y 6m 10d
print(age.addToDate(Time.dateYmd(2024, 1, 31)).toIsoString()); // 2025-08-10
print(age.toString());                      // P1Y6M10D
print(Time.periodBetween(
    Time.dateYmd(2023, 6, 1),
    Time.dateYmd(2024, 6, 1)
).toString());
```

---

## `Stopwatch`, `Timer`, `Interval`, `Measurement`

| Class / fn | Purpose | Key methods |
| :--- | :--- | :--- |
| `Time.stopwatch()` / `Time.stopwatchStartNew()` | Elapsed-time measurement | `start()`, `stop()` (pause), `reset()`, `restart()`, `lap()` → `Duration`, `elapsed()`, `isRunning()` |
| `Time.timerAfter(duration)` / `Time.timerAt(instant)` | A future instant | `wait()` (block until due), `cancel()`, `isCancelled()`, `isFinished()` |
| `Time.timeInterval(duration)` | Repeating tick schedule | `next()` (blocks until the next tick) |
| `Time.timeMeasure(callback)` | Time a callable | returns `Measurement`: `.value()`, `.duration()` |

```adesh
import Time;

// Stopwatch with laps:
let sw = Time.stopwatchStartNew();
// ... work ...
print("lap:", sw.lap());
// ... more work ...
print("total:", sw.elapsed().toString());

// Time a function call:
let m = Time.timeMeasure(fn() {
    return 40 + 2;
});
print(m.value());               // 42
print(m.duration().toString());

// Block for a fixed amount:
Time.timeSleep(Duration.milliseconds(100));
```

---

## Parsing & Formatting

**Formatting** — every date/time class has `.format(pattern)`. Common tokens (used throughout the examples):

| Token | Meaning | Example |
| :--- | :--- | :--- |
| `yyyy` | 4-digit year | `2024` |
| `MM` | zero-padded month | `06` |
| `MMM` / `MMMM` | short / full month name | `Jun` / `June` |
| `dd` | zero-padded day | `05` |
| `HH` | zero-padded hour (24 h) | `15` |
| `mm` | zero-padded minute | `08` |
| `ss` | zero-padded second | `03` |
| `f…` | fractional seconds (`ffffff` = 6 digits) | `750000` |
| `XXX` | offset (`Z`, `+05:30`) | `+05:30` |
| `'T'` | literal text | `T` |

**Parsing** — factory functions return `null` (not a throw) on failure:

| Function | Input format |
| :--- | :--- |
| `Time.dateParse("2024-06-21")` | `yyyy-MM-dd` |
| `Time.timeOfDayParse("10:30:00.5")` | `HH:mm:ss[.f]` |
| `Time.dateTimeParse(text, pattern)` | any pattern, e.g. `"dd/MM/yyyy HH:mm:ss"` |
| `Time.utcDateTimeParse("2024-06-15T08:00:00Z")` | RFC 3339 |
| `Time.offsetDateTimeParse("2024-06-15T08:00:00+05:30")` | RFC 3339 |
| `Time.utcOffsetParse("+05:30")` | offset string |

```adesh
import Time;

let dt = Time.dateTimeParse("25/12/2023 23:59:59", "dd/MM/yyyy HH:mm:ss");
print(dt.year());                    // 2023

let utc = Time.utcDateTimeParse("2024-01-01T00:00:00Z");
print(utc.unixSeconds());            // 1704067200

// Round-trip: format then parse with the same pattern
let now = Time.dateTimeNow();
let s = now.format("yyyy-MM-dd HH:mm:ss");
let back = Time.dateTimeParse(s, "yyyy-MM-dd HH:mm:ss");
print(now.eq(back));                 // true
```

---

## Complete example

A small utility that prints the current date/time in a few timezones and measures how long it took.

```adesh
import Time;

print("--- Time zone report ---");

let start = Time.instantNow();

let utc = Time.utcDateTimeNow();
print("UTC       :", utc.toRfc3339());

let ist = utc.toOffset(Time.utcOffsetHoursMinutes(5, 30));
print("IST       :", ist.toIsoString());

let ny = utc.toZone(Time.timeZoneOf("America/New_York"));
print("New York  :", ny.format("yyyy-MM-dd HH:mm:ss XXX"));

let local = Time.dateTimeNow();
print("Local     :", local.format("MMMM d, yyyy"));

let elapsed = start.elapsed();
print("Report took:", elapsed.toString());
```

---

## Notes & edge cases

- **Nanosecond precision**: `Duration` and all "moment" classes store a `bigint` nanosecond count. Use `wholeSeconds()` / `asSecondsF64()` for coarser units.
- **`Instant` is monotonic** (safe for elapsed measurement); `SystemTime` is wall-clock (can jump with NTP/DST adjustments). Prefer `Instant` for stopwatch-style timing.
- **Validation**: `new Date(...)` / `TimeOfDay` validate ranges and throw `TimeError` (`kind()` = `"InvalidDate"` / `"InvalidTimeOfDay"`). `Time.dateYmd` and friends are thin aliases — invalid input still throws.
- **`addMonths`/`addYears` clamp** the day to the target month's last day.
- **Parsers return `null`** on malformed input instead of throwing; `dateTimeParse` returns `null` when the pattern doesn't match.
- **Named timezones** resolve the DST offset for the specific instant (`TimeZone.offsetAt`); unknown zone names fall back to `UtcOffset(0)`.
- `Time.sleep`/`Process.runTimeout` accept any `Duration` (`Duration.seconds(n)`, `Duration.milliseconds(n)`, …).
- Weekdays are **Monday-based** internally (`0`=Monday…`6`=Sunday); `Weekday.numberFromSunday()` gives the JS/POSIX-style numbering.
- Formatting uses the shared `time.format` engine, so the same tokens work for `Date`, `DateTime`, `UtcDateTime`, `OffsetDateTime`, and `ZonedDateTime`.

## Source & examples

- Implementation: `src/stdlib/Time.adesh` (native backing: `time.*` builtins)
- Runnable examples: `examples/Libraries/time/` (`01_duration` … `20_real_world` — duration, instant, date, time-of-day, datetime, utc/offset/zoned datetime, formatting, parsing, period, stopwatch, benchmarking, timezone conversion, real-world)

## Related

- [Builtin Libraries Overview](overview)
- [Process Library](process) — timeouts take `Duration` values
- [Math Library](math) — `Math.round`/`Math.floor` used by time conversions
- [Standard Library Overview](overview)
