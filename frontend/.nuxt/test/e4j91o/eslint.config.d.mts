import type { FlatConfigComposer } from "../../../node_modules/.pnpm/eslint-flat-config-utils@3.0.1/node_modules/eslint-flat-config-utils/dist/index.mjs"
import { defineFlatConfigs } from "../../../node_modules/.pnpm/@nuxt+eslint-config@1.14.0_@typescript-eslint+utils@8.54.0_eslint@10.0.0_jiti@2.6.1__ty_3d5d38945f69885e5327e7adc58970fc/node_modules/@nuxt/eslint-config/dist/flat.mjs"
import type { NuxtESLintConfigOptionsResolved } from "../../../node_modules/.pnpm/@nuxt+eslint-config@1.14.0_@typescript-eslint+utils@8.54.0_eslint@10.0.0_jiti@2.6.1__ty_3d5d38945f69885e5327e7adc58970fc/node_modules/@nuxt/eslint-config/dist/flat.mjs"

declare const configs: FlatConfigComposer
declare const options: NuxtESLintConfigOptionsResolved
declare const withNuxt: typeof defineFlatConfigs
export default withNuxt
export { withNuxt, defineFlatConfigs, configs, options }