import React, { useState, useRef, useEffect } from "react";
import "../App.css";

function TopBar({ 
  onSave, 
  onLoad, 
  onDelete,
  theme, 
  setTheme, 
  projectName, 
  setProjectName, 
  onExport, 
  onImport, 
  onNewProject,
  onRun,
  projectId,
  isRunning = false,
  hasUnsavedChanges = false,
  lastSaved = null 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const inputRef = useRef(null);
  const settingsRef = useRef(null);

  // handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // handle on off status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleProjectNameSubmit = () => {
    setIsEditing(false);
    if (!projectName.trim()) {
      setProjectName("Untitled Project");
    }
  };

  const handleProjectNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleProjectNameSubmit();
    } else if (e.key === 'Escape') {
      setProjectName("Untitled Project");
      setIsEditing(false);
    }
  };

  const handleSave = () => {
    onSave?.();
    
    // show save confirmation
    const notification = document.createElement('div');
    notification.className = 'topbar-notification';
    notification.textContent = `✓ Project saved${lastSaved ? ` at ${new Date().toLocaleTimeString()}` : ''}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.remove();
      }
    }, 2000);
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'new':
        onNewProject?.();
        break;
      case 'save':
        handleSave();
        break;
      case 'run':
        onRun?.();
        break;
      case 'export':
        onExport?.();
        break;
      case 'import':
        onImport?.();
        break;
      default:
        break;
    }
    setShowQuickActions(false);
  };

  const formatLastSaved = () => {
    if (!lastSaved) return 'Never';
    
    const now = new Date();
    const saved = new Date(lastSaved);
    const diffMs = now - saved;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return saved.toLocaleDateString();
  };

  const getStatusIndicator = () => {
    if (!isOnline) return { icon: '🔴', text: 'Offline', color: '#ef4444' };
    if (hasUnsavedChanges) return { icon: '🟡', text: 'Unsaved changes', color: '#f59e0b' };
    return { icon: '🟢', text: 'All changes saved', color: '#10b981' };
  };

  const status = getStatusIndicator();

  return (
    <header className="topbar">
      <div className="left-section">
        <div className="brand">
          <span className="brand-icon">🧠</span>
          <span className="brand-name">CipherStudio</span>
        </div>

        {/* project name editor */}
        <div className="project-info">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              className="project-title-editor"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onBlur={handleProjectNameSubmit}
              onKeyDown={handleProjectNameKeyDown}
              placeholder="Project name..."
              autoFocus
            />
          ) : (
            <div 
              className="project-title-display"
              onClick={() => setIsEditing(true)}
              title="Click to rename project"
            >
              <span className="project-name">{projectName}</span>
              <span className="edit-icon">✏️</span>
            </div>
          )}
        </div>

        {/* status indicator */}
        <div 
          className="status-indicator"
          style={{ '--status-color': status.color }}
          title={status.text}
        >
          <span className="status-icon">{status.icon}</span>
          <span className="status-text">{status.text}</span>
        </div>

        {/* last saved info. */}
        {lastSaved && (
          <div className="last-saved" title={`Last saved: ${new Date(lastSaved).toLocaleString()}`}>
            Last save: {formatLastSaved()}
          </div>
        )}
      </div>

      {/* center section quick actions */}
      <div className="center-section">
        <div className="quick-actions">
          <button
            className={`quick-action-btn ${hasUnsavedChanges ? 'has-changes' : ''}`}
            onClick={handleSave}
            title="Save Project (Ctrl+S)"
          >
            <span className="action-icon">💾</span>
            <span className="action-text">Save</span>
          </button>

          <button
            className="quick-action-btn"
            onClick={onLoad}
            title="Load Project"
          >
            <span className="action-icon">📂</span>
            <span className="action-text">Load</span>
          </button>

          <button
            className="quick-action-btn"
            onClick={onDelete}
            title="Delete Project"
          >
            <span className="action-icon">🗑️</span>
            <span className="action-text">Delete</span>
          </button>

          <button
            className={`quick-action-btn ${isRunning ? 'running' : ''}`}
            onClick={onRun}
            disabled={isRunning}
            title="Run Project"
          >
            <span className="action-icon">{isRunning ? '⏳' : '🚀'}</span>
            <span className="action-text">{isRunning ? 'Running...' : 'Run'}</span>
          </button>

          <div className="quick-actions-dropdown">
            <button
              className="quick-action-btn"
              onClick={() => setShowQuickActions(!showQuickActions)}
              title="More actions"
            >
              <span className="action-icon">⚡</span>
              <span className="action-text">More</span>
              <span className="dropdown-arrow">▼</span>
            </button>

            {showQuickActions && (
              <div className="quick-actions-menu">
                <button 
                  className="action-menu-item"
                  onClick={() => handleQuickAction('new')}
                >
                  <span className="menu-icon">🆕</span>
                  New Project
                </button>
                <button 
                  className="action-menu-item"
                  onClick={() => handleQuickAction('import')}
                >
                  <span className="menu-icon">📤</span>
                  Import Project
                </button>
                <button 
                  className="action-menu-item"
                  onClick={() => handleQuickAction('export')}
                >
                  <span className="menu-icon">📥</span>
                  Export Project
                </button>
                <div className="action-menu-divider"></div>
                <button 
                  className="action-menu-item"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  <span className="menu-icon">{theme === "dark" ? "☀️" : "🌙"}</span>
                  {theme === "dark" ? "Light Theme" : "Dark Theme"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/*  right section and settings */}
      <div className="right-section">
        {!isOnline && (
          <div className="offline-indicator" title="You are currently offline">
            🔴 Offline
          </div>
        )}

        {/* theme toggle */}
        <button
          className="topbar-btn theme-btn"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        >
          <span className="btn-icon">{theme === "dark" ? "☀️" : "🌙"}</span>
          <span className="btn-text">{theme === "dark" ? "Light" : "Dark"}</span>
        </button>

        {/* settings dropdown */}
        <div className="settings-dropdown" ref={settingsRef}>
          <button
            className="topbar-btn settings-btn"
            onClick={() => setShowSettings(!showSettings)}
            title="Settings and more"
          >
            <span className="btn-icon">⚙️</span>
            <span className="btn-text">Settings</span>
          </button>

          {showSettings && (
            <div className="settings-menu">
              <div className="settings-section">
                <h4>Appearance</h4>
                <button 
                  className="settings-menu-item"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  <span className="menu-icon">{theme === "dark" ? "☀️" : "🌙"}</span>
                  {theme === "dark" ? "Light Theme" : "Dark Theme"}
                </button>
                <button className="settings-menu-item">
                  <span className="menu-icon">🎨</span>
                  Editor Font Size
                </button>
              </div>

              <div className="settings-section">
                <h4>Project</h4>
                <button 
                  className="settings-menu-item"
                  onClick={onExport}
                >
                  <span className="menu-icon">📥</span>
                  Export Project
                </button>
                <button 
                  className="settings-menu-item"
                  onClick={onImport}
                >
                  <span className="menu-icon">📤</span>
                  Import Project
                </button>
                <button 
                  className="settings-menu-item"
                  onClick={onNewProject}
                >
                  <span className="menu-icon">🆕</span>
                  New Project
                </button>
              </div>

              <div className="settings-section">
                <h4>Help</h4>
                <button className="settings-menu-item">
                  <span className="menu-icon">📚</span>
                  Documentation
                </button>
                <button className="settings-menu-item">
                  <span className="menu-icon">🐛</span>
                  Report Issue
                </button>
                <button className="settings-menu-item">
                  <span className="menu-icon">ℹ️</span>
                  About CipherStudio
                </button>
              </div>
            </div>
          )}
        </div>

        {/* user Profile */}
        <div className="user-profile">
          <button className="profile-btn" title="User profile">
            <span className="profile-avatar">👤</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default TopBar;