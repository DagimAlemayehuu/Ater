import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ckqjwsmdbspmquxbdrgb.supabase.co'
const supabaseAnonKey = 'sb_publishable_yLvi9672bmTWPM6L3fvKAA_6ULlJ_dQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
