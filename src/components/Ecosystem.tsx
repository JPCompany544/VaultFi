"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
export default function Ecosystem() {
  const [activeCard, setActiveCard] = useState(0);
  const cards = [
    {
        title: "Institutions",
        description:
          "Onchain funds and asset managers allocate to LBTC strategies to return value to their customers.",
        logos: [
          "/tinified/franklin-templeton-dark.svg",
          "/tinified/galaxy-dark.svg"
        ],
        icon: "/tinified/institutions-logo.svg",
      },
      
    { title: "Leading Protocols", 
        description: "Onchain funds and asset managers allocate to LBTC strategies to return value to their customers.", 
        logo: "/tinified/aave-dark.svg", 
        icon: "/tinified/leading-protocols.svg" },

    { title: "Exchanges", 
        description: "Onchain funds and asset managers allocate to LBTC strategies to return value to their customers.", 
        logos: ["/tinified/bybit-dark.svg",
            "/tinified/binance-dark.svg"
        ], 
        icon: "/tinified/exchanges.svg" },

    { title: "Bitcoin Holders", 
        description: "Onchain funds and asset managers allocate to LBTC strategies to return value to their customers.", 
         
        icon: "/tinified/Bitcoin-holders.svg" },

    { title: "Custodians", 
        description: "Onchain funds and asset managers allocate to LBTC strategies to return value to their customers.", 
        logos: ["/tinified/cubist-dark.svg",
            "/tinified/ceffu-dark.svg"
        ], 
        icon: "/tinified/custodians.svg" },

    { title: "Staking providers", 
        description: "Onchain funds and asset managers allocate to LBTC strategies to return value to their customers.",
        logos: ["/tinified/figment-dark.svg",
            "/tinified/kiln-dark.svg"
        ],
        icon: "/tinified/Staking-providers.svg" },

    { title: "Wallets", 
        description: "Onchain funds and asset managers allocate to LBTC strategies to return value to their customers.", 
        logos: ["/tinified/bybit-dark.svg",
            "/tinified/binance-dark.svg"
        ],  
        icon: "/tinified/Wallet.svg" },

    { title: "Restaking platforms", 
        description: "Onchain funds and asset managers allocate to LBTC strategies to return value to their customers.", 
        logos: ["/tinified/symbiotic-dark.svg",
            "/tinified/eigen-dark.svg"
        ],  
        icon: "/tinified/Restaking-platform.svg" },
  ];
  const [mounted, setMounted] = useState(false);

  const getLogos = (card: any): string[] => {
    if (Array.isArray(card?.logos)) return card.logos as string[];
    if (card?.logo) return [card.logo as string];
    return [];
  };

  useEffect(() => {
    if (cards.length === 0) return;
    const interval = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % cards.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [cards.length]);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="w-full overflow-x-hidden bg-[#0d0d0d] py-20 px-8 md:px-16 lg:px-32">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <div className="text-left">
            <p className="text-sm text-[#A0A0A0] mb-2 __Archivo_2aad3c">Ecosystem</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-[#EDEDED] tracking-wide leading-tight __Archivo_2aad3c">
              Trusted by Bitcoin Holders, Institutions, and Developers Worldwide
            </h2>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative overflow-hidden min-h-[240px]">
          <motion.div
            className="flex gap-6"
            initial={false}
            animate={{ x: mounted ? -activeCard * (320 + 24) : 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            {cards.map((card, index) => (
              <motion.div
                key={index}
                className="flex-shrink-0 w-[320px] h-[220px] md:w-[360px] md:h-[240px]"
                initial={false}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Card
                  className={`h-full rounded-2xl shadow-md transition-all duration-500 ease-in-out ${
                    index === activeCard ? "bg-white text-black" : "bg-black text-white"
                  }`}
                >
                  <CardContent className="p-6 h-full flex flex-col">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <img src={card.icon || "/institution-logo.svg"} alt={card.title} className="w-6 h-6" />
                        <h3 className="font-bold text-lg">{card.title}</h3>
                      </div>

                      {index === activeCard && (
                        <motion.div
                          initial={false}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.2 }}
                        >
                          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                            {card.description}
                          </p>
                          <div
                            className={`border-t ${
                              index === activeCard
                                ? "border-neutral-300"
                                : "border-neutral-700"
                            } pt-4`}
                          >
                            <div className="flex items-center gap-4 flex-wrap">
                              {getLogos(card).map((src: string, li: number) => (
                                <img
                                  key={li}
                                  src={src}
                                  alt={`${card.title} logo ${li + 1}`}
                                  className="h-8 w-auto max-w-full object-contain"
                                />
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
