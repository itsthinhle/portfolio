import React from 'react'

export default function HeroSectionSubHeadingText({
  className, children
}) {
  return <p className={`${className} text-lg sm:text-xl lg:text-2xl leading-8 font-medium text-pretty text-gray-500 dark:text-gray-400`}>
    {children}
  </p>
}
