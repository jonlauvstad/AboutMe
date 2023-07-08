/**
 * This is the main server script that provides the API endpoints
 * The script uses the database helper in /src
 * The endpoints retrieve, update, and return data to the page handlebars files
 *
 * The API returns the front-end UI handlebars pages, or
 * Raw json if the client requests it with a query parameter ?raw=json
 */

// Utilities we need
const fs = require("fs");
const path = require("path");

// ANDERS':
const bcrypt = require("bcrypt");

// Require the fastify framework and instantiate it
const fastify = require("fastify")({
  // Set this to true for detailed logging:
  logger: false,
});

// Setup our static files
fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "public"),
  prefix: "/", // optional: default '/'
});

// Formbody lets us parse incoming forms
fastify.register(require("@fastify/formbody"));

// View is a templating manager for fastify
fastify.register(require("@fastify/view"), {
  engine: {
    handlebars: require("handlebars"),
  },
});

// Load and parse SEO data
const seo = require("./src/seo.json");
if (seo.url === "glitch-default") {
  seo.url = `https://${process.env.PROJECT_DOMAIN}.glitch.me`;
}

// We use a module for handling database operations in /src
const data = require("./src/data.json");
const db = require("./src/" + data.database);

/**
 * Home route for the app
 *
 * Return the poll options from the database helper script
 * The home route may be called on remix in which case the db needs setup
 *
 * Client can request raw data using a query parameter
 */


//fastify.get("/", async (request, reply) => {
  /* 
  Params is the data we pass to the client
  - SEO values for front-end UI but not for raw data
  */
  //let params = request.query.raw ? {} : { seo: seo };
  
  // Get the available choices from the database
  //const options = await db.getOptions();
  //if (options) {
    //params.optionNames = options.map((choice) => choice.language);
    //params.optionCounts = options.map((choice) => choice.picks);
  //}
  // Let the user know if there was a db error
  //else params.error = data.errorMessage;

  // Check in case the data is empty or not setup yet
  //if (options && params.optionNames.length < 1)
    //params.setup = data.setupMessage;

  // ADD PARAMS FROM TODO HERE

  // Send the page options or raw JSON data if the client requested it
  //return request.query.raw
    //? reply.send(params)
    //: reply.view("/src/pages/index.hbs", params);
//});



/**
 * Post route to process user vote
 *
 * Retrieve vote from body data
 * Send vote to database helper
 * Return updated list of votes
 */
fastify.post("/", async (request, reply) => {
  // We only send seo if the client is requesting the front-end ui
  let params = request.query.raw ? {} : { seo: seo };

  // Flag to indicate we want to show the poll results instead of the poll form
  params.results = true;
  let options;

  // We have a vote - send to the db helper to process and return results
  if (request.body.language) {
    options = await db.processVote(request.body.language);
    if (options) {
      // We send the choices and numbers in parallel arrays
      params.optionNames = options.map((choice) => choice.language);
      params.optionCounts = options.map((choice) => choice.picks);
    }
  }
  params.error = options ? null : data.errorMessage;

  // Return the info to the client
  return request.query.raw
    ? reply.send(params)
    : reply.view("/src/pages/index.hbs", params);
});

/**
 * Admin endpoint returns log of votes
 *
 * Send raw json or the admin handlebars page
 */
fastify.get("/logs", async (request, reply) => {
  let params = request.query.raw ? {} : { seo: seo };

  // Get the log history from the db
  params.optionHistory = await db.getLogs();

  // Let the user know if there's an error
  params.error = params.optionHistory ? null : data.errorMessage;

  // Send the log list
  return request.query.raw
    ? reply.send(params)
    : reply.view("/src/pages/admin.hbs", params);
});

/**
 * Admin endpoint to empty all logs
 *
 * Requires authorization (see setup instructions in README)
 * If auth fails, return a 401 and the log list
 * If auth is successful, empty the history
 */
fastify.post("/reset", async (request, reply) => {
  let params = request.query.raw ? {} : { seo: seo };

  /* 
  Authenticate the user request by checking against the env key variable
  - make sure we have a key in the env and body, and that they match
  */
  if (
    !request.body.key ||
    request.body.key.length < 1 ||
    !process.env.ADMIN_KEY ||
    request.body.key !== process.env.ADMIN_KEY
  ) {
    console.error("Auth fail");

    // Auth failed, return the log data plus a failed flag
    params.failed = "You entered invalid credentials!";

    // Get the log list
    params.optionHistory = await db.getLogs();
  } else {
    // We have a valid key and can clear the log
    params.optionHistory = await db.clearHistory();

    // Check for errors - method would return false value
    params.error = params.optionHistory ? null : data.errorMessage;
  }

  // Send a 401 if auth failed, 200 otherwise
  const status = params.failed ? 401 : 200;
  // Send an unauthorized status code if the user credentials failed
  return request.query.raw
    ? reply.status(status).send(params)
    : reply.status(status).view("/src/pages/admin.hbs", params);
});

