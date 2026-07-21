import { NavLink } from "react-router-dom";
import { useSidebarNav } from "../../controllers/navController.js";
import { formatNavBadgeCount } from "../../models/navBadgesModel.js";
import { cn } from "../../utils/cn.js";
import { tw } from "../../utils/tw.js";
import { GroupDotsIcon, NavIcon } from "../icons/NavIcon.jsx";

function SidebarGroupTitle({ title, sidebarToggle }) {
  return (
    <h3 className="mb-4 text-xs uppercase leading-[20px] text-gray-400">
      <span
        className={cn(
          // Mobile drawer always shows labels; desktop collapsed shows on hover.
          sidebarToggle
            ? "inline lg:hidden lg:group-hover/sidebar:inline"
            : "inline",
        )}
      >
        {title}
      </span>
      <GroupDotsIcon
        className={cn(
          "mx-auto fill-current",
          sidebarToggle
            ? "hidden lg:block lg:group-hover/sidebar:hidden"
            : "hidden",
        )}
      />
    </h3>
  );
}

function NavBadge({ count, sidebarToggle }) {
  const label = formatNavBadgeCount(count);
  if (!label) return null;

  return (
    <span
      className={cn(
        "ml-auto inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-error-50 px-1.5 text-theme-xs font-medium text-error-600",
        sidebarToggle
          ? "lg:absolute lg:right-1.5 lg:top-1.5 lg:ml-0 lg:group-hover/sidebar:static lg:group-hover/sidebar:ml-auto"
          : "",
      )}
      aria-label={`${label} new notifications`}
    >
      {label}
    </span>
  );
}

function SidebarMenuItem({ item, sidebarToggle, onClose, isItemActive }) {
  const active = isItemActive(item);
  const iconClass = active ? tw.menuItemIconActive : tw.menuItemIconInactive;
  const labelClass = cn(
    "truncate",
    sidebarToggle
      ? "inline lg:hidden lg:group-hover/sidebar:inline"
      : "inline",
  );

  return (
    <li>
      <NavLink
        to={item.path}
        onClick={onClose}
        className={cn(
          tw.menuItem,
          "group",
          active ? tw.menuItemActive : tw.menuItemInactive,
        )}
      >
        <NavIcon name={item.icon} className={iconClass} />
        <span className={labelClass}>{item.label}</span>
        <NavBadge count={item.badge} sidebarToggle={sidebarToggle} />
      </NavLink>
    </li>
  );
}

function Sidebar({ groups, sidebarToggle, onClose }) {
  const { isItemActive } = useSidebarNav();

  return (
    <>
      {sidebarToggle ? (
        <button
          type="button"
          className="fixed inset-0 z-9998 bg-gray-900/50 lg:hidden"
          aria-label="Close sidebar"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={cn(
          "group/sidebar fixed left-0 top-0 z-9999 flex h-screen flex-col overflow-y-hidden border-r border-gray-200 bg-white px-5 transition-[width] duration-300 lg:static lg:translate-x-0",
          sidebarToggle
            ? "w-[290px] translate-x-0 lg:w-[90px] lg:hover:w-[290px]"
            : "-translate-x-full w-[290px] lg:translate-x-0",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2 pb-7 pt-8",
            sidebarToggle
              ? "justify-between lg:justify-center lg:group-hover/sidebar:justify-between"
              : "justify-between",
          )}
        >
          <NavLink to="/dashboard" onClick={onClose} className="flex items-center gap-2">
            <img
              src="/images/logo/logo-icon.svg"
              alt="Employee Management System"
              className="h-8 w-8"
            />
            <span
              className={cn(
                "text-lg font-semibold text-gray-800",
                sidebarToggle
                  ? "inline lg:hidden lg:group-hover/sidebar:inline"
                  : "inline",
              )}
            >
              EMP
            </span>
          </NavLink>
        </div>

        <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
          <nav>
            {groups.map((group) => (
              <div key={group.id}>
                <SidebarGroupTitle
                  title={group.title}
                  sidebarToggle={sidebarToggle}
                />
                <ul className="mb-6 flex flex-col gap-4">
                  {group.items.map((item) => (
                    <SidebarMenuItem
                      key={item.id}
                      item={item}
                      sidebarToggle={sidebarToggle}
                      onClose={onClose}
                      isItemActive={isItemActive}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
