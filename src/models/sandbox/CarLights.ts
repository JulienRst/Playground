import * as THREE from 'three';
import { fragmentShader, vertexShader } from '@/models/sandbox/shaders/carlight';
import { myCustomDistortion } from '@/utils/Distortion';

const pickRandom = (arr: any) => {
	return (Array.isArray(arr)) ? arr[Math.floor(Math.random() * arr.length)] : arr;
};

export interface CarLightsOptions {
	color: THREE.Color;
	n: number;
	roadWidth: number;
	roadSections: number;
	roadDepth: number;
	speed: number;
}

export default class CarLights {
	public mesh!: THREE.Mesh;
	public options: CarLightsOptions;

	constructor (options: CarLightsOptions) {
		this.options = options;
	}

	public init () {
		const curve = new THREE.LineCurve3(
			new THREE.Vector3(0, 0, 0),
			new THREE.Vector3(0, 0, -1)
		);

		const baseGeometry = new THREE.TubeBufferGeometry(curve, 25, 1, 8, false);
		const instanced = new THREE.InstancedBufferGeometry().copy(baseGeometry);
		instanced.maxInstancedCount = this.options.n * 2;

		// Manage Position
		const aOffset = [];
		// Manage Size
		const aMetrics = [];
		// Manage Color
		const aColor = [];

		const sectionWidth = this.options.roadWidth / this.options.roadSections;

		for (let i = 0; i < this.options.n; i++) {
			const radius = Math.random() * 0.1 + 0.1; // 0.1 = Minimum size of the light
			const length = Math.random() * this.options.roadDepth * 0.08 + this.options.roadDepth * 0.02;
			const section = i % 3;
			const sectionX = section * sectionWidth + this.options.roadWidth / 2 - sectionWidth / 2;
			const carWidth = 0.5 * sectionWidth;
			const offsetX = 0.5 * Math.random();
			const offsetY = radius * 1.3;

			const offsetZ = Math.random() * this.options.roadDepth;

			aOffset.push(sectionX - carWidth / 2 - offsetX);
			aOffset.push(offsetY);
			aOffset.push(-offsetZ);

			aOffset.push(sectionX + carWidth / 2 + offsetX);
			aOffset.push(offsetY);
			aOffset.push(-offsetZ);

			aMetrics.push(radius);
			aMetrics.push(length);
			aMetrics.push(radius);
			aMetrics.push(length);

			const color = pickRandom(this.options.color);
			aColor.push(color.r);
			aColor.push(color.g);
			aColor.push(color.b);

			aColor.push(color.r);
			aColor.push(color.g);
			aColor.push(color.b);
		}

		instanced.setAttribute(
			'aOffset',
			new THREE.InstancedBufferAttribute(new Float32Array(aOffset), 3, false)
		);

		instanced.setAttribute(
			'aMetrics',
			new THREE.InstancedBufferAttribute(new Float32Array(aMetrics), 2, false)
		);

		instanced.setAttribute(
			'aColor',
			new THREE.InstancedBufferAttribute(new Float32Array(aColor), 3, false)
		);

		const material = new THREE.ShaderMaterial({
			fragmentShader,
			vertexShader,
			uniforms: Object.assign(
				{
					uTime: new THREE.Uniform(0),
					uSpeed: new THREE.Uniform(this.options.speed),
					uTravelLength: new THREE.Uniform(this.options.roadDepth),
					uFade: new THREE.Uniform(new THREE.Vector2(0, 0)),
					fogNear: new THREE.Uniform(this.options.roadDepth * 0.1),
					fogFar: new THREE.Uniform(this.options.roadDepth * 2),
					fogColor: new THREE.Uniform(new THREE.Color(0x000000))
				},
				myCustomDistortion.uniforms
			)
		});

		material.onBeforeCompile = (shader) => {
			shader.vertexShader = shader.vertexShader.replace('#include', myCustomDistortion.getDistortion);
		};

		this.mesh = new THREE.Mesh(instanced, material);
		this.mesh.frustumCulled = false;
	}

	public update (t: number): void {
		(this.mesh.material as THREE.ShaderMaterial).uniforms.uTime.value = t;
		(this.mesh.material as THREE.ShaderMaterial).uniformsNeedUpdate = true;
	}
}
