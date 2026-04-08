import Form from '@/app/projects/html-content-extractor/components/form'
import BlogPostLayout from '@/components/layouts/blog-post'
import Head from 'next/head'
import React from 'react'

const pageTitle = 'HTML content extractor'
const pageDescription = 'Extracts text nodes from a HTML content.'

export const metadata = {
  title: pageTitle,
  description: pageDescription
}

export default async function WebScrapingTextsPage() {
  return <>
    <Head>
      <meta property="og:title" content={pageTitle} />
      <meta
        property="og:description"
        content={pageDescription}
      />
      <meta property="og:image" content="<generated>" />
      <meta property="og:image:alt" content="Index page" />
      <meta property="og:image:type" content="<generated>" />
      <meta property="og:image:width" content="<generated>" />
      <meta property="og:image:height" content="<generated>" />
    </Head>
    <BlogPostLayout
      creation_date={'2026-04-08'}
      title={pageTitle}>
      <section className={'container-layout'}>
        <Form />
      </section>
    </BlogPostLayout>
  </>
}
