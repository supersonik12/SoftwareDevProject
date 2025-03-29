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

// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
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


//Helper Functions

//TODO: implement function to display individual matches based on matching results
//Currently just prints to prevent errors when testing quiz endpoint
function getMatches(matchList) {
	console.log(matchList);
}

app.get("/", (req, res) => {
  res.render("pages/splash"); //this will call the /anotherRoute route in the API
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


// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
app.listen(3000);
console.log("Server is listening on port 3000");
