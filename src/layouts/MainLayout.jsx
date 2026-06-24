import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { cn } from "../utils/classNames";

function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-transparent">
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
      />
      <main
        className={cn(
          "page-enter min-h-screen px-6 pb-12 pt-8 transition-[margin] duration-300 lg:px-10",
          isSidebarOpen ? "lg:ml-[240px] lg:w-[calc(100%-240px)]" : "lg:ml-[72px] lg:w-[calc(100%-72px)]"
        )}
      >
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
