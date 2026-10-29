import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mainnet } from 'viem/chains'

const mocks = vi.hoisted(() => ({
  createAppKit: vi.fn(),
  isBaseApp: vi.fn(),
  wagmiConfig: { id: 'existing-wagmi-config' },
}))
vi.mock('@reown/appkit/vue', () => ({ createAppKit: mocks.createAppKit }))
vi.mock('@reown/appkit-adapter-wagmi', () => ({
  WagmiAdapter: class {
    wagmiConfig = mocks.wagmiConfig
  },
}))
vi.mock('@wagmi/vue', () => ({ WagmiPlugin: 'wagmi-plugin' }))
vi.mock('~/utils/base-app-wallet', () => ({ hasBaseAppInjectedProvider: mocks.isBaseApp }))
vi.mock('~/entities/chainRegistry', () => ({ getNetworksByChainIds: () => [mainnet] }))

describe('AppKit Oath registration', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.stubGlobal('defineNuxtPlugin', (plugin: unknown) => plugin)
    vi.stubGlobal('useEnvConfig', () => ({
      appKitProjectId: 'test-project',
      appUrl: 'https://app.euler.finance/',
      appTitle: 'Euler',
      appDescription: 'Euler app',
    }))
    vi.stubGlobal('useChainConfig', () => ({ enabledChainIds: [1] }))
    mocks.createAppKit.mockReturnValue({ ready: vi.fn(), open: vi.fn() })
  })
  afterEach(() => vi.unstubAllGlobals())

  it.each([false, true])('registers Oath while preserving Base App behavior (%s)', async (isBaseApp) => {
    mocks.isBaseApp.mockReturnValue(isBaseApp)
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (iPhone)' })
    const { default: plugin } = await import('~/plugins/00.wagmi')
    const use = vi.fn()
    const result = await plugin({ vueApp: { use } } as never)
    const options = mocks.createAppKit.mock.calls[0][0]
    expect(options.customWallets.map((wallet: { id: string }) => wallet.id)).toEqual(['oath-wallet'])
    expect(options.projectId).toBe('test-project')
    expect(options.networks).toEqual([mainnet])
    expect(options.metadata.url).toBe('https://app.euler.finance')
    expect(options.featuredWalletIds).toEqual(isBaseApp
      ? ['fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa']
      : undefined)
    expect(options.allWallets).toBe(isBaseApp ? 'SHOW' : undefined)
    expect(use).toHaveBeenCalledWith('wagmi-plugin', { config: mocks.wagmiConfig })
    if (!result) throw new Error('Missing plugin result')
    if (!result.provide) throw new Error('Missing wallet modal provider')
    await result.provide.openWalletModal()
    expect(mocks.createAppKit).toHaveBeenCalledTimes(1)
  })

  it('keeps AppKit available on Android without Oath', async () => {
    mocks.isBaseApp.mockReturnValue(false)
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Linux; Android 14)' })
    const { default: plugin } = await import('~/plugins/00.wagmi')
    await plugin({ vueApp: { use: vi.fn() } } as never)
    expect(mocks.createAppKit.mock.calls[0][0].customWallets).toEqual([])
  })
})
