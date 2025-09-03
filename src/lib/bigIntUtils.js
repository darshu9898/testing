// src/lib/bigIntUtils.js
// Generic BigInt handling utilities that work across all Node.js versions and platforms

// Global BigInt serialization fix - apply once at app startup
if (typeof BigInt !== "undefined" && !BigInt.prototype.toJSON) {
    BigInt.prototype.toJSON = function () {
      return this.toString()
    }
  }
  
  /**
   * JSON replacer function that converts BigInt to string
   * Use with JSON.stringify(data, bigIntReplacer)
   */
  export function bigIntReplacer(key, value) {
    return typeof value === 'bigint' ? value.toString() : value
  }
  
  /**
   * Deep converts BigInt values to strings in nested objects/arrays
   * @param {*} obj - Object to convert
   * @returns {*} - Object with BigInt values converted to strings
   */
  export function convertBigInts(obj) {
    if (obj === null || obj === undefined) return obj
    
    if (typeof obj === 'bigint') {
      return obj.toString()
    }
    
    if (Array.isArray(obj)) {
      return obj.map(convertBigInts)
    }
    
    if (typeof obj === 'object') {
      const converted = {}
      for (const [key, value] of Object.entries(obj)) {
        converted[key] = convertBigInts(value)
      }
      return converted
    }
    
    return obj
  }
  
  /**
   * Safely converts a value to BigInt
   * @param {*} value - Value to convert
   * @returns {BigInt|null} - BigInt value or null if invalid
   */
  export function safeToBigInt(value) {
    if (value === null || value === undefined || value === '') {
      return null
    }
    
    try {
      return BigInt(value)
    } catch (error) {
      console.warn(`Failed to convert ${value} to BigInt:`, error.message)
      return null
    }
  }
  
  /**
   * Safely converts BigInt to string
   * @param {*} value - Value to convert
   * @returns {string|null} - String value or null
   */
  export function safeFromBigInt(value) {
    if (value === null || value === undefined) {
      return null
    }
    
    if (typeof value === 'bigint') {
      return value.toString()
    }
    
    return String(value)
  }
  
  /**
   * Safe JSON stringify that handles BigInt values
   * @param {*} obj - Object to stringify
   * @param {number} space - JSON spacing
   * @returns {string} - JSON string
   */
  export function safeJsonStringify(obj, space = 0) {
    try {
      // First try deep conversion
      const convertedObj = convertBigInts(obj)
      return JSON.stringify(convertedObj, bigIntReplacer, space)
    } catch (error) {
      console.error('Failed to stringify object:', error)
      // Fallback to basic replacer only
      return JSON.stringify(obj, bigIntReplacer, space)
    }
  }
  
  /**
   * Middleware helper for Express responses with BigInt handling
   * @param {Object} res - Express response object
   * @param {number} statusCode - HTTP status code
   * @param {*} data - Data to send
   */
  export function sendJsonResponse(res, statusCode, data) {
    const jsonString = safeJsonStringify(data)
    return res
      .status(statusCode)
      .setHeader('Content-Type', 'application/json')
      .send(jsonString)
  }
  
  /**
   * Validate and convert phone number to BigInt
   * @param {*} phone - Phone number to validate
   * @returns {{isValid: boolean, value: BigInt|null, error?: string}}
   */
  export function validatePhoneNumber(phone) {
    if (phone === null || phone === undefined || phone === '') {
      return { isValid: true, value: null }
    }
    
    const phoneStr = String(phone).trim()
    
    // Basic validation - adjust regex based on your requirements
    const phoneRegex = /^\+?[1-9]\d{1,14}$/ // E.164 format
    
    if (!phoneRegex.test(phoneStr)) {
      return { 
        isValid: false, 
        value: null, 
        error: 'Invalid phone number format' 
      }
    }
    
    try {
      const bigIntValue = BigInt(phoneStr.replace(/\D/g, '')) // Remove non-digits
      return { isValid: true, value: bigIntValue }
    } catch (error) {
      return { 
        isValid: false, 
        value: null, 
        error: 'Phone number too large or invalid' 
      }
    }
  }