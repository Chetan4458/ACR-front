import React, { useState } from 'react';
import './SingleFileReview.css';

const ErrorTabs = ({ errorTabs }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleTabClick = (index) => {
    setActiveTab(index);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="error-tabs-container">
      {/* Expand/Collapse Button */}
      <button className="expand-button" onClick={toggleExpand}>
        {isExpanded ? 'Collapse Errors' : 'Expand Errors'}
      </button>

      {/* Show Error Tabs only when expanded */}
      {isExpanded && (
        <div className="tabs-section">
          {/* Render Tabs */}
          <div className="tabs">
            {errorTabs.map((tab, index) => (
              <button 
                key={index} 
                onClick={() => handleTabClick(index)} 
                className={`tab-button ${activeTab === index ? 'active' : ''}`}
              >
                {tab.title} ({tab.count})
              </button>
            ))}
          </div>

          {/* Render Active Tab Content */}
          <div className="tab-content">
            <h3>{errorTabs[activeTab].title}</h3>
            <pre>{errorTabs[activeTab].content}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorTabs;
