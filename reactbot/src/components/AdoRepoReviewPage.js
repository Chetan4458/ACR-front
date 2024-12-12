import React, { useState, useCallback, useMemo } from "react";
import axios from "axios";
import "./style.css";
import ErrorTabs from './ErrorTabs';

axios.defaults.withCredentials = true;

// Helper function to parse text (for rendering rich content)
const parseText = (text) => {
  if (!text) return text;

  let formattedText = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  formattedText = formattedText.replace(/^\*(.*)$/gm, "<li>$1</li>");
  if (/<li>/.test(formattedText)) {
    formattedText = `<ul>${formattedText}</ul>`;
  }

  return { __html: formattedText };
};

// FileItem component displays the file name and its associated tabs
const FileItem = React.memo(({ file, selectedFile, activeTab, handleFileClick, handleTabClick }) => (
  <li className="pr-item" aria-expanded={selectedFile === file}>
    <div className="pr-title" onClick={() => handleFileClick(file)}>
      {file}
    </div>
    {/* Always show the tabs directly under the file title */}
    {selectedFile === file && (
      <div>
        <ul className="tab-list-container" style={{ listStyleType: "none" }}>
          {["View Content", "Explanation", "Complete Review", "Summary Review","Errors Analysis", "Errors Severity", "EStandards Score", "Vulnerabilities", "URL Detection"].map((tabName) => (
            <li
              key={tabName}
              className={`tab-item ${activeTab === tabName ? "active" : ""}`}
              onClick={(e) => handleTabClick(tabName, e)}
            >
              {tabName}
            </li>
          ))}
        </ul>
      </div>
    )}
  </li>
));

