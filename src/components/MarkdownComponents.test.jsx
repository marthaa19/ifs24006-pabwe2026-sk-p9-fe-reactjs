import { render, screen } from '@testing-library/react'
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

describe('MarkdownEditor', () => {
  beforeEach(() => {
    editors.length = 0
  })

  it('membuat editor dengan opsi default', () => {
    render(<MarkdownEditor />)
    expect(screen.getByTestId('markdown-editor')).toBeInTheDocument()
    expect(editors).toHaveLength(1)
    expect(editors[0].opts).toMatchObject({
      height: '400px',
      initialValue: '',
      theme: 'light',
      initialEditType: 'markdown',
    })
  })

  it('memakai tema gelap & tinggi kustom', () => {
    render(<MarkdownEditor value="# Hai" height="600px" dark />)
    expect(editors[0].opts).toMatchObject({ height: '600px', theme: 'dark', initialValue: '# Hai' })
  })

  it('event change memanggil onChange dengan markdown terbaru', () => {
    const onChange = vi.fn()
    render(<MarkdownEditor onChange={onChange} />)
    editors[0].md = 'ketikan baru'
    editors[0].opts.events.change()
    expect(onChange).toHaveBeenCalledWith('ketikan baru')
  })

  it('event change tanpa onChange tidak error (default no-op)', () => {
    render(<MarkdownEditor />)
    expect(() => editors[0].opts.events.change()).not.toThrow()
  })

  it('menyinkronkan isi bila value berubah dari luar', () => {
    const { rerender } = render(<MarkdownEditor value="a" />)
    rerender(<MarkdownEditor value="b" />)
    expect(editors[0].setMarkdown).toHaveBeenCalledWith('b')
  })

  it('tidak menyetel ulang bila value sama dengan isi editor', () => {
    const { rerender } = render(<MarkdownEditor value="a" />)
    rerender(<MarkdownEditor value="a" />)
    expect(editors[0].setMarkdown).not.toHaveBeenCalled()
  })

  it('membuat ulang editor saat tema berubah & menghancurkan yang lama', () => {
    const { rerender } = render(<MarkdownEditor value="a" />)
    rerender(<MarkdownEditor value="a" dark />)
    expect(editors).toHaveLength(2)
    expect(editors[0].destroy).toHaveBeenCalled()
    expect(editors[1].opts.theme).toBe('dark')
  })

  it('menghancurkan editor saat unmount', () => {
    const { unmount } = render(<MarkdownEditor />)
    unmount()
    expect(editors[0].destroy).toHaveBeenCalled()
  })
})

describe('MarkdownViewer', () => {
  beforeEach(() => {
    viewers.length = 0
  })

  it('membuat viewer dengan konten & tema default', () => {
    render(<MarkdownViewer />)
    expect(screen.getByTestId('markdown-viewer')).toBeInTheDocument()
    expect(viewers[0].opts).toMatchObject({ initialValue: '', theme: 'light' })
  })

  it('memakai konten & tema gelap', () => {
    render(<MarkdownViewer content="# Judul" dark />)
    expect(viewers[0].opts).toMatchObject({ initialValue: '# Judul', theme: 'dark' })
  })

  it('membuat ulang viewer saat konten berubah & destroy saat unmount', () => {
    const { rerender, unmount } = render(<MarkdownViewer content="a" />)
    rerender(<MarkdownViewer content="b" />)
    expect(viewers).toHaveLength(2)
    expect(viewers[0].destroy).toHaveBeenCalled()
    unmount()
    expect(viewers[1].destroy).toHaveBeenCalled()
  })
})
