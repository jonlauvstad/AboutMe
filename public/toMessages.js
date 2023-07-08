document.addEventListener('DOMContentLoaded', function(){ 
  document.getElementById("newMsgButt").addEventListener("click", newMessage);
  document.querySelectorAll(".messageButt").forEach(elm => elm.addEventListener('click', chooseMsg));
  userName = document.getElementById('hiddenUsername').innerHTML;
  const pingIt = setInterval(ping, 60000);
  document.getElementById('sendRequestButt').addEventListener('click', sendRequest);
  
  const opponElm = document.getElementById('hiddenOpponent');
  const oppon = opponElm.innerHTML;
  if(oppon.length > 0){
    opponent = oppon;
    opponElm.innerHTML = "";
    
    const activeplayer = document.getElementById('hiddenActiveplayer').innerHTML;
    const plSym = document.getElementById('hiddenPlayerSymbol').innerHTML;
    if(activeplayer == 'true'){
      playerSymbol = plSym;
      document.querySelectorAll('.gameButt').forEach(elm => {
        elm.addEventListener('click', boardClick);
        elm.disabled = false;
      });
    }
  }
  
});

const months = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];

let userName;    //kunne nok ="";

let onlUsers = [];

let onlineUsers = document.getElementById('onlineUsers');

let opponent = "";

var myMsg = new SpeechSynthesisUtterance();
var myVoices = window.speechSynthesis.getVoices();
myMsg.voice = myVoices[0];
myMsg.pitch = 0;
myMsg.lang = 'nb-NO';
myMsg.text = "Hei";

let soundOn = false;

// INITIERER EN WEB SOCKET
const serverAddress = "wss://delightful-nonstop-lamb.glitch.me/";
const ws = new WebSocket(serverAddress);

ws.onopen = function(){
  const msg = JSON.stringify({
    key: 'connecting',
    username: userName
  })    
  ws.send(msg);
  removeIfIsRemove();
};

