"use client";

import { useState, useMemo } from "react";
import Slider from "@/components/Slider";
import PlotlyChart from "@/components/PlotlyChart";
import {
  payoffCurve,
  longCall,
  longPut,
  longStraddle,
  longStrangle,
  butterflySpread,
  ironCondor,
  blackScholes,
  type OptionLeg,
} from "@/lib/black-scholes";

type Strategy =
  | "long-call"
  | "long-put"
  | "short-call"
  | "short-put"
  | "long-straddle"
  | "long-strangle"
  | "butterfly"
  | "iron-condor"
  | "custom";

interface StrategyInfo {
  id: Strategy;
  name: string;
  description: string;
}

const strategies: StrategyInfo[] = [
  { id: "long-call", name: "Long Call", description: "Buy a call option. Max loss is the premium paid. Unlimited upside." },
  { id: "long-put", name: "Long Put", description: "Buy a put option. Max loss is the premium paid. Profit when underlying falls." },
  { id: "short-call", name: "Short Call", description: "Sell a call option. Collect premium. Unlimited downside risk." },
  { id: "short-put", name: "Short Put", description: "Sell a put option. Collect premium. Risk if underlying drops to zero." },
  { id: "long-straddle", name: "Long Straddle", description: "Buy a call and put at the same strike. Profit from large moves in either direction." },
  { id: "long-strangle", name: "Long Strangle", description: "Buy an OTM call and OTM put. Cheaper than straddle, needs larger move to profit." },
  { id: "butterfly", name: "Butterfly Spread", description: "Buy 1 low-strike call, sell 2 ATM calls, buy 1 high-strike call. Profit near the center strike." },
  { id: "iron-condor", name: "Iron Condor", description: "Sell an OTM put spread and OTM call spread. Profit if underlying stays in a range." },
];

function buildLegs(
  strategy: Strategy,
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  K2Offset: number
): OptionLeg[] {
  switch (strategy) {
    case "long-call":
      return longCall(S, K, T, r, sigma);
    case "long-put":
      return longPut(S, K, T, r, sigma);
    case "short-call":
      return longCall(S, K, T, r, sigma).map((l) => ({ ...l, quantity: -l.quantity }));
    case "short-put":
      return longPut(S, K, T, r, sigma).map((l) => ({ ...l, quantity: -l.quantity }));
    case "long-straddle":
      return longStraddle(S, K, T, r, sigma);
    case "long-strangle":
      return longStrangle(S, K - K2Offset, K + K2Offset, T, r, sigma);
    case "butterfly":
      return butterflySpread(S, K - K2Offset, K, K + K2Offset, T, r, sigma);
    case "iron-condor":
      return ironCondor(
        S,
        K - K2Offset * 2,
        K - K2Offset,
        K + K2Offset,
        K + K2Offset * 2,
        T,
        r,
        sigma
      );
    default:
      return longCall(S, K, T, r, sigma);
  }
}

