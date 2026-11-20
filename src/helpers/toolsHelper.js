// Dialog SweetAlert2 & format tanggal.
import Swal from 'sweetalert2'

export const showSuccess = (message) =>
  Swal.fire({ icon: 'success', title: 'Berhasil', text: message, timer: 1800, showConfirmButton: false })

export const showError = (message) =>
  Swal.fire({ icon: 'error', title: 'Gagal', text: message })

export async function showConfirm(message, confirmText = 'Ya, lanjutkan') {
  const result = await Swal.fire({
    icon: 'warning',
    title: 'Konfirmasi',
    text: message,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Batal',
  })
  return result.isConfirmed
}

export function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
