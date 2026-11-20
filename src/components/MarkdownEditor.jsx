// Pembungkus Toast UI Editor (mode Markdown + pratinjau berdampingan, tema gelap didukung).
// Library editor (~1 MB) dimuat lazy lewat import() agar tidak membebani halaman publik/login.
import { useEffect, useRef } from 'react'

export default function MarkdownEditor({ value = '', onChange = () => {}, height = '400px', dark = false }) {
  const containerRef = useRef(null)
  const editorRef = useRef(null)
  const latest = useRef({ value, onChange })

  // simpan props terbaru agar editor tidak perlu dibuat ulang tiap ketikan
  useEffect(() => {
    latest.current = { value, onChange }
  })

  useEffect(() => {
    let cancelled = false
    let editor
    Promise.all([
      import('@toast-ui/editor'),
      import('@toast-ui/editor/dist/toastui-editor.css'),
      import('@toast-ui/editor/dist/theme/toastui-editor-dark.css'),
    ]).then(([{ Editor }]) => {
      if (cancelled) return
      editor = new Editor({
        el: containerRef.current,
        height,
        initialEditType: 'markdown',
        previewStyle: 'vertical',
        initialValue: latest.current.value,
        theme: dark ? 'dark' : 'light',
        usageStatistics: false,
        events: { change: () => latest.current.onChange(editor.getMarkdown()) },
      })
      editorRef.current = editor
    })
    return () => {
      cancelled = true
      editor?.destroy()
      editorRef.current = null
    }
  }, [height, dark])

  // sinkronkan bila isi diubah dari luar (mis. hasil AI Generator); abaikan selama editor belum siap
  useEffect(() => {
    const editor = editorRef.current
    if (editor && editor.getMarkdown() !== value) editor.setMarkdown(value)
  }, [value])

  // minHeight mencegah layout bergeser saat editor selesai dimuat
  return <div ref={containerRef} data-testid="markdown-editor" style={{ minHeight: height }} />
}
