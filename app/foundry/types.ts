export type Wattage = number;

export type GameOption = {
    id: string;          // e.g., "cyberpunk1080pLow"
    label: string;       // e.g., "Cyberpunk 2077 — 1080p Low (FSR2)"
};

export type DeviceSpecs = {
    id: string;          // "rog-ally-x"
    name: string;        // "ROG Ally X"
    soc: string;         // "Ryzen Z1 Extreme"
    cpuCores: number;
    igpu: string;        // "RDNA3 (12 CUs)"
    gpuCores: number;
    batteryWh: number;
    screen: {
        size: number;
        res: string;       // "1920×1080"
        refresh: number;   // 120
        type: string;      // "IPS"
    };
    memory: string;      // e.g., "24GB LPDDR5X"
    memoryOptions?: number[];
    storage: string;     // "1TB NVMe"
    weight: number;      // grams
    price: number;       // USD
    notes?: string;
};

export type Processor = {
    name: string;
    arch: string;
    cores: number;
    threads: number;
    tdp: string;         // "9–30W"
    igpuModel: string;
    process: string;     // "4nm"
};

export type IGPU = {
    name: string;
    arch: string;
    cores: number;
    maxFreq: number;     // MHz
    memType: string;
    notes?: string;
};

// perf[gameId][wattage] = fps
export type PerfTable = Record<string, Record<Wattage, number>>;

export type Review = {
    source: string;      // "The Foundry"
    url?: string;
    date?: string;       // "2025-07-21"
    summary: string;
    pros?: string[];
    cons?: string[];
    rating?: number;     // 0..10 or 0..5—your call
};

export type DeviceBundle = {
    id: string;
    specs: DeviceSpecs;
    cpu: Processor;
    igpu: IGPU;
    games: GameOption[];           // *only* games this device actually has data for
    wattages: Wattage[];           // sorted unique list
    perfAvg: PerfTable;            // average FPS
    perfP1: PerfTable;             // 1% lows
    reviews: Review[];
};
