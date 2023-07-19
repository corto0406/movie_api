let mongoose = require('mongoose');
let Models = require('./models.js');

let express = require('express'),
  bodyParser = require('body-parser');


mongoose.connect('mongodb://localhost:27017/cfDB', { useNewUrlParser: true, useUnifiedTopology: true });


let app = express();

app.use(bodyParser.json());

let Movies = Models.Movie;
let Users = Models.User;


app.delete('/users/:Username', (req, res) => {
	Users.findOneAndRemove({ Username: req.params.Username })
		.then((user) => {
			if (!user) {
				res.status(404).send('User ' + req.params.Username + ' was not found');
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
	console.log(err);
	console.error(err.stack);
});


app.listen(8080, () => {
  console.log('Your app is listening on port 8080');
});
