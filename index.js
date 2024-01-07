/**
 * @fileoverview Main application file for the Movie API project.
 * @module index
 */

const express = require('express');
const morgan = require('morgan');
const app = express();
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Models = require('./models.js');
const { check, validationResult } = require('express-validator');

// Importing the passport configuration
const passport = require('passport');
require('./passport');

/**
 * Database connection using mongoose.
 * @name Database Connection
 * @function
 * @memberof module:index
 */
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

/**
 * Express middleware to handle CORS.
 * @name Cors Middleware
 * @function
 * @memberof module:index
 */
let allowedOrigins = ['http://testsite.com', 'http://localhost:1234', 'https://movie-table.netlify.app', 'http://localhost:4200', 'https://corto0406.github.io/test/', 'https://corto0406.github.io'];
app.use(cors({
	origin: (origin, callback) => {
		if (!origin) return callback(null, true);
		if (allowedOrigins.indexOf(origin) === -1) {
			let message = 'The CORS policy for this application doesn’t allow access from origin ' + origin;
			return callback(new Error(message), false);
		}
		return callback(null, true);
	}
}));

app.use(bodyParser.json());

/**
 * Middleware for user authentication.
 * @name Authentication Middleware
 * @function
 * @memberof module:index
 */
let auth = require('./auth')(app);

app.use(bodyParser.urlencoded({ extended: true }));

/**
 * Creating a write stream for access logs.
 * @name Access Log Stream
 * @type {WriteStream}
 * @memberof module:index
 */
const accessLogScream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {
	flags: 'a'
});
app.use(morgan('combined', { steam: accessLogScream }));

app.use(express.static('public'));

/**
 * Express route for the home page.
 * @name Home Route
 * @function
 * @memberof module:index
 */
app.get('/', (req, res) => {
	res.send('Welcome to Movie-Place!');
});

/**
 * Express route to get all movies.
 * @name Get All Movies Route
 * @function
 * @memberof module:index
 */
app.get('/movies', (req, res) => {
	Models.Movie.find()
		.then((movies) => {
			res.status(201).json(movies);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send('Error: ' + err);
		});
});

/**
 * Express route to get a movie by title.
 * @name Get Movie by Title Route
 * @function
 * @memberof module:index
 */
