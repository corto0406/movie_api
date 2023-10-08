const express = require('express');
const morgan = require('morgan');
const app = express();
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Models = require('./models.js');
const { check, validationResult } = require('express-validator');

const Movies = Models.Movie;
const Users = Models.User;

//mongoose.connect('mongodb://localhost:27017/cfDB', { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });


const cors = require('cors');
let allowedOrigins = ['http://testsite.com','https://movie-place-35ed6ca44a78.herokuapp.com','http://localhost:1234','http://movie-appi.netlify.app'];

app.use(cors({
	origin: (origin, callback) => {
		if (!origin) return callback(null, true);
		if (allowedOrigins.indexOf(origin) === -1) { // If a specific origin isn’t found on the list of allowed origins
			let message = 'The CORS policy for this application doesn’t allow access from origin ' + origin;
			return callback(new Error(message), false);
		}
		return callback(null, true);
	}
}));

app.use(bodyParser.json());

let auth = require('./auth')(app);

const passport = require('passport');
require('./passport');

app.use(bodyParser.urlencoded({ extended: true }));

const accessLogScream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {
	flags: 'a'
});
app.use(morgan('combined', { steam: accessLogScream }));

app.use(express.static('public'));

app.get('/', (req, res) => {
	res.send('Welcome to Movie-Place!');
});


//get all movies,new version
app.get('/movies', (req, res) => {
	Movies.find()
		.then((movies) => {
			res.status(201).json(movies);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send('Error: ' + err);
		});
});

//get movie by title
app.get('/movies/:title', passport.authenticate('jwt', { session: false }),
	(req, res) => {
		const { title } = req.params;
		Movies.findOne({ Title: req.params.title })
			.then((movie) => {
				if (movie) {
					res.status(200).json(movie);
				} else {
					res.status(404).send("Could not find that movie");
				}
			})
			.catch((err) => {
				console.error(err);
				res.status(500).send("Error: " + err);
			});
	});

//get movies by genre name
app.get('/movies/genres/:genreName', passport.authenticate('jwt', { session: false }),
	(req, res) => {
		Movies.find({ 'Genre.Name': req.params.genreName })
			.then((movies) => {
				res.status(200).json(movies);
			})
			.catch((err) => {
				res.status(500).send('Error: ' + err);
			});
	});

//find movie by director name
app.get('/movies/directors/:directorsName', passport.authenticate('jwt', { session: false }),
	(req, res) => {
		Movies.find({ 'Director.Name': req.params.directorsName })
			.then((movies) => {
				res.status(200).json(movies);
			})
			.catch((err) => {
				res.status(500).send('Error: ' + err);
			});
	});

//add a user
app.post('/users', async (req, res) => {
	let hashedPassword = Users.hashPassword(req.body.Password);
	await Users.findOne({ Username: req.body.Username }) // Search to see if a user with the requested username already exists
		.then((user) => {
			if (user) {
				//If the user is found, send a response that it already exists
				return res.status(400).send(req.body.Username + ' already exists');
			} else {
				Users
					.create({
						Username: req.body.Username,
						Password: hashedPassword,
						Email: req.body.Email,
						Birthday: req.body.Birthday
					})
					.then((user) => { res.status(201).json(user) })
					.catch((error) => {
						console.error(error);
						res.status(500).send('Error: ' + error);
					});
			}
		})
		.catch((error) => {
			console.error(error);
			res.status(500).send('Error: ' + error);
		});
});

//find user by username
app.get('/users/:Username', passport.authenticate('jwt', { session: false }),
	(req, res) => {
		Users.findOne({ Username: "Bobika" })
			.then((user) => {
				res.json(user);
			})
			.catch((err) => {
				console.error(err);
				res.status(500).send('Error: ' + err);
			});
	});

//get all users
app.get('/users', (req, res) => {
	Users.find()
		.then((users) => {
			res.status(201).json(users);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send('Error: ' + err);
		});
});

//update user info by user name
app.put('/users/:userName',
	[
		check('Username', 'Username is required').isLength({ min: 5 }),
		check('Username', 'Username contains non alphanumeric characters - not allowed.')
			.isAlphanumeric(),
		check('Password', 'Password is required').not().isEmpty(),
		check('Email', 'Email does not appear to be valid').isEmail()
	],
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		let errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		}
		let hashedPassword = Users.hashPassword(req.body.Password);

		Users.findOneAndUpdate(
			{ Username: req.params.userName },
			{
				$set: {
					Username: req.body.Username,
					Password: req.body.Password,
					Email: req.body.Email,
					Birthday: req.body.Birthday
				}
			},
			{ new: true }
		)
			.then((updatedUser) => {
				if (!updatedUser) {
					return res.status(404).send("Error: User doesn't exist");
				} else {
					res.json(updatedUser);
				}
			})
			.catch((err) => {
				console.error(err);
				res.status(500).send('Error: ' + err);
			});
	});

//add movie to user's favorites
app.post('/users/:userName/movies/:MovieID', passport.authenticate('jwt', { session: false }),
	(req, res) => {
		Users.findOneAndUpdate(
			{ Username: req.params.userName },
			{
				$addToSet: { FavoriteMovies: req.params.MovieID }
			},
			{ new: true }
		)
			.then((updatedUser) => {
				if (!updatedUser) {
					return res.status(404).send("Error: User doesn't exist");
				} else {
					res.json(updatedUser);
				}
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send('Error: ' + error);
			});
	});

// delete movie from favorites
app.delete('/users/:userName/movies/:MovieID', passport.authenticate('jwt', { session: false }),
	(req, res) => {
		Users.findOneAndUpdate(
			{ Username: req.params.userName },
			{
				$pull: { FavoriteMovies: req.params.MovieID }
			},
			{ new: true }
		)
			.then((updatedUser) => {
				if (!updatedUser) {
					return res.status(404).send("Error: User doesn't exist");
				} else {
					res.json(updatedUser);
				}
			})
			.catch((err) => {
				console.error(err);
				res.status(500).send('Error: ' + err);
			});
	});

// delete user by username
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }),
	(req, res) => {
		Users.findOneAndRemove({ Username: req.params.Username })
			.then((user) => {
				if (!user) {
					res.status(400).send(req.params.Username + ' was not found');
				} else {
					res.status(200).send(req.params.Username + ' was deleted.');
				}
			})
			.catch((err) => {
				console.error(err);
				res.status(500).send('Error: ' + err);
			});
	});


app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).send("Something Broke");
});



const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0',() => {
 console.log('Listening on Port ' + port);
});