ws.onmessage = function(event){
  console.log("Data from WWS:", event.data);
  const parsed = JSON.parse(event.data);
  console.log("KEY:", parsed.key);
  // MÅ SKRIVES FERDIG!
  switch(parsed.key){
    case 'connection':
      const onlineDiv = document.getElementById('onlineDiv');
      onlineUsers = document.getElementById('onlineUsers');
      let string = "<label>Brukere som er online:</label> <label style='font-size:x-small'>(dvs har Meldinger-siden åpen)</label><br>"
      +"<label style='color:orange;'>";
      onlineUsers.innerHTML = "";
      onlUsers = [];
      parsed.clients.forEach(function(elm){ 
        string += `${elm}, `;
        if(elm != userName){
          const opt = document.createElement('option');
          opt.innerHTML = elm;
          //opt.selected = true;
          onlineUsers.append(opt);
          onlUsers.push(elm);
        }
      });
      string = string.slice(0, -2);
      string += "</label>"
      onlineDiv.innerHTML = string.slice(0, -2);
      break;
    case 'disconnection':
      //alert("ARNE");
      const onlineDivD = document.getElementById('onlineDiv');
      let stringD = "<label>Brukere som er online:</label> <label style='font-size:x-small'>(dvs har Meldinger-siden åpen)</label><br>"
      +"<label style='color:orange;'>";
      onlineUsers.innerHTML = "";
      onlUsers = [];
      parsed.clients.forEach(function(elm){ 
        stringD += `${elm}, `;
        if(elm != userName){
          const opt = document.createElement('option');
          opt.innerHTML = elm;
          //opt.selected = true;
          onlineUsers.append(opt);
          onlUsers.push(elm);
        }
      });
      stringD = stringD.slice(0, -2);
      stringD += "</label>"
      onlineDivD.innerHTML = stringD.slice(0, -2);
      break;
    case 'message':
      const withMe = document.getElementById('toFromMsg');
      if(withMe != null){
        console.log("withMe not null");
        if(withMe.innerHTML == parsed.sender){
          const theTab = document.getElementById('earlierMsgTab');
          theTab.innerHTML += 
              `<tr>
                <td style="font-weight:bold;">${parsed.sender} <span style="font-weight:normal;">sier</span></td><td style="text-align:right;">${parsed.time}</td>
              <tr>
              <tr>
                <td colspan="2" style="padding-bottom:15px;">${parsed.content}</td>
              </tr>`;
          scrollToBottom('earlierMsgDiv');
        }
      }
      
      const elm = `
      <button class="messageButt" data-tftest="${parsed.sender}" id="fetchElm" name=${parsed.sender}>
        <div style="width:100%;text-align:left;font-size:smaller;" data-tftest="${parsed.sender}">
          <label class="toFrom" style="font-weight:bold;" data-tftest="${parsed.sender}">Fra ${parsed.sender}</label><label style="float:right;" class="toFrom" data-tftest="${parsed.sender}">${parsed.time}</label>
        </div>
        <div style="width:100%;text-align:left;padding-bottom:10px;font-size:smaller;" data-tftest="${parsed.sender}">
          <label data-tftest="${parsed.sender}">${parsed.content}</label>
        </div>
      </button>
      `;
      
      const elmToRemove = document.querySelector(`[name = ${parsed.sender} ]`); //dataset.tftest
      if(elmToRemove != null){
        elmToRemove.remove();  
      }
      
      document.getElementById('hiddenFetchElm').innerHTML = elm;
      const samtaler = document.getElementById('samtalerDiv');
      const noSamtale = document.getElementById('noSamtaleDiv');
      if(noSamtale != null){
        if(noSamtale.innerHTML == "Ingen meldinger å vise"){
          const toInsert = document.getElementById('fetchElm');
          toInsert.id = "noeAnnet";
          noSamtale.innerHTML = "";
          noSamtale.insertBefore(toInsert, noSamtale.children[1]);  
        }
        else{
          //noSamtale.innerHTML += elm;
          const toInsert = document.getElementById('fetchElm');
          toInsert.id = "noeAnnet";
          noSamtale.insertBefore(toInsert, noSamtale.children[0]);
        }
      }
      else{
        //samtaler.innerHTML += elm;
        const toInsert = document.getElementById('fetchElm');
        toInsert.id = "noeAnnet";
        samtaler.insertBefore(toInsert, samtaler.children[1]);
      }
      //console.log("Samtaler:", samtaler);
      //console.log("noSamtale:", noSamtale);
      document.querySelectorAll(".messageButt").forEach(elm => elm.addEventListener('click', chooseMsg));
      
      soundOn = document.getElementById('lydCbx').checked;
      
      if(!soundOn){
        myMsg.text = `Du har fått en melding fra ${parsed.sender}`;
        window.speechSynthesis.speak(myMsg);  
      }
      
      break;
      
    case 'playing':
      console.log(`Client received 'playing' from ${parsed.rejecter}`);
      document.getElementById('spillSpecialDiv').innerHTML = "";
      const spFlowDiv = document.getElementById('spillFlowDiv');
      spFlowDiv.innerHTML = `${parsed.rejecter} spiller med noen andre`;
      setTimeout(() => spFlowDiv.innerHTML = "", 8000);
      clearInterval(interval);
      
      // LYDFORBEHOLD
      soundOn = document.getElementById('lydCbx').checked;
      if(!soundOn){
        myMsg.text = `${parsed.rejecter} spiller med noen andre`;
        window.speechSynthesis.speak(myMsg);
      }
      
      document.getElementById('gameReqToHide').style.visibility = "visible";
      clearTimeout(timeOut);
      break;
      
    case 'gameRequest':
      console.log(`Client received 'gameRequest' from ${parsed.sender}`);
      
      document.getElementById('gameReqToHide').style.visibility = "hidden";
      
      countDownClock(parsed.minutes, 'spillSpecialDiv');
      const spillFlowDiv = document.getElementById('spillFlowDiv');
      spillFlowDiv.innerHTML = `Spillinvitasjon fra ${parsed.sender} 
        <button id="accept" onclick="accept('${parsed.sender}')">Akseptér</button> 
        <button id="reject" onclick="reject('${parsed.sender}')">Avvis</button>`;
      
      // LYDFORBEHOLD
      soundOn = document.getElementById('lydCbx').checked;
      if(!soundOn){
        myMsg.text = `Du har mottatt en spillinvitasjon fra ${parsed.sender}`;
        window.speechSynthesis.speak(myMsg);
      }
      break;
      
    case 'cancelRequest':
      console.log(`Client received 'cancelRequest' from ${parsed.sender}`);
      document.getElementById('spillSpecialDiv').innerHTML = "";
      document.getElementById('spillFlowDiv').innerHTML = "";
      break;
      
    case 'rejection':
      console.log(`Client received 'rejection' from ${parsed.rejecter}`);
      document.getElementById('spillSpecialDiv').innerHTML = "";
      const sFlowDiv = document.getElementById('spillFlowDiv');
      sFlowDiv.innerHTML = `${parsed.rejecter} avslo spillinvitasjonen din`;
      setTimeout(() => sFlowDiv.innerHTML = "", 8000);
      clearInterval(interval);
      
      // LYDFORBEHOLD
      soundOn = document.getElementById('lydCbx').checked;
      if(!soundOn){
        myMsg.text = `${parsed.rejecter} avslo spillinvitasjonen din`;
        window.speechSynthesis.speak(myMsg);
      }
      
      document.getElementById('gameReqToHide').style.visibility = "visible";
      clearTimeout(timeOut);
      break;
      
    case 'accept':
      console.log(`Client received 'accept' from ${parsed.accepter}`);
      document.getElementById('spillSpecialDiv').innerHTML = `<button id='startSpillButt' onclick='startSpill("${userName}", "${parsed.accepter}")'>Start spill</button>`;    // START SPILL BUTTON
      const sFlDiv = document.getElementById('spillFlowDiv');
      sFlDiv.innerHTML = `<label class="gameMsg">${parsed.accepter} aksepterte spillinvitasjonen din</label>`;
      clearInterval(interval);
      
      // LYDFORBEHOLD
      soundOn = document.getElementById('lydCbx').checked;
      if(!soundOn){
        myMsg.text = `${parsed.accepter} aksepterte spillinvitasjonen din`;
        window.speechSynthesis.speak(myMsg);
      }
      
      document.getElementById('gameReqToHide').style.visibility = "hidden";
      clearTimeout(timeOut);
      break;
      
    case 'cancelGame':
      console.log(`Client received 'cancelGame' from ${parsed.canceler}`);
      document.getElementById('spillSpecialDiv').innerHTML = "";
      document.getElementById('spillFlowDiv').innerHTML = `<label class="gameMsg"">Spillet ble avbrutt av ${parsed.canceler} pga sen respons</label>`;
      document.getElementById('gameReqToHide').style.visibility = 'visible';
      
      //document.getElementById('A10-12').className = 'gameButt';    // AD-HOC LØSNING!!! FUNKER IKKE
      
      const xClass = document.querySelectorAll('.X');
      const oClass = document.querySelectorAll('.O');
      
      xClass.forEach(elm => { elm.className = 'gameButt'; elm.innerHTML = ""; });     // elm.disabled = false; 
      oClass.forEach(elm => { elm.className = 'gameButt'; elm.innerHTML = ""; });     //  elm.disabled = false;
      
      const gameButtClass = document.querySelectorAll('.gameButt');
      gameButtClass.forEach(elm => { elm.disabled = false; elm.innerHTML = ""; elm.removeEventListener('click', boardClick); });    // denne er ny
      
      playerSymbol = 'O';    // FÅ MED I WINNER!!
      //turnoff = true;        // FÅ MED I WINNER!!  NEI NEI MÅ IKKE MED!!!!!
      
      
      
      
      // LYDFORBEHOLD
      soundOn = document.getElementById('lydCbx').checked;
      if(!soundOn){
        myMsg.text = `${parsed.canceler} avbrøt spillet på grunn av sen respons`;
        window.speechSynthesis.speak(myMsg);
      }
      
      break;
      
    case 'boardClick':
      console.log(`Client received 'boardClick' from ${parsed.sender}`);
      //opponent = parsed.sender;  //BLIR DET FEIL Å AKTIVERE DENNE IGJEN????!!!?????!!!!!!???? ER KRITISK AV GRUNNER JEG IKKE FORSTÅR
      
      if(parsed.winner != null){
        console.log("WINNER:", parsed.winner);
        console.log('winnerButtons:');
        parsed.winnerButtons.forEach(elm=> console.log(elm.id));
         
        document.getElementById('spillSpecialDiv').innerHTML = `<button style="font-size:x-small;" onclick="removeFromPlayers()">Klar for nytt spill</button>`;
        const finalButt = document.getElementById(parsed.id);
        
        clearTimeout(gameTimeOut);
        
        const btn4 = document.getElementById(parsed.winnerButtons[4].id);
        const btn3 = document.getElementById(parsed.winnerButtons[3].id);
        const btn2 = document.getElementById(parsed.winnerButtons[2].id);
        const btn1 = document.getElementById(parsed.winnerButtons[1].id);
        const btn0 = document.getElementById(parsed.winnerButtons[0].id);
        
        var finCount = 0;
        let finalInterval = setInterval(() => {
          finalButt.className = 'W';
          finalButt.innerHTML = parsed.value;
          
          
          setTimeout(() => {
            btn4.className = 'W';
          }, 100);  
          setTimeout(() => {  
            btn3.className = 'W';
          }, 200);
          setTimeout(() => {
            btn2.className = 'W';
          }, 300);
          setTimeout(() => {
            btn1.className = 'W';
          }, 400);
          setTimeout(() => {
            btn0.className = 'W';
          }, 500);
          
          
          turnoff = true;                         
          playerSymbol = 'O';
          if (++finCount === 2){
            clearInterval(finalInterval);
          }
        },850);
        
        
        if(parsed.winner == userName){
          //opponent = parsed.receiver;
          
          const winnerMsg = `<label style="font-weight:bold;color:#00e600;">DU VANT ${userName}! 🏆</label>`;
          document.getElementById('spillFlowDiv').innerHTML = winnerMsg;
          
          // LYDFORBEHOLD
          soundOn = document.getElementById('lydCbx').checked;
          if(!soundOn){
            myMsg.text = `Du vant! Gratulerer med seieren, ${userName}!`;
            window.speechSynthesis.speak(myMsg);
          }
        }
        
        else{
          //opponent = parsed.sender;  
          
          const loserMsg = `<label style="font-weight:bold;color:red;">DU TAPTE, ${userName}! 😞</label>`;
          document.getElementById('spillFlowDiv').innerHTML = loserMsg;
          
          // LYDFORBEHOLD
          soundOn = document.getElementById('lydCbx').checked;
          if(!soundOn){
            myMsg.text = `Beklager, ${userName}. Er lei det ble tap denne gang. Kødda! Taper!`;
            window.speechSynthesis.speak(myMsg);
          }
        }
          
          
          var counter = 0;
          flashRec = setInterval(() =>{
            if(finalButt.className != `${parsed.value}`){
              finalButt.className = `${parsed.value}`;
            }
            else{
              finalButt.className = `gb${parsed.value}2`;
            }
            if(turnoff){
              finalButt.className = 'gameButt'; finalButt.innerHTML = ""; finalButt.disabled = true; 
              turnoff = false;
              clearInterval(flashRec);
            }
            if (++counter === 16) {
               finalButt.className = `${parsed.value}`;
               clearInterval(flashRec);
           }
          }, 50);
       
          
        //}
        
      }
      else{
        opponent = parsed.sender;
        
        const selectedR = document.getElementById(parsed.id);
        selectedR.innerHTML = parsed.value;
        selectedR.className = parsed.class;
        
        var counter = 0;
        flashRec = setInterval(() =>{
          if(selectedR.className != `${parsed.value}`){
            selectedR.className = `${parsed.value}`;
          }
          else{
            selectedR.className = `gb${parsed.value}2`;
          }
          if(turnoff){
            selectedR.className = 'gameButt'; selectedR.innerHTML = ""; selectedR.disabled = true; 
            turnoff = false;
            clearInterval(flashRec);
          }
          if (++counter === 16) {
             selectedR.className = `${parsed.value}`;
             clearInterval(flashRec);
         }
        }, 50);
       
        console.log(`Id:${parsed.id} Verdi:${parsed.value} Class:${parsed.class}`);
        console.log(`eId:${selectedR.id} eVerdi:${selectedR.innerHTML} eClass:${selectedR.className}`);
        
        document.getElementById('spillFlowDiv').innerHTML = `<label class="gameMsg">Det er DIN tur!</label>`;
        document.getElementById('spillSpecialDiv').innerHTML = "";    // Vet ikke om denne linja er nødvendig/'feil'
        clearTimeout(gameTimeOut);
        
        document.querySelectorAll('.gameButt').forEach(elm => {
          elm.addEventListener('click', boardClick);
          elm.disabled = false;
        });

        // LYDFORBEHOLD
        soundOn = document.getElementById('lydCbx').checked;
        if(!soundOn){
          myMsg.text = `Det er din tur ${parsed.receiver}`;
          window.speechSynthesis.speak(myMsg);
        }
      }
      break;
      
    case 'removeFromPlayers':
      location.reload();
      break;
  }
}

