document.addEventListener('DOMContentLoaded', function(){ 
  startAnimation();
  changeBodyClassName()
});

const elementIdList = ["li1","li2","li3","li4","li5","li6","indexRegA"];

function startAnimation(){
  let i = 0;
  elementIdList.forEach(function(elm){
    setTimeout(()=>{
      const tag = document.getElementById(`${elm}`);
      tag.style.visibility = "visible";
      tag.classList.add("animateFromLeft");
      //tag.style.visibility = "visible";  
      
    }, 4000 * i);
    i++;  
  });
}

function changeBodyClassName(){
  const isLoggedIn = document.getElementById("hiddenIsLoggedIn").innerHTML;
  if(isLoggedIn == "true"){
    document.getElementById("newIndexBody").className += "newIdxBodyColor";
  }
}