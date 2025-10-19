import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../../../__tests__/utils/test-utils'
import EventDetailPage from '../page'
import { useStacks } from '@/hooks/useStacks'
import { useEvent } from '@/hooks/useEvent'
import * as stacksUtils from '@/lib/stacks-utils'

// Mock hooks
jest.mock('@/hooks/useStacks')
jest.mock('@/hooks/useEvent')
const mockUseStacks = useStacks as jest.MockedFunction<typeof useStacks>
const mockUseEvent = useEvent as jest.MockedFunction<typeof useEvent>

// Mock stacks-utils
jest.mock('@/lib/stacks-utils', () => ({
  buyTicket: jest.fn(),
  userSession: {
    isUserSignedIn: jest.fn(() => false),
    loadUserData: jest.fn(() => null),
  },
  STACKS_CONFIG: {
    network: {},
    contractAddress: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9',
    contractName: 'eventchain',
  },
}))

// Get the mock after the module is mocked
const mockBuyTicket = jest.fn()

// Mock Next.js Link
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>
  }
})

// Mock console methods
const originalConsoleLog = console.log
const originalConsoleError = console.error
beforeAll(() => {
  console.log = jest.fn()
  console.error = jest.fn()
})
afterAll(() => {
  console.log = originalConsoleLog
  console.error = originalConsoleError
})

const mockEvent = {
  id: 1,
  title: 'Blockchain Conference 2024',
  description: 'Learn about the latest in blockchain technology and its applications',
  category: 'technology',
  location: 'San Francisco, CA',
  date: '2024-03-15',
  time: '10:00 AM',
  price: '1000000',
  priceDisplay: '1 STX',
  image: 'QmTestHash123',
  creator: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9',
  organizer: {
    name: 'TechEvents',
    avatar: 'QmOrganizerAvatar',
    verified: true
  },
  attendees: 50,
  maxAttendees: 200,
  totalTickets: 200,
  ticketsSold: 50,
  schedules: [
    {
      time: '10:00',
      title: 'Opening Keynote',
      speaker: 'John Doe'
    },
    {
      time: '11:30',
      title: 'Blockchain Fundamentals',
      speaker: 'Jane Smith'
    }
  ],
  speakers: [
    {
      name: 'John Doe',
      role: 'CEO at BlockchainCorp',
      avatar: 'QmSpeakerAvatar1'
    },
    {
      name: 'Jane Smith',
      role: 'CTO at CryptoTech',
      avatar: 'QmSpeakerAvatar2'
    }
  ],
  timestamp: 1234567890
}

const mockUpdateEventData = jest.fn()
const mockRefetch = jest.fn().mockResolvedValue(undefined)

// Mock window.location once before all tests
const mockReload = jest.fn()
delete (window as any).location
window.location = {
  origin: 'https://example.com',
  reload: mockReload,
} as any