// Run the server and report out to the logs
fastify.listen(
  { port: process.env.PORT, host: "0.0.0.0" },
  function (err, address) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Your app is listening on ${address}`);
  }
);


// MITT:
const utility = require("./src/utility.js");

fastify.get("/myshit", async function (request, reply) {
  // Gir kontekst 'username' hvis logget inn:
  let username; 
  let admin;
  const userAdmin = await utility.checkAdmin(request);
  
  let svar = await db.getCountGroupBy("Log", "choice");
  
  let requestBody = request.query;
  let params = {
      minOpplysning: "Anders",  
      body: requestBody,   
    };
  
  if(userAdmin != null){ 
    [username, admin] = userAdmin;
    params.username = username; 
    params.admin = admin; 
    //console.log("U & A:", username, admin);
  }
  
  try{ params.html = svar.filter(elm=>elm.choice=="HTML")[0]["COUNT(*)"]; } catch{params.html = 0; }
  try{ params.js = svar.filter(elm=>elm.choice=="JavaScript")[0]["COUNT(*)"]; } catch{params.js = 0; }
  try{ params.css = svar.filter(elm=>elm.choice=="CSS")[0]["COUNT(*)"]; } catch{params.css = 0; }
  
  return reply.view("/src/pages/myShit.hbs", params);
});

fastify.post("/GetAllFromTable", async function (request, reply) {
  console.log("BODY: ", request.body);
  const body = JSON.parse(request.body);
  let tableName = body["tableName"];
  var options = await db.getAll(tableName)
  let params = {
    data: options
  }
  return reply.send(params);
});

fastify.post("/GetVoteCount", async function(request, reply) {
  const body = JSON.parse(request.body);
  let language = body["language"];
  const now = new Date();
  const time = new Date().toISOString();
  //const time = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`
  await db.insertInto("Log", ["choice", "time"], [language, time]);
  
  let choice = await db.getCountOneCrit("Log", "choice", language);
  console.log("CHOICE:", choice);
  let params = { };
  try{
    params.tagId = `${language.toLowerCase()}Votes`;
    params.countValue = choice[`${language}`]; 
  } catch{
    params.tagId = `${language.toLowerCase()}Votes`;
    params.countValue = 0; 
  }
  return reply.send(params);
})

fastify.delete("/DeleteOneCrit", async function(request, reply){
  const body = JSON.parse(request.body);
  let language = body["language"];
  await db.deleteWhere("Log", "choice", language);
  let choice = await db.getCountOneCrit("Log", "choice", language);
  let params = { };
  
  try{ 
    params.tagId = `${language.toLowerCase()}Votes`;
    params.countValue = choice[`${language}`]
  } catch{
    params.tagId = `${language.toLowerCase()}Votes`;
    params.countValue = 0; 
  }
  
  return reply.send(params);
})

fastify.put("/transferVotes", async function(request, reply){
  const body = JSON.parse(request.body);
  let fromLanguage = body["fromLanguage"];
  let toLanguage = body["toLanguage"];
  await db.updateWhereTo("Log", "choice", fromLanguage, "choice", toLanguage);
  
  let params = {};
  let svar = await db.getCountGroupBy("Log", "choice");
  try{ params.html = svar.filter(elm=>elm.choice=="HTML")[0]["COUNT(*)"]; } catch{params.html = 0; }
  try{ params.js = svar.filter(elm=>elm.choice=="JavaScript")[0]["COUNT(*)"]; } catch{params.js = 0; }
  try{ params.css = svar.filter(elm=>elm.choice=="CSS")[0]["COUNT(*)"]; } catch{params.css = 0; }
  return reply.send(params);
})

fastify.get("/adm", async function(request, reply) {
  let params = {};
  
  const userAdmin = await utility.checkAdmin(request);
  if(userAdmin != null){ 
    params.username = userAdmin[0];
    params.admin = userAdmin[1]; 
  }
  else{ return reply.redirect("/"); }
  if(params.admin != 1){ return reply.redirect("/"); }
  
  // CHECK UNREAD
  const countMsg = await db.get(`SELECT COUNT(*) AS antallUleste FROM messages WHERE touser = '${params.username}' AND read = 0`);
  params.countMsg = countMsg.antallUleste;
  
  params.tables = await db.showTables();
  return reply.view("/src/pages/adm.hbs", params)
})

fastify.get("/showTables", async function(request, reply) {
  let params = {};
  params.tables = await db.showTables();
  return reply.send(params);
})

fastify.post("/getSchema", async function(request, reply) {
  const body = JSON.parse(request.body);
  const tableName = body["tableName"]
  let params = {};
  params.schema = await db.getSchema(tableName);
  return reply.send(params);
})

