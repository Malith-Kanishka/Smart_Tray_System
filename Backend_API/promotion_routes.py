from fastapi import APIRouter, HTTPException
import pymysql
import os
from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': os.getenv('DB_PASSWORD', 'admin123'),
    'database': 'smart_tray',
    'cursorclass': pymysql.cursors.DictCursor
}

# --- Schemas ---
class SeasonalPromo(BaseModel):
    title: str
    discount: int
    startDate: str
    endDate: str

class DailyDiscount(BaseModel):
    productName: str
    originalPrice: float
    discount: int
    newPrice: float


def ensure_promotion_tables():
    connection = pymysql.connect(**DB_CONFIG)
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS seasonal_promotions (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    promoID VARCHAR(10) UNIQUE NOT NULL,
                    title VARCHAR(100) NOT NULL,
                    discount INT NOT NULL,
                    startDate DATE NOT NULL,
                    endDate DATE NOT NULL,
                    status VARCHAR(20) DEFAULT 'scheduled'
                )
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS daily_discounts (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    discountID VARCHAR(10) UNIQUE NOT NULL,
                    productName VARCHAR(100) NOT NULL,
                    originalPrice DECIMAL(10,2) NOT NULL,
                    discount INT NOT NULL,
                    newPrice DECIMAL(10,2) NOT NULL,
                    status VARCHAR(20) DEFAULT 'active',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            connection.commit()
    finally:
        connection.close()


ensure_promotion_tables()

# --- Helper Functions ---
def get_next_id(table, prefix, col):
    connection = pymysql.connect(**DB_CONFIG)
    try:
        with connection.cursor() as cursor:
            cursor.execute(f"SELECT {col} FROM {table} ORDER BY id DESC LIMIT 1")
            last = cursor.fetchone()
            if not last: return f"{prefix}001"
            last_num = int(last[col][1:])
            return f"{prefix}{str(last_num + 1).zfill(3)}"
    finally:
        connection.close()

# --- Seasonal Promotions Routes ---
@router.get("/promotions/seasonal")
async def get_seasonal():
    ensure_promotion_tables()
    connection = pymysql.connect(**DB_CONFIG)
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM seasonal_promotions")
            res = cursor.fetchall()
            today = date.today()
            # Recalculate and persist status for non-paused rows
            for p in res:
                if p['status'] != 'paused':
                    start = datetime.strptime(str(p['startDate']), '%Y-%m-%d').date()
                    end = datetime.strptime(str(p['endDate']), '%Y-%m-%d').date()
                    if today > end:
                        new_status = 'expired'
                    elif today >= start:
                        new_status = 'active'
                    else:
                        new_status = 'scheduled'
                    if p['status'] != new_status:
                        cursor.execute(
                            "UPDATE seasonal_promotions SET status = %s WHERE promoID = %s",
                            (new_status, p['promoID'])
                        )
                    p['status'] = new_status
            connection.commit()
            return res
    finally:
        connection.close()

@router.post("/promotions/seasonal/add")
async def add_seasonal(promo: SeasonalPromo):
    ensure_promotion_tables()
    p_id = get_next_id("seasonal_promotions", "P", "promoID")
    connection = pymysql.connect(**DB_CONFIG)
    try:
        with connection.cursor() as cursor:
            sql = "INSERT INTO seasonal_promotions (promoID, title, discount, startDate, endDate, status) VALUES (%s, %s, %s, %s, %s, %s)"
            cursor.execute(sql, (p_id, promo.title, promo.discount, promo.startDate, promo.endDate, 'scheduled'))
            connection.commit()
            return {"message": "Promo created"}
    finally:
        connection.close()

@router.delete("/promotions/seasonal/{id}")
async def delete_seasonal(id: str):
    ensure_promotion_tables()
    connection = pymysql.connect(**DB_CONFIG)
    try:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM seasonal_promotions WHERE promoID = %s", (id,))
            connection.commit()
            return {"message": "Deleted"}
    finally:
        connection.close()


@router.put("/promotions/seasonal/{id}")
async def update_seasonal(id: str, promo: SeasonalPromo):
    ensure_promotion_tables()
    today = date.today()
    start = datetime.strptime(promo.startDate, '%Y-%m-%d').date()
    end = datetime.strptime(promo.endDate, '%Y-%m-%d').date()
    if today > end:
        new_status = 'expired'
    elif today >= start:
        new_status = 'active'
    else:
        new_status = 'scheduled'
    connection = pymysql.connect(**DB_CONFIG)
    try:
        with connection.cursor() as cursor:
            sql = """
                UPDATE seasonal_promotions
                SET title = %s, discount = %s, startDate = %s, endDate = %s, status = %s
                WHERE promoID = %s
            """
            cursor.execute(sql, (promo.title, promo.discount, promo.startDate, promo.endDate, new_status, id))
            connection.commit()

            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Promotion not found")

            return {"message": "Promo updated", "status": new_status}
    finally:
        connection.close()


@router.put("/promotions/seasonal/{id}/pause")
async def toggle_pause_seasonal(id: str):
    ensure_promotion_tables()
    connection = pymysql.connect(**DB_CONFIG)
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT status, startDate, endDate FROM seasonal_promotions WHERE promoID = %s", (id,))
            promo = cursor.fetchone()
            if not promo:
                raise HTTPException(status_code=404, detail="Promotion not found")

            today = date.today()
            start = promo['startDate'] if isinstance(promo['startDate'], date) else datetime.strptime(str(promo['startDate']), '%Y-%m-%d').date()
            end = promo['endDate'] if isinstance(promo['endDate'], date) else datetime.strptime(str(promo['endDate']), '%Y-%m-%d').date()

            # Resolve the real current status (recalculate for non-paused rows in case DB is stale)
            if promo['status'] == 'paused':
                current_status = 'paused'
            elif today > end:
                current_status = 'expired'
            elif today >= start:
                current_status = 'active'
            else:
                current_status = 'scheduled'

            if current_status == 'active':
                new_status = 'paused'
            elif current_status == 'paused':
                if today > end:
                    new_status = 'expired'
                elif today >= start:
                    new_status = 'active'
                else:
                    new_status = 'scheduled'
            else:
                raise HTTPException(status_code=400, detail="Only active or paused promotions can be toggled")

            cursor.execute("UPDATE seasonal_promotions SET status = %s WHERE promoID = %s", (new_status, id))
            connection.commit()
            return {"message": f"Status updated to {new_status}", "status": new_status}
    finally:
        connection.close()

# --- Daily Discount Routes ---
@router.get("/promotions/daily")
async def get_daily():
    ensure_promotion_tables()
    connection = pymysql.connect(**DB_CONFIG)
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM daily_discounts")
            res = cursor.fetchall()
            today = date.today()

            # Daily discounts expire after the created day ends.
            for d in res:
                created_val = d.get('created_at')
                if not created_val:
                    continue

                if isinstance(created_val, datetime):
                    created_day = created_val.date()
                else:
                    created_day = datetime.strptime(str(created_val).split(' ')[0], '%Y-%m-%d').date()

                if created_day < today and d.get('status') != 'expired':
                    cursor.execute(
                        "UPDATE daily_discounts SET status = %s WHERE discountID = %s",
                        ('expired', d['discountID'])
                    )
                    d['status'] = 'expired'

            connection.commit()
            return res
    finally:
        connection.close()

@router.post("/promotions/daily/add")
async def add_daily(discount: DailyDiscount):
    ensure_promotion_tables()
    d_id = get_next_id("daily_discounts", "D", "discountID")
    connection = pymysql.connect(**DB_CONFIG)
    try:
        with connection.cursor() as cursor:
            sql = """INSERT INTO daily_discounts 
                     (discountID, productName, originalPrice, discount, newPrice, status) 
                     VALUES (%s, %s, %s, %s, %s, %s)"""
            cursor.execute(sql, (d_id, discount.productName, discount.originalPrice, discount.discount, discount.newPrice, 'active'))
            connection.commit()
            return {"message": "Discount added"}
    finally:
        connection.close()


@router.put("/promotions/daily/{id}")
async def update_daily(id: str, discount: DailyDiscount):
    ensure_promotion_tables()
    connection = pymysql.connect(**DB_CONFIG)
    try:
        with connection.cursor() as cursor:
            sql = """
                UPDATE daily_discounts
                SET productName = %s, originalPrice = %s, discount = %s, newPrice = %s
                WHERE discountID = %s
            """
            cursor.execute(
                sql,
                (discount.productName, discount.originalPrice, discount.discount, discount.newPrice, id)
            )
            connection.commit()

            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Discount not found")

            return {"message": "Discount updated"}
    finally:
        connection.close()


@router.put("/promotions/daily/{id}/pause")
async def toggle_pause_daily(id: str):
    ensure_promotion_tables()
    connection = pymysql.connect(**DB_CONFIG)
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT status FROM daily_discounts WHERE discountID = %s", (id,))
            discount = cursor.fetchone()
            if not discount:
                raise HTTPException(status_code=404, detail="Discount not found")

            current_status = (discount.get('status') or '').lower()
            if current_status == 'expired':
                raise HTTPException(status_code=400, detail="Expired discounts cannot be paused or resumed")

            new_status = 'paused' if current_status == 'active' else 'active'

            cursor.execute("UPDATE daily_discounts SET status = %s WHERE discountID = %s", (new_status, id))
            connection.commit()
            return {"message": f"Status updated to {new_status}", "status": new_status}
    finally:
        connection.close()


@router.delete("/promotions/daily/{id}")
async def delete_daily(id: str):
    ensure_promotion_tables()
    connection = pymysql.connect(**DB_CONFIG)
    try:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM daily_discounts WHERE discountID = %s", (id,))
            connection.commit()
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Discount not found")
            return {"message": "Discount deleted"}
    finally:
        connection.close()