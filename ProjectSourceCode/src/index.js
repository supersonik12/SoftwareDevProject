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
/*let accessTokenPetFinder;
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
}*/

/*app.use(async (req, res, next) => {
  if (!accessTokenPetFinder || Date.now() >= tokenExpiresAt) {
    await fetchAccessToken();
  }
  next();
});*/

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

app.get('/purrsonality-quiz', (_, res) => {
	const query = `SELECT DISTINCT
	trait_id,
	trait_name,
	min_extreme,
	max_extreme
	FROM traits`;

	db.any('SELECT * FROM traits').then(traits => {
		console.log(traits);
		res.render('pages/quiz', {
			test: 'test',
			traits
		})
	}).catch(err => {
		console.log(err);
		res.status(404);
		res.send;
	});
});

app.post("/purrsonality-quiz", (req, res) => {
	/*Script input: user quiz responses (Floats), Script output: List of breeds sorted by best match.
	 * using Python for better libraries for performing numerical computation
	*/
	userVals = [req.body.aff_val, req.body.play_val, req.body.vigilant_val, req.body.train_val, req.body.energy_val, req.body.bored_val];
	console.log(userVals);
	for (i in userVals) {
		if (userVals[i] <= 0 || userVals[i] > 1) {
			res.status(423).json({
				error: "Values outside expected range",
			});
			res.send;
			return;
		}
	}

	var spawn = require("child_process").spawn;
	var pythonChild = spawn("python3", ["src/resources/python/Matching_Algo.py", req.body.species, req.body.aff_val, req.body.play_val, req.body.vigilant_val, req.body.train_val, req.body.energy_val, req.body.bored_val]);
	
	console.log("Python process spawned");
	pythonChild.stderr.on("data", (err) => {
		console.log(err.toString());	
		res.send(err.toString());
		return;
	});

	pythonChild.stdout.on("data", (data) => {
		res.send(data.toString());
		return;
	});

	pythonChild.on("close", (code) => console.log(code));
});

//Helper Functions

//TODO: implement function to display individual matches based on matching results
//Currently just prints to prevent errors when testing quiz endpoint
function getMatches(matchList) {
	console.log(matchList);
}

// Home routes

app.get("/", (req, res) => {
  if (req.session.user == undefined){
    res.redirect("/splash");
  } else {
    console.log("Welcome user " + req.session.user.name);
    res.render("pages/home");
  }
});

app.get("/home", (req, res) => {
  res.redirect('/');
});

// Guides routes
app.get("/guides", (req, res) => {
  res.render("pages/guides");
});

// Login routes

app.get('/login', (req, res) => {
  res.render('pages/login');
});

app.post('/login', async (req, res) => {
  let email = req.body.email;
  let password = req.body.password;

  let user_query = `SELECT * FROM users WHERE email = $1;`;
  let response = await db.any(user_query, [email]);

  console.log("login POST");

  if (response.length > 0) {
    let user = response[0];
    let hash = user.password;

    if (await bcrypt.compare(password, hash)) {
      req.session.user = user;
      res.redirect('/');
    } else {
      console.log("Password incorrect");
      res.render('pages/login', { message: "Your password was incorrect, try again.", error: true });
    }
  } else {
    console.log("User not found");
    res.render('pages/login', { message: "Account not found.", error: true });
  }
});

// Register routes

app.get('/register', (req, res) => {
  res.render('pages/register');
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


app.post('/register', async (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let name = req.body.name;

  if (email == undefined || password == undefined || name == undefined) {
      console.log(req);
      res.redirect("/register");
  }

  const hash = await bcrypt.hash(password, 10);

  console.log("/register POST");

  try {    
      let add_user_query = `INSERT INTO users (email, password, name) VALUES ($1, $2, $3);`;

      let add_response = await db.any(add_user_query, [email, hash, name]);

      console.log("Registration successful, added user " +  name + " with email " + email);

      // Signs in the new user and redirects to quiz page
      let get_user_query = `SELECT * FROM users WHERE email = $1;`;
      let user_response = await db.any(get_user_query, [email]);
      req.session.user = user_response[0];
      res.redirect('/purrsonality-quiz');

  } catch (err) {
      console.log("Failed to add user " + name);
      console.log(err);
      res.redirect('/register');
  }
});

// Shop routes

app.get('/shop', (req, res) => {
  res.render('pages/shop');
});

// Splash routes

app.get('/splash', (req, res) => {
  res.render('pages/splash');
});

// Logout routes

app.get('/logout', (req, res) => {
  console.log("Logged out user " + req.session.user.name);
  req.session.destroy();
  res.render("pages/splash");
});

    
// Quiz routes


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