fastify.post("/executeSQL", async function(request, reply) {
  const body = JSON.parse(request.body);
  const dbMethod = body.dbMethod;
  const cmd = body.cmd;
  //console.log("dbMethod:", `${dbMethod}`)
  //console.log("cmd:", cmd);
  let params = {};
  if(dbMethod == "all"){
    params.all = await db.all(cmd);
    return reply.send(params);
  }
  if(dbMethod == "get"){
    params.get = await db.get(cmd);
    return reply.send(params);
  }
  await db.run(cmd);
  params.run = "To see the effects of the submitted command, click the 'Show tables' or 'Show schema'-button, or write a query via the" 
    +"'Write SQL-button";
  return reply.send(params);  
})

fastify.get("/register", async function(request, reply) {
  let params = {};
  const userAdmin = await utility.checkAdmin(request);
  //console.log("userAdmin:", userAdmin);
  if(userAdmin != null){ 
    params.username = userAdmin[0];
    params.admin = userAdmin[1];
    return reply.redirect("/");
  }
  return reply.view("/src/pages/register.hbs", params);
})

fastify.post("/register", async function(request, reply) {
  const username = request.body.username;
  let password = request.body.password;
  let confirmation = request.body.confirmation;
  const fornavn = request.body.fornavn;
  const etternavn = request.body.etternavn;
  const email = request.body.email;
  const sex = request.body.sex;
  
  let params = {};
  
  if(utility.hasWhiteSpace(username)){
    params.message1 = "Brukernavnet kan ikke inneholde spesialtegn";
    params.message2 = "eller 'whitespace'."
    return reply.view("/src/pages/register.hbs", params);
  }
  
  // Sjekke pw vs conf
  if(password != confirmation){
    params.message1 = "'Passord' og 'Bekreft passord' må være identiske.";
    params.message2 = "Prøv igjen!";
    return reply.view("/src/pages/register.hbs", params);
  }
  
  // Sjekke om username i db allerede
  const users = await db.all(`SELECT * FROM user WHERE username = '${username}'`);
  if(users.length > 0){
    params.message1 = `'${username}' er dessverre opptatt.`
    params.message2 = "Vennligst prøv igjen med et annet brukernavn."
    return reply.view("/src/pages/register.hbs", params);
  }
  
  // Registrere brukeren i user
  const hash = await bcrypt.hash(password,5);
  await db.run(`INSERT INTO user VALUES ('${username}', '${hash}', '${fornavn}', '${etternavn}', '${email}', '${sex}', 0)`);
  
  // 'Logge' brukeren inn (vet at pw er riktig, så sjekker ikke)
  const code = utility.generateCode(5,5);
  await db.run(`INSERT INTO session VALUES ('${code}', '${username}')`);
  reply.header("set-cookie", `sessionid=${code}; Domain=sedate-ionian-credit.glitch.me`);
  
  const isCorrect = await bcrypt.compare(password, hash);
  //console.log("ISCORRECT", isCorrect);
  
  return reply.redirect("/");  
})

fastify.post("/getHash", async function(request, reply) {
  const body = JSON.parse(request.body);
  const pw = body.pw;
  console.log("PW:", pw);
  const hash = await bcrypt.hash(pw, 5);
  let params = {};
  params.hash = hash;
  return reply.send(params);
})

fastify.get("/logout", async function(request, reply) {
  if(request.headers.cookie){
    let arr = request.headers.cookie.split("=");
    let id = arr[arr.length - 1];
    await db.run(`DELETE FROM session WHERE sessionid = '${id}'`);
  }
  return reply.redirect("/");
})

fastify.get("/login", async function(request, reply) {
  let params = {};
  const userAdmin = await utility.checkAdmin(request);
  if(userAdmin != null){ 
    params.username = userAdmin[0];
    params.admin = userAdmin[1];
    return reply.redirect("/");
  }
  return reply.view("/src/pages/login.hbs", params);
})

fastify.post("/login", async function(request, reply){
  
  const username = request.body.username;
  const password = request.body.password;
  //console.log(username, password);
  const foundUser = await db.get(`SELECT * FROM user WHERE username = '${username}'`);
  
  let params = {};
  if(foundUser == null){
    params.message1 = "Vi kunne ikke finne brukernavnet. Har du stavet riktig?";
    params.message2 = "Vennligst prøv igjen med et annet brukernavn eller registrer et nytt.";
    return reply.view("/src/pages/login.hbs", params);
  }
  
  const foundUsername = foundUser.username;
  
  const hash = foundUser.password;
  //console.log("HASH:", hash);
  const isCorrect = await bcrypt.compare(password, hash);
  if(isCorrect == false){
    params.message1 = "Passordet stemmer ikke overens med et som er registrert for brukernavnet.";
    params.message2 = "Vennligst prøv igjen med et annet passord.";
    return reply.view("/src/pages/login.hbs", params);
  }
  
  let code = utility.generateCode(5,5); 
  if(request.headers.cookie){
    let arr = request.headers.cookie.split("=");
    code = arr[arr.length-1];
  }
  else{
    reply.header("set-cookie", `sessionid=${code}; Domain=sedate-ionian-credit.glitch.me`);  
  }
  await db.run(`INSERT INTO session VALUES ('${code}', '${username}')`);
  
  return reply.redirect("/");
})


