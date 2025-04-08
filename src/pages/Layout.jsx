

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  LayoutDashboard,
  Calendar,
  Settings,
  FileText,
  Upload,
  Container,
  Cpu,
  BarChart,
  Plus,
  Boxes,
  FolderGit2,
  Laptop,
  Menu, 
  X, 
  Server, 
  ShieldAlert, 
  BookOpen, 
  FileDigit, 
  Sun, 
  Moon, 
  Terminal, 
  Folder,
  Database,
  Github
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Project } from "@/api/entities";

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) {
      return stored === 'true';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [currentProject, setCurrentProject] = useState(null);
  const [projectsList, setProjectsList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.toggle('dark', isDarkMode);
    localStorage.setItem('darkMode', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const projects = await Project.list();
      setProjectsList(projects);
      
      // Get current project from session storage
      const currentProjectId = sessionStorage.getItem('currentProjectId');
      if (currentProjectId) {
        const project = projects.find(p => p.id === currentProjectId);
        if (project) {
          setCurrentProject(project);
        }
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleProjectChange = (projectId) => {
    const project = projectsList.find(p => p.id === projectId);
    setCurrentProject(project);
    sessionStorage.setItem('currentProjectId', projectId);
    navigate(createPageUrl("Dashboard"));
  };

  // Add Applications to the menu items
  const menuItems = [
    { name: "Projects", icon: <Folder className="w-5 h-5" />, path: "Projects" },
    { name: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" />, path: "Dashboard", requiresProject: true },
    { name: "System Analysis", icon: <Terminal className="w-5 h-5" />, path: "SystemsOverview", requiresProject: true },
    { name: "Applications", icon: <Database className="w-5 h-5" />, path: "ApplicationsOverview", requiresProject: true },
    { name: "Graviton Compatibility", icon: <Cpu className="w-5 h-5" />, path: "GravitonCompatibility", requiresProject: true },
    { name: "Documentation", icon: <BookOpen className="w-5 h-5" />, path: "Documentation" },
    { name: "Docker Setup", icon: <Container className="w-5 h-5" />, path: "DockerInstructions" },
    { name: "GitHub Setup", icon: <Github className="w-5 h-5" />, path: "GitHubInstructions" }
  ];

  return (
    <div className={cn(
      "flex h-screen transition-colors duration-200",
      isDarkMode ? "bg-gray-900" : "bg-gray-100"
    )}>
      {/* Add global dark mode styles */}
      {isDarkMode && (
        <style jsx global>{`
          /* Improve selection visibility in dark mode */
          ::selection {
            background-color: rgba(59, 130, 246, 0.7) !important; /* blue-500 with opacity */
            color: white !important;
          }
          
          /* Improve highlighted text readability */
          .dark *::selection {
            background-color: rgba(59, 130, 246, 0.7) !important;
            color: white !important;
          }
          
          /* Improve focus states for elements */
          .dark :focus-visible {
            outline: 2px solid rgba(96, 165, 250, 0.7) !important; /* blue-400 */
            outline-offset: 2px;
          }
          
          /* Improve hover states for clickable elements */
          .dark .hover-highlight:hover {
            background-color: rgba(55, 65, 81, 0.7) !important; /* gray-700 */
          }
          
          /* Improve active states */
          .dark .active-highlight:active {
            background-color: rgba(75, 85, 99, 0.9) !important; /* gray-600 */
          }
          
          /* Fix for table row hover in dark mode */
          .dark .dark\\:hover\\:bg-gray-800:hover {
            background-color: rgba(31, 41, 55, 0.7) !important; /* gray-800 with opacity */
          }
          
          /* Improve selected item highlight */
          .dark .selected-item {
            background-color: rgba(59, 130, 246, 0.2) !important; /* blue-500 with low opacity */
            border-color: rgba(59, 130, 246, 0.5) !important; /* blue-500 with medium opacity */
          }
        `}</style>
      )}

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

        {/* Project Selector */}
        {currentPageName !== "Projects" && projectsList.length > 0 && (
          <div className="p-4 border-b dark:border-gray-700">
            <Select value={currentProject?.id} onValueChange={handleProjectChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Project" />
              </SelectTrigger>
              <SelectContent>
                {projectsList.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <nav className="px-4 py-4">
          {menuItems.map((item) => {
            // Skip menu items that require a project if no project is selected
            if (item.requiresProject && !currentProject && item.path !== "Projects") {
              return null;
            }

            return (
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
            );
          })}
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
    </div>
  );
}

