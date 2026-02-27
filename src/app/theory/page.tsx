"use client";

import KaTeX from "@/components/KaTeX";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
      <h2 className="text-lg font-bold text-zinc-100">{title}</h2>
      {children}
    </section>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-sm text-zinc-400 leading-relaxed space-y-3">
      {children}
    </div>
  );
}

export default function TheoryPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100 mb-2">
          Mathematical Background
        </h1>
        <p className="text-sm text-zinc-400">
          The theoretical foundations of the Black-Scholes-Merton options pricing
          model, from geometric Brownian motion to the Greeks.
        </p>
      </div>

      <div className="space-y-6">
        {/* Historical Context */}
        <Section title="Historical Context">
          <Prose>
            <p>
              The Black-Scholes model was developed by Fischer Black, Myron Scholes,
              and Robert C. Merton in the early 1970s. Their seminal paper,{" "}
              <em>&ldquo;The Pricing of Options and Corporate Liabilities&rdquo;</em> (1973),
              revolutionized financial theory by providing the first analytically
              tractable framework for pricing European-style options.
            </p>
            <p>
              Scholes and Merton received the 1997 Nobel Prize in Economics for this
              work (Black had passed away in 1995 and was thus ineligible). The model
              laid the foundation for the explosive growth of derivatives markets and
              modern quantitative finance.
            </p>
            <p>
              The key insight was that by continuously delta-hedging an option position,
              one can eliminate the market risk, leaving a portfolio that must earn the
              risk-free rate to prevent arbitrage. This &ldquo;risk-neutral pricing&rdquo; approach
              transformed how we think about derivatives.
            </p>
          </Prose>
        </Section>

        {/* Assumptions */}
        <Section title="Model Assumptions">
          <Prose>
            <p>The Black-Scholes model rests on several idealizing assumptions:</p>
            <ol className="list-decimal list-inside space-y-2 pl-2">
              <li>
                <strong className="text-zinc-300">Geometric Brownian Motion</strong>:
                The underlying asset price follows a GBM process with constant drift and
                volatility.
              </li>
              <li>
                <strong className="text-zinc-300">No dividends</strong>: The underlying
                pays no dividends during the option&apos;s life (the model can be extended
                to handle continuous dividend yields).
              </li>
              <li>
                <strong className="text-zinc-300">Constant volatility</strong>:
                Volatility is known and constant over the life of the option--this is
                the assumption most violated in practice (hence the volatility smile).
              </li>
              <li>
                <strong className="text-zinc-300">Constant risk-free rate</strong>: The
                risk-free interest rate is known and constant.
              </li>
              <li>
                <strong className="text-zinc-300">No transaction costs or taxes</strong>:
                Frictionless markets allow continuous rebalancing.
              </li>
              <li>
                <strong className="text-zinc-300">European exercise only</strong>:
                Options can only be exercised at expiration.
              </li>
              <li>
                <strong className="text-zinc-300">No arbitrage</strong>: Markets are
                efficient enough to prevent risk-free profit.
              </li>
              <li>
                <strong className="text-zinc-300">Continuous trading</strong>: The
                underlying can be traded continuously in any fractional amount.
              </li>
            </ol>
          </Prose>
        </Section>

        {/* GBM */}
        <Section title="Geometric Brownian Motion">
          <Prose>
            <p>
              The model assumes the underlying asset price follows geometric Brownian
              motion under the physical measure:
            </p>
          </Prose>
          <KaTeX
            math="dS = \mu S\,dt + \sigma S\,dW_t"
            display
            className="text-zinc-200"
          />
          <Prose>
            <p>
              where <KaTeX math="\mu" /> is the drift (expected return),{" "}
              <KaTeX math="\sigma" /> is the volatility, and{" "}
              <KaTeX math="W_t" /> is a standard Wiener process (Brownian motion).
              This ensures that <KaTeX math="S" /> remains positive and that
              returns are log-normally distributed:
            </p>
          </Prose>
          <KaTeX
            math="\ln S_T = \ln S_0 + \left(\mu - \frac{\sigma^2}{2}\right)T + \sigma W_T"
            display
            className="text-zinc-200"
          />
        </Section>

        {/* Ito's Lemma */}
        <Section title="It&ocirc;&apos;s Lemma & the Black-Scholes PDE">
          <Prose>
            <p>
              Let <KaTeX math="V(S,t)" /> denote the option price as a function of
              the underlying and time. Applying It&ocirc;&apos;s lemma to <KaTeX math="V" />:
            </p>
          </Prose>
          <KaTeX
            math="dV = \frac{\partial V}{\partial t}\,dt + \frac{\partial V}{\partial S}\,dS + \frac{1}{2}\frac{\partial^2 V}{\partial S^2}\,(dS)^2"
            display
            className="text-zinc-200"
          />
          <Prose>
            <p>
              Substituting the GBM dynamics and using <KaTeX math="(dS)^2 = \sigma^2 S^2\,dt" />,
              then constructing a delta-hedged portfolio{" "}
              <KaTeX math="\Pi = V - \frac{\partial V}{\partial S} S" />{" "}
              that must earn the risk-free rate, we arrive at the Black-Scholes PDE:
            </p>
          </Prose>
          <KaTeX
            math="\frac{\partial V}{\partial t} + \frac{1}{2}\sigma^2 S^2 \frac{\partial^2 V}{\partial S^2} + rS\frac{\partial V}{\partial S} - rV = 0"
            display
            className="text-zinc-200"
          />
          <Prose>
            <p>
              Notice that the drift <KaTeX math="\mu" /> has disappeared entirely.
              This is the essence of risk-neutral pricing: the option price does not
              depend on investors&apos; risk preferences or the expected return of the
              underlying.
            </p>
          </Prose>
        </Section>

        {/* Risk-Neutral Pricing */}
        <Section title="Risk-Neutral Pricing">
          <Prose>
            <p>
              Under the risk-neutral measure <KaTeX math="\mathbb{Q}" />, the asset
              price drifts at the risk-free rate:
            </p>
          </Prose>
          <KaTeX
            math="dS = rS\,dt + \sigma S\,d\widetilde{W}_t"
            display
            className="text-zinc-200"
          />
          <Prose>
            <p>
              The option price is the discounted expected payoff under{" "}
              <KaTeX math="\mathbb{Q}" />:
            </p>
          </Prose>
          <KaTeX
            math="V(S, t) = e^{-r(T-t)}\,\mathbb{E}^{\mathbb{Q}}\!\big[\max(S_T - K, 0)\big]"
            display
            className="text-zinc-200"
          />
          <Prose>
            <p>
              Evaluating this expectation for a log-normal distribution yields the
              closed-form Black-Scholes formula.
            </p>
          </Prose>
        </Section>

        {/* The Formula */}
        <Section title="The Black-Scholes Formula">
          <Prose>
            <p>For a European call option:</p>
          </Prose>
          <KaTeX
            math="C = S\,N(d_1) - Ke^{-rT}\,N(d_2)"
            display
            className="text-zinc-200"
          />
          <Prose>
            <p>For a European put option:</p>
          </Prose>
          <KaTeX
            math="P = Ke^{-rT}\,N(-d_2) - S\,N(-d_1)"
            display
            className="text-zinc-200"
          />
          <Prose>
            <p>where:</p>
          </Prose>
          <KaTeX
            math="d_1 = \frac{\ln(S/K) + (r + \sigma^2/2)\,T}{\sigma\sqrt{T}}"
            display
            className="text-zinc-200"
          />
          <KaTeX
            math="d_2 = d_1 - \sigma\sqrt{T}"
            display
            className="text-zinc-200"
          />
          <Prose>
            <p>
              and <KaTeX math="N(\cdot)" /> is the standard normal CDF. The term{" "}
              <KaTeX math="N(d_2)" /> can be interpreted as the risk-neutral
              probability that the option expires in-the-money, while{" "}
              <KaTeX math="N(d_1)" /> is the delta of the option.
            </p>
          </Prose>
        </Section>

        {/* Put-Call Parity */}
        <Section title="Put-Call Parity">
          <Prose>
            <p>
              Put-call parity is a fundamental relationship between European call and
              put prices with the same strike and expiry. It follows from a simple
              no-arbitrage argument:
            </p>
          </Prose>
          <KaTeX
            math="C - P = S - Ke^{-rT}"
            display
            className="text-zinc-200"
          />
          <Prose>
            <p>
              This can be verified by constructing two portfolios with identical
              payoffs at expiration: (1) a long call plus cash of{" "}
              <KaTeX math="Ke^{-rT}" />, and (2) a long put plus the underlying
              stock. Both portfolios pay <KaTeX math="\max(S_T, K)" /> at
              expiry, so they must have the same value today.
            </p>
            <p>
              Put-call parity is model-independent--it holds regardless of which pricing
              model is used, as long as European exercise is assumed.
            </p>
          </Prose>
        </Section>

        {/* The Greeks */}
        <Section title="The Greeks">
          <Prose>
            <p>
              The Greeks measure the sensitivity of option prices to various
              parameters. They are essential for risk management and hedging.
            </p>
          </Prose>

          <div className="space-y-6 mt-4">
            {/* Delta */}
            <div className="border-l-2 border-emerald-500/40 pl-4">
              <h3 className="text-sm font-semibold text-emerald-400 mb-2">
                Delta (<KaTeX math="\Delta" />)
              </h3>
              <KaTeX
                math="\Delta_{\text{call}} = N(d_1), \qquad \Delta_{\text{put}} = N(d_1) - 1"
                display
                className="text-zinc-300"
              />
              <Prose>
                <p>
                  Delta measures the rate of change of the option price with respect to
                  the underlying price. A call delta ranges from 0 to 1; a put delta from
                  -1 to 0. An ATM option has delta near 0.5 (call) or -0.5 (put). Delta
                  also approximates the probability of expiring in-the-money under the
                  risk-neutral measure.
                </p>
              </Prose>
            </div>

            {/* Gamma */}
            <div className="border-l-2 border-amber-500/40 pl-4">
              <h3 className="text-sm font-semibold text-amber-400 mb-2">
                Gamma (<KaTeX math="\Gamma" />)
              </h3>
              <KaTeX
                math="\Gamma = \frac{\phi(d_1)}{S\sigma\sqrt{T}}"
                display
                className="text-zinc-300"
              />
              <Prose>
                <p>
                  Gamma is the rate of change of delta with respect to the underlying.
                  It measures the curvature of the option&apos;s price curve. Gamma is
                  highest for ATM options near expiry and is always positive for long
                  options. High gamma means the position requires more frequent
                  rebalancing.
                </p>
              </Prose>
            </div>

            {/* Theta */}
            <div className="border-l-2 border-rose-500/40 pl-4">
              <h3 className="text-sm font-semibold text-rose-400 mb-2">
                Theta (<KaTeX math="\Theta" />)
              </h3>
              <KaTeX
                math="\Theta_{\text{call}} = -\frac{S\phi(d_1)\sigma}{2\sqrt{T}} - rKe^{-rT}N(d_2)"
                display
                className="text-zinc-300"
              />
              <Prose>
                <p>
                  Theta measures the rate of time decay--how much value an option loses
                  each day as it approaches expiration. Long options have negative theta
                  (time works against you). Theta accelerates as expiration approaches,
                  especially for ATM options.
                </p>
              </Prose>
            </div>

            {/* Vega */}
            <div className="border-l-2 border-violet-500/40 pl-4">
              <h3 className="text-sm font-semibold text-violet-400 mb-2">
                Vega (<KaTeX math="\mathcal{V}" />)
              </h3>
              <KaTeX
                math="\mathcal{V} = S\phi(d_1)\sqrt{T}"
                display
                className="text-zinc-300"
              />
              <Prose>
                <p>
                  Vega measures sensitivity to volatility. It is always positive for
                  long options--higher volatility increases option value. Vega is highest
                  for ATM options with longer time to expiry. Despite not being a Greek
                  letter, &ldquo;vega&rdquo; is universally used in practice.
                </p>
              </Prose>
            </div>

            {/* Rho */}
            <div className="border-l-2 border-cyan-500/40 pl-4">
              <h3 className="text-sm font-semibold text-cyan-400 mb-2">
                Rho (<KaTeX math="\rho" />)
              </h3>
              <KaTeX
                math="\rho_{\text{call}} = KTe^{-rT}N(d_2), \qquad \rho_{\text{put}} = -KTe^{-rT}N(-d_2)"
                display
                className="text-zinc-300"
              />
              <Prose>
                <p>
                  Rho measures sensitivity to the risk-free interest rate. Calls have
                  positive rho (higher rates increase call value) while puts have negative
                  rho. Rho is generally the least impactful Greek for short-dated options
                  but becomes significant for LEAPS.
                </p>
              </Prose>
            </div>
          </div>
        </Section>

        {/* Gamma-Theta Relationship */}
        <Section title="The Gamma-Theta Tradeoff">
          <Prose>
            <p>
              There is a fundamental relationship between gamma and theta that
              emerges directly from the Black-Scholes PDE. For a delta-hedged
              portfolio:
            </p>
          </Prose>
          <KaTeX
            math="\Theta + \frac{1}{2}\sigma^2 S^2 \Gamma = rV"
            display
            className="text-zinc-200"
          />
          <Prose>
            <p>
              This means you cannot have both positive gamma (benefiting from moves)
              and positive theta (benefiting from time). Long gamma positions bleed
              theta; short gamma positions collect theta but face blowup risk from
              large moves. This tradeoff is fundamental to options trading.
            </p>
          </Prose>
        </Section>

        {/* Limitations */}
        <Section title="Limitations & Extensions">
          <Prose>
            <p>
              The Black-Scholes model, while elegant, has well-known limitations:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                <strong className="text-zinc-300">Volatility smile/skew</strong>:
                Real markets exhibit implied volatility that varies by strike, violating
                the constant-vol assumption. This led to local volatility (Dupire) and
                stochastic volatility (Heston) models.
              </li>
              <li>
                <strong className="text-zinc-300">Fat tails</strong>: Asset returns
                exhibit heavier tails than the normal distribution predicts. Jump-diffusion
                models (Merton, Kou) address this.
              </li>
              <li>
                <strong className="text-zinc-300">Discrete hedging</strong>: Continuous
                hedging is impossible in practice. Discrete rebalancing introduces hedging
                error.
              </li>
              <li>
                <strong className="text-zinc-300">Transaction costs</strong>: Real
                friction costs make continuous delta-hedging prohibitively expensive.
              </li>
              <li>
                <strong className="text-zinc-300">American options</strong>: Early
                exercise requires numerical methods (binomial trees, finite differences).
              </li>
              <li>
                <strong className="text-zinc-300">Interest rate uncertainty</strong>:
                For longer-dated options, stochastic rates matter.
              </li>
            </ul>
            <p className="mt-3">
              Despite these limitations, the Black-Scholes framework remains the
              lingua franca of options pricing. Its Greeks are universally used for
              risk management, and its implied volatility has become the standard
              quoting convention for options markets worldwide.
            </p>
          </Prose>
        </Section>
      </div>
    </div>
  );
}
