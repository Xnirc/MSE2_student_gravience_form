const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Serve static files (frontend)
app.use(express.static(__dirname));

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/student_grievance';
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

// Schemas
const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const grievanceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, enum: ['Academic', 'Hostel', 'Transport', 'Other'], required: true },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['Pending', 'Resolved'], default: 'Pending' },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' }
});

const Student = mongoose.model('Student', studentSchema);
const Grievance = mongoose.model('Grievance', grievanceSchema);

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ message: 'Access Denied: No token provided' });

    try {
        const decoded = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid Token' });
    }
};

// Auth APIs
// a) POST /api/register
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ message: 'All fields are required' });

        const existingStudent = await Student.findOne({ email });
        if (existingStudent) return res.status(400).json({ message: 'Email already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newStudent = new Student({ name, email, password: hashedPassword });
        await newStudent.save();

        res.status(201).json({ message: 'Registration successful' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// b) POST /api/login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'All fields are required' });

        const student = await Student.findOne({ email });
        if (!student) return res.status(400).json({ message: 'Invalid email or password' });

        const validPassword = await bcrypt.compare(password, student.password);
        if (!validPassword) return res.status(400).json({ message: 'Invalid email or password' });

        const token = jwt.sign({ id: student._id }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ message: 'Login successful', token });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Grievance APIs
// c) POST /api/grievances → Submit grievance
app.post('/api/grievances', verifyToken, async (req, res) => {
    try {
        const { title, description, category } = req.body;
        if (!title || !description || !category) return res.status(400).json({ message: 'All fields are required' });

        const grievance = new Grievance({
            title,
            description,
            category,
            studentId: req.user.id
        });
        await grievance.save();
        res.status(201).json({ message: 'Grievance submitted successfully', grievance });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// h) GET /api/grievances/search?title=xyz → Search grievance
app.get('/api/grievances/search', verifyToken, async (req, res) => {
    try {
        const { title } = req.query;
        if (!title) return res.status(400).json({ message: 'Search title is required' });

        const grievances = await Grievance.find({
            studentId: req.user.id,
            title: { $regex: title, $options: 'i' }
        });
        res.json(grievances);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// d) GET /api/grievances → View all grievances
app.get('/api/grievances', verifyToken, async (req, res) => {
    try {
        const grievances = await Grievance.find({ studentId: req.user.id }).sort({ date: -1 });
        res.json(grievances);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// e) GET /api/grievances/:id → View grievance by ID
app.get('/api/grievances/:id', verifyToken, async (req, res) => {
    try {
        const grievance = await Grievance.findOne({ _id: req.params.id, studentId: req.user.id });
        if (!grievance) return res.status(404).json({ message: 'Grievance not found' });
        res.json(grievance);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// f) PUT /api/grievances/:id → Update grievance
app.put('/api/grievances/:id', verifyToken, async (req, res) => {
    try {
        const { title, description, category, status } = req.body;
        const grievance = await Grievance.findOneAndUpdate(
            { _id: req.params.id, studentId: req.user.id },
            { title, description, category, status },
            { new: true, runValidators: true }
        );
        if (!grievance) return res.status(404).json({ message: 'Grievance not found' });
        res.json({ message: 'Grievance updated successfully', grievance });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// g) DELETE /api/grievances/:id → Delete grievance
app.delete('/api/grievances/:id', verifyToken, async (req, res) => {
    try {
        const grievance = await Grievance.findOneAndDelete({ _id: req.params.id, studentId: req.user.id });
        if (!grievance) return res.status(404).json({ message: 'Grievance not found' });
        res.json({ message: 'Grievance deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
