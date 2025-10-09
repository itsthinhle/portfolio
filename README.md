# Installation

https://nextjs.org/docs/app/getting-started/installation

## Create with the CLI

https://nextjs.org/docs/app/getting-started/installation#create-with-the-cli

```
npx create-next-app@latest
```

# Run the application

```bash
$ npm run dev
```

# NextJS

## Project structure

- `/app`: Contains all the routes, components, and logic for the application
- `/app/lib`: Contains reusable utility functions and data fetching functions.
- `/app/ui`: Contains all the UI components for your application, such as cards, tables, and forms.
- `/public`: Contains all the static assets for your application, such as images.
- Config files: Created and pre-configured when you start a new project using create-next-app.

## Custom styling

❓ What is one benefit of using CSS modules?

📝 Provide a way to make CSS classes locally scoped to components by default, reducing the risk of styling conflicts.

Example: Create a new file called `home.module.css`

```css
.shape {
  height: 0;
  width: 0;
  border-bottom: 30px solid black;
  border-left: 20px solid transparent;
  border-right: 20px solid transparent;
}
```

Usage:

```tsx
import styles from '@/app/ui/home.module.css';
 
export default function Page() {
  return <div className={styles.shape} />
}
```

## Fonts

Next.js automatically optimizes fonts in the application when you use the `next/font` module. It downloads font files at build time and hosts them with your other static assets. This means when a user visits your application, there are **no additional network requests for fonts** which would impact performance.

### Add a font

*Note: Visit the Google Fonts website to see what options are available.*

`/app/ui/fonts.ts`

```ts
import { Inter, Lusitana } from 'next/font/google';

export const inter = Inter({ subsets: ['latin'] });
```

`/app/layout.tsx`

```tsx
import '@/app/ui/global.css';
import { inter } from '@/app/ui/fonts';
 
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
```

## Images (`<Image>`)

The <Image> Component comes with automatic image optimization such as:

- Preventing layout shift automatically when images are loading.
- Resizing images to avoid shipping large images to devices with a smaller viewport.
- Lazy loading images by default (images load as they enter the viewport).
- Serving images in modern formats, like WebP and AVIF, when the browser supports it.

It's good practice to set the width and height of your images to avoid layout shift, these should be an aspect ratio identical to the source image. These values are not the size the image is rendered, but instead the size of the actual image file used to understand the aspect ratio.

Example: setting an image ratio on desktop and mobile devices:

```tsx
...
import Image from 'next/image';
 
export default function Page() {
  return (
    // ...
    <div>
      <Image
        src="/hero-desktop.png"
        width={1000}
        height={760}
        className="hidden md:block"
        alt="Screenshots of the dashboard project showing desktop version"
      />
      <Image
        src="/hero-mobile.png"
        width={560}
        height={620}
        className="block md:hidden"
        alt="Screenshot of the dashboard project showing mobile version"
      />
    </div>
    //...
  );
}
```

## Nested routes

To create a nested route, nest folders inside each other and add `pages.tsx` files inside them.

Example: `/app/dashboard/pages.tsx` is associated with the `/dashboard` path.

## Layout

In Next.js, you can use a special `layout.tsx` file to create UI that is shared between multiple pages.

One benefit of using layouts in Next.js is that on navigation, only the page components update while the layout won't re-render. This is called **partial rendering** which preserves client-side React state in the layout when transitioning between pages.

## Navigation (`<Link>`)

In Next.js, use the `<Link />` Component to link between pages in the application. `<Link>` allows **client-side navigation** with JavaScript.

Next.js automatically prefetches the code for the linked route in the background. By the time the user clicks the link, the code for the destination page will already be loaded in the background, and this is what makes the page transition near-instant!

### Active link

```tsx
...
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
 
export default function NavLinks() {
  const pathname = usePathname();
 
  return (
    <>
      {links.map((link) => {
        const LinkIcon = link.icon;
        return (
          <Link
            key={link.name}
            href={link.href}
            className={clsx(
              {
                'bg-sky-100 text-blue-600': pathname === link.href,
              },
            )}
          >
            ...
          </Link>
        );
      })}
    </>
  );
}
```

## Database

### Seed data

```tsx
import bcrypt from 'bcrypt';
import postgres from 'postgres';
import { invoices, customers, revenue, users } from '../lib/placeholder-data';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

async function seedUsers() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `;

  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      return sql`
        INSERT INTO users (id, name, email, password)
        VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
        ON CONFLICT (id) DO NOTHING;
      `;
    }),
  );

  return insertedUsers;
}
```

### Query data

```tsx
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

