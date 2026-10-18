import { Input } from '../../components/ui/Input';
import PixelButton from '../../components/ui/PixelButton';
import { NO_GLOW } from './constants';



interface MessageInputProps
{
  draft: string; //the text currently typed in the input
  onDraftChange: ((value: string) => void);
  onSend: (() => void);
  disabled: boolean; //whether the input and button should be disabled
}


export default function MessageInput({draft, onDraftChange, onSend, disabled}: MessageInputProps)
{
  return (
    <div className="h-[76px] px-4 flex items-center gap-3 border-t-2 border-pacova-green-dark">
        <Input 
        className={`w-full !border-pacova-pink !bg-[#080B1A] !text-white placeholder:!text-white/50 !text-lg sm:!text-xl !py-3 disabled:opacity-40 ${NO_GLOW} focus:!shadow-none focus:[box-shadow:none!important]`} 
        value={draft} 
        type="text" 
        disabled={disabled}
        onChange={(e) => onDraftChange(e.target.value)}
        placeholder={disabled ? "You cannot message this user" : "Type a message..."}
        onKeyDown={(e) => {
        if (e.key === 'Enter') 
            {onSend();}
        }}/>


        <PixelButton
        type="button"
        variant="outline-green"
        size="lg"
        className={NO_GLOW}
        onClick={onSend}
        disabled={disabled}>

          <span className="inline-flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden="true">
            <path d="M21.7 3.3a1 1 0 0 0-1.03-.24l-18 6a1 1 0 0 0 .08 1.92l7.26 1.82 1.82 7.26a1 1 0 0 0 .91.76h.06a1 1 0 0 0 .9-.57l6-18a1 1 0 0 0 0-1.95ZM4.6 10.1l12.1-4.03-6.04 6.04L4.6 10.1Zm7.96 7.96-1.04-4.16 6.04-6.04-5 10.2Z" />
          </svg>
          Send
          </span>
        </PixelButton>
        </div>
  )
}