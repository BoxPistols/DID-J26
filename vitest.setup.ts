import { beforeEach } from 'vitest'

// LocalStorage mock implementation
class LocalStorageMock implements Storage {
  private store: Record<string, string> = Object.create(null)

  get length(): number {
    return Object.keys(this.store).length
  }

  clear(): void {
    this.store = Object.create(null)
  }

  getItem(key: string): string | null {
    return this.store[key] ?? null
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store)
    return keys[index] ?? null
  }

  removeItem(key: string): void {
    delete this.store[key]
  }

  setItem(key: string, value: string): void {
    this.store[key] = value
  }
}

// Setup localStorage and sessionStorage mocks
const localStorageMock = new LocalStorageMock()
const sessionStorageMock = new LocalStorageMock()

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true
})

Object.defineProperty(globalThis, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true
})

beforeEach(() => {
  localStorageMock.clear()
  sessionStorageMock.clear()
})
