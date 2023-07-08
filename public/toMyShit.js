document.addEventListener('DOMContentLoaded', function(){
  document.getElementById("getOptions").addEventListener("click", GetAllFromTable);
  document.querySelectorAll(".voteButt").forEach(e => e.addEventListener("click", voteLanguage));
  document.querySelectorAll(".deleteButt").forEach(e => e.addEventListener("click", deleteAllFromLanguage));
  document.getElementById("visibleSelect").addEventListener("change", visibleSelected);
  document.getElementById("transferButt").addEventListener("click", transferVotes);
});

function GetAllFromTable(){
  const tableName = document.getElementById("inputTableName").value;
  
  fetch("/GetAllFromTable", {
    method: "POST",
    body: JSON.stringify(
    {
      tableName: tableName
    })
  })
  .then(response => response.json())
  .then(response =>{
    console.log("RESPONSE:", response);
    if(response["data"] != null){
      response["data"].forEach(x => {
        const row = document.getElementById("optRow");
        const td = document.createElement("td");
        td.innerHTML = x.language;
        row.append(td);
      });
    }
    
  });
}

function voteLanguage(event){
  const language = event.target.dataset.language;
  fetch("/GetVoteCount", {
    method: "POST",
    body: JSON.stringify({
      language: language
    })
  })
  .then(response => response.json())
  .then(response =>{
    console.log("RESPONSE:", response);
    document.getElementById(response["tagId"]).innerHTML = response["countValue"];
  });
}

function deleteAllFromLanguage(event){
  const language = event.target.dataset.language;
  fetch("/DeleteOneCrit", {
    method: "DELETE",
    body: JSON.stringify({
      language: language
    })
  })
  .then(response => response.json())
  .then(response => {
    document.getElementById(`${language.toLowerCase()}Votes`).innerHTML = response["countValue"];
  });
}

function transferVotes(){
  const fromLanguage = document.getElementById("visibleSelect").value;
  const toLanguage = document.getElementById("hiddenSelect").value;
  fetch("/transferVotes", {
    method: "PUT",
    body: JSON.stringify({
      fromLanguage: fromLanguage,
      toLanguage: toLanguage
    })
  })
  .then(response => response.json())
  .then(response => {
    document.getElementById("htmlVotes").innerHTML = response.html;
    document.getElementById("javascriptVotes").innerHTML = response.js;
    document.getElementById("cssVotes").innerHTML = response.css;
  });
}

function visibleSelected(event){
  const languages = ["CSS", "HTML", "JavaScript"];
  const fromLanguage = event.target.value;
  const hiddenSelect = document.getElementById("hiddenSelect");
  hiddenSelect.innerHTML = "";
  languages.forEach(l => {
    if(l != fromLanguage){
      const opt = document.createElement("option");
      opt.innerHTML = l;
      hiddenSelect.append(opt);
    }
  });
  document.querySelectorAll(".hiddenSelect").forEach(e =>{
    e.style.display = "initial";
  })
}