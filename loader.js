(function(){
var srcs=["https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js","https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js","https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"];
function fail(){var d=document.getElementById("err");d.style.display="block";d.innerHTML='Could not load the 3D engine (Three.js). Your network may be blocking it. Check your internet, then <button onclick="location.reload()" style="margin-left:8px;padding:4px 10px">Retry</button>';}
function run(){var d=document.getElementById("err");d.style.display="none";d.textContent="";var s=document.createElement("script");s.src="js/game.js";document.body.appendChild(s);}
function any(list,done){(function t(i){if(i>=list.length){done();return;}var s=document.createElement("script");s.src=list[i];s.onload=done;s.onerror=function(){t(i+1);};document.head.appendChild(s);})(0);}
var FF=["https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/fflate.min.js","https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/examples/js/libs/fflate.min.js"],FB=["https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/FBXLoader.js","https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/examples/js/loaders/FBXLoader.js"];
var PB="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/",PC="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/examples/js/",PL=["shaders/CopyShader.js","shaders/LuminosityHighPassShader.js","postprocessing/EffectComposer.js","postprocessing/RenderPass.js","postprocessing/ShaderPass.js","postprocessing/UnrealBloomPass.js"];
function post(i,done){if(i>=PL.length){done();return;}any([PB+PL[i],PC+PL[i]],function(){post(i+1,done);});}
var GL=["https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js","https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/examples/js/loaders/GLTFLoader.js"];function extras(){any(FF,function(){any(FB,function(){any(GL,function(){post(0,run);});});});}
function go(i){if(i>=srcs.length){fail();return;}var s=document.createElement("script");s.src=srcs[i];s.onload=function(){if(window.THREE)extras();else go(i+1);};s.onerror=function(){go(i+1);};document.head.appendChild(s);}
go(0);
})();