function ping(){
  const msg = JSON.stringify({
    key: 'ping',
  })    
  ws.send(msg);
}

function newMessage(){
  /*const msg = JSON.stringify({      // HVA F SKJEDDE HER?!!
    key: 'ping',
  })    
  ws.send(msg);*/

  const hiddenContent = document.getElementById("newMessageDiv").innerHTML;;
  document.getElementById("newOrChatDiv").innerHTML = hiddenContent;
  const recipInput = document.getElementById('recipInput'); //Undvg?
  recipInput.addEventListener('change', chooseRecipient);    //Undvg?
  
  document.getElementById('earlierMsgTab').innerHTML = "";
  document.getElementById('samtaleMedDiv').innerHTML = "";
}

function chooseRecipient(event){  //Unødvendig?
  //NYE TO LINJER:
  document.getElementById('samtaleMedDiv').innerHTML = `<label>Samtale med </label><label id="toFromMsg">${event.target.value}</label>`;
  document.getElementById('newOrChatDiv').innerHTML = "";
  
  fillChat(event.target.value);
  
}

function chooseMsg(event){
  const toFrom = event.target.dataset.tftest; 
  
  const samtalerMed = document.getElementById('samtaleMedDiv');
  document.getElementById('newOrChatDiv').innerHTML = "";
  samtalerMed.innerHTML = `<label>Samtale med </label><label id="toFromMsg">${toFrom}</label>`;
  
  fillChat(toFrom);
}

