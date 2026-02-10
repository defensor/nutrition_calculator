const LogEntryView = ({ log, onDelete, onUpdate }) => {
    // If it's a single item (Product), render simple view
    // If it's a group (Dish), render grouped view
    // Actually, backend structure: items is always a list.
    // If items.length > 1 OR (items.length == 1 but name != product.name?), it's effectively a group.
    // But conceptually, even 1 item could be a "Dish".
    // Let's check log.items.length.

    // Helper to calculate item macros
    const calculateItemMacros = (item) => {
        if (!item.product) return { k: 0, p: 0, f: 0, c: 0 };
        const factor = item.weight_raw / 100;
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

    // Render as Group
    return (
        <div className="bg-white border rounded-lg mb-2 overflow-hidden shadow-sm">
            {/* Group Header */}
            <div className="bg-blue-50 px-4 py-2 border-b flex justify-between items-center">
                <div className="font-semibold text-blue-800">{log.name}</div>
                <div className="flex items-center gap-4">
                    <div className="text-right text-xs text-blue-600">
                        <span className="font-bold">{Math.round(log.total_kcal)} kcal</span>
                        <span className="ml-2">P:{Math.round(log.total_protein)} F:{Math.round(log.total_fat)} C:{Math.round(log.total_carbs)}</span>
                    </div>
                    <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => onDelete(log.id)}
                        className="text-red-400 hover:text-red-600 font-bold px-2"
                        title="Delete entire group"
                    >
                        &times;
                    </button>
                </div>
            </div>

            {/* Ingredients List */}
            <div className="p-2 space-y-2">
                {log.items.map(item => {
                    const macros = calculateItemMacros(item);
                    return (
                        <div key={item.id} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100">
                            <div className="flex-1">
                                <div className="font-medium text-sm">{item.product?.name || 'Unknown'}</div>
                                <div className="text-xs text-gray-400">
                                    {Math.round(macros.k)} kcal • P:{Math.round(macros.p)} F:{Math.round(macros.f)} C:{Math.round(macros.c)}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    className="w-16 px-1 py-1 border rounded text-right text-sm"
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
                                />
                                <span className="text-xs text-gray-500 w-4">g</span>
                                <button
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="text-gray-400 hover:text-red-500 px-1"
                                    title="Remove ingredient"
                                >
                                    &times;
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
