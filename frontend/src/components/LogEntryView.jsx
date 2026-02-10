import React, { useState } from 'react';
import api from '../api';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Item for Ingredients
const SortableIngredient = ({ id, children }) => {
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

const LogEntryView = ({ log, onDelete, onUpdate, onAddIngredient }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValues, setEditValues] = useState({
        cooked_weight: log.cooked_weight || 0,
        consumed_weight: log.consumed_weight || 0
    });

    // Helper to calculate item macros
    const calculateItemMacros = (item) => {
        if (!item.product) return { k: 0, p: 0, f: 0, c: 0 };
        // If cooked_weight is 0 (or not set), use raw sum (no shrinkage)
        // But backend handles this via ratio.
        // Here we just display what backend sent? No, backend sends `total_kcal`.
        // But for individual items, we might want to show their contribution.
        // Let's rely on backend logic:
        // Backend: factor = (item.weight_raw * (consumed / cooked)) / 100
        // We can replicate or just trust backend values if we had item-level macros from backend.
        // We don't have item-level macros from backend, only total.
        // So we assume ratio.

        const ratio = log.cooked_weight > 0 ? (log.consumed_weight / log.cooked_weight) : 1;
        const consumedAmount = item.weight_raw * ratio;
        const factor = consumedAmount / 100;

        return {
            k: item.product.kcal * factor,
            p: item.product.protein * factor,
            f: item.product.fat * factor,
            c: item.product.carbs * factor
        };
    };

    const handleUpdateItem = async (itemId, weight) => {
        try {
            const updatedLog = await api.updateLogItem(itemId, { weight_raw: parseFloat(weight) });
            onUpdate(updatedLog);
        } catch (error) {
            console.error('Failed to update item', error);
        }
    };

    const handleDeleteItem = async (itemId) => {
        if (!confirm('Remove this ingredient?')) return;
        try {
            const updatedLog = await api.deleteLogItem(itemId);
            onUpdate(updatedLog);
        } catch (error) {
            console.error('Failed to delete item', error);
        }
    };

    const handleSaveHeader = async (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        try {
            const updatedLog = await api.updateLogEntry(log.id, {
                cooked_weight: parseFloat(editValues.cooked_weight),
                consumed_weight: parseFloat(editValues.consumed_weight)
            });
            onUpdate(updatedLog);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update log header', error);
        }
    };

    return (
        <div className="bg-white border rounded-lg mb-2 overflow-hidden shadow-sm flex flex-col">
            {/* Group Header */}
            <div className="bg-blue-50 px-4 py-2 border-b flex justify-between items-start">
                <div className="flex-1">
                    <div className="font-semibold text-blue-800 flex items-center gap-2">
                        {log.name}
                        <button
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={() => setIsEditing(!isEditing)}
                            className="text-xs text-blue-500 hover:text-blue-700 underline ml-2"
                        >
                            {isEditing ? 'Cancel' : 'Edit'}
                        </button>
                    </div>

                    {isEditing ? (
                        <div className="mt-2 text-sm space-y-1 relative z-50" onPointerDown={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                                <label className="w-24 text-gray-600">Cooked (Total):</label>
                                <input
                                    type="number"
                                    className="border rounded px-1 w-20"
                                    value={editValues.cooked_weight}
                                    onChange={(e) => setEditValues({...editValues, cooked_weight: e.target.value})}
                                /> g
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="w-24 text-gray-600">Consumed:</label>
                                <input
                                    type="number"
                                    className="border rounded px-1 w-20"
                                    value={editValues.consumed_weight}
                                    onChange={(e) => setEditValues({...editValues, consumed_weight: e.target.value})}
                                /> g
                            </div>
                            <button
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={handleSaveHeader}
                                className="mt-1 bg-blue-600 text-white px-2 py-0.5 rounded text-xs hover:bg-blue-700 cursor-pointer relative z-50"
                            >
                                Save
                            </button>
                        </div>
                    ) : (
                        <div className="text-xs text-gray-500 mt-1">
                            {log.cooked_weight > 0 && (
                                <span>Cooked: {log.cooked_weight}g • </span>
                            )}
                            <span>Ate: {log.consumed_weight}g</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-end gap-1">
                    <div className="text-right text-xs text-blue-600">
                        <span className="font-bold block">{Math.round(log.total_kcal)} kcal</span>
                        <span className="text-[10px] text-gray-500">
                            P:{Math.round(log.total_protein)} F:{Math.round(log.total_fat)} C:{Math.round(log.total_carbs)}
                        </span>
                    </div>
                    <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => onDelete(log.id)}
                        className="text-red-400 hover:text-red-600 font-bold px-2 text-lg leading-none"
                        title="Delete entire group"
                    >
                        &times;
                    </button>
                </div>
            </div>

            {/* Ingredients List */}
            <SortableContext
                items={log.items.map(i => `item-${i.id}`)}
                strategy={verticalListSortingStrategy}
            >
                <div className="p-2 space-y-2 flex-1">
                    {log.items.map((item) => {
                        const macros = calculateItemMacros(item);
                        return (
                            <SortableIngredient key={`item-${item.id}`} id={`item-${item.id}`}>
                                <div className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100 hover:border-blue-200 transition-colors">
                                    <div className="flex-1 cursor-grab active:cursor-grabbing">
                                        <div className="font-medium text-sm">{item.product?.name || 'Unknown'}</div>
                                        <div className="text-xs text-gray-400">
                                            {Math.round(macros.k)} kcal
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2" onPointerDown={(e) => e.stopPropagation()}>
                                        <input
                                            type="number"
                                            className="w-16 px-1 py-1 border rounded text-right text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            defaultValue={item.weight_raw}
                                            onBlur={(e) => {
                                                const val = parseFloat(e.target.value);
                                                if (!isNaN(val) && val !== item.weight_raw) {
                                                    handleUpdateItem(item.id, val);
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.target.blur();
                                                }
                                            }}
                                            title="Raw weight of ingredient"
                                        />
                                        <span className="text-xs text-gray-500 w-4">g</span>
                                        <button
                                            onClick={() => handleDeleteItem(item.id)}
                                            className="text-gray-400 hover:text-red-500 px-1 font-bold"
                                            title="Remove ingredient"
                                        >
                                            &times;
                                        </button>
                                    </div>
                                </div>
                            </SortableIngredient>
                        );
                    })}

                    {/* Add Ingredient Button */}
                    <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => onAddIngredient(log.id)}
                        className="w-full py-1 text-center text-xs text-blue-500 hover:bg-blue-50 border border-dashed border-blue-200 rounded"
                    >
                        + Add Ingredient
                    </button>
                </div>
            </SortableContext>
        </div>
    );
};

export default LogEntryView;
