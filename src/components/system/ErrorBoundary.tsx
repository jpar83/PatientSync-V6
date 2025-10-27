import React from 'react';

type Props = { children: React.ReactNode };
type State = { error: Error | null, info?: React.ErrorInfo };

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) { return { error }; }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Optional: send to Supabase table client_errors
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-6 text-sm bg-red-50 h-screen">
          <h1 className="text-lg font-semibold mb-2 text-red-800">Something went wrong</h1>
          <pre className="bg-red-100 text-red-900 p-3 rounded overflow-auto">{String(this.state.error.stack || this.state.error.message)}</pre>
          <p className="mt-4 text-slate-600">Try reloading the page. If this persists, you can try these options:</p>
          <ul className="list-disc list-inside mt-2 text-slate-600">
            <li>Enable Safe Mode by adding <code>?safe=1</code> to the URL.</li>
            <li>Open your browser's developer console for more details.</li>
          </ul>
           <button
              onClick={() => window.location.reload()}
              className="mt-6 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Reload Page
            </button>
        </div>
      );
    }
    return this.props.children;
  }
}
