// Sources noted in chat. Bundle conforms to your DeviceBundle shape.
export const ROG_ALLY_X = {
    id: "rog-ally-x",
    specs: {
        id: "rog-ally-x",
        name: "ROG Ally X",
        soc: "Ryzen Z1 Extreme",
        cpuCores: 8,
        igpu: "RDNA3 (12 CUs)",
        gpuCores: 12,
        batteryWh: 80,
        screen: { size: 7.0, res: "1920×1080", refresh: 120, type: "IPS" },
        memory: "24GB LPDDR5X-7500",
        memoryOptions: [24],
        storage: "1TB NVMe",
        weight: 678,
        price: 799,
        notes: "24GB LPDDR5X; 7\" 120Hz FHD; 80Wh battery.",
    },
    cpu: {
        name: "Ryzen Z1 Extreme",
        arch: "Zen 4",
        cores: 8,
        threads: 16,
        tdp: "9–30W",
        igpuModel: "RDNA3 (12 CUs)",
        process: "4nm",
    },
    igpu: {
        name: "RDNA3 (12 CUs)",
        arch: "RDNA3",
        cores: 12,
        maxFreq: 2700,
        memType: "LPDDR5X",
        notes: "Shared memory (LPDDR5X-7500).",
    },
    games: [
        { id: "cyberpunk1080pLow", label: "Cyberpunk 2077 — 1080p Low (FSR2)" },
        { id: "eldenring1080pMed", label: "Elden Ring — 1080p Medium" },
        { id: "fortnite1080pPerf", label: "Fortnite — 1080p Performance" },
    ],
    wattages: [10, 15, 25, 30],
    perfAvg: {},   // TODO: fill with your measured data
    perfP1: {},   // TODO: fill with your measured data
    reviews: [],
};
