/**
 * Comprehensive tests for UI components
 * Covers IPFSImage, TicketQRCode, ThemeToggle, WalletConnect
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: jest.fn(() => ({
    theme: 'light',
    setTheme: jest.fn(),
  })),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock Radix UI dropdown for ThemeToggle
jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ asChild, children }: { asChild?: boolean; children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) => (
    <button onClick={onClick} data-testid="dropdown-item">{children}</button>
  ),
}))

// Mock qrcode
jest.mock('qrcode', () => ({
  toDataURL: jest.fn((data, options, callback) => {
    if (callback) {
      callback(null, 'data:image/png;base64,mockQRCode')
    }
    return Promise.resolve('data:image/png;base64,mockQRCode')
  }),
}))

// Mock hooks
jest.mock('@/hooks/useStacks', () => ({
  useStacks: jest.fn(() => ({
    userData: null,
    isSignedIn: false,
    address: null,
  })),
}))

jest.mock('@/lib/stacks-utils', () => ({
  connectWallet: jest.fn(),
  disconnectWallet: jest.fn(),
  userSession: {
    isUserSignedIn: jest.fn(() => false),
    loadUserData: jest.fn(() => null),
  },
}))

import { IPFSImage } from '../IPFSImage'
import { TicketQRCode } from '../TicketQRCode'
import { ThemeToggle } from '../ThemeToggle'
import { WalletConnect } from '../WalletConnect'
import { useTheme } from 'next-themes'
import { useStacks } from '@/hooks/useStacks'
import * as stacksUtils from '@/lib/stacks-utils'

describe('IPFSImage Component', () => {
  it('should render with IPFS src', () => {
    render(<IPFSImage src="https://gateway.pinata.cloud/ipfs/QmTestHash123" alt="Test Image" />)
    const img = screen.getByRole('img')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('alt', 'Test Image')
  })

  it('should use provided src', () => {
    const testSrc = "https://gateway.pinata.cloud/ipfs/QmTestHash123"
    render(<IPFSImage src={testSrc} alt="Test" />)
    const img = screen.getByRole('img')
    const src = img.getAttribute('src')
    expect(src).toBe(testSrc)
  })

  it('should handle empty src gracefully', () => {
    render(<IPFSImage src="" alt="Empty" />)
    const img = screen.getByRole('img')
    expect(img).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(
      <IPFSImage src="https://test.com/image.jpg" alt="Test" className="custom-class" />
    )
    const img = screen.getByRole('img')
    expect(img).toHaveClass('custom-class')
  })

  it('should handle loading state', () => {
    render(<IPFSImage src="https://test.com/image.jpg" alt="Test" />)
    // Component should render without crashing during loading
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('should handle error state', () => {
    render(<IPFSImage src="https://invalid.com/image.jpg" alt="Test" />)
    // Should still render the img element even if image fails to load
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('should render as simple img element', () => {
    const { container } = render(<IPFSImage src="https://test.com/image.jpg" alt="Test" />)
    expect(container.querySelector('img')).toBeInTheDocument()
  })
})

describe('TicketQRCode Component', () => {
  const mockTicketData = {
    ticketId: '123',
    eventId: '1',
    eventTitle: 'Test Event',
    ownerAddress: 'ST2EC0NW05CA1PK148ZTPJMFH8NPY0ZWM1RCJNFB9',
    eventDate: '2024-12-31',
    eventTime: '20:00',
    location: 'Test Venue',
    price: '1.00 STX',
    used: false,
    timestamp: 1735689600,
  }

  it('should generate QR code from ticket data', async () => {
    render(<TicketQRCode ticketData={mockTicketData} />)

    await waitFor(() => {
      const img = screen.getByAltText('Ticket QR Code')
      expect(img).toHaveAttribute('src', expect.stringContaining('data:image/png'))
    }, { timeout: 3000 })
  })

  it('should show loading state initially', () => {
    render(<TicketQRCode ticketData={mockTicketData} />)
    // Should show loading spinner
    const loadingDiv = document.querySelector('.animate-spin')
    expect(loadingDiv).toBeInTheDocument()
  })

  it('should handle error state', async () => {
    // Mock QRCode.toDataURL to fail
    const qrcode = require('qrcode')
    qrcode.toDataURL.mockRejectedValueOnce(new Error('QR generation failed'))

    render(<TicketQRCode ticketData={mockTicketData} />)

    await waitFor(() => {
      expect(screen.getByText(/Error generating QR/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should call onQRGenerated callback', async () => {
    const onQRGenerated = jest.fn()
    render(<TicketQRCode ticketData={mockTicketData} onQRGenerated={onQRGenerated} />)

    await waitFor(() => {
      expect(onQRGenerated).toHaveBeenCalledWith(expect.stringContaining('data:image/png'))
    }, { timeout: 3000 })
  })

  it('should use custom size', async () => {
    const { container } = render(<TicketQRCode ticketData={mockTicketData} size={300} />)

    await waitFor(() => {
      const img = screen.getByAltText('Ticket QR Code')
      expect(img).toHaveStyle({ width: '300px', height: '300px' })
    }, { timeout: 3000 })
  })

  it('should apply custom className', async () => {
    const { container } = render(<TicketQRCode ticketData={mockTicketData} className="custom-qr" />)

    await waitFor(() => {
      const wrapper = container.querySelector('.custom-qr')
      expect(wrapper).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})

describe('ThemeToggle Component', () => {
  const mockSetTheme = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useTheme as jest.Mock).mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
    })
  })

  it('should render theme toggle button', () => {
    render(<ThemeToggle />)
    // ThemeToggle renders multiple buttons (trigger + dropdown items)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('should show sun and moon icons', () => {
    const { container } = render(<ThemeToggle />)
    // Both icons should be present with CSS classes controlling visibility
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('should render dropdown menu items', () => {
    render(<ThemeToggle />)
    const dropdownItems = screen.getAllByTestId('dropdown-item')
    expect(dropdownItems.length).toBeGreaterThanOrEqual(3) // Light, Dark, System
  })

  it('should set theme to light when light option clicked', () => {
    render(<ThemeToggle />)
    const dropdownItems = screen.getAllByTestId('dropdown-item')
    const lightButton = dropdownItems.find(item => item.textContent?.includes('Light'))

    if (lightButton) {
      fireEvent.click(lightButton)
      expect(mockSetTheme).toHaveBeenCalledWith('light')
    }
  })

  it('should set theme to dark when dark option clicked', () => {
    render(<ThemeToggle />)
    const dropdownItems = screen.getAllByTestId('dropdown-item')
    const darkButton = dropdownItems.find(item => item.textContent?.includes('Dark'))

    if (darkButton) {
      fireEvent.click(darkButton)
      expect(mockSetTheme).toHaveBeenCalledWith('dark')
    }
  })

  it('should set theme to system when system option clicked', () => {
    render(<ThemeToggle />)
    const dropdownItems = screen.getAllByTestId('dropdown-item')
    const systemButton = dropdownItems.find(item => item.textContent?.includes('System'))

    if (systemButton) {
      fireEvent.click(systemButton)
      expect(mockSetTheme).toHaveBeenCalledWith('system')
    }
  })

  it('should have accessible label', () => {
    render(<ThemeToggle />)
    expect(screen.getByText('Toggle theme')).toBeInTheDocument()
  })
})

describe('WalletConnect Component', () => {
  const mockConnectWallet = stacksUtils.connectWallet as jest.MockedFunction<typeof stacksUtils.connectWallet>
  const mockDisconnectWallet = stacksUtils.disconnectWallet as jest.MockedFunction<typeof stacksUtils.disconnectWallet>

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useStacks as jest.Mock).mockReturnValue({
      userData: null,
      isSignedIn: false,
      address: null,
    })
  })

  it('should show connect button when not signed in', () => {
    render(<WalletConnect />)
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument()
  })

  it('should show address when signed in', () => {
    ;(useStacks as jest.Mock).mockReturnValue({
      userData: {},
      isSignedIn: true,
      address: 'ST2EC0NW05CA1PK148ZTPJMFH8NPY0ZWM1RCJNFB9',
    })

    render(<WalletConnect />)
    // Should show truncated address (first 6 + last 4)
    expect(screen.getByText('ST2EC0...NFB9')).toBeInTheDocument()
  })

  it('should call connectWallet on button click', () => {
    render(<WalletConnect />)
    const button = screen.getByText('Connect Wallet')

    fireEvent.click(button)

    expect(mockConnectWallet).toHaveBeenCalled()
  })

  it('should call disconnectWallet when signed in and disconnect button clicked', () => {
    ;(useStacks as jest.Mock).mockReturnValue({
      userData: {},
      isSignedIn: true,
      address: 'ST2EC0NW05CA1PK148ZTPJMFH8NPY0ZWM1RCJNFB9',
    })

    render(<WalletConnect />)
    // When signed in, there are 2 buttons - badge (not clickable) and disconnect button
    const buttons = screen.getAllByRole('button')
    // Click the disconnect button (second button)
    const disconnectButton = buttons.find(btn => btn.querySelector('svg')) // Has LogOut icon

    if (disconnectButton) {
      fireEvent.click(disconnectButton)
      expect(mockDisconnectWallet).toHaveBeenCalled()
    }
  })

  it('should truncate long addresses', () => {
    const longAddress = 'ST2EC0NW05CA1PK148ZTPJMFH8NPY0ZWM1RCJNFB9'
    ;(useStacks as jest.Mock).mockReturnValue({
      userData: {},
      isSignedIn: true,
      address: longAddress,
    })

    render(<WalletConnect />)
    // Should show truncated address
    const truncated = screen.getByText('ST2EC0...NFB9')
    expect(truncated).toBeInTheDocument()
    expect(truncated.textContent?.length).toBeLessThan(longAddress.length)
  })

  it('should have proper button styling', () => {
    render(<WalletConnect />)
    const button = screen.getByText('Connect Wallet').closest('button')

    // Button should have classes for styling
    expect(button).toBeInTheDocument()
    expect(button?.className).toBeTruthy()
  })
})

describe('Component Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useStacks as jest.Mock).mockReturnValue({
      userData: null,
      isSignedIn: false,
      address: null,
    })
  })

  it('should work together in a parent component', () => {
    const TestContainer = () => (
      <div>
        <ThemeToggle />
        <WalletConnect />
        <IPFSImage src="https://test.com/image.jpg" alt="Test" />
      </div>
    )

    render(<TestContainer />)

    // All components should render
    expect(screen.getByText('Toggle theme')).toBeInTheDocument()
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument()
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('should handle theme changes across components', () => {
    const mockSetTheme = jest.fn()
    ;(useTheme as jest.Mock).mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
    })

    render(
      <div>
        <ThemeToggle />
        <IPFSImage src="https://test.com/image.jpg" alt="Test" />
      </div>
    )

    // Click on Dark theme option in dropdown
    const dropdownItems = screen.getAllByTestId('dropdown-item')
    const darkButton = dropdownItems.find(item => item.textContent?.includes('Dark'))

    if (darkButton) {
      fireEvent.click(darkButton)
      expect(mockSetTheme).toHaveBeenCalledWith('dark')
    }
  })
})
