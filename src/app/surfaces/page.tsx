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
  blackScholes,
  type BSInputs,
} from "@/lib/black-scholes";

type MetricName = "price" | "delta" | "gamma" | "theta" | "vega" | "rho";
type AxisPair = "strike-time" | "strike-vol" | "spot-vol";

const metricFns: Record<
  MetricName,
  (inputs: BSInputs, type: "call" | "put") => number
> = {
  price: (inputs, type) => {
    const r = blackScholes(inputs);
    return type === "call" ? r.callPrice : r.putPrice;
  },
  delta,
  gamma: (inputs) => gamma(inputs),
  theta,
  vega: (inputs) => vega(inputs),
  rho,
};

export default function SurfacesPage() {
  const [S, setS] = useState(100);
  const [K, setK] = useState(100);
  const [T, setT] = useState(0.5);
  const [r, setR] = useState(0.05);
  const [sigma, setSigma] = useState(0.2);
  const [metric, setMetric] = useState<MetricName>("delta");
  const [axisPair, setAxisPair] = useState<AxisPair>("strike-time");
  const [optionType, setOptionType] = useState<"call" | "put">("call");

  const surfaceData = useMemo(() => {
    const fn = metricFns[metric];
    const gridSize = 50;

    let xVals: number[] = [];
    let yVals: number[] = [];
    let zGrid: number[][] = [];
    let xLabel = "";
    let yLabel = "";

    if (axisPair === "strike-time") {
      xLabel = "Strike ($)";
      yLabel = "Time (years)";
      const kMin = S * 0.6;
      const kMax = S * 1.4;
      const tMin = 0.05;
      const tMax = 2.0;
      for (let i = 0; i <= gridSize; i++) xVals.push(kMin + (i / gridSize) * (kMax - kMin));
      for (let j = 0; j <= gridSize; j++) yVals.push(tMin + (j / gridSize) * (tMax - tMin));
      for (let j = 0; j <= gridSize; j++) {
        const row: number[] = [];
        for (let i = 0; i <= gridSize; i++) {
          row.push(fn({ S, K: xVals[i], T: yVals[j], r, sigma }, optionType));
        }
        zGrid.push(row);
      }
    } else if (axisPair === "strike-vol") {
      xLabel = "Strike ($)";
      yLabel = "Volatility (%)";
      const kMin = S * 0.6;
      const kMax = S * 1.4;
      const vMin = 5;
      const vMax = 80;
      for (let i = 0; i <= gridSize; i++) xVals.push(kMin + (i / gridSize) * (kMax - kMin));
      for (let j = 0; j <= gridSize; j++) yVals.push(vMin + (j / gridSize) * (vMax - vMin));
      for (let j = 0; j <= gridSize; j++) {
        const row: number[] = [];
        for (let i = 0; i <= gridSize; i++) {
          row.push(fn({ S, K: xVals[i], T, r, sigma: yVals[j] / 100 }, optionType));
        }
        zGrid.push(row);
      }
    } else {
      // spot-vol
      xLabel = "Spot ($)";
      yLabel = "Volatility (%)";
      const sMin = K * 0.5;
      const sMax = K * 1.5;
      const vMin = 5;
      const vMax = 80;
      for (let i = 0; i <= gridSize; i++) xVals.push(sMin + (i / gridSize) * (sMax - sMin));
      for (let j = 0; j <= gridSize; j++) yVals.push(vMin + (j / gridSize) * (vMax - vMin));
      for (let j = 0; j <= gridSize; j++) {
        const row: number[] = [];
        for (let i = 0; i <= gridSize; i++) {
          row.push(fn({ S: xVals[i], K, T, r, sigma: yVals[j] / 100 }, optionType));
        }
        zGrid.push(row);
      }
    }

    return { xVals, yVals, zGrid, xLabel, yLabel };
  }, [S, K, T, r, sigma, metric, axisPair, optionType]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100 mb-2">
          Greeks Surface Plots
        </h1>
        <p className="text-sm text-zinc-400">
          3D surface and heatmap visualizations showing how Greeks vary across
          two parameters simultaneously.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-4">
          {/* Metric selector */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Metric
            </h2>
            <div className="grid grid-cols-2 gap-1.5">
              {(["price", "delta", "gamma", "theta", "vega", "rho"] as MetricName[]).map(
                (m) => (
                  <button
                    key={m}
                    onClick={() => setMetric(m)}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                      metric === m
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-zinc-800/50 text-zinc-400 border border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    {m}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Axis pair */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Surface Axes
            </h2>
            {(["strike-time", "strike-vol", "spot-vol"] as AxisPair[]).map((a) => (
              <button
                key={a}
                onClick={() => setAxisPair(a)}
                className={`block w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  axisPair === a
                    ? "bg-zinc-800 text-zinc-200 border border-zinc-600"
                    : "text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50"
                }`}
              >
                {a === "strike-time"
                  ? "Strike vs Time"
                  : a === "strike-vol"
                  ? "Strike vs Volatility"
                  : "Spot vs Volatility"}
              </button>
            ))}
          </div>

          {/* Call/Put */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Option Type
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setOptionType("call")}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium ${
                  optionType === "call"
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-zinc-800/50 text-zinc-400 border border-zinc-800"
                }`}
              >
                Call
              </button>
              <button
                onClick={() => setOptionType("put")}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium ${
                  optionType === "put"
                    ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                    : "bg-zinc-800/50 text-zinc-400 border border-zinc-800"
                }`}
              >
                Put
              </button>
            </div>
          </div>

          {/* Fixed params */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-4">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Fixed Parameters
            </h2>
            <Slider label="Spot (S)" value={S} min={1} max={300} step={1} onChange={setS} displayValue={`$${S}`} />
            <Slider label="Strike (K)" value={K} min={1} max={300} step={1} onChange={setK} displayValue={`$${K}`} />
            <Slider label="Time (T)" value={T} min={0.05} max={3} step={0.05} onChange={setT} unit=" yr" />
            <Slider label="Rate (r)" value={r} min={0} max={0.15} step={0.005} onChange={setR} displayValue={`${(r * 100).toFixed(1)}%`} />
            <Slider label="Vol (σ)" value={sigma} min={0.05} max={1.0} step={0.01} onChange={setSigma} displayValue={`${(sigma * 100).toFixed(0)}%`} />
          </div>
        </div>

        {/* Surface Plot */}
        <div className="lg:col-span-3 space-y-6">
          {/* 3D Surface */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              3D Surface
            </h3>
            <div className="h-[500px]">
              <PlotlyChart
                data={[
                  {
                    x: surfaceData.xVals,
                    y: surfaceData.yVals,
                    z: surfaceData.zGrid,
                    type: "surface",
                    colorscale: "Viridis",
                    showscale: true,
                    colorbar: {
                      tickfont: { color: "#a1a1aa", size: 10 },
                      title: { text: metric, font: { color: "#a1a1aa", size: 11 } },
                    },
                  },
                ]}
                layout={{
                  scene: {
                    xaxis: {
                      title: surfaceData.xLabel,
                      gridcolor: "#27272a",
                      color: "#71717a",
                    },
                    yaxis: {
                      title: surfaceData.yLabel,
                      gridcolor: "#27272a",
                      color: "#71717a",
                    },
                    zaxis: {
                      title: metric.charAt(0).toUpperCase() + metric.slice(1),
                      gridcolor: "#27272a",
                      color: "#71717a",
                    },
                    bgcolor: "transparent",
                    camera: { eye: { x: 1.5, y: 1.5, z: 1.2 } },
                  },
                  margin: { t: 20, r: 20, b: 20, l: 20 },
                }}
                config={{ displayModeBar: true, responsive: true }}
              />
            </div>
          </div>

          {/* Heatmap */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Heatmap View
            </h3>
            <div className="h-[400px]">
              <PlotlyChart
                data={[
                  {
                    x: surfaceData.xVals,
                    y: surfaceData.yVals,
                    z: surfaceData.zGrid,
                    type: "heatmap",
                    colorscale: "Viridis",
                    showscale: true,
                    colorbar: {
                      tickfont: { color: "#a1a1aa", size: 10 },
                    },
                  },
                ]}
                layout={{
                  xaxis: { title: surfaceData.xLabel },
                  yaxis: { title: surfaceData.yLabel },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
