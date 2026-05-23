// Auto-inject bookmark buttons on report pages
import { initAuth } from './auth.js';
import { injectBookmarkButtons } from './bookmarks.js';

(async () => {
  await initAuth();
  await injectBookmarkButtons();
})();
