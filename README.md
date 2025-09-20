# EventChain - Decentralized Event Ticketing Platform

A blockchain-powered event ticketing platform built on the Stacks network that provides secure, transparent, and decentralized event management for organizers and attendees.

##  Overview

EventChain eliminates the need for centralized ticketing intermediaries by leveraging blockchain technology to provide:
- Secure ticket purchasing and ownership verification
- Transparent event management
- Anti-fraud ticket verification through QR codes
- Direct payments between attendees and event creators
- Decentralized storage for event metadata

##  Architecture

The project consists of two main components:

### 1. Smart Contract (`/EventChain`)
- **Language**: Clarity (Stacks blockchain)
- **Purpose**: Core business logic for event creation, ticket management, and verification
- **Features**: Event creation, ticket purchasing, transfers, check-ins, refunds

### 2. Frontend Application (`/eventchain-ui`)
- **Framework**: Next.js 14 with TypeScript
- **Purpose**: User interface for interacting with the smart contract
- **Features**: Event browsing, ticket purchasing, organizer dashboard, QR verification

##  Key Features

### For Event Attendees
-  Browse and search events
-  Purchase tickets with STX cryptocurrency
-  View tickets with QR codes for verification
-  Transfer tickets to other users
-  Get refunds for cancelled events
-  IPFS-based event image storage

### For Event Organizers
-  Create and manage events
-  Set custom ticket pricing (including free events)
-  Track ticket sales and attendance
-  Verify attendees via QR code or address
-  Cancel events and process refunds
-  Require admin approval for organizer status

### For Administrators
-  Approve organizers
-  Manage platform permissions

##  Getting Started

### Prerequisites
- Node.js 18+
- Clarinet CLI (for smart contract development)
- Stacks wallet (Hiro Wallet recommended)
- Access to Stacks testnet/mainnet

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/BiliqisO/Stacks-project.git
cd Stacks-project
```

2. **Set up the smart contract**
```bash
cd EventChain
clarinet check  # Verify contract syntax
clarinet test   # Run contract tests
```

3. **Set up the frontend**
```bash
cd ../eventchain-ui
npm install
npm run dev
```

4. **Access the application**
Open [http://localhost:3000](http://localhost:3000) in your browser

##  Project Structure

```
Stacks-project/
├── EventChain/                 # Smart Contract
│   ├── contracts/
│   │   └── eventchain.clar    # Main contract logic
│   ├── tests/                 # Contract tests
│   ├── Clarinet.toml         # Clarinet configuration
│   └── deployments/          # Deployment configs
│
└── eventchain-ui/             # Frontend Application
    ├── src/
    │   ├── app/              # Next.js pages
    │   ├── components/       # React components
    │   ├── contexts/         # State management
    │   ├── hooks/           # Custom hooks
    │   └── lib/             # Utilities
    ├── package.json
    └── README.md
```

##  Smart Contract Functions

### Public Functions
- `create-event` - Create new events (organizers only)
- `buy-ticket` - Purchase event tickets
- `transfer-ticket` - Transfer ticket ownership
- `check-in-ticket` - Verify attendees (creators only)
- `cancel-event` - Cancel events (creators only)
- `refund-ticket` - Process refunds for cancelled events
- `add-organizer` - Approve organizers (admin only)

### Read-Only Functions
- `get-event` - Retrieve event details
- `get-ticket` - Get ticket information
- `is-organizer` - Check organizer status
- `get-ticket-info` - Get comprehensive ticket details
- `is-event-cancelled` - Check cancellation status

##  Testing

### Smart Contract Tests
```bash
cd EventChain
clarinet test
```

### Frontend Tests
```bash
cd eventchain-ui
npm run test
```

##  Deployment

### Smart Contract Deployment
1. Configure deployment settings in `deployments/`
2. Deploy to testnet: `clarinet deploy --testnet`
3. Deploy to mainnet: `clarinet deploy --mainnet`

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy to your preferred hosting platform (Vercel, Netlify, etc.)

##  Security Features

- **Input Validation**: All contract functions validate inputs to prevent malicious data
- **Authorization Checks**: Role-based access control for sensitive operations
- **Atomic Operations**: Ticket purchases and transfers are atomic to prevent race conditions
- **Fraud Prevention**: QR code verification prevents ticket duplication
- **Secure Payments**: Direct STX transfers without intermediaries


##  License

This project is open source and available under the [MIT License](LICENSE).

##  Links

- [Stacks Documentation](https://docs.stacks.co/)
- [Clarinet Documentation](https://docs.hiro.so/clarinet)
- [Next.js Documentation](https://nextjs.org/docs)

