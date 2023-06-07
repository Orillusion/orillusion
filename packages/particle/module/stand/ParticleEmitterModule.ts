import { DEGREES_TO_RADIANS, MinMaxCurve, ValueSpread, Rand, Vector3 } from "@orillusion/core";
import { ParticleGlobalMemory } from '../../buffer/ParticleGlobalMemory';
import { ParticleLocalMemory } from '../../buffer/ParticleLocalMemory';
import { ParticleStandardData } from '../../data/ParticleStandardData';
import { ParticleStandardSimulator } from '../../simulator/ParticleStandardSimulator';
import { ParticleModuleBase } from './ParticleModuleBase';

/**
 * enum shape of all particle emitter shapes
 * @group Particle 
 */
export enum ShapeType {
  /**
   * Box shape
   */
  Box,

  /**
   * Circle shape
   */
  Circle,

  /**
   * Cone shape
   */
  Cone,

  /**
   * Sphere shape
   */
  Sphere,

  /**
   * Hemisphere shape
   */
  Hemisphere,
}

/**
 * enum emit loaction
 * @group Particle 
 */
export enum EmitLocation {
  /**
   * particles will emit from default location
   */
  Default,

  /**
   * particles will emit from the edges of the specified shape
   */
  Edge,

  /**
   * particles will emit from the shells of the specified shape
   */
  Shell,

  /**
   * particles will emit from the volume of the specified shape
   */
  Volume,
}

/**
 * Particle module of emit
 * @group Particle 
 */
export class ParticleEmitterModule extends ParticleModuleBase {

  /**
   * Set shape type of emitter
   */
  public set shapeType(v: ShapeType) {
    this._shapeType = v;
    this.needReset = true;
  }

  /**
   * Get shape type of emitter
   */
  public get shapeType(): ShapeType {
    return this._shapeType;
  }

  private _shapeType: ShapeType = ShapeType.Box;

  /**
  * Set emit location of emitter
  */
  public set emitLocation(v: EmitLocation) {
    this._emitLocation = v;
    this.needReset = true;
  }

  /**
  * Get emit location of emitter
  */
  public get emitLocation(): EmitLocation {
    return this._emitLocation;
  }

  private _emitLocation: EmitLocation = EmitLocation.Default;

  /**
   * Set particle emitter angle
   * When shapeType is cone, this value is the size of the cylindrical opening
   */
  public set angle(v: number) {
    this._angle = v;
  }

  /**
   * Get particle emitter angle
   */
  public get angle(): number {
    return this._angle;
  }

  private _angle: number = 10;

  /**
   * Set particle emitter radus
   */
  public set radius(v: number) {
    this._radius = v;
    this.needReset = true;
  }

  /**
   * Get particle emitter radus
   */
  public get radius(): number {
    return this._radius;
  }

  private _radius: number = 10;

  /**
   * Set box size, only when the shape is box
   */
  public set boxSize(v: Vector3) {
    this._boxSize.copyFrom(v);
    this.needReset = true;
  }

  /**
   * Get box size
   */
  public get boxSize(): Vector3 {
    return this._boxSize
  }

  private _boxSize: Vector3 = new Vector3(10, 10, 10);

  /**
   * Set random seed
   */
  public set randSeed(v: number) {
    this._rand.seed = v;
    this.needReset = true;
  }

  /**
   * Get random seed
   */
  public get randSeed(): number {
    return this._rand.seed;
  }

  private _rand: Rand = new Rand();

  /**
   * Set max number of quad in this particle
   */
  public set maxParticle(value: number) {
    this._simulator.maxParticle = value;
    if (this._maxParticle != value) {
      this.needReset = true;
    }
    this._maxParticle = value;
  }

  /**
   * Get max number of quad in this particle
   */
  public get maxParticle(): number {
    return this._maxParticle;
  }

  private _maxParticle: number = 1000;

  /**
   * Set emit rate. How many quad are allowed to be emitted per second
   */
  public set emissionRate(v: number) {
    this._emissionRate = v;
    this.needReset = true;
  }

