import React, { useState, useEffect } from 'react';
import * as api from '../api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

const DiaryPage = () => {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [logs, setLogs] = useState([]);

  const [products, setProducts] = useState([]);
  const [dishes, setDishes] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState('');
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null); // Product or Dish object
  const [entryDetails, setEntryDetails] = useState({
    weight: '', // consumed weight
    cookedWeight: '', // for dishes
    isAteAll: true, // for dishes
  });

  useEffect(() => {
    fetchUsers();
    fetchProductsAndDishes();
  }, []);

  useEffect(() => {
    if (currentUser && date) {
      fetchLogs();
    }
  }, [currentUser, date]);

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
      if (data.length > 0 && !currentUser) {
        setCurrentUser(data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch users', error);
    }
  };

  const fetchProductsAndDishes = async () => {
    try {
      const [pData, dData] = await Promise.all([api.getProducts(), api.getDishes()]);
      setProducts(pData);
      setDishes(dData);
    } catch (error) {
      console.error('Failed to fetch data', error);
    }
  };

  const fetchLogs = async () => {
    try {
      const data = await api.getLogs(date, currentUser);
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch logs', error);
    }
  };

  const handleCreateUser = async () => {
    const name = prompt("Enter new user name:");
    if (name) {
      try {
        const newUser = await api.createUser(name);
        setUsers([...users, newUser]);
        setCurrentUser(newUser.id);
      } catch (error) {
        alert("Failed to create user");
      }
    }
  };

  const openAddModal = (mealType) => {
    setSelectedMealType(mealType);
    setSearch('');
    setSelectedItem(null);
    setEntryDetails({ weight: '', cookedWeight: '', isAteAll: true });
    setIsModalOpen(true);
  };

  const calculateDishRawWeight = (dish) => {
      if (!dish.ingredients) return 0;
      return dish.ingredients.reduce((sum, i) => sum + i.weight_raw, 0);
  };

  const handleSearchSelect = (item, type) => {
    setSelectedItem({ ...item, type }); // type: 'product' or 'dish'

    if (type === 'dish') {
      const defaultCooked = item.cooked_weight || calculateDishRawWeight(item);
      setEntryDetails({
        weight: '',
        cookedWeight: defaultCooked,
        isAteAll: true
      });
    } else {
      setEntryDetails({
        weight: '100', // default 100g
        cookedWeight: '',
        isAteAll: false
      });
    }
  };


  const handleAddEntry = async () => {
    if (!selectedItem) return;

    let payload = {
      user_id: currentUser,
      date: date,
      meal_type: selectedMealType,
      name: selectedItem.name,
      items: [],
      cooked_weight: 0,
      consumed_weight: 0,
    };

    if (selectedItem.type === 'product') {
      const weight = parseFloat(entryDetails.weight);
      payload.cooked_weight = weight;
      payload.consumed_weight = weight;
      payload.items = [{ product_id: selectedItem.id, weight_raw: weight }];
    } else {
      // Dish
      const cookedWeight = parseFloat(entryDetails.cookedWeight);
      const consumedWeight = entryDetails.isAteAll ? cookedWeight : parseFloat(entryDetails.weight);

      payload.cooked_weight = cookedWeight;
      payload.consumed_weight = consumedWeight;

      // Copy ingredients
      payload.items = selectedItem.ingredients.map(ing => ({
        product_id: ing.product_id,
        weight_raw: ing.weight_raw
      }));
    }

    try {
      await api.createLogEntry(payload);
      setIsModalOpen(false);
      fetchLogs();
    } catch (error) {
      console.error('Failed to add entry', error);
    }
  };

  const handleDeleteEntry = async (id) => {
      if (confirm('Delete this entry?')) {
          try {
              await api.deleteLogEntry(id);
              fetchLogs();
          } catch (error) {
              console.error('Failed to delete', error);
          }
      }
  };

  // Calculations
  const getDayTotals = () => {
    return logs.reduce((acc, log) => ({
      kcal: acc.kcal + (log.total_kcal || 0),
      protein: acc.protein + (log.total_protein || 0),
      fat: acc.fat + (log.total_fat || 0),
      carbs: acc.carbs + (log.total_carbs || 0),
    }), { kcal: 0, protein: 0, fat: 0, carbs: 0 });
  };

  const totals = getDayTotals();

  // Filtered search results
  const searchResults = search.length > 0 ? [
    ...products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(p => ({ ...p, type: 'product' })),
    ...dishes.filter(d => d.name.toLowerCase().includes(search.toLowerCase())).map(d => ({ ...d, type: 'dish' }))
  ] : [];

  return (
    <div className="space-y-6 pb-20">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 rounded shadow">
        <div className="flex items-end gap-2">
            <div className="flex-1">
                <Select
                    label="User"
                    value={currentUser}
                    onChange={(e) => setCurrentUser(e.target.value)}
                    options={users.map(u => ({ label: u.name, value: u.id }))}
                />
            </div>
            <Button onClick={handleCreateUser} variant="secondary" className="mb-[1px]">+</Button>
        </div>
        <div>
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      {/* Meal Sections */}
      {MEAL_TYPES.map(meal => {
        const mealLogs = logs.filter(l => l.meal_type === meal);
        const mealTotals = mealLogs.reduce((acc, log) => ({
             kcal: acc.kcal + (log.total_kcal || 0),
             protein: acc.protein + (log.total_protein || 0),
             fat: acc.fat + (log.total_fat || 0),
             carbs: acc.carbs + (log.total_carbs || 0),
        }), { kcal: 0, protein: 0, fat: 0, carbs: 0 });

        return (
          <div key={meal} className="bg-white rounded shadow overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold capitalize">{meal}</h2>
              <div className="text-sm text-gray-500">
                {Math.round(mealTotals.kcal)} kcal
              </div>
            </div>
            <div className="divide-y">
              {mealLogs.map(log => (
                <div key={log.id} className="p-4 flex justify-between items-center hover:bg-gray-50 group">
                  <div>
                    <div className="font-medium">{log.name}</div>
                    <div className="text-sm text-gray-500">
                       {Math.round(log.consumed_weight)}g consumed
                       {log.cooked_weight !== log.consumed_weight && ` (from ${Math.round(log.cooked_weight)}g)`}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="text-right text-sm">
                        <div>{Math.round(log.total_kcal)} kcal</div>
                        <div className="text-gray-400 text-xs">
                          P:{Math.round(log.total_protein)} F:{Math.round(log.total_fat)} C:{Math.round(log.total_carbs)}
                        </div>
                     </div>
                     <button
                        onClick={() => handleDeleteEntry(log.id)}
                        className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                     >
                        &times;
                     </button>
                  </div>
                </div>
              ))}
              {mealLogs.length === 0 && (
                <div className="p-4 text-center text-gray-400 text-sm italic">No entries</div>
              )}
            </div>
            <div className="p-2 bg-gray-50 border-t">
               <Button variant="ghost" className="w-full text-sm py-1" onClick={() => openAddModal(meal)}>
                 + Add Food
               </Button>
            </div>
          </div>
        );
      })}

      {/* Day Summary */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
         <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div className="font-bold text-lg">Day Total</div>
            <div className="flex gap-4 text-sm sm:text-base">
               <span className="font-bold text-blue-600">{Math.round(totals.kcal)} kcal</span>
               <span>P: {Math.round(totals.protein)}g</span>
               <span>F: {Math.round(totals.fat)}g</span>
               <span>C: {Math.round(totals.carbs)}g</span>
            </div>
         </div>
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Add to ${selectedMealType}`}
      >
        {!selectedItem ? (
          <div className="space-y-4">
            <Input
              placeholder="Search food..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
            <div className="max-h-60 overflow-y-auto divide-y">
              {searchResults.map(item => (
                <div
                   key={`${item.type}-${item.id}`}
                   className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between"
                   onClick={() => handleSearchSelect(item, item.type)}
                >
                   <span>{item.name}</span>
                   <span className="text-xs text-gray-500 uppercase border px-1 rounded">{item.type}</span>
                </div>
              ))}
              {search && searchResults.length === 0 && (
                 <div className="p-2 text-gray-500">No results found.</div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
               <h3 className="font-medium">{selectedItem.name}</h3>
               <button onClick={() => setSelectedItem(null)} className="text-sm text-blue-500">Change</button>
            </div>

            {selectedItem.type === 'dish' && (
               <div className="space-y-2">
                  <Input
                    label="Total Cooked Weight (g)"
                    type="number"
                    value={entryDetails.cookedWeight}
                    onChange={(e) => setEntryDetails({...entryDetails, cookedWeight: e.target.value})}
                  />
                  <div className="flex items-center space-x-2">
                     <input
                        type="checkbox"
                        checked={entryDetails.isAteAll}
                        onChange={(e) => setEntryDetails({...entryDetails, isAteAll: e.target.checked})}
                        className="h-4 w-4"
                     />
                     <span>I ate everything ({entryDetails.cookedWeight || 0}g)</span>
                  </div>
               </div>
            )}

            {(!entryDetails.isAteAll || selectedItem.type === 'product') && (
              <Input
                label="Consumed Weight (g)"
                type="number"
                value={entryDetails.weight}
                onChange={(e) => setEntryDetails({...entryDetails, weight: e.target.value})}
                autoFocus
              />
            )}

            <div className="flex justify-end pt-4">
               <Button onClick={handleAddEntry}>Add Entry</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DiaryPage;
