import clsx from 'clsx'

export default function PrimaryButton({
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
      'rounded-md px-3 py-2 text-sm lg:text-base font-semibold shadow-xs shadow-dark/25 dark:shadow-light/25 cursor-pointer',
      'bg-dark dark:bg-light text-light dark:text-dark',
      'hover:bg-light-accent hover:text-light',
      'dark:hover:bg-dark-accent dark:hover:text-dark',
      'focus-visible:outline-2 focus-visible:outline-offset-2',
      className
    ])}>
    {children}
  </button>
}