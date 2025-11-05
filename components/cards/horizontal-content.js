import {toLongDate} from '@/utilities/datetime'
import clsx from 'clsx'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

export default function HorizontalContentCard({
  path,
  creation_date,
  cover_image_path,
  title,
  description,
  tags,
}) {
  return <article className={'flex flex-col sm:flex-row gap-8 isolate'}>
    <Link
      aria-label={`Cover image link of ${title} content`}
      className={'sm:shrink-0 w-full sm:w-65'}
      href={path}>
      <Image
        src={cover_image_path}
        width={720}
        height={480}
        className={'aspect-video sm:aspect-square object-cover rounded-2xl'}
        alt={`Cover image of the ${title} content`}
      />
    </Link>
    <section className={'flex flex-col'}>
      <time
        dateTime={creation_date}
        className={'text-xs lg:text-sm mb-3 text-gray-500 dark:text-gray-400'}>
        {toLongDate(creation_date)}
      </time>
      <Link
        aria-label={title}
        className={'mb-5'}
        href={path}>
        <h2
          className={'font-semibold text-lg lg:text-xl leading-6 hover:text-light-accent dark:hover:text-dark-accent'}>
          {title}
        </h2>
      </Link>
      <p className={'line-clamp-5 text-sm lg:text-base leading-6 text-gray-600 dark:text-gray-400 mb-8'}>
        {description}
      </p>
      <div className={'flex gap-2 items-center'}>
        {tags.split('; ').map((_tag, _index) => {
          return (
            <p
              key={_index}
              className={clsx([
                'font-medium px-3 py-1.5 rounded-full text-xs lg:text-sm',
                'bg-gray-100 dark:bg-gray-800',
              ])}>
              {_tag}
            </p>
          )
        })}
      </div>
    </section>
  </article>
}
