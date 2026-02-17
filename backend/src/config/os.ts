import { $ } from "bun"


export const OS = (await $`uname -s`.text()).trim()

export const Platform = {
  linux: 'Linux',
  Darwin: 'MacOS',
  win32: 'Windows'
} as const


export type PlatformKey = keyof typeof Platform

export const OSPlatform = Platform[OS as PlatformKey] || "Unknown Platform"