function fillChat(toFrom){
  const username = document.getElementById("hiddenUsername").innerHTML;
  console.log(toFrom, username);
  
  fetch("/getEarlierMsg",{
    method: "POST",
    body: JSON.stringify({
      username: username,
      toFrom: toFrom
    })
  })
  .then(response => response.json())
  .then(response => {
    console.log("RESPONSE:", response);
    //console.log(response.msgs[0].fromuser);
    const theTab = document.getElementById("earlierMsgTab");
    theTab.innerHTML = "";
    if(response.msgs.length > 0){
      response.msgs.forEach(elm => {
        //const theTab = document.getElementById("earlierMsgTab");
        let theTime = new Date(elm.time);
        const time = `${theTime.getDate()}.${months[theTime.getMonth()]} ${String(theTime.getHours()).padStart(2,'0')}:${String(theTime.getMinutes()).padStart(2,'0')}`;
        theTab.innerHTML += 
          `<tr>
            <td style="font-weight:bold;">${elm.fromuser} <span style="font-weight:normal;">sier</span></td><td style="text-align:right;">${time}</td>
          <tr>
          <tr>
            <td colspan="2" style="padding-bottom:15px;">${elm.content}</td>
          </tr>`;
      });
      
    }
    
    const writeMsgDiv = document.getElementById('writeMsgDiv');
    writeMsgDiv.innerHTML = 
      `<textarea style='width:95%;' placeholder='Skriv meldingen din her' rows='4'></textarea>
      <button id='sendMsgButt' style="float:right;margin-right:15px;border-radius:5px;margin-top:3px;">Send<button>`;
    document.querySelector('textarea').addEventListener("input", autoResize);
    document.getElementById('sendMsgButt').addEventListener('click', sendMsg);
    scrollToBottom('earlierMsgDiv');
  });
  //setTimeout(() => scrollToBottom('earlierMsgDiv'), 250);
}

