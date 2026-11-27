import { platform } from 'node:os';

export const dockerCommand = platform() === 'win32' ? 'docker.exe' : 'docker';
export const powershellCommand = platform() === 'win32' ? 'powershell.exe' : 'pwsh';
