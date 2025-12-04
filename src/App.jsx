import { useState } from "react";
import AuthModel from "./components/AuthModel";
import Header from "./components/Header";
import AnalyzeView from "./components/AnalyzeView";
import ExploreView from "./components/ExploreView";
import { useCveData } from "./hooks/useCveData";
import { useAuth } from "./hooks/useAuth";

export default function App() {
  const [activeTab, setActiveTab] = useState("explore");

  // custom hook for authentication logic
  const {
    doAuthModel,
    setDoAuthModel,
    userLoginSessionToken,
    doLoginSuccess,
    doLogoutAndClearSessionToken,
  } = useAuth(setActiveTab); // pass setActiveTab into the hook so it can manage the tab switch on logout

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
        userLoginSessionToken={userLoginSessionToken}
        setDoAuthModel={setDoAuthModel}
        doLogoutAndClearSessionToken={doLogoutAndClearSessionToken}
      />

      {/* Enable the Auth Model if doAuthModel is true */}
      {doAuthModel && (
        <AuthModel
          closeTheAuthForm={() => setDoAuthModel(false)}
          whenUserLoginIsSuccessful={doLoginSuccess}
        />
      )}

      {/* Explore Content (Padding) */}
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
