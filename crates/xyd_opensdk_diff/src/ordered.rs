//! Insertion-ordered `Map`/`Set` with JS collection semantics.
//!
//! `diff.ts` builds `new Map(array.map(x => [key(x), x]))` and iterates it, so
//! two properties are observable and both matter:
//!
//! 1. **Iteration follows insertion order**, not key order — the change list is
//!    emitted in spec-document order.
//! 2. **A duplicate key keeps the FIRST position but takes the LAST value.**
//!    Two methods with the same action, or two params with the same name,
//!    collapse to one entry holding the later object. `24.duplicate-keys` in
//!    the golden corpus pins this.
//!
//! `new Set(...)` has the same first-position/dedup rule.

use std::collections::HashMap;
use std::hash::Hash;

/// `new Map(entries)` — insertion-ordered, last-value-wins.
pub struct OrderedMap<K: Eq + Hash + Clone, V> {
    slots: Vec<(K, V)>,
    index: HashMap<K, usize>,
}

impl<K: Eq + Hash + Clone, V> Default for OrderedMap<K, V> {
    fn default() -> Self {
        Self {
            slots: Vec::new(),
            index: HashMap::new(),
        }
    }
}

impl<K: Eq + Hash + Clone, V> OrderedMap<K, V> {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn set(&mut self, key: K, value: V) {
        match self.index.get(&key) {
            Some(&at) => self.slots[at].1 = value,
            None => {
                self.index.insert(key.clone(), self.slots.len());
                self.slots.push((key, value));
            }
        }
    }

    pub fn get(&self, key: &K) -> Option<&V> {
        self.index.get(key).map(|&at| &self.slots[at].1)
    }

    pub fn has(&self, key: &K) -> bool {
        self.index.contains_key(key)
    }

    /// `map.entries()` — insertion order.
    pub fn iter(&self) -> impl Iterator<Item = (&K, &V)> {
        self.slots.iter().map(|(k, v)| (k, v))
    }
}

/// `new Set(values)` — insertion-ordered, deduped on first occurrence.
pub struct OrderedSet<T: Eq + Hash + Clone> {
    slots: Vec<T>,
    index: HashMap<T, ()>,
}

impl<T: Eq + Hash + Clone> Default for OrderedSet<T> {
    fn default() -> Self {
        Self {
            slots: Vec::new(),
            index: HashMap::new(),
        }
    }
}

impl<T: Eq + Hash + Clone> OrderedSet<T> {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn add(&mut self, value: T) {
        if self.index.insert(value.clone(), ()).is_none() {
            self.slots.push(value);
        }
    }

    pub fn has(&self, value: &T) -> bool {
        self.index.contains_key(value)
    }

    pub fn iter(&self) -> impl Iterator<Item = &T> {
        self.slots.iter()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn duplicate_key_keeps_first_position_and_last_value() {
        let mut m: OrderedMap<&str, i32> = OrderedMap::new();
        m.set("a", 1);
        m.set("b", 2);
        m.set("a", 3);
        let seen: Vec<(&str, i32)> = m.iter().map(|(k, v)| (*k, *v)).collect();
        assert_eq!(seen, vec![("a", 3), ("b", 2)]);
    }

    #[test]
    fn set_dedups_on_first_occurrence() {
        let mut s: OrderedSet<&str> = OrderedSet::new();
        s.add("x");
        s.add("y");
        s.add("x");
        assert_eq!(s.iter().copied().collect::<Vec<_>>(), vec!["x", "y"]);
        assert!(s.has(&"y"));
        assert!(!s.has(&"z"));
    }
}
