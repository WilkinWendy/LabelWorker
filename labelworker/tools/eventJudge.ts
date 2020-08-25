/**
 * alt是否按下
 * @param e
 */
export function isAltKey(e: KeyboardEvent) {
  return e.key === 'Alt'
}

/**
 * alt是否按下
 * @param e
 */
export function isStrictCtrlKey(e: KeyboardEvent) {
  return e.key === 'Control' && !e.altKey && !e.shiftKey
}

/**
 * 只有鼠标左键
 * @param e
 */
export function isOnlyLeftMouseKey(e: MouseEvent) {
  if (!e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
    return true
  } else {
    return false
  }
}

/**
 * 包含鼠标左键
 * @param e
 */
export function isLeftMouseKey(e: MouseEvent) {
  if (e.button === 0) {
    return true
  } else {
    return false
  }
}

/**
 * 只有鼠标右键
 * @param e
 */
export function isOnlyRightMouseKey(e: MouseEvent) {
  if (!e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 2) {
    return true
  } else {
    return false
  }
}

/**
 * 是否严格ctrl + key
 * @param key
 * @param e
 */
export function isKeyDownWithOnlyCtrl(key: string, e: KeyboardEvent) {
  return (
    (key.toLowerCase() === e.key.toLowerCase() ||
      key.toLowerCase() === e.code.toLowerCase() ||
      ('Digit' + key).toLowerCase() === e.code.toLowerCase()) &&
    e.ctrlKey &&
    !e.shiftKey &&
    !e.altKey
  )
}

/**
 * 是否严格alt + key
 * @param key
 * @param e
 */
export function isKeyDownWithOnlyAlt(key: string, e: KeyboardEvent) {
  return (
    (key.toLowerCase() === e.key.toLowerCase() ||
      key.toLowerCase() === e.code.toLowerCase() ||
      ('Digit' + key).toLowerCase() === e.code.toLowerCase()) &&
    !e.ctrlKey &&
    !e.shiftKey &&
    e.altKey
  )
}

/**
 * 是否严格shift + key
 * @param key
 * @param e
 */
export function isKeyDownWithOnlyShift(key: string, e: KeyboardEvent) {
  return (
    (key.toLowerCase() === e.key.toLowerCase() ||
      key.toLowerCase() === e.code.toLowerCase() ||
      ('Digit' + key).toLowerCase() === e.code.toLowerCase()) &&
    !e.ctrlKey &&
    e.shiftKey &&
    !e.altKey
  )
}

/**
 * 是否按下key
 * @param key
 * @param e
 */
export function isKeyDown(key: string, e: KeyboardEvent) {
  return (
    key.toLowerCase() === e.key.toLowerCase() ||
    key.toLowerCase() === e.code.toLowerCase() ||
    ('Digit' + key).toLowerCase() === e.code.toLowerCase()
  )
}

/**
 * 是否严格key
 * @param key
 * @param e
 */
export function isKeyDownOnly(key: string, e: KeyboardEvent) {
  return (
    (key.toLowerCase() === e.key.toLowerCase() ||
      key.toLowerCase() === e.code.toLowerCase() ||
      ('Digit' + key).toLowerCase() === e.code.toLowerCase()) &&
    !e.ctrlKey &&
    !e.shiftKey &&
    !e.altKey
  )
}
