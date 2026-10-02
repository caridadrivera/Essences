import { AppState } from 'react-native'
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { supabaseUrl, supabaseAnonKey } from '../lib/supabaseConfig';


export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    logger: (kind, message, detail) => {
      const messageText = String(message)
      const closeCode = detail?.code
      const isFailure = /error|timeout/i.test(messageText)
        || (kind === 'transport' && messageText === 'close' && closeCode !== 1000)

      if (!isFailure) return

      console.warn('[Supabase Realtime]', {
        kind,
        message: messageText.replace(/notifications-badge:[^\s]+/g, 'notifications-badge:[redacted]'),
        detail: detail instanceof Error ? detail.message : detail?.message || detail?.reason,
        closeCode,
      })
    },
  },
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})


AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})