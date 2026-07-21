"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Timer, Tag, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/Button";

/* ------------------------------------------------------------------ */
/*                          Offer Data                                 */
/* ------------------------------------------------------------------ */

const specialOffers = [
  {
    id: "1",
    title: "باقة التمور الفاخرة",
    titleEn: "Premium Dates Bundle",
    description: "3 أنواع من أفخر التمور العمانية في علبة فاخرة",
    image: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=500&h=350&fit=crop",
    price: 18.5,
    originalPrice: 32.0,
    discount: 42,
    currency: "OMR",
    stockTotal: 100,
    stockRemaining: 23,
    endsAt: Date.now() + 1000 * 60 * 60 * 12, // 12 hours from now
  },
  {
    id: "2",
    title: "صندوق الهدايا العمانية",
    titleEn: "Omani Gift Box",
    description: "تشكيلة من العطور والبخور والتمور في صندوق أنيق",
    image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&h=350&fit=crop",
    price: 45.0,
    originalPrice: 75.0,
    discount: 40,
    currency: "OMR",
    stockTotal: 50,
    stockRemaining: 8,
    endsAt: Date.now() + 1000 * 60 * 60 * 8, // 8 hours from now
  },
  {
    id: "3",
    title: "عسل السدر الجبلي",
    titleEn: "Mountain Sidr Honey",
    description: "عسل سدر طبيعي 100% من وادي بني خالد",
    image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&h=350&fit=crop",
    price: 28.0,
    originalPrice: 40.0,
    discount: 30,
    currency: "OMR",
    stockTotal: 80,
    stockRemaining: 35,
    endsAt: Date.now() + 1000 * 60 * 60 * 24, // 24 hours from now
  },
];

/* ------------------------------------------------------------------ */
/*                        Countdown Timer                              */
/* ------------------------------------------------------------------ */

function CountdownTimer({ targetTime }: { targetTime: number }) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetTime));

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft(targetTime);
      setTimeLeft(remaining);
      if (remaining.total <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetTime]);

  if (timeLeft.total <= 0) {
    return (
      <div className="text-[#C41E3A] font-bold text-sm">انتهى العرض</div>
    );
  }

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="flex items-center gap-2">
      <Timer className="w-4 h-4 text-[#C41E3A]" />
      <div className="flex items-center gap-1">
        {[
          { value: timeLeft.hours, label: "س" },
          { value: timeLeft.minutes, label: "د" },
          { value: timeLeft.seconds, label: "ث" },
        ].map((unit, i) => (
          <React.Fragment key={unit.label}>
            <div className="bg-[#1a1a1a] text-white rounded-lg px-2 py-1 min-w-[36px] text-center">
              <span className="text-sm font-bold tabular-nums">{pad(unit.value)}</span>
            </div>
            {i < 2 && <span className="text-[#1a1a1a] font-bold">:</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function calculateTimeLeft(target: number) {
  const total = target - Date.now();
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((total / (1000 * 60)) % 60);
  const seconds = Math.floor((total / 1000) % 60);
  return { total, hours, minutes, seconds };
}

/* ------------------------------------------------------------------ */
/*                            Component                                */
/* ------------------------------------------------------------------ */

export function SpecialOffers() {
  return (
    <section className="py-16 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2"
          >
            <Tag className="w-5 h-5 text-[#C41E3A]" />
            <span className="text-[#C41E3A] text-sm font-semibold uppercase tracking-wider">
              عروض محدودة
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold text-[#1a1a1a] dark:text-white mt-2"
          >
            صفقات لا تفوت
          </motion.h2>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="w-20 h-1 bg-[#C41E3A] mx-auto mt-4 rounded-full"
          />
        </div>

        {/* Offers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {specialOffers.map((offer, index) => (
            <motion.div
              key={offer.id}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300"
            >
              {/* Discount Badge */}
              <div className="absolute top-4 left-4 z-10 bg-[#C41E3A] text-white px-3 py-1.5 rounded-full text-sm font-bold">
                خصم {offer.discount}%
              </div>

              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={offer.image}
                  alt={offer.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>

              {/* Content */}
              <div className="p-5 space-y-4">
                {/* Title */}
                <div>
                  <h3 className="font-bold text-[#1a1a1a] dark:text-white text-lg">
                    {offer.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {offer.description}
                  </p>
                </div>

                {/* Countdown */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">ينتهي خلال</span>
                  <CountdownTimer targetTime={offer.endsAt} />
                </div>

                {/* Stock Progress */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">
                      متبقي {offer.stockRemaining} من {offer.stockTotal}
                    </span>
                    <span className="text-[#C41E3A] font-semibold">
                      {Math.round((offer.stockRemaining / offer.stockTotal) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{
                        width: `${(offer.stockRemaining / offer.stockTotal) * 100}%`,
                      }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.3 }}
                      className="h-full bg-gradient-to-l from-[#C41E3A] to-[#ff4d6d] rounded-full"
                    />
                  </div>
                </div>

                {/* Price & CTA */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-[#006400]">
                      {offer.price.toFixed(1)} {offer.currency}
                    </span>
                    <span className="text-sm text-gray-400 line-through">
                      {offer.originalPrice.toFixed(1)} {offer.currency}
                    </span>
                  </div>
                  <Button size="sm" leftIcon={<ShoppingCart className="w-4 h-4" />}>
                    اشتر
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
