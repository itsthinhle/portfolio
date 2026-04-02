import BlogPostLayout from '@/components/layouts/blog-post'
import Head from 'next/head'
import React from 'react'

const pageTitle = 'Blog: Cryptocurrency Investment'
const pageDescription = 'My journey of learning how to invest in cryptocurrency from scratch.'

export const metadata = {
  title: pageTitle,
  description: pageDescription
}

export default async function CryptocurrencyInvestmentPage() {
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
      creation_date={'2025-11-05'}
      title={'Cryptocurrency Investment'}>
    </BlogPostLayout>
  </>
}
