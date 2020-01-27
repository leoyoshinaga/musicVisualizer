// const THREE = require('./js/three')
// const OrbitControls = require('./js/OrbitControls')
const SimplexNoise = require('simplex-noise')
var noise = new SimplexNoise()

let scene , camera, renderer, ball, skybox
//parsing music into an array
var context = new AudioContext()
var audio = document.getElementById('myAudio')
var audioSource = context.createMediaElementSource(audio)
var analyser = context.createAnalyser()
audioSource.connect(analyser)
analyser.connect(context.destination)
analyser.fftSize = 512
var dataArray = new Uint8Array(analyser.frequencyBinCount)

//initiate THREE stuff
function init(){

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 45, 30000 );
  camera.position.set(-900, -200, -900)

  renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );


  //controls
  let controls = new THREE.OrbitControls(camera, renderer.domElement);

  controls.maxDistance = 1500
  //skybox
  let materialArray = [];

  let texture_ft = new THREE.TextureLoader().load('./divine_ft.jpg')
  let texture_bk = new THREE.TextureLoader().load('./divine_bk.jpg')
  let texture_up = new THREE.TextureLoader().load('./divine_up.jpg')
  let texture_dn = new THREE.TextureLoader().load('./divine_dn.jpg')
  let texture_rt = new THREE.TextureLoader().load('./divine_rt.jpg')
  let texture_lf = new THREE.TextureLoader().load('./divine_lf.jpg')

  materialArray.push(new THREE.MeshBasicMaterial({map: texture_ft}))
  materialArray.push(new THREE.MeshBasicMaterial({map: texture_bk}))
  materialArray.push(new THREE.MeshBasicMaterial({map: texture_up}))
  materialArray.push(new THREE.MeshBasicMaterial({map: texture_dn}))
  materialArray.push(new THREE.MeshBasicMaterial({map: texture_rt}))
  materialArray.push(new THREE.MeshBasicMaterial({map: texture_lf}))

  for(let i = 0; i < 6; i++){
    materialArray[i].side = THREE.BackSide
  }

  let skyboxCube = new THREE.BoxGeometry(10000, 10000, 10000)
  skybox = new THREE.Mesh(skyboxCube, materialArray)
  scene.add(skybox)

  var geometry = new THREE.BoxGeometry( 22, 22, 22 );
  var loader = new THREE.CubeTextureLoader();
  loader.setCrossOrigin("")
  const textureCube = loader.load(['divine_ft.jpg', 'divine_bk.jpg', 'divine_up.jpg', 'divine_dn.jpg', 'divine_rt.jpg', 'divine_lf.jpg'])

  var material = new THREE.MeshStandardMaterial( {
    envMap: textureCube,
    metalness: 0.7,   // between 0 and 1
    roughness: 0.5 // between 0 and 1

} );
  const cube = new THREE.Mesh( geometry, material );
  scene.add( cube );

  var icosahedronGeometry = new THREE.IcosahedronGeometry(10, 4)
  var lambertMaterial = new THREE.MeshLambertMaterial({
      color: 0xff00ee,
      wireframe: true
  });

  ball = new THREE.Mesh(icosahedronGeometry, lambertMaterial)
  ball.position.set(0, 0, 0)
  scene.add(ball)


  audio.play()
  animate()
}


function animate() {
  analyser.getByteFrequencyData(dataArray);

  var lowerHalfArray = dataArray.slice(0, (dataArray.length/2) - 1);
  var upperHalfArray = dataArray.slice((dataArray.length/2) - 1, dataArray.length - 1);

  var lowerMax = max(lowerHalfArray);
  var upperAvg = avg(upperHalfArray);

  var lowerMaxFr = lowerMax / lowerHalfArray.length;
  var upperAvgFr = upperAvg / upperHalfArray.length;

  makeRoughBall(ball, modulate(Math.pow(lowerMaxFr, 0.8), 0, 1, 0, 8), modulate(upperAvgFr, 0, 1, 0, 4));

  ball.rotation.y += 0.005;
  skybox.rotation.y += 0.005
  renderer.render(scene, camera);
  requestAnimationFrame(animate)
	renderer.render( scene, camera );
}

function makeRoughBall(mesh, bassFr, treFr) {
  mesh.geometry.vertices.forEach(function (vertex, i) {
      var offset = mesh.geometry.parameters.radius;
      var amp = 7;
      var time = window.performance.now();
      vertex.normalize();
      var rf = 0.00001;
      var distance = (offset + bassFr ) + noise.noise3D(vertex.x + time *rf*7, vertex.y +  time*rf*8, vertex.z + time*rf*9) * amp * treFr;
      vertex.multiplyScalar(distance);
  });
  mesh.geometry.verticesNeedUpdate = true;
  mesh.geometry.normalsNeedUpdate = true;
  mesh.geometry.computeVertexNormals();
  mesh.geometry.computeFaceNormals();
}
init()

function fractionate(val, minVal, maxVal) {
  return (val - minVal)/(maxVal - minVal);
}

function modulate(val, minVal, maxVal, outMin, outMax) {
  var fr = fractionate(val, minVal, maxVal);
  var delta = outMax - outMin;
  return outMin + (fr * delta);
}

function avg(arr){
  var total = arr.reduce(function(sum, b) { return sum + b; });
  return (total / arr.length);
}

function max(arr){
  return arr.reduce(function(a, b){ return Math.max(a, b); })
}
