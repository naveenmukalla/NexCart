
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import mysql.connector
import bcrypt
import random
from datetime import datetime, timedelta
import smtplib
from email.message import EmailMessage
import json
import uuid
import os



# ===============================
# FILE UPLOAD CONFIG
# ===============================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads", "products")

# create folder automatically if not exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


app = Flask(__name__)
CORS(app)

# ===============================
# EMAIL CONFIG
# ===============================

# EMAIL_ADDRESS = "naveenmukalla07@gmail.com"
# EMAIL_PASSWORD = "ozsxuhqpjhifjuop"   # ⚠️ regenerate later for security


EMAIL_ADDRESS = "nexcartshopping.in@gmail.com"
EMAIL_PASSWORD = "iowwtrcaxsiwhlbz" 
# ===============================
# EMAIL HELPER FUNCTION
# ===============================
def send_otp_email(to_email, otp):
    msg = EmailMessage()
    msg["Subject"] = "NexCart Password Reset OTP"
    msg["From"] = EMAIL_ADDRESS
    msg["To"] = to_email

    msg.set_content(f"""
Hello,

Your NexCart password reset OTP is:

{otp}

This OTP is valid for 5 minutes.
Do not share it with anyone.

– NexCart Team
""")

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        server.send_message(msg)


# ===============================
# DATABASE CONNECTION
# ===============================
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="nexcart"
    )


# ===============================
# SIGNUP
# ===============================
@app.route("/signup", methods=["POST"])
def signup():
    data = request.json
    fullname = data.get("fullname")
    emailphone = data.get("emailphone")
    password = data.get("password")

    if not fullname or not emailphone or not password:
        return jsonify({"message": "All fields required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id FROM users WHERE emailphone=%s",
        (emailphone,)
    )

    if cursor.fetchone():
        cursor.close()
        conn.close()
        return jsonify({"message": "User already exists"}), 409

    hashed_password = bcrypt.hashpw(
        password.encode(), bcrypt.gensalt()
    ).decode()

    cursor.execute(
        "INSERT INTO users (fullname, emailphone, password) VALUES (%s,%s,%s)",
        (fullname, emailphone, hashed_password)
    )

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Signup successful"}), 201


# ===============================
# LOGIN
# ===============================
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    emailphone = data.get("email")
    password = data.get("password")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT id, fullname, emailphone, password, status FROM users WHERE emailphone=%s",
        (emailphone,)
    )

    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if not user:
        return jsonify({"message": "Invalid email or password"}), 401

    if user["status"] == "blocked":
        return jsonify({"message": "Your account is blocked"}), 403

    if user["status"] == "terminated":
        return jsonify({"message": "Your account is terminated"}), 403

    if not bcrypt.checkpw(password.encode(), user["password"].encode()):
        return jsonify({"message": "Invalid email or password"}), 401

    return jsonify({
        "user": {
            "id": user["id"], 
            "emailphone": user["emailphone"],
            "status": user["status"],
            "name": user["fullname"]
        }
    }), 200


