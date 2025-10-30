import React, { useState } from "react";

interface MenuHeaderProps {
  onTemplatesClick?: () => void;
  onSettingsClick?: () => void;
  onAboutClick?: () => void;
}

export default function MenuHeader({
  onTemplatesClick,
  onSettingsClick,
  onAboutClick,
}: MenuHeaderProps) {
  const [activeItem, setActiveItem] = useState<string | null>(null);

  const menuItems = [
    {
      id: "templates",
      label: "Templates",
      icon: "📝",
      onClick: onTemplatesClick,
    },
    {
      id: "settings",
      label: "Settings",
      icon: "⚙️",
      onClick: onSettingsClick,
    },
    {
      id: "about",
      label: "About",
      icon: "ℹ️",
      onClick: onAboutClick,
    },
  ];

  const handleItemClick = (item: typeof menuItems[0]) => {
    setActiveItem(item.id);
    item.onClick?.();
  };

  return (
    <nav className="relative w-full overflow-hidden rounded-lg border border-border dark:border-dark-border shadow-sm bg-panel dark:bg-dark-panel">
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b1221]/20 via-transparent to-[#0b1221]/15" />
      <div className="relative flex items-center justify-center gap-1 px-4 py-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item)}
            className={`
              flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium
              transition-all duration-200 ease-in-out
              hover:bg-background dark:hover:bg-dark-background
              hover:shadow-sm hover:scale-105
              ${
                activeItem === item.id
                  ? "bg-background dark:bg-dark-background text-text-primary dark:text-dark-text-primary shadow-sm"
                  : "text-text-secondary dark:text-dark-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary"
              }
            `}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}