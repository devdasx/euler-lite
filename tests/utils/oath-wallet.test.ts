import { describe, expect, it } from 'vitest'
import { CoreHelperUtil } from '@reown/appkit-controllers'
import { getOathWallets } from '~/utils/oath-wallet'

describe('Oath AppKit wallet', () => {
  it.each([
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X)',
    'Mozilla/5.0 (iPad; CPU OS 18_2 like Mac OS X)',
  ])('offers the native mobile wallet route for %s', (userAgent) => {
    const wallets = getOathWallets(userAgent)
    expect(wallets).toHaveLength(1)
    const [wallet] = wallets
    expect(wallet.id).toBe('oath-wallet')
    expect(wallet.image_url).toMatch(/^(data:image\/svg\+xml[,;]|.*oath-wallet.*\.svg)/)
    expect(wallet.app_store).toBe('https://apps.apple.com/app/id6780187283')
    expect(wallet.desktop_link).toBeUndefined()
    expect(wallet.webapp_link).toBeUndefined()
    expect(wallet.play_store).toBeUndefined()
  })

  it('does not advertise an unavailable Android app', () => {
    expect(getOathWallets('Mozilla/5.0 (Linux; Android 14)')).toEqual([])
  })

  it('lets the installed AppKit SDK encode the complete pairing URI once', () => {
    const [wallet] = getOathWallets('iPhone')
    const uri = 'wc:test-topic@2?relay-protocol=irn&symKey=test-only'
    const { redirect } = CoreHelperUtil.formatNativeUrl(wallet.mobile_link!, uri)
    const link = new URL(redirect)
    expect(link.protocol).toBe('oathwallet:')
    expect(link.hostname).toBe('wc')
    expect(link.searchParams.get('uri')).toBe(uri)
    expect([...link.searchParams.keys()]).toEqual(['uri'])
  })
})
