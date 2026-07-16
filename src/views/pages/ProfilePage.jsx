import { useProfile } from "../../controllers/profileController.js";
import Breadcrumb from "../components/Breadcrumb.jsx";
import UserAvatar from "../components/UserAvatar.jsx";

function InfoField({ label, value }) {
  return (
    <div>
      <p className="mb-2 text-xs leading-normal text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value}</p>
    </div>
  );
}

function ProfilePage() {
  const { profile, loading, error } = useProfile();

  if (loading) {
    return <p className="text-theme-sm text-gray-500">Loading profile…</p>;
  }

  if (error || !profile) {
    return (
      <p className="text-theme-sm text-error-600">
        {error || "Profile not available"}
      </p>
    );
  }

  return (
    <>
      <Breadcrumb pageName="Profile" />
      <div className="min-w-0 max-w-full overflow-x-hidden rounded-2xl border border-gray-200 bg-white p-5 lg:p-6">
        <div className="mb-6 rounded-2xl border border-gray-200 p-5 lg:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
            <div className="flex w-full flex-col items-center gap-6 xl:flex-row">
              <UserAvatar
                src={profile.avatar}
                name={profile.name}
                size="xl"
              />
              <div className="order-3 xl:order-2">
                <h4 className="mb-2 text-center text-lg font-semibold text-gray-800 xl:text-left">
                  {profile.name}
                </h4>
                <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                  <p className="text-sm text-gray-500">{profile.role}</p>
                  <div className="hidden h-3.5 w-px bg-gray-300 xl:block" />
                  <p className="text-sm text-gray-500">{profile.location}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-gray-200 p-5 lg:p-6">
          <h4 className="mb-6 text-lg font-semibold text-gray-800">
            Personal Information
          </h4>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <InfoField label="First Name" value={profile.personal.firstName} />
            <InfoField label="Last Name" value={profile.personal.lastName} />
            <InfoField
              label="Email address"
              value={profile.personal.email}
            />
            <InfoField label="Phone" value={profile.personal.phone} />
            <InfoField label="Bio" value={profile.personal.bio} />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 p-5 lg:p-6">
          <h4 className="mb-6 text-lg font-semibold text-gray-800">Address</h4>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <InfoField label="Country" value={profile.address.country} />
            <InfoField label="City/State" value={profile.address.cityState} />
            <InfoField
              label="Postal Code"
              value={profile.address.postalCode}
            />
            <InfoField label="TAX ID" value={profile.address.taxId} />
          </div>
        </div>
      </div>
    </>
  );
}

export default ProfilePage;
