import Blogs from '@/components/pages/blogs'
import ContentSection from '@/components/sections/content'
import BlogsSkeleton from '@/components/skeletons/pages/blogs/blogs'
import ContentSectionHeadingText from '@/components/texts/headings/content-section'
import ContentSectionSubHeadingText from '@/components/texts/sub-headings/content-section'
import Head from 'next/head'
import React, {Suspense} from 'react'

const pageTitle = 'My blogs | Thinh writes bugs'
const pageDescription = 'A space where I share my knowledge and the things I discover along my journey.'

export default function BlogsPage() {
  return <>
    <Head>
      <meta property="og:title" content={pageTitle} />
      <meta
        property="og:description"
        content={pageDescription}
      />
      <meta property="og:image" content="<generated>" />
      <meta property="og:image:alt" content="Blogs page" />
      <meta property="og:image:type" content="<generated>" />
      <meta property="og:image:width" content="<generated>" />
      <meta property="og:image:height" content="<generated>" />
    </Head>
    <ContentSection className={'container-layout'}>
      <ContentSectionHeadingText className={'mb-2'}>
        Blogs
      </ContentSectionHeadingText>
      <ContentSectionSubHeadingText className={'mb-16 lg:mb-20'}>
        A space where I share my knowledge and the things I discover along my journey.
      </ContentSectionSubHeadingText>
      <Suspense fallback={<BlogsSkeleton />}>
        <Blogs />
      </Suspense>
    </ContentSection>
  </>
}
