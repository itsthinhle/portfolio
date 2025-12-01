import BlogPostLayout from '@/components/layouts/blog-post'
import InlineTextLink from '@/components/links/inline-text'
import {cryptocurrencyInvestmentBlog} from '@/constants/navigation-items'
import {getAppCardCreationDateAndTitleByPath} from '@/apis/databases/neon'
import Head from 'next/head'
import React from 'react'

const pageTitle = 'Project: Sale and Rental Listings | Thinh writes bugs'
const pageDescription = 'Search for sale and rental listings across the US, integrating interactive data visualizations to analyze trends and insights in the housing market.'

export const metadata = {
  title: pageTitle,
  description: pageDescription
}

export default async function CryptocurrencyInvestmentPage() {
  const metadata = (await getAppCardCreationDateAndTitleByPath(
    cryptocurrencyInvestmentBlog.path))[0]

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
      creation_date={metadata.creation_date}
      title={metadata.title}>
      
    </BlogPostLayout>
  </>
}
