import { describe, it, expect } from 'vitest'
import { extractSymbolsFromContent } from '../src/core/symbolExtractor'

describe('extractSymbolsFromContent — TypeScript', () => {
  const ext = '.ts'

  it('extracts exported functions', () => {
    const content = `
export function login(email: string, password: string): User {}
export async function logout(id: string): Promise<void> {}
`
    const { exports } = extractSymbolsFromContent(content, ext)
    expect(exports).toContain('login')
    expect(exports).toContain('logout')
  })

  it('extracts exported classes', () => {
    const content = `export class AuthService {}\nexport abstract class Base {}`
    const { exports } = extractSymbolsFromContent(content, ext)
    expect(exports).toContain('AuthService')
    expect(exports).toContain('Base')
  })

  it('extracts exported constants', () => {
    const content = `export const MAX_RETRIES = 3\nexport let counter = 0`
    const { exports } = extractSymbolsFromContent(content, ext)
    expect(exports).toContain('MAX_RETRIES')
    expect(exports).toContain('counter')
  })

  it('extracts exported types and interfaces', () => {
    const content = `export type UserId = string\nexport interface User { id: string }`
    const { exports } = extractSymbolsFromContent(content, ext)
    expect(exports).toContain('UserId')
    expect(exports).toContain('User')
  })

  it('extracts exported enums', () => {
    const content = `export enum Role { Admin, User, Guest }`
    const { exports } = extractSymbolsFromContent(content, ext)
    expect(exports).toContain('Role')
  })

  it('extracts default exports with name', () => {
    const content = `export default function handler(req: Request) {}`
    const { exports } = extractSymbolsFromContent(content, ext)
    expect(exports).toContain('default:handler')
  })

  it('extracts named re-exports', () => {
    const content = `export { foo, bar }`
    const { exports } = extractSymbolsFromContent(content, ext)
    expect(exports).toContain('foo')
    expect(exports).toContain('bar')
  })

  it('does not include re-exports from other modules', () => {
    const content = `export { foo } from './foo'`
    const { exports } = extractSymbolsFromContent(content, ext)
    expect(exports).not.toContain('foo')
  })

  it('extracts purpose from JSDoc', () => {
    const content = `/**\n * User authentication service\n */\nexport class AuthService {}`
    const { purpose } = extractSymbolsFromContent(content, ext)
    expect(purpose).toBe('User authentication service')
  })

  it('extracts purpose from leading comment', () => {
    const content = `// Handles all payment processing logic\nexport function charge() {}`
    const { purpose } = extractSymbolsFromContent(content, ext)
    expect(purpose).toBe('Handles all payment processing logic')
  })

  it('returns null purpose when no comment', () => {
    const content = `export function foo() {}`
    const { purpose } = extractSymbolsFromContent(content, ext)
    expect(purpose).toBeNull()
  })

  it('caps exports at 10', () => {
    const fns = Array.from({ length: 15 }, (_, i) => `export function fn${i}() {}`).join('\n')
    const { exports } = extractSymbolsFromContent(fns, ext)
    expect(exports.length).toBeLessThanOrEqual(10)
  })

  it('deduplicates exports', () => {
    const content = `export function foo() {}\nexport function foo() {}`
    const { exports } = extractSymbolsFromContent(content, ext)
    expect(exports.filter((e) => e === 'foo').length).toBe(1)
  })

  it('returns typescript as language', () => {
    const { language } = extractSymbolsFromContent('', ext)
    expect(language).toBe('typescript')
  })
})

describe('extractSymbolsFromContent — Python', () => {
  const ext = '.py'

  it('extracts top-level functions', () => {
    const content = `def login(email, password):\n    pass\n\ndef logout(user_id):\n    pass`
    const { exports } = extractSymbolsFromContent(content, ext)
    expect(exports).toContain('login')
    expect(exports).toContain('logout')
  })

  it('extracts async functions', () => {
    const content = `async def fetch_user(id: str):\n    pass`
    const { exports } = extractSymbolsFromContent(content, ext)
    expect(exports).toContain('fetch_user')
  })

  it('excludes private functions', () => {
    const content = `def _private():\n    pass\ndef public():\n    pass`
    const { exports } = extractSymbolsFromContent(content, ext)
    expect(exports).not.toContain('_private')
    expect(exports).toContain('public')
  })

  it('extracts classes', () => {
    const content = `class AuthService:\n    pass\nclass UserModel:\n    pass`
    const { exports } = extractSymbolsFromContent(content, ext)
    expect(exports).toContain('AuthService')
    expect(exports).toContain('UserModel')
  })

  it('extracts module docstring as purpose', () => {
    const content = `"""User authentication module."""\n\ndef login():\n    pass`
    const { purpose } = extractSymbolsFromContent(content, ext)
    expect(purpose).toBe('User authentication module.')
  })

  it('returns python as language', () => {
    const { language } = extractSymbolsFromContent('', ext)
    expect(language).toBe('python')
  })
})

describe('extractSymbolsFromContent — Go', () => {
  const ext = '.go'

  it('extracts exported functions (capitalised)', () => {
    const content = `func Login(email string) User { return User{} }\nfunc logout() {}`
    const { exports } = extractSymbolsFromContent(content, ext)
    expect(exports).toContain('Login')
    expect(exports).not.toContain('logout')
  })

  it('extracts exported types', () => {
    const content = `type AuthService struct {}\ntype privateType struct {}`
    const { exports } = extractSymbolsFromContent(content, ext)
    expect(exports).toContain('AuthService')
    expect(exports).not.toContain('privateType')
  })

  it('extracts receiver methods', () => {
    const content = `func (s *AuthService) Login(email string) User { return User{} }`
    const { exports } = extractSymbolsFromContent(content, ext)
    expect(exports).toContain('Login')
  })

  it('returns go as language', () => {
    const { language } = extractSymbolsFromContent('', ext)
    expect(language).toBe('go')
  })
})

describe('extractSymbolsFromContent — Rust', () => {
  const ext = '.rs'

  it('extracts public functions', () => {
    const content = `pub fn login(email: &str) -> User { todo!() }\nfn private() {}`
    const { exports } = extractSymbolsFromContent(content, ext)
    expect(exports).toContain('login')
    expect(exports).not.toContain('private')
  })

  it('extracts public structs and enums', () => {
    const content = `pub struct AuthService {}\npub enum Role { Admin, User }`
    const { exports } = extractSymbolsFromContent(content, ext)
    expect(exports).toContain('AuthService')
    expect(exports).toContain('Role')
  })

  it('returns rust as language', () => {
    const { language } = extractSymbolsFromContent('', ext)
    expect(language).toBe('rust')
  })
})

describe('extractSymbolsFromContent — edge cases', () => {
  it('handles empty content gracefully', () => {
    const result = extractSymbolsFromContent('', '.ts')
    expect(result.exports).toEqual([])
    expect(result.purpose).toBeNull()
  })

  it('handles unknown extension as text', () => {
    const result = extractSymbolsFromContent('some content', '.xyz')
    expect(result.language).toBe('text')
    expect(result.exports).toEqual([])
  })

  it('handles .js the same as .ts', () => {
    const content = `export function foo() {}`
    const ts = extractSymbolsFromContent(content, '.ts')
    const js = extractSymbolsFromContent(content, '.js')
    expect(ts.exports).toEqual(js.exports)
  })
})
