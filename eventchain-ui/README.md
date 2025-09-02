# EventChain UI

A decentralized event ticketing platform built on the Stacks blockchain. EventChain provides secure, transparent, and blockchain-powered event management with features for both event organizers and attendees.

## Features

### For Attendees

- Browse and search events across categories
- Purchase tickets with secure blockchain transactions
- View and manage purchased tickets
- QR code ticket verification
- IPFS-based image storage for events

### For Organizers

- Create and manage events
- Set ticket pricing and availability
- Track event analytics and attendance
- Verify tickets through QR code scanning
- Manage organizer permissions

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Blockchain**: Stacks network integration
- **UI Components**: Radix UI with Tailwind CSS
- **State Management**: React Context
- **Storage**: IPFS via Pinata for images
- **Authentication**: Stacks wallet connection

## Getting Started

### Prerequisites

- Node.js 18+
- A Stacks wallet (Hiro Wallet recommended)
- Access to Stacks testnet/mainnet

### Installation

1. Clone the repository:

```bash
git clone <https://github.com/BiliqisO/Stacks-project.git
cd eventchain-ui
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── organizer/         # Organizer dashboard and management
│   ├── event/[id]/        # Individual event pages
│   ├── my-events/         # User's created events
│   ├── my-tickets/        # User's purchased tickets
│   └── check-in/          # Ticket verification
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components (Radix)
│   ├── navigation/       # Navigation components
│   └── wallet-connect.tsx # Stacks wallet integration
├── contexts/             # React contexts
├── hooks/                # Custom React hooks
└── lib/                  # Utility functions and blockchain config
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Blockchain Integration

EventChain integrates with the Stacks blockchain for:

- Event creation and management
- Ticket purchasing and ownership verification
- Organizer permission management
- Decentralized data storage

The application uses Clarinet SDK for blockchain interactions and supports both testnet and mainnet deployments.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request
