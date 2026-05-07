import "./home.css";
import "./contact.css";
import Navbar from "../components/navbar";
import mangrove from "../assests/mangrove.png";

function Contact() {
  return (
    <div className="home">

      <Navbar />

      <div
        className="hero"
        style={{ backgroundImage: `url(${mangrove})` }}
      >

        <div className="contact-container">

          {/* LEFT SIDE (3 boxes) */}
          <div className="contact-column">

            <div className="contact-box">
              <h3>Kavithra Nirmali</h3>
              <p>
                Email: 
                <a href="mailto:kvthrnrml@gmail.com"> kvthrnrml@gmail.com</a>
              </p>
              <p>Phone: 0704884982</p>
            </div>

            <div className="contact-box">
              <h3>Kasuni Nisansala</h3>
              <p>
                Email: 
                <a href="mailto:jknisansala2002@gmail.com"> jknisansala2002@gmail.com</a>
              </p>
              <p>Phone: 0769898757</p>
            </div>

            <div className="contact-box">
              <h3>Aruni Umeshika</h3>
              <p>
                Email: 
                <a href="mailto:umeshikarathnasiri@gmail.com"> umeshikarathnasiri@gmail.com</a>
              </p>
              <p>Phone: 0742513689</p>
            </div>

          </div>

          {/* RIGHT SIDE (2 boxes) */}
          <div className="contact-column">

            <div className="contact-box">
              <h3>Dulanga Nethmini</h3>
              <p>
                Email: 
                <a href="mailto:dulanga472@gmail.com"> dulanga472@gmail.com</a>
              </p>
              <p>Phone: 0769936854</p>
            </div>

            <div className="contact-box">
              <h3>Chandrika Dhananjani</h3>
              <p>
                Email: 
                <a href="mailto:chandrikakandepola088@gmail.com"> chandrikakandepola088@gmail.com</a>
              </p>
              <p>Phone: 0771827157</p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Contact;