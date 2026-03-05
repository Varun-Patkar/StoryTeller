import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '@/services/appState.jsx';
import { validateStorySetup, validateTitle, validateVisibility } from '@/utils/validation';
import { createStory, generatePrologue } from '@/services/mockApi';
import { ApiError, apiGet } from '@/services/apiClient';
import { getAvailableFandoms } from '@/utils/fandomTones';
import Button from '@/components/common/Button';
import Dropdown from '@/components/common/Dropdown';
import TextArea from '@/components/common/TextArea';

/**
 * StorySetup: Story creation form for defining book name, visibility, character, premise, and goals.
 *
 * Layout:
 * - Right-side panel occupying 50vw
 * - Logo at top
 * - Form fields: Book Title, Visibility toggle, Fandom dropdown, Character, Premise, Goals text areas
 * - Validation with mystical error messages
 * - "Begin Story" button to submit and transition to reading phase
 *
 * @returns {JSX.Element} StorySetup UI
 */
export default function StorySetup() {
  const { state, dispatch } = useAppState();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    visibility: 'public',
    fandom: '',
    character: '',
    premise: '',
    goals: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prologueLoading, setPrologueLoading] = useState(false);

  // Available fandoms from TOON registry
  const fandomOptions = getAvailableFandoms();

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

    try {
      const authResponse = await apiGet('/auth/me');
      const currentUser = authResponse?.user || null;

      if (!currentUser) {
        setErrors({
          submit: 'Sign in with GitHub to create and save stories. Return to Dashboard to continue.',
        });
        return;
      }
    } catch (authError) {
      if (authError instanceof ApiError && authError.status === 401) {
        setErrors({
          submit: 'You must sign in with GitHub before creating a story.',
        });
        return;
      }

      setErrors({
        submit: 'Unable to verify your session right now. Please try again.',
      });
      return;
    }

    // Mark all fields as touched
    setTouched({
      title: true,
      visibility: true,
      fandom: true,
      character: true,
      premise: true,
      goals: true,
    });

    // Validate title
    const titleValidation = validateTitle(formData.title);
    if (!titleValidation.valid) {
      setErrors(prev => ({ ...prev, title: titleValidation.message }));
      return;
    }

    // Validate visibility
    const visibilityValidation = validateVisibility(formData.visibility);
    if (!visibilityValidation.valid) {
      setErrors(prev => ({ ...prev, visibility: visibilityValidation.message }));
      return;
    }

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

    // All validation passed - generate prologue then create story
    try {
      setIsSubmitting(true);
      setErrors({});
      setPrologueLoading(true);

      // Prepare setup context with fandomId for TOON injection
      const setupContext = {
        fandomId: formData.fandom,
        character: formData.character,
        premise: formData.premise,
        goals: formData.goals,
      };

      console.log('Generating prologue with context:', setupContext);

      // Generate prologue via Ollama silently in background
      const prologue = await generatePrologue(
        state.selectedModel?.ollamaTag || 'llama3.1:8b',
        setupContext,
        () => {} // Silent generation - no UI update
      );

      console.log('Prologue generated:', prologue.substring(0, 100) + '...');
      setPrologueLoading(false);

      // Now create story with generated prologue
      const fandomLabel = fandomOptions.find(opt => opt.value === formData.fandom)?.label || formData.fandom;
      const setupPayload = {
        title: formData.title,
        visibility: formData.visibility,
        setup_context: {
          model_id: state.selectedModel?.ollamaTag || 'llama3.1:8b',
          fandom: fandomLabel,
          fandomId: formData.fandom,
          character: formData.character,
          premise: formData.premise,
          goals: formData.goals,
        },
        initial_passage: {
          content: prologue,
        },
      };

      console.log('Creating story with generated prologue...');

      // Call API to persist story with prologue to database
      const story = await createStory(setupPayload);

      console.log('Story created:', story);

      // Store story ID and navigate to story page using slug
      dispatch({ type: 'STORY_CREATED', payload: { storyId: story.id } });
      dispatch({ type: 'TRANSITION_TO_PLAYING' });
      navigate(`/story/${story.slug}`);
    } catch (error) {
      console.error('Story creation failed:', error);
      setErrors({
        submit: error.message || 'The tapestry resists weaving. Try once more.',
      });
      setPrologueLoading(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles back button click to return to Dashboard via /dashboard route.
   *
   * @returns {void}
   */
  const handleBack = () => {
    if (state.isTransitioning || isSubmitting) {
      return;
    }
    // Navigate back to dashboard with animation
    dispatch({ type: 'TRANSITION_TO_DASHBOARD' });
    navigate('/dashboard');
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
          
          {/* Book Title input */}
          <div>
            <label className="block text-sm font-semibold text-gray-100 mb-2">
              📖 Book Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              onBlur={() => handleBlur('title')}
              placeholder="Name your literary creation..."
              maxLength={80}
              className="w-full bg-black/40 border border-blue-500/30 rounded px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-400 transition"
              disabled={isSubmitting}
            />
            {touched.title && errors.title && (
              <p className="text-red-400 text-xs mt-1">{errors.title}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {formData.title.length}/80 characters
            </p>
          </div>

          {/* Visibility toggle */}
          <div>
            <label className="block text-sm font-semibold text-gray-100 mb-2">
              👁️ Story Visibility
            </label>
            <div className="flex gap-3">
              {[
                { value: 'public', label: '🌍 Public', description: 'Others can discover & fork' },
                { value: 'private', label: '🔒 Private', description: 'Only you can access' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => handleChange('visibility', option.value)}
                  className={`flex-1 p-3 rounded border-2 transition ${
                    formData.visibility === option.value
                      ? 'border-blue-400 bg-blue-900/20 text-blue-100'
                      : 'border-blue-500/30 bg-black/40 text-gray-300 hover:border-blue-400'
                  } disabled:opacity-50`}
                  disabled={isSubmitting}
                >
                  <div className="font-semibold">{option.label}</div>
                  <div className="text-xs text-gray-400">{option.description}</div>
                </button>
              ))}
            </div>
            {touched.visibility && errors.visibility && (
              <p className="text-red-400 text-xs mt-1">{errors.visibility}</p>
            )}
          </div>

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

          {/* Prologue generation happens silently in background */}

          {/* Submit button */}
          <div className="pt-4">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || state.isTransitioning || prologueLoading}
              className="w-full"
            >
              {prologueLoading ? '✨ Weaving your tale...' : 'Begin Story'}
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
