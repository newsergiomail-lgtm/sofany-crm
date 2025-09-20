module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'warn',
    'no-debugger': 'warn'
  },
  settings: {
    'import/resolver': {
      'webpack': {
        'config': './webpack.config.js'
      }
    }
  }
};