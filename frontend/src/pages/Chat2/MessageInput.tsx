



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
    <div className='flex-1 bg-pacova-pink'>
        <input value={draft} type="text" disabled={disabled}
        onChange={(e) => onDraftChange(e.target.value)}
        placeholder="Type a message..."
        onKeyDown={(e) => {
        if (e.key === 'Enter') 
            {onSend();}
        }}/>
        <button onClick={onSend} disabled={disabled}>Send</button>
        </div>
  )
}