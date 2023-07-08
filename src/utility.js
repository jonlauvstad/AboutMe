const db = require("./sqlite.js");

module.exports = {
  
  generateCode(numLetters, numLettAfter){
    let letters = "";
    for (var i = 0; i < numLetters; i++){
      let letter =String.fromCharCode(65+Math.round(Math.random()*25));
      if(Math.random()>0.5){letter = letter.toLowerCase()}
      letters += letter;
    }
    letters += Date.now();
    for (var i = 0; i < numLettAfter; i++){
      let letter =String.fromCharCode(65+Math.round(Math.random()*25));
      if(Math.random()>0.5){letter = letter.toLowerCase()}
      letters += letter;
    }
    return letters;
  },        //TRENGER KOMMAET ETTER FUNKSJONEN NÅR DET KOMMER EN ETTER. 
  
  checkSession(request){
    if(!request.headers.cookie){
      return null;
    }
    let arr = request.headers.cookie.split("=");
    let id = arr[arr.length - 1];
    const idOrNull = db.get(`SELECT * FROM session WHERE sessionid = ${id}`);
    if(idOrNull == null){
      return null;
    }
    return idOrNull.username;
  },
  
  async checkAdmin(request){
    if(!request.headers.cookie){
      return null;
    }
    let arr = request.headers.cookie.split("=");
    let id = arr[arr.length - 1];
    const idOrNull = await db.get(`SELECT * FROM session WHERE sessionid = '${id}'`);
    
    if(idOrNull == null){
      return null;
    }
    const username = idOrNull.username;
    const adminObj = await db.get(`SELECT * FROM user WHERE username = '${username}'`);
    const admin = adminObj.admin;
    return [username, admin];
  },
  
  hasWhiteSpace(s) {
    return /\s/g.test(s);
  },

  /*
  checkHorizontal(board) {
    let winnerElements;
    let winnersign = "";
    //Vannrett:
    board.forEach(row => {
      winnerElements = []
      row.forEach(elm => {
        if(elm.value != "" && elm.value != winnersign){
          winnersign = elm.value;
          winnerElements = [elm];
        }
        else if(elm.value != ""){
          winnerElements.push(elm);
          if(winnerElements.length == 5){
            console.log("utility.checkHorizontal: not NULL!");
            winnerElements.forEach(elm => console.log('winElm:', elm));
            console.log("utility.winnerElements:", winnerElements);
            return winnerElements;
          }
        }
      });
    });
    return null;
  },*/
  
  checkHorizontal(board) {
    let winnerElements;
    let winnersign = "";
    //Vannrett:
    for(var i=0; i<board.length; i++){
      for(var j=0; j<board[i].length; j++){
        if(board[i][j].value != winnersign){
          winnersign = board[i][j].value;
          winnerElements = [board[i][j]];
        }
        else if(board[i][j].value != ""){
          winnerElements.push(board[i][j]);
          if(winnerElements.length == 5){
            console.log("Horizontal win!");
            return winnerElements;
          }
        }
      }
    }
    return null;  
  },
  
  checkVertical(board){
    let winnerElements;
    let winnersign = "";
    //Loddrett:
    for(var i=0; i<board[0].length; i++){
      for(var j=0; j<board.length; j++){
        if(board[j][i].value != winnersign){
          winnersign = board[j][i].value;
          winnerElements = [board[j][i]];
        }
        else if(board[j][i].value != ""){
          winnerElements.push(board[j][i]);
          if(winnerElements.length == 5){
            console.log("Vertical win!");
            return winnerElements;
          }
        }
      }
    }
    return null;
  },

  checkDownRight(board){
    let winnerElements;
    let winnersign = "";
    //NetTilHøyre:
    
    //Først ned fra (0,0)
    for(var i = 0; i < board.length; i++){
      var j = 0;
      var k = i;
      while(j < board[0].length && k < board.length){
        if(board[k][j].value != winnersign){
          winnersign = board[k][j].value;
          winnerElements = [board[k][j]];
        }
        else if(board[k][j].value != ""){
          winnerElements.push(board[k][j]);
          if(winnerElements.length == 5){
            console.log("DownRight win!");
            return winnerElements;
          }
        }
        j++; k++;
      }
    }
    
    //Så bort fra (0,0)
    for(var i=0; i<board[0].length; i++){
      var j = i;
      var k = 0;
      while(j < board[0].length && k < board.length){
        if(board[k][j].value != winnersign){
          winnersign = board[k][j].value;
          winnerElements = [board[k][j]];
        }
        else if(board[k][j].value != ""){
          winnerElements.push(board[k][j]);
          if(winnerElements.length == 5){
            return winnerElements;
          }
        }
        j++; k++;
      }
    }
    
    return null;
  },
  
  checkDownLeft(board){
    let winnerElements;
    let winnersign = "";
    //NetTilVenstre:
    
    //Først ned fra (0,n) (row,col)
    for(var i = 0; i < board.length; i++){
      var j = board[0].length-1;
      var k = i;
      while(j >= 0 && k < board.length){
        if(board[k][j].value != winnersign){
          winnersign = board[k][j].value;
          winnerElements = [board[k][j]];
        }
        else if(board[k][j].value != ""){
          winnerElements.push(board[k][j]);
          if(winnerElements.length == 5){
            console.log("DownLeft win!");
            return winnerElements;
          }
        }
        j--; k++;
      }
    }
    //Så til venstre fra (0,n) (row,col)
    for(var i = board[0].length -1; i > 0; i--){
      var j = i;
      var k = 0;
      while(j >= 0 && k < board.length){
        if(board[k][j].value != winnersign){
          winnersign = board[k][j].value;
          winnerElements = [board[k][j]];
        }
        else if(board[k][j].value != ""){
          winnerElements.push(board[k][j]);
          if(winnerElements.length == 5){
            console.log("DownLeft win!");
            return winnerElements;
          }
        }
        j--; k++;
      }
    }
    
    
  }
  
}

