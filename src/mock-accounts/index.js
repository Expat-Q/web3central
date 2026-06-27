// Mock module to satisfy wagmi core dynamic import for 'accounts'
module.exports = {
  Provider: {
    create: () => ({})
  },
  dialog: () => ({}),
  webAuthn: () => ({}),
  dangerous_secp256k1: () => ({})
};