async function listInvoices() {
	const data = await sql`
    SELECT invoices.amount, customers.name
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE invoices.amount = 666;
  `;

	return data;
}

export async function GET() {
  try {
  	return Response.json(await listInvoices());
  } catch (error) {
  	return Response.json({ error }, { status: 500 });
  }
}
```

## Fetching data

### Database queries

There are a few cases where you have to write database queries:

- When creating your API endpoints, you need to write logic to interact with your database.
- If you are using React Server Components (fetching data on the server), you can skip the API layer, and query your database directly without risking exposing your database secrets to the client.

❓ In which of these scenarios should you not query your database directly?

📝 When you're fetching data on the client

### Using server components to fetch data

Uusing React Server Components to fetch data helps query the database directly from the server without an additional API layer.

### Using SQL

SQL is versatile, allowing you to fetch and manipulate specific data.

Two things you need to be aware of:

- The data requests are unintentionally blocking each other, creating a request waterfall.
- By default, Next.js prerenders routes to improve performance, this is called Static Rendering. So if your data changes, it won't be reflected in your dashboard.

### Parallel data fetching

In JavaScript, you can use the `Promise.all()` or `Promise.allSettled()` functions to initiate all promises at the same time.

```tsx
export async function fetchCardData() {
  try {
    const invoiceCountPromise = sql`SELECT COUNT(*) FROM invoices`;
    const customerCountPromise = sql`SELECT COUNT(*) FROM customers`;
    const invoiceStatusPromise = sql`SELECT
         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
         FROM invoices`;
 
    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);
    // ...
  }
}
```

❓ In parallel data fetching, what happens if one data request is slower than all the others?

## Static rendering

With static rendering, data fetching and rendering happens on the server **at build time** (when you deploy) or when revalidating data. However, static rendering might **not** be a good fit for a dashboard app because the application will not reflect the latest data changes.

❓ What kind of information is typically only known at request time?

📝 Cookies and URL search params

## Dynamic rendering

With dynamic rendering, content is rendered on the server for each user at request time (when the user visits the page).

## Routes

### Route groups

https://nextjs.org/docs/app/api-reference/file-conventions/route-groups

A route group can be created by wrapping a folder's name in parenthesis: `(folderName)`.

This convention indicates the folder is for **organizational purposes** and should **not be included** in the route's URL path.

### Dynamic routes

Next.js allows you to create Dynamic Route Segments when you don't know the exact segment name and want to create routes based on data. This could be blog post titles, product pages, etc. You can create dynamic route segments by wrapping a folder's name in square brackets. For example, `[id]`, `[post]` or `[slug]`.

## Streaming

Streaming is a data transfer technique that allows you to break down a route into smaller "chunks", **prevent slow data requests from blocking your whole page**.

There are two ways you implement streaming in Next.js:

- At the page level, with the loading.tsx file (which creates `<Suspense>` for you).
- At the component level, with `<Suspense>` for more granular control.

### Adding loading skeletons

A loading skeleton is a simplified version of the UI. Many websites use them as a placeholder (or fallback) to indicate to users that the content is loading. Any UI you add in `loading.tsx` will be embedded as part of the static file, and sent first. Then, the rest of the dynamic content will be **streamed from the server to the client**.


### Streaming a component

Stream specific components using React **Suspense**.

Example:

Delete all instances of fetchRevenue() and its data from the parent component (`/dashboard/(overview)/pages.tsx`):

```tsx
...
import { fetchLatestInvoices, fetchCardData } from '@/app/lib/data'; // remove fetchRevenue
 
export default async function Page() {
  // const revenue = await fetchRevenue() // delete this line
  ...
 
  return (
    // ...
  );
}
```

Then, import `<Suspense>` from React, and wrap it around `<RevenueChart />`. You can pass it a fallback component called `<RevenueChartSkeleton>`.

```tsx
...
import { Suspense } from 'react';
import { RevenueChartSkeleton } from '@/app/ui/skeletons';
 
export default async function Page() {
  ...
 
  return (
    <main>
      ...
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8">
        <Suspense fallback={<RevenueChartSkeleton />}>
          <RevenueChart />
        </Suspense>
        ...
      </div>
    </main>
  );
}
```

Finally, update the <RevenueChart> component to fetch **its own data** and remove the prop passed to it:

```tsx
...
import { fetchRevenue } from '@/app/lib/data';
 
// ...
 
