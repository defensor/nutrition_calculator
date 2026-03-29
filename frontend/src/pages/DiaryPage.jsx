import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import Calendar from 'react-calendar';
import '../Calendar.css';
import * as api from '../api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import { useUser } from '../context/UserContext';
import { useNotification } from '../context/NotificationContext';
import { useDialog } from '../context/DialogContext';
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

import LogEntryView from '../components/LogEntryView';

// Sortable Item Component
const SortableItem = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

const DiaryPage = () => {
  const { date: routeDate } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const { showNotification } = useNotification();
  const { confirm } = useDialog();

  const date = routeDate || new Date().toISOString().split('T')[0];

  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [dishes, setDishes] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState('');
  const [targetLogId, setTargetLogId] = useState(null); // ID of log to add item to

  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [entryDetails, setEntryDetails] = useState({
    weight: '',
    cookedWeight: '',
    isAteAll: true,
  });

  // Quick Create State
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [quickProduct, setQuickProduct] = useState({ name: '', kcal: 0, protein: 0, fat: 0, fiber: 0, carbs: 0 });
  const [activeDragId, setActiveDragId] = useState(null);

  useEffect(() => {
    fetchProductsAndDishes();
  }, []);

  useEffect(() => {
    if (currentUser && date) {
      fetchLogs();
    }
  }, [currentUser, date]);

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
      const statsData = await api.getStats(date, currentUser);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch logs', error);
    }
  };

  const handleDateChange = (newDate) => {
      navigate(`/diary/${format(newDate, 'yyyy-MM-dd')}`);
  };

  const openAddModal = (mealType, logId = null) => {
    setSelectedMealType(mealType);
    setTargetLogId(logId); // If set, we are adding to a specific log (dish)
    setSearch('');
    setSelectedItem(null);
    setEntryDetails({ weight: '', cookedWeight: '', isAteAll: true });
    setIsModalOpen(true);
    setIsQuickCreateOpen(false);
  };

  const calculateDishRawWeight = (dish) => {
      if (!dish.ingredients) return 0;
      return dish.ingredients.reduce((sum, i) => sum + i.weight_raw, 0);
  };

  const handleSearchSelect = (item, type) => {
    setSelectedItem({ ...item, type });

    // If we are adding to a specific log, we only need weight
    if (targetLogId) {
        setEntryDetails({
            weight: '100',
            cookedWeight: '',
            isAteAll: false
        });
        return;
    }

    if (type === 'dish') {
      const defaultCooked = item.cooked_weight || calculateDishRawWeight(item);
      setEntryDetails({
        weight: '',
        cookedWeight: defaultCooked,
        isAteAll: true
      });
    } else {
      setEntryDetails({
        weight: '100',
        cookedWeight: '',
        isAteAll: false
      });
    }
  };

  const handleQuickCreate = async (e) => {
      e.preventDefault();
      try {
          const newProduct = await api.createProduct(quickProduct);
          setProducts([...products, newProduct]);
          handleSearchSelect(newProduct, 'product');
          setIsQuickCreateOpen(false);
          setQuickProduct({ name: '', kcal: 0, protein: 0, fat: 0, fiber: 0, carbs: 0 });
      } catch (error) {
          console.error('Failed to create product', error);
          showNotification('Failed to create product', 'error');
      }
  };

  const handleAddEntry = async () => {
    if (!selectedItem) return;

    try {
        if (targetLogId) {
            // Add item to existing log
            const weight = parseFloat(entryDetails.weight);
            await api.addLogItem(targetLogId, {
                product_id: selectedItem.id,
                weight_raw: weight
            });
        } else {
            // Create new log entry
            let payload = {
              user_id: currentUser,
              date: date,
              meal_type: selectedMealType,
              name: selectedItem.name,
              items: [],
              cooked_weight: 0,
              consumed_weight: 0,
              is_cooked_weight_auto: true, // Default true for new entries
              is_consumed_weight_auto: true  // Default true for new entries
            };

            if (selectedItem.type === 'product') {
              const weight = parseFloat(entryDetails.weight);
              payload.cooked_weight = weight;
              payload.consumed_weight = weight;
              payload.items = [{ product_id: selectedItem.id, weight_raw: weight }];
            } else {
              const cookedWeight = parseFloat(entryDetails.cookedWeight);
              const consumedWeight = entryDetails.isAteAll ? cookedWeight : parseFloat(entryDetails.weight);

              payload.cooked_weight = cookedWeight;
              payload.consumed_weight = consumedWeight;

              // Determine flags
              // If user modified cooked weight from default/auto, we might want to set is_cooked_weight_auto=false?
              // The backend defaults to true.
              // Logic: If user specifically entered a cooked weight that differs from sum of raw... but here we don't know sum of raw easily without calculation.
              // Simpler: If user checks "I ate everything", is_consumed_weight_auto = true.
              payload.is_consumed_weight_auto = entryDetails.isAteAll;

              // For cooked weight, typically when adding a dish we assume the weight entered IS the cooked weight.
              // If it matches the raw sum, it's "auto".
              // But explicit user input usually overrides "auto".
              // HOWEVER, the user requirement says: "I choose auto calc... I add dish... then I edit ingredients -> weight should recalc".
              // This implies when adding, we should have an option "Auto calculate cooked weight".
              // In this simplified modal, we don't have that checkbox.
              // Let's assume for Dishes, we default is_cooked_weight_auto = True UNLESS the user changed the cooked weight field manually?
              // But the user might just be confirming the default.
              // Let's set it to True by default in backend. If we pass a specific cooked_weight here, backend update logic disables auto.
              // But create logic uses the passed value.
              // If we want to support the usecase "add dish, then edit ingredients -> recalc", we should set is_cooked_weight_auto=True.
              // But we also pass a cooked_weight. The backend create_log_entry uses both.
              // If is_cooked_weight_auto is True, backend recalculates cooked_weight immediately after creation based on ingredients.
              // So the value passed in cooked_weight might be overwritten if is_cooked_weight_auto=True.
              // This is correct behavior for "Auto".
              // So we should probably let the user decide in the modal, OR default to Auto.
              // Given the requirement "options... should be saved", we should probably default to Auto.
              // But if the Dish definition has a manual cooked weight, maybe we should respect that?
              // The `Dish` model has `is_cooked_weight_auto`. We should copy that.

              if (selectedItem.type === 'dish') {
                  payload.is_cooked_weight_auto = selectedItem.is_cooked_weight_auto;
                  // If dish template was manual, we use manual. If auto, we use auto.
              }

              payload.items = selectedItem.ingredients.map(ing => ({
                product_id: ing.product_id,
                weight_raw: ing.weight_raw
              }));
            }
            await api.createLogEntry(payload);
        }
        setIsModalOpen(false);
        fetchLogs();
    } catch (error) {
      console.error('Failed to add entry', error);
    }
  };

  const handleDeleteEntry = async (id) => {
      const ok = await confirm({
          title: 'Delete Entry',
          message: 'Are you sure you want to delete this diary entry?',
          confirmText: 'Delete',
          confirmVariant: 'danger'
      });
      if (ok) {
          try {
              await api.deleteLogEntry(id);
              fetchLogs();
          } catch (error) {
              console.error('Failed to delete', error);
          }
      }
  };

  const handleLogUpdate = (updatedLog) => {
      setLogs(logs.map(l => l.id === updatedLog.id ? updatedLog : l));
  };

  const handleDragStart = (event) => {
      setActiveDragId(event.active.id);
  };

  const handleDragEnd = async (event) => {
      const { active, over } = event;
      setActiveDragId(null);

      if (!over) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      // Case 1: Dragging a Log Entry (Meal reordering)
      if (activeId.startsWith('log-')) {
          let newMealType = null;
          if (MEAL_TYPES.includes(overId)) {
              newMealType = overId;
          } else if (overId.startsWith('log-')) {
              // Dropped over another log -> check its meal type
              const overLogId = parseInt(overId.replace('log-', ''));
              const overLog = logs.find(l => l.id === overLogId);
              if (overLog) {
                  newMealType = overLog.meal_type;
              }
          }

          if (newMealType) {
              const logId = parseInt(activeId.replace('log-', ''));
              const log = logs.find(l => l.id === logId);
              if (log && log.meal_type !== newMealType) {
                  try {
                      // Optimistic Update
                      const updatedLogs = logs.map(l => l.id === logId ? { ...l, meal_type: newMealType } : l);
                      setLogs(updatedLogs);
                      await api.updateLogEntry(logId, { meal_type: newMealType });
                      fetchLogs(); // Sync to be sure
                  } catch (error) {
                      console.error('Failed to move item', error);
                      fetchLogs(); // Revert
                  }
              }
          }
      }
      // Case 2: Dragging an Ingredient (Item)
      else if (activeId.startsWith('item-')) {
          const itemId = parseInt(activeId.replace('item-', ''));
          // Find source log
          const sourceLog = logs.find(log => log.items.some(i => i.id === itemId));
          if (!sourceLog) return;
          const sourceItem = sourceLog.items.find(i => i.id === itemId);

          // Identify Target
          if (overId.startsWith('log-')) {
              // Target is a Dish/Log
              const targetLogId = parseInt(overId.replace('log-', ''));
              if (sourceLog.id === targetLogId) return; // Dropped on self

              try {
                  await api.updateLogItem(itemId, { log_entry_id: targetLogId });
                  fetchLogs();
              } catch (e) {
                  console.error("Failed to move item to log", e);
              }
          } else if (MEAL_TYPES.includes(overId)) {
              // Target is a Meal Zone
              // Move to root: Create new Log Entry, Delete old Item
              // Verify we are actually moving out (if already in a single-item log in this meal, no-op?)
              // But simpler to just always execute logic.
              try {
                  const payload = {
                    user_id: currentUser,
                    date: date,
                    meal_type: overId,
                    name: sourceItem.product?.name || 'Item',
                    cooked_weight: sourceItem.weight_raw,
                    consumed_weight: sourceItem.weight_raw,
                    items: [{
                        product_id: sourceItem.product_id,
                        weight_raw: sourceItem.weight_raw
                    }]
                  };
                  await api.createLogEntry(payload);
                  await api.deleteLogItem(itemId);
                  fetchLogs();
              } catch (e) {
                   console.error("Failed to move item to meal root", e);
              }
          }
      }
  };


  const MACROS = ['kcal', 'protein', 'fat', 'fiber', 'carbs'];

  const calculateMacrosSum = (logsArray) => {
    return logsArray.reduce((acc, log) => {
      MACROS.forEach(m => {
        acc[m] = acc[m] + (log[`total_${m}`] || 0);
      });
      return acc;
    }, { kcal: 0, protein: 0, fat: 0, fiber: 0, carbs: 0 });
  };

  const getDayTotals = () => {
    return calculateMacrosSum(logs);
  };

  const totals = getDayTotals();
  const searchResults = search.length > 0 ? [
    ...products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(p => ({ ...p, type: 'product' })),
    ...(!targetLogId ? dishes.filter(d => d.name.toLowerCase().includes(search.toLowerCase())).map(d => ({ ...d, type: 'dish' })) : [])
  ] : [];

  const calendarDate = new Date(date);

  return (
    <div className="flex flex-col xl:flex-row gap-6 pb-20 items-start">
      {/* Left sidebar - Calendar and Stats */}
      <div className="w-full xl:w-80 flex-shrink-0 flex flex-col gap-6 sticky top-4">
        {/* Calendar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Select Date</h2>
            <div className="flex justify-center">
              <Calendar
                  onChange={handleDateChange}
                  value={calendarDate}
                  className="mx-auto rounded-lg border-0 shadow-sm"
              />
            </div>
        </div>

        {/* Stats Placeholder */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
           <h2 className="text-xl font-bold mb-4 text-gray-800">Statistics</h2>
           {stats && (
             <div className="space-y-4">
               <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                 <div className="text-sm font-semibold text-green-800 mb-2">Weekly Average</div>
                 <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm text-gray-700">
                   <div>Kcal: <span className="font-bold text-gray-900">{Math.round(stats.weekly.kcal)}</span></div>
                   <div>Protein: <span className="font-bold text-gray-900">{Math.round(stats.weekly.protein)}g</span></div>
                   <div>Fat: <span className="font-bold text-gray-900">{Math.round(stats.weekly.fat)}g</span></div>
                   <div>Carbs: <span className="font-bold text-gray-900">{Math.round(stats.weekly.carbs)}g</span></div>
                   <div>Fiber: <span className="font-bold text-gray-900">{Math.round(stats.weekly.fiber)}g</span></div>
                 </div>
               </div>
             </div>
           )}
        </div>
      </div>

      {/* Main Content - Diary */}
      <div className="flex-1 w-full space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100 items-center">
            <h2 className="text-2xl font-bold text-gray-800">Diary for {format(calendarDate, 'MMMM d, yyyy')}</h2>
            {/* The old date picker is optional now, but keeping it for manual entry can be useful */}
        </div>


      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
          {MEAL_TYPES.map(meal => {
            const mealLogs = logs.filter(l => l.meal_type === meal);
            const mealTotals = calculateMacrosSum(mealLogs);

            return (
              <SortableContext
                  key={meal}
                  id={meal}
                  items={mealLogs.map(l => `log-${l.id}`)}
                  strategy={verticalListSortingStrategy}
              >
                  <div className="bg-white rounded shadow overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center" id={meal}>
                      <h2 className="text-lg font-semibold capitalize">{meal}</h2>
                      <div className="text-sm text-gray-500">
                        {Math.round(mealTotals.kcal)} kcal • P: {Math.round(mealTotals.protein)}g • F: {Math.round(mealTotals.fat)}g • Fi: {Math.round(mealTotals.fiber)}g • C: {Math.round(mealTotals.carbs)}g
                      </div>
                    </div>
                    <div className="divide-y min-h-[50px] bg-white">
                      {mealLogs.map(log => (
                        <SortableItem key={`log-${log.id}`} id={`log-${log.id}`}>
                            <LogEntryView
                                log={log}
                                onDelete={handleDeleteEntry}
                                onUpdate={handleLogUpdate}
                                onAddIngredient={(logId) => openAddModal(meal, logId)}
                            />
                        </SortableItem>
                      ))}
                      {mealLogs.length === 0 && (
                         <SortableItem id={meal}>
                            <div className="p-4 text-center text-gray-400 text-sm italic h-full">Drag items here</div>
                         </SortableItem>
                      )}
                    </div>
                    <div className="p-2 bg-gray-50 border-t">
                       <Button variant="ghost" className="w-full text-sm py-1" onClick={() => openAddModal(meal)}>
                         + Add Food
                       </Button>
                    </div>
                  </div>
              </SortableContext>
            );
          })}

          <DragOverlay>
              {activeDragId ? (
                  <div className="bg-white p-4 shadow-lg rounded border opacity-80 w-full">
                      {activeDragId.startsWith('log-') ? 'Moving Meal...' : 'Moving Ingredient...'}
                  </div>
              ) : null}
          </DragOverlay>
      </DndContext>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg z-10">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex justify-between items-center">
            <div className="font-bold text-lg">Day Total</div>
            <div className="flex gap-4 text-sm sm:text-base">
               <span className="font-bold text-blue-600">{Math.round(totals.kcal)} kcal</span>
               <span>P: {Math.round(totals.protein)}g</span>
               <span>F: {Math.round(totals.fat)}g</span>
               <span>C: {Math.round(totals.carbs)}g</span>
            </div>
         </div>
      </div>

      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isQuickCreateOpen ? "Create New Product" : (targetLogId ? "Add Ingredient" : `Add to ${selectedMealType}`)}
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
                  <Input label="Fiber" type="number" step="0.1" value={quickProduct.fiber} onChange={(e) => setQuickProduct({...quickProduct, fiber: parseFloat(e.target.value)})} />
                 <Input label="Carbs" type="number" step="0.1" value={quickProduct.carbs} onChange={(e) => setQuickProduct({...quickProduct, carbs: parseFloat(e.target.value)})} />
              </div>
              <div className="flex justify-between pt-4">
                 <Button variant="ghost" onClick={() => setIsQuickCreateOpen(false)}>Back</Button>
                 <Button type="submit">Create & Select</Button>
              </div>
           </form>
        ) : !selectedItem ? (
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
                 <div className="p-4 text-center">
                    <p className="text-gray-500 mb-2">No results found.</p>
                    <Button onClick={() => {
                        setQuickProduct({ ...quickProduct, name: search });
                        setIsQuickCreateOpen(true);
                    }}>
                       Create "{search}"
                    </Button>
                 </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
               <h3 className="font-medium">{selectedItem.name}</h3>
               <button onClick={() => setSelectedItem(null)} className="text-sm text-blue-500">Change</button>
            </div>

            {/* If adding ingredient to existing log, only show weight */}
            {targetLogId ? (
                <div className="space-y-2">
                    <Input
                        label="Weight (g)"
                        type="number"
                        value={entryDetails.weight}
                        onChange={(e) => setEntryDetails({...entryDetails, weight: e.target.value})}
                        autoFocus
                    />
                </div>
            ) : (
                <>
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
                </>
            )}

            <div className="flex justify-end pt-4">
               <Button onClick={handleAddEntry}>
                   {targetLogId ? 'Add Ingredient' : 'Add Entry'}
               </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DiaryPage;
