/**
 * Inline script to prevent FOUC (Flash of Unstyled Content).
 * Runs before React hydration to apply theme class immediately.
 * Must be placed in <head> or at the very start of <body>.
 */
export function ThemeScript() {
  const script = `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    var resolved = stored === 'light' ? 'light' : 'light';
    localStorage.setItem('theme', 'light');
    document.documentElement.classList.remove('light','dark');
    document.documentElement.classList.add(resolved);
  } catch (e) {}
})();
`;
  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}
