import ContentSection from '@/components/sections/content'

import React from 'react'

export default function BlogPostLayoutSkeleton() {
  return <ContentSection className={'animate-pulse'}>
    <div className={'container-layout'}>
      {/* Creation date */}
      <div className={'h-5.25 lg:h-6 bg-light-skeleton dark:bg-dark-skeleton max-w-34.5 lg:max-w-38.75 rounded-full mb-2'}></div>
      {/* Title */}
      <div className={'h-12 lg:h-15 bg-light-skeleton dark:bg-dark-skeleton max-w-1/2 rounded-2xl mb-10'}></div>
    </div>
    {/* Contents */}
    <div className={'container-layout'}>
      <div className={'w-9/10 h-5.25 lg:h-6 my-2 bg-light-skeleton dark:bg-dark-skeleton rounded-full'}></div>
      <div className={'w-full h-5.25 lg:h-6 my-2 bg-light-skeleton dark:bg-dark-skeleton rounded-full'}></div>
      <div className={'w-4/5 h-5.25 lg:h-6 my-2 bg-light-skeleton dark:bg-dark-skeleton rounded-full'}></div>
    </div>
  </ContentSection>
}
