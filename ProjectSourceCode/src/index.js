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
const fs = require("fs");
const csv = require("csv-parser");

// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************
app.use(express.static(path.join(__dirname, ".")));

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
app.use(function (req, res, next) {
  res.locals.session = req.session;
  next();
});

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

// Home routes

app.get("/", async (req, res) => {
  if (req.session.user == undefined) {
    res.redirect("/splash");
  } else {
    renderHomePage(req.query, res);
    console.log("Welcome user " + req.session.user.name);
  }
});

app.get("/home", async (req, res) => {
  if (req.session.user == undefined) {
    res.redirect("/");
  } else renderHomePage(req.query, res, req.session.user.email);
});

// Guides routes
app.get("/guides", (req, res) => {
  res.render("pages/guides");
});

// Login routes

app.get("/login", (req, res) => {
  res.render("pages/login");
});

app.post("/login", async (req, res) => {
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
      res.redirect("/");
    } else {
      console.log("Password incorrect");
      res.render("pages/login", {
        message: "Your password was incorrect, try again.",
        error: true,
      });
    }
  } else {
    console.log("User not found");
    res.render("pages/login", {
      message: "Account not found.",
      error: true,
    });  }
});

// Register routes

app.get("/register", (req, res) => {
  res.render("pages/register");
});

app.post("/register", async (req, res) => {
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

    console.log(
      "Registration successful, added user " + name + " with email " + email
    );

    // Signs in the new user and redirects to quiz page
    let get_user_query = `SELECT * FROM users WHERE email = $1;`;
    let user_response = await db.any(get_user_query, [email]);
    req.session.user = user_response[0];
    res.redirect("/purrsonality-quiz-1");
  } catch (err) {
    console.log("Failed to add user " + name);
    console.log(err);
    res.render("pages/register", {
      message: "Account already exists.",
      error: true,
    });
  }
});

//Account Routes
app.get("/account", async (req, res) => {
  if (req.session.user == undefined) {
    res.redirect("/");
  } else {
    const user = {
      name: req.session.user.name,
      species: req.session.user.species_preference,
    };
    console.log(user);
    const favorites = await db.any(`
    SELECT * FROM favorites
    WHERE user_email = '${req.session.user.email}';
    `);
    console.log(favorites);
    res.render("pages/account", { user, favorites });
  }
});

app.post("/verify", async (req, res) => {
  let email = req.body.email;
  let password = req.body.password;

  let user_query = `SELECT * FROM users WHERE email = $1;`;
  let response = await db.any(user_query, [email]);

  if (response.length > 0) {
    let user = response[0];
    let hash = user.password;

    if (await bcrypt.compare(password, hash)) {
      res.send(`
        <h2>Welcome, ${user.name}!</h2>
        <form action="/update" method="POST">
          <input type="hidden" name="name" value="${user.name}" />
          <input type="hidden" name = "email" value = "${user.email}"/>
          <input type="text" name="newName" placeholder="New name" />
          <input type="password" name="newPassword" placeholder="New password" />
          <button type="submit">Update</button>
        </form>
      `);
    } else {
      console.log("Password incorrect");
      res.render("pages/account", {
        message: "Your password was incorrect, try again.",
        error: true,
      });
    }
  } else {
    console.log("User not found");
    res.render("pages/account", { message: "Account not found.", error: true });
  }
});

