import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../App'

beforeEach(() => {
  // jsdom has no Web Audio; the start screen only needs it to exist
  Object.defineProperty(window, 'AudioContext', { value: class {}, configurable: true })
  localStorage.clear()
  document.title = ''
})

describe('App', () => {
  it('shows the start screen and switches language', () => {
    localStorage.setItem('ambient-mixer:v1', JSON.stringify({ lang: 'en' }))
    render(<App />)
    expect(screen.getByRole('button', { name: 'Start session' })).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'RU', hidden: true })[0])
    expect(screen.getByRole('button', { name: 'Начать сессию' })).toBeInTheDocument()
  })

  it('switches timer modes', () => {
    localStorage.setItem('ambient-mixer:v1', JSON.stringify({ lang: 'en' }))
    render(<App />)
    fireEvent.click(screen.getByRole('tab', { name: 'Focus', hidden: true }))
    expect(screen.getByRole('timer', { hidden: true })).toHaveTextContent('25:00')
    fireEvent.click(screen.getByRole('tab', { name: 'Sleep', hidden: true }))
    expect(screen.getByText('Start timer')).toBeInTheDocument()
  })
})
