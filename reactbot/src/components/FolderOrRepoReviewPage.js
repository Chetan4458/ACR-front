// FolderOrRepoReviewPage.js
import React, { useState } from 'react';
import axios from 'axios';
axios.defaults.withCredentials=true;
const FolderOrRepoReviewPage = () => {
  const [inputPath, setInputPath] = useState('');
  const [reviewResult, setReviewResult] = useState(null);

  const handleSubmit = async () => {
    try {
      const response = await axios.post('/api/review_folder_or_repo/', { input_path: inputPath });
      setReviewResult(response.data);
    } catch (error) {
      console.error('Error reviewing folder/repo', error);
    }
  };

  return (
    <div>
      <h1>Folder or Git Repo Review</h1>
      <input
        type="text"
        placeholder="Enter folder path or GitHub repo URL"
        value={inputPath}
        onChange={(e) => setInputPath(e.target.value)}
      />
      <button onClick={handleSubmit}>Submit</button>
      {reviewResult && (
        <div>
          <h2>Review Result:</h2>
          <pre>{JSON.stringify(reviewResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default FolderOrRepoReviewPage;
