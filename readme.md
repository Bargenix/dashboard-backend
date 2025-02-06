Here’s a clear and comprehensive documentation for your user routes:

---

## **User Routes Documentation**

### **Base URL**: `/api/v1/users`

The following routes allow users to perform authentication, profile management, and password-related actions.

---

### **1. User Signup**

- **Endpoint**: `POST /signup`
- **Description**: Register a new user.
- **Request Body**:
  ```json
  {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "contactNumber": "+1234567890",
      "password": "SecurePass123!",
      "designation": "Manager",
      "linkedInUrl": "https://www.linkedin.com/in/johndoe",
      "companyName": "TechCorp",
      "companyWebsite": "https://www.techcorp.com",
      "employeeSize": 150,
      "kindsOfProducts": ["Electronics", "Software"],
      "country": "United States",
      "state": "California",
      "city": "San Francisco",
  }
  ```
- **Response**:  
  - Success: `201 Created`  
  - Error: `400 Bad Request` (if required fields are missing or user already exists)

---

### **2. Verify User Email**

- **Endpoint**: `PUT /verify-user`
- **Description**: Verify a user's email using the OTP sent during signup.
- **Request Body**:
  ```json
  {
      "email": "john.doe@example.com",
      "otp": "123456"
  }
  ```
- **Response**:  
  - Success: `200 OK`  
  - Error: `400 Bad Request` (if OTP is incorrect or expired)

---

### **3. User Signin**

- **Endpoint**: `POST /signin`
- **Description**: Authenticate a user and return a JWT token.
- **Request Body**:
  ```json
  {
      "email": "john.doe@example.com",
      "password": "SecurePass123!"
  }
  ```
- **Response**:  
  - Success: `200 OK` with JWT token  
  - Error: `401 Unauthorized` (if credentials are invalid)

---

### **4. User Signout**

- **Endpoint**: `GET /signout`
- **Description**: Sign out the current user by invalidating the session token.
- **Headers**:
  - Authorization: `Bearer <JWT_TOKEN>`
- **Response**:  
  - Success: `200 OK`  
  - Error: `401 Unauthorized` (if token is missing or invalid)

---

### **5. Get Current User**

- **Endpoint**: `GET /current-user`
- **Description**: Retrieve details of the currently logged-in user.
- **Headers**:
  - Authorization: `Bearer <JWT_TOKEN>`
- **Response**:  
  - Success: `200 OK` with user details  
  - Error: `401 Unauthorized` (if token is missing or invalid)

---

### **6. Change Password**

- **Endpoint**: `PUT /change-password`
- **Description**: Allow a logged-in user to change their current password.
- **Headers**:
  - Authorization: `Bearer <JWT_TOKEN>`
- **Request Body**:
  ```json
  {
      "currentPassword": "SecurePass123!",
      "newPassword": "NewSecurePass456!"
  }
  ```
- **Response**:  
  - Success: `200 OK`  
  - Error: `400 Bad Request` (if the current password is incorrect)

---

### **7. Update User Profile**

- **Endpoint**: `PUT /update-profile`
- **Description**: Update the profile details of the currently logged-in user.
- **Headers**:
  - Authorization: `Bearer <JWT_TOKEN>`
- **Request Body** (Example):
  ```json
  {
      "firstName": "John",
      "lastName": "Doe",
      "designation": "Senior Manager",
      "linkedInUrl": "https://www.linkedin.com/in/johndoe"
  }
  ```
- **Response**:  
  - Success: `200 OK` with updated user details  
  - Error: `400 Bad Request` (if required fields are invalid)

---

### **8. Forgot Password**

- **Endpoint**: `POST /forgot-password`
- **Description**: Request a password reset link by email.
- **Request Body**:
  ```json
  {
      "email": "john.doe@example.com"
  }
  ```
- **Response**:  
  - Success: `200 OK`  
  - Error: `404 Not Found` (if email does not exist)

---

### **9. Reset Password**

- **Endpoint**: `PUT /reset-password/:token`
- **Description**: Reset a user's password using a valid reset token.
- **Request Params**:
  - `:token`: The reset token sent to the user's email.
- **Request Body**:
  ```json
  {
      "newPassword": "NewSecurePass456!"
  }
  ```
- **Response**:  
  - Success: `200 OK`  
  - Error: `400 Bad Request` (if token is invalid or expired)

---

## **Shopify Routes Documentation**

### **Base URL**: `/api/v1/shopify`

The following routes allow authenticated users to manage their Shopify credentials, fetch products, and retrieve orders.

---

### **1. Get Total Orders**


---

### **2. Get All Products**

- **Endpoint**: `GET /all-products`
- **Description**: Fetch all products from the user's Shopify store.
- **Headers**:
  - Authorization: `Bearer <JWT_TOKEN>`
- **Response**:  
  - **Success**:  
    ```json
    {
        "status": 200,
        "data": {
            "products": [ /* Array of product objects */ ]
        },
        "message": "Products fetched successfully"
    }
    ```
  - **Error**:  
    - `401 Unauthorized` (if token is invalid or missing)
    - `500 Internal Server Error` (if Shopify API fails or credentials are invalid)

---

### **3. Get All Products by Category**

- **Endpoint**: `GET /all-products-category`
- **Description**: Fetch all products grouped by category from the user's Shopify store.
- **Headers**:
  - Authorization: `Bearer <JWT_TOKEN>`
- **Response**:  
  - **Success**:  
    ```json
    {
        "status": 200,
        "data": {
            "categories": [
                {
                    "categoryName": "Electronics",
                    "products": [ /* Array of product objects in this category */ ]
                },
                {
                    "categoryName": "Apparel",
                    "products": [ /* Array of product objects in this category */ ]
                }
            ]
        },
        "message": "Products by category fetched successfully"
    }
    ```
  - **Error**:  
    - `401 Unauthorized` (if token is invalid or missing)
    - `500 Internal Server Error` (if Shopify API fails or credentials are invalid)

