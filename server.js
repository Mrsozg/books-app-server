
'use strict';
// REVIEW: Check out all of our new arrow function syntax!


const express = require('express');
const cors = require('cors');
const pg = require('pg');
const app = express();
const PORT = process.env.PORT;
const CLIENT_URL = process.env.CLIENT_URL;
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();


client.on('error', err => {console.error(err);});

app.use(cors());
app.get('/',(req,res)=>res.send('Testing 1,2,3'));
app.get('*',(req,res)=res.redirect(CLIENT_URL));
app.listen(PORT,()=> console.log(`listening on port:${PORT}`));
