import ContentSection from '@/components/sections/content'
import {projectsPage} from '@/constants/pages'
import Head from 'next/head'
import React from 'react'

export const metadata = {
  title: projectsPage.metadata.title,
  description: projectsPage.metadata.title
}

export default function Home() {
  return <>
    <Head>
      <meta property="og:title" content={projectsPage.metadata.title} />
      <meta
        property="og:description"
        content={projectsPage.metadata.description}
      />
      <meta property="og:image" content="<generated>" />
      <meta property="og:image:alt" content="Projects page" />
      <meta property="og:image:type" content="<generated>" />
      <meta property="og:image:width" content="<generated>" />
      <meta property="og:image:height" content="<generated>" />
    </Head>
    <ContentSection className={'container-w'}>
      <section
        className={'pb-10 sm:pb-16 border-b border-gray-200 dark:border-gray-700 text-center'}>
        <h1
          className={'blog-section-heading-text mb-4'}>
          Projects
        </h1>
        <p className="blog-section-sub-heading-text">
          A wide range of projects reflects my studies and personal interests.
        </p>
      </section>
      <section
        className={'py-10 sm:py-16'}>

      </section>
    </ContentSection>
  </>
}
