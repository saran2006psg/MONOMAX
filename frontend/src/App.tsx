import { useState } from 'react';
import { UploadPage } from './components/UploadPage';
import { ExplorerPage } from './components/ExplorerPage';
import { ProjectData } from './types';

function App() {
  const [projectData, setProjectData] = useState<ProjectData | null>(null);

  const handleUploadComplete = (data: ProjectData) => {
    setProjectData(data);
  };

  const handleReset = () => {
    setProjectData(null);
  };

  return (
    <div className="App min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
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