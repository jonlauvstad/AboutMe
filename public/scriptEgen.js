document.addEventListener('DOMContentLoaded', function(){
  //eksamensDatoer(); 
  startAnimation();
});

const elementIdList = ["dMeg","tr1","tr2","tr3","tr4","tr5","tr6","tr7","tr8","tr9","tr10","tr11","tr12","tr13","tr14",
                      "meImg", "elsker","samboer","glede","glede1","glede2","glede3","liker","interesser"];

const darlings =["elsker", "samboer", "glede", "glede1", "glede2"];

function startAnimation(){
  let i = 0;
  elementIdList.forEach(function(elm){
    setTimeout(()=>{
      const tag = document.getElementById(`${elm}`);
      tag.classList.add("animateStart");
      tag.style.visibility = "visible";  
      if(darlings.includes(elm)){
        dear(tag);
      }
      else if(elm == "glede3"){
        dearB(tag);
      }
    }, 2500 * i);
    i++;  
  });
}

function dear(element){
  setTimeout(()=>{
    element.classList.remove("animateStart");
    element.classList.add("dear");  
  }, 1000) //3000
  
  setTimeout(()=>{
    element.classList.add("dearEnd");
  }, 1500); //3000
}

function dearB(element){
  setTimeout(()=>{
    element.classList.remove("animateStart");
    element.classList.add("dearB");  
  }, 1000) //3000
  
  setTimeout(()=>{
    element.classList.add("dearEndB");
  }, 1500); //3000
}

function eksamensDatoer(){
  const today = new Date();
  const dato1 = new Date(2023, 4, 8)
  const dato2 = new Date(2023, 4, 15)
  let comm1 = "avholdes";
  let comm2 = "avholdes";
  if(dato1<today){
    comm1 = "avholdt";
  }
  if(dato2<today){
    comm2 = "avholdt";
  }
  
  document.querySelector('#dato1').innerHTML = `${comm1} ${dato1.toLocaleDateString()}`;
  document.querySelector('#dato2').innerHTML = `${comm2} ${dato2.toLocaleDateString()}`;
}