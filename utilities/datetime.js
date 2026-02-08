export const toLongDate = (_date) => {
  // The first parameter undefined lets the browser detect the user's
  // current locale.
  const date = typeof _date === 'string'
    ? new Date(_date)
    : _date
    
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeZone: 'UTC'
  }).format(date)
}