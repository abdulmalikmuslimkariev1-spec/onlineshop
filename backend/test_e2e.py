import urllib.request
import urllib.parse
import json
import sys

BASE_URL = "http://localhost:8001/api"

def request(method, path, data=None, token=None, form_data=None):
    url = f"{BASE_URL}{path}"
    headers = {}
    body = None
    
    if token:
        headers["Authorization"] = f"Bearer {token}"
        
    if form_data:
        body = urllib.parse.urlencode(form_data).encode("utf-8")
        headers["Content-Type"] = "application/x-www-form-urlencoded"
    elif data is not None:
        body = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
        
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        err_content = e.read().decode("utf-8")
        try:
            err_json = json.loads(err_content)
        except Exception:
            err_json = {"detail": err_content}
        return e.code, err_json

def login(email, password):
    status, res = request("POST", "/login/access-token", form_data={"username": email, "password": password})
    assert status == 200, f"Login failed for {email}: {res}"
    return res["access_token"]

def run_tests():
    print("=== STARTING END-TO-END VERIFICATION ===")
    
    # 1. Customer login
    print("\n--- 1. Testing Customer Login ---")
    customer_token = login("customer@online.shop", "customer123")
    print("✓ Customer logged in successfully. Token acquired.")
    
    status, me = request("GET", "/me", token=customer_token)
    assert status == 200, f"/me failed: {me}"
    print(f"✓ /me verified: {me['email']}, full_name: {me.get('full_name')}")
    
    # 2. View Products, Categories & Search
    print("\n--- 2. Testing Products & Categories ---")
    status, categories = request("GET", "/customer/categories")
    assert status == 200 and len(categories) > 0, f"Categories failed: {categories}"
    print(f"✓ Categories loaded: {[c['name'] for c in categories]}")
    
    status, products = request("GET", "/customer/products")
    assert status == 200 and len(products) > 0, f"Products failed: {products}"
    print(f"✓ Products loaded: {len(products)} products found")
    
    # Search
    search_query = "krossovka"
    status, search_prods = request("GET", f"/customer/products?search={search_query}")
    assert status == 200 and len(search_prods) > 0, f"Search failed: {search_prods}"
    print(f"✓ Product search for '{search_query}': found {len(search_prods)} item(s)")
    
    # Single product detail
    product_slug = products[0]["slug"]
    status, single_prod = request("GET", f"/customer/products/{product_slug}")
    assert status == 200 and single_prod["slug"] == product_slug, f"Single product failed: {single_prod}"
    print(f"✓ Product detail loaded: {single_prod['name']} (Price: {single_prod['price']} UZS)")
    
    # 3. Customer Addresses (Add, Edit, Delete, Get)
    print("\n--- 3. Testing Address Management ---")
    status, addresses = request("GET", "/customer/addresses", token=customer_token)
    assert status == 200 and len(addresses) > 0, f"Get addresses failed: {addresses}"
    default_address_id = addresses[0]["id"]
    print(f"✓ Current customer addresses: {len(addresses)} found. Default ID: {default_address_id}")
    
    # Create new address
    new_addr_data = {
        "title": "Ishxona",
        "address_line": "Navoiy ko'chasi 1-uy",
        "city": "Toshkent",
        "is_default": False
    }
    status, created_addr = request("POST", "/customer/addresses", data=new_addr_data, token=customer_token)
    assert status == 200 and created_addr["title"] == "Ishxona", f"Create address failed: {created_addr}"
    test_addr_id = created_addr["id"]
    print(f"✓ Address created: ID {test_addr_id}, {created_addr['address_line']}")
    
    # Edit / Update address
    update_addr_data = {
        "title": "Bosh Office",
        "address_line": "Navoiy ko'chasi 10-uy, 5-qavat",
        "city": "Toshkent"
    }
    status, updated_addr = request("PUT", f"/customer/addresses/{test_addr_id}", data=update_addr_data, token=customer_token)
    assert status == 200 and updated_addr["title"] == "Bosh Office", f"Update address failed: {updated_addr}"
    print(f"✓ Address updated: ID {test_addr_id}, title is now '{updated_addr['title']}'")
    
    # Delete test address
    status, del_res = request("DELETE", f"/customer/addresses/{test_addr_id}", token=customer_token)
    assert status == 200, f"Delete address failed: {del_res}"
    print(f"✓ Address deleted: ID {test_addr_id}")

    # 4. Cart & Checkout & Order Creation (Server authoritative pricing)
    print("\n--- 4. Testing Order Creation & Server Authoritative Pricing ---")
    # Order 2 items: 1x product[0] (850,000 UZS) + 2x product[1] (320,000 UZS)
    expected_total = (products[0]["price"] * 1) + (products[1]["price"] * 2)
    order_in = {
        "address_id": default_address_id,
        "payment_method": "CASH",
        "customer_note": "Iltimos, eshik qo'ng'irog'ini chaling",
        "items": [
            {"product_id": products[0]["id"], "quantity": 1},
            {"product_id": products[1]["id"], "quantity": 2}
        ]
    }
    status, created_order = request("POST", "/customer/orders", data=order_in, token=customer_token)
    assert status == 200, f"Create order failed: {created_order}"
    order_id = created_order["id"]
    order_number = created_order["order_number"]
    assert created_order["total"] == expected_total, f"Server total {created_order['total']} != expected {expected_total}"
    assert created_order["status"] == "NEW", f"Initial status should be NEW, got {created_order['status']}"
    print(f"✓ Order created successfully! ID: {order_id}, Number: #{order_number}")
    print(f"✓ Server calculated total: {created_order['total']} UZS (verified authoritative calculation)")

    # 5. Customer Views Own Orders & Order Details
    print("\n--- 5. Testing Customer Order History ---")
    status, my_orders = request("GET", "/customer/orders", token=customer_token)
    assert status == 200 and any(o["id"] == order_id for o in my_orders), f"My orders missing created order"
    print(f"✓ Customer order history verified: {len(my_orders)} order(s) listed")
    
    status, order_detail = request("GET", f"/customer/orders/{order_id}", token=customer_token)
    assert status == 200 and order_detail["id"] == order_id, f"Order detail failed: {order_detail}"
    print(f"✓ Order details retrieved: #{order_detail['order_number']}, Status: {order_detail['status']}")

    # Security check: customer cannot change order status
    print("\n--- 6. Security Check: Customer Cannot Change Order Status ---")
    status, breach_attempt = request("PATCH", f"/operator/orders/{order_id}/status", data={"status": "CONFIRMED"}, token=customer_token)
    assert status == 403, f"Security breach! Customer was able to change status: {status}, {breach_attempt}"
    print(f"✓ Access denied for customer on operator status endpoint (HTTP {status})")

    # 7. Operator Logs In & Views Order
    print("\n--- 7. Testing Operator Order Processing ---")
    operator_token = login("operator@online.shop", "operator123")
    print("✓ Operator logged in successfully.")
    
    status, op_orders = request("GET", f"/operator/orders", token=operator_token)
    assert status == 200, f"Operator orders failed: {op_orders}"
    assert any(o["id"] == order_id for o in op_orders["items"]), "Created order not visible in Operator list"
    print(f"✓ Operator sees created order #{order_number} in order list")

    # 8. Operator Transitions: NEW -> CONFIRMED -> PREPARING -> READY_FOR_COURIER -> ASSIGNED
    print("\n--- 8. Testing Operator Status Workflow & Courier Assignment ---")
    status, updated = request("PATCH", f"/operator/orders/{order_id}/status", data={"status": "CONFIRMED", "note": "Operator tasdiqladi"}, token=operator_token)
    assert status == 200 and updated["status"] == "CONFIRMED", f"Confirm failed: {updated}"
    print(f"✓ Status updated: NEW -> CONFIRMED")

    status, updated = request("PATCH", f"/operator/orders/{order_id}/status", data={"status": "PREPARING", "note": "Omborda yig'ilmoqda"}, token=operator_token)
    assert status == 200 and updated["status"] == "PREPARING", f"Preparing failed: {updated}"
    print(f"✓ Status updated: CONFIRMED -> PREPARING")

    status, updated = request("PATCH", f"/operator/orders/{order_id}/status", data={"status": "READY_FOR_COURIER", "note": "Tayyor"}, token=operator_token)
    assert status == 200 and updated["status"] == "READY_FOR_COURIER", f"Ready failed: {updated}"
    print(f"✓ Status updated: PREPARING -> READY_FOR_COURIER")

    # Get couriers list
    status, couriers = request("GET", "/operator/couriers", token=operator_token)
    assert status == 200 and len(couriers) > 0, f"Get couriers failed: {couriers}"
    courier_id = couriers[0]["id"]
    print(f"✓ Available couriers: {len(couriers)} found. Assigning to Courier ID: {courier_id} ({couriers[0]['name']})")

    # Assign to courier
    status, updated = request("PATCH", f"/operator/orders/{order_id}/status", data={"status": "ASSIGNED", "courier_id": courier_id, "note": "Kuryerga biriktirildi"}, token=operator_token)
    assert status == 200 and updated["status"] == "ASSIGNED", f"Assign courier failed: {updated}"
    assert updated["courier_id"] == courier_id, f"Courier ID not set in order: {updated}"
    print(f"✓ Status updated: READY_FOR_COURIER -> ASSIGNED (Courier ID {courier_id})")

    # 9. Courier Logs In & Delivers Order
    print("\n--- 9. Testing Courier Delivery Workflow ---")
    courier_token = login("courier@online.shop", "courier123")
    print("✓ Courier logged in successfully.")

    # Courier views assigned orders
    status, c_orders = request("GET", "/courier/orders", token=courier_token)
    assert status == 200, f"Courier orders failed: {c_orders}"
    assert any(o["id"] == order_id for o in c_orders["items"]), "Assigned order not found in courier's list"
    print(f"✓ Courier sees order #{order_number} in their assigned tasks")

    # Courier: ASSIGNED -> ON_THE_WAY
    status, updated = request("PATCH", f"/courier/orders/{order_id}/status", data={"status": "ON_THE_WAY", "note": "Yetkazilmoqda"}, token=courier_token)
    assert status == 200 and updated["status"] == "ON_THE_WAY", f"On the way failed: {updated}"
    print(f"✓ Status updated: ASSIGNED -> ON_THE_WAY")

    # Courier: ON_THE_WAY -> DELIVERED
    status, updated = request("PATCH", f"/courier/orders/{order_id}/status", data={"status": "DELIVERED", "note": "Mijozga topshirildi"}, token=courier_token)
    assert status == 200 and updated["status"] == "DELIVERED", f"Delivered failed: {updated}"
    print(f"✓ Status updated: ON_THE_WAY -> DELIVERED")

    # 10. Customer Views Final DELIVERED Status
    print("\n--- 10. Verifying Final Status in Customer Profile ---")
    status, final_order = request("GET", f"/customer/orders/{order_id}", token=customer_token)
    assert status == 200, f"Final customer order fetch failed: {final_order}"
    assert final_order["status"] == "DELIVERED", f"Customer does not see DELIVERED, sees: {final_order['status']}"
    print(f"✓ Customer order #{order_number} successfully verified as DELIVERED!")
    print(f"✓ Status history items: {len(final_order['status_history'])} timeline stages recorded.")

    print("\n==========================================")
    print(">>> ALL 10 END-TO-END TESTS PASSED 100%! <<<")
    print("==========================================")

if __name__ == "__main__":
    run_tests()
