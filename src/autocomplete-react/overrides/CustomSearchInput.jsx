// Component override example: replaces the library's search input with our own markup.
//
// `<SearchInput>` takes a render function as its child. The library passes in prop getters
// (`getFormProps`, `getInputProps`, …); spreading them onto our elements keeps everything the
// library does for us: query state, keyboard navigation, submit handling and tracking.
import { SearchInput } from '@constructor-io/constructorio-ui-autocomplete';

export default function CustomSearchInput() {
  return (
    <SearchInput>
      {({ getFormProps, getInputProps, getLabelProps, setQuery }) => {
        const inputProps = getInputProps();

        return (
          <form {...getFormProps()} className="cio-form cio-custom-input">
            {/* Our own search icon, on the left instead of the library's submit button on the right. */}
            <svg className="cio-custom-input__icon" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="m13 13 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>

            <label {...getLabelProps()} className="cio-custom-input__label">
              <input {...inputProps} enterKeyHint="search" />
            </label>

            {/* A text "Clear" button instead of the library's × icon. */}
            {inputProps.value && (
              <button type="button" className="cio-custom-input__clear" onClick={() => setQuery('')}>
                Clear
              </button>
            )}
          </form>
        );
      }}
    </SearchInput>
  );
}