app.post("/update", async (req, res) => {
  let newName = req.body.newName;
  console.log("new name is:" + newName);
  let newPassword = req.body.newPassword;
  let email = req.body.email;

  try {
    let user_query = `SELECT * FROM users WHERE email = $1;`;
    let userResult = await db.any(user_query, [email]);
    console.log(email);
    if (userResult.length > 0) {
      const user = userResult[0];
      let updatedName = user.name;
      if (newName != "") {
        console.log("new name is not undefined");
        updatedName = newName;
      }
      let updatedPassword = user.password;
      if (newPassword != "") {
        console.log("new password is not undefined");
        updatedPassword = await bcrypt.hash(newPassword, 10);
      }
      await db.none(
        "UPDATE users SET name = $1, password = $2 WHERE email = $3",
        [updatedName, updatedPassword, email]
      );
      //session doesn't auto update so need to manually do it.   TODO: ask about storing password in session
      req.session.user.name = updatedName;
      //req.session.user.password = updatedPassword;
      console.log(req.session.user.name);
      //console.log(req.session.user.password);
      res.send(
        `<p>Information updated successfully! <a href="/account">Back to account</a></p>`
      );
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Update failed.");
  }
});

app.post("/favorite", async (req, res) => {
  const name = req.body.name;
  const photo = req.body.photo;
  const description = req.body.description;
  const email = req.session.user.email;
  const id = req.body.id;
  const link = req.body.link;
  //why are these values all undefined
  // console.log("alljson: ", alljson);
  console.log("name: ", name);
  console.log("photo link: ", photo);
  console.log("description: ", description);

  try {
    const query = `
      INSERT INTO favorites (user_email, pet_id, pet_name, pet_photo, pet_description, pet_link)
      VALUES ('${email}', ${id}, '${name}', '${photo}', '${description}', '${link}')
    `;
    await db.any(query);
    res.redirect("/home");
  } catch (err) {
    console.error("Error favoriting pet:", err);
    res.status(500).send("Something went wrong");
  }
});

app.post("/delete", async (req, res) => {
  const id = req.body.id;
  const email = req.session.user.email;
  try {
    await db.any(
      `DELETE FROM favorites WHERE user_email = '${email}' AND pet_id = ${id};`
    );
    res.send(
      '<p> Pet deleted from favorites! <a href="/account">Back to account</a></p>'
    );
  } catch (err) {
    console.error("Error deleting pet");
    res.status(500).send("Something went wrong");
  }
});

// Shop routes

// Mock data for the shop
const mockItems = [
  { id: 1, title: "Cat Toy", image: "/images/cat-toy.jpg", description: "A brain-tickling toy for cats", category: "cat", link: "https://www.amazon.com/Catstages-Tracks-Interactive-3-Tier-Spinning/dp/B00DT2WL26?crid=34L4AZUGFFT0S&dib=eyJ2IjoiMSJ9.3dMAuv5wUAHv5K_sFtwlVZVP9PwQDJib79z7Geixg_Iq4hpL2U0Fbva9A66jcfqVBrsskSi1hThugGyEoFnCQCKfteYFiFKPxQ7qi94OZRlywYG5x4nBug0fQfPRTH4ckMqT0lwd5-z_B_sq48SFZ3n9Xu-ef1kqNP0jDA7BL4xRDu6ve3EHt_KczQIRZYVuIXbn95UnaorgONlBU9_IesHF524_PBK6X04bZ2WFSUAC2doFya7zu9x--rs81iL3CPo4ZYRwVFcRRekZsOU8UDy0GloUDsb_X3ZT2Jqyl-4.wjVeoJaqFOCjvIKgbbBYCZ5Mv9LA7SbtoUfwTRyeGUI&dib_tag=se&keywords=CAT+TOY%5C&qid=1744862193&sprefix=cat+toy%2Caps%2C167&sr=8-24"},
  { id: 2, title: "Dog Leash", image: "/images/dog-leash.jpg", description: "A sturdy leash for dogs", category: "dog", link: "https://www.amazon.com/TUG-Patented-Tangle-Free-Retractable-One-Handed/dp/B076F7HM8T?crid=84GB9G2ZSC8G&dib=eyJ2IjoiMSJ9.uGi_sUTnSz1YUXE6ZBCYifWxe8V_NA0pN7ow4TsNhurGTTLeolCJxfI_R-cOGrlFl6NFXHEG8N4iTEo_7ms6pO5ZktYKF1QZdH2QepoNzfEmuSbku7awCLVa_jO48H-z-vFnQDkqd7GLhzOQ7tzjpgSg8hhyGJonDadw4y6-Eh-bEGb0BPr6X3YKzs_6uZLBTsh-6Yn6dtfs9rn1zYihnyyKot7d_hPdCNiOYmktyJS-brVzq5TL2C3-32hOMJ5CY220Ltu0mf6MilrCxKJjfIjFr4BuIC3ywBdgp-0j6Hc.w1xNoYR6Dn9clSGxbRBb4ACOfOG96asT9lMXZ1A8v7k&dib_tag=se&keywords=dog%2Bleash&qid=1744862266&sprefix=dog%2Ble%2Caps%2C200&sr=8-7&th=1"},
  { id: 3, title: "Bird Feeder", image: "/images/bird-feeder.jpg", description: "A feeder for birds", category: "other", link: "https://www.amazon.com/Youvip-Metal-Roof-Bird-Feeder/dp/B0DK153SH2?crid=1Y55T7LCFMCJ6&dib=eyJ2IjoiMSJ9.-DdaQLQIGzg2kx0QCAKhHs8Nv8kJ8o0Qelrk1aEFNPTqVyRbC9GjQpggr9pdTGvd-dR-Erej3XdI5Tl_AuQRTF1JYFxWiH1cmr3Si9lF9qi4dmdcWLoL-P4Cs0vcc9sWJd7AMCkLDndn0-goda2MxoVXRKGkhJnac02VF9IqgMoNNZxWbn8zacXoSvC4LSZhprA1v_VjyGArhqwjeKk6TGFfTDSSYfrFIbtH9SppzLjgO5cRz-KviA5NqKX0xuza-gugA0Kr-B3HUYe2SO0bP8CGwBVnlRnumTGBkwrt6U8.Q8L_YQ8wsXokM206DzZUf_QvywCEA8tTzqW16VzjD8o&dib_tag=se&keywords=bird%2Bfeeder&qid=1744862305&sprefix=bird%2Bfeede%2Caps%2C262&sr=8-7&th=1"},
  { id: 4, title: "Cat Bed", image: "/images/cat-bed.jpg", description: "A cozy bed for cats", category: "cat", link: "https://www.amazon.com/Loves-cabin-Anti-Slip-Water-Resistant-Washable/dp/B07MFYSKCL?crid=3LSGMRAQB5DD0&dib=eyJ2IjoiMSJ9.GS1WC57H04g0HTAPP-Tc4pqsQz5Dd64jljHw32PG2P_5SxWuULNNvSL0l352EHV3gJtnZxZjDiPpTcE7YtRQV1Ohu4RKv6mxo2ikikvFbdEGSXRd0H2bd3Y5lCKvqWtUn-W6x5VGxPdiNCTqMlNkhgWzvE5FfrCGAhKw1qui2DvnTm1JemS92jeyAEfT7Lie1yoDg7eDhP_LvWWM3s3_-9BSnCfPmdnq4rwdmANy3qvs1npRPMKLQyTIsPEHL1wGXsaCdbx_wwnoHGcub5pADLc3C8VhcBuF52lTxfRJ1D4.wSok-T9IcpNaeEwXqGrS9KQBQC4JiZyW8rBG3nqbY7U&dib_tag=se&keywords=cat%2Bbed&qid=1744862329&sprefix=cat%2Bbed%2Caps%2C188&sr=8-6&th=1" },
  { id: 5, title: "Dog Toy", image: "/images/dog-toy.jpg", description: "A chew toy for dogs", category: "dog", link: "https://www.amazon.com/Benebone-Wishbone-Durable-Aggressive-Chewers/dp/B00CPDWT2M?crid=3E0TTR7PP9SST&dib=eyJ2IjoiMSJ9.mctglYej7FnhfBM0WjzsJlQsRvwdXM_9bAJWiHG0DoQ5ppqwbX0k6KUlAUS-Wm8skqHcSFUEAbjIJLmBALcd5FgqcWeDgtVx6iEvXGYIgULPrKTdxofDSWDWXZVaMPYKRZyBDL7zHdSmSWe4nGxyGSJF980U3gykhjLAFQBt27mLHFk6gu_cE3mQJNARh54vvTFFs7Jm8CM0eE58uAgisZw26M8x_ygY1nft6rJzdN5inTZG8ot6HeB1emMl2SpJInJMB6Sj-1IgmZe_ugvlGvZI0T6QDLZQVjhZnDRyNRQ.-KSSw0WY-2V1z0oD1qp2yprtG86_YzzgBDMbKE9UEGw&dib_tag=se&keywords=dog%2Btoy&qid=1744862384&rdc=1&sprefix=dog%2Bto%2Caps%2C332&sr=8-9&th=1"},
];

// Helper function to categorize items
function categorizeItems(items) {
  const sections = {
    cat: { title: "Cat", items: [] },
    dog: { title: "Dog", items: [] },
    other: { title: "Other", items: [] },
  };

  items.forEach((item) => {
    if (sections[item.category]) {
      sections[item.category].items.push(item);
    } else {
      sections.other.items.push(item);
    }
  });
 
  return Object.values(sections);
}

// GET route for the shop
app.get("/shop", (req, res) => {
  try {
    // Use mock data instead of fetching from an API
    const sections = categorizeItems(mockItems);

    // Render the shop page with categorized data
    res.render("pages/shop", { sections });
    console.log("Shop page rendered successfully");
  } catch (error) {
    console.error("Error rendering shop page:", error);
    res.status(500).send("Error loading shop page.");
  }
});

// POST route for the shop
app.post("/shop", (req, res) => {
  try {
    // Use mock data instead of fetching from an API
    const sections = categorizeItems(mockItems);

    // Send the categorized data back to the client
    res.json({ sections });
  } catch (error) {
    console.error("Error processing shop data:", error);
    res.status(500).json({ error: "Failed to process shop data." });
  }
});

// Splash routes

app.get("/splash", (req, res) => {
  res.render("pages/splash");
});

// Logout routes

app.get("/logout", (req, res) => {
  if (req.session.user != undefined) {
    console.log("Logged out user " + req.session.user.name);
    req.session.destroy();
  }
  res.redirect("/splash");
});

// Quiz routes
app.get("/purrsonality-quiz-1", (_, res) => {
	res.render("pages/quiz-1");
});

app.post("/purrsonality-quiz-1", (req, res) => {
	db.none(`UPDATE users SET species_preference = '${req.body.species}';`)
		.then(res.redirect("/purrsonality-quiz-2"))
		.catch(err => {
			res.send(err);
		});
});

app.get("/purrsonality-quiz-2", (req, res) => {
  const query = `SELECT t.trait_name, t.min_extreme, t.max_extreme
		FROM traits_to_species tts
		JOIN species s ON tts.species_id = s.species_id
		JOIN traits t ON tts.trait_id = t.trait_id
		WHERE s.species_name = (SELECT species_preference FROM users WHERE email = '${req.session.user.email}');`;
	
  db.any(query)
    .then((traits) => {
		 res.render("pages/quiz-2", {
		   traits
		});
	 })
    .catch((err) => {
      console.log(err);
      res.status(404);
      res.send;
    });
});

app.post("/purrsonality-quiz-2", async (req, res) => {
  /*Script input: user quiz responses (Floats), Script output: List of breeds sorted by best match.
   * using Python for better libraries for performing numerical computation
   */
  const speciesObj = await db.one(`SELECT species_preference FROM users WHERE email = '${req.session.user.email}'`); 
  const species = speciesObj.species_preference;
  console.log(species)
  switch (species) {
    case "dog": {
      userVals = [
        req.body.aff_val,
        req.body.open_val,
        req.body.play_val,
        req.body.vigilant_val,
        req.body.train_val,
        req.body.energy_val,
        req.body.bored_val,
      ];
      break;
    }
    case "cat": {
      userVals = [
        req.body.aff_val,
        req.body.open_val,
        req.body.play_val,
        req.body.train_val,
        req.body.energy_val,
        req.body.ind_val,
      ];
      break;
    }
    case "small": {
      res.send("Coming soon!");
      return;
    }
    default: {
      res.status(400).json({
        error: "Unknown option",
      });
      res.send;
      return;
    }
  }

  console.log(userVals);
  for (i in userVals) {
    if (userVals[i] < -1 || userVals[i] > 1) {
      res.status(423).json({
        error: "Values outside expected range",
      });
      res.send;
      return;
    }
    //prevents division by zero errors
    else if (userVals[i] == 0) {    
	    userVals[i] = 0.01;
    }
  }
  console.log(req.body);
  const spawn = require("child_process").spawn;
  console.log(species);
  const pythonChild = spawn("python3", [
    "src/resources/python/Matching_Algo.py",
    species,
    userVals,
  ]);

  console.log("Python process spawned");
  pythonChild.stderr.on("data", (err) => {
    console.log(err.toString());
    return;
  });

  pythonChild.stdout.on("data", (data) => {
    const values = data
      .toString()
      .split(", ")
      .map(Number)
      .filter((val) => {
        return !isNaN(val);
      });

    const query = `UPDATE users SET
    species_preference = '${req.body.species}', 
		  quiz_results = '{${values}}' WHERE email = '${req.session.user.email}';`;
    db.none(query)
      .then(() => {
        console.log("Database successfully updated");
        res.redirect("/home");
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          error: "Unexpected error occured",
        });
        res.send;
      });
    return;
  });

  pythonChild.on("close", (code) => console.log(code));
});
//render home helpers
//x button for search bar
//reset filter button
//breeds only keep first
//species_preference
//petfinder breeds call