export default async function RevenueChart() { // Make component async, remove the props
  const revenue = await fetchRevenue(); // Fetch data inside the component
 
  ...
 
  return (
    // ...
  );
}
```

### Streaming a group of components

Create a wrapper component to group all the child components inside. Then place the wrapper component inside the `<Suspense` component

You can use this pattern when you want multiple components to load in at the same time.

Example:

In parent component:

```tsx
import CardWrapper from '@/app/ui/dashboard/cards';
// ...
import {
  CardsSkeleton,
} from '@/app/ui/skeletons';
 
export default async function Page() {
  return (
    <main>
      ...
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Suspense fallback={<CardsSkeleton />}>
          <CardWrapper />
        </Suspense>
      </div>
      ...
    </main>
  );
}
```

In the wrapper component:

```tsx
// ...
import { fetchCardData } from '@/app/lib/data';
 
// ...
 
export default async function CardWrapper() {
  const {
    numberOfInvoices,
    numberOfCustomers,
    totalPaidInvoices,
    totalPendingInvoices,
  } = await fetchCardData();
 
  return (
    <>
      <Card title="Collected" value={totalPaidInvoices} type="collected" />
      <Card title="Pending" value={totalPendingInvoices} type="pending" />
      <Card title="Total Invoices" value={numberOfInvoices} type="invoices" />
      <Card
        title="Total Customers"
        value={numberOfCustomers}
        type="customers"
      />
    </>
  );
}
```

❓ In general, what is considered good practice when working with Suspense and data fetching?

📝 Move data fetches down to the components that need it.

## Partial Prerendering (experimental)

Combine static rendering, dynamic rendering, and streaming in the same route with Partial Prerendering (PPR).

(To be updated)

## Search

Your search functionality will span the client and the server. When a user searches for information on the client, the URL params will be updated, data will be fetched on the server, and the table will re-render on the server with the new data.

**Why use URL search params?**

- **Bookmarkable and shareable URLs**: Bookmark the current search queries and filters, for future reference or sharing.
- **Server-side rendering**: URL parameters can be directly consumed on the server to render the initial state.

These are the Next.js client hooks that you'll use to implement the search functionality:

- `useSearchParams`: Allows you to access the **search parameters** of the current URL. For example, the search params for this URL `/dashboard/invoices?page=1&query=pending` would look like this: `{page: '1', query: 'pending'}`.
- `usePathname`: Lets you read the current URL's **pathname**. For example, for the route `/dashboard/invoices`, usePathname would return '`/dashboard/invoices`'.
- `useRouter`: Enables **navigation between routes** within client components programmatically. There are multiple methods you can use.

Example:

```tsx
'use client';
...
import { useSearchParams, usePathname, useRouter } from 'next/navigation';

export default function Search({ placeholder }: { placeholder: string }) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    function handleSearch(term: string) {
        const params = new URLSearchParams(searchParams);

        if (term) {
            params.set('query', term);
        } else {
            params.delete('query');
        }
        // The URL is updated without reloading the page
        replace(`${pathname}?${params.toString()}`);
        console.log(params);
    }

    return (
      <div className="relative flex flex-1 flex-shrink-0">
        ...
        <input
          className="..."
          placeholder={placeholder}
          onChange={(e) => {
              handleSearch(e.target.value);
          }}
          // ensure the input field is in sync with the URL and will be populated when sharing
          defaultValue={searchParams.get('query')?.toString()}
        />
        ...
      </div>
  );
}
```

### Debouncing (delay key press)

❓ Type "Delba" into the search bar and check the console in dev tools. What is happening?

```bash
Searching... D
Searching... De
Searching... Del
Searching... Delb
Searching... Delba
```

📝 It's updating the URL and querying the database on every keystroke!

**Debouncing** is a programming practice that **limits the rate** at which a function can fire. In our case, you only want to query the database when the user has stopped typing.

```bash
pnpm i use-debounce
```

Example: This function will wrap the contents of handleSearch, and only run the code after a specific time once the user has stopped typing (300ms).

```tsx
// ...
import { useDebouncedCallback } from 'use-debounce';
 
// Inside the Search Component...
const handleSearch = useDebouncedCallback((term) => {
  console.log(`Searching... ${term}`); 
  ...
}, 300);
```

## Form

In React, you can use the `action` attribute in the `<form>` element to invoke actions. The action will automatically receive the native **FormData** object, containing the captured data.

```tsx
// Server Component
export default function Page() {
  // Action
  async function create(formData: FormData) {
    'use server';
 
    // Logic to mutate data...
  }
 
  // Invoke the action using the "action" attribute
  return <form action={create}>...</form>;
}
```

An advantage of invoking a Server Action within a Server Component is **progressive enhancement** - This allows users to interact with the form and submit data even if the JavaScript for the form hasn't been loaded yet or if it fails to load.

### Data validation

**Zod**, a TypeScript-first validation library that can simplify the validation task.

```tsx
import { z } from 'zod';
 
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});
 
