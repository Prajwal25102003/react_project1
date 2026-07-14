function CheckboxField({
  id,
  label,
  checked,
  onChange,
  disabled = false,
  muted = false,
}) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-center text-sm font-medium select-none ${
        muted
          ? 'text-gray-300 dark:text-gray-700'
          : 'text-gray-700 dark:text-gray-400'
      }`}
    >
      <div className="relative">
        <input
          type="checkbox"
          id={id}
          className="sr-only"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
        />
        <div
          className={`mr-3 flex h-5 w-5 items-center justify-center rounded-md border-[1.25px] ${
            checked
              ? disabled
                ? 'border-gray-200 bg-transparent dark:border-gray-800'
                : 'border-brand-500 bg-brand-500'
              : 'border-gray-300 bg-transparent dark:border-gray-700'
          }`}
        >
          <span className={checked ? '' : 'opacity-0'}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
                stroke="white"
                strokeWidth="1.94437"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>
      {label}
    </label>
  )
}

export default CheckboxField