# ===============================
# ===============================
# ADMIN → GET ALL USERS (WITH ORDER COUNT)
# ===============================
@app.route("/admin/users", methods=["GET"])
def admin_users():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            u.id,
            u.fullname,
            u.emailphone,
            u.status,
            COUNT(o.id) AS order_count
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        GROUP BY u.id
    """)

    users = cursor.fetchall()
    cursor.close()
    conn.close()

    return jsonify(users), 200

# ===============================
# ADMIN → CHANGE USER STATUS
# ===============================
@app.route("/admin/user/status", methods=["POST"])
def change_user_status():
    data = request.json
    user_id = data.get("id")
    status = data.get("status")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "UPDATE users SET status=%s WHERE id=%s",
        (status, user_id)
    )

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "User status updated"}), 200


# ===============================
# ADMIN → TERMINATE USER
# ===============================
@app.route("/admin/user/delete", methods=["POST"])
def delete_user():
    data = request.json
    user_id = data.get("id")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "DELETE FROM users WHERE id=%s",
        (user_id,)
    )

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "User terminated permanently"}), 200


# ===============================
# REQUEST OTP
# ===============================
@app.route("/request-otp", methods=["POST"])
def request_otp():
    data = request.json
    email = data.get("email")

    if not email:
        return jsonify({"message": "Email required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT last_otp_sent FROM users WHERE emailphone=%s",
        (email,)
    )
    user = cursor.fetchone()

    if not user:
        cursor.close()
        conn.close()
        return jsonify({"message": "Email not registered"}), 404

    if user["last_otp_sent"]:
        diff = datetime.now() - user["last_otp_sent"]
        if diff.total_seconds() < 60:
            cursor.close()
            conn.close()
            return jsonify({"message": "Wait before requesting new OTP"}), 429

    otp = str(random.randint(100000, 999999))
    expiry_time = datetime.now() + timedelta(minutes=5)

    cursor.execute(
        """
        UPDATE users
        SET reset_otp=%s,
            otp_expiry=%s,
            last_otp_sent=%s
        WHERE emailphone=%s
        """,
        (otp, expiry_time, datetime.now(), email)
    )

    conn.commit()
    cursor.close()
    conn.close()

    send_otp_email(email, otp)

    return jsonify({"message": "OTP sent to your email"}), 200


# ===============================
# RESET PASSWORD
# ===============================
@app.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.json
    email = data.get("email")
    otp = data.get("otp")
    password = data.get("password")

    if not email or not otp or not password:
        return jsonify({"message": "All fields required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT reset_otp, otp_expiry FROM users WHERE emailphone=%s",
        (email,)
    )
    user = cursor.fetchone()

    if not user:
        cursor.close()
        conn.close()
        return jsonify({"message": "User not found"}), 404

    if user["reset_otp"] != otp:
        cursor.close()
        conn.close()
        return jsonify({"message": "Invalid OTP"}), 400

    if datetime.now() > user["otp_expiry"]:
        cursor.close()
        conn.close()
        return jsonify({"message": "OTP expired"}), 400

    hashed_password = bcrypt.hashpw(
        password.encode(), bcrypt.gensalt()
    ).decode()

    cursor.execute(
        """
        UPDATE users
        SET password=%s,
            reset_otp=NULL,
            otp_expiry=NULL,
            last_otp_sent=NULL
        WHERE emailphone=%s
        """,
        (hashed_password, email)
    )

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Password reset successful"}), 200


# ===============================
# PROFILE & ADDRESS APIs
# ===============================

@app.route("/api/profile", methods=["POST"])
def save_profile():
    data = request.json
    user_id = data.get("user_id")
    gender = data.get("gender")
    avatar = data.get("avatar")

    if not user_id:
        return jsonify({"error": "user_id missing"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO user_profiles (user_id, gender, avatar)
        VALUES (%s, %s, %s)
        ON DUPLICATE KEY UPDATE gender=%s, avatar=%s
    """, (user_id, gender, avatar, gender, avatar))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Profile saved"}), 200

#get user profile
@app.route("/api/profile/<int:user_id>")
def get_profile(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT gender, avatar FROM user_profiles WHERE user_id=%s",
        (user_id,)
    )
    profile = cursor.fetchone()

    cursor.close()
    conn.close()

    return jsonify(profile), 200

