// The React app for Approach C (React). This is the part a React merchant would
// drop into their own codebase.
//
// Passing children to <CioAutocomplete> replaces its default parts. Here we swap in our own
// search input and keep the library's results dropdown. See ./overrides/ for the override.
import { AutocompleteResults, CioAutocomplete } from '@constructor-io/constructorio-ui-autocomplete';
import CustomSearchInput from './overrides/CustomSearchInput';

export default function Autocomplete({ options }) {
  return (
    <CioAutocomplete {...options}>
      <CustomSearchInput />
      <AutocompleteResults />
    </CioAutocomplete>
  );
}
