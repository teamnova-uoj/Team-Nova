import "./home.css";
import Navbar from "../components/navbar";
import mangrove from "../assests/mangrove.png";

function Home(){

return(

<div className="home">

<Navbar/>

<div 
className="hero"
style={{backgroundImage:`url(${mangrove})`}}
>

<div className="login-box">

<h2>Admin Login</h2>

<form>

<label>Email Address</label>
<input type="email" placeholder="Email Address"/>

<label>Password</label>
<input type="password" placeholder="Password"/>

<button className="login-btn">Log In</button>

<p className="forgot">Forgot password?</p>

</form>

</div>

<div className="content">

<h1>Mangrove Guard</h1>

<h3>Monitoring Mangrove Ecosystem & Water Quality</h3>

<div className="info-box">

<p>
Welcome to Mangrove Guard, your comprehensive solution for monitoring and protecting mangrove ecosystems. We provide real-time data on water levels, salinity, temperature and battery status of monitoring devices.
</p>

<p>
Our mission is to ensure the health and preservation of vital mangrove forests through advanced monitoring and data analysis.
</p>

</div>

</div>

</div>

</div>

)

}

export default Home