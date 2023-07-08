document.addEventListener('DOMContentLoaded', function(){
  document.getElementById("showTabBut").addEventListener("click", showTabs);
  document.getElementById("showSchemaButt").addEventListener("click", showHideSchema);
  document.getElementById("chooseTableButt").addEventListener("click", showSchema);
  document.getElementById("contentDBMgmtDiv").innerHTML = document.getElementById("belowDiv").innerHTML;
  document.getElementById("writeSQLButt").addEventListener("click", showSQL);
  document.getElementById("showHashButt").addEventListener("click", showHash);
  document.getElementById("getHashButt").addEventListener("click", getHash);
  
  //document.getElementById("hideSchemaButt").addEventListener("click", () =>{
    //event.target.parentElement.style.display = "none";  
    //document.getElementById("displaySchemaLabel").innerHTML = "";
  //});
});


function showTabs(){
  fetch("/showTables", {
    method: "GET"
  })
  .then(response => response.json())
  .then(response => {
    console.log("RESPONSE:", response);
    console.log("response.tables:", response.tables);
    const ul = document.getElementById("tableUl");
    ul.innerHTML = "<u style='position:relative;left:-16px;'><b>Tables</b></u>"
    response.tables.forEach(elm => {
      const li = document.createElement("li");
      li.innerHTML = elm.name;
      ul.append(li); 
    });
    //document.getElementById("displayingTablesDiv").style.display ="block";
    document.getElementById("contentDBMgmtDiv").innerHTML = document.getElementById("tablesDiv").innerHTML;
    document.querySelectorAll(".hideTablesButt").forEach(elm =>{
      elm.addEventListener("click", hideTables);
    });
  })
}

function showHideSchema(event){
  const targetDiv = document.getElementById("chooseTableDiv");
  const button = event.target;
  const isDisplayed = targetDiv.style.display;
  if(isDisplayed == "none"){
    targetDiv.style.display = "inline-block";
    button.innerHTML = "Hide";
  }
  else{
    targetDiv.style.display = "none";
    button.innerHTML = "Show schema";
  }
}

function showSchema(){
  const tableName = document.getElementById("tableInput").value;
  fetch("/getSchema",{
    method: "POST",
    body: JSON.stringify(
    {
      tableName: tableName
    })
  })
  .then(response => response.json())
  .then(response => {
    console.log("RESPONSE:", response);
    document.getElementById("displaySchemaLabel").innerHTML = `SCHEMA:<BR>${response.schema["sql"]}`;
    document.getElementById("contentDBMgmtDiv").innerHTML = document.getElementById("schemaDiv").innerHTML;
    
    document.querySelectorAll(".hideSchemaButt").forEach(elm =>{
      elm.addEventListener("click", () =>{
        document.getElementById("displaySchemaLabel").innerHTML = "";
        document.getElementById("contentDBMgmtDiv").innerHTML = document.getElementById("belowDiv").innerHTML;      
      });
    });
  });
}

function executeSQL(event){
  const operation = event.target.innerHTML.toLowerCase();
  const cmd = document.getElementById("sqlTextArea").value;
  fetch("/executeSQL", {
    method: "POST",
    body: JSON.stringify({
      dbMethod: operation,
      cmd: cmd
    })
  })
  .then(response => response.json())
  .then(response => {
    console.log("RESPONSE:", response);
    let qResult = document.getElementById("queryResult");
    if(operation == "run"){
      qResult.innerHTML = response.run;  
      qResult.innerHTML += "<br><button id='hideQResButt'>Hide</button>";
    }
    else if(operation == "get"){
      if(response.get == null){
        qResult.innerHTML = "No matching entries found."  
      }
      else{
        let string = "";  
        for(const [key, value] of Object.entries(response.get)){
          string += `${key}: ${value}, `;
        }
        qResult.innerHTML = string;  
      }
      qResult.innerHTML += "<br><button id='hideQResButt'>Hide</button>";
    }
    else{
      qResult.innerHTML = "<div id='qRes'><ul style='list-style-type: none;' id='resultUl'></ul><button id='hideQResButt'>Hide</button></div>"
      const resultUl = document.getElementById("resultUl");
      response.all.forEach(elm =>{
        const li = document.createElement('li');
        let string = "";
        for(const [key, value] of Object.entries(elm)){
          string += `${key}: ${value}, `;
        }
        li.innerHTML = string;
        resultUl.append(li);
        
      })
    }
    document.getElementById("contentDBMgmtDiv").innerHTML = qResult.innerHTML;
    document.getElementById("hideQResButt").addEventListener("click", hideAll);
  });
}

