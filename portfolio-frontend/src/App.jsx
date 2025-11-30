import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Works from './pages/Works';
import Thoughts from './pages/Thoughts';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';
import WorkDetail from './pages/WorkDetail';
import ThoughtDetail from './pages/ThoughtDetail';
import Admin from './pages/Admin';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/admin/*" element={<Admin />} />
          <Route path="/*" element={
            <>
              <Header />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/works" element={<Works />} />
                <Route path="/works/:id" element={<WorkDetail />} />
                <Route path="/thoughts" element={<Thoughts />} />
                <Route path="/thoughts/:id" element={<ThoughtDetail />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/contact" element={<Contact />} />
              </Routes>
              <Footer />
            </>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

