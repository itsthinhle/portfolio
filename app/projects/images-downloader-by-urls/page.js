import BlogPostLayout from '@/components/layouts/blog-post'
import Head from 'next/head'
import React from 'react'
import Form from '@/app/projects/images-downloader-by-urls/components/form'

const pageTitle = 'Images downloader by URLs'
const pageDescription = 'Download your favorite images on the internet by URLs.'

export const metadata = {
  title: pageTitle,
  description: pageDescription
}

export default async function ImagesDownloaderByUrls() {
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
      creation_date={'2026-08-29'}
      title={pageTitle}>
      <section className={'container-layout'}>
        <Form />
      </section>
    </BlogPostLayout>
  </>
}
