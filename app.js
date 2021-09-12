const Web3 = require('web3')
const axios = require('axios');
const abiDecoder = require('abi-decoder');
require('dotenv').config()

const provider = new Web3.providers.HttpProvider(`https://${process.env.NETWORK}.infura.io/v3/${process.env.INFURA_API_KEY}`)
const web3 = new Web3(provider)
let lastBlock

async function checkLatestBlock() {
    if (!lastBlock) {
        lastBlock = await web3.eth.getBlock('latest')
        lastBlock = lastBlock.number
    }
    let block
    lastBlock += 1
    while (block === undefined || block === null){
        console.log("Waiting for next block:", lastBlock)
        block = await web3.eth.getBlock(lastBlock)
        await delay(parseInt(process.env.CHECK_INTERVAL) * 1000)
    }
    console.log(`Reading ${block.number}`)
    block.transactions.forEach(async (txn) => {

        let tx = await web3.eth.getTransaction(txn)
        // console.log(tx)
        if (process.env.ADDRESSES.includes(tx.from.toLowerCase())){
            let abi = await getABI(tx.to)
            abiDecoder.addABI(JSON.parse(abi));
            const decodedData = abiDecoder.decodeMethod(tx.input);
            const logs = await web3.eth.getTransactionReceipt(txn)
            // const decodedLogs = abiDecoder.decodeLogs(logs.logs);
            // console.log(decodedLogs)
            let txnData = {
                tx,
                inputData: decodedData
            }
            sendDiscordAlert(txnData)
        }
    })

}


async function getABI(contractAddress) {
    console.log(`Getting ABI of ${contractAddress}`)
    let config = {
        method: 'get',
        url: `https://api.etherscan.io/api?module=contract&action=getabi&address=${contractAddress}&apikey=${process.env.ETHERSCAN_API_KEY}`,
        headers: { }
    };
    let resp = await axios(config)
    return resp.data.result
}


function sendDiscordAlert(data){
    // console.log(data.inputData.params)
    let d = {
        "content": null,
        "embeds": [
            {
                "title": `Transaction Found - ${data.tx.hash}`,
                "url": `https://etherscan.io/tx/${data.tx.hash}`,
                "color": 65442,
                "fields": [
                    {
                        "name": "Wallet",
                        "value": data.tx.from
                    },{
                        "name": "Function called",
                        "value": data.inputData.name
                    },{
                        "name": "Value",
                        "value": web3.utils.fromWei(data.tx.value, 'ether')
                    }
                ]
            }
        ]
    }

    for (let param of data.inputData.params){
        d.embeds[0].fields.push({
            "name": param.name,
            value: String(param.value)
        })
    }
    let config = {
        method: 'post',
        url: process.env.DISCORD_WEBHOOK,
        headers: {
            'Content-Type': 'application/json'
        },
        data : JSON.stringify(d)
    };
    // console.log(config)

    axios(config)
        .then((response) => {
            console.log(JSON.stringify(response.data));
        })
        .catch((error) => {
            console.log(error);
        });

}


function delay(ms) {
    return new Promise(resolve => {
        setTimeout(() => { resolve('') }, ms);
    })
}

async function start() {
    while (true){
        await checkLatestBlock()
    }
}

start()




