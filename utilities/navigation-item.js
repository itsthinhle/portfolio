export const isActiveNavigationItem = (
  _path,
  _navigationItemPath
) => {
  return _navigationItemPath === _path
    || (_navigationItemPath.length > 1 && _path.includes(_navigationItemPath))
}