# add new address
@app.route("/api/address", methods=["POST"])
def add_address():
    data = request.json
    user_id = data.get("user_id")

    if not user_id:
        return jsonify({"error": "user_id missing"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    if data.get("is_default"):
        cursor.execute(
            "UPDATE user_addresses SET is_default=0 WHERE user_id=%s",
            (user_id,)
        )

    cursor.execute("""
        INSERT INTO user_addresses
        (user_id, door, street, village, city, state, pincode, is_default)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
    """, (
        user_id,
        data.get("door"),
        data.get("street"),
        data.get("village"),
        data.get("city"),
        data.get("state"),
        data.get("pincode"),
        data.get("is_default", False)
    ))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Address saved"}), 200

#get all addresses for a user
@app.route("/api/addresses/<int:user_id>")
def get_addresses(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT * FROM user_addresses WHERE user_id=%s",
        (user_id,)
    )
    addresses = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(addresses), 200

# set default address
@app.route("/api/address/default", methods=["POST"])
def set_default_address():
    data = request.json
    user_id = data["user_id"]
    address_id = data["address_id"]

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "UPDATE user_addresses SET is_default=0 WHERE user_id=%s",
        (user_id,)
    )
    cursor.execute(
        "UPDATE user_addresses SET is_default=1 WHERE id=%s AND user_id=%s",
        (address_id, user_id)
    )

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Default address updated"}), 200

# get default address for checkout
@app.route("/api/checkout/address/<int:user_id>")
def checkout_default_address(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT * FROM user_addresses
        WHERE user_id=%s AND is_default=1
        LIMIT 1
    """, (user_id,))

    address = cursor.fetchone()

    cursor.close()
    conn.close()

    return jsonify(address), 200
# update address
@app.route("/api/address/<int:address_id>", methods=["PUT"])
def update_address(address_id):
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE user_addresses
        SET door=%s, street=%s, village=%s, city=%s, state=%s  pincode=%s
        WHERE id=%s AND user_id=%s
    """, (
        data["door"],
        data["street"],
        data["village"],
        data["city"],
        data["state"],
        data["pincode"],
        address_id,
        data["user_id"]
    ))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Address updated"}), 200
# delete address
@app.route("/api/address/<int:address_id>", methods=["DELETE"])
def delete_address(address_id):
    user_id = request.args.get("user_id")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "DELETE FROM user_addresses WHERE id=%s AND user_id=%s",
        (address_id, user_id)
    )

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Address deleted"}), 200

# get user basic info
@app.route("/api/user/<int:user_id>")
def get_user_basic(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT id, fullname, emailphone FROM users WHERE id=%s",
        (user_id,)
    )
    user = cursor.fetchone()

    cursor.close()
    conn.close()

    return jsonify(user), 200

# update user contact info
@app.route("/api/user/contact", methods=["POST"])
def update_user_contact():
    data = request.json
    user_id = data.get("user_id")
    emailphone = data.get("emailphone")

    if not user_id or not emailphone:
        return jsonify({"message": "Missing data"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "UPDATE users SET emailphone=%s WHERE id=%s",
        (emailphone, user_id)
    )

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Contact updated"}), 200

#BACKEND FOR CHECKOUT
@app.route("/api/order", methods=["POST"])
def create_order():
    data = request.json

    user_id = data.get("user_id")
    items = data.get("items")
    address = data.get("address")
    total_amount = data.get("total_amount")
    payment_id = data.get("payment_id")
    payment_mode = data.get("payment_mode")

    if not user_id or not items or not address:
        return jsonify({"message": "Invalid order data"}), 400

    order_id = "NX" + uuid.uuid4().hex[:12].upper()

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO orders
        (order_id, user_id, payment_id, payment_mode,
         total_amount, address, items, status)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
    """, (
        order_id,
        user_id,
        payment_id,
        payment_mode,
        total_amount,
        json.dumps(address),
        json.dumps(items),
        "Confirmed"
    ))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({
        "message": "Order placed successfully",
        "order_id": order_id
    }), 201

#get orders for a user
@app.route("/api/orders/<int:user_id>")
def get_user_orders(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT * FROM orders WHERE user_id=%s ORDER BY created_at DESC",
        (user_id,)
    )

    orders = cursor.fetchall()
    cursor.close()
    conn.close()

    return jsonify(orders), 200

#cancle order
@app.route("/api/order/cancel", methods=["POST"])
def cancel_order():
    data = request.json

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE orders
        SET status='Cancelled'
        WHERE order_id=%s AND user_id=%s
    """, (data["order_id"], data["user_id"]))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Order cancelled"}), 200

