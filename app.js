const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

mongoose.connect('mongodb+srv://gaintmaverick:gaintmaverick@cluster0.bp99rmb.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('Error connecting to MongoDB', error));

app.use(require('./router/routes'));

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));



