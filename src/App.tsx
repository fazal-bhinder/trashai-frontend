import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; 
import { BuilderPage } from './pages/BuilderPage';
import { HomePage } from './pages/HomePage';


function App() {

  return (
    <div className="min-h-screen bg-white ">
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/builder" element={<BuilderPage />} />
        </Routes>
      </Router>  
    </div>
  );
}


export default App;