#clear all cancelled orders for a user
@app.route("/api/orders/clear-cancelled", methods=["POST"])
def clear_cancelled_orders():
    data = request.json
    user_id = data.get("user_id")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        DELETE FROM orders
        WHERE user_id=%s AND status='Cancelled'
    """, (user_id,))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Cancelled orders cleared"}), 200

# ===============================
# ADMIN → GET ALL ORDERS
# ===============================
@app.route("/admin/orders", methods=["GET"])
def admin_get_orders():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            o.id,
            o.order_id,
            o.user_id,
            u.fullname,
            o.total_amount,
            o.status,
            o.items,
            o.created_at
        FROM orders o
        JOIN users u ON u.id = o.user_id
        ORDER BY o.created_at DESC
    """)

    orders = cursor.fetchall()

    # 🔥 IMPORTANT: parse JSON items
    for o in orders:
        try:
            o["items"] = json.loads(o["items"])
        except:
            o["items"] = []

    cursor.close()
    conn.close()

    return jsonify(orders), 200


# ===============================
# ADMIN → UPDATE ORDER STATUS
# ===============================
@app.route("/admin/order/status", methods=["POST"])
def admin_update_order_status():
    data = request.json
    order_id = data.get("order_id")
    status = data.get("status")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "UPDATE orders SET status=%s WHERE order_id=%s",
        (status, order_id)
    )

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Order status updated"}), 200

