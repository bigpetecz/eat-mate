import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';
import nextConfig from 'eslint-config-next';
import nextCoreWebVitalsConfig from 'eslint-config-next/core-web-vitals';

export default [
  ...nextConfig,
  ...nextCoreWebVitalsConfig,
  ...baseConfig,
  ...nx.configs['flat/react-typescript'],
  {
    ignores: ['.next/**/*'],
  },
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/use-memo': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/purity': 'off',
    },
  },
];
