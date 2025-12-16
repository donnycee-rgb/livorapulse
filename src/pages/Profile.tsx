import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Card from '../components/Card'
import PageHero from '../components/PageHero'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useAppStore } from '../store/useAppStore'

export default function Profile() {
  const user = useAppStore((s) => s.user)
  const updateProfile = useAppStore((s) => s.updateProfile)

  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [initials, setInitials] = useState(user.avatarInitials)
  const [saving, setSaving] = useState(false)

  const changed = useMemo(() => {
    return name !== user.name || email !== user.email || initials !== user.avatarInitials
  }, [email, initials, name, user.avatarInitials, user.email, user.name])

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHero title="Profile" subtitle="Manage your personal details." />

      <Card className="p-4 md:p-6">
        <div className="grid md:grid-cols-2 gap-4">
          <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input
            label="Avatar initials"
            value={initials}
            onChange={(e) => setInitials(e.target.value.toUpperCase().slice(0, 3))}
            helperText="Used for the avatar badge in the header"
          />
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              setName(user.name)
              setEmail(user.email)
              setInitials(user.avatarInitials)
            }}
            disabled={!changed || saving}
          >
            Discard
          </Button>

          <Button
            loading={saving}
            onClick={() => {
              setSaving(true)
              // Simulate a short save.
              setTimeout(() => {
                updateProfile({ name: name.trim() || user.name, email: email.trim() || user.email, avatarInitials: initials || user.avatarInitials })
                setSaving(false)
                toast.success('Profile updated')
              }, 350)
            }}
            disabled={!changed}
          >
            Save changes
          </Button>
        </div>
      </Card>
    </div>
  )
}
