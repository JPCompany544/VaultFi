"use client";

import { useState } from "react";
import { ChevronDown, Info, ExternalLink } from "lucide-react";

export default function DeFiPage() {
  const [activeFilter, setActiveFilter] = useState("All Assets");
  const [isBnbExpanded, setIsBnbExpanded] = useState(false);
  const [isAvalancheExpanded, setIsAvalancheExpanded] = useState(false);
  const [isSoneiumExpanded, setIsSoneiumExpanded] = useState(false);
  const [isCoreExpanded, setIsCoreExpanded] = useState(false);
  const [isMerlinExpanded, setIsMerlinExpanded] = useState(false);
  const [isBerachainExpanded, setIsBerachainExpanded] = useState(false);
  const [isSeiExpanded, setIsSeiExpanded] = useState(false);

  // BNB Chain dropdown data
  const bnbPools = [
    {
      title: "Zap in SolvBTC.BNB (18 Dec)",
      protocol: "Pendle",
      reward: "4X Solv Points",
      tvl: "$149.94M",
      apy: "2.40%",
      hasTransfer: false,
    },
    {
      title: "Stake SolvBTC.BNB LP token (18 Dec)",
      protocol: "Penpie",
      reward: "5X Solv Points",
      tvl: "$5.97M",
      apy: "5.45%",
      hasTransfer: false,
    },
    {
      title: "Stake SolvBTC.BNB LP token (18 Dec)",
      protocol: "Equilibria",
      reward: "4X Solv Points",
      tvl: "$1.13M",
      apy: "5.43%",
      hasTransfer: false,
    },
    {
      title: "Hold YT SolvBTC.BNB (18 Dec)",
      protocol: "Pendle",
      reward: "4X Solv Points",
      tvl: "$0.00",
      apy: "2.93%",
      hasTransfer: false,
    },
  ];

  // Avalanche dropdown data
  const avalanchePools = [
    {
      title: "Add Liquidity to SolvBTC.AVAX-SolvBTC",
      protocol: "LFJ.gg",
      reward: "3X Solv Points",
      tvl: "$8.89M",
      apy: "0.22%",
      hasTransfer: true,
    },
    {
      title: "Add Liquidity to BTC.b-SolvBTC.AVAX-SolvBTC and Stake LP Token",
      protocol: "Balancer",
      reward: "3X Solv Points",
      tvl: "$3.30M",
      apy: "4.32%",
      hasTransfer: true,
    },
  ];

  // Soneium dropdown data
  const soneiumPools = [
    {
      title: "Add Liquidity to SolvBTC-SolvBTC.JUP",
      protocol: "KyoFinance",
      reward: "3X Solv Points",
      tvl: "$23.36M",
      apy: "7.20%",
      hasTransfer: true,
    },
    {
      title: "Add Liquidity to SolvBTC-SolvBTC.JUP",
      protocol: "Sonex",
      reward: "3X Solv Points",
      tvl: "$21.38M",
      apy: "1.32%",
      hasTransfer: true,
    },
    {
      title: "Supply SolvBTC.JUP",
      protocol: "SakeFinance",
      reward: "3X Solv Points",
      tvl: "$6.35M",
      apy: "2.35%",
      hasTransfer: false,
    },
  ];

  // Core dropdown data
  const corePools = [
    {
      title: "Supply SolvBTC.CORE",
      protocol: "Colend",
      reward: "3X Solv Points",
      tvl: "$819.03",
      apy: "0.00%",
      hasTransfer: true,
    },
    {
      title: "Supply SolvBTC.CORE",
      protocol: "Segment",
      reward: "3X Solv Points",
      tvl: "$25.78",
      apy: "13.28%",
      hasTransfer: true,
    },
  ];

  // Merlin dropdown data
  const merlinPools = [
    {
      title: "Supply SolvBTC.MERL",
      protocol: "Avalon",
      reward: "3X Solv Points",
      tvl: "$398.04K",
      apy: "0.00%",
      hasTransfer: true,
    },
    {
      title: "Restake SolvBTC.MERL",
      protocol: "Pell",
      reward: "3X Solv Points",
      tvl: "$1.04K",
      apy: "--",
      hasTransfer: false,
    },
  ];

  // Berachain dropdown data
  const berachainPools = [
    {
      title: "Stake SolvBTC.BERA",
      protocol: "Infrared",
      reward: "4X Solv Points",
      tvl: "$13.51M",
      apy: "7.69%",
      hasTransfer: true,
    },
    {
      title: "Stake SolvBTC.BERA",
      protocol: "Beraborrow",
      reward: "4X Solv Points",
      tvl: "$49.19K",
      apy: "7.71%",
      hasTransfer: false,
    },
  ];

  // Sei dropdown data
  const seiPools = [
    {
      title: "Supply SolvBTC",
      protocol: "YEI",
      reward: "3X Solv Points",
      secondaryBadge: "SEI Incentives",
      tvl: "$107.96M",
      apy: "1.91%",
      hasTransfer: true,
    },
    {
      title: "Add Liquidity to SolvBTC-xSolvBTC",
      protocol: "Sailor Finance",
      reward: "3X Solv Points",
      secondaryBadge: "SEI Incentives",
      tvl: "$34.18M",
      apy: "3.06%",
      hasTransfer: true,
    },
    {
      title: "Supply xSolvBTC",
      protocol: "YEI",
      reward: "3X Solv Points",
      secondaryBadge: "SEI Incentives",
      tvl: "$5.42M",
      apy: "3.64%",
      hasTransfer: true,
    },
    {
      title: "Add Liquidity to WBTC-SolvBTC",
      protocol: "Sailor Finance",
      reward: "3X Solv Points",
      secondaryBadge: "SEI Incentives",
      tvl: "$5.08M",
      apy: "4.04%",
      hasTransfer: false,
    },
  ];

  const filters = [
    "All Assets",
    "SolvBTC",
    "xSolvBTC",
    "SolvBTC.TRADING",
    "SolvBTC.BERA",
    "Others",
  ];

  return (
    <div className="space-y-8">
      {/* Header Card - Elevated Section */}
      <div
        className="relative rounded-2xl p-8 md:p-12 lg:py-10 lg:px-12 mb-8"
        style={{
          backgroundColor: "#121212",
          boxShadow: "0px 0px 12px rgba(0, 0, 0, 0.3)",
        }}
      >
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8">
          {/* Left Column - Content */}
          <div className="flex-1 text-center lg:text-left">
            <h1
              className="text-5xl lg:text-6xl font-medium mb-3"
              style={{
                fontFamily: "Faculty-Glyphic, sans-serif",
                color: "#CFC8FF",
              }}
            >
              DeFi
            </h1>
            <p
              className="text-lg lg:text-xl"
              style={{
                color: "#A7A7A7",
                fontFamily: "Faculty-Glyphic, sans-serif",
              }}
            >
              Explore Limitless DeFi Opportunities
            </p>
          </div>

          {/* Right Column - Empty Placeholder */}
          <div className="flex-1 flex items-center justify-center min-h-[200px] lg:min-h-[240px]">
            {/* Future 3D figure placeholder */}
          </div>
        </div>
      </div>

      {/* Filter Bar and Dropdown */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
        {/* Pill Filter Bar */}
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-2">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-6 py-2.5 rounded-full whitespace-nowrap transition-all duration-300 ${
                activeFilter === filter
                  ? "shadow-[0_0_12px_rgba(207,200,255,0.4)]"
                  : ""
              }`}
              style={{
                backgroundColor: "#000000",
                color: activeFilter === filter ? "#CFC8FF" : "#C9C9C9",
                border: `1px solid ${activeFilter === filter ? "#CFC8FF" : "#CFC8FF"}`,
                fontFamily: "Faculty-Glyphic, sans-serif",
              }}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* All Protocols Dropdown */}
        <button
          className="flex items-center gap-2 px-6 py-2.5 rounded-full transition-all duration-300 hover:shadow-[0_0_8px_rgba(207,200,255,0.3)]"
          style={{
            backgroundColor: "#000000",
            color: "#C9C9C9",
            border: "1px solid #CFC8FF",
            fontFamily: "Faculty-Glyphic, sans-serif",
          }}
        >
          <span>All Protocols</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Pool Header Section */}
      <div className="w-full mt-6">
        <div
          className="w-full flex items-center justify-between px-6 py-4 rounded-xl overflow-x-auto"
          style={{
            backgroundColor: "#141414",
          }}
        >
          {/* Pool Column */}
          <div
            className="flex-1 text-left min-w-[100px] pool-header-text"
            style={{
              fontFamily: "Faculty-Glyphic, sans-serif",
              fontSize: "15px",
              fontWeight: 400,
              color: "#E0E0E0",
              letterSpacing: "0.3px",
              lineHeight: "1.6",
            }}
          >
            Pool
          </div>

          {/* Reward Column with Info Icon */}
          <div
            className="flex-1 flex items-center gap-1.5 min-w-[120px] pool-header-text"
            style={{
              fontFamily: "Faculty-Glyphic, sans-serif",
              fontSize: "15px",
              fontWeight: 400,
              color: "#E0E0E0",
              letterSpacing: "0.3px",
              lineHeight: "1.6",
            }}
          >
            <span>Reward</span>
            <Info
              className="w-3.5 h-3.5 cursor-pointer transition-colors duration-200"
              style={{ color: "#A5A5A5" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#CFC8FF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#A5A5A5";
              }}
            />
          </div>

          {/* TVL Column */}
          <div
            className="flex-1 text-right min-w-[80px] pool-header-text"
            style={{
              fontFamily: "Faculty-Glyphic, sans-serif",
              fontSize: "15px",
              fontWeight: 400,
              color: "#E0E0E0",
              letterSpacing: "0.3px",
              lineHeight: "1.6",
            }}
          >
            TVL
          </div>

          {/* APY Column */}
          <div
            className="flex-1 text-right min-w-[80px] pool-header-text"
            style={{
              fontFamily: "Faculty-Glyphic, sans-serif",
              fontSize: "15px",
              fontWeight: 400,
              color: "#E0E0E0",
              letterSpacing: "0.3px",
              lineHeight: "1.6",
            }}
          >
            APY
          </div>

          {/* Action Column */}
          <div
            className="flex-1 text-right min-w-[100px] pool-header-text"
            style={{
              fontFamily: "Faculty-Glyphic, sans-serif",
              fontSize: "15px",
              fontWeight: 400,
              color: "#E0E0E0",
              letterSpacing: "0.3px",
              lineHeight: "1.6",
            }}
          >
            Action
          </div>
        </div>

        {/* Pool Cards */}
        <div className="w-full space-y-3 mt-3">
          {/* Avalanche Card with Dropdown */}
          <div
            className="w-full rounded-xl transition-all duration-300 ease-in-out overflow-hidden"
            style={{ backgroundColor: "#141414" }}
          >
            {/* Parent Card Header */}
            <div className="w-full flex items-center justify-between px-6 py-4 cursor-pointer">
              <div className="flex-1 flex items-center gap-3 min-w-[100px]">
                <img
                  src="/defi/avalanche.svg"
                  alt="Avalanche"
                  className="object-contain w-9 h-9 sm:w-8 sm:h-8"
                  loading="lazy"
                />
                <span
                  style={{
                    fontFamily: "Faculty-Glyphic, sans-serif",
                    fontSize: "16px",
                    fontWeight: 500,
                    color: "#FFFFFF",
                  }}
                >
                  Avalanche
                </span>
              </div>

              <div className="flex-1 flex items-center gap-1.5 min-w-[120px]">
                <div
                  className="px-2 py-1 rounded-lg text-white text-xs font-medium"
                  style={{ backgroundColor: "#7C5CFC", fontSize: "12px" }}
                >
                  3X Solv Points
                </div>
                <div
                  className="px-2 py-1 rounded-lg text-xs font-medium"
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid #2A2A2A",
                    color: "#CFC8FF",
                    fontSize: "12px",
                  }}
                >
                  AVAX Incentives
                </div>
              </div>

              <div
                className="flex-1 text-right min-w-[80px]"
                style={{
                  fontFamily: "Faculty-Glyphic, sans-serif",
                  fontSize: "15px",
                  fontWeight: 500,
                  color: "#FFFFFF",
                }}
              >
                $14.89M
              </div>

              <div
                className="flex-1 text-right min-w-[80px]"
                style={{
                  fontFamily: "Faculty-Glyphic, sans-serif",
                  fontSize: "15px",
                  fontWeight: 500,
                  color: "#FFFFFF",
                }}
              >
                4.32%
              </div>

              <div className="flex-1 flex justify-end min-w-[100px]">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200"
                  style={{ border: "1px solid #2C2C2C" }}
                  onClick={() => setIsAvalancheExpanded(!isAvalancheExpanded)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#7C5CFC";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#2C2C2C";
                  }}
                >
                  <ChevronDown
                    className={`w-4 h-4 text-white transition-transform duration-300 ${
                      isAvalancheExpanded ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Dropdown Content */}
            <div
              className="transition-all duration-300 ease-in-out overflow-hidden"
              style={{
                maxHeight: isAvalancheExpanded ? "600px" : "0",
                opacity: isAvalancheExpanded ? 1 : 0,
              }}
            >
              {isAvalancheExpanded && (
                <div className="border-t border-neutral-800 mx-6 mb-3" />
              )}
              <div className="px-6 pb-4 space-y-3">
                {avalanchePools.map((pool, index) => (
                  <div
                    key={index}
                    className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl transition-all duration-200 shadow-md"
                    style={{ backgroundColor: "#1A1A1A" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#232323";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#1A1A1A";
                    }}
                  >
                    {/* Left Section - Pool Info */}
                    <div className="flex-1 flex items-center gap-3 min-w-[100px]">
                      <div className="relative w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center">
                        <div className="w-full h-full rounded-lg bg-gradient-to-br from-neutral-700 to-neutral-800" />
                        <img
                          src="/defi/avalanche.svg"
                          alt="AVAX"
                          className="absolute top-0.5 left-0.5 w-3 h-3"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span
                          style={{
                            fontFamily: "Faculty-Glyphic, sans-serif",
                            fontSize: "15px",
                            fontWeight: 500,
                            color: "#FFFFFF",
                          }}
                        >
                          {pool.title}
                        </span>
                        <span
                          style={{
                            fontFamily: "Faculty-Glyphic, sans-serif",
                            fontSize: "13px",
                            fontWeight: 400,
                            color: "#A0A0A0",
                          }}
                        >
                          {pool.protocol}
                        </span>
                      </div>
                    </div>

                    {/* Reward Badge */}
                    <div className="flex-1 flex items-center min-w-[120px]">
                      <div
                        className="px-2 py-1 rounded-lg text-white text-xs font-medium"
                        style={{
                          backgroundColor: "#7C5CFC",
                          fontSize: "12px",
                        }}
                      >
                        {pool.reward}
                      </div>
                    </div>

                    {/* TVL */}
                    <div
                      className="flex-1 text-right min-w-[80px]"
                      style={{
                        fontFamily: "Faculty-Glyphic, sans-serif",
                        fontSize: "15px",
                        fontWeight: 500,
                        color: "#FFFFFF",
                      }}
                    >
                      {pool.tvl}
                    </div>

                    {/* APY */}
                    <div
                      className="flex-1 text-right min-w-[80px]"
                      style={{
                        fontFamily: "Faculty-Glyphic, sans-serif",
                        fontSize: "15px",
                        fontWeight: 500,
                        color: "#FFFFFF",
                      }}
                    >
                      {pool.apy}
                    </div>

                    {/* Action Button */}
                    <div className="flex-1 flex justify-end min-w-[100px]">
                      <button
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200"
                        style={{
                          border: "1px solid #2A2A2A",
                          fontSize: "13px",
                          color: "#FFFFFF",
                          fontFamily: "Faculty-Glyphic, sans-serif",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#7C5CFC";
                          e.currentTarget.style.color = "#E0E0E0";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#2A2A2A";
                          e.currentTarget.style.color = "#FFFFFF";
                        }}
                      >
                        Get Started
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BNB Chain Card with Dropdown */}
          <div
            className="w-full rounded-xl transition-all duration-300 ease-in-out overflow-hidden"
            style={{ backgroundColor: "#141414" }}
          >
            {/* Parent Card Header */}
            <div className="w-full flex items-center justify-between px-6 py-4 cursor-pointer">
              <div className="flex-1 flex items-center gap-3 min-w-[100px]">
                <img
                  src="/defi/BNB.svg"
                  alt="BNB Chain"
                  className="object-contain w-9 h-9 sm:w-8 sm:h-8"
                  loading="lazy"
                />
                <span
                  style={{
                    fontFamily: "Faculty-Glyphic, sans-serif",
                    fontSize: "16px",
                    fontWeight: 500,
                    color: "#FFFFFF",
                  }}
                >
                  BNB Chain
                </span>
              </div>

              <div className="flex-1 flex items-center gap-1.5 min-w-[120px]">
                <div
                  className="px-2 py-1 rounded-lg text-white text-xs font-medium"
                  style={{ backgroundColor: "#7C5CFC", fontSize: "12px" }}
                >
                  6X Solv Points
                </div>
                <div
                  className="px-2 py-1 rounded-lg text-xs font-medium"
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid #2A2A2A",
                    color: "#CFC8FF",
                    fontSize: "12px",
                  }}
                >
                  Bridge
                </div>
              </div>

              <div
                className="flex-1 text-right min-w-[80px]"
                style={{
                  fontFamily: "Faculty-Glyphic, sans-serif",
                  fontSize: "15px",
                  fontWeight: 500,
                  color: "#FFFFFF",
                }}
              >
                $398.47M
              </div>

              <div
                className="flex-1 text-right min-w-[80px]"
                style={{
                  fontFamily: "Faculty-Glyphic, sans-serif",
                  fontSize: "15px",
                  fontWeight: 500,
                  color: "#FFFFFF",
                }}
              >
                5.45%
              </div>

              <div className="flex-1 flex justify-end min-w-[100px]">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200"
                  style={{ border: "1px solid #2C2C2C" }}
                  onClick={() => setIsBnbExpanded(!isBnbExpanded)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#7C5CFC";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#2C2C2C";
                  }}
                >
                  <ChevronDown
                    className={`w-4 h-4 text-white transition-transform duration-300 ${
                      isBnbExpanded ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Dropdown Content - Inside Parent Card */}
            <div
              className="transition-all duration-300 ease-in-out overflow-hidden"
              style={{
                maxHeight: isBnbExpanded ? "600px" : "0",
                opacity: isBnbExpanded ? 1 : 0,
              }}
            >
              {isBnbExpanded && (
                <div className="border-t border-neutral-800 mx-6 mb-3" />
              )}
              <div className="px-6 pb-4 space-y-3">
                {bnbPools.map((pool, index) => (
                  <div
                    key={index}
                    className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl transition-all duration-200 shadow-md"
                    style={{ backgroundColor: "#1A1A1A" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#232323";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#1A1A1A";
                    }}
                  >
                    {/* Left Section - Pool Info */}
                    <div className="flex-1 flex items-center gap-3 min-w-[100px]">
                      <div className="relative w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center">
                        {/* Protocol Logo Placeholder */}
                        <div className="w-full h-full rounded-lg bg-gradient-to-br from-neutral-700 to-neutral-800" />
                        {/* BNB Overlay Logo */}
                        <img
                          src="/defi/BNB.svg"
                          alt="BNB"
                          className="absolute top-0.5 left-0.5 w-3 h-3"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span
                          style={{
                            fontFamily: "Faculty-Glyphic, sans-serif",
                            fontSize: "15px",
                            fontWeight: 500,
                            color: "#FFFFFF",
                          }}
                        >
                          {pool.title}
                        </span>
                        <span
                          style={{
                            fontFamily: "Faculty-Glyphic, sans-serif",
                            fontSize: "13px",
                            fontWeight: 400,
                            color: "#A0A0A0",
                          }}
                        >
                          {pool.protocol}
                        </span>
                      </div>
                    </div>

                    {/* Reward Badge */}
                    <div className="flex-1 flex items-center min-w-[120px]">
                      <div
                        className="px-2 py-1 rounded-lg text-white text-xs font-medium"
                        style={{
                          backgroundColor: "#7C5CFC",
                          fontSize: "12px",
                        }}
                      >
                        {pool.reward}
                      </div>
                    </div>

                    {/* TVL */}
                    <div
                      className="flex-1 text-right min-w-[80px]"
                      style={{
                        fontFamily: "Faculty-Glyphic, sans-serif",
                        fontSize: "15px",
                        fontWeight: 500,
                        color: "#FFFFFF",
                      }}
                    >
                      {pool.tvl}
                    </div>

                    {/* APY */}
                    <div
                      className="flex-1 text-right min-w-[80px]"
                      style={{
                        fontFamily: "Faculty-Glyphic, sans-serif",
                        fontSize: "15px",
                        fontWeight: 500,
                        color: "#FFFFFF",
                      }}
                    >
                      {pool.apy}
                    </div>

                    {/* Action Button */}
                    <div className="flex-1 flex justify-end min-w-[100px]">
                      <button
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200"
                        style={{
                          border: "1px solid #2A2A2A",
                          fontSize: "13px",
                          color: "#FFFFFF",
                          fontFamily: "Faculty-Glyphic, sans-serif",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#7C5CFC";
                          e.currentTarget.style.color = "#E0E0E0";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#2A2A2A";
                          e.currentTarget.style.color = "#FFFFFF";
                        }}
                      >
                        Get Started
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Soneium Card with Dropdown */}
          <div
            className="w-full rounded-xl transition-all duration-300 ease-in-out overflow-hidden"
            style={{ backgroundColor: "#141414" }}
          >
            <div className="w-full flex items-center justify-between px-6 py-4 cursor-pointer">
              <div className="flex-1 flex items-center gap-3 min-w-[100px]">
                <img
                  src="/defi/soneium.jpg"
                  alt="Soneium"
                  className="object-contain w-9 h-9 sm:w-8 sm:h-8 rounded-full"
                  loading="lazy"
                />
                <span
                  style={{
                    fontFamily: "Faculty-Glyphic, sans-serif",
                    fontSize: "16px",
                    fontWeight: 500,
                    color: "#FFFFFF",
                  }}
                >
                  Soneium
                </span>
              </div>

              <div className="flex-1 flex items-center gap-1.5 min-w-[120px]">
                <div
                  className="px-2 py-1 rounded-lg text-white text-xs font-medium"
                  style={{ backgroundColor: "#7C5CFC", fontSize: "12px" }}
                >
                  3X Solv Points
                </div>
                <div
                  className="px-2 py-1 rounded-lg text-xs font-medium"
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid #2A2A2A",
                    color: "#CFC8FF",
                    fontSize: "12px",
                  }}
                >
                  SON Incentives
                </div>
              </div>

              <div
                className="flex-1 text-right min-w-[80px]"
                style={{
                  fontFamily: "Faculty-Glyphic, sans-serif",
                  fontSize: "15px",
                  fontWeight: 500,
                  color: "#FFFFFF",
                }}
              >
                $50.09M
              </div>

              <div
                className="flex-1 text-right min-w-[80px]"
                style={{
                  fontFamily: "Faculty-Glyphic, sans-serif",
                  fontSize: "15px",
                  fontWeight: 500,
                  color: "#FFFFFF",
                }}
              >
                7.20%
              </div>

              <div className="flex-1 flex justify-end min-w-[100px]">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200"
                  style={{ border: "1px solid #2C2C2C" }}
                  onClick={() => setIsSoneiumExpanded(!isSoneiumExpanded)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#7C5CFC";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#2C2C2C";
                  }}
                >
                  <ChevronDown
                    className={`w-4 h-4 text-white transition-transform duration-300 ${
                      isSoneiumExpanded ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </div>
            </div>

            <div
              className="transition-all duration-300 ease-in-out overflow-hidden"
              style={{
                maxHeight: isSoneiumExpanded ? "600px" : "0",
                opacity: isSoneiumExpanded ? 1 : 0,
              }}
            >
              {isSoneiumExpanded && (
                <div className="border-t border-neutral-800 mx-6 mb-3" />
              )}
              <div className="px-6 pb-4 space-y-3">
                {soneiumPools.map((pool, index) => (
                  <div
                    key={index}
                    className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl transition-all duration-200 shadow-md"
                    style={{ backgroundColor: "#1A1A1A" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#232323";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#1A1A1A";
                    }}
                  >
                    <div className="flex-1 flex items-center gap-3 min-w-[100px]">
                      <div className="relative w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center">
                        <div className="w-full h-full rounded-lg bg-gradient-to-br from-neutral-700 to-neutral-800" />
                        <img
                          src="/defi/soneium.jpg"
                          alt="SON"
                          className="absolute top-0.5 left-0.5 w-3 h-3 rounded-full"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span
                          style={{
                            fontFamily: "Faculty-Glyphic, sans-serif",
                            fontSize: "15px",
                            fontWeight: 500,
                            color: "#FFFFFF",
                          }}
                        >
                          {pool.title}
                        </span>
                        <span
                          style={{
                            fontFamily: "Faculty-Glyphic, sans-serif",
                            fontSize: "13px",
                            fontWeight: 400,
                            color: "#A0A0A0",
                          }}
                        >
                          {pool.protocol}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 flex items-center min-w-[120px]">
                      <div
                        className="px-2 py-1 rounded-lg text-white text-xs font-medium"
                        style={{
                          backgroundColor: "#7C5CFC",
                          fontSize: "12px",
                        }}
                      >
                        {pool.reward}
                      </div>
                    </div>

                    <div
                      className="flex-1 text-right min-w-[80px]"
                      style={{
                        fontFamily: "Faculty-Glyphic, sans-serif",
                        fontSize: "15px",
                        fontWeight: 500,
                        color: "#FFFFFF",
                      }}
                    >
                      {pool.tvl}
                    </div>

                    <div
                      className="flex-1 text-right min-w-[80px]"
                      style={{
                        fontFamily: "Faculty-Glyphic, sans-serif",
                        fontSize: "15px",
                        fontWeight: 500,
                        color: "#FFFFFF",
                      }}
                    >
                      {pool.apy}
                    </div>

                    <div className="flex-1 flex justify-end min-w-[100px]">
                      <button
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200"
                        style={{
                          border: "1px solid #2A2A2A",
                          fontSize: "13px",
                          color: "#FFFFFF",
                          fontFamily: "Faculty-Glyphic, sans-serif",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#7C5CFC";
                          e.currentTarget.style.color = "#E0E0E0";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#2A2A2A";
                          e.currentTarget.style.color = "#FFFFFF";
                        }}
                      >
                        Get Started
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Core Card with Dropdown */}
          <div
            className="w-full rounded-xl transition-all duration-300 ease-in-out overflow-hidden"
            style={{ backgroundColor: "#141414" }}
          >
            <div className="w-full flex items-center justify-between px-6 py-4 cursor-pointer">
              <div className="flex-1 flex items-center gap-3 min-w-[100px]">
                <img
                  src="/defi/core.jpg"
                  alt="Core"
                  className="object-contain w-9 h-9 sm:w-8 sm:h-8 rounded-full"
                  loading="lazy"
                />
                <span
                  style={{
                    fontFamily: "Faculty-Glyphic, sans-serif",
                    fontSize: "16px",
                    fontWeight: 500,
                    color: "#FFFFFF",
                  }}
                >
                  Core
                </span>
              </div>

              <div className="flex-1 flex items-center gap-1.5 min-w-[120px]">
                <div
                  className="px-2 py-1 rounded-lg text-white text-xs font-medium"
                  style={{ backgroundColor: "#7C5CFC", fontSize: "12px" }}
                >
                  3X Solv Points
                </div>
                <div
                  className="px-2 py-1 rounded-lg text-xs font-medium"
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid #2A2A2A",
                    color: "#CFC8FF",
                    fontSize: "12px",
                  }}
                >
                  CORE Incentives
                </div>
              </div>

              <div
                className="flex-1 text-right min-w-[80px]"
                style={{
                  fontFamily: "Faculty-Glyphic, sans-serif",
                  fontSize: "15px",
                  fontWeight: 500,
                  color: "#FFFFFF",
                }}
              >
                $844.81
              </div>

              <div
                className="flex-1 text-right min-w-[80px]"
                style={{
                  fontFamily: "Faculty-Glyphic, sans-serif",
                  fontSize: "15px",
                  fontWeight: 500,
                  color: "#FFFFFF",
                }}
              >
                13.28%
              </div>

              <div className="flex-1 flex justify-end min-w-[100px]">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200"
                  style={{ border: "1px solid #2C2C2C" }}
                  onClick={() => setIsCoreExpanded(!isCoreExpanded)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#7C5CFC";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#2C2C2C";
                  }}
                >
                  <ChevronDown
                    className={`w-4 h-4 text-white transition-transform duration-300 ${
                      isCoreExpanded ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </div>
            </div>

            <div
              className="transition-all duration-300 ease-in-out overflow-hidden"
              style={{
                maxHeight: isCoreExpanded ? "600px" : "0",
                opacity: isCoreExpanded ? 1 : 0,
              }}
            >
              {isCoreExpanded && (
                <div className="border-t border-neutral-800 mx-6 mb-3" />
              )}
              <div className="px-6 pb-4 space-y-3">
                {corePools.map((pool, index) => (
                  <div
                    key={index}
                    className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl transition-all duration-200 shadow-md"
                    style={{ backgroundColor: "#1A1A1A" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#232323";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#1A1A1A";
                    }}
                  >
                    <div className="flex-1 flex items-center gap-3 min-w-[100px]">
                      <div className="relative w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center">
                        <div className="w-full h-full rounded-lg bg-gradient-to-br from-neutral-700 to-neutral-800" />
                        <img
                          src="/defi/core.jpg"
                          alt="CORE"
                          className="absolute top-0.5 left-0.5 w-3 h-3 rounded-full"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span
                          style={{
                            fontFamily: "Faculty-Glyphic, sans-serif",
                            fontSize: "15px",
                            fontWeight: 500,
                            color: "#FFFFFF",
                          }}
                        >
                          {pool.title}
                        </span>
                        <span
                          style={{
                            fontFamily: "Faculty-Glyphic, sans-serif",
                            fontSize: "13px",
                            fontWeight: 400,
                            color: "#A0A0A0",
                          }}
                        >
                          {pool.protocol}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 flex items-center min-w-[120px]">
                      <div
                        className="px-2 py-1 rounded-lg text-white text-xs font-medium"
                        style={{
                          backgroundColor: "#7C5CFC",
                          fontSize: "12px",
                        }}
                      >
                        {pool.reward}
                      </div>
                    </div>

                    <div
                      className="flex-1 text-right min-w-[80px]"
                      style={{
                        fontFamily: "Faculty-Glyphic, sans-serif",
                        fontSize: "15px",
                        fontWeight: 500,
                        color: "#FFFFFF",
                      }}
                    >
                      {pool.tvl}
                    </div>

                    <div
                      className="flex-1 text-right min-w-[80px]"
                      style={{
                        fontFamily: "Faculty-Glyphic, sans-serif",
                        fontSize: "15px",
                        fontWeight: 500,
                        color: "#FFFFFF",
                      }}
                    >
                      {pool.apy}
                    </div>

                    <div className="flex-1 flex justify-end min-w-[100px]">
                      <button
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200"
                        style={{
                          border: "1px solid #2A2A2A",
                          fontSize: "13px",
                          color: "#FFFFFF",
                          fontFamily: "Faculty-Glyphic, sans-serif",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#7C5CFC";
                          e.currentTarget.style.color = "#E0E0E0";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#2A2A2A";
                          e.currentTarget.style.color = "#FFFFFF";
                        }}
                      >
                        Get Started
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Merlin Card with Dropdown */}
          <div
            className="w-full rounded-xl transition-all duration-300 ease-in-out overflow-hidden"
            style={{ backgroundColor: "#141414" }}
          >
            <div className="w-full flex items-center justify-between px-6 py-4 cursor-pointer">
              <div className="flex-1 flex items-center gap-3 min-w-[100px]">
                <img
                  src="/defi/merlin.jpg"
                  alt="Merlin"
                  className="object-contain w-9 h-9 sm:w-8 sm:h-8 rounded-full"
                  loading="lazy"
                />
                <span
                  style={{
                    fontFamily: "Faculty-Glyphic, sans-serif",
                    fontSize: "16px",
                    fontWeight: 500,
                    color: "#FFFFFF",
                  }}
                >
                  Merlin
                </span>
              </div>

              <div className="flex-1 flex items-center gap-1.5 min-w-[120px]">
                <div
                  className="px-2 py-1 rounded-lg text-white text-xs font-medium"
                  style={{ backgroundColor: "#7C5CFC", fontSize: "12px" }}
                >
                  3X Solv Points
                </div>
                <div
                  className="px-2 py-1 rounded-lg text-xs font-medium"
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid #2A2A2A",
                    color: "#CFC8FF",
                    fontSize: "12px",
                  }}
                >
                  MERL Incentives
                </div>
              </div>

              <div
                className="flex-1 text-right min-w-[80px]"
                style={{
                  fontFamily: "Faculty-Glyphic, sans-serif",
                  fontSize: "15px",
                  fontWeight: 500,
                  color: "#FFFFFF",
                }}
              >
                $399.08K
              </div>

              <div
                className="flex-1 text-right min-w-[80px]"
                style={{
                  fontFamily: "Faculty-Glyphic, sans-serif",
                  fontSize: "15px",
                  fontWeight: 500,
                  color: "#FFFFFF",
                }}
              >
                0.00%
              </div>

              <div className="flex-1 flex justify-end min-w-[100px]">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200"
                  style={{ border: "1px solid #2C2C2C" }}
                  onClick={() => setIsMerlinExpanded(!isMerlinExpanded)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#7C5CFC";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#2C2C2C";
                  }}
                >
                  <ChevronDown
                    className={`w-4 h-4 text-white transition-transform duration-300 ${
                      isMerlinExpanded ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </div>
            </div>

            <div
              className="transition-all duration-300 ease-in-out overflow-hidden"
              style={{
                maxHeight: isMerlinExpanded ? "600px" : "0",
                opacity: isMerlinExpanded ? 1 : 0,
              }}
            >
              {isMerlinExpanded && (
                <div className="border-t border-neutral-800 mx-6 mb-3" />
              )}
              <div className="px-6 pb-4 space-y-3">
                {merlinPools.map((pool, index) => (
                  <div
                    key={index}
                    className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl transition-all duration-200 shadow-md"
                    style={{ backgroundColor: "#1A1A1A" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#232323";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#1A1A1A";
                    }}
                  >
                    <div className="flex-1 flex items-center gap-3 min-w-[100px]">
                      <div className="relative w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center">
                        <div className="w-full h-full rounded-lg bg-gradient-to-br from-neutral-700 to-neutral-800" />
                        <img
                          src="/defi/merlin.jpg"
                          alt="MERL"
                          className="absolute top-0.5 left-0.5 w-3 h-3 rounded-full"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span
                          style={{
                            fontFamily: "Faculty-Glyphic, sans-serif",
                            fontSize: "15px",
                            fontWeight: 500,
                            color: "#FFFFFF",
                          }}
                        >
                          {pool.title}
                        </span>
                        <span
                          style={{
                            fontFamily: "Faculty-Glyphic, sans-serif",
                            fontSize: "13px",
                            fontWeight: 400,
                            color: "#A0A0A0",
                          }}
                        >
                          {pool.protocol}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 flex items-center min-w-[120px]">
                      <div
                        className="px-2 py-1 rounded-lg text-white text-xs font-medium"
                        style={{
                          backgroundColor: "#7C5CFC",
                          fontSize: "12px",
                        }}
                      >
                        {pool.reward}
                      </div>
                    </div>

                    <div
                      className="flex-1 text-right min-w-[80px]"
                      style={{
                        fontFamily: "Faculty-Glyphic, sans-serif",
                        fontSize: "15px",
                        fontWeight: 500,
                        color: "#FFFFFF",
                      }}
                    >
                      {pool.tvl}
                    </div>

                    <div
                      className="flex-1 text-right min-w-[80px]"
                      style={{
                        fontFamily: "Faculty-Glyphic, sans-serif",
                        fontSize: "15px",
                        fontWeight: 500,
                        color: "#FFFFFF",
                      }}
                    >
                      {pool.apy}
                    </div>

                    <div className="flex-1 flex justify-end min-w-[100px]">
                      <button
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200"
                        style={{
                          border: "1px solid #2A2A2A",
                          fontSize: "13px",
                          color: "#FFFFFF",
                          fontFamily: "Faculty-Glyphic, sans-serif",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#7C5CFC";
                          e.currentTarget.style.color = "#E0E0E0";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#2A2A2A";
                          e.currentTarget.style.color = "#FFFFFF";
                        }}
                      >
                        Get Started
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Berachain Card with Dropdown */}
          <div
            className="w-full rounded-xl transition-all duration-300 ease-in-out overflow-hidden"
            style={{ backgroundColor: "#141414" }}
          >
            <div className="w-full flex items-center justify-between px-6 py-4 cursor-pointer">
              <div className="flex-1 flex items-center gap-3 min-w-[100px]">
                <img
                  src="/defi/BERA.png"
                  alt="Berachain"
                  className="object-contain w-9 h-9 sm:w-8 sm:h-8 rounded-full"
                  loading="lazy"
                />
                <span
                  style={{
                    fontFamily: "Faculty-Glyphic, sans-serif",
                    fontSize: "16px",
                    fontWeight: 500,
                    color: "#FFFFFF",
                  }}
                >
                  Berachain
                </span>
              </div>

              <div className="flex-1 flex flex-col gap-1 min-w-[120px]">
                <div
                  className="px-2 py-1 rounded-lg text-white text-xs font-medium w-fit"
                  style={{ backgroundColor: "#9B5CFF", fontSize: "12px" }}
                >
                  4X Solv Points
                </div>
                <div
                  className="px-2 py-1 rounded-lg text-xs font-medium w-fit"
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid #2A2A2A",
                    color: "#CFC8FF",
                    fontSize: "12px",
                  }}
                >
                  Berachain PoL
                </div>
              </div>

              <div
                className="flex-1 text-right min-w-[80px]"
                style={{
                  fontFamily: "Faculty-Glyphic, sans-serif",
                  fontSize: "15px",
                  fontWeight: 500,
                  color: "#FFFFFF",
                }}
              >
                $30.38M
              </div>

              <div
                className="flex-1 text-right min-w-[80px]"
                style={{
                  fontFamily: "Faculty-Glyphic, sans-serif",
                  fontSize: "15px",
                  fontWeight: 500,
                  color: "#FFFFFF",
                }}
              >
                7.71%
              </div>

              <div className="flex-1 flex justify-end min-w-[100px]">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200"
                  style={{ border: "1px solid #2C2C2C" }}
                  onClick={() => setIsBerachainExpanded(!isBerachainExpanded)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#7C5CFC";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#2C2C2C";
                  }}
                >
                  <ChevronDown
                    className={`w-4 h-4 text-white transition-transform duration-300 ${
                      isBerachainExpanded ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </div>
            </div>

            <div
              className="transition-all duration-300 ease-in-out overflow-hidden"
              style={{
                maxHeight: isBerachainExpanded ? "600px" : "0",
                opacity: isBerachainExpanded ? 1 : 0,
              }}
            >
              {isBerachainExpanded && (
                <div className="border-t border-neutral-800 mx-6 mb-3" />
              )}
              <div className="px-6 pb-4 space-y-3">
                {berachainPools.map((pool, index) => (
                  <div
                    key={index}
                    className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl transition-all duration-200 shadow-md"
                    style={{ backgroundColor: "#1A1A1A" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#232323";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#1A1A1A";
                    }}
                  >
                    <div className="flex-1 flex items-center gap-3 min-w-[100px]">
                      <div className="relative w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center">
                        <div className="w-full h-full rounded-lg bg-gradient-to-br from-neutral-700 to-neutral-800" />
                      </div>
                      <div className="flex flex-col">
                        <span
                          style={{
                            fontFamily: "Faculty-Glyphic, sans-serif",
                            fontSize: "15px",
                            fontWeight: 500,
                            color: "#FFFFFF",
                          }}
                        >
                          {pool.title}
                        </span>
                        <span
                          style={{
                            fontFamily: "Faculty-Glyphic, sans-serif",
                            fontSize: "13px",
                            fontWeight: 400,
                            color: "#A0A0A0",
                          }}
                        >
                          {pool.protocol}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 flex items-center min-w-[120px]">
                      <div
                        className="px-2 py-1 rounded-lg text-white text-xs font-medium"
                        style={{
                          backgroundColor: "#9B5CFF",
                          fontSize: "12px",
                        }}
                      >
                        {pool.reward}
                      </div>
                    </div>

                    <div
                      className="flex-1 text-right min-w-[80px]"
                      style={{
                        fontFamily: "Faculty-Glyphic, sans-serif",
                        fontSize: "15px",
                        fontWeight: 500,
                        color: "#FFFFFF",
                      }}
                    >
                      {pool.tvl}
                    </div>

                    <div
                      className="flex-1 text-right min-w-[80px]"
                      style={{
                        fontFamily: "Faculty-Glyphic, sans-serif",
                        fontSize: "15px",
                        fontWeight: 500,
                        color: "#FFFFFF",
                      }}
                    >
                      {pool.apy}
                    </div>

                    <div className="flex-1 flex justify-end min-w-[100px]">
                      <button
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200"
                        style={{
                          border: "1px solid #2A2A2A",
                          fontSize: "13px",
                          color: "#FFFFFF",
                          fontFamily: "Faculty-Glyphic, sans-serif",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#7C5CFC";
                          e.currentTarget.style.color = "#E0E0E0";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#2A2A2A";
                          e.currentTarget.style.color = "#FFFFFF";
                        }}
                      >
                        Get Started
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sei Card with Dropdown */}
          <div
            className="w-full rounded-xl transition-all duration-300 ease-in-out overflow-hidden"
            style={{ backgroundColor: "#141414" }}
          >
            <div className="w-full flex items-center justify-between px-6 py-4 cursor-pointer">
              <div className="flex-1 flex items-center gap-3 min-w-[100px]">
                <img
                  src="/defi/sei.jpg"
                  alt="Sei"
                  className="object-contain w-9 h-9 sm:w-8 sm:h-8 rounded-full"
                  loading="lazy"
                />
                <span
                  style={{
                    fontFamily: "Faculty-Glyphic, sans-serif",
                    fontSize: "16px",
                    fontWeight: 500,
                    color: "#FFFFFF",
                  }}
                >
                  Sei
                </span>
              </div>

              <div className="flex-1 flex flex-col gap-1 min-w-[120px]">
                <div
                  className="px-2 py-1 rounded-lg text-white text-xs font-medium w-fit"
                  style={{ backgroundColor: "#9B5CFF", fontSize: "12px" }}
                >
                  3X Solv Points
                </div>
                <div
                  className="px-2 py-1 rounded-lg text-xs font-medium w-fit"
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid #2A2A2A",
                    color: "#CFC8FF",
                    fontSize: "12px",
                  }}
                >
                  SEI Incentives
                </div>
              </div>

              <div
                className="flex-1 text-right min-w-[80px]"
                style={{
                  fontFamily: "Faculty-Glyphic, sans-serif",
                  fontSize: "15px",
                  fontWeight: 500,
                  color: "#FFFFFF",
                }}
              >
                $152.64M
              </div>

              <div
                className="flex-1 text-right min-w-[80px]"
                style={{
                  fontFamily: "Faculty-Glyphic, sans-serif",
                  fontSize: "15px",
                  fontWeight: 500,
                  color: "#FFFFFF",
                }}
              >
                4.04%
              </div>

              <div className="flex-1 flex justify-end min-w-[100px]">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200"
                  style={{ border: "1px solid #2C2C2C" }}
                  onClick={() => setIsSeiExpanded(!isSeiExpanded)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#7C5CFC";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#2C2C2C";
                  }}
                >
                  <ChevronDown
                    className={`w-4 h-4 text-white transition-transform duration-300 ${
                      isSeiExpanded ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </div>
            </div>

            <div
              className="transition-all duration-300 ease-in-out overflow-hidden"
              style={{
                maxHeight: isSeiExpanded ? "800px" : "0",
                opacity: isSeiExpanded ? 1 : 0,
              }}
            >
              {isSeiExpanded && (
                <div className="border-t border-neutral-800 mx-6 mb-3" />
              )}
              <div className="px-6 pb-4 space-y-3">
                {seiPools.map((pool, index) => (
                  <div
                    key={index}
                    className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl transition-all duration-200 shadow-md"
                    style={{ backgroundColor: "#1A1A1A" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#232323";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#1A1A1A";
                    }}
                  >
                    <div className="flex-1 flex items-center gap-3 min-w-[100px]">
                      <div className="relative w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center">
                        <div className="w-full h-full rounded-lg bg-gradient-to-br from-neutral-700 to-neutral-800" />
                      </div>
                      <div className="flex flex-col">
                        <span
                          style={{
                            fontFamily: "Faculty-Glyphic, sans-serif",
                            fontSize: "15px",
                            fontWeight: 500,
                            color: "#FFFFFF",
                          }}
                        >
                          {pool.title}
                        </span>
                        <span
                          style={{
                            fontFamily: "Faculty-Glyphic, sans-serif",
                            fontSize: "13px",
                            fontWeight: 400,
                            color: "#A0A0A0",
                          }}
                        >
                          {pool.protocol}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 flex items-center gap-1.5 min-w-[120px]">
                      <div
                        className="px-2 py-1 rounded-lg text-white text-xs font-medium"
                        style={{
                          backgroundColor: "#9B5CFF",
                          fontSize: "12px",
                        }}
                      >
                        {pool.reward}
                      </div>
                      {pool.secondaryBadge && (
                        <div
                          className="px-2 py-1 rounded-lg text-xs font-medium"
                          style={{
                            backgroundColor: "transparent",
                            border: "1px solid #2A2A2A",
                            color: "#CFC8FF",
                            fontSize: "12px",
                          }}
                        >
                          {pool.secondaryBadge}
                        </div>
                      )}
                    </div>

                    <div
                      className="flex-1 text-right min-w-[80px]"
                      style={{
                        fontFamily: "Faculty-Glyphic, sans-serif",
                        fontSize: "15px",
                        fontWeight: 500,
                        color: "#FFFFFF",
                      }}
                    >
                      {pool.tvl}
                    </div>

                    <div
                      className="flex-1 text-right min-w-[80px]"
                      style={{
                        fontFamily: "Faculty-Glyphic, sans-serif",
                        fontSize: "15px",
                        fontWeight: 500,
                        color: "#FFFFFF",
                      }}
                    >
                      {pool.apy}
                    </div>

                    <div className="flex-1 flex justify-end gap-2 min-w-[100px]">
                      <button
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200"
                        style={{
                          border: "1px solid #2A2A2A",
                          fontSize: "13px",
                          color: "#FFFFFF",
                          fontFamily: "Faculty-Glyphic, sans-serif",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#7C5CFC";
                          e.currentTarget.style.color = "#E0E0E0";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#2A2A2A";
                          e.currentTarget.style.color = "#FFFFFF";
                        }}
                      >
                        Get Started
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
