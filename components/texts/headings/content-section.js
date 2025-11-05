import React from 'react'

export default function ContentSectionHeadingText({
  className, children
}) {
  return <h1 className={`${className} text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-pretty`}>
    {children}
  </h1>
}
