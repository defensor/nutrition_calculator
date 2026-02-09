import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DiaryPage from './pages/DiaryPage';
import ProductsPage from './pages/ProductsPage';
import DishesPage from './pages/DishesPage';
import CalendarPage from './pages/CalendarPage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<CalendarPage />} />
          <Route path="/diary/:date" element={<DiaryPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/dishes" element={<DishesPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
