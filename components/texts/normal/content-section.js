import React from 'react'

export default function ContentSectionNormalText({
  className, children
}) {
  return <p className={`${className} leading-7 text-gray-600 dark:text-gray-400`}>
    {children}
  </p>
}
