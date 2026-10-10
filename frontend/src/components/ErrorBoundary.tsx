import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl border border-red-100 p-8 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
              ⚠️
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">
              {this.props.fallbackName || 'Sahifada xatolik yuz berdi'}
            </h1>
            <p className="text-sm text-slate-600 mb-6">
              Tizimda kutilmagan xatolik yuz berdi. Iltimos sahifani yangilang yoki administratorga murojaat qiling.
            </p>
            {this.state.error && (
              <div className="mb-6 p-4 bg-slate-100 rounded-xl text-left overflow-x-auto text-xs font-mono text-red-600 max-h-40">
                <p className="font-bold">{this.state.error.toString()}</p>
                {this.state.errorInfo && (
                  <pre className="mt-2 text-slate-600">{this.state.errorInfo.componentStack}</pre>
                )}
              </div>
            )}
            <button
              onClick={() => {
                localStorage.removeItem('token');
                window.location.href = '/login';
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors text-sm"
            >
              Tizimga qayta kirish
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
