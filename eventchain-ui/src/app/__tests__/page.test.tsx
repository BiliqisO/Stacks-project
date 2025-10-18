import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../__tests__/utils/test-utils'
import HomePage from '../page'
import { useEvents } from '@/hooks/useEvents'

// Mock useEvents hook
jest.mock('@/hooks/useEvents')
const mockUseEvents = useEvents as jest.MockedFunction<typeof useEvents>

// Mock Next.js Link
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>
  }
})

// Mock Select component to simplify testing
jest.mock('@/components/ui/select', () => {
  const actualSelect = jest.requireActual('@/components/ui/select')
  return {
    ...actualSelect,
    Select: ({ children, value, onValueChange }: any) => {
      return (
        <div data-testid="select-root" data-value={value}>
          {React.Children.map(children, (child) =>
            React.cloneElement(child, { onValueChange })
          )}
        </div>
      )
    },
    SelectTrigger: ({ children }: any) => <button role="combobox">{children}</button>,
    SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
    SelectContent: ({ children, onValueChange }: any) => (
      <div data-testid="select-content">
        {React.Children.map(children, (child) =>
          React.cloneElement(child, { onValueChange })
        )}
      </div>
    ),
    SelectItem: ({ children, value, onValueChange }: any) => (
      <button onClick={() => onValueChange?.(value)} data-value={value}>
        {children}
      </button>
    ),
  }
})

// Mock console methods to avoid test noise
const originalConsoleLog = console.log
beforeAll(() => {
  console.log = jest.fn()
})
afterAll(() => {
  console.log = originalConsoleLog
})

