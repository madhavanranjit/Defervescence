import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://oxdwxkodqdqmcqeruzct.supabase.co'
const SUPABASE_KEY = 'sb_publishable_l0pwM4TPPN9rpbfVfcQltw_Rm4G_pMA'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)