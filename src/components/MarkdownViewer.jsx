// Pembungkus Toast UI Viewer: menampilkan konten Markdown sebagai HTML (hanya baca).
// Library viewer dimuat lazy lewat import() agar tidak membebani halaman beranda/login.
import { useEffect, useRef } from 'react'

export default function MarkdownViewer({ content = '', dark = false }) {
  const containerRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    let viewer
    Promise.all([
      import('@toast-ui/editor/dist/toastui-editor-viewer'),
      import('@toast-ui/editor/dist/toastui-editor-viewer.css'),
      import('@toast-ui/editor/dist/theme/toastui-editor-dark.css'),
    ]).then(([{ default: Viewer }]) => {
      if (cancelled) return
      viewer = new Viewer({
        el: containerRef.current,
        initialValue: content,
        theme: dark ? 'dark' : 'light',
        usageStatistics: false,
      })
    })
    return () => {
      cancelled = true
      viewer?.destroy()
    }
  }, [content, dark])

  return <div ref={containerRef} data-testid="markdown-viewer" />
}