describe('EventDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockBuyTicket.mockResolvedValue(undefined)

    // Reset window.location mock
    mockReload.mockClear()

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => '{}'),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
      configurable: true,
    })

    // Mock navigator.share and clipboard
    Object.defineProperty(navigator, 'share', {
      value: jest.fn(),
      writable: true,
      configurable: true,
    })
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: jest.fn(),
      },
      writable: true,
      configurable: true,
    })
  })

  describe('loading state', () => {
    beforeEach(() => {
      mockUseStacks.mockReturnValue({
        userData: null,
        isSignedIn: false,
        address: null
      })
      mockUseEvent.mockReturnValue({
        event: null,
        isLoading: true,
        error: null,
        updateEventData: mockUpdateEventData,
        refetch: mockRefetch
      })
    })

    it('displays loading spinner and message', () => {
      render(<EventDetailPage params={{ id: '1' }} />)

      expect(screen.getByText('Loading event from blockchain...')).toBeInTheDocument()
      // Check for the spinner element by class
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('shows back to events link', () => {
      render(<EventDetailPage params={{ id: '1' }} />)

      const backLink = screen.getByText('Back to Events')
      expect(backLink.closest('a')).toHaveAttribute('href', '/')
    })
  })

  describe('error state', () => {
    beforeEach(() => {
      mockUseStacks.mockReturnValue({
        userData: null,
        isSignedIn: false,
        address: null
      })
      mockUseEvent.mockReturnValue({
        event: null,
        isLoading: false,
        error: 'Event not found',
        updateEventData: mockUpdateEventData,
        refetch: mockRefetch
      })
    })

    it('displays error message', () => {
      render(<EventDetailPage params={{ id: '1' }} />)

      expect(screen.getByText('Event not found')).toBeInTheDocument()
    })

    it('shows try again button that reloads page', () => {
      render(<EventDetailPage params={{ id: '1' }} />)

      const tryAgainButton = screen.getByRole('button', { name: 'Try Again' })
      fireEvent.click(tryAgainButton)

      expect(window.location.reload).toHaveBeenCalled()
    })
  })

  describe('event loaded - attendee view', () => {
    beforeEach(() => {
      mockUseStacks.mockReturnValue({
        userData: { profile: { stxAddress: { testnet: 'ST1DIFFERENT_ADDRESS' } } },
        isSignedIn: true,
        address: 'ST1DIFFERENT_ADDRESS'
      })
      mockUseEvent.mockReturnValue({
        event: mockEvent,
        isLoading: false,
        error: null,
        updateEventData: mockUpdateEventData,
        refetch: mockRefetch
      })
    })

    it('displays event details correctly', () => {
      render(<EventDetailPage params={{ id: '1' }} />)

      expect(screen.getByText('Blockchain Conference 2024')).toBeInTheDocument()
      expect(screen.getByText('Learn about the latest in blockchain technology and its applications')).toBeInTheDocument()
      expect(screen.getByText('technology')).toBeInTheDocument()
      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument()
      expect(screen.getByText('2024-03-15')).toBeInTheDocument()
      expect(screen.getByText('10:00 AM')).toBeInTheDocument()
    })

    it('shows organizer information', () => {
      render(<EventDetailPage params={{ id: '1' }} />)

      expect(screen.getByText('Organized by TechEvents')).toBeInTheDocument()
      expect(screen.getByText('Verified Organizer')).toBeInTheDocument()
    })

    it('displays attendee count and availability', () => {
      render(<EventDetailPage params={{ id: '1' }} />)

      expect(screen.getByText('50/200 attendees')).toBeInTheDocument()
      expect(screen.getByText('150 of 200')).toBeInTheDocument() // Available tickets
    })

    it('shows ticket purchase section', () => {
      render(<EventDetailPage params={{ id: '1' }} />)

      expect(screen.getByText('Purchase Tickets')).toBeInTheDocument()
      expect(screen.getByText('1 STX')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Buy Tickets' })).toBeInTheDocument()
    })

    it('displays blockchain verification badge', () => {
      render(<EventDetailPage params={{ id: '1' }} />)

      expect(screen.getByText('Blockchain Verified')).toBeInTheDocument()
    })

    it('shows share event button', () => {
      render(<EventDetailPage params={{ id: '1' }} />)

      expect(screen.getByRole('button', { name: 'Share Event' })).toBeInTheDocument()
    })
  })

  describe('event loaded - organizer view', () => {
    beforeEach(() => {
      mockUseStacks.mockReturnValue({
        userData: { profile: { stxAddress: { testnet: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9' } } },
        isSignedIn: true,
        address: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9'
      })
      mockUseEvent.mockReturnValue({
        event: mockEvent,
        isLoading: false,
        error: null,
        updateEventData: mockUpdateEventData,
        refetch: mockRefetch
      })
    })

    it('shows organizer badge', () => {
      render(<EventDetailPage params={{ id: '1' }} />)

      expect(screen.getByText('You are the organizer')).toBeInTheDocument()
    })

    it('shows edit description button', () => {
      render(<EventDetailPage params={{ id: '1' }} />)

      expect(screen.getByRole('button', { name: 'Edit Description' })).toBeInTheDocument()
    })

    it('shows add schedule item button', () => {
      render(<EventDetailPage params={{ id: '1' }} />)

      expect(screen.getByRole('button', { name: 'Add Schedule Item' })).toBeInTheDocument()
    })

    it('shows add speaker button', () => {
      render(<EventDetailPage params={{ id: '1' }} />)

      // Switch to speakers tab first
      fireEvent.click(screen.getByRole('tab', { name: 'Speakers' }))
      
      expect(screen.getByRole('button', { name: 'Add Speaker' })).toBeInTheDocument()
    })

    it('disables buy tickets button for organizer', () => {
      render(<EventDetailPage params={{ id: '1' }} />)

      const buyButton = screen.getByRole('button', { name: 'You are the organizer' })
      expect(buyButton).toBeDisabled()
    })
  })

  describe('ticket purchase functionality', () => {
    beforeEach(() => {
      mockUseStacks.mockReturnValue({
        userData: { profile: { stxAddress: { testnet: 'ST1DIFFERENT_ADDRESS' } } },
        isSignedIn: true,
        address: 'ST1DIFFERENT_ADDRESS'
      })
      mockUseEvent.mockReturnValue({
        event: mockEvent,
        isLoading: false,
        error: null,
        updateEventData: mockUpdateEventData,
        refetch: mockRefetch
      })
    })

    it('allows changing ticket quantity', async () => {
      render(<EventDetailPage params={{ id: '1' }} />)

      const quantityInput = screen.getByLabelText('Quantity')
      fireEvent.change(quantityInput, { target: { value: '3' } })

      await waitFor(() => {
        expect(quantityInput).toHaveValue(3)
      })

      // Check total price updates
      expect(screen.getByText('3.003 STX')).toBeInTheDocument() // 3 STX + 0.003 gas
    })

    it('shows multiple transaction warning for multiple tickets', async () => {
      render(<EventDetailPage params={{ id: '1' }} />)

      const quantityInput = screen.getByLabelText('Quantity')
      fireEvent.change(quantityInput, { target: { value: '2' } })

      await waitFor(() => {
        expect(screen.getByText(/Note: Each ticket requires a separate transaction/)).toBeInTheDocument()
        expect(screen.getByText(/You'll need to confirm 2 transactions/)).toBeInTheDocument()
      })
    })

    it('initiates purchase when buy button clicked', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})
      
      render(<EventDetailPage params={{ id: '1' }} />)

      const buyButton = screen.getByRole('button', { name: 'Buy Tickets' })
      fireEvent.click(buyButton)

      await waitFor(() => {
        expect(mockBuyTicket).toHaveBeenCalledWith(1, 1000000, 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9')
      })

      expect(alertSpy).toHaveBeenCalledWith('1 ticket(s) purchase initiated! Please check your wallet.')
      alertSpy.mockRestore()
    })

    it('shows error message when purchase fails', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})
      mockBuyTicket.mockRejectedValue(new Error('Transaction failed'))
      
      render(<EventDetailPage params={{ id: '1' }} />)

      const buyButton = screen.getByRole('button', { name: 'Buy Tickets' })
      fireEvent.click(buyButton)

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Purchase failed. Please try again.')
      })
      
      alertSpy.mockRestore()
    })

    it('shows connect wallet message when not signed in', () => {
      mockUseStacks.mockReturnValue({
        userData: null,
        isSignedIn: false,
        address: null
      })

      render(<EventDetailPage params={{ id: '1' }} />)

      expect(screen.getByRole('button', { name: 'Connect Wallet' })).toBeInTheDocument()
    })
  })

  describe('sold out event', () => {
    beforeEach(() => {
      const soldOutEvent = {
        ...mockEvent,
        attendees: 200,
        maxAttendees: 200
      }

      mockUseStacks.mockReturnValue({
        userData: null,
        isSignedIn: false,
        address: null
      })
      mockUseEvent.mockReturnValue({
        event: soldOutEvent,
        isLoading: false,
        error: null,
        updateEventData: mockUpdateEventData,
        refetch: mockRefetch
      })
    })

    it('shows sold out message', () => {
      render(<EventDetailPage params={{ id: '1' }} />)

      expect(screen.getByText('Event Sold Out')).toBeInTheDocument()
      expect(screen.getByText('All tickets have been purchased')).toBeInTheDocument()
    })

    it('does not show purchase controls', () => {
      render(<EventDetailPage params={{ id: '1' }} />)

      expect(screen.queryByLabelText('Quantity')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Buy Tickets' })).not.toBeInTheDocument()
    })
  })

  describe('schedule management', () => {
    beforeEach(() => {
      mockUseStacks.mockReturnValue({
        userData: { profile: { stxAddress: { testnet: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9' } } },
        isSignedIn: true,
        address: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9'
      })
      mockUseEvent.mockReturnValue({
        event: mockEvent,
        isLoading: false,
        error: null,
        updateEventData: mockUpdateEventData,
        refetch: mockRefetch
      })
    })

    it('displays existing schedule items', () => {
      render(<EventDetailPage params={{ id: '1' }} />)

      expect(screen.getByText('Opening Keynote')).toBeInTheDocument()
      expect(screen.getByText('by John Doe')).toBeInTheDocument()
      expect(screen.getByText('Blockchain Fundamentals')).toBeInTheDocument()
      expect(screen.getByText('by Jane Smith')).toBeInTheDocument()
    })

    it('allows organizer to add schedule items', async () => {
      render(<EventDetailPage params={{ id: '1' }} />)

      const addButton = screen.getByRole('button', { name: 'Add Schedule Item' })
      fireEvent.click(addButton)

      // Fill in the form
      fireEvent.change(screen.getByLabelText('Time'), { target: { value: '14:00' } })
      fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Networking Break' } })
      fireEvent.change(screen.getByLabelText('Speaker (optional)'), { target: { value: 'All Attendees' } })

      // Submit
      fireEvent.click(screen.getByRole('button', { name: 'Add Item' }))

      await waitFor(() => {
        expect(mockUpdateEventData).toHaveBeenCalledWith({
          schedules: [
            ...mockEvent.schedules,
            { time: '14:00', title: 'Networking Break', speaker: 'All Attendees' }
          ]
        })
      })
    })

    it('allows organizer to remove schedule items', async () => {
      render(<EventDetailPage params={{ id: '1' }} />)

      const removeButtons = screen.getAllByRole('button', { name: '' }) // Trash buttons
      const firstRemoveButton = removeButtons.find(button => 
        button.querySelector('svg') && button.closest('[data-testid]') === null
      )
      
      if (firstRemoveButton) {
        fireEvent.click(firstRemoveButton)

        await waitFor(() => {
          expect(mockUpdateEventData).toHaveBeenCalledWith({
            schedules: [mockEvent.schedules[1]] // Second item remains
          })
        })
      }
    })
  })

  describe('speaker management', () => {
    beforeEach(() => {
      mockUseStacks.mockReturnValue({
        userData: { profile: { stxAddress: { testnet: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9' } } },
        isSignedIn: true,
        address: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9'
      })
      mockUseEvent.mockReturnValue({
        event: mockEvent,
        isLoading: false,
        error: null,
        updateEventData: mockUpdateEventData,
        refetch: mockRefetch
      })
    })

    it('displays existing speakers', () => {
      render(<EventDetailPage params={{ id: '1' }} />)

      // Switch to speakers tab
      fireEvent.click(screen.getByRole('tab', { name: 'Speakers' }))

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('CEO at BlockchainCorp')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('CTO at CryptoTech')).toBeInTheDocument()
    })

    it('allows organizer to add speakers', async () => {
      render(<EventDetailPage params={{ id: '1' }} />)

      // Switch to speakers tab
      fireEvent.click(screen.getByRole('tab', { name: 'Speakers' }))
      
      const addButton = screen.getByRole('button', { name: 'Add Speaker' })
      fireEvent.click(addButton)

      // Fill in the form
      fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Alice Johnson' } })
      fireEvent.change(screen.getByLabelText('Role/Title'), { target: { value: 'Blockchain Researcher' } })
      fireEvent.change(screen.getByLabelText('Avatar URL (optional)'), { target: { value: 'https://example.com/avatar.jpg' } })

      // Submit
      fireEvent.click(screen.getByRole('button', { name: 'Add Speaker' }))

      await waitFor(() => {
        expect(mockUpdateEventData).toHaveBeenCalledWith({
          speakers: [
            ...mockEvent.speakers,
            { name: 'Alice Johnson', role: 'Blockchain Researcher', avatar: 'https://example.com/avatar.jpg' }
          ]
        })
      })
    })
  })

  describe('sharing functionality', () => {
    beforeEach(() => {
      mockUseStacks.mockReturnValue({
        userData: null,
        isSignedIn: false,
        address: null
      })
      mockUseEvent.mockReturnValue({
        event: mockEvent,
        isLoading: false,
        error: null,
        updateEventData: mockUpdateEventData,
        refetch: mockRefetch
      })
    })

    it('uses Web Share API when available', async () => {
      const mockShare = jest.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        writable: true,
      })

      render(<EventDetailPage params={{ id: '1' }} />)

      const shareButton = screen.getByRole('button', { name: 'Share Event' })
      fireEvent.click(shareButton)

      await waitFor(() => {
        expect(mockShare).toHaveBeenCalledWith({
          title: 'Blockchain Conference 2024',
          text: expect.stringContaining('Check out this amazing event: Blockchain Conference 2024'),
          url: 'https://example.com/event/1'
        })
      })
    })

    it('falls back to clipboard when Web Share API not available', async () => {
      const mockWriteText = jest.fn().mockResolvedValue(undefined)
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})
      
      Object.defineProperty(navigator, 'share', {
        value: undefined,
        writable: true,
      })
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
      })

      render(<EventDetailPage params={{ id: '1' }} />)

      const shareButton = screen.getByRole('button', { name: 'Share Event' })
      fireEvent.click(shareButton)

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith('https://example.com/event/1')
        expect(alertSpy).toHaveBeenCalledWith('Event link copied to clipboard!')
      })
      
      alertSpy.mockRestore()
    })
  })

  describe('blockchain information', () => {
    beforeEach(() => {
      mockUseStacks.mockReturnValue({
        userData: null,
        isSignedIn: false,
        address: null
      })
      mockUseEvent.mockReturnValue({
        event: mockEvent,
        isLoading: false,
        error: null,
        updateEventData: mockUpdateEventData,
        refetch: mockRefetch
      })
    })

    it('displays blockchain verification info', () => {
      render(<EventDetailPage params={{ id: '1' }} />)

      expect(screen.getByText('✓ Secure Stacks blockchain transaction')).toBeInTheDocument()
      expect(screen.getByText('✓ Smart contract ticket with proof of ownership')).toBeInTheDocument()
      expect(screen.getByText('✓ Transferable and refundable')).toBeInTheDocument()
      expect(screen.getByText('✓ Instant confirmation')).toBeInTheDocument()
    })

    it('shows event blockchain details', () => {
      render(<EventDetailPage params={{ id: '1' }} />)

      expect(screen.getByText('Event ID:')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('Creator:')).toBeInTheDocument()
      expect(screen.getByText('ST2EC0NW...JNfB9')).toBeInTheDocument()
      expect(screen.getByText('Network:')).toBeInTheDocument()
      expect(screen.getByText('Stacks Testnet')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    beforeEach(() => {
      mockUseStacks.mockReturnValue({
        userData: null,
        isSignedIn: false,
        address: null
      })
      mockUseEvent.mockReturnValue({
        event: mockEvent,
        isLoading: false,
        error: null,
        updateEventData: mockUpdateEventData,
        refetch: mockRefetch
      })
    })

    it('has proper heading hierarchy', () => {
      render(<EventDetailPage params={{ id: '1' }} />)

      expect(screen.getByRole('heading', { level: 1, name: 'Blockchain Conference 2024' })).toBeInTheDocument()
    })

    it('has proper tab navigation', () => {
      render(<EventDetailPage params={{ id: '1' }} />)

      expect(screen.getByRole('tab', { name: 'Schedule' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Speakers' })).toBeInTheDocument()
    })

    it('has proper form labels', () => {
      render(<EventDetailPage params={{ id: '1' }} />)

      expect(screen.getByLabelText('Quantity')).toBeInTheDocument()
    })
  })
})
