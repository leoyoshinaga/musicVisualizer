const THREE = require('./js/three.js')
var {OrbitControls} = require('./js/OrbitControls')
const SimplexNoise = require('simplex-noise')
var noise = new SimplexNoise()


document.querySelector('button').addEventListener('click', function(){
  // parsing the audio into an array
  var context = new AudioContext()
  var audio = document.getElementById('myAudio')
  var audioSource = context.createMediaElementSource(audio)
  var analyser = context.createAnalyser()
  audioSource.connect(analyser)
  analyser.connect(context.destination)
  analyser.fftSize = 512
  var dataArray = new Uint8Array(analyser.frequencyBinCount)


  var scene, group, camera, renderer, ball
  //setting up the scene
  function init(){
    scene = new THREE.Scene()
    group = new THREE.Group()
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(0,0,100)
    camera.lookAt(scene.position)
    scene.add(camera)

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)

    //center sphere
    var icosahedronGeometry = new THREE.IcosahedronGeometry(10, 4)
    var lambertMaterial = new THREE.MeshLambertMaterial({
        color: 0xff00ee,
        wireframe: true
    });

    ball = new THREE.Mesh(icosahedronGeometry, lambertMaterial)
    ball.position.set(0, 0, 0)
    group.add(ball)


    //lights
    var ambientLight = new THREE.AmbientLight(0xaaaaaa)
    scene.add(ambientLight)

    var spotLight = new THREE.SpotLight(0xffffff);
    spotLight.intensity = 0.9;
    spotLight.position.set(-10, 40, 20);
    spotLight.lookAt(ball);
    spotLight.castShadow = true;
    scene.add(spotLight)

    scene.add(group)

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

    //center cube
    // var loader = THREE.CubeTextureLoader()
    // var textureCube = loader.load(['divine_ft.jpg', 'divine_bk.jpg', 'divine_up.jpg', 'divine_dn.jpg', 'divine_rt.jpg', 'divine_lf.jpg'])
    // var cubeMaterial = new THREE.MeshStandardMaterial( {
    //   envMap: textureCube,
    //   metalness: 0.9,   // between 0 and 1
    //   roughness: 0.1 // between 0 and 1

    // } );
    // var cube = new THREE.Mesh( geometry, cubeMaterial );
    // scene.add( cube )




  }

  function render() {
    analyser.getByteFrequencyData(dataArray);

    var lowerHalfArray = dataArray.slice(0, (dataArray.length/2) - 1);
    var upperHalfArray = dataArray.slice((dataArray.length/2) - 1, dataArray.length - 1);

    var lowerMax = max(lowerHalfArray);
    var upperAvg = avg(upperHalfArray);

    var lowerMaxFr = lowerMax / lowerHalfArray.length;
    var upperAvgFr = upperAvg / upperHalfArray.length;

    makeRoughBall(ball, modulate(Math.pow(lowerMaxFr, 0.8), 0, 1, 0, 8), modulate(upperAvgFr, 0, 1, 0, 4));

    group.rotation.y += 0.005;
    renderer.render(scene, camera);
    requestAnimationFrame(render);
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
  // function animate(){
  //   requestAnimationFrame(animate)
  //   render()
  //   renderer.render(scene, camera)
  // }
  init()
  render()
  audio.play()
  // document.querySelector('button').addEventListener('click', function() {
  //   context.resume().then(() => {
  //     console.log('Playback resumed successfully');
  //   });
  // });

})




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


