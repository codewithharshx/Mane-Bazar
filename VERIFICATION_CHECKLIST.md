# ✔️ Verification Checklist

**Quick checklist to verify Mane Bazar is working correctly**

---

## 🚀 Pre-Verification Setup

Before running checks, ensure:

```bash
# Terminal 1: Backend
cd server
npm install  # if not done
npm run dev

# Terminal 2: Frontend  
cd client
npm install  # if not done
npm run dev
```

Both should show URLs:
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`

---

## ✅ Backend Verification

### 1. Server Health Check
```bash
curl http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "service": "mane-bazar-api",
  "ts": "2026-04-09T12:00:00.000Z"
}
```

### 2. Database Connection
**Check in terminal output:**
- Should see: `✅ MongoDB connected: localhost`
- Or: `✅ Using in-memory MongoDB for local development`
- Should see: `✅ Database seed check complete`

### 3. Test Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

**Expected Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "...",
    "name": "Test User",
    "email": "test@example.com",
    "role": "user"
  }
}
```

### 4. Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@manebazar.com",
    "password": "Admin@123"
  }'
```

**Expected Response:** Similar to registration (with token)

### 5. Get Products
```bash
curl http://localhost:5000/api/products
```

**Expected Response:** Array of products with details

### 6. Get Categories
```bash
curl http://localhost:5000/api/categories
```

**Expected Response:** Array of 12 categories

---

## ✅ Frontend Verification

### 1. Page Loads
Visit: http://localhost:5173

**Check:**
- [ ] Page loads without errors
- [ ] Navbar is visible
- [ ] Hero slider appears
- [ ] Products are displayed

### 2. Navigation Works
- [ ] Click on "Products" - navigates to products page
- [ ] Click on "Stores" - navigates to stores page
- [ ] Click on logo - returns to home page

### 3. Register Works
1. Click "Sign Up" or go to `/register`
2. Fill in form:
   - Name: "Test User"
   - Email: "newuser@example.com"
   - Password: "TestPass123"
3. Click "Sign Up"
4. **Expected**: Redirected to home, toast says "Welcome to Mane Bazar"

### 4. Login Works
1. Click "Sign In" or go to `/login`
2. Fill in form:
   - Email: "admin@manebazar.com"
   - Password: "Admin@123"
3. Click "Sign In"
4. **Expected**: Redirected to home, see "Welcome back" message

### 5. User Menu Works
1. After login, click profile icon (top right)
2. **Expected**: Dropdown with options:
   - Profile
   - My Orders
   - My Wishlist
   - Logout

### 6. Products Work
1. Browse products page
2. Click any product
3. **Expected**: 
   - Product details load
   - "Add to Cart" button visible
   - Images display

### 7. Cart Works
1. Add 2-3 products to cart
2. Click cart icon (top right)
3. **Expected**:
   - Products show with quantities
   - Can increase/decrease quantities
   - Have "Checkout" button

### 8. Admin Access
1. Login as admin (admin@manebazar.com / Admin@123)
2. Go to: http://localhost:5173/admin
3. **Expected**:
   - Dashboard loads
   - See analytics charts
   - See recent orders
   - See low stock products

### 9. Admin Dashboard Features
- [ ] Dashboard stats show
- [ ] Daily orders chart displays
- [ ] Monthly revenue chart displays
- [ ] User growth chart displays
- [ ] Top products list shows
- [ ] Recent orders section displays

---

## ✅ Authentication Verification

### 1. Token Refresh Works
1. Login with test account
2. Wait 16+ minutes (or manually clear and refresh)
3. **Expected**: Automatic token refresh, no logout

### 2. Protected Routes Work
1. Without login, try to access `/profile`
2. **Expected**: Redirected to login page
3. After login, try again
4. **Expected**: Profile page loads

### 3. Admin Routes Protected
1. Create regular user (not admin)
2. Try to access `/admin`
3. **Expected**: Access denied or 403 error
4. Logout and login as admin
5. **Expected**: Admin page accessible

### 4. Session Persistence
1. Login
2. Close browser tab/window
3. Come back to http://localhost:5173
4. **Expected**: Still logged in (token in localStorage)

---

## ✅ Database Verification

### 1. Products Seeded
In browser console (or API call):
```javascript
// This should return a number > 0
```
**Expected**: 360+ products in database

### 2. Categories Seeded
Visit: http://localhost:5000/api/categories
**Expected**: Array with 12 categories

### 3. Admin User Exists
Try login with: admin@manebazar.com / Admin@123
**Expected**: Successful login

### 4. Coupons Seeded
Check in database (MongoDB GUI or API)
**Expected**: 3+ coupons (WELCOME50, FRESH10, SAVE25)

---

## ✅ API Endpoints Verification

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/api/health` | GET | ✅ | Health check |
| `/api/auth/register` | POST | ✅ | User registration |
| `/api/auth/login` | POST | ✅ | User login |
| `/api/auth/me` | GET | ✅ | Get current user |
| `/api/products` | GET | ✅ | List products |
| `/api/categories` | GET | ✅ | List categories |
| `/api/orders` | GET | ✅ | User orders |
| `/api/payment/create-order` | POST | ✅ | Create payment |
| `/api/admin/stats` | GET | ✅ | Admin dashboard |

