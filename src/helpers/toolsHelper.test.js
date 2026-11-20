import { beforeEach, describe, expect, it, vi } from 'vitest'
import Swal from 'sweetalert2'
import { formatDate, showConfirm, showError, showSuccess } from './toolsHelper'

vi.mock('sweetalert2', () => ({ default: { fire: vi.fn() } }))

describe('toolsHelper', () => {
  beforeEach(() => vi.clearAllMocks())

  it('showSuccess menampilkan dialog sukses', () => {
    showSuccess('Tersimpan')
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: 'success', text: 'Tersimpan' }))
  })

  it('showError menampilkan dialog error', () => {
    showError('Gagal')
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: 'error', text: 'Gagal' }))
  })

  it('showConfirm mengembalikan true bila dikonfirmasi (teks default)', async () => {
    Swal.fire.mockResolvedValue({ isConfirmed: true })
    expect(await showConfirm('Hapus?')).toBe(true)
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ confirmButtonText: 'Ya, lanjutkan' }))
  })

  it('showConfirm mengembalikan false bila dibatalkan (teks kustom)', async () => {
    Swal.fire.mockResolvedValue({ isConfirmed: false })
    expect(await showConfirm('Hapus?', 'Hapus')).toBe(false)
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ confirmButtonText: 'Hapus' }))
  })

  it('formatDate memformat tanggal Indonesia', () => {
    expect(formatDate('2026-11-19T10:00:00Z')).toContain('2026')
  })

  it('formatDate mengembalikan "-" bila kosong', () => {
    expect(formatDate(null)).toBe('-')
  })
})
