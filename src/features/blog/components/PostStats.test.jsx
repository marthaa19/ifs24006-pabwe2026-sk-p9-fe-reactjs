import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PostStats from './PostStats'

describe('PostStats', () => {
  it('menampilkan tiga kartu statistik', () => {
    render(<PostStats total={12} published={9} draft={3} />)
    expect(screen.getByText('Total Artikel').nextSibling).toHaveTextContent('12')
    expect(screen.getByText('Terbit').nextSibling).toHaveTextContent('9')
    expect(screen.getByText('Draf').nextSibling).toHaveTextContent('3')
  })
})
