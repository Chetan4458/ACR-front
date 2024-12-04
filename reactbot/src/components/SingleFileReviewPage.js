import React, { useState } from 'react';
import axios from 'axios';
import './style.css';
import DiffViewer from 'react-diff-viewer';
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
const ReviewSingleFile = ({ selectedOrgFile }) => {
  const [selectedNewFile, setselectedNewFile] = useState(null);
  const [selectedOldFile, setselectedOldFile] = useState(null);
  const [activeTab, setActiveTab] = useState("viewFiles");
  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(false);

  // const [selectedOrgFile, setSelectedOrgFile] = useState(null);
  const [modelType, setModelType] = useState('llama3-8b-8192'); // Default model
  // const [reviewType, setReviewType] = useState(''); // Default to ''
  const [reviewOption, setReviewOption] = useState('Modified Code');
  const [reviewResult, setReviewResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [lang, setLang] = useState('');
 
  const handleNewFileChange = (e) => setselectedNewFile(e.target.files[0]);
  const handleModelTypeChange = (e) => setModelType(e.target.value);
  const handleReviewOptionChange = (e) => setReviewOption(e.target.value);
  const handleOldFileChange = (e) => {
    const oldfile = e.target.files[0];
    setselectedOldFile(oldfile); // Store the old file in state
  };
  
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    console.log("Active tab after click:", tab); // Debug activeTab change
  };
 
  const submitReview = async(event) => {
    
    if (!selectedNewFile || !selectedOrgFile) {
      setErrorMessage("Please upload both a code file and an organization standards file.");
      return;
    }
    setReviewResult('');
    setShowSidebar(false);
    setLoading(true);
    setErrorMessage(null);
    const fileExtension = selectedNewFile.name.split('.').pop().toLowerCase();
    setLang(fileExtension);
    const formData = new FormData();
    formData.append('newfile', selectedNewFile);
    formData.append('oldfile', selectedOldFile);
    formData.append('org_standards', selectedOrgFile);
    formData.append('model_type', modelType);
    formData.append('review_option', reviewOption);
    // formData.append('review_type', reviewType);
    formData.append('lang', lang);
 
    try {
      const response = await axios.post('/api/review/single-file/', formData);
      setReviewResult(response.data);
    } catch (error) {
      setErrorMessage('Error during the review process.');
    }finally{setLoading(false);setShowSidebar(true);}
  };
  const renderTabContent = () => {
    console.log("Rendering content for activeTab:", activeTab); // Debug activeTab in render
    
    switch (activeTab) {
      case "view":
        return(
          <div className='full-review'>
            <pre>
              <h3>
                New Code Content
              </h3><br/>
              {reviewResult.Code_File}
              <br/>
            <h3></h3><h3></h3><br/>
            </pre>
            {reviewResult.Old_File && (
              <pre>
                <h3>
                  Old Code Content
                </h3><br/>
                {reviewResult.Old_File}

              </pre>

            )}

          </div>
        )
        case "compare":
          return (
            <div>
              {reviewResult?.Old_File &&(
                  <div style={{ height: "500px", width: "100%", overflowY: "auto" }}>
                    <DiffViewer oldValue={reviewResult.Old_File} newValue={reviewResult.Code_File} splitView={true} />
                  </div>
              )}
            </div>
          );
        
      case "explain":
        return (
          <div className="full-review">
            <pre>
              <h3>Explanation:</h3><br />
              <span dangerouslySetInnerHTML={parseText(reviewResult['Full review'].explanation)} />
            </pre>
          </div>
        );

      case "review":
        return (
          <div className="full-review">
            <pre>
              <h3>Review:</h3><br />
              <span dangerouslySetInnerHTML={parseText(reviewResult['Full review'].review)} />
            </pre>
          </div>
        );

      case "url":
        return (
          <div className="full-review">
            <pre>
              <h3>URL Detection:</h3><br />
              <span dangerouslySetInnerHTML={parseText(reviewResult['Full review'].urls)} />
            </pre>
          </div>
        );
        case "errorsSeverity":
        return (
          <div>
            {/* Severity */}
            {reviewResult.severity && (
              <div className="severity">
                <h3>Severity:</h3>
                <p><strong>Total Errors:</strong> {reviewResult.severity.total_errors}</p>
                <p style={{ color: reviewResult.severity.color }}>
                  <strong>Severity Score:</strong> {reviewResult.severity.total_score}
                </p>
                <p style={{ color: reviewResult.severity.color }}>
                  <strong>Severity Message:</strong> {reviewResult.severity.severity_message}
                </p>
              </div>
            )}
          </div>
        );

        case "vul":
          return (
            <div className="severity">
              <h3>Vulnerabilities:</h3>
              {reviewResult.severity && (
                reviewResult.severity.vulnerabilities && reviewResult.severity.vulnerabilities.length > 0 ? (
                  <ul>
                    {reviewResult.severity.vulnerabilities.map((vuln, index) => (
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
          

        
      case "errorsAnalysis":
        return (
          <div className="error-tabs-box">
            {reviewResult.error_output && (
              
                <ErrorTabs errorTabs={reviewResult.error_output} />
              
            )}
        </div>
        );
        case "score":
          return (
            <div className="full-review">
              {reviewResult.score && (
                <>
                  <div className='score-line'>
                    <h3 className="score">
                      Overall Score Based on Organization Standards:
                      <span className="score-value"> {reviewResult.score.value}</span>
                      <span className="score-ten">/10</span>
                    </h3>
                  </div>
        
                  {/* Display explanation based on reviewType */}
                  <pre>
                    <strong>
                      <span style={{ fontSize: '20px', color: 'black' }}>Explanation:</span>
                    </strong>
                    <br />
                    <span dangerouslySetInnerHTML={parseText(reviewResult.score.explanation)} />
                  </pre>
                </>
              )}
            </div>
          );
        
      case "summary":
        return (
          <div className="full-review">
            <pre>
              <h3>Review:</h3><br />
              <span dangerouslySetInnerHTML={parseText(reviewResult['sum review'].review)} />
            </pre>
          </div>
        );

      default:
        return null; // Add a default case to handle other scenarios or if no case matches
    }
};

 
return (
  <div className='acr'>
    {showSidebar && (
      <div className={`sidebar ${showSidebar ? "visible" : ""}`}>
        <ul>
          <li onClick={() => handleTabClick("view")}>View</li>
          <li onClick={() => handleTabClick("compare")}>Compare Table</li>
          <li onClick={() => handleTabClick("explain")}>Explanation</li>     
          <li onClick={() => handleTabClick("review")}>Full Review</li>
          <li onClick={() => handleTabClick("summary")}>Summary Review</li>
          <li onClick={() => handleTabClick("errorsAnalysis")}>Errors Analysis</li>
          <li onClick={() => handleTabClick("errorsSeverity")}>Errors Severity</li>
          <li onClick={() => handleTabClick("score")}>EStandards Score</li>
          <li onClick={() => handleTabClick("vul")}>Vulnerabilities</li>
          <li onClick={() => handleTabClick("url")}>External URLs</li>
        </ul>
      </div>
    )}
    <div
        className={`review-container ${showSidebar ? "sidebar-active" : ""}`}
      >
      <h1 className="title">Code Review</h1>

      {/* File Inputs */}
      <div className="form-container">
        <div className="file-upload-wrapper">
          <div className="file-upload">
            <label htmlFor="codeFile">Upload New File</label>
            <input
              id="codeFile"
              type="file"
              onChange={handleNewFileChange}
              className='form-control'
              accept=".js,.py,.java,.css,.cpp,.html"
              required
            />
          </div>
          <div className="file-upload">
            <label htmlFor="oldFile">Upload Old File (optional)</label>
            <input
              id="oldFile"
              type="file"
              onChange={handleOldFileChange}
              accept=".js,.py,.java,.css,.cpp,.html"
              className='form-control'
            />
          </div>
        </div>

        {/* Model and Review Type Selection */}
        <div className="select-container">
          <label>Model Type</label>
          <select value={modelType} onChange={handleModelTypeChange}>
            <option value="llama3-8b-8192">Llama3-8B-8192</option>
            <option value="llama3-70b-8192">Llama3-70b-8192</option>
          </select>
          {selectedOldFile && (
            <div>
              <label>Review Option</label>
              <select value={reviewOption} onChange={handleReviewOptionChange}>
                <option value="Modified Code">Modified Code</option>
                <option value="Entire New Code">Entire New Code</option>
              </select>
            </div>
          )}
        </div>

        {/* Review Type Buttons */}
        <div className="review-buttons">
          <button
            className={`review-type-button`}
            onClick={() => submitReview()}
          >
            Process Files
          </button>
          
        </div>
        {loading && <div className="loading">Loading...</div>}
        {/* Error message display */}
        {errorMessage && <div className="error-message">{errorMessage}</div>}
      </div>

      {/* Review Result Display */}
      {reviewResult && (
          
          <div className="tab-content">
            {renderTabContent()}
          </div>
      )}
    </div>
  </div>
);


};  
export default ReviewSingleFile;