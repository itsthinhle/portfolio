export const getExtensionFromUrl = (_url) => {
  try {
    const pathname = new URL(_url).pathname
    const filename = pathname.split('/').pop()

    if (!filename || !filename.includes('.')) {
      return undefined
    }

    return filename.split('.').pop()
  } catch {
    return undefined
  }
}