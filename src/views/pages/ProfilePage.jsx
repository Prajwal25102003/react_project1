import { useProfile } from '../../controllers/profileController.js'
import Breadcrumb from '../components/Breadcrumb.jsx'
import ProfileAddressModal from './ProfileAddressModal.jsx'
import ProfileInfoModal from './ProfileInfoModal.jsx'

const EDIT_ICON = (
  <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206Z"
    />
  </svg>
)

function InfoField({ label, value }) {
  return (
    <div>
      <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="text-sm font-medium text-gray-800 dark:text-white/90">{value}</p>
    </div>
  )
}

function ProfilePage() {
  const {
    profile,
    isInfoModalOpen,
    isAddressModalOpen,
    openInfoModal,
    closeInfoModal,
    openAddressModal,
    closeAddressModal,
  } = useProfile()

  return (
    <>
      <Breadcrumb pageName="Profile" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Profile
        </h3>

        <div className="mb-6 rounded-2xl border border-gray-200 p-5 dark:border-gray-800 lg:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex w-full flex-col items-center gap-6 xl:flex-row">
              <div className="h-20 w-20 overflow-hidden rounded-full border border-gray-200 dark:border-gray-800">
                <img src={profile.avatar} alt="user" />
              </div>
              <div className="order-3 xl:order-2">
                <h4 className="mb-2 text-center text-lg font-semibold text-gray-800 dark:text-white/90 xl:text-left">
                  {profile.name}
                </h4>
                <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{profile.role}</p>
                  <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">{profile.location}</p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={openInfoModal}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
            >
              {EDIT_ICON}
              Edit
            </button>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-gray-200 p-5 dark:border-gray-800 lg:p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
                Personal Information
              </h4>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
                <InfoField label="First Name" value={profile.personal.firstName} />
                <InfoField label="Last Name" value={profile.personal.lastName} />
                <InfoField label="Email address" value={profile.personal.email} />
                <InfoField label="Phone" value={profile.personal.phone} />
                <InfoField label="Bio" value={profile.personal.bio} />
              </div>
            </div>
            <button
              type="button"
              onClick={openInfoModal}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
            >
              {EDIT_ICON}
              Edit
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800 lg:p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
                Address
              </h4>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
                <InfoField label="Country" value={profile.address.country} />
                <InfoField label="City/State" value={profile.address.cityState} />
                <InfoField label="Postal Code" value={profile.address.postalCode} />
                <InfoField label="TAX ID" value={profile.address.taxId} />
              </div>
            </div>
            <button
              type="button"
              onClick={openAddressModal}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
            >
              {EDIT_ICON}
              Edit
            </button>
          </div>
        </div>
      </div>

      {isInfoModalOpen ? <ProfileInfoModal onClose={closeInfoModal} profile={profile} /> : null}
      {isAddressModalOpen ? (
        <ProfileAddressModal onClose={closeAddressModal} profile={profile} />
      ) : null}
    </>
  )
}

export default ProfilePage
