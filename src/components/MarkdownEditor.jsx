// Pembungkus Toast UI Editor (mode Markdown + pratinjau berdampingan, tema gelap didukung).
import { useEffect, useRef } from 'react'
import { Editor } from '@toast-ui/editor'
import '@toast-ui/editor/dist/toastui-editor.css'
import '@toast-ui/editor/dist/theme/toastui-editor-dark.css'

export default function MarkdownEditor({ value = '', onChange = () => {}, height = '400px', dark = false }) {
  const containerRef = useRef(null)
  const editorRef = useRef(null)
  const latest = useRef({ value, onChange })

  // simpan props terbaru agar editor tidak perlu dibuat ulang tiap ketikan
  useEffect(() => {
    latest.current = { value, onChange }
  })

  useEffect(() => {
    const editor = new Editor({
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
    return () => {
      editor.destroy()
      editorRef.current = null
    }
  }, [height, dark])

  // sinkronkan bila isi diubah dari luar (mis. hasil AI Generator)
  useEffect(() => {
    const editor = editorRef.current
    if (editor.getMarkdown() !== value) editor.setMarkdown(value)
  }, [value])

  return <div ref={containerRef} data-testid="markdown-editor" />
}
