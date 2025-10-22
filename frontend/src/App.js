import React, { useEffect, useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import CodeEditor from "./components/CodeEditor";
import Preview from "./components/Preview";
import TabBar from "./components/TabBar";
import TopBar from "./components/TopBar";

const initialFiles = [
  {
    id: "public",
    name: "public",
    type: "folder",
    children: [
      { id: "html1", name: "index.html", type: "file", code: "<h1>Hello World!</h1>" },
    ],
  },
  {
    id: "src",
    name: "src",
    type: "folder",
    children: [
      { id: "js1", name: "App.js", type: "file", code: "console.log('Hello from App.js')" },
      { id: "css1", name: "style.css", type: "file", code: "body { background: #fafafa; }" },
    ],
  },
  {
    id: "pkg",
    name: "package.json",
    type: "file",
    code: '{ "name": "cipherstudio", "version": "1.0.0" }',
  },
];

const MAX_TABS = 5;

function App() {
  // file system
  const [files, setFiles] = useState(() => {
    const saved = localStorage.getItem("cipherstudio-project");
    return saved ? JSON.parse(saved) : initialFiles;
  });

  // theme
  const [theme, setTheme] = useState(
    localStorage.getItem("cipherstudio-theme") || "dark"
  );

  // tabs
  const [openTabs, setOpenTabs] = useState(() => [initialFiles[0]]);
  const [activeFileId, setActiveFileId] = useState(initialFiles[0].id);

  // active file 
  const activeFile = files.find((f) => f.id === activeFileId) || files[0];
  const [code, setCode] = useState(activeFile.code);

  


  const [projectName, setProjectName] = useState("MyProject");
  const [projectId, setProjectId] = useState(localStorage.getItem("lastProjectId") || null);


  useEffect(() => {
    setCode(activeFile.code);
  }, [activeFileId]);


  useEffect(() => {
    localStorage.setItem("cipherstudio-project", JSON.stringify(files));
  }, [files]);

  // persist theme
  useEffect(() => {
    localStorage.setItem("cipherstudio-theme", theme);
    document.body.classList.toggle("light", theme === "light");
  }, [theme]);

  // update file code
  useEffect(() => {
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFile.id ? { ...f, code } : f))
    );
  }, [code]);

  // new file
  function handleNewFile() {
    const name = prompt("Enter file name (e.g. NewFile.js)");
    if (!name) return;
    if (files.some((f) => f.name === name)) {
      alert("A file with that name already exists.");
      return;
    }
    const nf = { id: Date.now(), name, code: "// New File" };
    setFiles((prev) => [...prev, nf]);
    openTab(nf.id);
  }

  // delete file
  function handleDeleteFile(id) {
    if (files.length === 1) return alert("At least one file required!");
    setFiles((prev) => prev.filter((f) => f.id !== id));
    closeTab(id, { silent: true });
    if (activeFileId === id) {
      const remaining = files.filter((f) => f.id !== id);
      if (remaining.length) {
        const nextId = (openTabs.find((t) => t.id !== id) || remaining[0]).id;
        setActiveFileId(nextId);
      }
    }
  }

  // tabs logic
  function openTab(fileId) {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;
    const already = openTabs.some((t) => t.id === fileId);
    if (!already) {
      if (openTabs.length >= MAX_TABS) {
        alert(`You can open up to ${MAX_TABS} tabs. Close one to open another.`);
        return;
      }
      setOpenTabs((prev) => [...prev, file]);
    }
    setActiveFileId(fileId);
  }

  function switchTab(fileId) {
    setActiveFileId(fileId);
  }

  function closeTab(fileId, opts = {}) {
    setOpenTabs((prev) => prev.filter((t) => t.id !== fileId));
    if (fileId === activeFileId) {
      const remaining = openTabs.filter((t) => t.id !== fileId);
      if (remaining.length) {
        setActiveFileId(remaining[remaining.length - 1].id);
      } else {
        const first = files[0];
        if (first) setActiveFileId(first.id);
      }
    }
  }

  // sidebar file click 
  function handleSelectFromSidebar(file) {
    openTab(file.id);
  }

  // save Project to MongoDB
    const handleSave = async () => {
      const payload = { name: projectName, files, theme, updatedAt: new Date().toISOString() };

      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/projects`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("Failed to save project");
        const data = await res.json();

        // Save ID locally and in state
        localStorage.setItem("lastProjectId", data.project._id);
        setProjectId(data.project._id); // ← this is new

        alert(`✅ Project saved successfully!\nID: ${data.project._id}`);
      } catch (err) {
        console.error(err);
        alert("❌ Failed to save project");
      }
    };


    const handleLoad = async () => {
      let id = localStorage.getItem("lastProjectId");
      if (!id) id = prompt("Enter project ID to load:");
      if (!id) return alert("❌ No project ID found!");

      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/projects/${id}`);
        if (!res.ok) throw new Error("Project not found");

        const data = await res.json();
        setFiles(data.files);
        setProjectName(data.name);
        setTheme(data.theme);
        alert(`✅ Loaded Project: ${data.name}`);
      } catch (err) {
        console.error(err);
        alert("❌ Failed to load project");
      }
    };

    const handleDelete = async () => {
      let id = localStorage.getItem("lastProjectId");
      if (!id) id = prompt("Enter project ID to delete:");
      if (!id) return alert("❌ No project ID found!");

      if (!window.confirm("⚠️ Are you sure you want to delete this project?")) return;

      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/projects/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete");
        alert("🗑️ Project deleted successfully!");
        localStorage.removeItem("lastProjectId"); 
      } catch (err) {
        console.error(err);
        alert("❌ Failed to delete project");
      }
    };

        
  // ui layout
  return (
    <div className={`app ${theme}`}>
      <TopBar
        onSave={handleSave}
        onLoad={handleLoad}
        onDelete={handleDelete}
        theme={theme}
        setTheme={setTheme}
        projectName={projectName}
        setProjectName={setProjectName}
        projectId={projectId} 
      />

      {/* workspace */}
      <div className="workspace">
        <Sidebar files={files} setFiles={setFiles} onSelect={handleSelectFromSidebar} />


        {/* main editor space */}
        <div className="main-pane">
          <TabBar
            tabs={openTabs}
            activeId={activeFileId}
            onSwitch={switchTab}
            onClose={closeTab}
          />

          <CodeEditor
            code={code}
            setCode={setCode}
            filename={activeFile?.name || "Untitled"}
            theme={theme}
          />
        </div>

        {/* live preview */}
        <Preview code={code} files={files} />
      </div>
    </div>
  );
}

export default App;
