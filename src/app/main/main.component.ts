import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import * as THREE from 'three';
import * as dat from "dat.gui";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements AfterViewInit {
  @ViewChild('canvas')
  canvasRef!: ElementRef;

  /**
   *  SCENE
   */
  scene!: THREE.Scene;

  /**
   *  CAMERA
   */
  cameraZ: number = 2;
  fov: number = 50;
  nearClippingPlane: number = 0.1;
  farClippingPlane: number = 1000;
  readonly camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    this.fov,
    this.aspectRatio,
    this.nearClippingPlane,
    this.farClippingPlane);
  /**
   *  RENDERER
   */
  renderer!: THREE.WebGLRenderer;
  /**
   *  DAT GUI
   */
  readonly gui = new dat.GUI({closed: true});
  /**
   *  CONTROLS
   */
  controls!: OrbitControls;

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
    this.startRenderingLoop();
    this.createGUI();
  }

  createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x292929);
    this.scene.add(this.camera);
    this.camera.position.z = this.cameraZ;
  }

  startRenderingLoop() {
    this.renderer = new THREE.WebGLRenderer({canvas: this.canvas});
    this.renderer.setPixelRatio(devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    const component = this;
    (function render() {
      component.controls.update();
      component.renderer.render(component.scene, component.camera);
      requestAnimationFrame(render);
    }())
  }

  createGUI() {

  }

  onResize(event: any) {
    this.width = event.target.innerWidth;
    this.height = event.target.innerHeight;
    this.camera.aspect = this.aspectRatio;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
}