function hideAll(){
  const fillInn = document.getElementById("belowDiv").innerHTML;
  document.getElementById("contentDBMgmtDiv").innerHTML = fillInn;
}

function hideTables(){
  //const clickedButton = event.target;
  //alert(clickedButton.parentElement.id);
  //event.target.parentElement.style.display = "none";
  document.getElementById("tableUl").innerHTML = "<u><b>Tables</b></u>";
  document.getElementById("contentDBMgmtDiv").innerHTML = document.getElementById("belowDiv").innerHTML;
}

function showSQL(){
  document.getElementById("contentDBMgmtDiv").innerHTML = document.getElementById("writeDiv").innerHTML;
  document.getElementById("dropSelect").addEventListener("change", (event) => {
    const theButt = document.getElementById("dropButt");
    theButt.innerHTML = `Drop ${event.target.value}`;
    theButt.dataset.tableName = event.target.value;
    theButt.style.visibility = "visible";
    theButt.addEventListener("click", dropTable);
  });
  document.getElementById("sqlTextArea").addEventListener("input", autoResize);
  const buttons = document.querySelectorAll(".sqlButt");
  buttons.forEach(elm => {
    elm.addEventListener("click", executeSQL);
  });
}

function dropTable(event){
  const tableName = event.target.dataset.tableName;
  //alert(tableName);
  const cmd = `DROP TABLE IF EXISTS ${tableName}`;
  document.getElementById("sqlTextArea").innerHTML = cmd;
}

function autoResize() {
  this.style.height = "auto";
  this.style.height = this.scrollHeight + "px";  
}

function showHash(event){
  const targetDiv = document.getElementById("hashDiv");
  const button = event.target;
  const isDisplayed = targetDiv.style.display;
  if(isDisplayed == "none"){
    targetDiv.style.display = "inline-block";
    button.innerHTML = "Hide";
  }
  else{
    targetDiv.style.display = "none";
    button.innerHTML = "Get hash";
  }
}

function getHash(){
  const pw = document.getElementById("hashInput").value;
  fetch("/getHash", {
    method: "POST",
    body: JSON.stringify({
      pw: pw
    })
  })
  .then(response => response.json())
  .then(response =>{
    console.log("RESPONSE:", response);
    document.getElementById("hashResultLabel").innerHTML = response.hash;
    const targetDiv = document.getElementById("contentDBMgmtDiv"); 
    targetDiv.innerHTML = document.getElementById("hashResultDiv").innerHTML;
    document.getElementById("hideHashButt").addEventListener("click", () =>{
      targetDiv.innerHTML = document.getElementById("belowDiv").innerHTML;
    })
  });
}

function makeJSON(){
  let listOfListOfDicts = [];
    const ROWS = 21; const COLS = 25;
    for(var i=0; i<ROWS; i++){
      let listOfDicts = [];
      for(var j=0; j<COLS; j++){
        listOfDicts.push({id:`A${i}-${j}`, value:"", class:"gameButt"});
      }
      listOfListOfDicts.push(listOfDicts);
    }
  document.getElementById('jsonDiv').innerHTML = JSON.stringify(listOfListOfDicts);
  document.getElementById('hideJSON').style.display = "initial";
}

function hideJSON(event){
  document.getElementById('jsonDiv').innerHTML = "";
  event.target.style.display = 'none';
}