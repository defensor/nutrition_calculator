import React, { useState, useEffect } from 'react';
import * as api from '../api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import { useNotification } from '../context/NotificationContext';
import { useDialog } from '../context/DialogContext';

const DishesPage = () => {
  const { showNotification } = useNotification();
  const { confirm } = useDialog();
  const [dishes, setDishes] = useState([]);
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [isAutoWeight, setIsAutoWeight] = useState(true);
  const [cookedWeight, setCookedWeight] = useState(0);
  const [ingredients, setIngredients] = useState([]); // Array of { product_id, weight_raw, tempId, productName, productKcal... }

  // Ingredient Add State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [ingredientWeight, setIngredientWeight] = useState('');
  const [searchIngredient, setSearchIngredient] = useState(''); // Text input for search/create

  // Quick Create State
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [quickProduct, setQuickProduct] = useState({ name: '', kcal: 0, protein: 0, fat: 0, carbs: 0 });

  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDishes();
    fetchProducts();
  }, []);

  const fetchDishes = async () => {
    try {
      const data = await api.getDishes();
      setDishes(data);
    } catch (error) {
      console.error('Failed to fetch dishes', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products', error);
    }
  };

  const openCreateModal = () => {
    setEditingDish(null);
    setName('');
    setIsAutoWeight(true);
    setCookedWeight(0);
    setIngredients([]);
    setSelectedProductId('');
    setIngredientWeight('');
    setSearchIngredient('');
    setError(null);
    setIsDirty(false);
    setIsModalOpen(true);
  };

  const openEditModal = (dish) => {
    setEditingDish(dish);
    setName(dish.name);
    setIsAutoWeight(dish.is_cooked_weight_auto);
    setCookedWeight(dish.cooked_weight || 0);
    setError(null);
    setSearchIngredient('');

    const initialIngredients = dish.ingredients.map(ing => ({
      product_id: ing.product_id,
      weight_raw: ing.weight_raw,
      tempId: Math.random(),
      productName: ing.product ? ing.product.name : 'Unknown',
      productKcal: ing.product ? ing.product.kcal : 0,
    }));
    setIngredients(initialIngredients);

    setSelectedProductId('');
    setIngredientWeight('');
    setIsDirty(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = async () => {
    if (isDirty) {
      const ok = await confirm({
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. Are you sure you want to close?',
        confirmText: 'Discard',
        confirmVariant: 'danger'
      });
      if (!ok) return;
    }
    setIsModalOpen(false);
  };

  const addIngredient = () => {
    if (!selectedProductId || !ingredientWeight) return;

    const product = products.find(p => p.id === parseInt(selectedProductId));
    if (!product) return;

    setIngredients([
      ...ingredients,
      {
        product_id: product.id,
        weight_raw: parseFloat(ingredientWeight),
        tempId: Math.random(),
        productName: product.name,
        productKcal: product.kcal,
      }
    ]);
    setIsDirty(true);

    setSelectedProductId('');
    setIngredientWeight('');
    setSearchIngredient('');
  };

  const removeIngredient = (tempId) => {
    setIngredients(ingredients.filter(i => i.tempId !== tempId));
    setIsDirty(true);
  };

  const handleQuickCreate = async (e) => {
      e.preventDefault();
      try {
          const newProduct = await api.createProduct(quickProduct);
          setProducts([...products, newProduct]);

          // Select immediately
          setSelectedProductId(newProduct.id);
          setIsQuickCreateOpen(false);
          setQuickProduct({ name: '', kcal: 0, protein: 0, fat: 0, carbs: 0 });
      } catch (err) {
          showNotification('Failed to create product: ' + (err.response?.data?.detail || err.message), 'error');
      }
  };

  // Filtered products for ingredient selection
  const filteredProducts = products.filter(p =>
      p.name.toLowerCase().includes(searchIngredient.toLowerCase())
  );

  const calculateTotalRawWeight = () => {
    return ingredients.reduce((sum, item) => sum + item.weight_raw, 0);
  };

  const calculateDishMacros = () => {
    const rawWeight = calculateTotalRawWeight();
    const finalWeight = isAutoWeight ? rawWeight : parseFloat(cookedWeight) || rawWeight;

    if (finalWeight <= 0) return { kcal: 0 };

    let totalKcal = 0;
    ingredients.forEach(item => {
       const p = products.find(prod => prod.id === item.product_id);
       if (p) {
         totalKcal += (p.kcal * item.weight_raw) / 100;
       }
    });

    const factor = 100 / finalWeight;
    return {
      kcal: (totalKcal * factor).toFixed(1),
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name,
      is_cooked_weight_auto: isAutoWeight,
      cooked_weight: isAutoWeight ? null : parseFloat(cookedWeight),
      ingredients: ingredients.map(i => ({
        product_id: i.product_id,
        weight_raw: i.weight_raw
      }))
    };

    try {
      if (editingDish) {
        await api.updateDish(editingDish.id, payload);
      } else {
        await api.createDish(payload);
      }
      setIsDirty(false);
      setIsModalOpen(false);
      fetchDishes();
    } catch (err) {
      console.error('Failed to save dish', err);
      setError(err.response?.data?.detail || 'Failed to save dish');
    }
  };

  const handleDelete = async () => {
    if (!editingDish) return;
    const ok = await confirm({
      title: 'Delete Dish',
      message: `Are you sure you want to delete dish "${editingDish.name}"?`,
      confirmText: 'Delete',
      confirmVariant: 'danger'
    });
    if (!ok) return;

    try {
      await api.deleteDish(editingDish.id);
      setIsModalOpen(false);
      fetchDishes();
    } catch (err) {
       console.error('Failed to delete dish', err);
       setError(err.response?.data?.detail || 'Failed to delete dish');
    }
  };

  const macros = calculateDishMacros();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dishes</h1>
        <Button onClick={openCreateModal}>Create Dish</Button>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-md">
        <ul className="divide-y divide-gray-200">
          {dishes.map((dish) => (
            <li
              key={dish.id}
              className="px-6 py-4 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
              onClick={() => openEditModal(dish)}
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{dish.name}</p>
                <p className="text-sm text-gray-500">
                  Ingredients: {dish.ingredients.length} | Cooked: {dish.cooked_weight || 'Auto'}g
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={isQuickCreateOpen ? "Create New Ingredient" : (editingDish ? 'Edit Dish' : 'Create Dish')}
      >
        {isQuickCreateOpen ? (
           <form onSubmit={handleQuickCreate} className="space-y-4">
              <Input
                label="Name"
                value={quickProduct.name}
                onChange={(e) => setQuickProduct({...quickProduct, name: e.target.value})}
                required
                autoFocus
              />
              <div className="grid grid-cols-2 gap-4">
                 <Input label="Kcal" type="number" step="0.1" value={quickProduct.kcal} onChange={(e) => setQuickProduct({...quickProduct, kcal: parseFloat(e.target.value)})} />
                 <Input label="Protein" type="number" step="0.1" value={quickProduct.protein} onChange={(e) => setQuickProduct({...quickProduct, protein: parseFloat(e.target.value)})} />
                 <Input label="Fat" type="number" step="0.1" value={quickProduct.fat} onChange={(e) => setQuickProduct({...quickProduct, fat: parseFloat(e.target.value)})} />
                 <Input label="Carbs" type="number" step="0.1" value={quickProduct.carbs} onChange={(e) => setQuickProduct({...quickProduct, carbs: parseFloat(e.target.value)})} />
              </div>
              <div className="flex justify-between pt-4">
                 <Button variant="ghost" onClick={() => setIsQuickCreateOpen(false)}>Back</Button>
                 <Button type="submit">Create & Select</Button>
              </div>
           </form>
        ) : (
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <Input
            label="Dish Name"
            value={name}
            onChange={(e) => {
                setName(e.target.value);
                setIsDirty(true);
            }}
          />

          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Ingredients</h3>
            <div className="space-y-2 mb-4">
              {ingredients.map((item) => (
                <div key={item.tempId} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                  <span>{item.productName} ({item.weight_raw}g)</span>
                  <button onClick={() => removeIngredient(item.tempId)} className="text-red-500 hover:text-red-700">
                    &times;
                  </button>
                </div>
              ))}
              {ingredients.length === 0 && <p className="text-sm text-gray-500">No ingredients added.</p>}
            </div>

            <div className="flex flex-col space-y-2">
              {/* Ingredient Search / Select */}
              <div className="relative">
                  <Input
                      placeholder="Search or Select Product..."
                      value={searchIngredient}
                      onChange={(e) => {
                          setSearchIngredient(e.target.value);
                          setSelectedProductId(''); // Reset select if typing
                      }}
                  />
                  {/* Dropdown for filtering */}
                  {searchIngredient && !selectedProductId && (
                      <div className="absolute z-10 w-full bg-white border border-gray-300 mt-1 max-h-40 overflow-y-auto shadow-lg">
                          {filteredProducts.map(p => (
                              <div
                                  key={p.id}
                                  className="p-2 hover:bg-gray-100 cursor-pointer"
                                  onClick={() => {
                                      setSelectedProductId(p.id);
                                      setSearchIngredient(p.name);
                                  }}
                              >
                                  {p.name}
                              </div>
                          ))}
                          {filteredProducts.length === 0 && (
                              <div
                                  className="p-2 hover:bg-gray-100 cursor-pointer text-blue-600 font-medium"
                                  onClick={() => {
                                      setQuickProduct({...quickProduct, name: searchIngredient});
                                      setIsQuickCreateOpen(true);
                                  }}
                              >
                                  + Create "{searchIngredient}"
                              </div>
                          )}
                      </div>
                  )}
              </div>

              <div className="flex space-x-2 items-end">
                <div className="w-24">
                    <Input
                    label="Weight (g)"
                    type="number"
                    value={ingredientWeight}
                    onChange={(e) => setIngredientWeight(e.target.value)}
                    />
                </div>
                <Button onClick={addIngredient} variant="secondary" disabled={!selectedProductId}>Add</Button>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <label className="flex items-center space-x-2 mb-2">
              <input
                type="checkbox"
                checked={isAutoWeight}
                onChange={(e) => {
                    setIsAutoWeight(e.target.checked);
                    setIsDirty(true);
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Auto-calculate cooked weight (sum of raw)</span>
            </label>

            {!isAutoWeight && (
              <Input
                label="Final Cooked Weight (g)"
                type="number"
                value={cookedWeight}
                onChange={(e) => {
                    setCookedWeight(e.target.value);
                    setIsDirty(true);
                }}
              />
            )}

            <div className="mt-2 text-sm text-gray-600 bg-blue-50 p-2 rounded">
               <p>Total Raw Weight: {calculateTotalRawWeight()}g</p>
               <p>Calculated Caloric Density: <strong>{macros.kcal} kcal / 100g</strong></p>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <div>
              {editingDish && (
                 <Button variant="danger" onClick={handleDelete}>
                   Delete
                 </Button>
              )}
            </div>
            <div className="flex space-x-3">
              <Button variant="secondary" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>Save Dish</Button>
            </div>
          </div>
        </div>
        )}
      </Modal>
    </div>
  );
};

export default DishesPage;
