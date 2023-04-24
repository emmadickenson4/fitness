// Load Node modules
let express = require('express');
let fs = require('fs');
const bodyParser = require('body-parser');
const session = require('express-session');
const crypto = require('crypto');
const path = require('path'); // Import path module
const mongoose = require('mongoose'); // Import mongoose for MongoDB

// Initialise Express
var app = express();
// Render static files
app.set('view engine', 'ejs');
app.use(express.static('views'));

// Generate a random secret string
const secret = crypto.randomBytes(64).toString('hex');

// Set up body-parser middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: secret, // replace with your own secret key
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // set to true if using HTTPS
}));

const conn = "mongodb+srv://tomarad2001:2zTtcOVjDS7qOGI3@app.n3x0e0i.mongodb.net/?retryWrites=true&w=majority"

// Connect to MongoDB
mongoose.connect(conn, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((err) => {
  console.error('Failed to connect to MongoDB:', err);
});

// Define schema for users
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  name:String, 
  displayemail: { type: String, required: false },
  location: { type: String, required: false },
  fitnessgoal: { type: String, required: false },
  favoriteexercise: { type: String, required: false },
  bio: { type: String, required: false },
  facebook: { type: String, required: false },
  instagram: { type: String, required: false },
  twitter: { type: String, required: false },
  snapchat: { type: String, required: false },
  spotify: { type: String, required: false }
});

// Create user model
const User = mongoose.model('User', userSchema);

// Define schema for posts
const postSchema = new mongoose.Schema({
  exercise: String,
  description: String,
  username: String,
  likes: Number
});

// Create post model
const Post = mongoose.model('Post', postSchema);

// Define schema for challenges
const challengeSchema = new mongoose.Schema({
  challengename: String,
  progress: String,
  username: String,
  challengeComplete: Boolean, 
  update: Boolean
});

// Create challenge model
const Challenge = mongoose.model('Challenge', challengeSchema);


// Route for handling form submissions from the signup page
app.post('/signup', (req, res) => {
  // Retrieve user data from the request body
  const username = req.body.registerUsername;
  const name = req.body.name;
  const email = req.body.registerEmail;
  const password = req.body.registerPassword;

  User.findOne({ $or: [{ username: username }, { email: email }] })
    .then((existingUser) => {
      if (existingUser) {
        // Send error response if username or email already exist
        res.status(404).send('Username or email already exists');
      } else {
        // Add the new user to the database
        const newUser = new User({ username: username, name: name, email: email, password: password });
        newUser.save()
          .then(() => {
            res.send("success");
          })
          .catch((err) => {
            console.error('Failed to save user:', err);
            res.status(500).send('Failed to save user');
          });
      }
    })
    .catch((err) => {
      console.error('Failed to find user:', err);
      res.status(500).send('Failed to find user');
    });
});

// Endpoint to handle login requests
app.post('/login', (req, res) => {
  const { loginUsername, loginPassword } = req.body; // Get login information from request body

  // Find user in MongoDB based on the provided username or email
  User.findOne({ $or: [{ username: loginUsername }, { email: loginUsername }] })
    .then((matchedUser) => {
      if (matchedUser && matchedUser.password === loginPassword) {
        // Login successful
        req.session.username = matchedUser.username;
        res.send("Login successful");
      } else {
        // Login failed
        if(matchedUser){
          res.status(401).send('Invalid password.');
        }
        else{
        res.status(401).send('username does not exist');
        }
      }
    })
    .catch((err) => {
      console.error('Failed to find user:', err);
      res.status(500).send('Failed to find user');
    });
});

// Navigate to create post page when create button clicked
app.post('/goToCreatePost', (req, res) => {
  res.render('CreatePost.ejs');
});

app.post('/createPost', (req, res) => {
  const exercise = req.body.exercise;
  const description = req.body.description;
  const username = req.session.username;
  const likes = 0;
  const postId = req.session._id

  // Check if exercise and description are not empty
  if (!exercise || !description) {
    return res.send(`<script>alert('Exercise and description are required'); window.history.back();</script>`);
  }


  const newPost = new Post({ _id: postId, exercise, description, username, likes });

  newPost.save()
          .then(() => {
            console.log("success");
          })
          .catch((err) => {
            console.error('Failed to save user:', err);
            //res.status(500).send('Failed to save user');
          });


  res.redirect('/');
});

