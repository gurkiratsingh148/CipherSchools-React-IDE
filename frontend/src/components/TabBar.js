// src/components/TabBar.js
import React, { useState, useRef, useEffect } from "react";
import "../App.css";

function TabBar({ tabs, activeId, onSwitch, onClose, onReorder, theme }) {
  const [draggingTab, setDraggingTab] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(-1);
  const [scrollPosition, setScrollPosition] = useState(0);
  const tabbarRef = useRef(null);
  const tabRefs = useRef({});

  // auto scroll dragging edges
  useEffect(() => {
    if (!draggingTab) return;

    const handleAutoScroll = (e) => {
      if (!tabbarRef.current) return;
      
      const rect = tabbarRef.current.getBoundingClientRect();
      const scrollThreshold = 50;
      const scrollSpeed = 10;

      if (e.clientX < rect.left + scrollThreshold) {
        tabbarRef.current.scrollLeft -= scrollSpeed;
      } else if (e.clientX > rect.right - scrollThreshold) {
        tabbarRef.current.scrollLeft += scrollSpeed;
      }
    };

    document.addEventListener('mousemove', handleAutoScroll);
    return () => document.removeEventListener('mousemove', handleAutoScroll);
  }, [draggingTab]);

  const handleDragStart = (e, tabId, index) => {
    e.dataTransfer.setData('text/plain', tabId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingTab({ id: tabId, index });
    
    // addfeedback
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(-1);
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceTabId = e.dataTransfer.getData('text/plain');
    const sourceIndex = tabs.findIndex(tab => tab.id === parseInt(sourceTabId));
    
    if (sourceIndex !== -1 && sourceIndex !== targetIndex && onReorder) {
      onReorder(sourceIndex, targetIndex);
    }
    
    setDraggingTab(null);
    setDragOverIndex(-1);
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    setDraggingTab(null);
    setDragOverIndex(-1);
  };

  const handleCloseAll = () => {
    if (window.confirm(`Close all ${tabs.length} tabs?`)) {
      tabs.forEach(tab => onClose(tab.id));
    }
  };

  const handleCloseOthers = (currentTabId) => {
    const otherTabs = tabs.filter(tab => tab.id !== currentTabId);
    if (otherTabs.length > 0) {
      if (window.confirm(`Close ${otherTabs.length} other tabs?`)) {
        otherTabs.forEach(tab => onClose(tab.id));
      }
    }
  };

  const handleCloseToRight = (currentTabId) => {
    const currentIndex = tabs.findIndex(tab => tab.id === currentTabId);
    const tabsToRight = tabs.slice(currentIndex + 1);
    if (tabsToRight.length > 0) {
      if (window.confirm(`Close ${tabsToRight.length} tabs to the right?`)) {
        tabsToRight.forEach(tab => onClose(tab.id));
      }
    }
  };

  const handleContextMenu = (e, tab) => {
    e.preventDefault();
    
    // remove existing context menu
    const existingMenu = document.querySelector('.tab-context-menu');
    if (existingMenu) {
      existingMenu.remove();
    }

    const menu = document.createElement('div');
    menu.className = 'tab-context-menu';
    menu.style.position = 'fixed';
    menu.style.left = `${e.clientX}px`;
    menu.style.top = `${e.clientY}px`;
    menu.style.zIndex = '1000';

    menu.innerHTML = `
      <div class="context-menu-item" data-action="close">Close</div>
      <div class="context-menu-item" data-action="closeOthers">Close Others</div>
      <div class="context-menu-item" data-action="closeToRight">Close To Right</div>
      <div class="context-menu-item" data-action="closeAll">Close All</div>
      <div class="context-menu-separator"></div>
      <div class="context-menu-item" data-action="copyPath">Copy Path</div>
      <div class="context-menu-item" data-action="revealInSidebar">Reveal in Sidebar</div>
    `;

    menu.addEventListener('click', (menuEvent) => {
      menuEvent.stopPropagation();
      const action = menuEvent.target.getAttribute('data-action');
      
      switch (action) {
        case 'close':
          onClose(tab.id);
          break;
        case 'closeOthers':
          handleCloseOthers(tab.id);
          break;
        case 'closeToRight':
          handleCloseToRight(tab.id);
          break;
        case 'closeAll':
          handleCloseAll();
          break;
        case 'copyPath':
          navigator.clipboard.writeText(tab.name).then(() => {
            const notification = document.createElement('div');
            notification.className = 'tab-notification';
            notification.textContent = `Copied: ${tab.name}`;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 2000);
          });
          break;
        case 'revealInSidebar':
          console.log('Reveal in sidebar:', tab.name);
          break;
      }
      
      menu.remove();
    });

    document.body.appendChild(menu);

    // close menu when clicking 
    const closeMenu = () => {
      menu.remove();
      document.removeEventListener('click', closeMenu);
    };
    document.addEventListener('click', closeMenu);
  };

  const getFileIcon = (filename) => {
    const ext = filename.split(".").pop().toLowerCase();
    const icons = {
      js: "🟨",
      jsx: "⚛️",
      ts: "🔵",
      tsx: "🌀",
      html: "🌐",
      css: "🎨",
      json: "📋",
      md: "📘",
      txt: "📄",
      png: "🖼️",
      jpg: "🖼️",
      jpeg: "🖼️",
      svg: "🎨",
      pdf: "📕",
    };
    return icons[ext] || "📝";
  };

  const getTabStatus = (tab) => {
    if (tab.isModified) return "modified";
    if (tab.hasErrors) return "error";
    return "saved";
  };

  const handleWheel = (e) => {
    if (tabbarRef.current) {
      tabbarRef.current.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  };

  const scrollToTab = (tabId) => {
    const tabElement = tabRefs.current[tabId];
    if (tabElement && tabbarRef.current) {
      const tabRect = tabElement.getBoundingClientRect();
      const containerRect = tabbarRef.current.getBoundingClientRect();
      
      if (tabRect.left < containerRect.left) {
        tabbarRef.current.scrollLeft -= (containerRect.left - tabRect.left);
      } else if (tabRect.right > containerRect.right) {
        tabbarRef.current.scrollLeft += (tabRect.right - containerRect.right);
      }
    }
  };

  // auto scroll to active tab
  useEffect(() => {
    if (activeId) {
      scrollToTab(activeId);
    }
  }, [activeId]);

  if (tabs.length === 0) {
    return (
      <div className="tabbar tabbar-empty">
        <div className="tabbar-placeholder">
          No files open. Click on a file in the sidebar to open it.
        </div>
      </div>
    );
  }

  return (
    <div className="tabbar-container">
      <div 
        className="tabbar"
        ref={tabbarRef}
        onWheel={handleWheel}
      >
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeId;
          const isDragging = draggingTab?.id === tab.id;
          const status = getTabStatus(tab);
          
          return (
            <div
              key={tab.id}
              ref={el => tabRefs.current[tab.id] = el}
              className={`
                tab 
                ${isActive ? "active" : ""} 
                ${isDragging ? "dragging" : ""}
                ${status !== "saved" ? `tab-${status}` : ""}
                ${dragOverIndex === index ? "drag-over" : ""}
              `}
              onClick={() => onSwitch(tab.id)}
              onContextMenu={(e) => handleContextMenu(e, tab)}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, tab.id, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              title={`${tab.name}${tab.isModified ? ' • Modified' : ''}`}
            >
              <div className="tab-content">
                <span className="tab-icon">
                  {getFileIcon(tab.name)}
                </span>
                <span className="tab-name">
                  {tab.name}
                </span>
                {tab.isModified && (
                  <span className="tab-modified-indicator" title="Modified">
                    ●
                  </span>
                )}
                {tab.hasErrors && (
                  <span className="tab-error-indicator" title="Errors">
                    ⚠
                  </span>
                )}
              </div>
              
              <button
                className="tab-close"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose(tab.id);
                }}
                aria-label={`Close ${tab.name}`}
                onMouseDown={(e) => e.stopPropagation()}
              >
                ×
              </button>

              {dragOverIndex === index && (
                <div className="tab-drop-indicator" />
              )}
            </div>
          );
        })}
        
        {/* scroll indicators */}
        <div className="tabbar-scroll-left" onClick={() => tabbarRef.current?.scrollBy({ left: -100, behavior: 'smooth' })}>
          ‹
        </div>
        <div className="tabbar-scroll-right" onClick={() => tabbarRef.current?.scrollBy({ left: 100, behavior: 'smooth' })}>
          ›
        </div>
      </div>

      {/* tab actions when many tabs are open */}
      {tabs.length > 5 && (
        <div className="tabbar-actions">
          <button 
            className="tabbar-action-btn"
            onClick={handleCloseAll}
            title="Close All Tabs"
          >
            Close All
          </button>
        </div>
      )}
    </div>
  );
}

export default TabBar;