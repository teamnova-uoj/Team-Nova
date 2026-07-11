import "./VisitorContactus.css";
import Navbar from "../components/navbar";
import mangrove from "../assests/mangrove.png";

function VisitorContactus() {
  return (
    <div className="visitor-contact-page">

      {/* Navbar */}
      <Navbar />


      {/* Full Screen Background Section */}

      <section
        className="visitor-contact-hero"
        style={{
          backgroundImage: `url(${mangrove})`
        }}
      >

        {/* Dark Overlay */}

        <div className="visitor-contact-overlay">


          {/* Contact Card */}

          <div className="visitor-contact-container">


            {/* Contact Information */}

            <div className="visitor-contact-info">

              <h2>
                📞 Contact Information
              </h2>


              <p>
                <strong>Email:</strong> mangroveguard@gmail.com
              </p>


              <p>
                <strong>Phone:</strong> +94 77 123 4567
              </p>


              <p>
                <strong>Address:</strong> University of Jaffna, Sri Lanka
              </p>


            </div>



            {/* Title */}

            <h1>
              Contact Us
            </h1>



            <p className="visitor-contact-text">

              Have questions or need assistance?
              Send us a message and our team will respond as soon as possible.

            </p>




            {/* Contact Form */}

            <form className="visitor-contact-form">


              <div className="input-row">


                <input
                  type="text"
                  placeholder="Full Name"
                />


                <input
                  type="email"
                  placeholder="Email Address"
                />


              </div>




              <input
                type="text"
                placeholder="Subject"
              />




              <textarea
                rows="4"
                placeholder="Write your message..."
              ></textarea>




              <button type="submit">
                Send Message
              </button>


            </form>



          </div>


        </div>


      </section>


    </div>
  );
}


export default VisitorContactus;