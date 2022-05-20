import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import * as THREE from 'three';
import * as dat from "dat.gui";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {DragControls} from "three/examples/jsm/controls/DragControls";
import SimplexNoise from "simplex-noise";

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements AfterViewInit {
  @ViewChild('canvas')
  canvasRef!: ElementRef;

  /**
   *  TEXTURES
   */
  textureLoader = new THREE.TextureLoader();
  sphereTexture0 = this.textureLoader.load('assets/background/sphere0');
  blobTexture0 = this.textureLoader.load('assets/background/nucleus0.jpeg');
  sphereTexture1 = this.textureLoader.load('assets/background/sphere1');
  blobTexture1 = this.textureLoader.load('assets/background/nucleus1');
  sphereTexture2 = this.textureLoader.load('assets/background/sphere2');
  blobTexture2 = this.textureLoader.load('assets/background/nucleus2');


  /**
   *  ENVIRONMENTS
   */
  environments = [
    {
      index: 0,
      sphere: this.sphereTexture0,
      blob: this.blobTexture0
    },
    {
      index: 1,
      sphere: this.sphereTexture1,
      blob: this.blobTexture1
    },
    {
      index: 2,
      sphere: this.sphereTexture2,
      blob: this.blobTexture2
    }
  ]

  currentEnvIndex = 0;
  currentEnvironment = this.environments[this.currentEnvIndex];

  /**
   *  SCENE
   */
  scene!: THREE.Scene;

  /**
   *  CAMERA
   */
  cameraZ: number = 10;
  fov: number = 55;
  nearClippingPlane: number = 0.1;
  farClippingPlane: number = 1000;
  camera!: THREE.PerspectiveCamera;
  /**
   *  RENDERER
   */
  renderer!: THREE.WebGLRenderer;

  /**
   *  DAT GUI
   */
  readonly gui = new dat.GUI({closed: true});

  /**
   *  DRAG
   */
  dragControls!: DragControls;

  /**
   *  LIGHTS
   */
  directionalLight!: THREE.DirectionalLight;
  ambientLight!: THREE.AmbientLight

  /**
   *  OBJECTS
   */
  icosahedronGeometry = new THREE.IcosahedronBufferGeometry(30, 10);
  lambertMaterial = new THREE.MeshPhongMaterial({map: this.currentEnvironment.blob});
  blob = new THREE.Mesh(this.icosahedronGeometry, this.lambertMaterial);

  geometrySphereBg = new THREE.SphereBufferGeometry(5, 40, 40);
  materialSphereBg = new THREE.MeshBasicMaterial({
    side: THREE.BackSide,
    map: this.currentEnvironment.sphere
  });
  sphereBg = new THREE.Mesh(this.geometrySphereBg, this.materialSphereBg);

  /**
   *  CONTROLS
   */
  controls!: OrbitControls;
  draggableObjects = [this.blob];

  /**
   *  NOISE
   */
  noise = new SimplexNoise();
  private animate: boolean = true;

  fullscreen = false;

  constructor() {
  }

  _width = window.innerWidth;

  private get width(): number {
    return this._width;
  }

  private set width(width) {
    this._width = width;
  }

  _height = window.innerHeight;

  private get height() {
    return this._height;
  }

  private set height(height) {
    this._height = height;
  }

  private get aspectRatio() {
    return this.width / this.height;
  }

  private get canvas(): HTMLCanvasElement {
    return this.canvasRef!.nativeElement;
  }

  ngAfterViewInit() {
    this.createScene();
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.8;
    this.dragControls = new DragControls(this.draggableObjects, this.camera, this.canvas);
    this.defineEvents();
    this.startRenderingLoop();
    this.createGUI();
  }

  createScene() {
    this.sphereTexture0.anisotropy = 16;
    this.blobTexture0.anisotropy = 16;
    this.icosahedronGeometry.setAttribute("basePosition", this.blob.geometry.getAttribute('position'));
    this.scene = new THREE.Scene();
    this.scene.add(this.sphereBg);
    this.scene.add(this.blob);
    this.camera = new THREE.PerspectiveCamera(
      this.fov,
      this.aspectRatio,
      this.nearClippingPlane,
      this.farClippingPlane);
    this.scene.add(this.camera);
    this.camera.position.z = this.cameraZ;
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    this.directionalLight.position.set(0, 50, -20);
    this.ambientLight = new THREE.AmbientLight(0xffffff, 1);
    this.ambientLight.position.set(0, 20, 20);
    this.scene.add(this.directionalLight, this.ambientLight);
  }

  defineEvents() {
    this.dragControls.addEventListener('dragstart', () => {
      this.controls.enabled = false;
    });
    this.dragControls.addEventListener('dragend', () => {
      this.controls.enabled = true;
    });
  }

  startRenderingLoop() {
    this.renderer = new THREE.WebGLRenderer({canvas: this.canvas, antialias: true, alpha: true});
    this.renderer.setPixelRatio(devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    const component = this;
    (function render() {
      if (component.animate)
        component.animateBlob();
      component.controls.update();
      component.renderer.render(component.scene, component.camera);
      requestAnimationFrame(render);
    }())
  }

  createGUI() {
    this.gui.add(this.camera.position, 'z').min(0).max(1000).step(10);
  }

  onResize(event: any) {
    this.width = event.target.innerWidth;
    this.height = event.target.innerHeight;
    this.camera.aspect = this.aspectRatio;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  vertexXAnimation = 0.0005;
  vertexYAnimation = 0.0003;
  vertexZAnimation = 0.0008;
  vertexXAnimationInit = 0.0005;
  vertexYAnimationInit = 0.0003;
  vertexZAnimationInit = 0.0008;

  animateBlob() {
    const basePositionAttribute = this.blob.geometry.getAttribute("basePosition");
    const positionAttribute = this.blob.geometry.getAttribute('position');
    const vertex = new THREE.Vector3();

    for (let vertexIndex = 0; vertexIndex < positionAttribute.count; vertexIndex++) {
      let time = Date.now();
      vertex.fromBufferAttribute(basePositionAttribute, vertexIndex);
      vertex.normalize();
      let perlin = this.noise.noise3D(
        vertex.x + time * this.vertexXAnimation,
        vertex.y + time * this.vertexYAnimation,
        vertex.z + time * this.vertexZAnimation);

      let ratio = perlin * 0.4 + 1;
      vertex.multiplyScalar(ratio);

      positionAttribute.setXYZ(vertexIndex, vertex.x, vertex.y, vertex.z);
      this.blob.rotation.y = 0.002;
    }

    this.blob.geometry.attributes['position'].needsUpdate = true;
    this.blob.geometry.computeBoundingSphere();
  }

  randomPointSphere(radius: number) {
    let theta = 2 * Math.PI * Math.random();
    let phi = Math.acos(2 * Math.random() - 1);
    let dx = (radius * Math.sin(phi) * Math.cos(theta));
    let dy = (radius * Math.sin(phi) * Math.sin(theta));
    let dz = (radius * Math.cos(phi));
    return new THREE.Vector3(dx, dy, dz);
  }

  onKeyPress(e: KeyboardEvent) {
    switch (e.code) {
      case 'KeyZ':
        this.blob.material.color.set(new THREE.Color(MainComponent.generateColor()));
        break
      case 'KeyX':
        this.blob.material.color.set(new THREE.Color());
        break
      case 'Space':
        this.animate = !this.animate;
        this.controls.autoRotate = !this.controls.autoRotate;
        break
      case 'ArrowRight':
        this.currentEnvIndex = (this.currentEnvIndex + 1) % 3;
        this.currentEnvironment = this.environments.filter(env => env.index === this.currentEnvIndex)[0];
        this.blob.material.map = this.currentEnvironment.blob;
        this.sphereBg.material.map = this.currentEnvironment.sphere;
        break
      case 'ArrowLeft':
        if (this.currentEnvIndex === 0)
          this.currentEnvIndex = 3;
        this.currentEnvIndex = (this.currentEnvIndex - 1) % 3;
        this.currentEnvironment = this.environments.filter(env => env.index === this.currentEnvIndex)[0];
        this.blob.material.map = this.currentEnvironment.blob;
        this.sphereBg.material.map = this.currentEnvironment.sphere;
        break
    }
  }

  private static generateColor() {
    return "#" + Math.random().toString(16).slice(2, 8)
  }

  toggleFullscreen() {
    if (!this.fullscreen) {
      document.documentElement.requestFullscreen().then();
    } else document.exitFullscreen().then();
    this.fullscreen = !this.fullscreen;
  }
}
