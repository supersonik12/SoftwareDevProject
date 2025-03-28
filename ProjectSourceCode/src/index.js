const express = require("express"); // To build an application server or API
const app = express();
const handlebars = require("express-handlebars");
const Handlebars = require("handlebars");
const path = require("path");
const pgp = require("pg-promise")(); // To connect to the Postgres DB from the node server
const bodyParser = require("body-parser");
const session = require("express-session"); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require("bcryptjs"); //  To hash passwords
const axios = require("axios"); // To make HTTP requests from our server. We'll learn more about it in Part C.
const mime = require("mime");

// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************
app.use(express.static(path.join(__dirname, "resources")));
// create `ExpressHandlebars` instance and configure the layouts and partials dir.
let accessTokenPetFinder;
async function fetchAccessToken() {
  const clientId = `${process.env.API_KEY_PETS}`;
  const clientSecret = `${process.env.API_SECRET_PETS}`;
  const url = "https://api.petfinder.com/v2/oauth2/token";
  try {
    const response = await axios.post(
      url,
      `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    accessTokenPetFinder = response.data.access_token;
    tokenExpiresAt = Date.now() + response.data.expires_in * 1000; // Store expiration time
    console.log("New access token fetched!");
  } catch (error) {
    console.error("Error fetching access token:", error.response.data);
  }
}

app.use(async (req, res, next) => {
  if (!accessTokenPetFinder || Date.now() >= tokenExpiresAt) {
    await fetchAccessToken();
  }
  next();
});

const hbs = handlebars.create({
  extname: "hbs",
  layoutsDir: __dirname + "/views/layouts",
  partialsDir: __dirname + "/views/partials",
});

// database configuration
const dbConfig = {
  host: "db", // the database server
  port: 5432, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// test your database
db.connect()
  .then((obj) => {
    console.log("Database connection successful"); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch((error) => {
    console.log("ERROR:", error.message || error);
  });

// *****************************************************
// <!-- Section 3 : App Settings -->
// *****************************************************

// Register `hbs` as our view engine using its bound `engine()` function.
app.engine("hbs", hbs.engine);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// initialize session variables
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.get("/", (req, res) => {
  res.render("pages/splash"); //this will call the /anotherRoute route in the API
});
app.get("/home", async (req, res) => {
  axios({
    url: `https://api.petfinder.com/v2/animals`,
    method: "GET",
    dataType: "json",
    headers: {
      // "Accept-Encoding": "application/json",
      Authorization: `Bearer ${accessTokenPetFinder}`,
    },
    params: {
      page: 3,
    },
  })
    .then((results) => {
      const petsWithPhotos = results.data.animals.filter(
        (pet) => pet.primary_photo_cropped
      );

      const animalData = petsWithPhotos.map((pet) => {
        function getAttributeData(name, data) {
          return {
            isTrue: data,
            name: name,
            isFalse: data === false,
            isNull: data === null,
          };
        }
        const attributesObj = [
          getAttributeData("spayed/neutered", pet.attributes.spayed_neutered),
          getAttributeData("house trained", pet.attributes.house_trained),
          getAttributeData("declawed", pet.attributes.declawed),
          getAttributeData("special needs", pet.attributes.special_needs),
          getAttributeData("shots are current", pet.attributes.shots_current),
          getAttributeData("children", pet.environment.children),
          getAttributeData("cats", pet.environment.cats),
          getAttributeData("dogs", pet.environment.dogs),
        ];
        return {
          photo: pet.primary_photo_cropped.small,
          isMale: pet.gender == "Male",
          ...pet,
          attributesObj,
        };
      });

      res.render("pages/home", {
        animals: animalData || [],
      });
    })
    .catch((error) => {
      console.log(error);
    });
});
// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
app.listen(3000);
console.log("Server is listening on port 3000");