app.get('/movies/:title', passport.authenticate('jwt', { session: false }),
	/**
	 * Handle the request to get a movie by title.
	 * @function
	 * @memberof module:index
	 * @param {object} req - Express request object.
	 * @param {object} res - Express response object.
	 */
	(req, res) => {
		const { title } = req.params;
		Models.Movie.findOne({ Title: req.params.title })
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

/**
 * Express route to get movies by genre name.
 * @name Get Movies by Genre Route
 * @function
 * @memberof module:index
 */
app.get('/movies/genres/:genreName', passport.authenticate('jwt', { session: false }),
	/**
	 * Handle the request to get movies by genre name.
	 * @function
	 * @memberof module:index
	 * @param {object} req - Express request object.
	 * @param {object} res - Express response object.
	 */
	(req, res) => {
		Models.Movie.find({ 'Genre.Name': req.params.genreName })
			.then((movies) => {
				res.status(200).json(movies);
			})
			.catch((err) => {
				res.status(500).send('Error: ' + err);
			});
	});

/**
 * Express route to find movies by director name.
 * @name Find Movies by Director Route
 * @function
 * @memberof module:index
 */
app.get('/movies/directors/:directorsName', passport.authenticate('jwt', { session: false }),
	/**
	 * Handle the request to find movies by director name.
	 * @function
	 * @memberof module:index
	 * @param {object} req - Express request object.
	 * @param {object} res - Express response object.
	 */
	(req, res) => {
		Models.Movie.find({ 'Director.Name': req.params.directorsName })
			.then((movies) => {
				res.status(200).json(movies);
			})
			.catch((err) => {
				res.status(500).send('Error: ' + err);
			});
	});

/**
 * Express route to add a user.
 * @name Add User Route
 * @function
 * @memberof module:index
 */
app.post('/users', async (req, res) => {
	let hashedPassword = Models.User.hashPassword(req.body.Password);
	await Models.User.findOne({ Username: req.body.Username })
		.then((user) => {
			if (user) {
				return res.status(400).send(req.body.Username + ' already exists');
			} else {
				Models.User
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

/**
 * Express route to find user by username.
 * @name Find User by Username Route
 * @function
 * @memberof module:index
 */
app.get('/users/:Username', passport.authenticate('jwt', { session: false }),
	/**
	 * Handle the request to find user by username.
	 * @function
	 * @memberof module:index
	 * @param {object} req - Express request object.
	 * @param {object} res - Express response object.
	 */
	(req, res) => {
		Models.User.findOne({ Username: "Bobika" })
			.then((user) => {
				res.json(user);
			})
			.catch((err) => {
				console.error(err);
				res.status(500).send('Error: ' + err);
			});
	});

/**
 * Express route to get all users.
 * @name Get All Users Route
 * @function
 * @memberof module:index
 */
app.get('/users', (req, res) => {
	Models.User.find()
		.then((users) => {
			res.status(201).json(users);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send('Error: ' + err);
		});
});

/**
 * Express route to update user info by username.
 * @name Update User Info Route
 * @function
 * @memberof module:index
 */
app.put('/users/:userName',
	[
		check('Username', 'Username is required').isLength({ min: 5 }),
		check('Username', 'Username contains non alphanumeric characters - not allowed.')
			.isAlphanumeric(),
		check('Password', 'Password is required').not().isEmpty(),
		check('Email', 'Email does not appear to be valid').isEmail()
	],
	passport.authenticate('jwt', { session: false }),
	/**
	 * Handle the request to update user info by username.
	 * @function
	 * @memberof module:index
	 * @param {object} req - Express request object.
	 * @param {object} res - Express response object.
	 */
	(req, res) => {
		let errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		}
		let hashedPassword = Models.User.hashPassword(req.body.Password);

		Models.User.findOneAndUpdate(
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

/**
 * Express route to add movie to user's favorites.
 * @name Add Movie to Favorites Route
 * @function
 * @memberof module:index
 */
app.post('/users/:userName/movies/:MovieID', passport.authenticate('jwt', { session: false }),
	/**
	 * Handle the request to add movie to user's favorites.
	 * @function
	 * @memberof module:index
	 * @param {object} req - Express request object.
	 * @param {object} res - Express response object.
	 */
	(req, res) => {
		Models.User.findOneAndUpdate(
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

/**
 * Express route to delete movie from user's favorites.
 * @name Delete Movie from Favorites Route
 * @function
 * @memberof module:index
 */
app.delete('/users/:userName/movies/:MovieID', passport.authenticate('jwt', { session: false }),
	/**
	 * Handle the request to delete movie from user's favorites.
	 * @function
	 * @memberof module:index
	 * @param {object} req - Express request object.
	 * @param {object} res - Express response object.
	 */
	(req, res) => {
		Models.User.findOneAndUpdate(
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

/**
 * Express route to delete user by username.
 * @name Delete User Route
 * @function
 * @memberof module:index
 */
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }),
	/**
	 * Handle the request to delete user by username.
	 * @function
	 * @memberof module:index
	 * @param {object} req - Express request object.
	 * @param {object} res - Express response object.
	 */
	(req, res) => {
		Models.User.findOneAndRemove({ Username: req.params.Username })
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

/**
 * Express error handling middleware.
 * @name Error Handling Middleware
 * @function
 * @memberof module:index
 */
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).send("Something Broke");
});

/**
 * Start the server and listen on a specified port.
 * @name Server Start
 * @function
 * @memberof module:index
 */
const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
	console.log('Listening on Port ' + port);
});
