// src/components/CodeEditor.js
import React, { useEffect, useState, useRef, useCallback } from "react";
import { Editor } from "@monaco-editor/react";
import "../App.css";

function CodeEditor({ code, setCode, filename, theme }) {
  const [status, setStatus] = useState("Saved");
  const [lastSaved, setLastSaved] = useState(new Date());
  const [wordCount, setWordCount] = useState(0);
  const [lineCount, setLineCount] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const editorRef = useRef(null);
  const timeoutRef = useRef(null);

  // statistics
  useEffect(() => {
    const safeCode = typeof code === "string" ? code : "";  // ✅ always safe
    const words = safeCode.trim() ? safeCode.trim().split(/\s+/).length : 0;
    const lines = safeCode.split("\n").length;
    setWordCount(words);
    setLineCount(lines);
  }, [code]);

  // autosave 
  useEffect(() => {
    if (!editorReady) return;
    
    setIsDirty(true);
    setStatus("Typing...");

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setStatus("Saving...");
      
      // save operation
      setTimeout(() => {
        setStatus("Saved");
        setLastSaved(new Date());
        setIsDirty(false);
        
        // auto format save
        if (localStorage.getItem('autoFormat') === 'true') {
          formatCode();
        }
      }, 300);
    }, 1000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [code, editorReady]);

  // keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleManualSave();
      }
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'F') {
        event.preventDefault();
        formatCode();
      }
      if ((event.ctrlKey || event.metaKey) && event.key === '/') {
        event.preventDefault();
        toggleComment();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    setEditorReady(true);

    // add custom commands
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleManualSave();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
      formatCode();
    });

    // configure language
    const language = filename.endsWith(".css") ? "css" : "javascript";
    
    if (language === "javascript") {
      monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.ESNext,
        noEmit: true,
        typeRoots: ["node_modules/@types"],
        jsx: monaco.languages.typescript.JsxEmit.React,
        reactNamespace: "React",
        allowJs: true,
        checkJs: false,
      });
    }

    // enable hints typeScript
    if (language === "javascript") {
      editor.updateOptions({
        inlayHints: {
          enabled: 'on'
        }
      });
    }
  };

  const handleManualSave = useCallback(() => {
    setStatus("Saving...");
    setTimeout(() => {
      setStatus("Saved");
      setLastSaved(new Date());
      setIsDirty(false);
      
      // show save cnfm.
      const saveNotification = document.createElement('div');
      saveNotification.className = 'editor-save-notification';
      saveNotification.textContent = `✓ ${filename} saved`;
      document.body.appendChild(saveNotification);
      
      setTimeout(() => {
        if (document.body.contains(saveNotification)) {
          document.body.removeChild(saveNotification);
        }
      }, 2000);
    }, 200);
  }, [filename]);

  const formatCode = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument').run();
      setStatus("Formatted");
      setTimeout(() => setStatus("Saved"), 1000);
    }
  }, []);

  const toggleComment = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.commentLine').run();
    }
  }, []);

  const duplicateLine = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'editor.action.copyLinesDownAction');
    }
  }, []);

  const deleteLine = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'editor.action.deleteLines');
    }
  }, []);

  const goToLine = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.focus();
      editorRef.current.trigger('keyboard', 'editor.action.gotoLine');
    }
  }, []);

  const findInFile = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.focus();
      editorRef.current.trigger('keyboard', 'actions.find');
    }
  }, []);

  const insertSnippet = useCallback((snippet) => {
    if (editorRef.current) {
      const selection = editorRef.current.getSelection();
      editorRef.current.executeEdits("", [
        {
          range: selection,
          text: snippet,
          forceMoveMarkers: true
        }
      ]);
    }
  }, []);

  const getLanguage = () => {
    if (filename.endsWith(".css")) return "css";
    if (filename.endsWith(".html")) return "html";
    if (filename.endsWith(".json")) return "json";
    return "javascript";
  };

  const getFileIcon = () => {
    if (filename.endsWith(".js")) return "📄";
    if (filename.endsWith(".jsx")) return "⚛️";
    if (filename.endsWith(".css")) return "🎨";
    if (filename.endsWith(".html")) return "🌐";
    return "📝";
  };

  return (
    <div className="editor">
      <div className="editor-header">
        <div className="editor-header-left">
          <span className="file-icon">{getFileIcon()}</span>
          <h3>{filename}</h3>
          {isDirty && <span className="dirty-indicator">●</span>}
        </div>
        
        <div className="editor-header-center">
          <div className="editor-stats">
            <span className="stat-item">{lineCount} lines</span>
            <span className="stat-item">{wordCount} words</span>
            <span className="stat-item">{(code || "").length} chars</span>
          </div>
        </div>

        <div className="editor-header-right">
          <div className="editor-actions">
            <button 
              className="editor-action-btn"
              onClick={formatCode}
              title="Format Code (Ctrl+Shift+F)"
            >
              🛠️
            </button>
            <button 
              className="editor-action-btn"
              onClick={findInFile}
              title="Find (Ctrl+F)"
            >
              🔍
            </button>
            <button 
              className="editor-action-btn"
              onClick={goToLine}
              title="Go to Line (Ctrl+G)"
            >
              📍
            </button>
          </div>
          <span className={`save-status ${status.toLowerCase().replace('...', '')}`}>
            {status}
            {status === "Saved" && (
              <span className="last-saved">
                at {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </span>
        </div>
      </div>

      <div className="editor-quick-actions">
        <button onClick={() => insertSnippet('console.log();')} className="quick-action">
          console.log
        </button>
        <button onClick={() => insertSnippet('function () {}')} className="quick-action">
          function
        </button>
        <button onClick={() => insertSnippet('const  = ;')} className="quick-action">
          const
        </button>
        <button onClick={() => insertSnippet('<div></div>')} className="quick-action">
          div
        </button>
        {getLanguage() === "css" && (
          <button onClick={() => insertSnippet('color: ;')} className="quick-action">
            color
          </button>
        )}
      </div>

      <Editor
        height="100%"
        language={getLanguage()}
        theme={theme === "dark" ? "vs-dark" : "light"}
        value={code}
        onChange={(value) => setCode(value || "")}
        onMount={handleEditorDidMount}
        options={{
          fontSize: 14,
          fontFamily: "'Fira Code', 'Cascadia Code', 'Monaco', 'Menlo', monospace",
          fontLigatures: true,
          minimap: { 
            enabled: true,
            scale: 1,
            showSlider: "mouseover"
          },
          wordWrap: "on",
          automaticLayout: true,
          scrollBeyondLastLine: false,
          contextmenu: true,
          autoClosingBrackets: "always",
          autoClosingQuotes: "always",
          autoClosingOvertype: "always",
          autoIndent: "full",
          formatOnType: true,
          formatOnPaste: true,
          smoothScrolling: true,
          tabSize: 2,
          insertSpaces: true,
          detectIndentation: true,
          rulers: [80, 120],
          bracketPairColorization: {
            enabled: true
          },
          guides: {
            indentation: true,
            bracketPairs: true
          },
          suggest: {
            showWords: false
          },
          quickSuggestions: {
            strings: true,
            comments: true,
            other: true
          },
          parameterHints: {
            enabled: true
          },
          renderWhitespace: "boundary",
          renderControlCharacters: true,
          folding: true,
          foldingHighlight: true,
          links: true,
          copyWithSyntaxHighlighting: true,
          multiCursorModifier: "alt",
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
            useShadows: false
          },
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
        }}
      />

      <div className="editor-footer">
        <div className="editor-footer-left">
          <span className="language-badge">{getLanguage().toUpperCase()}</span>
          <span className="encoding">UTF-8</span>
          <span className="line-ending">LF</span>
        </div>
        <div className="editor-footer-right">
          <span className="cursor-position">Ln 1, Col 1</span>
          <span className="tab-size">Spaces: 2</span>
          <span className="encoding">UTF-8</span>
        </div>
      </div>
    </div>
  );
}

export default CodeEditor;