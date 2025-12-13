import { Link } from 'react-router-dom'
import Card from '../components/Card'

export default function NotFound() {
  return (
    <Card className="p-6">
      <div className="text-lg font-bold text-lp-secondary">Page not found</div>
      <div className="text-sm text-black/60 mt-1">That route doesn’t exist in this prototype.</div>
      <Link
        to="/"
        className="inline-flex mt-4 rounded-xl bg-lp-secondary text-white px-4 py-2 text-sm font-semibold"
      >
        Go back to Dashboard
      </Link>
    </Card>
  )
}
