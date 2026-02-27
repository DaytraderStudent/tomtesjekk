"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface p-8">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-display font-bold text-fjord-500 mb-4">
              Noe gikk galt
            </h1>
            <p className="text-gray-600 mb-6">
              En uventet feil oppstod. Prøv å laste siden på nytt.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-fjord-500 text-white rounded-lg hover:bg-fjord-600 transition-colors"
            >
              Last inn siden på nytt
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
