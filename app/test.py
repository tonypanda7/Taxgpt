from database.user_data import SessionLocal, UserFinancialData

db = SessionLocal()

print(db.query(UserFinancialData).all())