import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import BracketPage from "./components/bracket/BracketPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <BracketPage />
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
