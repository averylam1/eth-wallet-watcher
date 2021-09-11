const Web3 = require('web3')

const ADDRESSES = []
const NETWORK = 'mainnet' //
const INFURA_API_KEY = '9a6abeb243a24b7388082824b2838ea0'

const provider = new Web3.providers.HttpProvider(`https://${NETWORK}.infura.io/v3/${INFURA_API_KEY}`)
const web3 = new Web3(provider)

async function checkLatestBlock() {
    let block = await web3.eth.getBlock('latest')
    block.transactions.forEach(async (txn)=>{
        let receipt = await web3.eth.getTransactionReceipt(txn)
        console.log(receipt)
    })
    // console.log(block)
}

checkLatestBlock()