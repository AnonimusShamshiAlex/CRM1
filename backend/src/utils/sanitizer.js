/**
 * Sanitizes request data by converting empty strings and "Invalid date" values to null.
 * This prevents PostgreSQL from throwing "invalid input syntax for type uuid" or date errors.
 * 
 * @param {Object} data The data object to sanitize (usually req.body)
 * @returns {Object} The sanitized data object
 */
const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') return data;

  const sanitized = { ...data };

  Object.keys(sanitized).forEach((key) => {
    const value = sanitized[key];
    
    if (value === '' || value === 'Invalid date') {
      sanitized[key] = null;
    } else if (Array.isArray(value)) {
      // Optional: recursively sanitize arrays if needed, but usually not for our case
    } else if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
      // Optional: recursively sanitize nested objects
      // sanitized[key] = sanitizeData(value);
    }
  });

  return sanitized;
};

module.exports = {
  sanitizeData,
};
