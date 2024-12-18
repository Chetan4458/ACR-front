import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import SingleFileReviewPage from './components/SingleFileReviewPage';
import FolderOrRepoReviewPage from './components/FolderOrRepoReviewPage';
import PRReviewPage from './components/PRReviewPage';
import AdoRepoReviewPage from './components/AdoRepoReviewPage';
import AdoPRReviewPage from './components/AdoPRReviewPage';
import picture1 from './Picture1.png';
import axios from "axios";

import './App.css';
 
axios.defaults.baseURL = 'https://acr-back-code-review.apps.opendev.hq.globalcashaccess.us'; // Change to your backend URL
axios.defaults.withCredentials = true;
 
const App = () => {
  const [orgStdFile, setOrgStdFile] = useState(null); // File state
  const [errorMessage, setErrorMessage] = useState(''); // Error feedback
  const [successMessage, setSuccessMessage] = useState(''); // Success feedback
  const [authcode, setauthcode] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Track login status
  const [adoauthcode, setadoauthcode] = useState(null);
  const [adoisLoggedIn, setadoIsLoggedIn] = useState(false); // Track login status
  const [gitTokenResult,setgitTokenResult]=useState({});
  const [adoTokenResult,setadoTokenResult]=useState({});
  const handleLogoutClick=()=>{
    setIsLoggedIn(false);
    setadoIsLoggedIn(false);
    setauthcode(null);
    setadoauthcode(null);
    setOrgStdFile(null);
     
    setSuccessMessage('');
    setErrorMessage('');

  }
  const handleGitHubLoginClick = () => {
    const clientId = "Ov23liAoWBA8cFwLh4ds"; // Replace with your GitHub App's client ID
    const redirectUri = "https://acr-front-code-review.apps.opendev.hq.globalcashaccess.us/"; // Replace with your React app's URL
    const scope = "user:email repo"; // Adjust the scope as needed
 
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
    window.location.href = githubAuthUrl;
   
  };
 
  const handleADOLoginClick = () => {
    const ado_client_id = "326AF960-CF7E-4827-8A31-A56B74F2BDF5"; // Replace with your ADO App's client ID
    const ado_redirect_uri = "https://acr-front-code-review.apps.opendev.hq.globalcashaccess.us/"; // Replace with your React app's URL
    const ado_scope="vso.advsec_manage vso.analytics vso.auditstreams_manage vso.build_execute vso.code_full vso.code_status vso.connected_server vso.dashboards_manage vso.entitlements vso.environment_manage vso.extension.data_write vso.extension_manage vso.gallery_acquire vso.gallery_manage vso.githubconnections_manage vso.graph_manage vso.identity_manage vso.machinegroup_manage vso.memberentitlementmanagement_write vso.notification_diagnostics vso.notification_manage vso.packaging_manage vso.pipelineresources_manage vso.profile_write vso.project_manage vso.release_manage vso.securefiles_manage vso.security_manage vso.serviceendpoint_manage vso.symbols_manage vso.taskgroups_manage vso.test_write vso.threads_full vso.tokenadministration vso.tokens vso.variablegroups_manage vso.wiki_write vso.work_full";
    const state = "random_string_for_csrf_protection";
    const auth_url = "https://app.vssps.visualstudio.com/oauth2/authorize";
    const params = new URLSearchParams({
      client_id: ado_client_id,
      response_type: 'code',
      redirect_uri: ado_redirect_uri,
      scope: ado_scope,
      state: state
    });
    
    // Combine the base URL with the encoded parameters
    const adoAuthUrl = `${auth_url}?${params.toString()}`;
    // Redirect the user to ADO OAuth URL
    window.location.href = adoAuthUrl;
  };
    

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    const ado_code = new URLSearchParams(window.location.search).get("code");
    const state = new URLSearchParams(window.location.search).get("state");
  
    if (code && !state) {
      setauthcode(code);
      setIsLoggedIn(true); // User is logged in
  
      const formData = new FormData();
      formData.append('code', code);
  
      axios
        .post('/api/review/git-token/', formData)
        .then((response) => {
          setgitTokenResult(response.data);
        })
        .catch((error) => {
          setErrorMessage('Error during the review process.');
        });
    }
  
    if (ado_code && state) {
      setadoauthcode(ado_code);
      setadoIsLoggedIn(true); // User is logged in
      const formData = new FormData();
      formData.append('code', ado_code);
  
      axios
        .post('/api/review/ado-token/', formData)
        .then((response) => {
          setadoTokenResult(response.data);
        })
        .catch((error) => {
          setErrorMessage('Error during the review process.');
        });
    }
  }, []); // Add dependencies as required
  

 
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
      setSuccessMessage(`File "${file.name}" uploaded successfully.\nNow choose a Review Type from the Navigation Bar above`);

    }
  };
 
  return (
    
      <div className="App">
        <header className="navbar">
          <div className="logo">
            <img src={picture1} alt="Logo" />
          </div>
 
          <nav className="nav-links">
            <ul className="nav-list">
              <li>
                <NavLink to="/" className={({ isActive }) => (isActive ? 'active' : '')}>
                  Home
                </NavLink>
              </li>
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
 
                {/* Conditional rendering for PR Review */}
                {isLoggedIn && (
                  <li>
                    <NavLink
                      to="/pr-review"
                      className={({ isActive }) => (isActive ? 'active' : '')}
                    >
                      PR Review
                    </NavLink>
                  </li>
                )}
 
                {/* Conditional rendering for ADO links */}
                {adoisLoggedIn && (
                  <>
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
              </>
            )}
            {(isLoggedIn || adoisLoggedIn) && (
              <li style={{
                position: 'absolute',
                top: '20px', // Adjust this value to tweak vertical spacing
                right:0,
                display: 'inline-block',
              }}>
                <NavLink
                  onClick={(e) => {
                    e.preventDefault();
                    const dropdownContent = e.currentTarget.nextElementSibling;
                    dropdownContent.style.display =
                      dropdownContent.style.display === 'block' ? 'none' : 'block';
                  }}
                  className={({ isActive }) => (isActive ? 'active' : '')}
                  style={{
                    textDecoration: 'none',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                  to="#"
                >
                  {(gitTokenResult?.email || adoTokenResult?.email || '')}
                  <span style={{ fontSize: '15px' }}> ▼</span>
                </NavLink>
                <div
                className="dropdown-content"
                style={{
                  display: 'none', // Default hidden
                  position: 'absolute',
                  right: '0',
                  backgroundColor: 'whitesmoke', // Clean white background
                  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)', // Softer shadow for a modern look
                  zIndex: 1,
                  borderRadius:'15px',
                  marginTop: '20px', // Slight separation from the parent
                  minWidth: '170px', // Ensure dropdown is adequately wide
                }}
              >
                <ul
                  style={{
                    listStyleType: 'none',
                    margin: 0,
                    padding: 0,
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column', // Stack the items vertically
                    justifyContent: 'center', // Center horizontally
                    alignItems: 'center', // Center vertically
                  }}
                >
                  <li
                    onClick={handleLogoutClick}
                    style={{
                      cursor: 'pointer',
                      padding: '15px', // Increased padding for better click area
                      backgroundColor: 'whitesmoke', // Neutral light grey for resting state
                      borderRadius: '6px', // Rounded edges for a button-like look
                      fontWeight: 'bolder',
                      transition: 'background-color 0.3s, transform 0.2s', // Smooth hover and click transitions
                      fontSize: '16px', // Modern readable font size
                      color: '#24135f', // Neutral text color
                      display: 'flex',
                      justifyContent: 'center', // Horizontally center the content
                      alignItems: 'center', // Vertically center the content
                    }}
                    className="dropdown-item"
                  >
                    Logout
                  </li>
                </ul>
              </div>


              </li>
            )}


            </ul>
          </nav>
        </header>
 
        <Routes>
          <Route
            path="/"
            element={
              <div className="home-content">
                <h1>Welcome to the Automated Code Review App</h1>
                <p>
                  Please Login to proceed.
                </p>
                <br/>
               
                <button onClick={handleGitHubLoginClick} className="tab-button">
                  Github Login
                  <img
                    src="https://github.com/favicon.ico"
                    alt="GitHub logo"
                    className="github-icon"
                  />
                </button>
                <button onClick={handleADOLoginClick} className="tab-button">
                  Microsoft Login
                  <img
                    src="https://microsoft.com/favicon.ico"
                    alt="ADO logo"
                    className="github-icon"
                  />
                </button>
                {isLoggedIn && (
                <div className="success-message">
                  <span className="success-icon">✔️</span>
                  <span>You have successfully logged in with GitHub!</span>
                </div>
              )}
              {adoisLoggedIn && (
                <div className="success-message">
                  <span className="success-icon">✔️</span>
                  <span>You have successfully logged in with Microsoft!</span>
                </div>
              )}
 
               
                 {(isLoggedIn || adoisLoggedIn) && (
                <div className="tab-content">
                <p>Please upload Organization standards to proceed.</p>
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
                </div>
                )}
                {errorMessage && (
                  <div className="error-message" style={{ color: 'red', marginTop: '10px' }}>
                    {errorMessage}
                  </div>
                )}
                {successMessage && (
                  <div className="success-message">
                  <span className="success-icon">✔️</span>
                  <span>{successMessage}</span>
                  </div>
                )}
               
              </div>
            }
          />
          <Route path="/single-file-review" element={<SingleFileReviewPage selectedOrgFile={orgStdFile} />} />
          <Route path="/folder-repo-review" element={<FolderOrRepoReviewPage orgFile={orgStdFile} />} />
          <Route path="/pr-review" element={<PRReviewPage orgFile={orgStdFile} />} />
          <Route path="/ado-repo" element={<AdoRepoReviewPage orgFile={orgStdFile} />} />
          <Route path="/ado-pr" element={<AdoPRReviewPage orgFile={orgStdFile} />} />
        </Routes>
      </div>
    
  );
};
 
export default App;