function sendMsg(){
  const ta = document.querySelector('textarea');
  const content = ta.value;
  const inp = document.getElementById('recipInput');
  
  let receiver = inp.value;
  const toFromMsg = document.getElementById('toFromMsg');
  if(toFromMsg != null){
    receiver = toFromMsg.innerHTML;
  }
  
  const sender = document.getElementById('hiddenUsername').innerHTML;
  const time = new Date().toISOString();
  ta.value = "";
  inp.value = "";
  console.log(sender, receiver, content);
  
    fetch("/sendMsg",{
    method: "POST",
    body: JSON.stringify({
      sender: sender,
      receiver: receiver,
      content: content,
      time: time
    })
  })
  .then(response => response.json())
  .then(response => {
      console.log("RESPONSE:", response);
      if(response.feedback == 0){ 
        alert(`Du kan'ke sende melding til andre enn brukere!\n ${receiver} du liksom 😡`);
        return;    // NY - men må være nødvendig?
      }
      
      const theTime = new Date(time);
      const niceTime = `${theTime.getDate()}.${months[theTime.getMonth()]} ${String(theTime.getHours()).padStart(2,'0')}:${String(theTime.getMinutes()).padStart(2,'0')}`;
      
      const msg = JSON.stringify({
        key: 'message',
        receiver:  receiver,
        content: content,
        time: niceTime
      })
      ws.send(msg);
      
      const elm = `
      <button class="messageButt" data-tftest="${receiver}" id="fetchElm" name=${receiver}>
        <div style="width:100%;text-align:left;font-size:smaller;" data-tftest="${receiver}">
          <label class="toFrom" style="font-weight:bold;" data-tftest="${receiver}">Til ${receiver}</label><label style="float:right;" class="toFrom" data-tftest="${receiver}">${niceTime}</label>
        </div>
        <div style="width:100%;text-align:left;padding-bottom:10px;font-size:smaller;" data-tftest="${receiver}">
          <label data-tftest="${receiver}">${content}</label>
        </div>
      </button>
      `;
      
      const elmToRemove = document.querySelector(`[name = ${receiver} ]`); //dataset.tftest
      if(elmToRemove != null){
        elmToRemove.remove();  
      }
      
      document.getElementById('hiddenFetchElm').innerHTML = elm;
      const samtaler = document.getElementById('samtalerDiv');
      const noSamtale = document.getElementById('noSamtaleDiv');
      if(noSamtale != null){
        if(noSamtale.innerHTML == "Ingen meldinger å vise"){
          const toInsert = document.getElementById('fetchElm');
          toInsert.id = "noeAnnet";
          noSamtale.innerHTML = "";
          noSamtale.insertBefore(toInsert, noSamtale.children[1]);  
        }
        else{
          //noSamtale.innerHTML += elm;
          const toInsert = document.getElementById('fetchElm');
          toInsert.id = "noeAnnet";
          noSamtale.insertBefore(toInsert, noSamtale.children[0]);
        }
      }
      else{
        //samtaler.innerHTML += elm;
        const toInsert = document.getElementById('fetchElm');
        toInsert.id = "noeAnnet";
        samtaler.insertBefore(toInsert, samtaler.children[1]);
      }
      //console.log("Samtaler:", samtaler);
      //console.log("noSamtale:", noSamtale);
      document.querySelectorAll(".messageButt").forEach(elm => elm.addEventListener('click', chooseMsg));
      
      const theTab = document.getElementById('earlierMsgTab');
      theTab.innerHTML += 
          `<tr>
            <td style="font-weight:bold;">${sender} <span style="font-weight:normal;">sier</span></td><td style="text-align:right;">${niceTime}</td>
          <tr>
          <tr>
            <td colspan="2" style="padding-bottom:15px;">${content}</td>
          </tr>`;
      scrollToBottom('earlierMsgDiv');
    })
}

