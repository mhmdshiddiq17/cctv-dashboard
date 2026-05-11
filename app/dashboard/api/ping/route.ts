import { exec } from 'child_process';

const PING_HOST = 'google.com';

const getPingCommand = () => {
  if (process.platform === 'darwin') {
    return `ping -c 1 -W 1000 ${PING_HOST}`;
  }
  return `ping -c 1 -W 1 ${PING_HOST}`;
};

const parseLatency = (output: string) => {
  const match = output.match(/time=([0-9.]+)\s*ms/i);
  return match ? Number.parseFloat(match[1]) : null;
};

export async function GET() {
  return new Promise<Response>((resolve) => {
    exec(getPingCommand(), { timeout: 4000 }, (error, stdout, stderr) => {
      if (error) {
        const message = stderr?.trim() || error.message || 'Ping failed';
        resolve(
          new Response(JSON.stringify({ success: false, error: message }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
          })
        );
        return;
      }

      const latency = parseLatency(stdout);
      resolve(
        new Response(JSON.stringify({ success: true, latency, result: stdout }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      );
    });
  });
}