import { renderHook, waitFor } from '@testing-library/react'
import { setupStacksMocks, cleanupStacksMocks } from '../../__tests__/utils/stacks-mocks'

// Mock @stacks/connect - must be defined before import
jest.mock('@stacks/connect', () => ({
  isConnected: jest.fn(),
  getLocalStorage: jest.fn(),
  showConnect: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock stacks-utils - must be defined before import
jest.mock('@/lib/stacks-utils', () => ({
  userSession: {
    isUserSignedIn: jest.fn(),
    loadUserData: jest.fn(),
    isSignInPending: jest.fn(),
    handlePendingSignIn: jest.fn(),
  },
}))

// Now import the hook being tested
import { useStacks } from '../useStacks'
import * as stacksConnect from '@stacks/connect'
import * as stacksUtils from '@/lib/stacks-utils'

// Get typed mocks
const mockConnect = jest.mocked(stacksConnect)
const mockStacksUtils = jest.mocked(stacksUtils)

describe('useStacks', () => {
  beforeAll(() => {
    setupStacksMocks()
  })

  afterAll(() => {
    cleanupStacksMocks()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    // Suppress console logs
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when user is not connected', () => {
    beforeEach(() => {
      mockConnect.isConnected.mockReturnValue(false)
      mockStacksUtils.userSession.isUserSignedIn.mockReturnValue(false)
      mockStacksUtils.userSession.isSignInPending.mockReturnValue(false)
      mockStacksUtils.userSession.loadUserData.mockReturnValue(null)
    })

    it('returns default state when not connected', () => {
      const { result } = renderHook(() => useStacks())

      expect(result.current.userData).toBeNull()
      expect(result.current.isSignedIn).toBe(false)
      expect(result.current.address).toBeNull()
    })
  })

  describe('when user is connected via localStorage', () => {
    beforeEach(() => {
      mockConnect.isConnected.mockReturnValue(true)
      mockConnect.getLocalStorage.mockReturnValue({
        addresses: {
          stx: [{ address: 'ST2EC0NW05CA1PK148ZTPJMFH8NPY0ZWM1RCJNFB9' }]
        },
      })
      mockStacksUtils.userSession.isUserSignedIn.mockReturnValue(false)
      mockStacksUtils.userSession.isSignInPending.mockReturnValue(false)
    })

    it('returns address from localStorage', async () => {
      const { result } = renderHook(() => useStacks())

      // Wait for effect to run
      await waitFor(() => {
        expect(result.current.address).toBe('ST2EC0NW05CA1PK148ZTPJMFH8NPY0ZWM1RCJNFB9')
      })

      expect(result.current.isSignedIn).toBe(true)
      expect(result.current.userData).not.toBeNull()
    })
  })

  describe('when user is signed in via userSession', () => {
    const mockUserData = {
      profile: {
        stxAddress: {
          testnet: 'ST2EC0NW05CA1PK148ZTPJMFH8NPY0ZWM1RCJNFB9',
          mainnet: 'ST2EC0NW05CA1PK148ZTPJMFH8NPY0ZWM1RCJNFB9',
        },
      },
    }

    beforeEach(() => {
      mockConnect.isConnected.mockReturnValue(false)
      mockStacksUtils.userSession.isUserSignedIn.mockReturnValue(true)
      mockStacksUtils.userSession.loadUserData.mockReturnValue(mockUserData)
    })

    it('returns userData and address from userSession', () => {
      const { result } = renderHook(() => useStacks())

      expect(result.current.userData).toBe(mockUserData)
      expect(result.current.isSignedIn).toBe(true)
      expect(result.current.address).toBe('ST2EC0NW05CA1PK148ZTPJMFH8NPY0ZWM1RCJNFB9')
    })
  })

  describe('when both connection methods are available', () => {
    const mockUserData = {
      profile: {
        stxAddress: {
          testnet: 'ST2EC0NW05CA1PK148ZTPJMFH8NPY0ZWM1RCJNFB9',
          mainnet: 'ST2EC0NW05CA1PK148ZTPJMFH8NPY0ZWM1RCJNFB9',
        },
      },
    }

    beforeEach(() => {
      mockConnect.isConnected.mockReturnValue(true)
      mockConnect.getLocalStorage.mockReturnValue({
        addresses: {
          stx: [{ address: 'ST1DIFFERENT' }]
        },
      })
      mockStacksUtils.userSession.isUserSignedIn.mockReturnValue(true)
      mockStacksUtils.userSession.isSignInPending.mockReturnValue(false)
      mockStacksUtils.userSession.loadUserData.mockReturnValue(mockUserData)
    })

    it('prioritizes userSession data over localStorage', () => {
      const { result } = renderHook(() => useStacks())

      expect(result.current.userData).toBe(mockUserData)
      expect(result.current.isSignedIn).toBe(true)
      expect(result.current.address).toBe('ST2EC0NW05CA1PK148ZTPJMFH8NPY0ZWM1RCJNFB9')
    })
  })

  describe('error handling', () => {
    it('handles localStorage errors gracefully', () => {
      mockConnect.isConnected.mockReturnValue(true)
      mockConnect.getLocalStorage.mockImplementation(() => {
        throw new Error('LocalStorage error')
      })
      mockStacksUtils.userSession.isUserSignedIn.mockReturnValue(false)
      mockStacksUtils.userSession.isSignInPending.mockReturnValue(false)

      const { result } = renderHook(() => useStacks())

      // Error is caught, so hook continues with default state
      expect(result.current.isSignedIn).toBe(true) // isConnected() is still true
      expect(result.current.address).toBeNull() // But address fails gracefully
    })

    it('handles userSession errors gracefully', () => {
      mockConnect.isConnected.mockReturnValue(false)
      mockStacksUtils.userSession.isSignInPending.mockReturnValue(false)
      mockStacksUtils.userSession.isUserSignedIn.mockImplementation(() => {
        throw new Error('UserSession error')
      })

      const { result } = renderHook(() => useStacks())

      expect(result.current.userData).toBeNull()
      expect(result.current.isSignedIn).toBe(false)
      expect(result.current.address).toBeNull()
    })
  })

  describe('edge cases', () => {
    it('handles missing addresses array in localStorage', () => {
      mockConnect.isConnected.mockReturnValue(true)
      mockConnect.getLocalStorage.mockReturnValue({})
      mockStacksUtils.userSession.isUserSignedIn.mockReturnValue(false)
      mockStacksUtils.userSession.isSignInPending.mockReturnValue(false)

      const { result } = renderHook(() => useStacks())

      expect(result.current.address).toBeNull()
    })

    it('handles empty addresses array in localStorage', () => {
      mockConnect.isConnected.mockReturnValue(true)
      mockConnect.getLocalStorage.mockReturnValue({ addresses: { stx: [] } })
      mockStacksUtils.userSession.isUserSignedIn.mockReturnValue(false)
      mockStacksUtils.userSession.isSignInPending.mockReturnValue(false)

      const { result } = renderHook(() => useStacks())

      expect(result.current.address).toBeNull()
    })

    it('handles userSession with missing address data', () => {
      mockConnect.isConnected.mockReturnValue(false)
      mockStacksUtils.userSession.isSignInPending.mockReturnValue(false)
      mockStacksUtils.userSession.isUserSignedIn.mockReturnValue(true)
      mockStacksUtils.userSession.loadUserData.mockReturnValue({
        profile: {},
      })

      const { result } = renderHook(() => useStacks())

      expect(result.current.address).toBeNull()
    })
  })
})