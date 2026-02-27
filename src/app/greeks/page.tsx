"use client";

import { useState, useMemo } from "react";
import Slider from "@/components/Slider";
import KaTeX from "@/components/KaTeX";
import PlotlyChart from "@/components/PlotlyChart";
import {
  delta,
  gamma,
  theta,
  vega,
  rho,
  type BSInputs,
} from "@/lib/black-scholes";

type GreekName = "delta" | "gamma" | "theta" | "vega" | "rho";

interface GreekInfo {
  name: GreekName;
  symbol: string;
  formula: string;
  description: string;
  fn: (inputs: BSInputs, type: "call" | "put") => number;
  color: string;
}

const greeks: GreekInfo[] = [
  {
    name: "delta",
    symbol: "\\Delta",
    formula: "\\Delta_{\\text{call}} = N(d_1), \\quad \\Delta_{\\text{put}} = N(d_1) - 1",
    description:
      "Rate of change of option price with respect to the underlying. Measures directional exposure.",
    fn: delta,
    color: "#34d399",
  },
  {
    name: "gamma",
    symbol: "\\Gamma",
    formula: "\\Gamma = \\frac{\\phi(d_1)}{S\\sigma\\sqrt{T}}",
    description:
      "Rate of change of delta with respect to the underlying. Measures convexity of the option position.",
    fn: (inputs) => gamma(inputs),
    color: "#f59e0b",
  },
  {
    name: "theta",
    symbol: "\\Theta",
    formula:
      "\\Theta_{\\text{call}} = -\\frac{S\\phi(d_1)\\sigma}{2\\sqrt{T}} - rKe^{-rT}N(d_2)",
    description:
      "Time decay. Rate of change of option price with respect to time (per calendar day).",
    fn: theta,
    color: "#f43f5e",
  },
  {
    name: "vega",
    symbol: "\\mathcal{V}",
    formula: "\\mathcal{V} = S\\phi(d_1)\\sqrt{T}",
    description:
      "Sensitivity to volatility. Change in option price per 1% change in implied volatility.",
    fn: (inputs) => vega(inputs),
    color: "#8b5cf6",
  },
  {
    name: "rho",
    symbol: "\\rho",
    formula:
      "\\rho_{\\text{call}} = KTe^{-rT}N(d_2), \\quad \\rho_{\\text{put}} = -KTe^{-rT}N(-d_2)",
    description:
      "Sensitivity to interest rates. Change in option price per 1% change in the risk-free rate.",
    fn: rho,
    color: "#06b6d4",
  },
];

