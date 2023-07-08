function nav(){
  return `<nav class= "topNav">
  <a href="/" class="navLink">Hjem</a>
  <div id="showDiv" style="display:none;">
    <a href="/me" class="navLink">Om meg</a>
    <a href="/about" class="navLink">Om siden</a>
    <a href="/projects" class="navLink">Prosjekter</a>
    <a href="/vote" class="navLink">Avstemninger</a>
    <a href="/messages" class="navLink">Meldinger/Onlinespill&nbsp<label id="numMsg" style="color:orange;"></label></a>
  </div>
  <a href="/adm" class="navLink" id="admA" style="display:none;">Adm</a>
  <div id="loginRegDiv" style="display:inline-block; float:right;">
    <a href="/register" class="navLink" style="float:right;">Registrer</a>
    <a href="/login" class="navLink" style="float:right;">Log in</a>
  </div>
  <div id="logoutDiv" style="display:none; float:right;">
    <label id="usernameNav" style="float:right; padding-right:40px;"></label>
    <a id="logoutNav" href="/logout" style="float:right; padding-right:30px;">Logout</a>
  </div>
</nav>`;
}

function username(){
  const username = document.getElementById("hiddenUsername").innerHTML;
  const logoutDiv = document.getElementById("logoutDiv");
  const loginRegDiv = document.getElementById("loginRegDiv");
  const showIfLoggedInDiv = document.getElementById("showDiv");
  if(username.length != 0){
    logoutDiv.style.display = "inline-block";
    document.getElementById("usernameNav").innerHTML = `username: ${username}`; 
    loginRegDiv.style.display = "none";
    showIfLoggedInDiv.style.display = "inline-block";
  }  
}

function admin(){
  const isAdm = document.getElementById("hiddenAdm").innerHTML;
  if(isAdm == 1){
    document.getElementById("admA").style.display = "initial";  
  }
}

function unread(){
  const unreadElm = document.getElementById('numMsg');
  let antallUleste = document.getElementById('hiddenMsgCount').innerHTML;
  if (antallUleste == '0'){
    antallUleste = '';
  } 
  unreadElm.innerHTML = antallUleste;
}

/*
function logoutTag(){
  let username = document.getElementById("hiddenUsername").innerHTML;
  if (username =! null){
    document.getElementById("logoutNav").style.display = "initial";
  }
}*/