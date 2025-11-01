import ContentSection from '@/components/sections/content'

import React from 'react'

export default function BlogPostSkeleton() {
  return <ContentSection className={'animate-pulse'}>
    <section className={'container-layout'}>
      {/* Creation date */}
      <div className={'h-5.25 lg:h-6 bg-gray-200 dark:bg-gray-700 max-w-34.5 lg:max-w-38.75 rounded-full mb-2'}></div>
      {/* Title */}
      <div className={'h-12 lg:h-15 bg-gray-200 dark:bg-gray-700 max-w-1/2 rounded-2xl mb-10'}></div>
    </section>
    {/* Contents */}
    <section className={'container-layout'}>
      <div className={'h-5.25 lg:h-6 my-2 bg-gray-200 dark:bg-gray-700 w-full rounded-full'}></div>
      <div className={'h-5.25 lg:h-6 my-2 bg-gray-200 dark:bg-gray-700 w-9/10 rounded-full'}></div>
      <div className={'h-5.25 lg:h-6 my-2 bg-gray-200 dark:bg-gray-700 w-4/5 rounded-full'}></div>
    </section>
  </ContentSection>
}