export default function GreeksPage() {
  const [S, setS] = useState(100);
  const [K, setK] = useState(100);
  const [T, setT] = useState(0.5);
  const [r, setR] = useState(0.05);
  const [sigma, setSigma] = useState(0.2);
  const [selectedGreek, setSelectedGreek] = useState<GreekName>("delta");

  const greek = greeks.find((g) => g.name === selectedGreek)!;

  // Generate greek vs spot price curve
  const spotData = useMemo(() => {
    const spots: number[] = [];
    const callVals: number[] = [];
    const putVals: number[] = [];
    for (let s = Math.max(1, K * 0.5); s <= K * 1.5; s += 0.5) {
      spots.push(s);
      const inputs: BSInputs = { S: s, K, T, r, sigma };
      callVals.push(greek.fn(inputs, "call"));
      putVals.push(greek.fn(inputs, "put"));
    }
    return { spots, callVals, putVals };
  }, [K, T, r, sigma, greek]);

  // Generate greek vs time curve
  const timeData = useMemo(() => {
    const times: number[] = [];
    const callVals: number[] = [];
    const putVals: number[] = [];
    for (let t = 0.02; t <= 2; t += 0.02) {
      times.push(t);
      const inputs: BSInputs = { S, K, T: t, r, sigma };
      callVals.push(greek.fn(inputs, "call"));
      putVals.push(greek.fn(inputs, "put"));
    }
    return { times, callVals, putVals };
  }, [S, K, r, sigma, greek]);

  // Generate greek vs volatility curve
  const volData = useMemo(() => {
    const vols: number[] = [];
    const callVals: number[] = [];
    const putVals: number[] = [];
    for (let v = 0.02; v <= 1.0; v += 0.01) {
      vols.push(v);
      const inputs: BSInputs = { S, K, T, r, sigma: v };
      callVals.push(greek.fn(inputs, "call"));
      putVals.push(greek.fn(inputs, "put"));
    }
    return { vols, callVals, putVals };
  }, [S, K, T, r, greek]);

  const currentInputs: BSInputs = { S, K, T, r, sigma };
  const currentCallVal = greek.fn(currentInputs, "call");
  const currentPutVal = greek.fn(currentInputs, "put");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100 mb-2">
          Greeks Explorer
        </h1>
        <p className="text-sm text-zinc-400">
          Explore how each Greek changes with underlying parameters. Select a
          Greek and adjust the sliders.
        </p>
      </div>

      {/* Greek Selector */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {greeks.map((g) => (
          <button
            key={g.name}
            onClick={() => setSelectedGreek(g.name)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedGreek === g.name
                ? "bg-zinc-800 text-white border border-zinc-600"
                : "bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:border-zinc-700"
            }`}
          >
            <KaTeX math={g.symbol} className="mr-1.5" />
            <span className="capitalize">{g.name}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
              Parameters
            </h2>
            <Slider label="Spot (S)" value={S} min={1} max={300} step={0.5} onChange={setS} displayValue={`$${S.toFixed(2)}`} />
            <Slider label="Strike (K)" value={K} min={1} max={300} step={0.5} onChange={setK} displayValue={`$${K.toFixed(2)}`} />
            <Slider label="Time (T)" value={T} min={0.01} max={3} step={0.01} onChange={setT} unit=" yr" />
            <Slider label="Rate (r)" value={r} min={0} max={0.15} step={0.001} onChange={setR} displayValue={`${(r * 100).toFixed(1)}%`} />
            <Slider label="Vol (σ)" value={sigma} min={0.01} max={1.0} step={0.005} onChange={setSigma} displayValue={`${(sigma * 100).toFixed(1)}%`} />
          </div>

          {/* Current Values */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Current Values
            </h3>
            <div className="flex justify-between items-center">
              <span className="text-xs text-emerald-400">Call</span>
              <span className="font-mono text-sm text-zinc-200">
                {currentCallVal.toFixed(6)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-rose-400">Put</span>
              <span className="font-mono text-sm text-zinc-200">
                {currentPutVal.toFixed(6)}
              </span>
            </div>
          </div>

          {/* Formula & Description */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
            <div className="overflow-x-auto">
              <KaTeX math={greek.formula} display className="text-zinc-300" />
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {greek.description}
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="lg:col-span-3 space-y-6">
          {/* Greek vs Spot */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              <KaTeX math={greek.symbol} /> vs Spot Price
            </h3>
            <div className="h-[300px]">
              <PlotlyChart
                data={[
                  {
                    x: spotData.spots,
                    y: spotData.callVals,
                    type: "scatter",
                    mode: "lines",
                    name: "Call",
                    line: { color: "#34d399", width: 2 },
                  },
                  {
                    x: spotData.spots,
                    y: spotData.putVals,
                    type: "scatter",
                    mode: "lines",
                    name: "Put",
                    line: { color: "#f43f5e", width: 2 },
                  },
                  {
                    x: [S],
                    y: [currentCallVal],
                    type: "scatter",
                    mode: "markers",
                    name: "Current (Call)",
                    marker: { color: "#34d399", size: 8, symbol: "diamond" },
                    showlegend: false,
                  },
                  {
                    x: [S],
                    y: [currentPutVal],
                    type: "scatter",
                    mode: "markers",
                    name: "Current (Put)",
                    marker: { color: "#f43f5e", size: 8, symbol: "diamond" },
                    showlegend: false,
                  },
                ]}
                layout={{
                  xaxis: { title: "Spot Price ($)" },
                  yaxis: { title: greek.name.charAt(0).toUpperCase() + greek.name.slice(1) },
                  showlegend: true,
                  legend: { x: 0.01, y: 0.99, bgcolor: "transparent", font: { color: "#a1a1aa" } },
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Greek vs Time */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                <KaTeX math={greek.symbol} /> vs Time to Expiry
              </h3>
              <div className="h-[280px]">
                <PlotlyChart
                  data={[
                    {
                      x: timeData.times,
                      y: timeData.callVals,
                      type: "scatter",
                      mode: "lines",
                      name: "Call",
                      line: { color: "#34d399", width: 2 },
                    },
                    {
                      x: timeData.times,
                      y: timeData.putVals,
                      type: "scatter",
                      mode: "lines",
                      name: "Put",
                      line: { color: "#f43f5e", width: 2 },
                    },
                  ]}
                  layout={{
                    xaxis: { title: "Time (years)" },
                    yaxis: { title: greek.name },
                    showlegend: false,
                  }}
                />
              </div>
            </div>

            {/* Greek vs Volatility */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                <KaTeX math={greek.symbol} /> vs Volatility
              </h3>
              <div className="h-[280px]">
                <PlotlyChart
                  data={[
                    {
                      x: volData.vols.map((v) => v * 100),
                      y: volData.callVals,
                      type: "scatter",
                      mode: "lines",
                      name: "Call",
                      line: { color: "#34d399", width: 2 },
                    },
                    {
                      x: volData.vols.map((v) => v * 100),
                      y: volData.putVals,
                      type: "scatter",
                      mode: "lines",
                      name: "Put",
                      line: { color: "#f43f5e", width: 2 },
                    },
                  ]}
                  layout={{
                    xaxis: { title: "Volatility (%)" },
                    yaxis: { title: greek.name },
                    showlegend: false,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