async function getIdsToBreeds(type) {
  let results = [];
  const csvDir = path.resolve(__dirname, "data");

  const url = path.resolve(csvDir, `${type}s.csv`);

  await new Promise((resolve, reject) => {
    fs.createReadStream(url)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", resolve) // Resolve the Promise when stream ends
      .on("error", reject); // Reject the Promise if there's an error
  });

  return results.map((result) => {
    return {
      id: result.id,
      name: result.name,
    };
  });
}
let dogBreeds;
let catBreeds;
async function getUserBreeds(email, num = 10) {
  let breedIds = `SELECT quiz_results, species_preference FROM users where email = 
  '${email}'`;
  let breedType;
  let topBreeds = [];
  let breedRank = [];
  await db
    .one(breedIds)
    .then((results) => {
      breedRank = results.quiz_results;
      breedType = results.species_preference;
    })
    .catch((error) => {
      console.log(error);
    });

  let breeds = await getIdsToBreeds(breedType);
  console.log(breeds);
  console.log(breedRank);
  for (let i = 0; i < num; i++) {
    let breed = breeds.find((breed) => {
      return parseInt(breed.id) == breedRank[i];
    });

    if (breed && breed.name) {
      topBreeds.push(breed.name);
    }
  }
  if (breedType == "dog") {
    if (!dogBreeds) {
      dogBreeds = await getBreeds(breedType);
    }

    return filterBreeds(dogBreeds, topBreeds);
  }
  if (breedType == "cat") {
    if (!catBreeds) {
      catBreeds = await getBreeds(breedType);
    }
    console.log(catBreeds);
    console.log(topBreeds);

    return filterBreeds(catBreeds, topBreeds);
  }
}

