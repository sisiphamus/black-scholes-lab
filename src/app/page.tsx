"use client";

import { useState, useMemo } from "react";
import Slider from "@/components/Slider";
import KaTeX from "@/components/KaTeX";
import { blackScholes, allGreeks, type BSInputs } from "@/lib/black-scholes";

function ResultCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className={`font-mono text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

function GreekBadge({
  label,
  value,
  symbol,
}: {
  label: string;
  value: number;
  symbol: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/30 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="text-emerald-400 font-mono text-sm">{symbol}</span>
        <span className="text-xs text-zinc-400">{label}</span>
      </div>
      <span className="font-mono text-sm text-zinc-200">
        {value.toFixed(4)}
      </span>
    </div>
  );
}

export default function CalculatorPage() {
  const [S, setS] = useState(100);
  const [K, setK] = useState(100);
  const [T, setT] = useState(0.5);
  const [r, setR] = useState(0.05);
  const [sigma, setSigma] = useState(0.2);

  const inputs: BSInputs = useMemo(
    () => ({ S, K, T, r, sigma }),
    [S, K, T, r, sigma]
  );

  const result = useMemo(() => blackScholes(inputs), [inputs]);
  const callGreeks = useMemo(() => allGreeks(inputs, "call"), [inputs]);
  const putGreeks = useMemo(() => allGreeks(inputs, "put"), [inputs]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100 mb-2">
          Black-Scholes Calculator
        </h1>
        <p className="text-sm text-zinc-400">
          European option pricing using the Black-Scholes-Merton model.
          Adjust parameters with the sliders below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Panel */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-5">
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
              Parameters
            </h2>
            <Slider
              label="Spot Price (S)"
              value={S}
              min={1}
              max={300}
              step={0.5}
              onChange={setS}
              unit=""
              displayValue={`$${S.toFixed(2)}`}
            />
            <Slider
              label="Strike Price (K)"
              value={K}
              min={1}
              max={300}
              step={0.5}
              onChange={setK}
              unit=""
              displayValue={`$${K.toFixed(2)}`}
            />
            <Slider
              label="Time to Expiry (T)"
              value={T}
              min={0.01}
              max={3}
              step={0.01}
              onChange={setT}
              unit=" yr"
            />
            <Slider
              label="Risk-Free Rate (r)"
              value={r}
              min={0}
              max={0.15}
              step={0.001}
              onChange={setR}
              unit=""
              displayValue={`${(r * 100).toFixed(1)}%`}
            />
            <Slider
              label="Volatility (σ)"
              value={sigma}
              min={0.01}
              max={1.0}
              step={0.005}
              onChange={setSigma}
              unit=""
              displayValue={`${(sigma * 100).toFixed(1)}%`}
            />

            {/* d1 / d2 display */}
            <div className="pt-3 border-t border-zinc-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">d1</span>
                <span className="font-mono text-zinc-300">
                  {result.d1.toFixed(6)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">d2</span>
                <span className="font-mono text-zinc-300">
                  {result.d2.toFixed(6)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Prices */}
          <div className="grid grid-cols-2 gap-4">
            <ResultCard
              label="Call Price"
              value={`$${result.callPrice.toFixed(4)}`}
              color="text-emerald-400"
            />
            <ResultCard
              label="Put Price"
              value={`$${result.putPrice.toFixed(4)}`}
              color="text-rose-400"
            />
          </div>

          {/* Put-Call Parity Check */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
            <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
              Put-Call Parity Verification
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <KaTeX math="C - P = S - Ke^{-rT}" className="text-zinc-300" />
              <span className="text-zinc-600">|</span>
              <span className="font-mono text-xs text-zinc-400">
                LHS: {(result.callPrice - result.putPrice).toFixed(4)}
              </span>
              <span className="font-mono text-xs text-zinc-400">
                RHS: {(S - K * Math.exp(-r * T)).toFixed(4)}
              </span>
              <span className="text-xs text-emerald-400/70">
                {Math.abs(
                  result.callPrice -
                    result.putPrice -
                    (S - K * Math.exp(-r * T))
                ) < 0.001
                  ? "Verified"
                  : ""}
              </span>
            </div>
          </div>

          {/* Greeks Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
              <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">
                Call Greeks
              </h3>
              <GreekBadge label="Delta" value={callGreeks.delta} symbol="Δ" />
              <GreekBadge label="Gamma" value={callGreeks.gamma} symbol="Γ" />
              <GreekBadge label="Theta" value={callGreeks.theta} symbol="Θ" />
              <GreekBadge label="Vega" value={callGreeks.vega} symbol="ν" />
              <GreekBadge label="Rho" value={callGreeks.rho} symbol="ρ" />
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
              <h3 className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-3">
                Put Greeks
              </h3>
              <GreekBadge label="Delta" value={putGreeks.delta} symbol="Δ" />
              <GreekBadge label="Gamma" value={putGreeks.gamma} symbol="Γ" />
              <GreekBadge label="Theta" value={putGreeks.theta} symbol="Θ" />
              <GreekBadge label="Vega" value={putGreeks.vega} symbol="ν" />
              <GreekBadge label="Rho" value={putGreeks.rho} symbol="ρ" />
            </div>
          </div>

          {/* Formula Display */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
              Black-Scholes Formula
            </h3>
            <div className="space-y-4 overflow-x-auto">
              <KaTeX
                math="C = S\,N(d_1) - Ke^{-rT}\,N(d_2)"
                display
                className="text-zinc-200"
              />
              <KaTeX
                math="P = Ke^{-rT}\,N(-d_2) - S\,N(-d_1)"
                display
                className="text-zinc-200"
              />
              <div className="border-t border-zinc-800 pt-4">
                <KaTeX
                  math="d_1 = \frac{\ln(S/K) + (r + \sigma^2/2)\,T}{\sigma\sqrt{T}}"
                  display
                  className="text-zinc-300"
                />
                <KaTeX
                  math="d_2 = d_1 - \sigma\sqrt{T}"
                  display
                  className="text-zinc-300"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
