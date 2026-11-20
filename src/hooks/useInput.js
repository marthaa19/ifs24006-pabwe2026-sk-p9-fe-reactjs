// Custom hook state input form: const [value, onChange, reset, setValue] = useInput('')
import { useState } from 'react'

export default function useInput(initialValue = '') {
  const [value, setValue] = useState(initialValue)
  const onChange = (event) => setValue(event.target.value)
  const reset = () => setValue(initialValue)
  return [value, onChange, reset, setValue]
}
