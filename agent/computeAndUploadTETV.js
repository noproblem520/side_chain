const axios = require('axios');
let Web3 = require('web3');
let smartContractJson = require('../public/smartcontracts/sideChain.json');
let abi = smartContractJson.abi;
require('dotenv').config();
var ellipticcurve = require("@starkbank/ecdsa");
let baseURL = process.env.BASE_URL;

w3 = new Web3(
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

const getMetricsData = async (URL) => {
    const promiseValue = await getMetricsPromise(URL)

    if (promiseValue.data) {
        return promiseValue.data.data.result;
    } else {
        console.log("No Data!!!!!!!")
        return 0;
    }
}



const setParam = async (URL, name) => {
    let metricData = await getMetricsData(URL);
    for (let i = 0; i < NodeAmount; i++) {
        try {
            req_param.nodeMetricsValue[i][name] = parseFloat(metricData[i].value[1]);
        } catch (e) {
            req_param.nodeMetricsValue[i][name] = 0
        }

    }
}



let MetricsDataObj = [
    {
        metricId: 1,
        name: "CPU",
        URL: baseURL + "/api/v1/query?query=system_cpu_sysload",
        method: "RayleighCDF_reverse",
        sigma: 90,
    },
    {
        metricId: 2,
        name: "Availability",
        URL: baseURL + "/api/v1/query?query=node_network_up",
        method: "zeroOrOne",
        sigma: 90
    },
    {
        metricId: 3,
        name: "DiscardedTransaction",
        URL: baseURL + "/api/v1/query?query=rpc_duration_eth_sendRawTransaction_failure_count",
        method: "RayleighCDF_reverse",
        sigma: 90
    },
    {
        metricId: 4,
        name: "OutstandingTransaction",
        URL: baseURL + "/api/v1/query?query=txpool_queued",
        method: "RayleighCDF_reverse",
        sigma: 90
    },
    {
        metricId: 5,
        name: "Memory",
        method: "RayleighCDF_reverse",
        sigma: 90
    },
    {
        metricId: 6,
        name: "Storage",
        method: "RayleighCDF_reverse",
        sigma: 90
    },
];



let NodeAmount = null;

let store_contractAddr = null;
// ??????TE???????????????????????????smart contract??????TimeFrame
let nodeTEAry = null;
let nodeTVAry = null;
let currentNodeTEAry = null;
let currentNodeTVAry = null;
let round = null;
const init = async () => {
    NodeAmount = 5;
    round = 100000000;
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

    // Set easier params, this is not a good implementation
    for (i in MetricsDataObj) {
        if (MetricsDataObj[i].metricId < 5) {
            await setParam(MetricsDataObj[i].URL, MetricsDataObj[i].name)
        }
    }

    // Storage
    let node_filesystem_avail_bytes_promise = await axios.get(baseURL + "/api/v1/query?query=node_filesystem_avail_bytes");
    let node_filesystem_size_bytes_promise = await axios.get(baseURL + "/api/v1/query?query=node_filesystem_size_bytes");

    for (let i = 0; i < 5; i++) {
        let avail = node_filesystem_avail_bytes_promise.data.data.result[i * 5].value[1];
        let size = node_filesystem_size_bytes_promise.data.data.result[i * 5].value[1];
        req_param.nodeMetricsValue[i].Storage = Math.round((100 - (100 * parseFloat(avail) / parseFloat(size))) * 100) / 100;
    }


    // Memory
    let node_memory_MemFree_bytes_promise = await axios.get(baseURL + "/api/v1/query?query=node_memory_MemFree_bytes");
    let node_memory_Cached_bytes_promise = await axios.get(baseURL + "/api/v1/query?query=node_memory_Cached_bytes");
    let node_memory_Buffers_bytes_promise = await axios.get(baseURL + "/api/v1/query?query=node_memory_Buffers_bytes");
    let node_memory_MemTotal_bytes_promise = await axios.get(baseURL + "/api/v1/query?query=node_memory_MemTotal_bytes");

    for (let i = 0; i < 5; i++) {
        let MemFree = node_memory_MemFree_bytes_promise.data.data.result[i].value[1];
        let Cached = node_memory_Cached_bytes_promise.data.data.result[i].value[1];
        let Buffers = node_memory_Buffers_bytes_promise.data.data.result[i].value[1];
        let MemTotal = node_memory_MemTotal_bytes_promise.data.data.result[i].value[1];
        req_param.nodeMetricsValue[i].Memory = Math.round(100 * (1 - (parseFloat(MemFree) + parseFloat(Cached) + parseFloat(Buffers)) / parseFloat(MemTotal)) * 100) / 100;
    }
}

const RayleighCDF = (metric, sigma) => {
    return 1 - Math.exp(-(metric ** 2) / (2 * sigma ** 2));
}

const RayleighCDF_reverse = (metric, sigma) => {
    return Math.exp(-(metric ** 2) / (2 * sigma ** 2));
}

let req_param = {
    "nodeMetricsValue": [{}, {}, {}, {}, {}]
}





const computeNodesTE = () => {

    for (let i = 0; i < NodeAmount; i++) {
        let TE = 1.0;
        for (j in MetricsDataObj) {
            let metric = req_param.nodeMetricsValue[i][MetricsDataObj[j].name];
            if (MetricsDataObj[j].method === "RayleighCDF") {
                TE *= RayleighCDF(metric, MetricsDataObj[j].sigma);
            } else if (MetricsDataObj[j].method === "RayleighCDF_reverse") {
                // console.log("RayleighCDF_reverse");
                TE *= RayleighCDF_reverse(metric, MetricsDataObj[j].sigma);
            } else {
                // console.log("zeroOrOne");
                TE *= metric;
            }
            // add metirc into req_param
            req_param.nodeMetricsValue[i][MetricsDataObj[j].name] = metric;
            // console.log(TE);
        }
        // There's no float in smart contract
        currentNodeTEAry.push((Math.round(TE * round) / round).toString());
    }

}

const getAvgTE_i = (node_i) => {

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
            TV = (1 / e) * latest_TE_i + (Math.exp(-2 * param_x) * 1 / e);
        } else {
            TV = (1 / e) * latest_TE_i * weight + (Math.exp(-2 * param_x) * nodeTVAry[i][previous_i] / e);
        }
        currentNodeTVAry.push((Math.round(TV * round) / round).toString());
        // console.log("-------------------------------------------------");
    }
}

