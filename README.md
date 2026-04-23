# 🎓 CampusConnect - Student Grievance Management System

A full-stack, transparent, and efficient web application designed for students to easily report and track academic, hostel, and transport-related issues. Built with the MERN stack (MongoDB, Express, Vanilla JS, Node.js).

## 🚀 Live Demo
- **Frontend (Vercel):** [https://mse-2-student-gravience-form-2gkt.vercel.app/](https://mse-2-student-gravience-form-2gkt.vercel.app/)
- **Backend API (Render):** [https://mse2-student-gravience-form.onrender.com/](https://mse2-student-gravience-form.onrender.com/)

---

## ✨ Features
### Frontend (UI/UX)
- **Glassmorphism Design:** Modern, premium aesthetic with smooth UI/UX.
- **Authentication:** Secure Registration and Login portal.
- **Dashboard:** Protected route only accessible to logged-in students.
- **Dynamic Interactions:** Loading spinners, fade-in animations, and toast notifications.
- **Search:** Real-time search functionality for complaints.
- **Full CRUD:** Create, Read, Update (Edit), and Delete grievances.

### Backend (API)
- **Node.js & Express:** RESTful architecture.
- **MongoDB & Mongoose:** Structured data schemas for Students and Grievances.
- **JWT Authentication:** Secure API endpoints protecting user data.
- **Bcrypt:** Password hashing and secure storage.

---

## 🛠️ Technology Stack
- **Frontend:** HTML5, CSS3, Vanilla JavaScript, FontAwesome
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas
- **Security:** jsonwebtoken (JWT), bcryptjs
- **Deployment:** Vercel (Frontend), Render (Backend)

---

## 🔌 API Endpoints Reference

### Auth Routes
- `POST /api/register` - Register a new student
- `POST /api/login` - Authenticate student and get JWT token

### Grievance Routes (Requires JWT Token)
- `POST /api/grievances` - Submit a new grievance
- `GET /api/grievances` - Fetch all grievances for the logged-in student
- `GET /api/grievances/search?title=...` - Search grievances by title
- `PUT /api/grievances/:id` - Update a specific grievance
- `DELETE /api/grievances/:id` - Delete a specific grievance

---

## 💻 Local Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Xnirc/MSE2_student_gravience_form.git
   cd MSE2_student_gravience_form
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create a `.env` file in the root directory and add the following:
   ```env
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   ```

4. **Run the server:**
   ```bash
   node server.js
   ```

5. **Test the app:**
   Open `http://localhost:5000` in your browser. (The backend will serve the frontend automatically during local development).

---
*Developed for College MSE-2 Submission.*
