# BLACK-SCHOLES-LAB

There's a single equation behind roughly $600 trillion in outstanding derivatives contracts, and most people who use it daily treat it as a black box. Plug in volatility, get a price, move on.

This is not a calculator. It's a laboratory.

Drag volatility and watch how delta surfaces warp. Step through time decay and see theta eat away at an option's value. Explore how the Greeks interact -- how gamma spikes near expiration, how vega behaves differently for in-the-money vs. out-of-the-money strikes. The kind of intuition you can't get from a formula sheet.

```bash
npm install && npm run dev
```

## What's Inside

### Calculator
Input spot price, strike, time to expiry, risk-free rate, and volatility via interactive sliders. Real-time call/put pricing with d1/d2 parameters, all five Greeks for both sides, and put-call parity verification. The formula is shown rendered in LaTeX alongside the numbers.

### Greeks Explorer
Select any Greek -- Delta, Gamma, Theta, Vega, Rho -- and watch it respond to every parameter. Three simultaneous charts show sensitivity across spot price, time to expiry, and volatility. Current position marked with diamonds. Formulas and economic interpretation displayed alongside.

### Surface Plots
3D surfaces and heatmaps showing how any metric (price or any Greek) varies across two parameters simultaneously. Rotate the surfaces, switch between Strike vs Time, Strike vs Vol, or Spot vs Vol axes. Toggle call/put.

### Payoff Diagrams
P&L diagrams for eight strategies: long/short calls and puts, straddles, strangles, butterfly spreads, and iron condors. Includes pre-expiry curves at 25%/50%/75% of time remaining. Breakeven points, max profit/loss, and net premium computed automatically.

### Implied Volatility Solver
Newton-Raphson IV solver recovering implied volatility from market prices, with convergence error displayed. Below that, a parametric volatility smile simulator with adjustable skew and curvature, plus ATM IV term structure.

### Theory
The full mathematical story: geometric Brownian motion, Ito's lemma, the Black-Scholes PDE derivation, risk-neutral pricing, the closed-form formula, put-call parity, every Greek's formula and interpretation, the gamma-theta tradeoff, and the model's limitations. All rendered with KaTeX.

## The Math Engine

Everything in `src/lib/black-scholes.ts`. No approximations where exact solutions exist:

- **Cumulative normal distribution** via Abramowitz & Stegun (formula 26.2.17, max error < 7.5e-8)
- **Black-Scholes closed-form** for European calls and puts
- **All first-order Greeks**: Delta, Gamma, Theta (per calendar day), Vega (per 1% vol), Rho (per 1% rate)
- **Newton-Raphson IV solver** using vega as the Jacobian, with intrinsic value bounds checking
- **Multi-leg payoff engine** with pre-built constructors for common strategies

## Stack

Next.js 16 / TypeScript / Tailwind CSS v4 / Plotly.js / KaTeX. All computation client-side.

## Structure

```
src/
  lib/black-scholes.ts        # Core math engine
  components/
    KaTeX.tsx                  # LaTeX rendering
    NavBar.tsx                 # Navigation
    PlotlyChart.tsx            # Plotly wrapper (dark theme)
    Slider.tsx                 # Parameter sliders
  app/
    page.tsx                   # Calculator
    greeks/page.tsx            # Greeks explorer
    surfaces/page.tsx          # 3D surfaces & heatmaps
    payoffs/page.tsx           # Payoff diagrams
    implied-vol/page.tsx       # IV solver & vol smile
    theory/page.tsx            # Mathematical background
```
