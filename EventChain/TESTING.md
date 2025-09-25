# EventChain Testing Guide

This document outlines the comprehensive testing strategy for the EventChain smart contract, including both unit testing with Clarinet SDK and fuzz testing with Rendezvous.

## Testing Overview

EventChain uses a dual testing approach:

1. **Unit Testing** - Specific functionality tests using Clarinet SDK (TypeScript)
2. **Fuzz Testing** - Property-based tests using Rendezvous (Clarity)

## Test Structure

```
EventChain/
├── tests/                          # Unit tests (Clarinet SDK)
│   ├── eventchain.test.ts         # Core functionality tests
│   ├── organizer-functions-validation.test.ts  # Organizer-specific tests
│   └── eventchain-security.test.ts    # Security & edge case tests
├── fuzz-tests/                     # Fuzz tests (Rendezvous)
│   ├── eventchain-properties.clar # Property-based invariants
│   └── rendezvous.toml           # Fuzz test configuration
└── package.json                   # Test scripts
```

## Running Tests

### Unit Tests (Clarinet SDK)

```bash
# Run all unit tests
npm run test

# Run specific test suites
npm run test:unit           # Core functionality
npm run test:security       # Security & edge cases

# Run all unit tests
npm run test:all

# Watch mode with coverage
npm run test:watch
```

### Fuzz Tests (Rendezvous)

```bash
# Run fuzz tests
npm run test:fuzz

# Run comprehensive test suite (unit + fuzz)
npm run test:comprehensive
```

## Unit Test Categories

### 1. Core Functionality Tests (`eventchain.test.ts`)

Tests basic contract operations:
- Contract deployment
- Event creation by organizers
- Ticket purchasing
- Ticket transfers
- Check-in functionality
- Event cancellation and refunds
- Admin functions

### 2. Organizer Functions (`organizer-functions-validation.test.ts`)

Tests organizer-specific functionality:
- Organizer approval process
- Event creation permissions
- Organizer event management
- Cross-organizer restrictions

### 3. Security & Edge Cases Tests (`eventchain-security.test.ts`)

Tests security boundaries and edge cases:
- Authorization checks (admin, organizer, event creator permissions)
- Valid vs invalid operations
- Ticket purchase security (double purchases, ownership verification)
- Transfer security (self-transfer prevention, ownership changes)
- Event cancellation security (creator permissions)
- Check-in security (double check-in prevention, ticket state changes)

## Fuzz Test Properties

Fuzz testing validates invariants that should ALWAYS hold true:

### 1. Event Creation Invariants
- Valid events have positive ticket counts and future timestamps
- Invalid inputs consistently return appropriate error codes
- Event data is stored correctly with proper creator assignment

### 2. Ticket Purchase Invariants
- Ticket purchases maintain consistent state (counters, ownership)
- Sold-out events prevent further purchases
- Ticket ownership is properly tracked

### 3. Ticket Transfer Invariants
- Transfers preserve ticket integrity
- Only unused tickets can be transferred
- Ownership changes are atomic

### 4. Check-in Invariants
- Tickets can only be used once
- Only event creators can perform check-ins
- Ticket state changes are permanent

### 5. Event Cancellation and Refund Invariants
- Cancelled events prevent new purchases
- Only cancelled events allow refunds
- Refunds properly restore user balances

### 6. Organizer Management Invariants
- Only approved organizers can create events
- Admin privileges are properly enforced

## Test Configuration

### Fuzz Test Configuration (`fuzz-tests/rendezvous.toml`)

```toml
[rendezvous]
contract = "eventchain"
properties = ["fuzz-tests/eventchain-properties.clar"]

[test_config]
test_cases = 1000      # Number of test cases per property
max_depth = 10         # Maximum depth for recursive structures
timeout = 5000         # Timeout per test case (ms)

[scenarios]
# Different scenarios with weighted distributions
event_creation.weight = 20
ticket_purchase.weight = 25
ticket_transfer.weight = 20
checkin.weight = 15
cancellation.weight = 10
organizer_management.weight = 10
```

## Test Data Patterns

### Valid Test Scenarios
- Events with various prices (0 for free, positive values)
- Different ticket quantities (1 to large numbers)
- Multiple organizers and attendees
- Various timestamps (near future to far future)

### Invalid Test Scenarios
- Empty or invalid input strings
- Past timestamps
- Zero or negative ticket counts
- Unauthorized access attempts
- Double operations (purchases, check-ins)

## Security Testing Focus

The test suite specifically validates:

1. **Authorization Controls**
   - Admin-only functions (adding organizers)
   - Organizer-only functions (creating events)
   - Event creator-only functions (check-ins, cancellations)

2. **Input Validation**
   - Non-empty required fields
   - Valid timestamp ranges
   - Positive ticket quantities

3. **State Consistency**
   - Accurate ticket counters
   - Proper ownership tracking
   - Atomic operations

4. **Economic Security**
   - Proper payment handling
   - Refund mechanisms
   - No double-spending scenarios

## Best Practices

### Writing Unit Tests
1. Use `beforeEach` to set up clean test state
2. Test both success and failure cases
3. Verify state changes after operations
4. Use descriptive test names
5. Group related tests in describe blocks

### Writing Property Tests
1. Define clear invariants that should always hold
2. Test with wide ranges of random inputs
3. Focus on state transitions and consistency
4. Validate error conditions return appropriate codes

### Test Maintenance
1. Run tests before each commit
2. Update tests when contract functionality changes
3. Monitor test coverage and add tests for new edge cases
4. Review fuzz test results for unexpected failures

## Debugging Failed Tests

### Unit Test Failures
1. Check test output for specific assertion failures
2. Verify test setup (organizer approvals, account balances)
3. Review contract state after operations
4. Use `console.log` to inspect intermediate values

### Fuzz Test Failures
1. Review the failing input values generated by Rendezvous
2. Check if the failure reveals a genuine contract bug
3. Update property definitions if the invariant was incorrectly specified
4. Add specific unit tests to cover the discovered edge case

## Performance Considerations

- Unit tests complete in < 500ms
- Fuzz tests may take several minutes depending on test case count
- Use `test:watch` during development for faster feedback
- Run comprehensive tests in CI/CD pipeline

## Integration with Development Workflow

1. **Pre-commit**: Run `npm run test:all`
2. **Pull Request**: Run `npm run test:comprehensive`
3. **Release**: Full test suite + manual verification on testnet
4. **Continuous**: Monitor for test flakiness and update as needed