const sign_request = (req_param) => {

    let msg = JSON.stringify(req_param);

    var Ecdsa = ellipticcurve.Ecdsa;
    var privateKey = ellipticcurve.PrivateKey.fromString(process.env.PRIVATE_KEY);


    let signature = Ecdsa.sign(msg, privateKey);
    return signature.toBase64();
}

const start = async () => {
    // 1. get Metrics and set them into variable => req_param
    // 2. get previous TE and TV in the smart contract
    // 3. reset variables which will be used later
    await init();

    console.log("Uploading metrics to relay_chain.");
    let signature = sign_request(req_param);
    let req = {
        msg: req_param,
        signature: signature,
        apikey: process.env.API_KEY
    }

    let result = await axios.post(process.env.RELAY_CAHIN_BASE_URL + '/blockchain/smartcontract', req);


    console.log(result.data);
    if (result.data === "Success!") {
        console.log("Local : Start computing TE...");
        computeNodesTE();
        console.log("Local : Start computing TV...");
        computeNodesTV();
        console.log("uploading TE to smart contract...");
        await uploadTETV();
        console.log("TE??????");
        console.log(currentNodeTEAry);
        console.log("TV??????");
        console.log(currentNodeTVAry);
        console.log("Done!");
    } else {
        console.log("error");
    }
}




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

// step???getMetricsData => RayleighCDF => pushToNodeTEAry => upload TE and TV to SmartContract

module.exports = {
    runAgent: async () => {
        await start();
    }
}