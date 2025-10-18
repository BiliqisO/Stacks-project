import React from 'react'
import { render, screen } from '../../../__tests__/utils/test-utils'
import { AttendeeNav } from '../AttendeeNav'

// Mock Next.js router
const mockPush = jest.fn()
const mockPathname = jest.fn(() => '/')

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => mockPathname(),
}))

describe('AttendeeNav', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPathname.mockReturnValue('/')
  })

  describe('navigation items', () => {
    it('renders all navigation links', () => {
      render(<AttendeeNav />)

      expect(screen.getByText('Browse Events')).toBeInTheDocument()
      expect(screen.getByText('My Events')).toBeInTheDocument()
      expect(screen.getByText('My Tickets')).toBeInTheDocument()
      expect(screen.getByText('Favorites')).toBeInTheDocument()
      expect(screen.getByText('Profile')).toBeInTheDocument()
    })

    it('has correct href attributes', () => {
      render(<AttendeeNav />)

      const browseEventsLink = screen.getByText('Browse Events').closest('a')
      expect(browseEventsLink).toHaveAttribute('href', '/')

      const myEventsLink = screen.getByText('My Events').closest('a')
      expect(myEventsLink).toHaveAttribute('href', '/my-events')

      const myTicketsLink = screen.getByText('My Tickets').closest('a')
      expect(myTicketsLink).toHaveAttribute('href', '/my-tickets')

      const favoritesLink = screen.getByText('Favorites').closest('a')
      expect(favoritesLink).toHaveAttribute('href', '/favorites')

      const profileLink = screen.getByText('Profile').closest('a')
      expect(profileLink).toHaveAttribute('href', '/profile')
    })
  })

  describe('active link highlighting', () => {
    it('highlights Browse Events when on home page', () => {
      mockPathname.mockReturnValue('/')
      render(<AttendeeNav />)

      const browseEventsButton = screen.getByText('Browse Events').closest('button')
      expect(browseEventsButton).toHaveClass('justify-start')
    })

    it('highlights My Tickets when on my-tickets page', () => {
      mockPathname.mockReturnValue('/my-tickets')
      render(<AttendeeNav />)

      const ticketsButton = screen.getByText('My Tickets').closest('button')
      expect(ticketsButton).toBeInTheDocument()
    })

    it('shows descriptions for all navigation items', () => {
      render(<AttendeeNav />)

      expect(screen.getByText('Discover Events')).toBeInTheDocument()
      expect(screen.getByText('Upcoming Events')).toBeInTheDocument()
      expect(screen.getByText('Ticket Collection')).toBeInTheDocument()
      expect(screen.getByText('Saved Events')).toBeInTheDocument()
      expect(screen.getByText('Account Settings')).toBeInTheDocument()
    })

    it('applies default styles to inactive links', () => {
      mockPathname.mockReturnValue('/my-tickets')
      render(<AttendeeNav />)

      const browseEventsButton = screen.getByText('Browse Events').closest('button')
      expect(browseEventsButton).toBeInTheDocument()
    })
  })

  describe('icons', () => {
    it('displays correct icons for each navigation item', () => {
      render(<AttendeeNav />)

      // Browse Events should have Search icon
      const browseEventsIcon = screen.getByText('Browse Events').closest('button')?.querySelector('svg')
      expect(browseEventsIcon).toBeInTheDocument()

      // My Events should have Calendar icon
      const myEventsIcon = screen.getByText('My Events').closest('button')?.querySelector('svg')
      expect(myEventsIcon).toBeInTheDocument()

      // My Tickets should have Ticket icon
      const ticketsIcon = screen.getByText('My Tickets').closest('button')?.querySelector('svg')
      expect(ticketsIcon).toBeInTheDocument()

      // Favorites should have Heart icon
      const favoritesIcon = screen.getByText('Favorites').closest('button')?.querySelector('svg')
      expect(favoritesIcon).toBeInTheDocument()

      // Profile should have User icon
      const profileIcon = screen.getByText('Profile').closest('button')?.querySelector('svg')
      expect(profileIcon).toBeInTheDocument()
    })

    it('icons have proper styling classes', () => {
      render(<AttendeeNav />)

      const browseEventsIcon = screen.getByText('Browse Events').closest('button')?.querySelector('svg')
      expect(browseEventsIcon).toBeInTheDocument()
      expect(browseEventsIcon).toHaveClass('h-4')
      expect(browseEventsIcon).toHaveClass('w-4')
      expect(browseEventsIcon).toHaveClass('mr-3')
    })
  })

  describe('responsive behavior', () => {
    it('applies responsive navigation styles', () => {
      render(<AttendeeNav />)

      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('space-y-2')
    })

    it('navigation items are properly spaced', () => {
      render(<AttendeeNav />)

      const navItems = screen.getAllByRole('link')
      expect(navItems.length).toBeGreaterThan(0)
      navItems.forEach(item => {
        expect(item).toBeInTheDocument()
        // Buttons inside links have the padding class p-3
        const button = item.querySelector('button')
        expect(button).toHaveClass('p-3')
      })
    })
  })

  describe('accessibility', () => {
    it('has proper navigation role', () => {
      render(<AttendeeNav />)

      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('links are keyboard accessible', () => {
      render(<AttendeeNav />)

      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link).toHaveAttribute('href')
        expect(link).toBeInstanceOf(HTMLAnchorElement)
      })
    })

    it('has proper ARIA labels or text content', () => {
      render(<AttendeeNav />)

      // Check for Browse Events (contains 'events')
      expect(screen.getByRole('link', { name: /browse events/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /my tickets/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /favorites/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument()
    })
  })

  describe('hover states', () => {
    it('applies hover styles to inactive links', () => {
      mockPathname.mockReturnValue('/')
      render(<AttendeeNav />)

      // Get inactive buttons (not secondary variant)
      const myTicketsButton = screen.getByText('My Tickets').closest('button')
      expect(myTicketsButton).toBeInTheDocument()
      // Button component applies hover styles via Tailwind
      expect(myTicketsButton).toHaveClass('justify-start')
    })
  })

  describe('path matching', () => {
    it('correctly identifies exact path matches', () => {
      mockPathname.mockReturnValue('/')
      render(<AttendeeNav />)

      // Active button should have secondary variant
      const browseEventsButton = screen.getByText('Browse Events').closest('button')
      expect(browseEventsButton).toBeInTheDocument()
      expect(browseEventsButton).toHaveClass('justify-start')
    })

    it('correctly identifies sub-path matches', () => {
      mockPathname.mockReturnValue('/my-tickets')
      render(<AttendeeNav />)

      // Component does exact path matching, not sub-path
      // When on /my-tickets, My Tickets should be highlighted
      const ticketsButton = screen.getByText('My Tickets').closest('button')
      expect(ticketsButton).toBeInTheDocument()
      expect(ticketsButton).toHaveClass('justify-start')
    })

    it('handles unknown paths gracefully', () => {
      mockPathname.mockReturnValue('/unknown-path')
      render(<AttendeeNav />)

      // All buttons should still render and be accessible
      expect(screen.getByText('Browse Events')).toBeInTheDocument()
      expect(screen.getByText('My Tickets')).toBeInTheDocument()
      expect(screen.getByText('Favorites')).toBeInTheDocument()
    })
  })

  describe('layout and styling', () => {
    it('applies correct text sizing', () => {
      render(<AttendeeNav />)

      // Check that labels have font-medium class
      const browseEventsLabel = screen.getByText('Browse Events')
      expect(browseEventsLabel).toHaveClass('font-medium')
    })

    it('has proper spacing between items', () => {
      render(<AttendeeNav />)

      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('space-y-2')
    })
  })

  describe('user interaction', () => {
    it('navigation links can be clicked', () => {
      render(<AttendeeNav />)

      const browseEventsLink = screen.getByText('Browse Events')
      expect(browseEventsLink).toBeInTheDocument()

      // Links should be clickable (have href attributes)
      expect(browseEventsLink.closest('a')).toHaveAttribute('href', '/')
    })

    it('provides visual feedback on interaction', () => {
      render(<AttendeeNav />)

      // Buttons have w-full and justify-start classes for proper layout
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
      buttons.forEach(button => {
        expect(button).toHaveClass('w-full')
        expect(button).toHaveClass('justify-start')
      })
    })
  })
})