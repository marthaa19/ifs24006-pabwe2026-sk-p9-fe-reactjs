import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import useInput from './useInput'

describe('useInput', () => {
  it('nilai awal default kosong', () => {
    const { result } = renderHook(() => useInput())
    expect(result.current[0]).toBe('')
  })

  it('onChange mengubah nilai & reset mengembalikannya', () => {
    const { result } = renderHook(() => useInput('awal'))
    act(() => result.current[1]({ target: { value: 'baru' } }))
    expect(result.current[0]).toBe('baru')
    act(() => result.current[2]())
    expect(result.current[0]).toBe('awal')
  })

  it('setValue mengubah nilai langsung', () => {
    const { result } = renderHook(() => useInput())
    act(() => result.current[3]('x'))
    expect(result.current[0]).toBe('x')
  })
})
