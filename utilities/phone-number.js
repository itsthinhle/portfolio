export const formatPhoneNumber = (_phoneNumberString) => {
  // Filter only numbers from the input
  const cleaned = ('' + _phoneNumberString).replace(/\D/g, '')

  // Check if the input is of correct length
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)

  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3]
  }

  return null
}