app.post('/deletePost/:id', (req, res) => {
  const postid = req.params.id;

  Post.findById(postid)
    .then((post) => {
      if (!post) {
        res.status(404).send('post not found');
      } else {
        Post.deleteOne({_id: postid})
          .then(() => {
            res.redirect('/Profile');
          })
          .catch((err) => {
            console.error('Failed to delete post:', err);
            res.status(500).send('Failed to delete post');
          });
      }
    })
    .catch((err) => {
      console.error('Failed to find post:', err);
      res.status(500).send('Failed to find post');
    });
});

app.post('/updateProgress/:id', (req, res) => {
  const challengeid = req.params.id;

  Challenge.findById(challengeid)
    .then((challenge) => {
      if (!challenge) {
        res.status(404).send('Challenge not found');
      } else {
        challenge.update = true
        return challenge.save();
      }
    })
    .then(() => {
      res.redirect("/Challenges")
    })
    .catch((err) => {
      console.error('Failed to update progress:', err);
      res.status(500).send('Failed to update progress');
    });
});

app.post('/newProgress/:id', (req, res) => {
  const challengeid = req.params.id;
  const progressNum = req.body.newprogress;

  if (isNaN(progressNum)) {
    return res.send(`<script>alert('Progress must be a valid number'); window.history.back();</script>`);
  }

  if (progressNum > 100 || progressNum < 0) {
    return res.send(`<script>alert('Progress cannot be greater than 100% or less than 0%'); window.history.back();</script>`);
  }

  newprogress = progressNum+"%"

  Challenge.findById(challengeid)
    .then((challenge) => {
      if (!challenge) {
        res.status(404).send('Challenge not found');
      } else {
        challenge.progress = newprogress
        challenge.update = false
        if(progressNum == 100) {
          challenge.challengeComplete = true
        } else {
          challenge.challengeComplete = false
        }
        return challenge.save();
      }
    })
    .then(() => {
      res.redirect("/Challenges")
    })
    .catch((err) => {
      console.error('Failed to update progress:', err);
      res.status(500).send('Failed to update progress');
    });
});

app.post('/createChallenge', (req, res) => {
  const challengename = req.body.challengename
  const username = req.session.username
  const progressNum = req.body.progress
  const challengeId = req.session._id
  const update = false

  // Check if exercise and description are not empty
  if (!challengename) {
    return res.send(`<script>alert('Challenge name is required'); window.history.back();</script>`);
  }

  if (isNaN(progressNum)) {
    return res.send(`<script>alert('Progress must be a valid number'); window.history.back();</script>`);
  }

  if (progressNum > 100 || progressNum < 0) {
    return res.send(`<script>alert('Progress cannot be greater than 100% or less than 0%'); window.history.back();</script>`);
  }

  if (progressNum == 100) {
    challengeComplete = true
  } else {
    challengeComplete = false
  }

  progress = progressNum+"%"

  const newChallenge = new Challenge({ _id: challengeId, challengename: challengename, username: username, progress: progress, challengeComplete: challengeComplete, update: update });

  newChallenge.save()
          .then(() => {
            console.log("success");
          })
          .catch((err) => {
            console.error('Failed to save challenge:', err);
            //res.status(500).send('Failed to save user');
          });


  res.redirect('/Challenges');
});

app.post('/goToCreateChallenge', (req, res) => {
  res.render('CreateChallenge.ejs');
});

app.post('/likePost/:id', (req, res) => {
  const postId = req.params.id;

  // Find the post in the database
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        res.status(404).send('Post not found');
      } else {
        // Update the likes field of the post and save it to the database
        post.likes++;
        return post.save();
      }
    })
    .then(() => {
      res.redirect("/")
    })
    .catch((err) => {
      console.error('Failed to like post:', err);
      res.status(500).send('Failed to like post');
    });
});

app.post('/editProfile', (req, res) => {
  const username = req.session.username;
  const newname = req.body.newname;
  const displayemail = req.body.displayemail;
  const location = req.body.location;
  const fitnessgoal = req.body.fitnessgoal;
  const favoriteexercise = req.body.favoriteexercise;
  const bio = req.body.bio;
  const facebook = req.body.facebook;
  const instagram = req.body.instagram;
  const twitter = req.body.twitter;
  const snapchat = req.body.snapchat;
  const spotify = req.body.spotify;


  User.findOne({ username: username })
    .then((currentUser) => {
      if (currentUser) {
        console.log('Current user information:', currentUser);

        const updateData = {
          displayemail: displayemail,
          location: location,
          fitnessgoal: fitnessgoal,
          favoriteexercise: favoriteexercise,
          bio: bio,
          facebook: facebook,
          instagram: instagram,
          twitter: twitter,
          snapchat: snapchat,
          spotify: spotify
        };
        if (newname !== '') {
          updateData.name = newname;
        }

        return User.findOneAndUpdate({ username: username }, updateData, { new: true });
      } else {
        throw new Error('User not found in the database');
      }
    })
    .then((updatedUser) => {
      console.log('Updated user information:', updatedUser);
      res.redirect('/Profile');
    })
    .catch((err) => {
      console.error('Failed to edit profile:', err);
      res.status(500).send('Failed to edit profile');
    });
});


