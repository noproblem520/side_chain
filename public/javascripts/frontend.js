Vue.createApp({
    data() {
        return {
            message: "Hello Vue!",
            nodeTrustValue: [],
            metrics: [],
            nodeData: [],
            TE: [],
        };
    },
    methods: {
        init: async function () {
            let latestTVAry = await axios.get(
                "http://127.0.0.1:3000/blockchain/getLatestTVAry"
            );

            this.nodeTrustValue = [
                { id: "node1" },
                { id: "node2" },
                { id: "node3" },
                { id: "node4" },
                { id: "node5" },
            ];
            for (i in latestTVAry.data.result) {
                this.nodeTrustValue[i].trustValue = latestTVAry.data.result[i];
            }

            this.metrics = [
                { name: "Discarded transactions/10mins", value: 6 },
                { name: "Consistency in latest block hashes", value: 1 },
                { name: "Transaction throughput", value: 20 },
                { name: "Outstanding transactions", value: 0 },
            ];
            this.nodesData = [
                {
                    id: "node1",
                    cpu: "28%",
                    memory: "41%",
                    storage: "20%",
                    latency: "49ms",
                    availability: "1",
                },
                {
                    id: "node2",
                    cpu: "32%",
                    memory: "37%",
                    storage: "18%",
                    latency: "53ms",
                    availability: "1",
                },
                {
                    id: "node3",
                    cpu: "33%",
                    memory: "35%",
                    storage: "15%",
                    latency: "68ms",
                    availability: "1",
                },
                {
                    id: "node4",
                    cpu: "27%",
                    memory: "35%",
                    storage: "14%",
                    latency: "55ms",
                    availability: "1",
                },
                {
                    id: "node5",
                    cpu: "35%",
                    memory: "38%",
                    storage: "18%",
                    latency: "57ms",
                    availability: "1",
                },
            ];
        },
    },
    mounted() {
        this.init();
    },
}).mount("#app");
