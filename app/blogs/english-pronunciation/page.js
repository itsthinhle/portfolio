import IpaSymbol from '@/app/blogs/english-pronunciation/components/ipa-symbol'
import {monophthongRows, monophthongs} from '@/app/blogs/english-pronunciation/constants/ipa-symbols'
import BlogPostLayout from '@/components/layouts/blog-post'
import clsx from 'clsx'
import Head from 'next/head'
import React from 'react'

const pageTitle = 'Blog: English Pronunciation'
const pageDescription = 'My notes of learning speaking American English.'

export const metadata = {
  title: pageTitle,
  description: pageDescription
}

export default async function EnglishPronunciationPage() {
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
      creation_date={'2026-03-29'}
      title={'English Pronunciation'}>
      <section className={'container-layout text-center'}>
        {/* Vowels */}
        <div className={clsx(
          'inline-flex items-center gap-2',
        )}>
          <div
            className={clsx(
              'self-stretch flex items-center',
              'px-2 border border-light-boundary dark:border-dark-boundary'
            )}>
            {/* Make the text vertical and read from bottom to top */}
            <p className={'[writing-mode:vertical-rl] [text-orientation:mixed] rotate-180'}>Vowels</p>
          </div>
          <table className="border-collapse border border-light-boundary dark:border-dark-boundary">
            <tbody>
              {monophthongRows.map((_row, _monophthongRowIndex) => (
                <tr key={`monophthong-row-${_monophthongRowIndex}`}>
                  {_row.map((_monophthong, _monophthongIndex) => (
                    <td
                      key={`_monophthong-${_monophthongIndex}`}
                      className="border border-light-boundary dark:border-dark-boundary">
                      <IpaSymbol
                        symbol={_monophthong.symbol}
                        representativeWordElement={_monophthong.representativeWordElement}
                        audioPath={_monophthong.audioPath}
                        className={_monophthong.className}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Consonants */}
      </section>
    </BlogPostLayout>
  </>
}
