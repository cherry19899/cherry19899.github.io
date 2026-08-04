/**
 * Inline loading indicator for buttons.
 *
 * Replaces the ⏳ emoji that was used for this: emoji render at a different size
 * and style on every Android build, don't scale with the text, and read as
 * content rather than as a control state. `border-current` inherits the
 * button's text colour, so one component works on every button in the app.
 */
export default function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin align-[-2px] ${className}`}
    />
  );
}
