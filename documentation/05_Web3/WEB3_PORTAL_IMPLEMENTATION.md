# Web3 Portal Implementation Documentation

## Overview

The Web3 Portal is a feature that enables users to connect their crypto wallets (primarily Phantom for Solana), view balances, and perform send/receive operations within the Patchline application.

## Architecture

The implementation follows a hybrid approach:
- **Client-side wallet connection** using Phantom's in-browser API
- **Server-side balance fetching** to avoid CORS issues and protect RPC keys
- **Modal-based UI** for send/receive operations

## Components

### 1. Wallet Connector (`components/web3/wallet-connector.tsx`)

The main entry point for wallet interactions:
- Detects if Phantom is installed
- Handles wallet connection and disconnection
- Manages UI states (connected, loading, error)
- Displays wallet address and balances in dropdown
- Provides buttons to access send/receive modals

### 2. Send Crypto Modal (`components/web3/send-crypto-modal.tsx`)

Modal for sending crypto:
- Input fields for recipient address and amount
- Token selection (SOL, USDC)
- Transaction preview with fees
- Submit button that triggers wallet signing

### 3. Receive Crypto Modal (`components/web3/receive-crypto-modal.tsx`)

Modal for receiving crypto:
- Displays user's wallet address
- QR code for easy scanning
- Copy address button

### 4. Server-Side API (`app/api/web3/balance/route.ts`)

API endpoint to fetch wallet balances:
- Accepts wallet address as query parameter
- Makes RPC calls to Solana from server-side
- Returns SOL and token balances with USD values
- Provides fallback to mock data if needed

## Balance Fetching Flow

1. User connects Phantom wallet
2. Wallet address is stored in application state
3. Application calls `/api/web3/balance?address=<wallet>` 
4. Server makes RPC calls to fetch SOL and token balances
5. Results are returned to client and displayed in UI
6. If API fails, application falls back to mock data

## Implementation Decisions

### Why Server-Side Balance Fetching?

We moved balance fetching to the server for several reasons:
1. **CORS Issues**: Direct browser-to-RPC calls were blocked by Cloudflare (403 errors)
2. **Security**: Keeps any premium RPC endpoint keys private
3. **Reliability**: Server has more stable connection to RPC endpoints
4. **Caching**: Server can implement caching to reduce RPC usage

### Fallback Strategy

To ensure a good user experience even when connections fail:
1. Try server API first for real balances
2. If that fails, use mock data with realistic values
3. Show error toast to inform user of connectivity issues

## Next Development Steps

1. **Complete Send Functionality**: 
   - Implement transaction construction and signing
   - Add status tracking and confirmation

2. **Real-time Balance Updates**:
   - Add websocket subscription for balance changes
   - Update UI immediately after transactions

3. **Transaction History**:
   - Add API endpoint to fetch transaction history
   - Implement transaction list in UI

4. **Multi-Wallet Support**:
   - Add support for Solflare, Backpack, etc.
   - Abstract wallet providers behind common interface

## Environment Variables

The Web3 Portal requires these environment variables:

```
# Server-side only (not exposed to browser)
SOLANA_RPC=https://api.mainnet-beta.solana.com  # or premium endpoint

# Available to browser
NEXT_PUBLIC_ENABLE_WEB3=true                    # feature flag
```

## Testing

To test the Web3 Portal:
1. Install Phantom wallet browser extension
2. Run application with `npm run dev`
3. Click "Connect Wallet" in navigation bar
4. Approve connection in Phantom popup
5. Verify wallet address and balances display correctly
6. Test send/receive modals
