import React, { useState } from 'react';
import './style.css';

const ErrorTabs = ({ errorTabs }) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabClick = (index) => {
    setActiveTab(index);
  };

  // Function to replace **text** with <strong>text</strong> and * text with <ul><li>text</li></ul>
  const parseText = (text) => {
    // Replace **text** with <strong>text</strong>
    let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Replace * text with a bullet point <li>text</li>
    formattedText = formattedText.replace(/\*\s(.*?)(?=\n|$)/g, '<ul><li>$1</li></ul>');

    return { __html: formattedText };
  };

  return (
    <div className="error-tabs-container">
      {/* Show Error Tabs only when expanded */}
      <div className="tabs-section">
        {/* Render Tabs */}
        <div className="tabs">
          {errorTabs.map((tab, index) => (
            <button 
              key={index} 
              onClick={() => handleTabClick(index)} 
              className={`tab-button ${activeTab === index ? 'active' : ''}`}
            >
              {/* Conditionally render the title with or without count */}
              {tab.title === 'Suggested Code' ? tab.title : `${tab.title} (${tab.count})`}
            </button>
          ))}
        </div>

        {/* Render Active Tab Content with dangerouslySetInnerHTML */}
        <div className="full-review">
          <h3>{errorTabs[activeTab].title}</h3>
          <pre>
            <span dangerouslySetInnerHTML={parseText(errorTabs[activeTab].content)} />
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ErrorTabs;
