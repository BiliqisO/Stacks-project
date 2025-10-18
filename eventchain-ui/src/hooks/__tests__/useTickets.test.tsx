import { renderHook, waitFor } from '@testing-library/react'
import { useTickets } from '../useTickets'
import { setupStacksMocks, cleanupStacksMocks } from '../../__tests__/utils/stacks-mocks'
import * as stacksUtils from '@/lib/stacks-utils'

// Mock useStacks hook
jest.mock('@/hooks/useStacks', () => ({
  useStacks: jest.fn(() => ({
    address: 'ST2EC0NW05CA1PK148ZTPJMFH8NPY0ZWM1RCJNFB9',
    isSignedIn: true,
    userData: { profile: { stxAddress: { testnet: 'ST2EC0NW05CA1PK148ZTPJMFH8NPY0ZWM1RCJNFB9' } } },
    isSignInPending: false,
  })),
}))

// Mock stacks-utils
jest.mock('@/lib/stacks-utils', () => ({
  readUserTickets: jest.fn(),
  readUserTransferHistory: jest.fn(() => Promise.resolve([])),
}))

const mockReadUserTickets = stacksUtils.readUserTickets as jest.Mock
const mockReadUserTransferHistory = stacksUtils.readUserTransferHistory as jest.Mock

const mockTickets = [
  {
    id: '1-ST2EC0-1',
    eventId: 1,
    owner: 'ST2EC0NW05CA1PK148ZTPJMFH8NPY0ZWM1RCJNFB9',
    isCheckedIn: false,
    status: 'active',
    eventTitle: 'Test Event 1',
    eventDate: '2024-12-31',
    eventTime: '18:00',
    price: 1000000,
    priceDisplay: '1.00 STX',
  },
  {
    id: '2-ST2EC0-1',
    eventId: 2,
    owner: 'ST2EC0NW05CA1PK148ZTPJMFH8NPY0ZWM1RCJNFB9',
    isCheckedIn: true,
    status: 'used',
    eventTitle: 'Test Event 2',
    eventDate: '2024-01-15',
    eventTime: '19:30',
    price: 2000000,
    priceDisplay: '2.00 STX',
  },
]

