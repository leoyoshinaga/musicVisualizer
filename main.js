const SimplexNoise = require('simplex-noise')
var THREE = require('./js/three.js')
import { analyze } from 'web-audio-beat-detector'

audio.src = URL.createObjectURL(files[0])

//initialise simplex noise instance
var noise = new SimplexNoise();



// the main visualiser function
var vizInit = function (){
  var framework = {
    //gui: gui,
    paused: false,
    audioStartOffset: 0,
    audioStartTime: 0,
    audioBuffer: undefined,
    cameraPaused: false,
    automaticSwitchingOn: true
  }
  var file = document.getElementById("thefile");
  var audio = document.getElementById("audio");
  var fileLabel = document.querySelector("label.file");
  function createAndConnectAudioBuffer() {
    // create the source buffer
    framework.audioSourceBuffer = framework.audioContext.createBufferSource();
    // connect source and analyser
    framework.audioSourceBuffer.connect(framework.audioAnalyser);
    framework.audioAnalyser.connect(framework.audioContext.destination);
  }

  window.addEventListener("dragenter", dragenter, false);
  window.addEventListener("dragover", dragover, false);
  window.addEventListener("drop", drop, false);
  // add pausing functionality via spacebar
  // window.addEventListener("keypress", keypress, false);

  function dragenter(e) {
    e.stopPropagation();
    e.preventDefault();
  }

  function dragover(e) {
    e.stopPropagation();
    e.preventDefault();
  }

  function drop(e) {
    e.stopPropagation();
    e.preventDefault();
    if (framework.audioFile == undefined) {
      playAudio(e.dataTransfer.files[0]);
    } else {
      // stop current visualization and load new song
      framework.audioSourceBuffer.stop();
      playAudio(e.dataTransfer.files[0]);
    }
  }

  // document.onload = function(e){
  //   console.log(e);
  //   audio.play();
  //   play();
  // }
  // file.onchange = function(){
  //   fileLabel.classList.add('normal');
  //   audio.classList.add('active');
  //   var files = this.files;

  //   audio.src = URL.createObjectURL(files[0]);
  //   audio.load();
  //   audio.play();
  //   play();
  // }
  function playAudio(file) {
    createAndConnectAudioBuffer();
    framework.audioFile = file;

    var fileName = framework.audioFile.name;
    document.getElementById('guide').innerHTML = "Playing " + fileName;
    var fileReader = new FileReader();

    fileReader.onload = function (e) {
        var fileResult = fileReader.result;
        framework.audioContext.decodeAudioData(fileResult, function(buffer) {
          framework.audioSourceBuffer.buffer = buffer;
          framework.audioBuffer = buffer;
          framework.audioSourceBuffer.start();
          framework.audioSourceBuffer.loop = true;
          analyze(framework.audioSourceBuffer.buffer).then((bpm) => {
              // the bpm could be analyzed
              framework.songBPM = bpm;
          })
          .catch((err) => {
              // something went wrong
              console.log("couldn't detect BPM");
          });
        }, function(e){"Error with decoding audio data" + e.err});
    };
    fileReader.readAsArrayBuffer(framework.audioFile);
  }
  function play(audio) {
    var context = new AudioContext();
    var src = context.createMediaElementSource(audio);
    var analyser = context.createAnalyser();
    src.connect(analyser);
    analyser.connect(context.destination);
    analyser.fftSize = 512;
    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);

    //here comes the webgl
    var scene = new THREE.Scene();
    var group = new THREE.Group();
    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0,0,100);
    camera.lookAt(scene.position);
    scene.add(camera);

    var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    var planeGeometry = new THREE.PlaneGeometry(800, 800, 20, 20);
    var planeMaterial = new THREE.MeshLambertMaterial({
        color: 0x6904ce,
        side: THREE.DoubleSide,
        wireframe: true
    });

    var plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -0.5 * Math.PI;
    plane.position.set(0, 30, 0);
    group.add(plane);

    var plane2 = new THREE.Mesh(planeGeometry, planeMaterial);
    plane2.rotation.x = -0.5 * Math.PI;
    plane2.position.set(0, -30, 0);
    group.add(plane2);

    var icosahedronGeometry = new THREE.IcosahedronGeometry(10, 4);
    var lambertMaterial = new THREE.MeshLambertMaterial({
        color: 0xff00ee,
        wireframe: true
    });

    var ball = new THREE.Mesh(icosahedronGeometry, lambertMaterial);
    ball.position.set(0, 0, 0);
    group.add(ball);

    var ambientLight = new THREE.AmbientLight(0xaaaaaa);
    scene.add(ambientLight);

    var spotLight = new THREE.SpotLight(0xffffff);
    spotLight.intensity = 0.9;
    spotLight.position.set(-10, 40, 20);
    spotLight.lookAt(ball);
    spotLight.castShadow = true;
    scene.add(spotLight);

    // var orbitControls = new THREE.OrbitControls(camera);
    // orbitControls.autoRotate = true;

    scene.add(group);

    document.getElementById('out').appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);

    render();

    function render() {
      analyser.getByteFrequencyData(dataArray);

      var lowerHalfArray = dataArray.slice(0, (dataArray.length/2) - 1);
      var upperHalfArray = dataArray.slice((dataArray.length/2) - 1, dataArray.length - 1);

      var overallAvg = avg(dataArray);
      var lowerMax = max(lowerHalfArray);
      var lowerAvg = avg(lowerHalfArray);
      var upperMax = max(upperHalfArray);
      var upperAvg = avg(upperHalfArray);

      var lowerMaxFr = lowerMax / lowerHalfArray.length;
      var lowerAvgFr = lowerAvg / lowerHalfArray.length;
      var upperMaxFr = upperMax / upperHalfArray.length;
      var upperAvgFr = upperAvg / upperHalfArray.length;

      makeRoughGround(plane, modulate(upperAvgFr, 0, 1, 0.5, 4));
      makeRoughGround(plane2, modulate(lowerMaxFr, 0, 1, 0.5, 4));

      makeRoughBall(ball, modulate(Math.pow(lowerMaxFr, 0.8), 0, 1, 0, 8), modulate(upperAvgFr, 0, 1, 0, 4));

      group.rotation.y += 0.005;
      renderer.render(scene, camera);
      requestAnimationFrame(render);
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
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

    function makeRoughGround(mesh, distortionFr) {
        mesh.geometry.vertices.forEach(function (vertex, i) {
            var amp = 2;
            var time = Date.now();
            var distance = (noise.noise2D(vertex.x + time * 0.0003, vertex.y + time * 0.0001) + 0) * distortionFr * amp;
            vertex.z = distance;
        });
        mesh.geometry.verticesNeedUpdate = true;
        mesh.geometry.normalsNeedUpdate = true;
        mesh.geometry.computeVertexNormals();
        mesh.geometry.computeFaceNormals();
    }

    audio.play();
  };
}

