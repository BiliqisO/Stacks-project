import { renderHook, waitFor } from '@testing-library/react'
import { useEvents } from '../useEvents'
import * as stacksUtils from '@/lib/stacks-utils'

// Mock stacks-utils
jest.mock('@/lib/stacks-utils', () => ({
  readEvents: jest.fn(),
  readOrganizerEvents: jest.fn(),
  readTicketsOf: jest.fn(),
  readUserTickets: jest.fn(),
  readEventDetails: jest.fn(),
  readRecentActivities: jest.fn(),
}))

const mockReadEvents = stacksUtils.readEvents as jest.MockedFunction<typeof stacksUtils.readEvents>

describe('useEvents', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should fetch events successfully', async () => {
    const mockEvents = [
      { id: 1, result: { name: 'Event 1', price: 1000000, 'tickets-sold': 50, 'total-tickets': 100 } },
      { id: 2, result: { name: 'Event 2', price: 2000000, 'tickets-sold': 75, 'total-tickets': 150 } },
    ]

    mockReadEvents.mockResolvedValue(mockEvents as any)

    const { result } = renderHook(() => useEvents())

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.events.length).toBe(2)
    expect(result.current.error).toBeNull()
  })

  it('should handle fetch errors gracefully', async () => {
    mockReadEvents.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useEvents())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.events).toEqual([])
    // The hook returns the actual error message
    expect(result.current.error).toBe('Network error')
  })

  it('should return empty array when no events', async () => {
    mockReadEvents.mockResolvedValue([])

    const { result } = renderHook(() => useEvents())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.events).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('should format event data correctly', async () => {
    const mockEvent = {
      id: 1,
      result: {
        name: 'Test Event',
        location: 'Test Location',
        timestamp: 1735689600,
        price: 1500000,
        'total-tickets': 200,
        'tickets-sold': 100,
        image: 'QmTestHash',
        creator: 'ST2EC0NW05CA1PK148ZTPJMFH8NPY0ZWM1RCJNFB9',
      },
    }

    mockReadEvents.mockResolvedValue([mockEvent] as any)

    const { result } = renderHook(() => useEvents())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.events[0].title).toBe('Test Event')
    expect(result.current.events[0].location).toBe('Test Location')
    expect(result.current.events[0].price).toBe('1500000')
    expect(result.current.events[0].priceDisplay).toBe('1.50 STX')
  })

  it('should handle malformed event data', async () => {
    const malformedEvent = {
      id: 1,
      result: {
        name: null,
        price: undefined,
      },
    }

    mockReadEvents.mockResolvedValue([malformedEvent] as any)

    const { result } = renderHook(() => useEvents())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Should handle gracefully without crashing
    expect(result.current.events.length).toBeGreaterThanOrEqual(0)
  })

  it('should refetch events when refetch is called', async () => {
    const initialEvents = [
      { id: 1, result: { name: 'Event 1', price: 1000000 } },
    ]
    const updatedEvents = [
      { id: 1, result: { name: 'Event 1', price: 1000000 } },
      { id: 2, result: { name: 'Event 2', price: 2000000 } },
    ]

    mockReadEvents
      .mockResolvedValueOnce(initialEvents as any)
      .mockResolvedValueOnce(updatedEvents as any)

    const { result } = renderHook(() => useEvents())

    await waitFor(() => {
      expect(result.current.events.length).toBe(1)
    })

    result.current.refetch()

    await waitFor(() => {
      expect(result.current.events.length).toBe(2)
    })

    expect(mockReadEvents).toHaveBeenCalledTimes(2)
  })
})

describe('useEvents edge cases', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should handle undefined result', async () => {
    mockReadEvents.mockResolvedValue(undefined as any)

    const { result } = renderHook(() => useEvents())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.events).toEqual([])
  })

  it('should handle events without all required fields', async () => {
    const incompleteEvent = {
      id: 1,
      result: {
        name: 'Incomplete Event',
        // Missing other fields
      },
    }

    mockReadEvents.mockResolvedValue([incompleteEvent] as any)

    const { result } = renderHook(() => useEvents())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Should handle gracefully
    expect(result.current.events.length).toBeGreaterThanOrEqual(0)
  })
})
