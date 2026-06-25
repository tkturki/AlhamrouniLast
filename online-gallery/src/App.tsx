import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PublicGalleryPage from './pages/PublicGalleryPage';
import ContactPage from './pages/ContactPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicGalleryPage />} />
        <Route path="/shop" element={<PublicGalleryPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
