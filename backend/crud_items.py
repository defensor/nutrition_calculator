def add_log_entry_item(db: Session, entry_id: int, item: schemas.LogEntryItemCreate):
    db_item = models.LogEntryItem(
        log_entry_id=entry_id,
        product_id=item.product_id,
        weight_raw=item.weight_raw
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def update_log_entry_item(db: Session, item_id: int, update: schemas.LogEntryItemUpdate):
    db_item = db.query(models.LogEntryItem).filter(models.LogEntryItem.id == item_id).first()
    if not db_item:
        return None
    db_item.weight_raw = update.weight_raw
    db.commit()
    return db_item

def delete_log_entry_item(db: Session, item_id: int):
    db_item = db.query(models.LogEntryItem).filter(models.LogEntryItem.id == item_id).first()
    if db_item:
        db.delete(db_item)
        db.commit()
