import React from 'react';
import { ThemeToggle } from './ThemeToggle';

interface SettingsProps {
  className?: string;
}

export const Settings: React.FC<SettingsProps> = ({ className = '' }) => {
  return (
    <div className={`settings-page ${className}`}>
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Customize your application preferences</p>
      </div>
      
      <div className="settings-content">
        <section className="settings-section">
          <h2>Appearance</h2>
          <div className="setting-item">
            <div className="setting-info">
              <h3>Theme</h3>
              <p>Choose between light and dark mode</p>
            </div>
            <div className="setting-control">
              <ThemeToggle />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
