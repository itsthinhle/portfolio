import React from 'react'

export default function HeroSectionHeadingText({
  className, children
}) {
  return <h1 className={`${className} text-5xl sm:text-7xl lg:text-8xl font-semibold tracking-tight text-balance`}>
    {children}
  </h1>
}
