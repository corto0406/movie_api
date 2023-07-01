let express = require('express');
let app = express();

//create GET Express to return list of movies 
let topMovies = [
  {
    title: 'Goodfellas',
    director: 'Martin Scorsese '
  },
  {
    title: 'The Godfather',
    director: 'Francis Ford Coppola'
  },
  {
    title: 'Man on Fire',
    director: 'Tony Scott'
  },
  {
    title: 'Flight',
    director: 'Robert Zemeckis'
  },
  {
    title: 'Snatch',
    director: 'Guy Ritchie'
  },
  {
    title: 'Training Day',
    director: 'Antoine Fuqua'
  },
  {
    title: 'Gladiator',
    director: 'Ridley Scott'
  }
];




//GET for "/"
app.get('/', (req, res) => {
  res.sendFile('public/test.html', { root: __dirname });
});

//read documentation.html file
app.get('/documentation', (req, res) => {
  res.sendFile('public/documentation.html', { root: __dirname });
});

//list of movies
app.get('/movies', (req, res) => {
  res.json(topMovies);
});



//express.static for .html file
app.get('/documentation', (req, res) => {
  res.sendFile('public/documentation.html', { root: __dirname });
});
app.use(express.static('public'));


//morgan

let morgan = require('morgan');

app.use(morgan('common'));

app.get('/test', (req, res) => {
  res.send('Welcome to my app!');
});

app.get('/secreturl', (req, res) => {
  res.send('This is a secret url with super top-secret content.');
});

//error handling

const bodyParser = require('body-parser'),
  methodOverride = require('method-override');

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());
app.use(methodOverride());

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});



app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});

