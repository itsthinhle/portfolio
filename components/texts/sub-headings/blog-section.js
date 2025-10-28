import React from 'react'

export default function BlogSectionSubHeadingText({
  className, children
}) {
  return <p className={`${className} leading-8 text-lg lg:text-xl text-gray-600 dark:text-gray-300`}>
    {children}
  </p>
}
