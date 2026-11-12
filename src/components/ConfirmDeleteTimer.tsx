import Confirm from './Confirm.tsx'

type Props = { name: string; onConfirm: () => void; onCancel: () => void }

export default function ConfirmDeleteTimer({ name, onConfirm, onCancel }: Props) {
  return (
    <Confirm
      title={`Supprimer ${name} ?`}
      detail="Les séances déjà enregistrées restent dans l’historique."
      confirmLabel="Supprimer"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}
