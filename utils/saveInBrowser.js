/**
 * Define utils to save/load canvas status with local storage
 */

/**
 * Save a value to local storage
 * @param {string} name - The key under which to store the value
 * @param {any} value - The value to save (objects are stringified)
 */
function save(name, value) {
  // If item is an object, stringify it
  if (value instanceof Object) {
    value = JSON.stringify(value);
  }
  localStorage.setItem(name, value);
}

/**
 * Load a value from local storage
 * @param {string} name - The key to retrieve the value from
 * @returns {any} - The parsed value (JSON-parsed if applicable)
 */
function load(name) {
  let value = localStorage.getItem(name);
  try {
    value = JSON.parse(value);
  } catch (e) {
    // If parsing fails, return the raw value (e.g., if it wasn’t JSON)
  }
  return value;
}

/**
 * Remove a value from local storage
 * @param {string} name - The key to remove
 */
function remove(name) {
  localStorage.removeItem(name);
}

export { save, load, remove };
