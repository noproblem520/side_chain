Vue.createApp({
    data() {
        return {
            message: "Hello Vue!",
            nodeTrustValue: [],
            metrics: [],
            nodesData: [],
            TE: [],
            BaseURL: "",
            relayChainIP: "",
            localIP: "",
        };
    },
    methods: {
        init: async function () {
            console.log(this);
            let latestTVAry = await axios.get(
                this.localIP + "/blockchain/getLatestTVAry"
            );

            this.nodeTrustValue = [
                { id: "node1" },
                { id: "node2" },
                { id: "node3" },
                { id: "node4" },
                { id: "node5" },
            ];
            this.nodesData = [
                { id: "node1" },
                { id: "node2" },
                { id: "node3" },
                { id: "node4" },
                { id: "node5" },
            ];
            for (i in latestTVAry.data.result) {
                this.nodeTrustValue[i].trustValue = latestTVAry.data.result[i];
            }


            // easier metrics
            let MetricsDataObj = [
                {
                    metricId: 1,
                    name: "CPU",
                    URL: this.BaseURL + "/api/v1/query?query=system_cpu_sysload",
                },
                {
                    metricId: 2,
                    name: "Availability",
                    URL: this.BaseURL + "/api/v1/query?query=node_network_up",
                },
                {
                    metricId: 3,
                    name: "LatestBlockNumber",
                    URL: this.BaseURL + "/api/v1/query?query=chain_head_block",
                },
                {
                    metricId: 4,
                    name: "DiscardedTransaction",
                    URL: this.BaseURL + "/api/v1/query?query=rpc_duration_eth_sendRawTransaction_failure_count",
                },
                {
                    metricId: 5,
                    name: "OutstandingTransaction",
                    URL: this.BaseURL + "/api/v1/query?query=txpool_queued",
                },


            ];


            for (let i = 0; i < 5; i++) {
                for (j in MetricsDataObj) {
                    let metricPromise = await axios.get(MetricsDataObj[j].URL);
                    try {
                        if (MetricsDataObj[j].name === "CPU") {
                            this.nodesData[i][MetricsDataObj[j].name] = metricPromise.data.data.result[i].value[1] + "%";
                        } else {
                            this.nodesData[i][MetricsDataObj[j].name] = metricPromise.data.data.result[i].value[1];
                        }
                    } catch (e) {
                        this.nodesData[i][MetricsDataObj[j].name] = 0;
                    }
                }
            }
            // Storage
            let node_filesystem_avail_bytes_promise = await axios.get(this.BaseURL + "/api/v1/query?query=node_filesystem_avail_bytes");
            let node_filesystem_size_bytes_promise = await axios.get(this.BaseURL + "/api/v1/query?query=node_filesystem_size_bytes");

            for (let i = 0; i < 5; i++) {
                let avail = node_filesystem_avail_bytes_promise.data.data.result[i * 5].value[1];
                let size = node_filesystem_size_bytes_promise.data.data.result[i * 5].value[1];
                this.nodesData[i].Storage = (Math.round((100 - (100 * parseFloat(avail) / parseFloat(size))) * 100) / 100) + "%";
            }


            // Memory
            let node_memory_MemFree_bytes_promise = await axios.get(this.BaseURL + "/api/v1/query?query=node_memory_MemFree_bytes");
            let node_memory_Cached_bytes_promise = await axios.get(this.BaseURL + "/api/v1/query?query=node_memory_Cached_bytes");
            let node_memory_Buffers_bytes_promise = await axios.get(this.BaseURL + "/api/v1/query?query=node_memory_Buffers_bytes");
            let node_memory_MemTotal_bytes_promise = await axios.get(this.BaseURL + "/api/v1/query?query=node_memory_MemTotal_bytes");

            for (let i = 0; i < 5; i++) {
                let MemFree = node_memory_MemFree_bytes_promise.data.data.result[i].value[1];
                let Cached = node_memory_Cached_bytes_promise.data.data.result[i].value[1];
                let Buffers = node_memory_Buffers_bytes_promise.data.data.result[i].value[1];
                let MemTotal = node_memory_MemTotal_bytes_promise.data.data.result[i].value[1];
                this.nodesData[i].Memory = (Math.round(100 * (1 - (parseFloat(MemFree) + parseFloat(Cached) + parseFloat(Buffers)) / parseFloat(MemTotal)) * 100) / 100) + "%";
            }

        },
        verification: async function () {

            let localAvgTV = await axios.get(
                this.localIP + "/blockchain/getAvgTV"
            );


            let relayChainAvgTV = await axios.get(
                this.relayChainIP + "/blockchain/smartcontract/0x3024D80C182066756411af08D07cCe34e5D2526d"
            );

            console.log("localAvgTV.data.result = " + localAvgTV.data.result);
            console.log("relayChainAvgTV.data.result = " + relayChainAvgTV.data.result);
            alert(localAvgTV.data.result === relayChainAvgTV.data.result);
        },

    },
    mounted() {
        this.init();
    },
}).mount("#app");