function autoResize() {
  this.style.height = "auto";
  this.style.height = this.scrollHeight + "px";  
}

function scrollToBottom(elementId){
  const elm = document.getElementById(elementId);
  elm.scrollTo(0, elm.scrollHeight);
}

function speak(event){
  myMsg.text = event.target.innerHTML;
  window.speechSynthesis.speak(myMsg);
}

function speakMld(){
  myMsg.text = "Samtale slash chat delen av denne siden, det vil si de to hvite spaltene til venstre, er laget etter modell"
  + "fra Samsung sin tekstmeldingsapp. Det er den Anders har på mobilen sin. Spalten lengst til venstre viser alle samtalene du har,"
  + " med den siste meldingen øverst. Hvis du klikker på en samtale, vil den vises i Enkeltmeldinger slash chat spalten, med den siste"
  + " meldingen nederst. Dersom du mottar en melding, vil denne 1 vises øverst i samtaler-spalten 2 hvis meldingen er fra den du har en "
  + "åpen chat med i Enkeltmeldinger slash chat spalten, vil meldingen poppe opp nederst i denne spalten. Du kan sende melding til noen ved"
  + " å klikke på en samtale med den du ønsker å sende melding til, eller ved å klikke Ny melding og velge mottaker i drop-down menyen,"
  + " for så å skrive meldingen og trykke send. Dersom du er på en annen side enn meldinger-siden i denne appen, vil nye meldinger indikeres"
  + " av et tall for antall meldinger ved siden av Meldinger slash Onlinesspill i navigasjonsbaren på toppen av siden. Oppdatering av dette"
  + " tallet skjer hver gang du går til en ny side i appen eller når du klikker refresh.";
  window.speechSynthesis.speak(myMsg);
}

function speakSpill(){
  myMsg.text = "Spill initieres ved at man sender en spillforespørsel til en annen bruker som har Meldinger slash Onlinespill siden åpen. "
  + "Man får bare velge slike spillere, hvis det er noen, i spør drop-down menyen. Man setter en svarfrist for forespørselen som telles ned "
  + "hos begge spillere. Dersom den inviterte aksepterer invitasjonen innenfor fristen, kan initiativtakeren sette igang spillet ved å klikke "
  + "Start spill. Vi velger det første trekket for starteren, midt på brettet. Starteren har alltid grønn farge med kryss, og akseptanten har "
  + "alltid rød farge med runding. Poenget med spillet er å få 5 på rad, bortover, nedover eller på skrå. Heretter er det bare å klikke på "
  + "det feltet man ønsker å markere. 30 sekunder etter hvert trekk popper det opp en knapp som tillater spilleren å avbryte spillet på grunn "
  + "av sen respons fra motstabder.";
  window.speechSynthesis.speak(myMsg);
}

function makeGrid(xAxis, yAxis, parentElmId){
  const parentElm = document.getElementById(parentElmId);
  const table = document.createElement('table')
}

