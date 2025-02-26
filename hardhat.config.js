require("@nomicfoundation/hardhat-toolbox");

const PRIVATE_KEY = "be5bcb08c16826fe29fc93d9344f9135a604e18e779a1b479fdeea503e31406c";
module.exports = {
  defaultNetwork: "localhost",
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
      },
    },
  },
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};
