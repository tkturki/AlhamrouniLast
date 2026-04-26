import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import AddItemPage from './pages/AddItemPage';
import SalesPage from './pages/SalesPage';
import InvoicePage from './pages/InvoicePage';
import SearchPage from './pages/SearchPage';
import ItemsPage from './pages/ItemsPage';
import InvoicesPage from './pages/InvoicesPage';
import LoginPage from './pages/LoginPage';
import GalleryPage from './pages/GalleryPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        <Route path="/add" element={<Layout><AddItemPage /></Layout>} />
        <Route path="/sales" element={<Layout><SalesPage /></Layout>} />
        <Route path="/invoice" element={<Layout><InvoicePage /></Layout>} />
        <Route path="/search" element={<Layout><SearchPage /></Layout>} />
        <Route path="/items" element={<Layout><ItemsPage /></Layout>} />
        <Route path="/invoices" element={<Layout><InvoicesPage /></Layout>} />
        <Route path="/gallery" element={<Layout><GalleryPage /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