---

## ✅ Frontend Features Verification

- [ ] Responsive design (try resizing browser)
- [ ] Mobile menu works (on small screens)
- [ ] Dark/Light mode toggle (if implemented)
- [ ] Search functionality works
- [ ] Filter by category works
- [ ] Sort options work
- [ ] Pagination works

---

## ✅ Error Handling Verification

### Try these to verify error handling:

1. **Invalid Login**
   - Email: invalid@example.com
   - Password: wrong
   - **Expected**: Error message "Invalid email or password"

2. **Duplicate Registration**
   - Register with existing email
   - **Expected**: Error message "User already exists"

3. **Missing Fields**
   - Try to submit registration without password
   - **Expected**: Form validation error

4. **Invalid Token**
   - Manually modify localStorage token
   - Try to access protected route
   - **Expected**: Auto logout and redirect to login

---

## 🐛 Troubleshooting Verification Issues

### Issue: "Cannot connect to backend"
**Solution:**
```bash
cd server
npm run dev
# Check it says: "Server running on port 5000"
```

### Issue: "Products not loading"
**Solution:**
1. Check database seeding completed
2. Check console for errors
3. Try: `curl http://localhost:5000/api/products`

### Issue: "Login not working"
**Solution:**
1. Check email/password are correct
2. Check network tab in DevTools
3. Try admin@manebazar.com / Admin@123

### Issue: "Admin dashboard not loading"
**Solution:**
1. Verify you're logged in as admin
2. Check browser console for JavaScript errors
3. Try refreshing page

### Issue: "Cannot add to cart"
**Solution:**
1. Ensure you're logged in
2. Check browser console for errors
3. Verify products are loading

---

## ✅ Production Readiness Verification

Before deploying to production:

- [ ] All tests above pass
- [ ] No console errors
- [ ] No network errors
- [ ] Auth works fully
- [ ] Admin dashboard fully functional
- [ ] Database seeding works
- [ ] Validation works
- [ ] Error messages are helpful

---

## 📋 Final Checklist

- [x] Backend server starts without errors
- [x] Frontend builds without errors
- [x] Database connects successfully
- [x] Auth system works (register, login, logout)
- [x] Admin account accessible
- [x] Products load and display
- [x] Shopping cart works
- [x] Protected routes work
- [x] Admin dashboard accessible
- [x] Error handling functional

---

## ✅ Ready for Next Step!

If all checks pass:

✅ **Local Development**: Ready to develop features  
✅ **Testing**: Ready to run tests  
✅ **Deployment**: Ready to deploy to production  

---

**Stuck?** Check these resources:
- Error message → Search in SETUP_GUIDE.md
- Architecture question → Read ARCHITECTURE.md
- Deployment help → Follow SETUP_GUIDE.md deployment section
- Production checklist → See PRODUCTION_CHECKLIST.md

---

**Last Updated**: April 2026  
**Status**: Complete
