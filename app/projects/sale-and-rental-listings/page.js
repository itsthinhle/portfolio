import Projects from '@/components/pages/projects/projects'
import ContentSection from '@/components/sections/content'
import Head from 'next/head'
import React from 'react'

const pageTitle = 'Project: Sale and Rental Listings | Thinh writes bugs'
const pageDescription = 'Search for sale and rental listings across the US, integrating interactive data visualizations to analyze trends and insights in the housing market.'

export const metadata = {
  title: pageTitle,
  description: pageDescription
}

export default function Home() {
  return <>
    <Head>
      <meta property="og:title" content={pageTitle} />
      <meta
        property="og:description"
        content={pageDescription}
      />
      <meta property="og:image" content="<generated>" />
      <meta property="og:image:alt" content="Projects page" />
      <meta property="og:image:type" content="<generated>" />
      <meta property="og:image:width" content="<generated>" />
      <meta property="og:image:height" content="<generated>" />
    </Head>
    <ContentSection className={'container-w'}>
      a
    </ContentSection>
  </>
}
