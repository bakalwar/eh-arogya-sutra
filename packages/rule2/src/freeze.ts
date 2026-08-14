export function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Object.isFrozen(value)) {
    return value;
  }
  Object.freeze(value);
  for (const key of Reflect.ownKeys(value as object)) {
    const desc = Object.getOwnPropertyDescriptor(value as object, key);
    if (!desc || 'get' in desc || 'set' in desc) {
      continue;
    }
    const child = desc.value;
    if (child !== null && typeof child === 'object') {
      deepFreeze(child);
    }
  }
  return value;
}

export function canonicalCloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
