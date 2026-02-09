import React, { useState, useEffect } from 'react';
import * as api from '../api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    kcal: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products', error);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({ name: '', kcal: 0, protein: 0, fat: 0, carbs: 0 });
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      kcal: product.kcal,
      protein: product.protein,
      fat: product.fat,
      carbs: product.carbs,
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'name' ? value : parseFloat(value) || 0,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, formData);
      } else {
        await api.createProduct(formData);
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error('Failed to save product', err);
      setError(err.response?.data?.detail || 'Failed to save product');
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault(); // In case it's in a form
    if (!editingProduct) return;
    if (!confirm(`Delete product "${editingProduct.name}"?`)) return;

    try {
      await api.deleteProduct(editingProduct.id);
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error('Failed to delete product', err);
      setError(err.response?.data?.detail || 'Failed to delete product');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button onClick={openCreateModal}>Add Product</Button>
      </div>

      <div className="flex items-center space-x-4">
        <Input
          placeholder="Search products..."
          value={search}
          onChange={handleSearch}
          className="w-full max-w-sm"
        />
      </div>

      <div className="bg-white shadow overflow-hidden rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredProducts.map((product) => (
            <li
              key={product.id}
              className="px-6 py-4 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
              onClick={() => openEditModal(product)}
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{product.name}</p>
                <p className="text-sm text-gray-500">
                  {product.kcal} kcal | P: {product.protein} | F: {product.fat} | C: {product.carbs}
                </p>
              </div>
              <div className="text-gray-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </li>
          ))}
          {filteredProducts.length === 0 && (
            <li className="px-6 py-4 text-center text-gray-500">No products found.</li>
          )}
        </ul>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Create Product'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <Input
            label="Name"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            autoFocus
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Calories (kcal)"
              id="kcal"
              name="kcal"
              type="number"
              step="0.1"
              value={formData.kcal}
              onChange={handleInputChange}
            />
            <Input
              label="Protein (g)"
              id="protein"
              name="protein"
              type="number"
              step="0.1"
              value={formData.protein}
              onChange={handleInputChange}
            />
            <Input
              label="Fat (g)"
              id="fat"
              name="fat"
              type="number"
              step="0.1"
              value={formData.fat}
              onChange={handleInputChange}
            />
            <Input
              label="Carbs (g)"
              id="carbs"
              name="carbs"
              type="number"
              step="0.1"
              value={formData.carbs}
              onChange={handleInputChange}
            />
          </div>
          <div className="flex justify-between pt-4">
            <div>
              {editingProduct && (
                <Button variant="danger" onClick={handleDelete} type="button">
                  Delete
                </Button>
              )}
            </div>
            <div className="flex space-x-3">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProductsPage;
