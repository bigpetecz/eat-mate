//@ts-check

const { composePlugins, withNx } = require('@nx/next');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  // Use this to set Nx-specific options
  // See: https://nx.dev/recipes/next/next-config-setup
  nx: {},
  images: {
    domains: ['images.unsplash.com'],
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

const mergedConfig = composePlugins(...plugins)(nextConfig);

module.exports = {
  ...mergedConfig,
  images: {
    ...(mergedConfig.images || {}),
    domains: ['images.unsplash.com'],
  },
};
