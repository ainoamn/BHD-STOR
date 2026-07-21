"use client";

import React from "react";
import { motion } from "framer-motion";
import { Shield, Zap, Lock, Brain, Headphones, Globe } from "lucide-react";

/* ------------------------------------------------------------------ */
/*                         Features Data                               */
/* ------------------------------------------------------------------ */

const features = [
  {
    id: "trust",
    icon: Shield,
    title: "ثقة وأمان",
    titleEn: "Trust",
    description:
      "جميع المتجرات والبائعين معتمدين وموثقين. نظام تقييم شفاف يضمن تجربة تسوق آمنة لكل المستخدمين.",
    color: "#006400",
    bgColor: "#E8F5E9",
  },
  {
    id: "speed",
    icon: Zap,
    title: "سرعة التوصيل",
    titleEn: "Speed",
    description:
      "شبكة توصيل واسعة تغطي جميع ولايات سلطنة عمان مع خيارات توصيل سريعة خلال 24-48 ساعة.",
    color: "#D4AF37",
    bgColor: "#FFFDE7",
  },
  {
    id: "security",
    icon: Lock,
    title: "حماية كاملة",
    titleEn: "Security",
    description:
      "بوابات دفع آمنة مع تشفير SSL. حماية المشتري على كل عملية شراء مع إمكانية الإرجاع السهل.",
    color: "#1565C0",
    bgColor: "#E3F2FD",
  },
  {
    id: "ai",
    icon: Brain,
    title: "ذكاء اصطناعي",
    titleEn: "AI Powered",
    description:
      "مساعد ذكي يساعدك في اختيار المنتجات، المقارنة بينها، والحصول على توصيات مخصصة حسب اهتماماتك.",
    color: "#6A1B9A",
    bgColor: "#F3E5F5",
  },
  {
    id: "support",
    icon: Headphones,
    title: "دعم 24/7",
    titleEn: "Support",
    description:
      "فريق دعم متخصص جاهز لمساعدتك على مدار الساعة عبر الدردشة المباشرة، البريد الإلكتروني، أو الهاتف.",
    color: "#C41E3A",
    bgColor: "#FFEBEE",
  },
  {
    id: "multilang",
    icon: Globe,
    title: "متعدد اللغات",
    titleEn: "Multi-language",
    description:
      "تجربة مستخدم كاملة بالعربية والإنجليزية مع دعم RTL. واجهة سهلة ومألوفة لجميع المستخدمين.",
    color: "#00695C",
    bgColor: "#E0F2F1",
  },
];

/* ------------------------------------------------------------------ */
/*                            Component                                */
/* ------------------------------------------------------------------ */

export function WhyBHD() {
  return (
    <section className="py-20 bg-[#F8F5F0] dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[#D4AF37] text-sm font-semibold uppercase tracking-wider"
          >
            لماذا BHD؟
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold text-[#1a1a1a] dark:text-white mt-2"
          >
            مميزات تمنحك تجربة فريدة
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="text-gray-600 dark:text-gray-400 mt-3 max-w-2xl mx-auto"
          >
            نحن نعمل باستمرار لتوفير أفضل تجربة تسوق إلكتروني في سلطنة عمان
            من خلال حلول مبتكرة وخدمات متكاملة
          </motion.p>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="w-20 h-1 bg-[#D4AF37] mx-auto mt-4 rounded-full"
          />
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="group relative bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Icon */}
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: feature.bgColor, color: feature.color }}
              >
                <feature.icon className="w-7 h-7" />
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-[#1a1a1a] dark:text-white mb-2 group-hover:text-[#006400] transition-colors">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {feature.description}
              </p>

              {/* Hover accent line */}
              <div
                className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ backgroundColor: feature.color }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
