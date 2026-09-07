import HorizontalContentCard from '@/components/cards/horizontal-content'
import React from 'react'
import {getAppBlogCards} from "@/databases/neon/queries/app-cards";

export default async function Blogs() {
  const blogs = await getAppBlogCards()

  return <div className={'grid grid-cols-1 xl:grid-cols-2 gap-x-8 gap-y-16'}>
    {blogs.map((_project, _index) => {
      return (
        <HorizontalContentCard
          key={_index}
          path={_project.path}
          creation_date={_project.creation_date}
          cover_image_path={_project.cover_image_path}
          title={_project.title}
          description={_project.description}
          tags={_project.tags} />
      )
    })}
  </div>
}