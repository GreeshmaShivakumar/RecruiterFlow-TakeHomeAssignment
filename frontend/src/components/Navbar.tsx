import { NavLink } from 'react-router-dom'

function Navbar() {
  return (
    <header className="navbar">
      <NavLink className="brand" to="/">
        Trip Splitter
      </NavLink>
      <nav aria-label="Main navigation">
        <NavLink
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          end
          to="/"
        >
          Expenses
        </NavLink>
        <NavLink
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          to="/expenses/new"
        >
          Add expense
        </NavLink>
      </nav>
    </header>
  )
}

export default Navbar