  /**
   * Get emit rate.
   */
  public get emissionRate(): number {
    return this._emissionRate;
  }

  private _emissionRate: number = 1;

  /**
   * Set duration of emitted particles
   */
  public set duration(v: number) {
    this._duration = v;
    this.needReset = true;
  }

  /**
   * Get duration of emitted particles
   */
  public get duration(): number {
    return this._duration;
  }

  private _duration: number = 10.0;

  /**
   * Set life cycle of each quad
   */
  public set startLifecycle(v: MinMaxCurve) {
    this._startLifecycle = v;
    this.needReset = true;
  }

  /**
   * Get life cycle of each quad
   */
  public get startLifecycle(): MinMaxCurve {
    return this._startLifecycle;
  }

  private _startLifecycle: MinMaxCurve = new MinMaxCurve();

  /**
   * Set velocity speed of X-axis component
   */
  public set startVelocityX(value: MinMaxCurve) {
    this._startVelocity[0] = value;
    this.needReset = true;
  }

  /**
   * Get velocity speed of X-axis component
   */
  public get startVelocityX(): MinMaxCurve {
    return this._startVelocity[0];
  }

  /**
   * Set velocity speed of Y-axis component
   */
  public set startVelocityY(value: MinMaxCurve) {
    this._startVelocity[1] = value;
    this.needReset = true;
  }

  /**
   * Get velocity speed of Y-axis component
   */
  public get startVelocityY(): MinMaxCurve {
    return this._startVelocity[1];
  }

  /**
   * Set velocity speed of Z-axis component
   */
  public set startVelocityZ(value: MinMaxCurve) {
    this._startVelocity[2] = value;
    this.needReset = true;
  }

  /**
   * Get velocity speed of Z-axis component
   */
  public get startVelocityZ(): MinMaxCurve {
    return this._startVelocity[2];
  }

  private _startVelocity: MinMaxCurve[] = [new MinMaxCurve(0), new MinMaxCurve(0), new MinMaxCurve(0)];

  /**
   * Set init scale of each quad
  */
  public set startScale(v: MinMaxCurve) {
    this._startScaleXYZ = [v, v, v];
    this.needReset = true;
  }

  /**
   * Get init scale of each quad
  */
  public get startScale(): MinMaxCurve {
    return this._startScaleXYZ[2];
  }

  /**
   * Set the scaling value of each quad on the x-axis
  */
  public set startScaleX(v: MinMaxCurve) {
    this._startScaleXYZ[0] = v;
    this.needReset = true;
  }

  /**
   * Get the scaling value of each quad on the x-axis
  */
  public get startScaleX(): MinMaxCurve {
    return this._startScaleXYZ[0];
  }

  /**
   * Set the scaling value of each quad on the y-axis
  */
  public set startScaleY(v: MinMaxCurve) {
    this._startScaleXYZ[1] = v;
    this.needReset = true;
  }

  /**
   * Get the scaling value of each quad on the y-axis
  */
  public get startScaleY(): MinMaxCurve {
    return this._startScaleXYZ[1];
  }

  /**
   * Set the scaling value of each quad on the z-axis
  */
  public set startScaleZ(v: MinMaxCurve) {
    this._startScaleXYZ[2] = v;
    this.needReset = true;
  }

  /**
   * Get the scaling value of each quad on the z-axis
  */
  public get startScaleZ(): MinMaxCurve {
    return this._startScaleXYZ[2];
  }

  private _startScaleXYZ: MinMaxCurve[] = [new MinMaxCurve(), new MinMaxCurve(), new MinMaxCurve()];


  /**
   * Is the scaling of quads different on each axis
   */
  public isUseStartScaleXYZ(): boolean {
    return !(this._startScaleXYZ[0] == this._startScaleXYZ[1] && this._startScaleXYZ[1] == this._startScaleXYZ[2]);
  }

  /**
   * Set init rotation of each quad
   */
  public set startRotation(v: MinMaxCurve) {
    this._startRotationXYZ = [v, v, v];
    this.needReset = true;
  }

