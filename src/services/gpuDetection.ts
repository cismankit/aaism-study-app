export type GpuHint = {
  renderer: string;
  vendor: string;
  isAppleSilicon: boolean;
  isNvidia: boolean;
  isAmd: boolean;
  estimatedVramGb: number | null;
  recommendation: string;
};

function getWebGLRenderer(): { vendor: string; renderer: string } {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return { vendor: 'Unknown', renderer: 'WebGL unavailable' };

    const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      return {
        vendor: (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) as string,
        renderer: (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string,
      };
    }
    return { vendor: 'Unknown', renderer: 'WebGL (vendor hidden)' };
  } catch {
    return { vendor: 'Unknown', renderer: 'Detection failed' };
  }
}

function estimateVramGb(renderer: string): number | null {
  const lower = renderer.toLowerCase();
  const appleMatch = lower.match(/apple m(\d)/);
  if (appleMatch) {
    const gen = Number(appleMatch[1]);
    if (gen >= 3) return 16;
    if (gen >= 2) return 12;
    return 8;
  }
  const vramMatch = renderer.match(/(\d+)\s*gb/i);
  if (vramMatch) return Number(vramMatch[1]);
  if (lower.includes('rtx 4090')) return 24;
  if (lower.includes('rtx 4080')) return 16;
  if (lower.includes('rtx 4070')) return 12;
  if (lower.includes('rtx 4060') || lower.includes('rtx 3060')) return 8;
  if (lower.includes('gtx 1660') || lower.includes('gtx 1650')) return 4;
  return null;
}

export function detectGpuHint(): GpuHint {
  const { vendor, renderer } = getWebGLRenderer();
  const lower = renderer.toLowerCase();
  const isAppleSilicon = lower.includes('apple') && (lower.includes('m1') || lower.includes('m2') || lower.includes('m3') || lower.includes('m4'));
  const isNvidia = lower.includes('nvidia') || lower.includes('geforce') || lower.includes('rtx');
  const isAmd = lower.includes('amd') || lower.includes('radeon');

  const estimatedVramGb = estimateVramGb(renderer);

  let recommendation =
    'Ollama auto-detects GPU acceleration (Metal on Mac, CUDA on NVIDIA, ROCm on AMD). For 8B models, plan for ~8GB VRAM or unified memory.';

  if (isAppleSilicon) {
    recommendation =
      'Apple Silicon detected — Ollama uses Metal automatically. M1/M2/M3/M4 chips handle 7–8B models well with unified memory. Recommended: llama3.1:8b or qwen2.5:7b.';
  } else if (isNvidia) {
    recommendation =
      'NVIDIA GPU detected — Ollama uses CUDA when available. Run `ollama ps` to confirm GPU layers. Set OLLAMA_NUM_GPU to tune layer offloading.';
  } else if (estimatedVramGb !== null && estimatedVramGb < 8) {
    recommendation =
      `Estimated ${estimatedVramGb}GB VRAM — stick to 7B models or smaller. Use llama3.1:8b with quantization, or qwen2.5:7b.`;
  }

  return {
    renderer,
    vendor,
    isAppleSilicon,
    isNvidia,
    isAmd,
    estimatedVramGb,
    recommendation,
  };
}

export function isLocalhost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '[::1]' ||
    host.endsWith('.localhost') ||
    host === 'tauri.localhost'
  );
}
