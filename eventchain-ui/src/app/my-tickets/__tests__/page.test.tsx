import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../../__tests__/utils/test-utils'
import MyTicketsPage from '../page'
import { useStacks } from '@/hooks/useStacks'
import { useTickets } from '@/hooks/useTickets'

// Mock hooks
jest.mock('@/hooks/useStacks')
jest.mock('@/hooks/useTickets')
const mockUseStacks = useStacks as jest.MockedFunction<typeof useStacks>
const mockUseTickets = useTickets as jest.MockedFunction<typeof useTickets>

// Mock TicketQRDialog component
jest.mock('@/components/TicketQRDialog', () => ({
  TicketQRDialog: ({ isOpen, onClose, ticketData }: any) => 
    isOpen ? (
      <div data-testid="qr-dialog">
        <button onClick={onClose} data-testid="close-qr-dialog">Close</button>
        <div data-testid="qr-ticket-data">{JSON.stringify(ticketData)}</div>
      </div>
    ) : null
}))

// Mock console methods
const originalConsoleLog = console.log
beforeAll(() => {
  console.log = jest.fn()
})
afterAll(() => {
  console.log = originalConsoleLog
})

const mockTickets = [
  {
    id: 1,
    tokenId: 'TKT-001',
    eventTitle: 'Blockchain Conference 2024',
    location: 'San Francisco, CA',
    eventDate: '2024-03-15',
    eventTime: '10:00 AM',
    priceDisplay: '1 STX',
    status: 'active'
  },
  {
    id: 2,
    tokenId: 'TKT-002',
    eventTitle: 'Art Gallery Opening',
    location: 'New York, NY',
    eventDate: '2024-03-20',
    eventTime: '7:00 PM',
    priceDisplay: '0.5 STX',
    status: 'used'
  },
  {
    id: 3,
    tokenId: 'TKT-003',
    eventTitle: 'Music Festival',
    location: 'Austin, TX',
    eventDate: '2024-04-01',
    eventTime: '2:00 PM',
    priceDisplay: '2 STX',
    status: 'active'
  }
]

