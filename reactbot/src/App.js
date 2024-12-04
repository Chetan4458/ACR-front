import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import SingleFileReviewPage from './components/SingleFileReviewPage';
import FolderOrRepoReviewPage from './components/FolderOrRepoReviewPage';
import PRReviewPage from './components/PRReviewPage';
import AdoRepoReviewPage from './components/AdoRepoReviewPage';
import AdoPRReviewPage from './components/AdoPRReviewPage'
import picture1 from './Picture1.png';
import axios from "axios";
 
import './App.css';
// Set the base URL for your backend API
axios.defaults.baseURL = 'http://localhost:8000'; // Change to your backend URL
axios.defaults.withCredentials = true;
 

const App = () => {
  const [orgStdFile, setOrgStdFile] = useState(null); // File state
  const [errorMessage, setErrorMessage] = useState(''); // Error feedback
  const [successMessage, setSuccessMessage] = useState(''); // Success feedback

  // Handle file upload
  const handleOrgStdFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.startsWith('EStandards')) {
        setErrorMessage("Please upload a file starting with 'EStandards'.");
        setSuccessMessage('');
        return;
      }
      setOrgStdFile(file);
      setErrorMessage('');
      setSuccessMessage(`File "${file.name}" uploaded successfully.<br />
        Now choose a Review Type from the Navigation Bar above`);
    }
  };

  return (
    <Router>
      <div className="App">
        <header className="navbar">
          {/* Logo */}
          <div className="logo">
            <img src={picture1} alt="Logo" />
          </div>

          {/* Navigation Links */}
          <nav className="nav-links">
            <ul className="nav-list">
              <li>
                <NavLink to="/" className={({ isActive }) => (isActive ? 'active' : '')}>
                  Home
                </NavLink>
              </li>
              {/* Conditionally render other links */}
              {orgStdFile && (
                <>
                  <li>
                    <NavLink
                      to="/single-file-review"
                      className={({ isActive }) => (isActive ? 'active' : '')}
                    >
                      Single File Review
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/folder-repo-review"
                      className={({ isActive }) => (isActive ? 'active' : '')}
                    >
                      Folder or Repo Review
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/pr-review"
                      className={({ isActive }) => (isActive ? 'active' : '')}
                    >
                      PR Review
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/ado-repo"
                      className={({ isActive }) => (isActive ? 'active' : '')}
                    >
                      ADO Repo Review
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/ado-pr"
                      className={({ isActive }) => (isActive ? 'active' : '')}
                    >
                      ADO PR Review
                    </NavLink>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </header>

        {/* Routes */}
        <Routes>
          <Route
            path="/"
            element={
              <div className="home-content">
                <h1>Welcome to the Review App</h1>
                <p>
                  This is Automated Code Review. <br />
                  Please upload Organization Standards File to proceed.
                </p>
                <div className="file-upload-wrapper">
                  <div className="file-upload">
                    <label htmlFor="orgStdFile">Organization Code Standard:</label>
                    <input
                      type="file"
                      id="orgStdFile"
                      accept=".txt, .docx, .pdf, .pptx"
                      onChange={handleOrgStdFileChange}
                      required
                    />
                  </div>
                </div>
                <br />
                {/* Feedback Messages */}
                {errorMessage && (
                  <div className="error-message" style={{ color: 'red', marginTop: '10px' }}>
                    {errorMessage}
                  </div>
                )}
                {successMessage && (
                  <div
                    className="success-message"
                    style={{ color: 'green', marginTop: '10px' }}
                    dangerouslySetInnerHTML={{ __html: successMessage }}
                  />
                )}
              </div>
            }
          />
          <Route
            path="/single-file-review"
            element={<SingleFileReviewPage selectedOrgFile={orgStdFile} />}
          />
          <Route
            path="/folder-repo-review"
            element={<FolderOrRepoReviewPage orgFile={orgStdFile} />}
          />
          <Route path="/pr-review" element={<PRReviewPage orgFile={orgStdFile} />} />
          <Route path="/ado-repo" element={<AdoRepoReviewPage orgFile={orgStdFile} />} />
          <Route path="/ado-pr" element={<AdoPRReviewPage orgFile={orgStdFile} />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
