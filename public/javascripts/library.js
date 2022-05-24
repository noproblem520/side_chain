// Storage
let node_filesystem_avail_bytes_promise = await axios.get("http://140.118.9.225:9090/api/v1/query?query=node_filesystem_avail_bytes");
let node_filesystem_size_bytes_promise = await axios.get("http://140.118.9.225:9090/api/v1/query?query=node_filesystem_size_bytes");

for (let i = 0; i < 5; i++) {
    let avail = node_filesystem_avail_bytes_promise.data.data.result[i * 5].value[1];
    let size = node_filesystem_size_bytes_promise.data.data.result[i * 5].value[1];
    this.nodesData[i].Storage = (Math.round((100 - (100 * parseFloat(avail) / parseFloat(size))) * 100) / 100) + "%";
}


// Memory
let node_memory_MemFree_bytes_promise = await axios.get("http://140.118.9.225:9090/api/v1/query?query=node_memory_MemFree_bytes");
let node_memory_Cached_bytes_promise = await axios.get("http://140.118.9.225:9090/api/v1/query?query=node_memory_Cached_bytes");
let node_memory_Buffers_bytes_promise = await axios.get("http://140.118.9.225:9090/api/v1/query?query=node_memory_Buffers_bytes");
let node_memory_MemTotal_bytes_promise = await axios.get("http://140.118.9.225:9090/api/v1/query?query=node_memory_MemTotal_bytes");

for (let i = 0; i < 5; i++) {
    let MemFree = node_memory_MemFree_bytes_promise.data.data.result[i].value[1];
    let Cached = node_memory_Cached_bytes_promise.data.data.result[i].value[1];
    let Buffers = node_memory_Buffers_bytes_promise.data.data.result[i].value[1];
    let MemTotal = node_memory_MemTotal_bytes_promise.data.data.result[i].value[1];
    this.nodesData[i].Memory = (Math.round(100 * (1 - (parseFloat(MemFree) + parseFloat(Cached) + parseFloat(Buffers)) / parseFloat(MemTotal)) * 100) / 100) + "%";
}