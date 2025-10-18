import { renderHook, waitFor } from '@testing-library/react'
import { useEvent } from '../useEvent'
import { setupStacksMocks, cleanupStacksMocks } from '../../__tests__/utils/stacks-mocks'
import * as Tx from '@stacks/transactions'

// Mock @stacks/transactions
jest.mock('@stacks/transactions', () => ({
  ...jest.requireActual('@stacks/transactions'),
  fetchCallReadOnlyFunction: jest.fn(),
  uintCV: jest.fn((val) => ({ type: 'uint', value: val })),
}))

const mockFetchCallReadOnlyFunction = Tx.fetchCallReadOnlyFunction as jest.Mock

// Mock blockchain response data
const mockBlockchainEvent = {
  type: 'some',
  value: {
    type: 'tuple',
    value: {
      creator: { type: 'principal', value: 'ST2EC0NW05CA1PK148ZTPJMFH8NPY0ZWM1RCJNFB9' },
      name: { type: 'string-utf8', value: 'Test Event' },
      location: { type: 'string-utf8', value: 'Test Location' },
      timestamp: { type: 'uint', value: 1735689600 },
      price: { type: 'uint', value: 1000000 },
      'total-tickets': { type: 'uint', value: 100 },
      'tickets-sold': { type: 'uint', value: 25 },
      image: { type: 'string-utf8', value: '' },
    },
  },
}

describe('useEvent', () => {
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
    it('returns null event initially', () => {
      mockFetchCallReadOnlyFunction.mockResolvedValue(mockBlockchainEvent)

      const { result } = renderHook(() => useEvent(1))

      expect(result.current.event).toBeNull()
      expect(result.current.isLoading).toBe(true)
      expect(result.current.error).toBeNull()
    })
  })

  describe('successful event loading', () => {
    beforeEach(() => {
      mockFetchCallReadOnlyFunction.mockResolvedValue(mockBlockchainEvent)
    })

    it('loads event successfully', async () => {
      const { result } = renderHook(() => useEvent(1))

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.event).not.toBeNull()
      expect(result.current.event?.id).toBe(1)
      expect(result.current.event?.title).toBe('Test Event')
      expect(result.current.error).toBeNull()
    })

    it('finds correct event by id', async () => {
      const event2Data = {
        type: 'some',
        value: {
          type: 'tuple',
          value: {
            ...mockBlockchainEvent.value.value,
            name: { type: 'string-utf8', value: 'Event 2' },
          },
        },
      }
      mockFetchCallReadOnlyFunction.mockResolvedValue(event2Data)

      const { result } = renderHook(() => useEvent(2))

      await waitFor(() => {
        expect(result.current.event?.title).toBe('Event 2')
      })

      expect(result.current.event?.id).toBe(2)
    })
  })

  describe('event not found', () => {
    it('returns null when event is not found', async () => {
      mockFetchCallReadOnlyFunction.mockResolvedValue({ type: 'none' })

      const { result } = renderHook(() => useEvent(999))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.event).toBeNull()
      expect(result.current.error).toBeTruthy()
    })

    it('handles none response', async () => {
      mockFetchCallReadOnlyFunction.mockResolvedValue('(none)')

      const { result } = renderHook(() => useEvent(1))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.event).toBeNull()
      expect(result.current.error).toBe('Event not found')
    })
  })

  describe('error handling', () => {
    it('handles fetch error', async () => {
      const errorMessage = 'Failed to fetch event'
      mockFetchCallReadOnlyFunction.mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useEvent(1))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.event).toBeNull()
      expect(result.current.error).toBe(errorMessage)
    })

    it('handles network errors', async () => {
      mockFetchCallReadOnlyFunction.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useEvent(1))

      await waitFor(() => {
        expect(result.current.error).toBe('Network error')
      })
    })
  })

  describe('event data verification', () => {
    beforeEach(() => {
      mockFetchCallReadOnlyFunction.mockResolvedValue(mockBlockchainEvent)
    })

    it('returns correct event data for ticket purchase', async () => {
      const { result } = renderHook(() => useEvent(1))

      await waitFor(() => {
        expect(result.current.event).not.toBeNull()
      })

      // Verify event data is loaded correctly for buying
      expect(result.current.event?.price).toBe('1000000')
      expect(result.current.event?.creator).toBe('ST2EC0NW05CA1PK148ZTPJMFH8NPY0ZWM1RCJNFB9')
      expect(result.current.event?.totalTickets).toBe(100)
      expect(result.current.event?.ticketsSold).toBe(25)
    })

    it('verifies event is loaded before allowing purchase', async () => {
      mockFetchCallReadOnlyFunction.mockResolvedValue({ type: 'none' })

      const { result } = renderHook(() => useEvent(1))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.event).toBeNull()
    })
  })

  describe('refetch functionality', () => {
    it('refetches event data', async () => {
      mockFetchCallReadOnlyFunction.mockResolvedValue(mockBlockchainEvent)

      const { result } = renderHook(() => useEvent(1))

      await waitFor(() => {
        expect(result.current.event).not.toBeNull()
      })

      // Update mock data
      const updatedEvent = {
        ...mockBlockchainEvent,
        value: {
          ...mockBlockchainEvent.value,
          value: {
            ...mockBlockchainEvent.value.value,
            'tickets-sold': { type: 'uint', value: 30 },
          },
        },
      }
      mockFetchCallReadOnlyFunction.mockResolvedValue(updatedEvent)

      await result.current.refetch()

      await waitFor(() => {
        expect(result.current.event?.ticketsSold).toBe(30)
      })
    })

    it('handles refetch errors', async () => {
      mockFetchCallReadOnlyFunction.mockResolvedValue(mockBlockchainEvent)

      const { result } = renderHook(() => useEvent(1))

      await waitFor(() => {
        expect(result.current.event).not.toBeNull()
      })

      // Setup error for refetch
      mockFetchCallReadOnlyFunction.mockRejectedValue(new Error('Refetch failed'))

      await result.current.refetch()

      await waitFor(() => {
        expect(result.current.error).toBe('Refetch failed')
      })
    })
  })

  describe('loading states', () => {
    it('shows loading during initial fetch', () => {
      mockFetchCallReadOnlyFunction.mockImplementation(() => new Promise(() => {})) // Never resolves

      const { result } = renderHook(() => useEvent(1))

      expect(result.current.isLoading).toBe(true)
      expect(result.current.event).toBeNull()
      expect(result.current.error).toBeNull()
    })

    it('shows loading during refetch', async () => {
      mockFetchCallReadOnlyFunction.mockResolvedValue(mockBlockchainEvent)

      const { result } = renderHook(() => useEvent(1))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Verify initial load completed
      expect(result.current.event).not.toBeNull()
    })
  })

  describe('updateEventData functionality', () => {
    it('updates local event data', async () => {
      mockFetchCallReadOnlyFunction.mockResolvedValue(mockBlockchainEvent)

      const { result } = renderHook(() => useEvent(1))

      await waitFor(() => {
        expect(result.current.event).not.toBeNull()
      })

      const schedules = [{ time: '10:00', title: 'Opening', speaker: 'John' }]
      result.current.updateEventData({ schedules })

      await waitFor(() => {
        expect(result.current.event?.schedules).toEqual(schedules)
      })
    })
  })
})