let playerSymbol = 'O';
let interval;
let timeOut;
let gameTimeOut;
let flash;
let flashRec
let turnoff = false;

function sendRequest(){
  const receiver = document.getElementById('requestInput').value;
  
  if(!onlUsers.includes(receiver)){
    document.getElementById('requestInput').value = "";
    return;
  }
  
  const gameReqToHide = document.getElementById('gameReqToHide');
  gameReqToHide.style.visibility = 'hidden';
  const spillFlowDiv = document.getElementById('spillFlowDiv');
  spillFlowDiv.innerHTML = `Spillforespørsel sendt til <label style="color:orange;">${receiver}</label>, tid igjen:`;
  const mins = document.getElementById('minutesInput').value;
  countDownClock(mins, 'spillSpecialDiv');
  
  const msg = JSON.stringify({
    key: "gameRequest",
    sender: userName,
    receiver: receiver,
    minutes: mins
  });
  // SENDE FORESPØRSELEN
  ws.send(msg);
  
    timeOut = setTimeout(() => {
    gameReqToHide.style.visibility = 'visible';
    spillFlowDiv.innerHTML = "";
    document.getElementById('spillSpecialDiv').innerHTML = "";
    // SLETTE FORESPØRSELEN I EGEN FUNKSJON
    const cnclRegMsg = JSON.stringify({
      key: "cancelRequest",
      sender: userName,
      receiver: receiver
    });
    ws.send(cnclRegMsg);
  }, mins*60*1000+1000);
  
}

function countDownClock(minutes, elementId){
  let seconds = minutes * 60; 
  const element = document.getElementById(elementId);
  interval = setInterval(function(){
    minutes = Math.floor(seconds/60);
    let secs = seconds % 60;
    let string = `${minutes}:${String(secs).padStart(2, '0')}`;
    element.innerHTML = string;
    if(seconds == 0){
      clearInterval(interval);
    }
    seconds--; 
  }, 1000);
}

function accept(sender){
  const msg = JSON.stringify({
    key: 'accept',
    sender: userName,
    receiver: sender
  });
  ws.send(msg);
  document.getElementById('spillSpecialDiv').innerHTML = "";
  const sFloDiv = document.getElementById('spillFlowDiv');
  sFloDiv.innerHTML = `<label class="gameMsg">Venter på trekk fra ${sender}</label>`;
  document.getElementById('gameReqToHide').style.visibility = "hidden";
  clearInterval(interval);
}

function reject(sender){
  //alert(sender);
  const msg = JSON.stringify({
    key: 'rejection',
    sender: userName,
    receiver: sender
  });
  ws.send(msg);
  document.getElementById('spillSpecialDiv').innerHTML = "";
  const sFloDiv = document.getElementById('spillFlowDiv');
  sFloDiv.innerHTML = "";
  document.getElementById('gameReqToHide').style.visibility = 'visible';
  clearInterval(interval);

  //document.getElementById('gameReqToHide').style.visibility = "visible";
  //clearTimeout(timeOut);
}

function startSpill(user, accepter){
  document.getElementById('spillFlowDiv').innerHTML = `<label class="gameMsg"">Venter på ${opponent}</label>`;
  console.log("user, accepter:", user, accepter);
  playerSymbol = 'X';
  opponent = accepter;
  
  turnoff = false;
  
  fetch("/startSpill",{
    method: "POST",
    body: JSON.stringify({
      sender: user,
      receiver: accepter
    })
  })
  .then(response => response.json())
  .then(response =>{
    
    const firstButt = document.getElementById('A10-12');
    firstButt.disabled = false;
    //firstButt.addEventListener('click', () => boardClick(event));
    firstButt.addEventListener('click', boardClick);
    firstButt.click();
    document.getElementById('spillSpecialDiv').innerHTML = "<label class='gameMsgSmaller'>Vi velger det første trekket for deg, midt på</label>";
  });
  
}

