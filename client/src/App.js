import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Sites from "./pages/Sites";
import Register from "./pages/Register";
import UserDashboard from "./pages/UserDashboard";



function App() {
  return (
    <BrowserRouter>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sites" element={<Sites />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        
      </Routes>

    </BrowserRouter>
  );
}

export default App;