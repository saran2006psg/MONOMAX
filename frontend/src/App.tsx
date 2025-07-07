import { useState } from 'react';
import { UploadPage } from './components/UploadPage';
import { ExplorerPage } from './components/ExplorerPage';
import { ProjectData } from './types';
import { useTheme } from './hooks/useTheme';

function App() {
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const { theme } = useTheme();

  const handleUploadComplete = (data: ProjectData) => {
    setProjectData(data);
  };

  const handleReset = () => {
    setProjectData(null);
  };

  return (
    <div className={`App min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gray-900 text-gray-100' 
        : 'bg-gray-50 text-gray-900'
    }`}>
      {projectData ? (
        <ExplorerPage
          projectData={projectData}
          onReset={handleReset}
        />
      ) : (
        <UploadPage onUploadComplete={handleUploadComplete} />
      )}
    </div>
  );
}

export default App;