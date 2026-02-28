import { useState } from 'react';
import { useAppState } from '@/services/appState.jsx';
import { validateStorySetup } from '@/utils/validation';
import { createStory } from '@/services/mockApi';
import Button from '@/components/common/Button';
import Dropdown from '@/components/common/Dropdown';
import TextArea from '@/components/common/TextArea';

/**
 * StorySetup: Story creation form for defining character, premise, and goals.
 *
 * Layout:
 * - Right-side panel occupying 50vw
 * - Logo at top
 * - Form fields: Fandom dropdown, Character, Premise, Goals text areas
 * - Validation with mystical error messages
 * - "Begin Story" button to submit and transition to reading phase
 *
 * @returns {JSX.Element} StorySetup UI
 */
export default function StorySetup() {
  const { state, dispatch } = useAppState();
  const [formData, setFormData] = useState({
    fandom: '',
    character: '',
    premise: '',
    goals: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available fandoms for the dropdown
  const fandomOptions = [
    { value: 'douluo-dalu', label: 'Douluo Dalu' },
    { value: 'naruto', label: 'Naruto' },
    { value: 'one-piece', label: 'One Piece' },
    { value: 'aot', label: 'Attack on Titan' },
    { value: 'custom', label: 'Custom Universe' },
  ];

  /**
   * Handles input changes for form fields.
   *
   * @param {string} field - Field name
   * @param {string} value - New field value
   */
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field on change
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  /**
   * Handles blur events to trigger field validation.
   *
   * @param {string} field - Field name that lost focus
   */
  const handleBlur = field => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate this specific field
    const validation = validateStorySetup(formData);
    if (validation.errors[field]) {
      setErrors(prev => ({ ...prev, [field]: validation.errors[field] }));
    }
  };

  /**
   * Handles form submission to create story.
   * Validates all fields, calls createStory API, and transitions to PLAYING phase.
   *
   * @returns {Promise<void>}
   */
  const handleSubmit = async () => {
    // Prevent double submission
    if (isSubmitting || state.isTransitioning) {
      return;
    }

    // Mark all fields as touched
    setTouched({
      fandom: true,
      character: true,
      premise: true,
      goals: true,
    });

    // Validate entire form
    const validation = validateStorySetup(formData);

    // Check fandom selection
    if (!formData.fandom) {
      setErrors(prev => ({
        ...prev,
        fandom: 'Choose the realm where your story unfolds...',
      }));
      return;
    }

    if (!validation.valid) {
      setErrors(validation.errors);
      console.log('Validation failed:', validation.errors);
      return;
    }

    // All validation passed - create story
    try {
      setIsSubmitting(true);
      setErrors({});

      // Prepare story setup payload
      const setupPayload = {
        fandom: fandomOptions.find(opt => opt.value === formData.fandom)?.label || formData.fandom,
        character: formData.character,
        premise: formData.premise,
        goals: formData.goals,
        model: state.selectedModel?.ollamaTag || 'llama3:8b',
      };

      console.log('Creating story with payload:', setupPayload);

      // Call mock API to generate story
      const story = await createStory(setupPayload);

      console.log('Story created:', story);

      // Store story ID and transition to reading phase
      dispatch({ type: 'STORY_CREATED', payload: { storyId: story.id } });
      dispatch({ type: 'TRANSITION_TO_PLAYING' });
    } catch (error) {
      console.error('Story creation failed:', error);
      setErrors({
        submit: 'The tapestry resists weaving. Try once more.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles back button click to return to Dashboard.
   * Triggers reverse camera animation (surface → Earth orbit).
   *
   * @returns {void}
   */
  const handleBack = () => {
    if (state.isTransitioning || isSubmitting) {
      return;
    }
    dispatch({ type: 'TRANSITION_TO_DASHBOARD' });
  };

  return (
    <section className="absolute top-0 right-0 h-full w-[50vw] pointer-events-auto">
      <div className="h-full w-full bg-black/45 backdrop-blur-sm border-l border-blue-500/30 px-8 py-6 flex flex-col animate-[panelSlide_0.6s_ease-out] overflow-y-auto">
        
        {/* Header with back button and logo */}
        <header className="relative flex items-center justify-between mb-8 mt-3 animate-[fadeUp_0.5s_ease-out]">
          {/* Back button */}
          <button
            onClick={handleBack}
            disabled={state.isTransitioning || isSubmitting}
            className="flex items-center gap-2 px-4 py-2 rounded text-blue-300 hover:text-blue-100 hover:bg-blue-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Back to dashboard"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" 
                clipRule="evenodd" 
              />
            </svg>
            Back
          </button>

          {/* Logo centered */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <img src="/logo.png" alt="StoryTeller logo" className="h-12 sm:h-30 w-auto" />
          </div>

          {/* Spacer for layout balance */}
          <div className="w-20"></div>
        </header>

        {/* Form title */}
        <div className="mb-8 animate-[fadeUp_0.6s_ease-out]">
          <h1 className="text-3xl text-gray-100 font-bold mb-2">
            Weave Your Tale
          </h1>
          <p className="text-blue-200">
            Define the essence of your protagonist and the journey that awaits.
          </p>
        </div>

        {/* Form fields */}
        <div className="flex-1 space-y-6 animate-[fadeUp_0.7s_ease-out]">
          
          {/* Fandom dropdown */}
          <div>
            <label className="block text-sm font-semibold text-gray-100 mb-2">
              Realm of Adventure
            </label>
            <Dropdown
              options={fandomOptions}
              value={formData.fandom}
              onChange={value => handleChange('fandom', value)}
              placeholder="Select a universe..."
              onBlur={() => handleBlur('fandom')}
            />
            {touched.fandom && errors.fandom && (
              <p className="text-red-400 text-sm mt-2">{errors.fandom}</p>
            )}
          </div>

          {/* Character text area */}
          <div>
            <TextArea
              label="Your Protagonist"
              value={formData.character}
              onChange={value => handleChange('character', value)}
              placeholder="Describe your character: their appearance, personality, strengths, weaknesses..."
              maxLength={500}
              rows={4}
              onBlur={() => handleBlur('character')}
            />
            {touched.character && errors.character && (
              <p className="text-red-400 text-sm mt-2">{errors.character}</p>
            )}
          </div>

          {/* Premise text area */}
          <div>
            <TextArea
              label="Story Premise"
              value={formData.premise}
              onChange={value => handleChange('premise', value)}
              placeholder="What is the central conflict or situation? Where does the story begin? What challenges lie ahead?"
              maxLength={1000}
              rows={5}
              onBlur={() => handleBlur('premise')}
            />
            {touched.premise && errors.premise && (
              <p className="text-red-400 text-sm mt-2">{errors.premise}</p>
            )}
          </div>

          {/* Goals text area */}
          <div>
            <TextArea
              label="Character Goals"
              value={formData.goals}
              onChange={value => handleChange('goals', value)}
              placeholder="What does your character want to achieve? What drives them forward?"
              maxLength={500}
              rows={4}
              onBlur={() => handleBlur('goals')}
            />
            {touched.goals && errors.goals && (
              <p className="text-red-400 text-sm mt-2">{errors.goals}</p>
            )}
          </div>

          {/* Submit button */}
          <div className="pt-4">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || state.isTransitioning}
              className="w-full"
            >
              {isSubmitting ? 'Weaving the tale...' : 'Begin Story'}
            </Button>
            {errors.submit && (
              <p className="text-red-400 text-sm mt-3 text-center">{errors.submit}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
