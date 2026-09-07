import { useEffect, useRef, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { PhoneOff, Mic, Loader2, Volume2 } from "lucide-react";
import { apiRequest, useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

type CallRole = "caller" | "callee";
type CallStatus = "ringing" | "active" | "ended";
type CallCandidate = RTCIceCandidateInit;

interface CallState {
  id: string;
  role: CallRole;
  status: CallStatus;
  offer?: RTCSessionDescriptionInit | null;
  answer?: RTCSessionDescriptionInit | null;
  remoteCandidates?: CallCandidate[];
}

function displayError(error: unknown) {
  return error instanceof Error ? error.message : "تعذر بدء المكالمة";
}

export default function Call() {
  const [, params] = useRoute("/call/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const callId = params?.id || "";
  const [status, setStatus] = useState<"connecting" | "ringing" | "active" | "ended" | "error">("connecting");
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(0);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const remoteDescriptionSetRef = useRef(false);
  const processedCandidatesRef = useRef(new Set<string>());
  const mountedRef = useRef(true);

  useEffect(() => {
    if (status !== "active") return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [status]);

  useEffect(() => {
    mountedRef.current = true;
    if (!callId || !user) return;

    let disposed = false;
    let pollTimer: number | undefined;
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    peerRef.current = pc;

    const postCandidate = async (candidate: RTCIceCandidate) => {
      try {
        await apiRequest(`/calls/${callId}/candidates`, {
          method: "POST",
          body: JSON.stringify({ candidate: candidate.toJSON() }),
        });
      } catch {
        // The next poll will detect an ended call and close the peer.
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) void postCandidate(event.candidate);
    };
    pc.ontrack = (event) => {
      const audio = remoteAudioRef.current;
      if (!audio) return;
      audio.srcObject = event.streams[0];
      void audio.play().catch(() => undefined);
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected" && mountedRef.current) setStatus("active");
      if (["failed", "disconnected", "closed"].includes(pc.connectionState) && mountedRef.current) {
        setStatus("ended");
      }
    };

    const addRemoteCandidates = async (candidates: CallCandidate[] = []) => {
      if (!remoteDescriptionSetRef.current) return;
      for (const candidate of candidates) {
        const key = JSON.stringify(candidate);
        if (processedCandidatesRef.current.has(key)) continue;
        processedCandidatesRef.current.add(key);
        try {
          await pc.addIceCandidate(candidate);
        } catch {
          // Ignore a duplicate/late ICE candidate.
        }
      }
    };

    const applyState = async (state: CallState) => {
      if (state.status === "ended") {
        if (mountedRef.current) setStatus("ended");
        return;
      }

      if (state.role === "caller" && state.answer && !remoteDescriptionSetRef.current) {
        await pc.setRemoteDescription(state.answer);
        remoteDescriptionSetRef.current = true;
      }

      if (state.role === "callee" && state.offer && !remoteDescriptionSetRef.current) {
        await pc.setRemoteDescription(state.offer);
        remoteDescriptionSetRef.current = true;
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await apiRequest(`/calls/${callId}/answer`, {
          method: "POST",
          body: JSON.stringify({ answer }),
        });
        if (mountedRef.current) setStatus("active");
      }

      await addRemoteCandidates(state.remoteCandidates);
      if (state.status === "active" && mountedRef.current) setStatus("active");
    };

    const poll = async () => {
      if (disposed) return;
      try {
        const state = await apiRequest(`/calls/${callId}`) as CallState;
        await applyState(state);
      } catch (pollError) {
        if (!disposed && mountedRef.current) {
          setError(displayError(pollError));
          setStatus("error");
        }
      }
    };

    const setup = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("المتصفح لا يدعم المكالمات الصوتية داخل التطبيق");
      }
      const initialState = await apiRequest(`/calls/${callId}`) as CallState;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      if (initialState.role === "caller") {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await apiRequest(`/calls/${callId}/offer`, {
          method: "POST",
          body: JSON.stringify({ offer }),
        });
        if (mountedRef.current) setStatus("ringing");
      } else {
        await applyState(initialState);
      }
      await poll();
      pollTimer = window.setInterval(() => void poll(), 900);
    };

    void setup().catch((setupError) => {
      if (!disposed && mountedRef.current) {
        setError(displayError(setupError));
        setStatus("error");
      }
    });

    return () => {
      disposed = true;
      mountedRef.current = false;
      if (pollTimer) window.clearInterval(pollTimer);
      pc.close();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      peerRef.current = null;
    };
  }, [callId, user]);

  const endCall = async () => {
    try {
      await apiRequest(`/calls/${callId}/end`, { method: "POST" });
    } catch {
      // The call is still closed locally if the other side already ended it.
    }
    peerRef.current?.close();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    setStatus("ended");
    window.setTimeout(() => setLocation("/messages"), 250);
  };

  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  const statusLabel =
    status === "active" ? `${minutes}:${remainingSeconds}` :
    status === "ringing" ? "بانتظار الرد..." :
    status === "connecting" ? "جاري تجهيز المكالمة..." :
    status === "ended" ? "انتهت المكالمة" : error;

  return (
    <div className="min-h-[100dvh] bg-primary text-primary-foreground flex flex-col items-center justify-between px-6 py-16 text-center" dir="rtl">
      <audio ref={remoteAudioRef} autoPlay className="hidden" />
      <div className="flex flex-col items-center gap-5">
        <div className="w-28 h-28 rounded-full bg-white/15 border-4 border-accent/70 flex items-center justify-center shadow-2xl">
          <Volume2 className="w-12 h-12 text-accent" />
        </div>
        <div>
          <p className="text-white/65 text-sm mb-2">مكالمة صوتية داخل فزعة</p>
          <h1 className="text-2xl font-bold">اتصال آمن</h1>
          <p className="text-white/70 mt-3 text-sm">{statusLabel}</p>
        </div>
      </div>

      <div className="w-full max-w-xs space-y-4">
        {status === "error" && (
          <p className="rounded-2xl bg-destructive/20 border border-destructive/40 px-4 py-3 text-sm text-white">
            {error}
          </p>
        )}
        {status === "active" && (
          <div className="flex items-center justify-center gap-2 text-white/75 text-sm">
            <Mic className="w-4 h-4" />
            الميكروفون يعمل داخل التطبيق
          </div>
        )}
        {status === "connecting" && <Loader2 className="w-7 h-7 animate-spin mx-auto text-accent" />}
        <button
          type="button"
          onClick={endCall}
          className="mx-auto w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-colors"
          aria-label="إنهاء المكالمة"
        >
          <PhoneOff className="w-7 h-7" />
        </button>
        <p className="text-xs text-white/60">إنهاء المكالمة</p>
      </div>
    </div>
  );
}