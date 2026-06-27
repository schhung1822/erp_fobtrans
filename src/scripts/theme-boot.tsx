/**
 * Kept as a compatibility no-op. Preference hydration now happens in
 * PreferencesStoreProvider so React/Next 16 never renders a script tag from
 * the component tree during development.
 */
export function ThemeBootScript() {
  return null;
}
