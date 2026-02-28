import { useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';

/**
 * useDocumentTitle: Custom hook to update document title based on route
 * 
 * Updates browser tab title dynamically as user navigates through the app.
 * Improves SEO and provides clear context in browser tabs.
 * 
 * Title patterns:
 * - /: "StoryTeller - AI-Powered Interactive Stories"
 * - /dashboard: "Dashboard - StoryTeller"
 * - /new: "Create Story - StoryTeller"
 * - /story/:slug: "{StoryTitle} - StoryTeller"
 * - Other: "StoryTeller"
 * 
 * @param {Object} options - Configuration options
 * @param {string} [options.storyTitle] - Current story title (for story pages)
 * @param {string} [options.baseTitle='StoryTeller'] - Base app title
 * @returns {void}
 */
export function useDocumentTitle({ storyTitle, baseTitle = 'StoryTeller' } = {}) {
  const location = useLocation();
  const { slug } = useParams();

  useEffect(() => {
    const pathname = location.pathname;
    let title = baseTitle;

    // Determine title based on route
    if (pathname === '/') {
      title = `${baseTitle } - AI-Powered Interactive Stories`;
    } else if (pathname === '/dashboard') {
      title = `Dashboard - ${baseTitle}`;
    } else if (pathname === '/new') {
      title = `Create Story - ${baseTitle}`;
    } else if (pathname.startsWith('/story/') && storyTitle) {
      title = `${storyTitle} - ${baseTitle}`;
    } else if (pathname.startsWith('/story/') && slug) {
      // Fallback: Use slug if story title not provided
      const readableTitle = slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      title = `${readableTitle} - ${baseTitle}`;
    }

    // Update document title
    document.title = title;

    // Optional: Update meta description based on route
    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) {
      let description = 'Create AI-powered interactive stories with cinematic 3D transitions.';
      
      if (pathname.startsWith('/story/')) {
        description = `Read "${storyTitle || slug}" - An interactive AI-generated story on StoryTeller.`;
      } else if (pathname === '/dashboard') {
        description = 'Manage your AI-generated stories. Resume reading or create new tales.';
      } else if (pathname === '/new') {
        description = 'Create a new AI-powered interactive story. Choose your character, premise, and goals.';
      }
      
      descriptionMeta.setAttribute('content', description);
    }
  }, [location.pathname, storyTitle, slug, baseTitle]);
}

/**
 * useMetaTags: Custom hook to update meta tags for SEO and social sharing
 * 
 * Updates Open Graph and Twitter Card meta tags for better social media previews.
 * 
 * @param {Object} options - Meta tag configuration
 * @param {string} [options.title] - Page title
 * @param {string} [options.description] - Page description
 * @param {string} [options.image] - Preview image URL
 * @param {string} [options.url] - Canonical URL
 * @returns {void}
 */
export function useMetaTags({ title, description, image, url } = {}) {
  useEffect(() => {
    // Update Open Graph meta tags
    const updateMetaTag = (property, content) => {
      if (!content) return;
      
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Update Twitter Card meta tags
    const updateTwitterTag = (name, content) => {
      if (!content) return;
      
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Open Graph tags
    if (title) updateMetaTag('og:title', title);
    if (description) updateMetaTag('og:description', description);
    if (image) updateMetaTag('og:image', image);
    if (url) updateMetaTag('og:url', url);
    updateMetaTag('og:type', 'website');

    // Twitter Card tags
    updateTwitterTag('twitter:card', 'summary_large_image');
    if (title) updateTwitterTag('twitter:title', title);
    if (description) updateTwitterTag('twitter:description', description);
    if (image) updateTwitterTag('twitter:image', image);
  }, [title, description, image, url]);
}
