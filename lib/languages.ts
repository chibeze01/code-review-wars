import type { Language } from '@/types'

// Order = display order in the setup grid. Kept to languages that actually show
// up in code-review rounds, including the finance/trading stack (C++, Java,
// Python, C#, SQL).
export const LANGUAGES: Language[] = [
  'TypeScript',
  'JavaScript',
  'Python',
  'Java',
  'C#',
  'C++',
  'Go',
  'Rust',
  'SQL',
]

// What the generator should produce for each language — keeps a "Python" prompt
// from coming back as a Django view when we wanted a plain service module.
export const LANGUAGE_STYLE: Record<Language, string> = {
  TypeScript: 'modern TypeScript on Node.js — async/await, typed interfaces, no `any`',
  JavaScript: 'modern JavaScript on Node.js — ES modules, async/await',
  Python:     'Python 3 — type hints, dataclasses, standard library plus common packages',
  Java:       'Java 17 — services, records, streams, the usual Spring-flavoured idioms',
  'C#':       '.NET 8 C# — async/await, LINQ, dependency-injected services',
  'C++':      'modern C++17/20 — RAII, smart pointers, STL containers',
  Go:         'idiomatic Go — explicit error returns, small interfaces, goroutines where they fit',
  Rust:       'idiomatic Rust — ownership, Result/Option, no unwrap-everywhere',
  SQL:        'PostgreSQL — queries, stored procedures, migrations and schema changes',
}
