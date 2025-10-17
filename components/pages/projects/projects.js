import BlogCard from '@/components/blog-card'
import {getProjects} from '@/db/neon/database'
import React from 'react'

export default async function Projects() {
  const projects = await getProjects()

  return <section className={'pt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16'}>
    {projects.map((_project, _index) => {
      return (
        <BlogCard
          key={_index}
          path={_project.path}
          creation_date={_project.creation_date}
          cover_image_path={_project.cover_image_path}
          title={_project.title}
          description={_project.description}
          tags={_project.tags} />
      )
    })}
  </section>
}