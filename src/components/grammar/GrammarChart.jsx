import React, { useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const categoryColors = {
  nouns: "#a855f7",
  pronouns: "#c084fc",
  verbs: "#8b5cf6",
  adjectives: "#d946ef",
  adverbs: "#e879f9",
  prepositions: "#ec4899",
  conjunctions: "#a78bfa",
  articles: "#c4b5fd",
  interjections: "#f0abfc",
};

export default function GrammarChart({ analysis, selectedCategory, onCategoryClick }) {
  const [hoveredBar, setHoveredBar] = useState(null);
  
  if (!analysis) return null;

  const chartData = Object.entries(categoryColors).map(([key, color]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    key: key,
    count: analysis[key]?.length || 0,
    color,
  })).filter(d => d.count > 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
          <p className="text-white/90 text-sm font-medium">{payload[0].payload.name}</p>
          <p className="text-purple-400 text-xs mt-1">{payload[0].value} words</p>
        </div>
      );
    }
    return null;
  };

  const handleBarClick = (data) => {
    if (data && data.key) {
      onCategoryClick(selectedCategory === data.key ? null : data.key);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full h-64"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            angle={-30}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(139, 92, 246, 0.1)" }} />
          <Bar 
            dataKey="count" 
            radius={[6, 6, 0, 0]} 
            barSize={32}
            onClick={handleBarClick}
            onMouseEnter={(data) => setHoveredBar(data.key)}
            onMouseLeave={() => setHoveredBar(null)}
            className="cursor-pointer"
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={index} 
                fill={entry.color} 
                fillOpacity={
                  selectedCategory === entry.key ? 1 : 
                  hoveredBar === entry.key ? 0.9 : 0.7
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}