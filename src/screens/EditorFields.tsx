import Duration from '../components/Duration.tsx'
import StepList from '../components/StepList.tsx'
import Stepper from '../components/Stepper.tsx'
import Toggle from '../components/Toggle.tsx'
import { clock } from '../domain/format.ts'
import {
  canKeepLastRest,
  isOpenEnded,
  MAX_DURATION,
  MIN_DURATION,
  takesPrepare,
  type Setting,
  type Timer,
} from '../domain/timer.ts'

const MAX_SIDE = 1800

type Props = {
  draft: Timer
  patch: (changes: Partial<Timer>) => void
}

export default function EditorFields({ draft, patch }: Props) {
  const field = (key: Setting) => ({
    onChange: (value: number) => patch({ [key]: value } as Partial<Timer>),
  })

  return (
    <>
      {takesPrepare(draft.kind) && (
        <Duration label="Préparation" value={draft.prepare} min={0} max={120} {...field('prepare')} />
      )}

      <Duration label="Échauffement" value={draft.warmup} min={0} max={MAX_SIDE} {...field('warmup')} />

      {draft.kind === 'intervals' && (
        <>
          <Duration label="Effort" value={draft.work} min={MIN_DURATION} max={MAX_DURATION} {...field('work')} />
          <Duration label="Repos" value={draft.rest} min={0} max={MAX_DURATION} {...field('rest')} />
          <Stepper label="Séries" value={draft.rounds} min={1} max={60} {...field('rounds')} />
        </>
      )}

      {draft.kind === 'tabata' && (
        <Stepper label="Cycles" value={draft.rounds} min={1} max={60} {...field('rounds')} />
      )}

      {'steps' in draft && (
        <>
          <StepList steps={draft.steps} kind={draft.kind} onChange={(steps) => patch({ steps })} />
          <Duration label="Repos" value={draft.rest} min={0} max={600} {...field('rest')} />
          <Stepper label="Tours" value={draft.rounds} min={1} max={60} {...field('rounds')} />
        </>
      )}

      {'period' in draft && (
        <>
          <Duration label="Période" value={draft.period} min={MIN_DURATION} max={600} {...field('period')} />
          <Stepper label="Rounds" value={draft.rounds} min={1} max={60} {...field('rounds')} />
        </>
      )}

      {'duration' in draft && (
        <Duration label="Durée" value={draft.duration} min={MIN_DURATION} max={7200} {...field('duration')} />
      )}

      {'cap' in draft && (
        <Duration
          label="Temps limite"
          value={draft.cap}
          min={0}
          max={7200}
          format={(value) => (value > 0 ? clock(value) : 'Aucun')}
          {...field('cap')}
        />
      )}

      {'blocks' in draft && (
        <>
          {canKeepLastRest(draft) && (
            <Toggle
              label="Garder le dernier repos"
              value={draft.keepLastRest}
              onChange={(keepLastRest) => patch({ keepLastRest })}
            />
          )}
          <Stepper label="Blocs" value={draft.blocks} min={1} max={10} {...field('blocks')} />
          {draft.blocks > 1 && (
            <Duration
              label="Repos de bloc"
              value={draft.blockRest}
              min={0}
              max={600}
              {...field('blockRest')}
            />
          )}
        </>
      )}

      {/* nothing can follow a segment the athlete closes by hand, the field would set a dead value */}
      {!isOpenEnded(draft) && (
        <Duration
          label="Retour au calme"
          value={draft.cooldown}
          min={0}
          max={MAX_SIDE}
          {...field('cooldown')}
        />
      )}
    </>
  )
}
