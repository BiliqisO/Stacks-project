import React from 'react'
import { render, screen, waitFor, act } from '../../__tests__/utils/test-utils'
import { ModeProvider, useMode } from '../ModeContext'
import { useStacks } from '@/hooks/useStacks'

// Mock useStacks hook
jest.mock('@/hooks/useStacks')
const mockUseStacks = useStacks as jest.MockedFunction<typeof useStacks>

// Mock stacks-utils
jest.mock('@/lib/stacks-utils', () => ({
  readOrganizerStatus: jest.fn(),
}))

// Get the mocked function after the module is mocked
import * as stacksUtils from '@/lib/stacks-utils'
const mockReadOrganizerStatus = stacksUtils.readOrganizerStatus as jest.MockedFunction<typeof stacksUtils.readOrganizerStatus>

// Test component that uses the mode context
function TestComponent() {
  const { mode, isOrganizer, isLoading, refreshOrganizerStatus } = useMode()

  return (
    <div>
      <div data-testid="mode">{mode}</div>
      <div data-testid="is-organizer">{isOrganizer.toString()}</div>
      <div data-testid="is-loading">{isLoading.toString()}</div>
      <button onClick={refreshOrganizerStatus} data-testid="check-button">
        Check Status
      </button>
    </div>
  )
}

describe('ModeContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
    jest.spyOn(console, 'warn').mockImplementation()
    mockReadOrganizerStatus.mockResolvedValue(false)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when user is not signed in', () => {
    beforeEach(() => {
      mockUseStacks.mockReturnValue({
        userData: null,
        isSignedIn: false,
        address: null,
      })
    })

    it('defaults to attendee mode', async () => {
      render(
        <ModeProvider>
          <TestComponent />
        </ModeProvider>
      )

      expect(screen.getByTestId('mode')).toHaveTextContent('attendee')
      expect(screen.getByTestId('is-organizer')).toHaveTextContent('false')
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false')
    })

    it('does not check organizer status', async () => {
      render(
        <ModeProvider>
          <TestComponent />
        </ModeProvider>
      )

      await waitFor(() => {
        expect(mockReadOrganizerStatus).not.toHaveBeenCalled()
      })
    })
  })

  describe('when user is signed in but not organizer', () => {
    beforeEach(() => {
      mockUseStacks.mockReturnValue({
        userData: {
          profile: {
            stxAddress: {
              testnet: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9',
              mainnet: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9',
            },
          },
        },
        isSignedIn: true,
        address: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9',
      })
      mockReadOrganizerStatus.mockResolvedValue(false)
    })

    it('shows loading state initially', () => {
      render(
        <ModeProvider>
          <TestComponent />
        </ModeProvider>
      )

      expect(screen.getByTestId('is-loading')).toHaveTextContent('true')
    })

    it('sets attendee mode after checking status', async () => {
      render(
        <ModeProvider>
          <TestComponent />
        </ModeProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('mode')).toHaveTextContent('attendee')
        expect(screen.getByTestId('is-organizer')).toHaveTextContent('false')
        expect(screen.getByTestId('is-loading')).toHaveTextContent('false')
      }, { timeout: 3000 })
    })
  })

  describe('when user is signed in and is organizer', () => {
    it('sets organizer status correctly', async () => {
      // Setup mocks for this specific test
      // This must be done INSIDE the test, not in beforeEach, because the main beforeEach
      // runs and sets mockReadOrganizerStatus.mockResolvedValue(false) AFTER nested beforeEach
      mockUseStacks.mockReturnValue({
        userData: {
          profile: {
            stxAddress: {
              testnet: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9',
              mainnet: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9',
            },
          },
        },
        isSignedIn: true,
        address: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9',
      })

      // Override the default false from main beforeEach
      mockReadOrganizerStatus.mockResolvedValue(true)

      await act(async () => {
        render(
          <ModeProvider>
            <TestComponent />
          </ModeProvider>
        )
      })

      // Wait for loading to finish and organizer status to be set
      await waitFor(() => {
        expect(screen.getByTestId('is-loading')).toHaveTextContent('false')
      }, { timeout: 3000 })

      // Wait for organizer status to be set
      await waitFor(() => {
        expect(screen.getByTestId('is-organizer')).toHaveTextContent('true')
      }, { timeout: 3000 })

      // Then check that mode switched to organizer
      expect(screen.getByTestId('mode')).toHaveTextContent('organizer')
    })
  })

  describe('manual status check', () => {
    beforeEach(() => {
      mockUseStacks.mockReturnValue({
        userData: {
          profile: {
            stxAddress: {
              testnet: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9',
              mainnet: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9',
            },
          },
        },
        isSignedIn: true,
        address: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9',
      })
    })

    it('allows manual status refresh', async () => {
      mockReadOrganizerStatus.mockResolvedValue(false)

      render(
        <ModeProvider>
          <TestComponent />
        </ModeProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('is-loading')).toHaveTextContent('false')
      })

      await act(async () => {
        screen.getByTestId('check-button').click()
      })

      // Just verify the button works without throwing
      expect(screen.getByTestId('check-button')).toBeInTheDocument()
    })

    it('handles manual check when not signed in', async () => {
      mockUseStacks.mockReturnValue({
        userData: null,
        isSignedIn: false,
        address: null,
      })

      render(
        <ModeProvider>
          <TestComponent />
        </ModeProvider>
      )

      await act(async () => {
        screen.getByTestId('check-button').click()
      })

      expect(mockReadOrganizerStatus).not.toHaveBeenCalled()
      expect(screen.getByTestId('mode')).toHaveTextContent('attendee')
    })
  })

  describe('error handling', () => {
    beforeEach(() => {
      mockUseStacks.mockReturnValue({
        userData: {
          profile: {
            stxAddress: {
              testnet: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9',
              mainnet: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9',
            },
          },
        },
        isSignedIn: true,
        address: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9',
      })
    })

    it('handles organizer status check errors gracefully', async () => {
      mockReadOrganizerStatus.mockRejectedValue(new Error('Network error'))

      render(
        <ModeProvider>
          <TestComponent />
        </ModeProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('mode')).toHaveTextContent('attendee')
        expect(screen.getByTestId('is-organizer')).toHaveTextContent('false')
        expect(screen.getByTestId('is-loading')).toHaveTextContent('false')
      }, { timeout: 3000 })
    })
  })

  describe('context without provider', () => {
    it('throws error when used outside provider', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      // Use React Testing Library's render directly, not our custom one with providers
      const { render: plainRender } = require('@testing-library/react')

      expect(() => {
        plainRender(<TestComponent />)
      }).toThrow('useMode must be used within a ModeProvider')

      consoleErrorSpy.mockRestore()
    })
  })

  describe('basic functionality', () => {
    it('provides context values', async () => {
      mockUseStacks.mockReturnValue({
        userData: null,
        isSignedIn: false,
        address: null
      })

      render(
        <ModeProvider>
          <TestComponent />
        </ModeProvider>
      )

      expect(screen.getByTestId('mode')).toBeInTheDocument()
      expect(screen.getByTestId('is-organizer')).toBeInTheDocument()
      expect(screen.getByTestId('is-loading')).toBeInTheDocument()
      expect(screen.getByTestId('check-button')).toBeInTheDocument()
    })
  })
})