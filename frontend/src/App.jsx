import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import BracketPage from "./components/bracket/BracketPage";
import StatsPage from "./components/charts/StatsPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } },
});

function Nav({ view, setView }) {
  return (
    <nav className="app-nav">
      <span className="app-nav__brand">⚽ WC 2026</span>
      <div className="app-nav__tabs">
        <button
          className={`app-nav__tab ${view === "bracket" ? "app-nav__tab--active" : ""}`}
          onClick={() => setView("bracket")}
        >
          Bracket
        </button>
        <button
          className={`app-nav__tab ${view === "stats" ? "app-nav__tab--active" : ""}`}
          onClick={() => setView("stats")}
        >
          Stats &amp; Charts
        </button>
      </div>
    </nav>
  );
}

export default function App() {
  const [view, setView] = useState("bracket");

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <div className="app-shell">
          <Nav view={view} setView={setView} />
          <main className="app-main">
            {view === "bracket" ? <BracketPage /> : <StatsPage />}
          </main>
        </div>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
