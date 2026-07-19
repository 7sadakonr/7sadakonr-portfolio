declare module 'ogl' {
  export class Renderer {
    gl: WebGLRenderingContext & { canvas: HTMLCanvasElement }
    constructor(options?: { depth?: boolean; alpha?: boolean })
    setSize(width: number, height: number): void
    render(options: { scene: Mesh; camera: Camera }): void
  }

  export class Camera {
    position: { set(x: number, y: number, z: number): void }
    constructor(gl: WebGLRenderingContext, options?: { fov?: number })
    perspective(options: { aspect: number }): void
  }

  export class Geometry {
    constructor(
      gl: WebGLRenderingContext,
      attributes: Record<string, { size: number; data: Float32Array }>
    )
  }

  export class Program {
    uniforms: Record<string, { value: number }>
    constructor(
      gl: WebGLRenderingContext,
      options: {
        vertex: string
        fragment: string
        uniforms: Record<string, { value: number }>
        transparent?: boolean
        depthTest?: boolean
      }
    )
  }

  export class Mesh {
    position: { x: number; y: number; z: number }
    rotation: { x: number; y: number; z: number }
    constructor(
      gl: WebGLRenderingContext,
      options: { mode: number; geometry: Geometry; program: Program }
    )
  }
}
