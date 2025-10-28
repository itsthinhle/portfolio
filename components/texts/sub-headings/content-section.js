import React from 'react'

export default function ContentSectionSubHeadingText({
  className, children
}) {
  return <p className={`${className} leading-8 text-xl lg:text-2xl text-gray-700 dark:text-gray-300`}>
    {children}
  </p>
}
