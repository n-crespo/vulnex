import { useState, Suspense, lazy } from "react";
import AuthModel from "./components/AuthModel";
import Header from "./components/Header";
import ExploreView from "./components/ExploreView";
import { useAuthContext } from "./context/AuthContext";

// Lazy load the Analyze View
const AnalyzeView = lazy(() => import("./components/AnalyzeView"));
// Lazy load the Profile View
const ProfileView = lazy(() => import("./components/ProfileView"));

export default function App() {
  const [activeTab, setActiveTab] = useState("explore");
  const { doAuthModel } = useAuthContext();

  // Helper to determine what to render
  const renderContent = () => {
    switch (activeTab) {
      case "explore":
        return <ExploreView />;

      case "analyze":
        return (
          <Suspense
            fallback={
              <div className="p-12 text-center text-gray-500">
                Loading Analysis...
              </div>
            }
          >
            <AnalyzeView />
          </Suspense>
        );

      case "profile":
        return (
          // Render Profile View
          <Suspense
            fallback={
              <div className="p-12 text-center text-gray-500">
                Loading Profile...
              </div>
            }
          >
            <ProfileView />
          </Suspense>
        );

      default:
        return <ExploreView />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Login Modal */}
      {doAuthModel && <AuthModel />}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {renderContent()}
      </main>
    </div>
  );
}
