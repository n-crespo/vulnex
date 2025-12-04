import { useState } from "react";
import AuthModel from "./components/AuthModel";
import Header from "./components/Header";
import AnalyzeView from "./components/AnalyzeView";
import ExploreView from "./components/ExploreView";
import { useAuthContext } from "./context/AuthContext";

export default function App() {
  const [activeTab, setActiveTab] = useState("explore");

  // Only needed to conditionally render the modal
  const { doAuthModel } = useAuthContext();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Auth Modal Popup */}
      {doAuthModel && <AuthModel />}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {activeTab === "explore" ? (
          // ExploreView fetches its own data from Context
          <ExploreView />
        ) : (
          <AnalyzeView />
        )}
      </main>
    </div>
  );
}
