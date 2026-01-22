"use client";
import React, { createContext, useContext } from "react";
import { DEVICE_REGISTRY, DEVICES_LIST } from "./data/index";
import type { DeviceBundle } from "./types";

type DataCtxValue = {
    registry: Record<string, DeviceBundle>;
    devices: DeviceBundle[];
};

const DataCtx = createContext<DataCtxValue | null>(null);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
    const value: DataCtxValue = { registry: DEVICE_REGISTRY, devices: DEVICES_LIST };
    return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
};

export const useData = () => {
    const ctx = useContext(DataCtx);
    if (!ctx) throw new Error("useData must be used within DataProvider");
    return ctx;
};