function filterBreeds(breeds, topBreeds) {
  return topBreeds.filter((breed) => {
    return breeds["breeds"].find((ele) => ele.name == breed);
  });
}

async function getFilterParameters(query, email) {
  let paramObj = {};
  if (query) {
    if ("breed" in query) {
      breed = query.breed;
      compatibility = false;
    } else if ("compatibility" in query) {
      breed = undefined;
      compatibility = parseInt(query["compatibility"]);
    } else {
      filters = query;
    }
  }
  if (filters) {
    paramObj = { ...filters };
  }
  if (breed) {
    paramObj.breed = breed;
  } else if (compatibility) {
    let breeds = await getUserBreeds(email);
    paramObj.breed = breeds;
    if (breeds.length == 0) {
      return false;
    }
  }
  console.log(paramObj);
  return paramObj;
}

let filters;
let breed;
let compatibility;
async function renderHomePage(query, res, email) {
  let paramObj = await getFilterParameters(query, email);

  let data = await callPetApi(paramObj);
  if (!data || !paramObj) {
    res.render("pages/home", {
      error: true,
      filters: filters,
      breed: breed,
    });
    return;
  }
  let pages = getPageData(getFormattedAnimalData(data), 12);

  let sendingData = {
    pages: pages,
    pageCount: pages.length,
    selectedPage: 0,
    filters: filters,
    breed: breed,
    compatibility: compatibility,
  };

  res.render("pages/home", {
    ...sendingData,
    data: JSON.stringify(sendingData),
    error: false,
  });
}

