import { useEffect, useRef } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import BackLink from '../components/BackLink.tsx'
import Button from '../components/Button.tsx'
import ProgressRing from '../components/ProgressRing.tsx'
import RoundDots from '../components/RoundDots.tsx'
import { clock, clockTenths, plural, splits } from '../domain/format.ts'
import { newId } from '../domain/id.ts'
import type { Timer } from '../domain/timer.ts'
import { releaseAudio } from '../engine/cues.ts'
import { useRunner } from '../engine/useRunner.ts'
import { useWakeLock } from '../engine/useWakeLock.ts'
import { useHistory } from '../store/history.ts'
import { useSettings } from '../store/settings.ts'
import { useTimer } from '../store/timers.ts'
import styles from './Run.module.css'

// below this a session is a mistap, not something worth keeping in the history
const MIN_SESSION_MS = 2000

export default function Run() {
  const { id } = useParams()
  const timer = useTimer(id)
  if (!timer) return <Navigate to="/" replace />
  // remount when the route moves to another timer, the runner holds the session state
  return <Session key={timer.id} timer={timer} />
}

function Session({ timer }: { timer: Timer }) {
  const ringInSilentMode = useSettings((state) => state.ringInSilentMode)
  const runner = useRunner(timer, ringInSilentMode)
  const navigate = useNavigate()
  const addSession = useHistory((state) => state.add)
  const startedAt = useRef<string | null>(null)
  const saved = useRef(false)

  useWakeLock(runner.status === 'running')

  // keeping the audio hardware awake between sessions costs battery for nothing
  useEffect(() => releaseAudio, [])

  // the runner's values are already final on the render where the status flips to done,
  // so watching the status alone avoids re-running this on every frame
  useEffect(() => {
    if (runner.status !== 'done' || saved.current) return
    saved.current = true
    if (runner.sessionMs < MIN_SESSION_MS) return
    addSession({
      id: newId(),
      timerId: timer.id,
      name: timer.name,
      kind: timer.kind,
      startedAt: startedAt.current ?? new Date().toISOString(),
      elapsedMs: runner.sessionMs,
      roundsDone: runner.round,
      laps: runner.laps,
      completed: runner.completed,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runner.status])

  const onStart = () => {
    startedAt.current = new Date().toISOString()
    saved.current = false
    runner.start()
  }

  const counting = runner.segment?.duration === null
  const urgent = runner.status === 'running' && !counting && runner.segmentRemainingMs <= 3000
  // the digits already carry the accent in the last seconds, the ring keeps its progress in muted
  const tone = runner.segment?.kind === 'work' && !urgent ? 'accent' : 'calm'
  const totalLeft = Math.max(0, runner.totalMs - runner.elapsedMs)

  return (
    <div className={`screen ${styles.screen}`}>
      <header className={styles.head}>
        {runner.status === 'idle' || runner.status === 'done' ? (
          <BackLink to="/" label="Mes chronos" />
        ) : (
          <span className={styles.name}>{timer.name}</span>
        )}
        {runner.rounds > 1 && runner.status !== 'done' && (
          <span className="subtle digits">
            Round {Math.max(1, runner.round)} / {runner.rounds}
          </span>
        )}
      </header>

      {runner.status === 'done' ? (
        <div className={styles.stage}>
          <div className={styles.summary}>
            <span className={styles.phase}>
              {runner.completed ? 'Séance terminée' : 'Séance arrêtée'}
            </span>
            <span className={`${styles.summaryTime} digits`}>{clock(runner.sessionMs / 1000)}</span>
            {runner.rounds > 0 && (
              <span className="subtle">
                {plural(runner.round, 'round')} sur {runner.rounds}
              </span>
            )}
          </div>
          {runner.laps.length > 0 && <Laps laps={runner.laps} />}
        </div>
      ) : (
        <div className={styles.stage}>
          <ProgressRing progress={runner.segmentProgress} tone={tone}>
            <span className={styles.phase}>{runner.segment?.label ?? 'Chrono'}</span>
            <span className={`${styles.time} digits ${urgent ? styles.urgent : ''}`}>
              {counting
                ? clockTenths(runner.sessionMs)
                : clock(Math.ceil(runner.segmentRemainingMs / 1000))}
            </span>
            {!runner.openEnded && (
              <span className="subtle digits">{clock(Math.ceil(totalLeft / 1000))} au total</span>
            )}
          </ProgressRing>

          <div className={styles.under}>
            <RoundDots round={runner.round} rounds={runner.rounds} />
            {runner.nextSegment && (
              <div className={styles.nextUp}>
                <span className={styles.nextTag}>Next</span>
                <span className={styles.nextPhase}>
                  {runner.nextSegment.label}
                  {runner.nextSegment.duration !== null && (
                    <span className={`digits ${styles.nextTime}`}>{clock(runner.nextSegment.duration)}</span>
                  )}
                </span>
              </div>
            )}
            {runner.laps.length > 0 && (
              <span className="subtle digits">Dernier tour {clockTenths(lastSplit(runner.laps))}</span>
            )}
          </div>
        </div>
      )}

      <div className={styles.controls}>
        {runner.status === 'idle' && (
          <Button variant="accent" block onClick={onStart}>
            Démarrer
          </Button>
        )}

        {runner.status === 'running' && (
          <>
            {counting && (
              <Button variant="accent" block onClick={runner.lap}>
                Tour
              </Button>
            )}
            <div className={styles.pair}>
              <Button onClick={runner.pause}>Pause</Button>
              <Button onClick={runner.stop}>Arrêter</Button>
            </div>
          </>
        )}

        {runner.status === 'paused' && (
          <div className={styles.pair}>
            <Button variant="accent" onClick={runner.resume}>
              Reprendre
            </Button>
            <Button onClick={runner.stop}>Arrêter</Button>
          </div>
        )}

        {runner.status === 'done' && (
          <div className={styles.pair}>
            <Button variant="accent" onClick={onStart}>
              Recommencer
            </Button>
            <Button onClick={() => navigate('/')}>Terminer</Button>
          </div>
        )}
      </div>
    </div>
  )
}

function Laps({ laps }: { laps: number[] }) {
  return (
    <div className={styles.scroller}>
      <ol className={styles.laps}>
        {splits(laps).map((split, index) => (
          <li key={index} className={styles.lap}>
            <span className={styles.lapIndex}>Tour {index + 1}</span>
            <span className="digits">{clockTenths(split)}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function lastSplit(laps: number[]): number {
  return splits(laps).at(-1) ?? 0
}
