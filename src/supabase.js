import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://oxdwxkodqdqmcqeruzct.supabase.co'
const SUPABASE_KEY = 'sb_publishable_l0pwM4TPPN9rpbfVfcQltw_Rm4G_pMA'

const capacitorStorage = {
  async getItem(key) {
    try {
      const { Preferences } = await import('@capacitor/preferences')
      const { value } = await Preferences.get({ key })
      return value
    } catch {
      return localStorage.getItem(key)
    }
  },
  async setItem(key, value) {
    try {
      const { Preferences } = await import('@capacitor/preferences')
      await Preferences.set({ key, value })
    } catch {
      localStorage.setItem(key, value)
    }
  },
  async removeItem(key) {
    try {
      const { Preferences } = await import('@capacitor/preferences')
      await Preferences.remove({ key })
    } catch {
      localStorage.removeItem(key)
    }
  }
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: capacitorStorage,
    storageKey: 'defervescence-auth-token',
  }
})