import ContentSection from '@/components/sections/content'
import {blogsPage} from '@/constants/pages'
import Head from 'next/head'
import React from 'react'

export const metadata = {
  title: blogsPage.metadata.title,
  description: blogsPage.metadata.title
}

export default function Home() {
  return <>
    <Head>
      <meta property="og:title" content={blogsPage.metadata.title} />
      <meta
        property="og:description"
        content={blogsPage.metadata.description}
      />
      <meta property="og:image" content="<generated>" />
      <meta property="og:image:alt" content="Blogs page" />
      <meta property="og:image:type" content="<generated>" />
      <meta property="og:image:width" content="<generated>" />
      <meta property="og:image:height" content="<generated>" />
    </Head>
    <ContentSection className={'container-w'}>
      <section
        className={'pb-10 sm:pb-16 border-b border-gray-200 dark:border-gray-700 text-center'}>
        <h1
          className={'blog-section-heading-text mb-4'}>
          Blogs
        </h1>
        <p className="blog-section-sub-heading-text">
          A space where I share my knowledge and the things I discover along my journey.
        </p>
      </section>
    </ContentSection>
  </>
}