  /**
   * Get init rotation of each quad
   */
  public get startRotation(): MinMaxCurve {
    return this._startRotationXYZ[2];
  }

  /**
   * Set the rotation of each quad on the x-axis
   */
  public set startRotationX(v: MinMaxCurve) {
    this._startRotationXYZ[0] = v;
    this.needReset = true;
  }

  /**
   * Get the rotation of each quad on the x-axis
   */
  public get startRotationX(): MinMaxCurve {
    return this._startRotationXYZ[0];
  }

  /**
   * Set the rotation of each quad on the y-axis
   */
  public set startRotationY(v: MinMaxCurve) {
    this._startRotationXYZ[1] = v;
    this.needReset = true;
  }

  /**
   * Get the rotation of each quad on the y-axis
   */
  public get startRotationY(): MinMaxCurve {
    return this._startRotationXYZ[1];
  }

  /**
   * Set the rotation of each quad on the z-axis
   */
  public set startRotationZ(v: MinMaxCurve) {
    this._startRotationXYZ[2] = v;
    this.needReset = true;
  }

  /**
   * Get the rotation of each quad on the z-axis
   */
  public get startRotationZ(): MinMaxCurve {
    return this._startRotationXYZ[2];
  }

  private _startRotationXYZ: MinMaxCurve[] = [new MinMaxCurve(0), new MinMaxCurve(0), new MinMaxCurve(0)];

  /**
   * Is the rotation of quads different on each axis
   */
  public isUseStartRotationXYZ(): boolean {
    return !(this._startRotationXYZ[0] == this._startRotationXYZ[1] && this._startRotationXYZ[1] == this._startRotationXYZ[2]);
  }

  /**
   * @private
   */
  protected init(): void {
    this.maxParticle = 1000;
  }


  /**
   * Genarate particle emit module
   * @param globalMemory
   * @param localMemory
   */
  public generateParticleModuleData(globalMemory: ParticleGlobalMemory, localMemory: ParticleLocalMemory) {
    globalMemory.setUint32(`maxParticles`, this.maxParticle);
    globalMemory.setDuration(this.duration);

    const maxParticle = this._simulator.maxParticle;
    localMemory.allocationParticle(maxParticle, ParticleStandardData);

    let maxCount = (this._simulator as ParticleStandardSimulator).maxActiveParticle;
    console.warn(`Count(${maxCount})`);

    let particlesData = localMemory.particlesData as ParticleStandardData[];
    {
      for (let i = 0; i < maxCount; i++) {
        const pd = particlesData[i];

        switch (this.shapeType) {
          case ShapeType.Box:
            this.calculateBoxShapeParticlePos(pd);
            break;
          case ShapeType.Circle:
            this.calculateCircleShapeParticlePos(pd);
            break;
          case ShapeType.Cone:
            this.calculateConeShapeParticlePos(pd);
            break;
          case ShapeType.Sphere:
            this.calculateSphereShapeParticlePos(pd);
            break;
          case ShapeType.Hemisphere:
            this.calculateHemisphereShapeParticlePos(pd);
            break;
        }

        pd.life_time.setX(MinMaxCurve.evaluate(this.startLifecycle, this._rand.getFloat()));

        pd.start_time.setX(Math.floor(i % this.emissionRate) / this.emissionRate + Math.floor(i / this.emissionRate));

        if (this.isUseStartScaleXYZ()) {
          pd.start_size.setXYZ(
            MinMaxCurve.evaluate(this.startScaleX, this._rand.getFloat()),
            MinMaxCurve.evaluate(this.startScaleY, this._rand.getFloat()),
            MinMaxCurve.evaluate(this.startScaleZ, this._rand.getFloat())
          );
        } else {
          let startSize = MinMaxCurve.evaluate(this.startScale, this._rand.getFloat());
          pd.start_size.setXYZ(startSize, startSize, startSize);
        }

        if (this.isUseStartRotationXYZ()) {
          pd.start_rotation.setXYZ(
            MinMaxCurve.evaluate(this.startRotationX, this._rand.getFloat()) * DEGREES_TO_RADIANS,
            MinMaxCurve.evaluate(this.startRotationY, this._rand.getFloat()) * DEGREES_TO_RADIANS,
            MinMaxCurve.evaluate(this.startRotationZ, this._rand.getFloat()) * DEGREES_TO_RADIANS
          );
        } else {
          pd.start_rotation.setXYZ(
            0,
            0,
            MinMaxCurve.evaluate(this.startRotation, this._rand.getFloat()) * DEGREES_TO_RADIANS
          );
        }

        // if (forceModule) {
        // pd.start_acceleration.setXYZ(
        //   Math.random() * acceleration.x - acceleration.x * 0.5,
        //   Math.random() * acceleration.y - acceleration.y * 0.5,
        //   Math.random() * acceleration.z - acceleration.z * 0.5,
        // );
        // }

        pd.start_velocity.setXYZ(
          MinMaxCurve.evaluate(this.startVelocityX, this._rand.getFloat()),
          MinMaxCurve.evaluate(this.startVelocityY, this._rand.getFloat()),
          MinMaxCurve.evaluate(this.startVelocityZ, this._rand.getFloat())
        );


        // pd.start_rotVelocity.setXYZ(0, 0, (this._rand.getFloat() * 0.5 - 0.5 * 0.5) * DEGREES_TO_RADIANS);

        // pd.start_rotAcceleration.setXYZ(0, 0, 0.0 * DEGREES_TO_RADIANS);

        // pd.vForce_Rot.setXYZ(0, (this._rand.getFloat() * 0.5 - 0.5 * 0.5) * DEGREES_TO_RADIANS, 0);

        // console.warn(`startTime:${pd.start_time.x},lifeTime:${pd.life_time.x},startRot:${pd.start_rotation.z},startVelocity(${pd.start_velocity.x}, ${pd.start_velocity.y}, ${pd.start_velocity.z})`);
      }
    }

    localMemory.apply();
  }