function boardClick(event){
  
  document.getElementById('spillFlowDiv').innerHTML = `<label class='gameMsg'>Venter på ${opponent}</label>`;
  
  const selected = event.target;
  selected.disabled = true;  // ER DET DENNE SOM SKAPER PROBLEMER??!!!!!!!!????????!!!!!?????????!!!!!
  document.querySelectorAll('.gameButt').forEach(elm => {elm.disabled = true; });    // STO == true 
  selected.innerHTML = playerSymbol;
  //FJERNE KANSELLERINGS-KNAPPEN og FJERNE SETTIMEOUTEN: aktiver når skal se på receiver
  //clearTimeout(gameTimeOut); document.getElementById('spillSpecialDiv').innerHTML = "";
  
  var counter = 0;
  flash = setInterval(() =>{
    if(selected.className != `${playerSymbol}`){
      selected.className = `${playerSymbol}`;
    }
    else{
      selected.className = `gb${playerSymbol}2`;
    }
    if(turnoff){
      selected.className = 'gameButt'; selected.innerHTML = ""; selected.disabled = true; 
      turnoff = false;
      clearInterval(flash);
    }
    if (++counter === 16) {
       selected.className = `${playerSymbol}`;
       clearInterval(flash);
   }
  }, 50);
  /*
  setTimeout(() => {
    selected.className = playerSymbol;
  }, 5200);*/
  
  // Sende til server og wws:
  fetch("/boardClick",{
    method: "POST",
    body: JSON.stringify({
      sender: userName,
      receiver: opponent,
      activeplayer: opponent,
      message: `Din tur ${opponent}!`,
      id: selected.id,
      value: playerSymbol,
      class: playerSymbol
    })
  })
  .then(response => response.json())
  .then(response => {
    console.log("RESPONSE", response);
    console.log("response.winner", response.winner);
    console.log("response.winnerButtons", response.winnerButtons);
    // ER SPILLET VUNNET? winner -server sende vinnerkoordinater før sletter
    const msg = JSON.stringify({
      key: 'boardClick',
      sender: userName,
      receiver: opponent,
      activeplayer: opponent,
      id: selected.id,
      value: playerSymbol,
      class: playerSymbol,
      winner: response.winner,  // userName hvis vunnet!
      winnerButtons: response.winnerButtons          // skriv senere!
    
    });
    ws.send(msg);
      
    
    gameTimeOut = setTimeout(() => {
      const innerHTML = `<button style="font-size:smaller;" onclick="cancelGame()" id="cancelGameButt">Avbryt spillet pga sen respons</button>`;
      document.getElementById('spillSpecialDiv').innerHTML = innerHTML;
    }, 30000);
    
    //document.querySelectorAll('.gameButt').forEach(elm => { elm.disabled = true; });
    //document.querySelectorAll('.X').forEach(elm => { elm.disabled = true; });
    //document.querySelectorAll('.O').forEach(elm => { elm.disabled = true; });
    
  }); 
}

function cancelGame(){
  document.getElementById('spillSpecialDiv').innerHTML = "";
  document.getElementById('spillFlowDiv').innerHTML = "Du vinner pga sen respons";
  document.getElementById('gameReqToHide').style.visibility = 'visible';

  const xClass = document.querySelectorAll('.X');
  const oClass = document.querySelectorAll('.O');
  const gameButtClass = document.querySelectorAll('.gameButt');
  xClass.forEach(elm => { elm.className = 'gameButt'; elm.innerHTML = ""; elm.disabled = true; });
  oClass.forEach(elm => { elm.className = 'gameButt'; elm.innerHTML = ""; elm.disabled = true; });
  gameButtClass.forEach(elm => { elm.disabled = true; elm.innerHTML = ""; elm.removeEventListener('click', boardClick); }); //Den siste unødv.
  
  playerSymbol = 'O';    // NY
  
  fetch("/cancelGame",{
    method: "POST",
    body: JSON.stringify({
      canceler: userName,
      cancelee: opponent
    })
  })
  .then(response => response.json())
  .then(response => {
    const msg = JSON.stringify({
      key: 'cancelGame',
      canceler: userName,
      cancelee: opponent
    });
    ws.send(msg);
    
    console.log("gameTimeOut:", gameTimeOut);
  })
  
}

function removeFromPlayers(){
  const msg = JSON.stringify({
      key: 'removeFromPlayers',
      sender: userName
    });
    ws.send(msg);
}

function removeIfIsRemove(){
  const test = document.getElementById('hiddenRemovePlayer').innerHTML;
  if(test == 'remove'){
    const remvMsg = JSON.stringify({
        key: 'removeByRefresh',
        username: userName
      });
      ws.send(remvMsg);
  }
}


function fillBoard(board){    // board ER listOfListOfDicts [[{},{},{}],[{},{},{}]]  JSON.parse() inni eller utenfor funk?!
  const theGameDiv = document.getElementById('theGameDiv');
  theGameDiv.innerHTML = "";
  const tab = document.createElement('table');
  theGameDiv.append(tab);
  board.forEach(elm => {
    let tr = document.createElement('tr');
    tab.append(tr);
    elm.forEach(item => {
      let td = document.createElement('td');
      tr.append(td);
      let button = document.createElement('button');
      td.append(button);
      button.innerHTML = item.value;
      button.id = item.id;
      button.className = 'gameButt';
    })
  })
}