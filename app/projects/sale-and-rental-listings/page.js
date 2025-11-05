import BlogPostLayout from '@/components/layouts/blog-post'
import InlineTextLink from '@/components/links/inline-text'
import {saleAndRentalListingsProject} from '@/constants/navigation-items'
import {getAppCardCreationDateAndTitleByPath} from '@/db/neon/database'
import Head from 'next/head'
import React from 'react'

const pageTitle = 'Project: Sale and Rental Listings | Thinh writes bugs'
const pageDescription = 'Search for sale and rental listings across the US, integrating interactive data visualizations to analyze trends and insights in the housing market.'

export const metadata = {
  title: pageTitle,
  description: pageDescription
}

export default async function SaleAndRentalListingsPage() {
  const metadata = (await getAppCardCreationDateAndTitleByPath(
    saleAndRentalListingsProject.path))[0]
  
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
      <section className={'container-layout'}>
        <p className={'mb-8'}>
          This project searches for rental and sale listings in the US. As API key usage
          is limited (50 times), please create your own account on the <InlineTextLink
            target="_blank"
            className={'font-semibold'}
            href={'https://app.rentcast.io/app'}>
            RentCast
          </InlineTextLink> website and generate an API key then paste it in the search
          panel below.
        </p>
        <p className={'mb-8'}>
          Demo video: <InlineTextLink
            target="_blank"
            className={'font-semibold'}
            href={'https://youtu.be/U_ToOJHbHPE?si=n3P6aiHOm9-SN5r3'}>
            https://youtu.be/U_ToOJHbHPE?si=n3P6aiHOm9-SN5r3
          </InlineTextLink>.
        </p>
        <p className={'mb-2'}>
          Notes:
        </p>
        <ul className="list-disc list-outside pl-4">
          <li>I won&#39;t store your API key,
            just use it to fetch data from RentCast API.</li>
          <li>The default data is sale data in New York city in New York state
            (last update 07/20/2025).</li>
          <li>The first load may be slow due to the free backend host.</li>
        </ul>
      </section>
    </BlogPostLayout>
  </>
}
