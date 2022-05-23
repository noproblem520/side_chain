let MetricsName = "CPU";

let a = new Array();
let req_param = {
    "store_contractAddress": "0x47B7A6d6dC9aFeF8Ef950DBA10deB1AD59E36B08",
    "nodeMetricsValue": [{}, {}, {}, {}, {}]
}

req_param.nodeMetricsValue[0][MetricsName] = 7;
console.log(req_param);