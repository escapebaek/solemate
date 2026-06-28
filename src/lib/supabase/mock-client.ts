'use client'

// Dev-mode mock Supabase client using localStorage

const MOCK_USER = {
  id: 'dev-user-001',
  email: 'admin@test.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
}

function getStore<T = Record<string, unknown>>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(`mock_${key}`) || '[]') as T[]
  } catch {
    return []
  }
}

function setStore(key: string, data: unknown[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(`mock_${key}`, JSON.stringify(data))
}

function getMockSession() {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(localStorage.getItem('mock_session') || 'null')
  } catch {
    return null
  }
}

function uid() {
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

class QueryBuilder {
  private _table: string
  private _filters: Array<{ key: string; value: unknown }> = []
  private _order: { column: string; ascending: boolean } | null = null
  private _isSingle = false
  private _op: 'select' | 'insert' | 'update' | 'delete' = 'select'
  private _payload: Record<string, unknown> | null = null

  constructor(table: string) {
    this._table = table
  }

  select(_columns = '*') {
    this._op = 'select'
    return this
  }

  insert(data: Record<string, unknown>) {
    this._op = 'insert'
    this._payload = { ...data }
    return this
  }

  update(data: Record<string, unknown>) {
    this._op = 'update'
    this._payload = { ...data }
    return this
  }

  delete() {
    this._op = 'delete'
    return this
  }

  eq(key: string, value: unknown) {
    this._filters.push({ key, value })
    return this
  }

  order(column: string, opts: { ascending?: boolean } = {}) {
    this._order = { column, ascending: opts.ascending !== false }
    return this
  }

  single() {
    this._isSingle = true
    return Promise.resolve(this._exec())
  }

  then<T>(
    res: ((v: ReturnType<typeof this._exec>) => T | PromiseLike<T>) | null,
    rej?: ((r: unknown) => T | PromiseLike<T>) | null
  ): Promise<T> {
    return Promise.resolve(this._exec()).then(res, rej)
  }

  private _exec() {
    if (typeof window === 'undefined') {
      return { data: this._isSingle ? null : [], error: null }
    }

    const store = getStore(this._table)

    const match = (row: Record<string, unknown>) =>
      this._filters.every(f => row[f.key] === f.value)

    switch (this._op) {
      case 'select': {
        let rows = store.filter(match)
        if (this._order) {
          const { column, ascending } = this._order
          rows = [...rows].sort((a, b) => {
            const av = String(a[column] ?? '')
            const bv = String(b[column] ?? '')
            return ascending ? av.localeCompare(bv) : bv.localeCompare(av)
          })
        }
        return { data: this._isSingle ? (rows[0] ?? null) : rows, error: null }
      }
      case 'insert': {
        const row = {
          id: uid(),
          created_at: new Date().toISOString(),
          ...this._payload,
        }
        setStore(this._table, [...store, row])
        return { data: row, error: null }
      }
      case 'update': {
        const updated = store.map(r =>
          match(r) ? { ...r, ...this._payload } : r
        )
        setStore(this._table, updated)
        return { data: null, error: null }
      }
      case 'delete': {
        setStore(this._table, store.filter(r => !match(r)))
        return { data: null, error: null }
      }
    }
  }
}

class StorageBucketMock {
  private _bucket: string
  constructor(bucket: string) { this._bucket = bucket }

  async upload(path: string, file: File) {
    return new Promise<{ error: null }>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        const store = getStore<{ path: string; url: string }>(`storage_${this._bucket}`)
        setStore(`storage_${this._bucket}`, [
          ...store.filter(s => s.path !== path),
          { path, url: reader.result as string },
        ])
        resolve({ error: null })
      }
      reader.readAsDataURL(file)
    })
  }

  getPublicUrl(path: string) {
    const store = getStore<{ path: string; url: string }>(`storage_${this._bucket}`)
    const item = store.find(s => s.path === path)
    return { data: { publicUrl: item?.url || '' } }
  }
}

class StorageMock {
  from(bucket: string) {
    return new StorageBucketMock(bucket)
  }
}

const mockAuth = {
  getUser: async () => {
    const session = getMockSession()
    return { data: { user: session ? MOCK_USER : null }, error: null }
  },
  signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
    if (email === 'admin@test.com' && password === 'admin123') {
      localStorage.setItem('mock_session', '1')
      return { data: { user: MOCK_USER }, error: null }
    }
    return { data: { user: null }, error: { message: '이메일 또는 비밀번호가 틀렸습니다' } }
  },
  signUp: async () => ({ data: { user: null }, error: null }),
  signOut: async () => {
    localStorage.removeItem('mock_session')
    return { error: null }
  },
}

export function createMockClient() {
  return {
    auth: mockAuth,
    from: (table: string) => new QueryBuilder(table),
    storage: new StorageMock(),
  }
}
