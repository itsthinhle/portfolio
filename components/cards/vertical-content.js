import Badge from '@/components/badge'
import NormalText from '@/components/texts/normal'
import {toLongDate} from '@/utilities/datetime'
import clsx from 'clsx'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

export default function VerticalContentCard({
  path,
  creation_date,
  cover_image_path,
  title,
  description,
  tags,
}) {
  return <article className={'flex flex-col'}>
    <Link
      aria-label={`Cover image link of ${title} content`}
      className={'mb-8'}
      href={path}>
      <Image
        src={cover_image_path}
        width={607}
        height={341.17}
        className={'aspect-video sm:aspect-2/1 lg:aspect-3/2 object-cover rounded-2xl'}
        alt={`Cover image of the ${title} content`}
      />
    </Link>
    <time
      dateTime={creation_date}
      className={'text-xs lg:text-sm mb-3 text-gray-500 dark:text-gray-400/75'}>
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

    <NormalText className={'line-clamp-3 text-sm lg:text-base leading-6 mb-8'}>
      {description}
    </NormalText>
    <div className={'flex gap-2 items-center'}>
      {tags.split('; ').map((_tag, _index) => {
        return (
          <Badge
            key={_index}>
            {_tag}
          </Badge>
        )
      })}
    </div>
  </article>
}
