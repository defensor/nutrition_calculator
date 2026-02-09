# Logs
@app.post("/logs/", response_model=schemas.LogEntry)
def create_log_entry(entry: schemas.LogEntryCreate, db: Session = Depends(get_db)):
    db_entry = crud.create_log_entry(db=db, entry=entry)
    return calculate_log_macros(db_entry)

@app.get("/logs/{date_str}", response_model=List[schemas.LogEntry])
def read_log_entries(date_str: date, user_id: int, db: Session = Depends(get_db)):
    entries = crud.get_log_entries(db, user_id=user_id, date=date_str)
    return [calculate_log_macros(e) for e in entries]

@app.put("/logs/{entry_id}", response_model=schemas.LogEntry)
def update_log_entry(entry_id: int, update: schemas.LogEntryUpdate, db: Session = Depends(get_db)):
    db_entry = crud.update_log_entry(db, entry_id, update)
    if not db_entry:
        raise HTTPException(status_code=404, detail="Log entry not found")
    return calculate_log_macros(db_entry)

@app.delete("/logs/{entry_id}")
def delete_log_entry(entry_id: int, db: Session = Depends(get_db)):
    crud.delete_log_entry(db, entry_id)
    return {"ok": True}
