"use client";

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 text-center">
          <p className="text-lg font-medium text-red-600 dark:text-red-400">
            Une erreur s&apos;est produite.
          </p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Rechargez la page ou vérifiez la console pour plus de détails.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600"
          >
            Recharger
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