const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
}
```

The `amount` field is specifically set to coerce (change) from a string to a number while also validating its type.

### Client-Side validation

```html
<input
  ..
  required
/>
```

### Server-Side validation

In the client component, import the `useActionState` hook from react.

```tsx
// ...
import { useActionState } from 'react';
 
export default function Form(...) {
  const [state, formAction] = useActionState(createInvoice, initialState);
 
  return <form action={formAction}>...</form>;
}
```

Next, you can use Zod to validate form data.

```tsx
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});
```

Next, update your server action to accept two parameters - `prevState` and `formData`:

```ts
export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};
 
export async function createInvoice(prevState: State, formData: FormData) {
  // ...
}
```

Then, change the Zod `parse()` function to `safeParse()`:

```ts
const validatedFields = CreateInvoice.safeParse({
  customerId: formData.get('customerId'),
  amount: formData.get('amount'),
  status: formData.get('status'),
});
```

`safeParse()` will return an object containing either a success or error field. This will help handle validation more gracefully without having put this logic inside the try/catch block.

Full example code:

```tsx
export async function createInvoice(prevState: State, formData: FormData) {
  // Validate form using Zod
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;

  // Once the database has been updated, the /dashboard/invoices path will be revalidated, and fresh data will be
  // fetched from the server.
  // The form inputs will also be cleared
  revalidatePath('/dashboard/invoices');

  // At this point, you also want to redirect the user back to the /dashboard/invoices page. You can do this with the
  // redirect function from Next.js:
  redirect('/dashboard/invoices');
}
```

### Best practices for transforming form data

**Money**

It's usually good practice to store monetary values in **cents** in your database to eliminate JavaScript floating-point errors and ensure greater accuracy.

```tsx
const amountInCents = moneyValue * 100;
```

When displaying the value, divide the integer by 100 to convert it back to the standard currency format

**Date**

Create dates with the format "YYYY-MM-DD".

```tsx
const date = new Date().toISOString().split('T')[0];
```

## Revalidate

Next.js has a client-side router cache that stores the route segments in the user's browser for a time. Along with prefetching, this cache ensures that users can quickly navigate between routes while reducing the number of requests made to the server.

When you update the data displayed in a specific route, you want to clear this cache and trigger a new request to the server. You can do this with the revalidatePath function from Next.js.

Note: Form inputs will also be cleared.

```tsx
import { revalidatePath } from 'next/cache';

revalidatePath('...');
```

## Redirect

The redirect function allows you to redirect the user to another URL. redirect can be used while rendering in Server and Client Components, Route Handlers, and Server Actions.

```tsx
import { redirect } from 'next/navigation';

redirect('...');
```

## Error handling

The `error.tsx` file can be used to define a UI boundary for a route segment. It serves as a **catch-all** for unexpected errors and allows you to display a fallback UI to your users.

```tsx
'use client';
 
import { useEffect } from 'react';
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error(error);
  }, [error]);
 
  return (
    <main className="flex h-full flex-col items-center justify-center">
      <h2 className="text-center">Something went wrong!</h2>
      <button
        className="mt-4 rounded-md bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-400"
        onClick={
          // Attempt to recover by trying to re-render the invoices route
          () => reset()
        }
      >
        Try again
      </button>
    </main>
  );
}
```
Notes:

- `error.tsx` needs to be a Client Component.
- It accepts two props:
  - `error`: This object is an instance of JavaScript's native Error object.
  - `reset`: This is a function to reset the error boundary. When executed, the function will try to re-render the route segment.

### `notFound` function

`notFound` can be used when you try to fetch a resource that doesn't exist.

Then, to show error UI to the user, create a `not-found.tsx` file inside the current folder.

```tsx
export default function NotFound() {
  return (
    <main>
      <p>Could not find the requested info.</p>
    </main>
  );
}
```

That's something to keep in mind, `notFound` will take **precedence** over `error.tsx`, so you can reach out for it when you want to handle more specific errors!

## Improving Accessibility

Next.js includes the `eslint-plugin-jsx-a11y` plugin in its ESLint config to help catch accessibility issues early.

```json
"scripts": {
    ...
    "lint": "next lint"
},
```

Recommended rule-sets from the following ESLint plugins are all used within `eslint-config-next`:

- `eslint-plugin-react`
- `eslint-plugin-react-hooks`
- `eslint-plugin-next`

Read more: https://nextjs.org/docs/app/api-reference/config/eslint

## Authentication

- Authentication is about making sure the user is **who** they say they are. You're proving your identity with something you have like a username and password.
- Authorization is the next step. Once a user's identity is confirmed, authorization decides what parts of the application they are **allowed** to use.

### Next Auth.js

Install the beta version of NextAuth.js, which is compatible with Next.js 14+.


```bash
pnpm i next-auth@beta
```

Next, generate a secret key for your application.

```bash
# macOS
openssl rand -base64 32
# Windows can use https://generate-secret.vercel.app/32
```

Then, in your `.env` file, add your generated key to the `AUTH_SECRET` variable:

### Config NextAuth

Create an `auth.config.ts` file at the root of our project that exports an `authConfig` object.

Next, add the middleware logic to protect your routes. This will prevent users from accessing the dashboard pages unless they are logged in.

```tsx
import type { NextAuthConfig } from 'next-auth';
 
