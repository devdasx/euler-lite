import type { AppKitOptions } from '@reown/appkit/vue'
import oathLogo from '~/assets/wallets/oath-wallet.svg?url'

// Use AppKit's native custom-wallet row and WalletConnect pairing screen.
// Oath is an iOS app, not an injected browser extension or Android wallet.
export const getOathWallets = (
  userAgent: string = typeof navigator === 'undefined' ? '' : navigator.userAgent,
): NonNullable<AppKitOptions['customWallets']> => {
  if (/android/i.test(userAgent)) return []

  return [{
    id: 'oath-wallet',
    name: 'Oath Wallet',
    homepage: 'https://oathwallet.org',
    image_url: oathLogo,
    mobile_link: 'oathwallet://',
    app_store: 'https://apps.apple.com/app/id6780187283',
  }]
}
