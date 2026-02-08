import ContentSection from '@/components/sections/content'
import ContentSectionHeadingText from '@/components/texts/headings/content-section'
import {toLongDate} from '@/utilities/datetime'
import React from 'react'

export default function BlogPostLayout({
  creation_date,
  title,
  containerSectionClassName,
  // mb-10 if below is normal text, mb-16 if below is a sub heading
  titleClassName,
  children
}) {
  return <ContentSection className={`${containerSectionClassName}`}>
    <section className={'container-layout mb-10'}>
      <time
        dateTime={creation_date}
        className={'font-semibold mb-2 text-gray-500 dark:text-gray-400/75'}>
        {toLongDate(creation_date)}
      </time>
      <ContentSectionHeadingText className={titleClassName}>
        {title}
      </ContentSectionHeadingText>
    </section>
    {children}
  </ContentSection>
}
