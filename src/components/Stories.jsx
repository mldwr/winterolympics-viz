import React from 'react';
import { nationFlags } from '../constants';

const Stories = ({ stories, selectedStory, onStorySelect, onClearSelection }) => {
  return (
    <section className="stories-section">
      <div className="stories-container">
        <div className="stories-header">
          <h2 className="stories-title">
            <span className="stories-icon">✨</span>
            Data Stories
          </h2>
          <p className="stories-subtitle">
            Pick a story to focus the chart and reveal the narrative.
          </p>
        </div>
        <div className="stories-grid">
          {stories.map((story) => (
            <button
              key={story.id}
              onClick={() => onStorySelect(story)}
              className={`story-button ${selectedStory?.id === story.id ? 'active' : ''}`}
            >
              <h3 className="story-button-title">
                {story.title}
              </h3>
            </button>
          ))}
          <button
            onClick={onClearSelection}
            className="race-button"
            title="Clear all story and nation selections"
          >
            ↺ Reset Chart
          </button>
        </div>
        {selectedStory && (
          <div className="story-detail">
            <div className="story-detail-content">
              <div className="story-detail-text">
                <h4 className="story-detail-title">{selectedStory.title}</h4>
                <p className="story-detail-description">
                  {selectedStory.description}
                </p>
                <div className="story-detail-nations">
                  {selectedStory.nations.map((nation) => {
                    const flag = nationFlags[nation];
                    return (
                      <span key={nation} className="story-nation-tag">
                        {flag && (
                          <img
                            src={flag}
                            alt={nation}
                            className="story-nation-flag"
                          />
                        )}
                        {nation}
                      </span>
                    );
                  })}
                </div>
              </div>
              <button
                onClick={() => onStorySelect(null)}
                className="story-close-button"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Stories;
