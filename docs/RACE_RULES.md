# Shared classroom race rules

- The course is 6,000 metres. The server owns timing, distance and the winner.
- Horses remain stationary through the countdown and first question.
- Each question allows ten seconds and closes early once every player answers.
- Answers are locked on first tap. Record arrival time, but do not apply any speed or streak change while the question remains open.
- At the closing instant, resolve all players together. Their movement up to that instant uses their previously earned speeds.
- Correct answer gain: `5 × (1 − response milliseconds / 10,000)` km/h, clamped to 0–5 km/h. Golden form earns the same gain.
- Wrong or missed answer: reduce earned target speed by position at the shared closing instant: first loses 60%, second 40%, third 30%, fourth/last 20%, with a 5 km/h cruising floor. Snapshot positions before applying any result. Tied distances share the same position and penalty; lane order never breaks a tie. In smaller fields the last rider loses 20%; in larger fields fourth and below lose 20%. The first round launches from zero toward this floor plus any correct-answer gain.
- Accelerate/brake linearly from the current actual speed to the new target over one second. If another round closes during this ramp, add gains to the earned target and start the new ramp from current actual speed.
- Display actual speed, not target speed. Integrate distance through the ramp exactly; do not jump position or award distance bonuses.
- Streaks resolve together with speeds: third correct charges slowly, fourth charges faster, fifth transforms, later streak/speed increases grow the visual aura. Wrong/missed answers clear the streak.
- The demo, server and client interpolation share the same rules and kinematics. Keep parity tests for early replies, deadlines, retries, reconnects and finish crossings.