---

### **4. Set Shopify Credentials**

- **Endpoint**: `POST /set-shopify-cred`
- **Description**: Add Shopify credentials for the authenticated user.
- **Headers**:
  - Authorization: `Bearer <JWT_TOKEN>`
- **Request Body**:
  ```json
  {
      "accessToken": "shpca_xxx12345yyy",
      "shopifyShopName": "johns-shop",
      "apiVersion": "2025-01"
  }
  ```
- **Response**:  
  - **Success**:  
    ```json
    {
        "status": 201,
        "data": {
            "shopify": {
                "accessToken": "shpca_xxx12345yyy",
                "shopifyShopName": "johns-shop",
                "apiVersion": "2025-01",
                "userId": "63e1234567abcd890"
            }
        },
        "message": "Shopify details created successfully"
    }
    ```
  - **Error**:  
    - `401 Unauthorized` (if token is invalid or missing)
    - `400 Bad Request` (if credentials are missing or already exist)

---

### **5. Update Shopify Credentials**

- **Endpoint**: `PUT /update-shopify-cred`
- **Description**: Update the Shopify credentials for the authenticated user.
- **Headers**:
  - Authorization: `Bearer <JWT_TOKEN>`
- **Request Body**:
  ```json
  {
      "accessToken": "shpca_new12345zzz",
      "shopifyShopName": "johns-shop",
      "apiVersion": "2025-01"
  }
  ```
- **Response**:  
  - **Success**:  
    ```json
    {
        "status": 200,
        "data": {
            "shopify": {
                "accessToken": "shpca_new12345zzz",
                "shopifyShopName": "johns-shop",
                "apiVersion": "2025-01",
                "userId": "63e1234567abcd890"
            }
        },
        "message": "Shopify details updated successfully"
    }
    ```
  - **Error**:  
    - `401 Unauthorized` (if token is invalid or missing)
    - `400 Bad Request` (if credentials are missing or invalid)

---

## **Bargaining Routes Documentation**

### **Base URL**: `/api/v1/bargaining`

These routes allow authenticated users to configure bargaining settings for their Shopify products based on categories, specific products, or all products.

---

### **1. Set Bargaining by Category**

- **Endpoint**: `POST /set-by-category`
- **Description**: Enable bargaining for all products within a specified category.
- **Headers**:
  - Authorization: `Bearer <JWT_TOKEN>`
- **Request Body**:
  ```json
  {
      "category": "Electronics",
      "behavior": "low",
      "minPrice": 100
  }
  ```
  - **Fields**:
    - `categoryName` (string): The name of the product category to enable bargaining for.
    - `discountRate` (number): The percentage discount to allow for bargaining (e.g., `10` for 10%).
    - `minimumBargainPrice` (number): The minimum price allowed for bargaining after discount.
- **Response**:  
  - **Success**:  
    ```json
    {
        "status": 200,
        "data": {
            "category": "Electronics",
            "behavior": "low",
            "minPrice": 100
        },
        "message": "Bargaining enabled for the category successfully"
    }
    ```
  - **Error**:  
    - `401 Unauthorized` (if token is invalid or missing)
    - `400 Bad Request` (if required fields are missing or invalid)

---

### **2. Set Bargaining for All Products**

- **Endpoint**: `POST /set-all-products`
- **Description**: Enable bargaining for all products in the authenticated user's Shopify store.
- **Headers**:
  - Authorization: `Bearer <JWT_TOKEN>`
- **Request Body**:
  ```json
  {
      "category": "Electronics",
      "behavior": "low",
      "minPrice": 100
  }
  ```
  - **Fields**:
    - `discountRate` (number): The percentage discount to allow for bargaining across all products (e.g., `15` for 15%).
    - `minimumBargainPrice` (number): The minimum price allowed for bargaining after discount.
- **Response**:  
  - **Success**:  
    ```json
    {
        "status": 200,
        "data": {
            "category": "Electronics",
            "behavior": "low",
            "minPrice": 100
        },
        "message": "Bargaining enabled for all products successfully"
    }
    ```
  - **Error**:  
    - `401 Unauthorized` (if token is invalid or missing)
    - `400 Bad Request` (if required fields are missing or invalid)

---

### **3. Set Bargaining by Product**

- **Endpoint**: `POST /set-by-product`
- **Description**: Enable bargaining for specific products by their IDs.
- **Headers**:
  - Authorization: `Bearer <JWT_TOKEN>`
- **Request Body**:
  ```json
  {
      "productId": "123412",
      "behavior": 20,
      "minPrice": 30
  }
  ```
  - **Fields**:
    - `productIds` (array of strings): A list of product IDs to enable bargaining for.
    - `discountRate` (number): The percentage discount to allow for bargaining (e.g., `20` for 20%).
    - `minimumBargainPrice` (number): The minimum price allowed for bargaining after discount.
- **Response**:  
  - **Success**:  
    ```json
    {
        "status": 200,
        "data": {
            "bargainingEnabledForProducts": [
                {
                    "productId": "prod_123",
                    "behavior": 20,
                    "minPrice": 30
                },
                {
                    "productId": "prod_456",
                    "behavior": 20,
                    "minPrice": 30
                }
            ]
        },
        "message": "Bargaining enabled for selected products successfully"
    }
    ```
  - **Error**:  
    - `401 Unauthorized` (if token is invalid or missing)
    - `400 Bad Request` (if required fields are missing or invalid)

---