export default function PayoffsPage() {
  const [S, setS] = useState(100);
  const [K, setK] = useState(100);
  const [T, setT] = useState(0.5);
  const [r, setR] = useState(0.05);
  const [sigma, setSigma] = useState(0.2);
  const [strategy, setStrategy] = useState<Strategy>("long-call");
  const [K2Offset, setK2Offset] = useState(10);

  const needsOffset = ["long-strangle", "butterfly", "iron-condor"].includes(strategy);

  const legs = useMemo(
    () => buildLegs(strategy, S, K, T, r, sigma, K2Offset),
    [strategy, S, K, T, r, sigma, K2Offset]
  );

  const data = useMemo(() => {
    const spotMin = K * 0.5;
    const spotMax = K * 1.5;
    return payoffCurve(legs, spotMin, spotMax, 300);
  }, [legs, K]);

  // Also compute the pre-expiry P&L for multiple times
  const preExpiryData = useMemo(() => {
    const spotMin = K * 0.5;
    const spotMax = K * 1.5;
    const times = [T, T * 0.75, T * 0.5, T * 0.25, 0.01];
    const labels = ["Now", "75% T left", "50% T left", "25% T left", "At Expiry"];
    const colors = ["#8b5cf6", "#06b6d4", "#f59e0b", "#f43f5e", "#34d399"];

    return times.map((t, idx) => {
      const spots: number[] = [];
      const pnls: number[] = [];
      const stepSize = (spotMax - spotMin) / 200;

      for (let i = 0; i <= 200; i++) {
        const spot = spotMin + i * stepSize;
        spots.push(spot);

        let totalPnl = 0;
        for (const leg of legs) {
          const price =
            t > 0.001
              ? leg.type === "call"
                ? blackScholes({ S: spot, K: leg.strike, T: t, r, sigma }).callPrice
                : blackScholes({ S: spot, K: leg.strike, T: t, r, sigma }).putPrice
              : leg.type === "call"
              ? Math.max(spot - leg.strike, 0)
              : Math.max(leg.strike - spot, 0);
          totalPnl += leg.quantity * (price - leg.premium);
        }
        pnls.push(totalPnl);
      }

      return { spots, pnls, label: labels[idx], color: colors[idx] };
    });
  }, [legs, K, T, r, sigma]);

  const totalPremium = legs.reduce(
    (sum, leg) => sum + leg.quantity * leg.premium,
    0
  );

  const maxProfit = Math.max(...data.map((d) => d.pnl));
  const maxLoss = Math.min(...data.map((d) => d.pnl));

  // Find breakeven points
  const breakevens: number[] = [];
  for (let i = 1; i < data.length; i++) {
    if (
      (data[i - 1].pnl < 0 && data[i].pnl >= 0) ||
      (data[i - 1].pnl >= 0 && data[i].pnl < 0)
    ) {
      // Linear interpolation
      const x1 = data[i - 1].spot;
      const x2 = data[i].spot;
      const y1 = data[i - 1].pnl;
      const y2 = data[i].pnl;
      breakevens.push(x1 + (-y1 * (x2 - x1)) / (y2 - y1));
    }
  }

  const currentInfo = strategies.find((s) => s.id === strategy);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100 mb-2">
          Payoff Diagrams
        </h1>
        <p className="text-sm text-zinc-400">
          Visual P&L diagrams for common option strategies at expiration and
          before expiry.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-4">
          {/* Strategy selector */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Strategy
            </h2>
            {strategies.map((s) => (
              <button
                key={s.id}
                onClick={() => setStrategy(s.id)}
                className={`block w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  strategy === s.id
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>

          {/* Parameters */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-4">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Parameters
            </h2>
            <Slider label="Spot (S)" value={S} min={1} max={300} step={1} onChange={setS} displayValue={`$${S}`} />
            <Slider label="Strike (K)" value={K} min={1} max={300} step={1} onChange={setK} displayValue={`$${K}`} />
            {needsOffset && (
              <Slider label="Wing Width" value={K2Offset} min={2} max={30} step={1} onChange={setK2Offset} displayValue={`$${K2Offset}`} />
            )}
            <Slider label="Time (T)" value={T} min={0.05} max={2} step={0.05} onChange={setT} unit=" yr" />
            <Slider label="Rate (r)" value={r} min={0} max={0.15} step={0.005} onChange={setR} displayValue={`${(r * 100).toFixed(1)}%`} />
            <Slider label="Vol (σ)" value={sigma} min={0.05} max={1.0} step={0.01} onChange={setSigma} displayValue={`${(sigma * 100).toFixed(0)}%`} />
          </div>

          {/* Strategy Info */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-zinc-200">
              {currentInfo?.name}
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {currentInfo?.description}
            </p>
            <div className="pt-2 border-t border-zinc-800 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Net Premium</span>
                <span
                  className={`font-mono ${
                    totalPremium >= 0 ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  ${Math.abs(totalPremium).toFixed(2)}{" "}
                  {totalPremium >= 0 ? "debit" : "credit"}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Max Profit</span>
                <span className="font-mono text-emerald-400">
                  {maxProfit > 1000 ? "Unlimited" : `$${maxProfit.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Max Loss</span>
                <span className="font-mono text-rose-400">
                  ${Math.abs(maxLoss).toFixed(2)}
                </span>
              </div>
              {breakevens.length > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Breakeven</span>
                  <span className="font-mono text-zinc-300">
                    {breakevens.map((b) => `$${b.toFixed(2)}`).join(", ")}
                  </span>
                </div>
              )}
            </div>
            {/* Legs breakdown */}
            <div className="pt-2 border-t border-zinc-800">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">
                Legs
              </div>
              {legs.map((leg, idx) => (
                <div key={idx} className="flex justify-between text-xs py-0.5">
                  <span className="text-zinc-400">
                    {leg.quantity > 0 ? "Long" : "Short"}{" "}
                    {Math.abs(leg.quantity)}x {leg.type} @${leg.strike}
                  </span>
                  <span className="font-mono text-zinc-500">
                    ${leg.premium.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="lg:col-span-3 space-y-6">
          {/* Expiry Payoff */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              P&L at Expiration
            </h3>
            <div className="h-[350px]">
              <PlotlyChart
                data={[
                  {
                    x: data.map((d) => d.spot),
                    y: data.map((d) => d.pnl),
                    type: "scatter",
                    mode: "lines",
                    name: "P&L",
                    line: { color: "#34d399", width: 2.5 },
                    fill: "tozeroy",
                    fillcolor: "rgba(52,211,153,0.05)",
                  },
                  {
                    x: [data[0].spot, data[data.length - 1].spot],
                    y: [0, 0],
                    type: "scatter",
                    mode: "lines",
                    name: "Zero",
                    line: { color: "#3f3f46", width: 1, dash: "dash" },
                    showlegend: false,
                  },
                  ...(breakevens.length > 0
                    ? [
                        {
                          x: breakevens,
                          y: breakevens.map(() => 0),
                          type: "scatter" as const,
                          mode: "markers" as const,
                          name: "Breakeven",
                          marker: { color: "#f59e0b", size: 8, symbol: "diamond" },
                        },
                      ]
                    : []),
                ]}
                layout={{
                  xaxis: { title: "Spot Price at Expiry ($)" },
                  yaxis: { title: "Profit / Loss ($)" },
                  showlegend: true,
                  legend: { x: 0.01, y: 0.99, bgcolor: "transparent" },
                }}
              />
            </div>
          </div>

          {/* Pre-Expiry P&L */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              P&L Over Time (Pre-Expiry Curves)
            </h3>
            <div className="h-[350px]">
              <PlotlyChart
                data={[
                  ...preExpiryData.map((series) => ({
                    x: series.spots,
                    y: series.pnls,
                    type: "scatter" as const,
                    mode: "lines" as const,
                    name: series.label,
                    line: { color: series.color, width: 1.5 },
                  })),
                  {
                    x: [preExpiryData[0].spots[0], preExpiryData[0].spots[preExpiryData[0].spots.length - 1]],
                    y: [0, 0],
                    type: "scatter",
                    mode: "lines",
                    line: { color: "#3f3f46", width: 1, dash: "dash" },
                    showlegend: false,
                  },
                ]}
                layout={{
                  xaxis: { title: "Spot Price ($)" },
                  yaxis: { title: "Profit / Loss ($)" },
                  showlegend: true,
                  legend: {
                    x: 0.01,
                    y: 0.99,
                    bgcolor: "transparent",
                    font: { size: 10 },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
