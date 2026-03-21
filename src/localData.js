export function getLocalReadings(patientId) {
  const all = JSON.parse(localStorage.getItem('localReadings') || '[]')
  return all.filter(r => r.patient_id === patientId)
}

export function saveLocalReading(reading) {
  const all = JSON.parse(localStorage.getItem('localReadings') || '[]')
  all.unshift({ ...reading, id: 'local_' + Date.now(), synced: false })
  localStorage.setItem('localReadings', JSON.stringify(all.slice(0, 200)))
}

export function deleteLocalReading(id) {
  const all = JSON.parse(localStorage.getItem('localReadings') || '[]')
  localStorage.setItem('localReadings', JSON.stringify(all.filter(r => r.id !== id)))
}

export function getLocalMedicines(patientId) {
  const all = JSON.parse(localStorage.getItem('localMedicines') || '[]')
  return all.filter(m => m.patient_id === patientId)
}

export function saveLocalMedicine(medicine) {
  const all = JSON.parse(localStorage.getItem('localMedicines') || '[]')
  all.unshift({ ...medicine, id: 'local_' + Date.now(), synced: false })
  localStorage.setItem('localMedicines', JSON.stringify(all.slice(0, 200)))
}

export function deleteLocalMedicine(id) {
  const all = JSON.parse(localStorage.getItem('localMedicines') || '[]')
  localStorage.setItem('localMedicines', JSON.stringify(all.filter(m => m.id !== id)))
}