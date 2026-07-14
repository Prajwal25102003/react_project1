function ToggleSwitch({ id, label, checked, onChange, disabled = false, darkTrack = false }) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-center gap-3 text-sm font-medium select-none ${
        disabled ? 'text-gray-400' : 'text-gray-700 dark:text-gray-400'
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
          className={`block h-6 w-11 rounded-full ${
            checked
              ? 'bg-brand-500 dark:bg-brand-500'
              : disabled
                ? 'bg-gray-100 dark:bg-gray-800'
                : darkTrack
                  ? 'bg-gray-700 dark:bg-white/10'
                  : 'bg-gray-200 dark:bg-white/10'
          }`}
        />
        <div
          className={`shadow-theme-sm absolute top-0.5 left-0.5 h-5 w-5 rounded-full duration-300 ease-linear ${
            disabled ? 'bg-gray-50' : 'bg-white'
          } ${checked ? 'translate-x-full' : 'translate-x-0'}`}
        />
      </div>
      {label}
    </label>
  )
}

export default ToggleSwitch