fastify.get("/", async function(request, reply){
  let params = {};
  params.isLoggedIn = false;
  const userAdmin = await utility.checkAdmin(request);
  if(userAdmin != null){ 
    params.username = userAdmin[0];
    params.admin = userAdmin[1];
    params.isLoggedIn = true;
  }
  
  // CHECK UNREAD
  const countMsg = await db.get(`SELECT COUNT(*) AS antallUleste FROM messages WHERE touser = '${params.username}' AND read = 0`);
  params.countMsg = countMsg.antallUleste;
  
  return reply.view("/src/pages/newIndex.hbs", params);  
}) 

fastify.get("/me", async function(request, reply){
  let params = {};
  params.isLoggedIn = false;
  const userAdmin = await utility.checkAdmin(request);
  if(userAdmin != null){ 
    params.username = userAdmin[0];
    params.admin = userAdmin[1];
    params.isLoggedIn = true;
  }
  else{
    return reply.redirect("/");
  }
  
  // CHECK UNREAD
  const countMsg = await db.get(`SELECT COUNT(*) AS antallUleste FROM messages WHERE touser = '${params.username}' AND read = 0`);
  params.countMsg = countMsg.antallUleste;

  return reply.view("/src/pages/meg.hbs", params);  
}) 

fastify.get("/chart", async function(request, reply){
  let params = {};
  params.isLoggedIn = false;
  const userAdmin = await utility.checkAdmin(request);
  if(userAdmin != null){ 
    params.username = userAdmin[0];
    params.admin = userAdmin[1];
    params.isLoggedIn = true;
  }
  else{
    return reply.redirect("/");
  }
  // CHECK UNREAD
  const countMsg = await db.get(`SELECT COUNT(*) AS antallUleste FROM messages WHERE touser = '${params.username}' AND read = 0`);
  params.countMsg = countMsg.antallUleste;

  return reply.view("/src/pages/chart.hbs", params);  
}) 

fastify.get("/vote", async function(request, reply){
  let params = {};
  params.isLoggedIn = false;
  const userAdmin = await utility.checkAdmin(request);
  if(userAdmin != null){ 
    params.username = userAdmin[0];
    params.admin = userAdmin[1];
    params.isLoggedIn = true;
  }
  else{
    return reply.redirect("/");
  }

  // CHECK UNREAD
  const countMsg = await db.get(`SELECT COUNT(*) AS antallUleste FROM messages WHERE touser = '${params.username}' AND read = 0`);
  params.countMsg = countMsg.antallUleste;

  
  // If clicked 'Vis meg stillingen!' 
  
  if(request.query.standing){
    //All
    const groupedBy = await db.all(`SELECT player, COUNT(*) AS number FROM ${request.query.standing} GROUP BY player`);
    const players = groupedBy.map(elm => elm.player)
    const votes = groupedBy.map(elm => elm.number)
    params.players = players;
    params.votes = votes;
    let numVotes = 0;
    votes.forEach(elm => numVotes += elm)
    params.numVotes = numVotes;
    params.title = request.query.standing;
    
    //Men
    const gBMen = await db.all(`SELECT player, COUNT(*) AS number FROM ${request.query.standing} JOIN user ON user.username = ${request.query.standing}.username WHERE sex = 'M' GROUP BY player`);
    params.playersM = gBMen.map(elm => elm.player);
    params.votesM = gBMen.map(elm => elm.number);
    
    //Women
    const gBWomen = await db.all(`SELECT player, COUNT(*) AS number FROM ${request.query.standing} JOIN user ON user.username = ${request.query.standing}.username WHERE sex = 'K' GROUP BY player`);
    params.playersW = gBWomen.map(elm => elm.player);
    params.votesW = gBWomen.map(elm => elm.number);
    //Hen
    const gBHen = await db.all(`SELECT player, COUNT(*) AS number FROM ${request.query.standing} JOIN user ON user.username = ${request.query.standing}.username WHERE sex = 'H' GROUP BY player`);
    params.playersH = gBHen.map(elm => elm.player);
    params.votesH = gBHen.map(elm => elm.number);
    
    if(request.query.standing == "tennis"){
      params[`${request.query.standing}`] = "The Tennis GOAT";  
    }
    else if(request.query.standing == "football"){
      params[`${request.query.standing}`] = "The Football GOAT";
    }
    else{
      params[`${request.query.standing}`] = "The Asshole Of The Year";
    }
    return reply.view("/src/pages/chart.hbs", params);
    //return reply.redirect("/vote");
  }
  
  //Check earlier votes
  
  params.fotball = true;
  const footballSelect = await db.get(`SELECT * FROM football WHERE username = '${params.username}'`);
  if(footballSelect) { params.fotball = false; params.fVote = footballSelect["player"]; params[`${footballSelect["player"]}`] = `Du valgte ${footballSelect["player"]}`; }
  params.tennis = true;
  const tennisSelect = await db.get(`SELECT * FROM tennis WHERE username = '${params.username}'`);
  if(tennisSelect) { params.tennis = false; params.tVote = tennisSelect["player"]; params[`${tennisSelect["player"]}`] = `Du valgte ${tennisSelect["player"]}`; }
  params.asshole = true;
  const assholeSelect = await db.get(`SELECT * FROM asshole WHERE username = '${params.username}'`);
  if(assholeSelect) { params.asshole = false; params.aVote = assholeSelect["player"]; params[`${assholeSelect["player"]}`] = `Du valgte ${assholeSelect["player"]}`; }
  
  return reply.view("/src/pages/avstem.hbs", params);  
}) 

