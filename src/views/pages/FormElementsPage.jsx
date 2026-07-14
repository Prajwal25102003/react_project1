import {
  useMultiSelect,
  usePasswordToggle,
  usePhoneCountry,
  useSelectOption,
  useToggle,
} from '../../controllers/formController.js'
import {
  getMultiSelectOptions,
  INPUT_CLASS,
  SELECT_OPTIONS,
  TEXTAREA_CLASS,
} from '../../models/formElementsModel.js'
import Breadcrumb from '../components/Breadcrumb.jsx'
import PageCard from '../components/PageCard.jsx'
import CheckboxField from '../components/forms/CheckboxField.jsx'
import PasswordField from '../components/forms/PasswordField.jsx'
import ToggleSwitch from '../components/forms/ToggleSwitch.jsx'

function SelectField({ id, label }) {
  const { onChange } = useSelectOption()

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
        {label}
      </label>
      <div className="relative z-20 bg-transparent">
        <select
          className={`${INPUT_CLASS} appearance-none pr-11`}
          onChange={onChange}
        >
          <option value="">Select Option</option>
          {SELECT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute top-1/2 right-4 z-30 -translate-y-1/2 text-gray-500 dark:text-gray-400">
          ▾
        </span>
      </div>
    </div>
  )
}

function MultiSelectField() {
  const {
    options,
    selected,
    isOpen,
    toggleOpen,
    close,
    selectOption,
    removeOption,
  } = useMultiSelect(getMultiSelectOptions())

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
        Multiple Select Options
      </label>
      <div className="relative z-20 inline-block w-full">
        <button
          type="button"
          onClick={toggleOpen}
          className="shadow-theme-xs mb-2 flex min-h-11 w-full rounded-lg border border-gray-300 py-1.5 pr-3 pl-3 text-left dark:border-gray-700 dark:bg-gray-900"
        >
          <div className="flex flex-auto flex-wrap gap-2">
            {selected.map((option) => {
              const index = options.findIndex((item) => item.id === option.id)
              return (
                <span
                  key={option.id}
                  className="group flex items-center rounded-full bg-gray-100 py-1 pr-2 pl-2.5 text-sm text-gray-800 dark:bg-gray-800 dark:text-white/90"
                >
                  {option.text}
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      removeOption(index)
                    }}
                    className="ml-2 text-gray-500"
                  >
                    ×
                  </button>
                </span>
              )
            })}
            {selected.length === 0 ? (
              <span className="text-sm text-gray-500">Select option</span>
            ) : null}
          </div>
        </button>
        {isOpen ? (
          <>
            <button
              type="button"
              aria-label="Close multi select"
              className="fixed inset-0 z-30"
              onClick={close}
            />
            <div className="absolute top-full left-0 z-40 mt-1 w-full overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-900">
              {options.map((option, index) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => selectOption(index)}
                  className={`block w-full px-4 py-2 text-left text-sm hover:bg-brand-500/5 ${
                    option.selected ? 'text-brand-500' : 'text-gray-800 dark:text-white/90'
                  }`}
                >
                  {option.text}
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

function FormElementsPage() {
  const password = usePasswordToggle()
  const phone = usePhoneCountry()
  const checkboxDefault = useToggle(false)
  const checkboxChecked = useToggle(true)
  const radioDefault = useToggle(false)
  const radioChecked = useToggle(true)
  const switchDefault = useToggle(false)
  const switchChecked = useToggle(true)

  return (
    <>
      <Breadcrumb pageName="Form Elements" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-6">
          <PageCard title="Default Inputs" bodyClassName="space-y-6 p-5 sm:p-6">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Input
              </label>
              <input type="text" className={INPUT_CLASS} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Input with Placeholder
              </label>
              <input type="text" placeholder="info@gmail.com" className={INPUT_CLASS} />
            </div>
            <SelectField id="default-select" label="Select Input" />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Password Input
              </label>
              <PasswordField
                showPassword={password.value}
                onToggle={password.toggle}
                className={`${INPUT_CLASS} pr-11`}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Date Picker Input
              </label>
              <input type="date" className={`${INPUT_CLASS} pr-11`} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Time Select Input
              </label>
              <input type="time" className={`${INPUT_CLASS} pr-11`} />
            </div>
          </PageCard>

          <PageCard title="Select Inputs" bodyClassName="space-y-6 p-5 sm:p-6">
            <SelectField id="select-input" label="Select Input" />
            <MultiSelectField />
          </PageCard>

          <PageCard title="Textarea input field" bodyClassName="space-y-6 p-5 sm:p-6">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Description
              </label>
              <textarea rows={6} placeholder="Enter a description..." className={TEXTAREA_CLASS} />
            </div>
          </PageCard>

          <PageCard
            title="Input States"
            subtitle="Validation styles for error, success and disabled states on form controls."
            bodyClassName="space-y-6 p-5 sm:p-6"
          >
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Email
              </label>
              <input
                type="text"
                defaultValue="demoemail"
                className="w-full rounded-lg border border-error-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:border-error-700 dark:bg-gray-900 dark:text-white/90"
              />
              <p className="text-theme-xs mt-1.5 text-error-500">This is an error message.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Email
              </label>
              <input
                type="text"
                defaultValue="demoemail@gmail.com"
                className="w-full rounded-lg border border-success-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:border-success-700 dark:bg-gray-900 dark:text-white/90"
              />
              <p className="text-theme-xs mt-1.5 text-success-500">
                This is an success message.
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300 dark:text-white/15">
                Email
              </label>
              <input
                type="text"
                placeholder="info@gmail.com"
                disabled
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm disabled:border-gray-100 dark:border-gray-800 dark:bg-gray-900"
              />
            </div>
          </PageCard>
        </div>

        <div className="space-y-6">
          <PageCard title="Input Group" bodyClassName="space-y-6 p-5 sm:p-6">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Email
              </label>
              <input type="text" placeholder="info@gmail.com" className={`${INPUT_CLASS} pl-[62px]`} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Phone
              </label>
              <div className="flex">
                <select
                  value={phone.selectedCountry}
                  onChange={phone.onCountryChange}
                  className="rounded-l-lg border border-r border-gray-300 bg-transparent px-3 py-3 dark:border-gray-800"
                >
                  {Object.keys(phone.countryCodes).map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={phone.phoneNumber}
                  onChange={(event) => phone.setPhoneNumber(event.target.value)}
                  className={`${INPUT_CLASS} rounded-l-none`}
                />
              </div>
            </div>
          </PageCard>

          <PageCard title="File Input" bodyClassName="space-y-6 p-5 sm:p-6">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Upload file
              </label>
              <input
                type="file"
                className="h-11 w-full rounded-lg border border-gray-300 text-sm text-gray-500 file:mr-5 file:rounded-l-lg file:border-0 file:border-r file:border-gray-200 file:bg-gray-50 file:px-3.5 file:py-3 dark:border-gray-700 dark:bg-gray-900"
              />
            </div>
          </PageCard>

          <PageCard title="Checkboxes" bodyClassName="space-y-6 p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-8">
              <CheckboxField
                id="checkbox-default"
                label="Default"
                checked={checkboxDefault.value}
                onChange={checkboxDefault.toggle}
              />
              <CheckboxField
                id="checkbox-checked"
                label="Checked"
                checked={checkboxChecked.value}
                onChange={checkboxChecked.toggle}
              />
              <CheckboxField
                id="checkbox-disabled"
                label="Disabled"
                checked
                disabled
                muted
              />
            </div>
          </PageCard>

          <PageCard title="Radio Buttons" bodyClassName="space-y-6 p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-8">
              <CheckboxField
                id="radio-default"
                label="Default"
                checked={radioDefault.value}
                onChange={radioDefault.toggle}
              />
              <CheckboxField
                id="radio-checked"
                label="Secondary"
                checked={radioChecked.value}
                onChange={radioChecked.toggle}
              />
            </div>
          </PageCard>

          <PageCard title="Toggle switch input" bodyClassName="space-y-6 p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-6 sm:gap-8">
              <ToggleSwitch
                id="toggle-default"
                label="Default"
                checked={switchDefault.value}
                onChange={switchDefault.toggle}
              />
              <ToggleSwitch
                id="toggle-checked"
                label="Checked"
                checked={switchChecked.value}
                onChange={switchChecked.toggle}
              />
              <ToggleSwitch id="toggle-disabled" label="Disabled" checked={false} disabled />
            </div>
          </PageCard>

          <PageCard title="Dropzone" bodyClassName="space-y-6 p-5 sm:p-6">
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-7 text-center dark:border-gray-700 dark:bg-gray-900 lg:p-10">
              <h4 className="text-theme-xl mb-3 font-semibold text-gray-800 dark:text-white/90">
                Drop File Here
              </h4>
              <p className="mx-auto mb-5 block max-w-[290px] text-sm text-gray-700 dark:text-gray-400">
                Drag and drop your PNG, JPG, WebP, SVG images here or browse
              </p>
              <button
                type="button"
                className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
              >
                Browse File
              </button>
            </div>
          </PageCard>
        </div>
      </div>
    </>
  )
}

export default FormElementsPage
