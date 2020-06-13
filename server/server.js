/* eslint-disable prettier/prettier */
/* eslint-disable no-shadow */
const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
// import model
const db = require('./models/model');

// options for views sendFile responses
const options = {
  root: path.join(__dirname, 'views'),
  dotfiles: 'deny',
  headers: {
    'x-timestamp': Date.now(),
    'x-sent': true
  }
};

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true
  })
);

// serve static files
app.use(express.static(path.resolve(__dirname, 'public')));

/* routes */

// Landing page
app.get('/', (req, res, next) => {
  return res.sendFile('landing-page.html', options, err => {
    if (err) next(err);
  });
});

// Route to login in form from landing-page
app.get('/login', (req, res, next) => {
  return res.sendFile('login-page.html', options, err => {
    if (err) next(err);
  });
});

// signup route
app.get('/signup', (req, res) => {
  res.sendFile('signup-page.html', options, err => {
    if (err) console.error(`Received the following error routing to the signup page: ${err}`);
  });

  return true;
});

// User login route and logic
app.post('/dashboard', (req, res, next) => {
  const { email, password } = req.body;

  // check for valid email and password
  const validUser = `
    SELECT * FROM "user".members
    WHERE email = '${email}' AND password = '${password}'
  `;
  let isValidUser = false;
  db.query(validUser)
    .then(query => {
      const queryRes = query.rows;
      console.log('Valid user check =', queryRes, ', querRes.length =', queryRes.length);
      if (queryRes.length === 1) isValidUser = true;

      // if user is valid send to dashboard page
      console.log('isValidUser =', isValidUser);
      if (isValidUser) {
        res.sendFile('dashboard.html', options, err => {
          if (err) return next(err);

          return next();
        });
      } else {
        res.redirect('/login');
        res.end();
        // return next();
        // res.sendFile('./login-page.html', options, err => {
        //   if (err) console.log(`Error retrieving login page: ${err}`);
        //   return next();
        // });
      }
    })
    .catch(err => {
      console.error(`The following error occured validating user login ${err}`);
    });

    return true;
});

app.post('/user-validation', (req, res, next) => {
  // check if email exists from req.body.email
  const { firstName, lastName, email, password } = req.body;
  const emailQuery = `SELECT email FROM "user".members WHERE email='${email}'`;

  // query db for existing email
  db.query(emailQuery)
    .then((query) => {
      // .members ... where email...etc
      // Query examples https://www.tutorialspoint.com/postgresql/postgresql_select_query.html;
      const emailQueryResult = query.rows;
      console.log('emailQueryResult:', emailQueryResult);

      // if user email is already in the DB
      // still need to handle error to frontend
      if (emailQueryResult.length > 0) {
        // return sendFile so that a new user isn't created with an existing email in the DB
        return res.sendFile('signup-error.html', options, err => {
          if (err) next(err);
        });
      }
      // If no existing email in DB, add a new user to the DB
      const newUser = `
        INSERT INTO "user".members (firstName, lastName, email, password)
        VALUES ('${firstName}', '${lastName}', '${email}', '${password}')`;

      db.query(newUser)
        .then(dbResp => {
          console.log(`${dbResp.command} ${dbResp.rowCount} into members table`);

          return res.sendFile('signup-success.html', options, err => {
            if (err) next(err);
          });
        })
        .catch(err => console.error(`Server responded with error: ${err}`));

        // return true closes out this function, using res.end() causes: Erro
        // [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to
        // the client error since headers have already been set in res.sendFile
        return true;
    })
    .catch(err => console.error(err.stack));
    return true;
});

// Route for button on successful signup
app.post('/valideUser', (req, res) => {
  // Route to the dashboard
  res.sendFile('./dashboard.html', options, err => {
    if (err) console.error(`Routing error for signup user: ${err}`);
  });

  return true;
});

// global unknown route handler
app.get('*', (req, res) => {
  res.sendStatus(404);
});
// global error handler
app.use(function (err, req, res, next) {
  const defaultError = {
    log: 'Express error handler caught and unknown middleware error',
    status: 400,
    message: { err: 'An error has occured' }
  };
  const newErr = Object.assign(defaultError, err); // reassigning error
  console.error(newErr.log);
  res.status(newErr.status).send(newErr.message);

  return next();
});

app.listen(port); // 3000

console.log(`Listening on ${port} at: http://localhost:${3000}`);

//
