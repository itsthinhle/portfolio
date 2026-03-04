export const hasExactMatchOption = (_collection, _inputValue) => {
  return _collection
    // Used filter() but not has() because we need to check case-insensitive
    .filter(_option => _option.toLowerCase() === _inputValue.toLowerCase())
    .size > 0
}