import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { ThemeProvider } from 'next-themes'
import { ModeProvider } from '@/contexts/ModeContext'

// Mock useStacks hook before importing ModeProvider
jest.mock('@/hooks/useStacks', () => ({
  useStacks: jest.fn(() => ({
    address: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9',
    isSignedIn: true,
    userData: {
      profile: {
        stxAddress: {
          testnet: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9',
          mainnet: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9',
        },
      },
    },
  })),
}))

// Mock @stacks/connect
jest.mock('@stacks/connect', () => ({
  isConnected: jest.fn().mockReturnValue(false),
  getLocalStorage: jest.fn().mockReturnValue(null),
  showConnect: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock stacks-utils functions
jest.mock('@/lib/stacks-utils', () => ({
  readOrganizerStatus: jest.fn().mockResolvedValue(false),
  userSession: {
    isSignInPending: jest.fn().mockReturnValue(false),
    handlePendingSignIn: jest.fn(),
    isUserSignedIn: jest.fn().mockReturnValue(true),
    loadUserData: jest.fn().mockReturnValue({
      profile: {
        stxAddress: {
          testnet: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9',
          mainnet: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9',
        },
      },
    }),
  },
}))

// Mock blockchain providers
export const MockStacksProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

// Mock wallet state
export const mockWalletState = {
  address: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9',
  isSignedIn: true,
  userData: {
    profile: {
      stxAddress: {
        testnet: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9',
        mainnet: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9',
      },
    },
  },
}

// Mock event data
export const mockEvents = [
  {
    id: 1,
    title: 'Test Event 1',
    description: 'This is a test event',
    location: 'Test Location',
    date: '2024-12-31',
    time: '18:00',
    price: 1000000,
    priceDisplay: '1.00 STX',
    totalTickets: 100,
    ticketsSold: 25,
    category: 'technology',
    image: '',
    organizer: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9',
    attendees: 25,
    result: {
      creator: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9',
      name: 'Test Event 1',
      location: 'Test Location',
      timestamp: 1735689600,
      price: 1000000,
      'total-tickets': 100,
      'tickets-sold': 25,
      image: '',
    },
  },
  {
    id: 2,
    title: 'Test Event 2',
    description: 'This is another test event',
    location: 'Another Test Location',
    date: '2025-01-15',
    time: '19:30',
    price: 2000000,
    priceDisplay: '2.00 STX',
    totalTickets: 50,
    ticketsSold: 10,
    category: 'art',
    image: '',
    organizer: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9',
    attendees: 10,
    result: {
      creator: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9',
      name: 'Test Event 2',
      location: 'Another Test Location',
      timestamp: 1736976600,
      price: 2000000,
      'total-tickets': 50,
      'tickets-sold': 10,
      image: '',
    },
  },
]

// Mock ticket data
export const mockTickets = [
  {
    id: 1,
    eventId: 1,
    eventTitle: 'Test Event 1',
    status: 'active',
    isCheckedIn: false,
    qrCode: 'mock-qr-code-data',
    result: mockEvents[0].result,
  },
]

// Test wrapper component
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <ModeProvider>{children}</ModeProvider>
    </ThemeProvider>
  )
}

// Custom render function
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Mock functions for Stacks SDK
export const mockStacksFunctions = {
  connectWallet: jest.fn().mockResolvedValue(undefined),
  disconnectWallet: jest.fn(),
  createEvent: jest.fn().mockResolvedValue({ txId: 'mock-tx-id' }),
  buyTicket: jest.fn().mockResolvedValue('mock-tx-id'),
  checkInTicket: jest.fn().mockResolvedValue(undefined),
  transferTicket: jest.fn().mockResolvedValue(undefined),
  cancelEvent: jest.fn().mockResolvedValue(undefined),
  refundTicket: jest.fn().mockResolvedValue(undefined),
  addOrganizer: jest.fn().mockResolvedValue(undefined),
  readEvents: jest.fn().mockResolvedValue(mockEvents),
  readUserTickets: jest.fn().mockResolvedValue(mockTickets),
  readOrganizerStatus: jest.fn().mockResolvedValue(true),
  readAdminStatus: jest.fn().mockResolvedValue(false),
  readPlatformStats: jest.fn().mockResolvedValue({
    totalEvents: 2,
    totalTicketsSold: 35,
    totalRevenue: 3.5,
    totalOrganizers: 1,
  }),
}

// Mock hooks
export const mockUseStacks = jest.fn(() => mockWalletState)
export const mockUseMode = jest.fn(() => ({
  mode: 'attendee' as const,
  isLoading: false,
  isOrganizer: false,
  switchMode: jest.fn(),
  refreshOrganizerStatus: jest.fn(),
}))
export const mockUseEvents = jest.fn(() => ({
  events: mockEvents,
  isLoading: false,
  error: null,
  refetch: jest.fn(),
}))
export const mockUseTickets = jest.fn(() => ({
  tickets: mockTickets,
  isLoading: false,
  error: null,
  refetch: jest.fn(),
}))

// Helper functions for testing blockchain interactions
export const waitForTransactionConfirmation = async (txId: string) => {
  // Mock transaction confirmation
  return { success: true, txId }
}

export const createMockClarityValue = (value: any, type: string = 'uint') => {
  return {
    type,
    value,
  }
}

// Mock window.alert and window.confirm
export const mockAlert = jest.fn()
export const mockConfirm = jest.fn(() => true)

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks()

  // Mock window methods
  Object.defineProperty(window, 'alert', {
    writable: true,
    value: mockAlert,
  })

  Object.defineProperty(window, 'confirm', {
    writable: true,
    value: mockConfirm,
  })
})