import { ComparisonProvider } from "@/contexts/comparison-context";
import { MainLayout } from "@/components/main-layout";
import { ControlPanel } from "@/components/sidebar/control-panel";
import { ProviderGrid } from "@/components/provider-grid";
import { ModelDataProvider } from "@/contexts/model-data-context";
import { FeatureComparisonTable } from "@/components/feature-comparison-table";
import { FeatureProvider, useFeatures } from "@/contexts/feature-context";


function App() {
  return (
    <FeatureProvider>
      <AppCore />
    </FeatureProvider>
  );
}

function AppCore() {
  const { providerFeatures, isLoading, error } = useFeatures();

  if (isLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <img src="/compare/ui/speechmatics.svg" alt="Speechmatics Logo" className="w-40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <p>Error loading features: {error.message}</p>
      </div>
    );
  }

  if (!providerFeatures) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <img src="/compare/ui/speechmatics.svg" alt="Speechmatics Logo" className="w-40" />
        <p>No features data available.</p>
      </div>
    );
  }

  return (
    <ModelDataProvider>
      <ComparisonProvider>
        <MainLayout
          sidebarContent={<ControlPanel />}
          mainContent={<ProviderGrid />}
          featureTableContent={<FeatureComparisonTable />}
        />
      </ComparisonProvider>
    </ModelDataProvider>
  );
}

export default App;
