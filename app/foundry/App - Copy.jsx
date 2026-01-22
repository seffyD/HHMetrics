"use client";
import React, { useMemo, useState } from "react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Legend,
    LineChart,
    Line,
} from "recharts";
import { DataProvider, useData } from "./dataContext";

/* =========================
   Helpers over device bundles
   ========================= */
function uniqueSorted(arr) {
    return Array.from(new Set(arr)).sort((a, b) => (a > b ? 1 : a < b ? -1 : 0));
}

function allGames(devices) {
    const map = new Map();
    for (const d of devices) for (const g of d.games) map.set(g.id, g.label);
    return Array.from(map, ([id, label]) => ({ id, label }));
}
function allWattages(devices) {
    return uniqueSorted(devices.flatMap((d) => d.wattages || []));
}

function perfAvg(dev, gameId, watt) {
    return dev?.perfAvg?.[gameId]?.[watt] ?? 0;
}
function perfP1(dev, gameId, watt) {
    return dev?.perfP1?.[gameId]?.[watt] ?? 0;
}

function devicesByCPU(devices, cpuName) {
    return devices.filter((d) => d.specs.soc === cpuName);
}
function devicesByIGPU(devices, igpuName) {
    return devices.filter((d) => d.specs.igpu === igpuName);
}

function averagedFpsForDevices(devs, gameId, watt, useP1 = false) {
    const vals = devs
        .map((d) => (useP1 ? perfP1(d, gameId, watt) : perfAvg(d, gameId, watt)))
        .filter((n) => typeof n === "number");
    if (!vals.length) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/* =========================
   Small UI primitives
   ========================= */
function Badge({ children }) {
    return (
        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium">
            {children}
        </span>
    );
}

function Stat({ label, value, subtle }) {
    return (
        <div className="flex flex-col">
            <span className={`text-xs ${subtle ? "text-gray-500" : "text-gray-600"}`}>{label}</span>
            <span className="text-sm font-semibold">{value}</span>
        </div>
    );
}

function Card({ children, className = "" }) {
    return (
        <div className={`rounded-2xl border bg-white/70 shadow-sm backdrop-blur p-4 ${className}`}>
            {children}
        </div>
    );
}

function Section({ title, actions, children }) {
    return (
        <section className="space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{title}</h2>
                <div className="flex gap-2">{actions}</div>
            </div>
            {children}
        </section>
    );
}

function Toolbar({ children }) {
    return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

function Input({ value, onChange, placeholder, className = "" }) {
    return (
        <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`h-9 w-full rounded-xl border px-3 text-sm outline-none focus:ring ${className}`}
        />
    );
}

function Select({ value, onChange, options, className = "" }) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`h-9 rounded-xl border bg-white px-3 text-sm outline-none focus:ring ${className}`}
        >
            {options.map((o) => (
                <option key={o.value} value={o.value}>
                    {o.label}
                </option>
            ))}
        </select>
    );
}

function Range({ value, onChange, min, max, step = 1, label }) {
    return (
        <div className="flex items-center gap-3">
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-48"
            />
            <span className="text-sm text-gray-600">
                {label}: <strong>{value}</strong>
            </span>
        </div>
    );
}

/* =========================
   Pages (bundles-aware)
   ========================= */

