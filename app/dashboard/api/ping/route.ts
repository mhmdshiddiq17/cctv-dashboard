import { exec } from 'child_process';

export async function GET(req: Request) {
  return new Promise((resolve) => {
    // Ping 1 kali
    exec('ping google.com', (error, stdout, stderr) => {
      if (error) {
        resolve(new Response(JSON.stringify({ success: false, error: stderr }), { status: 500 }));
        return;
      }
      resolve(new Response(JSON.stringify({ success: true, result: stdout }), { status: 200 }));
    });
  });
}