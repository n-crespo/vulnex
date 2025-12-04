import { useState } from "react";
import AuthModel from "./components/AuthModel";
import Header from "./components/Header";
import AnalyzeView from "./components/AnalyzeView";
import ExploreView from "./components/ExploreView";
import { useCveData } from "./hooks/useCveData";
import { useAuthContext } from "./context/AuthContext";

export default function App() {
  const [activeTab, setActiveTab] = useState("explore");

  // access auth state solely for conditional rendering of the modal
  const { doAuthModel } = useAuthContext();

  // custom hook for data logic
  const {
    cves,
    totalCount,
    isLoading,
    error,
    page,
    handleApplyFilters,
    handleNextPage,
    handlePrevPage,
  } = useCveData();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        // no auth props needed here anymore
      />

      {/* enable the Auth Model if doAuthModel is true */}
      {doAuthModel && (
        <AuthModel
        // no props needed, it consumes context internally
        />
      )}

      {/* explore Content (Padding) */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {activeTab === "explore" ? (
          <ExploreView
            cves={cves}
            totalCount={totalCount}
            isLoading={isLoading}
            error={error}
            page={page}
            onApplyFilters={handleApplyFilters}
            onNextPage={handleNextPage}
            onPrevPage={handlePrevPage}
          />
        ) : (
          <AnalyzeView />
        )}
      </main>
    </div>
  );
}
