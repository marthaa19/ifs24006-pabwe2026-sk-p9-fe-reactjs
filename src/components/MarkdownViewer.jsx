// Pembungkus Toast UI Viewer: menampilkan konten Markdown sebagai HTML (hanya baca).
import { useEffect, useRef } from 'react'
import Viewer from '@toast-ui/editor/dist/toastui-editor-viewer'
import '@toast-ui/editor/dist/toastui-editor-viewer.css'
import '@toast-ui/editor/dist/theme/toastui-editor-dark.css'

export default function MarkdownViewer({ content = '', dark = false }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const viewer = new Viewer({
      el: containerRef.current,
      initialValue: content,
      theme: dark ? 'dark' : 'light',
      usageStatistics: false,
    })
    return () => viewer.destroy()
  }, [content, dark])

  return <div ref={containerRef} data-testid="markdown-viewer" />
}
