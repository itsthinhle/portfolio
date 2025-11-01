import ContentSection from '@/components/sections/content'
import BlogSectionHeadingText from '@/components/texts/headings/blog-section'
import BlogSectionSubHeadingText from '@/components/texts/sub-headings/blog-section'
import Head from 'next/head'
import React from 'react'

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
      <section className={'pb-10 sm:pb-16 border-b border-gray-200 dark:border-gray-700 text-center'}>
        <BlogSectionHeadingText className={'mb-4'}>
          Blogs
        </BlogSectionHeadingText>
        <BlogSectionSubHeadingText>
          A space where I share my knowledge and the things I discover along my journey.
        </BlogSectionSubHeadingText>
      </section>
    </ContentSection>
  </>
}
