import { Link } from "react-router-dom";
import "./navbar.css";

function Navbar() {
  return (
    <nav className="navbar">

      <div className="logo">🌿 MangroveGuard</div>

      <ul className="nav-links">
        <li><Link to="/">Home</Link></li>

        

        <Link to="/visitor-sites">Sites</Link>
         
         <li><Link to="/visitor-about">About</Link></li>

        
         <li><Link to="/visitor-contactus">Contact</Link></li>
      </ul>

      <Link to="/register">
         <button className="register-btn">Register</button>
      </Link>

    </nav>
  );
}

export default Navbar;