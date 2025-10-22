import React, { useState, useRef, useEffect } from "react";
import "../App.css";

function Sidebar({ files, setFiles, onSelect, activeFile, theme }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [recentFiles, setRecentFiles] = useState([]);

  // filter files search
  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (file.children && file.children.some(child => 
      child.name.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );

  const handleAddRootFile = () => {
    const name = prompt("Enter file name (e.g., newFile.js):");
    if (!name) return;
    
    // validate file extension
    const validExtensions = ['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'md', 'txt'];
    const ext = name.split('.').pop().toLowerCase();
    if (!validExtensions.includes(ext)) {
      alert(`Please use a valid file extension: ${validExtensions.join(', ')}`);
      return;
    }

    const newFile = { 
      id: Date.now(), 
      name, 
      type: "file", 
      code: getDefaultCode(name),
      createdAt: new Date().toISOString()
    };
    setFiles((prev) => [...prev, newFile]);
    onSelect(newFile);
  };

  const handleAddRootFolder = () => {
    const name = prompt("Enter folder name (e.g., components):");
    if (!name) return;
    const newFolder = { 
      id: Date.now(), 
      name, 
      type: "folder", 
      children: [],
      createdAt: new Date().toISOString()
    };
    setFiles((prev) => [...prev, newFolder]);
  };

  const getDefaultCode = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const templates = {
      js: `// ${filename}\nconsole.log("Hello, World!");`,
      jsx: `// ${filename}\nimport React from 'react';\n\nexport default function App() {\n  return (\n    <div>\n      <h1>Hello, World!</h1>\n    </div>\n  );\n}`,
      html: `<!DOCTYPE html>\n<html>\n<head>\n  <title>${filename}</title>\n</head>\n<body>\n  <h1>Hello, World!</h1>\n</body>\n</html>`,
      css: `/* ${filename} */\nbody {\n  margin: 0;\n  font-family: Arial, sans-serif;\n}`,
      json: `{\n  "name": "${filename.split('.')[0]}",\n  "version": "1.0.0"\n}`,
      md: `# ${filename.split('.')[0]}\n\nStart writing your documentation...`
    };
    return templates[ext] || `// ${filename}`;
  };

  const handleImportFiles = (event) => {
    const fileInput = event.target;
    const files = fileInput.files;
    
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newFile = {
          id: Date.now() + Math.random(),
          name: file.name,
          type: "file",
          code: e.target.result,
          createdAt: new Date().toISOString()
        };
        setFiles(prev => [...prev, newFile]);
        onSelect(newFile);
      };
      reader.readAsText(file);
    });
    
    // reset input
    fileInput.value = '';
  };

  const exportProject = () => {
    const projectData = {
      name: "CipherStudio Project",
      version: "1.0.0",
      files: files,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cipherstudio-project.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDragStart = (e, file) => {
    e.dataTransfer.setData('application/cipherstudio-file', JSON.stringify(file));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetFolder) => {
    e.preventDefault();
    const fileData = JSON.parse(e.dataTransfer.getData('application/cipherstudio-file'));
    
    // remove original position
    setFiles(prev => removeFileFromTree(prev, fileData.id));
    
    // add to target folder
    setFiles(prev => addFileToFolder(prev, targetFolder.id, fileData));
  };

  const removeFileFromTree = (files, fileId) => {
    return files.filter(file => {
      if (file.id === fileId) return false;
      if (file.children) {
        file.children = removeFileFromTree(file.children, fileId);
      }
      return true;
    });
  };

  const addFileToFolder = (files, folderId, fileData) => {
    return files.map(file => {
      if (file.id === folderId && file.type === 'folder') {
        return {
          ...file,
          children: [...(file.children || []), fileData]
        };
      }
      if (file.children) {
        return {
          ...file,
          children: addFileToFolder(file.children, folderId, fileData)
        };
      }
      return file;
    });
  };

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-header-main">
          <h2>🧠 CipherStudio</h2>
          <button 
            className="sidebar-toggle"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? "▶" : "◀"}
          </button>
        </div>
        {!collapsed && (
          <div className="sidebar-search">
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button 
                className="search-clear"
                onClick={() => setSearchTerm("")}
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>

      {!collapsed && (
        <>
          <div className="sidebar-stats">
            <span>{files.length} items</span>
            <span>{countFiles(files)} files</span>
            <span>{countFolders(files)} folders</span>
          </div>

          <div className="sidebar-content">
            <FileTree 
              data={searchTerm ? filteredFiles : files} 
              onSelect={onSelect} 
              setFiles={setFiles}
              activeFile={activeFile}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              searchTerm={searchTerm}
            />
          </div>

          <div className="sidebar-actions">
            <div className="sidebar-actions-primary">
              <button onClick={handleAddRootFile} className="sidebar-btn primary">
                <span className="btn-icon">📄</span>
                <span className="btn-text">New File</span>
              </button>
              <button onClick={handleAddRootFolder} className="sidebar-btn primary">
                <span className="btn-icon">📁</span>
                <span className="btn-text">New Folder</span>
              </button>
            </div>
            
            <div className="sidebar-actions-secondary">
              <label className="sidebar-btn secondary">
                <span className="btn-icon">📤</span>
                <span className="btn-text">Import</span>
                <input
                  type="file"
                  multiple
                  onChange={handleImportFiles}
                  style={{ display: 'none' }}
                />
              </label>
              <button onClick={exportProject} className="sidebar-btn secondary">
                <span className="btn-icon">📥</span>
                <span className="btn-text">Export</span>
              </button>
            </div>
          </div>

          {recentFiles.length > 0 && (
            <div className="recent-files">
              <h4>Recent Files</h4>
              {recentFiles.slice(0, 3).map(file => (
                <div 
                  key={file.id}
                  className="recent-file"
                  onClick={() => onSelect(file)}
                >
                  {getFileIcon(file.name)} {file.name}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </aside>
  );
}

// recursive tree component
function FileTree({ data, onSelect, setFiles, level = 0, parentPath = [], activeFile, onDragStart, onDragOver, onDrop, searchTerm }) {
  return (
    <ul className="file-tree">
      {data.map((item, index) => (
        <FileNode
          key={item.id}
          item={item}
          onSelect={onSelect}
          setFiles={setFiles}
          level={level}
          parentPath={[...parentPath, index]}
          activeFile={activeFile}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDrop={onDrop}
          searchTerm={searchTerm}
        />
      ))}
    </ul>
  );
}

function FileNode({ item, onSelect, setFiles, level, parentPath, activeFile, onDragStart, onDragOver, onDrop, searchTerm }) {
  const [open, setOpen] = useState(level === 0);
  const [isDragging, setIsDragging] = useState(false);
  const nodeRef = useRef(null);

  // auto open folders searching
  useEffect(() => {
    if (searchTerm && item.type === 'folder' && containsMatch(item, searchTerm)) {
      setOpen(true);
    }
  }, [searchTerm, item]);

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
      ico: "🏷️",
      gitignore: "🔒",
      env: "⚙️",
      lock: "🔒"
    };
    return icons[ext] || "📝";
  };

  const containsMatch = (item, term) => {
    if (item.name.toLowerCase().includes(term.toLowerCase())) return true;
    if (item.children) {
      return item.children.some(child => containsMatch(child, term));
    }
    return false;
  };

  const handleAddInside = (type) => {
    const name = prompt(`Enter ${type} name:`);
    if (!name) return;

    if (type === "file") {
      const validExtensions = ['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'md', 'txt'];
      const ext = name.split('.').pop().toLowerCase();
      if (!validExtensions.includes(ext)) {
        alert(`Please use a valid file extension: ${validExtensions.join(', ')}`);
        return;
      }
    }

    setFiles((prev) => {
      const newFiles = structuredClone(prev);
      let target = newFiles;
      for (let i = 0; i < parentPath.length; i++) {
        target = target[parentPath[i]].children;
      }

      if (type === "file") {
        target.push({
          id: Date.now(),
          name,
          type: "file",
          code: getDefaultCode(name),
          createdAt: new Date().toISOString()
        });
      } else {
        target.push({
          id: Date.now(),
          name,
          type: "folder",
          children: [],
          createdAt: new Date().toISOString()
        });
      }

      return newFiles;
    });
  };

  const handleDelete = () => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) return;

    setFiles((prev) => {
      const newFiles = structuredClone(prev);
      let target = newFiles;
      for (let i = 0; i < parentPath.length - 1; i++) {
        target = target[parentPath[i]].children;
      }
      target.splice(parentPath[parentPath.length - 1], 1);
      return newFiles;
    });
  };

  const handleRename = () => {
    const newName = prompt(`Rename "${item.name}":`, item.name);
    if (!newName || newName === item.name) return;

    setFiles((prev) => {
      const newFiles = structuredClone(prev);
      let target = newFiles;
      for (let i = 0; i < parentPath.length; i++) {
        target = target[parentPath[i]];
      }
      target.name = newName;
      return newFiles;
    });
  };

  const handleDragStart = (e) => {
    setIsDragging(true);
    onDragStart(e, item);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // folder
  if (item.type === "folder") {
    const isHighlighted = searchTerm && containsMatch(item, searchTerm);
    
    return (
      <li 
        className={`folder ${isHighlighted ? 'folder-highlighted' : ''} ${isDragging ? 'folder-dragging' : ''}`}
        style={{ paddingLeft: `${level * 16}px` }}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, item)}
      >
        <div className="folder-title-container">
          <div 
            className="folder-title"
            onClick={() => setOpen(!open)}
          >
            <span className="folder-icon">
              {open ? "📂" : "📁"}
            </span>
            <span className="folder-name">{item.name}</span>
            <span className="folder-badge">{item.children?.length || 0}</span>
          </div>
          <div className="folder-actions">
            <button onClick={() => handleAddInside("file")} title="Add File">
              📄
            </button>
            <button onClick={() => handleAddInside("folder")} title="Add Folder">
              📁
            </button>
            <button onClick={handleRename} title="Rename Folder">
              ✏️
            </button>
            <button onClick={handleDelete} title="Delete Folder">
              🗑️
            </button>
          </div>
        </div>

        {open && item.children && (
          <FileTree
            data={item.children}
            onSelect={onSelect}
            setFiles={setFiles}
            level={level + 1}
            parentPath={[...parentPath, "children"]}
            activeFile={activeFile}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            searchTerm={searchTerm}
          />
        )}
      </li>
    );
  }

  // file
  const isActive = activeFile?.id === item.id;
  const isHighlighted = searchTerm && item.name.toLowerCase().includes(searchTerm.toLowerCase());
  
  return (
    <li
      className={`file ${isActive ? 'file-active' : ''} ${isHighlighted ? 'file-highlighted' : ''} ${isDragging ? 'file-dragging' : ''}`}
      style={{ paddingLeft: `${level * 16 + 20}px` }}
      onClick={() => onSelect(item)}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="file-title-container">
        <span className="file-title">
          <span className="file-icon">{getFileIcon(item.name)}</span>
          <span className="file-name">{item.name}</span>
        </span>
        <div className="file-actions">
          <button
            className="file-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleRename();
            }}
            title="Rename File"
          >
            ✏️
          </button>
          <button
            className="file-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            title="Delete File"
          >
            🗑️
          </button>
        </div>
      </div>
    </li>
  );
}

// helper functions
function countFiles(files) {
  return files.reduce((count, item) => {
    if (item.type === 'file') return count + 1;
    if (item.children) return count + countFiles(item.children);
    return count;
  }, 0);
}

function countFolders(files) {
  return files.reduce((count, item) => {
    if (item.type === 'folder') {
      return count + 1 + (item.children ? countFolders(item.children) : 0);
    }
    return count;
  }, 0);
}

function getDefaultCode(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const templates = {
    js: `// ${filename}\nconsole.log("Hello, World!");`,
    jsx: `// ${filename}\nimport React from 'react';\n\nexport default function App() {\n  return (\n    <div>\n      <h1>Hello, World!</h1>\n    </div>\n  );\n}`,
    html: `<!DOCTYPE html>\n<html>\n<head>\n  <title>${filename}</title>\n</head>\n<body>\n  <h1>Hello, World!</h1>\n</body>\n</html>`,
    css: `/* ${filename} */\nbody {\n  margin: 0;\n  font-family: Arial, sans-serif;\n}`,
    json: `{\n  "name": "${filename.split('.')[0]}",\n  "version": "1.0.0"\n}`,
    md: `# ${filename.split('.')[0]}\n\nStart writing your documentation...`
  };
  return templates[ext] || `// ${filename}`;
}

function getFileIcon(filename) {
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
    ico: "🏷️",
    gitignore: "🔒",
    env: "⚙️",
    lock: "🔒",
  };
  return icons[ext] || "📝";
}


export default Sidebar;