function getAttributeData(name, data) {
  return {
    isTrue: data,
    name: name,
    isFalse: data === false,
    isNull: data === null,
  };
}

function getFormattedAnimalData(data) {
  return data.map((pet) => {
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
}

function getPageData(data, elePerPage) {
  let pages = [];
  let pageCount = Math.ceil(data.length / elePerPage);

  for (let i = 0; i < pageCount; i++) {
    pages[i] = [];
    for (let j = 0; j < elePerPage; j++) {
      if (data[i * elePerPage + j]) {
        pages[i].push(data[i * elePerPage + j]);
      }
    }
  }

  return pages;
}

Handlebars.registerHelper("ifEquals", function (a, b, options) {
  if (a == b) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

Handlebars.registerHelper("ifContains", function (ele, arr, options) {
  if (arr && arr.includes(ele) && !(arr == "female" && ele == "male")) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

async function callPetApi(query) {
  let data;
  await axios({
    url: `https://api.petfinder.com/v2/animals`,
    method: "GET",
    dataType: "json",
    headers: {
      // "Accept-Encoding": "application/json",
      Authorization: `Bearer ${accessTokenPetFinder}`,
    },

    params: {
      ...query,
      page: 1,
      limit: 50,

      status: "adoptable",
    },
  })
    .then((results) => {
      data = results.data.animals.filter((pet) => pet.primary_photo_cropped);
    })
    .catch((error) => {
      return false;
    });

  return data;
}

async function getBreeds(type) {
  let data;
  await axios({
    url: `https://api.petfinder.com/v2/types/${type}/breeds`,
    method: "GET",
    dataType: "json",
    headers: {
      // "Accept-Encoding": "application/json",
      Authorization: `Bearer ${accessTokenPetFinder}`,
    },

    params: {
      page: 1,
    },
  })
    .then((results) => {
      data = results.data;
    })
    .catch((error) => {
      return false;
    });

  return data;
}

// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests

// ***********************************************************
// added for testing a dummy API
app.get("/welcome", (req, res) => {
  res.json({ status: "success", message: "Welcome!" });
});
// ***********************************************************

module.exports = app.listen(3000); // changed for testing
console.log("Server is listening on port 3000");
