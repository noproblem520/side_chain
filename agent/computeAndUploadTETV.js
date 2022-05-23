const axios = require('axios');
let Web3 = require('web3');
let smartContractJson = require('../public/smartcontracts/sideChain.json');
let abi = smartContractJson.abi;
require('dotenv').config();

w3 = new Web3(
    // # demo1's blockchain
    // # Web3.HTTPProvider("HTTP://140.118.9.225:23001")
    //  VM blockchai
    process.env.BLOCKCHAIN_RPC
)



let my_address = process.env.PUBLIC_KEY;
let private_key = process.env.PRIVATE_KEY;


const getMetricsPromise = async (URL) => {
    try {
        return await axios.get(URL)
    } catch (error) {
        console.error(error)
    }
}
// e.g. "http://192.168.88.129:9090/api/v1/query?query=rpc_duration_eth_getTransactionCount_success_count"
const getMetricsData = async (URL, _node_i) => {
    const promiseValue = await getMetricsPromise(URL)

    if (promiseValue.data) {
        // console.log(promiseValue.data.data.result[_node_i].value[1]);
        return promiseValue.data.data.result[_node_i].value[1];
    } else {
        console.log("No Data!!!!!!!")
        return 0;
    }
}



let MetricsDataObj = [
    {
        metricId: 1,
        name: "CPU",
        URL: "http://192.168.88.129:9090/api/v1/query?query=system_cpu_sysload",
        method: "RayleighCDF_reverse",
        sigma: 2,

    },
    // {
    //     metricId: 2,
    //     name: "outstanding transaction",
    //     URL: "http://192.168.88.129:9090/api/v1/query?query=chain_head_block",
    //     method: "RayleighCDF_reverse",
    //     sigma: 5
    // },
    // {
    //     metricId: 3,
    //     name: "outstanding transaction",
    //     URL: "http://192.168.88.129:9090/api/v1/query?query=txpool_pending",
    //     method: "RayleighCDF_reverse",
    //     sigma: 90
    // }
];





// getMetricsData();
let NodeAmount = null;

let store_contractAddr = null;
// 計算TE使用一維陣列即可，smart contract才需TimeFrame
let nodeTEAry = null;
let nodeTVAry = null;
let currentNodeTEAry = null;
let currentNodeTVAry = null;

const init = async () => {
    NodeAmount = 5;

    nodeTEAry = new Array();
    nodeTVAry = new Array();
    currentNodeTEAry = new Array();
    currentNodeTVAry = new Array();

    store_contractAddr = process.env.MONITOR_CONTRACT;
    let contract = new w3.eth.Contract(abi, store_contractAddr);
    for (let i = 0; i < NodeAmount; i++) {
        nodeTEAry.push(await contract.methods.retrieveTE(i).call());
        nodeTVAry.push(await contract.methods.retrieveTV(i).call());
    }
}

const RayleighCDF = (metric, sigma) => {
    return 1 - Math.exp(-(metric ** 2) / (2 * sigma ** 2));
}

const RayleighCDF_reverse = (metric, sigma) => {
    return Math.exp(-(metric ** 2) / (2 * sigma ** 2));
}

let req_param = {
    "store_contractAddress": "0x16F31507E1f904D78823CA3bc3e5226Fa05c7A7A",
    "nodeMetricsValue": [{}, {}, {}, {}, {}]
}

const computeNodesTE = async () => {

    for (let i = 0; i < NodeAmount; i++) {
        let TE = 1.0;
        for (j in MetricsDataObj) {
            // console.log("retrieving '" + MetricsDataObj[j].name + "' data");
            let metric = await getMetricsData(MetricsDataObj[j].URL, i);
            console.log("metric : " + metric);

            // add metirc into req_param
            req_param.nodeMetricsValue[i][MetricsDataObj[j].name] = metric;

            TE *= RayleighCDF(metric, MetricsDataObj[j].sigma);
            // console.log(TE);
        }
        // There's no float in smart contract
        currentNodeTEAry.push(TE.toString());
    }

}

const getAvgTE_i = (node_i) => {
    // console.log("getAvgTE_" + node_i + "length = " + nodeTEAry[node_i].length)
    let sumTE = 0.0;

    if (nodeTEAry[node_i].length >= 1) {
        for (let i = 0; i < nodeTEAry[node_i].length; i++) {
            sumTE += parseFloat(nodeTEAry[node_i][i]);
        }
        return sumTE / (nodeTEAry[node_i].length);
    } else {
        return 0;
    }

}



const computeNodesTV = () => {
    let param_x = 0.1
    let e = Math.exp(-param_x) + 1;
    for (let i = 0; i < NodeAmount; i++) {
        // console.log("-------------------------------------------------");
        let latest_TE_i = currentNodeTEAry[i];
        // console.log("latest_TE_i = " + latest_TE_i);
        let avgTE_i = getAvgTE_i(i);
        // console.log("avgTE_" + i + " => " + avgTE_i);
        let weight = 1 - (Math.abs(latest_TE_i - avgTE_i));
        // console.log("weight = " + weight);
        // console.log("latest_TE_i * weight = " + latest_TE_i * weight);
        let previous_i = nodeTVAry[i].length - 1;
        let TV = 0.0;
        // initial TVi,0 = 0
        if (nodeTVAry[i].length < 1) {
            // TV = (1 / e) * weight + (Math.exp(-2 * param_x) * 0 / e);
            TV = (1 / e) * latest_TE_i + (Math.exp(-2 * param_x) * 1 / e);;
        } else {
            TV = (1 / e) * latest_TE_i * weight + (Math.exp(-2 * param_x) * nodeTVAry[i][previous_i] / e);
        }
        currentNodeTVAry.push(TV.toString());
        // console.log("-------------------------------------------------");
    }
}


const start = async () => {
    await init();
    console.log("Local : Start computing TE...");
    await computeNodesTE();

    console.log("Uploading metrics to relay_chain.");
    axios.post('http://127.0.0.1:5000/blockchain/smartcontract', req_param);

    console.log("Local : Start computing TV...");
    computeNodesTV();

    console.log("uploading TE to smart contract...");
    await uploadTETV();

    console.log("TE在下");
    console.log(currentNodeTEAry);
    console.log("TV在下");
    console.log(currentNodeTVAry);
    console.log("Done!");
}


// start();



const uploadTETV = async () => {
    let contract = new w3.eth.Contract(abi, store_contractAddr);
    let nonce = await w3.eth.getTransactionCount(my_address)
    // encode transactions to ABI
    let TEdata = await contract.methods.uploadTE(currentNodeTEAry).encodeABI();
    let TVdata = await contract.methods.uploadTV(currentNodeTVAry).encodeABI();
    let txs = [];
    txs.push(await w3.eth.accounts.signTransaction({
        from: my_address,
        to: contract.options.address,
        gas: '500000',
        nonce: nonce,
        data: TEdata
    }, private_key));

    txs.push(await w3.eth.accounts.signTransaction({
        from: my_address,
        to: contract.options.address,
        gas: '500000',
        nonce: nonce + 1,
        data: TVdata
    }, private_key));
    for (tx of txs) {
        await w3.eth.sendSignedTransaction(tx.rawTransaction);
    }
}

// step：getMetricsData => RayleighCDF => pushTonodeTEAry => upload TE to SmartContract

module.exports = {
    runAgent: async () => {
        console.log("now is uploading");
        await start();
    }
}