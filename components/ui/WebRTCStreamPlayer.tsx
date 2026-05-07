'use client';

import { useEffect, useRef } from 'react';

interface WebRTCStreamPlayerProps {
  webrtcUrl: string;
  className?: string;
  muted?: boolean;
  onError?: () => void;
}

function waitForIceGatheringComplete(pc: RTCPeerConnection) {
  if (pc.iceGatheringState === 'complete') {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    const onStateChange = () => {
      if (pc.iceGatheringState === 'complete') {
        pc.removeEventListener('icegatheringstatechange', onStateChange);
        resolve();
      }
    };

    pc.addEventListener('icegatheringstatechange', onStateChange);
  });
}

export function WebRTCStreamPlayer({
  webrtcUrl,
  className,
  muted = true,
  onError,
}: Readonly<WebRTCStreamPlayerProps>) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = muted;
    }
  }, [muted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !webrtcUrl) {
      return;
    }

    let isCancelled = false;
    let peer: RTCPeerConnection | null = null;
    let sessionUrl: string | null = null;

    const startWebRtc = async () => {
      peer = new RTCPeerConnection();
      peer.addTransceiver('video', { direction: 'recvonly' });

      peer.ontrack = (event) => {
        if (isCancelled) {
          return;
        }

        const [stream] = event.streams;
        if (stream && video.srcObject !== stream) {
          video.srcObject = stream;
        }
      };

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      await waitForIceGatheringComplete(peer);

      const localSdp = peer.localDescription?.sdp;
      if (!localSdp) {
        throw new Error('Failed to create local SDP offer');
      }

      const response = await fetch(webrtcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sdp',
        },
        body: localSdp,
      });

      if (!response.ok) {
        throw new Error(`WebRTC negotiation failed with status ${response.status}`);
      }

      const locationHeader = response.headers.get('Location');
      if (locationHeader) {
        sessionUrl = new URL(locationHeader, webrtcUrl).toString();
      }

      const answerSdp = await response.text();
      await peer.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp,
      });
    };

    startWebRtc().catch(() => {
      if (!isCancelled) {
        onError?.();
      }
    });

    return () => {
      isCancelled = true;

      if (sessionUrl) {
        fetch(sessionUrl, { method: 'DELETE' }).catch(() => {
          // Ignore teardown failures from gateway.
        });
      }

      if (peer) {
        peer.close();
      }

      if (video.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        video.srcObject = null;
      }
    };
  }, [webrtcUrl, onError]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      controls={false}
      className={className}
    >
      <track kind="captions" srcLang="id" label="Bahasa Indonesia" />
    </video>
  );
}
