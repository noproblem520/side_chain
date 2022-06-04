let Web3 = require('web3');
let smartContractJson = require('../public/smartcontracts/sideChain.json');
let abi = smartContractJson.abi;
require('dotenv').config();
w3 = new Web3(
    process.env.BLOCKCHAIN_RPC
)

// let nodeTEAry = new Array();
let nodeTVAry = null;
let round = null;
const init = () => {
    NodeAmount = 5;
    round = 1000;
    nodeTVAry = new Array();
}

const getAvgTV = async () => {
    let store_contractAddr = process.env.MONITOR_CONTRACT;
    let contract = new w3.eth.Contract(abi, store_contractAddr);
    for (let i = 0; i < 5; i++) {
        // nodeTEAry.push(await contract.methods.retrieveTE(i).call());
        nodeTVAry.push(await contract.methods.retrieveTV(i).call());
    }
    let sum = 0;
    for (let i = 0; i < NodeAmount; i++) {
        sum += parseFloat(nodeTVAry[i][nodeTVAry[i].length - 1]);
    }
    return Math.round(sum / NodeAmount * round) / round;
}

const getTVAry = async () => {
    let store_contractAddr = process.env.MONITOR_CONTRACT;
    let contract = new w3.eth.Contract(abi, store_contractAddr);

    for (let i = 0; i < 5; i++) {
        // nodeTEAry.push(await contract.methods.retrieveTE(i).call());
        nodeTVAry.push(await contract.methods.retrieveTV(i).call());
    }
    let result = new Array();
    let lastIndex = nodeTVAry[0].length - 1;
    if (lastIndex > -1) {
        for (i in nodeTVAry) {
            result.push(Math.round(parseFloat(nodeTVAry[i][lastIndex]) * round) / round);
        }
    }
    return result;
}


const getAvgTVStart = async () => {
    init();
    return await getAvgTV();

}

const getLatestTVAryStart = async () => {
    init();
    return await getTVAry();
}

// const start = async () => {
//     let result = await getLatestTVAryStart();
//     console.log(nodeTVAry);
//     // console.log(result);
// }

// start();

module.exports = {
    getAvgTV: async () => {
        return await getAvgTVStart();
    },
    getLatestTVAry: async () => {
        return await getLatestTVAryStart();
    }
}

// 0.0 <= AVG(TV) < 0.4 大風險
// 0.4 <= AVG(TV) < 0.7 小風險
// 0.7 <= AVG(TV) <= 0.1  無風險