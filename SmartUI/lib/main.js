var CamX=90;
var CamY=90;
var imgNum=0;
$(document).ready(function() {
$('#mainContent').append($('#hiddenDiv').html()).trigger('create');
$(".button").live("click", (function() {
        
switch (this.id) {
	case 'btnLeft':
      CamX=(CamX<=180)?CamX+5 : CamX;
		CamY=CamY;
		SetPosition();	
      break;
   case 'btnRight':
      CamX=(CamX>=0)?CamX-5 : CamX;
		CamY=CamY; 
		SetPosition();
      break;
	case 'btnUp':
      CamX=CamX;
		CamY=(CamY<=170)?CamY+5 : CamY;
		SetPosition();
      break;
	 case 'btnDown':
      CamX=CamX;
		CamY=(CamY>=50)?CamY-5 : CamY;
		SetPosition(); 
      break;
	 case 'btnHome':
      CamX=90;
		CamY=90; 
		SetPosition();
      break;
   case 'mainBtnHome':
      LoadContent('Home');
      break;
   case 'mainBtnMenu':
      LoadContent('MainMenu');
      break;
	case 'Cam':
	LoadContent(this.id);
		break;
   default:
	      
      break;
}
}));
});
InitalCamera = function()
{
$("#cameraDiv").width("640");
$("#cameraDiv").height("480");
$("#cameraDiv").load("javascript_simple.html",function(){
$("#cameraDiv").width("640");
$("#cameraDiv").height("480");
paused=false;
createImageLayer();
});
//UpdateCamImage();
//AutoUpdate();
}

SetPosition = function ()
{

var urlLoc = "http://home.darkratlab.net/new.php?x="+CamX+"&y="+CamY;
$.ajax({
  url: urlLoc,
  //success: UpdateCamImage()
});


}
var ViewedLayer = 1;
var isAutoUpdate = true;
var paused = false;
AutoUpdate = function ()
{
while(isAutoUpdate)
{
$.ajax({
  url: "http://home.darkratlab.net:8090/?action=snapshot&n="+imgNum,
  success: function(data)
  {
  imgNum++;
  $("#layer"+ViewedLayer).attr("src",data);
  //$("#layer"+ViewedLayer).attr("z-index",10);
  //$("#layer+"ViewedLayer).attr("z-index",-1);
	
  }
});
}
}
UpdateCamImage = function()
{
$("#layer1").attr("src","http://home.darkratlab.net:8090/?action=snapshot&n="+imgNum);
imgNum++;
}
LoadContent = function (namePage)
{
isAutoUpdate=false;
paused=true;
$('#mainContent').empty();
$('#hiddenDiv').hide();
$('#hiddenDiv').load(namePage+".html", function(){
$('#mainContent').append($('#hiddenDiv').html()).trigger('create');
$('#hiddenDiv').empty();
if(namePage=="Cam"){
isAutoUpdate=true;
InitalCamera();
}
});
$('#namePage').html(namePage+' Lab');
}