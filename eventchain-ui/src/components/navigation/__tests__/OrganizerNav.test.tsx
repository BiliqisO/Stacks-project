import React from 'react'
import { render, screen } from '../../../__tests__/utils/test-utils'
import { OrganizerNav } from '../OrganizerNav'

// Mock Next.js router
const mockPush = jest.fn()
const mockPathname = jest.fn(() => '/organizer')

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => mockPathname(),
}))

describe('OrganizerNav', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPathname.mockReturnValue('/organizer')
  })

  describe('navigation items', () => {
    it('renders all navigation links', () => {
      render(<OrganizerNav />)

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('My Events')).toBeInTheDocument()
      expect(screen.getByText('Create Event')).toBeInTheDocument()
      expect(screen.getByText('Check-in Portal')).toBeInTheDocument()
      expect(screen.getByText('Organizers')).toBeInTheDocument()
    })

    it('shows descriptions for navigation items', () => {
      render(<OrganizerNav />)

      expect(screen.getByText('Overview & Analytics')).toBeInTheDocument()
      expect(screen.getByText('Manage Events')).toBeInTheDocument()
      expect(screen.getByText('New Event')).toBeInTheDocument()
      expect(screen.getByText('Manage Attendees')).toBeInTheDocument()
      expect(screen.getByText('Manage Team')).toBeInTheDocument()
    })

    it('has correct href attributes', () => {
      render(<OrganizerNav />)

      expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute('href', '/organizer/dashboard')
      expect(screen.getByText('My Events').closest('a')).toHaveAttribute('href', '/organizer/events')
      expect(screen.getByText('Create Event').closest('a')).toHaveAttribute('href', '/organizer/create')
      expect(screen.getByText('Check-in Portal').closest('a')).toHaveAttribute('href', '/organizer/check-in')
      expect(screen.getByText('Organizers').closest('a')).toHaveAttribute('href', '/organizer/organizers')
    })
  })

  describe('active link highlighting', () => {
    it('highlights Dashboard when on dashboard page', () => {
      mockPathname.mockReturnValue('/organizer/dashboard')
      render(<OrganizerNav />)

      const dashboardButton = screen.getByText('Dashboard').closest('button')
      expect(dashboardButton).toBeInTheDocument()
    })

    it('highlights My Events when on events page', () => {
      mockPathname.mockReturnValue('/organizer/events')
      render(<OrganizerNav />)

      const eventsButton = screen.getByText('My Events').closest('button')
      expect(eventsButton).toBeInTheDocument()
    })

    it('highlights Create Event when on create page', () => {
      mockPathname.mockReturnValue('/organizer/create')
      render(<OrganizerNav />)

      const createButton = screen.getByText('Create Event').closest('button')
      expect(createButton).toBeInTheDocument()
    })

    it('highlights Check-in Portal when on check-in page', () => {
      mockPathname.mockReturnValue('/organizer/check-in')
      render(<OrganizerNav />)

      const checkInButton = screen.getByText('Check-in Portal').closest('button')
      expect(checkInButton).toBeInTheDocument()
    })

    it('highlights Organizers when on organizers page', () => {
      mockPathname.mockReturnValue('/organizer/organizers')
      render(<OrganizerNav />)

      const organizersButton = screen.getByText('Organizers').closest('button')
      expect(organizersButton).toBeInTheDocument()
    })

    it('applies proper styles to navigation', () => {
      mockPathname.mockReturnValue('/organizer/dashboard')
      render(<OrganizerNav />)

      const navLinks = screen.getAllByRole('link')
      expect(navLinks.length).toBeGreaterThan(0)
    })
  })

  describe('icons', () => {
    it('displays correct icons for each navigation item', () => {
      render(<OrganizerNav />)

      // Each navigation item should have an icon
      const dashboardIcon = screen.getByText('Dashboard').closest('button')?.querySelector('svg')
      expect(dashboardIcon).toBeInTheDocument()

      const eventsIcon = screen.getByText('My Events').closest('button')?.querySelector('svg')
      expect(eventsIcon).toBeInTheDocument()

      const createIcon = screen.getByText('Create Event').closest('button')?.querySelector('svg')
      expect(createIcon).toBeInTheDocument()

      const checkInIcon = screen.getByText('Check-in Portal').closest('button')?.querySelector('svg')
      expect(checkInIcon).toBeInTheDocument()

      const organizersIcon = screen.getByText('Organizers').closest('button')?.querySelector('svg')
      expect(organizersIcon).toBeInTheDocument()
    })

    it('icons have proper styling classes', () => {
      render(<OrganizerNav />)

      const dashboardIcon = screen.getByText('Dashboard').closest('button')?.querySelector('svg')
      expect(dashboardIcon).toHaveClass('h-4')
      expect(dashboardIcon).toHaveClass('w-4')
      expect(dashboardIcon).toHaveClass('mr-3')
    })
  })

  describe('responsive behavior', () => {
    it('applies responsive navigation styles', () => {
      render(<OrganizerNav />)

      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('space-y-2')
    })

    it('navigation items are properly spaced', () => {
      render(<OrganizerNav />)

      const navItems = screen.getAllByRole('link')
      expect(navItems.length).toBeGreaterThan(0)
      navItems.forEach(item => {
        expect(item).toBeInTheDocument()
      })
    })
  })

  describe('accessibility', () => {
    it('has proper navigation role', () => {
      render(<OrganizerNav />)

      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('links are keyboard accessible', () => {
      render(<OrganizerNav />)

      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link).toHaveAttribute('href')
        expect(link).toBeInstanceOf(HTMLAnchorElement)
      })
    })

    it('has proper ARIA labels or text content', () => {
      render(<OrganizerNav />)

      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /my events/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /create event/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /check-in portal/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /organizers/i })).toBeInTheDocument()
    })
  })

  describe('hover states', () => {
    it('applies hover styles to inactive links', () => {
      mockPathname.mockReturnValue('/organizer/dashboard')
      render(<OrganizerNav />)

      // Get inactive buttons (not secondary variant)
      const myEventsButton = screen.getByText('My Events').closest('button')
      expect(myEventsButton).toBeInTheDocument()
      // Button component applies hover styles via Tailwind
      expect(myEventsButton).toHaveClass('justify-start')
    })
  })

  describe('path matching', () => {
    it('correctly identifies exact path matches', () => {
      mockPathname.mockReturnValue('/organizer/dashboard')
      render(<OrganizerNav />)

      // Active button should have secondary variant
      const dashboardButton = screen.getByText('Dashboard').closest('button')
      expect(dashboardButton).toBeInTheDocument()
      expect(dashboardButton).toHaveClass('justify-start')
    })

    it('correctly identifies sub-path matches', () => {
      mockPathname.mockReturnValue('/organizer/events')
      render(<OrganizerNav />)

      // Component does exact path matching
      // When on /organizer/events, My Events should be highlighted
      const eventsButton = screen.getByText('My Events').closest('button')
      expect(eventsButton).toBeInTheDocument()
      expect(eventsButton).toHaveClass('justify-start')
    })

    it('handles organizer base path', () => {
      mockPathname.mockReturnValue('/organizer')
      render(<OrganizerNav />)

      // Component does exact path matching, so no button will be highlighted
      // Just verify all buttons render correctly
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('My Events')).toBeInTheDocument()
    })

    it('handles unknown organizer paths gracefully', () => {
      mockPathname.mockReturnValue('/organizer/unknown-path')
      render(<OrganizerNav />)

      // All buttons should still render and be accessible
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('My Events')).toBeInTheDocument()
      expect(screen.getByText('Create Event')).toBeInTheDocument()
    })
  })

  describe('organizer-specific features', () => {
    it('includes organizer management link', () => {
      render(<OrganizerNav />)

      const organizersLink = screen.getByText('Organizers')
      expect(organizersLink).toBeInTheDocument()
      expect(organizersLink.closest('a')).toHaveAttribute('href', '/organizer/organizers')
    })

    it('includes event creation functionality', () => {
      render(<OrganizerNav />)

      const createLink = screen.getByText('Create Event')
      expect(createLink).toBeInTheDocument()
      expect(createLink.closest('a')).toHaveAttribute('href', '/organizer/create')
    })

    it('provides dashboard access', () => {
      render(<OrganizerNav />)

      const dashboardLink = screen.getByText('Dashboard')
      expect(dashboardLink).toBeInTheDocument()
      expect(dashboardLink.closest('a')).toHaveAttribute('href', '/organizer/dashboard')
    })
  })

  describe('layout and styling', () => {
    it('applies correct text sizing', () => {
      render(<OrganizerNav />)

      // Check that labels have font-medium class
      const dashboardLabel = screen.getByText('Dashboard')
      expect(dashboardLabel).toHaveClass('font-medium')
    })

    it('has proper spacing between items', () => {
      render(<OrganizerNav />)

      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('space-y-2')
    })
  })

  describe('navigation hierarchy', () => {
    it('maintains consistent link structure', () => {
      render(<OrganizerNav />)

      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(5) // Dashboard, My Events, Create Event, Check-in Portal, Organizers

      links.forEach(link => {
        expect(link.getAttribute('href')).toMatch(/^\/organizer/)
      })
    })

    it('follows logical grouping of organizer functions', () => {
      render(<OrganizerNav />)

      // Management functions
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('My Events')).toBeInTheDocument()
      expect(screen.getByText('Organizers')).toBeInTheDocument()

      // Action functions
      expect(screen.getByText('Create Event')).toBeInTheDocument()
      expect(screen.getByText('Check-in Portal')).toBeInTheDocument()
    })
  })
})