app.get('/viewProfile/:username', (req, res) => {
  const username = req.params.username;

  if(req.session.username == undefined){
    res.redirect('/login')
  }
  else{

    User.findOne({ username: username })
      .then((user) => {
        if (!user) {
          return res.status(404).send('User not found');
        }

        Post.find({ username: username })
          .then((posts) => {
            Challenge.find({ username: username })
              .then((challenges) => {
                res.render('UserProfile.ejs', { user: user, posts: posts, challenges: challenges, username:username });
              })
              .catch((err) => {
                console.error('Failed to find challenges:', err);
                res.status(500).send('Failed to find challenges');
              });
          })
          .catch((err) => {
            console.error('Failed to find posts:', err);
            res.status(500).send('Failed to find posts');
          });
      })
      .catch((err) => {
        console.error('Failed to find user:', err);
        res.status(500).send('Failed to find user');
      });
    }
});

app.get('/', (req, res) => {
  // Access username from session
  const username = req.session.username;
  
  if(username == undefined){
    res.redirect('/login');
    }
  else{
    Post.find({})
      .sort({_id: -1})
      .then((posts) => {
        res.render('index.ejs', { username: username, posts: posts });
      })
      .catch((err) => {
        console.error('Failed to retrieve users:', err);
      });
    }
  });

app.get('/Trending', (req, res) => {
  const username = req.session.username;
  if(req.session.username == undefined){
    res.redirect('/login')
  }
  else{
    Post.find({})
    .sort({likes: -1, _id: -1})
    .then((posts) => {
      res.render('trending.ejs', { username: username, posts: posts });
    })
    .catch((err) => {
      console.error('Failed to retrieve users:', err);
    });
  }
});

app.get('/Challenges', (req, res) => {
  const username = req.session.username;
  if(req.session.username == undefined){
    res.redirect('/login')
  }
  else{
    Challenge.find({ username: username })
    .then((challenges) => {
      res.render('Challenges.ejs', { challenges: challenges, username:username });
    })
    .catch((err) => {
      console.error('Failed to find challenges:', err);
      res.status(500).send('Failed to find challenges');
    });
  }
});

app.get('/Profile', (req, res) => {
  const username = req.session.username;

  if(req.session.username == undefined){
    res.redirect('/login')
  }
  else{

    User.findOne({ username: username })
      .then((user) => {
        if (!user) {
          return res.status(404).send('User not found');
        }

        Post.find({ username: username })
          .then((posts) => {
            Challenge.find({ username: username })
              .then((challenges) => {
                res.render('Profile', { user: user, posts: posts, challenges: challenges, username:username });
              })
              .catch((err) => {
                console.error('Failed to find challenges:', err);
                res.status(500).send('Failed to find challenges');
              });
          })
          .catch((err) => {
            console.error('Failed to find posts:', err);
            res.status(500).send('Failed to find posts');
          });
      })
      .catch((err) => {
        console.error('Failed to find user:', err);
        res.status(500).send('Failed to find user');
      });
    }
});



app.get('/SignUp', (req, res) => {
  // Render home page with username
  res.render('SignUp.ejs');
});

app.get('/Login', (req, res) => {
  // Render home page with username
  res.render('Login.ejs');
});

app.post('/EditProfilePage', (req, res) => {
  username = req.session.username;
  if(req.session.username == undefined){
    res.redirect('/login')
  } else{
      User.findOne({ username: req.session.username })
      .then((user) => {
        res.render('editprofile.ejs', { user: user });
      })
      .catch((err) => {
        console.error('Failed to find user:', err);
        res.status(500).send('Failed to find user');
      });
    }
  
});


// Port website will run on
app.listen(3000,() => {
    console.log('Server is running on http://localhost:3000');
  });