window.onload = vizInit();

document.body.addEventListener('touchend', function(ev) { context.resume(); });




//some helper functions here
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


function init () {

  var scene , camera, renderer;
  var cube
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 45, 30000 );
  camera.position.set(-900, -200, -900)

  renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize( window.innerWidth, window.innerHeight );
  initCube()
  document.body.appendChild( renderer.domElement );


  //controls
  let controls = new THREE.OrbitControls(camera, renderer.domElement);
  // controls.addEventListener('change', renderer)
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

  let skyboxCube = new THREE.BoxGeometry(5000, 5000, 5000)
  let skybox = new THREE.Mesh(skyboxCube, materialArray)
  scene.add(skybox)


  //adding a light
  var dirLight = new THREE.DirectionalLight(0xffffff);
  dirLight.position.set(10000, 10000, 10000);
  scene.add(dirLight)
  scene.add(new THREE.AmbientLight(0x404040))




}

//function initiating inner cube
function initCube(){

  var geometry = new THREE.BoxGeometry( 300, 300, 300 );
  geometry.computeVertexNormals()
  // scene.add(new THREE.AmbientLight(0x404040))

  var loader = new THREE.CubeTextureLoader();
  loader.setCrossOrigin("")
  const textureCube = loader.load(['divine_ft.jpg', 'divine_bk.jpg', 'divine_up.jpg', 'divine_dn.jpg', 'divine_rt.jpg', 'divine_lf.jpg'])

  var cubeMaterial = new THREE.MeshStandardMaterial( {
    envMap: textureCube,
    metalness: 0.9,   // between 0 and 1
    roughness: 0.1 // between 0 and 1

  } );
  var cube = new THREE.Mesh( geometry, cubeMaterial );
  scene.add( cube );
  animate()
}

