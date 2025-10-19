import React from 'react'
import { render, screen, waitFor } from '../../../../__tests__/utils/test-utils'
import OrganizerDashboard from '../page'
import { useStacks } from '@/hooks/useStacks'

// Mock hooks
jest.mock('@/hooks/useStacks')
const mockUseStacks = useStacks as jest.MockedFunction<typeof useStacks>

// Mock stacks-utils with proper mocking
const mockReadOrganizerEvents = jest.fn()
const mockReadPlatformStats = jest.fn()
const mockReadRecentActivities = jest.fn()

jest.mock('@/lib/stacks-utils', () => ({
  readOrganizerEvents: (...args: any[]) => mockReadOrganizerEvents(...args),
  readPlatformStats: (...args: any[]) => mockReadPlatformStats(...args),
  readRecentActivities: (...args: any[]) => mockReadRecentActivities(...args),
}))

// Mock Next.js Link
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>
  }
})

// Mock console.error to avoid test noise
const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn()
})
afterAll(() => {
  console.error = originalConsoleError
})

const mockEvents = [
  {
    id: 1,
    result: {
      name: 'Blockchain Conference 2024',
      'tickets-sold': 150,
      'total-tickets': 200,
      price: 1000000 // 1 STX in micro-STX
    }
  },
  {
    id: 2,
    result: {
      name: 'Art Gallery Opening',
      'tickets-sold': 75,
      'total-tickets': 100,
      price: 500000 // 0.5 STX in micro-STX
    }
  },
  {
    id: 3,
    result: {
      name: 'Music Festival',
      'tickets-sold': 0,
      'total-tickets': 1000,
      price: 2000000 // 2 STX in micro-STX
    }
  }
]

const mockActivities = [
  {
    message: 'New event "Tech Meetup" created',
    time: '2 hours ago',
    color: 'bg-green-500'
  },
  {
    message: 'Ticket purchased for "Blockchain Conference"',
    time: '4 hours ago',
    color: 'bg-blue-500'
  },
  {
    message: 'Event "Art Gallery" sold out',
    time: '1 day ago',
    color: 'bg-orange-500'
  }
]

