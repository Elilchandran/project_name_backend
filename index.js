const express = require('express');
//const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors'); 
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());
//app.use(bodyParser.json());
const port = 3001;


const url = 'mongodb+srv://elilarasi:elilarasi@cluster0.0ley2q5.mongodb.net/task_UserDB?retryWrites=true&w=majority';

mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
}).catch((err) => {
  console.error('Error connecting to MongoDB:', err);
});

const taskSchema = new mongoose.Schema({
  taskName: String,
  description: String,
  status: String,
  completedOn: Date,
  link: String,
});

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  entries: Number,
  stasks: [taskSchema],
  joined: Date,
});

const User = mongoose.model('User', userSchema, 'users_Tasks');

app.get('/user', (req, res) => {
  User.find({}, {})
    .then(users => {
      res.status(200).json(users);
    })
});

//register
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email: email });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    bcrypt.hash(password, 10, async (err, hash) => {
      if (err) {
        return res.status(500).json({ error: 'Error hashing the password' });
      }

      const newUser = new User({
        name: name,
        email: email,
        password: hash,
        entries: 0,
        stasks: [],
        joined: new Date(),
      });

      await newUser.save();
      return res.status(200).json({ message: 'Registered successfully' });
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error registering user', details: error.message });
  }
});

//Sign in
app.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (isPasswordValid) {
      // Passwords match, user can be logged in
      const tasks = user.stasks;
      return res.status(200).json({ message: 'Sign-in successful', tasks });
    } else {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Error signing in', error: error.message });
  }
});

//Task
app.get('/users/tasks', async (req, res) => {
  const userEmail = req.query.email;

  try {
    const user = await User.findOne({ email: userEmail });

    if (user) {
      const tasks = user.stasks;
      res.status(200).json({ stasks: tasks });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

//Submit task
app.post('/submitTask', async (req, res) => {
  try {
    const { email, taskName, description, status, completedOn, link } = req.body;

    const user = await User.findOne({ email: email });

    if (user) {
      const newTask = {
        taskName,
        description,
        status,
        completedOn: completedOn ? new Date(completedOn) : null,
        link,
      };

      user.stasks.push(newTask);
      await user.save();

      res.status(200).json({ message: 'Task submitted successfully', task: newTask });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error submitting task', error: error.message });
  }
});

// //delete
// app.delete('/deleteTask/:email', async (req, res) => {
//   try {
//     const userEmail = req.params.email;
//     const taskId = req.params.taskId;

//     const user = await User.findOne({ email: userEmail });

//     if (user) {
//       const taskIndex = user.stasks.findIndex(task => task._id.toString() === taskId);

//       if (taskIndex !== -1) {
//         user.stasks.splice(taskIndex, 1);
//         await user.save();

//         res.status(200).json({ message: 'Task deleted successfully' });
//       } else {
//         res.status(404).json({ message: 'Task not found' });
//       }
//     } else {
//       res.status(404).json({ message: 'User not found' });
//     }
//   } catch (error) {
//     res.status(500).json({ message: 'Error deleting task', error: error.message });
//   }
// });



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});