type Props = {
  initials: string
}

export default function Avatar({ initials }: Props) {
  return (
    <div className="h-9 w-9 rounded-full bg-lp-secondary text-white flex items-center justify-center text-sm font-semibold shadow-card">
      {initials}
    </div>
  )
}