function createSpiralGeometryWithNoise(noiseLevel) {
  var geometry = new THREE.Geometry();
  // sphere spiral
  var sz = 16, cxy = 100, cz = cxy * sz;
  var hxy = Math.PI / cxy, hz = Math.PI / cz;
  var r = 10;
  for (var i = -cz; i < cz; i++) {
      var lxy = i * hxy;
      var lz = i * hz;
      var rxy = r / Math.cosh(lz);
      var x = rxy * Math.cos(lxy);
      var y = rxy * Math.sin(lxy) + getRandomArbitrary(0, noiseLevel);
      var z = r * Math.tanh(lz) + getRandomArbitrary(0, noiseLevel);
      geometry.vertices.push(new THREE.Vector3(x, y, z));
  }
  return geometry;
}




//rotating inner cube function
var SPEED = 0.01
function rotateCube() {
  cube.rotation.x -= SPEED * 2;
  cube.rotation.y -= SPEED;
  cube.rotation.z -= SPEED * 3;
}


// function animate(){
//   requestAnimationFrame( animate );
//   // cube.rotation.x += 0.01;
//   // cube.rotation.y += 0.01;
//   // rotateCube()
// 	renderer.render( scene, camera, cube );
// }


// //initialise simplex noise instance
// var noise = new SimplexNoise();

// // the main visualiser function
// var vizInit = function (){

//   var file = document.getElementById("thefile");
//   var audio = document.getElementById("audio");
//   var fileLabel = document.querySelector("label.file");

//   document.onload = function(e){
//     console.log(e);
//     audio.play();
//     play();
//   }
//   file.onchange = function(){
//     fileLabel.classList.add('normal');
//     audio.classList.add('active');
//     var files = this.files;

//     audio.src = URL.createObjectURL(files[0]);
//     audio.load();
//     audio.play();
//     play();
//   }

// function play() {
//     var context = new AudioContext();
//     var src = context.createMediaElementSource(audio);
//     var analyser = context.createAnalyser();
//     src.connect(analyser);
//     analyser.connect(context.destination);
//     analyser.fftSize = 512;
//     var bufferLength = analyser.frequencyBinCount;
//     var dataArray = new Uint8Array(bufferLength);

//     //here comes the webgl
//     var scene = new THREE.Scene();
//     var group = new THREE.Group();
//     var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
//     camera.position.set(0,0,100);
//     camera.lookAt(scene.position);
//     scene.add(camera);

//     var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
//     renderer.setSize(window.innerWidth, window.innerHeight);

//     var planeGeometry = new THREE.PlaneGeometry(800, 800, 20, 20);
//     var planeMaterial = new THREE.MeshLambertMaterial({
//         color: 0x6904ce,
//         side: THREE.DoubleSide,
//         wireframe: true
//     });

//     var plane = new THREE.Mesh(planeGeometry, planeMaterial);
//     plane.rotation.x = -0.5 * Math.PI;
//     plane.position.set(0, 30, 0);
//     group.add(plane);

//     var plane2 = new THREE.Mesh(planeGeometry, planeMaterial);
//     plane2.rotation.x = -0.5 * Math.PI;
//     plane2.position.set(0, -30, 0);
//     group.add(plane2);

//     var icosahedronGeometry = new THREE.IcosahedronGeometry(10, 4);
//     var lambertMaterial = new THREE.MeshLambertMaterial({
//         color: 0xff00ee,
//         wireframe: true
//     });

//     var ball = new THREE.Mesh(icosahedronGeometry, lambertMaterial);
//     ball.position.set(0, 0, 0);
//     group.add(ball);

//     var ambientLight = new THREE.AmbientLight(0xaaaaaa);
//     scene.add(ambientLight);

