import React, { useState, useCallback, useMemo } from "react";
import axios from "axios";
import "./style.css";
import DiffViewer from 'react-diff-viewer';
axios.defaults.withCredentials = true;
import ErrorTabs from './ErrorTabs';
import { useAuth } from './AuthContext';

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
            {sFile.new && (
              <pre>
                <h3>
                  New Code Content
                </h3><br/>
                {sFile.new}

              </pre>)}
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
              {sFile?.old && sFile?.new && (
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

const AdoPRReviewComponent = ({ orgFile, adoauthcode }) => {
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
  const [rejectReason, setRejectReason] = useState("");

  const handleApprovePR = async (prNumber) => {
    try {
      const response = await axios.post("/api/review/approve-ado-pr/", {
        pr_number: prNumber,
        repo_link: repoLink,
      });
      alert(response.data.detail);
      // setPrList((prevPrs) => prevPrs.filter((pr) => pr.number !== prNumber));
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to approve PR.");
    }
  };
  
  const handleRejectPR = async (prNumber) => {
    const reason = prompt("Please provide a reason for rejecting this PR:");
    if (!reason) return;
  
    try {
      const response = await axios.post("/api/review/reject-pr/", {
        pr_number: prNumber,
        repo_link: repoLink,
        reason,
      });
      alert(response.data.detail);
      setPrList((prevPrs) => prevPrs.filter((pr) => pr.number !== prNumber));
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to reject PR.");
    }
  };
  
  const handleCompletePR = async (prNumber) => {
    try {
      const response = await axios.post("/api/review/complete-pr/", {
        pr_number: prNumber,
        repo_link: repoLink,
      });
      alert(response.data.detail);
      setPrList((prevPrs) => prevPrs.filter((pr) => pr.number !== prNumber));
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to complete PR.");
    }
  };
  
  // Function to fetch data when "Process PRs" is clicked
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const formData = new FormData();
      
      formData.append("code", adoauthcode);
      formData.append("repo_link", repoLink);
      formData.append("orgFile", orgFile);
  
      // Fetch PR data
      const response = await axios.post("/api/review/ado-pr/", formData);
      const prData = response.data;
  
      // Normalize the response into an array
      const prArray = Object.values(prData); // Convert dictionary to array
      setPrList(prArray); // Set prList to the normalized array
  
      // Map files to reviews for easier access
      const fileDetailsMap = {};
      prArray.forEach((pr) => {
        fileDetailsMap[pr.number] = pr.files.reduce((acc, file) => {
          acc[file] = pr.reviews[file] || null;
          return acc;
        }, {});
      });
      setFileDetails(fileDetailsMap);
  
      setError(""); // Clear errors
    } catch (err) {
      setError(err.response?.data?.detail || "An error occurred while fetching PRs.");
    } finally {
      setLoading(false);
      setShowSidebar(true); // Show sidebar
    }
  }, [adoauthcode,orgFile, repoLink]);
  

 
  // Function to handle file click, now using the fileDetails state
  const handleFileClick = useCallback(
    (file) => {
      setSelectedFile((prev) => (prev === file ? null : file));
      setActiveTab("view Content");
  
      if (expandedPR && fileDetails[expandedPR]) {
        setsFile(fileDetails[expandedPR][file] || null);
      }
    },
    [expandedPR, fileDetails]
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
    // Toggle the expanded PR state
    setExpandedPR((prev) => {
      // Clear errors if the PR is collapsed
      
        setError(""); // Clear the error state
      
      return prNumber === prev ? null : prNumber; // Collapse or expand the PR
    });
  
    // Reset selected file and sFile when toggling the PR
    setSelectedFile(null);
    setsFile(null);
  }, []);
  

  return (
    <div className="acr">
    
    <div className={`review-container ${showSidebar ? "sidebar-pr-active" : ""}`}>
      <h1>ADO PR Review Tool</h1>
     
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
            #{pr.number} - {pr.title}
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
        {/* Add Approve, Reject, and Complete Buttons */}
        <div className="pr-actions">
          <button
            className="tab-button approve-button"
            onClick={() => handleApprovePR(pr.number)}
          >
            Approve PR
          </button>
          <button
            className="tab-button reject-button"
            onClick={() => handleRejectPR(pr.number)}
          >
            Reject PR
          </button>
          <button
            className="tab-button complete-button"
            onClick={() => handleCompletePR(pr.number)}
          >
            Complete PR
          </button>
        </div>
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

export default AdoPRReviewComponent;
