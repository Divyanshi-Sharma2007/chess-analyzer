const PREFIX = 'chess-analyzer:'

export function loadSetting(key, fallback) {
  try {
    const v = localStorage.getItem(PREFIX + key)
    return v === null ? fallback : JSON.parse(v)
  } catch {
    return fallback
  }
}

export function saveSetting(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* storage blocked, ignore */
  }
}