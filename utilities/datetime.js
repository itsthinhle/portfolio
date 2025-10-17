export const toLongDate = (_date) => {
  // The first parameter undefined lets the browser detect the user's
  // current locale.
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long'
  }).format(_date)
}