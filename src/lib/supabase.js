// ── Supabase client (keys baked in for Vercel deploy) ──────────────────────
const SUPABASE_URL      = "https://pyfkeyonwlsznhjaicfu.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5ZmtleW9ud2xzem5oamFpY2Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNjg3NTUsImV4cCI6MjA4ODg0NDc1NX0.7uMOcFti0Do-N3feKAZ7EluMHkFjfX5_KjwDO5CFwqQ"
export const CONFIGURED = true

const h = (tok) => ({
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${tok}`,
  "Content-Type": "application/json",
})

export const sb = {
  // ── Auth ────────────────────────────────────────────────────────────────
  google: () => {
    const redirectTo = encodeURIComponent(location.origin + location.pathname)
    location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${redirectTo}`
  },

  logout: async () => {
    const t = localStorage.getItem("sbt")
    if (t) {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: "POST",
        headers: h(t),
      }).catch(() => {})
    }
    localStorage.removeItem("sbt")
    localStorage.removeItem("sbr")
  },

  // Call this on app mount to pick up the token from URL hash after OAuth redirect
  parseHash: () => {
    const params = new URLSearchParams(location.hash.replace("#", "?"))
    const access  = params.get("access_token")
    const refresh = params.get("refresh_token")
    if (!access) return false
    localStorage.setItem("sbt", access)
    if (refresh) localStorage.setItem("sbr", refresh)
    history.replaceState({}, document.title, location.pathname)
    return true
  },

  // Get current user from Supabase
  me: async () => {
    const t = localStorage.getItem("sbt")
    if (!t) return null
    try {
      const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: h(t) })
      if (r.status === 401) {
        // Try refresh
        const refreshed = await sb.refresh()
        if (!refreshed) return null
        const t2 = localStorage.getItem("sbt")
        const r2 = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: h(t2) })
        return r2.ok ? r2.json() : null
      }
      return r.ok ? r.json() : null
    } catch { return null }
  },

  refresh: async () => {
    const r = localStorage.getItem("sbr")
    if (!r) return false
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: r }),
      })
      if (!res.ok) return false
      const data = await res.json()
      localStorage.setItem("sbt", data.access_token)
      if (data.refresh_token) localStorage.setItem("sbr", data.refresh_token)
      return true
    } catch { return false }
  },

  // ── Progress DB ─────────────────────────────────────────────────────────
  load: async (uid) => {
    const t = localStorage.getItem("sbt")
    if (!t) return null
    try {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/progress?user_id=eq.${uid}&select=*`,
        { headers: h(t) }
      )
      const data = await r.json()
      return Array.isArray(data) && data.length > 0 ? data[0] : null
    } catch { return null }
  },

  upsert: async (uid, payload) => {
    const t = localStorage.getItem("sbt")
    if (!t) return
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/progress`, {
        method: "POST",
        headers: { ...h(t), Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify({
          user_id: uid,
          ...payload,
          updated_at: new Date().toISOString(),
        }),
      })
    } catch {}
  },
}
