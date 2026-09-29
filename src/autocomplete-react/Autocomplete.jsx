// The React app for Approach C (React). This is the part a React merchant would
// drop into their own codebase: it's just Constructor's <CioAutocomplete> component.
import { CioAutocomplete } from '@constructor-io/constructorio-ui-autocomplete';

export default function Autocomplete({ options }) {
  return <CioAutocomplete {...options} />;
}
