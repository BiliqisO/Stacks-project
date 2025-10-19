// Mock the entire @stacks/connect module
export const mockStacksConnect = {
  AppConfig: jest.fn().mockImplementation(() => ({})),
  UserSession: jest.fn().mockImplementation(() => ({
    isSignInPending: jest.fn(() => false),
    handlePendingSignIn: jest.fn().mockResolvedValue({}),
    isUserSignedIn: jest.fn(() => true),
    loadUserData: jest.fn(() => ({
      profile: {
        stxAddress: {
          testnet: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9',
          mainnet: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9',
        },
      },
    })),
    signUserOut: jest.fn(),
  })),
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn(),
  request: jest.fn().mockResolvedValue('mock-tx-id'),
  isConnected: jest.fn(() => true),
  getLocalStorage: jest.fn(() => ({
    addresses: {
      stx: [
        {
          address: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9',
        },
      ],
    },
  })),
}

// Mock the @stacks/transactions module
export const mockStacksTransactions = {
  stringUtf8CV: jest.fn((value: string) => ({ type: 'string-utf8', value })),
  uintCV: jest.fn((value: number) => ({ type: 'uint', value })),
  principalCV: jest.fn((value: string) => ({ type: 'principal', value })),
  PostConditionMode: {
    Allow: 'allow',
    Deny: 'deny',
  },
  fetchCallReadOnlyFunction: jest.fn().mockImplementation(({ functionName }) => {
    // Mock different contract function responses
    switch (functionName) {
      case 'get-total-events':
        return Promise.resolve(2)
      case 'get-event':
        return Promise.resolve({
          type: 'some',
          value: {
            type: 'tuple',
            value: {
              creator: { value: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9' },
              name: { value: 'Test Event' },
              location: { value: 'Test Location' },
              timestamp: { value: 1735689600 },
              price: { value: 1000000 },
              'total-tickets': { value: 100 },
              'tickets-sold': { value: 25 },
              image: { value: '' },
            },
          },
        })
      case 'is-organizer':
        return Promise.resolve({ type: 'bool', value: true })
      case 'get-admin':
        return Promise.resolve({ type: 'principal', value: 'ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9' })
      case 'get-ticket':
        return Promise.resolve({
          type: 'some',
          value: {
            type: 'tuple',
            value: {
              used: { type: 'bool', value: false },
            },
          },
        })
      case 'get-organizer-events':
        return Promise.resolve({
          type: 'list',
          list: [
            { type: 'uint', value: 1 },
            { type: 'uint', value: 2 },
          ],
        })
      default:
        return Promise.resolve(null)
    }
  }),
}

// Mock IPFS/Pinata
export const mockPinata = {
  upload: {
    file: jest.fn().mockResolvedValue({
      IpfsHash: 'QmMockHash123',
      PinSize: 1024,
      Timestamp: new Date().toISOString(),
    }),
    json: jest.fn().mockResolvedValue({
      IpfsHash: 'QmMockJsonHash123',
      PinSize: 512,
      Timestamp: new Date().toISOString(),
    }),
  },
}

// Mock QR Code generation
export const mockQRCode = {
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mock-qr-code'),
}

// Mock blockchain network responses
export const mockNetworkResponses = {
  '/v2/contracts/interface': {
    status: 200,
    json: () => Promise.resolve({
      functions: [
        {
          name: 'create-event',
          access: 'public',
        },
        {
          name: 'buy-ticket',
          access: 'public',
        },
      ],
    }),
  },
  '/v2/contracts/call-read': {
    status: 200,
    json: () => Promise.resolve({
      okay: true,
      result: 'mock-result',
    }),
  },
}

// Setup mocks
export const setupStacksMocks = () => {
  // Mock @stacks/connect
  jest.doMock('@stacks/connect', () => mockStacksConnect)

  // Mock @stacks/transactions
  jest.doMock('@stacks/transactions', () => mockStacksTransactions)

  // Mock qrcode
  jest.doMock('qrcode', () => mockQRCode)

  // Mock pinata
  jest.doMock('pinata', () => ({
    PinataSDK: jest.fn().mockImplementation(() => mockPinata),
  }))

  // Mock fetch for blockchain API calls
  global.fetch = jest.fn().mockImplementation((url: string) => {
    if (url.includes('/v2/contracts/interface')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => mockNetworkResponses['/v2/contracts/interface'].json(),
      })
    }
    if (url.includes('/v2/contracts/call-read')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => mockNetworkResponses['/v2/contracts/call-read'].json(),
      })
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    })
  })
}

// Cleanup mocks
export const cleanupStacksMocks = () => {
  jest.restoreAllMocks()
  jest.resetModules()
}

// Mock error scenarios
export const mockStacksError = () => {
  mockStacksConnect.request.mockRejectedValue(new Error('Mock Stacks error'))
  mockStacksTransactions.fetchCallReadOnlyFunction.mockRejectedValue(
    new Error('Mock contract read error')
  )
}

// Mock successful scenarios
export const mockStacksSuccess = () => {
  mockStacksConnect.request.mockResolvedValue('mock-successful-tx-id')
  mockStacksTransactions.fetchCallReadOnlyFunction.mockResolvedValue({
    type: 'bool',
    value: true,
  })
}