fastify.post("/vote", async function(request, reply){
  const userAdmin = await utility.checkAdmin(request);
  if(userAdmin == null){ return reply.redirect("/"); }
  let params = {};
  params.username = userAdmin[0];
  params.admin = userAdmin[1];
  params.isLoggedIn = true;
  
  const now = new Date().toISOString();
  
  if(request.body.fotball){
    console.log("Fotball:", request.body.fotball, "Username:", params.username);
    await db.run(`INSERT INTO football VALUES ('${params.username}', '${request.body.fotball}', '${now}')`);
  }
  if(request.body.tennis){
    console.log("Tennis:", request.body.tennis, "Username:", params.username);
    await db.run(`INSERT INTO tennis VALUES ('${params.username}', '${request.body.tennis}', '${now}')`);
  }
  if(request.body.asshole){
    console.log("Asshole:", request.body.asshole, "Username:", params.username);
    await db.run(`INSERT INTO asshole VALUES ('${params.username}', '${request.body.asshole}', '${now}')`);
  }
  return reply.redirect("/vote");
})

fastify.get("/about", async function(request, reply){
  let params = {};
  params.isLoggedIn = false;
  const userAdmin = await utility.checkAdmin(request);
  if(userAdmin != null){ 
    params.username = userAdmin[0];
    params.admin = userAdmin[1];
    params.isLoggedIn = true;
  }
  else{
    return reply.redirect("/");
  }
  // CHECK UNREAD
  const countMsg = await db.get(`SELECT COUNT(*) AS antallUleste FROM messages WHERE touser = '${params.username}' AND read = 0`);
  params.countMsg = countMsg.antallUleste;

  return reply.view("/src/pages/nettside.hbs", params);  
}) 

fastify.get("/projects", async function(request, reply){
  let params = {};
  params.isLoggedIn = false;
  const userAdmin = await utility.checkAdmin(request);
  if(userAdmin != null){ 
    params.username = userAdmin[0];
    params.admin = userAdmin[1];
    params.isLoggedIn = true;
  }
  else{
    return reply.redirect("/");
  }
  // CHECK UNREAD
  const countMsg = await db.get(`SELECT COUNT(*) AS antallUleste FROM messages WHERE touser = '${params.username}' AND read = 0`);
  params.countMsg = countMsg.antallUleste;

  return reply.view("/src/pages/projects.hbs", params);  
}) 

fastify.get("/cs50web", async function(request, reply){
  let params = {};
  params.isLoggedIn = false;
  const userAdmin = await utility.checkAdmin(request);
  if(userAdmin != null){ 
    params.username = userAdmin[0];
    params.admin = userAdmin[1];
    params.isLoggedIn = true;
  }
  else{
    return reply.redirect("/");
  }
  // CHECK UNREAD
  const countMsg = await db.get(`SELECT COUNT(*) AS antallUleste FROM messages WHERE touser = '${params.username}' AND read = 0`);
  params.countMsg = countMsg.antallUleste;

  return reply.view("/src/pages/cs50web.hbs", params);  
}) 

fastify.get("/ai", async function(request, reply){
  let params = {};
  params.isLoggedIn = false;
  const userAdmin = await utility.checkAdmin(request);
  if(userAdmin != null){ 
    params.username = userAdmin[0];
    params.admin = userAdmin[1];
    params.isLoggedIn = true;
  }
  else{
    return reply.redirect("/");
  }
  // CHECK UNREAD
  const countMsg = await db.get(`SELECT COUNT(*) AS antallUleste FROM messages WHERE touser = '${params.username}' AND read = 0`);
  params.countMsg = countMsg.antallUleste;

  return reply.view("/src/pages/ai.hbs", params);  
}) 

fastify.get("/ticTacToe", async function(request, reply){
  let params = {};
  params.isLoggedIn = false;
  const userAdmin = await utility.checkAdmin(request);
  if(userAdmin != null){ 
    params.username = userAdmin[0];
    params.admin = userAdmin[1];
    params.isLoggedIn = true;
  }
  else{
    return reply.redirect("/");
  }
  // CHECK UNREAD
  const countMsg = await db.get(`SELECT COUNT(*) AS antallUleste FROM messages WHERE touser = '${params.username}' AND read = 0`);
  params.countMsg = countMsg.antallUleste;

  return reply.view("/src/pages/ticTacToe.hbs", params);  
}) 

