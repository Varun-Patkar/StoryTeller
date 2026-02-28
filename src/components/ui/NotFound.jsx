import { useNavigate } from 'react-router-dom';
import Button from '@/components/common/Button';

/**
 * NotFound: 404 error page with mystical theming
 * 
 * Displays when user navigates to invalid route or non-existent story slug.
 * Provides clear messaging and navigation back to dashboard.
 * 
 * Use cases:
 * - Invalid URL paths (e.g., /unknown-route)
 * - Non-existent story slugs (e.g., /story/invalid-slug-123)
 * - Malformed URLs with special characters
 * 
 * @returns {JSX.Element} 404 error page UI
 */
export default function NotFound() {
  const navigate = useNavigate();

  /**
   * Navigates user back to dashboard
   * 
   * @returns {void}
   */
  const handleReturnToDashboard = () => {
    navigate('/dashboard');
  };

  /**
   * Navigates user back to home (boot sequence)
   * 
   * @returns {void}
   */
  const handleReturnHome = () => {
    navigate('/');
  };

  return (
    <section className="w-full h-full flex items-center justify-center pointer-events-auto">
      <div className="w-full max-w-2xl mx-auto px-6 py-12 text-center rounded-2xl bg-black/40 border border-purple-500/50 backdrop-blur-sm">
        {/* Mystical icon */}
        <div className="mb-6">
          <span className="text-6xl">🌀</span>
        </div>

        {/* Main heading */}
        <h1 className="text-3xl md:text-4xl text-purple-200 font-bold mb-4">
          Tale Lost to the Void
        </h1>

        {/* Description */}
        <p className="text-lg text-gray-300 mb-3">
          The path you seek has faded from the tapestry of fate.
        </p>

        <p className="text-base text-gray-400 mb-8">
          This story does not exist, or the portal has shifted.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            variant="primary"
            onClick={handleReturnToDashboard}
          >
            Return to Archives
          </Button>

          <Button
            variant="secondary"
            onClick={handleReturnHome}
          >
            Begin Anew
          </Button>
        </div>

        {/* Technical detail (subtle) */}
        <p className="mt-8 text-sm text-gray-500">
          Error 404: Resource Not Found
        </p>
      </div>
    </section>
  );
}
