import IntelligenceChat from './IntelligenceChat'

interface Props {
  onActionExecuted?:
    () => void
}

export default function IntelligenceAssistant({
  onActionExecuted,
}: Props) {
  return (
    <IntelligenceChat
      onActionExecuted={
        onActionExecuted
      }
    />
  )
}