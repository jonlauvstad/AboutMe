/**
 * Module handles database management
 *
 * Server API calls the methods in here to query and update the SQLite database
 */

// Utilities we need
const fs = require("fs");

// Initialize the database
const dbFile = "./.data/choices.db";
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const dbWrapper = require("sqlite");
let db;

/* 
We're using the sqlite wrapper so that we can make async / await connections
- https://www.npmjs.com/package/sqlite
*/
dbWrapper
  .open({
    filename: dbFile,
    driver: sqlite3.Database
  })
  .then(async dBase => {
    db = dBase;

    // We use try and catch blocks throughout to handle any database errors
    try {
      // The async / await syntax lets us write the db operations in a way that won't block the app
      if (!exists) {
        // Database doesn't exist yet - create Choices and Log tables
        await db.run(
          "CREATE TABLE Choices (id INTEGER PRIMARY KEY AUTOINCREMENT, language TEXT, picks INTEGER)"
        );

        // Add default choices to table
        await db.run(
          "INSERT INTO Choices (language, picks) VALUES ('HTML', 0), ('JavaScript', 0), ('CSS', 0)"
        );

        // Log can start empty - we'll insert a new record whenever the user chooses a poll option
        await db.run(
          "CREATE TABLE Log (id INTEGER PRIMARY KEY AUTOINCREMENT, choice TEXT, time STRING)"
        );
      } else {
        // We have a database already - write Choices records to log for info
        console.log(await db.all("SELECT * from Choices"));

        //If you need to remove a table from the database use this syntax
        //db.run("DROP TABLE Logs"); //will fail if the table doesn't exist
      }
    } catch (dbError) {
      console.error(dbError);
    }
  });

// Our server script will call these methods to connect to the db
module.exports = {
  
  /**
   * Get the options in the database
   *
   * Return everything in the Choices table
   * Throw an error in case of db connection issues
   */
  getOptions: async () => {
    // We use a try catch block in case of db errors
    try {
      return await db.all("SELECT * from Choices");
    } catch (dbError) {
      // Database connection error
      console.error(dbError);
    }
  },

  /**
   * Process a user vote
   *
   * Receive the user vote string from server
   * Add a log entry
   * Find and update the chosen option
   * Return the updated list of votes
   */
  processVote: async vote => {
    // Insert new Log table entry indicating the user choice and timestamp
    try {
      // Check the vote is valid
      const option = await db.all(
        "SELECT * from Choices WHERE language = ?",
        vote
      );
      if (option.length > 0) {
        // Build the user data from the front-end and the current time into the sql query
        await db.run("INSERT INTO Log (choice, time) VALUES (?, ?)", [
          vote,
          new Date().toISOString()
        ]);

        // Update the number of times the choice has been picked by adding one to it
        await db.run(
          "UPDATE Choices SET picks = picks + 1 WHERE language = ?",
          vote
        );
      }

      // Return the choices so far - page will build these into a chart
      return await db.all("SELECT * from Choices");
    } catch (dbError) {
      console.error(dbError);
    }
  },

  /**
   * Get logs
   *
   * Return choice and time fields from all records in the Log table
   */
  getLogs: async () => {
    // Return most recent 20
    try {
      // Return the array of log entries to admin page
      return await db.all("SELECT * from Log ORDER BY time DESC LIMIT 20");
    } catch (dbError) {
      console.error(dbError);
    }
  },

  /**
   * Clear logs and reset votes
   *
   * Destroy everything in Log table
   * Reset votes in Choices table to zero
   */
  clearHistory: async () => {
    try {
      // Delete the logs
      await db.run("DELETE from Log");

      // Reset the vote numbers
      await db.run("UPDATE Choices SET picks = 0");

      // Return empty array
      return [];
    } catch (dbError) {
      console.error(dbError);
    }
  },
  
  // MINE !!!!!
  
  getAll: async tableName =>{
    const cmd = `SELECT * FROM ${tableName}`;
    console.log("CMD: ", cmd);
    try{
      return await db.all(`SELECT * FROM ${tableName}`);
    } catch(dbError){
      console.error(dbError);
    }
  },
  
  getCountOneCrit: async (table, critName, critValue) =>{
    const isString = typeof critValue == "string";
    let cmd = `SELECT COUNT(*) AS ${critValue} FROM ${table} WHERE ${critName} = ${critValue}`;
    if(isString){cmd = `SELECT COUNT(*) AS ${critValue} FROM ${table} WHERE ${critName} = '${critValue}'`;}
    try{
      return await db.get(cmd);
    } catch(dbError){
      console.error(dbError);
    }
  }, 
  
  getCountGroupBy: async (table, column) =>{
    const cmd = `SELECT ${column}, COUNT(*) FROM ${table} GROUP BY ${column}`;
    //try{
      return await db.all(cmd);
    //} catch(dbError){
      //console.error(dbError);
    //}
  },
  
  // '' rundt verdiene, så bae for text/string:
  insertInto: async (table, columns, values) => {
    let string = `INSERT INTO ${table} (`;
    for (var i = 0; i < columns.length; i++){
      string += `${columns[i]}`;
      if(i == columns.length - 1){
        string += ") VALUES (";
      }
      else{
        string += ",";
      }
    }
    for (var i = 0; i < values.length; i++){
      string += `'${values[i]}'`;
      if(i == values.length - 1){
        string += ")";
      }
      else{
        string += ",";
      }
    }
    console.log("STRING:", string);
    try{
      await db.run(string);
    }catch(dbError){
      console.error(dbError);
    }
  },
  
  deleteWhere: async (table, column, value) => {
    const isString = typeof value == "string";
    let cmd = `DELETE FROM ${table} WHERE ${column} = ${value}`;
    if (isString){cmd = `DELETE FROM ${table} WHERE ${column} = '${value}'`; }
    console.log("CMD:", cmd);
    try{
      await db.run(cmd);
    }catch(dbError){
      console.error(dbError);
    }
  },
  
  updateWhereTo: async (table, whereColumn, whereValue, toColumn, toValue) => {
    const isString = typeof whereValue == "string";
    console.log("TYPEOF:", typeof whereValue);
    let cmd = `UPDATE ${table} SET ${toColumn} = ${toValue} WHERE ${whereColumn} = ${whereValue}`;
    if (isString){ cmd = `UPDATE ${table} SET ${toColumn} = '${toValue}' WHERE ${whereColumn} = '${whereValue}'`; }
    console.log("CMD:", cmd);
    try{
      await db.run(cmd);
    }catch(dbError){
      console.error(dbError);
    }
  },
  
  showTables: async () =>{
    const cmd = "SELECT name FROM sqlite_schema WHERE type ='table' AND name NOT LIKE 'sqlite_%'";
    try{
      return await db.all(cmd);
    }catch(dbError){
      console.error(dbError);
    }
  },
  
  getSchema: async tablename => {
    const cmd = `SELECT sql FROM sqlite_schema WHERE name = '${tablename}'`;
    try{
      return await db.get(cmd);
    }catch(dbError){
      console.error(dbError);
    }
  },
  
  run: async sqlCommand => {
    try{
      await db.run(sqlCommand);
    }catch(dbError){
      console.error(dbError);
    }
  },
  
  get: async sqlCommand => {
    try{
      return await db.get(sqlCommand);
    }catch(dbError){
      console.error(dbError);
    }
  }, 
  
  all: async sqlCommand => {
    try{
      return await db.all(sqlCommand);
    }catch(dbError){
      console.error(dbError);
    }
  }
  
};
