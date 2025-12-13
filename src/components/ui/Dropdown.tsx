import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react'
import clsx from 'clsx'
import { Fragment } from 'react'

type Props = {
  button: React.ReactNode
  align?: 'left' | 'right'
  children: React.ReactNode
  widthClassName?: string
}

export default function Dropdown({ button, align = 'right', widthClassName = 'w-80', children }: Props) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <MenuButton as={Fragment}>{button}</MenuButton>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-150"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <MenuItems
          className={clsx(
            'absolute z-50 mt-2 origin-top rounded-2xl bg-white dark:bg-slate-950 shadow-card border border-black/10 dark:border-white/10 focus:outline-none overflow-hidden',
            widthClassName,
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {children}
        </MenuItems>
      </Transition>
    </Menu>
  )
}

export function DropdownItem({
  onClick,
  children,
  disabled = false,
}: {
  onClick?: () => void
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <MenuItem disabled={disabled}>
      {({ active }) => (
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={clsx(
            'w-full text-left px-4 py-2 text-sm transition',
            active ? 'bg-black/5 dark:bg-white/10' : '',
            disabled ? 'opacity-50 cursor-not-allowed' : 'text-black/80 dark:text-white/85',
          )}
        >
          {children}
        </button>
      )}
    </MenuItem>
  )
}
