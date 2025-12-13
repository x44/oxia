export function getOrCreateMapEntry<K, V>(map: Map<K, V>, key: K, create: () => V) {
	let val = map.get(key);
	if (!val) map.set(key, val = create());
	return val;
}
