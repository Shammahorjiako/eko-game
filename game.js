const ROLES={
 Robber:{spd:7,dmg:12,rate:.09,gun:"SMG",col:"#e67e22"},
 Bandit:{spd:6.5,dmg:20,rate:.15,gun:"AK",col:"#c0392b"},
 Assassin:{spd:8,dmg:60,rate:.9,gun:"Silenced sniper",col:"#8e44ad"},
 Police:{spd:6.5,dmg:18,rate:.12,gun:"Rifle",col:"#2980b9"},
 Trader:{spd:6,dmg:15,rate:.3,gun:"Pistol",col:"#27ae60"}
};
let role=ROLES.Robber,roleName="Robber";
const rolesEl=document.getElementById('roles'),menu=document.getElementById('menu');
Object.keys(ROLES).forEach(n=>{const b=document.createElement('button');b.textContent=n+" ("+ROLES[n].gun+")";b.onclick=()=>{role=ROLES[n];roleName=n;startGame();};rolesEl.appendChild(b);});

const scene=new THREE.Scene();scene.background=new THREE.Color(0xcfe0ef);scene.fog=new THREE.Fog(0xcfe0ef,80,480);
const cam=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,.1,700);cam.rotation.order='YXZ';
const ren=new THREE.WebGLRenderer({antialias:true});ren.setPixelRatio(Math.min(devicePixelRatio,('ontouchstart' in window)?1.5:2));ren.setSize(innerWidth,innerHeight);document.body.appendChild(ren.domElement);ren.shadowMap.enabled=true;ren.shadowMap.type=THREE.PCFSoftShadowMap;ren.outputEncoding=THREE.sRGBEncoding;ren.toneMapping=THREE.ACESFilmicToneMapping;ren.toneMappingExposure=1.05;
addEventListener('resize',()=>{cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();ren.setSize(innerWidth,innerHeight);});
scene.add(new THREE.HemisphereLight(0xbfd8ff,0x6b5a45,.6));
const sun=new THREE.DirectionalLight(0xfff0cc,1.5);sun.position.set(180,300,120);sun.castShadow=true;const smz=(('ontouchstart' in window)||innerWidth<900)?2048:4096;sun.shadow.mapSize.set(smz,smz);sun.shadow.bias=-0.0005;const sc2=sun.shadow.camera;sc2.left=sc2.bottom=-260;sc2.right=sc2.top=260;sc2.near=10;sc2.far=700;scene.add(sun);
const sky=new THREE.Mesh(new THREE.SphereGeometry(650,24,16),new THREE.ShaderMaterial({side:THREE.BackSide,fog:false,depthWrite:false,vertexShader:'varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 v;void main(){vec3 d=normalize(v);float h=clamp(d.y,0.,1.);vec3 c=mix(vec3(.95,.84,.68),vec3(.22,.47,.83),pow(h,.45));vec3 s=normalize(vec3(.49,.82,.33));float sd=max(dot(d,s),0.);c+=vec3(1.,.78,.45)*pow(sd,6.)*.45+vec3(1.,.95,.8)*pow(sd,500.)*2.;gl_FragColor=vec4(c,1.);}'}));scene.add(sky);

const roadTex=(()=>{const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');g.fillStyle='#34373c';g.fillRect(0,0,512,512);for(let i=0;i<7000;i++){g.fillStyle='rgba('+(Math.random()<.5?'255,255,255':'0,0,0')+',.06)';g.fillRect(Math.random()*512,Math.random()*512,2,2);}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(28,28);t.offset.set(.5,.5);t.encoding=THREE.sRGBEncoding;t.anisotropy=8;return t;})();
const ground=new THREE.Mesh(new THREE.PlaneGeometry(1232,1232),new THREE.MeshStandardMaterial({map:roadTex,roughness:.95}));ground.receiveShadow=true;
ground.rotation.x=-Math.PI/2;scene.add(ground);

function winTex(){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.fillStyle='#8a8f96';g.fillRect(0,0,64,64);
 for(let y=4;y<64;y+=16)for(let x=4;x<64;x+=16){g.fillStyle=Math.random()<.5?'#ffe9a8':'#2b3a4a';g.fillRect(x,y,8,10);}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;}
const baseTex=winTex();
const boxes=[],solids=[];
function addBox(x,z,w,d,h,y0,mat){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y0+h/2,z);m.castShadow=m.receiveShadow=true;scene.add(m);solids.push(m);
 boxes.push({a:x-w/2,b:x+w/2,c:y0,d:y0+h,e:z-d/2,f:z+d/2});return m;}
function bMat(col,w,h){const t=baseTex.clone();t.needsUpdate=true;t.repeat.set(Math.max(1,w/5),Math.max(1,h/5));t.encoding=THREE.sRGBEncoding;t.anisotropy=8;return new THREE.MeshStandardMaterial({color:col,map:t,roughness:.65,metalness:.15});}
const cols=[0xd8d2c4,0xc9b79c,0xb8c4cf,0xe0c9a6,0xa9b5a0,0xd0a99a];
const PITCH=30;const POOLC=[340,-40];
/* ===== City rebuilt from the uploaded LOOBY city file: named buildings, 3 to 30 floors, small and big ===== */
/* ===== NYC skin: which baked cartoon meshes are replaced by the New York models ===== */
const NYHIDE=new Set([0,2,4,5,6,34,35,36,37,38,39]);for(let i=7;i<=32;i++)NYHIDE.add(i);
const NYTRI=new Set([1,3]);
const NYR=CD.bld.filter(b=>b.k==='b'||b.k==='lt').map(b=>[b.x-b.w/2-2,b.x+b.w/2+2,b.z-b.d/2-2,b.z+b.d/2+2]);
function inNY(P,v){const x=P[v*3],y=P[v*3+1],z=P[v*3+2];if(y<.5)return false;for(const r of NYR)if(x>r[0]&&x<r[1]&&z>r[2]&&z<r[3])return true;return false;}
const LBL=[];
{
 const texs=CD.tex.map(u=>{const t=new THREE.TextureLoader().load(u);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;t.anisotropy=8;return t;});
 const cm=CD.mats.map(m=>{let x;const col=new THREE.Color(m.c[0],m.c[1],m.c[2]),map=m.t>=0?texs[m.t]:null;
  if(m.k==='basic')x=new THREE.MeshBasicMaterial({color:col,map});
  else{x=new THREE.MeshStandardMaterial({color:col,map,metalness:m.m,roughness:m.r});if(m.e[0]+m.e[1]+m.e[2]>0)x.emissive=new THREE.Color(m.e[0],m.e[1],m.e[2]);}
  if(m.o<1){x.transparent=true;x.opacity=m.o;x.depthWrite=false;}return x;});
 CD.geos.forEach((g,gi)=>{if(NYHIDE.has(gi))return;const q=b64a(g.p,Int16Array),P=new Float32Array(q.length),k=CD.sc/32767;for(let i=0;i<q.length;i++)P[i]=q[i]*k;
  const u=b64a(g.u,Uint16Array),UV=new Float32Array(u.length);for(let i=0;i<u.length;i++)UV[i]=u[i]/65535*16;
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(P,3));geo.setAttribute('uv',new THREE.BufferAttribute(UV,2));
  let IX=b64a(g.i,g.i32?Uint32Array:Uint16Array);
  if(NYTRI.has(gi)){const keep=[];for(let t=0;t<IX.length;t+=3)if(!(inNY(P,IX[t])&&inNY(P,IX[t+1])&&inNY(P,IX[t+2])))keep.push(IX[t],IX[t+1],IX[t+2]);IX=g.i32?new Uint32Array(keep):new Uint16Array(keep);}
  geo.setIndex(new THREE.BufferAttribute(IX,1));geo.computeVertexNormals();
  const ms=new THREE.Mesh(geo,cm[g.m]);ms.castShadow=true;ms.receiveShadow=true;scene.add(ms);if(!cm[g.m].transparent)solids.push(ms);});
 CD.cols.forEach(c=>boxes.push({a:c[0],b:c[1],c:c[2],d:c[3],e:c[4],f:c[5]}));
 if(CD.nlod){const L=b64a(CD.lod,Float32Array),im=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color:0x8a949c,roughness:.85}),CD.nlod),d=new THREE.Object3D();
  for(let i=0;i<CD.nlod;i++){d.position.set(L[i*5],L[i*5+4]/2,L[i*5+1]);d.scale.set(L[i*5+2],L[i*5+4],L[i*5+3]);if(Math.abs(L[i*5]-POOLC[0])<115&&Math.abs(L[i*5+1]-POOLC[1])<125)d.scale.set(0,0,0);d.updateMatrix();im.setMatrixAt(i,d.matrix);}scene.add(im);}
 CD.bld.forEach((b,bi)=>{const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');
  x.fillStyle='rgba(8,12,18,.82)';x.fillRect(0,0,512,128);x.fillStyle='#ff7a30';x.fillRect(0,0,10,128);
  x.fillStyle='#ffffff';x.font='bold 46px Arial';x.fillText('#'+(bi+1)+'  '+b.n.toUpperCase(),26,58);
  x.fillStyle='#cfd6dd';x.font='30px Arial';x.fillText(b.s+' FLOORS  /  '+Math.round(b.w)+' x '+Math.round(b.d)+' m',26,102);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true}));sp.scale.set(15,3.75,1);sp.position.set(b.x,b.y0+b.h+7,b.z);sp.visible=false;scene.add(sp);LBL.push({sp,b});});
}


/* ===== New York skyline: real NYC building models replace the cartoon facades ===== */
{
 const nt=NYB.tex.map(u=>{const t=new THREE.TextureLoader().load(u);t.flipY=false;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;t.anisotropy=8;return t;});
 const NM=NYB.mats.map(m=>new THREE.MeshStandardMaterial({color:new THREE.Color(m.c[0],m.c[1],m.c[2]),map:m.t>=0?nt[m.t]:null,metalness:Math.min(m.m,.15),roughness:Math.max(.7,m.r)}));
 const G=NYB.bs.map(s=>s.g.map(g=>{const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(b64a(g.p,Float32Array),3));geo.setAttribute('normal',new THREE.BufferAttribute(b64a(g.n,Float32Array),3));
  geo.setAttribute('uv',new THREE.BufferAttribute(b64a(g.u,Float32Array),2));geo.setIndex(new THREE.BufferAttribute(b64a(g.i,g.i32?Uint32Array:Uint16Array),1));return{geo,m:g.m};}));
 // door decal: dark glass entrance so the doorway is visible on the new facade
 const dc=document.createElement('canvas');dc.width=256;dc.height=256;{const x=dc.getContext('2d');
  x.fillStyle='#b9b2a4';x.fillRect(0,0,256,256);x.fillStyle='#0d1418';x.fillRect(14,14,228,242);
  const gr=x.createLinearGradient(0,14,0,256);gr.addColorStop(0,'#27414c');gr.addColorStop(.6,'#142129');gr.addColorStop(1,'#d9a85a');x.fillStyle=gr;x.fillRect(20,20,102,236);x.fillRect(134,20,102,236);
  x.fillStyle='rgba(255,255,255,.12)';x.beginPath();x.moveTo(20,20);x.lineTo(70,20);x.lineTo(20,110);x.fill();x.beginPath();x.moveTo(134,20);x.lineTo(184,20);x.lineTo(134,110);x.fill();
  x.fillStyle='#c9ccd0';x.fillRect(122,14,12,242);x.fillRect(100,128,6,50);x.fillRect(150,128,6,50);}
 const dt=new THREE.CanvasTexture(dc);dt.encoding=THREE.sRGBEncoding;
 const dMat=new THREE.MeshBasicMaterial({map:dt,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
 function retile(geo,sx,sy,sz){const n=geo.attributes.normal,u0=geo.attributes.uv.array,u=new Float32Array(u0.length);
  for(let i=0;i<n.count;i++){let U=u0[i*2],V=u0[i*2+1];
   if(Math.abs(n.array[i*3+1])<.3){const hs=Math.abs(n.array[i*3])>Math.abs(n.array[i*3+2])?sz:sx,q=hs/sy;
    if(q>1.4)U*=Math.min(6,Math.round(q));else if(q<.7)V*=Math.min(4,Math.round(1/q));}
   u[i*2]=U;u[i*2+1]=V;}
  const g=new THREE.BufferGeometry();g.setAttribute('position',geo.attributes.position);g.setAttribute('normal',n);g.setAttribute('uv',new THREE.BufferAttribute(u,2));g.setIndex(geo.index);return g;}
 const TINT=[[1,1,1],[.9,.9,.93],[1,.94,.86],[.87,.91,.98]],TM={};
 const tmat=(m,t,b)=>{const key=m+'_'+t+'_'+b.x+'_'+b.z;return TM[key]||(TM[key]=(()=>{const x=NM[m].clone();x.color.multiply(new THREE.Color(TINT[t][0],TINT[t][1],TINT[t][2]));
  const Dl=Math.abs(b.fz)>.5?b.d:b.w,cx=b.x+b.fx*(Dl/2-.25),cz=b.z+b.fz*(Dl/2-.25),hw=b.dw/2-.02;
  x.onBeforeCompile=sh=>{sh.uniforms.uDc={value:new THREE.Vector4(cx,b.y0,cz,hw)};sh.uniforms.uDn={value:new THREE.Vector2(b.fx,b.fz)};sh.uniforms.uRoof={value:b.k==='b'?b.y0+b.h-.2:-1e5};
   sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;').replace('#include <begin_vertex>','#include <begin_vertex>\nvWP=(modelMatrix*vec4(transformed,1.0)).xyz;');
   sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;uniform vec4 uDc;uniform vec2 uDn;uniform float uRoof;').replace('void main() {','void main() {\n if(vWP.y<uRoof)discard;\n vec2 q=vWP.xz-uDc.xz;float al=dot(q,vec2(-uDn.y,uDn.x));float dp=dot(q,uDn);if(abs(al)<uDc.w&&vWP.y>uDc.y-.05&&vWP.y<uDc.y+2.85&&abs(dp)<1.2)discard;');};
  return x;})());};
 const tgt=CD.bld.filter(b=>b.k==='b'||b.k==='lt'),uses=NYB.bs.map(()=>0),ord=tgt.map((b,i)=>i).sort((p,q)=>tgt[q].h-tgt[p].h);
 const NYMAP=[];window.NYMAP=NYMAP;
 ord.forEach(i=>{const b=tgt[i],w2=b.w+.2,d2=b.d+.2;let best=null;
  NYB.bs.forEach((s,k)=>{if(b.k==='lt'&&s.n!=='empire_state')return;if(b.k!=='lt'&&s.n==='empire_state')return;
   for(let r=0;r<2;r++){const sx=(r?d2:w2)/s.ex,sz=(r?w2:d2)/s.ez,sy=(b.h/s.fw)/s.ey,c=.6*Math.abs(Math.log(sx/sz))+2*Math.abs(Math.log(sy/Math.sqrt(sx*sz)))+.15*uses[k];
    if(!best||c<best.c)best={c,k,r,sx,sy,sz};}});
  const s=NYB.bs[best.k],tn=uses[best.k]%4;uses[best.k]++;
  const grp=new THREE.Group();G[best.k].forEach(({geo,m})=>{const ms=new THREE.Mesh(s.box?retile(geo,best.sx,best.sy,best.sz):geo,tmat(m,tn,b));ms.castShadow=ms.receiveShadow=true;grp.add(ms);solids.push(ms);});
  grp.scale.set(best.sx,best.sy,best.sz);grp.rotation.y=best.r?Math.PI/2:0;grp.position.set(b.x,b.y0,b.z);scene.add(grp);
  b.ny=s.n;NYMAP.push(b.n+' -> '+s.n);
  // upper (set-back) part of the landmark towers is solid too
  if(s.fw<1&&s.ch>0)boxes.push({a:b.x-b.w*s.uw/2,b:b.x+b.w*s.uw/2,c:b.y0+b.h,d:b.y0+b.h+s.ch*(b.h/s.fw),e:b.z-b.d*s.uw/2,f:b.z+b.d*s.uw/2});
  });
 // ---- building styles: brick, limestone, concrete (per building) ----
 const PAL=[[.52,.24,.19],[.66,.52,.36],[.8,.76,.66],[.58,.59,.6],[.34,.2,.17],[.72,.6,.44]],TRM=[[.82,.8,.74],[.84,.8,.7],[.9,.87,.8],[.72,.72,.75],[.8,.77,.7],[.88,.84,.74]];
 const BSTY=tgt.map((b,i)=>b.k==='lt'?2:[0,1,2,3,4,5,0,4,1,3,5,2][(i*7+3)%12]);
 const BCOL=BSTY.map((s,i)=>{const j=.9+((i*37)%21)/100;return PAL[s].map(v=>Math.min(1,v*j));});
 const BTRIM=BSTY.map(s=>TRM[s]);
 // ---- inside walls with real window openings (floor by floor), so interiors are enclosed and show the skyline through glass ----
 try{const WB=[],GB=[],T=.5,PS=4;
  let curB=-1;const addB=(arr,x0,x1,y0,y1,z0,z1)=>{if(x1-x0<1e-3||y1-y0<1e-3||z1-z0<1e-3)return;arr.push([(x0+x1)/2,(y0+y1)/2,(z0+z1)/2,x1-x0,y1-y0,z1-z0,curB]);};
  tgt.forEach((b,ti)=>{curB=ti;const S=b.s,st=b.st,x0=b.x-b.w/2,x1=b.x+b.w/2,z0=b.z-b.d/2,z1=b.z+b.d/2;
   for(let k=0;k<S;k++){const ya=b.y0+k*st,yb=b.y0+(k+1)*st-.3,sill=ya+.9,head=ya+2.5;
    // four sides: [axis, fixed-min, fixed-max, run-min, run-max, normal-facing-door?]
    [['x',z0,z0+T,x0,x1,0,-1],['x',z1-T,z1,x0,x1,0,1],['z',x0,x0+T,z0,z1,-1,0],['z',x1-T,x1,z0,z1,1,0]].forEach(([ax,f0,f1,r0,r1,nx,nz])=>{
     const L=r1-r0,front=(nx===b.fx&&nz===b.fz)&&k===0,cen=(r0+r1)/2,gl=cen-b.dw/2-.15,gh=cen+b.dw/2+.15;
     const put=(arr,a,c,y0_,y1_,fa,fb)=>{if(ax==='x')addB(arr,a,c,y0_,y1_,fa,fb);else addB(arr,fa,fb,y0_,y1_,a,c);};
     // spandrel (below window) and header (above window)
     if(front){put(WB,r0,gl,ya,sill,f0,f1);put(WB,gh,r1,ya,sill,f0,f1);put(WB,r0,r1,ya+2.9,yb,f0,f1);}
     else{put(WB,r0,r1,ya,sill,f0,f1);put(WB,r0,r1,head,yb,f0,f1);}
     // pillars
     const n=Math.max(2,Math.round(L/PS));for(let i=0;i<=n;i++){const c=r0+i*L/n,a=Math.max(r0,c-.25),e=Math.min(r1,c+.25);
      if(front&&e>gl&&a<gh)continue;put(WB,a,e,ya,yb,f0,f1);}
     // thin tinted glass in the opening
     const m=(f0+f1)/2;if(front){put(GB,r0,gl,sill,head,m-.02,m+.02);put(GB,gh,r1,sill,head,m-.02,m+.02);}else put(GB,r0,r1,sill,head,m-.02,m+.02);});}});
  const mk=(arr,mat,rs)=>{const im=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),mat,arr.length),o=new THREE.Object3D();
   arr.forEach((a,i)=>{o.position.set(a[0],a[1],a[2]);o.scale.set(a[3],a[4],a[5]);o.updateMatrix();im.setMatrixAt(i,o.matrix);});
   im.castShadow=false;im.receiveShadow=rs;im.frustumCulled=false;scene.add(im);return im;};
  const wallM=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.92,metalness:0});
  wallM.onBeforeCompile=sh=>{
   sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float aSt;varying float vSt;varying vec3 vWP2;varying vec3 vWN2;')
    .replace('#include <begin_vertex>','#include <begin_vertex>\nvSt=aSt;vWN2=objectNormal;vec4 wp_=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\nwp_=instanceMatrix*wp_;\n#endif\nvWP2=(modelMatrix*wp_).xyz;');
   sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vSt;varying vec3 vWP2;varying vec3 vWN2;\nfloat h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}')
    .replace('#include <color_fragment>','#include <color_fragment>\n{vec3 an=abs(vWN2);vec2 uv=an.x>.5?vec2(vWP2.z,vWP2.y):(an.z>.5?vec2(vWP2.x,vWP2.y):vWP2.xz);vec3 base=diffuseColor.rgb,col=base;\n if(vSt<1.5||(vSt>3.5&&vSt<4.5)){float rh=.0775,rw=.225;float row=floor(uv.y/rh);float xo=uv.x/rw+mod(row,2.)*.5;float bi=floor(xo);vec2 f=vec2(fract(xo),fract(uv.y/rh));\n  float mort=(f.x<.045||f.x>.955||f.y<.11)?1.:0.;col=base*(.72+.5*h21(vec2(bi,row)));col=mix(col,vec3(.52,.5,.46),mort);}\n else if(vSt>2.5&&vSt<3.5){vec2 f=vec2(fract(uv.x/2.8),fract(uv.y/3.4));float seam=(f.x<.01||f.y<.012)?1.:0.;col=base*(.9+.18*h21(floor(uv/vec2(2.8,3.4))))*(.94+.1*h21(floor(uv*40.)));col=mix(col,base*.5,seam);}\n else{float rh=.42,rw=.95;float row=floor(uv.y/rh);float xo=uv.x/rw+mod(row,2.)*.5;float bi=floor(xo);vec2 f=vec2(fract(xo),fract(uv.y/rh));\n  float mort=(f.x<.012||f.x>.988||f.y<.025)?1.:0.;col=base*(.88+.22*h21(vec2(bi,row)));col=mix(col,base*.55,mort);}\n {float gx_=floor(uv.x*3.1);float sk_=h21(vec2(gx_,7.3));float stk_=smoothstep(.62,1.,sk_)*(.55+.45*h21(vec2(floor(uv.y*.7),gx_)));float low_=1.-smoothstep(0.,6.,vWP2.y);col*=(1.-.3*stk_)*(1.-.24*low_);} col*=(.8+.2*smoothstep(0.,2.5,vWP2.y))*(.93+.07*h21(vec2(floor(uv.x*5.),floor(uv.y*.5))));diffuseColor.rgb=col;}');};
  const wim=mk(WB,wallM,true),stA=new Float32Array(WB.length);
  WB.forEach((a,i)=>{const s=BSTY[a[6]]||0,c=BCOL[a[6]]||[.8,.8,.8];stA[i]=s;wim.setColorAt(i,new THREE.Color(c[0],c[1],c[2]));});
  wim.geometry.setAttribute('aSt',new THREE.InstancedBufferAttribute(stA,1));wim.instanceColor.needsUpdate=true;
  mk(GB,new THREE.MeshStandardMaterial({color:new THREE.Color(.45,.62,.72),roughness:.1,metalness:.2,transparent:true,opacity:.14,depthWrite:false}),false);
  window.NYWALLS=[WB.length,GB.length];setTimeout(()=>{try{toast('NY v3: window walls ON ('+WB.length+' pieces)');}catch(e){}},4000);}catch(err){console.error('NY walls failed',err);setTimeout(()=>{try{toast('NY walls ERROR: '+err.message);}catch(e){}},4000);}
 // ---- facade detailing (frames, sills, lintels, piers, floor bands, plinth, canopy, cornice, roof gear) + blinds + night-lit windows ----
 try{
  const T=.5,PS=4;
  function mb32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
  const STN=[],FRM=[],MTL=[],BLD=[],VEL=[],TNK=[],MST=[],BCN=[];
  const warm=[[1,.78,.45],[1,.78,.45],[1,.9,.7],[1,.62,.36],[.72,.86,1]],blindC=[[.86,.82,.72],[.7,.72,.74],[.56,.5,.44],[.82,.78,.66],[.9,.9,.88]];
  tgt.forEach((b,ti)=>{if(b.k!=='b')return;
   const R=mb32(1000+ti*7919),S=b.s,st=b.st,y0=b.y0,tp=y0+S*st,x0=b.x-b.w/2,x1=b.x+b.w/2,z0=b.z-b.d/2,z1=b.z+b.d/2,trim=BTRIM[ti],dark=[trim[0]*.42,trim[1]*.42,trim[2]*.44];
   const sides=[{ax:'x',fo:z0,dir:-1,r0:x0,r1:x1,nx:0,nz:-1},{ax:'x',fo:z1,dir:1,r0:x0,r1:x1,nx:0,nz:1},{ax:'z',fo:x0,dir:-1,r0:z0,r1:z1,nx:-1,nz:0},{ax:'z',fo:x1,dir:1,r0:z0,r1:z1,nx:1,nz:0}];
   sides.forEach(sd=>{
    const L=sd.r1-sd.r0,front=(sd.nx===b.fx&&sd.nz===b.fz),cen=(sd.r0+sd.r1)/2,gl=cen-b.dw/2-.15,gh=cen+b.dw/2+.15,n=Math.max(2,Math.round(L/PS));
    const put=(arr,ra,rb,ya,yb,o1,o2,col)=>{if(rb-ra<1e-3||yb-ya<1e-3)return;const a=sd.fo+sd.dir*o1,c=sd.fo+sd.dir*o2,f0=Math.min(a,c),f1=Math.max(a,c),fm=(f0+f1)/2,fs=f1-f0,rm=(ra+rb)/2,rs=rb-ra;
     arr.push(sd.ax==='x'?[rm,(ya+yb)/2,fm,rs,yb-ya,fs].concat(col||[]):[fm,(ya+yb)/2,rm,fs,yb-ya,rs].concat(col||[]));};
    const gm=-T/2;
    for(let k=0;k<S;k++){const ya=y0+k*st,sill=ya+.9,head=ya+2.5;
     for(let i=0;i<n;i++){const c0=sd.r0+i*L/n,c1=sd.r0+(i+1)*L/n,a=c0+.25,e=c1-.25,ww=e-a,cx=(a+e)/2;
      if(front&&k===0&&a<gh&&e>gl)continue;
      put(FRM,a,a+.06,sill,head,gm-.05,gm+.05);put(FRM,e-.06,e,sill,head,gm-.05,gm+.05);put(FRM,a,e,head-.06,head,gm-.05,gm+.05);put(FRM,a,e,sill,sill+.06,gm-.05,gm+.05);
      put(FRM,a,e,sill+1.0,sill+1.04,gm-.04,gm+.04);if(ww>1.6)put(FRM,cx-.025,cx+.025,sill,head,gm-.04,gm+.04);
      put(STN,a-.12,e+.12,sill-.09,sill+.02,-.02,.26,trim);put(STN,a-.1,e+.1,head+.02,head+.2,-.02,.14,trim);
      const rv=R();
      if(rv<.3){const cf=.35+.65*R(),bc=blindC[(R()*blindC.length)|0];put(BLD,a+.07,e-.07,head-.06-cf*1.5,head-.07,gm-.16,gm-.12,bc);}
      else if(rv<.39&&k>=1&&S<=24)put(MTL,cx-.35,cx+.35,sill-.5,sill-.02,0,.45);
      if(R()<.0){const wc=warm[(R()*warm.length)|0];put(VEL,a+.05,e-.05,sill+.06,head-.06,gm-.22,gm-.19,wc);}
     }
     if(k>=1)put(STN,sd.r0-.12,sd.r1+.12,ya-.14,ya+.16,-.02,.1,trim);
    }
    for(let i=0;i<=n;i++){const c=sd.r0+i*L/n;if(front&&c>gl-.4&&c<gh+.4)continue;put(STN,c-.3,c+.3,y0+.9,tp-.55,-.02,.14,trim);}
    if(front){put(STN,sd.r0-.14,gl,y0,y0+.85,-.02,.14,dark);put(STN,gh,sd.r1+.14,y0,y0+.85,-.02,.14,dark);
     put(MTL,cen-b.dw/2-.7,cen+b.dw/2+.7,y0+3.2,y0+3.38,0,1.7);}
    else put(STN,sd.r0-.14,sd.r1+.14,y0,y0+.85,-.02,.14,dark);
    put(STN,sd.r0-.3,sd.r1+.3,tp-.55,tp-.05,-.02,.42,trim);put(STN,sd.r0,sd.r1,tp,tp+.22,-.3,0,trim);
   });
   // roof equipment, kept to the front half so the stairs and lift stay clear
   const rx=b.fz,rz=-b.fx,alongZ=Math.abs(b.fz)>.5,Wl=alongZ?b.w:b.d,Dl=alongZ?b.d:b.w,Lw=(lx,lz)=>[b.x+lx*rx+lz*b.fx,b.z+lx*rz+lz*b.fz];
   const unit=(lx,lz,hw,hd,h)=>{const c=Lw(lx,lz),xs=alongZ?hw:hd,zs=alongZ?hd:hw;MTL.push([c[0],tp+h/2,c[1],xs*2,h,zs*2]);boxes.push({a:c[0]-xs,b:c[0]+xs,c:tp,d:tp+h,e:c[1]-zs,f:c[1]+zs});};
   if(R()<.85)unit(-(Wl/2-2.6),Dl/2-2.2,1.1,.7,1.1);if(R()<.85)unit(Wl/2-2.6,Dl/2-2.2,1.1,.7,1.1);if(Wl>14&&R()<.7)unit(Wl/2-5.6,Dl/2-2.2,.9,.6,.9);
   if(S>=8&&R()<.55){const c=Lw(0,Dl/2-3.4);TNK.push([c[0],tp+4.1,c[1],1.5,2.6]);[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(s=>MTL.push([c[0]+s[0]*1.1,tp+1.4,c[1]+s[1]*1.1,.18,2.8,.18]));}
   if(S>=10){const c=Lw(Wl/2-1.4,-Dl/2+3.2);MST.push([c[0],tp+4,c[1],8]);if(S>=14)BCN.push([c[0],tp+8.3,c[1]]);}
  });
  const mkI=(arr,mat,col)=>{if(!arr.length)return null;const im=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),mat,arr.length),o=new THREE.Object3D(),cc=new THREE.Color();
   arr.forEach((a,i)=>{o.position.set(a[0],a[1],a[2]);o.scale.set(a[3],a[4],a[5]);o.updateMatrix();im.setMatrixAt(i,o.matrix);if(col){cc.setRGB(a[6]===undefined?1:a[6],a[7]===undefined?1:a[7],a[8]===undefined?1:a[8]);im.setColorAt(i,cc);}});
   if(col)im.instanceColor.needsUpdate=true;im.frustumCulled=false;im.castShadow=false;im.receiveShadow=false;scene.add(im);return im;};
  mkI(STN,new THREE.MeshStandardMaterial({color:0xffffff,roughness:.85,metalness:0}),true);
  mkI(FRM,new THREE.MeshStandardMaterial({color:0x1d2125,roughness:.45,metalness:.55}),false);
  mkI(MTL,new THREE.MeshStandardMaterial({color:0x7d8388,roughness:.6,metalness:.4}),false);
  mkI(BLD,new THREE.MeshStandardMaterial({color:0xffffff,roughness:.95,metalness:0}),true);
  const veilM=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
  const veil=mkI(VEL,veilM,true);if(veil)veil.renderOrder=3;
  const cyl=(arr,mat,fn)=>{if(!arr.length)return;const im=new THREE.InstancedMesh(new THREE.CylinderGeometry(1,1,1,14),mat,arr.length),o=new THREE.Object3D();arr.forEach((a,i)=>{fn(o,a);o.updateMatrix();im.setMatrixAt(i,o.matrix);});im.frustumCulled=false;scene.add(im);};
  cyl(TNK,new THREE.MeshStandardMaterial({color:0x6b4a32,roughness:.8,metalness:.1}),(o,a)=>{o.position.set(a[0],a[1],a[2]);o.scale.set(a[3],a[4],a[3]);});
  cyl(MST,new THREE.MeshStandardMaterial({color:0x9aa0a5,roughness:.5,metalness:.6}),(o,a)=>{o.position.set(a[0],a[1],a[2]);o.scale.set(.07,a[3],.07);});
  const bcnM=new THREE.MeshBasicMaterial({color:0xff1010});
  if(BCN.length){const im=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.4,1),bcnM,BCN.length),o=new THREE.Object3D();BCN.forEach((a,i)=>{o.position.set(a[0],a[1],a[2]);o.updateMatrix();im.setMatrixAt(i,o.matrix);});im.frustumCulled=false;scene.add(im);}
  window.INTM=window.INTM||[];
  const _hf=hudTick;hudTick=function(n){_hf(n);try{const k=(typeof nf==='number')?nf:0,e=Math.min(1,Math.max(0,k-.1)*1.5);
   veilM.opacity=e*.38;veilM.visible=e>.01;INTM.forEach(m=>{m.emissive.setRGB(1,.82,.58);m.emissiveIntensity=e*.5;});
   bcnM.visible=e>.02;bcnM.color.setRGB(((n/1000)%1.6)<.25?1:.15,.02,.02);}catch(x){}};
  window.NYDETAIL=[STN.length,FRM.length,MTL.length,BLD.length,VEL.length];
 }catch(err){console.error('Facade details failed',err);}
 // ---- v11: night windows with real rooms inside (interior mapping), window glow, light spill, door lamps, fire escapes ----
 try{
  const T11=.5,PS11=4;
  const rg=a=>function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
  const LIT=[],ROOM=[],HALO=[],LAMPS=[],FEB=[],FES=[];
  const TEMP=[[1,.78,.45],[1,.78,.45],[1,.86,.62],[1,.64,.38],[.74,.86,1],[1,.72,.82]];
  tgt.forEach((b,ti)=>{if(b.k!=='b')return;
   const R=rg(9100+ti*7727),S=b.s,st=b.st,y0=b.y0,x0=b.x-b.w/2,x1=b.x+b.w/2,z0=b.z-b.d/2,z1=b.z+b.d/2,act=.3+.38*R();
   const esc=(BSTY[ti]===0||BSTY[ti]===1||BSTY[ti]===4)&&S>=3&&S<=22&&R()<.85;let escDone=false;
   const sides=[{ax:'x',fo:z0,dir:-1,r0:x0,r1:x1,nx:0,nz:-1},{ax:'x',fo:z1,dir:1,r0:x0,r1:x1,nx:0,nz:1},{ax:'z',fo:x0,dir:-1,r0:z0,r1:z1,nx:-1,nz:0},{ax:'z',fo:x1,dir:1,r0:z0,r1:z1,nx:1,nz:0}];
   sides.forEach(sd=>{
    const L=sd.r1-sd.r0,front=(sd.nx===b.fx&&sd.nz===b.fz),cen=(sd.r0+sd.r1)/2,gl=cen-b.dw/2-.15,gh=cen+b.dw/2+.15,n=Math.max(2,Math.round(L/PS11));
    const P=(rc,y,off)=>sd.ax==='x'?[rc,y,sd.fo+sd.dir*off]:[sd.fo+sd.dir*off,y,rc];
    const ry=Math.atan2(sd.nx,sd.nz);
    for(let k=0;k<S;k++){const ya=y0+k*st,sill=ya+.9,head=ya+2.5,yc=(sill+head)/2;
     for(let i=0;i<n;i++){const c0=sd.r0+i*L/n,c1=sd.r0+(i+1)*L/n,a=c0+.25,e=c1-.25,ww=e-a,cx=(a+e)/2;
      if(front&&k===0&&a<gh&&e>gl)continue;
      const r1=R(),r2=R(),r3=R(),r4=R();
      if(r1>=(k===0?.72:act))continue;
      const col=TEMP[(r2*TEMP.length)|0],pos=P(cx,yc,-(T11-.03)),hp=P(cx,yc,.32),wh=head-sill-.12;
      ROOM.push({p:pos,ry:ry,w:ww-.1,h:wh,fl:ya+.03-yc,ce:ya+st-.36-yc,dep:3.4+3*r3,seed:1+r4*97,col:col});
      HALO.push({p:hp,ry:ry,w:ww+1.7,h:wh+1.5,col:col});
      LIT.push({x:hp[0],y:yc,z:hp[2],nx:sd.nx,nz:sd.nz,c:col});
     }}
    // entrance lanterns either side of the door
    if(front){[-1,1].forEach(s=>{LAMPS.push({p:P(cen+s*(b.dw/2+.95),y0+2.55,.3),ry:ry});});}
    // fire escape on one side wall of brick buildings
    if(esc&&!escDone&&(sd.nx*b.fx+sd.nz*b.fz)===0&&R()<.6){escDone=true;
     const rc=sd.r0+L*(.3+.4*R()),W=3.2,D0=.34,D1=1.42,dm=(D0+D1)/2,ds=D1-D0;
     const fe=(runC,y,off,rs,ys,os)=>FEB.push(sd.ax==='x'?[runC,y,sd.fo+sd.dir*off,rs,ys,os]:[sd.fo+sd.dir*off,y,runC,os,ys,rs]);
     for(let k=1;k<S;k++){const y=y0+k*st;
      fe(rc,y-.04,dm,W,.08,ds);
      fe(rc,y+1.0,D1-.03,W,.05,.05);fe(rc,y+.5,D1-.03,W,.04,.04);
      fe(rc-W/2+.03,y+1.0,dm,.05,.05,ds);fe(rc+W/2-.03,y+1.0,dm,.05,.05,ds);
      fe(rc-W/2+.03,y+.5,dm,.04,.04,ds);fe(rc+W/2-.03,y+.5,dm,.04,.04,ds);
      const up=(k%2===0)?1:-1,sl=2.5,ang=Math.atan2(st,sl),p3=P(rc,y-st/2,D1-.55);
      FES.push({p:p3,ax:sd.ax,up:up,len:Math.hypot(sl,st),ang:ang});
     }}
  });
  });

  const mkInst=(geo,mat,arr,fn)=>{const im=new THREE.InstancedMesh(geo,mat,arr.length),o=new THREE.Object3D();
   arr.forEach((a,i)=>{o.position.set(0,0,0);o.rotation.set(0,0,0);o.scale.set(1,1,1);fn(o,a,i);o.updateMatrix();im.setMatrixAt(i,o.matrix);});
   im.frustumCulled=false;im.castShadow=false;im.receiveShadow=false;scene.add(im);return im;};

  // ---- interior-mapped rooms (a real room box is ray-traced behind every lit window: floor, ceiling lamp, walls, furniture, people) ----
  const VS=`
attribute vec4 aRoom;attribute vec3 aCol;
varying vec3 vO;varying vec3 vD;varying vec4 vRoom;varying vec3 vCol;varying vec2 vSz;
#include <fog_pars_vertex>
void main(){
 mat4 M=modelMatrix*instanceMatrix;
 vec3 R=normalize(M[0].xyz);vec3 V=normalize(M[1].xyz);vec3 N=normalize(M[2].xyz);
 float sx=length(M[0].xyz);float sy=length(M[1].xyz);
 vec4 wp=M*vec4(position,1.);
 vec3 dw=wp.xyz-cameraPosition;
 vD=vec3(dot(dw,R),dot(dw,V),dot(dw,N));
 vO=vec3(position.x*sx,position.y*sy,0.);
 vRoom=aRoom;vCol=aCol;vSz=vec2(sx,sy);
 vec4 mvPosition=viewMatrix*wp;
 gl_Position=projectionMatrix*mvPosition;
 #include <fog_vertex>
}`;
  const FS=`
uniform float uT;uniform float uN;
varying vec3 vO;varying vec3 vD;varying vec4 vRoom;varying vec3 vCol;varying vec2 vSz;
#include <fog_pars_fragment>
float h11(float n){return fract(sin(n*91.3458)*47453.5453);}
float hb(vec3 o,vec3 d,vec3 mn,vec3 mx,out vec3 nr){
 vec3 inv=1./d;vec3 a=(mn-o)*inv;vec3 b=(mx-o)*inv;vec3 tn=min(a,b);vec3 tf=max(a,b);
 float t0=max(max(tn.x,tn.y),tn.z);float t1=min(min(tf.x,tf.y),tf.z);
 nr=vec3(0.,0.,1.);
 if(t1<0.||t0>t1) return 1e9;
 if(tn.x>=tn.y&&tn.x>=tn.z) nr=vec3(-sign(d.x),0.,0.);
 else if(tn.y>=tn.z) nr=vec3(0.,-sign(d.y),0.);
 else nr=vec3(0.,0.,-sign(d.z));
 return max(t0,0.);
}
vec3 shade(vec3 alb,vec3 hp,vec3 lp,vec3 lc){float dl=distance(hp,lp);return alb*lc*(.3+1.6/(1.+.18*dl*dl));}
void main(){
 vec3 d=normalize(vD);vec3 o=vO;
 float sd=vRoom.w;float fl=vRoom.x;float ce=vRoom.y;float dep=vRoom.z;
 float pw=vSz.x*.5;float ph=vSz.y*.5;float hx=pw+.25;
 vec3 lc=vCol;
 vec3 lp=vec3((h11(sd*7.)-.5)*hx*1.2,ce-.06,-dep*.45);
 vec3 bmin=vec3(-hx,fl,-dep);vec3 bmax=vec3(hx,ce,0.);
 vec3 inv=1./d;vec3 t1=(bmin-o)*inv;vec3 t2=(bmax-o)*inv;vec3 tf=max(t1,t2);
 float t=min(tf.x,min(tf.y,tf.z));vec3 hp=o+d*t;
 vec3 wallC=mix(vec3(.9,.82,.64),vec3(.62,.72,.82),h11(sd*3.1));
 wallC=mix(wallC,vec3(.8,.52,.46),step(.82,h11(sd*5.7))*.7);
 vec3 alb=wallC;
 if(tf.z<=tf.x&&tf.z<=tf.y){
  vec2 pc=vec2((h11(sd*2.3)-.5)*hx*1.1,(fl+ce)*.5+.3);
  vec2 q=abs(hp.xy-pc);
  if(q.x<.42&&q.y<.3){alb=vec3(.16,.13,.1);if(q.x<.35&&q.y<.23)alb=vec3(.75,.55,.32)*(.55+.45*h11(floor(hp.x*7.)+sd));}
  if(hp.y<fl+.12)alb=vec3(.92);
 }else if(tf.y<=tf.x){
  if(d.y<0.){
   alb=mix(vec3(.4,.27,.16),vec3(.3,.2,.12),step(.5,fract(hp.z*2.4)))*(.85+.15*h11(floor(hp.x*3.)+floor(hp.z*2.4)));
   if(h11(sd*4.4)>.5&&abs(hp.x)<hx*.6&&abs(hp.z+dep*.5)<dep*.28)alb=mix(alb,vec3(.5,.2,.22),.8);
  }else alb=vec3(.93);
 }else alb=wallC*.9;
 vec3 col=shade(alb,hp,lp,lc);
 if(d.y>0.&&tf.y<=tf.x&&tf.y<=tf.z&&length(hp.xz-lp.xz)<.3)col=mix(lc,vec3(1.),.6)*1.2;
 float best=t;vec3 nr;
 float ft=h11(sd*19.);float fx=(h11(sd*23.)-.5)*hx*1.1;
 vec3 mn=vec3(fx-.6,fl,-dep+.2);vec3 mx=vec3(fx+.6,fl+.5,-dep+.7);vec3 fc=vec3(.2,.2,.22);
 if(ft<.35){mn=vec3(fx-.95,fl,-dep+.1);mx=vec3(fx+.95,fl+.85,-dep+1.);fc=mix(vec3(.25,.3,.42),vec3(.5,.26,.2),h11(sd*29.));}
 else if(ft<.6){mn=vec3(fx-.9,fl,-dep+.1);mx=vec3(fx+.9,fl+.75,-dep+.8);fc=vec3(.38,.24,.13);}
 else if(ft<.8){mn=vec3(hx-.55,fl,-dep*.7);mx=vec3(hx,fl+2.,-dep*.7+1.6);fc=vec3(.3,.19,.1);}
 float th=hb(o,d,mn,mx,nr);
 if(th<best){best=th;vec3 hq=o+d*th;col=shade(fc,hq,lp,lc)*(.75+.25*nr.y+.1*abs(nr.x));}
 if(ft>=.35&&ft<.6){
  float tm=hb(o,d,vec3(fx-.35,fl+.75,-dep+.14),vec3(fx+.35,fl+1.15,-dep+.2),nr);
  if(tm<best){best=tm;col=vec3(.45,.75,1.)*(.8+.2*sin(uT*3.+sd));}
 }
 if(ft>=.8){
  float tm=hb(o,d,vec3(fx-.7,fl+.8,-dep+.02),vec3(fx+.7,fl+1.4,-dep+.08),nr);
  if(tm<best){best=tm;col=vec3(.4,.6,1.)*(.65+.35*sin(uT*7.+sd*5.)*sin(uT*2.3+sd));}
 }
 if(h11(sd*31.)>.83){
  float px=(h11(sd*37.)-.5)*hx*1.3;float pz=-dep*.5;
  float a1=hb(o,d,vec3(px-.17,fl,pz-.12),vec3(px+.17,fl+.85,pz+.12),nr);
  float a2=hb(o,d,vec3(px-.24,fl+.85,pz-.13),vec3(px+.24,fl+1.5,pz+.13),nr);
  float a3=hb(o,d,vec3(px-.1,fl+1.5,pz-.1),vec3(px+.1,fl+1.75,pz+.1),nr);
  float tpp=min(a1,min(a2,a3));
  if(tpp<best){best=tpp;col=vec3(.04,.04,.06)+lc*.07;}
 }
 float bl=step(.7,h11(sd*13.))*(.2+.45*h11(sd*17.));
 if(o.y>ph-bl*vSz.y){col=vec3(.9,.82,.68)*lc*(.8+.18*sin(o.y*34.));}
 float cf=.14+.26*h11(sd*9.1);
 if(h11(sd*11.1)>.5&&abs(o.x)>pw-cf*vSz.x){col=mix(vec3(.72,.34,.3),vec3(.84,.8,.7),step(.5,h11(sd*21.)))*lc*(.8+.2*sin(o.x*22.));}
 gl_FragColor=vec4(min(col,vec3(1.)),uN);
 #include <fog_fragment>
}`;
  const roomM=new THREE.ShaderMaterial({uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{uT:{value:0},uN:{value:0}}]),vertexShader:VS,fragmentShader:FS,transparent:true,depthWrite:false,fog:true});
  let roomIM=null,haloIM=null;
  if(ROOM.length){const g=new THREE.PlaneGeometry(1,1),aR=new Float32Array(ROOM.length*4),aC=new Float32Array(ROOM.length*3);
   ROOM.forEach((r,i)=>{aR.set([r.fl,r.ce,r.dep,r.seed],i*4);aC.set(r.col,i*3);});
   g.setAttribute('aRoom',new THREE.InstancedBufferAttribute(aR,4));g.setAttribute('aCol',new THREE.InstancedBufferAttribute(aC,3));
   roomIM=mkInst(g,roomM,ROOM,(o,r)=>{o.position.set(r.p[0],r.p[1],r.p[2]);o.rotation.set(0,r.ry,0);o.scale.set(r.w,r.h,1);});
   roomIM.renderOrder=-1;roomIM.visible=false;}

  // ---- soft glow that spills out of every lit window and door lantern ----
  const gc=document.createElement('canvas');gc.width=gc.height=128;
  {const x=gc.getContext('2d'),gr=x.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(255,255,255,.95)');gr.addColorStop(.3,'rgba(255,255,255,.4)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,128,128);}
  const haloM=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(gc),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
  const HALL=HALO.concat(LAMPS.map(l=>({p:l.p,ry:l.ry,w:4.4,h:4.4,col:[1,.8,.5]})));
  if(HALL.length){haloIM=mkInst(new THREE.PlaneGeometry(1,1),haloM,HALL,(o,r)=>{o.position.set(r.p[0],r.p[1],r.p[2]);o.rotation.set(0,r.ry,0);o.scale.set(r.w,r.h,1);});
   HALL.forEach((r,i)=>haloIM.setColorAt(i,new THREE.Color(r.col[0],r.col[1],r.col[2])));haloIM.instanceColor.needsUpdate=true;haloIM.renderOrder=3;haloIM.visible=false;}

  // ---- door lanterns (bulb) ----
  const lampM=new THREE.MeshBasicMaterial({color:0x2a241c});
  if(LAMPS.length)mkInst(new THREE.BoxGeometry(1,1,1),lampM,LAMPS,(o,l)=>{o.position.set(l.p[0],l.p[1],l.p[2]);o.rotation.set(0,l.ry,0);o.scale.set(.24,.34,.24);});

  // ---- fire escapes: decks, rails, diagonal stairs ----
  const feM=new THREE.MeshStandardMaterial({color:0x1b1e21,roughness:.55,metalness:.5});
  if(FEB.length)mkInst(new THREE.BoxGeometry(1,1,1),feM,FEB,(o,a)=>{o.position.set(a[0],a[1],a[2]);o.scale.set(a[3],a[4],a[5]);});
  if(FES.length)mkInst(new THREE.BoxGeometry(1,1,1),feM,FES,(o,a)=>{o.position.set(a.p[0],a.p[1],a.p[2]);
   if(a.ax==='x'){o.rotation.z=a.up*a.ang;o.scale.set(a.len,.07,.7);}else{o.rotation.x=-a.up*a.ang;o.scale.set(.7,.07,a.len);}});

  // ---- a few real point lights follow the player so window light really falls on the street and walls ----
  const NL=('ontouchstart' in window)?3:4,PLS=[];
  for(let i=0;i<NL;i++){const l=new THREE.PointLight(0xffc27a,0,17,2);l.position.set(0,-80,0);l.userData.on=0;scene.add(l);PLS.push(l);}
  function selLights(){const cx=cam.position.x,cy=cam.position.y,cz=cam.position.z,cand=[];
   for(const w of LIT){const dx=w.x-cx,dy=w.y-cy,dz=w.z-cz,dd=dx*dx+dy*dy*.5+dz*dz;if(dd<1600)cand.push([dd,w]);}
   cand.sort((a,c)=>a[0]-c[0]);const ch=[];
   for(const q of cand){const w=q[1];if(ch.every(c=>Math.hypot(c.x-w.x,c.y-w.y,c.z-w.z)>6)){ch.push(w);if(ch.length>=NL)break;}}
   PLS.forEach((l,i)=>{const w=ch[i];if(w){l.position.set(w.x+w.nx*1.8,w.y,w.z+w.nz*1.8);l.color.setRGB(w.c[0],w.c[1],w.c[2]);l.userData.on=1;}else l.userData.on=0;});}

  // ---- night tick ----
  const _hn=hudTick;let _lt=0,insF=0,chk=0,nightT=0;
  hudTick=function(n){_hn(n);try{
   const k=(typeof nf==='number')?nf:0,e=Math.min(1,Math.max(0,k-.1)*1.5);
   roomM.uniforms.uN.value=e;roomM.uniforms.uT.value=n/1000;
   if(roomIM)roomIM.visible=e>.01;
   haloM.opacity=e*.5;if(haloIM)haloIM.visible=e>.01;
   lampM.color.setRGB(.16+.84*e,.14+.7*e,.11+.45*e);
   let inside=0;for(const b of tgt){if(b.k==='b'&&Math.abs(p.x-b.x)<b.w/2&&Math.abs(p.z-b.z)<b.d/2&&p.y<b.y0+b.h+2){inside=1;break;}}
   insF+=(inside-insF)*.08;
   // from outside only the lit rooms glow; unlit windows stay dark. Inside, rooms stay bright enough to walk around.
   const ek=.16+.34*insF;if(window.INTM)INTM.forEach(m=>{m.emissiveIntensity=e*ek;});
   if(window.ILMAT)ILMAT.color.setRGB(1-.72*e*(1-insF),.97-.7*e*(1-insF),.86-.6*e*(1-insF));
   if(n-_lt>450){_lt=n;if(e>.02)selLights();}
   PLS.forEach(l=>{const t=(e>.02?l.userData.on:0)*e*1.7;l.intensity+=(t-l.intensity)*.2;});
   if(e>.6)nightT+=1;
   if(nightT===240&&!chk){chk=1;const pr=(ren.info&&ren.info.programs)||[];
    for(const q of pr){if(q.diagnostics&&q.diagnostics.runnable===false){const lg=(q.diagnostics.fragmentShader&&q.diagnostics.fragmentShader.log)||(q.diagnostics.vertexShader&&q.diagnostics.vertexShader.log)||q.diagnostics.programLog||'';softErr('Window-room shader error: '+String(lg).slice(0,300));}}}
  }catch(x){}};
  window.NYNIGHT=[ROOM.length,HALL.length,FEB.length,FES.length];
  setTimeout(()=>{try{toast('v11: '+ROOM.length+' lit rooms, '+FEB.length+' fire-escape parts');}catch(e){}},5200);
 }catch(err){console.error('v11 night windows failed',err);setTimeout(()=>{try{toast('v11 night windows ERROR: '+err.message);}catch(e){}},4500);}
 // ---- real, physical entrance doors: frames on every building, hinged hand-opened doors on small ones ----
 try{
 const DM={frame:new THREE.MeshStandardMaterial({color:0x2b3136,roughness:.5,metalness:.5}),metal:new THREE.MeshStandardMaterial({color:0xcfd3d6,roughness:.25,metalness:.85}),
  glass:new THREE.MeshStandardMaterial({color:0x6a8fa0,roughness:.05,metalness:.2,transparent:true,opacity:.35,depthWrite:false}),wood:new THREE.MeshStandardMaterial({color:0x4a2f1c,roughness:.65,metalness:0})};
 const bxm=(m,w,h,d,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;return o;};
 window.NYMAN=[];
 window.NYDoors=function(){
  tgt.forEach(b=>{const d=DOORS[CD.bld.indexOf(b)];if(!d)return;const g=d.pl.parent,dw=b.dw,H=2.8;
   g.add(bxm(DM.frame,.14,H+.16,.65,-(dw/2+.07),(H+.16)/2,.075),bxm(DM.frame,.14,H+.16,.65,dw/2+.07,(H+.16)/2,.075),bxm(DM.frame,dw+.28,.16,.65,0,H+.08,.075),bxm(DM.metal,dw+.28,.04,.7,0,.02,.075));
   if(b.esc===0&&b.k==='b'){
    d.manual=true;d.want=0;d.pl.visible=false;d.pr.visible=false;
    const leaves=[-1,1].map(s=>{const lg=new THREE.Group(),w=dw/2-.02,e=-s;lg.position.set(s*dw/2,0,0);
     lg.add(bxm(DM.wood,.09,H-.05,.07,e*.045,(H-.05)/2,0),bxm(DM.wood,.09,H-.05,.07,e*(w-.045),(H-.05)/2,0),bxm(DM.wood,w,.14,.07,e*w/2,H-.12,0),bxm(DM.wood,w,.4,.07,e*w/2,.25,0),bxm(DM.glass,w-.18,H-.8,.03,e*w/2,.5+(H-.8)/2,0));
     for(const zz of[-.08,.08]){const h=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.7,10),DM.metal);h.position.set(e*(w-.16),1.05,zz);lg.add(h);}
     g.add(lg);return lg;});
    const ax=Math.abs(b.fx)>.5,cb={a:ax?d.x-.14:d.x-dw/2,b:ax?d.x+.14:d.x+dw/2,c:d.y,d:d.y+H,e:ax?d.z-dw/2:d.z-.14,f:ax?d.z+dw/2:d.z+.14,off:false};boxes.push(cb);
    d.swing=o=>{leaves[0].rotation.y=1.75*o;leaves[1].rotation.y=-1.75*o;cb.off=o>.45;};
    window.NYMAN.push(d);}});};
 const hint=document.createElement('div');hint.style.cssText='position:fixed;left:50%;bottom:110px;transform:translateX(-50%);padding:8px 16px;border-radius:8px;background:rgba(8,12,18,.78);color:#fff;font:600 14px system-ui,sans-serif;letter-spacing:.06em;display:none;pointer-events:none;z-index:50';document.body.appendChild(hint);
 const nearDoor=()=>{if(inCar)return null;let best=null,bd=3;for(const d of window.NYMAN){const dd=Math.hypot(p.x-d.x,p.z-d.z);if(dd<bd&&Math.abs(p.y-d.y)<2.5){bd=dd;best=d;}}return best;};
 window.NYDoorTick=function(){const d=locked?nearDoor():null;if(d){hint.textContent=d.want?'E  -  CLOSE DOOR':'E  -  OPEN DOOR';hint.style.display='block';}else hint.style.display='none';};
 const tog=()=>{const d=nearDoor();if(d)d.want=d.want?0:1;};
 addEventListener('keydown',e=>{if(e.code==='KeyE'&&!e.repeat&&locked)tog();});
 const bt=document.createElement('button');bt.className='tb';bt.textContent='DOOR';bt.style.cssText='right:256px;bottom:292px';bt.addEventListener('touchstart',e=>{e.preventDefault();tog();},{passive:false});
 const tcc=document.getElementById('tc');if(tcc)tcc.appendChild(bt);
 }catch(err){console.error('NY doors failed',err);}
}

const DYN=[],GRID=new Map(),GC=16;let gridReady=false;
function gridAdd(b){for(let i=Math.floor(b.a/GC);i<=Math.floor(b.b/GC);i++)for(let j=Math.floor(b.e/GC);j<=Math.floor(b.f/GC);j++){const k=i+','+j;let l=GRID.get(k);if(!l)GRID.set(k,l=[]);l.push(b);}}
function hitB(b,x,y,z,r,hg){return !b.off&&x+r>b.a&&x-r<b.b&&y+hg>b.c&&y<b.d&&z+r>b.e&&z-r<b.f;}
function hit(x,y,z,r,hg){
 for(const b of DYN)if(hitB(b,x,y,z,r,hg))return b;
 if(!gridReady){for(const b of boxes)if(hitB(b,x,y,z,r,hg))return b;return null;}
 const i0=Math.floor((x-r)/GC),i1=Math.floor((x+r)/GC),j0=Math.floor((z-r)/GC),j1=Math.floor((z+r)/GC);
 for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const l=GRID.get(i+','+j);if(!l)continue;for(const b of l)if(hitB(b,x,y,z,r,hg))return b;}
 return null;}

/* ===== Real car models (converted from the uploaded GLB files, simplified for the web) ===== */
const CARGEO={};
const PAL=[0xf2f2ee,0xe4dfd2,0xb3b8bd,0x3a3d42,0x0c0c0e,0xa01018,0x5a0f18,0x1d3f9a,0x0c1a3c,0x1c5a34,0xe0b020,0xd9541a,0x6a6e74,0xcbb58f,0x7a5a3a],PALN=['White','Pearl','Silver','Graphite','Black','Red','Burgundy','Blue','Navy','Green','Yellow','Orange','Grey','Beige','Bronze'];
function pickColor(){return PAL[(Math.random()*PAL.length)|0];}
{const fl=new THREE.DirectionalLight(0xdce8ff,.5);fl.position.set(-140,90,-100);scene.add(fl);scene.add(new THREE.AmbientLight(0xffffff,.16));}
function makeCubeEnv(){const mk=f=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
  if(f==='py'){x.fillStyle='#5f9fe6';x.fillRect(0,0,128,128);const r=x.createRadialGradient(80,48,2,80,48,60);r.addColorStop(0,'rgba(255,244,214,1)');r.addColorStop(1,'rgba(255,244,214,0)');x.fillStyle=r;x.fillRect(0,0,128,128);}
  else if(f==='ny'){x.fillStyle='#4a4d52';x.fillRect(0,0,128,128);}
  else{const gr=x.createLinearGradient(0,0,0,128);gr.addColorStop(0,'#5f9fe6');gr.addColorStop(.5,'#e2ebf3');gr.addColorStop(.52,'#6a6d70');gr.addColorStop(1,'#404348');x.fillStyle=gr;x.fillRect(0,0,128,128);}
  return c;};
 const t=new THREE.CubeTexture([mk('px'),mk('nx'),mk('py'),mk('ny'),mk('pz'),mk('nz')]);t.encoding=THREE.sRGBEncoding;t.needsUpdate=true;return t;}
function carMatFor(m){const col=new THREE.Color(m.c[0],m.c[1],m.c[2]),rg=(m.r==null?.5:m.r),mt=(m.m==null?0:m.m);
  if(m.k==='basic')return new THREE.MeshBasicMaterial({color:col});
  if(m.k==='paint'){const x=new THREE.MeshPhysicalMaterial({color:col,metalness:Math.min(.65,Math.max(.25,mt)),roughness:Math.max(.18,rg*.75),clearcoat:1,clearcoatRoughness:.06});x.userData.envK=1.5;return x;}
  if(m.k==='glass'){const x=new THREE.MeshPhysicalMaterial({color:new THREE.Color(.015,.025,.035),metalness:.1,roughness:.04,transparent:true,opacity:.62,depthWrite:false});x.userData.envK=2.2;return x;}
  const x=new THREE.MeshStandardMaterial({color:col,metalness:Math.min(1,mt),roughness:Math.max(.12,rg)});x.userData.envK=1;return x;}
// bodies that were modelled facing the wrong way (their nose pointed at the back of the car): turned 180 degrees so they drive nose-first. Remove a name to undo it.
const TURN={countach:1,silver:1};
function carGeoFrom(buf,part,turn){const q=new Int16Array(buf,part.p,part.n*3),P=new Float32Array(part.n*3),k=3/32767;for(let i=0;i<q.length;i++)P[i]=q[i]*k;
 if(turn)for(let i=0;i<P.length;i+=3){P[i]=-P[i];P[i+2]=-P[i+2];}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setIndex(new THREE.BufferAttribute(new Uint16Array(buf,part.i,part.ni),1));g.computeVertexNormals();return g;}
function carImport(type){if(CARGEO[type])return CARGEO[type];const d=CARDATA[type],u=fflate.unzlibSync(b64a(d.bin,Uint8Array)),buf=u.buffer.slice(u.byteOffset,u.byteOffset+u.byteLength);
 const o={d,mats:d.mats.map(carMatFor),body:d.body.map(b=>({g:carGeoFrom(buf,b,TURN[type]),m:b.m})),wheels:d.wheels.map(w=>({c:w.c,r:w.r,f:w.f,parts:w.parts.map(p=>({g:carGeoFrom(buf,p),m:p.m}))}))};CARGEO[type]=o;return o;}
/* ===== CarFX: realistic vehicle module =====
   - tyre-model physics (slip angles, friction circle, load transfer, aero, auto gearbox, handbrake slides)
   - sprung body: dive / squat / roll / heave with damped springs, engine vibration, impact jolts
   - doors cut out of the body mesh at load time and hinged (swing doors, scissor doors on Lamborghinis)
   - procedural interior: seats, dash, working steering wheel, pedals, live gauge cluster, mirror
   - wheels: Ackermann steering, spin under power, locked rear wheels on handbrake, glowing brake discs
   - v2 upgrade: drilled/slotted discs + fade, brake pedal ramp + rear brake bias shift, per-car spring/damper tuning,
     visible coil-over struts, camber + per-wheel bump, counter-steer assist, tail/brake/reverse lamps + headlight glow */
const CarFX=(()=>{
const G=9.81,RED=7500,IDLE=900,CL=(x,a,b)=>Math.max(a,Math.min(b,x));
// m kg, P kW, cda drag area, cl downforce area, mu grip, rd rear drive share, wf front weight share, h CoG height, roll deg per g, kp pitch rad per m/s2, top m/s
const TY={
 ds:{m:1650,P:260,cda:.62,cl:.1,mu:1.05,rd:1,wf:.5,h:.52,roll:3.2,kp:.0045,top:62,seat:0x1d2a30},
 silver:{m:1500,P:400,cda:.58,cl:.15,mu:1.1,rd:1,wf:.5,h:.45,roll:2.2,kp:.0036,top:80,seat:0x2a1c14},
 g63b:{m:2500,P:430,cda:1.05,cl:.05,mu:.95,rd:.4,wf:.53,h:.9,roll:6.5,kp:.0070,top:58,seat:0x2b2118,rear:1},
 g63a:{m:2500,P:430,cda:1.05,cl:.05,mu:.95,rd:.4,wf:.53,h:.9,roll:6.5,kp:.0070,top:58,seat:0x151515,rear:1},
 cla:{m:1700,P:310,cda:.65,cl:.1,mu:1.05,rd:.35,wf:.58,h:.55,roll:4,kp:.0050,top:70,seat:0x181818,rear:1},
 countach:{m:1600,P:588,cda:.6,cl:.45,mu:1.25,rd:.3,wf:.42,h:.45,roll:1.8,kp:.0030,top:84,seat:0x6d1313,sc:1},
 centenario:{m:1600,P:566,cda:.62,cl:.7,mu:1.3,rd:.3,wf:.42,h:.44,roll:1.6,kp:.0028,top:86,seat:0x141416,sc:1}
};
const lm=(c,r=.55,m=.05)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
// ---- per-car tuning for the realism upgrade: f spring freq (Hz-ish), z damping ratio, cm camber (rad); lamp heights/widths as body fractions
const SU={ds:{f:1.3,z:.42,cm:.012},silver:{f:1.45,z:.45,cm:.02},g63b:{f:1.05,z:.34,cm:.004},g63a:{f:1.05,z:.34,cm:.004},cla:{f:1.4,z:.42,cm:.015},countach:{f:1.8,z:.5,cm:.035},centenario:{f:1.9,z:.5,cm:.04}};
const LP={ds:{y:.5,x:.7,fy:.36,fx:.68},silver:{y:.5,x:.7,fy:.34,fx:.68},g63b:{y:.68,x:.8,fy:.5,fx:.78},g63a:{y:.68,x:.8,fy:.5,fx:.78},cla:{y:.6,x:.72,fy:.38,fx:.7},countach:{y:.52,x:.62,fy:.32,fx:.66},centenario:{y:.48,x:.62,fy:.3,fx:.66}};
const SPC={countach:0xffc400,centenario:0xffc400,g63b:0x2a6fd0,g63a:0x2a6fd0,silver:0xc8ccd2};
const NF=()=>{try{return typeof nf==='number'?nf:0;}catch(e){return 0;}};
let _gt=null,_dt=null;
function glowTex(){if(_gt)return _gt;const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,2,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.35,'rgba(255,255,255,.45)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);_gt=new THREE.CanvasTexture(c);return _gt;}
// drilled + slotted brake disc face (centre hat, cooling slots, two rings of holes)
function discTex(){if(_dt)return _dt;const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle='#7d8187';x.fillRect(0,0,128,128);
 x.fillStyle='#4a4d52';x.beginPath();x.arc(64,64,26,0,6.283);x.fill();
 x.strokeStyle='rgba(20,20,22,.55)';x.lineWidth=1.2;for(let i=0;i<24;i++){const a=i*Math.PI/12;x.beginPath();x.moveTo(64+Math.cos(a)*34,64+Math.sin(a)*34);x.lineTo(64+Math.cos(a+.25)*62,64+Math.sin(a+.25)*62);x.stroke();}
 x.fillStyle='#17181a';for(let r=0;r<2;r++)for(let i=0;i<18;i++){const a=i*Math.PI/9+r*.17,rr=r?55:43;x.beginPath();x.arc(64+Math.cos(a)*rr,64+Math.sin(a)*rr,2.8,0,6.283);x.fill();}
 _dt=new THREE.CanvasTexture(c);_dt.anisotropy=4;return _dt;}
// furthest body vertex (front: min z, rear: max z) near height y and away from the centre line, so lamps sit on the real bodywork
function extentZ(o,y,hw,front){let b=front?9:-9,f=0;o.body.forEach(pt=>{const P=pt.g.attributes.position.array;for(let i=0;i<P.length;i+=3){const x=Math.abs(P[i]);if(x>hw*.4&&x<hw*.99&&Math.abs(P[i+1]-y)<.16){const z=P[i+2];if(front?z<b:z>b)b=z;f=1;}}});return f?b:(front?-o.d.L/2:o.d.L/2);}
function mkLamp(par,gt,sx,ty,zr,hx,hy,zf,rx){const L=par,tmx=new THREE.MeshBasicMaterial({color:0x2a0505}),t=new THREE.Mesh(new THREE.BoxGeometry(.3,.07,.03),tmx);t.position.set(sx*hx,ty,zr+.012);L.br.add(t);L.tm.push(tmx);
 const gm=new THREE.MeshBasicMaterial({map:gt,color:0xff2a18,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}),g=new THREE.Mesh(new THREE.PlaneGeometry(.75,.45),gm);g.position.set(sx*hx,ty,zr+.04);L.br.add(g);L.gl.push(gm);
 const rmx=new THREE.MeshBasicMaterial({color:0x333333}),r=new THREE.Mesh(new THREE.BoxGeometry(.12,.05,.03),rmx);r.position.set(sx*rx,ty-.02,zr+.012);L.br.add(r);L.rm.push(rmx);
 const hm=new THREE.MeshBasicMaterial({map:gt,color:0xfff0cc,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}),h=new THREE.Mesh(new THREE.PlaneGeometry(.8,.5),hm);h.position.set(sx*L.fx,hy,zf-.04);h.rotation.y=Math.PI;L.br.add(h);L.hg.push(hm);}
function lamps(br,o,d,type){const lp=LP[type]||LP.ds,hw=d.w/2,ty=d.h*lp.y,fy=d.h*lp.fy,zr=extentZ(o,ty,hw,0),zf=extentZ(o,fy,hw,1),gt=glowTex();
 const L={br,tm:[],gl:[],rm:[],hg:[],bl:0,rv:0,hx:hw*lp.fx,fx:hw*lp.fx,hy:fy,hz:zf};
 [-1,1].forEach(s=>mkLamp(L,gt,s,ty,zr,hw*lp.x,fy,zf,hw*(lp.x-.24)));return L;}
function molLamps(h,bb){const w=bb.max.x-bb.min.x,ty=bb.min.y+(bb.max.y-bb.min.y)*.45,L={br:h,tm:[],gl:[],rm:[],hg:[],bl:0,rv:0,fx:w*.3},gt=glowTex();
 const tmx=new THREE.MeshBasicMaterial({color:0x2a0505}),bar=new THREE.Mesh(new THREE.BoxGeometry(w*.62,.05,.03),tmx);bar.position.set(0,ty,bb.max.z+.012);h.add(bar);L.tm.push(tmx);
 [-1,1].forEach(s=>{const gm=new THREE.MeshBasicMaterial({map:gt,color:0xff2a18,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}),g=new THREE.Mesh(new THREE.PlaneGeometry(.9,.5),gm);g.position.set(s*w*.24,ty,bb.max.z+.04);h.add(g);L.gl.push(gm);
  const rmx=new THREE.MeshBasicMaterial({color:0x333333}),r=new THREE.Mesh(new THREE.BoxGeometry(.12,.05,.03),rmx);r.position.set(s*w*.1,ty-.07,bb.max.z+.012);h.add(r);L.rm.push(rmx);
  const hm=new THREE.MeshBasicMaterial({map:gt,color:0xfff0cc,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}),q=new THREE.Mesh(new THREE.PlaneGeometry(.8,.5),hm);q.position.set(s*L.fx,ty,bb.min.z-.04);q.rotation.y=Math.PI;h.add(q);L.hg.push(hm);});return L;}
// brake lights ramp up fast, tail lights glow at night only while driven, reverse lamps when backing up
function lampTick(L,dt,brake,rev,on){if(!L)return;const n=on?Math.min(1,Math.max(0,NF()-.12)*3.4):0;
 L.bl+=((brake?1:0)-L.bl)*Math.min(1,dt*18);L.rv+=((rev?1:0)-L.rv)*Math.min(1,dt*18);const lv=Math.max(L.bl,.38*n);
 L.tm.forEach(m=>m.color.setRGB(.16+.84*lv,.02+.07*L.bl,.02+.06*L.bl));L.gl.forEach(m=>{m.opacity=L.bl*.85+.32*n*(1-L.bl);});
 L.rm.forEach(m=>{const v=.2+.8*L.rv;m.color.setRGB(v,v,v*.98);});L.hg.forEach(m=>{m.opacity=.7*n;});}
const _a=new THREE.Vector3(),_b=new THREE.Vector3(),UPV=new THREE.Vector3(0,1,0);
function wbOf(d){const av=a=>a.reduce((s,w)=>s+w.c[2],0)/a.length,f=d.wheels.filter(w=>w.f),r=d.wheels.filter(w=>!w.f);return{zf:av(f),zr:av(r),r:f[0].r,tw:2*Math.abs(f[0].c[0])};}

// cut the door region out of every body part (once per car type, cached on o.fx)
function split(o){const d=o.d,W=wbOf(d),hw=d.w/2,y1=d.h*.94;let z0=W.zf+W.r+.1,z1=W.zf+(W.zr-W.zf)*.66;
 const cut=xm=>{const doors=[{s:-1,items:[]},{s:1,items:[]}],body=[];let n=0;
 o.body.forEach(pt=>{const g=pt.g,P=g.attributes.position.array,I=g.index.array,keep=[],dI=[[],[]];
  for(let i=0;i<I.length;i+=3){const a=I[i]*3,b=I[i+1]*3,c=I[i+2]*3,x=(P[a]+P[b]+P[c])/3,y=(P[a+1]+P[b+1]+P[c+1])/3,z=(P[a+2]+P[b+2]+P[c+2])/3;
   const hit=Math.abs(x)>xm&&y>.3&&y<y1&&z>z0&&z<z1;if(hit)n++;(hit?dI[x<0?0:1]:keep).push(I[i],I[i+1],I[i+2]);}
  const mk=ix=>{const q=new THREE.BufferGeometry();q.setAttribute('position',g.attributes.position);q.setAttribute('normal',g.attributes.normal);q.setIndex(new THREE.BufferAttribute(new Uint16Array(ix),1));return q;};
  body.push({g:mk(keep),m:pt.m});dI.forEach((ix,k)=>{if(ix.length)doors[k].items.push({g:mk(ix),m:pt.m});});});
 return{body,doors,n};};
 let r=cut(hw-.3);
 if(r.n<40){const e=d.eye[2];z0=e-.75;z1=e+.45;r=cut(hw*.5);}   // models whose wheel data does not line up with the body
 return{body:r.body,doors:r.doors,W,z0};}

function interior(br,d,T,fx){const [ex,ey,ez]=d.eye,hw=d.w/2,dk=lm(0x17181a,.7),lt=lm(T.seat,.5),tr=lm(0x26282b,.6),bx=(w,h,dp,m,x,y,z,p=br)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,dp),m);o.position.set(x,y,z);p.add(o);return o;};
 const st=Math.max(.2,ey-.56),fl=Math.max(.16,st-.26);
 bx(d.w*.74,.04,d.L*.5,dk,0,fl,ez);                                   // floor
 [-1,1].forEach(s=>{bx(.05,Math.max(.2,ey-.3-fl),1.1,tr,s*(hw-.2),fl+(ey-.3-fl)/2,ez-.2);});   // door cards
 bx(.5,.3,d.L*.42,dk,0,fl+.14,ez);                                    // centre tunnel
 [-.4,.4].forEach(x=>{const sb=bx(.5,.12,.55,lt,x,st,ez+.22),sk=bx(.5,.62,.12,lt,x,st+.33,ez+.5);sk.rotation.x=.22;bx(.26,.17,.09,lt,x,st+.7,ez+.55).rotation.x=.22;bx(.03,.5,.4,dk,x+(x<0?-.26:.26),st-.05,ez+.22);}); // seats+cushion rails
 if(T.rear){bx(1.3,.12,.5,lt,0,st,ez+1.05);const k=bx(1.3,.6,.12,lt,0,st+.32,ez+1.34);k.rotation.x=.18;}
 bx(d.w*.8,.2,.42,tr,0,ey-.34,ez-.64);bx(d.w*.8,.05,.5,dk,0,ey-.23,ez-.66);   // dash + cowl
 bx(.6,.2,.12,dk,-.4,ey-.28,ez-.5);                                   // binnacle hood
 const cv=document.createElement('canvas');cv.width=256;cv.height=100;fx.cx=cv.getContext('2d');fx.tx=new THREE.CanvasTexture(cv);
 const gm=new THREE.Mesh(new THREE.PlaneGeometry(.5,.195),new THREE.MeshBasicMaterial({map:fx.tx}));gm.position.set(-.4,ey-.31,ez-.435);br.add(gm);
 bx(.22,.07,.03,dk,0,ey+.26,ez-.55);                                  // rear-view mirror
 const sw=new THREE.Group();sw.position.set(-.4,ey-.3,ez-.3);sw.rotation.x=-.45;br.add(sw);
 const hub=new THREE.Group();sw.add(hub);hub.add(new THREE.Mesh(new THREE.TorusGeometry(.17,.019,10,32),dk));
 for(let i=0;i<3;i++){const sp=bx(.15,.03,.02,dk,0,0,0,hub);sp.rotation.z=i*Math.PI*2/3;sp.position.set(Math.cos(i*Math.PI*2/3)*.085,Math.sin(i*Math.PI*2/3)*.085,0);}
 const hb=new THREE.Mesh(new THREE.CylinderGeometry(.045,.05,.035,14),lm(0x2a2c30,.4,.6));hb.rotation.x=Math.PI/2;hub.add(hb);fx.sw=hub;
 fx.pd=[-.5,-.32,-.14].map((x,i)=>{const p=bx(.07,.012,.1,lm(0x8a8d92,.3,.8),-.4+x*.25+.0,fl+.09,ez-.46+0);p.userData.z0=p.position.z;return p;});
 const gs=new THREE.Mesh(new THREE.CylinderGeometry(.012,.014,.16,8),dk);gs.position.set(0,fl+.4,ez+.05);br.add(gs);
 const kn=new THREE.Mesh(new THREE.SphereGeometry(.03,10,8),lm(0x303236,.4,.4));kn.position.set(0,fl+.49,ez+.05);br.add(kn);}

function build(o,mats,type){const d=o.d,T=TY[type]||TY.ds;o.fx=o.fx||split(o);const S=o.fx,W=S.W,hw=d.w/2,g=new THREE.Group(),br=new THREE.Group();g.add(br);
 const fx={T,W,L:W.zr-W.zf,br,g:0,sh:0,rpm:IDLE,dl:0,ax:0,ay:0,vl:0,om:0,thr:0,p:0,pv:0,r:0,rv:0,hz:0,hvv:0,spR:0,spF:0,gt:0,heat:[0,0,0,0],bp:0,hm:0,odo:0,ab:0,su:SU[type]||SU.ds};
 fx.b=fx.L*T.wf;fx.a=fx.L-fx.b;fx.Iz=T.m*fx.L*fx.L*.28;
 S.body.forEach(b=>{const m=new THREE.Mesh(b.g,mats[b.m]);m.castShadow=true;br.add(m);});
 interior(br,d,T,fx);
 fx.doors=S.doors.map(dr=>{const hx=dr.s*(hw-(T.sc?.35:.08)),hy=T.sc?d.h*.7:d.h*.5,hz=S.z0+(T.sc?.12:0),pv=new THREE.Group();pv.position.set(hx,hy,hz);
  dr.items.forEach(it=>{const dm=mats[it.m].clone();dm.side=THREE.DoubleSide;const m=new THREE.Mesh(it.g,dm);m.position.set(-hx,-hy,-hz);m.castShadow=true;pv.add(m);});
  br.add(pv);return{pv,s:dr.s,a:0,av:0,t:0,hold:0,hx};});
 const ws=o.wheels.map(w=>{const st=new THREE.Group();st.position.set(w.c[0],w.c[1],w.c[2]);const roll=new THREE.Group();st.add(roll);
  w.parts.forEach(p=>{const m=new THREE.Mesh(p.g,mats[p.m]);m.castShadow=true;roll.add(m);});
  let mnx=9,mxx=-9;w.parts.forEach(p=>{const A=p.g.attributes.position.array;for(let i=0;i<A.length;i+=3){mnx=Math.min(mnx,A[i]);mxx=Math.max(mxx,A[i]);}});
  const sx=w.c[0]<0?1:-1,inE=sx>0?mxx:-mnx,dx=sx*Math.max(.05,inE*.5),dm=new THREE.MeshStandardMaterial({color:0xd6d9de,map:discTex(),metalness:.85,roughness:.45,emissive:0xff4a10,emissiveIntensity:0}),
   ds=new THREE.Mesh(new THREE.CylinderGeometry(w.r*.5,w.r*.5,.032,32),dm);ds.rotation.z=Math.PI/2;ds.position.x=dx;roll.add(ds);
  const hat=new THREE.Mesh(new THREE.CylinderGeometry(w.r*.2,w.r*.2,.055,16),lm(0x2a2c30,.5,.6));hat.rotation.z=Math.PI/2;hat.position.x=dx;roll.add(hat);
  const cal=new THREE.Mesh(new THREE.BoxGeometry(.06,w.r*.4,w.r*.25),lm(w.f?0xb01010:0x222428,.45,.3));cal.position.set(dx,0,w.r*.42);st.add(cal);
  g.add(st);return{roll,steer:st,front:w.f,r:w.r,x:w.c[0],y0:w.c[1],z:w.c[2],cm:(w.c[0]<0?-1:1)*fx.su.cm,bu:0,dm};});
 // visible coil-over struts: damper tube + rod + coil spring, from the wheel hub up into the body (follow body roll/pitch)
 fx.st=ws.map(w=>{const grp=new THREE.Group(),tube=new THREE.Mesh(new THREE.CylinderGeometry(.034,.034,1,10),lm(0x1a1b1e,.4,.7)),rod=new THREE.Mesh(new THREE.CylinderGeometry(.016,.016,1,8),lm(0xd5d8dc,.2,.9)),sp=lm(SPC[type]||0xd02020,.4,.4),rings=[];
  tube.geometry.translate(0,.5,0);rod.geometry.translate(0,.5,0);grp.add(tube,rod);
  for(let i=0;i<7;i++){const q=new THREE.Mesh(new THREE.TorusGeometry(.055,.011,6,14),sp);q.rotation.x=Math.PI/2;grp.add(q);rings.push(q);}
  g.add(grp);return{grp,tube,rod,rings,ax:w.x*.78,ay:w.y0+w.r*1.05,az:w.z};});
 fx.lamps=lamps(br,o,d,type);fx.hlx=fx.lamps.hx;fx.hly=fx.lamps.hy;fx.hlz=fx.lamps.hz;
 g.userData={paint:null,wheels:ws,eye:d.eye,fx};fx.ws=ws;return g;}

// one physics sub-step (bicycle model with load transfer + friction circle)
function sub(c,fx,h,I){const T=fx.T,m=T.m;let u=c.speed;const au=Math.abs(u);
 const lim=.55/(1+(au/16)*(au/16))+.045,tg=CL(I.st*lim+(au>6&&!I.hb?Math.sign(fx.vl)*Math.max(0,Math.abs(fx.vl)/Math.max(au,4)-.12)*.9*CL((au-6)/6,0,1)*(1-Math.abs(I.st)*.7):0),-lim,lim),rt=(tg*fx.dl<0||Math.abs(tg)<Math.abs(fx.dl))?4.5:2.6;fx.dl+=CL(tg-fx.dl,-rt*h,rt*h);
 let brk=0,rev=0,thr=I.thr;if(I.brk){if(u>.8)brk=1;else rev=1;}if(I.thr&&u<-.8){brk=1;thr=0;}
 if(I.park){brk=Math.max(brk,.5);thr=0;rev=0;}
 fx.thr+=(thr-fx.thr)*Math.min(1,h*8);fx.bp+=(brk-fx.bp)*Math.min(1,h*9);   // brake pedal ramps up instead of instant full force
 const tp=[.15,.26,.39,.53,.68,.84,1].map(x=>x*T.top);
 let want=0;while(want<6&&au>tp[want]*.93)want++;
 if(fx.sh>0)fx.sh-=h;else if(u>.5){if(want>fx.g){fx.g++;fx.sh=.26;fx.hvv-=.05;fx.pv-=.04;}else if(fx.g>0&&au<tp[fx.g-1]*.8)fx.g--;}else if(u<.5)fx.g=Math.min(fx.g,au<tp[0]*.5?0:fx.g);
 let rp=IDLE+(RED-IDLE)*CL(au/tp[fx.g],0,1.04);if(au<tp[0]*.45)rp=Math.max(rp,IDLE+(fx.thr+rev)*3600);if(fx.sh>0)rp*=.8;
 fx.rpm+=(rp-fx.rpm)*Math.min(1,h*12);c.rpm=fx.rpm;c.gear=fx.g;
 const pc=CL(1-Math.pow((fx.rpm/RED-.72)/.8,2),.3,1);
 let Fe=fx.sh>0?0:fx.thr*T.P*850*pc/Math.max(au,4)*CL((T.top-au)/5,0,1);
 if(rev)Fe=-Math.min(T.P*200/Math.max(au,3),m*G*.35)*(au<12?1:0);
 const L=fx.L,a=fx.a,b=fx.b,ax=fx.ax,df=.6*T.cl*u*u;
 let Nf=Math.max(m*G*b/L-m*ax*T.h/L+df*.4,m*G*.08),Nr=Math.max(m*G*a/L+m*ax*T.h/L+df*.6,m*G*.08);
 const muF=T.mu,muR=T.mu*(I.hb?.45:1),s=au<.25?0:Math.sign(u);
 let Fb=fx.bp*T.mu*m*G*.98*(1-.22*fx.hm),Fbf=Math.min(Fb*.65,muF*Nf*.98),Fbr=Math.min(Math.max(Fb*.35,Fb-Fbf),muR*Nr*.98);   // hot discs fade; rear brakes take over what the front tyres cannot useif(I.hb)Fbr+=.5*T.mu*Nr;
 const dr=Fe*T.rd,df_=Fe*(1-T.rd),cr=muR*Nr,cf=muF*Nf;
 fx.spR=CL(Math.abs(dr)/cr-1,0,1.5)*(fx.thr>.2||rev?1:0);fx.spF=CL(Math.abs(df_)/cf-1,0,1.5)*(fx.thr>.2||rev?1:0);
 const Fxf=CL(df_,-cf,cf)-s*Fbf,Fxr=CL(dr,-cr,cr)-s*Fbr;
 const Dyf=Math.sqrt(Math.max(0,cf*cf-Fxf*Fxf)),Dyr=Math.sqrt(Math.max(0,cr*cr-Fxr*Fxr)),cd=Math.cos(fx.dl),sd=Math.sin(fx.dl),
  vf=fx.vl+a*fx.om,vr=fx.vl-b*fx.om,af=Math.atan2(vf*cd-u*sd,Math.max(Math.abs(u*cd+vf*sd),3)),ar=Math.atan2(vr,Math.max(au,3)),
  Fyf=-Dyf*Math.sin(1.4*Math.atan(14*af)),Fyr=-Dyr*Math.sin(1.4*Math.atan(14*ar));
 const drag=.5*1.2*T.cda*u*au+.015*m*G*(au<.3?u/.3:Math.sign(u)),eb=(!I.thr&&u>.5?1.2*Math.min(1,au/3)*m:0);
 const du=(Fxf*cd-Fyf*sd+Fxr-drag-eb)/m+fx.vl*fx.om,dv=(Fyf*cd+Fxf*sd+Fyr)/m-u*fx.om,dw=(a*(Fyf*cd+Fxf*sd)-b*Fyr)/fx.Iz-fx.om*.15;
 u+=du*h;fx.vl+=dv*h;fx.om+=dw*h;
 const k=CL((au-1.2)/3,0,1);if(k<1){const q=(1-k)*Math.min(1,h*14);fx.om+=(u*Math.tan(fx.dl)/L-fx.om)*q;fx.vl-=fx.vl*q;}
 if((brk&&au<.25&&!thr)||(I.park&&Math.abs(u)<.6)){u=0;fx.vl*=.5;fx.om*=.5;}
 fx.ax+=(du-fx.vl*fx.om-fx.ax)*Math.min(1,h*9);fx.ay+=(dv+u*fx.om-fx.ay)*Math.min(1,h*9);
 c.yaw+=fx.om*h;const yw=c.yaw,nx=c.x-Math.sin(yw)*u*h-Math.cos(yw)*fx.vl*h,nz=c.z-Math.cos(yw)*u*h+Math.sin(yw)*fx.vl*h;
 c.x=nx;c.z=nz;
 c.speed=u;c.steer=fx.dl;}

function step(c,dt,I,hit){I=Object.assign({thr:0,brk:0,hb:0,st:0},I);const fx=c.g.userData.fx,T=fx.T;dt=Math.min(dt,.05);const n=Math.ceil(dt/.005),h=dt/n,ox=c.x,oz=c.z,oy=c.yaw;for(let i=0;i<n;i++)sub(c,fx,h,I);
 if(hit&&hit(c.x,.1,c.z,1.4,1.2)){const vi=Math.abs(c.speed);c.x=ox;c.z=oz;c.yaw=oy;c.speed*=-.25;fx.vl*=.3;fx.om*=.4;fx.hvv-=Math.min(1,vi*.05);fx.pv+=(Math.random()-.5)*vi*.01;fx.rv+=(Math.random()-.5)*vi*.02;fx.ax=0;}
 const u=c.speed,au=Math.abs(u),g=c.g;
 // sprung body: nose dives when braking, squats when accelerating, leans outward in corners
 const tp=fx.ax*T.kp,tr=-fx.ay*T.roll*Math.PI/180/G,fs=fx.su.f/1.45,wp=2*Math.PI*1.25*fs,wr=2*Math.PI*1.45*fs,wh=2*Math.PI*1.7*fs,z=fx.su.z;
 fx.pv+=((tp-fx.p)*wp*wp-2*z*wp*fx.pv)*dt;fx.p+=fx.pv*dt;fx.rv+=((tr-fx.r)*wr*wr-2*z*wr*fx.rv)*dt;fx.r+=fx.rv*dt;
 fx.hvv+=((-fx.hz)*wh*wh-2*z*wh*fx.hvv)*dt+(Math.random()-.5)*.35*dt*Math.min(1,au/20);fx.hz+=fx.hvv*dt;
 const now=performance.now()/1000,vib=Math.sin(now*fx.rpm/60*Math.PI*2*.5)*.0007*(1.4-Math.min(1,au/12)*.6);
 fx.br.rotation.x=fx.p;fx.br.rotation.z=fx.r;fx.br.position.y=fx.hz+vib;
 // wheels
 const dl=fx.dl,tn=Math.tan(Math.abs(dl)),W=fx.W;
 fx.ws.forEach((w,i)=>{if(w.front){const inner=(w.x<0)===(dl>0)?1:-1,den=fx.L-inner*W.tw/2*tn;w.steer.rotation.y=Math.sign(dl)*Math.atan2(fx.L*tn,Math.max(den,.3));}
  w.bu=Math.max(0,Math.sin(fx.odo*5.3+i*1.9)+.7*Math.sin(fx.odo*13.1+i*3.3)-.35)*.011*CL(au/18,0,1);w.steer.position.y=w.y0+w.bu;w.steer.rotation.z=w.cm;   // road bumps lift each wheel + camber
  const spin=w.front?fx.spF:fx.spR,lock=I.hb&&!w.front;w.sp=(w.sp||0)+(Math.min(spin,.8)-(w.sp||0))*Math.min(1,dt*6);let wv=lock?0:u/w.r+(u<0||I.brk&&au<.8?-1:1)*w.sp*12/w.r,stp=wv*dt,as=Math.abs(stp);
  if(as>.16)stp=Math.sign(stp)*(.16+.03*Math.log(as/.16));   // above ~.22 rad/frame spokes would alias and look like shaking, so ease the visual rate
  w.roll.rotation.x-=stp;
  const hb=(I.brk&&u>.8?1:0)*au*dt*.02+(I.hb&&!w.front?.4*dt:0);fx.heat[i]=CL(fx.heat[i]+hb-fx.heat[i]*dt*.22,0,1);w.dm.emissiveIntensity=fx.heat[i]*1.3;});
 fx.hm=(fx.heat[0]+fx.heat[1]+fx.heat[2]+fx.heat[3])/4;fx.odo+=au*dt;
 {const ab=(fx.ws[0].bu+fx.ws[1].bu+fx.ws[2].bu+fx.ws[3].bu)/4;fx.hvv+=(ab-fx.ab)*1.2;fx.ab=ab;}   // bumps shake the body
 fx.br.updateMatrix();
 fx.st.forEach((s,i)=>{const w=fx.ws[i];_a.set(w.x*.78,w.steer.position.y+w.r*.1,w.z);_b.set(s.ax,s.ay,s.az).applyMatrix4(fx.br.matrix).sub(_a);const len=Math.max(.15,_b.length());
  s.grp.position.copy(_a);s.grp.quaternion.setFromUnitVectors(UPV,_b.normalize());s.tube.scale.y=len*.5;s.rod.scale.y=len*.55;s.rod.position.y=len*.45;
  s.rings.forEach((q,k)=>{q.position.y=len*(.1+.8*k/6);});});
 lampTick(fx.lamps,dt,(I.brk&&u>.8)||(I.thr&&u<-.8)||I.hb,I.drive&&u<-.5,I.drive);
 fx.sw.rotation.z=fx.dl*5;fx.pd[2].position.z=fx.pd[2].userData.z0-fx.thr*.03;fx.pd[1].position.z=fx.pd[1].userData.z0-(I.brk?.04:0);
 // doors (spring-driven so they swing and thud shut)
 fx.doors.forEach(d=>{if(d.hold>0){d.hold-=dt;if(d.hold<=0)d.t=0;}d.av+=((d.t-d.a)*90-d.av*13)*dt;d.a=CL(d.a+d.av*dt,0,1.04);
  if(T.sc){d.pv.rotation.x=-1.05*d.a;d.pv.position.x=d.hx+d.s*.1*d.a;}else d.pv.rotation.y=d.s*1.2*d.a;});
 g.position.set(c.x,0,c.z);g.rotation.y=c.yaw;c.gx=fx.ax/G;c.gy=fx.ay/G;
 if(I.drive){fx.gt-=dt;if(fx.gt<=0){fx.gt=.05;gauge(fx,c);}}}

function gauge(fx,c){const x=fx.cx;x.fillStyle='#070a0e';x.fillRect(0,0,256,100);const rp=CL((c.rpm-IDLE)/(RED-IDLE),0,1);
 x.lineWidth=8;x.strokeStyle='#1d2530';x.beginPath();x.arc(64,56,40,Math.PI*.8,Math.PI*2.2);x.stroke();
 x.strokeStyle=rp>.86?'#ff3b30':'#4fc3ff';x.beginPath();x.arc(64,56,40,Math.PI*.8,Math.PI*.8+rp*Math.PI*1.4);x.stroke();
 x.textAlign='center';x.fillStyle='#e8f2ff';x.font='bold 32px sans-serif';x.fillText(Math.round(Math.abs(c.speed)*3.6),192,56);
 x.font='12px sans-serif';x.fillStyle='#7f93a8';x.fillText('km/h',192,74);x.fillText(Math.round(c.rpm/10)*10+' rpm',64,88);
 x.font='bold 26px sans-serif';x.fillStyle='#ffb020';x.fillText(c.speed<-.5?'R':Math.abs(c.speed)<.5?'N':String(c.gear+1),64,66);fx.tx.needsUpdate=true;}

// door control: open driver (0) or passenger (1) door; hold>0 = auto close after hold seconds
function door(c,i,open,hold){const fx=c.g.userData.fx;if(!fx)return;const d=fx.doors[i];if(!d)return;d.t=open?1:0;d.hold=open?(hold||0):0;}
function toggleDoor(c,i){const fx=c.g.userData.fx;if(fx&&fx.doors[i])door(c,i,fx.doors[i].t<.5);}
return{build,step,door,toggleDoor,TY,lampTick,molLamps};})();

function buildImported(type,col){const o=carImport(type);const mats=o.mats.map((mt,i)=>{if(col&&o.d.mats[i].pt){const c=mt.clone();c.color.setHex(col).convertSRGBToLinear();if(c.emissive)c.emissive.copy(c.color).multiplyScalar(.02);return c;}return mt;});return CarFX.build(o,mats,type);}

/* ===== Molnia hover racer (converted from the uploaded GLB, textures kept) ===== */
function molnGeo(M,pt){const q=b64a(pt.p,Int16Array),P=new Float32Array(q.length),k=M.sc/32767;for(let i=0;i<q.length;i++)P[i]=q[i]*k;
 const u=b64a(pt.u,Uint16Array),UV=new Float32Array(u.length);for(let i=0;i<u.length;i++)UV[i]=u[i]/65535*M.uvs;
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('uv',new THREE.BufferAttribute(UV,2));g.setIndex(new THREE.BufferAttribute(b64a(pt.i,Uint16Array),1));g.computeVertexNormals();return g;}
function buildMolnia(){const M=MOLNIA;
 if(!M.mat){const tl=new THREE.TextureLoader(),tx=(u,s)=>{const t=tl.load(u);t.flipY=false;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;if(s)t.encoding=THREE.sRGBEncoding;return t;};
  M.mat=new THREE.MeshPhongMaterial({map:tx(M.t.base,1),color:new THREE.Color(2.4,2.4,2.4),normalMap:tx(M.t.nrm),emissiveMap:tx(M.t.em,1),emissive:new THREE.Color(1,1,1),emissiveIntensity:1.5,specular:new THREE.Color(.5,.5,.55),shininess:70,side:THREE.DoubleSide});
  M.glassM=new THREE.MeshPhongMaterial({color:new THREE.Color(.05,.1,.14),specular:new THREE.Color(.9,.9,.9),shininess:150,transparent:true,opacity:.5,depthWrite:false,side:THREE.DoubleSide});
  M.gb=molnGeo(M,M.body);M.gg=molnGeo(M,M.glass);M.gb.computeBoundingBox();M.bb=M.gb.boundingBox;}
 const g=new THREE.Group(),h=new THREE.Group();h.position.y=.32;const a=new THREE.Mesh(M.gb,M.mat),b=new THREE.Mesh(M.gg,M.glassM);a.castShadow=true;h.add(a,b);g.add(h);
 g.userData={paint:null,wheels:[],eye:[M.eye[0],M.eye[1]+.32,M.eye[2]],hover:h,lamps:CarFX.molLamps(h,M.bb)};return g;}

// cars (realistic procedural models: sculpted body, clearcoat paint, glass, rims, lights, env reflections)
const cars=[];
const envScene=new THREE.Scene();envScene.add(new THREE.Mesh(new THREE.SphereGeometry(500,24,16),sky.material));
const gp0=new THREE.Mesh(new THREE.CircleGeometry(900,16),new THREE.MeshBasicMaterial({color:0x44484d}));gp0.rotation.x=-Math.PI/2;gp0.position.y=-1;envScene.add(gp0);
let envTex=null;
const CM={
 glass:new THREE.MeshPhongMaterial({color:0x0b1219,specular:0xdddddd,shininess:160,transparent:true,opacity:.6,depthWrite:false}),
 black:new THREE.MeshPhongMaterial({color:0x1a1a1a,specular:0x222222,shininess:30}),
 chrome:new THREE.MeshPhongMaterial({color:0xcfcfcf,specular:0xffffff,shininess:140,emissive:0x1a1a1a}),
 tire:new THREE.MeshPhongMaterial({color:0x1c1c1e,specular:0x111111,shininess:12}),
 head:new THREE.MeshBasicMaterial({color:0xfff4d6}),
 tail:new THREE.MeshBasicMaterial({color:0xff2a2a}),
 plate:new THREE.MeshPhongMaterial({color:0xf2f2f2,shininess:30})
};
function paintMat(c){return new THREE.MeshPhongMaterial({color:c,specular:0x666666,shininess:100,emissive:new THREE.Color(c).multiplyScalar(.1)});}
function extr(pts,w,mat,bev){const sh=new THREE.Shape();sh.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)sh.lineTo(pts[i][0],pts[i][1]);sh.closePath();
 const g=new THREE.ExtrudeGeometry(sh,{depth:w,bevelEnabled:bev>0,bevelThickness:bev,bevelSize:bev,bevelSegments:3});
 g.translate(0,0,-w/2);g.rotateY(Math.PI/2);return new THREE.Mesh(g,mat);}
function bx2(w,h,d,m,x,y,z){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);return o;}
const CT={
 coupe:{len:4.5,w:1.9,low:[[-2.25,.35],[2.25,.35],[2.32,.55],[2.18,.78],[1,.93],[-1.4,.95],[-2.2,.9],[-2.32,.68]],glass:[[1,.93],[.15,1.36],[-.85,1.39],[-1.55,.96]],roof:[[.18,1.34],[-.82,1.37],[-.86,1.43],[.14,1.4]],gw:1.62,rw:1.5,wz:1.4,wr:.34,hl:.78,tl:.85},
 suv:{len:4.7,w:1.95,low:[[-2.35,.45],[2.35,.45],[2.42,.7],[2.38,1.1],[2.1,1.2],[-2.35,1.22],[-2.4,.8]],glass:[[1.15,1.2],[.98,1.84],[-2.28,1.86],[-2.34,1.22]],roof:[[1,1.82],[-2.3,1.84],[-2.3,1.93],[1,1.91]],gw:1.7,rw:1.85,wz:1.55,wr:.42,hl:.95,tl:1},
 danfo:{len:4.5,w:1.9,low:[[-2.2,.4],[2.2,.4],[2.32,.6],[2.3,1.3],[-2.2,1.35],[-2.25,.7]],glass:[[2.1,1.35],[1.97,1.9],[-2.15,1.9],[-2.2,1.35]],roof:[[1.97,1.88],[-2.15,1.88],[-2.15,1.98],[1.95,1.98]],gw:1.75,rw:1.9,wz:1.35,wr:.36,hl:.85,tl:.9}
};
CT.coupe.eye=[-.45,1.18,-.2];CT.suv.eye=[-.5,1.62,-.3];CT.danfo.eye=[-.5,1.62,-1];
function buildCar(type,col){if(type==='molnia')return buildMolnia();if(typeof CARDATA!=='undefined'&&CARDATA[type]&&typeof fflate!=='undefined')return buildImported(type,col||pickColor());const T=CT[type]||CT.suv,g=new THREE.Group(),paint=paintMat(col),hw=T.w/2,ws=[];
 g.add(extr(T.low,T.w,paint,.05),extr(T.glass,T.gw,CM.glass,0),extr(T.roof,T.rw,paint,.02));
 [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>{
  const arch=new THREE.Mesh(new THREE.CylinderGeometry(T.wr+.1,T.wr+.1,.02,24),CM.black);arch.rotation.z=Math.PI/2;arch.position.set(sx*(hw+.06),T.wr,sz*T.wz);g.add(arch);
  const st=new THREE.Group();st.position.set(sx*(hw-.04),T.wr,sz*T.wz);const roll=new THREE.Group();st.add(roll);
  const tire=new THREE.Mesh(new THREE.CylinderGeometry(T.wr,T.wr,.28,24),CM.tire);tire.rotation.z=Math.PI/2;roll.add(tire);
  const rim=new THREE.Mesh(new THREE.CylinderGeometry(T.wr*.68,T.wr*.68,.3,20),CM.chrome);rim.rotation.z=Math.PI/2;roll.add(rim);
  for(let i=0;i<5;i++){const sp=bx2(.04,T.wr*1.2,.06,CM.black,sx*.155,0,0);sp.rotation.x=i*Math.PI/5;roll.add(sp);}
  g.add(st);ws.push({roll,steer:st,front:sz<0});});
 const fz=-(T.len/2+.1),rz=T.len/2+.08;
 [-1,1].forEach(s=>{g.add(bx2(.34,.14,.08,CM.head,s*hw*.62,T.hl,fz),bx2(.34,.12,.08,CM.tail,s*hw*.62,T.tl,rz),bx2(.14,.1,.22,paint,s*(hw+.1),T.glass[0][1]+.1,-(T.glass[0][0]-.25)));});
 g.add(bx2(hw*.8,.18,.05,CM.black,0,T.hl-.18,fz-.01),bx2(.52,.12,.02,CM.plate,0,T.hl-.22,rz+.01),bx2(.52,.12,.02,CM.plate,0,T.hl-.32,fz-.02),bx2(T.w-.1,.08,.1,CM.chrome,0,T.low[0][1]+.1,fz-.01));
 if(type==='danfo')[-1,1].forEach(s=>g.add(bx2(.01,.16,4.3,CM.black,s*(hw+.06),.95,0)));
 if(type==='coupe')g.add(bx2(1.5,.05,.3,CM.black,0,1.04,2.05));
 g.traverse(m=>{if(m.isMesh)m.castShadow=true;});
 g.userData={paint,wheels:ws,eye:T.eye};return g;}
function makeCar(x,z,type,col){const g=buildCar(type,col);scene.add(g);const c={g,x,z,yaw:0,speed:0,steer:0};cars.push(c);return c;}
function swapCar(c,type,col){scene.remove(c.g);c.g=buildCar(type,col);scene.add(c.g);}
makeCar(40,10,'danfo',0xf1c40f);makeCar(-40,-30,'g63b',0);makeCar(70,25,'countach',0);makeCar(40,-70,'cla',0);

// target dummies (stand-ins for real players)
const dummies=[];
function spawnDummy(d){const a=Math.random()*Math.PI*2,r=30+Math.random()*130;let x,z;
 do{x=[-70,-40,40,70][Math.random()*4|0];z=Math.random()*220-110;}while(hit(x,0,z,1,2));
 d.position.set(x,1,z);d.userData.hp=100;d.material.color.set(0xff6a3d);}
for(let i=0;i<10;i++){const d=new THREE.Mesh(new THREE.CylinderGeometry(.45,.45,2),new THREE.MeshLambertMaterial({color:0xff6a3d}));d.userData.hp=100;scene.add(d);spawnDummy(d);dummies.push(d);}

// player
const p={x:40,y:0,z:-10,vy:0,ground:true,yaw:0,pitch:0},R=.4,H=1.7;
var TG={ok:false,near:function(){return false},y:function(){return NaN},blk:function(){return 0}};
let inCar=null,kills=0,locked=false,firing=false,nextFire=0;
const pm=new THREE.Group();
function mk(g,c){const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:c,roughness:.7}));m.castShadow=true;pm.add(m);return m;}
const torso=mk(new THREE.BoxGeometry(.6,.7,.35),0xe67e22);torso.position.y=1.1;
const head=mk(new THREE.SphereGeometry(.2,16,12),0xc68642);head.position.y=1.65;
const legGeo=()=>{const g=new THREE.BoxGeometry(.22,.8,.25);g.translate(0,-.4,0);return g;};
const legL=mk(legGeo(),0x1b1b1b);legL.position.set(-.15,.8,0);
const legR=mk(legGeo(),0x1b1b1b);legR.position.set(.15,.8,0);
const armGeo=()=>{const g=new THREE.BoxGeometry(.15,.65,.15);g.translate(0,-.3,0);return g;};
const armL=mk(armGeo(),0xc68642);armL.position.set(-.4,1.4,0);
const armR=mk(armGeo(),0xc68642);armR.position.set(.4,1.4,0);armR.rotation.x=-1.3;
const gun=mk(new THREE.BoxGeometry(.1,.12,.7),0x111111);gun.position.set(.4,1.15,-.45);
scene.add(pm);
let walkT=0,px0=p.x,pz0=p.z;
/* ===== Player character: uploaded GLB (photo-relief model), rebuilt from its mesh + texture ===== */
function b64a(s,T){const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return new T(u.buffer);}
const chr=new THREE.Group();chr.rotation.y=Math.PI;pm.add(chr);
const ring=new THREE.Mesh(new THREE.RingGeometry(.42,.52,40),new THREE.MeshBasicMaterial({color:0xff7a30,transparent:true,opacity:.75,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.03;pm.add(ring);
try{
const chrGeo=new THREE.BufferGeometry();
{const q=b64a(CH.pos,Int16Array),P=new Float32Array(q.length);for(let i=0;i<q.length;i+=3){P[i]=q[i]/32767*.375;P[i+1]=q[i+1]/32767*.5;P[i+2]=q[i+2]/32767*.063;}
 const u=b64a(CH.uv,Uint16Array),UV=new Float32Array(u.length);for(let i=0;i<u.length;i++)UV[i]=u[i]/65535;
 chrGeo.setAttribute('position',new THREE.BufferAttribute(P,3));chrGeo.setAttribute('uv',new THREE.BufferAttribute(UV,2));
 chrGeo.setIndex(new THREE.BufferAttribute(b64a(CH.idx,CH.idx32?Uint32Array:Uint16Array),1));chrGeo.computeVertexNormals();}
const chrTex=new THREE.TextureLoader().load(CH.tex);chrTex.flipY=false;chrTex.encoding=THREE.sRGBEncoding;chrTex.anisotropy=8;
const chrFront=new THREE.Mesh(chrGeo,new THREE.MeshStandardMaterial({map:chrTex,alphaTest:.5,roughness:.8,metalness:0,side:THREE.FrontSide}));
const chrBack=new THREE.Mesh(chrGeo,new THREE.MeshStandardMaterial({map:chrTex,alphaTest:.5,roughness:.9,color:0x666666,side:THREE.BackSide}));
[chrFront,chrBack].forEach(m=>{m.scale.setScalar(1.78);m.position.y=.5*1.78;m.castShadow=true;chr.add(m);});
[torso,head,legL,legR,armL,armR,gun].forEach(m=>m.visible=false);
}catch(e){console.warn('character model skipped',e);}

/* ===== Rigged character: Mixamo X Bot + Walk animation (from the uploaded FBX) ===== */
const xb={mixer:null,walk:null,idle:null,jump:null,climb:null,cur:null,surf:null,air:0,A:{}};
function softErr(m){const d=document.getElementById('err');if(!d)return;d.style.display='block';d.style.background='#7a5b00';d.textContent+=m+'\n';setTimeout(()=>{d.style.display='none';d.textContent='';},7000);}
function xbTint(){if(!xb.surf)return;const ms=Array.isArray(xb.surf.material)?xb.surf.material:[xb.surf.material];ms.forEach(m=>{if(m&&m.color)m.color.set(role.col).lerp(new THREE.Color(0xffffff),.45);});}
(function loadXBot(){
 if(!THREE.FBXLoader){softErr('Animated character skipped: FBX loader not available. Using the photo character.');return;}
 try{
  const obj=new THREE.FBXLoader().parse(b64a(XB,Uint8Array).buffer,'');
  obj.scale.setScalar(.01);
  obj.traverse(o=>{if(o.isMesh){o.castShadow=true;o.frustumCulled=false;if(/Surface/i.test(o.name))xb.surf=o;}});
  const stripRoot=(c,dt)=>c.tracks.forEach(t=>{if(/Hips\.position$/.test(t.name)){const v=t.values,x0=v[0],z0=v[2],n=v.length/3;if(dt&&n>1){const y0=v[1],y1=v[(n-1)*3+1],T=t.times[n-1]-t.times[0];for(let k=0;k<n;k++)v[k*3+1]-=(y1-y0)*(t.times[k]-t.times[0])/T;}for(let i=0;i<v.length;i+=3){v[i]=x0;v[i+2]=z0;}}});
  const clip=obj.animations[0];stripRoot(clip);
  xb.mixer=new THREE.AnimationMixer(obj);xb.walk=xb.mixer.clipAction(clip);
  try{const o2=new THREE.FBXLoader().parse(b64a(XI,Uint8Array).buffer,'');const c2=o2.animations[0];stripRoot(c2);xb.idle=xb.mixer.clipAction(c2);}catch(e){softErr('Idle animation skipped: '+(e&&e.message||e));}
  try{const o3=new THREE.FBXLoader().parse(b64a(XJ,Uint8Array).buffer,'');const c3=o3.animations[0];stripRoot(c3);xb.jump=xb.mixer.clipAction(c3);xb.jump.setLoop(THREE.LoopOnce,1);xb.jump.clampWhenFinished=true;}catch(e){softErr('Jump animation skipped: '+(e&&e.message||e));}
  try{const o4=new THREE.FBXLoader().parse(b64a(XC,Uint8Array).buffer,'');const c4=o4.animations[0];stripRoot(c4,true);xb.climb=xb.mixer.clipAction(c4);}catch(e){softErr('Climb animation skipped: '+(e&&e.message||e));}
  xb.A.walk=xb.walk;xb.A.idle=xb.idle;xb.A.jump=xb.jump;xb.A.climb=xb.climb;
  if(typeof fflate==='undefined')softErr('New animations skipped: decompression library missing.');
  else{const dz=s=>{const u=fflate.unzlibSync(b64a(s,Uint8Array));return u.buffer.slice(u.byteOffset,u.byteOffset+u.byteLength);};
   for(const k in XANIM){try{const o=new THREE.FBXLoader().parse(dz(XANIM[k]),'');const c=o.animations[0];stripRoot(c,k==='up'||k==='down'||k==='runup');xb.A[k]=xb.mixer.clipAction(c);}catch(e){softErr('Animation '+k+' skipped: '+(e&&e.message||e));}}
   ['punch','hit1','hit2','open','golf','moving','prone','stand'].forEach(k=>{const a=xb.A[k];if(a){a.setLoop(THREE.LoopOnce,1);a.clampWhenFinished=true;}});}
  xb.cur=xb.idle||xb.walk;xb.cur.play();if(!xb.idle)xb.walk.paused=true;xb.mixer.update(0);
  chr.children.forEach(c=>c.visible=false);chr.add(obj);window.xbot=obj;xbTint();
 }catch(e){softErr('Animated character skipped: '+(e&&e.message||e)+'. Using the photo character.');}
})();


const keys={};
addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys[e.code]=true;if(e.code==='Escape'&&locked&&!plock)pauseGame();if(e.code==='KeyF'&&locked)useF();});
let plock=false;
function startGame(){locked=true;torso.material.color.set(role.col);ring.material.color.set(role.col);xbTint();hideUI();try{const r=document.body.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(e){}}
function pauseGame(){locked=false;firing=false;showScreen('play');for(const k in keys)keys[k]=false;}
addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('keyup',e=>keys[e.code]=false);
document.addEventListener('pointerlockchange',()=>{plock=document.pointerLockElement===document.body;if(!plock&&locked&&!window.elPanel)pauseGame();});
addEventListener('mousemove',e=>{if(!locked||(!plock&&!(e.buttons&2)))return;p.yaw-=e.movementX*.0022;p.pitch=Math.max(-1.5,Math.min(1.5,p.pitch-e.movementY*.0022));});
addEventListener('mousedown',e=>{if(locked&&e.button===0)firing=true;});addEventListener('mouseup',()=>firing=false);

function toggleCar(){
 if(inCar){const fxo=inCar.g.userData.fx;if(fxo){p.x=inCar.x-Math.cos(inCar.yaw)*2.4;p.z=inCar.z+Math.sin(inCar.yaw)*2.4;CarFX.door(inCar,0,true,1.6);}else{p.x=inCar.x+Math.cos(inCar.yaw)*3;p.z=inCar.z-Math.sin(inCar.yaw)*3;}p.y=0;inCar=null;return;}
 let best=null,bd=5;for(const c of cars){const d=Math.hypot(c.x-p.x,c.z-p.z);if(d<bd){bd=d;best=c;}}
 if(best){inCar=best;if(best.g.userData.fx)CarFX.door(best,0,true,1.1);}
}
addEventListener('keydown',e=>{if(e.code!=='KeyH'||e.repeat||!locked)return;let b=inCar,bd=6;if(!b)for(const c of cars){const d=Math.hypot(c.x-p.x,c.z-p.z);if(d<bd){bd=d;b=c;}}if(b&&b.g.userData.fx)CarFX.toggleDoor(b,e.shiftKey?1:0);});
function updateCar(c,dt,drive){
 if(c.g.userData.fx){CarFX.step(c,dt,drive?{thr:keys.KeyW?1:0,brk:keys.KeyS?1:0,hb:keys.Space?1:0,st:(keys.KeyA?1:0)-(keys.KeyD?1:0),drive:1}:{thr:0,brk:0,hb:0,st:0,park:1},hit);return;}
 if(drive){const acc=(keys.KeyW?1:0)-(keys.KeyS?1:0);c.speed+=acc*20*dt;if(keys.Space)c.speed*=Math.pow(.02,dt);
  const st=(keys.KeyA?1:0)-(keys.KeyD?1:0);c.yaw+=st*1.7*dt*Math.min(1,Math.abs(c.speed)/6)*(c.speed>=0?1:-1);}
 c.speed*=Math.pow(.55,dt);c.speed=Math.max(-12,Math.min(32,c.speed));
 const nx=c.x-Math.sin(c.yaw)*c.speed*dt,nz=c.z-Math.cos(c.yaw)*c.speed*dt;
 if(!hit(nx,.1,nz,1.4,1.2)){c.x=nx;c.z=nz;}else c.speed*=-.3;
 c.g.position.set(c.x,0,c.z);c.g.rotation.y=c.yaw;
 if(c.g.userData.hover)c.g.userData.hover.position.y=.32+Math.sin(performance.now()/500)*.04;CarFX.lampTick(c.g.userData.lamps,dt,drive&&((keys.KeyS&&c.speed>.8)||keys.Space),drive&&c.speed<-.5,drive);const ws=c.g.userData.wheels;if(ws){const st=drive?((keys.KeyA?1:0)-(keys.KeyD?1:0))*.45:0;c.steer=(c.steer||0)+(st-(c.steer||0))*.2;ws.forEach(w=>{w.roll.rotation.x-=c.speed*dt/(w.r||.34);if(w.front)w.steer.rotation.y=c.steer;});}
}
function movePlayer(dx,dz,dt){
 for(const [ax,az] of [[dx,0],[0,dz]]){if(!ax&&!az)continue;const ox=p.x,oz=p.z;p.x+=ax;p.z+=az;
  if(TG.ok&&TG.near(p.x,p.z)){const g=TG.y(p.x,p.z),st=Math.hypot(ax,az),al=(p.ground?.1:.25)+st*1.25;
   if(g!==g||g>p.y+al||TG.blk(p.x,p.z,R,p.y)>TG.blk(ox,oz,R,p.y)){p.x=ox;p.z=oz;continue;}}
  if(hit(p.x,p.y,p.z,R,H)){p.y+=.55;if(hit(p.x,p.y,p.z,R,H)){p.y-=.55;p.x-=ax;p.z-=az;}}}
 if(p.plat&&p.vy>.5)p.plat=null;if(p.plat&&dt>0)p.y+=p.plat.vy*dt;const wg=p.ground;p.vy-=22*dt;const dy=p.vy*dt;p.y+=dy;p.ground=false;
 const b=hit(p.x,p.y,p.z,R,H);
 if(b){if(dy<0){p.y=b.d;p.ground=true;p.plat=b.dyn?b:null;}else p.y=b.c-H-.001;p.vy=0;}
 if(TG.ok&&TG.near(p.x,p.z)){const g=TG.y(p.x,p.z);
  if(g===g){if(p.y<=g||(wg&&!b&&p.vy<=0&&p.y-g<.45)){p.y=g;p.vy=0;p.ground=true;}}
  else if(p.y<=0){p.y=0;p.vy=0;p.ground=true;}}
 else if(p.y<=0){p.y=0;p.vy=0;p.ground=true;}
 if(!p.ground)p.plat=null;
}
const ray=new THREE.Raycaster();ray.far=400;const tracers=[];const crossEl=document.getElementById('cross');
function shoot(){
 ray.setFromCamera(new THREE.Vector2(0,0),cam);
 const hits=ray.intersectObjects(solids.concat(dummies),false);
 const end=hits.length?hits[0].point:ray.ray.at(300,new THREE.Vector3());
 if(hits.length&&dummies.includes(hits[0].object)){const d=hits[0].object;d.userData.hp-=role.dmg;d.material.color.set(0xffffff);setTimeout(()=>d.material.color.set(0xff6a3d),60);
  crossEl.classList.add('hit');setTimeout(()=>crossEl.classList.remove('hit'),90);
  if(d.userData.hp<=0){kills++;spawnDummy(d);}}
 const start=gun.getWorldPosition(new THREE.Vector3());
 const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints([start,end]),new THREE.LineBasicMaterial({color:0xffe066}));scene.add(l);tracers.push({l,t:.06});
}
const hud=document.getElementById('hud'),hint=document.getElementById('hint');
let last=performance.now();
function loop(now){requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000);last=now;
 cars.forEach(c=>updateCar(c,dt,c===inCar&&locked));
 if(locked){p.yaw+=((keys.ArrowLeft?1:0)-(keys.ArrowRight?1:0))*2*dt;p.pitch=Math.max(-1.5,Math.min(1.5,p.pitch+((keys.ArrowUp?1:0)-(keys.ArrowDown?1:0))*1.5*dt));}
 if(locked&&!inCar){
  const fx=-Math.sin(p.yaw),fz=-Math.cos(p.yaw),rx=Math.cos(p.yaw),rz=-Math.sin(p.yaw);
  let mx=(keys.KeyD?1:0)-(keys.KeyA?1:0),mf=(keys.KeyW?1:0)-(keys.KeyS?1:0);
  const len=Math.hypot(mx,mf)||1;const sp=role.spd*speedMul(dt,(mx||mf)?1:0);
  movePlayer((fx*mf+rx*mx)/len*sp*dt,(fz*mf+rz*mx)/len*sp*dt,dt);
  if(keys.Space&&p.ground&&!XS.lock&&!XS.crouch&&!XS.swim){p.vy=8.5;}
  p.climbing=false;if(keys.KeyE&&hit(p.x+fx*.7,p.y,p.z+fz*.7,R,H)){p.vy=5.5;p.climbing=true;}
  if(firing&&now/1000>nextFire&&ammo.mag>0&&!ammo.rl&&!XS.lock){nextFire=now/1000+role.rate;shoot();ammo.mag--;if(ammo.mag<=0)reload();}
 }
 if(!locked){orbitCam(now/1000);if(uiScreen==='char'&&window.xbot)xbotUpdate(dt,0);}else if(inCar&&fpsView){fpsCar();}else if(inCar){cam.position.set(inCar.x+Math.sin(inCar.yaw)*9,4.5,inCar.z+Math.cos(inCar.yaw)*9);cam.lookAt(inCar.x,1.5,inCar.z);}
 else if(fpsView){cam.position.set(p.x,p.y+(XS.crouch?1.2:1.65),p.z);cam.rotation.set(p.pitch,p.yaw,0);pm.position.set(p.x,p.y,p.z);pm.rotation.y=p.yaw;px0=p.x;pz0=p.z;}
 else{
  const pv=new THREE.Vector3(p.x,p.y+(XS.crouch?1.2:1.6),p.z),cp=Math.cos(p.pitch),f=new THREE.Vector3(-Math.sin(p.yaw)*cp,Math.sin(p.pitch),-Math.cos(p.yaw)*cp),rt=new THREE.Vector3(Math.cos(p.yaw),0,-Math.sin(p.yaw));
  const want=pv.clone().addScaledVector(f,-4.2).addScaledVector(rt,.9);
  const d=want.clone().sub(pv);let t=1;
  for(let s=1;s<=12;s++){const k=s/12;const cx=pv.x+d.x*k,cy=pv.y+d.y*k,cz=pv.z+d.z*k,tgy=(TG.ok&&TG.near(cx,cz))?TG.y(cx,cz):NaN;if(hit(cx,cy,cz,.25,.25)||(tgy===tgy&&cy<tgy+.3)){t=Math.max(.15,(s-1)/12);break;}}
  cam.position.copy(pv).addScaledVector(d,t);cam.rotation.set(p.pitch,p.yaw,0);
  pm.position.set(p.x,p.y,p.z);pm.rotation.y=p.yaw;
  const sp0=Math.hypot(p.x-px0,p.z-pz0)/(dt+1e-6),mv=Math.min(1,sp0/6);px0=p.x;pz0=p.z;if(window.xbot)xbotUpdate(dt,sp0);walkT+=dt*10*mv;
  if(!window.xbot){chr.position.y=Math.abs(Math.sin(walkT))*.06*mv;chr.rotation.x=-.1*mv;chr.rotation.z=Math.sin(walkT)*.04*mv;}legL.rotation.x=Math.sin(walkT)*.8*mv;legR.rotation.x=-legL.rotation.x;armL.rotation.x=-legL.rotation.x*.6;
 }
 pm.visible=!inCar&&!(fpsView&&locked);cam.updateMatrixWorld();
 for(let i=tracers.length-1;i>=0;i--){tracers[i].t-=dt;if(tracers[i].t<=0){scene.remove(tracers[i].l);tracers.splice(i,1);}}
 dummies.forEach(d=>d.rotation.y+=dt);
 let near=!inCar&&cars.some(c=>Math.hypot(c.x-p.x,c.z-p.z)<5);
 hud.innerHTML=`<b style="color:${role.col}">${roleName}</b> | ${role.gun}<br>Kills: ${kills}<br>Height: ${Math.round(inCar?0:p.y)} m${inCar?`<br>Speed: ${Math.round(Math.abs(inCar.speed)*3.6)} km/h`:''}`;
 hint.textContent=inCar?'F to exit car':near?'F to enter car':'Hold E at a wall to climb';
 interiorTick(dt);survivalTick(dt);GFXrender(dt);hudTick(now);
}
requestAnimationFrame(loop);

/* ===== EKO UI ===== */
const $=id=>document.getElementById(id);
let uiScreen='load',sel=0,gi=0,gf='ALL',garOff=0,garZ=1;
const EKO_ROLES=[
 {n:'DRIVER',d:'Own the streets. Set the pace.',g:'CIVILIAN',pv:'Street-ready. City-bound.',st:{spd:7,dmg:15,rate:.14,gun:'MK18',col:'#ff7a30'}},
 {n:'ENTREPRENEUR',d:'Build a business. Make your name.',g:'CIVILIAN',pv:'Sharp suit. Bigger plans.',st:{spd:6,dmg:15,rate:.3,gun:'Pistol',col:'#27ae60'}},
 {n:'OFFICER',d:'Keep the city in balance.',g:'LAW',pv:'Badge up. Hold the line.',st:ROLES.Police},
 {n:'ROBBER',d:'Big risks. Bigger rewards.',g:'OUTLAW',pv:'Fast hands. No witnesses.',st:ROLES.Robber},
 {n:'BANDIT',d:'Run with a crew. Rule your turf.',g:'OUTLAW',pv:'Loud crew. Louder name.',st:ROLES.Bandit},
 {n:'ASSASSIN',d:'Stay unseen. Leave a reputation.',g:'OUTLAW',pv:'One shot. Zero trace.',st:ROLES.Assassin}
];
function toast(m){const t=$('toast');t.textContent=m;t.style.opacity=1;clearTimeout(toast.h);toast.h=setTimeout(()=>t.style.opacity=0,2200);}
function showScreen(s){uiScreen=s;tcShow(false);$('eko').style.display='block';$('hudw').style.display='none';$('cross').style.display='none';$('eko').classList.toggle('m',s!=='load');
 document.querySelectorAll('#eko .scr,#eko #load').forEach(e=>e.classList.remove('on'));
 (s==='load'?$('load'):$('s-'+s)).classList.add('on');
 document.querySelectorAll('#nav a').forEach(a=>a.classList.toggle('on',a.dataset.s===s));
 if(s==='garage')showVeh(gi);}
function hideUI(){uiScreen='game';tcShow(true);$('eko').style.display='none';$('hudw').style.display='block';$('cross').style.display='block';}
document.addEventListener('click',e=>{const t=e.target.closest('[data-s]');if(t)showScreen(t.dataset.s);});
function selRole(i){sel=i;const r=EKO_ROLES[i];role=r.st;roleName=r.n;torso.material.color.set(role.col);ring.material.color.set(role.col);xbTint();
 $('cards').innerHTML=EKO_ROLES.map((x,k)=>`<div class="card ${k===i?'sel':''}" data-i="${k}"><div class="r"><span>0${k+1}</span><span>${k===i?'SELECTED':'↗'}</span></div><h3>${x.n}</h3><p>${x.d}</p><small>${x.g}</small></div>`).join('');
 $('pvn').textContent='THE '+r.n;$('pvd').textContent=r.pv;$('startrole').innerHTML='START AS '+(/^[AEIOU]/.test(r.n)?'AN ':'A ')+r.n+' <b>↗</b>';}
$('cards').addEventListener('click',e=>{const c=e.target.closest('.card');if(c)selRole(+c.dataset.i);});
$('startrole').onclick=()=>enter();$('enter').onclick=()=>enter();$('cust').onclick=$('gcust').onclick=()=>toast('Customization is coming soon.');
function enter(car){ammo.mag=30;ammo.rl=false;if(car){inCar=car;}startGame();}
selRole(0);

// vehicles + garage display
function mat(c,r,m){return new THREE.MeshStandardMaterial({color:c,roughness:r??.5,metalness:m??.2});}
function bx(w,h,d,c,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c));m.position.set(x,y,z);m.castShadow=true;return m;}
function carGrp(col){const g=new THREE.Group();g.add(bx(2,.8,4.2,col,0,.7,0),bx(1.8,.7,2,0x223344,0,1.4,.3));[[-1,1.4],[1,1.4],[-1,-1.4],[1,-1.4]].forEach(w=>g.add(bx(.3,.6,.6,0x111111,w[0],.3,w[1])));return g;}
function jetGrp(){const g=new THREE.Group(),m=mat(0x5b6670,.4,.5);const f=new THREE.Mesh(new THREE.CylinderGeometry(.7,.5,9,16),m);f.rotation.x=Math.PI/2;f.position.y=2;g.add(f);
 const n=new THREE.Mesh(new THREE.ConeGeometry(.7,2.4,16),m);n.rotation.x=-Math.PI/2;n.position.set(0,2,-5.7);g.add(n);
 g.add(bx(11,.12,1.6,0x4a545c,0,1.8,.4),bx(4,.1,1,0x4a545c,0,2.6,3.9),bx(.12,1.6,1.2,0x4a545c,0,3,3.8),bx(.2,1,.2,0x111,0,1,-2),bx(.2,1,.2,0x111,-1.2,1,.8),bx(.2,1,.2,0x111,1.2,1,.8));return g;}
function heliGrp(){const g=new THREE.Group();const b=new THREE.Mesh(new THREE.SphereGeometry(1.4,16,12),mat(0x2c3e50,.4,.4));b.scale.set(1,.9,1.7);b.position.y=2;g.add(b);
 g.add(bx(.3,.3,4.5,0x2c3e50,0,2.2,3.8),bx(.2,1.2,.6,0x2c3e50,0,2.8,6),bx(.1,.8,.1,0x111,0,3.3,0),bx(.12,.12,3.6,0x111,-.9,.5,0),bx(.12,.12,3.6,0x111,.9,.5,0));
 const r=bx(9,.06,.3,0x111111,0,3.7,0);g.add(r);g.userData.rotor=r;return g;}
function boatGrp(){const g=new THREE.Group();g.add(bx(2.4,.8,7,0xecf0f1,0,.6,0),bx(1.8,.9,2.4,0x2c3e50,0,1.5,-.4),bx(.6,.3,1.5,0xecf0f1,0,.5,-4));return g;}
const VEH=[
 {n:'Danfo Classic',t:'CITY MINIBUS',c:'GROUND',cls:'City minibus',seats:'08 players',loc:'City garage',car:0,type:'danfo',col:0xf1c40f,mk:()=>buildCar('danfo',0xf1c40f),r:9,y:1},
 {n:'Mercedes G63 AMG W464',t:'LUXURY SUV',c:'GROUND',cls:'Luxury SUV',seats:'04 players',loc:'City garage',car:1,type:'g63b',col:0,mk:()=>buildCar('g63b',0),r:10,y:1},
 {n:'Mercedes G-Class G63 AMG',t:'OFF-ROAD SUV',c:'GROUND',cls:'Off-road SUV',seats:'04 players',loc:'City garage',car:1,type:'g63a',col:0,mk:()=>buildCar('g63a',0),r:10,y:1},
 {n:'Mercedes CLA 45 AMG Shooting Brake',t:'PERFORMANCE WAGON',c:'GROUND',cls:'Performance wagon',seats:'04 players',loc:'City garage',car:3,type:'cla',col:0,mk:()=>buildCar('cla',0),r:10,y:1},
 {n:'Citroen DS Survolt',t:'ELECTRIC CONCEPT',c:'GROUND',cls:'Electric concept',seats:'02 players',loc:'City garage',car:3,type:'ds',col:0,mk:()=>buildCar('ds',0),r:10,y:1},
 {n:'Mercedes Silver Lightning',t:'CONCEPT COUPE',c:'GROUND',cls:'Concept coupe',seats:'02 players',loc:'City garage',car:2,type:'silver',col:0,mk:()=>buildCar('silver',0),r:10,y:1},
 {n:'Lamborghini Countach LPI 800-4',t:'SUPERCAR',c:'GROUND',cls:'Supercar',seats:'02 players',loc:'City garage',car:2,type:'countach',col:0,mk:()=>buildCar('countach',0),r:10,y:1},
 {n:'Lamborghini Centenario',t:'HYPERCAR',c:'GROUND',cls:'Hypercar',seats:'02 players',loc:'City garage',car:2,type:'centenario',col:0,mk:()=>buildCar('centenario',0),r:10,y:1},
 {n:'Molnia Hover Racer',t:'FUTURISTIC RACER',c:'GROUND',cls:'Hover racer',seats:'01 player',loc:'City garage',car:3,type:'molnia',col:0,mk:()=>buildCar('molnia',0),r:13,y:1},
 {n:'Kestrel X1',t:'LIGHT JET',c:'AIR',cls:'Light jet',seats:'02 players',loc:'Coastal airfield',mk:jetGrp,r:17,y:2.2},
 {n:'Falcon H6',t:'HELICOPTER',c:'AIR',cls:'Helicopter',seats:'04 players',loc:'Coastal airfield',mk:heliGrp,r:15,y:2.4},
 {n:'Coastline 38',t:'SPEEDBOAT',c:'WATER',cls:'Speedboat',seats:'06 players',loc:'Marina',mk:boatGrp,r:14,y:1}
];
const gar=new THREE.Group();gar.position.set(0,0,320);scene.add(gar);
const pod=new THREE.Mesh(new THREE.CylinderGeometry(10,10,.3,48),mat(0x161b22,.6,.3));pod.position.y=.15;gar.add(pod);
const gl=new THREE.PointLight(0xff8a40,1.4,50);gl.position.set(0,9,0);gar.add(gl);
VEH.forEach(v=>{if(v.type&&CARDATA[v.type]){v.col=pickColor();v.mdl=buildCar(v.type,v.col);}else v.mdl=v.mk();v.mdl.visible=false;gar.add(v.mdl);});
function paintNext(){const v=VEH[gi];if(v.type==='molnia'){toast('The Molnia keeps its carbon-black finish.');return;}if(!(v.type&&CARDATA[v.type])){toast('This vehicle cannot be repainted yet.');return;}const i=(PAL.indexOf(v.col)+1)%PAL.length;v.col=PAL[i];gar.remove(v.mdl);v.mdl=buildCar(v.type,v.col);gar.add(v.mdl);showVeh(gi);toast('Paint: '+PALN[i]);}
$('gcust').onclick=paintNext;
function showVeh(i){gi=i;const v=VEH[i];VEH.forEach((x,k)=>x.mdl.visible=k===i);
 $('vcat').textContent=v.c+' / '+String(i+1).padStart(2,'0');$('vn').textContent=v.n.toUpperCase();$('vt').textContent=v.car!==undefined?'Ready for the streets.':'A new perspective on the city.';
 $('vc').textContent=v.cls;$('vs').textContent=v.seats;$('vl').textContent=v.loc;
 const ok=v.car!==undefined;$('vst').innerHTML=ok?'<span style="color:#7ee2a0">● Ready to deploy</span>':'<span style="color:#f1c40f">● Model preview only</span>';
 const d=$('deploy');d.className='cta'+(ok?'':' dis');d.innerHTML=(ok?'DEPLOY IN CITY':v.c==='AIR'?'DEPLOY AT AIRFIELD':'DEPLOY AT MARINA')+' <b>↗</b>';
 $('vlist').innerHTML=VEH.map((x,k)=>(gf==='ALL'||x.c===gf)?`<div class="vi ${k===i?'sel':''}" data-k="${k}"><span>${String(k+1).padStart(2,'0')}</span><div><b>${x.n}</b><small>${x.t}</small></div>${k===i?'<span class="tg">SELECTED</span>':''}</div>`:'').join('');}
$('vlist').addEventListener('click',e=>{const c=e.target.closest('.vi');if(c)showVeh(+c.dataset.k);});
$('gtabs').addEventListener('click',e=>{const a=e.target.closest('a');if(!a)return;gf=a.dataset.f;document.querySelectorAll('#gtabs a').forEach(x=>x.classList.toggle('on',x===a));showVeh(gi);});
$('deploy').onclick=()=>{const v=VEH[gi];if(v.car===undefined){toast(v.n+' arrives in a future update.');return;}const c=cars[v.car];swapCar(c,v.type,v.col);enter(c);};
addEventListener('keydown',e=>{if(uiScreen==='garage'){if(e.code==='ArrowLeft')garOff-=.25;if(e.code==='ArrowRight')garOff+=.25;if(e.code==='Equal'||e.code==='NumpadAdd')garZ=Math.max(.6,garZ-.1);if(e.code==='Minus'||e.code==='NumpadSubtract')garZ=Math.min(1.8,garZ+.1);}if(e.code==='KeyR'&&locked)reload();});
function orbitCam(t){
 if(uiScreen==='char'){const a=t*.4;cam.position.set(p.x+Math.sin(a)*3.6,p.y+1.7,p.z+Math.cos(a)*3.6);cam.lookAt(p.x,p.y+1.2,p.z);}
 else if(uiScreen==='garage'){const v=VEH[gi],r=v.r*garZ,a=t*.25+garOff;cam.position.set(Math.sin(a)*r,v.r*.28+1.5,320+Math.cos(a)*r);cam.lookAt(0,v.y,320);if(v.mdl.userData.rotor)v.mdl.userData.rotor.rotation.y=t*20;}
 else{const a=t*.05;cam.position.set(Math.sin(a)*330,120,Math.cos(a)*330);cam.lookAt(0,100,0);}
}

// ammo
const ammo={mag:30,rl:false};
function reload(){if(ammo.rl||ammo.mag>=30)return;ammo.rl=true;setTimeout(()=>{ammo.mag=30;ammo.rl=false;},900);}

// HUD
const mm=$('mm'),mg=mm.getContext('2d');
function drawMap(px,pz,yw){const W=mm.width,Hh=mm.height,s=1.5,cx=W/2,cy=Hh/2,X=x=>cx+(x-px)*s,Z=z=>cy+(z-pz)*s;
  mg.fillStyle='#1d4350';mg.fillRect(0,0,W,Hh);
  mg.save();mg.translate(cx,cy);mg.rotate(yw);mg.translate(-cx,-cy);
  mg.fillStyle='#16343f';for(const b of CD.bld)mg.fillRect(X(b.x-b.w/2),Z(b.z-b.d/2),b.w*s,b.d*s);mg.fillStyle='#ffb24a';mg.fillRect(X(-14),Z(-14),28*s,28*s);
  mg.strokeStyle='#ff7a30';mg.lineWidth=3;mg.beginPath();mg.moveTo(cx,cy);mg.lineTo(X(0),Z(0));mg.stroke();
  mg.fillStyle='#fff';cars.forEach(c=>mg.fillRect(X(c.x)-2.5,Z(c.z)-2.5,5,5));
  mg.font='bold 16px Inter,Arial';mg.textAlign='center';mg.fillText('N',cx,cy-W*.44);
  mg.restore();
  mg.fillStyle='#fff';mg.beginPath();mg.moveTo(cx,cy-9);mg.lineTo(cx+7,cy+8);mg.lineTo(cx,cy+4);mg.lineTo(cx-7,cy+8);mg.closePath();mg.fill();}
let fT=0,fc=0,fps=60,mmT=0;
function hudTick(now){
 fc++;if(now-fT>500){fps=Math.round(fc*1000/(now-fT));fc=0;fT=now;}
 if(!locked)return;
 const px=inCar?inCar.x:p.x,pz=inCar?inCar.z:p.z,yw=inCar?inCar.yaw:p.yaw;
 const hd=(((-yw*180/Math.PI)%360)+360)%360,L=['N','NE','E','SE','S','SW','W','NW'];
 $('cmp').innerHTML=[-90,-45,0,45,90].map(o=>{const a=(hd+o+360)%360;return `<span class="${o?'':'c'}">${Math.round(a)%360}<br>${L[Math.round(a/45)%8]}</span>`;}).join('');
 const d=Math.round(Math.hypot(px,pz))+' m';$('od').textContent=d;$('wpd').textContent=d;
 let nb=null,bd=45;for(const q of LBL){const dd=Math.hypot(px-q.b.x,pz-q.b.z);q.sp.visible=dd<120;const ed=dd-Math.max(q.b.w,q.b.d)/2;if(ed<bd){bd=ed;nb=q.b;}}
 $('dn').textContent=nb?nb.n.toUpperCase()+' / '+nb.s+' FLOORS':(Math.hypot(px,pz)<24?'LOOBY TOWER':'VICTORIA DISTRICT');
 const v=new THREE.Vector3(0,90,0).project(cam),wp=$('wp');
 if(v.z<1&&Math.abs(v.x)<1&&Math.abs(v.y)<1){wp.style.display='block';wp.style.left=(v.x*.5+.5)*innerWidth+'px';wp.style.top=(-v.y*.5+.5)*innerHeight+'px';}else wp.style.display='none';
 $('clk').textContent=(gHr!==null?fmtH(gHr):new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}))+' / '+fps+' FPS';
 $('ammo').textContent=ammo.rl?'--':ammo.mag;$('hpbar').style.width=XS.hp+'%';$('hptxt').textContent=Math.round(XS.hp)+' HP';$('stbar').style.width=XS.st+'%';$('wn').textContent=role.gun.toUpperCase()+' / AUTO';$('hrole').textContent=roleName;
 let pk='',pt='',ps='';const ne=inCar?null:nearElev();
 if(ne){pk='F';pt=ne.inside?(ne.e.panel?'FLOOR BUTTONS':'ELEVATOR UP'):'CALL ELEVATOR';ps=ne.inside?('Floor '+Math.round((ne.e.y-ne.e.b.y0)/ne.e.b.st)+(ne.e.panel?'  /  F opens the panel, Q goes down':'  /  Q to go down')):'Doors open when it arrives';}else
 if(inCar){pk='F';pt='EXIT VEHICLE';ps=Math.round(Math.abs(inCar.speed)*3.6)+' km/h';}
 else{let near=false;for(const c of cars)if(Math.hypot(c.x-p.x,c.z-p.z)<5)near=true;
  if(near){pk='F';pt='ENTER VEHICLE';ps='Driver seat';}
  else{const fx=-Math.sin(p.yaw),fz=-Math.cos(p.yaw);if(hit(p.x+fx*.7,p.y,p.z+fz*.7,R,H)){pk='E';pt='CLIMB';ps='Hold at the wall';}}}
 const pe=$('prompt');pe.style.display=pk?'flex':'none';if(pk){$('pk').textContent=pk;$('pt').textContent=pt;$('ps').textContent=ps;}
 if(++mmT%3===0)drawMap(px,pz,yw);
}

// loading screen
const tips=['Every character is a real player.','Hold E at any wall to climb.','Press F to enter a vehicle.','Roles are a starting point, not a limit.'],steps=['Building Victoria District','Raising the LOBBY tower','Warming up engines','Tuning proximity voice','Almost there'];
let ld=0,ti=0;$('ltip').textContent=tips[0];
const tipT=setInterval(()=>{ti=(ti+1)%tips.length;$('ltip').textContent=tips[ti];},1500);
const ldT=setInterval(()=>{ld=Math.min(100,ld+Math.random()*6+2);$('lbar').style.width=ld+'%';$('lpct').textContent=Math.floor(ld)+'%';$('lstep').textContent=steps[Math.min(4,Math.floor(ld/20))].toUpperCase()+'…';
 if(ld>=100){clearInterval(ldT);clearInterval(tipT);setTimeout(()=>showScreen('play'),450);}},120);



/* ===== Interiors: every building is hollow and enterable (doors, floors, stairs, elevators, escalators, roof) ===== */
const ELEV=[],ESCS=[],DOORS=[],HALLS=[],STAIRS=[];
const IBM={floor:{c:[.62,.6,.56],r:.85,m:0},wall:{c:[.86,.84,.79],r:.9,m:0},stair:{c:[.36,.37,.4],r:.7,m:.2},shaft:{c:[.5,.52,.56],r:.55,m:.35},light:{c:[1,.97,.86],basic:1},roof:{c:[.14,.15,.14],r:.9,m:.1},tile:{c:[.74,.72,.66],r:.45,m:.1},esc:{c:[.16,.18,.2],r:.45,m:.6},escl:{c:[1,.8,.2],basic:1},desk:{c:[.35,.22,.12],r:.7,m:0}};
const IB={};for(const k in IBM)IB[k]={p:[],i:[]};
function ibox(k,x0,x1,y0,y1,z0,z1){const g=IB[k],n=g.p.length/3;g.p.push(x0,y0,z0,x1,y0,z0,x1,y1,z0,x0,y1,z0,x0,y0,z1,x1,y0,z1,x1,y1,z1,x0,y1,z1);
 g.i.push(n,n+2,n+1,n,n+3,n+2,n+4,n+5,n+6,n+4,n+6,n+7,n,n+1,n+5,n,n+5,n+4,n+3,n+7,n+6,n+3,n+6,n+2,n,n+4,n+7,n,n+7,n+3,n+1,n+2,n+6,n+1,n+6,n+5);}
const hallMat=new THREE.MeshStandardMaterial({color:new THREE.Color(.55,.57,.6),metalness:.6,roughness:.35});
const carMat=new THREE.MeshStandardMaterial({color:new THREE.Color(.72,.74,.77),metalness:.5,roughness:.4});
const carLight=new THREE.MeshBasicMaterial({color:new THREE.Color(1,.97,.88)});
const doorGlass=new THREE.MeshStandardMaterial({color:new THREE.Color(.19,.28,.32),metalness:.28,roughness:.08,transparent:true,opacity:.4,depthWrite:false});
function meshRect(r,y0,y1,m){const o=new THREE.Mesh(new THREE.BoxGeometry(r[1]-r[0],y1-y0,r[3]-r[2]),m);o.position.set((r[0]+r[1])/2,(y0+y1)/2,(r[2]+r[3])/2);return o;}
function buildInterior(b,bi){
 const T=.5,fx=b.fx,fz=b.fz,rx=fz,rz=-fx,alongZ=Math.abs(fz)>.5,Wl=alongZ?b.w:b.d,Dl=alongZ?b.d:b.w;
 const L=(lx,lz)=>[b.x+lx*rx+lz*fx,b.z+lx*rz+lz*fz];
 const bb=(lx0,lx1,lz0,lz1)=>{const a=L(lx0,lz0),c=L(lx1,lz1);return[Math.min(a[0],c[0]),Math.max(a[0],c[0]),Math.min(a[1],c[1]),Math.max(a[1],c[1])];};
 const LB=(k,lx0,lx1,y0,y1,lz0,lz1,coll)=>{const r=bb(lx0,lx1,lz0,lz1);ibox(k,r[0],r[1],y0,y1,r[2],r[3]);if(coll)boxes.push({a:r[0],b:r[1],c:y0,d:y1,e:r[2],f:r[3]});return r;};
 const S=b.s,st=b.st,y0=b.y0,nF=b.ra?S:S-1,N=Math.ceil(st/.2),rise=st/N,run=.3,lvl=k=>y0+k*st;
 const ix0=-Wl/2+T,ix1=Wl/2-T,iz0=-Dl/2+T,iz1=Dl/2-T;
 const a0=iz0+.2,sx0=ix0+.3,SEND=sx0+N*run;
 const ecx=ix1-1.7,ez0=iz0+.3,ez1=ez0+2.4;
 const EN=Math.ceil(st/.2),erun=.35,erise=st/EN,ex0=ix0+.6,EL=EN*erun;
 const lane=f=>(f%2===0)?[a0,a0+1.4]:[a0+1.4,a0+2.8];
 // floor slabs (with holes for stairs, elevator, escalators)
 for(let k=1;k<=S;k++){
  const holes=[];const f=k-1;if(f<nF){const l=lane(f);holes.push([sx0,SEND,l[0],l[1]]);}
  if(k<S)holes.push([ecx-1.2,ecx+1.2,ez0,ez1]);
  if(b.esc&&k===1)holes.push([ex0,ex0+EL,.6,3.4]);
  const xs=[ix0,ix1];holes.forEach(h=>xs.push(Math.max(ix0,h[0]),Math.min(ix1,h[1])));xs.sort((a,c)=>a-c);
  for(let i=0;i<xs.length-1;i++){const xa=xs[i],xb=xs[i+1];if(xb-xa<1e-4)continue;const xm=(xa+xb)/2;
   const hs=holes.filter(h=>xm>h[0]&&xm<h[1]).map(h=>[Math.max(iz0,h[2]),Math.min(iz1,h[3])]).sort((a,c)=>a[0]-c[0]);
   let z=iz0;for(const h of hs){if(h[0]>z+1e-4)LB(k===S?'roof':'floor',xa,xb,lvl(k)-.3,lvl(k),z,h[0],1);z=Math.max(z,h[1]);}
   if(iz1>z+1e-4)LB(k===S?'roof':'floor',xa,xb,lvl(k)-.3,lvl(k),z,iz1,1);}
  // ceiling lights under this slab
  if(k<=S)for(const [px,pz] of [[-Wl/4,-Dl/4+1],[Wl/4,-Dl/4+1],[-Wl/4,Dl/4],[Wl/4,Dl/4]]){
   if(holes.some(h=>px>h[0]-.8&&px<h[1]+.8&&pz>h[2]-.8&&pz<h[3]+.8))continue;
   LB('light',px-.45,px+.45,lvl(k)-.36,lvl(k)-.3,pz-.45,pz+.45,0);}
 }
 if(y0===0)LB('tile',ix0,ix1,.08,.1,iz0,iz1,0);
 // stairs (switchback lanes, every floor to the roof where allowed)
 for(let f=0;f<nF;f++){const base=lvl(f),l=lane(f),dir=(f%2===0)?1:-1;
  for(let i=0;i<N;i++){const xa=dir>0?sx0+i*run:sx0+(N-1-i)*run;LB('stair',xa,xa+run,base,base+(i+1)*rise,l[0],l[1],1);}const sr=bb(sx0,SEND,l[0],l[1]);STAIRS.push({x0:sr[0],x1:sr[1],z0:sr[2],z1:sr[3],y0:base,y1:base+st,dx:rx*dir,dz:rz*dir});}
 // partitions (rooms) on upper floors, reception desk on the ground floor
 const dc=Wl*.12;
 for(let k=1;k<S;k++){if(b.esc&&k===1)continue;const ya=lvl(k),yb=lvl(k+1)-.3;
  LB('wall',ix0,dc-1.1,ya,yb,.5,.7,1);LB('wall',dc+1.1,ix1,ya,yb,.5,.7,1);LB('wall',dc-1.1,dc+1.1,ya+2.4,yb,.5,.7,1);}
 if(y0===0||b.k==='lp')LB('desk',Wl*.22-1.3,Wl*.22+1.3,y0+.1,y0+1.0,Dl/2-3.8,Dl/2-2.8,1);
 // roof parapet
 if(b.ra){const ya=lvl(S),yb=ya+1.1;LB('roof',-Wl/2,Wl/2,ya,yb,-Dl/2,-Dl/2+.3,1);LB('roof',-Wl/2,Wl/2,ya,yb,Dl/2-.3,Dl/2,1);LB('roof',-Wl/2,-Wl/2+.3,ya,yb,-Dl/2+.3,Dl/2-.3,1);LB('roof',Wl/2-.3,Wl/2,ya,yb,-Dl/2+.3,Dl/2-.3,1);}
 // escalators (up lane + down lane) between ground and floor 1
 if(b.esc){[[.6,2.0,1],[2.0,3.4,-1]].forEach(([za,zb,dir])=>{
   for(let s=0;s<EN;s++){const xa=ex0+s*erun,top=lvl(0)+(s+1)*erise;LB('esc',xa,xa+erun,lvl(0),top,za,zb,1);LB('escl',xa,xa+.06,top,top+.02,za+.05,zb-.05,0);}
   const r=bb(ex0,ex0+EL,za,zb);ESCS.push({x0:r[0],x1:r[1],z0:r[2],z1:r[3],dx:rx*dir,dz:rz*dir,ylo:lvl(0)+.1,yhi:lvl(1)+.6});});}
 // elevator: shaft walls, hall-door gaps, moving car
 const top=lvl(S)-.3,g0=lvl(0),lv=[];for(let k=0;k<S;k++)lv.push(lvl(k));
 LB('shaft',ecx-1.45,ecx+1.45,g0,top,ez0-.25,ez0,1);LB('shaft',ecx-1.45,ecx-1.2,g0,top,ez0,ez1+.25,1);LB('shaft',ecx+1.2,ecx+1.45,g0,top,ez0,ez1+.25,1);
 LB('shaft',ecx-1.2,ecx-.7,g0,top,ez1,ez1+.25,1);LB('shaft',ecx+.7,ecx+1.2,g0,top,ez1,ez1+.25,1);
 const halls=[];
 for(let k=0;k<S;k++){const yb=(k<S-1)?lvl(k+1):top;LB('shaft',ecx-.7,ecx+.7,lvl(k)+2.3,yb,ez1,ez1+.25,1);
  const r=bb(ecx-.7,ecx+.7,ez1,ez1+.25);const hb={a:r[0],b:r[1],c:lvl(k),d:lvl(k)+2.3,e:r[2],f:r[3],off:false};boxes.push(hb);halls.push(hb);
  HALLS.push({r,y:lvl(k)+1.15,h:2.3,hb,e:null,k});}
 const inr=bb(ecx-1.1,ecx+1.1,ez0+.1,ez1-.1),grp=new THREE.Group();
 grp.add(meshRect(inr,g0-.12,g0,carMat),meshRect(inr,g0+2.3,g0+2.4,carMat),meshRect(bb(ecx-.5,ecx+.5,ez0+.4,ez1-.4),g0+2.25,g0+2.3,carLight),
  meshRect(bb(ecx-1.1,ecx+1.1,ez0+.1,ez0+.16),g0,g0+2.3,carMat),meshRect(bb(ecx-1.1,ecx-1.04,ez0+.1,ez1-.1),g0,g0+2.3,carMat),meshRect(bb(ecx+1.04,ecx+1.1,ez0+.1,ez1-.1),g0,g0+2.3,carMat));
 grp.traverse(o=>{if(o.isMesh)o.castShadow=false;});scene.add(grp);
 const pr=bb(ecx-1.15,ecx+1.15,ez0+.05,ez1-.05),box={a:pr[0],b:pr[1],c:g0-.15,d:g0,e:pr[2],f:pr[3],dyn:true,vy:0};DYN.push(box);
 const fp=L(ecx,ez1+1.0),el={b,x0:inr[0],x1:inr[1],z0:inr[2],z1:inr[3],fx:fp[0],fz:fp[1],lv,y:g0,ty:g0,idx:0,open:0,vy:0,spd:5,group:grp,box,halls,g0};ELEV.push(el);
 HALLS.forEach(h=>{if(!h.e)h.e=el;});
 // entrance sliding glass doors
 const dp=L(0,Dl/2-T/2),dg=new THREE.Group();dg.position.set(dp[0],y0,dp[1]);dg.rotation.y=Math.atan2(fx,fz);
 const pl=new THREE.Mesh(new THREE.BoxGeometry(b.dw/2,2.8,.08),doorGlass),prr=new THREE.Mesh(new THREE.BoxGeometry(b.dw/2,2.8,.08),doorGlass);pl.position.set(-b.dw/4,1.4,0);prr.position.set(b.dw/4,1.4,0);dg.add(pl,prr);scene.add(dg);
 DOORS.push({x:dp[0],z:dp[1],y:y0,dw:b.dw,pl,pr:prr,open:0});
}
function setHalls(e){e.halls.forEach((h,k)=>{h.off=(e.open===k);});HALLS.forEach(h=>{if(h.e===e){const o=(e.open===h.k);const m=new THREE.Matrix4();
  const al=Math.abs(e.b.fz)>.5,sx=al?1.4:.25,sz=al?.25:1.4;m.makeScale(o?0.001:sx,o?0.001:2.3,o?0.001:sz);m.setPosition((h.r[0]+h.r[1])/2,h.y,(h.r[2]+h.r[3])/2);HALLI.setMatrixAt(h.id,m);}});HALLI.instanceMatrix.needsUpdate=true;}
function buildAllInteriors(){
 CD.bld.forEach((b,i)=>buildInterior(b,i));
 for(const k in IB){const g=IB[k];if(!g.p.length)continue;const m=IBM[k];
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(g.p,3));geo.setIndex(g.i);
  const ng=geo.toNonIndexed();ng.computeVertexNormals();
  const mt=m.basic?new THREE.MeshBasicMaterial({color:new THREE.Color(m.c[0],m.c[1],m.c[2])}):new THREE.MeshStandardMaterial({color:new THREE.Color(m.c[0],m.c[1],m.c[2]),roughness:m.r,metalness:m.m});
  const ms=new THREE.Mesh(ng,mt);if(!m.basic&&window.INTM)INTM.push(mt);if(k==='light')window.ILMAT=mt;ms.castShadow=true;ms.receiveShadow=true;scene.add(ms);solids.push(ms);}
 window.HALLI=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),hallMat,HALLS.length);scene.add(HALLI);
 HALLS.forEach((h,i)=>{h.id=i;});ELEV.forEach(e=>setHalls(e));
 if(window.NYDoors)try{NYDoors();}catch(e){console.error('NYDoors',e);}
 boxes.forEach(gridAdd);gridReady=true;
}
function elevStep(e,dt){const d=e.ty-e.y;
 if(Math.abs(d)>.002){const v=Math.min(e.spd*dt,Math.abs(d))*Math.sign(d);e.y+=v;e.vy=dt>0?v/dt:0;if(e.open!==-1){e.open=-1;setHalls(e);}}
 else if(e.vy!==0||e.open===-1){e.vy=0;e.y=e.ty;e.open=e.idx;setHalls(e);}
 e.group.position.y=e.y-e.g0;e.box.c=e.y-.15;e.box.d=e.y;e.box.vy=e.vy;}
function nearElev(){const px=p.x,pz=p.z;
 for(const e of ELEV)if(px>e.x0&&px<e.x1&&pz>e.z0&&pz<e.z1&&p.y>e.y-.5&&p.y<e.y+2.6)return{e,inside:true};
 for(const e of ELEV){const dx=px-e.fx,dz=pz-e.fz;if(dx*dx+dz*dz<9){const k=Math.round((p.y-e.b.y0)/e.b.st);if(k>=0&&k<e.lv.length&&Math.abs(p.y-e.lv[k])<1.2)return{e,inside:false,k};}}
 return null;}
function useF(){if(inCar){toggleCar();return;}const n=nearElev();if(n){const e=n.e;if(n.inside)e.idx=Math.min(e.lv.length-1,e.idx+1);else{e.idx=n.k;playOnce('open');}e.ty=e.lv[e.idx];return;}toggleCar();}
function elevDown(){const n=nearElev();if(n&&n.inside){const e=n.e;e.idx=Math.max(0,e.idx-1);e.ty=e.lv[e.idx];}}
const inLight=new THREE.PointLight(0xfff1d6,0,18);scene.add(inLight);
function interiorTick(dt){
 try{if(window.NYDoorTick)NYDoorTick();}catch(e){}
 for(const e of ELEV)elevStep(e,dt);
 if(!locked)return;
 const px=inCar?inCar.x:p.x,pz=inCar?inCar.z:p.z;
 for(const d of DOORS){const dd=Math.hypot(px-d.x,pz-d.z);if(dd>45)continue;const t=d.manual?(d.want||0):((dd<6.5&&Math.abs(p.y-d.y)<3)?1:0);d.open+=(t-d.open)*Math.min(1,dt*(d.manual?3:6));if(d.manual){d.swing(d.open);continue;}const o=(d.dw/2+.1)*d.open;d.pl.position.x=-d.dw/4-o;d.pr.position.x=d.dw/4+o;}
 if(!inCar)for(const s of ESCS)if(p.x>s.x0&&p.x<s.x1&&p.z>s.z0&&p.z<s.z1&&p.y>s.ylo&&p.y<s.yhi)movePlayer(s.dx*1.1*dt,s.dz*1.1*dt,0);
 let ins=false;if(!inCar)for(const b of CD.bld)if(Math.abs(p.x-b.x)<b.w/2&&Math.abs(p.z-b.z)<b.d/2&&p.y>=b.y0-.5&&p.y<b.y0+b.h-.5){ins=true;break;}
 inLight.intensity=ins?1.1:0;if(ins)inLight.position.set(p.x,p.y+2.3,p.z);
}

buildAllInteriors();
addEventListener('keydown',e=>{if(e.code==='KeyQ'&&locked)elevDown();});
$('dir').innerHTML=CD.bld.map((b,i)=>`<div class="dr"><span>#${i+1}</span><b>${b.n}</b><small>${b.s} floors${b.esc?' / escalators':''} / elevator</small></div>`).join('');

/* ===== Survival and combat: stamina, crouch, punch, hit reactions, knock down, swim, emotes ===== */
const XS={lx:0,lz:0,dbg:null,hp:100,st:100,tired:false,crouch:false,sprint:false,lock:'',swim:false,once:null,fallV:0,carCd:0,lastYaw:0,emote:0};
const POOL={x0:125,x1:175,z0:-20,z1:20};
{const pl=new THREE.Mesh(new THREE.PlaneGeometry(50,40),new THREE.MeshStandardMaterial({color:0x2b8fc7,transparent:true,opacity:.72,roughness:.08,metalness:.25,depthWrite:false}));pl.rotation.x=-Math.PI/2;pl.position.set(150,.3,0);scene.add(pl);
 const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');x.fillStyle='rgba(8,12,18,.85)';x.fillRect(0,0,512,128);x.fillStyle='#ff7a30';x.fillRect(0,0,10,128);
 x.fillStyle='#ffffff';x.font='bold 46px Arial';x.fillText('EKO MARINA POOL',26,60);x.fillStyle='#cfd6dd';x.font='30px Arial';x.fillText('Walk in to swim',26,104);
 const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true}));sp.scale.set(16,4,1);sp.position.set(150,6,-24);scene.add(sp);}
function playOnce(name,speed){if(!xb.A||!xb.A[name])return false;const a=xb.A[name];a.timeScale=speed||1;xb.once={a,until:performance.now()+(a.getClip().duration*1000)/(speed||1)};return true;}
function xbotUpdate(dt,sp){if(!xb.mixer)return;const A=xb.A,now=performance.now();
 const yawRate=(XS.lastYaw-p.yaw)/Math.max(dt,1e-3);XS.lastYaw=p.yaw;xb.air=p.ground?0:xb.air+dt;
 if(xb.once&&now>=xb.once.until)xb.once=null;
 const mv=sp>.5;let want=null,ts=1;
 const vx=(p.x-XS.lx)/Math.max(dt,1e-3),vz=(p.z-XS.lz)/Math.max(dt,1e-3);XS.lx=p.x;XS.lz=p.z;
 let stair=null,along=0;
 if(mv&&xb.air<.6)for(const s of STAIRS){if(p.x>s.x0-.2&&p.x<s.x1+.2&&p.z>s.z0-.2&&p.z<s.z1+.2&&p.y>s.y0-.1&&p.y<s.y1+.3){stair=s;along=vx*s.dx+vz*s.dz;break;}}
 XS.dbg=[!!stair,along];
 if(xb.once){want=xb.once.a;ts=want.timeScale||1;}
 else if(XS.lock==='fall'&&A.fall){want=A.fall;ts=FALLK.rate;}
 else if(XS.lock&&A.idle)want=A.idle;
 else if(A.climb&&p.climbing)want=A.climb;
 else if(XS.swim&&A.swim){want=A.swim;ts=mv?Math.min(2,sp/1.6+.4):.5;}
 else if(stair&&along>.3&&(A.up||A.runup)){want=(XS.sprint&&A.runup)?A.runup:(A.up||A.runup);ts=Math.min(2.5,sp/(want===A.runup?4.5:1.5));}
 else if(stair&&along<-.3&&A.down){want=A.down;ts=Math.min(2.5,sp/1.6);}
 else if(A.fall&&!p.ground&&p.vy<-12&&xb.air>.12&&!stair&&!XS.swim){want=A.fall;ts=1;}
 else if(A.jump&&xb.air>.12&&!stair)want=A.jump;
 else if(mv&&XS.crouch&&A.crouch){want=A.crouch;ts=Math.min(2.5,sp/2.2);}
 else if(mv&&XS.tired&&A.tired)want=A.tired;
 else if(mv&&XS.sprint&&A.run){want=A.run;ts=Math.min(2,sp/5.2);}
 else if(mv){want=A.walk;ts=Math.min(3,sp/1.4);}
 else if(XS.crouch&&A.crouch){want=A.crouch;ts=0;}
 else if(A.turn&&yawRate>1.3&&p.ground){want=A.turn;ts=1.4;}
 else want=A.idle||A.walk;
 if(!want)return;
 if(xb.cur!==want){if(xb.cur)xb.cur.fadeOut(.2);want.reset().setEffectiveTimeScale(ts).setEffectiveWeight(1).fadeIn(.15).play();if(want===A.fall)want.time=FALLK.t0;xb.cur=want;}else want.timeScale=ts;
 if(want===A.fall&&XS.lock!=='fall'&&want.time>FALLK.hold){want.time=FALLK.hold;want.timeScale=0;}
 xb.mixer.update(dt);}
function speedMul(dt,mv){if(XS.lock)return 0;let m=1;
 const want=keys.ShiftLeft&&mv&&!XS.crouch&&!XS.swim;
 if(want&&!XS.tired&&XS.st>0){m=1.6;XS.st=Math.max(0,XS.st-22*dt);if(XS.st<=0)XS.tired=true;}
 else{XS.st=Math.min(100,XS.st+(mv?8:20)*dt);if(XS.tired&&XS.st>35)XS.tired=false;if(XS.tired&&mv)m=.75;}
 if(XS.crouch)m=.5;if(XS.swim)m=.45;XS.sprint=(m===1.6);return m;}
function knockDown(){if(XS.lock)return;XS.lock='down';XS.hp=0;xb.once=null;chr.rotation.x=-Math.PI/2;toast('KNOCKED DOWN');
 setTimeout(()=>{chr.rotation.x=0;playOnce('stand');const d=(xb.A&&xb.A.stand)?xb.A.stand.getClip().duration*1000:2500;XS.lock='up';setTimeout(()=>{XS.lock='';XS.hp=60;},d);},2200);}
const FALLK={t0:3.7,hold:4.8,end:8.8,rate:1.5};
function fallImpact(){const a=xb.A&&xb.A.fall;if(!a)return false;xb.once=null;XS.lock='fall';const t=Math.max(a.time,FALLK.t0),ms=Math.max(900,(FALLK.end-t)/FALLK.rate*1000);
 setTimeout(()=>{if(XS.lock==='fall')XS.lock='';},ms);return true;}
function hurt(n,kind){if(XS.lock||!locked)return;XS.hp=Math.max(0,XS.hp-n);if(XS.hp<=0){knockDown();return;}
 if(kind==='fall'&&fallImpact()){toast('Hard landing!');return;}playOnce(kind==='car'?'hit2':'hit1');toast(kind==='fall'?'Hard landing!':kind==='car'?'Hit by a car!':'Ouch!');}
function doPunch(){if(!locked||inCar||XS.lock||XS.once)return;if(!playOnce('punch',1.3))return;
 setTimeout(()=>{const fx=-Math.sin(p.yaw),fz=-Math.cos(p.yaw);for(const d of dummies){const dx=d.position.x-p.x,dz=d.position.z-p.z,dist=Math.hypot(dx,dz);
  if(dist<2.6&&(dx*fx+dz*fz)/(dist||1)>.4){d.userData.hp-=34;d.material.color.set(0xffffff);setTimeout(()=>d.material.color.set(0xff6a3d),60);if(d.userData.hp<=0){kills++;spawnDummy(d);}crossEl.classList.add('hit');setTimeout(()=>crossEl.classList.remove('hit'),90);}}},300);}
function toggleCrouch(){if(!locked||inCar||XS.lock)return;XS.crouch=!XS.crouch;toast(XS.crouch?'Crouching':'Standing');}
const EMO=['golf','moving','open','prone'],EMON=['Golf swing','Moving an object','Opening','Prone turn'];
function emote(i){if(!locked||inCar||XS.lock||XS.once)return;if(playOnce(EMO[i]))toast('Emote: '+EMON[i]);else toast('Animation not loaded');}
function nextEmote(){emote(XS.emote++%4);}
function survivalTick(dt){
 if(!locked||inCar)return;const now=performance.now();
 if(!p.ground)XS.fallV=Math.min(XS.fallV,p.vy);else{if(XS.fallV<-14&&!XS.swim&&!p.plat)hurt(Math.min(70,(-XS.fallV-14)*5),'fall');XS.fallV=0;}
 for(const c of cars){if(Math.abs(c.speed)>5&&Math.hypot(c.x-p.x,c.z-p.z)<2.4&&Math.abs(p.y-0)<2&&now>XS.carCd){XS.carCd=now+1500;const dx=p.x-c.x,dz=p.z-c.z,d=Math.hypot(dx,dz)||1;movePlayer(dx/d*1.5,dz/d*1.5,0);hurt(Math.min(60,Math.abs(c.speed)*2.2),'car');}}
 XS.swim=p.x>POOL.x0&&p.x<POOL.x1&&p.z>POOL.z0&&p.z<POOL.z1&&p.y<1;
 chr.position.y=XS.swim?-.25:0;
 if(!XS.lock&&XS.hp<100)XS.hp=Math.min(100,XS.hp+1.5*dt);}
addEventListener('keydown',e=>{if(!locked)return;if(e.code==='KeyG')doPunch();else if(e.code==='KeyX')toggleCrouch();else if(e.code==='Digit1')emote(0);else if(e.code==='Digit2')emote(1);else if(e.code==='Digit3')emote(2);else if(e.code==='Digit4')emote(3);});


/* ===== NEWSGLOBAL tower: uploaded GLB rebuilt for the game. The old lettering is gone; NEWSGLOBAL is built in 3D on the front face ===== */
const NGX=-150,NGZ=0,NGF=0.0115,NGCX=-123.5,NGCY=-36.5;
const NGT=new THREE.Group();NGT.position.set(NGX,0,NGZ);scene.add(NGT);
const NGMATS=[];
const NGLETTERS=[{"o":[[-0.5,-0.04442],[-0.5,-0.03722],[-0.48864,-0.03722],[-0.48864,0.03721],[-0.5,0.03721],[-0.5,0.0444],[-0.47221,0.0444],[-0.41862,-0.01847],[-0.41862,0.03721],[-0.42991,0.03721],[-0.42991,0.0444],[-0.39886,0.0444],[-0.39886,0.03721],[-0.41023,0.03721],[-0.41023,-0.04442],[-0.42582,-0.04442],[-0.48024,0.01977],[-0.48024,-0.03722],[-0.46893,-0.03722],[-0.46893,-0.04442]],"h":[]},{"o":[[-0.38828,-0.04442],[-0.38828,-0.03722],[-0.37691,-0.03722],[-0.37691,0.03721],[-0.38828,0.03721],[-0.38828,0.0444],[-0.30844,0.0444],[-0.30844,0.02346],[-0.31665,0.02346],[-0.31665,0.03626],[-0.35401,0.03626],[-0.35401,0.00776],[-0.33075,0.00776],[-0.33075,0.01905],[-0.3226,0.01905],[-0.3226,-0.01164],[-0.33075,-0.01164],[-0.33075,-0.00033],[-0.35401,-0.00033],[-0.35401,-0.03627],[-0.31552,-0.03627],[-0.31552,-0.02348],[-0.30737,-0.02348],[-0.30737,-0.04442]],"h":[]},{"o":[[-0.19733,-0.04442],[-0.21267,-0.04442],[-0.23277,0.02025],[-0.25289,-0.04442],[-0.26824,-0.04442],[-0.29357,0.03721],[-0.3022,0.03721],[-0.3022,0.0444],[-0.26009,0.0444],[-0.26009,0.03721],[-0.26961,0.03721],[-0.25265,-0.01735],[-0.2335,0.0444],[-0.21659,0.0444],[-0.19708,-0.01836],[-0.17978,0.03721],[-0.19036,0.03721],[-0.19036,0.0444],[-0.16287,0.0444],[-0.16287,0.03721],[-0.17199,0.03721]],"h":[]},{"o":[[-0.1549,-0.04014],[-0.1549,-0.01908],[-0.14734,-0.01908],[-0.14684,-0.0215],[-0.14619,-0.02376],[-0.14539,-0.02587],[-0.14445,-0.02781],[-0.14336,-0.0296],[-0.14212,-0.03123],[-0.14074,-0.0327],[-0.13921,-0.03401],[-0.13752,-0.03516],[-0.13569,-0.03616],[-0.13369,-0.03701],[-0.13154,-0.0377],[-0.12924,-0.03824],[-0.12679,-0.03863],[-0.12418,-0.03886],[-0.12141,-0.03894],[-0.11917,-0.03888],[-0.11707,-0.03872],[-0.11511,-0.03844],[-0.11328,-0.03806],[-0.1116,-0.03757],[-0.11005,-0.03697],[-0.10864,-0.03626],[-0.10736,-0.03543],[-0.10623,-0.03451],[-0.10526,-0.03348],[-0.10443,-0.03234],[-0.10375,-0.03111],[-0.10322,-0.02977],[-0.10285,-0.02833],[-0.10262,-0.02678],[-0.10255,-0.02514],[-0.1026,-0.02384],[-0.10275,-0.02261],[-0.10301,-0.02146],[-0.10337,-0.02038],[-0.10383,-0.01938],[-0.10439,-0.01845],[-0.10505,-0.0176],[-0.10582,-0.01682],[-0.10675,-0.01608],[-0.10789,-0.01536],[-0.10925,-0.01465],[-0.11083,-0.01395],[-0.11263,-0.01326],[-0.11464,-0.01259],[-0.11687,-0.01193],[-0.11932,-0.01128],[-0.13264,-0.008],[-0.13578,-0.00713],[-0.13868,-0.00618],[-0.14133,-0.00514],[-0.14375,-0.00403],[-0.14592,-0.00284],[-0.14784,-0.00156],[-0.14953,-0.00021],[-0.15097,0.00123],[-0.15221,0.00279],[-0.15329,0.0045],[-0.1542,0.00638],[-0.15494,0.00841],[-0.15552,0.01059],[-0.15594,0.01294],[-0.15618,0.01544],[-0.15627,0.01809],[-0.15613,0.02131],[-0.15572,0.02433],[-0.15503,0.02718],[-0.15407,0.02984],[-0.15284,0.03232],[-0.15133,0.03461],[-0.14955,0.03673],[-0.14749,0.03865],[-0.14519,0.04038],[-0.14266,0.04187],[-0.13992,0.04313],[-0.13695,0.04416],[-0.13377,0.04497],[-0.13037,0.04554],[-0.12674,0.04589],[-0.1229,0.046],[-0.12094,0.04598],[-0.11896,0.04592],[-0.11697,0.04582],[-0.11495,0.04567],[-0.11292,0.04549],[-0.11086,0.04526],[-0.10879,0.045],[-0.1067,0.04469],[-0.10458,0.04434],[-0.10244,0.04396],[-0.10029,0.04353],[-0.09811,0.04306],[-0.09592,0.04255],[-0.0937,0.042],[-0.09147,0.0414],[-0.08922,0.04077],[-0.08922,0.02114],[-0.09678,0.02114],[-0.09728,0.02335],[-0.0979,0.02541],[-0.09865,0.02732],[-0.09953,0.02907],[-0.10054,0.03067],[-0.10168,0.03211],[-0.10294,0.0334],[-0.10434,0.03454],[-0.10587,0.03554],[-0.10756,0.03641],[-0.1094,0.03714],[-0.1114,0.03774],[-0.11355,0.03821],[-0.11586,0.03854],[-0.11832,0.03874],[-0.12094,0.03881],[-0.12307,0.03876],[-0.12506,0.03861],[-0.12693,0.03838],[-0.12865,0.03804],[-0.13025,0.03761],[-0.13171,0.03708],[-0.13303,0.03646],[-0.13422,0.03574],[-0.13528,0.03493],[-0.13619,0.03402],[-0.13696,0.03302],[-0.13759,0.03192],[-0.13808,0.03074],[-0.13843,0.02945],[-0.13865,0.02808],[-0.13872,0.0266],[-0.13867,0.02526],[-0.13852,0.02401],[-0.13828,0.02283],[-0.13794,0.02174],[-0.13751,0.02073],[-0.13698,0.0198],[-0.13635,0.01895],[-0.13563,0.01819],[-0.13472,0.01747],[-0.13352,0.01674],[-0.13204,0.016],[-0.13029,0.01526],[-0.12825,0.01451],[-0.12593,0.01375],[-0.12334,0.01298],[-0.12046,0.01221],[-0.10713,0.00894],[-0.10415,0.00811],[-0.10137,0.00718],[-0.09881,0.00614],[-0.09647,0.00499],[-0.09433,0.00373],[-0.09241,0.00236],[-0.0907,0.00089],[-0.0892,-0.00069],[-0.0879,-0.00241],[-0.08676,-0.00428],[-0.0858,-0.0063],[-0.08502,-0.00847],[-0.08441,-0.01081],[-0.08397,-0.01329],[-0.08371,-0.01593],[-0.08363,-0.01872],[-0.08377,-0.02198],[-0.08421,-0.02504],[-0.08493,-0.0279],[-0.08595,-0.03055],[-0.08725,-0.03301],[-0.08885,-0.03526],[-0.09074,-0.03731],[-0.09291,-0.03917],[-0.09537,-0.0408],[-0.0981,-0.04222],[-0.1011,-0.04342],[-0.10437,-0.04441],[-0.10792,-0.04517],[-0.11175,-0.04572],[-0.11584,-0.04604],[-0.12021,-0.04615],[-0.12239,-0.04613],[-0.12455,-0.04606],[-0.12672,-0.04594],[-0.12888,-0.04578],[-0.13103,-0.04556],[-0.13319,-0.04531],[-0.13533,-0.045],[-0.13748,-0.04465],[-0.13962,-0.04425],[-0.14178,-0.04381],[-0.14394,-0.04332],[-0.14612,-0.04278],[-0.1483,-0.04219],[-0.15049,-0.04155],[-0.15269,-0.04087]],"h":[]},{"o":[[0.0075,0.0165],[0.00678,0.01934],[0.00594,0.02198],[0.005,0.02442],[0.00394,0.02665],[0.00276,0.02867],[0.00148,0.0305],[8e-05,0.03212],[-0.00143,0.03353],[-0.00307,0.03477],[-0.00487,0.03584],[-0.00683,0.03675],[-0.00895,0.03749],[-0.01123,0.03806],[-0.01367,0.03848],[-0.01627,0.03872],[-0.01904,0.03881],[-0.02237,0.03866],[-0.02548,0.03822],[-0.02835,0.03749],[-0.031,0.03646],[-0.03342,0.03515],[-0.0356,0.03354],[-0.03756,0.03164],[-0.03929,0.02944],[-0.0408,0.02693],[-0.04211,0.02408],[-0.04322,0.0209],[-0.04413,0.01737],[-0.04484,0.01351],[-0.04534,0.00931],[-0.04564,0.00477],[-0.04574,-0.0001],[-0.04565,-0.00494],[-0.04536,-0.00944],[-0.04487,-0.01361],[-0.0442,-0.01745],[-0.04333,-0.02096],[-0.04226,-0.02414],[-0.04101,-0.02699],[-0.03956,-0.02951],[-0.0379,-0.03172],[-0.03603,-0.03364],[-0.03395,-0.03526],[-0.03164,-0.03658],[-0.02912,-0.03761],[-0.02639,-0.03835],[-0.02344,-0.03879],[-0.02027,-0.03894],[-0.01904,-0.03892],[-0.01782,-0.03887],[-0.01663,-0.03878],[-0.01546,-0.03866],[-0.01431,-0.0385],[-0.01319,-0.03831],[-0.01208,-0.03808],[-0.011,-0.03781],[-0.00994,-0.03752],[-0.00891,-0.03718],[-0.0079,-0.03681],[-0.00691,-0.03641],[-0.00595,-0.03596],[-0.00501,-0.03549],[-0.00409,-0.03497],[-0.0032,-0.03443],[-0.0032,-0.01004],[-0.01392,-0.01004],[-0.01392,-0.0029],[0.01808,-0.0029],[0.01808,-0.03698],[0.01559,-0.0381],[0.01309,-0.03915],[0.01059,-0.04013],[0.0081,-0.04103],[0.00561,-0.04185],[0.00311,-0.04261],[0.00062,-0.04328],[-0.00187,-0.04389],[-0.00436,-0.04442],[-0.00687,-0.04488],[-0.0094,-0.04527],[-0.01194,-0.04559],[-0.01449,-0.04583],[-0.01706,-0.04601],[-0.01964,-0.04612],[-0.02223,-0.04615],[-0.02779,-0.04596],[-0.03304,-0.04538],[-0.03799,-0.04442],[-0.04263,-0.04307],[-0.04697,-0.04134],[-0.051,-0.03922],[-0.05472,-0.03672],[-0.05814,-0.03384],[-0.0612,-0.03061],[-0.06385,-0.02711],[-0.06609,-0.02332],[-0.06793,-0.01924],[-0.06936,-0.01489],[-0.07038,-0.01024],[-0.07099,-0.00532],[-0.07119,-0.0001],[-0.07099,0.00512],[-0.07038,0.01006],[-0.06936,0.01471],[-0.06793,0.01908],[-0.06609,0.02316],[-0.06385,0.02695],[-0.0612,0.03046],[-0.05814,0.03369],[-0.05472,0.03657],[-0.051,0.03907],[-0.04697,0.04119],[-0.04263,0.04292],[-0.03799,0.04427],[-0.03304,0.04523],[-0.02779,0.04581],[-0.02223,0.046],[-0.01986,0.04597],[-0.01749,0.04588],[-0.01514,0.04573],[-0.01279,0.04553],[-0.01046,0.04526],[-0.00813,0.04493],[-0.00581,0.04454],[-0.0035,0.0441],[-0.0012,0.04359],[0.00111,0.04302],[0.00343,0.04239],[0.00574,0.0417],[0.00807,0.04095],[0.01039,0.04014],[0.01272,0.03927],[0.01506,0.03833],[0.01506,0.0165]],"h":[]},{"o":[[0.03345,-0.04442],[0.03345,-0.03722],[0.04481,-0.03722],[0.04481,0.03721],[0.03345,0.03721],[0.03345,0.0444],[0.07913,0.0444],[0.07913,0.03721],[0.06771,0.03721],[0.06771,-0.03627],[0.1027,-0.03627],[0.1027,-0.02222],[0.11071,-0.02222],[0.11071,-0.04442]],"h":[]},{"o":[[0.16639,-0.04615],[0.16094,-0.04596],[0.15579,-0.04539],[0.15094,-0.04443],[0.14639,-0.04309],[0.14215,-0.04136],[0.13821,-0.03926],[0.13457,-0.03677],[0.13123,-0.03389],[0.12825,-0.03068],[0.12567,-0.02718],[0.12349,-0.02339],[0.1217,-0.01932],[0.12031,-0.01495],[0.11931,-0.01029],[0.11872,-0.00534],[0.11852,-0.0001],[0.11872,0.00513],[0.11932,0.01008],[0.12031,0.01474],[0.12171,0.01911],[0.1235,0.02319],[0.12569,0.02699],[0.12828,0.03049],[0.13127,0.0337],[0.13461,0.03659],[0.13825,0.03908],[0.14219,0.0412],[0.14643,0.04293],[0.15097,0.04427],[0.15581,0.04523],[0.16095,0.04581],[0.16639,0.046],[0.17185,0.04581],[0.17701,0.04524],[0.18186,0.04428],[0.18641,0.04294],[0.19065,0.04121],[0.19459,0.03911],[0.19822,0.03662],[0.20155,0.03374],[0.20454,0.03054],[0.20712,0.02704],[0.20931,0.02325],[0.2111,0.01916],[0.2125,0.01478],[0.21349,0.01011],[0.21409,0.00515],[0.21429,-0.0001],[0.21409,-0.00534],[0.21349,-0.01029],[0.21249,-0.01495],[0.2111,-0.01932],[0.2093,-0.02339],[0.2071,-0.02718],[0.20451,-0.03068],[0.20152,-0.03389],[0.19818,-0.03677],[0.19454,-0.03926],[0.1906,-0.04136],[0.18636,-0.04309],[0.18182,-0.04443],[0.17698,-0.04539],[0.17184,-0.04596]],"h":[[[0.16639,-0.03894],[0.16914,-0.03879],[0.17171,-0.03834],[0.1741,-0.03759],[0.1763,-0.03654],[0.17832,-0.0352],[0.18016,-0.03355],[0.18182,-0.03161],[0.1833,-0.02936],[0.1846,-0.02681],[0.18572,-0.02394],[0.18667,-0.02076],[0.18745,-0.01726],[0.18806,-0.01344],[0.18849,-0.00931],[0.18875,-0.00487],[0.18884,-0.0001],[0.18875,0.00468],[0.18849,0.00914],[0.18806,0.01328],[0.18745,0.01711],[0.18667,0.02062],[0.18572,0.02381],[0.1846,0.02668],[0.1833,0.02923],[0.18182,0.03148],[0.18016,0.03342],[0.17832,0.03507],[0.1763,0.03641],[0.1741,0.03746],[0.17171,0.03821],[0.16914,0.03866],[0.16639,0.03881],[0.16366,0.03865],[0.16111,0.0382],[0.15873,0.03745],[0.15653,0.03639],[0.15451,0.03503],[0.15267,0.03337],[0.15101,0.0314],[0.14953,0.02914],[0.14823,0.02656],[0.1471,0.02368],[0.14614,0.02049],[0.14536,0.01699],[0.14475,0.01318],[0.14432,0.00906],[0.14406,0.00463],[0.14397,-0.0001],[0.14406,-0.00483],[0.14432,-0.00924],[0.14475,-0.01335],[0.14536,-0.01716],[0.14614,-0.02065],[0.1471,-0.02384],[0.14823,-0.02671],[0.14953,-0.02929],[0.15101,-0.03155],[0.15267,-0.03351],[0.15451,-0.03517],[0.15653,-0.03652],[0.15873,-0.03758],[0.16111,-0.03833],[0.16366,-0.03879]]]},{"o":[[0.22523,-0.04442],[0.22523,-0.03722],[0.2366,-0.03722],[0.2366,0.03721],[0.22523,0.03721],[0.22523,0.0444],[0.27789,0.0444],[0.28182,0.04432],[0.2855,0.04406],[0.28893,0.04363],[0.2921,0.04303],[0.29502,0.04226],[0.29769,0.04132],[0.30011,0.04021],[0.30227,0.03892],[0.30418,0.03747],[0.30584,0.03584],[0.30724,0.03404],[0.30838,0.03207],[0.30927,0.02993],[0.30991,0.02761],[0.31029,0.02512],[0.31042,0.02245],[0.31033,0.02053],[0.31007,0.0187],[0.30963,0.01698],[0.30901,0.01535],[0.30822,0.01383],[0.30725,0.01242],[0.30611,0.0111],[0.30479,0.00989],[0.3033,0.00878],[0.30164,0.00778],[0.29981,0.00689],[0.29781,0.00611],[0.29564,0.00544],[0.2933,0.00487],[0.29079,0.00441],[0.28811,0.00407],[0.29136,0.00368],[0.29441,0.00315],[0.29727,0.00247],[0.29993,0.00165],[0.3024,0.00069],[0.30467,-0.00042],[0.30675,-0.00167],[0.30863,-0.00307],[0.3103,-0.0046],[0.31175,-0.00626],[0.31298,-0.00803],[0.31398,-0.00993],[0.31477,-0.01194],[0.31532,-0.01408],[0.31566,-0.01634],[0.31577,-0.01872],[0.31561,-0.02191],[0.31515,-0.02489],[0.31437,-0.02765],[0.31328,-0.03019],[0.31187,-0.03251],[0.31016,-0.03462],[0.30813,-0.03651],[0.30579,-0.03818],[0.30313,-0.03964],[0.30011,-0.04091],[0.29674,-0.04198],[0.29302,-0.04286],[0.28895,-0.04354],[0.28452,-0.04403],[0.27974,-0.04432],[0.27461,-0.04442]],"h":[[[0.2595,0.00734],[0.26728,0.00734],[0.26976,0.0074],[0.27207,0.00757],[0.27422,0.00786],[0.2762,0.00827],[0.27801,0.00879],[0.27966,0.00943],[0.28114,0.01018],[0.28246,0.01105],[0.28362,0.01204],[0.28462,0.01316],[0.28547,0.0144],[0.28617,0.01576],[0.28671,0.01725],[0.2871,0.01886],[0.28733,0.02059],[0.28741,0.02245],[0.28733,0.02432],[0.28711,0.02605],[0.28673,0.02766],[0.28621,0.02913],[0.28553,0.03046],[0.28471,0.03167],[0.28373,0.03274],[0.28261,0.03369],[0.28132,0.03451],[0.27986,0.03523],[0.27821,0.03583],[0.27639,0.03633],[0.27438,0.03671],[0.2722,0.03699],[0.26983,0.03715],[0.26728,0.03721],[0.2595,0.03721]],[[0.2595,-0.03722],[0.26801,-0.03722],[0.27076,-0.03715],[0.27332,-0.03694],[0.2757,-0.03659],[0.2779,-0.0361],[0.27991,-0.03546],[0.28174,-0.03469],[0.28338,-0.03377],[0.28484,-0.03271],[0.28612,-0.0315],[0.28723,-0.03014],[0.28818,-0.02862],[0.28895,-0.02695],[0.28955,-0.02512],[0.28998,-0.02314],[0.29023,-0.02101],[0.29032,-0.01872],[0.29023,-0.01642],[0.28997,-0.01426],[0.28954,-0.01226],[0.28893,-0.01041],[0.28815,-0.0087],[0.2872,-0.00715],[0.28608,-0.00575],[0.28478,-0.0045],[0.28331,-0.0034],[0.28166,-0.00244],[0.27983,-0.00164],[0.27783,-0.00097],[0.27564,-0.00046],[0.27328,-9e-05],[0.27073,0.00013],[0.26801,0.0002],[0.2595,0.0002]]]},{"o":[[0.32154,-0.04442],[0.32154,-0.03722],[0.32879,-0.03722],[0.36224,0.0444],[0.37644,0.0444],[0.40994,-0.03722],[0.41839,-0.03722],[0.41839,-0.04442],[0.3768,-0.04442],[0.3768,-0.03722],[0.38548,-0.03722],[0.37817,-0.01908],[0.3448,-0.01908],[0.33736,-0.03722],[0.34796,-0.03722],[0.34796,-0.04442]],"h":[[[0.34771,-0.01189],[0.37526,-0.01189],[0.36157,0.02209]]]},{"o":[[0.42273,-0.04442],[0.42273,-0.03722],[0.4341,-0.03722],[0.4341,0.03721],[0.42273,0.03721],[0.42273,0.0444],[0.46842,0.0444],[0.46842,0.03721],[0.457,0.03721],[0.457,-0.03627],[0.49199,-0.03627],[0.49199,-0.02222],[0.5,-0.02222],[0.5,-0.04442]],"h":[]}];
try{
 const raw=fflate.unzlibSync(b64a(NGD.z,Uint8Array)),buf=raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),tl=new THREE.TextureLoader();
 const texs=NGD.tex.map(u=>{const t=tl.load(u);t.flipY=false;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t;});
 NGD.m.forEach(m=>{
  const p16=new Int16Array(buf,m.po,m.n*3),P=new Float32Array(m.n*3);for(let i=0;i<P.length;i++)P[i]=p16[i]*0.01;
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(P,3));
  geo.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(buf,m.uo,m.n*2),2));
  geo.setIndex(new THREE.BufferAttribute(new Uint16Array(buf,m.io,m.ni),1));geo.computeVertexNormals();
  const mt=new THREE.MeshStandardMaterial({map:texs[m.t],roughness:.55,metalness:.12,side:THREE.DoubleSide,emissive:new THREE.Color(1,.84,.58),emissiveMap:texs[m.t],emissiveIntensity:0});
  const ms=new THREE.Mesh(geo,mt);ms.castShadow=true;ms.frustumCulled=false;NGT.add(ms);NGMATS.push(mt);
 });
}catch(e){console.warn('NEWSGLOBAL tower skipped',e);}
// solid walls with a front entrance and a lift-door gap at every floor (tower is hollow and enterable)
{const W=(a,b,c,d,e,f,px)=>{const bb={a:NGX+a,b:NGX+b,c,d,e:NGZ+e,f:NGZ+f};boxes.push(bb);gridAdd(bb);
  if(px){const m=new THREE.Mesh(new THREE.BoxGeometry(bb.b-bb.a,d-c,bb.f-bb.e),new THREE.MeshBasicMaterial());m.position.set((bb.a+bb.b)/2,(c+d)/2,(bb.e+bb.f)/2);m.visible=false;scene.add(m);m.updateMatrixWorld();solids.push(m);}};
 const T=140;W(6.3,6.9,0,T,-8.7,-1.65,1);W(6.3,6.9,0,T,1.65,8.7,1);W(6.3,6.9,3.4,T,-1.65,1.65,0);
 W(-6.9,-6.3,0,T,-8.7,8.7,1);W(-6.9,6.9,0,T,-8.7,-8.2,1);
 W(-6.9,-1.2,0,T,8.2,8.7,1);W(1.2,6.9,0,T,8.2,8.7,1);
 for(let k=0;k<=38;k++)W(-1.2,1.2,k*3.4+3.0,(k<38?(k+1)*3.4:T),8.2,8.7,0);}
// plaza in front of the tower
{const pl=new THREE.Mesh(new THREE.PlaneGeometry(44,40),new THREE.MeshStandardMaterial({color:0xb9b4aa,roughness:.9,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));pl.rotation.x=-Math.PI/2;pl.position.set(NGX+8,.14,NGZ);pl.receiveShadow=true;scene.add(pl);}
// NEWSGLOBAL lettering: crown + above the podium (both face the city)
const NGLM=new THREE.MeshStandardMaterial({color:0xff2222,roughness:.35,metalness:.1,emissive:0xff0a0a,emissiveIntensity:1.6,toneMapped:false});
const NGGL=(()=>{const c=document.createElement('canvas');c.width=512;c.height=128;const g=c.getContext('2d'),r=g.createRadialGradient(256,64,4,256,64,250);r.addColorStop(0,'rgba(255,40,30,.55)');r.addColorStop(.45,'rgba(255,20,20,.22)');r.addColorStop(1,'rgba(255,0,0,0)');g.save();g.scale(1,.5);g.translate(0,64);g.fillStyle=r;g.fillRect(0,-64,512,256);g.restore();return new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false,opacity:.8});})();
function ngText(wM,y){const shapes=NGLETTERS.map(L=>{const sh=new THREE.Shape(L.o.map(p=>new THREE.Vector2(p[0],p[1])));(L.h||[]).forEach(h=>sh.holes.push(new THREE.Path(h.map(p=>new THREE.Vector2(p[0],p[1])))));return sh;});
 const geo=new THREE.ExtrudeGeometry(shapes,{depth:.3/wM,bevelEnabled:false}),m=new THREE.Mesh(geo,NGLM);m.scale.setScalar(wM);m.castShadow=true;
 const g=new THREE.Group();g.add(m);g.rotation.y=Math.PI/2;g.position.set(NGX+(513.3-NGCX)*NGF+.02,y,NGZ);{const sp=new THREE.Sprite(NGGL);sp.scale.set(wM*1.6,wM*.42,1);sp.position.set(NGX+(513.3-NGCX)*NGF+1.2,y,NGZ);scene.add(sp);}scene.add(g);return g;}
try{ngText(15.6,12700*NGF);ngText(12.4,2620*NGF);}catch(e){console.warn('NEWSGLOBAL lettering skipped',e);}
// name label, minimap footprint, world directory, HUD district name
{const b={k:'b',n:'NEWSGLOBAL',s:38,x:NGX,z:NGZ,w:14.6,d:17.4,h:38*3.4,y0:0,st:3.4,fx:1,fz:0,dw:3.2,ra:0,esc:0};CD.bld.push(b);
 const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');
 x.fillStyle='rgba(8,12,18,.82)';x.fillRect(0,0,512,128);x.fillStyle='#ff7a30';x.fillRect(0,0,10,128);
 x.fillStyle='#ffffff';x.font='bold 46px Arial';x.fillText('NEWSGLOBAL',26,58);x.fillStyle='#cfd6dd';x.font='30px Arial';x.fillText('HEADQUARTERS  /  '+Math.round(13740*NGF)+' M TOWER',26,102);
 const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true}));sp.scale.set(15,3.75,1);sp.position.set(NGX+13,9,NGZ);sp.visible=false;scene.add(sp);LBL.push({sp,b});
 try{$('dir').insertAdjacentHTML('beforeend','<div class="dr"><span>#'+CD.bld.length+'</span><b>NEWSGLOBAL</b><small>'+b.s+' floors / headquarters tower / west of the city</small></div>');}catch(e){}}

// ===== 3D NEWSGLOBAL logo monument on the plaza (solid Earth from the supplied GLB maps, red N) =====
const LG=(()=>{const tx=(u,rep)=>{const t=new THREE.TextureLoader().load(u);t.flipY=false;t.encoding=THREE.sRGBEncoding;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;if(rep)t.repeat.set(rep[0],rep[1]);return t;};
 const P=[[12,5],[420,5],[950,808],[950,5],[1360,5],[1360,1415],[950,1415],[420,612],[420,1415],[12,1415]].map(p=>new THREE.Vector2((p[0]-686)/1000,(710-p[1])/1000));
 const ng=new THREE.ExtrudeGeometry(new THREE.Shape(P),{depth:.16,bevelEnabled:true,bevelThickness:.028,bevelSize:.022,bevelSegments:4,curveSegments:1});ng.translate(0,0,-.08);
 {const pos=ng.attributes.position,col=new Float32Array(pos.count*3),a=new THREE.Color(.55,.025,.025),b=new THREE.Color(.075,0,0),c=new THREE.Color();
  for(let i=0;i<pos.count;i++){const t=Math.min(1,Math.max(0,((pos.getX(i)+.69)/1.36)*.62+((.72-pos.getY(i))/1.43)*.38));c.copy(a).lerp(b,Math.pow(t,.9));col.set([c.r,c.g,c.b],i*3);}ng.setAttribute('color',new THREE.BufferAttribute(col,3));}
 const NM=new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:.32,metalness:.05,clearcoat:.85,clearcoatRoughness:.18,emissive:0x550000,emissiveIntensity:.05}),N=new THREE.Mesh(ng,NM);N.castShadow=N.receiveShadow=true;
 const sph=(r,w,h)=>{const p=[],uv=[],ix=[];for(let y=0;y<=h;y++){const la=-Math.PI/2+Math.PI*y/h;for(let x=0;x<=w;x++){const lo=-Math.PI+2*Math.PI*x/w;p.push(r*Math.cos(la)*Math.sin(lo),r*Math.sin(la),r*Math.cos(la)*Math.cos(lo));uv.push(lo/(2*Math.PI)+.25,y/h);}}
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const a=y*(w+1)+x,b=a+w+1;ix.push(a,a+1,b,b,a+1,b+1);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;};
 const ER=.472,core=new THREE.Mesh(new THREE.SphereGeometry(ER*.96,32,24),new THREE.MeshBasicMaterial({color:0x06142e})),
  ocean=new THREE.Mesh(sph(ER,96,48),new THREE.MeshPhysicalMaterial({map:tx(LGT.ocean),color:0xbfd6ff,transparent:false,opacity:1,roughness:.28,clearcoat:1,clearcoatRoughness:.1,normalMap:tx(LGT.wave,[14,7]),normalScale:new THREE.Vector2(.18,.18)})),
  land=new THREE.Mesh(sph(ER*1.003,96,48),new THREE.MeshStandardMaterial({map:tx(LGT.land),alphaTest:.5,roughness:.85})),
  cloud=new THREE.Mesh(sph(ER*1.018,72,36),new THREE.MeshStandardMaterial({map:tx(LGT.cloud),transparent:true,opacity:.82,depthWrite:false,roughness:1,emissive:0x222833}));
 [ocean,land].forEach(m=>{m.castShadow=m.receiveShadow=true;});
 const spin=new THREE.Group();spin.add(core,ocean,land,cloud);spin.rotation.y=-110*Math.PI/180;const tilt=new THREE.Group();tilt.add(spin);tilt.rotation.z=-.2;
 const E=new THREE.Group();E.add(tilt);E.position.set(.014,-.025,.3);
 const root=new THREE.Group();root.add(N,E);const SC=5,lx=NGX+19,lz=NGZ-11,pb=.45;
 root.scale.setScalar(SC);root.position.set(lx,pb+.705*SC,lz);root.rotation.y=Math.PI/2;scene.add(root);
 const pl=new THREE.Mesh(new THREE.BoxGeometry(1.7,pb,7.6),new THREE.MeshStandardMaterial({color:0x1b1c20,roughness:.45,metalness:.3}));pl.position.set(lx,pb/2,lz);pl.castShadow=pl.receiveShadow=true;scene.add(pl);
 const gl=new THREE.Sprite(NGGL);gl.scale.set(12,11,1);gl.position.set(lx-1.2,pb+.705*SC,lz);scene.add(gl);
 [{a:lx-.9,b:lx+.9,c:0,d:pb+1.4*SC+.2,e:lz-3.4,f:lz+3.4},{a:lx-2.4,b:lx+2.4,c:pb+.705*SC-.5*SC,d:pb+.705*SC+.5*SC,e:lz-2.4,f:lz+2.4}].forEach(b=>{boxes.push(b);gridAdd(b);});
 return{spin,cloud,NM};})();
{const _hl=hudTick;hudTick=function(n){_hl(n);try{LG.spin.rotation.y=-1.92+n/4500;LG.cloud.rotation.y=n/28000;const k=(typeof nf==='number')?nf:0,e=Math.min(1,Math.max(0,k-.1)*1.5);LG.NM.emissiveIntensity=.05+e*.6;}catch(x){}};}
{const _h=hudTick;hudTick=function(n){_h(n);try{const k=(typeof nf==='number')?nf:0,e=Math.min(1,Math.max(0,k-.1)*1.5);NGMATS.forEach(m=>m.emissiveIntensity=e*.95);NGLM.emissiveIntensity=1.5+e*1.6;NGGL.opacity=.55+e*.45;}catch(x){}};}


/* ===== Portal 2 elevator attached to the LEFT side of the NEWSGLOBAL tower (as seen from its front, city-facing side) =====
   Model: "Elevator - From Portal 2 (Original)" by David & 3D (Sketchfab), CC-BY-NC-4.0 */
const ELS=1.3,ELX=NGX,ELZ=NGZ+8.7+0.12+ELS*1.0+.06;   // scale, centre x, centre z (tower side wall is at z = NGZ+8.7)
const ELG=new THREE.Group();ELG.position.set(ELX,.04,ELZ);ELG.rotation.y=-Math.PI/2;ELG.scale.setScalar(ELS);scene.add(ELG); // machinery side is against the tower wall, cabin/door side faces outward (+Z)
const ELMATS=[];
try{
 const raw=fflate.unzlibSync(b64a(ELD.z,Uint8Array)),buf=raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),tl=new THREE.TextureLoader();
 const T=ELD.tex.map((u,i)=>{const t=tl.load(u);t.flipY=false;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;if(i%2===0||i===4)t.encoding=THREE.sRGBEncoding;return t;});
 const defs=[{c:T[0],e:T[1],m:.43,r:.37},{c:T[2],e:T[3],m:.1,r:.4},{c:T[4],e:null,m:.1,r:.45}];
 ELD.m.forEach((m,i)=>{
  const geo=new THREE.BufferGeometry(),nr=new Int8Array(buf,m.no,m.n*4),N=new Float32Array(m.n*3);
  for(let k=0;k<m.n;k++){N[k*3]=nr[k*4]/127;N[k*3+1]=nr[k*4+1]/127;N[k*3+2]=nr[k*4+2]/127;}
  geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(buf,m.po,m.n*3),3));
  geo.setAttribute('normal',new THREE.BufferAttribute(N,3));
  geo.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(buf,m.uo,m.n*2),2));
  geo.setIndex(new THREE.BufferAttribute(new Uint16Array(buf,m.io,m.ni),1));
  const d=defs[i],o={map:d.c,roughness:d.r,metalness:d.m,side:THREE.DoubleSide};
  if(d.e){o.emissive=new THREE.Color(1,1,1);o.emissiveMap=d.e;o.emissiveIntensity=0;}
  const mt=new THREE.MeshStandardMaterial(o);if(d.e)ELMATS.push(mt);
  const ms=new THREE.Mesh(geo,mt);ms.castShadow=true;ms.receiveShadow=true;ms.frustumCulled=false;ELG.add(ms);solids.push(ms);
 });
}catch(e){console.warn('NEWSGLOBAL elevator skipped',e);}
// lift docks against the tower wall: you board it from INSIDE the building through a door cut in the wall at every floor
const ELB=[[0.84,0.96,-0.24,0.12,0.0,3.8],[0.84,0.96,0.36,0.48,0.0,3.8],[0.6,0.72,-0.24,0.24,0.0,0.6],[0.6,0.72,-0.6,0.6,2.6,3.0],[0.6,0.72,-0.24,0.24,3.4,3.8],[0.72,0.84,-0.24,0.24,0.0,0.6],[0.72,0.84,-0.36,0.36,2.4,3.2],[0.72,0.84,-0.84,-0.72,3.4,3.8],[0.72,0.84,-0.24,0.24,3.4,3.8],[0.48,0.6,-0.24,0.24,0.0,0.6],[0.48,0.6,-0.72,0.72,2.6,3.0],[0.48,0.6,-0.24,0.24,3.4,3.8],[0.36,0.48,-0.84,-0.72,0.0,1.0],[0.36,0.48,-0.24,-0.12,0.0,1.0],[0.36,0.48,0.12,0.24,0.0,1.0],[0.36,0.48,0.72,0.84,0.0,1.0],[0.36,0.48,-0.24,0.24,2.8,3.0],[0.36,0.48,-0.72,-0.6,3.4,3.8],[0.36,0.48,-0.24,0.24,3.4,3.8],[0.36,0.48,0.6,0.72,3.4,3.8],[0.96,1.08,-0.24,0.12,0.0,3.8],[1.08,1.2,-0.24,0.0,0.0,3.8],[1.2,1.32,-0.24,0.0,0.0,3.6],[0.36,0.48,-0.12,0.12,0.8,1.0],[0.72,0.84,-0.72,-0.36,0.0,4.0],[0.72,0.84,0.36,0.72,0.0,4.0],[0.6,0.72,-0.6,-0.48,3.4,4.0],[0.6,0.72,0.48,0.6,3.4,4.0],[1.08,1.2,0.12,0.24,0.4,1.0],[1.08,1.2,-0.36,-0.24,1.4,1.8],[1.08,1.2,0.12,0.24,1.4,1.8],[1.08,1.2,0.12,0.24,2.2,2.6],[1.08,1.2,0.12,0.24,3.0,3.8],[1.2,1.32,0.12,0.24,3.4,3.6],[0.96,1.08,0.12,0.24,0.0,1.0],[0.96,1.08,-0.36,-0.24,1.4,1.8],[0.96,1.08,0.12,0.24,1.4,1.8],[0.96,1.08,0.12,0.24,2.2,2.6],[0.96,1.08,0.12,0.24,3.0,3.8],[0.84,0.96,0.12,0.24,0.0,0.8],[0.84,0.96,0.12,0.24,1.4,1.8],[0.84,0.96,0.12,0.24,2.2,3.8],[0.24,0.36,-0.36,0.36,2.8,3.0],[0.24,0.36,-0.72,0.72,3.4,3.8],[0.24,0.36,-0.84,-0.36,2.6,3.0],[0.24,0.36,0.36,0.84,2.6,3.0],[0.36,0.48,-0.72,-0.24,2.6,3.0],[0.36,0.48,0.24,0.72,2.6,3.0],[0.48,0.6,-0.72,-0.6,3.4,4.0],[0.48,0.6,0.6,0.72,3.4,4.0],[0.6,0.72,-0.84,-0.6,0.0,4.0],[0.6,0.72,0.6,0.84,0.0,4.0],[0.48,0.6,-0.96,-0.72,0.0,4.0],[0.48,0.6,0.72,0.96,0.0,4.0],[0.36,0.48,-0.96,-0.84,0.0,4.0],[0.36,0.48,0.84,0.96,0.0,4.0],[0.36,0.48,-0.84,-0.72,2.4,3.0],[0.36,0.48,-0.84,-0.72,3.2,4.0],[0.24,0.36,-0.96,-0.84,0.8,1.0],[0.24,0.36,0.72,0.96,0.8,1.0],[0.24,0.36,-0.96,-0.84,2.4,4.0],[0.24,0.36,0.84,0.96,2.4,4.0],[-0.36,-0.24,-0.96,-0.84,0.0,1.0],[-0.36,-0.24,0.84,0.96,0.0,1.0],[-0.36,-0.24,-0.96,-0.84,2.4,4.0],[-0.36,-0.24,0.84,0.96,2.4,4.0],[-0.24,-0.12,-0.96,-0.84,0.0,1.0],[-0.24,-0.12,0.84,0.96,0.0,1.0],[-0.24,-0.12,-0.96,-0.84,2.4,4.0],[-0.24,-0.12,0.84,0.96,2.4,4.0],[-0.24,-0.12,-1.08,-0.96,2.6,4.0],[-0.24,-0.12,0.96,1.08,2.6,4.0],[-0.12,0.0,-1.08,-0.84,2.4,4.0],[-0.12,0.0,0.84,1.08,2.4,4.0],[0.0,0.12,-1.08,-0.84,2.4,4.0],[0.0,0.12,0.84,1.08,2.4,4.0],[0.12,0.24,-1.08,-0.96,2.6,4.0],[0.12,0.24,0.96,1.08,2.6,4.0],[0.12,0.24,-0.96,-0.84,0.8,1.0],[0.12,0.24,0.84,0.96,0.8,1.0],[0.12,0.24,-0.96,-0.84,2.4,4.0],[0.12,0.24,0.84,0.96,2.4,4.0],[0.12,0.24,-0.48,0.48,2.8,3.0],[0.12,0.24,-0.84,0.84,3.4,3.8],[0.0,0.12,-0.48,0.48,2.8,3.0],[0.0,0.12,-0.84,0.84,3.4,3.8],[0.12,0.24,-0.84,-0.48,2.6,3.0],[0.12,0.24,0.48,0.84,2.6,3.0],[-0.12,0.0,-0.48,0.48,2.8,3.0],[-0.12,0.0,-0.84,0.84,3.4,3.8],[-0.12,0.0,-0.84,-0.48,2.6,3.0],[-0.12,0.0,0.48,0.84,2.6,3.0],[-0.24,-0.12,-0.84,-0.48,2.6,3.0],[-0.24,-0.12,0.48,0.84,2.6,3.0],[-0.24,-0.12,-0.84,0.84,3.4,3.8],[-0.36,-0.24,-0.36,0.36,2.8,3.0],[-0.36,-0.24,-0.72,0.72,3.4,3.8],[-0.24,-0.12,-0.48,0.48,2.8,3.0],[-0.36,-0.24,-0.84,-0.36,2.6,3.0],[-0.36,-0.24,0.36,0.84,2.6,3.0],[0.0,0.12,-0.84,-0.48,2.6,3.0],[0.0,0.12,0.48,0.84,2.6,3.0],[-0.36,-0.24,-0.84,-0.72,3.4,4.0],[-0.36,-0.24,0.72,0.84,3.4,4.0],[-0.36,-0.24,-0.84,-0.72,0.8,1.0],[-0.36,-0.24,-1.08,-0.96,2.6,3.8],[-0.36,-0.24,0.96,1.08,2.6,3.8],[0.0,0.12,-0.96,-0.84,0.8,1.0],[0.0,0.12,0.84,0.96,0.8,1.0],[0.24,0.36,-0.84,-0.72,3.4,4.0],[0.24,0.36,0.72,0.84,3.4,4.0],[0.36,0.48,0.72,0.84,2.4,4.0],[-0.12,0.0,-0.96,-0.84,0.8,1.0],[-0.12,0.0,0.84,0.96,0.8,1.0],[0.84,0.96,-0.36,-0.24,2.4,3.2],[0.84,0.96,0.24,0.36,2.4,3.2],[0.84,0.96,-0.48,-0.36,0.2,4.0],[0.84,0.96,-0.6,-0.48,0.0,4.0],[0.84,0.96,0.48,0.6,0.0,4.0],[1.08,1.2,0.0,0.12,0.4,3.8],[1.2,1.32,0.0,0.12,0.4,1.8],[1.2,1.32,0.0,0.12,2.2,3.6],[0.96,1.08,-0.36,-0.24,3.2,3.6],[1.08,1.2,-0.36,-0.24,3.2,3.6],[0.24,0.36,-1.08,-0.96,2.6,3.8],[0.24,0.36,0.96,1.08,2.6,3.8],[0.72,0.84,-0.84,-0.72,2.6,3.0],[0.72,0.84,0.72,0.84,2.6,2.8],[0.72,0.84,0.72,0.84,3.0,3.4],[0.72,0.84,0.72,0.84,3.6,3.8]];
{const FLW=.04,GY=FLW,PB=[],mk=(a,b,e,f,c,d)=>{const x={a,b,c,d,e,f,c0:c,d0:d};boxes.push(x);gridAdd(x);PB.push(x);return x;},H3=3.4;
 ELB.forEach(q=>mk(ELX-ELS*q[3],ELX-ELS*q[2],ELZ+ELS*q[0],ELZ+ELS*q[1],GY+ELS*q[4],GY+ELS*q[5]));
 const fl={a:ELX-ELS*.85,b:ELX+ELS*.85,c:FLW-.15,d:FLW,e:ELZ-ELS*1.0,f:ELZ+ELS*.6,dyn:true,vy:0};DYN.push(fl);
 const NGb=CD.bld.find(o=>o.n==='NEWSGLOBAL');
 if(NGb){const S=NGb.s,lv=[];for(let k=0;k<=S;k++)lv.push(k*H3+FLW);
  // walkable thresholds through the wall hole at every floor
  const th=new THREE.InstancedMesh(new THREE.BoxGeometry(2.4,.1,.9),new THREE.MeshStandardMaterial({color:0x8d939b,roughness:.8}),S+1),dm=new THREE.Object3D();
  for(let k=0;k<=S;k++){const y=k*H3+FLW,x={a:ELX-1.2,b:ELX+1.2,c:y-.1,d:y,e:NGZ+8.0,f:NGZ+8.9};boxes.push(x);gridAdd(x);dm.position.set(ELX,y-.05,NGZ+8.45);dm.updateMatrix();th.setMatrixAt(k,dm.matrix);}
  scene.add(th);
  const PE={b:NGb,x0:fl.a,x1:fl.b,z0:fl.e,z1:fl.f,fx:ELX,fz:NGZ+6.6,lv,y:FLW,ty:FLW,idx:0,open:0,vy:0,spd:7,group:{position:{y:0}},box:fl,halls:[],g0:FLW,panel:true};ELEV.push(PE);
  // full 360 glass: fixed glass all round, two curved door leaves slide round inside it on the wall side
  const DR=1.22,DH=3.1,DA=1.0,gl=new THREE.MeshStandardMaterial({color:0x9ad0f0,transparent:true,opacity:.28,metalness:.6,roughness:.08,side:THREE.DoubleSide,depthWrite:false}),fr=new THREE.MeshStandardMaterial({color:0xc9ccce,metalness:.7,roughness:.35});
  const arc=(g,r,t0,tl,seg)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,DH,seg,1,true,t0,tl),gl);m.position.y=DH/2;g.add(m);
   [.03,DH-.03].forEach(y=>{const q=new THREE.Mesh(new THREE.CylinderGeometry(r+.01,r+.01,.07,seg,1,true,t0,tl),fr);q.position.y=y;g.add(q);});
   [t0,t0+tl].forEach(t=>{const b=new THREE.Mesh(new THREE.BoxGeometry(.06,DH,.06),fr);b.position.set(r*Math.sin(t),DH/2,r*Math.cos(t));b.rotation.y=t;g.add(b);});};
  const FG=new THREE.Group();arc(FG,DR,Math.PI+DA+.03,Math.PI*2-2*DA-.06,40);FG.position.set(ELX,FLW,ELZ);scene.add(FG);
  const leaf=s=>{const g=new THREE.Group();arc(g,DR-.07,s>0?.03:-DA,DA-.03,20);g.rotation.y=Math.PI;g.position.set(ELX,FLW,ELZ);scene.add(g);return g;};
  const lf=[leaf(1),leaf(-1)],drs=[mk(ELX-.45,ELX+.45,ELZ-1.26,ELZ-1.12,FLW,FLW+DH),mk(ELX+.45,ELX+.95,ELZ-.99,ELZ-.85,FLW,FLW+DH),mk(ELX-.95,ELX-.45,ELZ-.99,ELZ-.85,FLW,FLW+DH)];let dO=0,pend=null,wasW=0;
  function goTo(k){k=Math.max(0,Math.min(S,k));if(k===PE.idx&&PE.vy===0)return;pend=k;}
  const lab=k=>k===0?'G':(k===S?'R':String(k)),ELP=document.createElement('div');
  ELP.style.cssText='position:fixed;right:22px;top:50%;transform:translateY(-50%);z-index:30;display:none;width:236px;background:rgba(9,13,19,.94);border:1px solid rgba(255,255,255,.2);padding:14px;color:#fff;font-family:Arial,sans-serif;user-select:none';
  ELP.innerHTML='<div style="font-weight:700;font-size:12px;letter-spacing:.14em;color:#ff7a30">NEWSGLOBAL LIFT</div><div id="elpD" style="font-weight:700;font-size:26px;margin:6px 0 8px;letter-spacing:.06em">G</div><div id="elpG" style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;max-height:46vh;overflow:auto"></div><div style="font-size:11px;color:#9aa4ae;margin:8px 0">Tap a floor, or type its number and press Enter</div><button id="elpX" style="width:100%;padding:8px;background:#1b222b;color:#fff;border:1px solid rgba(255,255,255,.25);cursor:pointer;font-weight:700">CLOSE</button>';
  document.body.appendChild(ELP);const GG=ELP.querySelector('#elpG'),DD=ELP.querySelector('#elpD');let typed='';
  const relock=()=>{try{const r=document.body.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(e){}};
  function closeELP(rl){window.elPanel=false;ELP.style.display='none';typed='';if(rl)relock();}
  function openELP(){window.elPanel=true;ELP.style.display='block';try{document.exitPointerLock();}catch(e){}}
  for(let k=S;k>=0;k--){const b=document.createElement('button');b.textContent=lab(k);b.dataset.k=k;b.style.cssText='height:38px;background:#171d25;color:#fff;border:1px solid rgba(255,255,255,.22);font-weight:700;cursor:pointer;font-size:14px';b.onclick=()=>{goTo(k);closeELP(true);};GG.appendChild(b);}
  ELP.querySelector('#elpX').onclick=()=>closeELP(true);
  const FB=document.createElement('div');FB.style.cssText='position:fixed;top:78px;left:50%;transform:translateX(-50%);z-index:25;display:none;background:rgba(9,13,19,.85);border:1px solid rgba(255,255,255,.2);padding:6px 18px;color:#fff;font:700 15px Arial,sans-serif;letter-spacing:.1em';document.body.appendChild(FB);
  addEventListener('keydown',e=>{if(!window.elPanel)return;const m=/^(Digit|Numpad)(\d)$/.exec(e.code);
   if(m){typed=(typed+m[2]).slice(0,2);DD.textContent=typed;e.preventDefault();}
   else if(e.code==='Enter'||e.code==='NumpadEnter'){if(typed!=='')goTo(parseInt(typed,10));closeELP(true);e.preventDefault();}
   else if(e.code==='Backspace'){typed=typed.slice(0,-1);DD.textContent=typed||lab(Math.round((PE.y-FLW)/H3));}
   else if(e.code==='Escape'){closeELP(true);}},true);
  const _uf=useF;useF=function(){const n=nearElev();if(n&&n.e===PE&&n.inside){window.elPanel?closeELP(true):openELP();return;}_uf();};
  const _es=elevStep;elevStep=function(e,dt){_es(e,dt);if(e!==PE)return;
   const dy=PE.group.position.y;ELG.position.y=GY+dy;FG.position.y=FLW+dy;PB.forEach(x=>{x.c=x.c0+dy;x.d=x.d0+dy;});
   const near=Math.hypot(p.x-ELX,p.z-(ELZ-1.6))<3.6&&Math.abs(p.y-PE.y)<2.2,inside=p.x>PE.x0&&p.x<PE.x1&&p.z>PE.z0&&p.z<PE.z1&&p.y>PE.y-.5&&p.y<PE.y+2.6;
   let want=(PE.vy===0&&Math.abs(PE.y-PE.ty)<.02&&near)?1:0;
   if(pend!==null){want=0;if(dO<=.02){PE.idx=pend;PE.ty=PE.lv[pend];pend=null;}}
   if(want&&!wasW){try{playOnce('open');}catch(x){}}wasW=want;
   dO+=Math.sign(want-dO)*Math.min(Math.abs(want-dO),dt*1.6);
   lf[0].position.y=FLW+dy;lf[1].position.y=FLW+dy;lf[0].rotation.y=Math.PI+dO*DA;lf[1].rotation.y=Math.PI-dO*DA;drs.forEach(x=>{x.off=dO>.5;});
   const cur=Math.max(0,Math.min(S,Math.round((PE.y-FLW)/H3)));
   if(inside){FB.style.display='block';FB.textContent='LIFT   FLOOR '+lab(cur)+(PE.vy>0.1?'  \u25B2':PE.vy<-0.1?'  \u25BC':'');}else FB.style.display='none';
   if(window.elPanel){if(!inside)closeELP(true);else{if(typed==='')DD.textContent=lab(cur);GG.querySelectorAll('button').forEach(b=>{b.style.background=(+b.dataset.k===cur)?'#ff7a30':'#171d25';});}}};}}
{const _h2=hudTick;hudTick=function(n){_h2(n);try{const k=(typeof nf==='number')?nf:0,e=Math.min(1,Math.max(0,k-.1)*1.5);ELMATS.forEach(m=>m.emissiveIntensity=.35+e*.8);}catch(x){}};}


/* ===== Low-poly trees and the Kennedy Town swimming pool complex (converted from the uploaded GLB files) ===== */
{
 const tl=new THREE.TextureLoader();
 const T=EX.tree,q=b64a(T.p,Int16Array),P=new Float32Array(q.length);for(let i=0;i<q.length;i++)P[i]=q[i]*T.sc/32767;
 const u=b64a(T.u,Uint16Array),UV=new Float32Array(u.length);for(let i=0;i<u.length;i++)UV[i]=u[i]/65535;
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('uv',new THREE.BufferAttribute(UV,2));g.setIndex(new THREE.BufferAttribute(b64a(T.i,Uint16Array),1));g.computeVertexNormals();
 const tx=tl.load(T.tex);tx.flipY=false;tx.encoding=THREE.sRGBEncoding;
 const tm=new THREE.MeshStandardMaterial({map:tx,roughness:.85,alphaTest:.45,side:THREE.DoubleSide});
 const tp=[];let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
 for(let i=0;i<170;i++){const a=rnd()*Math.PI*2,r=124+rnd()*46,x=Math.cos(a)*r,z=Math.sin(a)*r;
  if(Math.abs(x-POOLC[0])<105&&Math.abs(z-POOLC[1])<115)continue;if(Math.hypot(x,z-420)<50)continue;if(Math.abs(x-NGX)<26&&Math.abs(z-NGZ)<24)continue;if(x>POOL.x0-12&&x<POOL.x1+12&&Math.abs(z)<32)continue;tp.push([x,z,.7+rnd()*.7,rnd()*6.28]);}
 const im=new THREE.InstancedMesh(g,tm,tp.length),dd=new THREE.Object3D();tp.forEach((t,i)=>{dd.position.set(t[0],0,t[1]);dd.scale.setScalar(t[2]);dd.rotation.y=t[3];dd.updateMatrix();im.setMatrixAt(i,dd.matrix);});
 im.castShadow=true;scene.add(im);
 // pool complex
 const PG=new THREE.Group(),k=EX.pool.sc/32767;
 EX.pool.parts.forEach(pt=>{const qq=b64a(pt.p,Int16Array),PP=new Float32Array(qq.length);for(let i=0;i<qq.length;i++)PP[i]=qq[i]*k;
  const uu=b64a(pt.u,Uint16Array),UU=new Float32Array(uu.length);for(let i=0;i<uu.length;i++)UU[i]=uu[i]/65535;
  const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.BufferAttribute(PP,3));gg.setAttribute('uv',new THREE.BufferAttribute(UU,2));gg.setIndex(new THREE.BufferAttribute(b64a(pt.i,Uint16Array),1));gg.computeVertexNormals();
  const t2=tl.load(pt.tex);t2.flipY=false;t2.encoding=THREE.sRGBEncoding;
  const mm=new THREE.Mesh(gg,new THREE.MeshStandardMaterial({map:t2,roughness:.8,metalness:.05,side:THREE.DoubleSide}));mm.castShadow=true;mm.receiveShadow=true;PG.add(mm);});
 PG.position.set(POOLC[0],0,POOLC[1]);PG.rotation.y=Math.PI/2;scene.add(PG);
 const c=document.createElement('canvas');c.width=640;c.height=128;const x=c.getContext('2d');x.fillStyle='rgba(8,12,18,.85)';x.fillRect(0,0,640,128);x.fillStyle='#ff7a30';x.fillRect(0,0,10,128);
 x.fillStyle='#ffffff';x.font='bold 40px Arial';x.fillText('KENNEDY TOWN SWIMMING POOL',26,58);x.fillStyle='#cfd6dd';x.font='28px Arial';x.fillText('East of the city  /  landmark',26,104);
 const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true}));sp.scale.set(40,8,1);sp.position.set(POOLC[0]-95,32,POOLC[1]);scene.add(sp);
}


/* ===== Forest: "Dirt Road Through Forest" scene exactly as supplied, 100 km south of the city (ground level = the flat start of the road) ===== */
const FOREST_C=[0,100000];
try{
 const tl=new THREE.TextureLoader(),grp=new THREE.Group();grp.position.set(FOREST_C[0],0,FOREST_C[1]);scene.add(grp);
 FOR.m.forEach(d=>{
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(b64a(d.p,Uint16Array),3,true));
  g.setAttribute('normal',new THREE.BufferAttribute(b64a(d.nr,Int8Array),3,true));
  g.setAttribute('uv',new THREE.BufferAttribute(b64a(d.u,Uint16Array),2,true));
  g.setIndex(new THREE.BufferAttribute(b64a(d.i,Uint16Array),1));
  const mk=u=>{const t=tl.load(u);t.flipY=false;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;t.anisotropy=Math.min(16,ren.capabilities.getMaxAnisotropy());t.repeat.set(d.urg[0],d.urg[1]);t.offset.set(d.umin[0],d.umin[1]);return t;};
  const mat=new THREE.MeshStandardMaterial({map:d.tex?mk(d.tex):null,color:new THREE.Color(d.bc[0],d.bc[1],d.bc[2]),roughness:.92,metalness:0,side:THREE.DoubleSide});
  if(d.blend){if(d.soft){mat.transparent=true;mat.depthWrite=false;mat.polygonOffset=true;mat.polygonOffsetFactor=-2;mat.polygonOffsetUnits=-2;}else mat.alphaTest=.35;}
  if(d.emis){mat.emissiveMap=mk(d.emis);mat.emissive=new THREE.Color(d.ef,d.ef,d.ef);}
  const m=new THREE.Mesh(g,mat);m.position.set(d.pmin[0],d.pmin[1],d.pmin[2]);m.scale.set(d.prng[0],d.prng[1],d.prng[2]);grp.add(m);});
 FOR.tr.forEach(t=>{const wx=FOREST_C[0]+t[0],wz=FOREST_C[1]+t[1],bb={a:wx-t[2],b:wx+t[2],c:t[3]-2,d:t[3]+30,e:wz-t[2],f:wz+t[2],tree:1,base:t[3]};boxes.push(bb);if(typeof gridAdd==='function')gridAdd(bb);});
}catch(err){console.error('Forest failed',err);}

/* ===== Forest ground physics: height map + solid trunks, so you stand ON the terrain and cannot walk through ground, trees, logs or fences ===== */
function buildForestPhysics(FOR,FC,b64a,TG,boxes,gridAdd,done){
 const X0=-210,Z0=-410,X1=350,Z1=150,CS=.5,W=Math.ceil((X1-X0)/CS),HH=Math.ceil((Z1-Z0)/CS);
 const BS=.25,BW=Math.ceil((X1-X0)/BS),BH=Math.ceil((Z1-Z0)/BS);
 const GR={Dirt_Road_Bare:1,Dirt_Road:1,Ground_Dirt:1,Sloped_Rock:1,Aerial_Grass:1,Terrain_Far:1,Grass_Close:1,Cobblestone:1,Tall_Cliff:1,Mud_Pile:1,Broken_Rocks:1};
 const BLK={Trunk_Birch:1,Trunk_Oak:1,Wood_Log:1,Metal_Fence:1,Wood_Fence:1};
 const H=new Float32Array(W*HH).fill(-1e9),B=new Uint8Array(BW*BH);
 function verts(d){const q=b64a(d.p,Uint16Array),n=q.length/3,P=new Float32Array(q.length);
  for(let i=0;i<n;i++){P[i*3]=d.pmin[0]+q[i*3]/65535*d.prng[0];P[i*3+1]=d.pmin[1]+q[i*3+1]/65535*d.prng[1];P[i*3+2]=d.pmin[2]+q[i*3+2]/65535*d.prng[2];}
  return P;}
 function rast(ax,ay,az,bx,by,bz,cx,cy,cz){
  const dd=(bz-cz)*(ax-cx)+(cx-bx)*(az-cz);if(Math.abs(dd)<1e-9)return;
  const i0=Math.max(0,Math.floor((Math.min(ax,bx,cx)-X0)/CS)),i1=Math.min(W-1,Math.floor((Math.max(ax,bx,cx)-X0)/CS));
  const j0=Math.max(0,Math.floor((Math.min(az,bz,cz)-Z0)/CS)),j1=Math.min(HH-1,Math.floor((Math.max(az,bz,cz)-Z0)/CS));
  for(let j=j0;j<=j1;j++){const z=Z0+(j+.5)*CS;for(let i=i0;i<=i1;i++){const x=X0+(i+.5)*CS;
   const l1=((bz-cz)*(x-cx)+(cx-bx)*(z-cz))/dd,l2=((cz-az)*(x-cx)+(ax-cx)*(z-cz))/dd,l3=1-l1-l2;
   if(l1>=-1e-4&&l2>=-1e-4&&l3>=-1e-4){const y=l1*ay+l2*by+l3*cy,k=j*W+i;if(y>H[k])H[k]=y;}}}}
 function fill(){ // close small holes (1.5 m) so the surface is continuous; bigger voids stay solid walls
  for(let pass=0;pass<3;pass++){const add=[];
   for(let j=1;j<HH-1;j++)for(let i=1;i<W-1;i++){const k=j*W+i;if(H[k]>-1e8)continue;let s=0,n=0;
    for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const v=H[k+b*W+a];if(v>-1e8){s+=v;n++;}}
    if(n>=2)add.push(k,s/n);}
   for(let t=0;t<add.length;t+=2)H[add[t]]=add[t+1];}}
 function gy(x,z){ // bilinear ground height, NaN when there is no ground here
  const fx=(x-FC[0]-X0)/CS-.5,fz=(z-FC[1]-Z0)/CS-.5,i=Math.floor(fx),j=Math.floor(fz);
  if(i<0||j<0||i>=W-1||j>=HH-1)return NaN;const u=fx-i,v=fz-j,k=j*W+i;
  const a=H[k],b=H[k+1],c=H[k+W],d=H[k+W+1],wa=(1-u)*(1-v),wb=u*(1-v),wc=(1-u)*v,wd=u*v;let s=0,w=0;
  if(a>-1e8){s+=a*wa;w+=wa;}if(b>-1e8){s+=b*wb;w+=wb;}if(c>-1e8){s+=c*wc;w+=wc;}if(d>-1e8){s+=d*wd;w+=wd;}
  return w>.2?s/w:NaN;}
 function mark(x,z){const i=Math.floor((x-FC[0]-X0)/BS),j=Math.floor((z-FC[1]-Z0)/BS);if(i>=0&&j>=0&&i<BW&&j<BH)B[j*BW+i]=1;}
 function bAt(x,z){const i=Math.floor((x-FC[0]-X0)/BS),j=Math.floor((z-FC[1]-Z0)/BS);return i>=0&&j>=0&&i<BW&&j<BH&&B[j*BW+i]===1;}
 const list=FOR.m,step=[];
 list.forEach(d=>{if(GR[d.n])step.push(()=>{const P=verts(d),I=b64a(d.i,Uint16Array);
   for(let t=0;t<I.length;t+=3){const a=I[t]*3,b=I[t+1]*3,c=I[t+2]*3;rast(P[a],P[a+1],P[a+2],P[b],P[b+1],P[b+2],P[c],P[c+1],P[c+2]);}});});
 step.push(()=>fill());
 list.forEach(d=>{if(BLK[d.n])step.push(()=>{const P=verts(d),I=b64a(d.i,Uint16Array);
   for(let t=0;t<I.length;t+=3){const a=I[t]*3,b=I[t+1]*3,c=I[t+2]*3;
    const mnY=Math.min(P[a+1],P[b+1],P[c+1]),mxY=Math.max(P[a+1],P[b+1],P[c+1]);
    const cx=(P[a]+P[b]+P[c])/3+FC[0],cz=(P[a+2]+P[b+2]+P[c+2])/3+FC[1],g=gy(cx,cz);if(g!==g)continue;
    if(mxY<g+.35||mnY>g+2.4)continue;
    const ext=Math.max(Math.abs(P[a]-P[b]),Math.abs(P[a]-P[c]),Math.abs(P[b]-P[c]),Math.abs(P[a+2]-P[b+2]),Math.abs(P[a+2]-P[c+2]),Math.abs(P[b+2]-P[c+2]));
    const n=Math.max(1,Math.ceil(ext/.2));
    for(let u=0;u<=n;u++)for(let v=0;v<=n-u;v++){const fu=u/n,fv=v/n,fa=1-fu-fv;
     mark(P[a]*fa+P[b]*fu+P[c]*fv+FC[0],P[a+2]*fa+P[b+2]*fu+P[c+2]*fv+FC[1]);}}});});
 step.push(()=>{ // existing tree list: put each trunk box on the real ground (it used to sit at y=0..14)
  for(const bb of boxes){if(bb.tree){const g=gy((bb.a+bb.b)/2,(bb.e+bb.f)/2);const base=g===g?g:bb.base;bb.c=base-2;bb.d=base+30;}}});
 let s=0;(function run(){const t0=performance.now();while(s<step.length&&performance.now()-t0<12)step[s++]();
  if(s<step.length)setTimeout(run,0);else{
   Object.assign(TG,{
    near:(x,z)=>Math.abs(x-FC[0])<600&&Math.abs(z-FC[1])<600,
    y:gy,
    blk:(x,z,r,y)=>{const g=gy(x,z);if(g===g&&y>g+2.2)return 0;
     let n=bAt(x,z)?4:0;for(let a=0;a<12;a++){const an=a*Math.PI/6,c=Math.cos(an),s=Math.sin(an);if(bAt(x+c*r,z+s*r))n++;if(a%2===0&&bAt(x+c*r*.5,z+s*r*.5))n++;}return n;},
    ok:true});
   if(done)done();}})();
}

try{buildForestPhysics(FOR,FOREST_C,b64a,TG,boxes,gridAdd,function(){try{toast&&0;}catch(e){}});}catch(e){console.error('Forest physics failed',e);}

/* ===== P = shortcut to the forest (press again to return) ===== */
{let back=[40,0,-10];
 addEventListener('keydown',e=>{if(e.code!=='KeyP'||e.repeat||!locked||inCar)return;
  if(Math.hypot(p.x-FOREST_C[0],p.z-FOREST_C[1])<600){p.x=back[0];p.y=back[1];p.z=back[2];toast('Back to the city');}
  else{back=[p.x,p.y,p.z];p.x=FOREST_C[0];p.y=0;p.z=FOREST_C[1];toast('FOREST: 100 km south of the city');}
  p.vy=0;});}

/* ===== Camera view: TPS / FPS ===== */
let fpsView=false;try{fpsView=localStorage.getItem('ekoView')==='fps';}catch(e){}
function fpsCar(){const c=inCar,e=c.g.userData.eye||[-.45,1.4,-.2],cy=Math.cos(c.yaw),sy=Math.sin(c.yaw);cam.position.set(c.x+e[0]*cy+e[2]*sy,e[1],c.z-e[0]*sy+e[2]*cy);const fxc=c.g.userData.fx;cam.rotation.set(p.pitch*.6+(fxc?fxc.p*.8:0),c.yaw,fxc?-fxc.r*.8:0);}
function updateViewUI(){const a=$('vwa'),b=$('vwb2'),v=$('viewBtn');if(a)a.classList.toggle('on',!fpsView);if(b)b.classList.toggle('on',fpsView);if(v)v.textContent='VIEW: '+(fpsView?'FIRST PERSON':'THIRD PERSON');}
function toggleView(){fpsView=!fpsView;try{localStorage.setItem('ekoView',fpsView?'fps':'tps');}catch(e){}updateViewUI();toast('Camera: '+(fpsView?'FIRST PERSON (FPS)':'THIRD PERSON (TPS)'));}
$('viewBtn').onclick=toggleView;updateViewUI();
addEventListener('keydown',e=>{if(e.code==='Tab'&&locked){e.preventDefault();toggleView();}else if(e.code==='KeyC'&&locked)toggleView();});

/* ===== Touch controls + Enter to play ===== */
function tcShow(b){const t=$('tc');if(t)t.style.display=b?'block':'none';}
addEventListener('keydown',e=>{if(e.code==='Enter'&&(uiScreen==='play'||uiScreen==='char'))enter();});
if('ontouchstart' in window||navigator.maxTouchPoints>0){
 const joy=$('joy'),st=$('stick');let jid=null,lid=null,lx=0,ly=0;
 function jset(t){const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=t.clientX-cx,dy=t.clientY-cy;const m=Math.hypot(dx,dy),mx=r.width/2;if(m>mx){dx*=mx/m;dy*=mx/m;}
  st.style.transform=`translate(${dx}px,${dy}px)`;keys.KeyD=dx>18;keys.KeyA=dx<-18;keys.KeyS=dy>18;keys.KeyW=dy<-18;}
 function jend(){jid=null;st.style.transform='';keys.KeyW=keys.KeyA=keys.KeyS=keys.KeyD=false;}
 joy.addEventListener('touchstart',e=>{e.preventDefault();jid=e.changedTouches[0].identifier;jset(e.changedTouches[0]);},{passive:false});
 joy.addEventListener('touchmove',e=>{e.preventDefault();for(const t of e.changedTouches)if(t.identifier===jid)jset(t);},{passive:false});
 joy.addEventListener('touchend',e=>{for(const t of e.changedTouches)if(t.identifier===jid)jend();});
 joy.addEventListener('touchcancel',jend);
 document.addEventListener('touchstart',e=>{if(!locked)return;for(const t of e.changedTouches){if(lid===null&&!t.target.closest('#joy,.tb')&&t.clientX>innerWidth*.3){lid=t.identifier;lx=t.clientX;ly=t.clientY;}}},{passive:true});
 document.addEventListener('touchmove',e=>{for(const t of e.changedTouches)if(t.identifier===lid){p.yaw-=(t.clientX-lx)*.006;p.pitch=Math.max(-1.2,Math.min(1.3,p.pitch-(t.clientY-ly)*.006));lx=t.clientX;ly=t.clientY;}},{passive:true});
 document.addEventListener('touchend',e=>{for(const t of e.changedTouches)if(t.identifier===lid)lid=null;});
 const hold=(id,on,off)=>{const b=$(id);b.addEventListener('touchstart',e=>{e.preventDefault();b.classList.add('on');on();},{passive:false});const f=()=>{b.classList.remove('on');if(off)off();};b.addEventListener('touchend',f);b.addEventListener('touchcancel',f);};
 hold('bFire',()=>firing=true,()=>firing=false);
 hold('bJump',()=>keys.Space=true,()=>keys.Space=false);
 hold('bClimb',()=>keys.KeyE=true,()=>keys.KeyE=false);
 hold('bCar',()=>useF());
 hold('bDown',()=>elevDown());hold('bPunch',()=>doPunch());hold('bCrouch',()=>toggleCrouch());hold('bEmote',()=>nextEmote());
 hold('bRun',()=>keys.ShiftLeft=!keys.ShiftLeft);
 hold('bRel',()=>reload());
 hold('bView',()=>toggleView());
 hold('bMenu',()=>pauseGame());
}

/* ===== DEAD ZONE (apocalyptic district) + loft-furnished interiors ===== */
const AX=2000,AZ=0,dzCol=new THREE.Color(0x8a735c);
function mkMats(M,T){const tx=T.map(u=>{const t=new THREE.TextureLoader().load(u);t.flipY=false;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t;});
 return M.map(m=>{const o={color:new THREE.Color(m.c[0],m.c[1],m.c[2]),map:m.t>=0?tx[m.t]:null,side:m.ds?THREE.DoubleSide:THREE.FrontSide};
  if(m.am==='MASK')o.alphaTest=.5;if(m.am==='BLEND'||m.o<1){o.transparent=true;o.opacity=m.o;o.depthWrite=false;}
  if(m.u)return new THREE.MeshBasicMaterial(o);o.roughness=.85;o.metalness=Math.min(.3,m.m);const x=new THREE.MeshStandardMaterial(o);
  if(m.e[0]+m.e[1]+m.e[2]>0)x.emissive=new THREE.Color(m.e[0],m.e[1],m.e[2]);return x;});}
function mkGeo(g){const q=b64a(g.p,Int16Array),P=new Float32Array(q.length),k=g.sc/32767;for(let i=0;i<q.length;i++)P[i]=q[i]*k;
 const u=b64a(g.u,Uint16Array),U=new Float32Array(u.length),l=g.ul;for(let i=0;i<u.length;i+=2){U[i]=l[0]+u[i]/65535*l[2];U[i+1]=l[1]+u[i+1]/65535*l[3];}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(P,3));geo.setAttribute('uv',new THREE.BufferAttribute(U,2));
 geo.setIndex(new THREE.BufferAttribute(b64a(g.i,Uint16Array),1));geo.computeVertexNormals();return geo;}
const DZ=new THREE.Group();DZ.position.set(AX,0,AZ);scene.add(DZ);
{const M=mkMats(APO.mats,APO.tex);APO.geos.forEach(g=>{const m=new THREE.Mesh(mkGeo(g),M[g.m]);DZ.add(m);if(!M[g.m].transparent)solids.push(m);});
 const d=new THREE.Mesh(new THREE.CircleGeometry(900,32),new THREE.MeshBasicMaterial({color:0x4a423a}));d.rotation.x=-Math.PI/2;d.position.y=-.3;DZ.add(d);
 APO.cols.forEach(c=>{const b={a:c[0]+AX,b:c[1]+AX,c:c[2],d:c[3],e:c[4]+AZ,f:c[5]+AZ};boxes.push(b);gridAdd(b);});}
// ---- enterable, solid, grounded buildings (replace the model's baked facades) ----
function facadeTex(base,acc){const c=document.createElement('canvas');c.width=512;c.height=290;const g=c.getContext('2d');g.fillStyle=base;g.fillRect(0,0,512,290);
 for(let i=0;i<1500;i++){g.fillStyle='rgba('+(Math.random()<.5?'0,0,0':'255,255,255')+','+Math.random()*.08+')';g.fillRect(Math.random()*512,Math.random()*290,8+Math.random()*30,3+Math.random()*6);}
 for(let w=0;w<2;w++){const x=70+w*210,y=55,ww=150,hh=150;g.fillStyle=acc;g.fillRect(x-9,y-9,ww+18,hh+18);g.fillStyle='#0f151b';g.fillRect(x,y,ww,hh);
  g.fillStyle='rgba(120,150,170,'+(.12+Math.random()*.3)+')';g.fillRect(x+6,y+6,ww/2-9,hh/2-9);g.fillStyle=acc;g.fillRect(x+ww/2-2,y,4,hh);g.fillRect(x,y+hh/2-2,ww,4);
  if(Math.random()<.6){g.strokeStyle='rgba(220,230,240,.5)';g.lineWidth=2;g.beginPath();g.moveTo(x+20,y+10);g.lineTo(x+70,y+70);g.lineTo(x+50,y+130);g.stroke();}}
 g.fillStyle='rgba(0,0,0,.4)';g.fillRect(0,268,512,22);const gr=g.createLinearGradient(0,0,0,290);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(20,12,6,.35)');g.fillStyle=gr;g.fillRect(0,0,512,290);
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t;}
function shellMesh(list,tex){const P=[],U=[],I=[],TW=6,TH=3.4;
 const q=(a,b,c,d,ua,ub,uc,ud)=>{const n=P.length/3;P.push(...a,...b,...c,...d);U.push(...ua,...ub,...uc,...ud);I.push(n,n+1,n+2,n,n+2,n+3);};
 list.forEach(([x0,x1,y0,y1,z0,z1])=>{const vy0=y0/TH,vy1=y1/TH;
  q([x1,y0,z0],[x1,y0,z1],[x1,y1,z1],[x1,y1,z0],[z0/TW,vy0],[z1/TW,vy0],[z1/TW,vy1],[z0/TW,vy1]);
  q([x0,y0,z1],[x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[z1/TW,vy0],[z0/TW,vy0],[z0/TW,vy1],[z1/TW,vy1]);
  q([x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],[x0/TW,vy0],[x1/TW,vy0],[x1/TW,vy1],[x0/TW,vy1]);
  q([x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],[x1/TW,vy0],[x0/TW,vy0],[x0/TW,vy1],[x1/TW,vy1]);
  q([x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1],[x0/TW,z0/TW],[x1/TW,z0/TW],[x1/TW,z1/TW],[x0/TW,z1/TW]);});
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(P,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));geo.setIndex(I);geo.computeVertexNormals();
 const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:tex,roughness:.95,side:THREE.DoubleSide}));m.castShadow=m.receiveShadow=true;scene.add(m);solids.push(m);}
{const st=3.4,T=.5,FT=[['#6d5648','#2a2623'],['#7a7469','#222'],['#8a7a5e','#2b2a24'],['#58504a','#1d1d1d']].map(c=>facadeTex(c[0],c[1])),LS=FT.map(()=>[]),b0=boxes.length;
 for(const k in IB){IB[k].p=[];IB[k].i=[];}{const nb=CD.bld.find(o=>o.n==='NEWSGLOBAL');if(nb)buildInterior(nb,CD.bld.indexOf(nb));}
 APO.bld.forEach((q,i)=>{const w=q[2],d=q[3],S=Math.max(3,Math.min(16,Math.round(q[4]/st))),x=q[0]+AX,z=q[1]+AZ,H=S*st,dx=AX-x,dz=AZ-z;
  let fx=0,fz=0;if(Math.abs(dx)>Math.abs(dz))fx=Math.sign(dx)||1;else fz=Math.sign(dz)||1;
  const b={k:'b',n:'Ruin '+(i+1),s:S,x,z,w,d,h:H,y0:0,st,fx,fz,dw:3.2,ra:1,esc:0},aZ=Math.abs(fz)>.5,Wl=aZ?w:d,Dl=aZ?d:w,rx=fz,rz=-fx;
  const L=(a,c)=>[x+a*rx+c*fx,z+a*rz+c*fz],bb=(a0,a1,c0,c1)=>{const p=L(a0,c0),r=L(a1,c1);return[Math.min(p[0],r[0]),Math.max(p[0],r[0]),Math.min(p[1],r[1]),Math.max(p[1],r[1])];};
  const add=(a0,a1,y0,y1,c0,c1)=>{const r=bb(a0,a1,c0,c1);LS[i%4].push([r[0],r[1],y0,y1,r[2],r[3]]);boxes.push({a:r[0],b:r[1],c:y0,d:y1,e:r[2],f:r[3]});};
  add(-Wl/2,Wl/2,0,H,-Dl/2,-Dl/2+T);add(-Wl/2,-Wl/2+T,0,H,-Dl/2+T,Dl/2-T);add(Wl/2-T,Wl/2,0,H,-Dl/2+T,Dl/2-T);
  add(-Wl/2,-1.6,0,H,Dl/2-T,Dl/2);add(1.6,Wl/2,0,H,Dl/2-T,Dl/2);add(-1.6,1.6,2.8,H,Dl/2-T,Dl/2);
  buildInterior(b,CD.bld.length);CD.bld.push(b);});
 LS.forEach((l,i)=>{if(l.length)shellMesh(l,FT[i]);});
 for(const k in IB){const g=IB[k];if(!g.p.length)continue;const m=IBM[k],geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(g.p,3));geo.setIndex(g.i);const ng=geo.toNonIndexed();ng.computeVertexNormals();
  const mt=m.basic?new THREE.MeshBasicMaterial({color:new THREE.Color(m.c[0],m.c[1],m.c[2])}):new THREE.MeshStandardMaterial({color:new THREE.Color(m.c[0],m.c[1],m.c[2]),roughness:m.r,metalness:m.m});
  const ms=new THREE.Mesh(ng,mt);if(!m.basic&&window.INTM)INTM.push(mt);ms.castShadow=true;ms.receiveShadow=true;scene.add(ms);solids.push(ms);}
 scene.remove(HALLI);window.HALLI=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),hallMat,HALLS.length);scene.add(HALLI);HALLS.forEach((h,i)=>{h.id=i;});ELEV.forEach(e=>setHalls(e));
 for(let i=b0;i<boxes.length;i++)gridAdd(boxes[i]);}
// ---- cars are solid for the player (pushes you out instead of walking through) ----
function carPush(){if(!locked||inCar)return;for(const c of cars){if(p.y>1.6)continue;const R=.45,s=Math.sin(c.yaw),co=Math.cos(c.yaw),dx=p.x-c.x,dz=p.z-c.z,u=-dx*s-dz*co,v=dx*co-dz*s,hu=2.35+R,hv=1.05+R;
  if(Math.abs(u)<hu&&Math.abs(v)<hv){let nu=u,nv=v;if(hu-Math.abs(u)<hv-Math.abs(v))nu=Math.sign(u||1)*hu;else nv=Math.sign(v||1)*hv;
   const nx=c.x-nu*s+nv*co,nz=c.z-nu*co-nv*s;if(!hit(nx,p.y,nz,R,H)){p.x=nx;p.z=nz;}}}}
const _st=survivalTick;survivalTick=function(dt){_st(dt);carPush();};
// ---- american road through the Dead Zone (straightened, flattened onto the ground) ----
{const M=mkMats(ROAD.mats,ROAD.tex),RG=new THREE.Group();RG.position.set(275,0,0);DZ.add(RG);
 ROAD.geos.forEach(g=>{const m=new THREE.Mesh(mkGeo(g),M[g.m]);m.receiveShadow=true;RG.add(m);});}
// ---- HIGHWAY: from the edge of EKO (x=616) to the Dead Zone (curves round the ruined city, joins the American road at x~2240) ----
{const HG=new THREE.Group();scene.add(HG);
 const pts=[[540,0],[1000,0],[1500,0],[1650,0],[1730,70],[1810,200],[1900,200],[2100,200],[2240,200]].map(a=>new THREE.Vector3(a[0],0,a[1]));
 const cur=new THREE.CatmullRomCurve3(pts,false,'centripetal'),N=900,sp=cur.getSpacedPoints(N),tg=[];
 for(let i=0;i<=N;i++)tg.push(cur.getTangentAt(i/N));
 const len=cur.getLength();
 function ribbon(w,y,tex,period,mat){const P=[],U=[],I=[],Nn=[];let s=0;
  for(let i=0;i<=N;i++){if(i)s+=sp[i].distanceTo(sp[i-1]);const t=tg[i],sx=-t.z,sz=t.x,l=Math.hypot(sx,sz),nx=sx/l,nz=sz/l,p=sp[i];
   P.push(p.x+nx*w/2,y,p.z+nz*w/2, p.x-nx*w/2,y,p.z-nz*w/2);U.push(0,s/period,1,s/period);Nn.push(0,1,0,0,1,0);
   if(i){const a=(i-1)*2;I.push(a,a+2,a+1,a+1,a+2,a+3);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(Nn,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.setIndex(I);
  const m=new THREE.Mesh(g,mat);m.receiveShadow=true;m.frustumCulled=false;HG.add(m);return m;}
 function cv(w,h,f){const c=document.createElement('canvas');c.width=w;c.height=h;f(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;t.anisotropy=8;return t;}
 const noise=(g,w,h,n,a)=>{for(let i=0;i<n;i++){g.fillStyle='rgba('+(Math.random()<.5?'255,255,255':'0,0,0')+','+Math.random()*a+')';g.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*2,1+Math.random()*3);}};
 // desert verge under everything
 const dirt=cv(256,256,(g,w,h)=>{g.fillStyle='#6a5a47';g.fillRect(0,0,w,h);noise(g,w,h,5000,.12);for(let i=0;i<60;i++){g.fillStyle='rgba(40,30,20,'+(.05+Math.random()*.1)+')';g.beginPath();g.arc(Math.random()*w,Math.random()*h,4+Math.random()*14,0,7);g.fill();}});
 const vm=new THREE.MeshStandardMaterial({map:dirt,roughness:1,metalness:0});
 const verge=ribbon(460,.012,dirt,24,vm);dirt.repeat.set(460/24,1);
 // gravel shoulders
 const grav=cv(128,128,(g,w,h)=>{g.fillStyle='#4a4540';g.fillRect(0,0,w,h);noise(g,w,h,2500,.16);});
 ribbon(26,.03,grav,12,new THREE.MeshStandardMaterial({map:grav,roughness:1,metalness:0}));
 // asphalt with edge lines and a dashed centre line (one tile = 24 m along the road)
 const asph=cv(128,256,(g,w,h)=>{g.fillStyle='#2a2c30';g.fillRect(0,0,w,h);noise(g,w,h,4500,.08);
  g.fillStyle='rgba(0,0,0,.18)';g.fillRect(w*.3,0,w*.12,h);g.fillRect(w*.58,0,w*.12,h);
  g.fillStyle='#d9d4c4';g.fillRect(w*.07,0,5,h);g.fillRect(w*.93-5,0,5,h);
  g.fillStyle='#e0b43a';g.fillRect(w*.5-2,0,4,h*.5);
  g.strokeStyle='rgba(0,0,0,.5)';g.lineWidth=1;for(let i=0;i<5;i++){g.beginPath();let x=Math.random()*w,y=Math.random()*h;g.moveTo(x,y);for(let k=0;k<6;k++){x+=(Math.random()-.5)*14;y+=Math.random()*18;g.lineTo(x,y);}g.stroke();}});
 const am=new THREE.MeshStandardMaterial({map:asph,roughness:.82,metalness:.05});am.polygonOffset=true;am.polygonOffsetFactor=-2;am.polygonOffsetUnits=-2;
 ribbon(16,.05,asph,24,am);
 // roadside delineator posts + street lamps along the whole route
 const at=(d)=>{const u=Math.min(1,Math.max(0,d/len)),t=cur.getTangentAt(u),p=cur.getPointAt(u),l=Math.hypot(t.z,t.x);return{p,nx:-t.z/l,nz:t.x/l,t};};
 const nP=Math.floor(len/30),nL=Math.floor(len/80);
 const posts=new THREE.InstancedMesh(new THREE.BoxGeometry(.18,1.1,.18),new THREE.MeshStandardMaterial({color:0xd9d4c4,roughness:.6,emissive:0x331a00}),nP*2),
  poles=new THREE.InstancedMesh(new THREE.BoxGeometry(.28,9,.28),new THREE.MeshStandardMaterial({color:0x4a4d52,roughness:.7,metalness:.4}),nL*2),
  heads=new THREE.InstancedMesh(new THREE.BoxGeometry(2.2,.22,.7),new THREE.MeshBasicMaterial({color:0xffdca0,fog:true}),nL*2);
 const M4=new THREE.Matrix4(),Q=new THREE.Quaternion(),UP=new THREE.Vector3(0,1,0),S1=new THREE.Vector3(1,1,1),V=new THREE.Vector3();
 for(let i=0;i<nP;i++){const a=at(10+i*30);Q.setFromAxisAngle(UP,Math.atan2(-a.t.z,a.t.x));for(let s=0;s<2;s++){const o=(s?-1:1)*(8+.9);V.set(a.p.x+a.nx*o,.55,a.p.z+a.nz*o);M4.compose(V,Q,S1);posts.setMatrixAt(i*2+s,M4);}}
 for(let i=0;i<nL;i++){const a=at(40+i*80);Q.setFromAxisAngle(UP,Math.atan2(-a.t.z,a.t.x));for(let s=0;s<2;s++){const o=(s?-1:1)*(8+4);V.set(a.p.x+a.nx*o,4.5,a.p.z+a.nz*o);M4.compose(V,Q,S1);poles.setMatrixAt(i*2+s,M4);
   V.set(a.p.x+a.nx*(o-(s?-1:1)*1),9.05,a.p.z+a.nz*(o-(s?-1:1)*1));M4.compose(V,Q,S1);heads.setMatrixAt(i*2+s,M4);}}
 [posts,poles,heads].forEach(m=>{m.frustumCulled=false;m.instanceMatrix.needsUpdate=true;HG.add(m);});
 posts.castShadow=poles.castShadow=false;
 // road signs
 function sign(t1,t2,dist,side,face){const tex=cv(512,256,(g,w,h)=>{g.fillStyle='#0b6b3a';g.fillRect(0,0,w,h);g.strokeStyle='#f2f2f2';g.lineWidth=8;g.strokeRect(10,10,w-20,h-20);g.fillStyle='#fff';g.textAlign='center';g.font='900 78px sans-serif';g.fillText(t1,w/2,115);g.font='700 44px sans-serif';g.fillText(t2,w/2,185);});
  tex.wrapS=tex.wrapT=THREE.ClampToEdgeWrapping;const a=at(dist),o=side*(8+7),x=a.p.x+a.nx*o,z=a.p.z+a.nz*o;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(9,4.5),new THREE.MeshBasicMaterial({map:tex}));m.position.set(x,6,z);m.rotation.y=Math.atan2(-face*a.t.x,-face*a.t.z);HG.add(m);
  [-3.4,3.4].forEach(dx=>{const p=new THREE.Mesh(new THREE.BoxGeometry(.3,6,.3),new THREE.MeshStandardMaterial({color:0x555a60,metalness:.5,roughness:.6}));p.position.set(x+Math.cos(m.rotation.y)*dx,3,z-Math.sin(m.rotation.y)*dx);HG.add(p);});}
 sign('DEAD ZONE','1.4 KM  \u2192',90,1,1);
 sign('DEAD ZONE','\u26A0 NO SERVICES AHEAD',len*.5,1,1);
 sign('\u2190 EKO','1.4 KM',len-120,-1,-1);
 }

// ---- the sun (whole game), galaxies (night sky only), day/night ----
const SUNG=new THREE.Group();scene.add(SUNG);const sunMs=[];
{const tx=SUN.tex.map(u=>{const t=new THREE.TextureLoader().load(u);t.flipY=false;t.encoding=THREE.sRGBEncoding;return t;});
 const SM=SUN.mats.map(m=>{const o={map:m.t>=0?tx[m.t]:null,fog:false,toneMapped:false,side:THREE.DoubleSide};
  if(m.am==='BLEND'){o.transparent=true;o.opacity=.85;o.blending=THREE.AdditiveBlending;o.depthWrite=false;}return new THREE.MeshBasicMaterial(o);});
 SUN.geos.forEach(g=>{const m=new THREE.Mesh(mkGeo(g),SM[g.m]);m.frustumCulled=false;m.scale.setScalar(3.2);SUNG.add(m);sunMs.push({m,mt:SM[g.m],o:SM[g.m].opacity});});}
const GALG=new THREE.Group();scene.add(GALG);const galMs=[];
function mkPts(d,size,cnt,R0,R1,seed){
 const q=b64a(d.p,Int16Array),k=d.sc/32767,c=b64a(d.c,Uint8Array),stp=Math.max(1,Math.ceil(d.n/4000)),m=Math.ceil(d.n/stp),P=new Float32Array(m*3),C=new Float32Array(m*3);
 for(let i=0,j=0;i<d.n;i+=stp,j++){P[j*3]=q[i*3]*k;P[j*3+1]=q[i*3+1]*k;P[j*3+2]=q[i*3+2]*k;C[j*3]=c[i*4]/255;C[j*3+1]=c[i*4+1]/255;C[j*3+2]=c[i*4+2]/255;}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(P,3));geo.setAttribute('color',new THREE.BufferAttribute(C,3));
 const base=new THREE.PointsMaterial({size,sizeAttenuation:false,vertexColors:true,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,toneMapped:false});
 let s=seed>>>0;const rnd=()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};
 const ext=d.sc;
 for(let n=0;n<cnt;n++){
  const u=rnd()*2-1,ph=rnd()*Math.PI*2,y=Math.max(-.12,u),r=Math.sqrt(Math.max(0,1-y*y)),D=470;
  const rad=R0+rnd()*(R1-R0),sc=rad/ext,mt=base.clone();
  const pt=new THREE.Points(geo,mt);pt.frustumCulled=false;pt.scale.setScalar(sc);pt.rotation.set(rnd()*Math.PI,rnd()*Math.PI*2,rnd()*Math.PI);
  const h=new THREE.Group();h.add(pt);h.position.set(Math.cos(ph)*r*D,y*D,Math.sin(ph)*r*D);GALG.add(h);
  galMs.push({pt,mt,k:.1+rnd()*.2,sp:(rnd()-.5)*.00006});}}
{const _m=(('ontouchstart' in window)||innerWidth<900);mkPts(GAL.mw,1.1,_m?18:34,7,28,1337);mkPts(GAL.col,1.1,_m?12:22,4,16,4242);}
let nightMode=null,nf=0,envT=performance.now();
let gHr=null;function fmtH(h){const H=Math.floor(h)%24,M=Math.floor((h%1)*60);return String(H).padStart(2,'0')+':'+String(M).padStart(2,'0');}
let sunY=1,tScale=1,tHour=null,tLast=performance.now();const sunTrue=new THREE.Vector3(.5,.7,.5).normalize(),TWH=new THREE.Color(0xff8a4a),TWM=new THREE.Color(0xb86a8a);
/* Sun path: rises in the east (+x) at 06:00, climbs to ~69deg in the south (+z) at 12:30, sets in the west (-x) at 19:00, then passes under the north. */
function gameHour(now){const d=new Date(),real=d.getHours()+d.getMinutes()/60+d.getSeconds()/3600,rd=real>=6&&real<19,dtm=now-tLast;tLast=now;
 if(nightMode!==null){tHour=null;return nightMode?(rd?23:real):(rd?real:12.5);}
 if(tScale===1){tHour=real;return real;}
 if(tHour===null)tHour=real;tHour=(tHour+dtm/3.6e6*tScale)%24;return tHour;}
function sunUpdate(h){const MAX=1.2,day=h>=6&&h<19;let el,ph,lel;
 if(day){const t=(h-6)/13;ph=Math.PI*t;el=MAX*Math.sin(Math.PI*t);lel=Math.max(el,.14);}
 else{const u=(h>=19?h-19:h+5)/11;ph=Math.PI+Math.PI*u;el=-MAX*.8*Math.sin(Math.PI*u);lel=.14+.5*Math.sin(Math.PI*u);}
 let hx=Math.cos(ph),hz=.45*Math.sin(ph);const hl=Math.hypot(hx,hz);hx/=hl;hz/=hl;
 sunTrue.set(hx*Math.cos(el),Math.sin(el),hz*Math.cos(el));sunY=sunTrue.y;
 sdir.set(hx*Math.cos(lel),Math.sin(lel),hz*Math.cos(lel));}
const dayC=new THREE.Color(0xcfe0ef),dzC=new THREE.Color(0x8a735c),nightC=new THREE.Color(0x02040c),tmpC=new THREE.Color(),HL=scene.children.find(o=>o.isHemisphereLight),sdir=sun.position.clone().normalize();
function envTick(now){const dt=Math.min(.1,(now-envT)/1000);envT=now;const gh=gameHour(now);gHr=gh;sunUpdate(gh);const night=sunTrue.y<-.03;
 nf+=((night?1:0)-nf)*Math.min(1,dt*.7);const z=ZI()>=0;
 tmpC.copy(z?dzC:dayC).lerp(nightC,nf);scene.background=tmpC.clone();scene.fog.color.copy(tmpC);scene.fog.far=z?320:480;sky.visible=!z&&nf<.5;
 sun.intensity=1.5*(1-nf)+.08*nf;if(HL)HL.intensity=.6*(1-nf)+.14*nf;
 SUNG.visible=nf<.7&&sunTrue.y>-.04;SUNG.position.copy(cam.position).addScaledVector(sunTrue,540);
 sunMs.forEach(s=>{s.m.rotation.y=now/9000;s.mt.opacity=s.o*(1-nf)*(z?.65:1);});
 GALG.visible=nf>.03;GALG.position.copy(cam.position);GALG.rotation.y=-gh*.2618;galMs.forEach(g=>{g.mt.opacity=Math.min(1,nf*1.1)*g.k;g.pt.rotation.y+=g.sp*dt*1000;});}
const _ht=hudTick;hudTick=function(n){_ht(n);envTick(n);};
addEventListener('keydown',e=>{if(e.code==='KeyN'&&locked){nightMode=nightMode===null?true:nightMode===true?false:null;toast('Time: '+(nightMode===null?'AUTO (real clock)':nightMode?'NIGHT':'DAY'));}});
{const k=document.querySelector('.keys');if(k)k.innerHTML+=' &nbsp;/&nbsp; N DAY-NIGHT &nbsp;/&nbsp; Y TIME SPEED';}
addEventListener('keydown',e=>{if(e.code==='KeyY'&&locked){nightMode=null;tScale=tScale===1?60:tScale===60?600:1;tHour=null;toast('Time: '+(tScale===1?'REAL CLOCK':tScale===60?'FAST (x60, ~24 min day)':'VERY FAST (x600, ~2.4 min day)'));}});
function dzSpawn(){for(let r=0;r<150;r+=3)for(let a=0;a<12;a++){const x=AX+Math.cos(a*.52)*r,z=AZ+Math.sin(a*.52)*r;if(!hit(x,0,z,1.2,H+.2))return[x,z];}return[AX,AZ];}
let lastMain=[40,0,-10];
function travel(){if(!locked||inCar)return;if(p.x>1300){p.x=lastMain[0];p.y=lastMain[1];p.z=lastMain[2];toast('Back in EKO');}
 else{lastMain=[p.x,p.y,p.z];const s=dzSpawn();p.x=s[0];p.y=0;p.z=s[1];toast('DEAD ZONE: apocalyptic district');}p.vy=0;}
// ===== more districts: ALIEN CITY and NEO CITY (futuristic), reached with T like the Dead Zone =====
const ZN=[{n:'DEAD ZONE',t:'apocalyptic district',x:2000,z:0,pal:null},
 {n:'ALIEN CITY',t:'sci-fi district',x:0,z:-2300,pal:[0x8a5cc0,0x3b2a78,0x140a3c]},
 {n:'NEO CITY',t:'futuristic district',x:0,z:2300,pal:[0xc4d6ec,0x6f9bd6,0x2f63c0]}];
function ZI(){let b=-1,bd=1e9;for(let i=0;i<ZN.length;i++){const d=Math.hypot(p.x-ZN[i].x,p.z-ZN[i].z);if(d<900&&d<bd){bd=d;b=i;}}return b;}
function mkMats2(M,T){const tx=T.map(u=>{const t=new THREE.TextureLoader().load(u);t.flipY=false;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t;});
 return M.map(m=>{const o={color:new THREE.Color(m.c[0],m.c[1],m.c[2]),map:m.t>=0?tx[m.t]:null,side:m.ds?THREE.DoubleSide:THREE.FrontSide,roughness:.7,metalness:Math.min(.5,m.m||0)};
  if(m.am==='MASK')o.alphaTest=.5;if(m.am==='BLEND'||m.o<1){o.transparent=true;o.opacity=m.o;o.depthWrite=false;}
  const x=new THREE.MeshStandardMaterial(o);if(m.em&&x.map){x.emissive=new THREE.Color(1,1,1);x.emissiveMap=x.map;x.emissiveIntensity=.9;}else if(m.e&&m.e[0]+m.e[1]+m.e[2]>0)x.emissive=new THREE.Color(m.e[0],m.e[1],m.e[2]);return x;});}
function facadeTex2(base,acc,win,lit){const mk=()=>{const c=document.createElement('canvas');c.width=512;c.height=290;return c;},c=mk(),e=mk(),g=c.getContext('2d'),ge=e.getContext('2d');
 g.fillStyle=base;g.fillRect(0,0,512,290);ge.fillStyle='#000';ge.fillRect(0,0,512,290);
 for(let i=0;i<900;i++){g.fillStyle='rgba('+(Math.random()<.5?'0,0,0':'255,255,255')+','+Math.random()*.06+')';g.fillRect(Math.random()*512,Math.random()*290,8+Math.random()*30,3+Math.random()*6);}
 for(let w=0;w<2;w++){const x=70+w*210,y=55,ww=150,hh=150,on=Math.random()<.6;g.fillStyle=acc;g.fillRect(x-9,y-9,ww+18,hh+18);g.fillStyle=win;g.fillRect(x,y,ww,hh);
  if(on){ge.fillStyle=lit;ge.globalAlpha=.55+Math.random()*.45;ge.fillRect(x,y,ww,hh);ge.globalAlpha=1;}g.fillStyle=acc;g.fillRect(x+ww/2-2,y,4,hh);g.fillRect(x,y+hh/2-2,ww,4);}
 g.fillStyle='rgba(0,0,0,.35)';g.fillRect(0,268,512,22);
 const T=cv=>{const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t;};return{map:T(c),emi:T(e)};}
function shellMesh2(list,mat){const P=[],U=[],I=[],TW=6,TH=3.4;const q=(a,b,c,d,ua,ub,uc,ud)=>{const n=P.length/3;P.push(...a,...b,...c,...d);U.push(...ua,...ub,...uc,...ud);I.push(n,n+1,n+2,n,n+2,n+3);};
 list.forEach(([x0,x1,y0,y1,z0,z1])=>{const vy0=y0/TH,vy1=y1/TH;
  q([x1,y0,z0],[x1,y0,z1],[x1,y1,z1],[x1,y1,z0],[z0/TW,vy0],[z1/TW,vy0],[z1/TW,vy1],[z0/TW,vy1]);q([x0,y0,z1],[x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[z1/TW,vy0],[z0/TW,vy0],[z0/TW,vy1],[z1/TW,vy1]);
  q([x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],[x0/TW,vy0],[x1/TW,vy0],[x1/TW,vy1],[x0/TW,vy1]);q([x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],[x1/TW,vy0],[x0/TW,vy0],[x0/TW,vy1],[x1/TW,vy1]);
  q([x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1],[x0/TW,z0/TW],[x1/TW,z0/TW],[x1/TW,z1/TW],[x0/TW,z1/TW]);});
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(P,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));geo.setIndex(I);geo.computeVertexNormals();
 const m=new THREE.Mesh(geo,mat);m.castShadow=m.receiveShadow=true;scene.add(m);solids.push(m);}
function mkDistrict(D,cx,cz,o){const G=new THREE.Group();G.position.set(cx,0,cz);scene.add(G);const M=mkMats2(D.mats,D.tex);
 D.geos.forEach(g=>{const m=new THREE.Mesh(mkGeo(g),M[g.m]);G.add(m);if(!M[g.m].transparent)solids.push(m);});
 const d=new THREE.Mesh(new THREE.CircleGeometry(900,32),new THREE.MeshStandardMaterial({color:o.ground,roughness:1}));d.rotation.x=-Math.PI/2;d.position.y=-.3;G.add(d);
 const b0=boxes.length;D.cols.forEach(c=>{const b={a:c[0]+cx,b:c[1]+cx,c:c[2],d:c[3],e:c[4]+cz,f:c[5]+cz};boxes.push(b);gridAdd(b);});
 const st=3.4,T=.5,FT=o.fac.map(f=>{const t=facadeTex2(f[0],f[1],f[2],f[3]);return new THREE.MeshStandardMaterial({map:t.map,emissive:new THREE.Color(1,1,1),emissiveMap:t.emi,emissiveIntensity:o.emi,roughness:.8,metalness:.2,side:THREE.DoubleSide});}),LS=FT.map(()=>[]);
 for(const k in IB){IB[k].p=[];IB[k].i=[];}
 D.bld.forEach((q,i)=>{const w=q[2],d2=q[3],S=Math.max(3,Math.min(16,Math.round(q[4]/st))),x=q[0]+cx,z=q[1]+cz,H=S*st,dx=cx-x,dz=cz-z;let fx=0,fz=0;if(Math.abs(dx)>Math.abs(dz))fx=Math.sign(dx)||1;else fz=Math.sign(dz)||1;
  const b={k:'b',n:o.name+' '+(i+1),s:S,x,z,w,d:d2,h:H,y0:0,st,fx,fz,dw:3.2,ra:1,esc:0},aZ=Math.abs(fz)>.5,Wl=aZ?w:d2,Dl=aZ?d2:w,rx=fz,rz=-fx;
  const L=(a,c)=>[x+a*rx+c*fx,z+a*rz+c*fz],bb=(a0,a1,c0,c1)=>{const p0=L(a0,c0),r=L(a1,c1);return[Math.min(p0[0],r[0]),Math.max(p0[0],r[0]),Math.min(p0[1],r[1]),Math.max(p0[1],r[1])];};
  const add=(a0,a1,y0,y1,c0,c1)=>{const r=bb(a0,a1,c0,c1);LS[i%FT.length].push([r[0],r[1],y0,y1,r[2],r[3]]);boxes.push({a:r[0],b:r[1],c:y0,d:y1,e:r[2],f:r[3]});};
  add(-Wl/2,Wl/2,0,H,-Dl/2,-Dl/2+T);add(-Wl/2,-Wl/2+T,0,H,-Dl/2+T,Dl/2-T);add(Wl/2-T,Wl/2,0,H,-Dl/2+T,Dl/2-T);add(-Wl/2,-1.6,0,H,Dl/2-T,Dl/2);add(1.6,Wl/2,0,H,Dl/2-T,Dl/2);add(-1.6,1.6,2.8,H,Dl/2-T,Dl/2);
  buildInterior(b,CD.bld.length);CD.bld.push(b);});
 LS.forEach((l,i)=>{if(l.length)shellMesh2(l,FT[i]);});
 for(const k in IB){const g=IB[k];if(!g.p.length)continue;const m=IBM[k],geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(g.p,3));geo.setIndex(g.i);const ng=geo.toNonIndexed();ng.computeVertexNormals();
  const mt=m.basic?new THREE.MeshBasicMaterial({color:new THREE.Color(m.c[0],m.c[1],m.c[2])}):new THREE.MeshStandardMaterial({color:new THREE.Color(m.c[0],m.c[1],m.c[2]),roughness:m.r,metalness:m.m});
  const ms=new THREE.Mesh(ng,mt);ms.castShadow=true;ms.receiveShadow=true;scene.add(ms);solids.push(ms);}
 scene.remove(HALLI);window.HALLI=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),hallMat,HALLS.length);scene.add(HALLI);HALLS.forEach((h,i)=>{h.id=i;});ELEV.forEach(e=>setHalls(e));
 for(let i=b0;i<boxes.length;i++)gridAdd(boxes[i]);}
mkDistrict(ALN,ZN[1].x,ZN[1].z,{ground:0x1d1630,name:'Alien tower',emi:.8,fac:[['#2a2446','#58e8cf','#0a3a40','#58e8cf'],['#33284f','#b078ff','#2a1450','#c9a0ff'],['#1f2f3f','#5cd0ff','#0a2a3a','#7fe0ff']]});
mkDistrict(FUT,ZN[2].x,ZN[2].z,{ground:0x2d3036,name:'Neo tower',emi:.7,fac:[['#2c3846','#8fd8ff','#102a3a','#a8e6ff'],['#37424f','#e8f6ff','#14283a','#7ccaff'],['#252d38','#7fb6ff','#0c1c2c','#9fd4ff']]});
function zspawn(z){for(let r=0;r<200;r+=3)for(let a=0;a<12;a++){const x=z.x+Math.cos(a*.52)*r,zz=z.z+Math.sin(a*.52)*r;if(!hit(x,0,zz,1.2,H+.2))return[x,zz];}return[z.x,z.z];}
function travel(){if(!locked||inCar)return;const i=ZI();
 if(i>=ZN.length-1){p.x=lastMain[0];p.y=lastMain[1];p.z=lastMain[2];toast('Back in EKO');}
 else{if(i<0)lastMain=[p.x,p.y,p.z];const n=ZN[i+1],s=zspawn(n);p.x=s[0];p.y=0;p.z=s[1];toast(n.n+': '+n.t);}p.vy=0;}
addEventListener('keydown',e=>{if(e.code==='KeyT'&&locked)travel();});
{const b=document.createElement('button');b.className='tb';b.id='bTravel';b.textContent='TRAVEL';b.style.cssText='right:176px;bottom:292px';b.addEventListener('touchstart',e=>{e.preventDefault();travel();},{passive:false});$('tc').appendChild(b);
 const k=document.querySelector('.keys');if(k)k.innerHTML+=' &nbsp;/&nbsp; T TRAVEL (EKO > DEAD ZONE > ALIEN > NEO CITY)';}
// loft furniture kit placed on whichever building floor the player is on
const LM=mkMats(LOFT.mats,LOFT.tex),LP=new THREE.Group();scene.add(LP);
const lprops=LOFT.props.map(r=>{const g=new THREE.Group();r.parts.forEach(pt=>{const m=new THREE.Mesh(mkGeo(pt),LM[pt.m]);m.castShadow=m.receiveShadow=true;g.add(m);});g.visible=false;LP.add(g);
 const box={off:true,a:0,b:0,c:0,d:0,e:0,f:0};DYN.push(box);return{r,g,box};});
let fcur=null;
function clearF(){lprops.forEach(o=>{o.g.visible=false;o.box.off=true;});fcur=null;}
function furnish(b,f){const aZ=Math.abs(b.fz)>.5,Wl=aZ?b.w:b.d,Dl=aZ?b.d:b.w,T=.5,rx=b.fz,rz=-b.fx,th=Math.atan2(b.fx,b.fz),y=b.y0+f*b.st,iz0=-Dl/2+T;
 lprops.forEach(o=>{const r=o.r,lx=r.at[0],lz=r.at[1],ok=f>=0&&f<b.s&&Math.abs(lx)+r.w[0]/2<Wl/2-T-.4&&lz-r.w[1]/2>iz0+3.6&&lz+r.w[1]/2<Dl/2-T-.4;
  o.g.visible=ok;o.box.off=!ok||r.h<.3;if(!ok)return;
  const x=b.x+lx*rx+lz*b.fx,z=b.z+lx*rz+lz*b.fz;o.g.position.set(x,y+r.y,z);o.g.rotation.y=th;
  const ex=(Math.abs(rx)*r.w[0]+Math.abs(b.fx)*r.w[1])/2,ez=(Math.abs(rz)*r.w[0]+Math.abs(b.fz)*r.w[1])/2;
  Object.assign(o.box,{a:x-ex,b:x+ex,c:y+r.y,d:y+r.y+r.h,e:z-ez,f:z+ez});});}
setInterval(()=>{if(!locked||inCar){if(fcur)clearF();return;}
 let bb=null;for(const b of CD.bld)if(Math.abs(p.x-b.x)<b.w/2&&Math.abs(p.z-b.z)<b.d/2&&p.y>=b.y0-.5&&p.y<b.y0+b.h-.5){bb=b;break;}
 if(!bb){if(fcur)clearF();return;}
 const f=Math.round((p.y-bb.y0)/bb.st),key=bb.x+','+bb.z+','+f;if(key===fcur)return;furnish(bb,f);fcur=key;},250);


/* ===================================================================
   GTA-STYLE GRAPHICS LAYER
   golden-hour sky + clouds, image-based lighting (reflections), sharp
   follow-the-player shadows, car clearcoat paint, bloom + colour grade
   + film grain, headlights, dynamic FOV, circular radar, wanted stars.
   Press P in game to toggle the cinematic post-processing.
   =================================================================== */
window.GFXrender=function(dt){ren.render(scene,cam);};
(function(){
 const C3=THREE.Color,V3=THREE.Vector3;
 const G=window.GFX={fx:null,on:false,failed:false,frames:0,bloom:null,grade:null,heat:0,heatT:0,lastKills:0,shown:-1,fov:66,envRT:null,mats:new Set(),envI:.95,err:0,lastT:0};
 const mobile=('ontouchstart' in window)||innerWidth<900;
 const guard=(n,f)=>{try{f();}catch(e){console.warn('GFX '+n+' skipped',e);}};

 /* ---------- low golden-hour sun ---------- */
 /* sun position now follows the clock (see sunUpdate) */

 /* ---------- palettes (display colours) ---------- */
 const P={dh:new C3(0xf0c8a0),dm:new C3(0x86a9d8),dz:new C3(0x2a5db8),
          nh:new C3(0x15121a),nm:new C3(0x050812),nz:new C3(0x010208),
          zh:new C3(0x8a7358),zm:new C3(0x735b47),zz:new C3(0x4d3d30)};
 const SUNC=new C3(1,.72,.42),nightSun=new C3(.45,.55,.9),dustSun=new C3(.9,.7,.5),warmSun=new C3(1,.84,.62);

 /* ---------- procedural sky: gradient, sun glow, drifting clouds ---------- */
 const SKYV='varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
 const SKYF=`
 varying vec3 v;
 uniform vec3 uHor,uMid,uZen,uSunCol,uSun;uniform float uBoost,uTime,uCloud,uNight;
 float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
 float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y);}
 float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*vn(p);p=p*2.03+vec2(17.3,9.1);a*=.5;}return s;}
 void main(){
  vec3 d=normalize(v);float t=sqrt(max(d.y,0.));
  vec3 c=mix(uHor,uMid,smoothstep(0.,.4,t));c=mix(c,uZen,smoothstep(.35,1.,t));
  float sd=max(dot(d,uSun),0.);
  c+=uSunCol*(pow(sd,5.)*.30+pow(sd,48.)*.55)*uBoost*(1.-uNight*.9);
  if(uCloud>0.&&d.y>.02){
   vec2 cp=d.xz/(d.y+.12)*.85+vec2(uTime*.006,uTime*.002);
   float n=fbm(cp);
   float dens=smoothstep(.46,.74,n)*smoothstep(.02,.22,d.y);
   float n2=fbm(cp+uSun.xz*.09);
   float lit=clamp(1.-(n2-n)*3.5,0.,1.);
   vec3 shade=uHor*.45+uZen*.30;
   vec3 bright=vec3(.97,.95,.92)+uSunCol*.12;
   vec3 cl=mix(shade,bright,lit)+uSunCol*pow(sd,8.)*.5*lit;
   c=mix(c,cl*mix(1.,.10,uNight),dens*uCloud*(1.-.7*uNight));
  }
  gl_FragColor=vec4(c,1.);
 }`;
 function skyMat(env){return new THREE.ShaderMaterial({side:THREE.BackSide,fog:false,depthWrite:!!env,vertexShader:SKYV,fragmentShader:SKYF,
  uniforms:{uHor:{value:new C3()},uMid:{value:new C3()},uZen:{value:new C3()},uSunCol:{value:new C3(1,.72,.42)},uSun:{value:sunTrue},
   uBoost:{value:env?2.2:1},uTime:{value:0},uCloud:{value:env?0:1},uNight:{value:0}}});}
 const put=(u,c,L)=>{u.value.copy(c);if(L)u.value.convertSRGBToLinear();};
 function paintSky(mat,h,m,z,L,nt,time,cloud){const u=mat.uniforms;put(u.uHor,h,L);put(u.uMid,m,L);put(u.uZen,z,L);put(u.uSunCol,SUNC,L);u.uNight.value=nt;u.uTime.value=time;u.uCloud.value=cloud;}
 guard('sky',()=>{const old=sky.material;sky.material=skyMat(false);old.dispose();sky.renderOrder=-10;sky.frustumCulled=false;});


 /* ---------- procedural realistic facades (replace the flat cartoon window tiles) ---------- */
 const FAC=[];
 function rng(seed){let st=seed>>>0;return()=>{st=(st*1664525+1013904223)>>>0;return st/4294967296;};}
 function genFacade(seed,lit,tone){
  const W=512,H=1024,cols=4,rows=14,cw=W/cols,rh=H/rows,R=rng(seed);
  const mk=()=>{const c=document.createElement('canvas');c.width=W;c.height=H;return c;};
  const dc=mk(),ec=mk(),bc=mk(),rc=mk(),d=dc.getContext('2d'),e=ec.getContext('2d'),b=bc.getContext('2d'),r=rc.getContext('2d');
  d.fillStyle=tone;d.fillRect(0,0,W,H);e.fillStyle='#000';e.fillRect(0,0,W,H);b.fillStyle='#808080';b.fillRect(0,0,W,H);r.fillStyle='#d8d8d8';r.fillRect(0,0,W,H);
  for(let i=0;i<46;i++){const rx=40+R()*120,ry=20+R()*60,x0=R()*W,y0=R()*H;d.fillStyle=R()<.5?'rgba(0,0,0,.05)':'rgba(255,255,255,.05)';d.beginPath();d.ellipse(x0,y0,rx,ry,0,0,6.3);d.fill();}
  for(let j=0;j<rows;j++){
   d.fillStyle='rgba(0,0,0,.2)';d.fillRect(0,j*rh,W,5);b.fillStyle='#555';b.fillRect(0,j*rh,W,5);
   for(let i=0;i<cols;i++){
    const x=i*cw+11,y=j*rh+10,w=cw-22,h=rh-20,isLit=R()<lit;
    d.fillStyle='#b9bec2';d.fillRect(x-3,y-3,w+6,h+6);b.fillStyle='#d8d8d8';b.fillRect(x-3,y-3,w+6,h+6);r.fillStyle='#808080';r.fillRect(x-3,y-3,w+6,h+6);
    const k=R()*.25,g=d.createLinearGradient(0,y,0,y+h);
    g.addColorStop(0,'rgb('+((95+k*60)|0)+','+((130+k*50)|0)+','+((158+k*40)|0)+')');g.addColorStop(.55,'rgb(52,72,90)');g.addColorStop(1,'rgb(28,38,48)');
    d.fillStyle=g;d.fillRect(x,y,w,h);b.fillStyle='#707070';b.fillRect(x,y,w,h);r.fillStyle='#202020';r.fillRect(x,y,w,h);
    d.fillStyle='rgba(255,255,255,.14)';d.beginPath();d.moveTo(x+w*.1,y+h);d.lineTo(x+w*.45,y);d.lineTo(x+w*.7,y);d.lineTo(x+w*.35,y+h);d.fill();
    if(R()<.45){const bh=h*(.25+R()*.6);d.fillStyle='rgba(215,205,185,.55)';d.fillRect(x,y,w,bh);for(let yy=y;yy<y+bh;yy+=5){d.fillStyle='rgba(0,0,0,.18)';d.fillRect(x,yy,w,1);}}
    d.fillStyle='#aeb3b7';d.fillRect(x+w/2-2,y,4,h);b.fillStyle='#e0e0e0';b.fillRect(x+w/2-2,y,4,h);
    if(isLit){const eg=e.createLinearGradient(0,y,0,y+h);eg.addColorStop(0,'#ffe2a8');eg.addColorStop(1,'#ffb865');e.fillStyle=eg;e.fillRect(x,y,w,h);
     for(let yy=y;yy<y+h;yy+=6){e.fillStyle='rgba(0,0,0,.35)';e.fillRect(x,yy,w,1.5);}e.fillStyle='#000';e.fillRect(x+w/2-2,y,4,h);
     d.fillStyle='rgba(255,210,150,.16)';d.fillRect(x,y,w,h);}
    d.fillStyle='rgba(0,0,0,.25)';d.fillRect(x-3,y+h+3,w+6,3);
    const sg=d.createLinearGradient(0,y+h,0,y+h+rh*.8);sg.addColorStop(0,'rgba(20,15,10,.22)');sg.addColorStop(1,'rgba(20,15,10,0)');d.fillStyle=sg;d.fillRect(x+4,y+h+4,w-8,rh*.8);
   }}
  const id=d.getImageData(0,0,W,H),px=id.data;for(let q=0;q<px.length;q+=4){const nz=(R()-.5)*16;px[q]+=nz;px[q+1]+=nz;px[q+2]+=nz;}d.putImageData(id,0,0);
  const T=(c,srgb)=>{const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;if(srgb)t.encoding=THREE.sRGBEncoding;return t;};
  return{map:T(dc,1),emi:T(ec,1),bump:T(bc,0),rough:T(rc,0)};}
 guard('facades',()=>{
  const tones=['#9c9a92','#8f959b','#a69d8f','#838a90','#aaa59c','#8c9196'],lits=[.32,.4,.28,.35,.3,.38];
  const FT=[0,1,2,3,4,5].map(i=>genFacade(101+i*37,lits[i],tones[i]));
  scene.traverse(o=>{const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];
   ms.forEach(m=>{if(!m||!m.isMeshStandardMaterial||!m.map||!m.map.image||m.userData.fac)return;
    const i=CD.tex.indexOf(m.map.image.src);if(i<0||i>5)return;const f=FT[i];
    m.map=f.map;m.bumpMap=f.bump;m.bumpScale=2;m.roughnessMap=f.rough;m.roughness=1;m.metalness=Math.min(m.metalness,.1);
    m.emissive=new THREE.Color(1,.82,.55);m.emissiveMap=f.emi;m.emissiveIntensity=0;m.userData.fac=1;m.needsUpdate=true;FAC.push(m);});});
 });
 /* ---------- sharp shadows that follow the player (also fixes the Dead Zone) ---------- */
 const SHW=190;
 guard('shadows',()=>{sc2.left=sc2.bottom=-SHW;sc2.right=sc2.top=SHW;sc2.near=10;sc2.far=900;sc2.updateProjectionMatrix();
  sun.shadow.bias=-.0004;sun.shadow.normalBias=.05;scene.add(sun.target);});
 function follow(){let px,py,pz;
  if(!locked&&uiScreen==='garage'){px=0;py=0;pz=320;}else if(inCar){px=inCar.x;py=0;pz=inCar.z;}else{px=p.x;py=p.y;pz=p.z;}
  const Lv=sdir,r=new V3().crossVectors(new V3(0,1,0),Lv).normalize(),u=new V3().crossVectors(Lv,r).normalize();
  const tx=2*SHW/sun.shadow.mapSize.x,Pp=new V3(px,py,pz);
  const a=Math.round(Pp.dot(r)/tx)*tx,b=Math.round(Pp.dot(u)/tx)*tx,c=Pp.dot(Lv);
  const T=new V3().addScaledVector(r,a).addScaledVector(u,b).addScaledVector(Lv,c);
  sun.target.position.copy(T);sun.position.copy(T).addScaledVector(Lv,420);sun.target.updateMatrixWorld();}

 /* ---------- mood: sky, fog, light colours, exposure, reflection strength ---------- */
 const fill=scene.children.find(o=>o.isDirectionalLight&&o!==sun),amb=scene.children.find(o=>o.isAmbientLight);
 const hc=new C3(),mc=new C3(),zc=new C3(),fg=new C3();
 function mood(now){
  const zi=ZI(),z=zi>=0,zk=z?.85:0,n=nf,L=G.on;if(!G.dust)G.dust=[P.zh.getHex(),P.zm.getHex(),P.zz.getHex()];
  if(zi!==G.zi){G.zi=zi;const pl=(zi>0&&ZN[zi].pal)?ZN[zi].pal:G.dust;P.zh.setHex(pl[0]);P.zm.setHex(pl[1]);P.zz.setHex(pl[2]);}
  hc.copy(P.dh).lerp(P.zh,zk).lerp(P.nh,n);mc.copy(P.dm).lerp(P.zm,zk).lerp(P.nm,n);zc.copy(P.dz).lerp(P.zz,zk).lerp(P.nz,n);
  {const tw=Math.max(0,1-Math.abs(sunY+.02)/.32)*(1-zk*.55);hc.lerp(TWH,tw*.6);mc.lerp(TWM,tw*.28);}
  paintSky(sky.material,hc,mc,zc,L,n,now/1000,z?.3:1);
  fg.copy(hc);if(L)fg.convertSRGBToLinear();
  if(scene.background&&scene.background.isColor)scene.background.copy(fg);
  scene.fog.color.copy(fg);scene.fog.near=40;scene.fog.far=z?300:540;
  sky.position.copy(cam.position);sky.visible=true;
  sun.color.copy(warmSun).lerp(dustSun,z?.35:0).lerp(nightSun,n);
  sun.intensity=(2.6*(1-n)*(.3+.7*Math.min(1,Math.max(0,sunY/.35)))+.35*n)*(z?.8:1);
  {const lo=1-Math.min(1,Math.max(0,sunY/.45));sun.color.lerp(SUNC,lo*.85*(1-n));}
  if(HL){HL.intensity=.55*(1-n)+.14*n;HL.groundColor.setHex(0x8a6a48);}
  if(fill){fill.intensity=.4*(1-n)+.5*n;}
  if(amb){amb.intensity=.14*(1-n)+.16*n;}
  ren.toneMappingExposure=1.05*(1-n)+1.3*n;
  {const ei=Math.max(0,n-.15)*1.6;FAC.forEach(m=>{m.emissiveIntensity=ei;});}
  if(G.bloom){G.bloom.strength=.26+.4*n;G.bloom.threshold=.9-.3*n;G.bloom.radius=.55;}
  if(G.grade){G.grade.uniforms.uVig.value=.26+.12*n;}
 }

 /* ---------- headlights at night: low beam + wide fill, follow the steering, L = high beam ---------- */
 const HLS=[1,-1].map(()=>{const l=new THREE.SpotLight(0xfff1d6,0,75,.5,.5,1.2);scene.add(l);scene.add(l.target);return l;});
 const HLW=[1,-1].map(()=>{const l=new THREE.SpotLight(0xfff1d6,0,34,.95,.8,1.5);scene.add(l);scene.add(l.target);return l;});
 let hiBeam=false;addEventListener('keydown',e=>{if(e.code==='KeyL'&&!e.repeat&&locked&&inCar){hiBeam=!hiBeam;try{toast('HIGH BEAM '+(hiBeam?'ON':'OFF'));}catch(x){}}});
 function headlights(){const c=inCar,I=(c&&locked)?Math.max(0,nf-.12)*3.4:0,fxc=c&&c.g.userData.fx,hb=hiBeam?1.5:1;
  const place=(l,i,k,reach,spread)=>{if(!c)return;const yw=c.yaw+(c.steer||0)*.3,s=Math.sin(c.yaw),co=Math.cos(c.yaw),ax=-s,az=-co,rx=co,rz=-s,off=(i?1:-1)*(fxc?fxc.hlx:.75),dz=fxc?-fxc.hlz:2.1,hy=fxc?fxc.hly:.75,tx=-Math.sin(yw),tz=-Math.cos(yw);
   l.position.set(c.x+ax*dz+rx*off,hy,c.z+az*dz+rz*off);l.target.position.set(c.x+ax*dz+tx*reach+rx*off*spread,0,c.z+az*dz+tz*reach+rz*off*spread);l.target.updateMatrixWorld();};
  HLS.forEach((l,i)=>{l.intensity+=(I*hb-l.intensity)*.15;l.distance=hiBeam?120:75;l.angle=hiBeam?.34:.5;place(l,i,1,hiBeam?26:18,1.2);});
  HLW.forEach((l,i)=>{l.intensity+=(I*.35-l.intensity)*.15;place(l,i,1,10,1.8);});}

 /* ---------- wanted stars (kills raise heat, it cools off over time) ---------- */
 function stars(now){
  if(kills>G.lastKills){const d=kills-G.lastKills;G.lastKills=kills;if(roleName!=='OFFICER'){G.heat=Math.min(5,G.heat+d);G.heatT=now;toast('WANTED LEVEL '+G.heat);}}
  if(G.heat>0&&now-G.heatT>22000){G.heat--;G.heatT=now;}
  if(G.heat!==G.shown){G.shown=G.heat;const el=$('stars');
   if(el)el.innerHTML=[1,2,3,4,5].map(i=>'<span style="color:'+(i<=G.heat?'#ffd24a':'rgba(255,255,255,.28)')+'">\u2605</span>').join('');}}

 /* ---------- speed FOV ---------- */
 function camfx(now){const dt=Math.min(.1,Math.max(0,(now-(G.lastT||now))/1000));G.lastT=now;
  let tf=66;if(locked){const c=inCar;if(c)tf=(fpsView?76:66)+Math.min(1,Math.abs(c.speed)/32)*14;else tf=(fpsView?78:66)+(XS.sprint?4:0);}
  G.fov+=(tf-G.fov)*Math.min(1,dt*3);if(Math.abs(cam.fov-G.fov)>.05){cam.fov=G.fov;cam.updateProjectionMatrix();}}

 /* ---------- road surface: patches, cracks, oil ---------- */
 guard('road',()=>{const c=roadTex.image,g=c.getContext('2d');
  for(let i=0;i<60;i++){g.fillStyle='rgba(0,0,0,'+(.04+Math.random()*.06)+')';const r=20+Math.random()*60;g.beginPath();g.ellipse(Math.random()*512,Math.random()*512,r,r*(.3+Math.random()*.5),Math.random()*3,0,6.3);g.fill();}
  g.strokeStyle='rgba(0,0,0,.35)';for(let i=0;i<14;i++){g.beginPath();let x=Math.random()*512,y=Math.random()*512;g.moveTo(x,y);for(let k=0;k<6;k++){x+=(Math.random()-.5)*50;y+=(Math.random()-.5)*50;g.lineTo(x,y);}g.lineWidth=.6+Math.random();g.stroke();}
  roadTex.needsUpdate=true;ground.material.roughness=.82;ground.material.bumpMap=roadTex;ground.material.bumpScale=1.2;ground.material.needsUpdate=true;});

 /* ---------- cinematic post-processing: MSAA + bloom + colour grade + grain ---------- */
 const GradeShader={uniforms:{tDiffuse:{value:null},uTime:{value:0},uSat:{value:1.10},uCon:{value:1.10},uVig:{value:.28},uGrain:{value:.03},uCA:{value:.012}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`
  uniform sampler2D tDiffuse;uniform float uTime,uSat,uCon,uVig,uGrain,uCA;varying vec2 vUv;
  float hs(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
  vec3 toSRGB(vec3 c){c=max(c,vec3(0.));vec3 lo=c*12.92;vec3 hi=1.055*pow(c,vec3(1./2.4))-.055;return mix(hi,lo,vec3(lessThanEqual(c,vec3(.0031308))));}
  void main(){
   vec2 d=vUv-.5;vec2 off=d*dot(d,d)*uCA;
   vec3 col=vec3(texture2D(tDiffuse,vUv+off).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv-off).b);
   float l=dot(col,vec3(.2126,.7152,.0722));
   col=mix(vec3(l),col,uSat);
   col*=mix(vec3(.93,1.,1.07),vec3(1.07,1.,.91),smoothstep(.04,.55,l));
   col=max((col-.18)*uCon+.18,vec3(0.));
   col*=1.-uVig*smoothstep(.45,1.,length(d)*1.414);
   vec3 s=toSRGB(col);
   s+=(hs(gl_FragCoord.xy+fract(uTime)*91.7)-.5)*uGrain;
   gl_FragColor=vec4(s,1.);
  }`};
 function initFX(){
  if(!(THREE.EffectComposer&&THREE.RenderPass&&THREE.ShaderPass&&THREE.UnrealBloomPass&&THREE.CopyShader))return null;
  const gl=ren.getContext(),w2=!!ren.capabilities.isWebGL2;
  const half=!!(gl.getExtension('EXT_color_buffer_float')||gl.getExtension('EXT_color_buffer_half_float'));
  const sz=ren.getDrawingBufferSize(new THREE.Vector2());
  const o={minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat,type:half?THREE.HalfFloatType:THREE.UnsignedByteType};
  let rt;if(w2&&THREE.WebGLMultisampleRenderTarget){rt=new THREE.WebGLMultisampleRenderTarget(sz.x,sz.y,o);rt.samples=4;}else rt=new THREE.WebGLRenderTarget(sz.x,sz.y,o);
  const fx=new THREE.EffectComposer(ren,rt);
  fx.addPass(new THREE.RenderPass(scene,cam));
  G.bloom=new THREE.UnrealBloomPass(new THREE.Vector2(sz.x,sz.y),.3,.55,.9);fx.addPass(G.bloom);
  G.grade=new THREE.ShaderPass(GradeShader);fx.addPass(G.grade);
  return fx;}
 try{G.fx=initFX();}catch(e){console.warn('post FX unavailable',e);G.fx=null;}
 G.on=!!G.fx&&(!mobile||/[?&]fx=1/.test(location.search));
 G.off=function(msg){G.on=false;G.failed=true;toast(msg);console.warn(msg);};
 G.check=function(){try{const gl=ren.getContext(),cv=ren.domElement,W=cv.width,H2=cv.height,buf=new Uint8Array(4);let nz=0;
   for(const q of [[.5,.5],[.25,.3],[.75,.3],[.3,.7],[.7,.7],[.5,.2],[.5,.8]]){gl.readPixels((W*q[0])|0,(H2*q[1])|0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,buf);if(buf[0]+buf[1]+buf[2]>6)nz++;}
   if(nz===0&&nf<.5)G.off('Cinematic FX is not supported on this GPU, switched off');}catch(e){}};
 window.GFXrender=function(dt){
  if(G.on&&G.fx){
   try{G.grade.uniforms.uTime.value=performance.now()/1000;G.fx.render(dt);G.frames++;if(G.frames===6||G.frames===40)G.check();return;}
   catch(e){G.off('Cinematic FX error, switched off');}
  }
  ren.render(scene,cam);};
 addEventListener('resize',()=>{if(G.fx){try{const v=ren.getDrawingBufferSize(new THREE.Vector2());G.fx.setSize(v.x,v.y);}catch(e){}}});
 addEventListener('keydown',e=>{if(e.code==='KeyO'&&locked){if(!G.fx||G.failed){toast('Cinematic FX is not available on this device');return;}G.on=!G.on;toast('Cinematic FX: '+(G.on?'ON':'OFF'));}});
 {const k=document.querySelector('.keys');if(k)k.innerHTML+=' &nbsp;/&nbsp; O CINEMATIC FX &nbsp;/&nbsp; P FOREST';}

 /* ---------- hook into the existing per-frame environment tick ---------- */
 const _env=envTick;
 envTick=function(now){_env(now);try{mood(now);follow();headlights();stars(now);camfx(now);}catch(e){if(!G.err){G.err=1;console.warn('GFX tick',e);}}};
 guard('first-frame',()=>{mood(performance.now());follow();});
})();

/* ===== v18: 100 pedestrians. Female NPCs use the supplied models:
   "Handpaint - Girl 01" by Gregory Shcherbakov (CC BY-NC 4.0, sketchfab.com/3d-models/handpaint-girl-01-b007aa325b2946ef9f044c8c9471d0b3)
   "red sexy girl" by Roberto Dominguez (CC BY 4.0, sketchfab.com/3d-models/red-sexy-girl-9fa19f61b50d48a28798b79b0351d225) ===== */
(function(){try{
const N=100,NSIT=0,NFEM=32,NWOM=30;
const GLB_SIT="";
const SKIN=[0xf1c9a5,0xe0ac82,0xc68642,0x8d5524,0x6b4423,0x4a2c17];
const SHIRT=[0xc0392b,0x2980b9,0x27ae60,0xf1c40f,0xecf0f1,0x8e44ad,0x16a085,0xe67e22,0x2c3e50,0xd35400,0xe84393,0x95a5a6];
const PANT=[0x1f2a38,0x2b2b2b,0x3d4f6b,0x5b4636,0x6c7a89,0x222a35,0x4a3b2a];
const HAIR=[0x111111,0x2b1a10,0x4a2c17,0x8a6a3a,0xc9b27a,0x555555];
function mkIM(geo){const im=new THREE.InstancedMesh(geo,new THREE.MeshStandardMaterial({color:0xffffff,roughness:.85}),N);
 im.castShadow=true;im.frustumCulled=false;im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
 for(let i=0;i<N;i++)im.setColorAt(i,new THREE.Color(0xffffff));scene.add(im);return im;}
const gT=new THREE.BoxGeometry(.36,.56,.2);gT.translate(0,.28,0);
const gH=new THREE.SphereGeometry(.12,10,8);
const gL=new THREE.BoxGeometry(.15,.82,.15);gL.translate(0,-.41,0);
const gA=new THREE.BoxGeometry(.1,.56,.1);gA.translate(0,-.28,0);
const gR=new THREE.BoxGeometry(.27,.09,.27);
const imT=mkIM(gT),imH=mkIM(gH),imL=mkIM(gL),imR=mkIM(gL),imA=mkIM(gA),imB=mkIM(gA),imHr=mkIM(gR);
const IMS=[imT,imH,imL,imR,imA,imB,imHr];
const ZERO=new THREE.Matrix4().makeScale(0,0,0);
const BLD=CD.bld.map(b=>[b.x-b.w/2-.8,b.x+b.w/2+.8,b.z-b.d/2-.8,b.z+b.d/2+.8]);
function inB(x,z){for(let i=0;i<BLD.length;i++){const r=BLD[i];if(x>r[0]&&x<r[1]&&z>r[2]&&z<r[3])return true;}return false;}
function gy(x,z){return(TG.ok&&TG.near(x,z))?TG.y(x,z):0;}
function free(x,z,py){
 if(Math.abs(x)>300||Math.abs(z)>300)return null;
 if(typeof POOL!=='undefined'&&x>POOL.x0-1&&x<POOL.x1+1&&z>POOL.z0-1&&z<POOL.z1+1)return null;
 if(inB(x,z))return null;
 const g=gy(x,z);if(g!==g)return null;
 if(py!==undefined&&Math.abs(g-py)>.7)return null;
 if(hit(x,g+.05,z,.35,1.75))return null;
 for(const c of cars)if((c.x-x)*(c.x-x)+(c.z-z)*(c.z-z)<7)return null;
 return g;}
function spot(cx,cz,r0,r1){for(let t=0;t<80;t++){const a=Math.random()*6.2832,r=r0+Math.random()*(r1-r0),x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r,g=free(x,z);if(g!==null)return{x:x,z:z,y:g};}return null;}
const pick=a=>a[(Math.random()*a.length)|0];
const npcs=[];window.NPCS=npcs;
function dress(i){const sk=new THREE.Color(pick(SKIN)),sh=new THREE.Color(pick(SHIRT)),pa=new THREE.Color(pick(PANT)),hr=new THREE.Color(pick(HAIR));
 imT.setColorAt(i,sh);imH.setColorAt(i,sk);imL.setColorAt(i,pa);imR.setColorAt(i,pa);
 const short=Math.random()<.35;imA.setColorAt(i,short?sk:sh);imB.setColorAt(i,short?sk:sh);imHr.setColorAt(i,hr);
 IMS.forEach(m=>{if(m.instanceColor)m.instanceColor.needsUpdate=true;});}
function place(n,s){n.x=s.x;n.z=s.z;n.y=s.y;n.yaw=Math.random()*6.2832;n.tyaw=n.yaw;n.st=0;n.t=3+Math.random()*8;n.hp=60;n.fall=0;n.sw=0;n.ph=Math.random()*6;
 n.walk=1.0+Math.random()*.7;if(Math.random()<.12)n.walk=2.5;if(n.kind==='sit')n.st=1;n.panic=0;}
let ready=false,lastN=0,rr=0;
function init(){
 const px=(typeof p!=='undefined')?p.x:40,pz=(typeof p!=='undefined')?p.z:-10;
 for(let i=0;i<N;i++){const near=i<70,s=near?spot(px,pz,12,140):spot(0,0,100,260);
  const n={kind:'box',want:i<NSIT?'sit':(i<NSIT+NFEM?'fem':(i<NSIT+NFEM+NWOM?'wom':'box')),obj:null,fem:null,sc:.92+Math.random()*.16};npcs.push(n);
  if(!s){n.x=0;n.z=0;n.y=-500;n.st=3;n.t=0;n.fall=1;n.hp=0;n.sw=0;n.ph=0;n.yaw=0;n.tyaw=0;n.walk=1;n.dead=1;}else place(n,s);dress(i);}
 ready=true;try{toast(N+' pedestrians are out on the streets');}catch(e){}
 loadModels();}
function respawn(i){const n=npcs[i],s=spot(p.x,p.z,70,170)||spot(0,0,20,250);if(s){place(n,s);n.dead=0;if(n.kind==='box')dress(i);}else n.t=2;}
function down(i,byPlayer){const n=npcs[i];if(n.st===3)return;n.st=3;n.t=6;n.hp=0;n.fall=0;n.sw=0;if(byPlayer){try{kills++;}catch(e){}}}
function panicNear(x,z,rad){for(let i=0;i<N;i++){const n=npcs[i];if(n.st===3||n.kind==='sit')continue;const d=Math.hypot(n.x-x,n.z-z);if(d<rad){n.st=2;n.t=5+Math.random()*4;n.tyaw=Math.atan2(-(n.x-x),-(n.z-z))+(Math.random()-.5)*.8;n.panic=1;}}}
/* ---------- supplied female models ---------- */
function b64buf(s){const bin=atob(s),n=bin.length,u=new Uint8Array(n);for(let i=0;i<n;i++)u[i]=bin.charCodeAt(i);return u.buffer;}
function cloneSkinned(src){const clone=src.clone(true),sa=[],ca=[];src.traverse(o=>sa.push(o));clone.traverse(o=>ca.push(o));
 const map=new Map();for(let i=0;i<sa.length;i++)map.set(sa[i],ca[i]);
 for(let i=0;i<sa.length;i++){const s=sa[i];if(s.isSkinnedMesh){const c=ca[i],bones=s.skeleton.bones.map(b=>map.get(b));c.skeleton=new THREE.Skeleton(bones,s.skeleton.boneInverses);c.bind(c.skeleton,s.bindMatrix);}}
 return clone;}
let FEM=null,SIT=null;
const BONEPAT={thL:/thigh_l_\d+$/,thR:/thigh_r_\d+$/,caL:/calf_l_\d+$/,caR:/calf_r_\d+$/,uaL:/upperarm_l_\d+$/,uaR:/upperarm_r_\d+$/,laL:/lowerarm_l_\d+$/,laR:/lowerarm_r_\d+$/};
/* PNG -> canvas texture (no <img>/fetch/blob, which this sandbox blocks). Needs fflate (already loaded for the FBX loader). */
function decodePNG(u8){
 const dv=new DataView(u8.buffer,u8.byteOffset,u8.byteLength);let p=8,w=0,h=0;const idat=[];
 while(p<u8.length){const len=dv.getUint32(p),ty=String.fromCharCode(u8[p+4],u8[p+5],u8[p+6],u8[p+7]);
  if(ty==='IHDR'){w=dv.getUint32(p+8);h=dv.getUint32(p+12);}else if(ty==='IDAT')idat.push(u8.subarray(p+8,p+8+len));else if(ty==='IEND')break;p+=12+len;}
 let tl=0;idat.forEach(a=>tl+=a.length);const z=new Uint8Array(tl);let o=0;idat.forEach(a=>{z.set(a,o);o+=a.length;});
 const raw=fflate.unzlibSync(z),bpp=4,st=w*4,out=new Uint8ClampedArray(h*st);
 for(let y=0;y<h;y++){const f=raw[y*(st+1)],ro=y*(st+1)+1,oo=y*st,po=oo-st;
  for(let x=0;x<st;x++){const r=raw[ro+x],a=x>=bpp?out[oo+x-bpp]:0,b=y>0?out[po+x]:0,c=(x>=bpp&&y>0)?out[po+x-bpp]:0;let v;
   if(f===0)v=r;else if(f===1)v=r+a;else if(f===2)v=r+b;else if(f===3)v=r+((a+b)>>1);
   else{const pp=a+b-c,pa=Math.abs(pp-a),pb=Math.abs(pp-b),pc=Math.abs(pp-c);v=r+((pa<=pb&&pa<=pc)?a:(pb<=pc?b:c));}
   out[oo+x]=v&255;}}
 return{w:w,h:h,data:out};}
function pngTexture(b64){const d=decodePNG(new Uint8Array(b64buf(b64))),cv=document.createElement('canvas');cv.width=d.w;cv.height=d.h;
 cv.getContext('2d').putImageData(new ImageData(d.data,d.w,d.h),0,0);
 const t=new THREE.CanvasTexture(cv);t.flipY=false;t.encoding=THREE.sRGBEncoding;t.anisotropy=4;t.needsUpdate=true;return t;}
let TX=null;
function setupFem(g){
 const src=g.scene,junk=[];
 src.traverse(o=>{if(o.isMesh&&/ground/i.test(o.name))junk.push(o);});junk.forEach(o=>o.parent.remove(o));
 src.traverse(o=>{if(!o.isMesh)return;const old=o.material,nm=(old.name||'');
  const part=/bodyup/i.test(nm)?'up':/bodydwn/i.test(nm)?'dn':/hair/i.test(nm)?'hair':/eyes/i.test(nm)?'eyes':'head';
  const m=new THREE.MeshStandardMaterial({map:TX[part]||null,roughness:.88,metalness:0,side:THREE.DoubleSide,skinning:true});
  o.userData.part=part;o.material=m;});
 src.updateMatrixWorld(true);
 let headY=NaN,ballY=0;const v=new THREE.Vector3();
 src.traverse(o=>{if(o.isBone){if(/head_\d+$/.test(o.name)){o.getWorldPosition(v);headY=v.y;}if(/ball_l_\d+$/.test(o.name)){o.getWorldPosition(v);ballY=v.y;}}});
 let s=1.46/(headY-ballY);if(!(s>0&&isFinite(s)))s=.0092;
 const clip=g.animations&&g.animations[0],animQ=new Set();
 if(clip)clip.tracks.forEach(t=>{if(/\.quaternion$/.test(t.name))animQ.add(t.name.replace(/\.quaternion$/,''));});
 FEM={scene:src,clip:clip,scale:s,animQ:animQ};}
function setupSit(g){
 const src=g.scene;
 src.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=true;if(o.material&&o.material.name==='skin_dress'){o.material.map=TX.sit;o.material.needsUpdate=true;}
  if(o.material&&o.material.transparent){o.material.depthWrite=false;}}});
 SIT={scene:src};}
function makeFem(n){
 const clone=cloneSkinned(FEM.scene),holder=new THREE.Group(),obj=new THREE.Group();
 holder.rotation.y=Math.PI;holder.scale.setScalar(FEM.scale*(.96+n.sc*.06));holder.add(clone);obj.rotation.order='YXZ';obj.add(holder);
 const hue=Math.random(),hairT=pick([0xffffff,0xffffff,0xd8b08c,0x9a7a66,0xffc0b0]);
 clone.traverse(o=>{if(!o.isMesh)return;o.frustumCulled=false;o.castShadow=true;o.receiveShadow=false;o.material=o.material.clone();o.material.skinning=true;o.material.needsUpdate=true;
  const pt=o.userData.part;
  if(pt==='up')o.material.color.setHSL(hue,.4,.74);
  else if(pt==='dn'&&Math.random()<.6)o.material.color.setHSL((hue+.5)%1,.25,.7);
  else if(pt==='hair')o.material.color.setHex(hairT);});
 const bones={};clone.traverse(o=>{if(!o.isBone)return;for(const k in BONEPAT){if(!bones[k]&&BONEPAT[k].test(o.name)){bones[k]=o;o.userData.q0=o.quaternion.clone();o.userData.anim=FEM.animQ.has(o.name);}}});
 let mixer=null;if(FEM.clip){mixer=new THREE.AnimationMixer(clone);const a=mixer.clipAction(FEM.clip);a.play();a.time=Math.random()*8;}
 scene.add(obj);n.obj=obj;n.fem={clone:clone,bones:bones,mixer:mixer};}
function makeSit(n){
 const c=SIT.scene.clone(true),holder=new THREE.Group(),obj=new THREE.Group();
 holder.rotation.y=Math.PI;holder.add(c);obj.rotation.order='YXZ';obj.add(holder);scene.add(obj);n.obj=obj;}
function upgrade(kind){
 for(let i=0;i<N;i++){const n=npcs[i];if(n.want!==kind||n.kind===kind)continue;
  try{if(kind==='fem')makeFem(n);else if(kind==='wom')makeWom(n);else makeSit(n);}catch(e){console.warn('NPC model failed',e);continue;}
  n.kind=kind;IMS.forEach(m=>m.setMatrixAt(i,ZERO));}
 IMS.forEach(m=>{m.instanceMatrix.needsUpdate=true;});}
function loadModels(){try{loadWom();}catch(e){console.warn('female NPC (wom) skipped',e);}
 if(!THREE.GLTFLoader){console.warn('GLTFLoader not available: female models skipped');return;}
 if(typeof fflate==='undefined'){console.warn('fflate not available: female models skipped');return;}
 try{TX={};for(const k in TEX_B64)TX[k]=pngTexture(TEX_B64[k]);}catch(e){console.warn('texture decode failed',e);return;}
 const L=new THREE.GLTFLoader();
 try{L.parse(b64buf(GLB_FEM),'',g=>{try{setupFem(g);upgrade('fem');}catch(e){console.warn('female model skipped',e);}},e=>console.warn('female model error',e&&e.message||e));}catch(e){console.warn(e);}
 if(GLB_SIT)try{L.parse(b64buf(GLB_SIT),'',g=>{try{setupSit(g);upgrade('sit');}catch(e){console.warn('crouch model skipped',e);}},e=>console.warn('crouch model error',e&&e.message||e));}catch(e){console.warn(e);}}
/* ---------- new female NPC: static "npc_body_lod0" model (supplied GLB, embedded). Hair/body base: "12 Real-time woman Hairstyles collection 02" by Vincent Page, CC-BY-4.0, modified ---------- */
const WOM_TEX="zZRz/82Uc//NlHP/zZRz/82Uc//NlHP/zZRz/82Uc/8kWIz/JFiM/yRYjP8kWIz/JFiM/yRYjP8kWIz/JFiM/74yQP++MkD/vjJA/74yQP++MkD/vjJA/74yQP++MkD/DgoK/w4KCv8OCgr/DgoK/w4KCv8OCgr/DgoK/w4KCv+MJib/jCYm/4wmJv+MJib/jCYm/4wmJv+MJib/jCYm/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/82Uc//NlHP/zZRz/82Uc//NlHP/zZRz/82Uc//NlHP/JFiM/yRYjP8kWIz/JFiM/yRYjP8kWIz/JFiM/yRYjP++MkD/vjJA/74yQP++MkD/vjJA/74yQP++MkD/vjJA/w4KCv8OCgr/DgoK/w4KCv8OCgr/DgoK/w4KCv8OCgr/jCYm/4wmJv+MJib/jCYm/4wmJv+MJib/jCYm/4wmJv8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP/NlHP/zZRz/82Uc//NlHP/zZRz/82Uc//NlHP/zZRz/yRYjP8kWIz/JFiM/yRYjP8kWIz/JFiM/yRYjP8kWIz/vjJA/74yQP++MkD/vjJA/74yQP++MkD/vjJA/74yQP8OCgr/DgoK/w4KCv8OCgr/DgoK/w4KCv8OCgr/DgoK/4wmJv+MJib/jCYm/4wmJv+MJib/jCYm/4wmJv+MJib/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/zZRz/82Uc//NlHP/zZRz/82Uc//NlHP/zZRz/82Uc/8kWIz/JFiM/yRYjP8kWIz/JFiM/yRYjP8kWIz/JFiM/74yQP++MkD/vjJA/74yQP++MkD/vjJA/74yQP++MkD/DgoK/w4KCv8OCgr/DgoK/w4KCv8OCgr/DgoK/w4KCv+MJib/jCYm/4wmJv+MJib/jCYm/4wmJv+MJib/jCYm/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/82Uc//NlHP/zZRz/82Uc//NlHP/zZRz/82Uc//NlHP/JFiM/yRYjP8kWIz/JFiM/yRYjP8kWIz/JFiM/yRYjP++MkD/vjJA/74yQP++MkD/vjJA/74yQP++MkD/vjJA/w4KCv8OCgr/DgoK/w4KCv8OCgr/DgoK/w4KCv8OCgr/jCYm/4wmJv+MJib/jCYm/4wmJv+MJib/jCYm/4wmJv8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP/NlHP/zZRz/82Uc//NlHP/zZRz/82Uc//NlHP/zZRz/yRYjP8kWIz/JFiM/yRYjP8kWIz/JFiM/yRYjP8kWIz/vjJA/74yQP++MkD/vjJA/74yQP++MkD/vjJA/74yQP8OCgr/DgoK/w4KCv8OCgr/DgoK/w4KCv8OCgr/DgoK/4wmJv+MJib/jCYm/4wmJv+MJib/jCYm/4wmJv+MJib/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/zZRz/82Uc//NlHP/zZRz/82Uc//NlHP/zZRz/82Uc/8kWIz/JFiM/yRYjP8kWIz/JFiM/yRYjP8kWIz/JFiM/74yQP++MkD/vjJA/74yQP++MkD/vjJA/74yQP++MkD/DgoK/w4KCv8OCgr/DgoK/w4KCv8OCgr/DgoK/w4KCv+MJib/jCYm/4wmJv+MJib/jCYm/4wmJv+MJib/jCYm/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/82Uc//NlHP/zZRz/82Uc//NlHP/zZRz/82Uc//NlHP/JFiM/yRYjP8kWIz/JFiM/yRYjP8kWIz/JFiM/yRYjP++MkD/vjJA/74yQP++MkD/vjJA/74yQP++MkD/vjJA/w4KCv8OCgr/DgoK/w4KCv8OCgr/DgoK/w4KCv8OCgr/jCYm/4wmJv+MJib/jCYm/4wmJv+MJib/jCYm/4wmJv8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8=";
let WOM=null;
function loadWom(){
 const buf=b64buf(GLB_WOM),dv=new DataView(buf),jl=dv.getUint32(12,true);
 const js=JSON.parse(new TextDecoder().decode(new Uint8Array(buf,20,jl))),bo=20+jl+8;
 function acc(i){const a=js.accessors[i],bv=js.bufferViews[a.bufferView],off=bo+(bv.byteOffset||0)+(a.byteOffset||0);
  const nc={VEC3:3,VEC2:2,SCALAR:1}[a.type],C={5126:Float32Array,5123:Uint16Array,5125:Uint32Array}[a.componentType],len=a.count*nc;
  return{arr:new C(buf.slice(off,off+len*C.BYTES_PER_ELEMENT)),nc:nc};}
 const pr=js.meshes[0].primitives[0],P=acc(pr.attributes.POSITION),Nn=acc(pr.attributes.NORMAL),U=acc(pr.attributes.TEXCOORD_0),I=acc(pr.indices);
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.BufferAttribute(P.arr,3));geo.setAttribute('normal',new THREE.BufferAttribute(Nn.arr,3));geo.setAttribute('uv',new THREE.BufferAttribute(U.arr,2));
 geo.setIndex(new THREE.BufferAttribute(I.arr,1));geo.computeBoundingSphere();
 const tx=new THREE.DataTexture(new Uint8Array(b64buf(WOM_TEX)),64,8,THREE.RGBAFormat);
 tx.magFilter=THREE.NearestFilter;tx.minFilter=THREE.NearestFilter;tx.generateMipmaps=false;tx.flipY=false;tx.encoding=THREE.sRGBEncoding;tx.needsUpdate=true;
 const mat=new THREE.MeshStandardMaterial({map:tx,roughness:.75,metalness:0,side:THREE.DoubleSide});
 WOM={geo:geo,mat:mat};try{loadHair();}catch(e){HAIR_G=null;console.warn('hair pack skipped',e);}try{loadHairX();}catch(e){HAIRX=null;console.warn('extra hair skipped',e);}try{setupWomRig(tx);}catch(e){WOMR=null;console.warn('rigged female NPC skipped, using static model',e);}upgrade('wom');}
function makeWom(n){
 if(WOMR)return makeWomRig(n);
 const mesh=new THREE.Mesh(WOM.geo,WOM.mat),holder=new THREE.Group(),obj=new THREE.Group();
 mesh.castShadow=true;mesh.receiveShadow=false;
 holder.rotation.y=Math.PI;holder.scale.setScalar(n.sc);holder.add(mesh);obj.rotation.order='YXZ';obj.add(holder);
 try{attachHair(null,holder);}catch(e){console.warn('hair skipped',e);}
 scene.add(obj);n.obj=obj;}
/* ---------- rigged version: Body_Block.fbx (Mixamo skeleton). Uses the game's own idle/walk/run clips (rotation only) ---------- */
let WOMR=null;
function setupWomRig(tx){
 if(!THREE.FBXLoader)throw new Error('FBXLoader not available');
 const src=new THREE.FBXLoader().parse(b64buf(FBX_WOM),'');
 let skinned=false;
 const mat=new THREE.MeshStandardMaterial({map:tx,roughness:.75,metalness:0,side:THREE.DoubleSide,skinning:true});
 src.traverse(o=>{if(o.isSkinnedMesh){skinned=true;o.material=mat;const sw=o.geometry&&o.geometry.attributes.skinWeight;if(sw){for(let i=0;i<sw.count;i++){const t=sw.getX(i)+sw.getY(i)+sw.getZ(i)+sw.getW(i);if(t>0&&Math.abs(t-1)>1e-4)sw.setXYZW(i,sw.getX(i)/t,sw.getY(i)/t,sw.getZ(i)/t,sw.getW(i)/t);}sw.needsUpdate=true;}}else if(o.isMesh){o.material=mat;}});
 if(!skinned)throw new Error('no skinned mesh in FBX');
 const qOnly=c=>c?new THREE.AnimationClip(c.name,c.duration,c.tracks.filter(t=>/\.quaternion$/.test(t.name))):null;
 const clips={};
 try{if(typeof xb!=='undefined'&&xb){
  if(xb.idle)clips.idle=qOnly(xb.idle.getClip());
  if(xb.walk)clips.walk=qOnly(xb.walk.getClip());
  if(xb.A&&xb.A.run)clips.run=qOnly(xb.A.run.getClip());}}catch(e){}
 if(!clips.walk&&src.animations&&src.animations[0])clips.walk=src.animations[0];
 WOMR={scene:src,clips:clips};}
function makeWomRig(n){
 const clone=cloneSkinned(WOMR.scene),holder=new THREE.Group(),obj=new THREE.Group();
 holder.rotation.y=Math.PI;holder.scale.setScalar(n.sc);holder.add(clone);obj.rotation.order='YXZ';obj.add(holder);
 try{attachHair(clone,holder);}catch(e){console.warn('hair skipped',e);}
 clone.traverse(o=>{if(o.isMesh){o.frustumCulled=false;o.castShadow=true;o.receiveShadow=false;}});
 const mixer=new THREE.AnimationMixer(clone),A={};
 for(const k in WOMR.clips){const c=WOMR.clips[k];if(!c)continue;const a=mixer.clipAction(c);a.play();a.setEffectiveWeight(k==='idle'?1:0);a.time=Math.random()*c.duration;A[k]=a;}
 scene.add(obj);n.obj=obj;n.wrig={mixer:mixer,A:A};}
function animWom(n,dt){
 const r=n.wrig,A=r.A,sw=n.sw,run=n.st===2&&!!A.run,mv=A.idle?sw:1;
 if(A.idle)A.idle.setEffectiveWeight(1-sw);
 if(A.walk){A.walk.setEffectiveWeight(run?0:mv);A.walk.setEffectiveTimeScale(Math.max(.4,Math.min(1.9,n.walk/1.4)));}
 if(A.run){A.run.setEffectiveWeight(run?sw:0);A.run.setEffectiveTimeScale(1);}
 r.mixer.update(dt);}
/* ---------- hair pack (npc_hair_pack.glb): hair styles for the first NHAIR female NPCs. "12 Real-time woman Hairstyles collection 02" by Vincent Page, CC-BY-4.0, modified ---------- */
const NHAIR=10;
let HAIR_G=null,HAIR_M=null,hairUsed=0;
function loadHair(){
 const buf=b64buf(GLB_HAIR),dv=new DataView(buf),jl=dv.getUint32(12,true);
 const js=JSON.parse(new TextDecoder().decode(new Uint8Array(buf,20,jl))),bo=20+jl+8;
 function acc(i){const a=js.accessors[i],bv=js.bufferViews[a.bufferView],off=bo+(bv.byteOffset||0)+(a.byteOffset||0);
  const nc={VEC3:3,VEC2:2,SCALAR:1}[a.type],C={5126:Float32Array,5123:Uint16Array,5125:Uint32Array}[a.componentType],len=a.count*nc;
  return new C(buf.slice(off,off+len*C.BYTES_PER_ELEMENT));}
 const gs=[];
 for(const nd of js.nodes){if(nd.mesh===undefined)continue;const pr=js.meshes[nd.mesh].primitives[0];
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(acc(pr.attributes.POSITION),3));
  if(pr.attributes.NORMAL!==undefined)g.setAttribute('normal',new THREE.BufferAttribute(acc(pr.attributes.NORMAL),3));
  g.setIndex(new THREE.BufferAttribute(acc(pr.indices),1));g.computeBoundingSphere();gs.push(g);}
 const bc=(js.materials&&js.materials[0]&&js.materials[0].pbrMetallicRoughness&&js.materials[0].pbrMetallicRoughness.baseColorFactor)||[.16,.1,.07,1];
 HAIR_M=new THREE.MeshStandardMaterial({color:new THREE.Color().setRGB(bc[0],bc[1],bc[2]),roughness:.7,metalness:0,side:THREE.DoubleSide});
 HAIR_G=gs;}
/* ---------- extra hair: "Long reddish hair for game" by CarlosTorresVFX (CC-BY-4.0), "Two Long Ponytails With Little Bows (With Bones)" by zHairezt (CC-BY-4.0); both baked to rest pose and fitted to the NPC head ---------- */
const NRED=5,NPONY=5,HAIR_TINTS=[0x7a5238,0x4a3020,0x24170f,0xb08458,0xd2ad5e,0x9a4a2e];
let HAIRX=null;
function loadHairX(){
 if(typeof fflate==='undefined')throw new Error('fflate not available');
 const out={};
 for(const id in HX){const d=HX[id],u=fflate.unzlibSync(new Uint8Array(b64buf(d.data))),ab=u.buffer.slice(u.byteOffset,u.byteOffset+u.byteLength);
  let tx=null;
  if(d.tex){tx=new THREE.DataTexture(new Uint8Array(ab,d.tex.o,d.tex.w*d.tex.h*4),d.tex.w,d.tex.h,THREE.RGBAFormat);
   tx.generateMipmaps=true;tx.minFilter=THREE.LinearMipmapLinearFilter;tx.magFilter=THREE.LinearFilter;tx.wrapS=THREE.RepeatWrapping;tx.wrapT=THREE.RepeatWrapping;tx.flipY=false;tx.encoding=THREE.sRGBEncoding;tx.anisotropy=4;tx.needsUpdate=true;}
  const parts=d.parts.map(m=>{const g=new THREE.BufferGeometry(),textured=m.key==='tex';
   g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(ab,m.p,m.nv*3),3));
   g.setAttribute('normal',new THREE.BufferAttribute(new Float32Array(ab,m.n,m.nv*3),3));
   g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(ab,m.u,m.nv*2),2));
   g.setIndex(new THREE.BufferAttribute(m.i32?new Uint32Array(ab,m.i,m.ni):new Uint16Array(ab,m.i,m.ni),1));g.computeBoundingSphere();
   const mat=new THREE.MeshStandardMaterial(textured?{map:tx,alphaTest:.35,roughness:.8,metalness:0,side:THREE.DoubleSide}:{color:0xe6e6e6,roughness:.9,metalness:0,side:THREE.DoubleSide});
   return{geo:g,mat:mat,tint:id==='pony',textured:textured};});
  out[id]={parts:parts};}
 HAIRX=out;}
function mkHairNode(i){
 const mk=(g,m)=>{const x=new THREE.Mesh(g,m);x.castShadow=true;x.receiveShadow=false;x.frustumCulled=false;return x;};
 if(i<NHAIR)return(HAIR_G&&i<HAIR_G.length)?mk(HAIR_G[i],HAIR_M):null;
 const k=i-NHAIR,id=k<NRED?'red':(k<NRED+NPONY?'pony':null);
 if(!id||!HAIRX||!HAIRX[id])return null;
 const grp=new THREE.Group(),tc=pick(HAIR_TINTS);
 HAIRX[id].parts.forEach(p=>{let mt=p.mat;if(p.tint){mt=p.mat.clone();mt.color.setHex(tc);if(!p.textured)mt.color.multiplyScalar(.9);}grp.add(mk(p.geo,mt));});
 return grp;}
function attachHair(clone,holder){
 if(hairUsed>=NHAIR+NRED+NPONY)return;
 const i=hairUsed++,m=mkHairNode(i);if(!m)return;
 if(clone){
  let sm=null,head=null;clone.traverse(o=>{if(o.isSkinnedMesh)sm=o;if(!head&&/^mixamorig:?Head$/.test(o.name))head=o;});
  const bi=(sm&&head)?sm.skeleton.bones.indexOf(head):-1;
  if(bi<0)return;
  m.matrixAutoUpdate=false;m.matrix.multiplyMatrices(sm.skeleton.boneInverses[bi],sm.bindMatrix);head.add(m);
 }else holder.add(m);}
/* ---------- procedural walk laid over the idle clip ---------- */
const _qa=new THREE.Quaternion(),_qb=new THREE.Quaternion(),_qd=new THREE.Quaternion(),_ax=new THREE.Vector3(1,0,0);
function relQ(node,root,out){out.identity();for(let m=node;m&&m!==root;m=m.parent)out.premultiply(m.quaternion);return out;}
function bend(b,root,ang){if(!b||!ang)return;relQ(b.parent,root,_qa);_qd.setFromAxisAngle(_ax,ang);_qb.copy(_qa).invert();
 b.quaternion.premultiply(_qa).premultiply(_qd).premultiply(_qb);}
function applyWalk(f,n){
 const bs=f.bones,root=f.clone;
 for(const k in bs){const b=bs[k];if(!b.userData.anim)b.quaternion.copy(b.userData.q0);}
 const sw=n.sw,run=n.st===2?1:0,A=(run?.95:.62)*sw,ph=n.ph,sL=Math.sin(ph)*A,sR=-sL;
 const kL=Math.max(0,Math.cos(ph))*(run?1.25:.85)*sw,kR=Math.max(0,-Math.cos(ph))*(run?1.25:.85)*sw;
 bend(bs.thL,root,-sL);bend(bs.thR,root,-sR);
 bend(bs.caL,root,kL);bend(bs.caR,root,kR);
 bend(bs.uaL,root,sL*.55);bend(bs.uaR,root,sR*.55);
 const el=-(.2+.45*run)*sw;bend(bs.laL,root,el);bend(bs.laR,root,el);}
/* ---------- simulation ---------- */
const _q=new THREE.Quaternion(),_e=new THREE.Euler(),_v=new THREE.Vector3(),_s=new THREE.Vector3(),_b=new THREE.Matrix4(),_l=new THREE.Matrix4(),_o=new THREE.Matrix4();
function part(im,i,lx,ly,lz,rx){_l.compose(_v.set(lx,ly,lz),_q.setFromEuler(_e.set(rx,0,0)),_s.set(1,1,1));_o.multiplyMatrices(_b,_l);im.setMatrixAt(i,_o);}
function turn(a,b,mx){let d=b-a;while(d>Math.PI)d-=6.2832;while(d<-Math.PI)d+=6.2832;return a+Math.max(-mx,Math.min(mx,d));}
function tick(now,dt){
 const sy=(typeof inCar!=='undefined'&&inCar)?inCar:null,ppx=sy?sy.x:p.x,ppz=sy?sy.z:p.z;
 for(let i=0;i<N;i++){const n=npcs[i],sit=n.kind==='sit';
  if(n.st===3){n.t-=dt;n.fall=Math.min(1,n.fall+dt*3);if(n.t<=0)respawn(i);}
  else{
   n.t-=dt;
   if(sit){n.st=1;const ax=ppx-n.x,az=ppz-n.z;if(ax*ax+az*az<225)n.tyaw=Math.atan2(-ax,-az);}
   else if(n.st===0){if(n.t<=0){if(Math.random()<.28){n.st=1;n.t=1.5+Math.random()*4;}else{n.tyaw=n.yaw+(Math.random()-.5)*2.2;n.t=4+Math.random()*9;}}}
   else if(n.st===1){if(n.t<=0){n.st=0;n.tyaw=Math.random()*6.2832;n.t=4+Math.random()*9;}}
   else if(n.st===2){if(n.t<=0){n.st=0;n.panic=0;n.t=3+Math.random()*5;}}
   n.yaw=turn(n.yaw,n.tyaw,(n.st===2?7:(sit?1.6:3.2))*dt);
   const sp=n.st===1?0:(n.st===2?5.2:n.walk);
   if(sp>0){const fx=-Math.sin(n.yaw),fz=-Math.cos(n.yaw),nx=n.x+fx*sp*dt,nz=n.z+fz*sp*dt,g=free(nx,nz,n.y);
    if(g!==null){n.x=nx;n.z=nz;n.y+=(g-n.y)*Math.min(1,dt*12);}else{n.tyaw=n.yaw+(Math.random()<.5?1:-1)*(1.2+Math.random()*1.6);n.yaw=turn(n.yaw,n.tyaw,.6);if(n.st===2&&Math.random()<.3)n.st=0;}}
   n.sw+=((sp>0?Math.min(1,sp/1.4):0)-n.sw)*Math.min(1,dt*8);
   n.ph+=dt*(1.5+sp*2.2);
   const dx=n.x-ppx,dz=n.z-ppz,dd=Math.hypot(dx,dz);
   if(dd<.8&&dd>.001&&!sy){const nx=n.x+dx/dd*(.8-dd)*.5,nz=n.z+dz/dd*(.8-dd)*.5,g=free(nx,nz,n.y);if(g!==null){n.x=nx;n.z=nz;}}
   for(const c of cars){if(Math.abs(c.speed)>4){const cx=n.x-c.x,cz=n.z-c.z;if(cx*cx+cz*cz<5.5){down(i,false);panicNear(n.x,n.z,22);break;}}}
  }
  if(i===(rr%N)){const fd=Math.hypot(n.x-ppx,n.z-ppz);if(fd>240&&n.st!==3)respawn(i);}
 }
 rr++;
 for(let i=0;i<N;i++){const a=npcs[i];if(a.st===3||a.kind==='sit')continue;for(let j=i+1;j<N;j++){const b=npcs[j];if(b.st===3||b.kind==='sit')continue;const dx=a.x-b.x,dz=a.z-b.z;if(dx*dx+dz*dz<.25){const d=Math.sqrt(dx*dx+dz*dz)||.01,k=(.5-d)*.5,ux=dx/d*k,uz=dz/d*k;if(free(a.x+ux,a.z+uz,a.y)!==null){a.x+=ux;a.z+=uz;}if(free(b.x-ux,b.z-uz,b.y)!==null){b.x-=ux;b.z-=uz;}}}}
 for(let i=0;i<N;i++){const n=npcs[i];
  if(n.kind==='box'){
   _e.set(-n.fall*1.45,n.yaw,0,'YXZ');_q.setFromEuler(_e);
   _b.compose(_v.set(n.x,n.y+.1*n.fall,n.z),_q,_s.set(n.sc,n.sc,n.sc));
   const sw=Math.sin(n.ph)*.75*n.sw,arm=n.st===2?.9:1;
   part(imT,i,0,.82,0,0);part(imH,i,0,1.5,0,0);part(imHr,i,0,1.62,0,0);
   part(imL,i,-.1,.82,0,sw);part(imR,i,.1,.82,0,-sw);
   part(imA,i,-.25,1.36,0,-sw*arm-(n.st===2?.7:0));part(imB,i,.25,1.36,0,sw*arm-(n.st===2?.7:0));
  }else if(n.obj){
   const o=n.obj,dx=n.x-cam.position.x,dz=n.z-cam.position.z,lim=n.kind==='fem'?150:110,vis=(dx*dx+dz*dz)<lim*lim;
   o.visible=vis;if(!vis)continue;
   o.position.set(n.x,n.y+.05*n.fall,n.z);o.rotation.set(-n.fall*1.45,n.yaw,0);
   if(n.kind==='fem'&&n.fem){if(n.fem.mixer)n.fem.mixer.update(dt);applyWalk(n.fem,n);}
   else if(n.kind==='wom'){if(n.wrig){animWom(n,dt);}else{const sw=n.sw;o.position.y+=Math.abs(Math.sin(n.ph))*.035*sw;o.rotation.x=-n.fall*1.45-(n.st===2?.2:.04)*sw;o.rotation.z=Math.sin(n.ph)*.05*sw;}}
  }}
 IMS.forEach(m=>{m.instanceMatrix.needsUpdate=true;});
}
const _ht=hudTick;
hudTick=function(n){_ht(n);try{
 if(typeof gridReady==='undefined'||!gridReady)return;
 if(!ready){init();lastN=n;return;}
 const dt=Math.min(.05,Math.max(0,(n-lastN)/1000));lastN=n;tick(n,dt);}catch(e){if(!window.__npcErr){window.__npcErr=1;console.warn('NPC tick',e);}}};
/* ---------- shooting ---------- */
const _sh=shoot;
shoot=function(){try{
 if(ready){ray.setFromCamera(new THREE.Vector2(0,0),cam);const o=ray.ray.origin,sp=new THREE.Sphere(),tgt=new THREE.Vector3();
  let bt=1e9,bi=-1,bh=false;
  for(let i=0;i<N;i++){const n=npcs[i];if(n.st===3||Math.hypot(n.x-o.x,n.z-o.z)>160)continue;
   const SP=n.kind==='sit'?[[.35,.35,0],[.8,.33,0],[1.15,.22,1]]:[[.4,.3,0],[.95,.28,0],[1.5,.2,1]];
   for(const [h,r,hd] of SP){sp.center.set(n.x,n.y+h*n.sc,n.z);sp.radius=r;if(ray.ray.intersectSphere(sp,tgt)){const t=tgt.distanceTo(o);if(t<bt){bt=t;bi=i;bh=!!hd;}}}}
  if(bi>=0){const hs=ray.intersectObjects(solids.concat(dummies),false);if(!hs.length||hs[0].distance>bt){const n=npcs[bi];n.hp-=role.dmg*(bh?2.5:1);
    crossEl.classList.add('hit');setTimeout(()=>crossEl.classList.remove('hit'),90);
    if(n.hp<=0){down(bi,true);}else if(n.kind!=='sit'){n.st=2;n.t=8;n.tyaw=Math.atan2(n.x-p.x,n.z-p.z)+Math.PI;}}}
  panicNear(p.x,p.z,30);}
}catch(e){}_sh();};
/* ---------- minimap dots ---------- */
const _dm=drawMap;
drawMap=function(px,pz,yw){_dm(px,pz,yw);try{if(!ready)return;const W=mm.width,Hh=mm.height,s=1.5,cx=W/2,cy=Hh/2;
 mg.save();mg.translate(cx,cy);mg.rotate(yw);mg.translate(-cx,-cy);
 for(const n of npcs){if(n.st===3)continue;const X=cx+(n.x-px)*s,Z=cy+(n.z-pz)*s;if((X-cx)*(X-cx)+(Z-cy)*(Z-cy)>W*W*.2)continue;mg.fillStyle=(n.kind==='fem'||n.kind==='sit'||n.kind==='wom')?'rgba(255,120,190,.9)':'rgba(255,214,74,.85)';mg.fillRect(X-1.5,Z-1.5,3,3);}
 mg.restore();}catch(e){}};
/* ---------- credits ---------- */
try{const cr=document.createElement('div');cr.style.cssText='position:fixed;right:8px;bottom:4px;font:9px Inter,Arial,sans-serif;opacity:.45;color:#fff;pointer-events:none;z-index:2;text-shadow:0 1px 2px #000;text-align:right';
 cr.innerHTML='Models: "Handpaint - Girl 01" by Gregory Shcherbakov (CC BY-NC 4.0), via Sketchfab';document.body.appendChild(cr);}catch(e){}
}catch(err){console.warn('NPC module skipped',err);}})();

