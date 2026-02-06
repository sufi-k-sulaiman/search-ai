import React from "react";
import { motion } from "framer-motion";

export default function StatCard({ label, value, icon: Icon, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5"
    >
      <div className={`absolute top-0 right-0 w-20 h-20 rounded-full ${color} opacity-[0.08] -translate-y-6 translate-x-6`} />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/40 text-xs font-medium tracking-wide uppercase mb-1">{label}</p>
          <p className="text-2xl font-bold text-white/90">{value}</p>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl bg-white/5`}>
            <Icon className="w-5 h-5 text-white/30" />
          </div>
        )}
      </div>
    </motion.div>
  );
}