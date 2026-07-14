import { useCallback, useState } from 'react'
import { COUNTRY_CODES } from '../models/formElementsModel.js'

export function useToggle(initial = false) {
  const [value, setValue] = useState(initial)
  const toggle = useCallback(() => setValue((current) => !current), [])
  return { value, setValue, toggle }
}

export function usePasswordToggle() {
  return useToggle(false)
}

export function useSelectOption() {
  const [isSelected, setIsSelected] = useState(false)
  const onChange = useCallback(() => setIsSelected(true), [])
  return { isSelected, onChange }
}

export function usePhoneCountry() {
  const [selectedCountry, setSelectedCountry] = useState('US')
  const [phoneNumber, setPhoneNumber] = useState(COUNTRY_CODES.US)

  const onCountryChange = useCallback((event) => {
    const country = event.target.value
    setSelectedCountry(country)
    setPhoneNumber(COUNTRY_CODES[country] || '')
  }, [])

  return {
    selectedCountry,
    phoneNumber,
    setPhoneNumber,
    onCountryChange,
    countryCodes: COUNTRY_CODES,
  }
}

export function useMultiSelect(initialOptions = []) {
  const [options, setOptions] = useState(initialOptions)
  const [isOpen, setIsOpen] = useState(false)

  const selected = options.filter((option) => option.selected)

  const toggleOpen = useCallback(() => setIsOpen((open) => !open), [])
  const close = useCallback(() => setIsOpen(false), [])

  const selectOption = useCallback((index) => {
    setOptions((current) =>
      current.map((option, optionIndex) =>
        optionIndex === index
          ? { ...option, selected: !option.selected }
          : option,
      ),
    )
  }, [])

  const removeOption = useCallback((index) => {
    setOptions((current) =>
      current.map((option, optionIndex) =>
        optionIndex === index ? { ...option, selected: false } : option,
      ),
    )
  }, [])

  return {
    options,
    selected,
    isOpen,
    toggleOpen,
    close,
    selectOption,
    removeOption,
  }
}
