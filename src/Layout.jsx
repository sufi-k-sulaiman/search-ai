import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { Search, Clock, Sparkles } from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const navItems = [
    { name: "Search", icon: Search, page: "Search" },
    { name: "History", icon: Clock, page: "History" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <style>{`
        :root {
          --background: 0 0% 4%;
          --foreground: 0 0% 98%;
          --card: 0 0% 6%;
          --card-foreground: 0 0% 98%;
          --popover: 0 0% 6%;
          --popover-foreground: 0 0% 98%;
          --primary: 270 91% 50%;
          --primary-foreground: 0 0% 100%;
          --secondary: 0 0% 10%;
          --secondary-foreground: 0 0% 98%;
          --muted: 0 0% 10%;
          --muted-foreground: 0 0% 64%;
          --accent: 0 0% 10%;
          --accent-foreground: 0 0% 98%;
          --border: 0 0% 12%;
          --input: 0 0% 12%;
          --ring: 270 91% 50%;
        }
        body {
          background-color: #0a0a0f;
        }
      `}</style>

      {/* Top nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#0a0a0f]/80 border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link to={createPageUrl("Search")} className="flex items-center gap-2.5">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698618bcc713d9c1a4f80de9/22f06fc73_1cPlatformlogo.png" 
              alt="Search AI Logo" 
              className="w-7 h-7 rounded-lg"
            />
            <span className="text-white/90 font-semibold text-sm tracking-tight">Search Ai</span>
          </Link>
          <div className="flex items-center gap-1">
            {navItems.map(item => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-white/40 hover:text-white/60 hover:bg-white/5"
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Page content */}
      <div className="pt-14 pb-20">
        {children}
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 backdrop-blur-xl bg-[#0a0a0f]/80 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-center">
          <p className="text-white/40 text-xs">
            Copyright © 2026{" "}
            <a
              href="https://1cplatform.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white/90 transition-colors"
            >
              1cPlatform
            </a>
            . Developed by{" "}
            <a
              href="https://sufikhan.com/"
              target="_blank"
              rel="noopener noreferrer"
              title="Sufi Khan Sulaiman - 20+ years of building scalable Ecommerce solutions"
              className="text-white/60 hover:text-white/90 transition-colors"
            >
              Sufi Khan Sulaiman
            </a>
            . All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}