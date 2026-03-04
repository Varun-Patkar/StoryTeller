/**
 * StoryInputForm: Text input for continuing the story
 * 
 * Shows a text area for players to enter their response to the current passage.
 * Displays when the story is ready for input (odd passage count).
 * Handles both continuing own story and forking public stories.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.storyId - Story ID
 * @param {string} props.storySlug - Story slug for navigation
 * @param {string} props.storyTitle - Story title for context
 * @param {boolean} props.isOwnStory - Whether user owns the story
 * @param {boolean} props.isLoading - Whether response is being submitted
 * @param {function} props.onSubmit - Called with response text when submitting
 * @param {boolean} props.disabled - Whether to disable the form
 * @returns {JSX.Element} Form for story input
 */

import { useState } from 'react';

export default function StoryInputForm({ 
  storyId, 
  storySlug, 
  storyTitle, 
  isOwnStory, 
  isLoading, 
  onSubmit, 
  disabled = false 
}) {
  const [responseText, setResponseText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const trimmed = responseText.trim();
    if (!trimmed) {
      return;
    }

    onSubmit(trimmed);
    setResponseText('');
  };

  const isDisabled = disabled || isLoading || responseText.trim().length === 0;

  return (
    <div className="mt-12 p-8 border-2 border-amber-600/50 rounded-lg bg-amber-950/20">
      <h3 className="text-2xl font-bold text-amber-200 mb-4">
        {isOwnStory ? '✍️ Continue Your Tale' : '🔀 Fork & Respond'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={responseText}
          onChange={(e) => setResponseText(e.target.value)}
          placeholder="What happens next in your story? (minimum 10 characters)"
          className="w-full h-32 p-4 bg-gray-900 border-2 border-blue-600/50 rounded-lg text-gray-100 placeholder-gray-500 focus:border-blue-400 focus:outline-none transition-colors resize-none"
          disabled={isLoading}
        />
        
        <div className="flex items-center justify-between">
          <p className="text-sm text-blue-300">
            {responseText.length}/500 characters
          </p>
          
          <button
            type="submit"
            disabled={isDisabled}
            className={`px-8 py-3 rounded-lg font-medium transition-all ${
              isDisabled
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 active:scale-95'
            }`}
          >
            {isLoading ? '⏳ Processing...' : 'Submit Response'}
          </button>
        </div>

        {responseText.length > 500 && (
          <p className="text-sm text-red-400">
            Response exceeds 500 characters. Please shorten it.
          </p>
        )}
      </form>
    </div>
  );
}
