"use client";

import { useState } from "react";

export default function StakingSection() {
  const [activeTab, setActiveTab] = useState<"stake" | "unstake">("stake");
  const [amount, setAmount] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "What is Staking and LBTC?",
      answer: `Staking Bitcoin provides additional Bitcoin returns.

Staking BTC mints LBTC, an institutional grade yield-bearing Bitcoin, fully-backed by BTC and free to compose throughout DeFi. LBTC allows allocators to grow their BTC holdings while retaining core exposure to the asset.

You deposit your Bitcoin to the unique address provided, from anywhere. The Security Consortium keeps Bitcoin reserves safe, while also putting your Bitcoin to work to secure other networks and generate revenue. LBTC holders can always redeem for native BTC.`,
    },
    {
      question: "What is the return?",
      answer: `The current 14-day trailing APY is: 0.47% paid in native BTC.

LBTC is a freely transferrable token that aims to generate consistent revenue, the first-step up the risk curve after holding native Bitcoin. As such, it serves as the top Bitcoin derivative across many DeFi applications and even entire blockchains.`,
    },
    {
      question: "Why is LBTC no longer 1:1 with Bitcoin?",
      answer: `LBTC is fully backed by Bitcoin. As yield accrues, each LBTC represents more BTC over time. That means when you stake BTC, you'll receive fewer LBTC units - but the same BTC value.

If you were to immediately unstake, you would receive the same amount of BTC back that you deposited (minus a small fixed network fee).`,
    },
    {
      question: "What are the risks?",
      answer: `Technical: As with all DeFi applications, key risks include smart contract risk and protocol risk. Lombard has been audited many times by the most reputable security teams, including OpenZeppelin and Veridise.

Market: LBTC is available to buy and sell on many secondary markets. Whilst LBTC has very deep liquidity across many ecosystems, these prices may fluctuate and the price may deviate from its redemption price. You can always access its underlying value in native Bitcoin, after the unstaking period (liquidity risk).

Financial: Slashing is the risk of validators misbehaving on any of the networks that Lombard secures. Lombard's design minimizes exposure by working only with reputable validator sets, and all validators that work with Lombard implement proprietary anti-slashing countermeasures.`,
    },
    {
      question: "Unstaking and fee information",
      answer: `You can unstake at any time by redeeming LBTC on-chain. Native BTC will be returned to you. This process takes 7-9 days to complete.

Fees include:
- A small network fee for minting (only if to Ethereum).
- A small fixed network fee for redeeming.
- Performance fee on rewards earned.`,
    },
  ];

  return (
    <section className="w-full min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a1a1a] to-black py-10">
      {/* Header */}
      <div className="w-full mb-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <img
                src="/vault-list-logos/BTC.png"
                alt="Bitcoin"
                className="w-8 h-8"
              />
              <h1
                className="text-5xl md:text-6xl font-semibold"
                style={{ color: "#9b5cff" }}
              >
                Stake BTC on VaultFi
              </h1>
            </div>
            <p className="text-lg md:text-xl text-gray-300">
              Stake BTC, receive LBTC, and earn native Bitcoin yield.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content: Two Cards Side by Side */}
      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row justify-center items-start gap-6 px-4 mb-20">
        {/* Main: Stake/Unstake Card */}
        <div className="flex-1 max-w-3xl mx-auto w-full">
          <div className="bg-white rounded-2xl p-10 shadow-2xl">
              {/* Toggle Tabs */}
              <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab("stake")}
                  className={`flex-1 py-3 px-6 rounded-lg  font-semibold transition-all duration-300 ${
                    activeTab === "stake"
                      ? "bg-white text-black shadow-md"
                      : "text-gray-500 hover:text-black"
                  }`}
                >
                  Stake
                </button>
                <button
                  onClick={() => setActiveTab("unstake")}
                  className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                    activeTab === "unstake"
                      ? "bg-white text-black shadow-md"
                      : "text-gray-500 hover:text-black"
                  }`}
                >
                  Unstake
                </button>
              </div>

              {/* Card Content */}
              <div>
                <h3 className="text-2xl font-bold text-black mb-6">
                  {activeTab === "stake" ? "Stake BTC" : "Unstake BTC"}
                </h3>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount ({activeTab === "stake" ? "BTC" : "LBTC"})
                  </label>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <img
                      src="/vault-list-logos/BTC.png"
                      alt="Bitcoin"
                      className="w-6 h-6"
                    />
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="flex-1 bg-transparent text-xl font-semibold outline-none text-black placeholder-gray-400"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    {activeTab === "stake" ? (
                      <>
                        APY: <span className="font-semibold text-[#9b5cff]">0.47%</span>
                      </>
                    ) : (
                      <>
                        Unstaking period: <span className="font-semibold">7-9 days</span>
                      </>
                    )}
                  </p>
                </div>

                <button
                  className="w-full py-4 px-6 rounded-xl font-bold text-white transition-all duration-300 shadow-lg hover:shadow-[#9b5cff]/50 hover:scale-[1.02]"
                  style={{ background: "#9b5cff" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#8a4aef";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#9b5cff";
                  }}
                >
                  {activeTab === "stake" ? "Stake" : "Unstake"}
                </button>
              </div>
            </div>
        </div>

        {/* LBTC Stats Card - Right Sidebar */}
        <aside className="w-full xl:w-[320px] xl:ml-6 xl:sticky xl:top-4 xl:self-start space-y-4">
            {/* LBTC Stats Card */}
            <div className="bg-white rounded-2xl p-6 shadow-xl">
              <h4 className="text-lg font-bold text-black mb-4">LBTC</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current Price</span>
                  <span className="text-base font-bold text-black">$103,624</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current APY</span>
                  <span className="text-base font-bold text-[#9b5cff]">0.47%</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current TVL</span>
                  <span className="text-base font-bold text-black">$1.2Bn</span>
                </div>
              </div>
            </div>

            {/* Price Trend Chart */}
            <div className="bg-white rounded-2xl p-6 shadow-xl">
              <h4 className="text-sm font-semibold text-gray-700 mb-4">
                LBTC Price Trend
              </h4>
              <div className="relative h-32">
                <svg
                  className="w-full h-full"
                  viewBox="0 0 300 100"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient
                      id="purpleGradient"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop
                        offset="0%"
                        style={{ stopColor: "#9b5cff", stopOpacity: 0.3 }}
                      />
                      <stop
                        offset="100%"
                        style={{ stopColor: "#9b5cff", stopOpacity: 0 }}
                      />
                    </linearGradient>
                  </defs>

                  {/* Area Fill */}
                  <path
                    d="M 0 70 L 50 50 L 100 55 L 150 40 L 200 45 L 250 30 L 300 35 L 300 100 L 0 100 Z"
                    fill="url(#purpleGradient)"
                  />

                  {/* Line */}
                  <path
                    d="M 0 70 L 50 50 L 100 55 L 150 40 L 200 45 L 250 30 L 300 35"
                    fill="none"
                    stroke="#9b5cff"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </div>
        </aside>
      </div>

      {/* FAQ Section */}
      <div className="w-full">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-2 text-white">
            Frequently Asked Questions
          </h2>
          <div
            className="w-24 h-1 mx-auto mb-12"
            style={{ background: "#9b5cff" }}
          ></div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-xl overflow-hidden shadow-lg transition-all duration-300"
              >
                <button
                  onClick={() =>
                    setExpandedFaq(expandedFaq === index ? null : index)
                  }
                  className="w-full text-left p-6 font-semibold transition-colors duration-300 flex justify-between items-center text-black hover:text-[#9b5cff]"
                >
                  <span>{faq.question}</span>
                  <svg
                    className={`w-5 h-5 transition-transform duration-300 ${
                      expandedFaq === index ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    expandedFaq === index
                      ? "max-h-[1000px] opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="p-6 pt-0 whitespace-pre-line text-gray-600">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
