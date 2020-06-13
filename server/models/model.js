const { Pool } = require('pg'); // import pool class from pg package
require('dotenv').config();

// access vars from .env file
const dbConnect = process.env.DBCONNECTURL; // assign new var to db connection string.
const pool = new Pool({ connectionString: dbConnect });

module.exports = {
  query: (text, params, callback) => {
    // when importing modelJS, it will log the queries run
    console.log('executed query: ', text);
    return pool.query(text, params, callback); // executes query using dbconnect
  }
};