fastify.get("/pythonYatzy", async function(request, reply){
  let params = {};
  params.isLoggedIn = false;
  const userAdmin = await utility.checkAdmin(request);
  if(userAdmin != null){ 
    params.username = userAdmin[0];
    params.admin = userAdmin[1];
    params.isLoggedIn = true;
  }
  else{
    return reply.redirect("/");
  }
  // CHECK UNREAD
  const countMsg = await db.get(`SELECT COUNT(*) AS antallUleste FROM messages WHERE touser = '${params.username}' AND read = 0`);
  params.countMsg = countMsg.antallUleste;

  return reply.view("/src/pages/pythonYatzy.hbs", params);  
}) 

fastify.get("/cs", async function(request, reply){
  let params = {};
  params.isLoggedIn = false;
  const userAdmin = await utility.checkAdmin(request);
  if(userAdmin != null){ 
    params.username = userAdmin[0];
    params.admin = userAdmin[1];
    params.isLoggedIn = true;
  }
  else{
    return reply.redirect("/");
  }
  // CHECK UNREAD
  const countMsg = await db.get(`SELECT COUNT(*) AS antallUleste FROM messages WHERE touser = '${params.username}' AND read = 0`);
  params.countMsg = countMsg.antallUleste;

  return reply.view("/src/pages/cs.hbs", params);  
}) 

const months = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];


fastify.get("/messages", async function(request, reply){
  let params = {};
  params.isLoggedIn = false;
  const userAdmin = await utility.checkAdmin(request);
  if(userAdmin != null){ 
    params.username = userAdmin[0];
    params.admin = userAdmin[1];
    params.isLoggedIn = true;
    
    const users = await db.all("SELECT username from user");
    params.usernames = users.map(elm => elm.username);
    
    const msgs = await db.all(`SELECT * FROM messages WHERE fromuser ='${params.username}' OR touser ='${params.username}' 
        ORDER BY time`);
    //TO MARK AS READ: 
    await db.run(`UPDATE messages SET read = 1 WHERE touser ='${params.username}'`);

    // CHECK UNREAD
    const countMsg = await db.get(`SELECT COUNT(*) AS antallUleste FROM messages WHERE touser = '${params.username}' AND read = 0`);
    params.countMsg = countMsg.antallUleste;

    //console.log(msgs);
    params.messages = msgs
    params.lastFromEach = [];
    let testNames = [];
    for(var i = msgs.length -1; i >=0; i--){
      let newElm = {};
      let toFrom;
      let tFtest;
      if(msgs[i].fromuser != params.username){
        tFtest = msgs[i].fromuser;
        toFrom = `Fra ${msgs[i].fromuser}`; 
      }else{ toFrom = `Til ${msgs[i].touser}`; tFtest = msgs[i].touser; }
      if(i == msgs.length -1){ 
        newElm.tFtest = tFtest;
        newElm.other = toFrom;
        newElm.content = msgs[i].content; 
        let theTime = new Date(msgs[i].time);
        newElm.time = `${theTime.getDate()}.${months[theTime.getMonth()]} ${String(theTime.getHours()).padStart(2,'0')}:${String(theTime.getMinutes()).padStart(2,'0')}`; newElm.read = msgs[i].read;
        params.lastFromEach.push(newElm);
        testNames.push(tFtest); // NEW!!!
      //}else if(tFtest != params.lastFromEach[params.lastFromEach.length-1].tFtest){
      }else if(!testNames.includes(tFtest)){  
        newElm.tFtest = tFtest;
        newElm.other = toFrom;
        newElm.content = msgs[i].content; 
        let theTime = new Date(msgs[i].time);
        newElm.time = `${theTime.getDate()}.${months[theTime.getMonth()]} ${String(theTime.getHours()).padStart(2,'0')}:${String(theTime.getMinutes()).padStart(2,'0')}`; newElm.read = msgs[i].read;
        params.lastFromEach.push(newElm);
        testNames.push(tFtest); // NEW!!!
      }
    }
    
    params.msgOverZero = msgs.length > 0;
    
    let listOfListOfDicts = [];
    const ROWS = 21; const COLS = 25;
    for(var i=0; i<ROWS; i++){
      let listOfDicts = [];
      for(var j=0; j<COLS; j++){
        listOfDicts.push({id:`A${i}-${j}`, value:""});
      }
      listOfListOfDicts.push(listOfDicts);
    }
    params.board = listOfListOfDicts;
    
    // HENTER BOARDET FRA DATABASEN
    let board;
    let all;
    const boardList = await db.all(`SELECT * FROM game WHERE sender = '${params.username}' OR receiver = '${params.username}'`);
    if(boardList.length == 0){
      const boardDict = await db.get(`SELECT * FROM game WHERE sender = 'none' OR receiver = 'none'`);
      board = boardDict.board
      board = JSON.parse(boardDict.board);
      params.gameOn = false;
      //const lmv = boardDict.lastmove; console.log("LMV:", lmv);    //Denne og neste linje kun for testing. Skal ikke være med.
      //params.lastmove = lmv != params.username;
    }
    else{
      params.gameOn = true;
      board = boardList[0].board
      board = JSON.parse(boardList[0].board);
      //const lastmove = JSON.parse(boardList[0].lastmove);
      const lastmove = boardList[0].lastmove
      params.lastmove = lastmove != params.username;
      
      const activeplayer = boardList[0].activeplayer;
      params.activeplayer = activeplayer == params.username;
      params.opponent = boardList[0].sender;
      if(boardList[0].sender == params.username){ params.opponent = boardList[0].receiver; }
      let antTrekk = 0;
      board.forEach(row => {
        row.forEach(elm =>{
          if(elm.value !=''){
            antTrekk++;
          }
        })
      })
      if(antTrekk % 2 == 0){
        params.playerSymbol = 'X';
      }
      else{
        params.playerSymbol = 'O';
      }
    }
    params.board = board;
    console.log(params.board);
    //console.log('lastmove:', params.lastmove);
    //console.log(board);
    
    // Ved refresh skal bruker slettes fra players-listen hos WWS dersom brukeren ikke deltar i noe spill.
    const antallSpill = await db.all(`SELECT sender FROM game WHERE sender = '${params.username}' OR receiver = '${params.username}'`);
    if(antallSpill.length ==0){
      /*const serverAddress = "wss://delightful-nonstop-lamb.glitch.me/";
      const ws = new WebSocket(serverAddress);
      const remvMsg = JSON.stringify({
        key: 'removeByRefresh',
        username: params.username
      });
      ws.send(remvMsg);*/
      
      params.removePlayer = 'remove';
    }
    
  }
  else{
    return reply.redirect("/");
  }
  return reply.view("/src/pages/messages.hbs", params);  
}) 


