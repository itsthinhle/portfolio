const page = [
  {
    id: '29681354-c0d9-4bc7-ab5b-0a56bf9a4495',
    title: 'Home',
    path: '/',
    type: 'page',
    description: `Page title: Home page.
Purpose: Main entry page of the website.
Description: This page introduces the website and gives visitors a quick overview of its purpose. Visitors can discover available projects, learn about the author, and navigate to different sections of the site.
Tags: home page, home, entry point.`,
    answer: 'is the main entry point of the website.'
  },
  {
    id: 'cd7bfe6a-fab3-4c3f-a1a1-170d8daf0b45',
    title: 'About me',
    path: '/about-me',
    type: 'page',
    description: `Page title: About me.
Purpose: Introduce the website author.
Description: This page provides background information about the author of the website. Visitors can learn about the author's technical skills, achievements, experience in software development, and long term career goals.`,
    answer: 'will help you know more about the background of the author of this website.'
  },
  {
    id: '3c4a0dd3-f11a-4898-91bb-1d8a23447090',
    title: 'Projects',
    path: '/projects',
    type: 'page',
    description: `Page title: Projects.
Purpose: Showcase software projects created by the author.
Description: This page lists programming projects built by the author. Some projects are open source tools that are free for the community. Others are small utilities designed to support development work and software engineering tasks.`,
    answer: 'showcases all projects created by the author'
  },
  {
    id: '7b760c3e-fd03-40b5-9ef2-302aff24c0db',
    title: 'Sale and Rental Listings (USA)',
    path: '/projects/sale-and-rental-listings',
    type: 'project',
    description: `Page title: Sale and Rental Listings (USA).
Purpose: Provide a free tool for searching for housing listings
Project name: Sale and Rental Listings (USA).
Description: This project helps users search for homes and apartments available for sale or rent across the United States. It integrates interactive maps to display housing information. Users can explore property listings and understand real estate market patterns.`,
    answer: 'helps users search for housing listings across the United States via Google Map.'
  },
  {
    id: '413dff6d-ba5b-4a95-8a16-9781316c7ec4',
    title: 'Cryptocurrency Investment',
    path: '/blogs/cryptocurrency-investment',
    type: 'blog',
    description: `Page title: Cryptocurrency Investment.
Purpose: Provide knowledge in cryptocurrency investment
Blog name: Cryptocurrency Investment.
Description: This blog post shares the author's personal journey of learning how to invest in cryptocurrency. It discusses the basics of crypto investing, lessons learned while exploring the market, and the author's experience starting from zero knowledge.`,
    answer: 'describes the author\'s journey of learning how to invest in cryptocurrency from scratch.'
  },
  {
    id: '7c0eec44-b60a-4b1b-b19c-ec610af24f97',
    title: 'Contact me',
    path: '/contact-me',
    type: 'page',
    description: `Page title: Contact me.
Purpose: Allow visitors to communicate with the website author.
Description: This page allows users to send a message or email to the author.
Visitors can reach out for questions, collaboration opportunities, feedback, or professional inquiries.`,
    answer: 'allows visitors to get in touch with the author of the website.'
  }
]

const faq = [
  {
    id: 'de9c77d1-7cc3-4ce2-b213-b8f2e062670b',
    type: 'faq',
    question: 'Can I create an account on this website? How do I register or login?',
    answer: 'Account creation and login are still under development. For now, you can explore the site and maybe drink a coffee while waiting ☕.'
  }
]

module.exports = {
  page,
  faq
}