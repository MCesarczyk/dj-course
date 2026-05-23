import type { StorybookConfig } from '@storybook-vue/nuxt';

const config: StorybookConfig = {
  "stories": [
    "../components/**/*.stories.@(js|jsx|ts|tsx|mdx)"
  ],
  "addons": [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
  ],
  "framework": {
    "name": "@storybook-vue/nuxt",
    "options": {}
  }
};
export default config;