fastify.post("/getEarlierMsg", async function(request, reply) {
  const userAdmin = await utility.checkAdmin(request);
  if(userAdmin == null){
    return reply.redirect("/");    // En guard mot uautorisert, men kan krasje?
  }
  
  const body = JSON.parse(request.body);
  const username = body.username;
  const toFrom = body.toFrom;
  const msgs = await db.all(`SELECT * FROM messages WHERE (fromuser = '${username}' AND touser = '${toFrom}') 
    OR (fromuser = '${toFrom}' AND touser = '${username}') ORDER BY time`);
  let params = {};
  params.msgs = msgs;
  return reply.send(params);
})

fastify.post("/sendMsg", async function(request, reply) {
  const userAdmin = await utility.checkAdmin(request);
  if(userAdmin == null){
    return reply.redirect("/");    // En guard mot uautorisert, men kan krasje?
  }
  
  const body = JSON.parse(request.body);
  const sender = body.sender;
  const receiver = body.receiver;
  const content = body.content;
  const time = body.time;
  //console.log("TIME:", time);
  
  const usernamesDic = await db.all("SELECT username FROM user");
  //usernamesDic.forEach(elm => console.log(elm));
  const usernames = usernamesDic.map(x => x.username);
  
  let params = {};
  params.feedback = 1;
  
  if(!usernames.includes(receiver)){
    params.feedback = 0;
    return reply.send(params);
  }
  await db.run(`INSERT INTO messages (fromuser, touser, content, read, time) VALUES (
      '${sender}', '${receiver}', '${content}', 0, '${time}')`);  
  
  return reply.send(params);
})

fastify.get("/test", async function(request, reply){
  let params = {};
  params.isLoggedIn = false;
  const userAdmin = await utility.checkAdmin(request);
  if(userAdmin != null){ 
    params.username = userAdmin[0];
    params.admin = userAdmin[1];
    params.isLoggedIn = true;
  }
  else{
    return reply.redirect("/");
  }
  // CHECK UNREAD
  const countMsg = await db.get(`SELECT COUNT(*) AS antallUleste FROM messages WHERE touser = '${params.username}' AND read = 0`);
  params.countMsg = countMsg.antallUleste;

  const listOfLists = [[1,2,3],[4,5,6],[7,8,9]];
  const listOfDicts = [[{id:'A', value:1},{id:'B', value:2},{id:'C', value:3}],[{id:'D', value:4},{id:'E', value:5},{id:'F', value:6}],[{id:'G', value:7},{id:'H', value:8},{id:'I', value:9}]];
  params.listOfLists = listOfDicts;
  
  return reply.view("/src/pages/test.hbs", params);  
}) 

fastify.post("/startSpill", async function(request, reply) {
  const userAdmin = await utility.checkAdmin(request);
  if(userAdmin == null){
    return reply.redirect("/");    // En guard mot uautorisert, men kan krasje?
  }
  
  const body = JSON.parse(request.body);
  const sender = body.sender;
  const receiver = body.receiver;
  const dict = await db.get(`SELECT * FROM game WHERE sender = 'none' AND receiver = 'none'`);
  const board = dict.board; // TRENGER JEG JSON.stringify(dict.board) ?
  await db.run(`INSERT INTO game VALUES ('${sender}', '${receiver}', '${receiver}', 'whatever', '${board}', 'nomove')`)
  
  let params = {};
  params.board = dict.board; // MÅ PARSES JSON.parse(dict.board) for å sendes som kontekst
  
  return reply.send(params);
})

