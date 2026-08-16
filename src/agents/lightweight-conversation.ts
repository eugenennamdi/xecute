export function lightweightConversationAnswer(prompt: string) {
  const normalized = prompt
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  if (/^(hi|hello|hey|hiya|hello there|hey there|good morning|good afternoon|good evening)( xecute)?$/.test(normalized)) {
    return "Hi. What would you like to do on X Layer?"
  }

  if (/^(thanks|thank you|thanks a lot|thank you so much|thx|appreciate it)( xecute)?$/.test(normalized)) {
    return "You’re welcome. What should we look at next?"
  }

  if (/^(how are you|how's it going|hows it going)( xecute)?$/.test(normalized)) {
    return "I’m ready. What would you like to explore or execute on X Layer?"
  }

  if (/^(who are you|what are you|what can you do)( xecute)?$/.test(normalized)) {
    return "I’m Xecute, an onchain assistant for X Layer. I can research the ecosystem, compare yield, analyze market scenarios and wallet risk, and prepare trades for your confirmation."
  }

  return null
}