const TabContent = React.memo(({ activeTab, reviewResults, selectedFile }) => {
  const fileData = reviewResults.find((item) => item.file_path === selectedFile);

  const content = useMemo(() => {
    if (!fileData) return "Select a file to view details.";

    switch (activeTab) {
      case "View Content":
        return (
            <div className='full-review'>
            <pre>
              <h3>
                New Code Content
              </h3><br/>
              {fileData.content}
              <br/>
            </pre>

          </div>
        )

      case "Explanation":
        return (
            <div className="full-review">
            <pre>
              <h3>Explanation:</h3><br />
              <span dangerouslySetInnerHTML={parseText(fileData.full_review.review_output.explanation)} />
            </pre>
          </div>
        );

      case "Complete Review":
        return (
            <div className="full-review">
            <pre>
              <h3>Full Review:</h3><br />
              <span dangerouslySetInnerHTML={parseText(fileData.full_review.review_output.review)} />
            </pre>
          </div>
        );

      case "Summary Review":
        return (
            <div className="full-review">
            <pre>
              <h3>Summary:</h3><br />
              <span dangerouslySetInnerHTML={parseText(fileData.full_review.sumreview_output.review)} />
            </pre>
          </div>
        );
    case "Errors Analysis":
        return (
            <div className="error-tabs-box">
            {fileData.full_review.error_output && (
                <ErrorTabs errorTabs={fileData.full_review.error_output} />
            )}
        </div>
        );
    case "Errors Severity":
        return (
            <div>
            {/* Severity */}
            {fileData.full_review.severity && (
                <div className="severity">
                <h3>Severity:</h3>
                <p><strong>Total Errors:</strong> {fileData.full_review.severity.total_errors}</p>
                <p style={{ color: fileData.full_review.severity.color }}>
                    <strong>Severity Score:</strong> {fileData.full_review.severity.total_score}
                </p>
                <p style={{ color: fileData.full_review.severity.color }}>
                    <strong>Severity Message:</strong> {fileData.full_review.severity.severity_message}
                </p>
                </div>
            )}
            </div>
        );
    case "EStandards Score":
        return (
            <div className="full-review">
            {fileData.full_review.score && (
                <>
                <div className='score-line'>
                    <h3 className="score">
                    Overall Score Based on Organization Standards:
                    <span className="score-value"> {fileData.full_review.score.value}</span>
                    <span className="score-ten">/10</span>
                    </h3>
                </div>
        
                {/* Display explanation based on reviewType */}
                <pre>
                    <strong>
                    <span style={{ fontSize: '20px', color: 'black' }}>Explanation:</span>
                    </strong>
                    <br />
                    <span dangerouslySetInnerHTML={parseText(fileData.full_review.score.explanation)} />
                </pre>
                </>
            )}
            </div>
        );
        
    case "Vulnerabilities":
        return (
            <div className="severity">
              <h3>Vulnerabilities:</h3>
              {fileData.full_review.severity && (
                fileData.full_review.severity.vulnerabilities && fileData.full_review.severity.vulnerabilities.length > 0 ? (
                  <ul>
                    {fileData.full_review.severity.vulnerabilities.map((vuln, index) => (
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
                <span dangerouslySetInnerHTML={parseText(fileData.full_review.review_output.urls)} />
            </pre>
            </div>
        );  
    default:
        return "";
    }
  }, [activeTab, fileData]);

  return <div className="tab-content">{content}</div>;
});

const AdoRepoReview = ({ orgFile }) => {
  const [pat, setpat] = useState("");
  const [url, seturl] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reviewResults, setReviewResults] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeTab, setActiveTab] = useState("View Content");
  const [showSidebar, setShowSidebar] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!orgFile) {
      setError("Organizational standards file is required.");
      return;
    }

    setShowSidebar(false);
    setLoading(true);
    setReviewResults(null);

    const formData = new FormData();
    adoauthcode=localStorage.getItem('ado_code')
    formData.append("code", adoauthcode);
    formData.append("url", url);
    formData.append("org_file", orgFile);

    try {
      const response = await axios.post("/api/review/ado-repo/", formData,{
  timeout: 0, // Disable timeout (wait indefinitely)
});
      if (response.data && Array.isArray(response.data.reviews_data)) {
        setReviewResults(response.data.reviews_data);
      } else {
        setError("Unexpected response format.");
      }
    } catch (err) {
      const { error, traceback } = err.response?.data || {};
      setError(`${error}\n\nTraceback:\n${traceback}`);
    } finally {
      setShowSidebar(true);
      setLoading(false);
    }
  };

  const handleFileClick = useCallback(
    (file) => {
      setSelectedFile((prev) => (prev === file ? null : file));
      setActiveTab("View Content");
    },
    []
  );

  const handleTabClick = useCallback((tabName, e) => {
    e.stopPropagation();
    setActiveTab(tabName);
  }, []);

  return (
    <div className="acr">
      <div className={`review-container ${showSidebar ? "sidebar-pr-active" : ""}`}>
        <h1>ADO Repository Review</h1>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="pr-form">
          <div className="form-container">
          <div className="textbox">
          <label>ADO Repo URL:</label>
          <input
            type="text"
            value={url}
            onChange={(e) => seturl(e.target.value)}
            placeholder="Enter ADO repo URL"
            required
          />
          </div>
          <div className="review-buttons">
          <button type="submit" className="review-type-button">
            Process
          </button>
          </div>
          {loading && <div className="loading">Loading...</div>}
          {error && <div className="error-message">{error}</div>}
          </div>
        </form>

        {/* Sidebar Section */}
        {showSidebar && (
          <div className={`sidebar-pr ${showSidebar ? "visible" : ""}`}>
            <h2>Files</h2>
            <ul>
              {reviewResults.map((review) => (
                <FileItem
                  key={review.file_path}
                  file={review.file_path}
                  selectedFile={selectedFile}
                  activeTab={activeTab}
                  handleFileClick={handleFileClick}
                  handleTabClick={handleTabClick}
                />
              ))}
            </ul>
          </div>
        )}

        {/* Tab Content Section */}
        {selectedFile && reviewResults && <TabContent activeTab={activeTab} reviewResults={reviewResults} selectedFile={selectedFile} />}
      </div>
    </div>
  );
};

export default AdoRepoReview;