describe('OrganizerDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockReadOrganizerEvents.mockResolvedValue([])
    mockReadPlatformStats.mockResolvedValue({})
    mockReadRecentActivities.mockResolvedValue([])
  })

  describe('when user is not signed in', () => {
    beforeEach(() => {
      mockUseStacks.mockReturnValue({
        userData: null,
        isSignedIn: false,
        address: null
      })
    })

    it('shows connect wallet message', () => {
      render(<OrganizerDashboard />)

      expect(screen.getByText('Connect Wallet')).toBeInTheDocument()
      expect(screen.getByText('Please connect your wallet to access the organizer dashboard')).toBeInTheDocument()
    })

    it('does not show dashboard content', () => {
      render(<OrganizerDashboard />)

      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
      expect(screen.queryByText('Welcome back! Here\'s your event overview.')).not.toBeInTheDocument()
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

    describe('dashboard header', () => {
      it('displays dashboard title and description', () => {
        render(<OrganizerDashboard />)

        expect(screen.getByText('Dashboard')).toBeInTheDocument()
        expect(screen.getByText('Welcome back! Here\'s your event overview.')).toBeInTheDocument()
      })

      it('shows create event button', () => {
        render(<OrganizerDashboard />)

        const createButton = screen.getByRole('link', { name: /create event/i })
        expect(createButton).toHaveAttribute('href', '/organizer/create')
      })
    })

    describe('loading state', () => {
      it('shows loading skeletons for recent events', async () => {
        mockReadOrganizerEvents.mockImplementation(() => new Promise(() => {})) // Never resolves

        render(<OrganizerDashboard />)

        // Wait for the loading state to appear
        await waitFor(() => {
          const skeletonElements = document.querySelectorAll('.animate-pulse')
          expect(skeletonElements.length).toBeGreaterThan(0)
        })
      })
    })

    describe('stats calculation and display', () => {
      beforeEach(() => {
        mockReadOrganizerEvents.mockResolvedValue(mockEvents)
        mockReadRecentActivities.mockResolvedValue(mockActivities)
      })

      it('calculates and displays correct stats', async () => {
        render(<OrganizerDashboard />)

        await waitFor(() => {
          // Active Events: 2 (events with tickets sold > 0)
          expect(screen.getByText('2 active')).toBeInTheDocument()

          // Total Tickets Sold: 150 + 75 + 0 = 225
          expect(screen.getByText('225')).toBeInTheDocument()

          // Total Revenue: (150 * 1) + (75 * 0.5) + (0 * 2) = 187.5 STX
          expect(screen.getByText('187.50 STX')).toBeInTheDocument()

          // Average per Event: 187.5 / 3 = 62.50 STX
          expect(screen.getByText('62.50 STX')).toBeInTheDocument()
        })
      })

      it('displays correct stat card titles and descriptions', () => {
        render(<OrganizerDashboard />)

        expect(screen.getByText('Total Events')).toBeInTheDocument()
        expect(screen.getByText('Tickets Sold')).toBeInTheDocument()
        expect(screen.getByText('across all events')).toBeInTheDocument()
        expect(screen.getByText('Total Revenue')).toBeInTheDocument()
        expect(screen.getByText('lifetime earnings')).toBeInTheDocument()
        expect(screen.getByText('Avg per Event')).toBeInTheDocument()
        expect(screen.getByText('average revenue')).toBeInTheDocument()
      })

      it('shows stat icons', () => {
        render(<OrganizerDashboard />)

        // Check that icons are present (they would be SVG elements)
        const icons = document.querySelectorAll('svg')
        expect(icons.length).toBeGreaterThan(0)
      })
    })

    describe('recent events section', () => {
      beforeEach(() => {
        mockReadOrganizerEvents.mockResolvedValue(mockEvents)
        mockReadRecentActivities.mockResolvedValue(mockActivities)
      })

      it('displays recent events with correct information', async () => {
        render(<OrganizerDashboard />)

        await waitFor(() => {
          expect(screen.getByText('Recent Events')).toBeInTheDocument()
          expect(screen.getByText('Your latest events and their performance')).toBeInTheDocument()
          
          expect(screen.getByText('Blockchain Conference 2024')).toBeInTheDocument()
          expect(screen.getByText('150/200 tickets sold')).toBeInTheDocument()
          
          expect(screen.getByText('Art Gallery Opening')).toBeInTheDocument()
          expect(screen.getByText('75/100 tickets sold')).toBeInTheDocument()
          
          expect(screen.getByText('Music Festival')).toBeInTheDocument()
          expect(screen.getByText('0/1000 tickets sold')).toBeInTheDocument()
        })
      })

      it('shows view buttons for each event', async () => {
        render(<OrganizerDashboard />)

        await waitFor(() => {
          const viewButtons = screen.getAllByRole('link').filter(link => 
            link.getAttribute('href')?.includes('/organizer/events/')
          )
          expect(viewButtons).toHaveLength(3)
          
          expect(viewButtons[0]).toHaveAttribute('href', '/organizer/events/1')
          expect(viewButtons[1]).toHaveAttribute('href', '/organizer/events/2')
          expect(viewButtons[2]).toHaveAttribute('href', '/organizer/events/3')
        })
      })

      it('shows "no events" state when organizer has no events', async () => {
        mockReadOrganizerEvents.mockResolvedValue([])
        
        render(<OrganizerDashboard />)

        await waitFor(() => {
          expect(screen.getByText('No events yet')).toBeInTheDocument()
          expect(screen.getByRole('link', { name: 'Create Your First Event' })).toBeInTheDocument()
        })
      })
    })

    describe('recent activities section', () => {
      beforeEach(() => {
        mockReadOrganizerEvents.mockResolvedValue([])
        mockReadRecentActivities.mockResolvedValue(mockActivities)
      })

      it('displays recent activities', async () => {
        render(<OrganizerDashboard />)

        await waitFor(() => {
          expect(screen.getByText('Recent Activities')).toBeInTheDocument()
          expect(screen.getByText('Platform-wide event activities')).toBeInTheDocument()
          
          expect(screen.getByText('New event "Tech Meetup" created')).toBeInTheDocument()
          expect(screen.getByText('2 hours ago')).toBeInTheDocument()
          
          expect(screen.getByText('Ticket purchased for "Blockchain Conference"')).toBeInTheDocument()
          expect(screen.getByText('4 hours ago')).toBeInTheDocument()
          
          expect(screen.getByText('Event "Art Gallery" sold out')).toBeInTheDocument()
          expect(screen.getByText('1 day ago')).toBeInTheDocument()
        })
      })

      it('shows "no activities" state when there are no activities', async () => {
        mockReadRecentActivities.mockResolvedValue([])
        
        render(<OrganizerDashboard />)

        await waitFor(() => {
          expect(screen.getByText('No recent activities')).toBeInTheDocument()
        })
      })

      it('limits activities to 5 items', async () => {
        const manyActivities = Array.from({ length: 10 }, (_, i) => ({
          message: `Activity ${i + 1}`,
          time: `${i + 1} hours ago`,
          color: 'bg-blue-500'
        }))
        
        mockReadRecentActivities.mockResolvedValue(manyActivities)
        
        render(<OrganizerDashboard />)

        await waitFor(() => {
          // Should only show first 5 activities
          expect(screen.getByText('Activity 1')).toBeInTheDocument()
          expect(screen.getByText('Activity 5')).toBeInTheDocument()
          expect(screen.queryByText('Activity 6')).not.toBeInTheDocument()
        })
      })
    })

    describe('error handling', () => {
      it('handles error when loading dashboard data', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        mockReadOrganizerEvents.mockRejectedValue(new Error('Failed to load events'))
        
        render(<OrganizerDashboard />)

        await waitFor(() => {
          expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading dashboard data:', expect.any(Error))
        })
        
        consoleErrorSpy.mockRestore()
      })

      it('handles missing event data gracefully', async () => {
        const eventsWithMissingData = [
          { id: 1, result: null },
          { id: 2, result: { name: 'Valid Event' } }
        ]
        
        mockReadOrganizerEvents.mockResolvedValue(eventsWithMissingData)
        
        render(<OrganizerDashboard />)

        await waitFor(() => {
          // Should handle missing data without crashing
          expect(screen.getByText('Event 1')).toBeInTheDocument() // Fallback name
          expect(screen.getByText('Valid Event')).toBeInTheDocument()
        })
      })
    })

    describe('edge cases', () => {
      it('calculates average correctly when no events exist', async () => {
        mockReadOrganizerEvents.mockResolvedValue([])
        
        render(<OrganizerDashboard />)

        await waitFor(() => {
          // Average should be 0.00 when no events
          expect(screen.getByText('0.00 STX')).toBeInTheDocument()
        })
      })

      it('handles events with zero prices', async () => {
        const freeEvents = [{
          id: 1,
          result: {
            name: 'Free Event',
            'tickets-sold': 100,
            'total-tickets': 100,
            price: 0
          }
        }]
        
        mockReadOrganizerEvents.mockResolvedValue(freeEvents)
        
        render(<OrganizerDashboard />)

        await waitFor(() => {
          expect(screen.getByText('100')).toBeInTheDocument() // Tickets sold
          expect(screen.getByText('0.00 STX')).toBeInTheDocument() // Revenue
        })
      })
    })

    describe('responsive layout', () => {
      it('has responsive grid classes', () => {
        render(<OrganizerDashboard />)

        // Stats grid should be responsive
        const statsGrid = document.querySelector('.grid.gap-4.md\:grid-cols-2.lg\:grid-cols-4')
        expect(statsGrid).toBeInTheDocument()
        
        // Content grid should be responsive
        const contentGrid = document.querySelector('.grid.gap-6.md\:grid-cols-2')
        expect(contentGrid).toBeInTheDocument()
      })
    })

    describe('accessibility', () => {
      beforeEach(() => {
        mockReadOrganizerEvents.mockResolvedValue(mockEvents)
        mockReadRecentActivities.mockResolvedValue(mockActivities)
      })

      it('has proper heading hierarchy', () => {
        render(<OrganizerDashboard />)

        expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument()
      })

      it('has accessible button labels', () => {
        render(<OrganizerDashboard />)

        expect(screen.getByRole('link', { name: /create event/i })).toBeInTheDocument()
      })

      it('provides clear section descriptions', () => {
        render(<OrganizerDashboard />)

        expect(screen.getByText('Your latest events and their performance')).toBeInTheDocument()
        expect(screen.getByText('Platform-wide event activities')).toBeInTheDocument()
      })
    })
  })
})
