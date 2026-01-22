import { DeviceBundle } from "../types";

export const GPD_WIN_MAX_2: DeviceBundle = {
    id: "gpd-win-max-2",
    specs: {
        id: "gpd-win-max-2",
        name: "GPD WIN Max 2 (2024)",
        soc: "Ryzen 7 8840U",
        cpuCores: 8,
        igpu: "RDNA3 (12 CUs)",
        gpuCores: 12,
        batteryWh: 67,
        screen: { size: 10.1, res: "2560×1600", refresh: 60, type: "IPS" },
        memory: "32 GB LPDDR5X",
        memoryOptions: [32],
        storage: "2 TB NVMe",
        weight: 1000,
        price: 1199,
        notes: "Larger 10-inch clamshell form factor with keyboard; great thermals.",
    },
    cpu: {
        name: "Ryzen 7 8840U",
        arch: "Zen 4",
        cores: 8,
        threads: 16,
        tdp: "15–30 W",
        igpuModel: "RDNA3 (12 CUs)",
        process: "4 nm",
    },
    igpu: {
        name: "RDNA3 (12 CUs)",
        arch: "RDNA3",
        cores: 12,
        maxFreq: 2700,
        memType: "LPDDR5X",
        notes: "Shared with Ryzen Z1 Extreme — strong iGPU efficiency.",
    },
    games: [
        { id: "cyberpunk1080pLow", label: "Cyberpunk 2077 — 1080p Low (FSR2)" },
        { id: "eldenring1080pMed", label: "Elden Ring — 1080p Medium" },
        { id: "fortnite1080pPerf", label: "Fortnite — 1080p Performance" },
    ],
    wattages: [10, 15, 25, 30],
    perfAvg: {
        cyberpunk1080pLow: { 10: 43, 15: 56, 25: 71, 30: 79 },
        eldenring1080pMed: { 10: 49, 15: 59, 25: 74, 30: 82 },
        fortnite1080pPerf: { 10: 86, 15: 111, 25: 141, 30: 156 },
    },
    perfP1: {
        cyberpunk1080pLow: { 10: 31, 15: 41, 25: 53, 30: 59 },
        eldenring1080pMed: { 10: 36, 15: 43, 25: 54, 30: 61 },
        fortnite1080pPerf: { 10: 66, 15: 84, 25: 106, 30: 119 },
    },
    reviews: [
        {
            source: "The Foundry",
            date: "2025-04-10",
            summary:
                "Excellent keyboard-style handheld with a crisp 10-inch panel and strong thermals. Slightly bulky but ideal for productivity crossover.",
            pros: ["Comfortable keyboard", "High-resolution screen", "Good sustained performance"],
            cons: ["Large footprint", "Lower refresh rate"],
            rating: 8.7,
        },
    ],
};
