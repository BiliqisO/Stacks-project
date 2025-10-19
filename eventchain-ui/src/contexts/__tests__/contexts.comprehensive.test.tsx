/**
 * Comprehensive tests for Context providers
 * Covers ModeContext and other context providers
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ModeProvider, useMode } from '../ModeContext'
import * as stacksUtils from '@/lib/stacks-utils'

// Mock useStacks hook
jest.mock('@/hooks/useStacks', () => ({
  useStacks: jest.fn(() => ({
    address: null,
    isSignedIn: false,
    userData: null,
  })),
}))

// Mock stacks-utils
jest.mock('@/lib/stacks-utils', () => ({
  readOrganizerStatus: jest.fn(() => Promise.resolve(false)),
}))

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Test component that uses the context
const TestComponent = () => {
  const { mode, switchMode, isOrganizer } = useMode()

  return (
    <div>
      <div data-testid="current-mode">{mode}</div>
      <div data-testid="is-organizer">{isOrganizer ? 'true' : 'false'}</div>
      <button onClick={() => switchMode('organizer')}>Switch to Organizer</button>
      <button onClick={() => switchMode('attendee')}>Switch to Attendee</button>
    </div>
  )
}

describe('ModeContext', () => {
  beforeEach(() => {
    localStorageMock.clear()
    jest.clearAllMocks()
  })

  it('should provide default mode as attendee', async () => {
    render(
      <ModeProvider>
        <TestComponent />
      </ModeProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-mode')).toHaveTextContent('attendee')
    })
  })

  it('should not allow switching to organizer mode if user is not organizer', async () => {
    render(
      <ModeProvider>
        <TestComponent />
      </ModeProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-mode')).toHaveTextContent('attendee')
    })

    const organizerButton = screen.getByText('Switch to Organizer')
    fireEvent.click(organizerButton)

    // Should still be attendee since user is not an organizer
    expect(screen.getByTestId('current-mode')).toHaveTextContent('attendee')
  })

  it('should allow switching to attendee mode', async () => {
    // Mock user as organizer
    const mockReadOrganizerStatus = stacksUtils.readOrganizerStatus as jest.Mock
    mockReadOrganizerStatus.mockResolvedValue(true)

    const { useStacks } = require('@/hooks/useStacks')
    useStacks.mockReturnValue({
      address: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9',
      isSignedIn: true,
      userData: { profile: { stxAddress: { testnet: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9' } } },
    })

    render(
      <ModeProvider>
        <TestComponent />
      </ModeProvider>
    )

    // Wait for organizer check
    await waitFor(() => {
      expect(screen.getByTestId('current-mode')).toHaveTextContent('organizer')
    })

    // Then switch back to attendee
    fireEvent.click(screen.getByText('Switch to Attendee'))
    expect(screen.getByTestId('current-mode')).toHaveTextContent('attendee')
  })

  it('should check organizer status from blockchain', async () => {
    const mockReadOrganizerStatus = stacksUtils.readOrganizerStatus as jest.Mock
    mockReadOrganizerStatus.mockResolvedValue(false)

    render(
      <ModeProvider>
        <TestComponent />
      </ModeProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('is-organizer')).toHaveTextContent('false')
    })

    expect(mockReadOrganizerStatus).toHaveBeenCalled()
  })

  it('should auto-switch to organizer mode if user is organizer', async () => {
    const mockReadOrganizerStatus = stacksUtils.readOrganizerStatus as jest.Mock
    mockReadOrganizerStatus.mockResolvedValue(true)

    const { useStacks } = require('@/hooks/useStacks')
    useStacks.mockReturnValue({
      address: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9',
      isSignedIn: true,
      userData: { profile: { stxAddress: { testnet: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9' } } },
    })

    render(
      <ModeProvider>
        <TestComponent />
      </ModeProvider>
    )

    // Should auto-switch to organizer mode
    await waitFor(() => {
      expect(screen.getByTestId('current-mode')).toHaveTextContent('organizer')
      expect(screen.getByTestId('is-organizer')).toHaveTextContent('true')
    })
  })

  it('should provide mode to multiple children', async () => {
    const ChildComponent1 = () => {
      const { mode } = useMode()
      return <div data-testid="child1-mode">{mode}</div>
    }

    const ChildComponent2 = () => {
      const { mode } = useMode()
      return <div data-testid="child2-mode">{mode}</div>
    }

    render(
      <ModeProvider>
        <ChildComponent1 />
        <ChildComponent2 />
        <TestComponent />
      </ModeProvider>
    )

    // All children should have the same mode
    await waitFor(() => {
      expect(screen.getByTestId('child1-mode')).toHaveTextContent('attendee')
      expect(screen.getByTestId('child2-mode')).toHaveTextContent('attendee')
      expect(screen.getByTestId('current-mode')).toHaveTextContent('attendee')
    })
  })
})

describe('ModeContext Edge Cases', () => {
  beforeEach(() => {
    localStorageMock.clear()
    jest.clearAllMocks()
  })

  it('should reset to attendee when user disconnects', async () => {
    const mockReadOrganizerStatus = stacksUtils.readOrganizerStatus as jest.Mock
    mockReadOrganizerStatus.mockResolvedValue(true)

    const { useStacks } = require('@/hooks/useStacks')
    useStacks.mockReturnValue({
      address: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9',
      isSignedIn: true,
      userData: { profile: { stxAddress: { testnet: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9' } } },
    })

    const { rerender } = render(
      <ModeProvider>
        <TestComponent />
      </ModeProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-mode')).toHaveTextContent('organizer')
    })

    // Simulate disconnect
    useStacks.mockReturnValue({
      address: null,
      isSignedIn: false,
      userData: null,
    })

    rerender(
      <ModeProvider>
        <TestComponent />
      </ModeProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-mode')).toHaveTextContent('attendee')
      expect(screen.getByTestId('is-organizer')).toHaveTextContent('false')
    })
  })
})

describe('ModeContext Type Safety', () => {
  it('should only accept valid mode values', async () => {
    const TestTypeComponent = () => {
      const { switchMode } = useMode()

      return (
        <div>
          <button onClick={() => switchMode('organizer' as const)}>Organizer</button>
          <button onClick={() => switchMode('attendee' as const)}>Attendee</button>
        </div>
      )
    }

    render(
      <ModeProvider>
        <TestTypeComponent />
      </ModeProvider>
    )

    await waitFor(() => {
      // Should render without TypeScript errors
      expect(screen.getByText('Organizer')).toBeInTheDocument()
      expect(screen.getByText('Attendee')).toBeInTheDocument()
    })
  })
})
