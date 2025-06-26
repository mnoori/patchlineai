import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Web3Settings {
  enabled: boolean
  connectedWallets: Record<string, string>
  preferredWallet: string | null
}

interface Web3Store {
  settings: Web3Settings
  toggleWeb3: (enabled: boolean) => void
  connectWallet: (type: string, address: string) => void
  disconnectWallet: (type: string) => void
  getActiveWallet: () => string | null
}

export const useWeb3Store = create<Web3Store>()(
  persist(
    (set, get) => ({
      settings: {
        enabled: true,
        connectedWallets: {},
        preferredWallet: null,
      },
      toggleWeb3: (enabled) =>
        set((state) => ({ settings: { ...state.settings, enabled } })),
      connectWallet: (type, address) =>
        set((state) => ({
          settings: {
            ...state.settings,
            connectedWallets: {
              ...state.settings.connectedWallets,
              [type]: address,
            },
            preferredWallet: type,
          },
        })),
      disconnectWallet: (type) =>
        set((state) => {
          const cw = { ...state.settings.connectedWallets }
          delete cw[type]
          return { settings: { ...state.settings, connectedWallets: cw } }
        }),
      getActiveWallet: () => {
        const { connectedWallets, preferredWallet } = get().settings
        if (preferredWallet && connectedWallets[preferredWallet])
          return connectedWallets[preferredWallet]
        return Object.values(connectedWallets)[0] || null
      },
    }),
    { name: "patchline-web3" }
  )
) 