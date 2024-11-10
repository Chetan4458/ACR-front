import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import SingleFileReviewPage from './components/SingleFileReviewPage';
import FolderOrRepoReviewPage from './components/FolderOrRepoReviewPage';
import PRReviewPage from './components/PRReviewPage';
import axios from 'axios';

// Set the base URL for your backend API
axios.defaults.baseURL = 'http://localhost:8000';  // Change to your backend URL
axios.defaults.withCredentials = true;

const App = () => {
  // Function to set CSRF token for axios requests
  const setCsrfTokenHeader = () => {
    const csrfToken = document.cookie.split('csrftoken=')[1]; // Retrieve CSRF token from cookies
    if (csrfToken) {
      axios.defaults.headers['X-CSRFToken'] = csrfToken; // Set CSRF token in the request header
    } else {
      console.error("CSRF token not found!");
    }
  };

  // Run this when the app loads to set CSRF token globally
  useEffect(() => {
    setCsrfTokenHeader();
  }, []); // Empty dependency array ensures this runs once after the first render

  return (
    <Router>
      <div className="App">
        <h1>Review Bot</h1>

        {/* Navigation Links */}
        <nav>
          <ul>
            <li>
              <Link to="/single-file-review">Single File Review</Link>
            </li>
            <li>
              <Link to="/folder-repo-review">Folder or Repo Review</Link>
            </li>
            <li>
              <Link to="/pr-review">PR Review</Link>
            </li>
          </ul>
        </nav>

        {/* Define Routes */}
        <Routes>
          <Route path="/single-file-review" element={<SingleFileReviewPage />} />
          <Route path="/folder-repo-review" element={<FolderOrRepoReviewPage />} />
          <Route path="/pr-review" element={<PRReviewPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
