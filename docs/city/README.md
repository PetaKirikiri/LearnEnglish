# Classroom city

TV: `/english/city`. Phone: `/english/city/controller?room=123456`.
Run `npm run dev -- --host 0.0.0.0 --port 5186 --strictPort`, open the city, then scan its QR from phones on the same Wi-Fi. The room code and LAN address are generated on the teacher's computer. The TV offers a keyboard player for trying the map without a phone.

## Teaching loop

Teacher chooses one of eight known destinations. Students ask “Where is the …?” and guide one another aloud using up, down, left, right, stop and okay. The controller's Ask button repeats the question as a speech bubble; Stop halts that player's movement; Here checks proximity to the requested entrance. No automated route, location marker, competitive score or harder sentence pattern is supplied.

## Implementation

- `src/city/world.ts`: coordinate system, authored ground collision rectangles and door positions matching the artwork.
- `server/cityRoom.ts`: authoritative positions, sequenced movement acknowledgements, bounded movement, teacher-only controls, destination check, 450ms input timeout, 16-player capacity.
- `server/cityPlugin.ts`: same-origin WebSocket endpoint mounted by Vite; state snapshots 15Hz, simulation 30Hz. Separate from the race protocol and cloud scoring. Credentials are per room and never in snapshots or QR links. Room codes permit guest joining. A resumed token replaces the previous connection. Rooms expire after 8 hours.
- `src/city/CityCanvas.tsx`: fitted map and interpolated characters, name labels, speaking and arrival states.
- `src/city/CityPage.tsx`: host and mobile controller, QR joining, pointer capture, blur/release safeguards and keyboard support.

Local LAN rooms live in the Vite server and end on its restart. The hosted version uses the Mumbai Realtime transport below, with the TV as simulation host. Physical phone/browser testing on the classroom network remains useful for checking real Wi-Fi conditions.

## Artwork

Built-in image generation created `public/city/town.png` and `public/city/players.png`, from the approved city concept. The original reference assets remain unchanged. A design record is in `asset-prompts.md`.

Map coordinates refer to the 1672×941 composition. The player atlas uses four equal columns (red, purple, blue, yellow) and four rows (front, back, side walk A, side walk B). Additional players reuse characters with different name/ring combinations. Walking uses the available atlas frames; this is not a full eight-direction animation set.

## Validation

`npx vitest run server/cityRoom.test.ts server/cityPlugin.test.ts`

Tests cover speed bounds, diagonal normalisation, collision/tunnelling, disconnection stops, arrival conditions, host permissions, capacity, reachable entrances and spawn points; real socket tests cover independent host/player clients, broadcasting, target changes and reconnecting without duplication.

## Phone prediction and close-up view

The landscape controller uses the same `CityCanvas` renderer as the TV, with a camera cropped around the local player. Joystick and action buttons float over the map; no full-map preview, destination marker or route guide is shown.

`CityPrediction` advances locally on the next animation frame using the shared `movePlayer` collision/speed function. Commands carry monotonic sequences and bounded durations, travel in batches approximately every 100ms, and receive `inputAck` in authoritative player snapshots. The phone restores the acknowledged position, replays only pending commands, and eases small visual corrections. The host validates packets, limits movement to elapsed wall time with a bounded jitter allowance, ignores duplicate sequences and does not integrate command-driven players twice. Legacy keyboard players retain host-ticked motion.

Release/Stop/Here flush a zero movement command. Pause, portrait rotation, hidden pages, disconnect and stale snapshots stop prediction. Arrival and destination changes remain host-authoritative. The 150ms round-trip simulation is a deterministic test, not a physical-phone latency measurement. The hosted transport below routes these messages through Mumbai.

Validation also includes `npx vitest run src/city/prediction.test.ts` for immediate movement, delayed acknowledgements, turning/release, collision parity, pause, reconnect sequences, duplicate packets and rate limits.

## Hosted city transport

Production `/api/city/config` selects the Mumbai Supabase Realtime transport; the Vite plugin continues to provide direct LAN WebSockets. The phone predicts movement with the same `CitySimulation` collision rules used by the teacher. Input and acknowledgements travel directly through Realtime; Vercel only creates/resumes rooms and stores periodic recovery checkpoints.

The TV owns simulation and sends ten snapshots per second. Each player has a separate input topic, avoiding broadcasting every controller input to every other phone. A two-second roster/checkpoint sync survives page refresh. Room capabilities expire after eight hours. A replacement teacher connection claims a new lease and stops the previous host.

`english_city_rooms` is service-only with RLS and no anon/authenticated grants. Room channels carry AES-GCM encrypted messages, signed with each participant's P-256 identity. Only registered player signatures can move that player; only the teacher's signature can supply shared state. Replay sequences, bounded input time and shared collisions prevent duplicates or forged speed. Keys stay in the controller's tab session; the Supabase service key is server-only.

Release configuration: `CITY_SUPABASE_SERVICE_KEY` is a sensitive Vercel production variable. `CITY_SUPABASE_URL` and `CITY_SUPABASE_ANON_KEY` can override the existing Mumbai `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Apply only migration `20261028120000_city_rooms.sql` to that project. Do not push the repository's unrelated pending migrations.

Verified: 23 focused tests cover room authority/capacity/expiration, cryptographic identity and replay handling, prediction, delayed packets and the LAN WebSocket loop. The real Mumbai transport also passed two-controller movement, pause, controller refresh, teacher checkpoint recovery and player removal.