#seller registration
@app.route("/seller/register", methods=["POST"])
def seller_register():
    data = request.json

    fullname = data.get("fullname")
    email = data.get("email")
    business_name = data.get("business_name")
    mobile = data.get("mobile")
    password = data.get("password")

    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO sellers
        (fullname, email, password, business_name, mobile)
        VALUES (%s,%s,%s,%s,%s)
    """, (fullname, email, hashed, business_name, mobile))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({
        "message": "Seller registered successfully. Wait for admin approval."
    }), 201

#seller login
@app.route("/seller/login", methods=["POST"])
def seller_login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT id, fullname, email, business_name, mobile, password, status FROM sellers WHERE email=%s",
        (email,)
    )
    seller = cursor.fetchone()

    cursor.close()
    conn.close()

    if not seller:
        return jsonify({"message": "Invalid credentials"}), 401

    if seller["status"] != "approved":
        return jsonify({"message": "Seller not approved yet"}), 403

    if not bcrypt.checkpw(password.encode(), seller["password"].encode()):
        return jsonify({"message": "Invalid credentials"}), 401

    return jsonify({
        "seller": {
            "id": seller["id"],
            "fullname": seller["fullname"],
            "email": seller["email"],
            "business_name": seller["business_name"],
            "mobile": seller["mobile"]
        }
    }), 200

@app.route("/seller/profile/<int:seller_id>")
def seller_profile(seller_id):
    db = get_db_connection()
    cur = db.cursor(dictionary=True)

    cur.execute("SELECT id, fullname, business_name, email, phone FROM sellers WHERE id=%s", (seller_id,))
    seller = cur.fetchone()

    cur.close()
    db.close()

    return jsonify(seller)

# ======================
# ADD PRODUCT
# ======================
@app.route("/seller/product/add", methods=["POST"])
def add_product():
    data = request.form
    seller_id = data.get("seller_id")

    files = request.files.getlist("images")
    image_names = []

    for f in files:
        name = f"{uuid.uuid4().hex}{os.path.splitext(f.filename)[1]}"
        f.save(os.path.join(UPLOAD_FOLDER, name))
        image_names.append(name)

    db = get_db_connection()
    cur = db.cursor()

    cur.execute("""
        INSERT INTO seller_products
        (seller_id, category, subcategory,
         brand, title, price, old_price,
         sizes, rom, images, status, created_at)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'pending',%s)
    """, (
        seller_id,
        data.get("category"),
        data.get("subcategory"),
        data.get("brand"),
        data.get("title"),
        data.get("price"),
        data.get("old_price"),
        data.get("sizes"),
        data.get("rom"),
        json.dumps(image_names),
        datetime.now()
    ))

    db.commit()
    cur.close()
    db.close()

    return jsonify({"success": True})

@app.route("/uploads/products/<filename>")
def serve_product_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

# ======================
# MY PRODUCTS
# ======================
@app.route("/seller/products/<int:seller_id>")
def my_products(seller_id):
    db = get_db_connection()
    cur = db.cursor(dictionary=True)

    cur.execute(
        "SELECT * FROM seller_products WHERE seller_id=%s ORDER BY id DESC",
        (seller_id,)
    )
    products = cur.fetchall()

    cur.close()
    db.close()

    return jsonify(products)

# ======================
# PRODUCT STATS
# ======================
@app.route("/seller/product/stats/<int:seller_id>")
def product_stats(seller_id):
    db = get_db_connection()
    cur = db.cursor(dictionary=True)

    cur.execute("""
        SELECT
          SUM(status='pending') AS pending,
          SUM(status='approved') AS approved
        FROM seller_products
        WHERE seller_id=%s
    """, (seller_id,))

    stats = cur.fetchone()

    cur.close()
    db.close()

    return jsonify(stats)

#admin get all seller products
@app.route("/admin/seller-products")
def admin_seller_products():
    db = get_db_connection()
    cur = db.cursor(dictionary=True)

    cur.execute("""
        SELECT sp.id, sp.title, sp.category, sp.price, sp.status,
               s.fullname AS seller_name
        FROM seller_products sp
        JOIN sellers s ON s.id = sp.seller_id
        ORDER BY sp.id DESC
    """)
    products = cur.fetchall()

    cur.close()
    db.close()

    return jsonify(products)

#admin approve seller product
@app.route("/admin/seller-product/approve/<int:pid>", methods=["POST"])
def approve_seller_product(pid):
    db = get_db_connection()
    cur = db.cursor()

    cur.execute(
        "UPDATE seller_products SET status='approved' WHERE id=%s",
        (pid,)
    )

    db.commit()
    cur.close()
    db.close()

    return jsonify({"success": True})

#admin reject seller product
@app.route("/admin/seller-product/reject/<int:pid>", methods=["POST"])
def reject_seller_product(pid):
    db = get_db_connection()
    cur = db.cursor()

    cur.execute(
        "UPDATE seller_products SET status='rejected' WHERE id=%s",
        (pid,)
    )

    db.commit()
    cur.close()
    db.close()

    return jsonify({"success": True})

#admin delete seller product
@app.route("/admin/seller-product/delete/<int:pid>", methods=["DELETE"])
def delete_seller_product(pid):
    db = get_db_connection()
    cur = db.cursor()

    # (Optional) delete images from folder later if needed
    cur.execute("DELETE FROM seller_products WHERE id=%s", (pid,))

    db.commit()
    cur.close()
    db.close()

    return jsonify({"success": True})

#seller update product
@app.route("/seller/product/update/<int:pid>", methods=["POST"])
def seller_update_product(pid):
    data = request.json
    seller_id = data.get("seller_id")

    db = get_db_connection()
    cur = db.cursor()

    # ensure seller owns this product
    cur.execute(
        "SELECT id FROM seller_products WHERE id=%s AND seller_id=%s",
        (pid, seller_id)
    )
    if not cur.fetchone():
        return jsonify({"error": "Unauthorized"}), 403

    cur.execute("""
        UPDATE seller_products SET
        title=%s,
        price=%s,
        old_price=%s,
        brand=%s,
        sizes=%s,
        rom=%s,
        status='pending'
        WHERE id=%s
    """, (
        data.get("title"),
        data.get("price"),
        data.get("old_price"),
        data.get("brand"),
        data.get("sizes"),
        data.get("rom"),
        pid
    ))

    db.commit()
    cur.close()
    db.close()

    return jsonify({"success": True})

#seller delete product
@app.route("/seller/product/delete/<int:pid>", methods=["DELETE"])
def seller_delete_product(pid):
    seller_id = request.args.get("seller_id")

    db = get_db_connection()
    cur = db.cursor()

    cur.execute(
        "DELETE FROM seller_products WHERE id=%s AND seller_id=%s",
        (pid, seller_id)
    )

    db.commit()
    cur.close()
    db.close()

    return jsonify({"success": True})

#get all approved products for listing
@app.route("/products")
def get_products():
    category = request.args.get("category")
    subcategory = request.args.get("subcategory")

    db = get_db_connection()
    cur = db.cursor(dictionary=True)

    query = """
        SELECT * FROM seller_products
        WHERE status='approved'
    """
    params = []

    if category:
        query += " AND category=%s"
        params.append(category)

    if subcategory:
        query += " AND subcategory=%s"
        params.append(subcategory)

    cur.execute(query, params)
    products = cur.fetchall()

    cur.close()
    db.close()
    return jsonify(products)


#admin get all sellers
@app.route("/admin/sellers")
def admin_sellers():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM sellers")
    sellers = cursor.fetchall()
    return jsonify(sellers)

#admin update seller status
@app.route("/admin/seller/status", methods=["POST"])
def update_seller_status():
    data = request.json
    seller_id = data.get("id")
    status = data.get("status")  # approved | blocked

    if not seller_id or not status:
        return jsonify({"message": "Invalid data"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "UPDATE sellers SET status=%s WHERE id=%s",
        (status, seller_id)
    )

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": f"Seller {status} successfully"}), 200

#seller wallet retrieval
@app.route("/seller/wallet/<int:seller_id>")
def seller_wallet(seller_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT balance FROM seller_wallet WHERE seller_id=%s",
        (seller_id,)
    )
    wallet = cursor.fetchone()

    # If wallet not created yet
    if not wallet:
        cursor.execute(
            "INSERT INTO seller_wallet (seller_id, balance) VALUES (%s, 0)",
            (seller_id,)
        )
        conn.commit()
        wallet = {"balance": 0}

    cursor.close()
    conn.close()

    return jsonify(wallet), 200
#seller payout request
@app.route("/seller/payout/request", methods=["POST"])
def request_payout():
    data = request.json
    seller_id = data.get("seller_id")
    amount = float(data.get("amount", 0))

    if amount <= 0:
        return jsonify({"message": "Invalid amount"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT balance FROM seller_wallet WHERE seller_id=%s",
        (seller_id,)
    )
    wallet = cursor.fetchone()

    if not wallet or wallet["balance"] < amount:
        return jsonify({"message": "Insufficient balance"}), 400

    # Create payout request
    cursor.execute(
        "INSERT INTO seller_payouts (seller_id, amount) VALUES (%s,%s)",
        (seller_id, amount)
    )

    # Deduct balance
    cursor.execute(
        "UPDATE seller_wallet SET balance = balance - %s WHERE seller_id=%s",
        (amount, seller_id)
    )

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Payout request submitted"}), 200

#seller payout history
@app.route("/seller/payouts/<int:seller_id>")
def seller_payout_history(seller_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT amount, status, created_at
        FROM seller_payouts
        WHERE seller_id=%s
        ORDER BY created_at DESC
        """,
        (seller_id,)
    )

    payouts = cursor.fetchall()
    cursor.close()
    conn.close()

    return jsonify(payouts), 200



# ===============================
# RUN SERVER
# ===============================
if __name__ == "__main__":
    app.run(debug=True)

