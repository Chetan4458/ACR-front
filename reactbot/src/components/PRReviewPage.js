import React, { useState, useCallback, useMemo } from "react";
import axios from "axios";
import "./style.css";
import DiffViewer from 'react-diff-viewer';
axios.defaults.withCredentials = true;
import ErrorTabs from './ErrorTabs';
const parseText = (text) => {
  if (!text) return text;
 
  // Replace **text** with <strong>text</strong>
  let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
 
  // Replace *text with <li>text</li>
  // Ensure that lines starting with * are treated as list items.
  formattedText = formattedText.replace(/^\*(.*)$/gm, '<li>$1</li>');
 
  // If there are any <li> elements, wrap them in a <ul>
  if (/<li>/.test(formattedText)) {
    formattedText = `<ul>${formattedText}</ul>`;
  }
 
  return { __html: formattedText };
};


const TabContent = React.memo(({ activeTab, sFile }) => {
  const content = useMemo(() => {
    if (!sFile) return "Select a file to view details.";

    switch (activeTab) {
      case "view Content":
        return(
          <div className='full-review'>
            <pre>
              <h3>
                New Code Content
              </h3><br/>
              {sFile.new}
              <br/>
            <h3></h3><h3></h3><br/>
            </pre>
            {sFile.old && (
              <pre>
                <h3>
                  Old Code Content
                </h3><br/>
                {sFile.old}

              </pre>

            )}

          </div>
        )

        case "comparison":
          return (
            <div>
              {sFile?.old &&(
                  <div style={{ height: "500px", width: "100%", overflowY: "auto" }}>
                    <DiffViewer oldValue={sFile.old} newValue={sFile.new} splitView={true} />
                  </div>
              )}
            </div>
          );
        
   
      case "explaination":
        return (
          <div className="full-review">
            <pre>
              <h3>Explanation:</h3><br />
              <span dangerouslySetInnerHTML={parseText(sFile.full_review.review_output.explanation)} />
            </pre>
          </div>
        );
      case "complete Review":
        return (
          <div className="full-review">
            <pre>
              <h3>Full Review:</h3><br />
              <span dangerouslySetInnerHTML={parseText(sFile.full_review.review_output.review)} />
            </pre>
          </div>
        );
      case "summary Review":
        return (
          <div className="full-review">
            <pre>
              <h3>Summary:</h3><br />
              <span dangerouslySetInnerHTML={parseText(sFile.full_review.sumreview_output.review)} />
            </pre>
          </div>
        );
      case "errors Analysis":
        return (
          <div className="error-tabs-box">
            {sFile.full_review.error_output && (
                <ErrorTabs errorTabs={sFile.full_review.error_output} />
            )}
        </div>
        );
      case "errors Severity":
        return (
          <div>
            {/* Severity */}
            {sFile.full_review.severity && (
              <div className="severity">
                <h3>Severity:</h3>
                <p><strong>Total Errors:</strong> {sFile.full_review.severity.total_errors}</p>
                <p style={{ color: sFile.full_review.severity.color }}>
                  <strong>Severity Score:</strong> {sFile.full_review.severity.total_score}
                </p>
                <p style={{ color: sFile.full_review.severity.color }}>
                  <strong>Severity Message:</strong> {sFile.full_review.severity.severity_message}
                </p>
              </div>
            )}
          </div>
        );
      case "EStandards Score":
        return (
          <div className="full-review">
            {sFile.full_review.score && (
              <>
                <div className='score-line'>
                  <h3 className="score">
                    Overall Score Based on Organization Standards:
                    <span className="score-value"> {sFile.full_review.score.value}</span>
                    <span className="score-ten">/10</span>
                  </h3>
                </div>
      
                {/* Display explanation based on reviewType */}
                <pre>
                  <strong>
                    <span style={{ fontSize: '20px', color: 'black' }}>Explanation:</span>
                  </strong>
                  <br />
                  <span dangerouslySetInnerHTML={parseText(sFile.full_review.score.explanation)} />
                </pre>
              </>
            )}
          </div>
        );
      
      case "vulnerabilities":
        return (
          <div className="severity">
            <h3>Vulnerabilities:</h3>
            {sFile.full_review.severity && (
              sFile.full_review.severity.vulnerabilities && sFile.full_review.severity.vulnerabilities.length > 0 ? (
                <ul>
                  {sFile.full_review.severity.vulnerabilities.map((vuln, index) => (
                    <li key={index}>{vuln}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontWeight: 'bold', color: 'green' }}>
                  No vulnerabilities
                </p>
              )
            )}
          </div>
        );
      case "URL Detection":
        return (
          <div className="full-review">
            <pre>
              <h3>URL Detection:</h3><br />
              <span dangerouslySetInnerHTML={parseText(sFile.full_review.review_output.urls)} />
            </pre>
          </div>
        );
      default:
        return `Select a tab to view details.`;
    }
  }, [activeTab, sFile]);

  return <div className="tab-content">{content}</div>;
});

const FileItem = React.memo(({ file, index, selectedFile, activeTab, handleFileClick, handleTabClick }) => (
  <li key={index} className="file-item" onClick={() => handleFileClick(file)}>
    {file}
    {selectedFile === file && (
      <div className="tab-list-container">
        <ul>
          {["view Content", "comparison", "explaination", "complete Review", "summary Review", "errors Analysis", "errors Severity", "EStandards Score", "vulnerabilities", "URL Detection"].map((tabName) => (
            <li
              key={tabName}
              className={activeTab === tabName ? "active" : ""}
              onClick={(e) => handleTabClick(tabName, e)}
            >
              {tabName.charAt(0).toUpperCase() + tabName.slice(1)}
            </li>
          ))}
        </ul>
      </div>
    )}
  </li>
));

const PRReviewComponent = ({ orgFile, authcode }) => {
  const [token, setToken] = useState("");
  const [repoLink, setRepoLink] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [prList, setPrList] = useState([]);
  const [expandedPR, setExpandedPR] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [sFile, setsFile] = useState(null);
  const [activeTab, setActiveTab] = useState("view");
  const [showSidebar, setShowSidebar] = useState(false);
  const [fileDetails, setFileDetails] = useState({}); // State to store file details for all files in all PRs

  // Function to fetch data when "Process PRs" is clicked
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('code', authcode);
      formData.append('repo_link', repoLink);
      formData.append('orgFile', orgFile); // Attach the file

      // Fetch PRs
      const response = await axios.post("/api/review/handle-pr/", formData);
      setPrList(response.data.prs || []);

      // Now fetch file details for each PR in one go
      const allReviews = await axios.get("/api/review/file-category/");
      const prReviews = allReviews.data || {};

      // Store the reviews (file details) for all PRs
      const fileDetailsMap = {};
      response.data.prs.forEach(pr => {
        const prReviewsForPR = prReviews[pr.number]?.reviews || {};
        fileDetailsMap[pr.number] = pr.files.reduce((acc, file) => {
          acc[file] = prReviewsForPR[file] || null;
          return acc;
        }, {});
      });

      setFileDetails(fileDetailsMap); // Store file details for each file in each PR
      setError("");
    } catch (err) {
      console.error("Detailed error:", err); // Log the complete error object
      const errorMessage =
        err.response?.data?.detail || // API-specific error message
        err.message || // General error message
        "An unexpected error occurred."; // Fallback message
      setError(errorMessage); // Update the error state
    } finally {
      setLoading(false);
      setShowSidebar(true);
    }
  }, [authcode,orgFile, repoLink]);

  const approvePR = useCallback(async (prNumber) => {
    try {
      // Send the request to approve the PR on the backend
      const response = await axios.post("/api/review/approve-pr/", {
        pr_number: prNumber,
      });
  
      // Show success message or handle response
      alert(response.data.detail);  // Assuming backend returns a merge success message
  
      // Update the prList state by removing the approved PR
      setPrList((prevPrs) =>
        prevPrs.filter((pr) => pr.number !== prNumber)
      );
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to approve PR.");
    }
  });
  
  // Function to handle file click, now using the fileDetails state
  const handleFileClick = useCallback(
    (file) => {
      setSelectedFile((prev) => (prev === file ? null : file));
      setActiveTab("view Content");

      // Fetch the details for the selected file from the state (no need for another API call)
      if (expandedPR && fileDetails[expandedPR]) {
        setsFile(fileDetails[expandedPR][file] || null);
      }
    },
    [expandedPR, fileDetails] // Depend on expandedPR and fileDetails to get the right file details
  );

  // Function to handle tab click for file views
  const handleTabClick = useCallback((tabName, e) => {
    e.stopPropagation();
    setActiveTab(tabName);
  }, []);

  // Handle submit for processing PRs
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setPrList([]);
    setExpandedPR(null);
    setSelectedFile(null);
    setShowSidebar(false)
    setsFile(null);
    fetchData();
  };

  // Handle PR click to expand or collapse PR details
  const handlePRClick = useCallback((prNumber) => {
    setExpandedPR((prev) => (prNumber === prev ? null : prNumber));
    setSelectedFile(null);
    setsFile(null);
  }, []);

  return (
    <div className="acr">
    
    <div className={`review-container ${showSidebar ? "sidebar-pr-active" : ""}`}>
      <h1>PR Review Tool</h1>
     
      <form onSubmit={handleSubmit} className="pr-form">
        <div className="form-container">
          <div className="textbox">
            <label>Repository Link</label>
            <input
              type="text"
              value={repoLink}
              onChange={(e) => setRepoLink(e.target.value)}
              placeholder="Enter repository link"
              required
            />
          </div>
          <div className="review-buttons">
            <button type="submit" className="review-type-button">
              Process PRs
            </button>
          </div>
          {loading && <div className="loading">Loading...</div>}
          {error && <div className="error-message">{error}</div>}
        </div>
      </form>

      {showSidebar && (
      <div className={`sidebar-pr ${showSidebar ? "visible" : ""}`}>
        <h2>Pull Requests</h2>
        <ul>
          {prList.map((pr) => (
            <li key={pr.number} className="pr-item" aria-expanded={expandedPR === pr.number}>
              <div className="pr-title" onClick={() => handlePRClick(pr.number)}>
                #{pr.number}
              </div>
              {expandedPR === pr.number && pr.files && (
                <div>
                  <ul className="file-list">
                    {pr.files.map((file, index) => (
                      <FileItem
                        key={index}
                        file={file}
                        index={index}
                        selectedFile={selectedFile}
                        activeTab={activeTab}
                        handleFileClick={handleFileClick}
                        handleTabClick={handleTabClick}
                      />
                    ))}
                  </ul>
                  {/* Show the Approve PR button only when the PR is expanded */}
                  <button
                    className="tab-button"
                    onClick={() => approvePR(pr.number)}
                  >
                    Approve PR
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
      )}
      {selectedFile && (
        <div style={{alignItems:'center'}}>
        <h3>{sFile.display_path}</h3>
        <h3>--{sFile.file_status}</h3><br/>
       </div>
      )}
     
      {selectedFile && <TabContent activeTab={activeTab} sFile={sFile} />}
      
    </div>

    </div>
  );
};

export default PRReviewComponent;
