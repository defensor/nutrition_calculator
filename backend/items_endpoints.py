@app.post("/logs/{entry_id}/items", response_model=schemas.LogEntry)
def add_log_entry_item(entry_id: int, item: schemas.LogEntryItemCreate, db: Session = Depends(get_db)):
    crud.add_log_entry_item(db, entry_id, item)
    # Return updated log entry to reflect changes in totals
    db_entry = crud.get_log_entry(db, entry_id)
    return calculate_log_macros(db_entry)

@app.put("/log-items/{item_id}", response_model=schemas.LogEntry)
def update_log_entry_item(item_id: int, update: schemas.LogEntryItemUpdate, db: Session = Depends(get_db)):
    db_item = crud.update_log_entry_item(db, item_id, update)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    # Return updated log entry
    db_entry = crud.get_log_entry(db, db_item.log_entry_id)
    return calculate_log_macros(db_entry)

@app.delete("/log-items/{item_id}", response_model=schemas.LogEntry)
def delete_log_entry_item(item_id: int, db: Session = Depends(get_db)):
    # Get entry id before delete
    db_item = db.query(models.LogEntryItem).filter(models.LogEntryItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    entry_id = db_item.log_entry_id

    crud.delete_log_entry_item(db, item_id)

    db_entry = crud.get_log_entry(db, entry_id)
    return calculate_log_macros(db_entry)
