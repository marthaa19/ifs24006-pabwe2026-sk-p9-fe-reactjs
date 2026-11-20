import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MarkdownEditor from './MarkdownEditor'
import MarkdownViewer from './MarkdownViewer'

const { editors, viewers } = vi.hoisted(() => ({ editors: [], viewers: [] }))

vi.mock('@toast-ui/editor', () => {
  class Editor {
    constructor(opts) {
      this.opts = opts
      this.md = opts.initialValue
      this.destroy = vi.fn()
      this.setMarkdown = vi.fn((v) => {
        this.md = v
      })
      editors.push(this)
    }
    getMarkdown() {
      return this.md
    }
  }
  return { Editor }
})

vi.mock('@toast-ui/editor/dist/toastui-editor-viewer', () => {
  class Viewer {
    constructor(opts) {
      this.opts = opts
      this.destroy = vi.fn()
      viewers.push(this)
    }
  }
  return { default: Viewer }
})

// Editor/Viewer dibuat setelah import() lazy selesai, jadi tes menunggu instance muncul.
const editorsReady = (n) => waitFor(() => expect(editors).toHaveLength(n))
const viewersReady = (n) => waitFor(() => expect(viewers).toHaveLength(n))

describe('MarkdownEditor', () => {
  beforeEach(() => {
    editors.length = 0
  })

  it('membuat editor dengan opsi default', async () => {
    render(<MarkdownEditor />)
    expect(screen.getByTestId('markdown-editor')).toBeInTheDocument()
    await editorsReady(1)
    expect(editors[0].opts).toMatchObject({
      height: '400px',
      initialValue: '',
      theme: 'light',
      initialEditType: 'markdown',
    })
  })

  it('memakai tema gelap & tinggi kustom', async () => {
    render(<MarkdownEditor value="# Hai" height="600px" dark />)
    await editorsReady(1)
    expect(editors[0].opts).toMatchObject({ height: '600px', theme: 'dark', initialValue: '# Hai' })
  })

  it('event change memanggil onChange dengan markdown terbaru', async () => {
    const onChange = vi.fn()
    render(<MarkdownEditor onChange={onChange} />)
    await editorsReady(1)
    editors[0].md = 'ketikan baru'
    editors[0].opts.events.change()
    expect(onChange).toHaveBeenCalledWith('ketikan baru')
  })

  it('event change tanpa onChange tidak error (default no-op)', async () => {
    render(<MarkdownEditor />)
    await editorsReady(1)
    expect(() => editors[0].opts.events.change()).not.toThrow()
  })

  it('menyinkronkan isi bila value berubah dari luar', async () => {
    const { rerender } = render(<MarkdownEditor value="a" />)
    await editorsReady(1)
    rerender(<MarkdownEditor value="b" />)
    expect(editors[0].setMarkdown).toHaveBeenCalledWith('b')
  })

  it('tidak menyetel ulang bila value sama dengan isi editor', async () => {
    const { rerender } = render(<MarkdownEditor value="a" />)
    await editorsReady(1)
    rerender(<MarkdownEditor value="a" />)
    expect(editors[0].setMarkdown).not.toHaveBeenCalled()
  })

  it('memakai value terbaru bila berubah sebelum editor selesai dimuat', async () => {
    const { rerender } = render(<MarkdownEditor value="a" />)
    rerender(<MarkdownEditor value="terbaru" />)
    await editorsReady(1)
    expect(editors[0].opts.initialValue).toBe('terbaru')
  })

  it('membuat ulang editor saat tema berubah & menghancurkan yang lama', async () => {
    const { rerender } = render(<MarkdownEditor value="a" />)
    await editorsReady(1)
    rerender(<MarkdownEditor value="a" dark />)
    await editorsReady(2)
    expect(editors[0].destroy).toHaveBeenCalled()
    expect(editors[1].opts.theme).toBe('dark')
  })

  it('menghancurkan editor saat unmount', async () => {
    const { unmount } = render(<MarkdownEditor />)
    await editorsReady(1)
    unmount()
    expect(editors[0].destroy).toHaveBeenCalled()
  })

  it('tidak membuat editor bila di-unmount sebelum selesai dimuat', async () => {
    const { unmount } = render(<MarkdownEditor />)
    unmount()
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(editors).toHaveLength(0)
  })
})

describe('MarkdownViewer', () => {
  beforeEach(() => {
    viewers.length = 0
  })

  it('membuat viewer dengan konten & tema default', async () => {
    render(<MarkdownViewer />)
    expect(screen.getByTestId('markdown-viewer')).toBeInTheDocument()
    await viewersReady(1)
    expect(viewers[0].opts).toMatchObject({ initialValue: '', theme: 'light' })
  })

  it('memakai konten & tema gelap', async () => {
    render(<MarkdownViewer content="# Judul" dark />)
    await viewersReady(1)
    expect(viewers[0].opts).toMatchObject({ initialValue: '# Judul', theme: 'dark' })
  })

  it('membuat ulang viewer saat konten berubah & destroy saat unmount', async () => {
    const { rerender, unmount } = render(<MarkdownViewer content="a" />)
    await viewersReady(1)
    rerender(<MarkdownViewer content="b" />)
    await viewersReady(2)
    expect(viewers[0].destroy).toHaveBeenCalled()
    unmount()
    expect(viewers[1].destroy).toHaveBeenCalled()
  })

  it('tidak membuat viewer bila di-unmount sebelum selesai dimuat', async () => {
    const { unmount } = render(<MarkdownViewer content="a" />)
    unmount()
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(viewers).toHaveLength(0)
  })
})