  protected calculateBoxShapeParticlePos(pd: ParticleStandardData) {
    switch (this.emitLocation) {
      case EmitLocation.Default:
      case EmitLocation.Edge:
        let xyzIndex = Math.floor(this._rand.getFloat() * 10) % 3;
        if (xyzIndex == 0) {
          pd.start_pos.setXYZ(
            this._rand.getFloat() * this.boxSize.x - this.boxSize.x * 0.5,
            (Math.floor(this._rand.getFloat() * 10) % 2) * this.boxSize.y - this.boxSize.y * 0.5,
            (Math.floor(this._rand.getFloat() * 10) % 2) * this.boxSize.z - this.boxSize.z * 0.5,
          );
        } else if (xyzIndex == 1) {
          pd.start_pos.setXYZ(
            (Math.floor(this._rand.getFloat() * 10) % 2) * this.boxSize.x - this.boxSize.x * 0.5,
            this._rand.getFloat() * this.boxSize.y - this.boxSize.y * 0.5,
            (Math.floor(this._rand.getFloat() * 10) % 2) * this.boxSize.z - this.boxSize.z * 0.5,
          );
        } else if (xyzIndex == 2) {
          pd.start_pos.setXYZ(
            (Math.floor(this._rand.getFloat() * 10) % 2) * this.boxSize.x - this.boxSize.x * 0.5,
            (Math.floor(this._rand.getFloat() * 10) % 2) * this.boxSize.y - this.boxSize.y * 0.5,
            this._rand.getFloat() * this.boxSize.z - this.boxSize.z * 0.5,
          );
        }
        break;
      case EmitLocation.Shell:
        {
          let xyzIndex = Math.floor(this._rand.getFloat() * 10) % 3;
          if (xyzIndex == 0) {
            pd.start_pos.setXYZ(
              this._rand.getFloat() * this.boxSize.x - this.boxSize.x * 0.5,
              this._rand.getFloat() * this.boxSize.y - this.boxSize.y * 0.5,
              (Math.floor(this._rand.getFloat() * 10) % 2) * this.boxSize.z - this.boxSize.z * 0.5,
            );
          } else if (xyzIndex == 1) {
            pd.start_pos.setXYZ(
              (Math.floor(this._rand.getFloat() * 10) % 2) * this.boxSize.x - this.boxSize.x * 0.5,
              this._rand.getFloat() * this.boxSize.y - this.boxSize.y * 0.5,
              this._rand.getFloat() * this.boxSize.z - this.boxSize.z * 0.5,
            );
          } else if (xyzIndex == 2) {
            pd.start_pos.setXYZ(
              this._rand.getFloat() * this.boxSize.x - this.boxSize.x * 0.5,
              (Math.floor(this._rand.getFloat() * 10) % 2) * this.boxSize.y - this.boxSize.y * 0.5,
              this._rand.getFloat() * this.boxSize.z - this.boxSize.z * 0.5,
            );
          }
        }
        break;
      case EmitLocation.Volume:
        pd.start_pos.setXYZ(
          this._rand.getFloat() * this.boxSize.x - this.boxSize.x * 0.5,
          this._rand.getFloat() * this.boxSize.y - this.boxSize.y * 0.5,
          this._rand.getFloat() * this.boxSize.z - this.boxSize.z * 0.5,
        );
        break;
    }
  }

