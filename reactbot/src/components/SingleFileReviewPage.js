import React, { useState } from 'react';
import axios from 'axios';
import './SingleFileReview.css';
import ErrorTabs from './ErrorTabs';

const ReviewSingleFile = () => {
  const [selectedCodeFile, setSelectedCodeFile] = useState(null);
  const [selectedOrgFile, setSelectedOrgFile] = useState(null);
  const [modelType, setModelType] = useState('llama3-8b-8192'); // Default model
  const [reviewType, setReviewType] = useState(''); // Default to ''
  const [reviewResult, setReviewResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [lang, setLang] = useState('');

  const handleCodeFileChange = (e) => setSelectedCodeFile(e.target.files[0]);
  const handleOrgFileChange = (e) => setSelectedOrgFile(e.target.files[0]);
  const handleModelTypeChange = (e) => setModelType(e.target.value);

  const handleReviewTypeChange = (type) => {
    setReviewType(type);
    submitReview(type); // Automatically submit when a review type is selected
  };

  const submitReview = async (reviewType) => {
    if (!selectedCodeFile || !selectedOrgFile) {
      setErrorMessage("Please upload both a code file and an organization standards file.");
      return;
    }

    setErrorMessage(null);
    const fileExtension = selectedCodeFile.name.split('.').pop().toLowerCase();
    setLang(fileExtension);
    const formData = new FormData();
    formData.append('file', selectedCodeFile);
    formData.append('org_standards', selectedOrgFile);
    formData.append('model_type', modelType);
    formData.append('review_type', reviewType);
    formData.append('lang', lang);

    try {
      const response = await axios.post('/api/review/single-file/', formData);
      setReviewResult(response.data);
    } catch (error) {
      setErrorMessage('Error during the review process.');
    }
  };

  return (
    <div className="review-container">
      <h2 className="title">Code Review</h2>

      {/* File Inputs */}
      <div className="form-container">
        <div className="file-upload">
          <label>Upload Code File</label>
          <input type="file" onChange={handleCodeFileChange} 
          accept=".js,.py,.java,.css,.cpp,.html"/>
        </div>
        <div className="file-upload">
          <label>Upload Organization Standards File</label>
          <input type="file" onChange={handleOrgFileChange} 
          accept=".docx,.pptx,.txt,.pdf"/>
        </div>

        {/* Model and Review Type Selection */}
        <div className="select-container">
          <label>Model Type</label>
          <select value={modelType} onChange={handleModelTypeChange}>
            <option value="llama3-8b-8192">Llama3-8B-8192</option>
            <option value="llama3-70b-8192">llama3-70b-8192</option>
          </select>
        </div>

        {/* Review Type Buttons */}
        <div className="review-buttons">
          <button
            className={`review-type-button ${reviewType === 'complete' ? 'active' : ''}`}
            onClick={() => handleReviewTypeChange('complete')}
          >
            Complete Review
          </button>
          <button
            className={`review-type-button ${reviewType === 'summary' ? 'active' : ''}`}
            onClick={() => handleReviewTypeChange('summary')}
          >
            Summary Review
          </button>
        </div>

        {/* Error message display */}
        {errorMessage && <div className="error-message">{errorMessage}</div>}
      </div>

      {/* Review Result Display */}
      {reviewResult && (
        <div className="review-result-container">
          {/* Full Review */}
          {reviewResult['Full review'] && (
            <div className="full-review">
              <h3>Full Review:</h3>
              <pre><strong>Explanation:</strong><br/> {reviewResult['Full review'].explanation}</pre>
              <pre><strong>Review:</strong> <br/>{reviewResult['Full review'].review}</pre>
              <pre><strong>URL Detection:</strong><br/> {reviewResult['Full review'].urls}</pre>
            </div>
          )}

          {/* Error Tabs */}
          {reviewResult.error_output && (
            <div className="error-tabs-box">
              <ErrorTabs errorTabs={reviewResult.error_output} />
            </div>
          )}

          {/* Score */}
          {reviewResult.score && (
            <div className="score-container">
              <div className='score-line'>
              <h3 className="score">
                Overall Score Based on Organization Standards:
                <span className="score-value"> {reviewResult.score.value}</span>
                <span className="score-ten">/10</span>
              </h3>
              </div>
              
              <pre><strong>Explanation:</strong><br/> {reviewResult.score.explanation}</pre>
            </div>
          )}

          {/* Severity */}
          {reviewResult.severity && (
            <div className="severity">
              <h3>Severity:</h3>
              <p style={{ color: reviewResult.severity.color }}>
                <strong>Severity Score:</strong> {reviewResult.severity.total_score}
              </p>
              <p style={{ color: reviewResult.severity.color }}>
                <strong>Severity Message:</strong> {reviewResult.severity.severity_message}
              </p>
              <p><strong>Total Errors:</strong> {reviewResult.severity.total_errors}</p>

              {/* Display Vulnerabilities */}
              {reviewResult.severity.vulnerabilities && reviewResult.severity.vulnerabilities.length > 0 ? (
                <div>
                  <h4>Vulnerabilities:</h4>
                  <ul>
                    {reviewResult.severity.vulnerabilities.map((vuln, index) => (
                      <li key={index}>{vuln}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p style={{ fontWeight: 'bold', color: 'green' }}>
                  No vulnerabilities
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};  
export default ReviewSingleFile;