function DevicesPage({ onOpenReview }) {
    const { devices } = useData();

    const [query, setQuery] = useState("");
    const [soc, setSoc] = useState("all");
    const [sort, setSort] = useState("name");
    const [minBattery, setMinBattery] = useState(40);

    const socOptions = useMemo(() => {
        return [
            { value: "all", label: "All SoCs" },
            ...uniqueSorted(devices.map((d) => d.specs.soc)).map((s) => ({ value: s, label: s })),
        ];
    }, [devices]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const list = devices.filter((d) => {
            const S = d.specs;
            const matchesQ = q
                ? [S.name, S.soc, S.igpu, S.screen.res, S.screen.type]
                    .filter(Boolean)
                    .some((x) => String(x).toLowerCase().includes(q))
                : true;
            const matchesSoc = soc === "all" ? true : S.soc === soc;
            const matchesBattery = (S.batteryWh ?? 0) >= minBattery;
            return matchesQ && matchesSoc && matchesBattery;
        });

        const SORTS = {
            name: (a, b) => a.specs.name.localeCompare(b.specs.name),
            price: (a, b) => (a.specs.price ?? 0) - (b.specs.price ?? 0),
            battery: (a, b) => (b.specs.batteryWh ?? 0) - (a.specs.batteryWh ?? 0),
            weight: (a, b) => (a.specs.weight ?? 0) - (b.specs.weight ?? 0),
        };

        return list.sort(SORTS[sort]);
    }, [devices, query, soc, sort, minBattery]);

    // selection + chart controls
    const [selIds, setSelIds] = useState(() => new Set(devices.slice(0, 2).map((d) => d.id)));

    const allGameOptions = useMemo(
        () => allGames(devices).map((g) => ({ value: g.id, label: g.label })),
        [devices]
    );
    const allWattOptions = useMemo(
        () => allWattages(devices).map((w) => ({ value: String(w), label: `${w}W` })),
        [devices]
    );

    const [dvGame, setDvGame] = useState(allGameOptions[0]?.value);
    const [dvWatt, setDvWatt] = useState(
        Number(allWattOptions[1]?.value ?? allWattOptions[0]?.value ?? 10)
    );
    const [dvShowP1, setDvShowP1] = useState(true);
    const [dvChartMode, setDvChartMode] = useState("bar"); // "bar" | "line"

    function toggleDevice(id) {
        setSelIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    const selected = useMemo(() => devices.filter((d) => selIds.has(d.id)), [devices, selIds]);
    const lineWattages = useMemo(
        () => uniqueSorted(selected.flatMap((d) => d.wattages || [])),
        [selected]
    );

    const dvBarData = useMemo(() => {
        return selected.map((d) => ({
            device: d.specs.name,
            avg: perfAvg(d, dvGame, dvWatt),
            p1: perfP1(d, dvGame, dvWatt),
        }));
    }, [selected, dvGame, dvWatt]);

    const dvLineData = useMemo(() => {
        return lineWattages.map((w) => {
            const row = { watt: w };
            for (const d of selected) {
                const name = d.specs.name;
                row[name] = perfAvg(d, dvGame, w);
                if (dvShowP1) row[`${name} (1% low)`] = perfP1(d, dvGame, w);
            }
            return row;
        });
    }, [selected, dvGame, dvShowP1, lineWattages]);

    return (
        <Section
            title="Devices"
            actions={
                <Toolbar>
                    <Input value={query} onChange={setQuery} placeholder="Search devices…" />
                    <Select value={soc} onChange={setSoc} options={socOptions} />
                    <Select
                        value={sort}
                        onChange={setSort}
                        options={[
                            { value: "name", label: "Name (A→Z)" },
                            { value: "price", label: "Price (low→high)" },
                            { value: "battery", label: "Battery (high→low)" },
                            { value: "weight", label: "Weight (low→high)" },
                        ]}
                    />
                    <Range value={minBattery} onChange={setMinBattery} min={30} max={90} step={1} label="Min Wh" />
                </Toolbar>
            }
        >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((d) => {
                    const S = d.specs;
                    const hasReview = (d.reviews?.length ?? 0) > 0;
                    return (
                        <Card key={d.id}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                    <h3 className="text-base font-semibold">{S.name}</h3>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge>{S.soc}</Badge>
                                        <Badge>{S.igpu}</Badge>
                                        <Badge>
                                            {S.screen.size} {S.screen.type} {S.screen.refresh}Hz {S.screen.res}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {typeof S.price === "number" && (
                                        <div className="text-lg font-bold">${S.price}</div>
                                    )}
                                    {typeof S.weight === "number" && (
                                        <div className="text-xs text-gray-500">{S.weight} g</div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                                <Stat label="Battery" value={`${S.batteryWh} Wh`} />
                                <Stat label="Memory" value={S.memory} />
                                <Stat label="Storage" value={S.storage} />
                                <Stat label="Panel" value={S.screen.type} subtle />
                            </div>
                            {S.notes && <p className="mt-3 text-sm text-gray-600">{S.notes}</p>}
                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={() => toggleDevice(d.id)}
                                    className={`flex-1 rounded-xl border px-3 py-2 text-sm ${selIds.has(d.id) ? "bg-slate-900 text-white" : "hover:bg-slate-50"
                                        }`}
                                >
                                    {selIds.has(d.id) ? "Remove from chart" : "Add to chart"}
                                </button>
                                <button
                                    onClick={() => hasReview && onOpenReview?.(d.id)}
                                    disabled={!hasReview}
                                    aria-disabled={!hasReview}
                                    className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition border ${hasReview
                                            ? "bg-slate-900 text-white hover:bg-slate-800"
                                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        }`}
                                >
                                    {hasReview ? "Read review" : "Review coming soon"}
                                </button>
                            </div>
                        </Card>
                    );
                })}
            </div>

            <div className="mt-8 space-y-3">
                <h3 className="text-base font-semibold">Device performance</h3>
                <Toolbar>
                    <Select
                        value={dvGame}
                        onChange={setDvGame}
                        options={allGameOptions}
                    />
                    {dvChartMode === "bar" && (
                        <Select
                            value={String(dvWatt)}
                            onChange={(v) => setDvWatt(Number(v))}
                            options={allWattOptions}
                        />
                    )}
                    <button
                        onClick={() => setDvShowP1((s) => !s)}
                        className={`h-9 rounded-xl border px-3 text-sm ${dvShowP1 ? "bg-slate-900 text-white" : "hover:bg-slate-50"
                            }`}
                    >
                        {dvShowP1 ? "Hide 1% lows" : "Show 1% lows"}
                    </button>
                    <button
                        onClick={() => setDvChartMode((m) => (m === "bar" ? "line" : "bar"))}
                        className="h-9 rounded-xl border px-3 text-sm hover:bg-slate-50"
                    >
                        {dvChartMode === "bar" ? "Switch to line chart" : "Switch to bar chart"}
                    </button>
                </Toolbar>
                <Card>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            {dvChartMode === "bar" ? (
                                <BarChart
                                    data={dvBarData}
                                    layout="vertical"
                                    margin={{ top: 8, right: 16, left: 16, bottom: 8 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        type="number"
                                        tick={{ fontSize: 12 }}
                                        label={{ value: "FPS", position: "insideBottomRight", offset: -4 }}
                                    />
                                    <YAxis dataKey="device" type="category" width={160} tick={{ fontSize: 12 }} />
                                    <Tooltip formatter={(v) => [`${v} FPS`, ""]} />
                                    <Legend />
                                    <Bar dataKey="avg" name="Average FPS" />
                                    {dvShowP1 && <Bar dataKey="p1" name="1% Low FPS" />}
                                </BarChart>
                            ) : (
                                <LineChart data={dvLineData} margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="watt"
                                        tick={{ fontSize: 12 }}
                                        label={{ value: "Wattage (W)", position: "insideBottomRight", offset: -4 }}
                                    />
                                    <YAxis tick={{ fontSize: 12 }} label={{ value: "FPS", angle: -90, position: "insideLeft" }} />
                                    <Tooltip formatter={(v, n) => [`${v} FPS`, n]} />
                                    <Legend />
                                    {selected.map((d) => {
                                        const name = d.specs.name;
                                        return (
                                            <React.Fragment key={d.id}>
                                                <Line type="monotone" dataKey={name} name={`${name} (avg)`} dot={false} />
                                                {dvShowP1 && (
                                                    <Line
                                                        type="monotone"
                                                        dataKey={`${name} (1% low)`}
                                                        name={`${name} (1% low)`}
                                                        dot={false}
                                                        strokeDasharray="4 4"
                                                    />
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </LineChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                        Select devices via the cards above. Bar = selected wattage; Line = all wattages. Toggle 1% lows as needed.
                    </div>
                </Card>
            </div>
        </Section>
    );
}

function ComparePage() {
    const { devices } = useData();

    const devOpts = devices.map((d) => ({ value: d.id, label: d.specs.name }));
    const [selected, setSelected] = useState(devices.slice(0, 2).map((d) => d.id));
    const [picker, setPicker] = useState(devices[2]?.id ?? devices[0]?.id);

    const METRICS = [
        { key: "price", label: "Price", fmt: (v) => (v != null ? `$${v}` : "—"), highBetter: false },
        { key: "batteryWh", label: "Battery (Wh)", fmt: (v) => `${v} Wh`, highBetter: true },
        { key: "weight", label: "Weight (g)", fmt: (v) => `${v} g`, highBetter: false },
        { key: "cpuCores", label: "CPU Cores", highBetter: true },
        { key: "gpuCores", label: "GPU Cores", highBetter: true },
        {
            key: "memoryOptions",
            label: "Memory Capacities",
            fmt: (v) => (Array.isArray(v) ? v.map((n) => `${n}GB`).join(" / ") : v),
            noScore: true,
        },
    ];

    function addSelected() {
        if (picker && !selected.includes(picker)) setSelected((s) => [...s, picker]);
    }
    function removeSelected(id) {
        setSelected((s) => s.filter((x) => x !== id));
    }

    const selectedDevices = selected
        .map((id) => devices.find((d) => d.id === id))
        .filter(Boolean);

    function bestValue(values, highBetter) {
        if (!values || values.length === 0) return null;
        const nums = values.filter((v) => typeof v === "number");
        if (nums.length === 0) return null;
        return highBetter ? Math.max(...nums) : Math.min(...nums);
    }

    function cell(metric, bundle) {
        const S = bundle?.specs ?? {};
        const value = S[metric.key];
        const display = metric.fmt ? metric.fmt(value) : value;

        if (metric.noScore)
            return <div className="rounded-xl border px-3 py-2 text-sm">{display ?? "—"}</div>;

        const values = selectedDevices
            .map((b) => (b?.specs ? b.specs[metric.key] : undefined))
            .filter((v) => typeof v === "number");
        const best = bestValue(values, !!metric.highBetter);
        const isBest = typeof value === "number" && best !== null && value === best;

        return (
            <div className={`rounded-xl border px-3 py-2 text-sm ${isBest ? "bg-emerald-50" : ""}`}>
                {display ?? "—"}
            </div>
        );
    }

    return (
        <Section
            title="Compare Devices"
            actions={
                <Toolbar>
                    <Select value={picker ?? ""} onChange={setPicker} options={devOpts} />
                    <button
                        onClick={addSelected}
                        className="h-9 rounded-xl border px-3 text-sm font-medium hover:bg-slate-50"
                    >
                        Add
                    </button>
                </Toolbar>
            }
        >
            <div className="flex flex-wrap gap-2">
                {selectedDevices.map((d) => (
                    <span
                        key={d.id}
                        className="inline-flex items-center gap-2 rounded-xl border px-3 py-1 text-sm"
                    >
                        {d.specs.name}
                        <button
                            onClick={() => removeSelected(d.id)}
                            className="rounded-md px-1 text-xs text-gray-500 hover:bg-red-50 hover:text-red-600"
                            aria-label={`Remove ${d.specs.name}`}
                        >
                            ✕
                        </button>
                    </span>
                ))}
            </div>

            <div className="mt-4 overflow-x-auto">
                <div className="min-w-[720px]">
                    <div
                        className="grid"
                        style={{ gridTemplateColumns: `200px repeat(${selectedDevices.length}, minmax(180px, 1fr))` }}
                    >
                        <div className="py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Metric
                        </div>
                        {selectedDevices.map((d) => (
                            <div key={d.id} className="py-2 text-sm font-semibold">
                                {d.specs.name}
                            </div>
                        ))}
                        {METRICS.map((m) => (
                            <React.Fragment key={m.key}>
                                <div className="py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    {m.label}
                                </div>
                                {selectedDevices.map((d) => (
                                    <div key={d.id + m.key} className="py-2">
                                        {cell(m, d)}
                                    </div>
                                ))}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
        </Section>
    );
}

function ProcessorsPage() {
    const { devices } = useData();

    const PROCESSORS = useMemo(() => {
        const byName = new Map();
        for (const d of devices) byName.set(d.cpu.name, d.cpu);
        return Array.from(byName.values());
    }, [devices]);

    const [query, setQuery] = useState("");
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return PROCESSORS.filter((p) =>
            q ? Object.values(p).some((x) => String(x).toLowerCase().includes(q)) : true
        );
    }, [query, PROCESSORS]);

    const [selProcs, setSelProcs] = useState(() =>
        new Set(PROCESSORS.slice(0, 2).map((p) => p.name))
    );

    const allGameOptions = useMemo(
        () => allGames(devices).map((g) => ({ value: g.id, label: g.label })),
        [devices]
    );
    const allWattOptions = useMemo(
        () => allWattages(devices).map((w) => ({ value: String(w), label: `${w}W` })),
        [devices]
    );

    const [pcGame, setPcGame] = useState(allGameOptions[0]?.value);
    const [pcWatt, setPcWatt] = useState(
        Number(allWattOptions[1]?.value ?? allWattOptions[0]?.value ?? 10)
    );
    const [pcShowP1, setPcShowP1] = useState(true);
    const [pcChartMode, setPcChartMode] = useState("bar");

    function toggleProc(name) {
        setSelProcs((prev) => {
            const next = new Set(prev);
            next.has(name) ? next.delete(name) : next.add(name);
            return next;
        });
    }

    const pcBarData = useMemo(() => {
        return Array.from(selProcs).map((name) => {
            const group = devicesByCPU(devices, name);
            return {
                proc: name,
                avg: averagedFpsForDevices(group, pcGame, pcWatt, false),
                p1: averagedFpsForDevices(group, pcGame, pcWatt, true),
            };
        });
    }, [selProcs, pcGame, pcWatt, devices]);

    const lineWattages = useMemo(() => allWattages(devices), [devices]);
    const pcLineData = useMemo(() => {
        return lineWattages.map((w) => {
            const row = { watt: w };
            for (const name of selProcs) {
                const group = devicesByCPU(devices, name);
                row[`${name} (avg)`] = averagedFpsForDevices(group, pcGame, w, false);
                if (pcShowP1) row[`${name} (1% low)`] = averagedFpsForDevices(group, pcGame, w, true);
            }
            return row;
        });
    }, [selProcs, pcGame, pcShowP1, devices, lineWattages]);

    return (
        <Section
            title="Processors"
            actions={
                <Toolbar>
                    <Input value={query} onChange={setQuery} placeholder="Search processors…" />
                </Toolbar>
            }
        >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filtered.map((p) => (
                    <Card key={p.name}>
                        <div className="flex items-start justify-between">
                            <h3 className="text-base font-semibold">{p.name}</h3>
                            <Badge>{p.process}</Badge>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-3">
                            <Stat label="Arch" value={p.arch} />
                            <Stat label="Cores/Threads" value={`${p.cores}/${p.threads}`} />
                            <Stat label="TDP" value={p.tdp} />
                            <Stat label="iGPU" value={p.igpuModel} />
                        </div>
                        <div className="mt-3">
                            <button
                                onClick={() => toggleProc(p.name)}
                                className={`w-full rounded-xl border px-3 py-1.5 text-sm font-medium ${selProcs.has(p.name) ? "bg-slate-900 text-white" : "hover:bg-slate-50"
                                    }`}
                            >
                                {selProcs.has(p.name) ? "Selected for chart" : "Include in chart"}
                            </button>
                        </div>
                    </Card>
                ))}
            </div>
            <div className="mt-6 space-y-3">
                <Toolbar>
                    <Select value={pcGame} onChange={setPcGame} options={allGameOptions} />
                    {pcChartMode === "bar" && (
                        <Select
                            value={String(pcWatt)}
                            onChange={(v) => setPcWatt(Number(v))}
                            options={allWattOptions}
                        />
                    )}
                    <button
                        onClick={() => setPcShowP1((s) => !s)}
                        className={`h-9 rounded-xl border px-3 text-sm ${pcShowP1 ? "bg-slate-900 text-white" : "hover:bg-slate-50"
                            }`}
                    >
                        {pcShowP1 ? "Hide 1% lows" : "Show 1% lows"}
                    </button>
                    <button
                        onClick={() => setPcChartMode((m) => (m === "bar" ? "line" : "bar"))}
                        className="h-9 rounded-xl border px-3 text-sm hover:bg-slate-50"
                    >
                        {pcChartMode === "bar" ? "Switch to line chart" : "Switch to bar chart"}
                    </button>
                </Toolbar>
                <Card>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            {pcChartMode === "bar" ? (
                                <BarChart
                                    data={pcBarData}
                                    layout="vertical"
                                    margin={{ top: 8, right: 16, left: 16, bottom: 8 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        type="number"
                                        tick={{ fontSize: 12 }}
                                        label={{ value: "FPS", position: "insideBottomRight", offset: -4 }}
                                    />
                                    <YAxis dataKey="proc" type="category" width={190} tick={{ fontSize: 12 }} />
                                    <Tooltip formatter={(v) => [`${v} FPS`, ""]} />
                                    <Legend />
                                    <Bar dataKey="avg" name="Average FPS" />
                                    {pcShowP1 && <Bar dataKey="p1" name="1% Low FPS" />}
                                </BarChart>
                            ) : (
                                <LineChart data={pcLineData} margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="watt"
                                        tick={{ fontSize: 12 }}
                                        label={{ value: "Wattage (W)", position: "insideBottomRight", offset: -4 }}
                                    />
                                    <YAxis tick={{ fontSize: 12 }} label={{ value: "FPS", angle: -90, position: "insideLeft" }} />
                                    <Tooltip formatter={(v, n) => [`${v} FPS`, n]} />
                                    <Legend />
                                    {Array.from(selProcs).map((name) => (
                                        <React.Fragment key={name}>
                                            <Line type="monotone" dataKey={`${name} (avg)`} name={`${name} (avg)`} dot={false} />
                                            {pcShowP1 && (
                                                <Line
                                                    type="monotone"
                                                    dataKey={`${name} (1% low)`}
                                                    name={`${name} (1% low)`}
                                                    dot={false}
                                                    strokeDasharray="4 4"
                                                />
                                            )}
                                        </React.Fragment>
                                    ))}
                                </LineChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                        Values are averaged from all devices using the selected processor (by SoC name).
                    </div>
                </Card>
            </div>
        </Section>
    );
}

function IGpusPage() {
    const { devices } = useData();

    const IGPUS = useMemo(() => {
        const byName = new Map();
        for (const d of devices) byName.set(d.igpu.name, d.igpu);
        return Array.from(byName.values());
    }, [devices]);

    const [selectedIGPUs, setSelectedIGPUs] = useState(
        () => new Set(IGPUS.slice(0, 2).map((g) => g.name))
    );

    const allGameOptions = useMemo(
        () => allGames(devices).map((g) => ({ value: g.id, label: g.label })),
        [devices]
    );
    const allWattOptions = useMemo(
        () => allWattages(devices).map((w) => ({ value: String(w), label: `${w}W` })),
        [devices]
    );

    const [game, setGame] = useState(allGameOptions[0]?.value);
    const [wattage, setWattage] = useState(
        Number(allWattOptions[1]?.value ?? allWattOptions[0]?.value ?? 10)
    );
    const [showP1, setShowP1] = useState(true);
    const [chartMode, setChartMode] = useState("bar");

    function toggleIGPU(name) {
        setSelectedIGPUs((prev) => {
            const next = new Set(prev);
            next.has(name) ? next.delete(name) : next.add(name);
            return next;
        });
    }

    const barData = useMemo(() => {
        return Array.from(selectedIGPUs).map((name) => {
            const group = devicesByIGPU(devices, name);
            return {
                igpu: name,
                avg: averagedFpsForDevices(group, game, wattage, false),
                p1: averagedFpsForDevices(group, game, wattage, true),
            };
        });
    }, [selectedIGPUs, game, wattage, devices]);

    const lineWattages = useMemo(() => allWattages(devices), [devices]);
    const lineData = useMemo(() => {
        return lineWattages.map((w) => {
            const obj = { watt: w };
            for (const name of selectedIGPUs) {
                const group = devicesByIGPU(devices, name);
                obj[`${name} (avg)`] = averagedFpsForDevices(group, game, w, false);
                if (showP1) obj[`${name} (1% low)`] = averagedFpsForDevices(group, game, w, true);
            }
            return obj;
        });
    }, [selectedIGPUs, game, showP1, devices, lineWattages]);

    return (
        <Section title="Integrated GPUs (averaged by iGPU)">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {IGPUS.map((g) => (
                    <Card key={g.name}>
                        <div className="flex items-start justify-between">
                            <h3 className="text-base font-semibold">{g.name}</h3>
                            <Badge>{g.arch}</Badge>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-3">
                            <Stat label="Cores" value={g.cores} />
                            <Stat label="Max Freq" value={`${g.maxFreq} MHz`} />
                            <Stat label="Memory" value={g.memType} />
                        </div>
                        {g.notes && <p className="mt-3 text-sm text-gray-600">{g.notes}</p>}
                        <div className="mt-3">
                            <button
                                onClick={() => toggleIGPU(g.name)}
                                className={`w-full rounded-xl border px-3 py-1.5 text-sm font-medium ${selectedIGPUs.has(g.name) ? "bg-slate-900 text-white" : "hover:bg-slate-50"
                                    }`}
                            >
                                {selectedIGPUs.has(g.name) ? "Selected for chart" : "Include in chart"}
                            </button>
                        </div>
                    </Card>
                ))}
            </div>
            <div className="mt-6 space-y-3">
                <Toolbar>
                    <Select value={game} onChange={setGame} options={allGameOptions} />
                    {chartMode === "bar" && (
                        <Select
                            value={String(wattage)}
                            onChange={(v) => setWattage(Number(v))}
                            options={allWattOptions}
                        />
                    )}
                    <button
                        onClick={() => setShowP1((s) => !s)}
                        className={`h-9 rounded-xl border px-3 text-sm ${showP1 ? "bg-slate-900 text-white" : "hover:bg-slate-50"
                            }`}
                    >
                        {showP1 ? "Hide 1% lows" : "Show 1% lows"}
                    </button>
                    <button
                        onClick={() => setChartMode((m) => (m === "bar" ? "line" : "bar"))}
                        className="h-9 rounded-xl border px-3 text-sm hover:bg-slate-50"
                    >
                        {chartMode === "bar" ? "Switch to line chart" : "Switch to bar chart"}
                    </button>
                </Toolbar>
                <Card>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            {chartMode === "bar" ? (
                                <BarChart data={barData} layout="vertical" margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        type="number"
                                        tick={{ fontSize: 12 }}
                                        label={{ value: "FPS", position: "insideBottomRight", offset: -4 }}
                                    />
                                    <YAxis dataKey="igpu" type="category" width={160} tick={{ fontSize: 12 }} />
                                    <Tooltip formatter={(v) => [`${v} FPS`, ""]} />
                                    <Legend />
                                    <Bar dataKey="avg" name="Average FPS" />
                                    {showP1 && <Bar dataKey="p1" name="1% Low FPS" />}
                                </BarChart>
                            ) : (
                                <LineChart data={lineData} margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="watt"
                                        tick={{ fontSize: 12 }}
                                        label={{ value: "Wattage (W)", position: "insideBottomRight", offset: -4 }}
                                    />
                                    <YAxis tick={{ fontSize: 12 }} label={{ value: "FPS", angle: -90, position: "insideLeft" }} />
                                    <Tooltip formatter={(v, n) => [`${v} FPS`, n]} />
                                    <Legend />
                                    {Array.from(selectedIGPUs).map((name) => (
                                        <React.Fragment key={name}>
                                            <Line type="monotone" dataKey={`${name} (avg)`} name={`${name} (avg)`} dot={false} />
                                            {showP1 && (
                                                <Line
                                                    type="monotone"
                                                    dataKey={`${name} (1% low)`}
                                                    name={`${name} (1% low)`}
                                                    dot={false}
                                                    strokeDasharray="4 4"
                                                />
                                            )}
                                        </React.Fragment>
                                    ))}
                                </LineChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                        Values are averaged from all devices using each iGPU.
                    </div>
                </Card>
            </div>
        </Section>
    );
}

function ReviewsPage({ filterDeviceId }) {
    const { devices } = useData();

    const ALL = useMemo(() => {
        const rows = [];
        for (const d of devices) {
            for (const r of d.reviews ?? []) {
                rows.push({
                    ...r,
                    deviceId: d.id,
                    deviceName: d.specs.name,
                });
            }
        }
        return rows;
    }, [devices]);

    const [query, setQuery] = useState("");
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        let base = ALL;
        if (filterDeviceId) base = base.filter((r) => r.deviceId === filterDeviceId);
        return base.filter((r) =>
            q ? String(r.title ?? r.summary ?? "").toLowerCase().includes(q) : true
        );
    }, [ALL, query, filterDeviceId]);

    return (
        <Section
            title="Reviews"
            actions={<Toolbar><Input value={query} onChange={setQuery} placeholder="Search reviews…" /></Toolbar>}
        >
            <div className="space-y-4">
                {filtered.map((r, i) => (
                    <Card key={`${r.deviceId}-${i}`}>
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-base font-semibold">{r.title ?? r.source}</h3>
                                <p className="mt-1 text-xs text-gray-500">{r.deviceName}</p>
                                <p className="mt-2 text-sm text-gray-700">{r.summary}</p>
                            </div>
                            <div className="text-right">
                                {r.date && <div className="text-sm text-gray-500">{new Date(r.date).toLocaleDateString()}</div>}
                                {typeof r.rating === "number" && (
                                    <div className="text-lg font-bold">
                                        {"★".repeat(Math.round(r.rating))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
                {filtered.length === 0 && (
                    <Card>
                        <p className="text-sm text-gray-600">No reviews yet. Add some!</p>
                    </Card>
                )}
            </div>
        </Section>
    );
}

/* =========================
   Nav & App
   ========================= */
const PAGES = [
    { id: "devices", label: "Devices", component: DevicesPage },
    { id: "compare", label: "Compare", component: ComparePage },
    { id: "processors", label: "Processors", component: ProcessorsPage },
    { id: "igpus", label: "iGPUs", component: IGpusPage },
    { id: "reviews", label: "Reviews", component: ReviewsPage },
];

export default function App() {
    const [page, setPage] = useState("devices");
    const [reviewFilter, setReviewFilter] = useState(null);

    function openReviewForDevice(deviceId) {
        setReviewFilter(deviceId);
        setPage("reviews");
    }

    return (
        <DataProvider>
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
                <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
                    <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-xl bg-slate-900" />
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    The Foundry
                                </div>
                                <h1 className="text-lg font-bold">Handhelds</h1>
                            </div>
                        </div>
                        <nav className="flex flex-wrap items-center gap-1">
                            {PAGES.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => {
                                        setPage(p.id);
                                        if (p.id !== "reviews") setReviewFilter(null);
                                    }}
                                    className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${page === p.id ? "bg-slate-900 text-white" : "hover:bg-slate-100"
                                        }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </header>

                <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
                    {page === "devices" && <DevicesPage onOpenReview={openReviewForDevice} />}
                    {page === "compare" && <ComparePage />}
                    {page === "processors" && <ProcessorsPage />}
                    {page === "igpus" && <IGpusPage />}
                    {page === "reviews" && <ReviewsPage filterDeviceId={reviewFilter} />}
                    <footer className="py-8 text-center text-xs text-gray-500">
                        © {new Date().getFullYear()} The Foundry • Built for fast comparisons and clean reviews.
                    </footer>
                </main>
            </div>
        </DataProvider>
    );
}
