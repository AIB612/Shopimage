# Shopify App Review - Customer Data Response

## Customer Data Access Questions

### Question 1: Protected Customer Data
**Shopify Question:** "Access to protected customer data is only allowed if it can be shown to be providing app functionality. Provide additional context or proof on how your app uses Protected customer data."

**Response:**
Our app does NOT access any protected customer data. The app only requests the following scopes:
- `read_products` - To scan product images
- `write_products` - To update optimized product images
- `read_themes` - To scan theme asset images
- `write_themes` - To update optimized theme images

No customer data scopes are requested or used.

---

### Question 2: Customer First/Last Name
**Shopify Question:** "Access to the customer first/last name fields is only allowed if it can be shown to be providing app functionality. Provide additional context or proof on how your app uses customer name."

**Response:**
Our app does NOT access customer names. We do not request `read_customers` or any customer-related scopes. The app functionality is limited to image optimization and does not require any customer information.

---

### Question 3: Customer Email Address
**Shopify Question:** "Access to the customer email address field is only allowed if it can be shown to be providing app functionality. Provide additional context or proof on how your app uses customer email."

**Response:**
Our app does NOT access customer email addresses. We do not request `read_customers` or any customer-related scopes. The app only works with product and theme images, which do not require customer data.

---

## App Scopes Summary

**Requested Scopes:**
```
read_products, write_products, read_themes, write_themes
```

**Purpose:**
- Image scanning and optimization for products and themes
- No customer data is accessed, stored, or processed

**Implementation:** See `server/shopify.ts` line 10
