import ModalShell from '../components/ModalShell.jsx'

function ProfileAddressModal({ onClose, profile }) {
  return (
    <ModalShell
      onClose={onClose}
      title="Edit Address"
      description="Update your address details."
    >
      <form className="flex flex-col">
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 px-2 lg:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Country
            </label>
            <input
              type="text"
              defaultValue={profile.address.country}
              className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              City/State
            </label>
            <input
              type="text"
              defaultValue={profile.address.cityState}
              className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Postal Code
            </label>
            <input
              type="text"
              defaultValue={profile.address.postalCode}
              className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              TAX ID
            </label>
            <input
              type="text"
              defaultValue={profile.address.taxId}
              className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>
        </div>
        <div className="mt-6 flex items-center gap-3 px-2 lg:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-400"
          >
            Close
          </button>
          <button
            type="button"
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            Save Changes
          </button>
        </div>
      </form>
    </ModalShell>
  )
}

export default ProfileAddressModal
