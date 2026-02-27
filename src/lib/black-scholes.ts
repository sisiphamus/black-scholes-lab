/**
 * Black-Scholes Options Pricing Engine
 *
 * Implements the Black-Scholes-Merton model for European option pricing,
 * including all first- and second-order Greeks, implied volatility via
 * Newton-Raphson, and the cumulative normal distribution function.
 *
 * Reference: Black, F. & Scholes, M. (1973). "The Pricing of Options
 * and Corporate Liabilities." Journal of Political Economy, 81(3), 637-654.
 */

// ─── Standard Normal Distribution ────────────────────────────────────────────

/**
 * Standard normal probability density function: phi(x) = (1/sqrt(2*pi)) * exp(-x^2/2)
 */
export function normPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * Cumulative standard normal distribution function.
 * Uses the Abramowitz & Stegun rational approximation (formula 26.2.17)
 * with maximum error < 7.5e-8.
 */
export function normCDF(x: number): number {
  if (x < -10) return 0;
  if (x > 10) return 1;

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1.0 / (1.0 + p * absX);
  const t2 = t * t;
  const t3 = t2 * t;
  const t4 = t3 * t;
  const t5 = t4 * t;

  const y =
    1.0 -
    (a1 * t + a2 * t2 + a3 * t3 + a4 * t4 + a5 * t5) *
      Math.exp(-0.5 * absX * absX);

  return 0.5 * (1.0 + sign * y);
}

// ─── Black-Scholes Model ─────────────────────────────────────────────────────

export interface BSInputs {
  S: number; // Spot price
  K: number; // Strike price
  T: number; // Time to expiration (years)
  r: number; // Risk-free rate (decimal, e.g. 0.05 for 5%)
  sigma: number; // Volatility (decimal, e.g. 0.20 for 20%)
}

export interface BSResult {
  callPrice: number;
  putPrice: number;
  d1: number;
  d2: number;
}

export interface Greeks {
  delta: number;
  gamma: number;
  theta: number; // per calendar day
  vega: number; // per 1% move in vol
  rho: number; // per 1% move in rate
}

/**
 * Compute d1 and d2 parameters of the Black-Scholes formula.
 *
 *   d1 = [ln(S/K) + (r + sigma^2/2)*T] / (sigma * sqrt(T))
 *   d2 = d1 - sigma * sqrt(T)
 */