export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      return true;
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
```

The authorized callback is used to verify if the request is authorized to access a page with Next.js Middleware. It is called **before** a request is completed, and it receives an object with the auth and request properties. The auth property contains the **user's session**, and the request property contains the **incoming request**.

### Import the `authConfig` object into a Middleware file

In the root of your project, create a file called middleware.ts and paste the following code:

```ts
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
 
export default NextAuth(authConfig).auth;
 
export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
  runtime: 'nodejs',
};
```

You're using the `matcher` option from Middleware to specify that it should run on specific paths.

The advantage of employing Middleware for this task is that the protected routes will not even start rendering until the Middleware verifies the authentication, enhancing both the security and performance of your application.

### Password hasing

Create a new file called `auth.ts` that spreads your authConfig object:

```ts
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
 
export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
});
```

# ESLint Stylistic

ESLint Stylistic is a collection of stylistic rules for ESLint, migrated from `eslint` core and `@typescript-eslint` repo to shift the maintenance effort to the community.

```bash
npm i -D @stylistic/eslint-plugin
```

# Concepts

## Web UI

### Cumulative Layout Shift

Cumulative Layout Shift (CLS) is primarily caused by the **unexpected movement of page elements** as content loads, particularly from images, ads, iframes, and dynamically injected content without predefined dimensions, as well as web fonts and late-running third-party scripts. These shifts create an unstable user experience by making it difficult to **find content** or **click the correct elements**.

Common causes:
- **Images**, embeds, and iframes without dimensions.
- Dynamically injected content.
- **Fonts**.
- Late-running third-party scripts.

## Data 

### Placeholder data

Placeholder data is temporary, often fake or incomplete data used to fill a space where real data will eventually go, serving as a stand-in until the final content is available or to allow for the development and testing of systems without relying on live data.

## Fetching data

### Waterfalls

A "waterfall" refers to a sequence of network requests that depend on the **completion of previous requests**. In the case of data fetching, each request can only begin once the previous request has returned data.

```tsx
const revenue = await fetchRevenue();
const latestInvoices = await fetchLatestInvoices(); // wait for fetchRevenue() to finish
const {
  numberOfInvoices,
  numberOfCustomers,
  totalPaidInvoices,
  totalPendingInvoices,
} = await fetchCardData(); // wait for fetchLatestInvoices() to finish
```

### Parallel

A common way to avoid waterfalls is to initiate all data requests at the same time - in parallel.

```tsx
export async function fetchCardData() {
  try {
    const invoiceCountPromise = sql`SELECT COUNT(*) FROM invoices`;
    const customerCountPromise = sql`SELECT COUNT(*) FROM customers`;
    const invoiceStatusPromise = sql`SELECT
         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
         FROM invoices`;
 
    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);
    // ...
  }
}
```

# Questions and Answers

❓ If my child component is a server component and it is rendered within a client component, then is my server component considered or transformed into client component?

📝 Yes — a server component rendered inside a client component is not treated as a server component anymore. It gets bundled into the client bundle (i.e., treated as a client component).

✅ Solution: pass the data collected from the server component as prop or pass the server component as child component of the client component

❓ Speed performance between use ref to toggle hidden class vs use state to conditionally render

📝 

- `useRef`: Faster toggle speed / No re-render / Consume memory / Useful for heavy components
- `useState`: Slower toggle speed / Re-render / memory optimized / Heavy components take time to clean up and re-render