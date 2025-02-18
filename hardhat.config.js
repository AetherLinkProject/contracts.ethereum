require('solidity-coverage');
require("@nomiclabs/hardhat-etherscan");
require('hardhat-contract-sizer');
// require("@nomiclabs/hardhat-ethers");
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.18",
  networks: {
    // hardhat: {
    //   allowUnlimitedContractSize: true
    // },
    // bsc_test: {
    //   url: "https://data-seed-prebsc-1-s1.binance.org:8545",
    //   chainId: 97,
    //   accounts: [process.env.key0,process.env.keymanager,process.env.key1,process.env.key2,process.env.key3,process.env.key4,process.env.key5,process.env.key6]
    // },
    // sepolia: {
    //   url: "https://sepolia.infura.io/v3/" + API_KEY,
    //   chainId: 11155111,
    //   accounts: [process.env.key0,process.env.key1]
    // }
    // bsc: {
    //   url: "https://bsc-dataseed2.binance.org",
    //   chainId: 56,
    //   accounts: [process.env.keymain]
    // },
    // ethereum: {
    //   url: "https://mainnet.infura.io/v3/" + API_KEY,
    //   chainId: 1,
    //   accounts: [process.env.keymain]
    // },
    // base_sepolia: {
    //   url: "https://sepolia.base.org",
    //   chainId: 84532,
    //   accounts: [process.env.key0,process.env.key1]
    // }
    //   base: {
    //     url: "https://mainnet.base.org",
    //     chainId: 8453,
    //     accounts: [process.env.keymain]
    // }

  },
  etherscan: {
    apiKey: {
      // mainnet: process.env.ethscan_api_key,
      // bsc: process.env.bscscan_api_key
      // sepolia: process.env.ethsacn_api_key,
      // base_sepolia:process.env.basescan_api_key,
      // base:process.env.basescan_api_key
    },
    customChains: [
      // {
      //   network: "base_sepolia",
      //   chainId: 84532,
      //   urls: {
      //     apiURL: "https://api-sepolia.basescan.org/api",
      //     browserURL: "https://sepolia.basescan.org"
      //   }
      // },
      // {
      //   network: "base",
      //   chainId: 8453,
      //   urls: {
      //     apiURL: "https://api.basescan.org/api",
      //     browserURL: "https://basescan.org"
      //   }
      // }
    ]
  }
};