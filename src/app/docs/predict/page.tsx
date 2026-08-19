import { DocsBreadcrumbs } from "@/components/docs/docs-breadcrumbs"
import { DocsPrevNext } from "@/components/docs/docs-prev-next"
import { getPrevNextPages } from "@/config/docs"

export const metadata = {
  title: "Predict · Xecute Docs",
  description: "Learn how Predict models hypothetical portfolio scenarios and market stress tests without making speculative price forecasts.",
}

export default function PredictPage() {
  const { prev, next } = getPrevNextPages("/docs/predict")

  return (
    <div className="space-y-8">
      <DocsBreadcrumbs section="Using Xecute" pageTitle="Predict" />

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Predict: Scenario Analytics
        </h1>
        <p className="text-sm text-foreground/70 leading-relaxed">
          Xecute performs quantitative portfolio stress-testing and scenario analysis based on current onchain wallet exposure, without making speculative market predictions.
        </p>
        <p className="text-sm text-foreground/70 leading-relaxed">
          Instead of generating speculative price predictions, Predict mode computes exact exposure math: how a hypothetical shift in token prices or network parameters impacts your current onchain holdings.
        </p>
      </div>

      {/* Predict vs Simulation */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col justify-between rounded-2xl border border-black/[0.07] bg-white p-5 shadow-2xs">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Predict Engine
              </h3>
              <span className="rounded bg-black/[0.04] px-2 py-0.5 text-[10px] font-medium text-foreground/50">
                Portfolio Scenarios
              </span>
            </div>
            <p className="text-xs text-foreground/70 leading-relaxed">
              Models asset price fluctuations and macroeconomic stress tests against your current wallet holdings.
            </p>
          </div>
          <div className="mt-4 rounded-xl bg-[#fafafa] p-3 border border-black/[0.04]">
            <span className="text-[10px] uppercase font-semibold text-foreground/45">Example Prompt</span>
            <p className="mt-1 font-mono text-xs text-foreground/80 font-medium">
              &ldquo;What happens to my portfolio if OKB drops 15%?&rdquo;
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-black/[0.07] bg-white p-5 shadow-2xs">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Simulation Engine
              </h3>
              <span className="rounded bg-black/[0.04] px-2 py-0.5 text-[10px] font-medium text-foreground/50">
                Pre-Flight Validation
              </span>
            </div>
            <p className="text-xs text-foreground/70 leading-relaxed">
              Simulation estimates how the transaction would behave against the currently observed chain state and can detect likely reverts or execution issues before signing.
            </p>
          </div>
          <div className="mt-4 rounded-xl bg-[#fafafa] p-3 border border-black/[0.04]">
            <span className="text-[10px] uppercase font-semibold text-foreground/45">Example Prompt</span>
            <p className="mt-1 font-mono text-xs text-foreground/80 font-medium">
              &ldquo;Swap 25 USDT to OKB&rdquo; → Dry Run
            </p>
          </div>
        </div>
      </div>

      {/* How Predict Calculates Exposure */}
      <div className="space-y-4 pt-2">
        <h2 id="exposure-calculation" className="text-lg font-semibold tracking-tight text-foreground">
          How Portfolio Exposure is Computed
        </h2>
        <div className="rounded-2xl border border-black/[0.07] bg-white p-5 space-y-3 shadow-2xs">
          <ol className="space-y-2 text-xs text-foreground/75 list-decimal list-inside">
            <li><strong>Live Onchain Query:</strong> Reads real-time token balances (OKB, USDT, USDC, WETH) from the user&apos;s connected wallet address via JSON-RPC.</li>
            <li><strong>Asset Weighting:</strong> Computes the total portfolio value and individual asset allocation percentages.</li>
            <li><strong>Delta Application:</strong> Applies the requested percentage change (e.g. $-10\%$) exclusively to the targeted asset.</li>
            <li><strong>Structured Impact Breakdown:</strong> Generates a clean breakdown showing total portfolio value change, new token valuation, and residual native gas buffer.</li>
          </ol>
        </div>
      </div>

      <DocsPrevNext prev={prev} next={next} />
    </div>
  )
}
