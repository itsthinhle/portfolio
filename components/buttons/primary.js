import clsx from 'clsx'

export default function PrimaryButton({
  children, className, type = 'button', ariaLabel, onClick
}) {
  return <button
    aria-label={ariaLabel}
    type={type}
    className={clsx([
      'rounded-md px-3.5 py-2.5 shadow-xs cursor-pointer',
      'focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white',
      'bg-black dark:bg-white text-white dark:text-black hover:bg-light-accent dark:hover:bg-dark-accent',
      'font-semibold',
      className
    ])}
    onClick={onClick}>
    {children}
  </button>
}