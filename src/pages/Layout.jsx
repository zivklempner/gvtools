

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  FileText, LayoutDashboard, Menu, X, Calendar, Server, 
  ShieldAlert, BookOpen, Settings, Box, FileDigit, Cpu,
  Sun, Moon, Terminal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check local storage first, then system preference
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) {
      return stored === 'true';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Update body class and store preference
    document.body.classList.toggle('dark', isDarkMode);
    localStorage.setItem('darkMode', isDarkMode);
  }, [isDarkMode]);

  const menuItems = [
    { name: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" />, path: "Dashboard" },
    { name: "Systems Overview", icon: <Terminal className="w-5 h-5" />, path: "SystemsOverview" },
    { name: "Container", icon: <Box className="w-5 h-5" />, path: "Container" },
    { name: "SBOM Generation", icon: <FileDigit className="w-5 h-5" />, path: "ScanConfiguration" },
    { name: "Graviton Compatibility", icon: <Cpu className="w-5 h-5" />, path: "GravitonCompatibility" },
    { name: "Schedule", icon: <Calendar className="w-5 h-5" />, path: "Schedule" },
    { name: "Documentation", icon: <BookOpen className="w-5 h-5" />, path: "Documentation" },
    { name: "Import", icon: <FileText className="w-5 h-5" />, path: "Import" }
  ];

  return (
    <div className={cn(
      "flex h-screen transition-colors duration-200",
      isDarkMode ? "bg-gray-900" : "bg-gray-100"
    )}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 transform transition-all duration-200 ease-in-out md:relative md:translate-x-0",
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200",
        "border-r",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className={cn(
          "flex items-center justify-between p-4 border-b",
          isDarkMode ? "border-gray-700" : "border-gray-200"
        )}>
          <h1 className={cn(
            "text-xl font-bold flex items-center gap-2",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            <Server className="w-6 h-6 text-blue-600" />
            GVTools
          </h1>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className={cn("h-6 w-6", isDarkMode ? "text-gray-400" : "text-gray-600")} />
          </Button>
        </div>
        <nav className="px-4 py-4">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={createPageUrl(item.path)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-lg mb-1 transition-colors",
                currentPageName === item.path 
                  ? isDarkMode
                    ? "bg-blue-900/50 text-blue-400"
                    : "bg-blue-50 text-blue-600"
                  : isDarkMode
                    ? "text-gray-300 hover:bg-gray-700"
                    : "text-gray-700 hover:bg-gray-50",
              )}
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Theme Toggle at Bottom of Sidebar */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 p-4 border-t",
          isDarkMode ? "border-gray-700" : "border-gray-200"
        )}>
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setIsDarkMode(!isDarkMode)}
          >
            {isDarkMode ? (
              <Sun className="h-4 w-4 mr-2 text-yellow-500" />
            ) : (
              <Moon className="h-4 w-4 mr-2 text-blue-600" />
            )}
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile header */}
        <header className={cn(
          "md:hidden px-4 py-3 border-b",
          isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        )}>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className={cn("h-6 w-6", isDarkMode ? "text-gray-400" : "text-gray-600")} />
          </Button>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Add dark mode styles */}
      <style jsx global>{`
        .dark {
          color-scheme: dark;
        }

        .dark body {
          background-color: rgb(17, 24, 39);
          color: rgb(229, 231, 235);
        }

        .dark .bg-white {
          background-color: rgb(31, 41, 55);
        }

        .dark .text-gray-500 {
          color: rgb(156, 163, 175);
        }

        .dark .text-gray-900 {
          color: rgb(229, 231, 235);
        }

        .dark .border-gray-200 {
          border-color: rgb(55, 65, 81);
        }

        .dark .shadow-lg {
          --tw-shadow-color: rgb(0, 0, 0);
        }

        .dark .hover\:bg-gray-50:hover {
          background-color: rgb(55, 65, 81);
        }

        .dark .bg-blue-50 {
          background-color: rgba(59, 130, 246, 0.2);
        }

        .dark .bg-blue-50 * {
          color: rgb(147, 197, 253);
        }

        .dark .border-blue-200 {
          border-color: rgba(59, 130, 246, 0.3);
        }

        .dark .bg-gray-50 {
          background-color: rgb(31, 41, 55);
        }

        .dark .card,
        .dark .bg-white {
          background-color: rgb(31, 41, 55);
        }

        .dark table {
          --tw-border-opacity: 1;
          border-color: rgb(55, 65, 81);
        }

        .dark th {
          background-color: rgb(31, 41, 55);
        }

        .dark td {
          border-color: rgb(55, 65, 81);
        }

        .dark tr:hover {
          background-color: rgb(55, 65, 81);
        }

        .dark input,
        .dark select,
        .dark textarea {
          background-color: rgb(31, 41, 55);
          border-color: rgb(55, 65, 81);
          color: rgb(229, 231, 235);
        }

        .dark input::placeholder,
        .dark textarea::placeholder {
          color: rgb(156, 163, 175);
        }

        .dark button {
          --tw-border-opacity: 1;
          border-color: rgb(55, 65, 81);
        }

        .dark button:hover {
          background-color: rgb(55, 65, 81);
        }

        .dark code {
          background-color: rgb(31, 41, 55);
        }

        .dark pre {
          background-color: rgb(17, 24, 39);
        }

        .dark .prose {
          color: rgb(229, 231, 235);
        }

        .dark .prose h1,
        .dark .prose h2,
        .dark .prose h3,
        .dark .prose h4 {
          color: rgb(229, 231, 235);
        }

        .dark .prose code {
          color: rgb(229, 231, 235);
        }

        .dark .prose a {
          color: rgb(96, 165, 250);
        }

        .dark .prose strong {
          color: rgb(229, 231, 235);
        }
      `}</style>
    </div>
  );
}

