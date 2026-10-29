import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <main>
      <h1>Page not found</h1>
      <p>The page you requested does not exist.</p>
      <Link to="/">Back to Expenses</Link>
    </main>
  )
}

export default NotFoundPage
