import { describe, it, expect } from 'vitest'
import {
  AppError,
  ApiError,
  NetworkError,
  ParseError,
  ValidationError,
  normalizeError,
  isAppError,
  isApiError,
  isNetworkError
} from './errors'

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create error with code and message', () => {
      const error = new AppError('UNKNOWN', 'Something went wrong')

      expect(error.code).toBe('UNKNOWN')
      expect(error.message).toBe('Something went wrong')
      expect(error.name).toBe('AppError')
    })

    it('should include details', () => {
      const error = new AppError('VALIDATION_ERROR', 'Invalid input', { field: 'email' })

      expect(error.details).toEqual({ field: 'email' })
    })

    it('should serialize to JSON', () => {
      const error = new AppError('API_ERROR', 'Failed', { statusCode: 500 })
      const json = error.toJSON()

      expect(json).toEqual({
        name: 'AppError',
        code: 'API_ERROR',
        message: 'Failed',
        details: { statusCode: 500 }
      })
    })
  })

  describe('ApiError', () => {
    it('should create API error with status code and endpoint', () => {
      const error = new ApiError(404, 'Not found', '/api/users/123')

      expect(error.statusCode).toBe(404)
      expect(error.endpoint).toBe('/api/users/123')
      expect(error.code).toBe('API_ERROR')
      expect(error.name).toBe('ApiError')
    })
  })

  describe('NetworkError', () => {
    it('should create network error', () => {
      const error = new NetworkError('Connection failed', 'https://api.example.com')

      expect(error.code).toBe('NETWORK_ERROR')
      expect(error.endpoint).toBe('https://api.example.com')
      expect(error.name).toBe('NetworkError')
    })
  })

  describe('ParseError', () => {
    it('should create parse error with truncated raw data', () => {
      const longData = 'a'.repeat(200)
      const error = new ParseError('Invalid JSON', longData)

      expect(error.code).toBe('PARSE_ERROR')
      expect(error.name).toBe('ParseError')
      // Should truncate to 100 chars
      expect((error.details as { rawData: string }).rawData.length).toBe(100)
    })
  })

  describe('ValidationError', () => {
    it('should create validation error with field', () => {
      const error = new ValidationError('Email is required', 'email')

      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.field).toBe('email')
      expect(error.name).toBe('ValidationError')
    })
  })
})

describe('normalizeError', () => {
  it('should return AppError as-is', () => {
    const original = new AppError('UNKNOWN', 'Test error')
    const normalized = normalizeError(original)

    expect(normalized).toBe(original)
  })

  it('should convert standard Error to AppError', () => {
    const original = new Error('Standard error')
    const normalized = normalizeError(original)

    expect(normalized).toBeInstanceOf(AppError)
    expect(normalized.message).toBe('Standard error')
    expect(normalized.code).toBe('UNKNOWN')
  })

  it('should convert fetch TypeError to NetworkError', () => {
    const original = new TypeError('Failed to fetch')
    const normalized = normalizeError(original)

    expect(normalized).toBeInstanceOf(NetworkError)
    expect(normalized.code).toBe('NETWORK_ERROR')
  })

  it('should handle AbortError', () => {
    // Create an error with name='AbortError' to simulate abort
    const original = Object.assign(new Error('Aborted'), { name: 'AbortError' })
    const normalized = normalizeError(original)

    expect(normalized.code).toBe('TIMEOUT')
  })

  it('should convert string to AppError', () => {
    const normalized = normalizeError('String error')

    expect(normalized).toBeInstanceOf(AppError)
    expect(normalized.message).toBe('String error')
  })

  it('should handle unknown types', () => {
    const normalized = normalizeError({ custom: 'object' })

    expect(normalized).toBeInstanceOf(AppError)
    expect(normalized.code).toBe('UNKNOWN')
  })
})

describe('Type guards', () => {
  describe('isAppError', () => {
    it('should return true for AppError', () => {
      expect(isAppError(new AppError('UNKNOWN', 'test'))).toBe(true)
    })

    it('should return true for subclasses', () => {
      expect(isAppError(new ApiError(500, 'test', '/api'))).toBe(true)
    })

    it('should return false for standard Error', () => {
      expect(isAppError(new Error('test'))).toBe(false)
    })
  })

  describe('isApiError', () => {
    it('should return true for ApiError', () => {
      expect(isApiError(new ApiError(500, 'test', '/api'))).toBe(true)
    })

    it('should return false for AppError', () => {
      expect(isApiError(new AppError('API_ERROR', 'test'))).toBe(false)
    })
  })

  describe('isNetworkError', () => {
    it('should return true for NetworkError', () => {
      expect(isNetworkError(new NetworkError('test'))).toBe(true)
    })

    it('should return false for AppError', () => {
      expect(isNetworkError(new AppError('NETWORK_ERROR', 'test'))).toBe(false)
    })
  })
})
