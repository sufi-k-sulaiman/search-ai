import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Loader2, Image as ImageIcon } from "lucide-react";

export default function SummaryTab({ results, query }) {
  const [summary, setSummary] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (results.length > 0) {
      generateSummary();
    }
  }, [results]);

  const generateSummary = async () => {
    setLoading(true);
    setProgress(0);
    try {
      // Collect all text content
      setProgress(10);
      const allText = results
        .map(r => `${r.title || ""}\n${r.description || ""}`)
        .join("\n\n")
        .slice(0, 10000);

      // Generate summary content
      setProgress(30);
      const summaryRes = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on the following search results for "${query}", create a comprehensive summary divided into 4 distinct sections. Each section should be 2-3 paragraphs with a clear heading.

Search Results:
${allText}

Create 4 sections covering different aspects or themes found in the results. Make it informative and well-structured.`,
        response_json_schema: {
          type: "object",
          properties: {
            sections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  heading: { type: "string" },
                  content: { type: "string" }
                }
              }
            }
          }
        }
      });

      setSummary(summaryRes.sections || []);
      setProgress(50);

      // Generate 4 images based on the sections
      const imagePrompts = summaryRes.sections?.slice(0, 4).map((section, i) => 
        `Professional illustration representing: ${section.heading}. Modern, clean, abstract style with purple and violet color scheme.`
      ) || [];

      const imagePromises = imagePrompts.map((prompt, i) =>
        base44.integrations.Core.GenerateImage({ prompt }).then(result => {
          setProgress(50 + ((i + 1) / imagePrompts.length) * 50);
          return result;
        })
      );

      const imageResults = await Promise.all(imagePromises);
      setImages(imageResults.map(r => r.url));
      setProgress(100);
    } catch (err) {
      console.error("Summary generation failed:", err);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
        <p className="text-white/40 text-sm mb-4">Generating comprehensive summary...</p>
        <div className="w-64 h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            className="h-full bg-gradient-to-r from-purple-500 to-violet-500"
          />
        </div>
        <p className="text-purple-400 text-xs font-medium mt-2">{Math.round(progress)}%</p>
      </div>
    );
  }

  if (!summary || summary.length === 0) {
    return (
      <div className="text-center py-12 text-white/30 text-sm">
        No summary available
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {summary.map((section, i) => {
        const imageOnLeft = i % 2 === 0;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`flex flex-col ${imageOnLeft ? "md:flex-row" : "md:flex-row-reverse"} gap-6 items-start`}
          >
            {/* Image */}
            <div className="w-full md:w-1/2">
              <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden aspect-video relative">
                {images[i] ? (
                  <img
                    src={images[i]}
                    alt={section.heading}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="w-12 h-12 text-white/10" />
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="w-full md:w-1/2 space-y-4">
              <h2 className="text-2xl font-bold text-white/90">
                {section.heading}
              </h2>
              <div className="text-white/60 text-sm leading-relaxed whitespace-pre-line">
                {section.content}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}