  protected calculateCircleShapeParticlePos(pd: ParticleStandardData) {
    let radius = this.radius;
    switch (this.emitLocation) {
      case EmitLocation.Default:
      case EmitLocation.Edge:
        {
          var verAngle: number = this._rand.getFloat() * 360 * DEGREES_TO_RADIANS;
          pd.start_pos.setXYZ(
            radius * Math.cos(verAngle),
            0,
            radius * Math.sin(verAngle),
          );
        }
        break;
      case EmitLocation.Shell:
      case EmitLocation.Volume:
        {
          var pos = new Vector3();
          do {
            pos.x = this._rand.getFloat() * this.radius * 2.0 - this.radius;
            0;
            pos.z = this._rand.getFloat() * this.radius * 2.0 - this.radius;
          } while (pos.length > this.radius);
          pd.start_pos.setXYZ(pos.x, pos.y, pos.z);
        }
        break;
    }

  }

  protected calculateConeShapeParticlePos(pd: ParticleStandardData) {
  }

  protected calculateSphereShapeParticlePos(pd: ParticleStandardData) {
    let pos = new Vector3();
    do {
      pos.x = this._rand.getFloat() * this.radius * 2.0 - this.radius;
      pos.y = this._rand.getFloat() * this.radius * 2.0 - this.radius;
      pos.z = this._rand.getFloat() * this.radius * 2.0 - this.radius;
    } while (pos.length > this.radius);

    switch (this.emitLocation) {
      case EmitLocation.Shell:
      case EmitLocation.Edge:
        pos.normalize().multiplyScalar(this.radius);
        pd.start_pos.setXYZ(pos.x, pos.y, pos.z);
        break;
      case EmitLocation.Default:
      case EmitLocation.Volume:
      default:
        pd.start_pos.setXYZ(pos.x, pos.y, pos.z);
        break;
    }
  }

  protected calculateHemisphereShapeParticlePos(pd: ParticleStandardData) {
    let radius = this.radius;

    switch (this.emitLocation) {
      case EmitLocation.Edge:
      case EmitLocation.Shell:
        radius = this.radius;
        break;
      case EmitLocation.Default:
      case EmitLocation.Volume:
      default:
        radius = this._rand.getFloat() * this.radius;
        break;
    }

    var horAngle: number = this._rand.getFloat() * 180 * DEGREES_TO_RADIANS;
    var ringRadius: number = radius * Math.sin(horAngle);
    var verAngle: number = this._rand.getFloat() * 180 * DEGREES_TO_RADIANS;
    pd.start_pos.setXYZ(
      ringRadius * Math.cos(verAngle),
      ringRadius * Math.sin(verAngle),
      -radius * Math.cos(horAngle),
    );
  }
}
