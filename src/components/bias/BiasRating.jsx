import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

const getBiasColor = (score) => {
  if (score <= 3) return { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20", icon: CheckCircle };
  if (score <= 6) return { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20", icon: Info };
  return { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20", icon: AlertTriangle };
};

const getBiasLabel = (score) => {
  if (score <= 3) return "Low Bias";
  if (score <= 6) return "Moderate Bias";
  return "High Bias";
};

export default function BiasRating({ engine, score, reasoning }) {
  const colors = getBiasColor(score);
  const Icon = colors.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-xl border ${colors.border} ${colors.bg} p-4`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Icon className={`w-4 h-4 ${colors.text}`} />
            <h4 className="text-white/80 font-medium text-sm">{engine}</h4>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(score / 10) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full ${score <= 3 ? "bg-green-500" : score <= 6 ? "bg-yellow-500" : "bg-red-500"}`}
              />
            </div>
            <span className={`text-xs font-bold ${colors.text}`}>
              {score}/10
            </span>
          </div>
          <p className={`text-xs font-medium ${colors.text} mb-1`}>
            {getBiasLabel(score)}
          </p>
          {reasoning && (
            <p className="text-white/40 text-xs leading-relaxed">
              {reasoning}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}