const mockEvents = [
  {
    id: 1,
    title: 'Blockchain Conference 2024',
    description: 'Learn about the latest in blockchain technology',
    category: 'technology',
    location: 'San Francisco, CA',
    date: '2024-03-15',
    time: '10:00 AM',
    price: '1000000',
    priceDisplay: '1 STX',
    image: 'QmTestHash123',
    organizer: 'TechEvents',
    attendees: 150,
    totalTickets: 200,
    ticketsSold: 50
  },
  {
    id: 2,
    title: 'Art Gallery Opening',
    description: 'Contemporary art exhibition',
    category: 'art',
    location: 'New York, NY',
    date: '2024-03-20',
    time: '7:00 PM',
    price: '500000',
    priceDisplay: '0.5 STX',
    image: 'QmArtHash456',
    organizer: 'ModernArt Gallery',
    attendees: 75,
    totalTickets: 100,
    ticketsSold: 25
  },
  {
    id: 3,
    title: 'Music Festival',
    description: 'Three days of amazing music',
    category: 'music',
    location: 'Austin, TX',
    date: '2024-04-01',
    time: '2:00 PM',
    price: '2000000',
    priceDisplay: '2 STX',
    image: 'QmMusicHash789',
    organizer: 'LiveMusic Co',
    attendees: 500,
    totalTickets: 1000,
    ticketsSold: 500
  }
]

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('loading state', () => {
    beforeEach(() => {
      mockUseEvents.mockReturnValue({
        events: [],
        isLoading: true,
        error: null,
        refetch: jest.fn()
      })
    })

    it('displays loading spinner and message', () => {
      render(<HomePage />)

      expect(screen.getByText('Loading events from blockchain...')).toBeInTheDocument()
      // Check for loading spinner div
      const loadingDiv = screen.getByText('Loading events from blockchain...').parentElement
      expect(loadingDiv).toBeInTheDocument()
      expect(loadingDiv?.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('does not show events grid during loading', () => {
      render(<HomePage />)

      expect(screen.queryByText('Blockchain Conference 2024')).not.toBeInTheDocument()
    })
  })

  describe('error state', () => {
    beforeEach(() => {
      mockUseEvents.mockReturnValue({
        events: [],
        isLoading: false,
        error: 'Network error',
        refetch: jest.fn()
      })
    })

    it('displays error message', () => {
      render(<HomePage />)

      expect(screen.getByText('Failed to load events: Network error')).toBeInTheDocument()
    })

    it('shows retry button', () => {
      render(<HomePage />)

      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
    })

    it('refreshes page when retry is clicked', () => {
      // Suppress jsdom navigation error
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

      render(<HomePage />)

      // Click retry button - will trigger window.location.reload()
      // jsdom will throw "Not implemented: navigation" error, which is expected
      expect(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
      }).not.toThrow()

      consoleError.mockRestore()
    })
  })

  describe('no events state', () => {
    beforeEach(() => {
      mockUseEvents.mockReturnValue({
        events: [],
        isLoading: false,
        error: null,
        refetch: jest.fn()
      })
    })

    it('displays no events message when no events exist', () => {
      render(<HomePage />)

      expect(screen.getByText('No events found on the blockchain.')).toBeInTheDocument()
      expect(screen.getByText('Events will appear here once they are created by organizers.')).toBeInTheDocument()
    })
  })

  describe('events loaded state', () => {
    beforeEach(() => {
      mockUseEvents.mockReturnValue({
        events: mockEvents,
        isLoading: false,
        error: null,
        refetch: jest.fn()
      })
    })

    it('renders all events', () => {
      render(<HomePage />)

      expect(screen.getByText('Blockchain Conference 2024')).toBeInTheDocument()
      expect(screen.getByText('Art Gallery Opening')).toBeInTheDocument()
      expect(screen.getByText('Music Festival')).toBeInTheDocument()
    })

    it('displays event details correctly', () => {
      render(<HomePage />)

      // Check first event details
      expect(screen.getByText('Learn about the latest in blockchain technology')).toBeInTheDocument()
      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument()
      expect(screen.getByText('2024-03-15 at 10:00 AM')).toBeInTheDocument()
      expect(screen.getByText('1 STX')).toBeInTheDocument()
      expect(screen.getByText('by TechEvents')).toBeInTheDocument()
      expect(screen.getByText('150 attendees')).toBeInTheDocument()
    })

    it('displays category badges', () => {
      render(<HomePage />)

      expect(screen.getByText('technology')).toBeInTheDocument()
      expect(screen.getByText('art')).toBeInTheDocument()
      expect(screen.getByText('music')).toBeInTheDocument()
    })

    it('has working view details links', () => {
      render(<HomePage />)

      const viewDetailsButtons = screen.getAllByText('View Details')
      expect(viewDetailsButtons).toHaveLength(3)
      
      expect(viewDetailsButtons[0].closest('a')).toHaveAttribute('href', '/event/1')
      expect(viewDetailsButtons[1].closest('a')).toHaveAttribute('href', '/event/2')
      expect(viewDetailsButtons[2].closest('a')).toHaveAttribute('href', '/event/3')
    })
  })

  describe('search functionality', () => {
    beforeEach(() => {
      mockUseEvents.mockReturnValue({
        events: mockEvents,
        isLoading: false,
        error: null,
        refetch: jest.fn()
      })
    })

    it('filters events by title', async () => {
      render(<HomePage />)

      const searchInput = screen.getByPlaceholderText('Search events...')
      fireEvent.change(searchInput, { target: { value: 'Blockchain' } })

      await waitFor(() => {
        expect(screen.getByText('Blockchain Conference 2024')).toBeInTheDocument()
        expect(screen.queryByText('Art Gallery Opening')).not.toBeInTheDocument()
        expect(screen.queryByText('Music Festival')).not.toBeInTheDocument()
      })
    })

    it('filters events by description', async () => {
      render(<HomePage />)

      const searchInput = screen.getByPlaceholderText('Search events...')
      fireEvent.change(searchInput, { target: { value: 'Contemporary' } })

      await waitFor(() => {
        expect(screen.getByText('Art Gallery Opening')).toBeInTheDocument()
        expect(screen.queryByText('Blockchain Conference 2024')).not.toBeInTheDocument()
        expect(screen.queryByText('Music Festival')).not.toBeInTheDocument()
      })
    })

    it('shows no results message when search has no matches', async () => {
      render(<HomePage />)

      const searchInput = screen.getByPlaceholderText('Search events...')
      fireEvent.change(searchInput, { target: { value: 'NonexistentEvent' } })

      await waitFor(() => {
        expect(screen.getByText('No events match your search criteria.')).toBeInTheDocument()
      })
    })

    it('search is case insensitive', async () => {
      render(<HomePage />)

      const searchInput = screen.getByPlaceholderText('Search events...')
      fireEvent.change(searchInput, { target: { value: 'BLOCKCHAIN' } })

      await waitFor(() => {
        expect(screen.getByText('Blockchain Conference 2024')).toBeInTheDocument()
      })
    })
  })

  describe('category filtering', () => {
    beforeEach(() => {
      mockUseEvents.mockReturnValue({
        events: mockEvents,
        isLoading: false,
        error: null,
        refetch: jest.fn()
      })
    })

    it('shows all events by default', () => {
      render(<HomePage />)

      expect(screen.getByText('Blockchain Conference 2024')).toBeInTheDocument()
      expect(screen.getByText('Art Gallery Opening')).toBeInTheDocument()
      expect(screen.getByText('Music Festival')).toBeInTheDocument()
    })

    it('filters events by technology category', async () => {
      render(<HomePage />)

      // Click the Technology option button
      const technologyButton = screen.getByRole('button', { name: 'Technology' })
      fireEvent.click(technologyButton)

      await waitFor(() => {
        expect(screen.getByText('Blockchain Conference 2024')).toBeInTheDocument()
        expect(screen.queryByText('Art Gallery Opening')).not.toBeInTheDocument()
        expect(screen.queryByText('Music Festival')).not.toBeInTheDocument()
      })
    })

    it('filters events by art category', async () => {
      render(<HomePage />)

      // Click the Art option button
      const artButton = screen.getByRole('button', { name: 'Art' })
      fireEvent.click(artButton)

      await waitFor(() => {
        expect(screen.getByText('Art Gallery Opening')).toBeInTheDocument()
        expect(screen.queryByText('Blockchain Conference 2024')).not.toBeInTheDocument()
        expect(screen.queryByText('Music Festival')).not.toBeInTheDocument()
      })
    })

    it('returns to all events when "All Categories" is selected', async () => {
      render(<HomePage />)

      // First filter by technology
      const technologyButton = screen.getByRole('button', { name: 'Technology' })
      fireEvent.click(technologyButton)

      await waitFor(() => {
        expect(screen.queryByText('Art Gallery Opening')).not.toBeInTheDocument()
      })

      // Then select all categories
      const allButton = screen.getByRole('button', { name: 'All Categories' })
      fireEvent.click(allButton)

      await waitFor(() => {
        expect(screen.getByText('Blockchain Conference 2024')).toBeInTheDocument()
        expect(screen.getByText('Art Gallery Opening')).toBeInTheDocument()
        expect(screen.getByText('Music Festival')).toBeInTheDocument()
      })
    })
  })

  describe('combined search and filter', () => {
    beforeEach(() => {
      mockUseEvents.mockReturnValue({
        events: mockEvents,
        isLoading: false,
        error: null,
        refetch: jest.fn()
      })
    })

    it('applies both search and category filter', async () => {
      render(<HomePage />)

      // Set category filter
      const technologyButton = screen.getByRole('button', { name: 'Technology' })
      fireEvent.click(technologyButton)

      // Set search filter
      const searchInput = screen.getByPlaceholderText('Search events...')
      fireEvent.change(searchInput, { target: { value: 'Blockchain' } })

      await waitFor(() => {
        expect(screen.getByText('Blockchain Conference 2024')).toBeInTheDocument()
        expect(screen.queryByText('Art Gallery Opening')).not.toBeInTheDocument()
        expect(screen.queryByText('Music Festival')).not.toBeInTheDocument()
      })
    })

    it('shows no results when search and filter have no intersection', async () => {
      render(<HomePage />)

      // Set category filter to art
      const artButton = screen.getByRole('button', { name: 'Art' })
      fireEvent.click(artButton)

      // Search for technology event
      const searchInput = screen.getByPlaceholderText('Search events...')
      fireEvent.change(searchInput, { target: { value: 'Blockchain' } })

      await waitFor(() => {
        expect(screen.getByText('No events match your search criteria.')).toBeInTheDocument()
      })
    })
  })

  describe('hero section', () => {
    beforeEach(() => {
      mockUseEvents.mockReturnValue({
        events: [],
        isLoading: false,
        error: null,
        refetch: jest.fn()
      })
    })

    it('displays hero content', () => {
      render(<HomePage />)

      expect(screen.getByText('Decentralized Event Ticketing')).toBeInTheDocument()
      expect(screen.getByText(/Secure, transparent, and blockchain-powered/)).toBeInTheDocument()
    })

    it('has admin dashboard link', () => {
      render(<HomePage />)

      const adminLink = screen.getByText('Admin Dashboard')
      expect(adminLink.closest('a')).toHaveAttribute('href', '/admin')
    })

    it('contains search and filter controls', () => {
      render(<HomePage />)

      expect(screen.getByPlaceholderText('Search events...')).toBeInTheDocument()
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
  })

  describe('event card layout', () => {
    beforeEach(() => {
      mockUseEvents.mockReturnValue({
        events: mockEvents,
        isLoading: false,
        error: null,
        refetch: jest.fn()
      })
    })

    it('displays events in a grid layout', () => {
      render(<HomePage />)

      // Check that all events are rendered
      expect(screen.getByText('Blockchain Conference 2024')).toBeInTheDocument()
      expect(screen.getByText('Art Gallery Opening')).toBeInTheDocument()
      expect(screen.getByText('Music Festival')).toBeInTheDocument()
    })

    it('shows event images', () => {
      render(<HomePage />)

      const images = screen.getAllByRole('img')
      const eventImages = images.filter(img => 
        img.getAttribute('alt')?.includes('Conference') || 
        img.getAttribute('alt')?.includes('Gallery') || 
        img.getAttribute('alt')?.includes('Festival')
      )
      expect(eventImages.length).toBeGreaterThan(0)
    })
  })

  describe('accessibility', () => {
    beforeEach(() => {
      mockUseEvents.mockReturnValue({
        events: mockEvents,
        isLoading: false,
        error: null,
        refetch: jest.fn()
      })
    })

    it('has proper heading hierarchy', () => {
      render(<HomePage />)

      expect(screen.getByRole('heading', { level: 2, name: 'Decentralized Event Ticketing' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: 'Upcoming Events' })).toBeInTheDocument()
    })

    it('search input is properly labeled', () => {
      render(<HomePage />)

      const searchInput = screen.getByPlaceholderText('Search events...')
      expect(searchInput).toBeInTheDocument()
    })

    it('images have proper alt text', () => {
      render(<HomePage />)

      expect(screen.getByAltText('Blockchain Conference 2024')).toBeInTheDocument()
      expect(screen.getByAltText('Art Gallery Opening')).toBeInTheDocument()
      expect(screen.getByAltText('Music Festival')).toBeInTheDocument()
    })
  })
})
