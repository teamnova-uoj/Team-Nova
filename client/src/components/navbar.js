import { Link } from "react-router-dom";
import "./navbar.css";

function Navbar() {
  return (
    <nav className="navbar">

      <div className="logo">🌿 MangroveGuard</div>

      <ul className="nav-links">
        <li><Link to="/">Home</Link></li>

        <li><Link to="/sites">Sites</Link></li>

        <li><Link to="/about">About Us</Link></li>

        <li><Link to="/contact">Contact Us</Link></li>
      </ul>

      <Link to="/register">
         <button className="register-btn">Register</button>
      </Link>

    </nav>
  );
}

export default Navbar;