import {HugeiconsIcon} from '@hugeicons/react'
import {Home01Icon, Mail02Icon, UserCircleIcon, WorkflowCircle06Icon} from '@hugeicons-pro/core-stroke-rounded'

export const homePage = {
  path: '/',
  title: 'Home',
  description: 'Welcome!',
  icon: <HugeiconsIcon icon={Home01Icon} />
}

export const aboutMePage = {
  path: '/about-me',
  title: 'About me',
  description: 'About me - Thinhwritesbugs.',
  icon: <HugeiconsIcon icon={UserCircleIcon} />
}

export const projectsPage = {
  path: '/projects',
  title: 'Projects',
  description: 'My projects.',
  icon: <HugeiconsIcon icon={WorkflowCircle06Icon} />
}

export const saleAndRentalListingsProjectPage = {
  path: '/projects/sale-and-rental-listings',
  title: 'Sale and rental listings',
  description: 'Search for sale and rental listings across the US, integrating interactive data visualizations to analyze trends and insights in the housing market.'
}

export const contactMePage = {
  path: '/contact-me',
  title: 'Contact me',
  description: 'Contact me.',
  icon: <HugeiconsIcon icon={Mail02Icon} />
}