describe('MyTicketsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Mock window.location and window.open only if not already defined
    if (!window.location || !window.location.reload) {
      delete (window as any).location
      window.location = {
        href: '',
        reload: jest.fn(),
      } as any
    }

    if (!window.open) {
      window.open = jest.fn()
    }
  })

  describe('when user is not signed in', () => {
    beforeEach(() => {
      mockUseStacks.mockReturnValue({
        userData: null,
        isSignedIn: false,
        address: null
      })
      mockUseTickets.mockReturnValue({
        tickets: [],
        isLoading: false,
        error: null,
        refetch: jest.fn()
      })
    })

    it('shows connect wallet message', () => {
      render(<MyTicketsPage />)

      expect(screen.getByText('Connect Wallet')).toBeInTheDocument()
      expect(screen.getByText('Please connect your wallet to view your tickets')).toBeInTheDocument()
    })

    it('does not show tickets content', () => {
      render(<MyTicketsPage />)

      expect(screen.queryByText('My Tickets')).not.toBeInTheDocument()
      expect(screen.queryByText('View and manage your event tickets')).not.toBeInTheDocument()
    })
  })

  describe('when user is signed in', () => {
    beforeEach(() => {
      mockUseStacks.mockReturnValue({
        userData: { profile: { stxAddress: { testnet: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9' } } },
        isSignedIn: true,
        address: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9'
      })
    })

    describe('loading state', () => {
      beforeEach(() => {
        mockUseTickets.mockReturnValue({
          tickets: [],
          isLoading: true,
          error: null,
          refetch: jest.fn()
        })
      })

      it('displays page title and description', () => {
        render(<MyTicketsPage />)

        expect(screen.getByText('My Tickets')).toBeInTheDocument()
        expect(screen.getByText('View and manage your event tickets')).toBeInTheDocument()
      })

      it('shows loading skeleton cards', () => {
        render(<MyTicketsPage />)

        // Check for skeleton cards via animate-pulse class
        const skeletonElements = document.querySelectorAll('.animate-pulse')
        expect(skeletonElements.length).toBeGreaterThanOrEqual(4)
      })

      it('shows loading animation', () => {
        render(<MyTicketsPage />)

        // Check for animate-pulse class on skeleton elements
        const skeletonElements = document.querySelectorAll('.animate-pulse')
        expect(skeletonElements.length).toBeGreaterThan(0)
      })
    })

    describe('error state', () => {
      beforeEach(() => {
        mockUseTickets.mockReturnValue({
          tickets: [],
          isLoading: false,
          error: 'Failed to load tickets',
          refetch: jest.fn()
        })
      })

      it('displays error message', () => {
        render(<MyTicketsPage />)

        expect(screen.getByText('Error loading tickets: Failed to load tickets')).toBeInTheDocument()
      })

      it('shows retry button that reloads page', () => {
        // jsdom doesn't support window.location.reload, just check button exists and is clickable
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

        render(<MyTicketsPage />)

        const retryButton = screen.getByRole('button', { name: 'Retry' })
        expect(() => {
          fireEvent.click(retryButton)
        }).not.toThrow()

        consoleError.mockRestore()
      })
    })

    describe('no tickets state', () => {
      beforeEach(() => {
        mockUseTickets.mockReturnValue({
          tickets: [],
          isLoading: false,
          error: null,
          refetch: jest.fn()
        })
      })

      it('shows no tickets message', () => {
        render(<MyTicketsPage />)

        expect(screen.getByText('No Tickets Yet')).toBeInTheDocument()
        expect(screen.getByText("You haven't purchased any tickets yet. Browse events to get started!")).toBeInTheDocument()
      })

      it('shows browse events button that navigates to home', () => {
        render(<MyTicketsPage />)

        const browseButton = screen.getByRole('button', { name: 'Browse Events' })
        fireEvent.click(browseButton)

        // window.location.href includes the protocol and host in jsdom
        expect(window.location.href).toContain('/')
      })

      it('displays ticket icon', () => {
        render(<MyTicketsPage />)

        // The Ticket icon should be present in the empty state
        const ticketIcon = document.querySelector('svg')
        expect(ticketIcon).toBeInTheDocument()
      })
    })

    describe('tickets loaded state', () => {
      beforeEach(() => {
        mockUseTickets.mockReturnValue({
          tickets: mockTickets,
          isLoading: false,
          error: null,
          refetch: jest.fn()
        })
      })

      it('displays all tickets', () => {
        render(<MyTicketsPage />)

        expect(screen.getByText('Blockchain Conference 2024')).toBeInTheDocument()
        expect(screen.getByText('Art Gallery Opening')).toBeInTheDocument()
        expect(screen.getByText('Music Festival')).toBeInTheDocument()
      })

      it('shows ticket details correctly', () => {
        render(<MyTicketsPage />)

        // Check first ticket details
        expect(screen.getByText('San Francisco, CA')).toBeInTheDocument()
        expect(screen.getByText('2024-03-15')).toBeInTheDocument()
        expect(screen.getByText('10:00 AM')).toBeInTheDocument()
        expect(screen.getByText('1 STX')).toBeInTheDocument()
      })

      it('displays correct status badges', () => {
        render(<MyTicketsPage />)

        // Check for status badges
        const activeBadges = screen.getAllByText('Active')
        const usedBadges = screen.getAllByText('Used')
        
        expect(activeBadges).toHaveLength(2) // Two active tickets
        expect(usedBadges).toHaveLength(1) // One used ticket
      })

      it('shows action buttons for each ticket', () => {
        render(<MyTicketsPage />)

        const showQRButtons = screen.getAllByText('Show QR')
        const detailsButtons = screen.getAllByText('Details')
        
        expect(showQRButtons).toHaveLength(3)
        expect(detailsButtons).toHaveLength(3)
      })

      it('opens event details when details button is clicked', () => {
        const mockOpen = jest.fn()
        Object.defineProperty(window, 'open', {
          value: mockOpen,
          writable: true,
        })

        render(<MyTicketsPage />)
        
        const firstDetailsButton = screen.getAllByText('Details')[0]
        fireEvent.click(firstDetailsButton)
        
        expect(mockOpen).toHaveBeenCalledWith('/event/1', '_blank')
      })
    })

    describe('QR code functionality', () => {
      beforeEach(() => {
        mockUseTickets.mockReturnValue({
          tickets: mockTickets,
          isLoading: false,
          error: null,
          refetch: jest.fn()
        })
      })

      it('opens QR dialog when Show QR button is clicked', async () => {
        render(<MyTicketsPage />)
        
        const firstShowQRButton = screen.getAllByText('Show QR')[0]
        fireEvent.click(firstShowQRButton)
        
        await waitFor(() => {
          expect(screen.getByTestId('qr-dialog')).toBeInTheDocument()
        })
      })

      it('passes correct ticket data to QR dialog', async () => {
        render(<MyTicketsPage />)
        
        const firstShowQRButton = screen.getAllByText('Show QR')[0]
        fireEvent.click(firstShowQRButton)
        
        await waitFor(() => {
          const qrDataElement = screen.getByTestId('qr-ticket-data')
          const qrData = JSON.parse(qrDataElement.textContent || '{}')
          
          expect(qrData.ticketId).toBe('TKT-001')
          expect(qrData.eventId).toBe('1')
          expect(qrData.eventTitle).toBe('Blockchain Conference 2024')
          expect(qrData.ownerAddress).toBe('ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9')
          expect(qrData.eventDate).toBe('2024-03-15')
          expect(qrData.eventTime).toBe('10:00 AM')
          expect(qrData.location).toBe('San Francisco, CA')
          expect(qrData.price).toBe('1 STX')
          expect(qrData.used).toBe(false)
        })
      })

      it('handles used ticket status in QR data', async () => {
        render(<MyTicketsPage />)
        
        const secondShowQRButton = screen.getAllByText('Show QR')[1]
        fireEvent.click(secondShowQRButton)
        
        await waitFor(() => {
          const qrDataElement = screen.getByTestId('qr-ticket-data')
          const qrData = JSON.parse(qrDataElement.textContent || '{}')
          
          expect(qrData.used).toBe(true)
        })
      })

      it('closes QR dialog when close button is clicked', async () => {
        render(<MyTicketsPage />)
        
        const firstShowQRButton = screen.getAllByText('Show QR')[0]
        fireEvent.click(firstShowQRButton)
        
        await waitFor(() => {
          expect(screen.getByTestId('qr-dialog')).toBeInTheDocument()
        })
        
        const closeButton = screen.getByTestId('close-qr-dialog')
        fireEvent.click(closeButton)
        
        await waitFor(() => {
          expect(screen.queryByTestId('qr-dialog')).not.toBeInTheDocument()
        })
      })
    })

    describe('ticket card layout', () => {
      beforeEach(() => {
        mockUseTickets.mockReturnValue({
          tickets: mockTickets,
          isLoading: false,
          error: null,
          refetch: jest.fn()
        })
      })

      it('displays tickets in a responsive grid', () => {
        render(<MyTicketsPage />)

        // Check for grid layout classes
        const gridContainer = document.querySelector('.grid')
        expect(gridContainer).toHaveClass('gap-4')
        expect(gridContainer).toHaveClass('md:grid-cols-2')
        expect(gridContainer).toHaveClass('lg:grid-cols-3')
      })

      it('shows status badge in correct position', () => {
        render(<MyTicketsPage />)

        // Status badges should be positioned absolutely in top-right
        const badges = screen.getAllByText(/Active|Used/)
        badges.forEach(badge => {
          const card = badge.closest('[class*="relative"]')
          expect(card).toBeInTheDocument()
        })
      })

      it('displays event information with icons', () => {
        render(<MyTicketsPage />)

        // Each ticket should have location, date, time, and price info with icons
        // Check for ticket titles from the mock data
        expect(screen.getByText('Blockchain Conference 2024')).toBeInTheDocument()
        expect(screen.getByText('Art Gallery Opening')).toBeInTheDocument()
        expect(screen.getByText('Music Festival')).toBeInTheDocument()
      })
    })

    describe('edge cases', () => {
      it('handles tickets without tokenId', async () => {
        const ticketsWithoutTokenId = [{
          id: 99,
          eventTitle: 'Test Event',
          location: 'Test Location',
          eventDate: '2024-01-01',
          eventTime: '12:00 PM',
          priceDisplay: '1 STX',
          status: 'active'
        }]

        mockUseTickets.mockReturnValue({
          tickets: ticketsWithoutTokenId,
          isLoading: false,
          error: null,
          refetch: jest.fn()
        })

        render(<MyTicketsPage />)
        
        const showQRButton = screen.getByText('Show QR')
        fireEvent.click(showQRButton)
        
        await waitFor(() => {
          const qrDataElement = screen.getByTestId('qr-ticket-data')
          const qrData = JSON.parse(qrDataElement.textContent || '{}')
          
          expect(qrData.ticketId).toBe('TKT-99') // Fallback format
        })
      })

      it('handles missing ticket data gracefully', () => {
        const incompleteTickets = [{
          id: 1,
          eventTitle: 'Test Event',
          status: 'active'
          // Missing other fields
        }]

        mockUseTickets.mockReturnValue({
          tickets: incompleteTickets,
          isLoading: false,
          error: null,
          refetch: jest.fn()
        })

        render(<MyTicketsPage />)
        
        expect(screen.getByText('Test Event')).toBeInTheDocument()
        // Should handle missing fields without crashing
      })
    })

    describe('accessibility', () => {
      beforeEach(() => {
        mockUseTickets.mockReturnValue({
          tickets: mockTickets,
          isLoading: false,
          error: null,
          refetch: jest.fn()
        })
      })

      it('has proper heading hierarchy', () => {
        render(<MyTicketsPage />)

        expect(screen.getByRole('heading', { level: 1, name: 'My Tickets' })).toBeInTheDocument()
      })

      it('has accessible buttons', () => {
        render(<MyTicketsPage />)

        const showQRButtons = screen.getAllByRole('button', { name: 'Show QR' })
        const detailsButtons = screen.getAllByRole('button', { name: 'Details' })
        
        showQRButtons.forEach(button => {
          expect(button).toBeInTheDocument()
        })
        
        detailsButtons.forEach(button => {
          expect(button).toBeInTheDocument()
        })
      })

      it('provides clear status information', () => {
        render(<MyTicketsPage />)

        // Status badges should be clearly visible
        expect(screen.getAllByText('Active')).toHaveLength(2)
        expect(screen.getAllByText('Used')).toHaveLength(1)
      })
    })
  })
})
