import { useState, Suspense, lazy } from "react";
import AuthModel from "./components/AuthModel";
import Header from "./components/Header";
import ExploreView from "./components/ExploreView";
import { useAuthContext } from "./context/AuthContext";

// Lazy load the Analyze View
const AnalyzeView = lazy(() => import("./components/AnalyzeView"));

export default function App() {
  const [activeTab, setActiveTab] = useState("explore");
  const { doAuthModel } = useAuthContext();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      {doAuthModel && <AuthModel />}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {activeTab === "explore" ? (
          <ExploreView />
        ) : (
          // lazy component with fallback
          <Suspense
            fallback={
              <div className="p-8 text-center text-gray-500">
                Loading View...
              </div>
            }
          >
            <AnalyzeView />
          </Suspense>
        )}
      </main>
    </div>
  );
}
