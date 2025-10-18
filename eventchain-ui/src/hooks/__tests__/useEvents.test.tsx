import { renderHook, waitFor } from '@testing-library/react'
import { useEvents } from '../useEvents'
import { setupStacksMocks, cleanupStacksMocks } from '../../__tests__/utils/stacks-mocks'
import * as stacksUtils from '@/lib/stacks-utils'

// Mock the stacks utils
jest.mock('@/lib/stacks-utils', () => ({
  readEvents: jest.fn(),
}))

const mockReadEvents = stacksUtils.readEvents as jest.Mock

describe('useEvents', () => {
  beforeAll(() => {
    setupStacksMocks()
  })

  afterAll(() => {
    cleanupStacksMocks()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    // Suppress console logs for tests
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('basic functionality', () => {
    it('returns initial state correctly', () => {
      mockReadEvents.mockResolvedValue([])

      const { result } = renderHook(() => useEvents())

      expect(result.current.events).toEqual([])
      expect(result.current.isLoading).toBe(true)
      expect(result.current.error).toBeNull()
    })

    it('handles loading state', async () => {
      mockReadEvents.mockResolvedValue([])

      const { result } = renderHook(() => useEvents())

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('handles empty events array', async () => {
      mockReadEvents.mockResolvedValue([])

      const { result } = renderHook(() => useEvents())

      await waitFor(() => {
        expect(result.current.events).toEqual([])
        expect(result.current.isLoading).toBe(false)
        expect(result.current.error).toBeNull()
      })
    })

    it('handles errors gracefully', async () => {
      mockReadEvents.mockRejectedValue(new Error('Test error'))

      const { result } = renderHook(() => useEvents())

      await waitFor(() => {
        expect(result.current.events).toEqual([])
        expect(result.current.isLoading).toBe(false)
        expect(result.current.error).toBe('Test error')
      })
    })
  })

  describe('refetch functionality', () => {
    it('provides refetch function', () => {
      mockReadEvents.mockResolvedValue([])

      const { result } = renderHook(() => useEvents())

      expect(typeof result.current.refetch).toBe('function')
    })
  })
})