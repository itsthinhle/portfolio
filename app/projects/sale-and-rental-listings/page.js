import {getInitialListingDtos} from '@/actions/projects/sale-and-rental-listings'
import MapSection from '@/app/projects/sale-and-rental-listings/components/map-section'
import BlogPostLayout from '@/components/layouts/blog-post'
import InlineTextLink from '@/components/links/inline-text'
import Heading2 from '@/components/texts/headings/2'
import NormalText from '@/components/texts/normal'
import Head from 'next/head'
import React from 'react'

const pageTitle = 'Project: Sale and Rental Listings (USA) | Thinh writes bugs'
const pageDescription = 'Search for sale and rental listings across the US, integrating interactive data visualizations to analyze trends and insights in the housing market.'

export const metadata = {
  title: pageTitle,
  description: pageDescription
}

export default async function SaleAndRentalListingsPage() {
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
      creation_date={'2025-12-13T13:10:10.366Z'}
      title={'Sale and Rental Listings (USA)'}>
      <section className={'container-layout'}>
        <Heading2 className={'heading-2-my'}>Introduction</Heading2>
        <NormalText className={'mb-8'}>
          This project searches for rental and sale listings in the US. As API key
          usage is limited (50 times), please create an account on the{' '}
          <InlineTextLink
            target="_blank"
            className={'font-semibold'}
            href={'https://app.rentcast.io/app'}>
            RentCast
          </InlineTextLink> website and generate your own API key.
        </NormalText>
        <NormalText className={'mb-2'}>
          Notes:
        </NormalText>
        <ul className="list-disc list-outside pl-8 mb-8 text-light-normal-text dark:text-dark-normal-text">
          <li>This site won&#39;t store your API key, only use it to fetch data
            from RentCast API.
          </li>
          <li>The default data is sale data in Atlanta city in Georgia state
            (last update 02/21/2026).
          </li>
        </ul>
        <NormalText className={'mb-8'}>
          Tutorial video:
        </NormalText>
        <iframe className={'aspect-video max-w-5xl bg-light-skeleton dark:bg-dark-skeleton mx-auto rounded-xl'}
          src="https://www.youtube.com/embed/U_ToOJHbHPE?si=nntelKsa0JQ0kOHV"
          title="YouTube video player" frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
        <MapSection initialListingDtos={initialListingDtos} />
      </section>
    </BlogPostLayout>
  </>
}