export function computeD1D2(inputs: BSInputs): { d1: number; d2: number } {
  const { S, K, T, r, sigma } = inputs;
  if (T <= 0 || sigma <= 0 || S <= 0 || K <= 0) {
    return { d1: 0, d2: 0 };
  }
  const sqrtT = Math.sqrt(T);
  const d1 =
    (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  return { d1, d2 };
}

/**
 * Black-Scholes European option pricing.
 *
 *   Call = S * N(d1) - K * e^{-rT} * N(d2)
 *   Put  = K * e^{-rT} * N(-d2) - S * N(-d1)
 */
export function blackScholes(inputs: BSInputs): BSResult {
  const { S, K, T, r } = inputs;

  if (T <= 0) {
    // At expiration
    const callPrice = Math.max(S - K, 0);
    const putPrice = Math.max(K - S, 0);
    return { callPrice, putPrice, d1: 0, d2: 0 };
  }

  const { d1, d2 } = computeD1D2(inputs);
  const discount = Math.exp(-r * T);

  const callPrice = S * normCDF(d1) - K * discount * normCDF(d2);
  const putPrice = K * discount * normCDF(-d2) - S * normCDF(-d1);

  return {
    callPrice: Math.max(callPrice, 0),
    putPrice: Math.max(putPrice, 0),
    d1,
    d2,
  };
}

// ─── Greeks ──────────────────────────────────────────────────────────────────

/**
 * Call Delta = N(d1)
 * Put Delta  = N(d1) - 1
 */
export function delta(inputs: BSInputs, optionType: "call" | "put"): number {
  if (inputs.T <= 0) {
    if (optionType === "call") return inputs.S > inputs.K ? 1 : 0;
    return inputs.S < inputs.K ? -1 : 0;
  }
  const { d1 } = computeD1D2(inputs);
  return optionType === "call" ? normCDF(d1) : normCDF(d1) - 1;
}

/**
 * Gamma = phi(d1) / (S * sigma * sqrt(T))
 * Same for calls and puts.
 */
export function gamma(inputs: BSInputs): number {
  const { S, T, sigma } = inputs;
  if (T <= 0 || sigma <= 0) return 0;
  const { d1 } = computeD1D2(inputs);
  return normPDF(d1) / (S * sigma * Math.sqrt(T));
}

/**
 * Theta (per calendar day):
 *   Call: [-S*phi(d1)*sigma/(2*sqrt(T)) - r*K*e^{-rT}*N(d2)] / 365
 *   Put:  [-S*phi(d1)*sigma/(2*sqrt(T)) + r*K*e^{-rT}*N(-d2)] / 365
 */
export function theta(inputs: BSInputs, optionType: "call" | "put"): number {
  const { S, K, T, r, sigma } = inputs;
  if (T <= 0) return 0;
  const { d1, d2 } = computeD1D2(inputs);
  const sqrtT = Math.sqrt(T);
  const discount = Math.exp(-r * T);
  const term1 = (-S * normPDF(d1) * sigma) / (2 * sqrtT);

  if (optionType === "call") {
    return (term1 - r * K * discount * normCDF(d2)) / 365;
  } else {
    return (term1 + r * K * discount * normCDF(-d2)) / 365;
  }
}

/**
 * Vega = S * phi(d1) * sqrt(T)
 * Returned per 1% change in volatility (i.e., divided by 100).
 * Same for calls and puts.
 */
export function vega(inputs: BSInputs): number {
  const { S, T } = inputs;
  if (T <= 0) return 0;
  const { d1 } = computeD1D2(inputs);
  return (S * normPDF(d1) * Math.sqrt(T)) / 100;
}

/**
 * Rho (per 1% change in rate):
 *   Call: K * T * e^{-rT} * N(d2) / 100
 *   Put:  -K * T * e^{-rT} * N(-d2) / 100
 */
export function rho(inputs: BSInputs, optionType: "call" | "put"): number {
  const { K, T, r } = inputs;
  if (T <= 0) return 0;
  const { d2 } = computeD1D2(inputs);
  const discount = Math.exp(-r * T);

  if (optionType === "call") {
    return (K * T * discount * normCDF(d2)) / 100;
  } else {
    return (-K * T * discount * normCDF(-d2)) / 100;
  }
}

/**
 * Compute all Greeks for a given option.
 */
export function allGreeks(inputs: BSInputs, optionType: "call" | "put"): Greeks {
  return {
    delta: delta(inputs, optionType),
    gamma: gamma(inputs),
    theta: theta(inputs, optionType),
    vega: vega(inputs),
    rho: rho(inputs, optionType),
  };
}

// ─── Implied Volatility ──────────────────────────────────────────────────────

/**
 * Newton-Raphson implied volatility solver.
 *
 * Given a market price, solves for the volatility sigma such that
 * BS(S, K, T, r, sigma) = marketPrice.
 *
 * Uses vega as the derivative for Newton's method:
 *   sigma_{n+1} = sigma_n - (BS(sigma_n) - marketPrice) / vega(sigma_n)
 *
 * @param marketPrice - Observed option price
 * @param inputs - BS inputs (sigma is the initial guess, or use 0.3 default)
 * @param optionType - 'call' or 'put'
 * @param maxIter - Maximum iterations (default 100)
 * @param tol - Convergence tolerance (default 1e-8)
 * @returns Implied volatility or NaN if not converged
 */
export function impliedVolatility(
  marketPrice: number,
  inputs: Omit<BSInputs, "sigma">,
  optionType: "call" | "put",
  maxIter: number = 100,
  tol: number = 1e-8
): number {
  const { S, K, T, r } = inputs;

  // Bounds check
  if (T <= 0 || marketPrice <= 0) return NaN;

  // Intrinsic value check
  const discount = Math.exp(-r * T);
  if (optionType === "call") {
    const intrinsic = Math.max(S - K * discount, 0);
    if (marketPrice < intrinsic) return NaN;
    if (marketPrice >= S) return NaN;
  } else {
    const intrinsic = Math.max(K * discount - S, 0);
    if (marketPrice < intrinsic) return NaN;
    if (marketPrice >= K * discount) return NaN;
  }

  let sigma = 0.3; // Initial guess

  for (let i = 0; i < maxIter; i++) {
    const bsInputs: BSInputs = { S, K, T, r, sigma };
    const result = blackScholes(bsInputs);
    const price = optionType === "call" ? result.callPrice : result.putPrice;
    const diff = price - marketPrice;

    if (Math.abs(diff) < tol) return sigma;

    // Vega (not scaled by 100 for Newton-Raphson)
    const { d1 } = computeD1D2(bsInputs);
    const vegaRaw = S * normPDF(d1) * Math.sqrt(T);

    if (vegaRaw < 1e-12) {
      // Vega too small, try bisection step
      sigma = diff > 0 ? sigma * 0.5 : sigma * 1.5;
      continue;
    }

    sigma = sigma - diff / vegaRaw;

    // Keep sigma in reasonable bounds
    if (sigma <= 0.001) sigma = 0.001;
    if (sigma > 10) sigma = 10;
  }

  return sigma; // Best estimate even if not fully converged
}

/**
 * Compute implied volatility for an array of strikes to build a smile/skew.
 */
export function volatilitySmile(
  marketPrices: { strike: number; price: number }[],
  S: number,
  T: number,
  r: number,
  optionType: "call" | "put"
): { strike: number; iv: number }[] {
  return marketPrices
    .map(({ strike, price }) => ({
      strike,
      iv: impliedVolatility(price, { S, K: strike, T, r }, optionType),
    }))
    .filter(({ iv }) => !isNaN(iv) && isFinite(iv));
}

// ─── Payoff Functions ────────────────────────────────────────────────────────

export type OptionLeg = {
  type: "call" | "put";
  strike: number;
  premium: number;
  quantity: number; // positive = long, negative = short
};

/**
 * Compute total P&L of a multi-leg option strategy at expiration.
 */
export function strategyPayoff(
  legs: OptionLeg[],
  spotAtExpiry: number
): number {
  let total = 0;
  for (const leg of legs) {
    const intrinsic =
      leg.type === "call"
        ? Math.max(spotAtExpiry - leg.strike, 0)
        : Math.max(leg.strike - spotAtExpiry, 0);
    total += leg.quantity * (intrinsic - leg.premium);
  }
  return total;
}

/**
 * Generate payoff curve data across a range of spot prices.
 */
export function payoffCurve(
  legs: OptionLeg[],
  spotMin: number,
  spotMax: number,
  steps: number = 200
): { spot: number; pnl: number }[] {
  const result: { spot: number; pnl: number }[] = [];
  const stepSize = (spotMax - spotMin) / steps;
  for (let i = 0; i <= steps; i++) {
    const spot = spotMin + i * stepSize;
    result.push({ spot, pnl: strategyPayoff(legs, spot) });
  }
  return result;
}

// ─── Pre-built Strategies ────────────────────────────────────────────────────

export function longCall(S: number, K: number, T: number, r: number, sigma: number): OptionLeg[] {
  const premium = blackScholes({ S, K, T, r, sigma }).callPrice;
  return [{ type: "call", strike: K, premium, quantity: 1 }];
}

export function longPut(S: number, K: number, T: number, r: number, sigma: number): OptionLeg[] {
  const premium = blackScholes({ S, K, T, r, sigma }).putPrice;
  return [{ type: "put", strike: K, premium, quantity: 1 }];
}

export function longStraddle(S: number, K: number, T: number, r: number, sigma: number): OptionLeg[] {
  const bs = blackScholes({ S, K, T, r, sigma });
  return [
    { type: "call", strike: K, premium: bs.callPrice, quantity: 1 },
    { type: "put", strike: K, premium: bs.putPrice, quantity: 1 },
  ];
}

export function longStrangle(
  S: number, K1: number, K2: number, T: number, r: number, sigma: number
): OptionLeg[] {
  const putPremium = blackScholes({ S, K: K1, T, r, sigma }).putPrice;
  const callPremium = blackScholes({ S, K: K2, T, r, sigma }).callPrice;
  return [
    { type: "put", strike: K1, premium: putPremium, quantity: 1 },
    { type: "call", strike: K2, premium: callPremium, quantity: 1 },
  ];
}

export function butterflySpread(
  S: number, K1: number, K2: number, K3: number, T: number, r: number, sigma: number
): OptionLeg[] {
  const c1 = blackScholes({ S, K: K1, T, r, sigma }).callPrice;
  const c2 = blackScholes({ S, K: K2, T, r, sigma }).callPrice;
  const c3 = blackScholes({ S, K: K3, T, r, sigma }).callPrice;
  return [
    { type: "call", strike: K1, premium: c1, quantity: 1 },
    { type: "call", strike: K2, premium: c2, quantity: -2 },
    { type: "call", strike: K3, premium: c3, quantity: 1 },
  ];
}

export function ironCondor(
  S: number, K1: number, K2: number, K3: number, K4: number,
  T: number, r: number, sigma: number
): OptionLeg[] {
  const p1 = blackScholes({ S, K: K1, T, r, sigma }).putPrice;
  const p2 = blackScholes({ S, K: K2, T, r, sigma }).putPrice;
  const c3 = blackScholes({ S, K: K3, T, r, sigma }).callPrice;
  const c4 = blackScholes({ S, K: K4, T, r, sigma }).callPrice;
  return [
    { type: "put", strike: K1, premium: p1, quantity: 1 },
    { type: "put", strike: K2, premium: p2, quantity: -1 },
    { type: "call", strike: K3, premium: c3, quantity: -1 },
    { type: "call", strike: K4, premium: c4, quantity: 1 },
  ];
}
