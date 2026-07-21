import { Link } from "react-router-dom";
import { NavIcon } from "../icons/NavIcon.jsx";
import StatusPill from "../components/StatusPill.jsx";
import UserAvatar from "../components/UserAvatar.jsx";
import { notificationDotTone } from "../../models/headerModel.js";

function Header({
  sidebarToggle,
  onToggleSidebar,
  menuToggle,
  onToggleMenu,
  searchQuery,
  onSearchChange,
  notificationsOpen,
  onToggleNotifications,
  onCloseNotifications,
  notifications,
  notificationsLoading,
  hasUnread,
  notificationsRef,
  user,
  userOpen,
  onToggleUserMenu,
  userMenuItems,
  userRef,
  onSignOut,
}) {
  return (
    <header className="sticky top-0 z-99999 flex w-full min-w-0 max-w-full border-gray-200 bg-white lg:border-b">
      <div className="flex grow flex-col items-center justify-between lg:flex-row lg:px-6">
        <div className="flex w-full items-center justify-between gap-2 border-b border-gray-200 px-3 py-3 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
          <button
            type="button"
            onClick={onToggleSidebar}
            className={`z-99999 flex h-10 w-10 items-center justify-center rounded-lg border-gray-200 text-gray-500 lg:h-11 lg:w-11 lg:border ${
              sidebarToggle ? "bg-gray-100 lg:bg-transparent " : ""
            }`}
            aria-label="Toggle sidebar"
          >
            <svg
              className="hidden fill-current lg:block"
              width="16"
              height="12"
              viewBox="0 0 16 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
                fill="currentColor"
              />
            </svg>

            <svg
              className={`fill-current lg:hidden ${
                sidebarToggle ? "hidden" : "block"
              }`}
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M3.25 6C3.25 5.58579 3.58579 5.25 4 5.25L20 5.25C20.4142 5.25 20.75 5.58579 20.75 6C20.75 6.41421 20.4142 6.75 20 6.75L4 6.75C3.58579 6.75 3.25 6.41422 3.25 6ZM3.25 18C3.25 17.5858 3.58579 17.25 4 17.25L20 17.25C20.4142 17.25 20.75 17.5858 20.75 18C20.75 18.4142 20.4142 18.75 20 18.75L4 18.75C3.58579 18.75 3.25 18.4142 3.25 18ZM4 11.25C3.58579 11.25 3.25 11.5858 3.25 12C3.25 12.4142 3.58579 12.75 4 12.75L12 12.75C12.4142 12.75 12.75 12.4142 12.75 12C12.75 11.5858 12.4142 11.25 12 11.25L4 11.25Z"
                fill="currentColor"
              />
            </svg>

            <svg
              className={`fill-current ${
                sidebarToggle ? "block lg:hidden" : "hidden"
              }`}
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                fill="currentColor"
              />
            </svg>
          </button>

          <Link
            to="/dashboard"
            className="flex items-center gap-2 lg:hidden"
            aria-label="EMP home"
          >
            <img
              src="/images/logo/logo-icon.svg"
              alt=""
              className="h-8 w-8"
            />
            <span className="text-lg font-semibold text-gray-800">EMP</span>
          </Link>

          <button
            type="button"
            onClick={onToggleMenu}
            className={`z-99999 flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 lg:hidden ${
              menuToggle ? "bg-gray-100 " : ""
            }`}
            aria-label="Toggle header menu"
          >
            <svg
              className="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.99902 10.4951C6.82745 10.4951 7.49902 11.1667 7.49902 11.9951V12.0051C7.49902 12.8335 6.82745 13.5051 5.99902 13.5051C5.1706 13.5051 4.49902 12.8335 4.49902 12.0051V11.9951C4.49902 11.1667 5.1706 10.4951 5.99902 10.4951ZM17.999 10.4951C18.8275 10.4951 19.499 11.1667 19.499 11.9951V12.0051C19.499 12.8335 18.8275 13.5051 17.999 13.5051C17.1706 13.5051 16.499 12.8335 16.499 12.0051V11.9951C16.499 11.1667 17.1706 10.4951 17.999 10.4951ZM13.499 11.9951C13.499 11.1667 12.8275 10.4951 11.999 10.4951C11.1706 10.4951 10.499 11.1667 10.499 11.9951V12.0051C10.499 12.8335 11.1706 13.5051 11.999 13.5051C12.8275 13.5051 13.499 12.8335 13.499 12.0051V11.9951Z"
                fill="currentColor"
              />
            </svg>
          </button>

          <div className="hidden lg:block">
            <form onSubmit={(event) => event.preventDefault()}>
              <div className="relative">
                <span className="absolute top-1/2 left-4 -translate-y-1/2">
                  <svg
                    className="fill-gray-500"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search or type command..."
                  value={searchQuery}
                  onChange={(event) => onSearchChange(event.target.value)}
                  className="shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pr-14 pl-12 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden xl:w-[430px]"
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-2.5 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 px-[7px] py-[4.5px] text-xs -tracking-[0.2px] text-gray-500"
                >
                  <span>⌘</span>
                  <span>K</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        <div
          className={`shadow-theme-md w-full items-center justify-between gap-4 px-5 py-4 lg:flex lg:justify-end lg:px-0 lg:shadow-none ${
            menuToggle ? "flex" : "hidden"
          }`}
        >
          <div className="2xsm:gap-3 flex items-center gap-2">
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                onClick={onToggleNotifications}
                className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                aria-label="Notifications"
              >
                <svg
                  className="fill-current"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
                    fill="currentColor"
                  />
                </svg>
                {hasUnread ? (
                  <span
                    className="absolute top-0 right-0 z-10 h-2.5 w-2.5 rounded-full bg-success-500 ring-2 ring-white"
                    aria-hidden="true"
                  />
                ) : null}
              </button>

              {notificationsOpen ? (
                <div className="shadow-theme-lg absolute left-0 z-99999 mt-[17px] flex max-h-[min(480px,calc(100vh-8rem))] w-[min(361px,calc(100vw-2.5rem))] flex-col rounded-2xl border border-gray-200 bg-white p-3 lg:left-auto lg:right-0 lg:h-[480px] lg:max-h-none lg:w-[361px]">
                  <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3">
                    <h5 className="text-lg font-semibold text-gray-800">
                      Notification
                    </h5>
                    <button
                      type="button"
                      onClick={onCloseNotifications}
                      className="text-gray-500"
                      aria-label="Close notifications"
                    >
                      <svg
                        className="fill-current"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                          fill="currentColor"
                        />
                      </svg>
                    </button>
                  </div>

                  <ul className="custom-scrollbar flex h-auto flex-col overflow-y-auto">
                    {notificationsLoading ? (
                      <li className="px-4.5 py-8 text-center">
                        <p className="text-theme-sm text-gray-500">
                          Loading notifications…
                        </p>
                      </li>
                    ) : null}

                    {!notificationsLoading && notifications.length === 0 ? (
                      <li className="px-4.5 py-8 text-center">
                        <p className="text-theme-sm text-gray-500">
                          No notifications yet
                        </p>
                      </li>
                    ) : null}

                    {!notificationsLoading
                      ? notifications.map((notification) => (
                          <li key={notification.id}>
                            <div
                              className={`flex gap-3 rounded-lg border-b border-gray-100 px-4.5 py-3 ${
                                notification.isNew ? "bg-brand-50/60" : ""
                              }`}
                            >
                              <span className="relative z-1 block h-10 w-full max-w-10 shrink-0 rounded-full">
                                <UserAvatar
                                  name={notification.title}
                                  size="sm"
                                />
                                <span
                                  className={`absolute right-0 bottom-0 z-10 h-2.5 w-2.5 rounded-full border-[1.5px] border-white ${
                                    notificationDotTone(notification.status) ===
                                    "error"
                                      ? "bg-error-500"
                                      : notificationDotTone(
                                            notification.status,
                                          ) === "warning"
                                        ? "bg-warning-500"
                                        : notificationDotTone(
                                              notification.status,
                                            ) === "info"
                                          ? "bg-blue-light-500"
                                          : "bg-success-500"
                                  }`}
                                />
                              </span>
                              <span className="block min-w-0 flex-1">
                                <span className="mb-1.5 flex items-start justify-between gap-2">
                                  <span className="text-theme-sm block text-gray-500">
                                    <span className="font-medium text-gray-800">
                                      {notification.title}
                                    </span>
                                    {notification.description ? (
                                      <>
                                        <br />
                                        <span className="text-theme-xs text-gray-500">
                                          {notification.description}
                                        </span>
                                      </>
                                    ) : null}
                                  </span>
                                  {notification.isNew ? (
                                    <span className="mt-0.5 shrink-0 rounded-full bg-success-500 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
                                      New
                                    </span>
                                  ) : null}
                                </span>
                                <span className="text-theme-xs flex flex-wrap items-center gap-2 text-gray-500">
                                  <span>{notification.category}</span>
                                  <span className="h-1 w-1 rounded-full bg-gray-400" />
                                  <span>{notification.time}</span>
                                  {notification.status ? (
                                    <>
                                      <span className="h-1 w-1 rounded-full bg-gray-400" />
                                      <StatusPill
                                        label={notification.status}
                                        statusClass={notification.statusClass}
                                      />
                                    </>
                                  ) : null}
                                </span>
                              </span>
                            </div>
                          </li>
                        ))
                      : null}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>

          <div className="relative" ref={userRef}>
            <button
              type="button"
              onClick={onToggleUserMenu}
              className="flex items-center text-gray-700"
            >
              <span className="mr-3">
                <UserAvatar
                  src={user.avatar}
                  name={user.fullName || user.name}
                  size="md"
                />
              </span>
              <span className="text-theme-sm mr-1 block font-medium">
                {user.name}
              </span>
              <svg
                className={`stroke-gray-500 ${userOpen ? "rotate-180" : ""}`}
                width="18"
                height="20"
                viewBox="0 0 18 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {userOpen ? (
              <div className="shadow-theme-lg absolute right-0 mt-[17px] flex w-[min(260px,calc(100vw-2rem))] flex-col rounded-2xl border border-gray-200 bg-white p-3">
                <div>
                  <span className="text-theme-sm block font-medium text-gray-700">
                    {user.fullName}
                  </span>
                  <span className="text-theme-xs mt-0.5 block text-gray-500">
                    {user.email}
                  </span>
                </div>

                <ul className="flex flex-col gap-1 border-b border-gray-200 pt-4 pb-3">
                  {userMenuItems.map((item) => (
                    <li key={item.id}>
                      <Link
                        to={item.path}
                        className="group text-theme-sm flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-700"
                        onClick={onToggleUserMenu}
                      >
                        <NavIcon
                          name={item.icon}
                          className="fill-gray-500 group-hover:fill-gray-700"
                        />
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={onSignOut}
                  className="group text-theme-sm mt-3 flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-700"
                >
                  <svg
                    className="fill-gray-500 group-hover:fill-gray-700"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M15.1007 19.247C14.6865 19.247 14.3507 18.9112 14.3507 18.497L14.3507 14.245H12.8507V18.497C12.8507 19.7396 13.8581 20.747 15.1007 20.747H18.5007C19.7434 20.747 20.7507 19.7396 20.7507 18.497L20.7507 5.49609C20.7507 4.25345 19.7433 3.24609 18.5007 3.24609H15.1007C13.8581 3.24609 12.8507 4.25345 12.8507 5.49609V9.74501L14.3507 9.74501V5.49609C14.3507 5.08188 14.6865 4.74609 15.1007 4.74609L18.5007 4.74609C18.9149 4.74609 19.2507 5.08188 19.2507 5.49609L19.2507 18.497C19.2507 18.9112 18.9149 19.247 18.5007 19.247H15.1007ZM3.25073 11.9984C3.25073 12.2144 3.34204 12.4091 3.48817 12.546L8.09483 17.1556C8.38763 17.4485 8.86251 17.4487 9.15549 17.1559C9.44848 16.8631 9.44863 16.3882 9.15583 16.0952L5.81116 12.7484L16.0007 12.7484C16.4149 12.7484 16.7507 12.4127 16.7507 11.9984C16.7507 11.5842 16.4149 11.2484 16.0007 11.2484L5.81528 11.2484L9.15585 7.90554C9.44864 7.61255 9.44847 7.13767 9.15547 6.84488C8.86248 6.55209 8.3876 6.55226 8.09481 6.84525L3.52309 11.4202C3.35673 11.5577 3.25073 11.7657 3.25073 11.9984Z"
                      fill="currentColor"
                    />
                  </svg>
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
