'use strict';

const express = require('express');
const cors = require('cors');
const pg = require('pg');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT;
const DATABASE_URL = process.env.DATABASE_URL;
const CLIENT_URL = process.env.CLIENT_URL;

const client = new pg.Client(DATABASE_URL);
client.connect();
client.on('error', console.error);

app.use(cors());
client.on('error', error => {
  console.error(error);
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
//app.use(express.static('./book-app-client'));
app.use(express.static('/'));

// REVIEW: These are routes for requesting HTML resources.
// app.get('/new', (request, response) => {
//   response.sendFile('index.html', {root: '/'});
// });

app.get('/api/v1/books', (req, res) => {
  client.query('SELECT book_id, title, author, image_url FROM books;')
  .then(results => res.send(results.rows))
  .catch(console.error)
});

app.get('/api/v1/books/:id', (req, res) => {
  client.query('SELECT * FROM books where book_id =$1', [req.params.id])
  .then(results => res.send(results.rows))
  .catch(console.error)
});

app.post('/api/v1/books', (request,response) => {
  client.query(
    'INSERT INTO books (title, author, isbn, image_url, description) VALUES ($1, $2,$3,$4,$5);',
    [request.body.title, request.body.author, request.body.isbn, request.body.image_url, request.body.description],
    function(err) {
      if (err) console.error(err);}
  )

});


app.all('*', (req, res) => res.redirect(CLIENT_URL));
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
