import "./SiteDetails.css";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";

function NegomboLagoon() {

return(

<div className="site-page">

<div className="dashboard-navbar">

<div className="logo">
🌿 MangroveGuard
</div>

<div className="nav-links">
<Link to="/dashboard">Dashboard</Link>
<Link to="/sites">Sites</Link>
<Link to="/alerts">Alerts</Link>
<Link to="/about">About</Link>
<Link to="/contact">Contact</Link>
<Link to="/profile">Profile</Link>
</div>

</div>

<h2 className="site-title">
Negombo Lagoon
</h2>

<div className="details-container">

<div className="detail-card">

<h3>Water Level</h3>

<h2>2.4 m</h2>

</div>

<div className="detail-card">

<h3>Salinity</h3>

<h2>32 ppt</h2>

</div>

<div className="detail-card">

<h3>Temperature</h3>

<h2>29 °C</h2>

</div>

</div>

<div className="map-box">

<h3>Location</h3>

<iframe
title="Negombo Lagoon"
src="https://www.google.com/maps?q=Negombo+Lagoon&output=embed"
width="100%"
height="400"
loading="lazy">
</iframe>

</div>

<Footer />
</div>

)

}

export default NegomboLagoon;