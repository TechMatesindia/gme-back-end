const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../model/usermodel');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
router.use(bodyParser.json());
const cors = require('cors');
const multer = require('multer');
dotenv.config({ path: './config.env' });
const jwt = require('jsonwebtoken');
router.use(cors({ origin: 'http://localhost:3000','http://13.51.204.30:3000/' }));
const fs = require('fs');
const path = require('path');
const { sampleSize } = require('lodash');
const { request } = require('http');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads')
  },
  filename: (req, file, cb) => {
    cb(null, Date.now()+'_'+file.originalname)
  }
});
var upload = multer({ storage: storage });


router.post('/register', async (req, res) => {
  try {
    const { name,username, email, password,DOB,Contact_No} = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ name,email, password: hashedPassword,username,DOB,Contact_No});
    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    return res.status(201).json({ message: 'Registration successful', token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) {
        return res.status(500).json({ message: 'Internal server error' });
      }

      res.json({ message:'Login Successful',userId :user.id });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/user/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, email, username, DOB, Contact_No,Experience,Qualification,Current_salary,salary_goal_1_year,salary_goal_3_year,address,current_dest,current_org,image,exams,Remaining_attempt} = user;

    return res.status(200).json({ name, email, username, DOB, Contact_No,Experience,Qualification,address,Current_salary,salary_goal_1_year,salary_goal_3_year,current_dest,current_org,image,exams,Remaining_attempt });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/image/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.sendFile(path.join(__dirname, '..', 'uploads',user.image));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


const filePaths = [
  {
    path: path.join(__dirname, 'intro.json'),
    questionsCount: 6,
    difficultyCount: {
      easy: 2,
      medium: 3,
      hard: 1
    }
  },
  {
    path: path.join(__dirname, 'define.json'),
    questionsCount: 8,
    difficultyCount: {
      easy: 3,
      medium: 4,
      hard: 1
    }
  },
  {
    path: path.join(__dirname, 'Improve.json'),
    questionsCount: 8,
    difficultyCount: {
      easy: 4,
      medium: 3,
      hard: 1
    }
  },
  {
    path: path.join(__dirname, 'measure.json'),
    questionsCount: 9,
    difficultyCount: {
      easy: 3,
      medium: 4,
      hard: 2
    }
  },
  {
    path: path.join(__dirname, 'Control.json'),
    questionsCount: 8,
    difficultyCount: {
      easy: 3,
      medium: 4,
      hard: 1
    }
  },
  {
    path: path.join(__dirname, 'Analyze.json'),
    questionsCount: 11,
    difficultyCount: {
      easy: 4,
      medium: 5,
      hard: 2
    }
  }
  // {
  //   path: path.join(__dirname, 'lean.json'),
  //   questionsCount: 8,
  //   difficultyCount: {
  //     easy: 4,
  //     medium: 3,
  //     hard: 1
  //   }
  // },
];

const allQuestions = [];


filePaths.forEach(({ path: filePath, questionsCount }) => {
  const fileContent = fs.readFileSync(filePath);
  const questions = JSON.parse(fileContent);
  allQuestions.push(...questions.slice(0, questionsCount));
});


router.get('/questions', (req, res) => {

  const totalQuestions = 50;

  const shuffledQuestions = sampleSize(allQuestions, totalQuestions);

  res.json(shuffledQuestions);
});


router.get('/user-answers', (req, res) => {
  const answeredQuestions = allQuestions.filter((question) => question.answered);

  res.json(answeredQuestions);
});



router.patch('/updateprofile/:id', upload.fields([{ name: 'image', maxCount: 1 }]), async (req, res) => {
  const id = req.params.id;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if(req.body.address){
      user.address = req.body.address;
    }
    if (req.files['image']) {
      user.image = req.files['image'][0].filename;
    }
    if (req.body.qualification) {
      user.Qualification = req.body.qualification;
    }
    if (req.body.experience) {
      user.Experience = req.body.experience;
    }
    if (req.body.company){
      user.current_org = req.body.company;
    }
    if (req.body.destination){
      user.current_dest = req.body.destination;
    }
    if (req.body.salary){
      user.Current_salary = req.body.salary;
    }
    if (req.body.salgoal1){
      user.salary_goal_1_year = req.body.salgoal1;
    }
    if (req.body.salgoal3){
      user.salary_goal_3_year = req.body.salgoal3;
    }
    await user.save();
    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/results/:id', async(req, res) => {
  const id = req.params.id;
  console.log(id);
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const {marks} = req.body;
    console.log(req.body)
    user.marks = marks;
    await user.save();
    res.status(200).json({message:"marks posted"});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/results/:id', async (req, res) => {
  const id = req.params.id;
  console.log(id);
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const marks = user.marks;
    res.status(200).json({ marks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/remaining/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.Remaining_attempt = 0;
    await user.save();
    res.status(200).json({ message: 'attempts set' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/exams/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.exams = "six sigma belt exam"; 
    user.Remaining_attempt = 1;
    await user.save();
    res.status(200).json({ message: 'exams set' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
})





// function authenticateToken(req, res, next) {
//   const authHeader = req.headers['authorization'];
//   const token = authHeader && authHeader.split(' ')[1];

//   if (!token) {
//     return res.status(401).json({ message: 'Unauthorized' });
//   }

//   jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
//     if (err) {
//       console.error(err);
//       return res.status(401).json({ message: 'Unauthorized' });
//     }

//     req.user = decoded;
//     next();
//   });
// }




module.exports = router;
