# Log Items
class LogEntryItemUpdate(BaseModel):
    weight_raw: float

class LogEntryItemCreate(BaseModel):
    product_id: int
    weight_raw: float
