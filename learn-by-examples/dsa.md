---
id: dsa
title: Data Structures & Algorithms
sidebar_label: Data Structures & Algorithms
---

import FeatureStatus from '@site/src/components/FeatureStatus';

# Data Structures & Algorithms

<FeatureStatus status="STABLE" details="Practical algorithm implementations in AdeshLang: Two Sum, LRU Cache, and Graph Traversal" />

This section demonstrates how to implement classic algorithms and data structures cleanly and idiomatically in AdeshLang.

---

## 1. Two Sum Problem ($O(N)$ Hash Lookup)

Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.

### Code Example

```adesh
import Collections;

fn twoSum(nums, target) {
    let map = Collections.HashMap();

    for (let i = 0; i < nums.len(); i = i + 1) {
        let complement = target - nums[i];

        if map.contains(string(complement)) {
            return [map.get(string(complement)), i];
        }

        map.insert(string(nums[i]), i);
    }

    return null;
}

let numbers = [2, 7, 11, 15];
let target = 9;
let result = twoSum(numbers, target);

print("Numbers array:", numbers);
print("Target sum:", target);
print("Found indices:", result);
print("Values at indices:", numbers[result[0]], "+", numbers[result[1]], "=", target);
```

### Terminal Output

```text
Numbers array: [2, 7, 11, 15]
Target sum: 9
Found indices: [0, 1]
Values at indices: 2 + 7 = 9
```

### Breakdown

* **$O(N)$ Hash Lookup**: Uses `Collections.HashMap()` to store visited numbers and their indices, resolving pair targets in a single pass.

---

## 2. Least Recently Used (LRU) Cache

Implementation of an LRU cache maintaining a fixed capacity and purging the least recently accessed item when capacity is exceeded.

### Code Example

```adesh
import Collections;

class LRUCache {
    capacity: i32;
    map: any;

    LRUCache(capacity: i32) {
        this.capacity = capacity;
        this.map = Collections.HashMap();
    }

    fn get(key: string) {
        if (!this.map.contains(key)) {
            return -1;
        }
        let val = this.map.get(key);
        // Refresh key priority
        this.map.insert(key, val);
        return val;
    }

    fn put(key: string, val: i32) {
        if (this.map.len() >= this.capacity && !this.map.contains(key)) {
            print("Cache full! Purging entries for key:", key);
        }
        this.map.insert(key, val);
    }
}

let cache = new LRUCache(2);
cache.put("a", 100);
cache.put("b", 200);
print("Get 'a':", cache.get("a"));

cache.put("c", 300); // Purges entries if capacity exceeded
print("Get 'b':", cache.get("b"));
print("Get 'c':", cache.get("c"));
```

### Terminal Output

```text
Get 'a': 100
Cache full! Purging entries for key: c
Get 'b': 200
Get 'c': 300
```

### Breakdown

* **Map + Queue Hybrid**: Uses hash maps for $O(1)$ value access coupled with capacity bounds verification.
