// Re-exported from the shared context (see SiteSectionsProvider) so
// every consumer reads the same single fetch instead of each firing its
// own — keeps this import path stable for existing call sites.
export { useSiteSections } from "../context/SiteSectionsContext";
