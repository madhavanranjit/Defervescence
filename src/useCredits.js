import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const FREE_LIMIT = 100

export function useCredits(session) {
  const [credits, setCredits] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session) fetchCredits()
    else setLoading(false)
  }, [session])

  async function fetchCredits() {
    const { data, error } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (error || !data) {
      // Create record if doesn't exist
      const { data: newData } = await supabase
        .from('user_credits')
        .insert({ user_id: session.user.id })
        .select()
        .single()
      setCredits(newData)
    } else {
      setCredits(data)
    }
    setLoading(false)
  }

  async function useCredit() {
    if (!credits) return { allowed: false, reason: 'loading' }

    // Check if free readings available
    if (credits.free_readings_used < FREE_LIMIT) {
      const { data } = await supabase
        .from('user_credits')
        .update({
          free_readings_used: credits.free_readings_used + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', session.user.id)
        .select()
        .single()
      setCredits(data)
      return { allowed: true, remaining: FREE_LIMIT - data.free_readings_used, type: 'free' }
    }

    // Check if paid credits available
    if (credits.paid_credits > 0) {
      const { data } = await supabase
        .from('user_credits')
        .update({
          paid_credits: credits.paid_credits - 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', session.user.id)
        .select()
        .single()
      setCredits(data)
      return { allowed: true, remaining: data.paid_credits, type: 'paid' }
    }

    // No credits left
    return { allowed: false, reason: 'no_credits' }
  }

  const freeRemaining = !session ? 999 : credits ? Math.max(0, FREE_LIMIT - credits.free_readings_used) : FREE_LIMIT
const paidRemaining = !session ? 0 : credits ? credits.paid_credits : 0
const totalRemaining = freeRemaining + paidRemaining
const isPaid = credits ? credits.paid_credits > 0 : false

return { credits, loading, useCredit, freeRemaining, paidRemaining, totalRemaining, isPaid, FREE_LIMIT }
}