describe('useTickets', () => {
  beforeAll(() => {
    setupStacksMocks()
  })

  afterAll(() => {
    cleanupStacksMocks()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('initial state', () => {
    it('returns initial state correctly', () => {
      mockReadUserTickets.mockResolvedValue([])
      mockReadUserTransferHistory.mockResolvedValue([])

      const { result } = renderHook(() => useTickets())

      expect(result.current.tickets).toEqual([])
      expect(result.current.isLoading).toBe(true)
      expect(result.current.error).toBeNull()
    })

    it('does not fetch when address is not provided', () => {
      const { useStacks } = require('@/hooks/useStacks')
      useStacks.mockReturnValue({
        address: null,
        isSignedIn: false,
        userData: null,
        isSignInPending: false,
      })

      const { result } = renderHook(() => useTickets())

      expect(result.current.tickets).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('successful ticket loading', () => {
    beforeEach(() => {
      const { useStacks } = require('@/hooks/useStacks')
      useStacks.mockReturnValue({
        address: 'ST2EC0NW05CA1PK148ZTPJMFH8NPY0ZWM1RCJNFB9',
        isSignedIn: true,
        userData: { profile: { stxAddress: { testnet: 'ST2EC0NW05CA1PK148ZTPJMFH8NPY0ZWM1RCJNFB9' } } },
        isSignInPending: false,
      })
      mockReadUserTickets.mockResolvedValue(mockTickets)
      mockReadUserTransferHistory.mockResolvedValue([])
    })

    it('loads tickets successfully', async () => {
      const { result } = renderHook(() => useTickets())

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      }, { timeout: 3000 })

      expect(result.current.tickets).toHaveLength(2)
      expect(result.current.error).toBeNull()
      expect(mockReadUserTickets).toHaveBeenCalledWith('ST2EC0NW05CA1PK148ZTPJMFH8NPY0ZWM1RCJNFB9')
    })

    it('handles empty tickets array', async () => {
      mockReadUserTickets.mockResolvedValue([])

      const { result } = renderHook(() => useTickets())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      }, { timeout: 3000 })

      expect(result.current.tickets).toEqual([])
      expect(result.current.error).toBeNull()
    })
  })

  describe('error handling', () => {
    beforeEach(() => {
      const { useStacks } = require('@/hooks/useStacks')
      useStacks.mockReturnValue({
        address: 'ST2EC0NW05CA1PK148ZTPJMFH8NPY0ZWM1RCJNFB9',
        isSignedIn: true,
        userData: { profile: { stxAddress: { testnet: 'ST2EC0NW05CA1PK148ZTPJMFH8NPY0ZWM1RCJNFB9' } } },
        isSignInPending: false,
      })
    })

    it('handles readUserTickets error', async () => {
      const errorMessage = 'Failed to read user tickets'
      mockReadUserTickets.mockRejectedValue(new Error(errorMessage))
      mockReadUserTransferHistory.mockResolvedValue([])

      const { result } = renderHook(() => useTickets())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      }, { timeout: 3000 })

      expect(result.current.tickets).toEqual([])
      expect(result.current.error).toBe(errorMessage)
    })

    it('handles network errors', async () => {
      mockReadUserTickets.mockRejectedValue(new Error('Network error'))
      mockReadUserTransferHistory.mockResolvedValue([])

      const { result } = renderHook(() => useTickets())

      await waitFor(() => {
        expect(result.current.error).toBe('Network error')
      }, { timeout: 3000 })

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('refetch functionality', () => {
    beforeEach(() => {
      const { useStacks } = require('@/hooks/useStacks')
      useStacks.mockReturnValue({
        address: 'ST2EC0NW05CA1PK148ZTPJMFH8NPY0ZWM1RCJNFB9',
        isSignedIn: true,
        userData: { profile: { stxAddress: { testnet: 'ST2EC0NW05CA1PK148ZTPJMFH8NPY0ZWM1RCJNFB9' } } },
        isSignInPending: false,
      })
    })

    it('refetches tickets successfully', async () => {
      mockReadUserTickets.mockResolvedValue(mockTickets)
      mockReadUserTransferHistory.mockResolvedValue([])

      const { result } = renderHook(() => useTickets())

      await waitFor(() => {
        expect(result.current.tickets).toHaveLength(2)
      }, { timeout: 3000 })

      // Clear and setup for refetch
      mockReadUserTickets.mockClear()
      const updatedTickets = [{ ...mockTickets[0], isCheckedIn: true }]
      mockReadUserTickets.mockResolvedValue(updatedTickets)

      await result.current.refetch()

      expect(mockReadUserTickets).toHaveBeenCalledTimes(1)
      await waitFor(() => {
        expect(result.current.tickets).toHaveLength(1)
      }, { timeout: 3000 })
    })

    it('handles refetch errors', async () => {
      mockReadUserTickets.mockResolvedValue(mockTickets)
      mockReadUserTransferHistory.mockResolvedValue([])

      const { result } = renderHook(() => useTickets())

      await waitFor(() => {
        expect(result.current.tickets).toHaveLength(2)
      }, { timeout: 3000 })

      // Setup error for refetch
      mockReadUserTickets.mockRejectedValue(new Error('Refetch failed'))

      await result.current.refetch()

      await waitFor(() => {
        expect(result.current.error).toBe('Refetch failed')
      }, { timeout: 3000 })
    })

    it('does not refetch when address is null', async () => {
      const { useStacks } = require('@/hooks/useStacks')
      useStacks.mockReturnValue({
        address: null,
        isSignedIn: false,
        userData: null,
        isSignInPending: false,
      })

      mockReadUserTickets.mockClear()

      const { result } = renderHook(() => useTickets())

      await result.current.refetch()

      expect(mockReadUserTickets).not.toHaveBeenCalled()
    })
  })

  describe('address changes', () => {
    it('refetches when address changes', async () => {
      const { useStacks } = require('@/hooks/useStacks')
      mockReadUserTickets.mockResolvedValue(mockTickets)
      mockReadUserTransferHistory.mockResolvedValue([])

      // Set initial address
      useStacks.mockReturnValue({
        address: 'ST2EC0NW05CA1PK148ZTPJMFH8NPY0ZWM1RCJNFB9',
        isSignedIn: true,
        userData: { profile: { stxAddress: { testnet: 'ST2EC0NW05CA1PK148ZTPJMFH8NPY0ZWM1RCJNFB9' } } },
        isSignInPending: false,
      })

      const { result, rerender } = renderHook(() => useTickets())

      await waitFor(() => {
        expect(result.current.tickets).toHaveLength(2)
      }, { timeout: 3000 })

      expect(mockReadUserTickets).toHaveBeenCalledTimes(1)

      // Change address
      const newAddress = 'ST1EC0NW05CA1PK148ZTPJMFH8NPY0ZWM1RCJNFB8'
      const newMockTickets = [{ ...mockTickets[0], owner: newAddress }]
      mockReadUserTickets.mockResolvedValue(newMockTickets)

      useStacks.mockReturnValue({
        address: newAddress,
        isSignedIn: true,
        userData: { profile: { stxAddress: { testnet: newAddress } } },
        isSignInPending: false,
      })

      rerender()

      await waitFor(() => {
        expect(mockReadUserTickets).toHaveBeenCalledTimes(2)
      }, { timeout: 3000 })

      expect(mockReadUserTickets).toHaveBeenLastCalledWith(newAddress)
    })

    it('clears tickets when address becomes null', async () => {
      const { useStacks } = require('@/hooks/useStacks')
      mockReadUserTickets.mockResolvedValue(mockTickets)
      mockReadUserTransferHistory.mockResolvedValue([])

      // Set initial address
      useStacks.mockReturnValue({
        address: 'ST2EC0NW05CA1PK148ZTPJMFH8NPY0ZWM1RCJNFB9',
        isSignedIn: true,
        userData: { profile: { stxAddress: { testnet: 'ST2EC0NW05CA1PK148ZTPJMFH8NPY0ZWM1RCJNFB9' } } },
        isSignInPending: false,
      })

      const { result, rerender } = renderHook(() => useTickets())

      await waitFor(() => {
        expect(result.current.tickets).toHaveLength(2)
      }, { timeout: 3000 })

      // Change to null address
      useStacks.mockReturnValue({
        address: null,
        isSignedIn: false,
        userData: null,
        isSignInPending: false,
      })

      rerender()

      await waitFor(() => {
        expect(result.current.tickets).toEqual([])
        expect(result.current.isLoading).toBe(false)
        expect(result.current.error).toBeNull()
      }, { timeout: 3000 })
    })
  })

  describe('loading states', () => {
    beforeEach(() => {
      const { useStacks } = require('@/hooks/useStacks')
      useStacks.mockReturnValue({
        address: 'ST2EC0NW05CA1PK148ZTPJMFH8NPY0ZWM1RCJNFB9',
        isSignedIn: true,
        userData: { profile: { stxAddress: { testnet: 'ST2EC0NW05CA1PK148ZTPJMFH8NPY0ZWM1RCJNFB9' } } },
        isSignInPending: false,
      })
    })

    it('shows loading during initial fetch', async () => {
      // Mock a slow response
      let resolveTickets: any
      mockReadUserTickets.mockImplementation(() => new Promise((resolve) => {
        resolveTickets = resolve
      }))
      mockReadUserTransferHistory.mockResolvedValue([])

      const { result } = renderHook(() => useTickets())

      // Initially should be loading
      expect(result.current.isLoading).toBe(true)
      expect(result.current.tickets).toEqual([])
      expect(result.current.error).toBeNull()

      // Resolve the promise
      resolveTickets(mockTickets)

      // Wait for loading to finish
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      }, { timeout: 3000 })
    })

    it('shows loading during refetch', async () => {
      mockReadUserTickets.mockResolvedValue(mockTickets)
      mockReadUserTransferHistory.mockResolvedValue([])

      const { result } = renderHook(() => useTickets())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      }, { timeout: 3000 })

      // Setup controlled refetch
      let resolveRefetch: any
      mockReadUserTickets.mockImplementation(() => new Promise((resolve) => {
        resolveRefetch = resolve
      }))

      // Start refetch but don't await
      const refetchPromise = result.current.refetch()

      // Should show loading immediately
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      // Resolve and wait for completion
      resolveRefetch(mockTickets)
      await refetchPromise
    })
  })

  describe('ticket filtering and utilities', () => {
    beforeEach(() => {
      const { useStacks } = require('@/hooks/useStacks')
      useStacks.mockReturnValue({
        address: 'ST2EC0NW05CA1PK148ZTPJMFH8NPY0ZWM1RCJNFB9',
        isSignedIn: true,
        userData: { profile: { stxAddress: { testnet: 'ST2EC0NW05CA1PK148ZTPJMFH8NPY0ZWM1RCJNFB9' } } },
        isSignInPending: false,
      })
      mockReadUserTickets.mockResolvedValue(mockTickets)
      mockReadUserTransferHistory.mockResolvedValue([])
    })

    it('provides utility methods for ticket analysis', async () => {
      const { result } = renderHook(() => useTickets())

      await waitFor(() => {
        expect(result.current.tickets).toHaveLength(2)
      }, { timeout: 3000 })

      // Should be able to filter tickets
      const activeTickets = result.current.tickets.filter(ticket => ticket.status === 'active')
      expect(activeTickets).toHaveLength(1)

      const checkedInTickets = result.current.tickets.filter(ticket => ticket.isCheckedIn)
      expect(checkedInTickets).toHaveLength(1)
    })
  })
})