fastify.post("/cancelGame", async function(request, reply) {
  const userAdmin = await utility.checkAdmin(request);
  if(userAdmin == null){
    return reply.redirect("/");    // En guard mot uautorisert, men kan krasje?
  }
  
  const body = JSON.parse(request.body);
  const canceler = body.canceler;
  const cancelee = body.cancelee;
  await db.run(`DELETE FROM game WHERE sender = '${canceler}' OR sender = '${cancelee}'`);
  
  let params = {};
  params.whatever = 'whatever';
  
  return reply.send(params);
})

fastify.post("/boardClick", async function(request, reply) {
  const userAdmin = await utility.checkAdmin(request);
  if(userAdmin == null){
    return reply.redirect("/");    // En guard mot uautorisert, men kan krasje?
  }
  
  const body = JSON.parse(request.body);
  const sender = body.sender;
  const receiver = body.receiver;
  const activeplayer = body.activeplayer;
  const id = body.id;
  const value = body.value;
  const className = body.class;
  console.log(`Received 'boardClick from ${sender} to ${receiver}'`);
  
  //const lastMove = {id:id, value:value, class:className};
  const boardDict = await db.get(`SELECT board FROM game WHERE sender = '${sender}' OR sender = '${receiver}'`);
  let board = boardDict.board;
  board = JSON.parse(board);
  board.forEach(elm => {
    elm.forEach( item => {
      if(item.id == id){
        item.value = value;
        item.class = className;
      }
    })
  })
  console.log('BOARD[10]', board[10]);
  
  let params = {};
  // CHECK WINNER
  let winner = [];
  winner = utility.checkHorizontal(board);
  console.log('WINNER:', winner);
  if(winner != null){
    await db.run(`DELETE FROM game WHERE sender = '${sender}' OR sender = '${receiver}'`);
    params.winnerButtons = winner;
    params.winner = sender;
    return reply.send(params);
  }
  
  winner = utility.checkVertical(board);
  console.log('WINNER:', winner);
  if(winner != null){
    await db.run(`DELETE FROM game WHERE sender = '${sender}' OR sender = '${receiver}'`);
    params.winnerButtons = winner;
    params.winner = sender;
    return reply.send(params);
  }
  
  winner = utility.checkDownRight(board);
  console.log('WINNER:', winner);
  if(winner != null){
    await db.run(`DELETE FROM game WHERE sender = '${sender}' OR sender = '${receiver}'`);
    params.winnerButtons = winner;
    params.winner = sender;
    return reply.send(params);
  }
  
  winner = utility.checkDownLeft(board);
  console.log('WINNER:', winner);
  if(winner != null){
    await db.run(`DELETE FROM game WHERE sender = '${sender}' OR sender = '${receiver}'`);
    params.winnerButtons = winner;
    params.winner = sender;
    return reply.send(params);
  }
  
  // SKRIVE TIL DB
  const boardForDB = JSON.stringify(board);
  await db.run(`UPDATE game SET activeplayer='${receiver}', message='Venter på ${receiver}', board='${boardForDB}', 
  lastmove='${id}' WHERE sender='${sender}' OR sender ='${receiver}'`);
  
  
  params.winner = null;
  params.winnerButtons = null;
  
  return reply.send(params);
})


fastify.get("/fastApi", async function(request, reply){
  let params = {};
  params.isLoggedIn = false;
  const userAdmin = await utility.checkAdmin(request);
  if(userAdmin != null){ 
    params.username = userAdmin[0];
    params.admin = userAdmin[1];
    params.isLoggedIn = true;
  }
  else{
    return reply.redirect("/");
  }
  // CHECK UNREAD
  const countMsg = await db.get(`SELECT COUNT(*) AS antallUleste FROM messages WHERE touser = '${params.username}' AND read = 0`);
  params.countMsg = countMsg.antallUleste;

  return reply.view("/src/pages/fastApi.hbs", params);  
}) 


fastify.get("/games", async function(request, reply){
  let params = {};
  params.isLoggedIn = false;
  const userAdmin = await utility.checkAdmin(request);
  if(userAdmin != null){ 
    params.username = userAdmin[0];
    params.admin = userAdmin[1];
    params.isLoggedIn = true;
  }
  else{
    return reply.redirect("/");
  }
  // CHECK UNREAD
  const countMsg = await db.get(`SELECT COUNT(*) AS antallUleste FROM messages WHERE touser = '${params.username}' AND read = 0`);
  params.countMsg = countMsg.antallUleste;

  return reply.view("/src/pages/games.hbs", params);  
}) 