//     var spotLight = new THREE.SpotLight(0xffffff);
//     spotLight.intensity = 0.9;
//     spotLight.position.set(-10, 40, 20);
//     spotLight.lookAt(ball);
//     spotLight.castShadow = true;
//     scene.add(spotLight);

//     // var orbitControls = new THREE.OrbitControls(camera);
//     // orbitControls.autoRotate = true;

//     scene.add(group);

//     document.getElementById('out').appendChild(renderer.domElement);

//     window.addEventListener('resize', onWindowResize, false);

//     render();

//     function render() {
//       analyser.getByteFrequencyData(dataArray);

//       var lowerHalfArray = dataArray.slice(0, (dataArray.length/2) - 1);
//       var upperHalfArray = dataArray.slice((dataArray.length/2) - 1, dataArray.length - 1);

//       var overallAvg = avg(dataArray);
//       var lowerMax = max(lowerHalfArray);
//       var lowerAvg = avg(lowerHalfArray);
//       var upperMax = max(upperHalfArray);
//       var upperAvg = avg(upperHalfArray);

//       var lowerMaxFr = lowerMax / lowerHalfArray.length;
//       var lowerAvgFr = lowerAvg / lowerHalfArray.length;
//       var upperMaxFr = upperMax / upperHalfArray.length;
//       var upperAvgFr = upperAvg / upperHalfArray.length;

//       makeRoughGround(plane, modulate(upperAvgFr, 0, 1, 0.5, 4));
//       makeRoughGround(plane2, modulate(lowerMaxFr, 0, 1, 0.5, 4));

//       makeRoughBall(ball, modulate(Math.pow(lowerMaxFr, 0.8), 0, 1, 0, 8), modulate(upperAvgFr, 0, 1, 0, 4));

//       group.rotation.y += 0.005;
//       renderer.render(scene, camera);
//       requestAnimationFrame(render);
//     }

//     function onWindowResize() {
//         camera.aspect = window.innerWidth / window.innerHeight;
//         camera.updateProjectionMatrix();
//         renderer.setSize(window.innerWidth, window.innerHeight);
//     }

//     function makeRoughBall(mesh, bassFr, treFr) {
//         mesh.geometry.vertices.forEach(function (vertex, i) {
//             var offset = mesh.geometry.parameters.radius;
//             var amp = 7;
//             var time = window.performance.now();
//             vertex.normalize();
//             var rf = 0.00001;
//             var distance = (offset + bassFr ) + noise.noise3D(vertex.x + time *rf*7, vertex.y +  time*rf*8, vertex.z + time*rf*9) * amp * treFr;
//             vertex.multiplyScalar(distance);
//         });
//         mesh.geometry.verticesNeedUpdate = true;
//         mesh.geometry.normalsNeedUpdate = true;
//         mesh.geometry.computeVertexNormals();
//         mesh.geometry.computeFaceNormals();
//     }

//     function makeRoughGround(mesh, distortionFr) {
//         mesh.geometry.vertices.forEach(function (vertex, i) {
//             var amp = 2;
//             var time = Date.now();
//             var distance = (noise.noise2D(vertex.x + time * 0.0003, vertex.y + time * 0.0001) + 0) * distortionFr * amp;
//             vertex.z = distance;
//         });
//         mesh.geometry.verticesNeedUpdate = true;
//         mesh.geometry.normalsNeedUpdate = true;
//         mesh.geometry.computeVertexNormals();
//         mesh.geometry.computeFaceNormals();
//     }

//     audio.play();
//   };
// }

// window.onload = vizInit();

// document.body.addEventListener('touchend', function(ev) { context.resume(); });




//some helper functions here
// function fractionate(val, minVal, maxVal) {
//     return (val - minVal)/(maxVal - minVal);
// }

// function modulate(val, minVal, maxVal, outMin, outMax) {
//     var fr = fractionate(val, minVal, maxVal);
//     var delta = outMax - outMin;
//     return outMin + (fr * delta);
// }

// function avg(arr){
//     var total = arr.reduce(function(sum, b) { return sum + b; });
//     return (total / arr.length);
// }

// function max(arr){
//     return arr.reduce(function(a, b){ return Math.max(a, b); })
// }

//init()
