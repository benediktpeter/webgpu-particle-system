/// <reference types="@webgpu/types" />

declare module '*.module.css' {
  const styles: { [className: string]: string };
  export default styles;
}

declare const __SOURCE__: string;

// Defined by webpack.
declare namespace NodeJS {
  interface Process {
    readonly browser: boolean;
  }

  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test';
  }
}

declare module '*.wgsl' {
  const shader: 'string';
  export default shader;
}
