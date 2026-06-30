# CampusTrade | Student Exchange Marketplace

A full-stack web application designed for college students to buy, sell, exchange, or donate used items (textbooks, calculators, lab coats, electronics, hostel essentials) within their campus community.

---

## 🛠️ Tech Stack

- **Frontend**: React.js (Vite), Tailwind CSS v3, Axios, React Router, `@clerk/clerk-react`
- **Backend**: Node.js, Express.js, Mongoose, JWT (`jsonwebtoken`)
- **Database**: MongoDB (Mongoose ORM)
- **Authentication**: Clerk Integration (with an automated keyless fallback Mock Auth Mode)

---

## 📂 Project Structure

```
student-exchange-marketplace/
│
├── backend/
│   ├── config/
│   │   └── db.js            # MongoDB connection
│   ├── middleware/
│   │   └── auth.js          # Auth middleware (Clerk & Mock fallback)
│   ├── models/
│   │   ├── User.js          # MongoDB User Model (department, year, wishlist, etc.)
│   │   ├── Product.js       # Product listing Model (name, price, condition)
│   │   └── Message.js       # Direct Messages Model
│   ├── controllers/
│   │   ├── productController.js
│   │   ├── userController.js
│   │   └── chatController.js
│   ├── routes/
│   │   ├── products.js
│   │   ├── users.js
│   │   └── chats.js
│   ├── .env                 # Environment variables
│   ├── server.js            # Node Express bootstrap
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, ProductCard, ChatWindow
│   │   ├── context/         # MockAuthContext
│   │   ├── hooks/           # useAppAuth
│   │   ├── pages/           # Home, Login, ProductDetails, AddEditProduct, Dashboard, Profile, Admin
│   │   ├── services/        # Axios API wrapper (api.js)
│   │   ├── App.jsx          # Route mapping and provider configurations
│   │   ├── index.css        # Tailwind style directives
│   │   └── main.jsx
│   ├── .env                 # Environment variables
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
└── README.md                # Development guide (This file)
```

---

## 🔑 Authentication Modes

The application supports **two modes** of authentication. It checks for Clerk credentials in your environment configuration and adapts automatically:

### 1. Mock Auth Mode (Zero-Config / Development)
If no Clerk keys are detected in the environment files, the app launches in **Mock Auth Mode**.
- Provides **1-click developer buttons** on the Login screen:
  - **Login as Student**: Logs you in as a mock student profile (`alex.jones@college.edu`).
  - **Login as Admin**: Logs you in as a mock administrator profile (`admin.moderator@college.edu`).
- Synchronizes simulated tokens, local storage, and database profiles seamlessly without requiring internet-facing SDK hooks.

### 2. Real Clerk Mode (Production Grade)
To integrate your Clerk dashboard accounts:
1. Obtain your keys from the [Clerk Dashboard](https://dashboard.clerk.com).
2. Write them to your environment configurations (details below).
3. The app will immediately swap the forms with Clerk's official `<SignIn />` and `<SignUp />` widgets.

---

## ⚙️ Environment Configuration

### Backend Setup (`/backend/.env`)
Create a file named `.env` in the `backend/` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/student-exchange

# Optional - Leave empty to use Mock Auth
CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
```

### Frontend Setup (`/frontend/.env`)
Create a file named `.env` in the `frontend/` directory:
```env
VITE_API_URL=http://localhost:5000/api

# Optional - Leave empty to use Mock Auth
VITE_CLERK_PUBLISHABLE_KEY=
```

---

## 🚀 Installation & Running

### Prerequisites
- **Node.js**: `v18+` or `v20+` (Recommended)
- **MongoDB**: Make sure your local MongoDB service is running, or get a free MongoDB Atlas connection string and paste it into the backend `MONGODB_URI`.

### 1. Start the Backend Server
Open a terminal in the root directory:
```bash
cd backend
npm install
npm run dev
```
The server will start on `http://localhost:5000`. You should see `MongoDB Connected` in your console.

### 2. Start the Frontend Dev Server
Open a second terminal in the root directory:
```bash
cd frontend
npm install
npm run dev
```
The frontend will start on `http://localhost:5173`. Click the terminal link to open the app.

---

## 💡 Key Features Demonstration Walkthrough

1. **Self-Contained Auth Sync**: Simply click **Student Profile** on the login screen. The backend automatically catches the mock token, checks if that student exists in MongoDB, and creates a user entry if they are logging in for the first time.
2. **Profile Completion**: Go to the **Profile** tab, enter an academic department, year of study, and hostel contact details (e.g. room number or WhatsApp). Save.
3. **List an Item**: Click the **+ List Item** button in the header. Add a name, select a category, set the price, condition, open-to-exchange check, and paste some image URLs (you can use search engine image links).
4. **Marketplace Browsing**: Go to the homepage. Type into the search box, change the category tab, filter by price range, or sort by lowest price.
5. **Direct Student Messaging (Inbox Chat)**:
   - Log in as another account or use a separate incognito session.
   - Find your listed item and click **Chat with Seller**.
   - Type a message and send.
   - Go back to the seller's browser window, open the **Dashboard** -> **Messages**, and you will see the active chat thread, complete with unread count badges, live message exchanges, and a **"Mark Sold to Buyer"** action to close the trade loop.
6. **Admin Panel Control**: Sign in using the **Admin Profile** shortcut button. Open the **Admin** tab in the header. You can view all registered students, delete user accounts, and remove inappropriate marketplace listings globally.
