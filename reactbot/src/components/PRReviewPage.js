// PRReviewPage.js
import React, { useState } from 'react';
import axios from 'axios';
axios.defaults.withCredentials=true;
const PRReviewPage = () => {
  const [token, setToken] = useState('');
  const [repoName, setRepoName] = useState('');
  const [prNumber, setPrNumber] = useState('');
  const [prDetails, setPrDetails] = useState(null);

  const handleSubmit = async () => {
    try {
      const response = await axios.post('/api/review_pull_request/', { token, repo_name: repoName, pr_number: prNumber });
      setPrDetails(response.data);
    } catch (error) {
      console.error('Error reviewing PR', error);
    }
  };

  return (
    <div>
      <h1>PR Review</h1>
      <input
        type="password"
        placeholder="GitHub Token"
        value={token}
        onChange={(e) => setToken(e.target.value)}
      />
      <input
        type="text"
        placeholder="Repo Name"
        value={repoName}
        onChange={(e) => setRepoName(e.target.value)}
      />
      <input
        type="number"
        placeholder="PR Number"
        value={prNumber}
        onChange={(e) => setPrNumber(e.target.value)}
      />
      <button onClick={handleSubmit}>Submit</button>
      {prDetails && (
        <div>
          <h2>PR Details:</h2>
          <pre>{JSON.stringify(prDetails, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default PRReviewPage;
