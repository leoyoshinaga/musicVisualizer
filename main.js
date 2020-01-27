// const THREE = require('./js/three')
// const OrbitControls = require('./js/OrbitControls')
const SimplexNoise = require('simplex-noise')
var noise = new SimplexNoise()

let scene , camera, renderer;
function init(){
  var context = new AudioContext()
  var audio = document.getElementById('myAudio')
  var audioSource = context.createMediaElementSource(audio)
  var analyser = context.createAnalyser()
  audioSource.connect(analyser)
  analyser.connect(context.destination)
  analyser.fftSize = 512
  var dataArray = new Uint8Array(analyser.frequencyBinCount)
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
  let skybox = new THREE.Mesh(skyboxCube, materialArray)
  scene.add(skybox)

  var geometry = new THREE.BoxGeometry( 300, 300, 300 );
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
  audio.play()
  animate()
}


function animate() {
  renderer.render(scene, camera)
  requestAnimationFrame( animate );
  // cube.rotation.x += 0.01;
  // cube.rotation.y += 0.01;
	renderer.render( scene, camera );
}
init()

