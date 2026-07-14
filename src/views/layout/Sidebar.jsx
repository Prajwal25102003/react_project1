import { NavLink } from 'react-router-dom'
import { useSidebarNav } from '../../controllers/navController.js'
import { cn } from '../../utils/cn.js'
import { tw } from '../../utils/tw.js'
import { GroupDotsIcon, MenuArrowIcon, NavIcon } from '../icons/NavIcon.jsx'

function SidebarGroupTitle({ title, sidebarToggle }) {
  return (
    <h3 className="mb-4 text-xs uppercase leading-[20px] text-gray-400">
      <span
        className={cn(
          sidebarToggle
            ? 'hidden lg:group-hover/sidebar:inline'
            : 'inline',
        )}
      >
        {title}
      </span>
      <GroupDotsIcon
        className={cn(
          'mx-auto fill-current',
          sidebarToggle
            ? 'hidden lg:block lg:group-hover/sidebar:hidden'
            : 'hidden',
        )}
      />
    </h3>
  )
}

function SidebarMenuItem({
  item,
  sidebarToggle,
  onClose,
  isItemOpen,
  isItemActive,
  isChildActive,
  toggleSelected,
}) {
  const hasChildren = Boolean(item.children?.length)
  const active = isItemActive(item)
  const open = isItemOpen(item)
  const iconClass = active ? tw.menuItemIconActive : tw.menuItemIconInactive
  const labelClass = cn(
    sidebarToggle ? 'hidden lg:group-hover/sidebar:inline' : 'inline',
  )

  if (!hasChildren) {
    return (
      <li>
        <NavLink
          to={item.path}
          onClick={onClose}
          className={cn(
            tw.menuItem,
            'group',
            active ? tw.menuItemActive : tw.menuItemInactive,
          )}
        >
          <NavIcon name={item.icon} className={iconClass} />
          <span className={labelClass}>{item.label}</span>
        </NavLink>
      </li>
    )
  }

  return (
    <li>
      <button
        type="button"
        onClick={() => toggleSelected(item.id)}
        className={cn(
          tw.menuItem,
          'group w-full',
          active ? tw.menuItemActive : tw.menuItemInactive,
        )}
      >
        <NavIcon name={item.icon} className={iconClass} />
        <span className={labelClass}>{item.label}</span>
        <MenuArrowIcon
          className={cn(
            tw.menuItemArrow,
            open ? tw.menuItemArrowActive : tw.menuItemArrowInactive,
            sidebarToggle ? 'hidden lg:group-hover/sidebar:block' : 'block',
          )}
        />
      </button>

      <div className={cn('overflow-hidden', open ? 'block' : 'hidden')}>
        <ul
          className={cn(
            'mt-2 flex flex-col gap-1 pl-9',
            sidebarToggle ? 'hidden lg:group-hover/sidebar:flex' : 'flex',
          )}
        >
          {item.children.map((child) => (
            <li key={child.id}>
              <NavLink
                to={child.path}
                end={child.path === '/'}
                onClick={onClose}
                className={cn(
                  tw.menuDropdownItem,
                  'group',
                  isChildActive(child.path)
                    ? tw.menuDropdownItemActive
                    : tw.menuDropdownItemInactive,
                )}
              >
                {child.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </li>
  )
}

function Sidebar({ groups, promo, sidebarToggle, onClose }) {
  const { toggleSelected, isItemOpen, isItemActive, isChildActive } =
    useSidebarNav()

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
          'group/sidebar fixed left-0 top-0 z-9999 flex h-screen flex-col overflow-y-hidden border-r border-gray-200 bg-white px-5 transition-[width] duration-300 dark:border-gray-800 dark:bg-black lg:static lg:translate-x-0',
          sidebarToggle
            ? 'w-[290px] translate-x-0 lg:w-[90px] lg:hover:w-[290px]'
            : '-translate-x-full w-[290px] lg:translate-x-0',
        )}
      >
        <div
          className={cn(
            'flex items-center gap-2 pb-7 pt-8',
            sidebarToggle
              ? 'justify-center lg:group-hover/sidebar:justify-between'
              : 'justify-between',
          )}
        >
          <NavLink to="/" onClick={onClose}>
            <span
              className={cn(
                sidebarToggle
                  ? 'hidden lg:group-hover/sidebar:block'
                  : 'block',
              )}
            >
              <img
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Logo"
              />
              <img
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
              />
            </span>
            <img
              className={cn(
                sidebarToggle
                  ? 'hidden lg:block lg:group-hover/sidebar:hidden'
                  : 'hidden',
              )}
              src="/images/logo/logo-icon.svg"
              alt="Logo"
            />
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
                      isItemOpen={isItemOpen}
                      isItemActive={isItemActive}
                      isChildActive={isChildActive}
                      toggleSelected={toggleSelected}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <div
            className={cn(
              'mx-auto mb-10 w-full max-w-60 rounded-2xl bg-gray-50 px-4 py-5 text-center dark:bg-white/[0.03]',
              sidebarToggle ? 'lg:hidden lg:group-hover/sidebar:block' : '',
            )}
          >
            <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
              {promo.title}
            </h3>
            <p className="text-theme-sm mb-4 text-gray-500 dark:text-gray-400">
              {promo.description}
            </p>
            <a
              href={promo.ctaHref}
              target="_blank"
              rel="nofollow noreferrer"
              className="text-theme-sm flex items-center justify-center rounded-lg bg-brand-500 p-3 font-medium text-white hover:bg-brand-600"
            >
              {promo.ctaLabel}
            </a>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
