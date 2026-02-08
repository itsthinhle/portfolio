import clsx from 'clsx'
import React from 'react'

export default function CheckBox({
  id,
  name,
  defaultChecked = true
}) {
  // Or a custom loading skeleton component
  return <div className="flex h-6 shrink-0 items-center">
    <div className="group grid size-4 grid-cols-1">
      <input
        defaultChecked={defaultChecked}
        id={id}
        name={name}
        type="checkbox"
        className={clsx(
          'col-start-1 row-start-1 appearance-none forced-colors:appearance-auto',
          'rounded-sm input-normal-outline checked:outline-light-accent dark:checked:outline-dark-accent',
          'checked:bg-light-accent dark:checked:bg-dark-accent',
          'indeterminate:outline-light-accent dark:indeterminate:outline-dark-accent',
          'indeterminate:bg-light-accent dark:indeterminate:bg-dark-accent')} />
      <svg
        fill="none"
        viewBox="0 0 14 14"
        className={clsx('pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center group-has-disabled:stroke-gray-950/25 dark:group-has-disabled:stroke-white/25',
                        'stroke-light dark:stroke-dark')}
      >
        <path
          d="M3 8L6 11L11 3.5"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-0 group-has-checked:opacity-100"
        />
        <path
          d="M3 7H11"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-0 group-has-indeterminate:opacity-100"
        />
      </svg>
    </div>
  </div>
}