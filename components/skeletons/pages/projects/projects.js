import React from 'react'

/* Update the number of projects when you add more */
export default function ProjectsSkeleton() {
  const generateBlogCards = () => {
    let numberOfProjects = 1
    const cards = []
    const tagDiv = <div className={'h-7 lg:h-8 bg-light-skeleton dark:bg-dark-skeleton rounded-full grow'}></div>

    while (numberOfProjects > 0) {
      cards.push(<article
        key={numberOfProjects}
        className={'flex flex-col animate-pulse'}>
        {/* Cover image */}
        <div
          className={'aspect-video sm:aspect-2/1 lg:aspect-3/2 object-cover rounded-2xl bg-light-skeleton dark:bg-dark-skeleton mb-8'}>
        </div>
        {/* Creation date */}
        <div className={'w-1/4 h-3 lg:h-4 bg-light-skeleton dark:bg-dark-skeleton rounded-full mb-3'}></div>
        {/* Title */}
        <div className={'w-1/2 h-6 bg-light-skeleton dark:bg-dark-skeleton rounded-full mb-5'}></div>
        {/* Description */}
        <div className={'mb-8'}>
          <div className={'w-9/10 h-4 lg:h-4.5 my-2 bg-light-skeleton dark:bg-dark-skeleton rounded-full'}></div>
          <div className={'w-full h-4 lg:h-4.5 my-2 bg-light-skeleton dark:bg-dark-skeleton rounded-full'}></div>
          <div className={'w-4/5 h-4 lg:h-4.5 my-2 bg-light-skeleton dark:bg-dark-skeleton rounded-full'}></div>
        </div>
        {/* Tags */}
        <div className={'flex gap-2 items-center'}>
          {tagDiv}
          {tagDiv}
          {tagDiv}
          {tagDiv}
        </div>
      </article>)
      numberOfProjects -= 1
    }

    return cards
  }

  return <div className={'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16'}>
    {generateBlogCards()}
  </div>
}
