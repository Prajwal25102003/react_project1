export const BUTTON_SIZES = ['px-4 py-3', 'px-5 py-3.5']

export const BUTTON_ICON_PATH =
  'M9.77692 3.24224C9.91768 3.17186 10.0834 3.17186 10.2241 3.24224L15.3713 5.81573L10.3359 8.33331C10.1248 8.43888 9.87626 8.43888 9.66512 8.33331L4.6298 5.81573L9.77692 3.24224ZM3.70264 7.0292V13.4124C3.70264 13.6018 3.80964 13.775 3.97903 13.8597L9.25016 16.4952L9.25016 9.7837C9.16327 9.75296 9.07782 9.71671 8.99432 9.67496L3.70264 7.0292ZM10.7502 16.4955V9.78396C10.8373 9.75316 10.923 9.71683 11.0067 9.67496L16.2984 7.0292V13.4124C16.2984 13.6018 16.1914 13.775 16.022 13.8597L10.7502 16.4955Z'

export function getButtonSections() {
  return [
    { id: 'primary', title: 'Primary Button', variant: 'primary', icon: 'none' },
    {
      id: 'primary-left',
      title: 'Primary Button with Left Icon',
      variant: 'primary',
      icon: 'left',
    },
    {
      id: 'primary-right',
      title: 'Primary Button with Right Icon',
      variant: 'primary',
      icon: 'right',
    },
    {
      id: 'secondary',
      title: 'Secondary Button',
      variant: 'secondary',
      icon: 'none',
    },
    {
      id: 'secondary-left',
      title: 'Secondary Button with Left Icon',
      variant: 'secondary',
      icon: 'left',
    },
    {
      id: 'secondary-right',
      title: 'Secondary Button with Right Icon',
      variant: 'secondary',
      icon: 'right',
    },
  ]
}
