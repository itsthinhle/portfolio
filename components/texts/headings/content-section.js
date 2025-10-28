import BlogSectionHeadingText from '@/components/texts/headings/blog-section'
import React from 'react'

export default function ContentSectionHeadingText({
  className, children
}) {
  return <BlogSectionHeadingText className={className}>
    {children}
  </BlogSectionHeadingText>
}
