import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './supabase'

const PatientContext = createContext(null)

export function PatientProvider({ session, children }) {
  const [patients, setPatients] = useState([])
  const [activePatient, setActivePatient] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchPatients() }, [session])

  async function fetchPatients() {
    const { data } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at')
    if (data) {
      setPatients(data)
      // Load last used patient or default to first
      const lastId = localStorage.getItem('activePatientId')
      const found = data.find(p => p.id === lastId)
      setActivePatient(found || data[0] || null)
    }
    setLoading(false)
  }

  async function addPatient(name, relation) {
    const { data, error } = await supabase
      .from('patients')
      .insert({ user_id: session.user.id, name, relation })
      .select()
      .single()
    if (data) {
      setPatients(prev => [...prev, data])
      setActivePatient(data)
      localStorage.setItem('activePatientId', data.id)
    }
    return { data, error }
  }

  async function deletePatient(id) {
    await supabase.from('patients').delete().eq('id', id)
    const remaining = patients.filter(p => p.id !== id)
    setPatients(remaining)
    if (activePatient?.id === id) {
      setActivePatient(remaining[0] || null)
      localStorage.setItem('activePatientId', remaining[0]?.id || '')
    }
  }

  function switchPatient(patient) {
    setActivePatient(patient)
    localStorage.setItem('activePatientId', patient.id)
  }

  return (
    <PatientContext.Provider value={{ patients, activePatient, loading, addPatient, deletePatient, switchPatient, fetchPatients }}>
      {children}
    </PatientContext.Provider>
  )
}

export function usePatient() {
  return useContext(PatientContext)
}