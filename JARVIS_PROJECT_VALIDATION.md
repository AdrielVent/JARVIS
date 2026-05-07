# Project J.A.R.V.I.S. Validation Brief

Source architecture: `/Users/soestep/Downloads/Project J.A.R.V.I.S. Software Architecture.pdf`

## Bottom Line

Absolute perfection cannot be guaranteed, especially for a live voice assistant that depends on microphones, cameras, networks, cloud APIs, Home Assistant, serial hardware, and model/provider behavior. What can be made strong is the engineering process: every architecture claim becomes a requirement, every requirement gets an implementation owner, and every risky path gets automated or hardware-in-loop verification.

The architecture in the PDF is directionally sound: event-driven runtime, typed internal events, adapter boundaries, streaming STT/router/TTS, Chroma memory, Home Assistant as a tool bus, printer telemetry as a serial worker, and strict function calling for actuators.

## Accuracy Check

Confirmed:

- OpenAI Responses API is the right reasoning boundary for new work; OpenAI recommends Responses for new projects and exposes typed streaming events.
- OpenAI streaming text responses expose semantic events including `response.output_text.delta`.
- `whisper-1` should not be used for streamed transcription on the hot path; OpenAI docs state streamed transcription is not supported for `whisper-1` in the transcription endpoint.
- OpenAI strict function calling requires `strict: true`, `additionalProperties: false`, and all properties marked required. Optional fields need nullable types.
- `parallel_tool_calls=false` is appropriate for physical actuation because it constrains model tool use to zero or one function call.
- ElevenLabs WebSocket TTS is appropriate when input text is generated in chunks. Flash models are documented around 75 ms model inference excluding app/network latency.
- ElevenLabs time-to-first-audio must be measured end to end; the 75 ms number is model inference, not user-perceived response time.
- Home Assistant supports both REST and WebSocket APIs; WebSocket supports `call_service` and ping/pong liveness checks.
- Marlin `M155` auto-report is preferred for continuous temperature telemetry; `M105` is better treated as a one-shot query.
- Chroma supports nearest-neighbor query, metadata filtering via `where`, and document filtering via `where_document`.
- Porcupine expects 16-bit mono audio frames at its configured `sample_rate` and `frame_length`, which matches the PDF's callback-frame architecture.

Needs careful implementation:

- The PDF code is architectural pseudocode, not copy/paste-ready source. The extracted text loses Python whitespace and some formatting, and the production implementation needs concrete adapters, package versions, mocks, and integration tests.
- The VAD in the sample is energy-threshold based. For production reliability, replace it with WebRTC VAD, Silero, Cobra, or a measured hybrid.
- Streaming STT should be truly streaming for responsiveness. If using OpenAI remote STT, implement Realtime transcription session handling rather than batch transcription around completed utterances.
- Do not put arbitrary shell execution behind the LLM. Keep absolute-path allowlists, argument validation, timeouts, captured stdout/stderr, and audit logging.
- Tool schemas in strict mode should mark every field in `properties` as required or use nullable types/default handling outside the schema.
- Home Assistant actions should use a curated allowlist of domain/service/entity patterns, not raw model-controlled endpoint calls.
- Printer telemetry should move from one-shot `M105` demo code to a reconnecting serial worker with `M155` where firmware supports it.
- Latency targets must define `time_to_first_audible_byte`, not full-answer completion time.

## Completion Gates

1. Requirements traceability
   - Convert every PDF requirement into an issue/checklist item.
   - Label each item as architecture, runtime, provider adapter, hardware adapter, safety, observability, test, or deployment.

2. Implementation baseline
   - Create the `jarvis/` package layout from the PDF.
   - Define typed contracts first: `AudioFrame`, `Utterance`, `Transcript`, `VisionSnapshot`, `MemoryHit`, `ToolResult`, `SpeechChunk`, and fault events.
   - Keep external SDK payloads inside adapters only.

3. Safety and actuation
   - Enforce strict function schemas.
   - Disable parallel tool calls for physical actions.
   - Add Home Assistant and subprocess allowlists.
   - Record every actuator request, arguments, result, and failure domain.

4. Test coverage
   - Unit test queue overflow/drop-oldest behavior, chunking, cancellation, tool validation, memory fallback, and fault logging.
   - Contract test every adapter using fake providers.
   - Integration test microphone-less and camera-less degraded modes.
   - Hardware-in-loop test wake word, barge-in, Home Assistant command, and printer telemetry.

5. Latency and reliability
   - Measure wake-to-STT-final, STT-final-to-first-token, first-token-to-TTS-send, TTS-send-to-first-audio-byte, and first-audio-byte-to-playback.
   - Set pass/fail budgets for p50, p95, and p99.
   - Add backoff and provider-budget isolation for 429/5xx failures.

6. Deployment readiness
   - Pin package versions.
   - Document required API keys and hardware permissions.
   - Add structured logs, metrics, and a fault-log memory collection.
   - Provide a degraded-mode matrix for STT, router, memory, TTS, camera, Home Assistant, and printer failures.

## Immediate Next Step

The workspace currently contains no source code. To move from architecture to completion, the next concrete step is to scaffold the Python package, implement the typed contracts and pure-runtime loops with fake adapters, and add tests around the core orchestration before connecting real audio, cloud APIs, Home Assistant, or printer hardware.
