"use client";

import { useState, useMemo } from "react";
import Slider from "@/components/Slider";
import KaTeX from "@/components/KaTeX";
import PlotlyChart from "@/components/PlotlyChart";
import {
  impliedVolatility,
  blackScholes,
} from "@/lib/black-scholes";

export default function ImpliedVolPage() {
  // IV Calculator
  const [S, setS] = useState(100);
  const [K, setK] = useState(100);
  const [T, setT] = useState(0.5);
  const [r, setR] = useState(0.05);
  const [marketPrice, setMarketPrice] = useState(10);
  const [optionType, setOptionType] = useState<"call" | "put">("call");

  const iv = useMemo(
    () => impliedVolatility(marketPrice, { S, K, T, r }, optionType),
    [S, K, T, r, marketPrice, optionType]
  );

  const bsCheck = useMemo(() => {
    if (isNaN(iv)) return null;
    return blackScholes({ S, K, T, r, sigma: iv });
  }, [S, K, T, r, iv]);

  // Volatility Smile simulator
  const [smileS, setSmileS] = useState(100);
  const [smileT, setSmileT] = useState(0.5);
  const [smileR, setSmileR] = useState(0.05);
  const [smileBaseVol, setSmileBaseVol] = useState(0.2);
  const [smileSkew, setSmileSkew] = useState(0.1);
  const [smileSmile, setSmileSmile] = useState(0.05);

  // Generate synthetic market prices with a volatility smile
  const smileData = useMemo(() => {
    const strikes: number[] = [];
    const ivs: number[] = [];
    const prices: number[] = [];
    const trueVols: number[] = [];

    for (let k = smileS * 0.7; k <= smileS * 1.3; k += 1) {
      const moneyness = Math.log(k / smileS);
      // Parabolic smile: vol = base + skew * moneyness + smile * moneyness^2
      const trueVol =
        smileBaseVol + smileSkew * moneyness + smileSmile * moneyness * moneyness;
      if (trueVol <= 0.01) continue;

      const bs = blackScholes({ S: smileS, K: k, T: smileT, r: smileR, sigma: trueVol });
      const price = k < smileS ? bs.putPrice : bs.callPrice;
      const type = k < smileS ? "put" : "call";

      if (price < 0.01) continue;

      const recoveredIV = impliedVolatility(
        price,
        { S: smileS, K: k, T: smileT, r: smileR },
        type as "call" | "put"
      );

      strikes.push(k);
      prices.push(price);
      trueVols.push(trueVol * 100);
      ivs.push(isNaN(recoveredIV) ? 0 : recoveredIV * 100);
    }

    return { strikes, ivs, prices, trueVols };
  }, [smileS, smileT, smileR, smileBaseVol, smileSkew, smileSmile]);

  // Term structure: IV across maturities
  const termStructure = useMemo(() => {
    const maturities: number[] = [];
    const atmIVs: number[] = [];

    for (let t = 0.05; t <= 3; t += 0.05) {
      // Simple mean-reversion term structure model
      const vol = smileBaseVol + (0.05 * Math.exp(-2 * t));
      const bs = blackScholes({ S: smileS, K: smileS, T: t, r: smileR, sigma: vol });
      const recovered = impliedVolatility(
        bs.callPrice,
        { S: smileS, K: smileS, T: t, r: smileR },
        "call"
      );
      maturities.push(t);
      atmIVs.push(isNaN(recovered) ? vol * 100 : recovered * 100);
    }

    return { maturities, atmIVs };
  }, [smileS, smileR, smileBaseVol]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100 mb-2">
          Implied Volatility
        </h1>
        <p className="text-sm text-zinc-400">
          Newton-Raphson IV solver and volatility smile visualization.
        </p>
      </div>

      {/* IV Calculator Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
              IV Calculator
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
            <Slider label="Spot (S)" value={S} min={1} max={300} step={0.5} onChange={setS} displayValue={`$${S.toFixed(2)}`} />
            <Slider label="Strike (K)" value={K} min={1} max={300} step={0.5} onChange={setK} displayValue={`$${K.toFixed(2)}`} />
            <Slider label="Time (T)" value={T} min={0.01} max={3} step={0.01} onChange={setT} unit=" yr" />
            <Slider label="Rate (r)" value={r} min={0} max={0.15} step={0.001} onChange={setR} displayValue={`${(r * 100).toFixed(1)}%`} />
            <Slider
              label="Market Price"
              value={marketPrice}
              min={0.01}
              max={Math.max(S * 0.5, 1)}
              step={0.01}
              onChange={setMarketPrice}
              displayValue={`$${marketPrice.toFixed(2)}`}
            />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {/* Result */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                  Implied Volatility
                </div>
                <div className="font-mono text-3xl font-bold text-emerald-400">
                  {isNaN(iv) ? "N/A" : `${(iv * 100).toFixed(2)}%`}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                  BS Price at IV
                </div>
                <div className="font-mono text-3xl font-bold text-zinc-300">
                  {bsCheck
                    ? `$${(optionType === "call" ? bsCheck.callPrice : bsCheck.putPrice).toFixed(4)}`
                    : "N/A"}
                </div>
              </div>
            </div>
            {bsCheck && (
              <div className="mt-3 text-xs text-zinc-500">
                Error:{" "}
                <span className="font-mono text-zinc-400">
                  {Math.abs(
                    (optionType === "call" ? bsCheck.callPrice : bsCheck.putPrice) -
                      marketPrice
                  ).toExponential(4)}
                </span>
              </div>
            )}
          </div>

          {/* Newton-Raphson explanation */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Newton-Raphson Algorithm
            </h3>
            <KaTeX
              math="\sigma_{n+1} = \sigma_n - \frac{C_{\text{BS}}(\sigma_n) - C_{\text{market}}}{\mathcal{V}(\sigma_n)}"
              display
              className="text-zinc-300"
            />
            <p className="text-xs text-zinc-500 leading-relaxed">
              The Newton-Raphson method iteratively refines the volatility estimate.
              Since vega (the derivative of option price with respect to volatility)
              is always positive for non-expired options, the method converges rapidly--
              typically within 5-10 iterations to machine precision. The key insight is
              that the Black-Scholes price is monotonically increasing in volatility,
              guaranteeing a unique solution.
            </p>
          </div>
        </div>
      </div>

      {/* Volatility Smile Section */}
      <div className="border-t border-zinc-800 pt-8 mb-6">
        <h2 className="text-xl font-bold text-zinc-100 mb-2">
          Volatility Smile
        </h2>
        <p className="text-sm text-zinc-400 mb-6">
          The volatility smile shows how implied volatility varies across strike
          prices. In practice, deep OTM puts tend to have higher IV (skew), and
          the smile shape reveals market expectations about tail risk.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-4">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Smile Parameters
            </h3>
            <Slider label="Spot" value={smileS} min={50} max={200} step={1} onChange={setSmileS} displayValue={`$${smileS}`} />
            <Slider label="Time" value={smileT} min={0.05} max={2} step={0.05} onChange={setSmileT} unit=" yr" />
            <Slider label="Rate" value={smileR} min={0} max={0.15} step={0.005} onChange={setSmileR} displayValue={`${(smileR * 100).toFixed(1)}%`} />
            <Slider
              label="Base Vol"
              value={smileBaseVol}
              min={0.05}
              max={0.6}
              step={0.005}
              onChange={setSmileBaseVol}
              displayValue={`${(smileBaseVol * 100).toFixed(1)}%`}
            />
            <Slider
              label="Skew"
              value={smileSkew}
              min={-0.5}
              max={0.5}
              step={0.01}
              onChange={setSmileSkew}
            />
            <Slider
              label="Curvature"
              value={smileSmile}
              min={0}
              max={0.5}
              step={0.01}
              onChange={setSmileSmile}
            />
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Smile Model
            </h3>
            <KaTeX
              math="\sigma(K) = \sigma_0 + \alpha \ln\!\left(\frac{K}{S}\right) + \beta \left[\ln\!\left(\frac{K}{S}\right)\right]^2"
              display
              className="text-zinc-300"
            />
            <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
              This parabolic parametrization captures both the skew (linear term)
              and the smile (quadratic term) commonly observed in equity options.
            </p>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {/* Smile plot */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              IV vs Strike
            </h3>
            <div className="h-[350px]">
              <PlotlyChart
                data={[
                  {
                    x: smileData.strikes,
                    y: smileData.trueVols,
                    type: "scatter",
                    mode: "lines",
                    name: "True Vol",
                    line: { color: "#8b5cf6", width: 2 },
                  },
                  {
                    x: smileData.strikes,
                    y: smileData.ivs,
                    type: "scatter",
                    mode: "markers",
                    name: "Recovered IV",
                    marker: { color: "#34d399", size: 3 },
                  },
                  {
                    x: [smileS],
                    y: [smileBaseVol * 100],
                    type: "scatter",
                    mode: "markers",
                    name: "ATM",
                    marker: {
                      color: "#f59e0b",
                      size: 10,
                      symbol: "diamond",
                    },
                  },
                ]}
                layout={{
                  xaxis: { title: "Strike Price ($)" },
                  yaxis: { title: "Implied Volatility (%)" },
                  showlegend: true,
                  legend: { x: 0.01, y: 0.99, bgcolor: "transparent" },
                }}
              />
            </div>
          </div>

          {/* Term structure */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              ATM IV Term Structure
            </h3>
            <div className="h-[280px]">
              <PlotlyChart
                data={[
                  {
                    x: termStructure.maturities,
                    y: termStructure.atmIVs,
                    type: "scatter",
                    mode: "lines",
                    name: "ATM IV",
                    line: { color: "#06b6d4", width: 2 },
                  },
                ]}
                layout={{
                  xaxis: { title: "Time to Expiry (years)" },
                  yaxis: { title: "ATM IV (%)" },
                  showlegend: false,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
