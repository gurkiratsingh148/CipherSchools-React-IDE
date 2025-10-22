import React, { useEffect, useRef, useState, useCallback } from "react";
import "../App.css";

function Preview({ code }) {
  const iframeRef = useRef(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [dimensions, setDimensions] = useState({ width: "100%", height: "400px" });
  const [theme, setTheme] = useState("light");
  const consoleRef = useRef(null);

  // clear console logs
  const clearConsole = useCallback(() => {
    setConsoleLogs([]);
  }, []);

  // handle messages iframe
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'error') {
        setError(event.data.message);
        setConsoleLogs(prev => [...prev, {
          type: 'error',
          message: event.data.message,
          timestamp: new Date().toLocaleTimeString()
        }]);
      } else if (event.data.type === 'console') {
        setConsoleLogs(prev => [...prev, {
          type: event.data.logType,
          message: event.data.message,
          timestamp: new Date().toLocaleTimeString()
        }]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // scroll console bottom
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [consoleLogs]);

  useEffect(() => {
    setIsLoading(true);
    setError("");

    const timeout = setTimeout(() => {
      if (!iframeRef.current) return;
      
      const safeCode = typeof code === "string" ? code : ""; 
      const isHTML = safeCode.trim().startsWith("<");
      const isReact = safeCode.includes("ReactDOM.render") ||
                      safeCode.includes("ReactDOM.createRoot") ||
                      safeCode.includes("createRoot");


      // console interception
      const consoleInterceptor = `
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        const originalInfo = console.info;
        
        console.log = (...args) => {
          originalLog(...args);
          window.parent.postMessage({ type: 'console', logType: 'log', message: args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ') }, '*');
        };
        
        console.error = (...args) => {
          originalError(...args);
          window.parent.postMessage({ type: 'console', logType: 'error', message: args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ') }, '*');
        };
        
        console.warn = (...args) => {
          originalWarn(...args);
          window.parent.postMessage({ type: 'console', logType: 'warn', message: args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ') }, '*');
        };
        
        console.info = (...args) => {
          originalInfo(...args);
          window.parent.postMessage({ type: 'console', logType: 'info', message: args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ') }, '*');
        };
        
        // Handle unhandled errors
        window.addEventListener('error', (event) => {
          window.parent.postMessage({ 
            type: 'error', 
            message: \`\${event.error?.name || 'Error'}: \${event.error?.message || event.message}\` 
          }, '*');
        });
        
        window.addEventListener('unhandledrejection', (event) => {
          window.parent.postMessage({ 
            type: 'error', 
            message: \`Unhandled Promise Rejection: \${event.reason}\` 
          }, '*');
        });
      `;

      let content = "";

      if (isReact) {
        // react JSX mode 
        content = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
              <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
              <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
              <style>
                body { 
                  margin: 0; 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                  background: white;
                }
                #root { padding: 16px; min-height: 100vh; }
              </style>
            </head>
            <body>
              <div id="root"></div>
              <script type="text/babel">
                ${consoleInterceptor}
                
                // Error boundary for React
                class PreviewErrorBoundary extends React.Component {
                  constructor(props) {
                    super(props);
                    this.state = { hasError: false, error: null };
                  }
                  
                  static getDerivedStateFromError(error) {
                    return { hasError: true, error };
                  }
                  
                  componentDidCatch(error, errorInfo) {
                    console.error('React Error:', error, errorInfo);
                  }
                  
                  render() {
                    if (this.state.hasError) {
                      return React.createElement('div', {
                        style: {
                          color: '#d32f2f',
                          background: '#ffebee',
                          padding: '16px',
                          border: '1px solid #ffcdd2',
                          borderRadius: '4px',
                          margin: '16px'
                        }
                      }, [
                        React.createElement('h3', { key: 'title' }, '🚨 React Error'),
                        React.createElement('pre', { 
                          key: 'error',
                          style: { whiteSpace: 'pre-wrap', fontSize: '14px' }
                        }, this.state.error?.toString() || 'Unknown error')
                      ]);
                    }
                    return this.props.children;
                  }
                }
                
                try {
                  // Wrap user code in error boundary
                  const AppWrapper = () => {
                    ${code.replace('ReactDOM.render(', 'return (').replace('ReactDOM.createRoot(', 'return (')}
                  };
                  
                  const root = ReactDOM.createRoot(document.getElementById('root'));
                  root.render(React.createElement(PreviewErrorBoundary, {}, 
                    React.createElement(AppWrapper)
                  ));
                  
                } catch (err) {
                  document.getElementById('root').innerHTML = 
                    '<div style="color:red;background:#ffeaea;padding:16px;margin:16px;border-radius:4px;">' +
                    '<h3>❌ Execution Error</h3><pre style="white-space:pre-wrap;">' + 
                    err.message + '</pre></div>';
                  window.parent.postMessage({ type: 'error', message: err.message }, '*');
                }
              </script>
            </body>
          </html>
        `;
      } else if (isHTML) {
        // HTML mode with styling
        content = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <style>
                body { 
                  margin: 0; 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                  background: white;
                  padding: 16px;
                }
              </style>
            </head>
            <body>
              ${safeCode}
              <script>
                ${consoleInterceptor}
                
                // Auto-inject CSS for better preview
                const style = document.createElement('style');
                style.textContent = \`
                  * { box-sizing: border-box; }
                  img { max-width: 100%; }
                  pre { background: #f5f5f5; padding: 12px; border-radius: 4px; overflow-x: auto; }
                  code { background: #f5f5f5; padding: 2px 4px; border-radius: 2px; }
                \`;
                document.head.appendChild(style);
              </script>
            </body>
          </html>
        `;
      } else {
        // plain JS mode with output
        content = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <style>
                body { 
                  margin: 0; 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                  background: white;
                  padding: 16px;
                }
                #output {
                  background: #f8f9fa;
                  border: 1px solid #e9ecef;
                  border-radius: 4px;
                  padding: 16px;
                  white-space: pre-wrap;
                  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                  font-size: 14px;
                  line-height: 1.5;
                }
              </style>
            </head>
            <body>
              <pre id="output"></pre>
              <script>
                ${consoleInterceptor}
                
                // Capture output
                const outputEl = document.getElementById('output');
                const originalConsoleLog = console.log;
                
                console.log = (...args) => {
                  originalConsoleLog(...args);
                  const output = args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                  ).join(' ');
                  outputEl.textContent += output + '\\n';
                };
                
                try {
                  ${safeCode}
                } catch (err) {
                  document.body.innerHTML = 
                    '<div style="color:#d32f2f;background:#ffebee;padding:16px;margin:16px;border-radius:4px;border:1px solid #ffcdd2;">' +
                    '<h3 style="margin:0 0 8px 0;">❌ JavaScript Error</h3>' +
                    '<pre style="white-space:pre-wrap;margin:0;font-size:14px;">' + 
                    err.message + '</pre></div>';
                  window.parent.postMessage({ type: 'error', message: err.message }, '*');
                }
              </script>
            </body>
          </html>
        `;
      }

      const iframe = iframeRef.current; 
      if (!iframe) return; 


      iframe.onload =
       () => {
        setIsLoading(false);
      };

      iframe.srcdoc = content;
    }, 400);

    return () => clearTimeout(timeout);
  }, [code]);

  const getLogColor = (type) => {
    switch (type) {
      case 'error': return '#d32f2f';
      case 'warn': return '#ed6c02';
      case 'info': return '#0288d1';
      default: return '#2e7d32';
    }
  };

  return (
    <section className="preview">
      <div className="preview-header">
        <h3>⚡ Live Preview</h3>
        <div className="preview-controls">
          <button 
            onClick={clearConsole}
            className="preview-control-btn"
            title="Clear Console"
          >
            🧹 Clear
          </button>
          <select 
            value={dimensions.height} 
            onChange={(e) => setDimensions(prev => ({ ...prev, height: e.target.value }))}
            className="preview-control-select"
          >
            <option value="300px">Small</option>
            <option value="400px">Medium</option>
            <option value="500px">Large</option>
            <option value="600px">X-Large</option>
            <option value="100%">Full</option>
          </select>
          <button 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="preview-control-btn"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>
      
      <div className="preview-body">
        {isLoading && (
          <div className="preview-loading">
            <div className="preview-spinner"></div>
            <span>Loading Preview...</span>
          </div>
        )}
        
        <iframe
          ref={iframeRef}
          title="preview"
          sandbox="allow-scripts allow-same-origin"
          frameBorder="0"
          className="preview-frame"
          style={{
            height: dimensions.height,
            opacity: isLoading ? 0.5 : 1,
            transition: 'opacity 0.2s ease-in-out'
          }}
        />
      </div>

      {/* Console Output */}
      {(consoleLogs.length > 0 || error) && (
        <div className="preview-console" ref={consoleRef}>
          <div className="preview-console-header">
            <span>Console</span>
            <button onClick={clearConsole} className="preview-console-clear">
              Clear
            </button>
          </div>
          <div className="preview-console-content">
            {error && (
              <div className="preview-console-item error">
                <span className="preview-console-timestamp">
                  {new Date().toLocaleTimeString()}
                </span>
                <span className="preview-console-message">{error}</span>
              </div>
            )}
            {consoleLogs.map((log, index) => (
              <div 
                key={index} 
                className={`preview-console-item ${log.type}`}
                style={{ borderLeftColor: getLogColor(log.type) }}
              >
                <span className="preview-console-timestamp">{log.timestamp}</span>
                <span className="preview-console-message">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default Preview;