import {getInitialListingDtos} from '@/apis/projects/sale-and-rental-listings'
import MapAndPanels from '@/app/projects/sale-and-rental-listings/map-and-panels'
import BlogPostLayout from '@/components/layouts/blog-post'
import InlineTextLink from '@/components/links/inline-text'
import Heading2 from '@/components/texts/headings/2'
import {saleAndRentalListingsProject} from '@/constants/navigation-items'
import {getAppCardCreationDateAndTitleByPath} from '@/apis/databases/neon'
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
  const initialListingDtos = await getInitialListingDtos()

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
        <Heading2>Introduction</Heading2>
        <p className={'mb-8'}>
          This project searches for rental and sale listings in the US. As API key
          usage is limited (50 times), please create an account on the{' '}
          <InlineTextLink
            target="_blank"
            className={'font-semibold'}
            href={'https://app.rentcast.io/app'}>
            RentCast
          </InlineTextLink> website and generate your own API key.
        </p>
        <p className={'mb-2'}>
          Notes:
        </p>
        <ul className="list-disc list-outside pl-8 mb-8">
          <li>This site won&#39;t store your API key, only use it to fetch data
            from RentCast API.
          </li>
          <li>The default data is sale data in New York city in New York state
            (last update 07/20/2025).
          </li>
          <li>The first load may be slow due to the free backend host.</li>
        </ul>
        <p className={'mb-8'}>
          Tutorial video:
        </p>
        <iframe className={'aspect-video max-w-5xl bg-gray-200 dark:bg-gray-700 mx-auto rounded-xl'}
          src="https://www.youtube.com/embed/U_ToOJHbHPE?si=nntelKsa0JQ0kOHV"
          title="YouTube video player" frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
        <Heading2>Map</Heading2>
        <MapAndPanels
          initialListingDtos={initialListingDtos} />
      </section>
    </BlogPostLayout>
  </>
}
