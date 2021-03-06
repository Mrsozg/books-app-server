'use strict';

const express = require('express');
const cors = require('cors');
const pg = require('pg');
const fs = require('fs');
const bodyParser = require('body-parser');
const superagent = require('superagent');

const app = express();
const PORT = process.env.PORT;
const DATABASE_URL = process.env.DATABASE_URL;
const CLIENT_URL = process.env.CLIENT_URL;
const TOKEN = process.env.TOKEN;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const client = new pg.Client(DATABASE_URL);
client.connect();
client.on('error', console.error);

app.use(cors());
client.on('error', error => {
  console.error(error);
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static('/'));

app.get('/api/v1/books/find', (req, res) => {
  let url = 'https://www.googleapis.com/books/v1/volumes';
  let query = ''
  if(req.query.title) query += `+intitle:${req.query.title}`;
  if(req.query.author) query += `+inauthor:${req.query.author}`;
  if(req.query.isbn) query += `+isbn:${req.query.isbn}`;

  superagent.get(url)
    .query({'q': query})
    .query({'key': GOOGLE_API_KEY})
    .then(response => response.body.items.map((book, idx) => {
      let { title, authors, industryIdentifiers, imageLinks, description } = book.volumeInfo;
      let placeholderImage = 'http://www.newyorkpaddy.com/images/covers/NoCoverAvailable.jpg';
      return {
        title: title ? title : 'No title available',
        author: authors ? authors[0] : 'No authors available',
        isbn: industryIdentifiers ? `ISBN_13 ${industryIdentifiers[0].identifier}` : 'No ISBN available',
        image_url: imageLinks ? imageLinks.smallThumbnail : placeholderImage,
        description: description ? description : 'No description available',
        book_id: industryIdentifiers ? `${industryIdentifiers[0].identifier}` : '',
      }
    }))
    .then(arr => res.send(arr))
    .catch(console.error)
});

app.get('/api/v1/books/find/:isbn', (req, res) => {
  let url = 'https://www.googleapis.com/books/v1/volumes';
  superagent.get(url)
    .query({ 'q': `+isbn:${req.params.isbn}`})
    .query({ 'key': GOOGLE_API_KEY })
    .then(response => response.body.items.map((book, idx) => {
      let { title, authors, industryIdentifiers, imageLinks, description } = book.volumeInfo;
      let placeholderImage = 'http://www.newyorkpaddy.com/images/covers/NoCoverAvailable.jpg';

      return {
        title: title ? title : 'No title available',
        author: authors ? authors[0] : 'No authors available',
        isbn: industryIdentifiers ? `ISBN_13 ${industryIdentifiers[0].identifier}` : 'No ISBN available',
        image_url: imageLinks ? imageLinks.smallThumbnail : placeholderImage,
        description: description ? description : 'No description available',
      }
    }))
    .then(book => res.send(book[0]))
    .catch(console.error)
});

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

app.post('/api/v1/books', (request, response) => {
  client.query(
    'INSERT INTO books (title, author, isbn, image_url, description) VALUES ($1, $2,$3,$4,$5);',
    [request.body.title, request.body.author, request.body.isbn, request.body.image_url, request.body.description])
  .then(results => response.send(201))
  .catch(console.error)
});

app.delete('/api/v1/books/:id', (req, res) => {
  client.query('delete from books where book_id=$1', [req.params.id])
  .then(() => res.sendStatus(204))
  .catch(console.error);
});

app.put('/api/v1/books/:id', (req, res) => {
  client.query(`
    UPDATE books
    SET title=$1, author=$2, isbn=$3, image_url=$4, description=$5
    WHERE book_id=$6`,[req.body.title, req.body.author, req.body.isbn, req.body.image_url, req.body.description, req.params.id])
  .then(() => res.sendStatus(204))
  .catch(console.error)
})

app.get('/api/v1/admin', (req, res) => res.send(TOKEN === req.query.token))

app.all('*', (req, res) => res.redirect(CLIENT_URL));
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
