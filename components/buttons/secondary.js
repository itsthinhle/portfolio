import clsx from 'clsx'

/** A single button in a button group */
export default function SecondaryButton({
  children,
  ariaLabel,
  ref,
  type = 'button',
  onClick,
  className,
  isDisabled = false
}) {
  return <button
    disabled={isDisabled}
    aria-label={ariaLabel}
    ref={ref}
    type={type}
    onClick={onClick}
    className={clsx([
      'px-3 py-2 text-sm lg:text-base font-semibold',
      'inset-ring inset-ring-light-boundary dark:inset-ring-dark-boundary',
      'hover:bg-light-accent dark:hover:bg-dark-accent',
      'hover:text-light dark:hover:text-dark focus:z-10',
      {
        'opacity-75': isDisabled,
        'cursor-pointer': !isDisabled,
      },
      className,
    ])}>
    {children}
  </button>
}